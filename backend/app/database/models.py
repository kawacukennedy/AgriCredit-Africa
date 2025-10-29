from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Boolean, ForeignKey, JSON
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
    device_id = Column(Integer, ForeignKey("sensor_devices.id"), nullable=False)
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
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    device = relationship("SensorDevice", back_populates="sensor_readings")

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
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    amount = Column(Float, nullable=False)
    interest_rate = Column(Float, nullable=False)
    duration_months = Column(Integer, nullable=False)
    status = Column(String, default="pending")  # pending, approved, rejected, active, completed
    purpose = Column(String)
    collateral = Column(JSON)
    repayment_schedule = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    approved_at = Column(DateTime(timezone=True))
    disbursed_at = Column(DateTime(timezone=True))

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
    seller_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text)
    crop_type = Column(String, nullable=False)
    quantity = Column(Float, nullable=False)
    unit = Column(String, default="tons")
    price_per_unit = Column(Float, nullable=False)
    location = Column(String)
    quality_grade = Column(String)
    harvest_date = Column(DateTime(timezone=True))
    expiry_date = Column(DateTime(timezone=True))
    status = Column(String, default="active")  # active, sold, expired
    images = Column(JSON)  # Array of image URLs
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String, default="info")  # info, warning, success, error
    is_read = Column(Boolean, default=False)
    data = Column(JSON)  # Additional data for the notification
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="notifications")

class CarbonCredit(Base):
    __tablename__ = "carbon_credits"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    amount = Column(Float, nullable=False)
    transaction_type = Column(String, nullable=False)  # minted, transferred, retired
    transaction_hash = Column(String)
    verification_proof = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())