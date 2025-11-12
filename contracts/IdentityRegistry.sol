// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

contract IdentityRegistry is Ownable {
    using ECDSA for bytes32;

    struct Identity {
        string did;
        address wallet;
        uint256 reputationScore;
        bool isVerified;
        uint256 createdAt;
        uint256 lastUpdated;
        string publicKey; // For DID authentication
        bytes32 zkProof; // Zero-knowledge proof hash
    }

    struct VerifiableCredential {
        string credentialType;
        string issuer;
        string subject;
        uint256 issuanceDate;
        uint256 expirationDate;
        bool isValid;
        bytes32 credentialHash;
        string metadataURI; // IPFS link to full credential
    }

    // Identity mappings
    mapping(address => Identity) public identities;
    mapping(string => address) public didToAddress;
    mapping(bytes32 => bool) public usedZKProofs;

    // Verifiable credentials
    mapping(address => VerifiableCredential[]) public userCredentials;
    mapping(bytes32 => bool) public revokedCredentials;

    // AI-KYC results
    struct AIKYCResult {
        address user;
        uint256 confidenceScore;
        bool passed;
        uint256 timestamp;
        string verificationMethod; // "face", "voice", "document"
        bytes32 resultHash;
    }

    mapping(address => AIKYCResult[]) public aiKYCResults;

    // Events
    event IdentityCreated(address indexed user, string did);
    event IdentityUpdated(address indexed user, string did);
    event ReputationUpdated(address indexed user, uint256 newScore);
    event CredentialIssued(address indexed subject, bytes32 credentialHash);
    event CredentialRevoked(bytes32 credentialHash);
    event AIKYCCompleted(address indexed user, bool passed, uint256 confidenceScore);

    constructor() Ownable(msg.sender) {}

    // DID Identity Management
    function createIdentity(
        string memory _did,
        address _user,
        string memory _publicKey
    ) external onlyOwner {
        require(identities[_user].wallet == address(0), "Identity already exists");
        require(didToAddress[_did] == address(0), "DID already registered");

        identities[_user] = Identity({
            did: _did,
            wallet: _user,
            reputationScore: 500, // Base score
            isVerified: false, // Requires KYC verification
            createdAt: block.timestamp,
            lastUpdated: block.timestamp,
            publicKey: _publicKey,
            zkProof: bytes32(0)
        });

        didToAddress[_did] = _user;

        emit IdentityCreated(_user, _did);
    }

    // AI-KYC Verification
    function submitAIKYCResult(
        address _user,
        uint256 _confidenceScore,
        bool _passed,
        string memory _verificationMethod,
        bytes32 _resultHash
    ) external onlyOwner {
        require(identities[_user].wallet != address(0), "Identity does not exist");

        AIKYCResult memory result = AIKYCResult({
            user: _user,
            confidenceScore: _confidenceScore,
            passed: _passed,
            timestamp: block.timestamp,
            verificationMethod: _verificationMethod,
            resultHash: _resultHash
        });

        aiKYCResults[_user].push(result);

        // Auto-verify identity if KYC passed with high confidence
        if (_passed && _confidenceScore >= 85) {
            identities[_user].isVerified = true;
            identities[_user].lastUpdated = block.timestamp;
        }

        emit AIKYCCompleted(_user, _passed, _confidenceScore);
    }

    // Verifiable Credentials
    function issueCredential(
        address _subject,
        string memory _credentialType,
        string memory _issuer,
        uint256 _expirationDate,
        bytes32 _credentialHash,
        string memory _metadataURI
    ) external onlyOwner {
        require(identities[_subject].wallet != address(0), "Subject identity does not exist");
        require(!revokedCredentials[_credentialHash], "Credential hash already used");

        VerifiableCredential memory credential = VerifiableCredential({
            credentialType: _credentialType,
            issuer: _issuer,
            subject: _subject,
            issuanceDate: block.timestamp,
            expirationDate: _expirationDate,
            isValid: true,
            credentialHash: _credentialHash,
            metadataURI: _metadataURI
        });

        userCredentials[_subject].push(credential);

        emit CredentialIssued(_subject, _credentialHash);
    }

    function revokeCredential(bytes32 _credentialHash) external onlyOwner {
        revokedCredentials[_credentialHash] = true;
        emit CredentialRevoked(_credentialHash);
    }

    // Zero-Knowledge Proofs
    function submitZKProof(address _user, bytes32 _proof) external {
        require(identities[_user].wallet != address(0), "Identity does not exist");
        require(!usedZKProofs[_proof], "ZK proof already used");

        // Store the proof hash (actual verification would happen off-chain)
        identities[_user].zkProof = _proof;
        usedZKProofs[_proof] = true;

        identities[_user].lastUpdated = block.timestamp;
    }

    // Reputation Management
    function updateReputation(address _user, uint256 _newScore) external onlyOwner {
        require(identities[_user].wallet != address(0), "Identity does not exist");
        require(_newScore <= 1000, "Score must be <= 1000");

        identities[_user].reputationScore = _newScore;
        identities[_user].lastUpdated = block.timestamp;

        emit ReputationUpdated(_user, _newScore);
    }

    // DID Authentication
    function authenticateDID(
        string memory _did,
        bytes32 _messageHash,
        bytes memory _signature
    ) external view returns (bool) {
        address signer = didToAddress[_did];
        require(signer != address(0), "DID not found");

        // Verify signature against stored public key
        // This is a simplified version - production would use proper DID verification
        bytes32 ethSignedMessageHash = MessageHashUtils.toEthSignedMessageHash(_messageHash);
        address recoveredSigner = ECDSA.recover(ethSignedMessageHash, _signature);

        return recoveredSigner == signer;
    }

    // Getters
    function getIdentity(address _user) external view returns (
        string memory did,
        address wallet,
        uint256 reputationScore,
        bool isVerified,
        uint256 createdAt,
        string memory publicKey
    ) {
        Identity memory identity = identities[_user];
        return (
            identity.did,
            identity.wallet,
            identity.reputationScore,
            identity.isVerified,
            identity.createdAt,
            identity.publicKey
        );
    }

    function isIdentityVerified(address _user) external view returns (bool) {
        return identities[_user].isVerified;
    }

    function getReputationScore(address _user) external view returns (uint256) {
        return identities[_user].reputationScore;
    }

    function getUserCredentials(address _user) external view returns (VerifiableCredential[] memory) {
        return userCredentials[_user];
    }

    function getAIKYCResults(address _user) external view returns (AIKYCResult[] memory) {
        return aiKYCResults[_user];
    }

    function isCredentialValid(bytes32 _credentialHash) external view returns (bool) {
        return !revokedCredentials[_credentialHash];
    }
}