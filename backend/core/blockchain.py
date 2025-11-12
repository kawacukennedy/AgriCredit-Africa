import web3
from web3 import Web3
from web3.middleware import geth_poa_middleware
import json
import asyncio
from typing import Dict, Any, Optional, List
from .config import settings

class BlockchainService:
    """Blockchain service for interacting with smart contracts"""

    def __init__(self):
        self.w3: Optional[Web3] = None
        self.contracts: Dict[str, Any] = {}
        self.account = None
        self.chain_id = None

    def connect(self) -> bool:
        """Connect to blockchain network"""
        try:
            self.w3 = Web3(Web3.HTTPProvider(settings.WEB3_PROVIDER_URL))

            # Add PoA middleware for networks like Polygon, BSC
            self.w3.middleware_onion.inject(geth_poa_middleware, layer=0)

            if not self.w3.is_connected():
                return False

            self.chain_id = self.w3.eth.chain_id

            # Set up account (in production, use environment variables)
            # For development, we'll use a test account
            self.account = self.w3.eth.account.from_key(
                "0x" + "1" * 64  # Dummy private key for development
            )

            return True

        except Exception as e:
            print(f"Failed to connect to blockchain: {e}")
            return False

    def is_connected(self) -> bool:
        """Check if connected to blockchain"""
        return self.w3 is not None and self.w3.is_connected()

    def get_chain_id(self) -> int:
        """Get current chain ID"""
        return self.chain_id or 0

    def get_account_address(self) -> str:
        """Get account address"""
        return self.account.address if self.account else ""

    async def get_gas_price(self) -> int:
        """Get current gas price"""
        if not self.is_connected():
            return 0
        return self.w3.eth.gas_price

    def load_contract(self, name: str, address: str, abi_path: str):
        """Load smart contract"""
        try:
            with open(abi_path, 'r') as f:
                abi = json.load(f)

            contract = self.w3.eth.contract(address=address, abi=abi)
            self.contracts[name] = contract
            return contract

        except Exception as e:
            print(f"Failed to load contract {name}: {e}")
            return None

    async def create_identity(self, username: str, did: str) -> Dict[str, Any]:
        """Create decentralized identity"""
        if not self.is_connected() or 'IdentityRegistry' not in self.contracts:
            raise Exception("Blockchain not connected or contract not loaded")

        contract = self.contracts['IdentityRegistry']

        # Build transaction
        tx = contract.functions.createIdentity(did, username).build_transaction({
            'from': self.account.address,
            'gas': 200000,
            'gasPrice': await self.get_gas_price(),
            'nonce': self.w3.eth.get_transaction_count(self.account.address)
        })

        # Sign and send transaction
        signed_tx = self.w3.eth.account.sign_transaction(tx, self.account.key)
        tx_hash = self.w3.eth.send_raw_transaction(signed_tx.rawTransaction)

        # Wait for transaction receipt
        receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)

        return {
            'tx_hash': tx_hash.hex(),
            'block_number': receipt.blockNumber,
            'status': receipt.status,
            'did': did
        }

    async def get_identity(self, address: str) -> Optional[Dict[str, Any]]:
        """Get identity information"""
        if not self.is_connected() or 'IdentityRegistry' not in self.contracts:
            return None

        contract = self.contracts['IdentityRegistry']

        try:
            identity = contract.functions.getIdentity(address).call()
            return {
                'address': address,
                'did': identity[0],
                'username': identity[1],
                'reputation_score': identity[2],
                'is_verified': identity[3],
                'created_at': identity[4]
            }
        except Exception:
            return None

    async def is_identity_verified(self, address: str) -> bool:
        """Check if identity is verified"""
        if not self.is_connected() or 'IdentityRegistry' not in self.contracts:
            return False

        contract = self.contracts['IdentityRegistry']

        try:
            return contract.functions.isVerified(address).call()
        except Exception:
            return False

    async def create_loan(self, borrower: str, amount: float, interest_rate: float,
                         duration: int) -> Dict[str, Any]:
        """Create a loan on blockchain"""
        if not self.is_connected() or 'LoanManager' not in self.contracts:
            raise Exception("Blockchain not connected or contract not loaded")

        contract = self.contracts['LoanManager']

        # Convert amount to wei (assuming 18 decimals)
        amount_wei = self.w3.to_wei(amount, 'ether')

        # Build transaction
        tx = contract.functions.createLoan(
            borrower,
            amount_wei,
            int(interest_rate * 100),  # Store as basis points
            duration
        ).build_transaction({
            'from': self.account.address,
            'gas': 300000,
            'gasPrice': await self.get_gas_price(),
            'nonce': self.w3.eth.get_transaction_count(self.account.address)
        })

        # Sign and send transaction
        signed_tx = self.w3.eth.account.sign_transaction(tx, self.account.key)
        tx_hash = self.w3.eth.send_raw_transaction(signed_tx.rawTransaction)

        # Wait for transaction receipt
        receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)

        return {
            'tx_hash': tx_hash.hex(),
            'loan_id': receipt.logs[0].topics[1].hex() if receipt.logs else None,
            'block_number': receipt.blockNumber,
            'status': receipt.status
        }

    async def repay_loan(self, loan_id: int, amount: float) -> Dict[str, Any]:
        """Repay loan on blockchain"""
        if not self.is_connected() or 'LoanManager' not in self.contracts:
            raise Exception("Blockchain not connected or contract not loaded")

        contract = self.contracts['LoanManager']

        # Convert amount to wei
        amount_wei = self.w3.to_wei(amount, 'ether')

        # Build transaction
        tx = contract.functions.repayLoan(loan_id).build_transaction({
            'from': self.account.address,
            'value': amount_wei,
            'gas': 200000,
            'gasPrice': await self.get_gas_price(),
            'nonce': self.w3.eth.get_transaction_count(self.account.address)
        })

        # Sign and send transaction
        signed_tx = self.w3.eth.account.sign_transaction(tx, self.account.key)
        tx_hash = self.w3.eth.send_raw_transaction(signed_tx.rawTransaction)

        # Wait for transaction receipt
        receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)

        return {
            'tx_hash': tx_hash.hex(),
            'block_number': receipt.blockNumber,
            'status': receipt.status
        }

    async def get_loan_details(self, loan_id: int) -> Optional[Dict[str, Any]]:
        """Get loan details from blockchain"""
        if not self.is_connected() or 'LoanManager' not in self.contracts:
            return None

        contract = self.contracts['LoanManager']

        try:
            loan = contract.functions.getLoan(loan_id).call()
            return {
                'loan_id': loan_id,
                'borrower': loan[0],
                'amount': self.w3.from_wei(loan[1], 'ether'),
                'interest_rate': loan[2] / 100,  # Convert from basis points
                'duration': loan[3],
                'status': loan[4],
                'created_at': loan[5],
                'repaid_amount': self.w3.from_wei(loan[6], 'ether')
            }
        except Exception:
            return None

    async def mint_carbon_tokens(self, recipient: str, amount: float,
                               verification_proof: str) -> Dict[str, Any]:
        """Mint carbon tokens"""
        if not self.is_connected() or 'CarbonToken' not in self.contracts:
            raise Exception("Blockchain not connected or contract not loaded")

        contract = self.contracts['CarbonToken']

        # Convert amount to token units (assuming 18 decimals)
        amount_units = int(amount * (10 ** 18))

        # Build transaction
        tx = contract.functions.mintCarbonTokens(
            recipient,
            amount_units,
            verification_proof
        ).build_transaction({
            'from': self.account.address,
            'gas': 200000,
            'gasPrice': await self.get_gas_price(),
            'nonce': self.w3.eth.get_transaction_count(self.account.address)
        })

        # Sign and send transaction
        signed_tx = self.w3.eth.account.sign_transaction(tx, self.account.key)
        tx_hash = self.w3.eth.send_raw_transaction(signed_tx.rawTransaction)

        # Wait for transaction receipt
        receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)

        return {
            'tx_hash': tx_hash.hex(),
            'block_number': receipt.blockNumber,
            'status': receipt.status,
            'amount': amount
        }

    async def get_carbon_balance(self, address: str) -> float:
        """Get carbon token balance"""
        if not self.is_connected() or 'CarbonToken' not in self.contracts:
            return 0.0

        contract = self.contracts['CarbonToken']

        try:
            balance = contract.functions.balanceOf(address).call()
            return balance / (10 ** 18)  # Convert from wei
        except Exception:
            return 0.0

    async def create_marketplace_listing(self, seller: str, token_id: int,
                                       price: float, metadata_uri: str) -> Dict[str, Any]:
        """Create marketplace listing"""
        if not self.is_connected() or 'MarketplaceEscrow' not in self.contracts:
            raise Exception("Blockchain not connected or contract not loaded")

        contract = self.contracts['MarketplaceEscrow']

        # Convert price to wei
        price_wei = self.w3.to_wei(price, 'ether')

        # Build transaction
        tx = contract.functions.createListing(
            token_id,
            price_wei,
            metadata_uri
        ).build_transaction({
            'from': seller,
            'gas': 250000,
            'gasPrice': await self.get_gas_price(),
            'nonce': self.w3.eth.get_transaction_count(seller)
        })

        # Sign and send transaction (would need seller's private key in production)
        # For now, assume we have access to seller's key
        signed_tx = self.w3.eth.account.sign_transaction(tx, self.account.key)
        tx_hash = self.w3.eth.send_raw_transaction(signed_tx.rawTransaction)

        # Wait for transaction receipt
        receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)

        return {
            'tx_hash': tx_hash.hex(),
            'listing_id': receipt.logs[0].topics[1].hex() if receipt.logs else None,
            'block_number': receipt.blockNumber,
            'status': receipt.status
        }

# Global blockchain service instance
blockchain_service = BlockchainService()