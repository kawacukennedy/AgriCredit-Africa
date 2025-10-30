import asyncio
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from decimal import Decimal
import structlog

from .blockchain import blockchain_service
from .cache import cache
from ..database.config import get_db
from ..database.models import CrossChainTransaction

logger = structlog.get_logger()

class CrossChainBridge:
    """Cross-chain bridge for multi-chain token transfers"""

    def __init__(self):
        # Supported chains and their configurations
        self.supported_chains = {
            'ethereum': {
                'chain_id': 1,
                'name': 'Ethereum',
                'native_token': 'ETH',
                'rpc_url': 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY'
            },
            'polygon': {
                'chain_id': 137,
                'name': 'Polygon',
                'native_token': 'MATIC',
                'rpc_url': 'https://polygon-rpc.com'
            },
            'bsc': {
                'chain_id': 56,
                'name': 'Binance Smart Chain',
                'native_token': 'BNB',
                'rpc_url': 'https://bsc-dataseed.binance.org'
            },
            'arbitrum': {
                'chain_id': 42161,
                'name': 'Arbitrum One',
                'native_token': 'ETH',
                'rpc_url': 'https://arb1.arbitrum.io/rpc'
            },
            'optimism': {
                'chain_id': 10,
                'name': 'Optimism',
                'native_token': 'ETH',
                'rpc_url': 'https://mainnet.optimism.io'
            }
        }

        # Bridge fees (in USD)
        self.bridge_fees = {
            'ethereum-polygon': 5.0,
            'ethereum-bsc': 8.0,
            'ethereum-arbitrum': 2.0,
            'ethereum-optimism': 2.0,
            'polygon-bsc': 3.0,
            'polygon-arbitrum': 4.0,
            'polygon-optimism': 4.0,
            'bsc-arbitrum': 6.0,
            'bsc-optimism': 6.0,
            'arbitrum-optimism': 1.0
        }

        # Estimated transfer times (in minutes)
        self.transfer_times = {
            'ethereum-polygon': 15,
            'ethereum-bsc': 20,
            'ethereum-arbitrum': 5,
            'ethereum-optimism': 5,
            'polygon-bsc': 10,
            'polygon-arbitrum': 12,
            'polygon-optimism': 12,
            'bsc-arbitrum': 15,
            'bsc-optimism': 15,
            'arbitrum-optimism': 3
        }

    async def initiate_bridge_transfer(self, user_address: str, from_chain: str,
                                     to_chain: str, token_symbol: str, amount: float,
                                     recipient_address: Optional[str] = None) -> Dict[str, Any]:
        """Initiate a cross-chain token transfer"""
        try:
            # Validate chains
            if from_chain not in self.supported_chains or to_chain not in self.supported_chains:
                raise ValueError(f"Unsupported chain combination: {from_chain} -> {to_chain}")

            if from_chain == to_chain:
                raise ValueError("Cannot bridge to the same chain")

            # Calculate bridge fee
            bridge_key = f"{from_chain}-{to_chain}"
            fee = self.bridge_fees.get(bridge_key, 10.0)  # Default fee

            # Calculate estimated completion time
            estimated_time = self.transfer_times.get(bridge_key, 30)

            # Recipient address defaults to sender if not provided
            recipient = recipient_address or user_address

            # Create database record
            db = next(get_db())
            bridge_tx = CrossChainTransaction(
                user_address=user_address,
                from_chain=from_chain,
                to_chain=to_chain,
                token_symbol=token_symbol,
                amount=amount,
                recipient_address=recipient,
                bridge_fee=fee,
                status='initiated',
                estimated_completion=datetime.utcnow() + timedelta(minutes=estimated_time)
            )
            db.add(bridge_tx)
            db.commit()
            db.refresh(bridge_tx)

            # Lock tokens on source chain (simulate)
            lock_result = await self._lock_tokens_on_source_chain(
                user_address, from_chain, token_symbol, amount
            )

            # Update transaction with lock transaction hash
            bridge_tx.source_tx_hash = lock_result.get('tx_hash')
            bridge_tx.status = 'locked'
            db.commit()

            # Initiate bridge transfer (simulate async processing)
            asyncio.create_task(self._process_bridge_transfer(bridge_tx.id))

            logger.info("Bridge transfer initiated",
                       user=user_address, from_chain=from_chain, to_chain=to_chain,
                       token=token_symbol, amount=amount, tx_id=bridge_tx.id)

            return {
                'transfer_id': bridge_tx.id,
                'status': 'initiated',
                'estimated_completion': bridge_tx.estimated_completion.isoformat(),
                'bridge_fee': fee,
                'source_tx_hash': lock_result.get('tx_hash'),
                'recipient': recipient
            }

        except Exception as e:
            logger.error("Bridge transfer initiation failed",
                        user=user_address, from_chain=from_chain, to_chain=to_chain,
                        token=token_symbol, error=str(e))
            raise

    async def get_bridge_transaction(self, transfer_id: int) -> Optional[Dict[str, Any]]:
        """Get bridge transaction details"""
        try:
            # Try cache first
            cache_key = f"bridge_tx:{transfer_id}"
            cached = await cache.get(cache_key)
            if cached:
                return cached

            db = next(get_db())
            tx = db.query(CrossChainTransaction).filter(
                CrossChainTransaction.id == transfer_id
            ).first()

            if not tx:
                return None

            # Get current status and progress
            status_info = await self._get_transfer_status(tx)

            tx_data = {
                'id': tx.id,
                'user_address': tx.user_address,
                'from_chain': tx.from_chain,
                'to_chain': tx.to_chain,
                'token_symbol': tx.token_symbol,
                'amount': tx.amount,
                'recipient_address': tx.recipient_address,
                'bridge_fee': tx.bridge_fee,
                'status': tx.status,
                'source_tx_hash': tx.source_tx_hash,
                'destination_tx_hash': tx.destination_tx_hash,
                'initiated_at': tx.created_at.isoformat(),
                'estimated_completion': tx.estimated_completion.isoformat() if tx.estimated_completion else None,
                'completed_at': tx.completed_at.isoformat() if tx.completed_at else None,
                'progress': status_info.get('progress', 0),
                'current_step': status_info.get('current_step', 'unknown')
            }

            # Cache for 1 minute
            await cache.set(cache_key, tx_data, expire=60)

            return tx_data

        except Exception as e:
            logger.error("Bridge transaction retrieval failed", transfer_id=transfer_id, error=str(e))
            return None

    async def get_user_bridge_history(self, user_address: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Get bridge transaction history for a user"""
        try:
            db = next(get_db())
            transactions = db.query(CrossChainTransaction).filter(
                CrossChainTransaction.user_address == user_address
            ).order_by(CrossChainTransaction.created_at.desc()).limit(limit).all()

            result = []
            for tx in transactions:
                status_info = await self._get_transfer_status(tx)
                tx_data = {
                    'id': tx.id,
                    'from_chain': tx.from_chain,
                    'to_chain': tx.to_chain,
                    'token_symbol': tx.token_symbol,
                    'amount': tx.amount,
                    'status': tx.status,
                    'bridge_fee': tx.bridge_fee,
                    'initiated_at': tx.created_at.isoformat(),
                    'estimated_completion': tx.estimated_completion.isoformat() if tx.estimated_completion else None,
                    'progress': status_info.get('progress', 0)
                }
                result.append(tx_data)

            return result

        except Exception as e:
            logger.error("User bridge history retrieval failed", user=user_address, error=str(e))
            return []

    async def get_bridge_fees(self, from_chain: str, to_chain: str) -> Dict[str, Any]:
        """Get bridge fees and estimated times for a route"""
        try:
            bridge_key = f"{from_chain}-{to_chain}"
            reverse_key = f"{to_chain}-{from_chain}"

            fee = self.bridge_fees.get(bridge_key, self.bridge_fees.get(reverse_key, 10.0))
            estimated_time = self.transfer_times.get(bridge_key, self.transfer_times.get(reverse_key, 30))

            return {
                'from_chain': from_chain,
                'to_chain': to_chain,
                'bridge_fee_usd': fee,
                'estimated_time_minutes': estimated_time,
                'supported': bridge_key in self.bridge_fees or reverse_key in self.bridge_fees
            }

        except Exception as e:
            logger.error("Bridge fees retrieval failed", from_chain=from_chain, to_chain=to_chain, error=str(e))
            return {}

    async def get_supported_chains(self) -> Dict[str, Any]:
        """Get list of supported chains"""
        return {
            'chains': list(self.supported_chains.keys()),
            'details': self.supported_chains
        }

    async def get_bridge_analytics(self) -> Dict[str, Any]:
        """Get bridge analytics and statistics"""
        try:
            db = next(get_db())

            # Get total volume
            total_volume = db.query(CrossChainTransaction).filter(
                CrossChainTransaction.status == 'completed'
            ).with_entities(db.func.sum(CrossChainTransaction.amount)).scalar() or 0

            # Get transaction counts by status
            status_counts = {}
            for status in ['initiated', 'locked', 'bridging', 'completed', 'failed']:
                count = db.query(CrossChainTransaction).filter(
                    CrossChainTransaction.status == status
                ).count()
                status_counts[status] = count

            # Get popular routes
            popular_routes = db.query(
                CrossChainTransaction.from_chain,
                CrossChainTransaction.to_chain,
                db.func.count(CrossChainTransaction.id).label('count')
            ).filter(
                CrossChainTransaction.status == 'completed'
            ).group_by(
                CrossChainTransaction.from_chain,
                CrossChainTransaction.to_chain
            ).order_by(db.desc('count')).limit(10).all()

            # Get average completion times
            completed_txs = db.query(CrossChainTransaction).filter(
                CrossChainTransaction.status == 'completed',
                CrossChainTransaction.completed_at.isnot(None),
                CrossChainTransaction.created_at.isnot(None)
            ).all()

            avg_completion_time = 0
            if completed_txs:
                total_time = sum(
                    (tx.completed_at - tx.created_at).total_seconds() / 60
                    for tx in completed_txs
                )
                avg_completion_time = total_time / len(completed_txs)

            return {
                'total_volume': total_volume,
                'total_transactions': sum(status_counts.values()),
                'status_breakdown': status_counts,
                'popular_routes': [
                    {
                        'from_chain': route[0],
                        'to_chain': route[1],
                        'transaction_count': route[2]
                    } for route in popular_routes
                ],
                'average_completion_time_minutes': avg_completion_time,
                'supported_chains': len(self.supported_chains)
            }

        except Exception as e:
            logger.error("Bridge analytics retrieval failed", error=str(e))
            return {}

    async def _lock_tokens_on_source_chain(self, user_address: str, chain: str,
                                         token_symbol: str, amount: float) -> Dict[str, Any]:
        """Lock tokens on source chain (simulated)"""
        try:
            # In production, this would interact with the bridge contract on the source chain
            # For now, simulate the transaction
            await asyncio.sleep(0.1)  # Simulate network delay

            return {
                'tx_hash': f"0x{hash(f'{user_address}{chain}{token_symbol}{amount}') % (10**16):016x}",
                'status': 'locked'
            }

        except Exception as e:
            logger.error("Token locking failed", user=user_address, chain=chain, error=str(e))
            raise

    async def _process_bridge_transfer(self, transfer_id: int):
        """Process the bridge transfer asynchronously"""
        try:
            db = next(get_db())
            tx = db.query(CrossChainTransaction).filter(
                CrossChainTransaction.id == transfer_id
            ).first()

            if not tx:
                return

            # Update status to bridging
            tx.status = 'bridging'
            db.commit()

            # Simulate bridge processing time
            bridge_key = f"{tx.from_chain}-{tx.to_chain}"
            processing_time = self.transfer_times.get(bridge_key, 30)
            await asyncio.sleep(processing_time / 10)  # Faster simulation

            # Mint tokens on destination chain (simulate)
            mint_result = await self._mint_tokens_on_destination_chain(
                tx.recipient_address, tx.to_chain, tx.token_symbol, tx.amount
            )

            # Update transaction as completed
            tx.status = 'completed'
            tx.destination_tx_hash = mint_result.get('tx_hash')
            tx.completed_at = datetime.utcnow()
            db.commit()

            # Clear cache
            await cache.delete(f"bridge_tx:{transfer_id}")

            logger.info("Bridge transfer completed",
                       transfer_id=transfer_id, destination_tx=mint_result.get('tx_hash'))

        except Exception as e:
            logger.error("Bridge transfer processing failed", transfer_id=transfer_id, error=str(e))
            # Update status to failed
            try:
                db = next(get_db())
                tx = db.query(CrossChainTransaction).filter(
                    CrossChainTransaction.id == transfer_id
                ).first()
                if tx:
                    tx.status = 'failed'
                    db.commit()
            except Exception:
                pass

    async def _mint_tokens_on_destination_chain(self, recipient: str, chain: str,
                                             token_symbol: str, amount: float) -> Dict[str, Any]:
        """Mint tokens on destination chain (simulated)"""
        try:
            # In production, this would interact with the bridge contract on the destination chain
            await asyncio.sleep(0.1)  # Simulate network delay

            return {
                'tx_hash': f"0x{hash(f'{recipient}{chain}{token_symbol}{amount}') % (10**16):016x}",
                'status': 'minted'
            }

        except Exception as e:
            logger.error("Token minting failed", recipient=recipient, chain=chain, error=str(e))
            raise

    async def _get_transfer_status(self, tx: CrossChainTransaction) -> Dict[str, Any]:
        """Get current transfer status and progress"""
        try:
            if tx.status == 'completed':
                return {'progress': 100, 'current_step': 'completed'}
            elif tx.status == 'failed':
                return {'progress': 0, 'current_step': 'failed'}
            elif tx.status == 'bridging':
                # Calculate progress based on time elapsed
                elapsed = (datetime.utcnow() - tx.created_at).total_seconds() / 60
                total_estimated = self.transfer_times.get(f"{tx.from_chain}-{tx.to_chain}", 30)
                progress = min(90, (elapsed / total_estimated) * 100)
                return {'progress': progress, 'current_step': 'bridging'}
            elif tx.status == 'locked':
                return {'progress': 10, 'current_step': 'locked'}
            else:  # initiated
                return {'progress': 5, 'current_step': 'initiated'}

        except Exception:
            return {'progress': 0, 'current_step': 'unknown'}

# Global cross-chain bridge instance
cross_chain_bridge = CrossChainBridge()