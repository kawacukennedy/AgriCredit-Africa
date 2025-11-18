// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "./DecentralizedOracle.sol";
import "./AIPredictor.sol";

contract DynamicNFT is ERC721, Ownable {
    using Counters for Counters.Counter;
    using Strings for uint256;

    struct NFTAttributes {
        uint256 level; // 1-100
        uint256 experience; // Accumulated farming experience
        uint256 health; // 0-100 (crop health)
        uint256 yield; // Current yield prediction
        uint256 rarity; // 1-5 (common to legendary)
        string currentStage; // "seedling", "growing", "mature", "harvesting"
        uint256 lastUpdate;
        mapping(string => uint256) traits; // Dynamic traits
    }

    struct EvolutionCriteria {
        uint256 minExperience;
        uint256 minHealth;
        uint256 minYield;
        string requiredStage;
        uint256 timeRequirement; // Days since creation
    }

    // NFT data
    Counters.Counter private _tokenIdCounter;
    mapping(uint256 => NFTAttributes) public nftAttributes;
    mapping(uint256 => string) private _tokenURIs;
    mapping(uint256 => EvolutionCriteria) public evolutionCriteria;

    // Oracle and AI integration
    DecentralizedOracle public oracle;
    AIPredictor public aiPredictor;

    // Evolution parameters
    uint256 public evolutionCooldown = 7 days;
    uint256 public maxLevel = 100;
    uint256 public experiencePerYield = 10; // XP gained per ton of yield
    uint256 public healthDecayRate = 1; // Health points lost per day without care

    // Events
    event NFTEvolved(uint256 indexed tokenId, uint256 newLevel, string newStage);
    event NFTAttributesUpdated(uint256 indexed tokenId, uint256 health, uint256 yield);
    event NFTExperienceGained(uint256 indexed tokenId, uint256 experience, string source);

    constructor(address _oracle, address _aiPredictor)
        ERC721("AgriCredit Dynamic Farm NFT", "DFARM")
        Ownable(msg.sender)
    {
        oracle = DecentralizedOracle(_oracle);
        aiPredictor = AIPredictor(_aiPredictor);
    }

    // ============ NFT MINTING ============

    function mintDynamicNFT(
        address to,
        string memory baseURI,
        uint256 initialYield,
        string memory cropType
    ) external returns (uint256) {
        _tokenIdCounter.increment();
        uint256 tokenId = _tokenIdCounter.current();

        _mint(to, tokenId);
        _setTokenURI(tokenId, baseURI);

        // Initialize NFT attributes
        NFTAttributes storage attributes = nftAttributes[tokenId];
        attributes.level = 1;
        attributes.experience = 0;
        attributes.health = 100;
        attributes.yield = initialYield;
        attributes.rarity = _calculateInitialRarity(initialYield);
        attributes.currentStage = "seedling";
        attributes.lastUpdate = block.timestamp;

        // Set initial traits
        attributes.traits["cropType"] = _stringToUint(cropType);
        attributes.traits["plantingDate"] = block.timestamp;
        attributes.traits["waterLevel"] = 75; // Initial water level
        attributes.traits["soilQuality"] = 80; // Initial soil quality

        // Set evolution criteria
        evolutionCriteria[tokenId] = EvolutionCriteria({
            minExperience: 100,
            minHealth: 70,
            minYield: initialYield,
            requiredStage: "growing",
            timeRequirement: 30 days
        });

        return tokenId;
    }

    // ============ DYNAMIC ATTRIBUTE UPDATES ============

    function updateNFTAttributes(uint256 tokenId) external {
        require(_exists(tokenId), "NFT does not exist");

        NFTAttributes storage attributes = nftAttributes[tokenId];
        require(block.timestamp >= attributes.lastUpdate + 1 hours, "Update too frequent");

        // Get real-time data from oracle
        (uint256 weatherData, , uint256 weatherTimestamp) = oracle.getLatestData(
            DecentralizedOracle.DataType.Weather,
            "farm_location", // Would be NFT-specific
            "nft_update"
        );

        (uint256 iotData, , uint256 iotTimestamp) = oracle.getLatestData(
            DecentralizedOracle.DataType.IoT,
            "farm_sensors",
            "nft_update"
        );

        // Calculate health impact from weather
        int256 healthChange = _calculateWeatherHealthImpact(weatherData);
        attributes.health = _clamp(attributes.health + uint256(healthChange), 0, 100);

        // Update yield prediction using AI
        uint256 farmSize = attributes.traits["farmSize"];
        string memory cropType = _uintToString(attributes.traits["cropType"]);

        // Call AI predictor for yield prediction
        try aiPredictor.predictYield(farmSize, cropType, "farm_location", attributes.traits["plantingDate"]) returns (uint256) {
            // Prediction successful, yield updated via oracle callback
        } catch {
            // Fallback to simple calculation
            attributes.yield = _calculateYieldPrediction(attributes, weatherData, iotData);
        }

        // Update traits based on sensor data
        _updateTraitsFromSensors(attributes, iotData);

        // Check for evolution
        _checkEvolution(tokenId);

        attributes.lastUpdate = block.timestamp;

        emit NFTAttributesUpdated(tokenId, attributes.health, attributes.yield);
    }

    function recordYield(uint256 tokenId, uint256 actualYield) external {
        require(ownerOf(tokenId) == msg.sender, "Not the owner");

        NFTAttributes storage attributes = nftAttributes[tokenId];

        // Gain experience from yield
        uint256 experienceGained = actualYield * experiencePerYield;
        attributes.experience += experienceGained;

        // Update yield attribute
        attributes.yield = actualYield;

        // Health bonus for successful harvest
        if (actualYield >= attributes.yield) {
            attributes.health = _clamp(attributes.health + 10, 0, 100);
        }

        emit NFTExperienceGained(tokenId, experienceGained, "yield_harvest");

        // Check for evolution
        _checkEvolution(tokenId);
    }

    // ============ EVOLUTION SYSTEM ============

    function evolveNFT(uint256 tokenId) external {
        require(ownerOf(tokenId) == msg.sender, "Not the owner");

        NFTAttributes storage attributes = nftAttributes[tokenId];
        EvolutionCriteria memory criteria = evolutionCriteria[tokenId];

        require(attributes.level < maxLevel, "Max level reached");
        require(block.timestamp >= attributes.lastUpdate + evolutionCooldown, "Evolution cooldown active");
        require(attributes.experience >= criteria.minExperience, "Insufficient experience");
        require(attributes.health >= criteria.minHealth, "Insufficient health");
        require(attributes.yield >= criteria.minYield, "Insufficient yield");
        require(keccak256(abi.encodePacked(attributes.currentStage)) == keccak256(abi.encodePacked(criteria.requiredStage)), "Wrong stage");
        require(block.timestamp >= attributes.traits["plantingDate"] + criteria.timeRequirement, "Time requirement not met");

        // Evolve the NFT
        attributes.level++;
        attributes.currentStage = _getNextStage(attributes.currentStage);

        // Update evolution criteria for next level
        _updateEvolutionCriteria(tokenId);

        // Rarity upgrade chance
        if (_random() % 100 < 10) { // 10% chance
            attributes.rarity = _clamp(attributes.rarity + 1, 1, 5);
        }

        emit NFTEvolved(tokenId, attributes.level, attributes.currentStage);
    }

    function _checkEvolution(uint256 tokenId) internal {
        NFTAttributes storage attributes = nftAttributes[tokenId];
        EvolutionCriteria memory criteria = evolutionCriteria[tokenId];

        if (attributes.experience >= criteria.minExperience &&
            attributes.health >= criteria.minHealth &&
            attributes.yield >= criteria.minYield &&
            keccak256(abi.encodePacked(attributes.currentStage)) == keccak256(abi.encodePacked(criteria.requiredStage)) &&
            block.timestamp >= attributes.traits["plantingDate"] + criteria.timeRequirement) {

            // Auto-evolve if all conditions met
            attributes.level++;
            attributes.currentStage = _getNextStage(attributes.currentStage);
            _updateEvolutionCriteria(tokenId);

            emit NFTEvolved(tokenId, attributes.level, attributes.currentStage);
        }
    }

    function _updateEvolutionCriteria(uint256 tokenId) internal {
        NFTAttributes storage attributes = nftAttributes[tokenId];
        EvolutionCriteria storage criteria = evolutionCriteria[tokenId];

        uint256 level = attributes.level;

        criteria.minExperience = level * 100;
        criteria.minHealth = 60 + (level * 2); // Increases with level
        criteria.minYield = attributes.yield * (100 + level) / 100; // 1% increase per level
        criteria.requiredStage = _getNextStage(attributes.currentStage);
        criteria.timeRequirement = 30 days + (level * 1 days); // Longer time requirements
    }

    // ============ ATTRIBUTE CALCULATIONS ============

    function _calculateWeatherHealthImpact(uint256 weatherData) internal pure returns (int256) {
        // Simplified weather impact calculation
        // weatherData represents various weather conditions

        if (weatherData < 25) return -5; // Drought
        if (weatherData < 50) return -2; // Dry conditions
        if (weatherData < 75) return 0;  // Normal conditions
        if (weatherData < 90) return 2;  // Good rain
        return 5; // Excellent conditions
    }

    function _calculateYieldPrediction(
        NFTAttributes storage attributes,
        uint256 weatherData,
        uint256 iotData
    ) internal view returns (uint256) {
        uint256 baseYield = attributes.yield;
        uint256 healthBonus = (attributes.health * 20) / 100; // Up to 20% bonus
        uint256 weatherMultiplier = 80 + (weatherData % 40); // 80-120% based on weather
        uint256 sensorBonus = (iotData % 20); // Up to 20% from sensors

        return baseYield * (100 + healthBonus + sensorBonus) * weatherMultiplier / 10000;
    }

    function _updateTraitsFromSensors(NFTAttributes storage attributes, uint256 iotData) internal {
        // Update traits based on IoT sensor data
        attributes.traits["waterLevel"] = _clamp(attributes.traits["waterLevel"] + (iotData % 10) - 5, 0, 100);
        attributes.traits["soilQuality"] = _clamp(attributes.traits["soilQuality"] + (iotData % 5) - 2, 0, 100);
        attributes.traits["pestLevel"] = iotData % 50; // 0-50 pest level
        attributes.traits["lastSensorUpdate"] = block.timestamp;
    }

    // ============ UTILITY FUNCTIONS ============

    function _calculateInitialRarity(uint256 initialYield) internal pure returns (uint256) {
        if (initialYield >= 20) return 5; // Legendary
        if (initialYield >= 15) return 4; // Epic
        if (initialYield >= 10) return 3; // Rare
        if (initialYield >= 5) return 2;  // Uncommon
        return 1; // Common
    }

    function _getNextStage(string memory currentStage) internal pure returns (string memory) {
        if (keccak256(abi.encodePacked(currentStage)) == keccak256(abi.encodePacked("seedling"))) return "growing";
        if (keccak256(abi.encodePacked(currentStage)) == keccak256(abi.encodePacked("growing"))) return "mature";
        if (keccak256(abi.encodePacked(currentStage)) == keccak256(abi.encodePacked("mature"))) return "harvesting";
        if (keccak256(abi.encodePacked(currentStage)) == keccak256(abi.encodePacked("harvesting"))) return "seedling";
        return "seedling";
    }

    function _clamp(uint256 value, uint256 min, uint256 max) internal pure returns (uint256) {
        if (value < min) return min;
        if (value > max) return max;
        return value;
    }

    function _random() internal view returns (uint256) {
        return uint256(keccak256(abi.encodePacked(block.timestamp, block.difficulty, msg.sender)));
    }

    function _stringToUint(string memory s) internal pure returns (uint256) {
        return uint256(keccak256(abi.encodePacked(s)));
    }

    function _uintToString(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }

    // ============ VIEW FUNCTIONS ============

    function getNFTAttributes(uint256 tokenId) external view returns (
        uint256 level,
        uint256 experience,
        uint256 health,
        uint256 yield,
        uint256 rarity,
        string memory currentStage,
        uint256 lastUpdate
    ) {
        NFTAttributes storage attributes = nftAttributes[tokenId];
        return (
            attributes.level,
            attributes.experience,
            attributes.health,
            attributes.yield,
            attributes.rarity,
            attributes.currentStage,
            attributes.lastUpdate
        );
    }

    function getNFTTrait(uint256 tokenId, string memory traitName) external view returns (uint256) {
        return nftAttributes[tokenId].traits[traitName];
    }

    function getEvolutionCriteria(uint256 tokenId) external view returns (EvolutionCriteria memory) {
        return evolutionCriteria[tokenId];
    }

    function canEvolve(uint256 tokenId) external view returns (bool) {
        NFTAttributes storage attributes = nftAttributes[tokenId];
        EvolutionCriteria memory criteria = evolutionCriteria[tokenId];

        return (
            attributes.level < maxLevel &&
            block.timestamp >= attributes.lastUpdate + evolutionCooldown &&
            attributes.experience >= criteria.minExperience &&
            attributes.health >= criteria.minHealth &&
            attributes.yield >= criteria.minYield &&
            keccak256(abi.encodePacked(attributes.currentStage)) == keccak256(abi.encodePacked(criteria.requiredStage)) &&
            block.timestamp >= attributes.traits["plantingDate"] + criteria.timeRequirement
        );
    }

    // ============ METADATA FUNCTIONS ============

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "ERC721Metadata: URI query for nonexistent token");

        NFTAttributes storage attributes = nftAttributes[tokenId];

        // Generate dynamic metadata based on current attributes
        string memory json = string(abi.encodePacked(
            '{"name": "Dynamic Farm NFT #', tokenId.toString(), '",',
            '"description": "A dynamic NFT that evolves based on real-world farming data",',
            '"image": "', _tokenURIs[tokenId], '",',
            '"attributes": [',
                '{"trait_type": "Level", "value": ', attributes.level.toString(), '},',
                '{"trait_type": "Experience", "value": ', attributes.experience.toString(), '},',
                '{"trait_type": "Health", "value": ', attributes.health.toString(), '},',
                '{"trait_type": "Yield", "value": ', attributes.yield.toString(), '},',
                '{"trait_type": "Rarity", "value": ', _getRarityName(attributes.rarity), '},',
                '{"trait_type": "Stage", "value": "', attributes.currentStage, '"},',
                '{"trait_type": "Last Update", "value": ', attributes.lastUpdate.toString(), '}',
            ']}'
        ));

        return string(abi.encodePacked("data:application/json;base64,", _base64Encode(bytes(json))));
    }

    function _getRarityName(uint256 rarity) internal pure returns (string memory) {
        if (rarity == 1) return "Common";
        if (rarity == 2) return "Uncommon";
        if (rarity == 3) return "Rare";
        if (rarity == 4) return "Epic";
        if (rarity == 5) return "Legendary";
        return "Unknown";
    }

    function _setTokenURI(uint256 tokenId, string memory _tokenURI) internal {
        require(_exists(tokenId), "ERC721URIStorage: URI set of nonexistent token");
        _tokenURIs[tokenId] = _tokenURI;
    }

    function _base64Encode(bytes memory data) internal pure returns (string memory) {
        // Simplified base64 encoding for demonstration
        // In production, use a proper base64 library
        return "BASE64_ENCODED_DATA";
    }

    // ============ ADMIN FUNCTIONS ============

    function updateEvolutionParameters(
        uint256 _evolutionCooldown,
        uint256 _maxLevel,
        uint256 _experiencePerYield,
        uint256 _healthDecayRate
    ) external onlyOwner {
        evolutionCooldown = _evolutionCooldown;
        maxLevel = _maxLevel;
        experiencePerYield = _experiencePerYield;
        healthDecayRate = _healthDecayRate;
    }

    function setEvolutionCriteria(
        uint256 tokenId,
        uint256 minExperience,
        uint256 minHealth,
        uint256 minYield,
        string memory requiredStage,
        uint256 timeRequirement
    ) external onlyOwner {
        evolutionCriteria[tokenId] = EvolutionCriteria({
            minExperience: minExperience,
            minHealth: minHealth,
            minYield: minYield,
            requiredStage: requiredStage,
            timeRequirement: timeRequirement
        });
    }
}