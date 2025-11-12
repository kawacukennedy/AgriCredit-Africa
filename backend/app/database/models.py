from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Boolean, ForeignKey, JSON, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .config import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    phone = Column(String)
    location = Column(String)
    farm_size = Column(Float)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    role = Column(String, default="farmer")  # farmer, admin, investor
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    sensor_devices = relationship("SensorDevice", back_populates="owner")
    credit_scores = relationship("CreditScore", back_populates="user")
    yield_predictions = relationship("YieldPrediction", back_populates="user")
    loans = relationship("Loan", back_populates="user")
    notifications = relationship("Notification", back_populates="user")

class SensorDevice(Base):
    __tablename__ = "sensor_devices"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String, unique=True, index=True, nullable=False)
    name = Column(String)
    location = Column(String)
    latitude = Column(Float)
    longitude = Column(Float)
    crop_type = Column(String)
    farm_size = Column(Float)
    owner_id = Column(Integer, ForeignKey("users.id"))
    is_active = Column(Boolean, default=True)
    last_seen = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    owner = relationship("User", back_populates="sensor_devices")
    sensor_readings = relationship("SensorReading", back_populates="device")

class SensorReading(Base):
    __tablename__ = "sensor_readings"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(Integer, ForeignKey("sensor_devices.id"), nullable=False, index=True)
    soil_moisture = Column(Float)
    temperature = Column(Float)
    humidity = Column(Float)
    light_level = Column(Float)
    ph_level = Column(Float)
    nitrogen = Column(Float)
    phosphorus = Column(Float)
    potassium = Column(Float)
    rainfall = Column(Float)
    wind_speed = Column(Float)
    solar_radiation = Column(Float)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    # Relationships
    device = relationship("SensorDevice", back_populates="sensor_readings")

# Composite index for device readings queries
Index('idx_sensor_readings_device_timestamp', SensorReading.device_id, SensorReading.timestamp)

class CreditScore(Base):
    __tablename__ = "credit_scores"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    score = Column(Float, nullable=False)
    risk_level = Column(String, nullable=False)  # Low, Medium, High
    trust_score = Column(Integer)  # 1-3 scale
    confidence = Column(Float)
    features_used = Column(JSON)
    explanation = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="credit_scores")

class YieldPrediction(Base):
    __tablename__ = "yield_predictions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    crop_type = Column(String, nullable=False)
    predicted_yield = Column(Float, nullable=False)
    unit = Column(String, default="tons/hectare")
    confidence_interval_lower = Column(Float)
    confidence_interval_upper = Column(Float)
    features_used = Column(JSON)
    important_factors = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="yield_predictions")

class ClimateAnalysis(Base):
    __tablename__ = "climate_analyses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    co2_sequestered = Column(Float)
    ndvi_score = Column(Float)
    carbon_tokens_mintable = Column(Float)
    recommendations = Column(JSON)
    confidence = Column(Float)
    satellite_data = Column(JSON)
    iot_data = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Loan(Base):
    __tablename__ = "loans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    borrower_address = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    interest_rate = Column(Float, nullable=False)
    duration = Column(Integer, nullable=False)  # in seconds
    collateral_token = Column(String, nullable=False)
    collateral_amount = Column(Float, nullable=False)
    credit_score = Column(Integer, nullable=False)
    risk_level = Column(String, nullable=False)
    trust_score = Column(Integer, nullable=False)
    status = Column(String, default="pending", index=True)  # pending, approved, active, repaid, defaulted
    repaid_amount = Column(Float, default=0.0)
    total_owed = Column(Float, nullable=False)
    collateral_returned = Column(Boolean, default=False)
    purpose = Column(String)
    explainability = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    approved_at = Column(DateTime(timezone=True))
    disbursed_at = Column(DateTime(timezone=True))
    repaid_at = Column(DateTime(timezone=True))
    defaulted_at = Column(DateTime(timezone=True))

    # Relationships
    user = relationship("User", back_populates="loans")
    repayments = relationship("LoanRepayment", back_populates="loan")

