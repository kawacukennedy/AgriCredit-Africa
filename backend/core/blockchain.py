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

    async def deploy_loan_contract(self, borrower: str, amount: float, interest_rate: float,
                                  duration: int, collateral_token: str, collateral_amount: float) -> Dict[str, Any]:
        """Deploy loan contract on blockchain"""
        if not self.is_connected() or 'LoanManager' not in self.contracts:
            raise Exception("Blockchain not connected or contract not loaded")

        contract = self.contracts['LoanManager']

        # Convert amounts to wei
        amount_wei = self.w3.to_wei(amount, 'ether')
        collateral_wei = self.w3.to_wei(collateral_amount, 'ether')

        # Build transaction
        tx = contract.functions.createLoan(
            borrower,
            amount_wei,
            int(interest_rate * 100),  # basis points
            duration,
            collateral_token,
            collateral_wei
        ).build_transaction({
            'from': self.account.address,
            'gas': 400000,
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

    async def transfer_collateral_to_escrow(self, loan_id: int, collateral_token: str,
                                          collateral_amount: float, escrow_address: str) -> Dict[str, Any]:
        """Transfer collateral to escrow contract"""
        if not self.is_connected():
            raise Exception("Blockchain not connected")

        # Load ERC20 token contract
        token_contract = self.w3.eth.contract(
            address=self.w3.to_checksum_address(collateral_token),
            abi=[  # ERC20 ABI
                {
                    "constant": False,
                    "inputs": [
                        {"name": "_to", "type": "address"},
                        {"name": "_value", "type": "uint256"}
                    ],
                    "name": "transfer",
                    "outputs": [{"name": "", "type": "bool"}],
                    "type": "function"
                }
            ]
        )

        collateral_wei = self.w3.to_wei(collateral_amount, 'ether')

        # Build transaction
        tx = token_contract.functions.transfer(escrow_address, collateral_wei).build_transaction({
            'from': self.account.address,
            'gas': 100000,
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

    async def deploy_escrow_contract(self, buyer: str, seller: str, amount: float,
                                   token_address: str, listing_id: int) -> Dict[str, Any]:
        """Deploy escrow contract on blockchain"""
        if not self.is_connected() or 'MarketplaceEscrow' not in self.contracts:
            raise Exception("Blockchain not connected or contract not loaded")

        contract = self.contracts['MarketplaceEscrow']

        # Convert amount to wei
        amount_wei = self.w3.to_wei(amount, 'ether')

        # Build transaction
        tx = contract.functions.createEscrow(
            seller,
            amount_wei,
            token_address,
            listing_id,
            ""  # geo_location can be empty for now
        ).build_transaction({
            'from': buyer,
            'gas': 300000,
            'gasPrice': await self.get_gas_price(),
            'nonce': self.w3.eth.get_transaction_count(buyer)
        })

        # Sign and send transaction (would need buyer's private key in production)
        signed_tx = self.w3.eth.account.sign_transaction(tx, self.account.key)
        tx_hash = self.w3.eth.send_raw_transaction(signed_tx.rawTransaction)

        # Wait for transaction receipt
        receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)

        return {
            'tx_hash': tx_hash.hex(),
            'escrow_id': receipt.logs[0].topics[1].hex() if receipt.logs else None,
            'block_number': receipt.blockNumber,
            'status': receipt.status
        }

    async def confirm_escrow_delivery(self, escrow_id: int, delivery_proof: str,
                                    quality_score: int) -> Dict[str, Any]:
        """Confirm delivery on blockchain escrow"""
        if not self.is_connected() or 'MarketplaceEscrow' not in self.contracts:
            raise Exception("Blockchain not connected or contract not loaded")

        contract = self.contracts['MarketplaceEscrow']

        # Build transaction
        tx = contract.functions.confirmDelivery(
            escrow_id,
            delivery_proof,
            quality_score
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
            'status': receipt.status
        }

    async def release_escrow_funds(self, escrow_id: int) -> Dict[str, Any]:
        """Release funds from blockchain escrow"""
        if not self.is_connected() or 'MarketplaceEscrow' not in self.contracts:
            raise Exception("Blockchain not connected or contract not loaded")

        contract = self.contracts['MarketplaceEscrow']

        # Build transaction
        tx = contract.functions.completeEscrow(escrow_id).build_transaction({
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
            'status': receipt.status
        }

    async def initiate_bridge_transfer(self, amount: float, target_chain: int, recipient: str) -> Dict[str, Any]:
        """Initiate cross-chain bridge transfer"""
        if not self.is_connected() or 'Bridge' not in self.contracts:
            raise Exception("Blockchain not connected or bridge contract not loaded")

        contract = self.contracts['Bridge']

        # Convert amount to wei (assuming 18 decimals)
        amount_wei = self.w3.to_wei(amount, 'ether')

        # Build transaction
        tx = contract.functions.bridgeTokens(
            self.contracts.get('AgriCredit', {}).address or '0x0000000000000000000000000000000000000000',  # Token address
            amount_wei,
            target_chain,
            recipient
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
            'bridge_tx_id': receipt.logs[0].topics[1].hex() if receipt.logs else '0x0',  # Extract tx ID from logs
            'block_number': receipt.blockNumber,
            'status': receipt.status,
            'amount': amount,
            'target_chain': target_chain,
            'recipient': recipient
        }

    async def get_bridge_transfer_status(self, transfer_id: int) -> Dict[str, Any]:
        """Get bridge transfer status"""
        if not self.is_connected() or 'Bridge' not in self.contracts:
            raise Exception("Blockchain not connected or bridge contract not loaded")

        contract = self.contracts['Bridge']

        # Get transaction details
        tx_data = await self.w3.eth.call(contract.functions.getTransaction(transfer_id))

        # Parse the returned data (this would need proper ABI decoding)
        # For now, return mock data
        return {
            'transfer_id': transfer_id,
            'status': 'completed',  # Would parse from contract
            'from_chain': self.chain_id,
            'to_chain': 137,  # Example
            'amount': 100.0,
            'recipient': '0x123...',
            'confirmations': 5,
            'required_confirmations': 3,
            'timestamp': 1234567890
        }

    async def confirm_bridge_transfer(self, transfer_id: int, signature: str) -> Dict[str, Any]:
        """Confirm bridge transfer (validator function)"""
        if not self.is_connected() or 'Bridge' not in self.contracts:
            raise Exception("Blockchain not connected or bridge contract not loaded")

        contract = self.contracts['Bridge']

        # Build transaction
        tx = contract.functions.confirmTransaction(
            transfer_id,
            signature
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
            'transfer_id': transfer_id,
            'block_number': receipt.blockNumber,
            'status': receipt.status
        }

    async def get_supported_bridge_chains(self) -> List[Dict[str, Any]]:
        """Get supported chains for bridging"""
        if not self.is_connected() or 'Bridge' not in self.contracts:
            raise Exception("Blockchain not connected or bridge contract not loaded")

        contract = self.contracts['Bridge']

        # Get supported chains from contract
        chains = await self.w3.eth.call(contract.functions.getSupportedChains())

        chain_info = []
        for chain_id in chains:
            config = await self.w3.eth.call(contract.functions.getChainConfig(chain_id))
            chain_info.append({
                'chain_id': chain_id,
                'active': config[3],  # active flag
                'required_confirmations': config[2],
                'total_transferred': config[4]
            })

        return chain_info

    async def estimate_bridge_fee(self, target_chain: int, amount: float) -> Dict[str, Any]:
        """Estimate bridge fee"""
        if not self.is_connected() or 'Bridge' not in self.contracts:
            raise Exception("Blockchain not connected or bridge contract not loaded")

        # Mock fee calculation - in reality would query contract
        base_fee = 0.001  # ETH
        percentage_fee = amount * 0.0005  # 0.05%

        return {
            'base_fee': base_fee,
            'percentage_fee': percentage_fee,
            'total_fee': base_fee + percentage_fee,
            'estimated_time': '10-30 minutes'
        }

# Global blockchain service instance
blockchain_service = BlockchainService()