// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";

contract IdentityRegistry is Ownable {
    struct Identity {
        string did;
        address wallet;
        uint256 reputationScore;
        bool isVerified;
        uint256 createdAt;
        uint256 lastUpdated;
    }

    mapping(address => Identity) public identities;
    mapping(string => address) public didToAddress;

    event IdentityCreated(address indexed user, string did);
    event IdentityUpdated(address indexed user, string did);
    event ReputationUpdated(address indexed user, uint256 newScore);

    constructor() Ownable(msg.sender) {}

    function createIdentity(string memory _did, address _user) external onlyOwner {
        require(identities[_user].wallet == address(0), "Identity already exists");
        require(didToAddress[_did] == address(0), "DID already registered");

        identities[_user] = Identity({
            did: _did,
            wallet: _user,
            reputationScore: 500, // Base score
            isVerified: true,
            createdAt: block.timestamp,
            lastUpdated: block.timestamp
        });

        didToAddress[_did] = _user;

        emit IdentityCreated(_user, _did);
    }

    function updateReputation(address _user, uint256 _newScore) external onlyOwner {
        require(identities[_user].wallet != address(0), "Identity does not exist");
        require(_newScore <= 1000, "Score must be <= 1000");

        identities[_user].reputationScore = _newScore;
        identities[_user].lastUpdated = block.timestamp;

        emit ReputationUpdated(_user, _newScore);
    }

    function getIdentity(address _user) external view returns (Identity memory) {
        return identities[_user];
    }

    function isIdentityVerified(address _user) external view returns (bool) {
        return identities[_user].isVerified;
    }

    function getReputationScore(address _user) external view returns (uint256) {
        return identities[_user].reputationScore;
    }
}