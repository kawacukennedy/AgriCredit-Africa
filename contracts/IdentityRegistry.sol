// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

// ERC-725 Identity Interface
interface IERC725Y {
    function getData(bytes32[] memory keys) external view returns (bytes[] memory values);
    function setData(bytes32[] memory keys, bytes[] memory values) external;
}

// Soulbound Token for Identity Credentials
contract SoulboundCredential is ERC721, ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;

    mapping(uint256 => bool) public soulbound; // Soulbound tokens cannot be transferred

    constructor() ERC721("AgriCredit Soulbound Credential", "ASC") Ownable(msg.sender) {}

    function safeMint(address to, string memory uri) external onlyOwner returns (uint256) {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        soulbound[tokenId] = true;
        return tokenId;
    }

    function _beforeTokenTransfer(address from, address to, uint256 tokenId, uint256 batchSize)
        internal
        override(ERC721)
    {
        require(from == address(0) || !soulbound[tokenId], "Soulbound token cannot be transferred");
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}

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
        uint256 chainId; // For cross-chain identity
        address recoveryAddress; // For identity recovery
    }

    // ERC-725 Data Storage
    mapping(bytes32 => bytes) public dataStore; // ERC-725 data storage
    mapping(address => mapping(bytes32 => bytes)) public identityData; // Per-identity data

    // Cross-chain identity verification
    struct CrossChainVerification {
        uint256 sourceChainId;
        address sourceContract;
        bytes32 verificationHash;
        uint256 verifiedAt;
        bool isValid;
    }

    mapping(address => CrossChainVerification[]) public crossChainVerifications;

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

    // Soulbound credentials
    SoulboundCredential public soulboundCredential;

    // Multi-sig recovery
    struct RecoveryRequest {
        address newAddress;
        uint256 signaturesRequired;
        uint256 signaturesCollected;
        uint256 deadline;
        mapping(address => bool) hasSigned;
        bool executed;
    }

    mapping(address => RecoveryRequest) public recoveryRequests;
    mapping(address => address[]) public guardians; // Recovery guardians

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

    constructor() Ownable(msg.sender) {
        soulboundCredential = new SoulboundCredential();
    }

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

    // ============ ERC-725 IDENTITY FUNCTIONS ============

    function getData(bytes32[] memory keys) external view returns (bytes[] memory values) {
        values = new bytes[](keys.length);
        for (uint256 i = 0; i < keys.length; i++) {
            values[i] = dataStore[keys[i]];
        }
    }

    function setData(bytes32[] memory keys, bytes[] memory values) external {
        require(keys.length == values.length, "Keys and values length mismatch");
        for (uint256 i = 0; i < keys.length; i++) {
            dataStore[keys[i]] = values[i];
            emit DataChanged(keys[i], values[i]);
        }
    }

    function getIdentityData(address identity, bytes32 key) external view returns (bytes memory) {
        return identityData[identity][key];
    }

    function setIdentityData(address identity, bytes32 key, bytes memory value) external {
        require(msg.sender == identity || msg.sender == owner(), "Not authorized");
        require(identities[identity].wallet != address(0), "Identity does not exist");
        identityData[identity][key] = value;
        emit IdentityDataChanged(identity, key, value);
    }

    // ============ SOULBOUND CREDENTIALS ============

    function issueSoulboundCredential(
        address to,
        string memory tokenURI
    ) external onlyOwner returns (uint256) {
        require(identities[to].wallet != address(0), "Identity does not exist");
        uint256 tokenId = soulboundCredential.safeMint(to, tokenURI);
        emit SoulboundCredentialIssued(to, tokenId, tokenURI);
        return tokenId;
    }

    function revokeSoulboundCredential(uint256 tokenId) external onlyOwner {
        address owner = soulboundCredential.ownerOf(tokenId);
        soulboundCredential._burn(tokenId);
        emit SoulboundCredentialRevoked(owner, tokenId);
    }

    // ============ CROSS-CHAIN IDENTITY ============

    function verifyCrossChainIdentity(
        address identity,
        uint256 sourceChainId,
        address sourceContract,
        bytes32 verificationHash,
        bytes memory signature
    ) external {
        require(identities[identity].wallet != address(0), "Identity does not exist");

        // Verify signature from source contract (simplified)
        bytes32 messageHash = keccak256(abi.encodePacked(sourceChainId, sourceContract, verificationHash));
        bytes32 ethSignedMessageHash = MessageHashUtils.toEthSignedMessageHash(messageHash);
        address signer = ECDSA.recover(ethSignedMessageHash, signature);

        // In production, verify signer is authorized oracle for the source chain
        require(signer == owner(), "Invalid cross-chain signature"); // Simplified

        CrossChainVerification memory verification = CrossChainVerification({
            sourceChainId: sourceChainId,
            sourceContract: sourceContract,
            verificationHash: verificationHash,
            verifiedAt: block.timestamp,
            isValid: true
        });

        crossChainVerifications[identity].push(verification);

        // Boost reputation for cross-chain verification
        identities[identity].reputationScore += 50;
        identities[identity].lastUpdated = block.timestamp;

        emit CrossChainIdentityVerified(identity, sourceChainId, verificationHash);
    }

    // ============ MULTI-SIG RECOVERY ============

    function setupGuardians(address[] memory _guardians, uint256 _signaturesRequired) external {
        require(identities[msg.sender].wallet != address(0), "Identity does not exist");
        require(_guardians.length >= _signaturesRequired, "Insufficient guardians");
        require(_signaturesRequired > 0, "Signatures required must be > 0");

        guardians[msg.sender] = _guardians;
        emit GuardiansSetup(msg.sender, _guardians, _signaturesRequired);
    }

    function initiateRecovery(address newAddress) external {
        require(identities[msg.sender].wallet != address(0), "Identity does not exist");
        address[] memory userGuardians = guardians[msg.sender];
        require(userGuardians.length > 0, "No guardians setup");

        recoveryRequests[msg.sender] = RecoveryRequest({
            newAddress: newAddress,
            signaturesRequired: userGuardians.length,
            signaturesCollected: 0,
            deadline: block.timestamp + 7 days,
            executed: false
        });

        emit RecoveryInitiated(msg.sender, newAddress);
    }

    function signRecovery(address originalAddress) external {
        RecoveryRequest storage request = recoveryRequests[originalAddress];
        require(!request.executed, "Recovery already executed");
        require(block.timestamp <= request.deadline, "Recovery deadline passed");
        require(!request.hasSigned[msg.sender], "Already signed");

        // Check if signer is a guardian
        address[] memory userGuardians = guardians[originalAddress];
        bool isGuardian = false;
        for (uint256 i = 0; i < userGuardians.length; i++) {
            if (userGuardians[i] == msg.sender) {
                isGuardian = true;
                break;
            }
        }
        require(isGuardian, "Not a guardian");

        request.hasSigned[msg.sender] = true;
        request.signaturesCollected++;

        emit RecoverySigned(originalAddress, msg.sender);

        // Auto-execute if threshold reached
        if (request.signaturesCollected >= request.signaturesRequired) {
            _executeRecovery(originalAddress);
        }
    }

    function _executeRecovery(address originalAddress) internal {
        RecoveryRequest storage request = recoveryRequests[originalAddress];
        require(!request.executed, "Already executed");

        // Update identity
        identities[originalAddress].wallet = request.newAddress;
        identities[originalAddress].lastUpdated = block.timestamp;

        // Transfer soulbound credentials
        // Note: In production, this would require more complex logic

        request.executed = true;

        emit RecoveryExecuted(originalAddress, request.newAddress);
    }

    // ============ ADDITIONAL EVENTS ============

    event DataChanged(bytes32 indexed key, bytes value);
    event IdentityDataChanged(address indexed identity, bytes32 indexed key, bytes value);
    event SoulboundCredentialIssued(address indexed to, uint256 indexed tokenId, string tokenURI);
    event SoulboundCredentialRevoked(address indexed from, uint256 indexed tokenId);
    event CrossChainIdentityVerified(address indexed identity, uint256 sourceChainId, bytes32 verificationHash);
    event GuardiansSetup(address indexed identity, address[] guardians, uint256 signaturesRequired);
    event RecoveryInitiated(address indexed originalAddress, address indexed newAddress);
    event RecoverySigned(address indexed originalAddress, address indexed signer);
    event RecoveryExecuted(address indexed originalAddress, address indexed newAddress);
}