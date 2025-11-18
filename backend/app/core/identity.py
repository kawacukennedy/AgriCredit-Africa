from typing import Dict, Any, List, Optional
import json
import base64
from datetime import datetime, timedelta
from .blockchain import blockchain_service

class IdentityService:
    """DID Identity Service for decentralized identity management"""

    def __init__(self):
        self.did_documents = {}

    async def create_did(self, user_address: str, public_key: str) -> Dict[str, Any]:
        """Create a new DID for a user"""
        # Generate DID using did:key method
        did = f"did:key:{public_key[:16]}"  # Simplified DID generation

        # Create DID document
        did_document = {
            "@context": "https://www.w3.org/ns/did/v1",
            "id": did,
            "verificationMethod": [{
                "id": f"{did}#key-1",
                "type": "Ed25519VerificationKey2020",
                "controller": did,
                "publicKeyMultibase": public_key
            }],
            "authentication": [f"{did}#key-1"],
            "assertionMethod": [f"{did}#key-1"],
            "created": datetime.utcnow().isoformat(),
            "updated": datetime.utcnow().isoformat()
        }

        # Store DID document
        self.did_documents[did] = did_document

        # Create identity on blockchain
        tx_result = await blockchain_service.create_identity(user_address, did, public_key)

        return {
            'did': did,
            'did_document': did_document,
            'blockchain_tx': tx_result
        }

    async def resolve_did(self, did: str) -> Optional[Dict[str, Any]]:
        """Resolve a DID to its document"""
        # Check local storage first
        if did in self.did_documents:
            return self.did_documents[did]

        # Try to resolve from blockchain
        # Extract address from DID (simplified)
        address_part = did.split(':')[-1]
        # This would need proper DID parsing in production

        return None

    async def update_did_document(self, did: str, updates: Dict[str, Any]) -> Dict[str, Any]:
        """Update a DID document"""
        if did not in self.did_documents:
            raise Exception(f"DID {did} not found")

        document = self.did_documents[did]
        document.update(updates)
        document["updated"] = datetime.utcnow().isoformat()

        return document

    async def verify_credential(self, credential: Dict[str, Any]) -> bool:
        """Verify a verifiable credential"""
        try:
            # Check expiration
            if 'expirationDate' in credential:
                exp_date = datetime.fromisoformat(credential['expirationDate'].replace('Z', '+00:00'))
                if exp_date < datetime.utcnow():
                    return False

            # Check if credential is revoked (would check blockchain)
            # For now, assume valid

            # Verify signature (simplified)
            # In production, this would verify the cryptographic signature

            return True

        except Exception as e:
            print(f"Credential verification failed: {e}")
            return False

    async def issue_credential(self, issuer_did: str, subject_did: str,
                             credential_type: str, claims: Dict[str, Any],
                             expiration_days: int = 365) -> Dict[str, Any]:
        """Issue a verifiable credential"""
        credential = {
            "@context": [
                "https://www.w3.org/2018/credentials/v1",
                "https://www.w3.org/2018/credentials/examples/v1"
            ],
            "type": ["VerifiableCredential", credential_type],
            "issuer": issuer_did,
            "issuanceDate": datetime.utcnow().isoformat(),
            "expirationDate": (datetime.utcnow() + timedelta(days=expiration_days)).isoformat(),
            "credentialSubject": {
                "id": subject_did,
                **claims
            }
        }

        # Generate credential hash
        credential_json = json.dumps(credential, sort_keys=True)
        credential_hash = base64.b64encode(credential_json.encode()).decode()

        # Add proof (simplified)
        credential["proof"] = {
            "type": "Ed25519Signature2020",
            "created": datetime.utcnow().isoformat(),
            "verificationMethod": f"{issuer_did}#key-1",
            "proofPurpose": "assertionMethod",
            "proofValue": f"z{credential_hash[:64]}"  # Mock signature
        }

        return credential

    async def submit_ai_kyc(self, user_address: str, kyc_data: Dict[str, Any]) -> Dict[str, Any]:
        """Submit AI-KYC verification result"""
        # Mock AI-KYC processing
        confidence_score = 92  # Mock score
        passed = confidence_score >= 85

        # Submit to blockchain
        result_hash = base64.b64encode(json.dumps(kyc_data).encode()).decode()[:32]

        # This would call the blockchain service
        # await blockchain_service.submit_ai_kyc_result(...)

        return {
            'user_address': user_address,
            'confidence_score': confidence_score,
            'passed': passed,
            'verification_methods': kyc_data.get('methods', []),
            'result_hash': result_hash
        }

    async def get_identity_reputation(self, user_address: str) -> Dict[str, Any]:
        """Get user's identity reputation"""
        # Get from blockchain
        reputation = await blockchain_service.get_reputation_score(user_address)

        # Calculate reputation tier
        if reputation >= 900:
            tier = "Platinum"
        elif reputation >= 800:
            tier = "Gold"
        elif reputation >= 700:
            tier = "Silver"
        elif reputation >= 600:
            tier = "Bronze"
        else:
            tier = "Basic"

        return {
            'address': user_address,
            'score': reputation,
            'tier': tier,
            'max_score': 1000
        }

    async def create_verifiable_presentation(self, holder_did: str,
                                           credentials: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Create a verifiable presentation"""
        presentation = {
            "@context": ["https://www.w3.org/2018/credentials/v1"],
            "type": ["VerifiablePresentation"],
            "holder": holder_did,
            "verifiableCredential": credentials
        }

        # Add proof
        presentation["proof"] = {
            "type": "Ed25519Signature2020",
            "created": datetime.utcnow().isoformat(),
            "verificationMethod": f"{holder_did}#key-1",
            "proofPurpose": "authentication",
            "proofValue": "z" + base64.b64encode(b"mock_signature").decode()[:64]
        }

        return presentation

# Global identity service instance
identity_service = IdentityService()