import asyncio
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from decimal import Decimal

from .blockchain import BlockchainService
from .cache import CacheService
from .email import EmailService
from .websocket import WebSocketService
from ..models.climate_model import ClimateAnalysisModel

logger = logging.getLogger(__name__)

class CarbonCreditService:
    """Service for managing carbon credits and climate analysis"""

    def __init__(
        self,
        blockchain_service: BlockchainService,
        cache_service: CacheService,
        email_service: EmailService,
        websocket_service: WebSocketService,
        climate_model: ClimateAnalysisModel
    ):
        self.blockchain = blockchain_service
        self.cache = cache_service
        self.email = email_service
        self.websocket = websocket_service
        self.climate_model = climate_model

        self.carbon_token_address = None  # To be set from config

    async def initialize(self, carbon_token_address: str):
        """Initialize with contract addresses"""
        self.carbon_token_address = carbon_token_address

    async def submit_climate_data(
        self,
        user_address: str,
        data_type: str,
        location: str,
        satellite_data: Optional[Dict[str, Any]] = None,
        iot_sensors: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Submit climate data for carbon credit calculation"""

        try:
            # Analyze climate data with AI model
            analysis_result = self.climate_model.analyze_climate_impact(
                satellite_data or {},
                iot_sensors or {}
            )

            # Submit to blockchain
            data_id = await self._submit_climate_data_blockchain(
                data_type, location, analysis_result
            )

            # Cache the analysis
            cache_key = f"climate_data:{data_id}"
            await self.cache.set(cache_key, {
                'id': data_id,
                'user': user_address,
                'data_type': data_type,
                'location': location,
                'analysis': analysis_result,
                'submitted_at': datetime.utcnow().isoformat()
            }, ttl=86400*365)  # 1 year

            return {
                'data_id': data_id,
                'co2_sequestered': analysis_result['co2_sequestered'],
                'carbon_tokens_mintable': analysis_result['carbon_tokens_mintable'],
                'confidence': analysis_result['confidence'],
                'recommendations': analysis_result['recommendations']
            }

        except Exception as e:
            logger.error(f"Climate data submission failed: {e}")
            return {"error": str(e)}

    async def generate_carbon_credit(
        self,
        farmer_address: str,
        climate_data_ids: List[int],
        methodology: str
    ) -> Dict[str, Any]:
        """Generate carbon credit from verified climate data"""

        try:
            # Aggregate data from multiple submissions
            total_co2 = 0
            locations = []
            confidence_scores = []

            for data_id in climate_data_ids:
                cache_key = f"climate_data:{data_id}"
                data = await self.cache.get(cache_key)
                if data:
                    total_co2 += data['analysis']['co2_sequestered']
                    locations.append(data['location'])
                    confidence_scores.append(data['analysis']['confidence'])

            if not confidence_scores:
                return {"error": "No valid climate data found"}

            # Calculate average confidence
            avg_confidence = sum(confidence_scores) / len(confidence_scores)

            # Use primary location
            primary_location = locations[0] if locations else "Unknown"

            # Mint carbon credit on blockchain
            credit_id = await self._mint_carbon_credit_blockchain(
                farmer_address,
                total_co2,
                methodology,
                primary_location,
                avg_confidence
            )

            # Cache credit data
            credit_data = {
                'id': credit_id,
                'farmer': farmer_address,
                'amount': total_co2,
                'methodology': methodology,
                'location': primary_location,
                'confidence': avg_confidence,
                'climate_data_ids': climate_data_ids,
                'status': 'verified' if avg_confidence >= 70 else 'pending',
                'created_at': datetime.utcnow().isoformat()
            }

            await self.cache.set(f"carbon_credit:{credit_id}", credit_data, ttl=86400*365)

            # Send notifications
            await self._send_credit_notifications(farmer_address, credit_data)

            return {
                'credit_id': credit_id,
                'amount': total_co2,
                'status': credit_data['status'],
                'tokens_minted': total_co2 if avg_confidence >= 70 else 0
            }

        except Exception as e:
            logger.error(f"Carbon credit generation failed: {e}")
            return {"error": str(e)}

    async def stake_carbon_tokens(self, user_address: str, amount: float) -> Dict[str, Any]:
        """Stake CARBT tokens for rewards"""

        try:
            success = await self._stake_tokens_blockchain(user_address, amount)

            if success:
                # Update cache
                staking_key = f"staking:{user_address}"
                current_staking = await self.cache.get(staking_key) or {'staked': 0.0, 'rewards': 0.0}
                current_staking['staked'] += amount
                await self.cache.set(staking_key, current_staking, ttl=86400*365)

                return {'success': True, 'staked_amount': amount}

            return {'error': 'Staking failed'}

        except Exception as e:
            logger.error(f"Token staking failed: {e}")
            return {"error": str(e)}

    async def claim_staking_rewards(self, user_address: str) -> Dict[str, Any]:
        """Claim staking rewards"""

        try:
            rewards = await self._claim_rewards_blockchain(user_address)

            if rewards > 0:
                # Update cache
                staking_key = f"staking:{user_address}"
                current_staking = await self.cache.get(staking_key) or {'staked': 0.0, 'rewards': 0.0}
                current_staking['rewards'] = 0.0  # Reset claimed rewards
                await self.cache.set(staking_key, current_staking, ttl=86400*365)

                return {'success': True, 'rewards_claimed': rewards}

            return {'error': 'No rewards to claim'}

        except Exception as e:
            logger.error(f"Reward claiming failed: {e}")
            return {"error": str(e)}

    async def retire_carbon_credits(self, user_address: str, credit_id: int) -> Dict[str, Any]:
        """Retire carbon credits for environmental impact"""

        try:
            success = await self._retire_credit_blockchain(user_address, credit_id)

            if success:
                # Update cache
                credit_data = await self.cache.get(f"carbon_credit:{credit_id}")
                if credit_data:
                    credit_data['retired'] = True
                    credit_data['retired_at'] = datetime.utcnow().isoformat()
                    await self.cache.set(f"carbon_credit:{credit_id}", credit_data, ttl=86400*365)

                return {'success': True, 'credit_id': credit_id}

            return {'error': 'Retirement failed'}

        except Exception as e:
            logger.error(f"Credit retirement failed: {e}")
            return {"error": str(e)}

    async def get_carbon_dashboard(self, user_address: str) -> Dict[str, Any]:
        """Get comprehensive carbon dashboard data"""

        try:
            # Get user's carbon credits
            user_credits = []
            credit_pattern = f"carbon_credit:*"
            # In practice, you'd use a more sophisticated search
            # For now, return mock data

            # Get staking info
            staking_info = await self.cache.get(f"staking:{user_address}") or {'staked': 0, 'rewards': 0}

            # Get climate data submissions
            climate_submissions = []
            # Mock data for now

            # Calculate totals
            total_sequestered = sum(credit.get('amount', 0) for credit in user_credits)
            total_tokens = await self._get_token_balance_blockchain(user_address)

            return {
                'total_co2_sequestered': total_sequestered,
                'total_carbon_tokens': total_tokens,
                'active_credits': len([c for c in user_credits if not c.get('retired', False)]),
                'retired_credits': len([c for c in user_credits if c.get('retired', False)]),
                'staking_info': staking_info,
                'climate_submissions': len(climate_submissions),
                'environmental_impact': self._calculate_environmental_impact(total_sequestered)
            }

        except Exception as e:
            logger.error(f"Dashboard data retrieval failed: {e}")
            return {"error": str(e)}

    async def get_market_analytics(self) -> Dict[str, Any]:
        """Get carbon market analytics"""

        try:
            # Get global statistics from blockchain
            total_supply = await self._get_total_supply_blockchain()
            total_staked = await self._get_total_staked_blockchain()
            total_sequestered = await self._get_total_sequestered_blockchain()

            return {
                'total_supply': total_supply,
                'total_staked': total_staked,
                'total_sequestered': total_sequestered,
                'circulating_supply': total_supply - total_staked,
                'staking_ratio': (total_staked / total_supply) if total_supply > 0 else 0,
                'avg_confidence_score': 85.5,  # Mock data
                'top_methodologies': ['reforestation', 'soil_carbon', 'agri_practices']
            }

        except Exception as e:
            logger.error(f"Market analytics failed: {e}")
            return {"error": str(e)}

    # Private blockchain interaction methods
    async def _submit_climate_data_blockchain(self, data_type: str, location: str, analysis: Dict[str, Any]) -> int:
        """Submit climate data to blockchain"""
        # Web3 call to CarbonToken.submitClimateData
        return 1  # Mock ID

    async def _mint_carbon_credit_blockchain(
        self, farmer: str, amount: float, methodology: str, location: str, confidence: float
    ) -> int:
        """Mint carbon credit on blockchain"""
        # Web3 call to CarbonToken.mintCarbonCredit
        return 1  # Mock ID

    async def _stake_tokens_blockchain(self, user: str, amount: float) -> bool:
        """Stake tokens on blockchain"""
        # Web3 call to CarbonToken.stakeTokens
        return True

    async def _claim_rewards_blockchain(self, user: str) -> float:
        """Claim rewards from blockchain"""
        # Web3 call to CarbonToken.claimRewards
        return 10.5  # Mock rewards

    async def _retire_credit_blockchain(self, user: str, credit_id: int) -> bool:
        """Retire credit on blockchain"""
        # Web3 call to CarbonToken.retireCarbonCredits
        return True

    async def _get_token_balance_blockchain(self, user: str) -> float:
        """Get token balance from blockchain"""
        return 150.0  # Mock balance

    async def _get_total_supply_blockchain(self) -> float:
        """Get total supply from blockchain"""
        return 10000.0  # Mock supply

    async def _get_total_staked_blockchain(self) -> float:
        """Get total staked from blockchain"""
        return 2500.0  # Mock staked

    async def _get_total_sequestered_blockchain(self) -> float:
        """Get total sequestered from blockchain"""
        return 8500.0  # Mock sequestered

    def _calculate_environmental_impact(self, co2_amount: float) -> Dict[str, Any]:
        """Calculate environmental impact metrics"""
        return {
            'trees_equivalent': co2_amount * 40,  # Rough estimate: 1 ton CO2 = 40 trees/year
            'cars_off_road': co2_amount * 2.5,    # 1 ton CO2 = 2.5 cars off road for a year
            'homes_electricity': co2_amount * 8,  # 1 ton CO2 = electricity for 8 homes/year
            'impact_score': min(100, co2_amount / 10)  # Normalized score
        }

    async def _send_credit_notifications(self, user: str, credit_data: Dict[str, Any]):
        """Send notifications for carbon credit events"""
        try:
            await self.email.send_email(
                to=user,
                subject="Carbon Credit Generated - AgriCredit",
                template="carbon_credit_generated",
                context=credit_data
            )

            await self.websocket.broadcast_to_user(
                user,
                "carbon_credit_generated",
                credit_data
            )
        except Exception as e:
            logger.error(f"Failed to send carbon credit notifications: {e}")