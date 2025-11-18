// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract AgriCredit is ERC20, ERC20Burnable, ERC20Pausable, Ownable, AccessControl, ReentrancyGuard {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    uint256 public constant MAX_SUPPLY = 1000000000 * 10**18; // 1 billion tokens
    uint256 public constant INITIAL_SUPPLY = 1000000 * 10**18; // 1 million tokens

    mapping(address => bool) public blacklisted;
    mapping(address => uint256) public lastTransferTime;
    mapping(address => uint256) public transferLimits;

    uint256 public globalTransferLimit = 100000 * 10**18; // 100k tokens per day per address
    uint256 public constant TRANSFER_COOLDOWN = 1 hours;

    event Blacklisted(address indexed account);
    event Unblacklisted(address indexed account);
    event TransferLimitUpdated(address indexed account, uint256 limit);
    event TokensBurned(address indexed burner, uint256 amount);

    constructor() ERC20("AgriCredit Token", "AGRC") Ownable(msg.sender) {
        _mint(msg.sender, INITIAL_SUPPLY);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(BURNER_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
    }

    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds max supply");
        _mint(to, amount);
    }

    function burn(uint256 amount) public override {
        super.burn(amount);
        emit TokensBurned(msg.sender, amount);
    }

    function burnFrom(address account, uint256 amount) public override onlyRole(BURNER_ROLE) {
        super.burnFrom(account, amount);
        emit TokensBurned(account, amount);
    }

    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function blacklist(address account) public onlyOwner {
        blacklisted[account] = true;
        emit Blacklisted(account);
    }

    function unblacklist(address account) public onlyOwner {
        blacklisted[account] = false;
        emit Unblacklisted(account);
    }

    function setTransferLimit(address account, uint256 limit) public onlyOwner {
        transferLimits[account] = limit;
        emit TransferLimitUpdated(account, limit);
    }

    function setGlobalTransferLimit(uint256 limit) public onlyOwner {
        globalTransferLimit = limit;
    }

    function _update(address from, address to, uint256 value) internal override(ERC20, ERC20Pausable) {
        require(!blacklisted[from], "Sender is blacklisted");
        require(!blacklisted[to], "Recipient is blacklisted");

        // Check transfer limits
        if (from != address(0)) { // Not minting
            uint256 limit = transferLimits[from] > 0 ? transferLimits[from] : globalTransferLimit;
            require(value <= limit, "Transfer amount exceeds limit");

            // Check cooldown
            require(block.timestamp >= lastTransferTime[from] + TRANSFER_COOLDOWN, "Transfer cooldown active");
            lastTransferTime[from] = block.timestamp;
        }

        super._update(from, to, value);
    }

    function transferWithMemo(address to, uint256 amount, string memory memo) public returns (bool) {
        _transfer(msg.sender, to, amount);
        // In practice, emit an event with memo
        return true;
    }

    function batchTransfer(address[] memory recipients, uint256[] memory amounts) public nonReentrant {
        require(recipients.length == amounts.length, "Arrays length mismatch");
        require(recipients.length <= 100, "Too many recipients");

        for (uint256 i = 0; i < recipients.length; i++) {
            _transfer(msg.sender, recipients[i], amounts[i]);
        }
    }

    function emergencyWithdraw(address token, uint256 amount) public onlyOwner {
        require(token != address(this), "Cannot withdraw native token");
        IERC20(token).transfer(owner(), amount);
    }

    function getTransferLimit(address account) public view returns (uint256) {
        return transferLimits[account] > 0 ? transferLimits[account] : globalTransferLimit;
    }

    function isBlacklisted(address account) public view returns (bool) {
        return blacklisted[account];
    }

    function getRemainingTransferLimit(address account) public view returns (uint256) {
        uint256 limit = getTransferLimit(account);
        if (block.timestamp < lastTransferTime[account] + TRANSFER_COOLDOWN) {
            return 0;
        }
        return limit;
    }
}