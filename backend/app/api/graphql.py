import strawberry
from strawberry.fastapi import GraphQLRouter
from strawberry.types import Info
from typing import List, Optional
from datetime import datetime
import structlog

from ..database.config import get_db
from ..database.models import User, SensorReading, Loan, MarketplaceListing, CarbonCredit
from .schemas import (
    User as UserSchema,
    SensorReading as SensorReadingSchema,
    Loan as LoanSchema,
    MarketplaceListing as MarketplaceListingSchema,
    CarbonCredit as CarbonCreditSchema
)

logger = structlog.get_logger()

# GraphQL Types
@strawberry.type
class UserType:
    id: int
    email: str
    username: str
    full_name: Optional[str]
    phone: Optional[str]
    location: Optional[str]
    farm_size: Optional[float]
    is_active: bool
    is_verified: bool
    role: str
    created_at: datetime

@strawberry.type
class SensorReadingType:
    id: int
    device_id: str
    soil_moisture: Optional[float]
    temperature: Optional[float]
    humidity: Optional[float]
    light_level: Optional[float]
    ph_level: Optional[float]
    nitrogen: Optional[float]
    phosphorus: Optional[float]
    potassium: Optional[float]
    rainfall: Optional[float]
    wind_speed: Optional[float]
    solar_radiation: Optional[float]
    timestamp: datetime

@strawberry.type
class LoanType:
    id: int
    user_id: int
    borrower_address: str
    amount: float
    interest_rate: float
    duration: int
    collateral_token: str
    collateral_amount: float
    credit_score: int
    risk_level: str
    trust_score: int
    status: str
    repaid_amount: float
    total_owed: float
    collateral_returned: bool
    purpose: Optional[str]
    explainability: dict
    created_at: datetime
    approved_at: Optional[datetime]
    disbursed_at: Optional[datetime]
    repaid_at: Optional[datetime]
    defaulted_at: Optional[datetime]

@strawberry.type
class MarketplaceListingType:
    id: int
    title: str
    description: Optional[str]
    crop_type: str
    quantity: float
    unit: str
    price_per_unit: float
    location: Optional[str]
    quality_grade: Optional[str]
    status: str
    created_at: datetime

@strawberry.type
class CarbonCreditType:
    id: int
    amount: float
    transaction_type: str
    transaction_hash: Optional[str]
    created_at: datetime

# Input Types
@strawberry.input
class UserFilter:
    role: Optional[str] = None
    is_verified: Optional[bool] = None
    location: Optional[str] = None

@strawberry.input
class SensorDataFilter:
    device_id: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

@strawberry.input
class LoanFilter:
    status: Optional[str] = None
    min_amount: Optional[float] = None
    max_amount: Optional[float] = None

@strawberry.input
class MarketplaceFilter:
    crop_type: Optional[str] = None
    location: Optional[str] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    status: Optional[str] = "active"

