import asyncio
import json
import structlog
from typing import Dict, Any, List, Optional, Union
from datetime import datetime, timedelta
from decimal import Decimal
import os
from pathlib import Path

from web3 import Web3, AsyncWeb3
from web3.contract import Contract
from web3.exceptions import ContractLogicError, TransactionNotFound
from eth_account import Account
from eth_account.signers.local import LocalAccount

from .config import settings
from .cache import cache
from .monitoring import record_blockchain_transaction
from ..database.config import get_db
from ..database.models import User, Loan, CarbonCredit, Notification

logger = structlog.get_logger()

class BlockchainService:
    """Comprehensive blockchain service for AgriCredit platform"""

    def __init__(self):
        self.w3 = None
        self.contracts = {}
        self.account = None
        self.chain_id = None
        self.contract_abis = {}
        self.contract_addresses = {}

        # Initialize blockchain connection
        self._initialize_blockchain()

    def _initialize_blockchain(self):
        """Initialize blockchain connection and contracts"""
        try:
            # Connect to blockchain
            if settings.BLOCKCHAIN_RPC_URL:
                self.w3 = Web3(Web3.HTTPProvider(settings.BLOCKCHAIN_RPC_URL))
            else:
                # Fallback to local development
                self.w3 = Web3(Web3.HTTPProvider("http://localhost:8545"))

            if not self.w3.is_connected():
                logger.error("Failed to connect to blockchain")
                return

            self.chain_id = self.w3.eth.chain_id
            logger.info("Connected to blockchain", chain_id=self.chain_id)

            # Load contract ABIs and addresses
            self._load_contracts()

            # Set up account for transactions
            if settings.BLOCKCHAIN_PRIVATE_KEY:
                self.account = Account.from_key(settings.BLOCKCHAIN_PRIVATE_KEY)
                logger.info("Blockchain account configured", address=self.account.address)

        except Exception as e:
            logger.error("Blockchain initialization failed", error=str(e))

    def _load_contracts(self):
        """Load contract ABIs and addresses"""
        # Contract addresses - these would typically come from environment or deployment scripts
        self.contract_addresses = {
            'IdentityRegistry': getattr(settings, 'IDENTITY_REGISTRY_ADDRESS', '0x0000000000000000000000000000000000000000'),
            'LoanManager': getattr(settings, 'LOAN_MANAGER_ADDRESS', '0x0000000000000000000000000000000000000000'),
            'MarketplaceEscrow': getattr(settings, 'MARKETPLACE_ESCROW_ADDRESS', '0x0000000000000000000000000000000000000000'),
            'GovernanceDAO': getattr(settings, 'GOVERNANCE_DAO_ADDRESS', '0x0000000000000000000000000000000000000000'),
            'CarbonToken': getattr(settings, 'CARBON_TOKEN_ADDRESS', '0x0000000000000000000000000000000000000000'),
            'LiquidityPool': getattr(settings, 'LIQUIDITY_POOL_ADDRESS', '0x0000000000000000000000000000000000000000'),
            'YieldToken': getattr(settings, 'YIELD_TOKEN_ADDRESS', '0x0000000000000000000000000000000000000000'),
            'NFTFarming': getattr(settings, 'NFT_FARMING_ADDRESS', '0x0000000000000000000000000000000000000000'),
            'AgriCredit': getattr(settings, 'AGRI_CREDIT_ADDRESS', '0x0000000000000000000000000000000000000000'),
        }

        # Load ABIs from contracts directory
        contracts_dir = Path(__file__).parent.parent.parent / "contracts"
        abi_files = {
            'IdentityRegistry': 'IdentityRegistry.json',
            'LoanManager': 'LoanManager.json',
            'MarketplaceEscrow': 'MarketplaceEscrow.json',
            'GovernanceDAO': 'GovernanceDAO.json',
            'CarbonToken': 'CarbonToken.json',
            'LiquidityPool': 'LiquidityPool.json',
            'YieldToken': 'YieldToken.json',
            'NFTFarming': 'NFTFarming.json',
            'AgriCredit': 'AgriCredit.json',
        }

        for contract_name, abi_file in abi_files.items():
            abi_path = contracts_dir / abi_file
            if abi_path.exists():
                try:
                    with open(abi_path, 'r') as f:
                        contract_data = json.load(f)
                        self.contract_abis[contract_name] = contract_data['abi']
                        logger.info(f"Loaded ABI for {contract_name}")
                except Exception as e:
                    logger.error(f"Failed to load ABI for {contract_name}", error=str(e))
            else:
                logger.warning(f"ABI file not found: {abi_file}")

    def get_contract(self, contract_name: str) -> Optional[Contract]:
        """Get contract instance"""
        if contract_name not in self.contract_addresses or contract_name not in self.contract_abis:
            return None

        if contract_name not in self.contracts:
            try:
                self.contracts[contract_name] = self.w3.eth.contract(
                    address=self.contract_addresses[contract_name],
                    abi=self.contract_abis[contract_name]
                )
            except Exception as e:
                logger.error(f"Failed to create contract instance for {contract_name}", error=str(e))
                return None

        return self.contracts[contract_name]

    async def send_transaction(self, contract_name: str, function_name: str, *args, **kwargs) -> Dict[str, Any]:
        """Send transaction to blockchain"""
        if not self.account or not self.w3:
            raise Exception("Blockchain not properly configured")

        contract = self.get_contract(contract_name)
        if not contract:
            raise Exception(f"Contract {contract_name} not available")

        try:
            # Build transaction
            nonce = self.w3.eth.get_transaction_count(self.account.address)
            gas_price = self.w3.eth.gas_price

            # Get function
            contract_function = getattr(contract.functions, function_name)
            tx_data = contract_function(*args).build_transaction({
                'from': self.account.address,
                'nonce': nonce,
                'gasPrice': gas_price,
                'chainId': self.chain_id
            })

            # Estimate gas
            try:
                gas_estimate = self.w3.eth.estimate_gas(tx_data)
                tx_data['gas'] = int(gas_estimate * 1.1)  # Add 10% buffer
            except Exception as e:
                logger.warning("Gas estimation failed, using default", error=str(e))
                tx_data['gas'] = 200000

            # Sign and send transaction
            signed_tx = self.account.sign_transaction(tx_data)
            tx_hash = self.w3.eth.send_raw_transaction(signed_tx.rawTransaction)

            # Wait for transaction receipt
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)

            # Record transaction
            record_blockchain_transaction(contract_name, function_name)

            logger.info("Transaction sent successfully",
                       contract=contract_name,
                       function=function_name,
                       tx_hash=tx_hash.hex(),
                       block=receipt.blockNumber)

            return {
                'success': True,
                'tx_hash': tx_hash.hex(),
                'block_number': receipt.blockNumber,
                'gas_used': receipt.gasUsed,
                'status': receipt.status
            }

        except Exception as e:
            logger.error("Transaction failed",
                        contract=contract_name,
                        function=function_name,
                        error=str(e))
            raise Exception(f"Transaction failed: {str(e)}")

    async def call_contract(self, contract_name: str, function_name: str, *args) -> Any:
        """Call contract function (read-only)"""
        contract = self.get_contract(contract_name)
        if not contract:
            raise Exception(f"Contract {contract_name} not available")

        try:
            contract_function = getattr(contract.functions, function_name)
            result = contract_function(*args).call()
            return result
        except Exception as e:
            logger.error("Contract call failed",
                        contract=contract_name,
                        function=function_name,
                        error=str(e))
            raise Exception(f"Contract call failed: {str(e)}")

    # Identity Registry Functions
    async def create_identity(self, user_address: str, did: str) -> Dict[str, Any]:
        """Create identity on blockchain"""
        return await self.send_transaction('IdentityRegistry', 'createIdentity', did, user_address)

    async def get_identity(self, user_address: str) -> Dict[str, Any]:
        """Get identity information"""
        return await self.call_contract('IdentityRegistry', 'getIdentity', user_address)

    async def is_identity_verified(self, user_address: str) -> bool:
        """Check if identity is verified"""
        return await self.call_contract('IdentityRegistry', 'isIdentityVerified', user_address)

    # Loan Manager Functions
    async def create_loan(self, borrower: str, amount: float, interest_rate: float, duration: int) -> Dict[str, Any]:
        """Create loan on blockchain"""
        amount_wei = self.w3.to_wei(amount, 'ether')
        interest_rate_basis = int(interest_rate * 100)  # Convert to basis points

        return await self.send_transaction('LoanManager', 'createLoan',
                                         borrower, amount_wei, interest_rate_basis, duration)

    async def repay_loan(self, loan_id: int, amount: float) -> Dict[str, Any]:
        """Repay loan on blockchain"""
        amount_wei = self.w3.to_wei(amount, 'ether')
        return await self.send_transaction('LoanManager', 'repayLoan', loan_id, amount_wei)

    async def get_loan_details(self, loan_id: int) -> Dict[str, Any]:
        """Get loan details from blockchain"""
        return await self.call_contract('LoanManager', 'getLoan', loan_id)

    async def get_user_loans(self, user_address: str) -> List[Dict[str, Any]]:
        """Get user's loans from blockchain"""
        return await self.call_contract('LoanManager', 'getUserLoans', user_address)

    # Carbon Token Functions
    async def mint_carbon_tokens(self, to: str, amount: float, verification_proof: str) -> Dict[str, Any]:
        """Mint carbon tokens"""
        amount_wei = self.w3.to_wei(amount, 'ether')
        return await self.send_transaction('CarbonToken', 'mintCarbonTokens', to, amount_wei, verification_proof)

    async def burn_carbon_tokens(self, amount: float) -> Dict[str, Any]:
        """Burn carbon tokens"""
        amount_wei = self.w3.to_wei(amount, 'ether')
        return await self.send_transaction('CarbonToken', 'burnCarbonTokens', amount_wei)

    async def get_carbon_balance(self, address: str) -> float:
        """Get carbon token balance"""
        balance_wei = await self.call_contract('CarbonToken', 'balanceOf', address)
        return float(self.w3.from_wei(balance_wei, 'ether'))

    async def transfer_carbon_tokens(self, to: str, amount: float) -> Dict[str, Any]:
        """Transfer carbon tokens"""
        amount_wei = self.w3.to_wei(amount, 'ether')
        return await self.send_transaction('CarbonToken', 'transfer', to, amount_wei)

    # Governance DAO Functions
    async def create_proposal(self, description: str) -> Dict[str, Any]:
        """Create governance proposal"""
        return await self.send_transaction('GovernanceDAO', 'propose', description)

    async def vote_on_proposal(self, proposal_id: int, support: bool) -> Dict[str, Any]:
        """Vote on governance proposal"""
        return await self.send_transaction('GovernanceDAO', 'vote', proposal_id, support)

    async def execute_proposal(self, proposal_id: int) -> Dict[str, Any]:
        """Execute governance proposal"""
        return await self.send_transaction('GovernanceDAO', 'executeProposal', proposal_id)

    async def get_proposal(self, proposal_id: int) -> Dict[str, Any]:
        """Get proposal details"""
        return await self.call_contract('GovernanceDAO', 'getProposal', proposal_id)

    # NFT Farming Functions
    async def mint_farm_nft(self, farmer: str, farm_name: str, location: str,
                           size: float, crop_type: str, expected_yield: float,
                           metadata_uri: str) -> Dict[str, Any]:
        """Mint farm NFT"""
        return await self.send_transaction('NFTFarming', 'mintFarmNFT',
                                         farmer, farm_name, location, int(size * 100),
                                         crop_type, int(expected_yield * 100), metadata_uri)

    async def record_harvest(self, token_id: int, actual_yield: float) -> Dict[str, Any]:
        """Record harvest for NFT"""
        return await self.send_transaction('NFTFarming', 'recordHarvest', token_id, int(actual_yield * 100))

    async def get_farm_nft(self, token_id: int) -> Dict[str, Any]:
        """Get farm NFT details"""
        return await self.call_contract('NFTFarming', 'getFarmNFT', token_id)

    async def get_farmer_nfts(self, farmer: str) -> List[Dict[str, Any]]:
        """Get farmer's NFTs"""
        return await self.call_contract('NFTFarming', 'getFarmerNFTs', farmer)

    # Yield Token Functions
    async def deposit_yield_tokens(self, amount: float) -> Dict[str, Any]:
        """Deposit tokens for yield farming"""
        amount_wei = self.w3.to_wei(amount, 'ether')
        return await self.send_transaction('YieldToken', 'deposit', amount_wei)

    async def withdraw_yield_tokens(self, amount: float) -> Dict[str, Any]:
        """Withdraw tokens from yield farming"""
        amount_wei = self.w3.to_wei(amount, 'ether')
        return await self.send_transaction('YieldToken', 'withdraw', amount_wei)

    async def claim_yield(self) -> Dict[str, Any]:
        """Claim accumulated yield"""
        return await self.send_transaction('YieldToken', 'claimYield')

    async def get_yield_position(self, user_address: str) -> Dict[str, Any]:
        """Get yield farming position"""
        return await self.call_contract('YieldToken', 'getPosition', user_address)

    # Liquidity Pool Functions
    async def add_liquidity(self, token_address: str, amount: float) -> Dict[str, Any]:
        """Add liquidity to pool"""
        amount_wei = self.w3.to_wei(amount, 'ether')
        return await self.send_transaction('LiquidityPool', 'addLiquidity', token_address, amount_wei)

    async def remove_liquidity(self, token_address: str, amount: float) -> Dict[str, Any]:
        """Remove liquidity from pool"""
        amount_wei = self.w3.to_wei(amount, 'ether')
        return await self.send_transaction('LiquidityPool', 'removeLiquidity', token_address, amount_wei)

    async def get_pool_info(self, token_address: str) -> Dict[str, Any]:
        """Get liquidity pool information"""
        return await self.call_contract('LiquidityPool', 'getPoolInfo', token_address)

    # Marketplace Escrow Functions
    async def create_escrow(self, seller: str, amount: float, token_address: str) -> Dict[str, Any]:
        """Create marketplace escrow"""
        amount_wei = self.w3.to_wei(amount, 'ether')
        return await self.send_transaction('MarketplaceEscrow', 'createEscrow', seller, amount_wei, token_address)

    async def fund_escrow(self, escrow_id: int) -> Dict[str, Any]:
        """Fund escrow"""
        return await self.send_transaction('MarketplaceEscrow', 'fundEscrow', escrow_id)

    async def confirm_delivery(self, escrow_id: int, proof: str) -> Dict[str, Any]:
        """Confirm delivery and release funds"""
        return await self.send_transaction('MarketplaceEscrow', 'confirmDelivery', escrow_id, proof)

    # AgriCredit Token Functions
    async def get_agricredit_balance(self, address: str) -> float:
        """Get AgriCredit token balance"""
        balance_wei = await self.call_contract('AgriCredit', 'balanceOf', address)
        return float(self.w3.from_wei(balance_wei, 'ether'))

    async def transfer_agricredit_tokens(self, to: str, amount: float) -> Dict[str, Any]:
        """Transfer AgriCredit tokens"""
        amount_wei = self.w3.to_wei(amount, 'ether')
        return await self.send_transaction('AgriCredit', 'transfer', to, amount_wei)

    # Utility Functions
    def is_connected(self) -> bool:
        """Check if blockchain is connected"""
        return self.w3 is not None and self.w3.is_connected()

    def get_chain_id(self) -> Optional[int]:
        """Get current chain ID"""
        return self.chain_id

    def get_account_address(self) -> Optional[str]:
        """Get account address"""
        return self.account.address if self.account else None

    async def get_gas_price(self) -> int:
        """Get current gas price"""
        if not self.w3:
            return 20000000000  # 20 gwei default
        return self.w3.eth.gas_price

    async def estimate_gas(self, tx_data: Dict[str, Any]) -> int:
        """Estimate gas for transaction"""
        if not self.w3:
            return 200000
        try:
            return self.w3.eth.estimate_gas(tx_data)
        except Exception:
            return 200000

# Global blockchain service instance
blockchain_service = BlockchainService()