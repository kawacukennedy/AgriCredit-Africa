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
            'Reputation': getattr(settings, 'REPUTATION_ADDRESS', '0x0000000000000000000000000000000000000000'),
            'MarketplaceEscrow': getattr(settings, 'MARKETPLACE_ESCROW_ADDRESS', '0x0000000000000000000000000000000000000000'),
            'GovernanceDAO': getattr(settings, 'GOVERNANCE_DAO_ADDRESS', '0x0000000000000000000000000000000000000000'),
            'CarbonToken': getattr(settings, 'CARBON_TOKEN_ADDRESS', '0x0000000000000000000000000000000000000000'),
            'LiquidityPool': getattr(settings, 'LIQUIDITY_POOL_ADDRESS', '0x0000000000000000000000000000000000000000'),
            'YieldToken': getattr(settings, 'YIELD_TOKEN_ADDRESS', '0x0000000000000000000000000000000000000000'),
            'NFTFarming': getattr(settings, 'NFT_FARMING_ADDRESS', '0x0000000000000000000000000000000000000000'),
            'AgriCredit': getattr(settings, 'AGRI_CREDIT_ADDRESS', '0x0000000000000000000000000000000000000000'),
            # New enhanced contracts
            'StakingRewards': getattr(settings, 'STAKING_REWARDS_ADDRESS', '0x0000000000000000000000000000000000000000'),
            'PredictionMarket': getattr(settings, 'PREDICTION_MARKET_ADDRESS', '0x0000000000000000000000000000000000000000'),
            'LendingProtocol': getattr(settings, 'LENDING_PROTOCOL_ADDRESS', '0x0000000000000000000000000000000000000000'),
            'YieldAggregator': getattr(settings, 'YIELD_AGGREGATOR_ADDRESS', '0x0000000000000000000000000000000000000000'),
            'GovernanceToken': getattr(settings, 'GOVERNANCE_TOKEN_ADDRESS', '0x0000000000000000000000000000000000000000'),
            'Bridge': getattr(settings, 'BRIDGE_ADDRESS', '0x0000000000000000000000000000000000000000'),
        }

        # Load ABIs from contracts directory
        contracts_dir = Path(__file__).parent.parent.parent / "contracts"
        abi_files = {
            'IdentityRegistry': 'IdentityRegistry.json',
            'LoanManager': 'LoanManager.json',
            'Reputation': 'Reputation.json',
            'MarketplaceEscrow': 'MarketplaceEscrow.json',
            'GovernanceDAO': 'GovernanceDAO.json',
            'CarbonToken': 'CarbonToken.json',
            'LiquidityPool': 'LiquidityPool.json',
            'YieldToken': 'YieldToken.json',
            'NFTFarming': 'NFTFarming.json',
            'AgriCredit': 'AgriCredit.json',
            # New enhanced contracts
            'StakingRewards': 'StakingRewards.json',
            'PredictionMarket': 'PredictionMarket.json',
            'LendingProtocol': 'LendingProtocol.json',
            'YieldAggregator': 'YieldAggregator.json',
            'GovernanceToken': 'GovernanceToken.json',
            'Bridge': 'Bridge.json',
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

    # Reputation Functions
    async def get_borrower_reputation(self, borrower_address: str) -> Dict[str, Any]:
        """Get borrower reputation from blockchain"""
        return await self.call_contract('Reputation', 'getBorrowerReputation', borrower_address)

    async def calculate_credit_score(self, borrower_address: str) -> int:
        """Calculate credit score from reputation"""
        return await self.call_contract('Reputation', 'calculateCreditScore', borrower_address)

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

    # Additional Loan and Escrow Functions
    async def deploy_loan_contract(self, borrower: str, amount: float, interest_rate: float, duration: int, collateral_token: str, collateral_amount: float) -> Dict[str, Any]:
        """Deploy a new loan contract"""
        try:
            # This would deploy a new loan contract instance
            # For now, return mock data
            return {
                "tx_hash": "0x" + "0" * 64,
                "loan_id": 1,
                "contract_address": "0x" + "1" * 40
            }
        except Exception as e:
            logger.error(f"Deploy loan contract failed: {e}")
            return {"error": str(e)}

    async def transfer_collateral_to_escrow(self, loan_id: int, collateral_token: str, collateral_amount: float, escrow_address: str) -> Dict[str, Any]:
        """Transfer collateral to escrow"""
        try:
            # Transfer collateral tokens to escrow
            amount_wei = self.w3.to_wei(collateral_amount, 'ether')
            result = await self.send_transaction(
                collateral_token, 'transfer', escrow_address, amount_wei
            )
            return result
        except Exception as e:
            logger.error(f"Transfer collateral failed: {e}")
            return {"error": str(e)}

    async def deploy_escrow_contract(self, buyer: str, seller: str, amount: float, token_address: str, listing_id: int) -> Dict[str, Any]:
        """Deploy a new escrow contract"""
        try:
            # This would deploy a new escrow contract instance
            # For now, return mock data
            return {
                "tx_hash": "0x" + "0" * 64,
                "escrow_id": 1,
                "contract_address": "0x" + "2" * 40
            }
        except Exception as e:
            logger.error(f"Deploy escrow contract failed: {e}")
            return {"error": str(e)}

    async def confirm_escrow_delivery(self, escrow_id: int) -> Dict[str, Any]:
        """Confirm delivery for escrow"""
        try:
            result = await self.send_transaction(
                'MarketplaceEscrow', 'confirmDelivery', escrow_id
            )
            return result
        except Exception as e:
            logger.error(f"Confirm escrow delivery failed: {e}")
            return {"error": str(e)}

    async def release_escrow_funds(self, escrow_id: int) -> Dict[str, Any]:
        """Release funds from escrow"""
        try:
            result = await self.send_transaction(
                'MarketplaceEscrow', 'releaseFunds', escrow_id
            )
            return result
        except Exception as e:
            logger.error(f"Release escrow funds failed: {e}")
            return {"error": str(e)}

    # New Enhanced Contract Functions

    # StakingRewards Functions
    async def stake_tokens(self, amount: float, lock_period: int) -> Dict[str, Any]:
        """Stake tokens for rewards"""
        amount_wei = self.w3.to_wei(amount, 'ether')
        return await self.send_transaction('StakingRewards', 'stake', amount_wei, lock_period)

    async def unstake_tokens(self, amount: float) -> Dict[str, Any]:
        """Unstake tokens"""
        amount_wei = self.w3.to_wei(amount, 'ether')
        return await self.send_transaction('StakingRewards', 'unstake', amount_wei)

    async def claim_staking_rewards(self) -> Dict[str, Any]:
        """Claim staking rewards"""
        return await self.send_transaction('StakingRewards', 'claimRewards')

    async def get_staking_info(self, user_address: str) -> Dict[str, Any]:
        """Get staking information"""
        return await self.call_contract('StakingRewards', 'getStakingInfo', user_address)

    # PredictionMarket Functions
    async def create_market(self, question: str, outcomes: List[str], end_time: int, fee: float) -> Dict[str, Any]:
        """Create prediction market"""
        fee_wei = self.w3.to_wei(fee, 'ether')
        return await self.send_transaction('PredictionMarket', 'createMarket', question, outcomes, end_time, fee_wei)

    async def buy_shares(self, market_id: int, outcome: int, amount: float) -> Dict[str, Any]:
        """Buy prediction market shares"""
        amount_wei = self.w3.to_wei(amount, 'ether')
        return await self.send_transaction('PredictionMarket', 'buyShares', market_id, outcome, amount_wei)

    async def sell_shares(self, market_id: int, outcome: int, amount: float) -> Dict[str, Any]:
        """Sell prediction market shares"""
        amount_wei = self.w3.to_wei(amount, 'ether')
        return await self.send_transaction('PredictionMarket', 'sellShares', market_id, outcome, amount_wei)

    async def resolve_market(self, market_id: int, winning_outcome: int) -> Dict[str, Any]:
        """Resolve prediction market"""
        return await self.send_transaction('PredictionMarket', 'resolveMarket', market_id, winning_outcome)

    async def claim_market_payout(self, market_id: int) -> Dict[str, Any]:
        """Claim market payout"""
        return await self.send_transaction('PredictionMarket', 'claimPayout', market_id)

    async def get_market_info(self, market_id: int) -> Dict[str, Any]:
        """Get market information"""
        return await self.call_contract('PredictionMarket', 'getMarket', market_id)

    # LendingProtocol Functions
    async def lend_tokens(self, amount: float, interest_rate: float) -> Dict[str, Any]:
        """Lend tokens in lending protocol"""
        amount_wei = self.w3.to_wei(amount, 'ether')
        rate_basis = int(interest_rate * 100)
        return await self.send_transaction('LendingProtocol', 'lend', amount_wei, rate_basis)

    async def borrow_tokens(self, amount: float, collateral_token: str, collateral_amount: float) -> Dict[str, Any]:
        """Borrow tokens with collateral"""
        amount_wei = self.w3.to_wei(amount, 'ether')
        collateral_wei = self.w3.to_wei(collateral_amount, 'ether')
        return await self.send_transaction('LendingProtocol', 'borrow', amount_wei, collateral_token, collateral_wei)

    async def repay_loan(self, loan_id: int, amount: float) -> Dict[str, Any]:
        """Repay loan in lending protocol"""
        amount_wei = self.w3.to_wei(amount, 'ether')
        return await self.send_transaction('LendingProtocol', 'repay', loan_id, amount_wei)

    async def liquidate_loan(self, loan_id: int) -> Dict[str, Any]:
        """Liquidate loan"""
        return await self.send_transaction('LendingProtocol', 'liquidate', loan_id)

    async def get_loan_info(self, loan_id: int) -> Dict[str, Any]:
        """Get loan information"""
        return await self.call_contract('LendingProtocol', 'getLoan', loan_id)

    # YieldAggregator Functions
    async def create_strategy(self, name: str, description: str, protocols: List[str], allocations: List[int]) -> Dict[str, Any]:
        """Create yield aggregation strategy"""
        return await self.send_transaction('YieldAggregator', 'createStrategy', name, description, protocols, allocations)

    async def deposit_to_strategy(self, strategy_id: int, amount: float) -> Dict[str, Any]:
        """Deposit to yield strategy"""
        amount_wei = self.w3.to_wei(amount, 'ether')
        return await self.send_transaction('YieldAggregator', 'deposit', strategy_id, amount_wei)

    async def withdraw_from_strategy(self, strategy_id: int, amount: float) -> Dict[str, Any]:
        """Withdraw from yield strategy"""
        amount_wei = self.w3.to_wei(amount, 'ether')
        return await self.send_transaction('YieldAggregator', 'withdraw', strategy_id, amount_wei)

    async def rebalance_strategy(self, strategy_id: int) -> Dict[str, Any]:
        """Rebalance yield strategy"""
        return await self.send_transaction('YieldAggregator', 'rebalance', strategy_id)

    async def get_strategy_info(self, strategy_id: int) -> Dict[str, Any]:
        """Get strategy information"""
        return await self.call_contract('YieldAggregator', 'getStrategy', strategy_id)

    # GovernanceToken Functions
    async def delegate_votes(self, delegate_address: str) -> Dict[str, Any]:
        """Delegate voting power"""
        return await self.send_transaction('GovernanceToken', 'delegate', delegate_address)

    async def lock_tokens(self, amount: float, duration: int) -> Dict[str, Any]:
        """Lock tokens for voting power boost"""
        amount_wei = self.w3.to_wei(amount, 'ether')
        return await self.send_transaction('GovernanceToken', 'lockTokens', amount_wei, duration)

    async def unlock_tokens(self, amount: float) -> Dict[str, Any]:
        """Unlock tokens"""
        amount_wei = self.w3.to_wei(amount, 'ether')
        return await self.send_transaction('GovernanceToken', 'unlockTokens', amount_wei)

    async def get_voting_power(self, address: str) -> int:
        """Get voting power"""
        return await self.call_contract('GovernanceToken', 'getVotes', address)

    # Bridge Functions
    async def initiate_bridge_transfer(self, amount: float, target_chain: int, recipient: str) -> Dict[str, Any]:
        """Initiate cross-chain bridge transfer"""
        amount_wei = self.w3.to_wei(amount, 'ether')
        return await self.send_transaction('Bridge', 'initiateTransfer', amount_wei, target_chain, recipient)

    async def complete_bridge_transfer(self, transfer_id: int, proof: bytes) -> Dict[str, Any]:
        """Complete cross-chain bridge transfer"""
        return await self.send_transaction('Bridge', 'completeTransfer', transfer_id, proof)

    async def get_bridge_transfer_status(self, transfer_id: int) -> Dict[str, Any]:
        """Get bridge transfer status"""
        return await self.call_contract('Bridge', 'getTransferStatus', transfer_id)

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