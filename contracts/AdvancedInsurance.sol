// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "./DecentralizedOracle.sol";
import "./ParametricInsurance.sol";

contract AdvancedInsurance is Ownable, ReentrancyGuard {
    using Math for uint256;

    struct CatastropheBond {
        uint256 id;
        string catastropheType; // "earthquake", "flood", "drought", "hurricane"
        string region;
        uint256 coverageAmount;
        uint256 premium;
        uint256 triggerThreshold; // Index value that triggers payout
        uint256 maturityDate;
        address issuer;
        address[] investors;
        mapping(address => uint256) investments;
        uint256 totalInvested;
        bool active;
        bool triggered;
        uint256 triggerIndex; // Actual index value when triggered
        uint256 payoutAmount;
    }

    struct ParametricOption {
        uint256 id;
        address buyer;
        string underlyingAsset; // "rainfall", "temperature", "crop_price"
        uint256 strikePrice;
        uint256 premium;
        uint256 notionalAmount;
        bool isCall; // true for call, false for put
        uint256 expirationDate;
        uint256 settlementDate;
        bool exercised;
        uint256 payoutAmount;
        bytes oracleData;
    }

    struct InsurancePool {
        uint256 id;
        string poolType; // "catastrophe", "yield_protection", "weather_derivative"
        uint256 totalCapacity;
        uint256 utilizedCapacity;
        uint256 premiumPool;
        uint256 payoutReserve;
        mapping(address => uint256) contributions;
        bool active;
    }

    // Catastrophe bonds
    mapping(uint256 => CatastropheBond) public catastropheBonds;
    uint256 public nextBondId = 1;

    // Parametric options
    mapping(uint256 => ParametricOption) public parametricOptions;
    uint256 public nextOptionId = 1;

    // Insurance pools
    mapping(uint256 => InsurancePool) public insurancePools;
    uint256 public nextPoolId = 1;

    // Oracle integration
    DecentralizedOracle public oracle;
    ParametricInsurance public parametricInsurance;

    // Risk parameters
    uint256 public maxCoverageRatio = 80; // 80% max coverage vs investment
    uint256 public minPremiumRate = 50; // 0.5% minimum premium
    uint256 public maxPremiumRate = 2000; // 20% maximum premium
    uint256 public settlementDelay = 7 days;

    // Events
    event CatastropheBondCreated(uint256 indexed bondId, string catastropheType, uint256 coverageAmount);
    event CatastropheBondInvested(uint256 indexed bondId, address indexed investor, uint256 amount);
    event CatastropheBondTriggered(uint256 indexed bondId, uint256 triggerIndex, uint256 payoutAmount);
    event ParametricOptionCreated(uint256 indexed optionId, address indexed buyer, string underlyingAsset);
    event ParametricOptionExercised(uint256 indexed optionId, uint256 payoutAmount);
    event InsurancePoolCreated(uint256 indexed poolId, string poolType, uint256 capacity);
    event PoolContribution(uint256 indexed poolId, address indexed contributor, uint256 amount);

    constructor(address _oracle, address _parametricInsurance) Ownable(msg.sender) {
        oracle = DecentralizedOracle(_oracle);
        parametricInsurance = ParametricInsurance(_parametricInsurance);
    }

    // ============ CATASTROPHE BONDS ============

    function createCatastropheBond(
        string memory _catastropheType,
        string memory _region,
        uint256 _coverageAmount,
        uint256 _premium,
        uint256 _triggerThreshold,
        uint256 _maturityDays
    ) external returns (uint256) {
        require(_coverageAmount > 0, "Invalid coverage amount");
        require(_premium >= (_coverageAmount * minPremiumRate) / 10000, "Premium too low");
        require(_premium <= (_coverageAmount * maxPremiumRate) / 10000, "Premium too high");
        require(_maturityDays >= 30 && _maturityDays <= 365, "Invalid maturity period");

        uint256 bondId = nextBondId++;

        CatastropheBond storage bond = catastropheBonds[bondId];
        bond.id = bondId;
        bond.catastropheType = _catastropheType;
        bond.region = _region;
        bond.coverageAmount = _coverageAmount;
        bond.premium = _premium;
        bond.triggerThreshold = _triggerThreshold;
        bond.maturityDate = block.timestamp + (_maturityDays * 1 days);
        bond.issuer = msg.sender;
        bond.active = true;
        bond.triggered = false;

        emit CatastropheBondCreated(bondId, _catastropheType, _coverageAmount);
        return bondId;
    }

    function investInCatastropheBond(uint256 _bondId, uint256 _amount) external payable nonReentrant {
        CatastropheBond storage bond = catastropheBonds[_bondId];
        require(bond.active, "Bond not active");
        require(block.timestamp < bond.maturityDate, "Bond matured");
        require(msg.value == _amount, "Incorrect investment amount");

        // Check coverage ratio
        uint256 maxInvestment = (bond.coverageAmount * maxCoverageRatio) / 100;
        require(bond.totalInvested + _amount <= maxInvestment, "Exceeds coverage ratio");

        if (bond.investments[msg.sender] == 0) {
            bond.investors.push(msg.sender);
        }
        bond.investments[msg.sender] += _amount;
        bond.totalInvested += _amount;

        emit CatastropheBondInvested(_bondId, msg.sender, _amount);
    }

    function triggerCatastropheBond(uint256 _bondId) external {
        CatastropheBond storage bond = catastropheBonds[_bondId];
        require(bond.active, "Bond not active");
        require(!bond.triggered, "Already triggered");
        require(block.timestamp <= bond.maturityDate, "Bond matured");

        // Get catastrophe index from oracle
        (uint256 catastropheIndex, , ) = oracle.getLatestData(
            DecentralizedOracle.DataType.Weather,
            bond.region,
            string(abi.encodePacked(bond.catastropheType, "_index"))
        );

        require(catastropheIndex >= bond.triggerThreshold, "Trigger threshold not met");

        bond.triggered = true;
        bond.triggerIndex = catastropheIndex;
        bond.active = false;

        // Calculate payout (simplified - full coverage if triggered)
        bond.payoutAmount = bond.coverageAmount;

        // Distribute payouts to investors
        _distributeCatastrophePayouts(bond);

        emit CatastropheBondTriggered(_bondId, catastropheIndex, bond.payoutAmount);
    }

    function _distributeCatastrophePayouts(CatastropheBond storage bond) internal {
        uint256 totalPayout = bond.payoutAmount;
        uint256 totalInvested = bond.totalInvested;

        for (uint256 i = 0; i < bond.investors.length; i++) {
            address investor = bond.investors[i];
            uint256 investment = bond.investments[investor];
            uint256 payout = (investment * totalPayout) / totalInvested;

            payable(investor).transfer(payout);
        }
    }

    function claimCatastropheBondMaturity(uint256 _bondId) external {
        CatastropheBond storage bond = catastropheBonds[_bondId];
        require(block.timestamp >= bond.maturityDate, "Bond not matured");
        require(!bond.triggered, "Bond was triggered");

        uint256 investment = bond.investments[msg.sender];
        require(investment > 0, "No investment found");

        // Return principal + premium
        uint256 returnAmount = investment + (investment * bond.premium * (bond.maturityDate - block.timestamp)) / (365 days * bond.coverageAmount);

        bond.investments[msg.sender] = 0;
        payable(msg.sender).transfer(returnAmount);
    }

    // ============ PARAMETRIC OPTIONS ============

    function createParametricOption(
        string memory _underlyingAsset,
        uint256 _strikePrice,
        uint256 _premium,
        uint256 _notionalAmount,
        bool _isCall,
        uint256 _expirationDays
    ) external payable returns (uint256) {
        require(msg.value >= _premium, "Insufficient premium payment");
        require(_notionalAmount > 0, "Invalid notional amount");
        require(_expirationDays >= 1 && _expirationDays <= 365, "Invalid expiration");

        uint256 optionId = nextOptionId++;

        ParametricOption storage option = parametricOptions[optionId];
        option.id = optionId;
        option.buyer = msg.sender;
        option.underlyingAsset = _underlyingAsset;
        option.strikePrice = _strikePrice;
        option.premium = _premium;
        option.notionalAmount = _notionalAmount;
        option.isCall = _isCall;
        option.expirationDate = block.timestamp + (_expirationDays * 1 days);
        option.settlementDate = option.expirationDate + settlementDelay;
        option.exercised = false;

        emit ParametricOptionCreated(optionId, msg.sender, _underlyingAsset);
        return optionId;
    }

    function exerciseParametricOption(uint256 _optionId) external {
        ParametricOption storage option = parametricOptions[_optionId];
        require(option.buyer == msg.sender, "Not the option buyer");
        require(!option.exercised, "Already exercised");
        require(block.timestamp >= option.expirationDate, "Option not expired");
        require(block.timestamp <= option.settlementDate, "Settlement period passed");

        // Get settlement price from oracle
        (uint256 settlementPrice, , ) = oracle.getLatestData(
            DecentralizedOracle.DataType.MarketSentiment,
            "global",
            string(abi.encodePacked(option.underlyingAsset, "_price"))
        );

        uint256 payout = 0;

        if (option.isCall && settlementPrice > option.strikePrice) {
            // Call option: profit = (settlement - strike) * notional
            uint256 profit = (settlementPrice - option.strikePrice) * option.notionalAmount / option.strikePrice;
            payout = Math.min(profit, option.notionalAmount); // Cap at notional
        } else if (!option.isCall && settlementPrice < option.strikePrice) {
            // Put option: profit = (strike - settlement) * notional
            uint256 profit = (option.strikePrice - settlementPrice) * option.notionalAmount / option.strikePrice;
            payout = Math.min(profit, option.notionalAmount); // Cap at notional
        }

        option.exercised = true;
        option.payoutAmount = payout;
        option.oracleData = abi.encode(settlementPrice, block.timestamp);

        if (payout > 0) {
            payable(msg.sender).transfer(payout);
        }

        emit ParametricOptionExercised(_optionId, payout);
    }

    // ============ INSURANCE POOLS ============

    function createInsurancePool(
        string memory _poolType,
        uint256 _capacity
    ) external onlyOwner returns (uint256) {
        require(_capacity > 0, "Invalid capacity");

        uint256 poolId = nextPoolId++;

        InsurancePool storage pool = insurancePools[poolId];
        pool.id = poolId;
        pool.poolType = _poolType;
        pool.totalCapacity = _capacity;
        pool.active = true;

        emit InsurancePoolCreated(poolId, _poolType, _capacity);
        return poolId;
    }

    function contributeToPool(uint256 _poolId, uint256 _amount) external payable nonReentrant {
        InsurancePool storage pool = insurancePools[_poolId];
        require(pool.active, "Pool not active");
        require(msg.value == _amount, "Incorrect contribution amount");
        require(pool.utilizedCapacity + _amount <= pool.totalCapacity, "Exceeds pool capacity");

        pool.contributions[msg.sender] += _amount;
        pool.premiumPool += _amount;
        pool.utilizedCapacity += _amount;

        emit PoolContribution(_poolId, msg.sender, _amount);
    }

    function claimPoolPayout(uint256 _poolId, uint256 _claimAmount, bytes memory _proof) external {
        InsurancePool storage pool = insurancePools[_poolId];
        require(pool.active, "Pool not active");
        require(pool.contributions[msg.sender] > 0, "No contribution found");
        require(_claimAmount <= pool.payoutReserve, "Insufficient reserve");

        // Verify claim with oracle data (simplified)
        (uint256 oracleData, , ) = oracle.getLatestData(
            DecentralizedOracle.DataType.IoT,
            "claim_verification",
            "insurance_claim"
        );

        require(oracleData > 0, "Claim not verified by oracle");

        pool.payoutReserve -= _claimAmount;
        payable(msg.sender).transfer(_claimAmount);
    }

    // ============ VIEW FUNCTIONS ============

    function getCatastropheBond(uint256 _bondId) external view returns (
        uint256 id,
        string memory catastropheType,
        string memory region,
        uint256 coverageAmount,
        uint256 totalInvested,
        bool active,
        bool triggered,
        uint256 maturityDate
    ) {
        CatastropheBond storage bond = catastropheBonds[_bondId];
        return (
            bond.id,
            bond.catastropheType,
            bond.region,
            bond.coverageAmount,
            bond.totalInvested,
            bond.active,
            bond.triggered,
            bond.maturityDate
        );
    }

    function getCatastropheBondInvestment(uint256 _bondId, address _investor) external view returns (uint256) {
        return catastropheBonds[_bondId].investments[_investor];
    }

    function getParametricOption(uint256 _optionId) external view returns (
        uint256 id,
        address buyer,
        string memory underlyingAsset,
        uint256 strikePrice,
        uint256 notionalAmount,
        bool isCall,
        uint256 expirationDate,
        bool exercised,
        uint256 payoutAmount
    ) {
        ParametricOption storage option = parametricOptions[_optionId];
        return (
            option.id,
            option.buyer,
            option.underlyingAsset,
            option.strikePrice,
            option.notionalAmount,
            option.isCall,
            option.expirationDate,
            option.exercised,
            option.payoutAmount
        );
    }

    function getInsurancePool(uint256 _poolId) external view returns (
        uint256 id,
        string memory poolType,
        uint256 totalCapacity,
        uint256 utilizedCapacity,
        uint256 premiumPool,
        bool active
    ) {
        InsurancePool storage pool = insurancePools[_poolId];
        return (
            pool.id,
            pool.poolType,
            pool.totalCapacity,
            pool.utilizedCapacity,
            pool.premiumPool,
            pool.active
        );
    }

    function getPoolContribution(uint256 _poolId, address _contributor) external view returns (uint256) {
        return insurancePools[_poolId].contributions[_contributor];
    }

    // ============ ADMIN FUNCTIONS ============

    function updateRiskParameters(
        uint256 _maxCoverageRatio,
        uint256 _minPremiumRate,
        uint256 _maxPremiumRate,
        uint256 _settlementDelay
    ) external onlyOwner {
        maxCoverageRatio = _maxCoverageRatio;
        minPremiumRate = _minPremiumRate;
        maxPremiumRate = _maxPremiumRate;
        settlementDelay = _settlementDelay;
    }

    function emergencyTriggerBond(uint256 _bondId, uint256 _triggerIndex) external onlyOwner {
        CatastropheBond storage bond = catastropheBonds[_bondId];
        require(bond.active, "Bond not active");
        require(!bond.triggered, "Already triggered");

        bond.triggered = true;
        bond.triggerIndex = _triggerIndex;
        bond.active = false;
        bond.payoutAmount = bond.coverageAmount;

        _distributeCatastrophePayouts(bond);

        emit CatastropheBondTriggered(_bondId, _triggerIndex, bond.payoutAmount);
    }

    function deactivatePool(uint256 _poolId) external onlyOwner {
        insurancePools[_poolId].active = false;
    }

    // Withdraw accumulated premiums (for pool management)
    function withdrawPremiums(uint256 _poolId, uint256 _amount) external onlyOwner {
        InsurancePool storage pool = insurancePools[_poolId];
        require(_amount <= pool.premiumPool, "Insufficient premiums");

        pool.premiumPool -= _amount;
        payable(owner()).transfer(_amount);
    }

    receive() external payable {}
}