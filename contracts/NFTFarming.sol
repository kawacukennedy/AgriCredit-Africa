// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract NFTFarming is ERC721, Ownable {
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
    }

    Counters.Counter private _tokenIdCounter;
    mapping(uint256 => FarmNFT) public farmNFTs;
    mapping(address => uint256[]) public farmerNFTs;

    // Events
    event FarmNFTMinted(uint256 indexed tokenId, address indexed farmer, string farmName);
    event FarmNFTHarvested(uint256 indexed tokenId, uint256 actualYield);
    event FarmNFTTransferred(uint256 indexed tokenId, address indexed from, address indexed to);

    constructor() ERC721("AgriCredit Farm NFT", "FARM") Ownable(msg.sender) {}

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
        string memory metadataURI
    ) external onlyOwner returns (uint256) {
        _tokenIdCounter.increment();
        uint256 tokenId = _tokenIdCounter.current();

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
            isActive: true
        });

        farmerNFTs[farmer].push(tokenId);
        _mint(farmer, tokenId);

        emit FarmNFTMinted(tokenId, farmer, farmName);
        return tokenId;
    }

    /**
     * @dev Record harvest data for a farm NFT
     * @param tokenId Token ID
     * @param actualYield Actual harvested yield
     */
    function recordHarvest(uint256 tokenId, uint256 actualYield) external {
        require(ownerOf(tokenId) == msg.sender || msg.sender == owner(), "Not authorized");
        require(farmNFTs[tokenId].isActive, "Farm NFT not active");

        FarmNFT storage farm = farmNFTs[tokenId];
        farm.harvestDate = block.timestamp;
        farm.expectedYield = actualYield; // Update with actual yield
        farm.isActive = false; // Mark as harvested

        emit FarmNFTHarvested(tokenId, actualYield);
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