class LoanRepayment(Base):
    __tablename__ = "loan_repayments"

    id = Column(Integer, primary_key=True, index=True)
    loan_id = Column(Integer, ForeignKey("loans.id"), nullable=False)
    amount = Column(Float, nullable=False)
    due_date = Column(DateTime(timezone=True), nullable=False)
    paid_date = Column(DateTime(timezone=True))
    status = Column(String, default="pending")  # pending, paid, overdue
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    loan = relationship("Loan", back_populates="repayments")

class MarketplaceListing(Base):
    __tablename__ = "marketplace_listings"

    id = Column(Integer, primary_key=True, index=True)
    seller_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    crop_type = Column(String, nullable=False, index=True)
    quantity = Column(Float, nullable=False)
    unit = Column(String, default="tons")
    price_per_unit = Column(Float, nullable=False)
    location = Column(String, index=True)
    quality_grade = Column(String)
    harvest_date = Column(DateTime(timezone=True))
    expiry_date = Column(DateTime(timezone=True))
    status = Column(String, default="active", index=True)  # active, sold, expired
    images = Column(JSON)  # Array of image URLs
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

class MarketplaceEscrow(Base):
    __tablename__ = "marketplace_escrows"

    id = Column(Integer, primary_key=True, index=True)
    buyer_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    seller_address = Column(String, nullable=False, index=True)
    amount = Column(Float, nullable=False)
    token_address = Column(String, nullable=False)
    listing_id = Column(Integer, ForeignKey("marketplace_listings.id"), nullable=False, index=True)
    geo_location = Column(String)
    status = Column(String, default="active", index=True)  # active, delivered, completed, disputed
    escrow_contract_address = Column(String)  # Blockchain escrow contract address
    transaction_hash = Column(String, index=True)
    delivered_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    # Relationships
    buyer = relationship("User", foreign_keys=[buyer_id])
    listing = relationship("MarketplaceListing", foreign_keys=[listing_id])

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String, default="info", index=True)  # info, warning, success, error
    is_read = Column(Boolean, default=False, index=True)
    data = Column(JSON)  # Additional data for the notification
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    # Relationships
    user = relationship("User", back_populates="notifications")

# Composite index for unread notifications
Index('idx_notifications_user_unread', Notification.user_id, Notification.is_read)

class CarbonCredit(Base):
    __tablename__ = "carbon_credits"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    amount = Column(Float, nullable=False)
    transaction_type = Column(String, nullable=False, index=True)  # minted, transferred, retired
    transaction_hash = Column(String, index=True)
    verification_proof = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

