from typing import Dict, Any, List, Optional, Tuple
from decimal import Decimal
from .blockchain import blockchain_service

class LiquidityPoolManager:
    """Liquidity Pool Manager for automated market making"""

    def __init__(self):
        self.pools = {}

    async def create_pool(self, token_a: str, token_b: str, fee: int = 30) -> Dict[str, Any]:
        """Create a new liquidity pool"""
        if not blockchain_service.is_connected() or 'LiquidityPool' not in blockchain_service.contracts:
            raise Exception("Blockchain not connected or LiquidityPool contract not loaded")

        contract = blockchain_service.contracts['LiquidityPool']

        # Create pool on blockchain
        tx_result = await blockchain_service._send_transaction(
            contract.functions.createPool(token_a, token_b, fee),
            blockchain_service.account.address
        )

        pool_id = f"{token_a}_{token_b}_{fee}"

        # Store pool data locally
        pool_data = {
            'pool_id': pool_id,
            'token_a': token_a,
            'token_b': token_b,
            'fee': fee,
            'created_at': '2024-01-01T00:00:00Z',  # Would use actual timestamp
            'total_liquidity': 0,
            'reserves_a': 0,
            'reserves_b': 0
        }

        self.pools[pool_id] = pool_data

        return {
            'pool_id': pool_id,
            'status': 'created',
            'token_a': token_a,
            'token_b': token_b,
            'fee': fee
        }

    async def add_liquidity(self, user_address: str, token_a: str, token_b: str,
                          amount_a: float, amount_b: float, slippage: float = 0.5) -> Dict[str, Any]:
        """Add liquidity to a pool"""
        if not blockchain_service.is_connected() or 'LiquidityPool' not in blockchain_service.contracts:
            raise Exception("Blockchain not connected or LiquidityPool contract not loaded")

        contract = blockchain_service.contracts['LiquidityPool']

        # Convert amounts to blockchain units
        amount_a_wei = blockchain_service.w3.to_wei(amount_a, 'ether')
        amount_b_wei = blockchain_service.w3.to_wei(amount_b, 'ether')

        # Calculate minimum amounts with slippage
        min_amount_a = int(amount_a_wei * (1 - slippage))
        min_amount_b = int(amount_b_wei * (1 - slippage))

        # Add liquidity on blockchain
        tx_result = await blockchain_service._send_transaction(
            contract.functions.addLiquidity(
                token_a, token_b, amount_a_wei, amount_b_wei, min_amount_a, min_amount_b
            ),
            user_address
        )

        # Update local pool data
        pool_id = f"{token_a}_{token_b}_30"  # Assuming default fee
        if pool_id in self.pools:
            self.pools[pool_id]['reserves_a'] += amount_a
            self.pools[pool_id]['reserves_b'] += amount_b
            self.pools[pool_id]['total_liquidity'] += (amount_a + amount_b)

        return {
            'pool_id': pool_id,
            'amount_a_added': amount_a,
            'amount_b_added': amount_b,
            'liquidity_tokens_minted': tx_result.get('liquidity_tokens', 0),
            'status': 'added'
        }

    async def remove_liquidity(self, user_address: str, position_id: int,
                             liquidity_tokens: float) -> Dict[str, Any]:
        """Remove liquidity from a pool position"""
        if not blockchain_service.is_connected() or 'LiquidityPool' not in blockchain_service.contracts:
            raise Exception("Blockchain not connected or LiquidityPool contract not loaded")

        contract = blockchain_service.contracts['LiquidityPool']

        # Convert liquidity tokens to blockchain units
        liquidity_wei = blockchain_service.w3.to_wei(liquidity_tokens, 'ether')

        # Remove liquidity on blockchain
        tx_result = await blockchain_service._send_transaction(
            contract.functions.removeLiquidity(position_id, liquidity_wei),
            user_address
        )

        return {
            'position_id': position_id,
            'liquidity_removed': liquidity_tokens,
            'amount_a_returned': tx_result.get('amount_a', 0),
            'amount_b_returned': tx_result.get('amount_b', 0),
            'status': 'removed'
        }

    async def get_pool_info(self, token_a: str, token_b: str) -> Optional[Dict[str, Any]]:
        """Get detailed information about a liquidity pool"""
        if not blockchain_service.is_connected() or 'LiquidityPool' not in blockchain_service.contracts:
            pool_id = f"{token_a}_{token_b}_30"
            return self.pools.get(pool_id)

        contract = blockchain_service.contracts['LiquidityPool']

        try:
            # Get pool data from blockchain
            pool_data = contract.functions.getPool(token_a, token_b).call()

            return {
                'token_a': token_a,
                'token_b': token_b,
                'reserve_a': blockchain_service.w3.from_wei(pool_data[0], 'ether'),
                'reserve_b': blockchain_service.w3.from_wei(pool_data[1], 'ether'),
                'total_liquidity': blockchain_service.w3.from_wei(pool_data[2], 'ether'),
                'fee': pool_data[3],
                'k_last': pool_data[4]  # Constant product
            }

        except Exception as e:
            print(f"Error getting pool info for {token_a}/{token_b}: {e}")
            pool_id = f"{token_a}_{token_b}_30"
            return self.pools.get(pool_id)

    async def get_amount_out(self, token_in: str, token_out: str, amount_in: float) -> Dict[str, Any]:
        """Calculate output amount for a swap"""
        pool_info = await self.get_pool_info(token_in, token_out)
        if not pool_info:
            raise Exception(f"Pool not found for {token_in}/{token_out}")

        # Uniswap V2 formula: (amount_in * reserve_out) / (reserve_in + amount_in)
        reserve_in = pool_info['reserve_a'] if token_in == pool_info['token_a'] else pool_info['reserve_b']
        reserve_out = pool_info['reserve_b'] if token_in == pool_info['token_a'] else pool_info['reserve_a']

        # Apply fee (0.3% = 0.003)
        amount_in_with_fee = amount_in * 0.997
        numerator = amount_in_with_fee * reserve_out
        denominator = reserve_in + amount_in_with_fee

        amount_out = numerator / denominator if denominator > 0 else 0

        # Calculate price impact
        price_impact = (amount_in / (reserve_in + amount_in)) * 100

        return {
            'amount_in': amount_in,
            'amount_out': amount_out,
            'price_impact_percent': price_impact,
            'fee_amount': amount_in * 0.003,
            'token_in': token_in,
            'token_out': token_out
        }

    async def swap_tokens(self, user_address: str, token_in: str, token_out: str,
                        amount_in: float, min_amount_out: float, deadline: int) -> Dict[str, Any]:
        """Execute a token swap"""
        if not blockchain_service.is_connected() or 'LiquidityPool' not in blockchain_service.contracts:
            raise Exception("Blockchain not connected or LiquidityPool contract not loaded")

        contract = blockchain_service.contracts['LiquidityPool']

        # Convert amounts to blockchain units
        amount_in_wei = blockchain_service.w3.to_wei(amount_in, 'ether')
        min_amount_out_wei = blockchain_service.w3.to_wei(min_amount_out, 'ether')

        # Execute swap on blockchain
        tx_result = await blockchain_service._send_transaction(
            contract.functions.swap(
                token_in, token_out, amount_in_wei, min_amount_out_wei, deadline
            ),
            user_address
        )

        return {
            'amount_in': amount_in,
            'amount_out_min': min_amount_out,
            'actual_amount_out': tx_result.get('amount_out', 0),
            'status': 'swapped'
        }

    async def get_user_positions(self, user_address: str) -> List[Dict[str, Any]]:
        """Get all liquidity positions for a user"""
        if not blockchain_service.is_connected() or 'LiquidityPool' not in blockchain_service.contracts:
            return []

        contract = blockchain_service.contracts['LiquidityPool']

        try:
            # Get position count for user
            position_count = contract.functions.getUserPositionCount(user_address).call()

            positions = []
            for i in range(position_count):
                position_data = contract.functions.getUserPosition(user_address, i).call()
                positions.append({
                    'position_id': position_data[0],
                    'pool_id': position_data[1],
                    'liquidity_tokens': blockchain_service.w3.from_wei(position_data[2], 'ether'),
                    'token_a_amount': blockchain_service.w3.from_wei(position_data[3], 'ether'),
                    'token_b_amount': blockchain_service.w3.from_wei(position_data[4], 'ether'),
                    'fees_earned_a': blockchain_service.w3.from_wei(position_data[5], 'ether'),
                    'fees_earned_b': blockchain_service.w3.from_wei(position_data[6], 'ether')
                })

            return positions

        except Exception as e:
            print(f"Error getting user positions for {user_address}: {e}")
            return []

    async def get_pool_stats(self, token_a: str, token_b: str) -> Dict[str, Any]:
        """Get pool statistics"""
        pool_info = await self.get_pool_info(token_a, token_b)
        if not pool_info:
            return {}

        # Calculate additional metrics
        total_value_locked = pool_info['reserve_a'] + pool_info['reserve_b']
        volume_24h = 0  # Would need to track from events
        fees_24h = volume_24h * (pool_info['fee'] / 10000)  # Fee is in basis points

        return {
            'pool': f"{token_a}/{token_b}",
            'tvl': total_value_locked,
            'volume_24h': volume_24h,
            'fees_24h': fees_24h,
            'fee_tier': f"{pool_info['fee'] / 100}%",  # Convert basis points to percentage
            'reserve_a': pool_info['reserve_a'],
            'reserve_b': pool_info['reserve_b'],
            'price_a_per_b': pool_info['reserve_b'] / pool_info['reserve_a'] if pool_info['reserve_a'] > 0 else 0,
            'price_b_per_a': pool_info['reserve_a'] / pool_info['reserve_b'] if pool_info['reserve_b'] > 0 else 0
        }

# Global liquidity pool manager instance
liquidity_pool_manager = LiquidityPoolManager()