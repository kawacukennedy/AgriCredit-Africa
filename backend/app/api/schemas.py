from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime

# User schemas
class UserBase(BaseModel):
    email: EmailStr
    username: str
    full_name: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    farm_size: Optional[float] = None

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    farm_size: Optional[float] = None

class User(UserBase):
    id: int
    is_active: bool
    is_verified: bool
    role: str
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True

# Authentication schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class LoginRequest(BaseModel):
    username: str
    password: str

# Sensor data schemas
class SensorReadingBase(BaseModel):
    soil_moisture: float
    temperature: float
    humidity: float
    light_level: float
    ph_level: Optional[float] = None
    nitrogen: Optional[float] = None
    phosphorus: Optional[float] = None
    potassium: Optional[float] = None
    rainfall: Optional[float] = None
    wind_speed: Optional[float] = None
    solar_radiation: Optional[float] = None

class SensorReadingCreate(SensorReadingBase):
    device_id: str
    timestamp: Optional[datetime] = None

class SensorReading(SensorReadingBase):
    id: int
    device_id: str
    timestamp: datetime

    class Config:
        from_attributes = True

class SensorDeviceBase(BaseModel):
    device_id: str
    name: Optional[str] = None
    location: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    crop_type: Optional[str] = None
    farm_size: Optional[float] = None

class SensorDeviceCreate(SensorDeviceBase):
    pass

class SensorDevice(SensorDeviceBase):
    id: int
    owner_id: int
    is_active: bool
    last_seen: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True

# AI Model schemas
class CreditScoringRequest(BaseModel):
    crop_type: str
    farm_size: float
    location: str
    historical_data: Optional[Dict[str, Any]] = None
    mobile_money_usage: Optional[float] = None
    cooperative_membership: Optional[bool] = None

class CreditScore(BaseModel):
    id: int
    user_id: int
    score: float
    risk_level: str
    trust_score: int
    confidence: float
    explanation: List[str]
    created_at: datetime

    class Config:
        from_attributes = True

class YieldPredictionRequest(BaseModel):
    crop_type: str
    farm_size: float
    location: str
    weather_data: Optional[Dict[str, Any]] = None
    soil_quality: Optional[float] = None
    irrigation_access: Optional[bool] = None

class YieldPrediction(BaseModel):
    id: int
    user_id: int
    crop_type: str
    predicted_yield: float
    unit: str
    confidence_interval_lower: float
    confidence_interval_upper: float
    important_factors: List[str]
    created_at: datetime

    class Config:
        from_attributes = True

class ClimateAnalysisRequest(BaseModel):
    satellite_data: Dict[str, Any]
    iot_sensors: Optional[Dict[str, Any]] = None

class ClimateAnalysis(BaseModel):
    id: int
    user_id: Optional[int]
    co2_sequestered: float
    ndvi_score: float
    carbon_tokens_mintable: float
    recommendations: List[str]
    confidence: float
    created_at: datetime

    class Config:
        from_attributes = True

# Loan schemas
class LoanBase(BaseModel):
    amount: float
    interest_rate: float
    duration_months: int
    purpose: Optional[str] = None

class LoanCreate(LoanBase):
    pass

class Loan(LoanBase):
    id: int
    user_id: int
    status: str
    repayment_schedule: Optional[Dict[str, Any]]
    created_at: datetime
    approved_at: Optional[datetime]
    disbursed_at: Optional[datetime]

    class Config:
        from_attributes = True

# Marketplace schemas
class MarketplaceListingBase(BaseModel):
    title: str
    description: Optional[str] = None
    crop_type: str
    quantity: float
    unit: str = "tons"
    price_per_unit: float
    location: Optional[str] = None
    quality_grade: Optional[str] = None
    harvest_date: Optional[datetime] = None
    expiry_date: Optional[datetime] = None

class MarketplaceListingCreate(MarketplaceListingBase):
    pass

class MarketplaceListing(MarketplaceListingBase):
    id: int
    seller_id: int
    status: str
    images: Optional[List[str]]
    created_at: datetime

    class Config:
        from_attributes = True

# Notification schemas
class NotificationBase(BaseModel):
    title: str
    message: str
    type: str = "info"

class Notification(NotificationBase):
    id: int
    user_id: int
    is_read: bool
    data: Optional[Dict[str, Any]]
    created_at: datetime

    class Config:
        from_attributes = True

# Carbon credit schemas
class CarbonCreditBase(BaseModel):
    amount: float
    transaction_type: str
    transaction_hash: Optional[str] = None
    verification_proof: Optional[Dict[str, Any]] = None

class CarbonCredit(CarbonCreditBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True