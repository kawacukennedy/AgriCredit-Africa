// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./CarbonToken.sol";

contract LiquidityPool is Ownable, ReentrancyGuard {
    struct Pool {
        IERC20 token;
        uint256 totalLiquidity;
        uint256 totalBorrowed;
        uint256 interestRate; // in basis points (e.g., 500 = 5%)
        uint256 lastUpdateTime;
        bool active;
    }

    mapping(address => Pool) public pools;
    address[] public supportedTokens;

    CarbonToken public carbonToken;

    // User liquidity positions
    mapping(address => mapping(address => uint256)) public userLiquidity; // user => token => amount

    // Events
    event PoolCreated(address indexed token, uint256 interestRate);
    event LiquidityAdded(address indexed user, address indexed token, uint256 amount);
    event LiquidityRemoved(address indexed user, address indexed token, uint256 amount);
    event LoanIssued(address indexed borrower, address indexed token, uint256 amount);

    constructor(address _carbonToken) Ownable(msg.sender) {
        carbonToken = CarbonToken(_carbonToken);
    }

    /**
     * @dev Create a new liquidity pool for a token
     * @param token Address of the ERC20 token
     * @param interestRate Annual interest rate in basis points
     */
    function createPool(address token, uint256 interestRate) external onlyOwner {
        require(token != address(0), "Invalid token address");
        require(pools[token].token == IERC20(address(0)), "Pool already exists");
        require(interestRate > 0 && interestRate <= 2000, "Invalid interest rate"); // Max 20%

        pools[token] = Pool({
            token: IERC20(token),
            totalLiquidity: 0,
            totalBorrowed: 0,
            interestRate: interestRate,
            lastUpdateTime: block.timestamp,
            active: true
        });

        supportedTokens.push(token);

        emit PoolCreated(token, interestRate);
    }

    /**
     * @dev Add liquidity to a pool
     * @param token Token address
     * @param amount Amount to add
     */
    function addLiquidity(address token, uint256 amount) external nonReentrant {
        require(pools[token].active, "Pool not active");
        require(amount > 0, "Amount must be > 0");

        Pool storage pool = pools[token];

        // Transfer tokens from user
        require(pool.token.transferFrom(msg.sender, address(this), amount), "Transfer failed");

        // Update pool and user balances
        pool.totalLiquidity += amount;
        userLiquidity[msg.sender][token] += amount;

        emit LiquidityAdded(msg.sender, token, amount);
    }

    /**
     * @dev Remove liquidity from a pool
     * @param token Token address
     * @param amount Amount to remove
     */
    function removeLiquidity(address token, uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be > 0");
        require(userLiquidity[msg.sender][token] >= amount, "Insufficient liquidity");

        Pool storage pool = pools[token];
        require(pool.totalLiquidity - pool.totalBorrowed >= amount, "Insufficient pool liquidity");

        // Update balances
        pool.totalLiquidity -= amount;
        userLiquidity[msg.sender][token] -= amount;

        // Transfer tokens back to user
        require(pool.token.transfer(msg.sender, amount), "Transfer failed");

        emit LiquidityRemoved(msg.sender, token, amount);
    }

    /**
     * @dev Issue loan from pool (called by LoanManager)
     * @param borrower Borrower address
     * @param token Token address
     * @param amount Loan amount
     */
    function issueLoan(address borrower, address token, uint256 amount) external onlyOwner {
        Pool storage pool = pools[token];
        require(pool.active, "Pool not active");
        require(pool.totalLiquidity - pool.totalBorrowed >= amount, "Insufficient liquidity");

        pool.totalBorrowed += amount;

        // Transfer tokens to borrower (LoanManager should handle this)
        require(pool.token.transfer(borrower, amount), "Transfer failed");

        emit LoanIssued(borrower, token, amount);
    }

    /**
     * @dev Repay loan to pool (called by LoanManager)
     * @param borrower Borrower address
     * @param token Token address
     * @param amount Repayment amount
     */
    function repayLoan(address borrower, address token, uint256 amount) external onlyOwner {
        Pool storage pool = pools[token];
        require(pool.totalBorrowed >= amount, "Over-repayment");

        pool.totalBorrowed -= amount;

        // Tokens should already be transferred to this contract by LoanManager
    }

    /**
     * @dev Get pool information
     * @param token Token address
     */
    function getPoolInfo(address token) external view returns (
        uint256 totalLiquidity,
        uint256 totalBorrowed,
        uint256 availableLiquidity,
        uint256 interestRate,
        bool active
    ) {
        Pool memory pool = pools[token];
        return (
            pool.totalLiquidity,
            pool.totalBorrowed,
            pool.totalLiquidity - pool.totalBorrowed,
            pool.interestRate,
            pool.active
        );
    }

    /**
     * @dev Get user's liquidity position
     * @param user User address
     * @param token Token address
     */
    function getUserLiquidity(address user, address token) external view returns (uint256) {
        return userLiquidity[user][token];
    }

    /**
     * @dev Get list of supported tokens
     */
    function getSupportedTokens() external view returns (address[] memory) {
        return supportedTokens;
    }
}