class GovernanceProposal(Base):
    __tablename__ = "governance_proposals"

    id = Column(Integer, primary_key=True, index=True)
    proposal_id = Column(Integer, unique=True, index=True)  # Blockchain proposal ID
    proposer_address = Column(String, nullable=False, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    targets = Column(JSON)  # Array of contract addresses
    values = Column(JSON)  # Array of ETH values
    signatures = Column(JSON)  # Array of function signatures
    calldatas = Column(JSON)  # Array of function call data
    start_block = Column(Integer)
    end_block = Column(Integer)
    state = Column(String, default="pending", index=True)  # pending, active, canceled, defeated, succeeded, queued, expired, executed
    transaction_hash = Column(String, index=True)
    execution_tx_hash = Column(String)
    executed_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    # Relationships
    votes = relationship("GovernanceVote", back_populates="proposal")

class GovernanceVote(Base):
    __tablename__ = "governance_votes"

    id = Column(Integer, primary_key=True, index=True)
    proposal_id = Column(Integer, ForeignKey("governance_proposals.proposal_id"), nullable=False, index=True)
    voter_address = Column(String, nullable=False, index=True)
    support = Column(Boolean, nullable=False)  # True for yes, False for no
    voting_power = Column(Integer, nullable=False)
    reason = Column(Text)  # Optional voting reason
    transaction_hash = Column(String, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    # Relationships
    proposal = relationship("GovernanceProposal", back_populates="votes")

# Composite index for proposal votes
Index('idx_governance_votes_proposal_voter', GovernanceVote.proposal_id, GovernanceVote.voter_address)

class FarmNFT(Base):
    __tablename__ = "farm_nfts"

    id = Column(Integer, primary_key=True, index=True)
    token_id = Column(Integer, unique=True, index=True)  # Blockchain token ID
    farmer_address = Column(String, nullable=False, index=True)
    farm_name = Column(String, nullable=False)
    location = Column(String, nullable=False, index=True)
    size = Column(Float, nullable=False)  # Size in hectares
    crop_type = Column(String, nullable=False, index=True)
    expected_yield = Column(Float, nullable=False)  # Expected yield in tons
    soil_type = Column(String)
    irrigation_type = Column(String)
    certifications = Column(JSON)  # List of certifications
    metadata_uri = Column(String)  # IPFS metadata URI
    status = Column(String, default="minting", index=True)  # minting, minted, harvested
    transaction_hash = Column(String, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    # Relationships
    harvests = relationship("HarvestRecord", back_populates="nft")

class HarvestRecord(Base):
    __tablename__ = "harvest_records"

    id = Column(Integer, primary_key=True, index=True)
    token_id = Column(Integer, ForeignKey("farm_nfts.token_id"), nullable=False, index=True)
    actual_yield = Column(Float, nullable=False)  # Actual yield in tons
    harvest_date = Column(DateTime(timezone=True), nullable=False, index=True)
    quality_grade = Column(String)  # A, B, C, etc.
    notes = Column(Text)  # Additional harvest notes
    transaction_hash = Column(String, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    # Relationships
    nft = relationship("FarmNFT", back_populates="harvests")

# Composite index for harvest records
Index('idx_harvest_records_token_date', HarvestRecord.token_id, HarvestRecord.harvest_date)

class LiquidityPosition(Base):
    __tablename__ = "liquidity_positions"

    id = Column(Integer, primary_key=True, index=True)
    user_address = Column(String, nullable=False, index=True)
    token_a = Column(String, nullable=False, index=True)
    token_b = Column(String, nullable=False, index=True)
    amount_a = Column(Float, nullable=False)
    amount_b = Column(Float, nullable=False)
    liquidity_tokens = Column(Float, nullable=False)
    fee = Column(Integer, default=30)  # Fee in basis points (0.3%)
    pool_address = Column(String, index=True)  # Blockchain pool address
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    # Relationships
    rewards = relationship("PoolReward", back_populates="position")

class PoolReward(Base):
    __tablename__ = "pool_rewards"

    id = Column(Integer, primary_key=True, index=True)
    position_id = Column(Integer, ForeignKey("liquidity_positions.id"), nullable=False, index=True)
    user_address = Column(String, nullable=False, index=True)
    reward_amount = Column(Float, nullable=False)
    reward_token = Column(String, nullable=False)
    claimed_at = Column(DateTime(timezone=True), nullable=False, index=True)

    # Relationships
    position = relationship("LiquidityPosition", back_populates="rewards")

# Composite index for pool rewards
Index('idx_pool_rewards_position_claimed', PoolReward.position_id, PoolReward.claimed_at)

class CrossChainTransaction(Base):
    __tablename__ = "cross_chain_transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_address = Column(String, nullable=False, index=True)
    from_chain = Column(String, nullable=False, index=True)
    to_chain = Column(String, nullable=False, index=True)
    token_symbol = Column(String, nullable=False, index=True)
    amount = Column(Float, nullable=False)
    recipient_address = Column(String, nullable=False)
    bridge_fee = Column(Float, nullable=False)
    status = Column(String, default="initiated", index=True)  # initiated, locked, bridging, completed, failed
    source_tx_hash = Column(String, index=True)
    destination_tx_hash = Column(String, index=True)
    estimated_completion = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

# Composite index for cross-chain transactions
Index('idx_cross_chain_user_status', CrossChainTransaction.user_address, CrossChainTransaction.status)