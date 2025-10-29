// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

contract CarbonToken is ERC20, ERC20Burnable, Ownable {
    // Mapping to track carbon offsets per user
    mapping(address => uint256) public carbonOffsets;

    // Total carbon offset verified
    uint256 public totalCarbonOffset;

    // Events
    event CarbonOffsetMinted(address indexed user, uint256 amount, string verificationProof);
    event CarbonOffsetBurned(address indexed user, uint256 amount);

    constructor() ERC20("AgriCredit Carbon Token", "CARBT") Ownable(msg.sender) {}

    /**
     * @dev Mint CARBT tokens based on verified carbon offset
     * @param to Address to mint tokens to
     * @param carbonAmount Amount of CO2 offset in tons (1 CARBT = 1 ton CO2)
     * @param verificationProof IPFS hash or oracle verification proof
     */
    function mintCarbonTokens(
        address to,
        uint256 carbonAmount,
        string memory verificationProof
    ) external onlyOwner {
        require(carbonAmount > 0, "Carbon amount must be > 0");
        require(bytes(verificationProof).length > 0, "Verification proof required");

        // Mint 1 CARBT per ton of CO2 offset
        _mint(to, carbonAmount);

        // Update tracking
        carbonOffsets[to] += carbonAmount;
        totalCarbonOffset += carbonAmount;

        emit CarbonOffsetMinted(to, carbonAmount, verificationProof);
    }

    /**
     * @dev Burn CARBT tokens (for retirement or trading)
     * @param amount Amount to burn
     */
    function burnCarbonTokens(uint256 amount) external {
        require(balanceOf(msg.sender) >= amount, "Insufficient CARBT balance");

        _burn(msg.sender, amount);
        carbonOffsets[msg.sender] -= amount;

        emit CarbonOffsetBurned(msg.sender, amount);
    }

    /**
     * @dev Get carbon offset balance for a user
     * @param user Address to query
     */
    function getCarbonOffset(address user) external view returns (uint256) {
        return carbonOffsets[user];
    }

    /**
     * @dev Override decimals to match carbon measurement precision
     */
    function decimals() public pure override returns (uint8) {
        return 18; // Standard ERC20 decimals for fractional tons
    }
}