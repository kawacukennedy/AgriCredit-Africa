// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./IdentityRegistry.sol";

contract NFTFarming is ERC721, Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;

    struct FarmNFT {
        uint256 id;
        address farmer;
        string farmName;
        string location; // Geo coordinates or description
        uint256 size; // in hectares
        string cropType;
        uint256 expectedYield; // in tons
        uint256 plantingDate;
        uint256 harvestDate;
        string metadataURI; // IPFS hash with farm details
        bool isActive;
        uint256 qualityScore; // AI-determined quality score
        string supplyChainData; // JSON string with supply chain tracking
        uint256[] batchIds; // Associated marketplace batches
    }

    struct SupplyChainEvent {
        uint256 timestamp;
        string eventType; // planting, fertilizing, harvesting, processing, shipping
        string location;
        string description;
        string proof; // IPFS hash of evidence (photos, sensor data)
        address recordedBy;
    }

    Counters.Counter private _tokenIdCounter;
    mapping(uint256 => FarmNFT) public farmNFTs;
    mapping(address => uint256[]) public farmerNFTs;
    mapping(uint256 => SupplyChainEvent[]) public supplyChainHistory;
    mapping(uint256 => uint256) public nftBatchCount;

    IdentityRegistry public identityRegistry;

    // Events
    event FarmNFTMinted(uint256 indexed tokenId, address indexed farmer, string farmName);
    event FarmNFTHarvested(uint256 indexed tokenId, uint256 actualYield);
    event FarmNFTTransferred(uint256 indexed tokenId, address indexed from, address indexed to);
    event SupplyChainEventRecorded(uint256 indexed tokenId, string eventType, string location);
    event QualityScoreUpdated(uint256 indexed tokenId, uint256 score);
    event BatchAssociated(uint256 indexed tokenId, uint256 batchId);

    constructor(address _identityRegistry) ERC721("AgriCredit Farm NFT", "FARM") Ownable(msg.sender) {
        identityRegistry = IdentityRegistry(_identityRegistry);
    }

    /**
     * @dev Mint a new Farm NFT representing future yield
     * @param farmer Farmer address
     * @param farmName Name of the farm
     * @param location Geographic location
     * @param size Farm size in hectares
     * @param cropType Type of crop
     * @param expectedYield Expected yield in tons
     * @param metadataURI IPFS URI with farm details
     */
    function mintFarmNFT(
        address farmer,
        string memory farmName,
        string memory location,
        uint256 size,
        string memory cropType,
        uint256 expectedYield,
        string memory metadataURI,
        string memory initialSupplyChainData
    ) external returns (uint256) {
        require(identityRegistry.isIdentityVerified(farmer), "Farmer not verified");
        require(msg.sender == farmer || msg.sender == owner(), "Not authorized");

        _tokenIdCounter.increment();
        uint256 tokenId = _tokenIdCounter.current();

        uint256[] memory emptyBatches;

        farmNFTs[tokenId] = FarmNFT({
            id: tokenId,
            farmer: farmer,
            farmName: farmName,
            location: location,
            size: size,
            cropType: cropType,
            expectedYield: expectedYield,
            plantingDate: block.timestamp,
            harvestDate: 0,
            metadataURI: metadataURI,
            isActive: true,
            qualityScore: 0, // To be updated by AI
            supplyChainData: initialSupplyChainData,
            batchIds: emptyBatches
        });

        farmerNFTs[farmer].push(tokenId);
        _mint(farmer, tokenId);

        // Record initial planting event
        _recordSupplyChainEvent(tokenId, "planting", location, "Crop planting initiated", "");

        emit FarmNFTMinted(tokenId, farmer, farmName);
        return tokenId;
    }

    function recordSupplyChainEvent(
        uint256 tokenId,
        string memory eventType,
        string memory location,
        string memory description,
        string memory proof
    ) external {
        require(ownerOf(tokenId) == msg.sender || msg.sender == owner(), "Not authorized");
        require(farmNFTs[tokenId].isActive, "Farm NFT not active");

        _recordSupplyChainEvent(tokenId, eventType, location, description, proof);
    }

    function _recordSupplyChainEvent(
        uint256 tokenId,
        string memory eventType,
        string memory location,
        string memory description,
        string memory proof
    ) internal {
        SupplyChainEvent memory eventData = SupplyChainEvent({
            timestamp: block.timestamp,
            eventType: eventType,
            location: location,
            description: description,
            proof: proof,
            recordedBy: msg.sender
        });

        supplyChainHistory[tokenId].push(eventData);

        emit SupplyChainEventRecorded(tokenId, eventType, location);
    }

    /**
     * @dev Record harvest data for a farm NFT
     * @param tokenId Token ID
     * @param actualYield Actual harvested yield
     */
    function recordHarvest(uint256 tokenId, uint256 actualYield, string memory harvestProof) external {
        require(ownerOf(tokenId) == msg.sender || msg.sender == owner(), "Not authorized");
        require(farmNFTs[tokenId].isActive, "Farm NFT not active");

        FarmNFT storage farm = farmNFTs[tokenId];
        farm.harvestDate = block.timestamp;
        farm.expectedYield = actualYield; // Update with actual yield
        farm.isActive = false; // Mark as harvested

        // Record harvest event
        _recordSupplyChainEvent(tokenId, "harvesting", farm.location, "Crop harvested", harvestProof);

        emit FarmNFTHarvested(tokenId, actualYield);
    }

    function updateQualityScore(uint256 tokenId, uint256 score) external onlyOwner {
        require(_exists(tokenId), "Farm NFT does not exist");
        require(score <= 100, "Score must be 0-100");

        farmNFTs[tokenId].qualityScore = score;

        emit QualityScoreUpdated(tokenId, score);
    }

    function associateBatch(uint256 tokenId, uint256 batchId) external {
        require(ownerOf(tokenId) == msg.sender || msg.sender == owner(), "Not authorized");

        FarmNFT storage farm = farmNFTs[tokenId];
        farm.batchIds.push(batchId);
        nftBatchCount[tokenId]++;

        emit BatchAssociated(tokenId, batchId);
    }

    /**
     * @dev Transfer farm NFT (overrides ERC721 transfer)
     */
    function transferFrom(address from, address to, uint256 tokenId) public override {
        super.transferFrom(from, to, tokenId);

        // Update farmer NFT lists
        _removeFromFarmerList(from, tokenId);
        farmerNFTs[to].push(tokenId);

        // Update farm ownership
        farmNFTs[tokenId].farmer = to;

        emit FarmNFTTransferred(tokenId, from, to);
    }

    /**
     * @dev Get farm NFT details
     * @param tokenId Token ID
     */
    function getFarmNFT(uint256 tokenId) external view returns (FarmNFT memory) {
        require(_exists(tokenId), "Farm NFT does not exist");
        return farmNFTs[tokenId];
    }

    /**
     * @dev Get all NFTs owned by a farmer
     * @param farmer Farmer address
     */
    function getFarmerNFTs(address farmer) external view returns (uint256[] memory) {
        return farmerNFTs[farmer];
    }

    function getSupplyChainHistory(uint256 tokenId) external view returns (SupplyChainEvent[] memory) {
        return supplyChainHistory[tokenId];
    }

    function getNFTBatches(uint256 tokenId) external view returns (uint256[] memory) {
        return farmNFTs[tokenId].batchIds;
    }

    function getNFTBatchCount(uint256 tokenId) external view returns (uint256) {
        return nftBatchCount[tokenId];
    }

    /**
     * @dev Get token URI for metadata
     * @param tokenId Token ID
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "Farm NFT does not exist");
        return farmNFTs[tokenId].metadataURI;
    }

    /**
     * @dev Internal function to remove token from farmer's list
     */
    function _removeFromFarmerList(address farmer, uint256 tokenId) internal {
        uint256[] storage farmerTokens = farmerNFTs[farmer];
        for (uint256 i = 0; i < farmerTokens.length; i++) {
            if (farmerTokens[i] == tokenId) {
                farmerTokens[i] = farmerTokens[farmerTokens.length - 1];
                farmerTokens.pop();
                break;
            }
        }
    }

    /**
     * @dev Get total supply of farm NFTs
     */
    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter.current();
    }
}