# Query
@strawberry.type
class Query:
    @strawberry.field
    async def users(
        self,
        info: Info,
        limit: int = 50,
        offset: int = 0,
        filter: Optional[UserFilter] = None
    ) -> List[UserType]:
        """Get users with optional filtering"""
        db = next(get_db())

        query = db.query(User)

        if filter:
            if filter.role:
                query = query.filter(User.role == filter.role)
            if filter.is_verified is not None:
                query = query.filter(User.is_verified == filter.is_verified)
            if filter.location:
                query = query.filter(User.location.ilike(f"%{filter.location}%"))

        users = query.offset(offset).limit(limit).all()

        logger.info("GraphQL query: users", count=len(users), filter=filter)
        return users

    @strawberry.field
    async def sensor_readings(
        self,
        info: Info,
        limit: int = 100,
        offset: int = 0,
        filter: Optional[SensorDataFilter] = None
    ) -> List[SensorReadingType]:
        """Get sensor readings with optional filtering"""
        db = next(get_db())

        query = db.query(SensorReading)

        if filter:
            if filter.device_id:
                query = query.filter(SensorReading.device_id == filter.device_id)
            if filter.start_date:
                query = query.filter(SensorReading.timestamp >= filter.start_date)
            if filter.end_date:
                query = query.filter(SensorReading.timestamp <= filter.end_date)

        readings = query.order_by(SensorReading.timestamp.desc()).offset(offset).limit(limit).all()

        logger.info("GraphQL query: sensor_readings", count=len(readings), filter=filter)
        return readings

    @strawberry.field
    async def loans(
        self,
        info: Info,
        user_id: Optional[int] = None,
        status: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[LoanType]:
        """Get loans with optional filtering"""
        db = next(get_db())

        query = db.query(Loan)

        if user_id:
            query = query.filter(Loan.user_id == user_id)
        if status:
            query = query.filter(Loan.status == status)

        loans = query.order_by(Loan.created_at.desc()).offset(offset).limit(limit).all()

        logger.info("GraphQL query: loans", count=len(loans), user_id=user_id, status=status)
        return loans

    @strawberry.field
    async def loan_details(self, info: Info, loan_id: int) -> Optional[LoanType]:
        """Get detailed loan information"""
        db = next(get_db())

        loan = db.query(Loan).filter(Loan.id == loan_id).first()

        if loan:
            logger.info("GraphQL query: loan_details", loan_id=loan_id)
        else:
            logger.warning("GraphQL query: loan_details - loan not found", loan_id=loan_id)

        return loan

    @strawberry.field
    async def marketplace_listings(
        self,
        info: Info,
        limit: int = 50,
        offset: int = 0,
        filter: Optional[MarketplaceFilter] = None
    ) -> List[MarketplaceListingType]:
        """Get marketplace listings with optional filtering"""
        db = next(get_db())

        query = db.query(MarketplaceListing)

        if filter:
            if filter.crop_type:
                query = query.filter(MarketplaceListing.crop_type == filter.crop_type)
            if filter.location:
                query = query.filter(MarketplaceListing.location.ilike(f"%{filter.location}%"))
            if filter.min_price:
                query = query.filter(MarketplaceListing.price_per_unit >= filter.min_price)
            if filter.max_price:
                query = query.filter(MarketplaceListing.price_per_unit <= filter.max_price)
            if filter.status:
                query = query.filter(MarketplaceListing.status == filter.status)

        listings = query.order_by(MarketplaceListing.created_at.desc()).offset(offset).limit(limit).all()

        logger.info("GraphQL query: marketplace_listings", count=len(listings), filter=filter)
        return listings

    @strawberry.field
    async def carbon_credits(
        self,
        info: Info,
        user_id: Optional[int] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[CarbonCreditType]:
        """Get carbon credits, optionally filtered by user"""
        db = next(get_db())

        query = db.query(CarbonCredit)

        if user_id:
            query = query.filter(CarbonCredit.user_id == user_id)

        credits = query.order_by(CarbonCredit.created_at.desc()).offset(offset).limit(limit).all()

        logger.info("GraphQL query: carbon_credits", count=len(credits), user_id=user_id)
        return credits

    @strawberry.field
    async def dashboard_stats(self, info: Info) -> dict:
        """Get dashboard statistics"""
        db = next(get_db())

        # Get various stats
        total_users = db.query(User).count()
        active_loans = db.query(Loan).filter(Loan.status == "active").count()
        total_sensor_readings = db.query(SensorReading).count()
        active_listings = db.query(MarketplaceListing).filter(MarketplaceListing.status == "active").count()
        total_carbon_credits = db.query(CarbonCredit).count()

        stats = {
            "total_users": total_users,
            "active_loans": active_loans,
            "total_sensor_readings": total_sensor_readings,
            "active_marketplace_listings": active_listings,
            "total_carbon_credits": total_carbon_credits
        }

        logger.info("GraphQL query: dashboard_stats", stats=stats)
        return stats

    # New Enhanced Contract Queries
    @strawberry.field
    async def staking_positions(
        self,
        info: Info,
        user_address: Optional[str] = None,
        limit: int = 50
    ) -> List[StakingPositionType]:
        """Get staking positions"""
        # This would query the database or blockchain
        # For now, return mock data
        return [
            StakingPositionType(
                id="stake_1",
                user_address=user_address or "0x123...",
                amount=1000.0,
                lock_period=365,
                apy=0.12,
                rewards_earned=120.0,
                start_time=datetime.now(),
                end_time=datetime.now(),
                status="active"
            )
        ]

    @strawberry.field
    async def prediction_markets(
        self,
        info: Info,
        resolved: Optional[bool] = None,
        limit: int = 50
    ) -> List[PredictionMarketType]:
        """Get prediction markets"""
        # Mock data
        return [
            PredictionMarketType(
                id="market_1",
                question="Will corn prices exceed $200/bushel in Q4 2024?",
                outcomes=["Yes", "No"],
                end_time=int(datetime.now().timestamp()) + 86400,
                total_liquidity=5000.0,
                resolved=False,
                winning_outcome=None,
                created_at=datetime.now()
            )
        ]

    @strawberry.field
    async def lending_positions(
        self,
        info: Info,
        user_address: Optional[str] = None,
        status: Optional[str] = None
    ) -> List[LendingPositionType]:
        """Get lending positions"""
        # Mock data
        return [
            LendingPositionType(
                id="loan_1",
                user_address=user_address or "0x123...",
                amount=5000.0,
                interest_rate=0.08,
                collateral_amount=6000.0,
                collateral_token="USDC",
                liquidation_price=0.83,
                status="active",
                created_at=datetime.now()
            )
        ]

    @strawberry.field
    async def yield_strategies(
        self,
        info: Info,
        user_address: Optional[str] = None,
        limit: int = 50
    ) -> List[YieldStrategyType]:
        """Get yield strategies"""
        # Mock data
        return [
            YieldStrategyType(
                id="strategy_1",
                name="Conservative Yield",
                description="Low-risk yield farming strategy",
                protocols=["aave", "compound"],
                allocations=[60.0, 40.0],
                expected_apy=0.08,
                total_deposited=10000.0,
                performance=0.075,
                created_at=datetime.now()
            )
        ]

    @strawberry.field
    async def bridge_transfers(
        self,
        info: Info,
        user_address: Optional[str] = None,
        status: Optional[str] = None
    ) -> List[BridgeTransferType]:
        """Get bridge transfers"""
        # Mock data
        return [
            BridgeTransferType(
                id="transfer_1",
                user_address=user_address or "0x123...",
                amount=1000.0,
                source_chain="ethereum",
                target_chain="polygon",
                recipient="0x456...",
                status="completed",
                tx_hash="0x789...",
                created_at=datetime.now()
            )
        ]

# New GraphQL Types for Enhanced Contracts
@strawberry.type
class StakingPositionType:
    id: str
    user_address: str
    amount: float
    lock_period: int
    apy: float
    rewards_earned: float
    start_time: datetime
    end_time: datetime
    status: str

@strawberry.type
class PredictionMarketType:
    id: str
    question: str
    outcomes: List[str]
    end_time: int
    total_liquidity: float
    resolved: bool
    winning_outcome: Optional[int]
    created_at: datetime

@strawberry.type
class LendingPositionType:
    id: str
    user_address: str
    amount: float
    interest_rate: float
    collateral_amount: float
    collateral_token: str
    liquidation_price: float
    status: str
    created_at: datetime

@strawberry.type
class YieldStrategyType:
    id: str
    name: str
    description: str
    protocols: List[str]
    allocations: List[float]
    expected_apy: float
    total_deposited: float
    performance: float
    created_at: datetime

@strawberry.type
class BridgeTransferType:
    id: str
    user_address: str
    amount: float
    source_chain: str
    target_chain: str
    recipient: str
    status: str
    tx_hash: Optional[str]
    created_at: datetime

# Input Types for New Mutations
@strawberry.input
class StakingInput:
    amount: float
    lock_period: int

@strawberry.input
class PredictionMarketInput:
    question: str
    outcomes: List[str]
    end_time: int
    fee: float = 0.01

@strawberry.input
class LendingInput:
    amount: float
    collateral_token: str
    collateral_amount: float

@strawberry.input
class YieldStrategyInput:
    name: str
    description: str
    protocols: List[str]
    allocations: List[int]

@strawberry.input
class BridgeTransferInput:
    amount: float
    target_chain: int
    recipient: str

# Mutations
@strawberry.type
class Mutation:
    @strawberry.mutation
    async def create_marketplace_listing(
        self,
        info: Info,
        title: str,
        description: Optional[str],
        crop_type: str,
        quantity: float,
        unit: str,
        price_per_unit: float,
        location: Optional[str],
        quality_grade: Optional[str]
    ) -> MarketplaceListingType:
        """Create a new marketplace listing"""
        db = next(get_db())

        # Get current user from context (would need to be set up properly)
        # For now, assume user_id = 1
        user_id = 1

        listing = MarketplaceListing(
            seller_id=user_id,
            title=title,
            description=description,
            crop_type=crop_type,
            quantity=quantity,
            unit=unit,
            price_per_unit=price_per_unit,
            location=location,
            quality_grade=quality_grade
        )

        db.add(listing)
        db.commit()
        db.refresh(listing)

        logger.info("GraphQL mutation: create_marketplace_listing", listing_id=listing.id)
        return listing

    @strawberry.mutation
    async def apply_for_loan(
        self,
        info: Info,
        amount: float,
        collateral_token: str,
        collateral_amount: float,
        farmer_data: dict,
        purpose: Optional[str] = None
    ) -> dict:
        """Apply for a loan with AI credit scoring"""
        # This would integrate with LoanManagerService
        # For now, return mock response
        return {
            "success": True,
            "message": "Loan application submitted for review",
            "loan_id": 123
        }

    @strawberry.mutation
    async def repay_loan(
        self,
        info: Info,
        loan_id: int,
        amount: float
    ) -> dict:
        """Make a loan repayment"""
        # This would integrate with LoanManagerService
        # For now, return mock response
        return {
            "success": True,
            "message": f"Repayment of {amount} processed",
            "remaining_balance": 0.0
        }

    # New Enhanced Contract Mutations
    @strawberry.mutation
    async def stake_tokens(
        self,
        info: Info,
        input: StakingInput
    ) -> dict:
        """Stake tokens for rewards"""
        from ..core.blockchain import blockchain_service
        from ..core.advanced_ai import advanced_ai_service

        # Get AI predictions
        ai_prediction = await advanced_ai_service.predict_staking_rewards(
            input.amount, input.lock_period, []
        )

        # Execute staking
        result = await blockchain_service.stake_tokens(input.amount, input.lock_period)

        return {
            "success": result.get("success", False),
            "tx_hash": result.get("tx_hash"),
            "ai_prediction": ai_prediction
        }

    @strawberry.mutation
    async def create_prediction_market(
        self,
        info: Info,
        input: PredictionMarketInput
    ) -> dict:
        """Create a prediction market"""
        from ..core.blockchain import blockchain_service
        from ..core.advanced_ai import advanced_ai_service

        # Get AI analysis
        ai_analysis = await advanced_ai_service.predict_market_outcomes(
            input.question, input.outcomes, []
        )

        # Create market
        result = await blockchain_service.create_market(
            input.question, input.outcomes, input.end_time, input.fee
        )

        return {
            "success": result.get("success", False),
            "market_id": result.get("market_id"),
            "ai_analysis": ai_analysis
        }

    @strawberry.mutation
    async def lend_tokens(
        self,
        info: Info,
        input: LendingInput
    ) -> dict:
        """Lend tokens in lending protocol"""
        from ..core.blockchain import blockchain_service
        from ..core.advanced_ai import advanced_ai_service

        # Get AI risk assessment
        risk_assessment = await advanced_ai_service.assess_lending_risk(
            {}, input.amount, input.collateral_amount  # TODO: Add borrower data
        )

        # Execute lending
        result = await blockchain_service.lend_tokens(input.amount, 0.08)  # Default rate

        return {
            "success": result.get("success", False),
            "loan_id": result.get("loan_id"),
            "risk_assessment": risk_assessment
        }

    @strawberry.mutation
    async def create_yield_strategy(
        self,
        info: Info,
        input: YieldStrategyInput
    ) -> dict:
        """Create yield aggregation strategy"""
        from ..core.blockchain import blockchain_service
        from ..core.advanced_ai import advanced_ai_service

        # Get AI optimization
        ai_optimization = await advanced_ai_service.optimize_yield_strategy(
            input.protocols, "medium", 1000, 90  # Default values
        )

        # Use AI-optimized allocations
        allocations = [int(ai_optimization["optimal_allocations"].get(p, 0))
                      for p in input.protocols]

        # Create strategy
        result = await blockchain_service.create_strategy(
            input.name, input.description, input.protocols, allocations
        )

        return {
            "success": result.get("success", False),
            "strategy_id": result.get("strategy_id"),
            "ai_optimization": ai_optimization
        }

    @strawberry.mutation
    async def initiate_bridge_transfer(
        self,
        info: Info,
        input: BridgeTransferInput
    ) -> dict:
        """Initiate cross-chain bridge transfer"""
        from ..core.blockchain import blockchain_service

        # Execute bridge transfer
        result = await blockchain_service.initiate_bridge_transfer(
            input.amount, input.target_chain, input.recipient
        )

        return {
            "success": result.get("success", False),
            "transfer_id": result.get("transfer_id"),
            "tx_hash": result.get("tx_hash")
        }

# Create GraphQL schema
schema = strawberry.Schema(query=Query, mutation=Mutation)

# Create GraphQL router
graphql_app = GraphQLRouter(schema)