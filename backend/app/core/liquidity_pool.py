import asyncio
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from decimal import Decimal
import structlog

from .blockchain import blockchain_service
from .cache import cache
from .token_manager import token_manager
from ..database.config import get_db
from ..database.models import User, LiquidityPosition, PoolReward

logger = structlog.get_logger()

class LiquidityPoolManager:
    """Comprehensive liquidity pool management for AgriCredit platform"""

    def __init__(self):
        self.supported_tokens = ['agricredit', 'carbon', 'yield']

    async def create_pool(self, token_a: str, token_b: str, fee: int = 30) -> Dict[str, Any]:
        """Create a new liquidity pool"""
        try:
            # Validate tokens
            if token_a not in self.supported_tokens or token_b not in self.supported_tokens:
                raise ValueError(f"Unsupported token pair: {token_a}/{token_b}")

            # Create pool on blockchain (this would be implemented in the contract)
            # For now, we'll track pool creation in database
            db = next(get_db())

            # Check if pool already exists
            existing_pool = db.query(LiquidityPosition).filter(
                LiquidityPosition.token_a == token_a,
                LiquidityPosition.token_b == token_b
            ).first()

            if existing_pool:
                raise ValueError(f"Pool {token_a}/{token_b} already exists")

            # Create pool record
            db = next(get_db())
            pool = LiquidityPosition(
                user_address="system",  # System-created pool
                token_a=token_a,
                token_b=token_b,
                amount_a=0,
                amount_b=0,
                liquidity_tokens=0,
                fee=fee,
                pool_address=f"{token_a}_{token_b}_{fee}"  # Mock pool address
            )
            db.add(pool)
            db.commit()
            db.refresh(pool)

            logger.info("Liquidity pool created",
                       token_a=token_a, token_b=token_b, fee=fee,
                       pool_address=pool.pool_address)

            return {
                'pool_address': pool.pool_address,
                'token_a': token_a,
                'token_b': token_b,
                'fee': fee,
                'status': 'created'
            }

        except Exception as e:
            logger.error("Pool creation failed",
                        token_a=token_a, token_b=token_b, error=str(e))
            raise

    async def add_liquidity(self, user_address: str, token_a: str, token_b: str,
                          amount_a: float, amount_b: float, slippage: float = 0.5) -> Dict[str, Any]:
        """Add liquidity to an existing pool"""
        try:
            # Find the pool
            db = next(get_db())
            pool = db.query(LiquidityPosition).filter(
                LiquidityPosition.token_a == token_a,
                LiquidityPosition.token_b == token_b,
                LiquidityPosition.user_address == "system"  # System pool
            ).first()

            if not pool:
                raise ValueError(f"Pool {token_a}/{token_b} does not exist")

            # Calculate optimal amounts (simplified - in production use AMM math)
            if pool.amount_a > 0 and pool.amount_b > 0:
                # Maintain ratio
                ratio = pool.amount_b / pool.amount_a
                optimal_amount_b = amount_a * ratio

                if abs(optimal_amount_b - amount_b) / optimal_amount_b > slippage:
                    raise ValueError(f"Slippage too high. Expected: {optimal_amount_b}, Got: {amount_b}")

                amount_b = optimal_amount_b

            # Calculate liquidity tokens to mint (simplified)
            total_liquidity = pool.amount_a + pool.amount_b
            liquidity_tokens = (amount_a + amount_b) / max(total_liquidity, 1) * 1000

            # Add liquidity on blockchain
            result_a = await blockchain_service.add_liquidity(token_a, amount_a)
            result_b = await blockchain_service.add_liquidity(token_b, amount_b)

            # Create position record
            position = LiquidityPosition(
                user_address=user_address,
                token_a=token_a,
                token_b=token_b,
                amount_a=amount_a,
                amount_b=amount_b,
                liquidity_tokens=liquidity_tokens,
                fee=pool.fee,
                pool_address=pool.pool_address
            )
            db.add(position)

            # Update pool totals
            pool.amount_a += amount_a
            pool.amount_b += amount_b
            pool.liquidity_tokens += liquidity_tokens

            db.commit()

            # Cache position data
            await self._cache_liquidity_position(position)

            logger.info("Liquidity added",
                       user=user_address, token_a=token_a, token_b=token_b,
                       amount_a=amount_a, amount_b=amount_b,
                       liquidity_tokens=liquidity_tokens)

            return {
                'position_id': position.id,
                'liquidity_tokens': liquidity_tokens,
                'amount_a': amount_a,
                'amount_b': amount_b,
                'tx_hash_a': result_a.get('tx_hash'),
                'tx_hash_b': result_b.get('tx_hash'),
                'status': 'added'
            }

        except Exception as e:
            logger.error("Add liquidity failed",
                        user=user_address, token_a=token_a, token_b=token_b, error=str(e))
            raise

    async def remove_liquidity(self, user_address: str, position_id: int,
                             liquidity_tokens: float) -> Dict[str, Any]:
        """Remove liquidity from a pool"""
        try:
            db = next(get_db())
            position = db.query(LiquidityPosition).filter(
                LiquidityPosition.id == position_id,
                LiquidityPosition.user_address == user_address
            ).first()

            if not position:
                raise ValueError(f"Position {position_id} not found for user {user_address}")

            if liquidity_tokens > position.liquidity_tokens:
                raise ValueError("Insufficient liquidity tokens")

            # Calculate amounts to return
            total_pool_a = position.amount_a
            total_pool_b = position.amount_b
            total_liquidity = position.liquidity_tokens

            amount_a_return = (liquidity_tokens / total_liquidity) * total_pool_a
            amount_b_return = (liquidity_tokens / total_liquidity) * total_pool_b

            # Remove liquidity on blockchain
            result_a = await blockchain_service.remove_liquidity(position.token_a, amount_a_return)
            result_b = await blockchain_service.remove_liquidity(position.token_b, amount_b_return)

            # Update position
            position.amount_a -= amount_a_return
            position.amount_b -= amount_b_return
            position.liquidity_tokens -= liquidity_tokens

            # Update pool totals
            pool = db.query(LiquidityPosition).filter(
                LiquidityPosition.pool_address == position.pool_address,
                LiquidityPosition.user_address == "system"
            ).first()

            if pool:
                pool.amount_a -= amount_a_return
                pool.amount_b -= amount_b_return
                pool.liquidity_tokens -= liquidity_tokens

            db.commit()

            # Clear cache
            await cache.delete(f"liquidity_position:{position_id}")

            logger.info("Liquidity removed",
                       user=user_address, position_id=position_id,
                       liquidity_tokens=liquidity_tokens,
                       amount_a_return=amount_a_return, amount_b_return=amount_b_return)

            return {
                'position_id': position_id,
                'amount_a_returned': amount_a_return,
                'amount_b_returned': amount_b_return,
                'liquidity_tokens_burned': liquidity_tokens,
                'tx_hash_a': result_a.get('tx_hash'),
                'tx_hash_b': result_b.get('tx_hash'),
                'status': 'removed'
            }

        except Exception as e:
            logger.error("Remove liquidity failed",
                        user=user_address, position_id=position_id, error=str(e))
            raise

    async def get_pool_info(self, token_a: str, token_b: str) -> Optional[Dict[str, Any]]:
        """Get pool information"""
        try:
            # Try cache first
            cache_key = f"pool_info:{token_a}_{token_b}"
            cached = await cache.get(cache_key)
            if cached:
                return cached

            db = next(get_db())
            pool = db.query(LiquidityPosition).filter(
                LiquidityPosition.token_a == token_a,
                LiquidityPosition.token_b == token_b,
                LiquidityPosition.user_address == "system"
            ).first()

            if not pool:
                return None

            # Get blockchain pool info
            blockchain_info = await blockchain_service.get_pool_info(f"{token_a}_{token_b}")

            # Calculate pool metrics
            total_value_locked = pool.amount_a + pool.amount_b
            volume_24h = 0  # Would be calculated from transactions
            fees_24h = volume_24h * (pool.fee / 10000)  # Fee in basis points

            pool_info = {
                'pool_address': pool.pool_address,
                'token_a': pool.token_a,
                'token_b': pool.token_b,
                'reserve_a': pool.amount_a,
                'reserve_b': pool.amount_b,
                'total_liquidity': pool.liquidity_tokens,
                'fee': pool.fee,
                'total_value_locked': total_value_locked,
                'volume_24h': volume_24h,
                'fees_24h': fees_24h,
                'blockchain_info': blockchain_info
            }

            # Cache for 5 minutes
            await cache.set(cache_key, pool_info, expire=300)

            return pool_info

        except Exception as e:
            logger.error("Pool info retrieval failed",
                        token_a=token_a, token_b=token_b, error=str(e))
            return None

    async def get_user_positions(self, user_address: str) -> List[Dict[str, Any]]:
        """Get all liquidity positions for a user"""
        try:
            db = next(get_db())
            positions = db.query(LiquidityPosition).filter(
                LiquidityPosition.user_address == user_address,
                LiquidityPosition.user_address != "system"  # Exclude system pools
            ).all()

            result = []
            for position in positions:
                # Calculate current value and rewards
                current_value = await self._calculate_position_value(position)
                pending_rewards = await self._calculate_pending_rewards(position)

                position_data = {
                    'id': position.id,
                    'pool_address': position.pool_address,
                    'token_a': position.token_a,
                    'token_b': position.token_b,
                    'amount_a': position.amount_a,
                    'amount_b': position.amount_b,
                    'liquidity_tokens': position.liquidity_tokens,
                    'current_value': current_value,
                    'pending_rewards': pending_rewards,
                    'created_at': position.created_at.isoformat()
                }
                result.append(position_data)

            return result

        except Exception as e:
            logger.error("User positions retrieval failed", user=user_address, error=str(e))
            return []

    async def claim_rewards(self, user_address: str, position_id: int) -> Dict[str, Any]:
        """Claim accumulated rewards for a position"""
        try:
            db = next(get_db())
            position = db.query(LiquidityPosition).filter(
                LiquidityPosition.id == position_id,
                LiquidityPosition.user_address == user_address
            ).first()

            if not position:
                raise ValueError(f"Position {position_id} not found for user {user_address}")

            # Calculate rewards (simplified - would be more complex in production)
            rewards_amount = await self._calculate_pending_rewards(position)

            if rewards_amount <= 0:
                raise ValueError("No rewards available to claim")

            # Create reward record
            reward = PoolReward(
                position_id=position_id,
                user_address=user_address,
                reward_amount=rewards_amount,
                reward_token='agricredit',  # Assuming rewards in AgriCredit tokens
                claimed_at=datetime.utcnow()
            )
            db.add(reward)
            db.commit()

            # Transfer rewards (would call blockchain function)
            # result = await blockchain_service.transfer_tokens(...)

            logger.info("Rewards claimed",
                       user=user_address, position_id=position_id,
                       rewards_amount=rewards_amount)

            return {
                'position_id': position_id,
                'rewards_claimed': rewards_amount,
                'reward_token': 'agricredit',
                'status': 'claimed'
            }

        except Exception as e:
            logger.error("Reward claiming failed",
                        user=user_address, position_id=position_id, error=str(e))
            raise

    async def get_pool_analytics(self) -> Dict[str, Any]:
        """Get overall pool analytics"""
        try:
            db = next(get_db())

            # Get all pools
            pools = db.query(LiquidityPosition).filter(
                LiquidityPosition.user_address == "system"
            ).all()

            total_value_locked = 0
            total_liquidity_providers = db.query(LiquidityPosition).filter(
                LiquidityPosition.user_address != "system"
            ).count()

            pool_stats = []
            for pool in pools:
                tvl = pool.amount_a + pool.amount_b
                total_value_locked += tvl

                pool_stats.append({
                    'pool_address': pool.pool_address,
                    'token_pair': f"{pool.token_a}/{pool.token_b}",
                    'tvl': tvl,
                    'liquidity_tokens': pool.liquidity_tokens,
                    'fee': pool.fee
                })

            analytics = {
                'total_pools': len(pools),
                'total_value_locked': total_value_locked,
                'total_liquidity_providers': total_liquidity_providers,
                'pools': pool_stats
            }

            return analytics

        except Exception as e:
            logger.error("Pool analytics retrieval failed", error=str(e))
            return {}

    async def _calculate_position_value(self, position: LiquidityPosition) -> float:
        """Calculate current value of a liquidity position"""
        try:
            # Get current token prices
            price_a = await token_manager.get_token_price(position.token_a)
            price_b = await token_manager.get_token_price(position.token_b)

            return (position.amount_a * price_a) + (position.amount_b * price_b)
        except Exception:
            return 0.0

    async def _calculate_pending_rewards(self, position: LiquidityPosition) -> float:
        """Calculate pending rewards for a position"""
        try:
            # Simplified reward calculation - in production this would be more complex
            # Based on time held, pool performance, etc.
            days_held = (datetime.utcnow() - position.created_at).days
            base_reward_rate = 0.001  # 0.1% per day
            rewards = position.liquidity_tokens * base_reward_rate * days_held

            return rewards
        except Exception:
            return 0.0

    async def _cache_liquidity_position(self, position: LiquidityPosition):
        """Cache liquidity position data"""
        # Basic caching - full data will be cached on retrieval
        pass

# Global liquidity pool manager instance
liquidity_pool_manager = LiquidityPoolManager()