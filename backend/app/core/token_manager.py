import asyncio
from typing import Dict, List, Any, Optional
from decimal import Decimal
import structlog

from .blockchain import blockchain_service
from .cache import cache
from ..database.config import get_db
from ..database.models import User, CarbonCredit

logger = structlog.get_logger()

class TokenManager:
    """Comprehensive token management for AgriCredit platform"""

    def __init__(self):
        self.supported_tokens = {
            'agricredit': 'AgriCredit',
            'carbon': 'CarbonToken',
            'yield': 'YieldToken'
        }

    async def get_token_balance(self, token_type: str, address: str) -> float:
        """Get token balance for an address"""
        try:
            if token_type == 'agricredit':
                return await blockchain_service.get_agricredit_balance(address)
            elif token_type == 'carbon':
                return await blockchain_service.get_carbon_balance(address)
            elif token_type == 'yield':
                position = await blockchain_service.get_yield_position(address)
                return position.get('amount', 0) / (10 ** 18)  # Convert from wei
            else:
                raise ValueError(f"Unsupported token type: {token_type}")
        except Exception as e:
            logger.error("Token balance retrieval failed",
                        token_type=token_type, address=address, error=str(e))
            return 0.0

    async def transfer_tokens(self, token_type: str, from_address: str,
                            to_address: str, amount: float) -> Dict[str, Any]:
        """Transfer tokens between addresses"""
        try:
            if token_type == 'agricredit':
                return await blockchain_service.transfer_agricredit_tokens(to_address, amount)
            elif token_type == 'carbon':
                return await blockchain_service.transfer_carbon_tokens(to_address, amount)
            else:
                raise ValueError(f"Token type {token_type} does not support direct transfers")
        except Exception as e:
            logger.error("Token transfer failed",
                        token_type=token_type, from_address=from_address,
                        to_address=to_address, amount=amount, error=str(e))
            raise

    async def mint_carbon_tokens(self, user_address: str, amount: float,
                               verification_proof: str) -> Dict[str, Any]:
        """Mint carbon tokens based on verified environmental impact"""
        try:
            # Create database record first
            db = next(get_db())
            carbon_credit = CarbonCredit(
                user_id=self._get_user_id_from_address(user_address),
                amount=amount,
                transaction_type='mint',
                verification_proof=verification_proof
            )
            db.add(carbon_credit)
            db.commit()

            # Mint tokens on blockchain
            result = await blockchain_service.mint_carbon_tokens(
                user_address, amount, verification_proof
            )

            # Update database record with transaction hash
            carbon_credit.transaction_hash = result.get('tx_hash')
            db.commit()

            logger.info("Carbon tokens minted",
                       user_address=user_address, amount=amount,
                       tx_hash=result.get('tx_hash'))

            return result

        except Exception as e:
            logger.error("Carbon token minting failed",
                        user_address=user_address, amount=amount, error=str(e))
            raise

    async def burn_carbon_tokens(self, user_address: str, amount: float) -> Dict[str, Any]:
        """Burn carbon tokens"""
        try:
            # Create database record
            db = next(get_db())
            carbon_credit = CarbonCredit(
                user_id=self._get_user_id_from_address(user_address),
                amount=amount,
                transaction_type='burn'
            )
            db.add(carbon_credit)
            db.commit()

            # Burn tokens on blockchain
            result = await blockchain_service.burn_carbon_tokens(amount)

            # Update database record
            carbon_credit.transaction_hash = result.get('tx_hash')
            db.commit()

            logger.info("Carbon tokens burned",
                       user_address=user_address, amount=amount,
                       tx_hash=result.get('tx_hash'))

            return result

        except Exception as e:
            logger.error("Carbon token burning failed",
                        user_address=user_address, amount=amount, error=str(e))
            raise

    async def stake_tokens(self, token_type: str, user_address: str,
                          amount: float, lock_period: int = 30) -> Dict[str, Any]:
        """Stake tokens for yield farming"""
        try:
            if token_type == 'yield':
                result = await blockchain_service.deposit_yield_tokens(amount)

                # Cache staking information
                staking_info = {
                    'user_address': user_address,
                    'amount': amount,
                    'lock_period': lock_period,
                    'start_time': asyncio.get_event_loop().time(),
                    'tx_hash': result.get('tx_hash')
                }

                await cache.set(f"staking:{user_address}:{result.get('tx_hash')}",
                              staking_info, expire=lock_period * 24 * 3600)  # lock_period in seconds

                logger.info("Tokens staked for yield farming",
                           user_address=user_address, amount=amount,
                           lock_period=lock_period, tx_hash=result.get('tx_hash'))

                return result
            else:
                raise ValueError(f"Token type {token_type} does not support staking")

        except Exception as e:
            logger.error("Token staking failed",
                        token_type=token_type, user_address=user_address,
                        amount=amount, error=str(e))
            raise

    async def unstake_tokens(self, token_type: str, user_address: str,
                           amount: float) -> Dict[str, Any]:
        """Unstake tokens from yield farming"""
        try:
            if token_type == 'yield':
                result = await blockchain_service.withdraw_yield_tokens(amount)

                logger.info("Tokens unstaked from yield farming",
                           user_address=user_address, amount=amount,
                           tx_hash=result.get('tx_hash'))

                return result
            else:
                raise ValueError(f"Token type {token_type} does not support unstaking")

        except Exception as e:
            logger.error("Token unstaking failed",
                        token_type=token_type, user_address=user_address,
                        amount=amount, error=str(e))
            raise

    async def claim_yield_rewards(self, user_address: str) -> Dict[str, Any]:
        """Claim accumulated yield rewards"""
        try:
            result = await blockchain_service.claim_yield()

            logger.info("Yield rewards claimed",
                       user_address=user_address, tx_hash=result.get('tx_hash'))

            return result

        except Exception as e:
            logger.error("Yield reward claiming failed",
                        user_address=user_address, error=str(e))
            raise

    async def get_staking_positions(self, user_address: str) -> List[Dict[str, Any]]:
        """Get all staking positions for a user"""
        try:
            # Get yield farming position
            position = await blockchain_service.get_yield_position(user_address)

            positions = []
            if position and position.get('amount', 0) > 0:
                positions.append({
                    'token_type': 'yield',
                    'amount': position.get('amount', 0) / (10 ** 18),  # Convert from wei
                    'deposit_time': position.get('depositTime', 0),
                    'last_claim_time': position.get('lastClaimTime', 0),
                    'pending_yield': position.get('pendingYield', 0) / (10 ** 18),
                    'total_accumulated': position.get('totalAccumulated', 0) / (10 ** 18)
                })

            return positions

        except Exception as e:
            logger.error("Staking positions retrieval failed",
                        user_address=user_address, error=str(e))
            return []

    async def get_token_price(self, token_type: str) -> float:
        """Get current token price (mock implementation)"""
        # In production, this would query DEX oracles
        mock_prices = {
            'agricredit': 1.0,  # Stable token
            'carbon': 25.50,    # $25.50 per carbon credit
            'yield': 1.05       # $1.05 per yield token
        }

        return mock_prices.get(token_type, 1.0)

    async def calculate_portfolio_value(self, user_address: str) -> Dict[str, Any]:
        """Calculate total portfolio value for a user"""
        try:
            portfolio = {}

            for token_type in self.supported_tokens.keys():
                balance = await self.get_token_balance(token_type, user_address)
                price = await self.get_token_price(token_type)
                value = balance * price

                portfolio[token_type] = {
                    'balance': balance,
                    'price': price,
                    'value': value
                }

            # Calculate total portfolio value
            total_value = sum(token_data['value'] for token_data in portfolio.values())

            return {
                'tokens': portfolio,
                'total_value': total_value,
                'user_address': user_address
            }

        except Exception as e:
            logger.error("Portfolio calculation failed",
                        user_address=user_address, error=str(e))
            return {'error': str(e)}

    async def get_transaction_history(self, user_address: str,
                                    token_type: Optional[str] = None,
                                    limit: int = 50) -> List[Dict[str, Any]]:
        """Get transaction history for a user"""
        try:
            db = next(get_db())

            # Get carbon credit transactions
            query = db.query(CarbonCredit)
            if token_type == 'carbon' or token_type is None:
                carbon_txs = query.filter(CarbonCredit.user_id == self._get_user_id_from_address(user_address)).all()

                transactions = []
                for tx in carbon_txs:
                    transactions.append({
                        'id': tx.id,
                        'token_type': 'carbon',
                        'transaction_type': tx.transaction_type,
                        'amount': tx.amount,
                        'timestamp': tx.created_at.isoformat(),
                        'tx_hash': tx.transaction_hash
                    })

                return transactions[-limit:]  # Return most recent transactions

            return []

        except Exception as e:
            logger.error("Transaction history retrieval failed",
                        user_address=user_address, error=str(e))
            return []

    def _get_user_id_from_address(self, user_address: str) -> int:
        """Get user ID from blockchain address"""
        # This is a simplified implementation
        # In production, you'd have a mapping table
        db = next(get_db())
        user = db.query(User).filter(User.username == user_address).first()
        return user.id if user else 1  # Default to user ID 1 for demo

    async def get_token_stats(self) -> Dict[str, Any]:
        """Get overall token statistics"""
        try:
            # Mock statistics - in production, these would be calculated from blockchain data
            stats = {
                'total_supply': {
                    'agricredit': 1000000,
                    'carbon': 50000,
                    'yield': 200000
                },
                'circulating_supply': {
                    'agricredit': 750000,
                    'carbon': 35000,
                    'yield': 150000
                },
                'market_cap': {
                    'agricredit': 750000,
                    'carbon': 892500,
                    'yield': 157500
                },
                'transactions_24h': {
                    'agricredit': 1250,
                    'carbon': 89,
                    'yield': 456
                }
            }

            return stats

        except Exception as e:
            logger.error("Token stats retrieval failed", error=str(e))
            return {}

# Global token manager instance
token_manager = TokenManager()