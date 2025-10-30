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
    amount: float
    interest_rate: float
    duration_months: int
    status: str
    purpose: Optional[str]
    created_at: datetime

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
        limit: int = 50,
        offset: int = 0,
        filter: Optional[LoanFilter] = None
    ) -> List[LoanType]:
        """Get loans with optional filtering"""
        db = next(get_db())

        query = db.query(Loan)

        if filter:
            if filter.status:
                query = query.filter(Loan.status == filter.status)
            if filter.min_amount:
                query = query.filter(Loan.amount >= filter.min_amount)
            if filter.max_amount:
                query = query.filter(Loan.amount <= filter.max_amount)

        loans = query.order_by(Loan.created_at.desc()).offset(offset).limit(limit).all()

        logger.info("GraphQL query: loans", count=len(loans), filter=filter)
        return loans

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

# Create GraphQL schema
schema = strawberry.Schema(query=Query, mutation=Mutation)

# Create GraphQL router
graphql_app = GraphQLRouter(schema)