// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract YieldToken is ERC20, Ownable, ReentrancyGuard {
    struct YieldPosition {
        uint256 amount;
        uint256 depositTime;
        uint256 lastClaimTime;
        uint256 accumulatedYield;
    }

    // Yield farming parameters
    uint256 public constant YIELD_RATE = 500; // 5% APY in basis points
    uint256 public constant SECONDS_PER_YEAR = 365 * 24 * 60 * 60;

    // Underlying token (e.g., stablecoin)
    address public underlyingToken;

    // Total staked amount
    uint256 public totalStaked;

    // User positions
    mapping(address => YieldPosition) public positions;

    // Events
    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event YieldClaimed(address indexed user, uint256 amount);

    constructor(address _underlyingToken, string memory name, string memory symbol)
        ERC20(name, symbol)
        Ownable(msg.sender)
    {
        underlyingToken = _underlyingToken;
    }

    /**
     * @dev Deposit underlying tokens to earn yield
     * @param amount Amount to deposit
     */
    function deposit(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be > 0");

        // Transfer underlying tokens from user
        IERC20(underlyingToken).transferFrom(msg.sender, address(this), amount);

        // Update or create position
        YieldPosition storage position = positions[msg.sender];
        if (position.amount > 0) {
            // Claim pending yield before adding more
            _claimYield(msg.sender);
        }

        position.amount += amount;
        position.depositTime = block.timestamp;
        position.lastClaimTime = block.timestamp;

        totalStaked += amount;

        // Mint yield tokens (1:1 ratio initially)
        _mint(msg.sender, amount);

        emit Deposited(msg.sender, amount);
    }

    /**
     * @dev Withdraw underlying tokens
     * @param amount Amount to withdraw
     */
    function withdraw(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be > 0");
        YieldPosition storage position = positions[msg.sender];
        require(position.amount >= amount, "Insufficient balance");

        // Claim pending yield
        _claimYield(msg.sender);

        // Update position
        position.amount -= amount;
        totalStaked -= amount;

        // Burn yield tokens
        _burn(msg.sender, amount);

        // Transfer underlying tokens back
        IERC20(underlyingToken).transfer(msg.sender, amount);

        emit Withdrawn(msg.sender, amount);
    }

    /**
     * @dev Claim accumulated yield
     */
    function claimYield() external nonReentrant {
        _claimYield(msg.sender);
    }

    /**
     * @dev Internal function to claim yield
     * @param user User address
     */
    function _claimYield(address user) internal {
        YieldPosition storage position = positions[user];
        if (position.amount == 0) return;

        uint256 pendingYield = calculatePendingYield(user);
        if (pendingYield == 0) return;

        position.accumulatedYield += pendingYield;
        position.lastClaimTime = block.timestamp;

        // Mint additional yield tokens as reward
        _mint(user, pendingYield);

        emit YieldClaimed(user, pendingYield);
    }

    /**
     * @dev Calculate pending yield for a user
     * @param user User address
     */
    function calculatePendingYield(address user) public view returns (uint256) {
        YieldPosition memory position = positions[user];
        if (position.amount == 0) return 0;

        uint256 timeElapsed = block.timestamp - position.lastClaimTime;
        uint256 yieldAmount = (position.amount * YIELD_RATE * timeElapsed) / (SECONDS_PER_YEAR * 10000);

        return yieldAmount;
    }

    /**
     * @dev Get user's yield position
     * @param user User address
     */
    function getPosition(address user) external view returns (
        uint256 amount,
        uint256 depositTime,
        uint256 lastClaimTime,
        uint256 pendingYield,
        uint256 totalAccumulated
    ) {
        YieldPosition memory position = positions[user];
        uint256 pending = calculatePendingYield(user);
        return (
            position.amount,
            position.depositTime,
            position.lastClaimTime,
            pending,
            position.accumulatedYield + pending
        );
    }

    /**
     * @dev Get total value locked
     */
    function totalValueLocked() external view returns (uint256) {
        return totalStaked;
    }

    /**
     * @dev Emergency withdraw (only owner)
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = IERC20(underlyingToken).balanceOf(address(this));
        IERC20(underlyingToken).transfer(owner(), balance);
    }
}