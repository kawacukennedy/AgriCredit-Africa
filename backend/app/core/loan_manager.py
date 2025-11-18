import asyncio
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from decimal import Decimal

from .blockchain import BlockchainService
from .cache import CacheService
from .email import EmailService
from .websocket import WebSocketService
from .identity import IdentityService
from ..models.credit_scoring_model import CreditScoringModel

logger = logging.getLogger(__name__)

class LoanManagerService:
    """Service for managing microloans with AI credit scoring"""

    def __init__(
        self,
        blockchain_service: BlockchainService,
        cache_service: CacheService,
        email_service: EmailService,
        websocket_service: WebSocketService,
        identity_service: IdentityService,
        credit_model: CreditScoringModel
    ):
        self.blockchain = blockchain_service
        self.cache = cache_service
        self.email = email_service
        self.websocket = websocket_service
        self.identity = identity_service
        self.credit_model = credit_model

        self.loan_contract_address = None  # To be set from config
        self.liquidity_pool_address = None
        self.yield_token_address = None

    async def initialize(self, loan_contract: str, liquidity_pool: str, yield_token: str):
        """Initialize with contract addresses"""
        self.loan_contract_address = loan_contract
        self.liquidity_pool_address = liquidity_pool
        self.yield_token_address = yield_token

    async def apply_for_loan(
        self,
        borrower_address: str,
        amount: float,
        collateral_token: str,
        collateral_amount: float,
        farmer_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Process loan application with AI credit scoring"""

        try:
            # Verify identity
            identity_verified = await self.identity.verify_identity(borrower_address)
            if not identity_verified:
                return {"error": "Identity not verified", "status": "rejected"}

            # Generate credit score
            features = self._extract_features(farmer_data)
            credit_result = self.credit_model.predict(features)

            if credit_result["risk_level"] == "High":
                return {
                    "error": "Credit score too low",
                    "credit_score": credit_result["credit_score"],
                    "status": "rejected"
                }

            # Check liquidity pool availability
            pool_info = await self._check_pool_liquidity(amount)
            if not pool_info["sufficient"]:
                return {"error": "Insufficient liquidity", "status": "pending"}

            # Create loan on blockchain
            loan_id = await self._create_blockchain_loan(
                borrower_address,
                amount,
                credit_result["credit_score"],
                collateral_token,
                collateral_amount
            )

            # Cache loan data
            loan_data = {
                "id": loan_id,
                "borrower": borrower_address,
                "amount": amount,
                "credit_score": credit_result["credit_score"],
                "risk_level": credit_result["risk_level"],
                "collateral_token": collateral_token,
                "collateral_amount": collateral_amount,
                "status": "active",
                "created_at": datetime.utcnow().isoformat(),
                "explainability": credit_result["explainability"]
            }

            await self.cache.set(f"loan:{loan_id}", loan_data, ttl=86400*365)  # 1 year

            # Send notifications
            await self._send_loan_notifications(borrower_address, loan_data)

            return {
                "loan_id": loan_id,
                "credit_score": credit_result["credit_score"],
                "status": "approved",
                "details": loan_data
            }

        except Exception as e:
            logger.error(f"Loan application failed: {e}")
            return {"error": str(e), "status": "error"}

    async def repay_loan(self, loan_id: int, borrower_address: str, amount: float) -> Dict[str, Any]:
        """Process loan repayment"""

        try:
            # Get loan data
            loan_data = await self.cache.get(f"loan:{loan_id}")
            if not loan_data:
                return {"error": "Loan not found"}

            if loan_data["borrower"] != borrower_address:
                return {"error": "Unauthorized"}

            # Process repayment on blockchain
            success = await self._repay_blockchain_loan(loan_id, amount)

            if success:
                loan_data["repaid_amount"] = loan_data.get("repaid_amount", 0) + amount
                total_owed = await self._calculate_total_owed(loan_id)

                if loan_data["repaid_amount"] >= total_owed:
                    loan_data["status"] = "repaid"
                    await self._send_repayment_complete_notification(borrower_address, loan_id)

                await self.cache.set(f"loan:{loan_id}", loan_data, ttl=86400*365)

                return {"status": "success", "remaining_owed": max(0, total_owed - loan_data["repaid_amount"])}

            return {"error": "Repayment failed"}

        except Exception as e:
            logger.error(f"Loan repayment failed: {e}")
            return {"error": str(e)}

    async def get_loan_status(self, loan_id: int) -> Dict[str, Any]:
        """Get loan status and details"""
        loan_data = await self.cache.get(f"loan:{loan_id}")
        if not loan_data:
            return {"error": "Loan not found"}

        # Get blockchain data for real-time status
        blockchain_data = await self._get_blockchain_loan_data(loan_id)

        return {**loan_data, **blockchain_data}

    async def get_user_loans(self, user_address: str) -> List[Dict[str, Any]]:
        """Get all loans for a user"""
        # In practice, maintain an index of user loans
        # For now, return cached loans (simplified)
        user_loans = []
        # This would require a more sophisticated caching/indexing strategy
        return user_loans

    async def check_defaults(self):
        """Check for defaulted loans and trigger liquidation"""
        # This would run periodically
        # Get all active loans and check expiration
        pass

    def _extract_features(self, farmer_data: Dict[str, Any]) -> List[float]:
        """Extract features for credit scoring from farmer data"""
        return [
            farmer_data.get("farm_size", 0),
            farmer_data.get("historical_repayment_rate", 0),
            farmer_data.get("mobile_money_usage", 0),
            farmer_data.get("satellite_ndvi", 0),
            farmer_data.get("weather_risk", 0),
            farmer_data.get("cooperative_membership", 0),
            farmer_data.get("loan_history", 0),
            farmer_data.get("income_stability", 0),
            farmer_data.get("location_risk", 0),
            farmer_data.get("crop_diversity", 0),
            farmer_data.get("soil_quality", 0),
            farmer_data.get("irrigation_access", 0),
            farmer_data.get("market_distance", 0),
            farmer_data.get("digital_literacy", 0)
        ]

    async def _check_pool_liquidity(self, amount: float) -> Dict[str, Any]:
        """Check if liquidity pool has sufficient funds"""
        # Call blockchain to check pool liquidity
        return {"sufficient": True}  # Simplified

    async def _create_blockchain_loan(
        self,
        borrower: str,
        amount: float,
        credit_score: int,
        collateral_token: str,
        collateral_amount: float
    ) -> int:
        """Create loan on blockchain"""
        # Web3 call to LoanManager.createLoan
        return 1  # Mock loan ID

    async def _repay_blockchain_loan(self, loan_id: int, amount: float) -> bool:
        """Repay loan on blockchain"""
        # Web3 call to LoanManager.repayLoan
        return True

    async def _get_blockchain_loan_data(self, loan_id: int) -> Dict[str, Any]:
        """Get loan data from blockchain"""
        # Web3 call to LoanManager.getLoan
        return {}

    async def _calculate_total_owed(self, loan_id: int) -> float:
        """Calculate total amount owed including interest"""
        # Web3 call to LoanManager.calculateTotalOwed
        return 0.0

    async def _send_loan_notifications(self, borrower: str, loan_data: Dict[str, Any]):
        """Send loan approval notifications"""
        try:
            # Email notification
            await self.email.send_email(
                to=borrower,
                subject="Loan Approved - AgriCredit",
                template="loan_approved",
                context=loan_data
            )

            # WebSocket notification
            await self.websocket.broadcast_to_user(
                borrower,
                "loan_approved",
                loan_data
            )
        except Exception as e:
            logger.error(f"Failed to send notifications: {e}")

    async def _send_repayment_complete_notification(self, borrower: str, loan_id: int):
        """Send repayment complete notification"""
        try:
            await self.email.send_email(
                to=borrower,
                subject="Loan Fully Repaid - AgriCredit",
                template="loan_repaid",
                context={"loan_id": loan_id}
            )
        except Exception as e:
            logger.error(f"Failed to send repayment notification: {e}")

    async def get_loan_statistics(self) -> Dict[str, Any]:
        """Get loan portfolio statistics"""
        # Aggregate data from cache/blockchain
        return {
            "total_loans": 0,
            "active_loans": 0,
            "total_value": 0,
            "default_rate": 0,
            "average_credit_score": 0
        }