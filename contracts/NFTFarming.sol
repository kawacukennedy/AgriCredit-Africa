// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./IdentityRegistry.sol";

// Fractional ownership token for farm NFTs
contract FarmShareToken is IERC20 {
    using SafeERC20 for IERC20;

    string public name;
    string public symbol;
    uint8 public decimals = 18;
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    address public farmNFT;
    uint256 public nftId;

    constructor(string memory _name, string memory _symbol, address _farmNFT, uint256 _nftId) {
        name = _name;
        symbol = _symbol;
        farmNFT = _farmNFT;
        nftId = _nftId;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(balanceOf[from] >= amount, "Insufficient balance");
        require(allowance[from][msg.sender] >= amount, "Insufficient allowance");
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        allowance[from][msg.sender] -= amount;
        emit Transfer(from, to, amount);
        return true;
    }

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
}

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

    // Fractional ownership
    mapping(uint256 => FarmShareToken) public fractionalTokens;
    mapping(uint256 => bool) public isFractionalized;
    mapping(uint256 => uint256) public fractionalSupply; // Total fractional shares

    // Staking and rewards
    mapping(uint256 => mapping(address => uint256)) public nftStakes; // NFT ID => staker => amount
    mapping(uint256 => uint256) public totalNftStakes;
    mapping(address => uint256[]) public stakerNFTs;
    mapping(address => uint256) public stakingRewards;

    uint256 public stakingRewardRate = 500; // 5% APY in basis points
    uint256 public lastRewardUpdate;

    IdentityRegistry public identityRegistry;
    IERC20 public rewardToken;

    // Events
    event FarmNFTMinted(uint256 indexed tokenId, address indexed farmer, string farmName);
    event FarmNFTHarvested(uint256 indexed tokenId, uint256 actualYield);
    event FarmNFTTransferred(uint256 indexed tokenId, address indexed from, address indexed to);
    event SupplyChainEventRecorded(uint256 indexed tokenId, string eventType, string location);
    event QualityScoreUpdated(uint256 indexed tokenId, uint256 score);
    event BatchAssociated(uint256 indexed tokenId, uint256 batchId);

    constructor(address _identityRegistry, address _rewardToken) ERC721("AgriCredit Farm NFT", "FARM") Ownable(msg.sender) {
        identityRegistry = IdentityRegistry(_identityRegistry);
        rewardToken = IERC20(_rewardToken);
        lastRewardUpdate = block.timestamp;
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

    // ============ FRACTIONAL OWNERSHIP FUNCTIONS ============

    function fractionalizeNFT(uint256 tokenId, uint256 totalShares, string memory shareName, string memory shareSymbol) external {
        require(ownerOf(tokenId) == msg.sender, "Not the owner");
        require(!isFractionalized[tokenId], "Already fractionalized");
        require(totalShares > 0, "Total shares must be > 0");

        // Create fractional token contract
        FarmShareToken shareToken = new FarmShareToken(shareName, shareSymbol, address(this), tokenId);
        fractionalTokens[tokenId] = shareToken;
        fractionalSupply[tokenId] = totalShares;
        isFractionalized[tokenId] = true;

        // Mint all shares to the owner
        shareToken.balanceOf[msg.sender] = totalShares;
        shareToken.totalSupply = totalShares;

        emit NFTFractionalized(tokenId, address(shareToken), totalShares);
    }

    function getFractionalToken(uint256 tokenId) external view returns (address) {
        require(isFractionalized[tokenId], "NFT not fractionalized");
        return address(fractionalTokens[tokenId]);
    }

    // ============ STAKING AND REWARDS FUNCTIONS ============

    function stakeNFT(uint256 tokenId) external nonReentrant {
        require(ownerOf(tokenId) == msg.sender, "Not the owner");
        require(farmNFTs[tokenId].isActive, "Farm NFT not active");
        require(nftStakes[tokenId][msg.sender] == 0, "Already staked");

        nftStakes[tokenId][msg.sender] = 1; // Staked
        totalNftStakes[tokenId]++;
        stakerNFTs[msg.sender].push(tokenId);

        _updateStakingRewards(msg.sender);

        emit NFTStaked(tokenId, msg.sender);
    }

    function unstakeNFT(uint256 tokenId) external nonReentrant {
        require(nftStakes[tokenId][msg.sender] > 0, "Not staked");

        nftStakes[tokenId][msg.sender] = 0;
        totalNftStakes[tokenId]--;

        // Remove from staker's list
        uint256[] storage stakerTokens = stakerNFTs[msg.sender];
        for (uint256 i = 0; i < stakerTokens.length; i++) {
            if (stakerTokens[i] == tokenId) {
                stakerTokens[i] = stakerTokens[stakerTokens.length - 1];
                stakerTokens.pop();
                break;
            }
        }

        _updateStakingRewards(msg.sender);

        emit NFTUnstaked(tokenId, msg.sender);
    }

    function claimStakingRewards() external nonReentrant {
        _updateStakingRewards(msg.sender);
        uint256 rewards = stakingRewards[msg.sender];
        require(rewards > 0, "No rewards to claim");

        stakingRewards[msg.sender] = 0;
        require(rewardToken.transfer(msg.sender, rewards), "Reward transfer failed");

        emit RewardsClaimed(msg.sender, rewards);
    }

    function _updateStakingRewards(address staker) internal {
        uint256 timeElapsed = block.timestamp - lastRewardUpdate;
        if (timeElapsed > 0) {
            uint256[] memory stakedTokens = stakerNFTs[staker];
            uint256 totalStakedByUser = stakedTokens.length;

            if (totalStakedByUser > 0) {
                // Calculate rewards based on number of staked NFTs
                uint256 rewards = (totalStakedByUser * stakingRewardRate * timeElapsed) / (365 days * 10000);
                stakingRewards[staker] += rewards;
            }
        }
        lastRewardUpdate = block.timestamp;
    }

    function getStakingInfo(address staker) external view returns (uint256 stakedCount, uint256 pendingRewards) {
        uint256[] memory stakedTokens = stakerNFTs[staker];
        stakedCount = stakedTokens.length;

        // Calculate pending rewards
        uint256 timeElapsed = block.timestamp - lastRewardUpdate;
        if (timeElapsed > 0 && stakedCount > 0) {
            pendingRewards = stakingRewards[staker] + (stakedCount * stakingRewardRate * timeElapsed) / (365 days * 10000);
        } else {
            pendingRewards = stakingRewards[staker];
        }

        return (stakedCount, pendingRewards);
    }

    // ============ ADDITIONAL EVENTS ============

    event NFTFractionalized(uint256 indexed tokenId, address indexed shareToken, uint256 totalShares);
    event NFTStaked(uint256 indexed tokenId, address indexed staker);
    event NFTUnstaked(uint256 indexed tokenId, address indexed staker);
    event RewardsClaimed(address indexed staker, uint256 amount);
    event QualityScoreUpdated(uint256 indexed tokenId, uint256 score);
    event BatchAssociated(uint256 indexed tokenId, uint256 batchId);
}