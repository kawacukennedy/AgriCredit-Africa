from fastapi import FastAPI, Depends, HTTPException, status, BackgroundTasks, Request, WebSocket, UploadFile, File, Form, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
import structlog
import time
import json
import os
import shutil
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from .database.config import get_db, engine, Base
from .database.models import User, SensorDevice, SensorReading, CreditScore, YieldPrediction, ClimateAnalysis, Loan, MarketplaceListing, MarketplaceEscrow, Notification, CarbonCredit
from .core.config import settings
from .core.security import verify_password, get_password_hash, create_access_token, verify_token
from .core.cache import get_cache
from .core.email import email_service
from .core.websocket import websocket_endpoint
from .core.monitoring import MonitoringMiddleware, metrics_endpoint, get_health_status
from .core.ipfs import IPFSService
from .core.blockchain import blockchain_service
from .core.event_listener import event_listener
from .core.governance import governance_manager
from .core.nft_farming import nft_farming_manager
from .core.liquidity_pool import liquidity_pool_manager
from .core.cross_chain import cross_chain_bridge
from .core.tasks import (
    process_sensor_data_async,
    send_notification_async,
    update_oracle_feeds_async,
    process_loan_application_async
)
from .core.advanced_ai import advanced_ai_service
from .core.external_apis import external_apis_service
from .core.api_utils import (
    PaginationParams, PaginatedResponse, FilterParams,
    api_response, pagination_helper, filter_helper, audit_helper
)
from .api.graphql import graphql_app
from .api.schemas import (
    User as UserSchema, UserCreate, UserUpdate, Token, LoginRequest,
    SensorReading as SensorReadingSchema, SensorReadingCreate,
    SensorDevice as SensorDeviceSchema, SensorDeviceCreate,
    CreditScoringRequest, CreditScore as CreditScoreSchema,
    YieldPredictionRequest, YieldPrediction as YieldPredictionSchema,
    ClimateAnalysisRequest, ClimateAnalysis as ClimateAnalysisSchema,
    Loan as LoanSchema, LoanCreate,
    MarketplaceListing as MarketplaceListingSchema, MarketplaceListingCreate,
    Notification as NotificationSchema, CarbonCredit as CarbonCreditSchema
)
from models.credit_scoring_model import CreditScoringModel
from models.yield_prediction_model import YieldPredictionModel
from models.climate_model import ClimateAnalysisModel

# Configure structured logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger(),
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address, default_limits=["100/minute"])

# Specific limiters for AI endpoints
ai_limiter = limiter.limit("10/minute")  # Stricter limits for AI endpoints

# Create database tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title="AgriCredit AI Services",
    description="Comprehensive agricultural credit and AI services platform",
    version="2.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    contact={
        "name": "AgriCredit Support",
        "email": "kawacukent@gmail.com",
        "url": "https://agricredit.africa"
    },
    license_info={
        "name": "MIT",
        "url": "https://opensource.org/licenses/MIT"
    }
)

# Add rate limiting middleware
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add security middleware
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=settings.ALLOWED_HOSTS if hasattr(settings, 'ALLOWED_HOSTS') else ["*"]
)

# Add compression middleware
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Add monitoring middleware
app.add_middleware(MonitoringMiddleware)

# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()

    # Log incoming request
    logger.info(
        "Request started",
        method=request.method,
        url=str(request.url),
        client_ip=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent")
    )

    try:
        response = await call_next(request)
        process_time = time.time() - start_time

        # Log response
        logger.info(
            "Request completed",
            method=request.method,
            url=str(request.url),
            status_code=response.status_code,
            process_time=f"{process_time:.3f}s"
        )

        # Add processing time to response headers
        response.headers["X-Process-Time"] = str(process_time)
        return response

    except Exception as e:
        process_time = time.time() - start_time
        logger.error(
            "Request failed",
            method=request.method,
            url=str(request.url),
            error=str(e),
            process_time=f"{process_time:.3f}s"
        )
        raise

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# Initialize AI models
credit_model = CreditScoringModel()
yield_model = YieldPredictionModel()
climate_model = ClimateAnalysisModel()

# Initialize IPFS service
ipfs_service = IPFSService(api_url=settings.IPFS_API_URL if hasattr(settings, 'IPFS_API_URL') else "http://localhost:5001")

# Dependency to get current user
async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    username = verify_token(token)
    if username is None:
        raise credentials_exception

    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise credentials_exception
    return user

# Dependency to get current active user
async def get_current_active_user(current_user: User = Depends(get_current_user)):
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

# Authentication routes
@app.post(
    "/auth/register",
    response_model=UserSchema,
    summary="Register a new user",
    description="Create a new user account with the provided information. The user will be able to authenticate and access the platform features.",
    responses={
        200: {"description": "User successfully registered"},
        400: {"description": "Email or username already exists"}
    }
)
async def register_user(user_data: UserCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Register a new user"""
    # Check if user already exists
    db_user = db.query(User).filter(
        (User.email == user_data.email) | (User.username == user_data.username)
    ).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email or username already registered")

    # Create new user
    hashed_password = get_password_hash(user_data.password)
    db_user = User(
        email=user_data.email,
        username=user_data.username,
        hashed_password=hashed_password,
        full_name=user_data.full_name,
        phone=user_data.phone,
        location=user_data.location,
        farm_size=user_data.farm_size
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    # Send welcome email asynchronously
    background_tasks.add_task(
        email_service.send_welcome_email,
        db_user.email,
        db_user.full_name or db_user.username
    )

    logger.info("User registered", user_id=db_user.id, username=db_user.username)
    return db_user

@app.post(
    "/auth/login",
    response_model=Token,
    summary="Authenticate user",
    description="Login with username and password to obtain an access token for API authentication.",
    responses={
        200: {"description": "Login successful, returns access token"},
        401: {"description": "Invalid username or password"}
    }
)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Authenticate user and return access token"""
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )

    logger.info("User logged in", user_id=user.id, username=user.username)
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/auth/me", response_model=UserSchema)
async def get_current_user_info(current_user: User = Depends(get_current_active_user)):
    """Get current user information"""
    return current_user

@app.put("/auth/me", response_model=UserSchema)
async def update_current_user(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update current user information"""
    for field, value in user_update.dict(exclude_unset=True).items():
        setattr(current_user, field, value)

    db.commit()
    db.refresh(current_user)

    logger.info("User updated", user_id=current_user.id, username=current_user.username)
    return current_user

# Sensor device management
@app.post("/devices", response_model=SensorDeviceSchema)
async def register_device(
    device_data: SensorDeviceCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Register a new IoT sensor device"""
    # Check if device already exists
    existing_device = db.query(SensorDevice).filter(
        SensorDevice.device_id == device_data.device_id
    ).first()
    if existing_device:
        raise HTTPException(status_code=400, detail="Device already registered")

    # Create new device
    db_device = SensorDevice(
        **device_data.dict(),
        owner_id=current_user.id
    )
    db.add(db_device)
    db.commit()
    db.refresh(db_device)

    logger.info("Device registered", device_id=db_device.device_id, user_id=current_user.id)
    return db_device

@app.get("/devices", response_model=List[SensorDeviceSchema])
async def get_user_devices(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all devices owned by current user"""
    devices = db.query(SensorDevice).filter(SensorDevice.owner_id == current_user.id).all()
    return devices

@app.get("/devices/{device_id}", response_model=SensorDeviceSchema)
async def get_device(
    device_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get specific device information"""
    device = db.query(SensorDevice).filter(
        SensorDevice.device_id == device_id,
        SensorDevice.owner_id == current_user.id
    ).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    return device

# Sensor data endpoints
@app.post("/sensor-data")
async def receive_sensor_data(
    data: SensorReadingCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Receive IoT sensor data"""
    try:
        # Verify device exists
        device = db.query(SensorDevice).filter(SensorDevice.device_id == data.device_id).first()
        if not device:
            raise HTTPException(status_code=404, detail="Device not found")

        # Ensure timestamp
        timestamp = data.timestamp or datetime.utcnow()

        # Create sensor reading
        db_reading = SensorReading(
            device_id=device.id,
            timestamp=timestamp,
            **data.dict(exclude={'device_id', 'timestamp'})
        )
        db.add(db_reading)

        # Update device last_seen
        device.last_seen = timestamp
        db.commit()

        # Add background task for data analysis
        background_tasks.add_task(analyze_sensor_data, device.id, db_reading.id)

        logger.info("Sensor data received", device_id=data.device_id, reading_id=db_reading.id)
        return {"status": "success", "message": "Sensor data received"}

    except Exception as e:
        logger.error("Failed to process sensor data", error=str(e), device_id=data.device_id)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/sensor-data/{device_id}")
async def get_sensor_data(
    device_id: str,
    hours: int = 24,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
    cache_client = Depends(get_cache)
):
    """Get historical sensor data for a device"""
    # Verify device ownership
    device = db.query(SensorDevice).filter(
        SensorDevice.device_id == device_id,
        SensorDevice.owner_id == current_user.id
    ).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

    # Try to get from cache first
    cached_data = await cache_client.get_sensor_data(device_id, hours)
    if cached_data:
        logger.info("Sensor data served from cache", device_id=device_id, hours=hours)
        return cached_data

    # Get readings within time range
    cutoff_time = datetime.utcnow() - timedelta(hours=hours)
    readings = db.query(SensorReading).filter(
        SensorReading.device_id == device.id,
        SensorReading.timestamp >= cutoff_time
    ).order_by(SensorReading.timestamp.desc()).all()

    result = {
        "status": "success",
        "device_id": device_id,
        "data": [
            {
                "soilMoisture": r.soil_moisture,
                "temperature": r.temperature,
                "humidity": r.humidity,
                "lightLevel": r.light_level,
                "phLevel": r.ph_level,
                "nitrogen": r.nitrogen,
                "phosphorus": r.phosphorus,
                "potassium": r.potassium,
                "rainfall": r.rainfall,
                "windSpeed": r.wind_speed,
                "solarRadiation": r.solar_radiation,
                "timestamp": r.timestamp.isoformat()
            } for r in readings
        ]
    }

    # Cache the result
    await cache_client.set_sensor_data(device_id, hours, result)

    logger.info("Sensor data retrieved from database", device_id=device_id, hours=hours, readings_count=len(readings))
    return result

@app.get("/sensor-data/{device_id}/latest")
async def get_latest_sensor_data(
    device_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get the latest sensor reading for a device"""
    # Verify device ownership
    device = db.query(SensorDevice).filter(
        SensorDevice.device_id == device_id,
        SensorDevice.owner_id == current_user.id
    ).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

    # Get latest reading
    latest_reading = db.query(SensorReading).filter(
        SensorReading.device_id == device.id
    ).order_by(SensorReading.timestamp.desc()).first()

    if not latest_reading:
        return {
            "status": "success",
            "data": {
                "soilMoisture": 65.0,
                "temperature": 24.5,
                "humidity": 70.0,
                "lightLevel": 85.0,
                "phLevel": 6.8,
                "timestamp": datetime.utcnow().isoformat()
            }
        }

    return {
        "status": "success",
        "data": {
            "soilMoisture": latest_reading.soil_moisture,
            "temperature": latest_reading.temperature,
            "humidity": latest_reading.humidity,
            "lightLevel": latest_reading.light_level,
            "phLevel": latest_reading.ph_level,
            "nitrogen": latest_reading.nitrogen,
            "phosphorus": latest_reading.phosphorus,
            "potassium": latest_reading.potassium,
            "rainfall": latest_reading.rainfall,
            "windSpeed": latest_reading.wind_speed,
            "solarRadiation": latest_reading.solar_radiation,
            "timestamp": latest_reading.timestamp.isoformat()
        }
    }

# AI Model endpoints
@app.post(
    "/ai/credit-scoring",
    summary="AI Credit Scoring",
    description="""Analyze farmer's creditworthiness using AI models that consider:
    - Farm size and location
    - Historical repayment data
    - Mobile money usage patterns
    - Satellite NDVI data
    - Cooperative membership
    - Weather risk assessment

    Returns credit score, risk level, and explainability factors.""",
    responses={
        200: {"description": "Credit scoring analysis completed successfully"},
        500: {"description": "Internal server error during analysis"}
    }
)
async def credit_scoring(
    request: CreditScoringRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
    cache_client = Depends(get_cache)
):
    """Perform credit scoring analysis"""
    try:
        # Extract features
        features = [
            request.farm_size,
            request.historical_data.get('repayment_rate', 0.7) if request.historical_data else 0.7,
            request.mobile_money_usage or 5.0,
            request.historical_data.get('satellite_ndvi', 0.6) if request.historical_data else 0.6,
            request.historical_data.get('weather_risk', 0.3) if request.historical_data else 0.3,
            1.0 if request.cooperative_membership else 0.0,
            request.historical_data.get('loan_history', 1) if request.historical_data else 1,
            request.historical_data.get('income_stability', 0.7) if request.historical_data else 0.7,
            request.historical_data.get('location_risk', 0.2) if request.historical_data else 0.2,
            request.historical_data.get('crop_diversity', 2) if request.historical_data else 2
        ]

        # Create features hash for caching
        features_hash = str(hash(tuple(features)))

        # Check cache first
        cached_result = await cache_client.get_credit_score(current_user.id, features_hash)
        if cached_result:
            logger.info("Credit scoring served from cache", user_id=current_user.id)
            return {"status": "success", "data": cached_result}

        # Get prediction
        result = credit_model.predict(features)

        # Save to database
        db_credit_score = CreditScore(
            user_id=current_user.id,
            score=result['credit_score'],
            risk_level=result['risk_level'],
            trust_score=result['trust_score'],
            confidence=result['confidence'],
            features_used=features,
            explanation=result['explainability']
        )
        db.add(db_credit_score)
        db.commit()

        # Cache the result
        await cache_client.set_credit_score(current_user.id, features_hash, result)

        logger.info("Credit scoring completed", user_id=current_user.id, score=result['credit_score'])
        return {"status": "success", "data": result}

    except Exception as e:
        logger.error("Credit scoring failed", error=str(e), user_id=current_user.id)
        raise HTTPException(status_code=500, detail=str(e))

@app.post(
    "/ai/yield-prediction",
    summary="AI Yield Prediction",
    description="""Predict crop yield using advanced AI models that analyze:
    - Farm size and crop type
    - Soil quality and composition
    - Weather patterns and forecasts
    - Fertilizer usage and pest control
    - Irrigation access and farming experience

    Returns predicted yield with confidence intervals and key influencing factors.""",
    responses={
        200: {"description": "Yield prediction analysis completed successfully"},
        500: {"description": "Internal server error during analysis"}
    }
)
async def yield_prediction(
    request: YieldPredictionRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
    cache_client = Depends(get_cache)
):
    """Perform yield prediction analysis"""
    try:
        # Extract features
        features = [
            request.farm_size,
            request.soil_quality or 0.7,
            request.weather_data.get('rainfall', 800) if request.weather_data else 800,
            request.weather_data.get('temperature', 25) if request.weather_data else 25,
            request.weather_data.get('fertilizer_usage', 1.5) if request.weather_data else 1.5,
            1.0 if request.weather_data and request.weather_data.get('pest_control') else 0.0,
            request.weather_data.get('crop_variety', 2) if request.weather_data else 2,
            request.weather_data.get('farming_experience', 8) if request.weather_data else 8,
            1.0 if request.irrigation_access else 0.0,
            request.weather_data.get('market_distance', 1.0) if request.weather_data else 1.0
        ]

        # Create features hash for caching
        features_hash = str(hash(tuple(features)))

        # Check cache first
        cached_result = await cache_client.get_yield_prediction(current_user.id, features_hash)
        if cached_result:
            logger.info("Yield prediction served from cache", user_id=current_user.id)
            return {"status": "success", "data": cached_result}

        # Get prediction
        result = yield_model.predict(features)

        # Save to database
        db_yield_pred = YieldPrediction(
            user_id=current_user.id,
            crop_type=request.crop_type,
            predicted_yield=result['predicted_yield'],
            unit=result['unit'],
            confidence_interval_lower=result['confidence_interval'][0],
            confidence_interval_upper=result['confidence_interval'][1],
            features_used=features,
            important_factors=result['factors']
        )
        db.add(db_yield_pred)
        db.commit()

        # Cache the result
        await cache_client.set_yield_prediction(current_user.id, features_hash, result)

        logger.info("Yield prediction completed", user_id=current_user.id, yield_value=result['predicted_yield'])
        return {"status": "success", "data": result}

    except Exception as e:
        logger.error("Yield prediction failed", error=str(e), user_id=current_user.id)
        raise HTTPException(status_code=500, detail=str(e))

@app.post(
    "/ai/climate-analysis",
    summary="AI Climate Impact Analysis",
    description="""Analyze environmental impact and carbon sequestration using:
    - Satellite imagery and NDVI data
    - IoT sensor readings
    - Land use patterns and crop types

    Generates carbon credits and provides sustainability recommendations.""",
    responses={
        200: {"description": "Climate analysis completed successfully"},
        500: {"description": "Internal server error during analysis"}
    }
)
async def climate_analysis_endpoint(
    request: ClimateAnalysisRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Perform climate impact analysis"""
    try:
        # Analyze climate impact
        result = climate_model.analyze_climate_impact(request.satellite_data, request.iot_sensors or {})

        # Save to database
        db_climate_analysis = ClimateAnalysis(
            user_id=current_user.id,
            co2_sequestered=result['co2_sequestered'],
            ndvi_score=result['ndvi_score'],
            carbon_tokens_mintable=result['carbon_tokens_mintable'],
            recommendations=result['recommendations'],
            confidence=result['confidence'],
            satellite_data=request.satellite_data,
            iot_data=request.iot_sensors
        )
        db.add(db_climate_analysis)
        db.commit()

        logger.info("Climate analysis completed", user_id=current_user.id, co2=result['co2_sequestered'])
        return {"status": "success", "data": result}

    except Exception as e:
        logger.error("Climate analysis failed", error=str(e), user_id=current_user.id)
        raise HTTPException(status_code=500, detail=str(e))

# Input validation functions
async def validate_image_upload(file: UploadFile):
    """Validate image upload for AI analysis"""
    # Check file size (max 10MB)
    file_size = 0
    content = await file.read()
    file_size = len(content)
    await file.seek(0)  # Reset file pointer

    if file_size > 10 * 1024 * 1024:  # 10MB
        raise HTTPException(status_code=400, detail="File size too large. Maximum size is 10MB")

    # Check file type
    allowed_types = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail=f"Invalid file type. Allowed types: {', '.join(allowed_types)}")

    # Basic image validation (check if it's actually an image)
    if not content.startswith(b'\xff\xd8') and not content.startswith(b'\x89PNG') and not content.startswith(b'RIFF'):
        raise HTTPException(status_code=400, detail="Invalid image file")

def validate_text_input(text: str, max_length: int = 1000):
    """Validate text input for AI analysis"""
    if not text or len(text.strip()) == 0:
        raise HTTPException(status_code=400, detail="Text input cannot be empty")

    if len(text) > max_length:
        raise HTTPException(status_code=400, detail=f"Text input too long. Maximum length is {max_length} characters")

    # Check for potentially harmful content
    harmful_patterns = ['<script', 'javascript:', 'onload=', 'onerror=']
    text_lower = text.lower()
    for pattern in harmful_patterns:
        if pattern in text_lower:
            raise HTTPException(status_code=400, detail="Invalid input content detected")

# Advanced AI endpoints with specific rate limits
@ai_limiter
@app.post(
    "/ai/crop-health-analysis",
    summary="Advanced Crop Health Analysis",
    description="""Analyze crop health using computer vision and AI models.
    Supports disease detection, pest identification, and growth stage assessment.""",
    responses={
        200: {"description": "Crop health analysis completed successfully"},
        500: {"description": "Internal server error during analysis"}
    }
)
async def analyze_crop_health(
    file: UploadFile = File(...),
    crop_type: str = Form(...),
    location: str = Form(...),
    current_user: User = Depends(get_current_active_user)
):
    """Advanced crop health analysis using AI vision models"""
    try:
        # Validate file
        await validate_image_upload(file)

        # Validate inputs
        if not crop_type or len(crop_type.strip()) == 0:
            raise HTTPException(status_code=400, detail="Crop type is required")
        if not location or len(location.strip()) == 0:
            raise HTTPException(status_code=400, detail="Location is required")

        # Validate crop type
        valid_crop_types = ['corn', 'wheat', 'rice', 'soybean', 'maize', 'barley', 'oats']
        if crop_type.lower() not in valid_crop_types:
            raise HTTPException(status_code=400, detail=f"Invalid crop type. Valid types: {', '.join(valid_crop_types)}")

        # Read image data
        image_data = await file.read()

        # Analyze crop health
        result = await advanced_ai_service.analyze_crop_health(image_data, crop_type, location)

        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])

        logger.info("Crop health analysis completed", user_id=current_user.id, crop_type=crop_type)
        return {"status": "success", "data": result}

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Crop health analysis failed", error=str(e), user_id=current_user.id)
        raise HTTPException(status_code=500, detail=str(e))

@ai_limiter
@app.post(
    "/ai/market-price-prediction",
    summary="Advanced Market Price Prediction",
    description="""Predict agricultural commodity prices using advanced time series analysis
    and market sentiment analysis. Provides short-term and long-term forecasts.""",
    responses={
        200: {"description": "Market price prediction completed successfully"},
        500: {"description": "Internal server error during prediction"}
    }
)
async def predict_market_prices(
    commodity: str,
    location: str,
    historical_data: List[Dict[str, Any]],
    days_ahead: int = 7,
    current_user: User = Depends(get_current_active_user)
):
    """Advanced market price prediction"""
    try:
        # Validate inputs
        if not commodity or len(commodity.strip()) == 0:
            raise HTTPException(status_code=400, detail="Commodity is required")
        if not location or len(location.strip()) == 0:
            raise HTTPException(status_code=400, detail="Location is required")

        # Validate days_ahead
        if days_ahead < 1 or days_ahead > 30:
            raise HTTPException(status_code=400, detail="Days ahead must be between 1 and 30")

        # Validate historical data
        if not historical_data or len(historical_data) < 7:
            raise HTTPException(status_code=400, detail="At least 7 days of historical data required")

        # Validate data structure
        for item in historical_data:
            if not isinstance(item, dict) or 'price' not in item:
                raise HTTPException(status_code=400, detail="Historical data must contain 'price' field")

        # Validate commodity type
        valid_commodities = ['corn', 'wheat', 'rice', 'soybean', 'maize', 'barley', 'oats', 'coffee', 'cocoa']
        if commodity.lower() not in valid_commodities:
            raise HTTPException(status_code=400, detail=f"Invalid commodity. Valid types: {', '.join(valid_commodities)}")
        result = await advanced_ai_service.predict_market_prices(
            commodity, location, historical_data, days_ahead
        )

        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])

        logger.info("Market price prediction completed", user_id=current_user.id, commodity=commodity)
        return {"status": "success", "data": result}

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Market price prediction failed", error=str(e), user_id=current_user.id)
        raise HTTPException(status_code=500, detail=str(e))

@ai_limiter
@app.post(
    "/ai/climate-risk-assessment",
    summary="Advanced Climate Risk Assessment",
    description="""Comprehensive climate risk assessment using weather forecasts,
    historical data, and crop-specific vulnerability analysis.""",
    responses={
        200: {"description": "Climate risk assessment completed successfully"},
        500: {"description": "Internal server error during assessment"}
    }
)
async def assess_climate_risk(
    location: str,
    crop_type: str,
    weather_forecast: List[Dict[str, Any]],
    current_user: User = Depends(get_current_active_user)
):
    """Advanced climate risk assessment"""
    try:
        result = await advanced_ai_service.assess_climate_risk(
            location, crop_type, weather_forecast
        )

        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])

        logger.info("Climate risk assessment completed", user_id=current_user.id, location=location)
        return {"status": "success", "data": result}

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Climate risk assessment failed", error=str(e), user_id=current_user.id)
        raise HTTPException(status_code=500, detail=str(e))

@ai_limiter
@app.post(
    "/ai/farmer-sentiment-analysis",
    summary="Farmer Sentiment Analysis",
    description="""Analyze farmer sentiment from text data using NLP models.
    Useful for understanding farmer satisfaction, market sentiment, and community feedback.""",
    responses={
        200: {"description": "Sentiment analysis completed successfully"},
        500: {"description": "Internal server error during analysis"}
    }
)
async def analyze_farmer_sentiment(
    text_data: List[str],
    current_user: User = Depends(get_current_active_user)
):
    """Analyze farmer sentiment from text data"""
    try:
        # Validate input
        if not text_data or len(text_data) == 0:
            raise HTTPException(status_code=400, detail="Text data is required")

        if len(text_data) > 100:
            raise HTTPException(status_code=400, detail="Maximum 100 text samples allowed")

        # Validate each text entry
        for i, text in enumerate(text_data):
            if not isinstance(text, str):
                raise HTTPException(status_code=400, detail=f"Text data at index {i} must be a string")
            validate_text_input(text, max_length=1000)
        result = await advanced_ai_service.analyze_farmer_sentiment(text_data)

        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])

        logger.info("Farmer sentiment analysis completed", user_id=current_user.id, text_count=len(text_data))
        return {"status": "success", "data": result}

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Sentiment analysis failed", error=str(e), user_id=current_user.id)
        raise HTTPException(status_code=500, detail=str(e))

# Loan management
@app.post("/loans", response_model=LoanSchema)
async def create_loan_request(
    loan_data: LoanCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new loan request"""
    db_loan = Loan(
        user_id=current_user.id,
        **loan_data.dict()
    )
    db.add(db_loan)
    db.commit()
    db.refresh(db_loan)

    logger.info("Loan request created", user_id=current_user.id, loan_id=db_loan.id, amount=loan_data.amount)
    return db_loan

@app.get("/loans", response_model=List[LoanSchema])
async def get_user_loans(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all loans for current user"""
    loans = db.query(Loan).filter(Loan.user_id == current_user.id).all()
    return loans

@app.post("/loans/apply")
async def apply_for_loan(
    loan_data: Dict[str, Any],
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Apply for a loan with AI assessment"""
    try:
        # Create loan record
        db_loan = Loan(
            user_id=current_user.id,
            borrower_address=loan_data['borrower_address'],
            amount=loan_data['amount'],
            interest_rate=loan_data['interest_rate'],
            duration=loan_data['duration_months'],
            collateral_token=loan_data['collateral_token'],
            collateral_amount=loan_data['collateral_amount'],
            credit_score=loan_data['credit_score'],
            risk_level=loan_data['risk_level'],
            trust_score=loan_data['trust_score'],
            purpose=loan_data.get('purpose'),
            status='pending'
        )
        db.add(db_loan)
        db.commit()
        db.refresh(db_loan)

        # Deploy loan contract on blockchain
        try:
            blockchain_result = await blockchain_service.deploy_loan_contract(
                borrower=current_user.wallet_address or current_user.username,
                amount=loan_data['amount'],
                interest_rate=loan_data.get('interest_rate', 8.5),
                duration=loan_data.get('duration', 365 * 24 * 60 * 60),  # 1 year in seconds
                collateral_token=loan_data.get('collateral_token', '0x0000000000000000000000000000000000000000'),
                collateral_amount=loan_data.get('collateral_amount', 0)
            )
            db_loan.blockchain_tx_hash = blockchain_result['tx_hash']
            db_loan.blockchain_loan_id = blockchain_result.get('loan_id')
            db.commit()

            # Transfer collateral to escrow if provided
            if loan_data.get('collateral_amount', 0) > 0:
                await blockchain_service.transfer_collateral_to_escrow(
                    loan_id=int(blockchain_result.get('loan_id', 0)),
                    collateral_token=loan_data['collateral_token'],
                    collateral_amount=loan_data['collateral_amount'],
                    escrow_address="0x0000000000000000000000000000000000000000"  # TODO: Get escrow address
                )

        except Exception as blockchain_error:
            logger.warning("Blockchain loan deployment failed", error=str(blockchain_error))
            # Continue without blockchain for now

        logger.info("Loan application submitted", user_id=current_user.id, loan_id=db_loan.id, amount=loan_data['amount'])
        return {
            "status": "success",
            "loan_id": db_loan.id,
            "message": "Loan application submitted successfully"
        }

    except Exception as e:
        logger.error("Loan application failed", error=str(e), user_id=current_user.id)
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# Marketplace
@app.post("/marketplace/listings", response_model=MarketplaceListingSchema)
async def create_listing(
    listing_data: MarketplaceListingCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new marketplace listing"""
    db_listing = MarketplaceListing(
        seller_id=current_user.id,
        **listing_data.dict()
    )
    db.add(db_listing)
    db.commit()
    db.refresh(db_listing)

    logger.info("Marketplace listing created", user_id=current_user.id, listing_id=db_listing.id)
    return db_listing

@app.get(
    "/marketplace/listings",
    response_model=PaginatedResponse[MarketplaceListingSchema],
    summary="Get Marketplace Listings",
    description="Retrieve paginated marketplace listings with advanced filtering and sorting options"
)
async def get_marketplace_listings(
    pagination: PaginationParams = Depends(),
    crop_type: Optional[str] = Query(None, description="Filter by crop type"),
    location: Optional[str] = Query(None, description="Filter by location"),
    min_price: Optional[float] = Query(None, ge=0, description="Minimum price filter"),
    max_price: Optional[float] = Query(None, ge=0, description="Maximum price filter"),
    quality_grade: Optional[str] = Query(None, description="Filter by quality grade"),
    db: Session = Depends(get_db),
    request: Request = None
):
    """Get marketplace listings with advanced filtering and pagination"""
    try:
        # Build base query
        query = db.query(MarketplaceListing).filter(MarketplaceListing.status == "active")

        # Apply filters
        filters = {
            "crop_type": crop_type,
            "location": location,
            "quality_grade": quality_grade
        }

        query = filter_helper.apply_filters(query, MarketplaceListing, filters)

        # Additional price filters
        if min_price is not None:
            query = query.filter(MarketplaceListing.price_per_unit >= min_price)
        if max_price is not None:
            query = query.filter(MarketplaceListing.price_per_unit <= max_price)

        # Apply pagination
        result = pagination_helper.paginate_query(query, pagination, MarketplaceListing)

        # Add metadata
        meta = {
            "filters_applied": {
                k: v for k, v in {
                    "crop_type": crop_type,
                    "location": location,
                    "min_price": min_price,
                    "max_price": max_price,
                    "quality_grade": quality_grade
                }.items() if v is not None
            },
            "request_id": getattr(request.state, 'request_id', None) if request else None
        }

        logger.info("Marketplace listings retrieved",
                   total_items=result["pagination"]["total_items"],
                   page=pagination.page,
                   filters_applied=len(meta["filters_applied"]))

        return PaginatedResponse(
            data=result["items"],
            pagination=result["pagination"],
            meta=meta
        )

    except Exception as e:
        logger.error("Marketplace listings retrieval failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

# Notifications
@app.get("/notifications", response_model=List[NotificationSchema])
async def get_user_notifications(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get notifications for current user"""
    notifications = db.query(Notification).filter(
        Notification.user_id == current_user.id
    ).order_by(Notification.created_at.desc()).all()
    return notifications

@app.put("/notifications/{notification_id}/read")
async def mark_notification_read(
    notification_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Mark a notification as read"""
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    notification.is_read = True
    db.commit()

    return {"status": "success"}

# IoT Data Processing and Oracle Integration
@app.post(
    "/iot/process-sensor-batch",
    summary="Process batch IoT sensor data",
    description="Process multiple sensor readings and trigger AI analysis, alerts, and oracle updates"
)
async def process_sensor_batch(
    sensor_data: List[SensorReadingCreate],
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Process batch IoT sensor data with enhanced analytics"""
    try:
        processed_readings = []
        alerts = []

        for reading in sensor_data:
            # Verify device exists
            device = db.query(SensorDevice).filter(
                SensorDevice.device_id == reading.device_id
            ).first()
            if not device:
                continue

            # Create sensor reading
            timestamp = reading.timestamp or datetime.utcnow()
            db_reading = SensorReading(
                device_id=device.id,
                timestamp=timestamp,
                **reading.dict(exclude={'device_id', 'timestamp'})
            )
            db.add(db_reading)
            processed_readings.append(db_reading)

            # Check for anomalies and generate alerts
            alert = await check_sensor_anomalies(reading, device, db)
            if alert:
                alerts.append(alert)

            # Update device last_seen
            device.last_seen = timestamp

        db.commit()

        # Add background tasks for AI analysis and oracle updates
        for reading in processed_readings:
            background_tasks.add_task(analyze_sensor_data, reading.device_id, reading.id)
            background_tasks.add_task(update_oracle_feeds, reading.device_id, reading.id)

        logger.info("Batch sensor data processed", readings_count=len(processed_readings), alerts_count=len(alerts))
        return {
            "status": "success",
            "processed_readings": len(processed_readings),
            "alerts": alerts
        }

    except Exception as e:
        logger.error("Batch sensor processing failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

# Enhanced IoT Service Endpoints
@app.post(
    "/iot/devices/register",
    summary="Register IoT device",
    description="Register a new IoT device with the AgriCredit platform"
)
async def register_iot_device(
    device_data: Dict[str, Any],
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Register a new IoT device"""
    try:
        from ..core.iot_service import iot_service

        device = await iot_service.register_device(device_data, current_user.id)

        # Also create in database
        db_device = SensorDevice(
            device_id=device.device_id,
            name=device.name,
            location=device.location,
            latitude=device.latitude,
            longitude=device.longitude,
            crop_type=device.crop_type,
            farm_size=device.farm_size,
            owner_id=device.owner_id,
            is_active=device.is_active,
            firmware_version=device.firmware_version,
            battery_level=device.battery_level
        )
        db.add(db_device)
        db.commit()

        logger.info("IoT device registered", device_id=device.device_id, user_id=current_user.id)
        return {"status": "success", "device": device.__dict__}

    except Exception as e:
        logger.error("Device registration failed", error=str(e), user_id=current_user.id)
        raise HTTPException(status_code=500, detail=str(e))

@app.post(
    "/iot/devices/{device_id}/command",
    summary="Send command to IoT device",
    description="Send a command to a registered IoT device"
)
async def send_device_command(
    device_id: str,
    command: str,
    params: Dict[str, Any] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Send command to IoT device"""
    try:
        from ..core.iot_service import iot_service

        # Verify device ownership
        device = db.query(SensorDevice).filter(
            SensorDevice.device_id == device_id,
            SensorDevice.owner_id == current_user.id
        ).first()
        if not device:
            raise HTTPException(status_code=404, detail="Device not found")

        success = await iot_service.send_command_to_device(device_id, command, params or {})

        if success:
            logger.info("Command sent to device", device_id=device_id, command=command)
            return {"status": "success", "message": "Command sent successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to send command")

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Command sending failed", error=str(e), device_id=device_id)
        raise HTTPException(status_code=500, detail=str(e))

@app.get(
    "/iot/devices/{device_id}/status",
    summary="Get device status",
    description="Get current status and latest readings for an IoT device"
)
async def get_device_status(
    device_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get device status"""
    try:
        from ..core.iot_service import iot_service

        # Verify device ownership
        device = db.query(SensorDevice).filter(
            SensorDevice.device_id == device_id,
            SensorDevice.owner_id == current_user.id
        ).first()
        if not device:
            raise HTTPException(status_code=404, detail="Device not found")

        status = await iot_service.get_device_status(device_id)
        return {"status": "success", "data": status}

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Device status retrieval failed", error=str(e), device_id=device_id)
        raise HTTPException(status_code=500, detail=str(e))

@app.get(
    "/iot/farm-insights",
    summary="Get farm insights",
    description="Get AI-powered insights from multiple IoT devices on the farm"
)
async def get_farm_insights(
    device_ids: str,  # comma-separated
    days: int = 7,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get farm-wide insights"""
    try:
        from ..core.iot_service import iot_service

        device_list = device_ids.split(',')

        # Verify device ownership
        for device_id in device_list:
            device = db.query(SensorDevice).filter(
                SensorDevice.device_id == device_id,
                SensorDevice.owner_id == current_user.id
            ).first()
            if not device:
                raise HTTPException(status_code=404, detail=f"Device {device_id} not found")

        insights = await iot_service.get_farm_insights(device_list, days)
        return {"status": "success", "data": insights}

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Farm insights retrieval failed", error=str(e), user_id=current_user.id)
        raise HTTPException(status_code=500, detail=str(e))

# Enhanced Oracle Service Endpoints
@app.get(
    "/oracle/prices/{asset}",
    summary="Get asset price from oracle",
    description="Get current price data for assets from oracle feeds"
)
async def get_oracle_price(
    asset: str,
    source: str = "chainlink"
):
    """Get asset price from oracle"""
    try:
        from ..core.oracle_service import oracle_service

        price_feed = await oracle_service.get_price_feed(asset, source)
        if price_feed:
            return {"status": "success", "data": price_feed.__dict__}
        else:
            raise HTTPException(status_code=404, detail="Price data not available")

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Oracle price retrieval failed", error=str(e), asset=asset)
        raise HTTPException(status_code=500, detail=str(e))

@app.get(
    "/oracle/prices/bulk",
    summary="Get bulk price feeds",
    description="Get price data for multiple assets from oracle feeds"
)
async def get_bulk_oracle_prices(
    assets: str,  # comma-separated
    source: str = "chainlink"
):
    """Get bulk price feeds"""
    try:
        from ..core.oracle_service import oracle_service

        asset_list = assets.split(',')
        feeds = await oracle_service.get_bulk_price_feeds(asset_list, source)

        return {"status": "success", "data": {k: v.__dict__ for k, v in feeds.items()}}

    except Exception as e:
        logger.error("Bulk oracle price retrieval failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.get(
    "/oracle/weather/{location}",
    summary="Get weather data from oracle",
    description="Get current weather data for locations from oracle feeds"
)
async def get_oracle_weather(
    location: str,
    source: str = "openweather"
):
    """Get weather data from oracle"""
    try:
        from ..core.oracle_service import oracle_service

        weather_data = await oracle_service.get_weather_data(location, source)
        if weather_data:
            return {"status": "success", "data": weather_data.__dict__}
        else:
            raise HTTPException(status_code=404, detail="Weather data not available")

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Oracle weather retrieval failed", error=str(e), location=location)
        raise HTTPException(status_code=500, detail=str(e))

@app.get(
    "/oracle/market/{commodity}/{region}",
    summary="Get market data from oracle",
    description="Get agricultural market data from oracle feeds"
)
async def get_oracle_market_data(
    commodity: str,
    region: str,
    source: str = "alphavantage"
):
    """Get market data from oracle"""
    try:
        from ..core.oracle_service import oracle_service

        market_data = await oracle_service.get_market_data(commodity, region, source)
        if market_data:
            return {"status": "success", "data": market_data.__dict__}
        else:
            raise HTTPException(status_code=404, detail="Market data not available")

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Oracle market data retrieval failed", error=str(e), commodity=commodity, region=region)
        raise HTTPException(status_code=500, detail=str(e))

@app.get(
    "/oracle/prices/{asset}/history",
    summary="Get historical price data",
    description="Get historical price data for assets from oracle feeds"
)
async def get_historical_prices(
    asset: str,
    days: int = 30,
    source: str = "chainlink"
):
    """Get historical price data"""
    try:
        from ..core.oracle_service import oracle_service

        historical_data = await oracle_service.get_historical_prices(asset, days, source)
        return {"status": "success", "data": [p.__dict__ for p in historical_data]}

    except Exception as e:
        logger.error("Historical price retrieval failed", error=str(e), asset=asset)
        raise HTTPException(status_code=500, detail=str(e))

@app.post(
    "/oracle/feeds/update",
    summary="Update all oracle feeds",
    description="Update all configured oracle feeds with fresh data"
)
async def update_all_oracle_feeds(
    current_user: User = Depends(get_current_active_user)
):
    """Update all oracle feeds"""
    try:
        from ..core.oracle_service import oracle_service

        result = await oracle_service.update_oracle_feeds()
        return {"status": "success", "data": result}

    except Exception as e:
        logger.error("Oracle feeds update failed", error=str(e), user_id=current_user.id)
        raise HTTPException(status_code=500, detail=str(e))

@app.post(
    "/oracle/update-feeds",
    summary="Update oracle data feeds",
    description="Update Chainlink/API3 oracle feeds with latest agricultural data"
)
async def update_oracle_feeds_endpoint(
    feed_data: Dict[str, Any],
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update oracle feeds with agricultural data"""
    try:
        # This would integrate with Chainlink oracles
        # For now, store the data and mark for oracle update

        oracle_update = {
            "user_id": current_user.id,
            "feed_type": feed_data.get("type", "agricultural_data"),
            "data": feed_data,
            "timestamp": datetime.utcnow(),
            "status": "pending_oracle_update"
        }

        # Store in database (you might want to create a separate OracleFeed model)
        # For now, we'll log it
        logger.info("Oracle feed update requested", user_id=current_user.id, feed_type=oracle_update["feed_type"])

        return {
            "status": "success",
            "message": "Oracle feed update initiated",
            "feed_id": f"feed_{current_user.id}_{int(datetime.utcnow().timestamp())}"
        }

    except Exception as e:
        logger.error("Oracle feed update failed", error=str(e), user_id=current_user.id)
        raise HTTPException(status_code=500, detail=str(e))

@app.get(
    "/analytics/sensor-insights/{device_id}",
    summary="Get AI-powered sensor insights",
    description="Retrieve AI-analyzed insights from sensor data including trends, predictions, and recommendations"
)
async def get_sensor_insights(
    device_id: str,
    days: int = 7,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
    cache_client = Depends(get_cache)
):
    """Get AI-powered insights from sensor data"""
    try:
        # Verify device ownership
        device = db.query(SensorDevice).filter(
            SensorDevice.device_id == device_id,
            SensorDevice.owner_id == current_user.id
        ).first()
        if not device:
            raise HTTPException(status_code=404, detail="Device not found")

        # Try to get from cache first
        cached_insights = await cache_client.get_sensor_insights(device_id, days)
        if cached_insights:
            logger.info("Sensor insights served from cache", device_id=device_id, days=days)
            return cached_insights

        # Get historical data
        cutoff_time = datetime.utcnow() - timedelta(days=days)
        readings = db.query(SensorReading).filter(
            SensorReading.device_id == device.id,
            SensorReading.timestamp >= cutoff_time
        ).order_by(SensorReading.timestamp.desc()).all()

        if not readings:
            return {
                "status": "success",
                "insights": {
                    "trends": {},
                    "predictions": {},
                    "recommendations": ["Insufficient data for analysis"],
                    "alerts": []
                }
            }

        # Generate insights using AI models
        insights = await generate_sensor_insights(readings, device)

        # Cache the result
        await cache_client.set_sensor_insights(device_id, days, insights)

        logger.info("Sensor insights generated", device_id=device_id, days=days, readings_count=len(readings))
        return insights

    except Exception as e:
        logger.error("Sensor insights generation failed", error=str(e), device_id=device_id)
        raise HTTPException(status_code=500, detail=str(e))

# Background tasks
async def analyze_sensor_data(device_id: int, reading_id: int):
    """Analyze sensor data and generate insights"""
    # This would trigger AI analysis, alerts, etc.
    logger.info("Analyzing sensor data", device_id=device_id, reading_id=reading_id)

    # Implement sensor data analysis logic
    try:
        # Get database session
        db = next(get_db())

        # Get recent sensor readings for analysis
        recent_readings = db.query(SensorReading).filter(
            SensorReading.device_id == device_id
        ).order_by(SensorReading.timestamp.desc()).limit(100).all()

        if len(recent_readings) < 10:
            logger.warning("Insufficient sensor data for analysis", device_id=device_id)
            return

        # Analyze soil moisture trends
        soil_moisture_values = [r.soil_moisture for r in recent_readings]
        avg_soil_moisture = sum(soil_moisture_values) / len(soil_moisture_values)

        # Check for irrigation needs
        irrigation_alert = avg_soil_moisture < 0.3  # Below 30% moisture

        # Analyze temperature patterns
        temperature_values = [r.temperature for r in recent_readings]
        avg_temperature = sum(temperature_values) / len(temperature_values)

        # Check for heat stress
        heat_stress_alert = avg_temperature > 35  # Above 35°C

        # Analyze humidity
        humidity_values = [r.humidity for r in recent_readings]
        avg_humidity = sum(humidity_values) / len(humidity_values)

        # Generate recommendations
        recommendations = []
        alerts = []

        if irrigation_alert:
            recommendations.append("Increase irrigation - soil moisture is low")
            alerts.append("Irrigation needed immediately")

        if heat_stress_alert:
            recommendations.append("Implement heat stress mitigation measures")
            alerts.append("High temperature detected - monitor crops closely")

        if avg_humidity < 40:
            recommendations.append("Consider humidity management for optimal growth")

        # Store analysis results
        analysis_result = {
            "device_id": device_id,
            "reading_id": reading_id,
            "timestamp": datetime.utcnow(),
            "soil_moisture_avg": avg_soil_moisture,
            "temperature_avg": avg_temperature,
            "humidity_avg": avg_humidity,
            "recommendations": recommendations,
            "alerts": alerts,
            "irrigation_needed": irrigation_alert,
            "heat_stress_risk": heat_stress_alert
        }

        # Get cache client
        cache_client = get_cache()
        await cache_client.set(f"sensor_analysis:{device_id}:{reading_id}", json.dumps(analysis_result), expire=3600)

        # Get device owner for notifications
        device = db.query(SensorDevice).filter(SensorDevice.id == device_id).first()
        if device and alerts:
            # Create notification
            notification = Notification(
                user_id=device.owner_id,
                type="sensor_alert",
                title="Farm Sensor Alert",
                message=f"Critical alerts detected: {', '.join(alerts)}",
                data={
                    "device_id": device_id,
                    "alerts": alerts,
                    "recommendations": recommendations
                }
            )
            db.add(notification)
            db.commit()

        logger.info("Sensor data analysis completed", device_id=device_id, alerts=len(alerts))

    except Exception as analysis_error:
        logger.error("Sensor data analysis failed", error=str(analysis_error), device_id=device_id)

# GraphQL API
app.include_router(graphql_app, prefix="/graphql", tags=["graphql"])

# WebSocket endpoint
@app.websocket("/ws/{user_id}")
async def websocket_endpoint_handler(websocket: WebSocket, user_id: int, channel: str = "general"):
    """WebSocket endpoint for real-time communication"""
    await websocket_endpoint(websocket, user_id, channel)

# Monitoring endpoints
@app.get("/metrics")
async def prometheus_metrics():
    """Prometheus metrics endpoint"""
    return await metrics_endpoint()

@app.get("/health")
async def health_check():
    """Comprehensive health check endpoint"""
    return get_health_status()

# Legacy health check (simple version)
@app.get("/health/simple")
async def simple_health_check():
    """Simple health check endpoint"""
    return {
        "status": "healthy",
        "service": "AgriCredit AI",
        "version": "2.0.0",
        "timestamp": datetime.utcnow().isoformat()
    }

# Background tasks for enhanced processing
async def check_sensor_anomalies(reading: SensorReadingCreate, device: SensorDevice, db: Session) -> Optional[Dict[str, Any]]:
    """Check for sensor anomalies and generate alerts"""
    try:
        # Get recent readings for comparison
        recent_readings = db.query(SensorReading).filter(
            SensorReading.device_id == device.id
        ).order_by(SensorReading.timestamp.desc()).limit(10).all()

        if len(recent_readings) < 5:
            return None

        # Simple anomaly detection based on standard deviations
        soil_moistures = [r.soil_moisture for r in recent_readings if r.soil_moisture is not None]
        temperatures = [r.temperature for r in recent_readings if r.temperature is not None]

        alert = None

        if reading.soil_moisture is not None and soil_moistures:
            mean_soil = sum(soil_moistures) / len(soil_moistures)
            std_soil = (sum((x - mean_soil) ** 2 for x in soil_moistures) / len(soil_moistures)) ** 0.5

            if abs(reading.soil_moisture - mean_soil) > 2 * std_soil:
                alert = {
                    "type": "soil_moisture_anomaly",
                    "severity": "warning",
                    "message": f"Unusual soil moisture reading: {reading.soil_moisture}",
                    "device_id": reading.device_id,
                    "timestamp": reading.timestamp.isoformat() if reading.timestamp else datetime.utcnow().isoformat()
                }

        if reading.temperature is not None and temperatures:
            mean_temp = sum(temperatures) / len(temperatures)
            std_temp = (sum((x - mean_temp) ** 2 for x in temperatures) / len(temperatures)) ** 0.5

            if abs(reading.temperature - mean_temp) > 2 * std_temp:
                alert = {
                    "type": "temperature_anomaly",
                    "severity": "warning",
                    "message": f"Unusual temperature reading: {reading.temperature}°C",
                    "device_id": reading.device_id,
                    "timestamp": reading.timestamp.isoformat() if reading.timestamp else datetime.utcnow().isoformat()
                }

        return alert

    except Exception as e:
        logger.error("Anomaly check failed", error=str(e), device_id=reading.device_id)
        return None

async def update_oracle_feeds(device_id: int, reading_id: int):
    """Update oracle feeds with sensor data"""
    # This would integrate with Chainlink push oracles
    # For now, just log the update
    logger.info("Oracle feeds updated", device_id=device_id, reading_id=reading_id)

async def generate_sensor_insights(readings: List[SensorReading], device: SensorDevice) -> Dict[str, Any]:
    """Generate AI-powered insights from sensor data"""
    try:
        # Extract data for analysis
        timestamps = [r.timestamp for r in readings]
        soil_moistures = [r.soil_moisture for r in readings if r.soil_moisture is not None]
        temperatures = [r.temperature for r in readings if r.temperature is not None]
        humidities = [r.humidity for r in readings if r.humidity is not None]

        insights = {
            "status": "success",
            "insights": {
                "trends": {},
                "predictions": {},
                "recommendations": [],
                "alerts": []
            }
        }

        # Basic trend analysis
        if len(soil_moistures) > 1:
            soil_trend = "stable"
            if soil_moistures[-1] > soil_moistures[0] * 1.1:
                soil_trend = "increasing"
            elif soil_moistures[-1] < soil_moistures[0] * 0.9:
                soil_trend = "decreasing"

            insights["insights"]["trends"]["soil_moisture"] = soil_trend

        # Generate recommendations based on data
        recommendations = []

        if soil_moistures and soil_moistures[-1] < 0.3:
            recommendations.append("Soil moisture is low. Consider irrigation.")
        elif soil_moistures and soil_moistures[-1] > 0.8:
            recommendations.append("Soil moisture is high. Monitor for waterlogging.")

        if temperatures and temperatures[-1] > 35:
            recommendations.append("High temperatures detected. Ensure adequate plant cooling.")
        elif temperatures and temperatures[-1] < 10:
            recommendations.append("Low temperatures detected. Protect crops from cold damage.")

        if humidities and humidities[-1] > 80:
            recommendations.append("High humidity detected. Monitor for fungal diseases.")

        insights["insights"]["recommendations"] = recommendations

        # Simple predictions (next 24 hours)
        if len(soil_moistures) >= 3:
            # Simple linear extrapolation
            soil_change = (soil_moistures[-1] - soil_moistures[-2]) / ((timestamps[-1] - timestamps[-2]).total_seconds() / 3600)
            predicted_soil = soil_moistures[-1] + soil_change * 24
            predicted_soil = max(0, min(1, predicted_soil))  # Clamp to 0-1

            insights["insights"]["predictions"]["soil_moisture_24h"] = round(predicted_soil, 2)

        return insights

    except Exception as e:
        logger.error("Insights generation failed", error=str(e), device_id=device.id)
        return {
            "status": "error",
            "insights": {
                "trends": {},
                "predictions": {},
                "recommendations": ["Analysis failed due to insufficient data"],
                "alerts": []
            }
        }

# IPFS endpoints
@app.post(
    "/ipfs/upload",
    summary="Upload file to IPFS",
    description="Upload a file to IPFS decentralized storage with optional metadata"
)
async def upload_to_ipfs(
    file: UploadFile = File(...),
    metadata: Optional[str] = Form(None),
    current_user: User = Depends(get_current_active_user)
):
    """Upload file to IPFS"""
    try:
        # Save uploaded file temporarily
        temp_path = f"/tmp/{file.filename}"
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Parse metadata if provided
        metadata_dict = None
        if metadata:
            metadata_dict = json.loads(metadata)

        # Upload to IPFS
        cid = await ipfs_service.upload_file(temp_path, metadata_dict)

        # Clean up temp file
        os.remove(temp_path)

        logger.info("File uploaded to IPFS", user_id=current_user.id, cid=cid, filename=file.filename)
        return {
            "status": "success",
            "cid": cid,
            "url": f"https://ipfs.io/ipfs/{cid}"
        }

    except Exception as e:
        logger.error("IPFS upload failed", error=str(e), user_id=current_user.id)
        raise HTTPException(status_code=500, detail=str(e))

@app.get(
    "/ipfs/{cid}",
    summary="Get IPFS content info",
    description="Retrieve content information from IPFS by CID"
)
async def get_from_ipfs(cid: str):
    """Get content info from IPFS"""
    try:
        content_info = await ipfs_service.get_file_info(cid)
        return content_info
    except Exception as e:
        logger.error("IPFS retrieval failed", error=str(e), cid=cid)
        raise HTTPException(status_code=404, detail="Content not found on IPFS")

# Blockchain endpoints
@app.get(
    "/blockchain/status",
    summary="Get blockchain connection status",
    description="Check blockchain connectivity and account information"
)
async def get_blockchain_status():
    """Get blockchain status"""
    if not blockchain_service.is_connected():
        return {
            "status": "disconnected",
            "message": "Blockchain not connected"
        }

    return {
        "status": "connected",
        "chain_id": blockchain_service.get_chain_id(),
        "account": blockchain_service.get_account_address(),
        "gas_price": await blockchain_service.get_gas_price()
    }

@app.post(
    "/blockchain/identity/create",
    summary="Create blockchain identity",
    description="Create a decentralized identity on the blockchain"
)
async def create_blockchain_identity(
    did: str,
    current_user: User = Depends(get_current_active_user)
):
    """Create identity on blockchain"""
    try:
        result = await blockchain_service.create_identity(current_user.username, did)
        return {"status": "success", "data": result}
    except Exception as e:
        logger.error("Identity creation failed", error=str(e), user_id=current_user.id)
        raise HTTPException(status_code=500, detail=str(e))

@app.get(
    "/blockchain/identity/{user_address}",
    summary="Get blockchain identity",
    description="Retrieve identity information from blockchain"
)
async def get_blockchain_identity(user_address: str):
    """Get identity from blockchain"""
    try:
        identity = await blockchain_service.get_identity(user_address)
        is_verified = await blockchain_service.is_identity_verified(user_address)
        return {
            "identity": identity,
            "is_verified": is_verified
        }
    except Exception as e:
        logger.error("Identity retrieval failed", error=str(e), user_address=user_address)
        raise HTTPException(status_code=404, detail="Identity not found")

@app.post(
    "/blockchain/loans",
    summary="Create loan on blockchain",
    description="Create a loan agreement on the blockchain"
)
async def create_blockchain_loan(
    borrower: str,
    amount: float,
    interest_rate: float,
    duration: int,
    current_user: User = Depends(get_current_active_user)
):
    """Create loan on blockchain"""
    try:
        result = await blockchain_service.create_loan(borrower, amount, interest_rate, duration)
        return {"status": "success", "data": result}
    except Exception as e:
        logger.error("Loan creation failed", error=str(e), user_id=current_user.id)
        raise HTTPException(status_code=500, detail=str(e))

@app.post(
    "/blockchain/loans/{loan_id}/repay",
    summary="Repay loan on blockchain",
    description="Make a loan repayment on the blockchain"
)
async def repay_blockchain_loan(
    loan_id: int,
    amount: float,
    current_user: User = Depends(get_current_active_user)
):
    """Repay loan on blockchain"""
    try:
        result = await blockchain_service.repay_loan(loan_id, amount)
        return {"status": "success", "data": result}
    except Exception as e:
        logger.error("Loan repayment failed", error=str(e), user_id=current_user.id, loan_id=loan_id)
        raise HTTPException(status_code=500, detail=str(e))

@app.get(
    "/blockchain/loans/{loan_id}",
    summary="Get loan details from blockchain",
    description="Retrieve loan information from blockchain"
)
async def get_blockchain_loan(loan_id: int):
    """Get loan details from blockchain"""
    try:
        loan_details = await blockchain_service.get_loan_details(loan_id)
        return {"status": "success", "data": loan_details}
    except Exception as e:
        logger.error("Loan retrieval failed", error=str(e), loan_id=loan_id)
        raise HTTPException(status_code=404, detail="Loan not found")

@app.post(
    "/blockchain/carbon/mint",
    summary="Mint carbon tokens",
    description="Mint carbon credit tokens based on verified environmental impact"
)
async def mint_carbon_tokens(
    amount: float,
    verification_proof: str,
    current_user: User = Depends(get_current_active_user)
):
    """Mint carbon tokens"""
    try:
        result = await blockchain_service.mint_carbon_tokens(
            current_user.username, amount, verification_proof
        )
        return {"status": "success", "data": result}
    except Exception as e:
        logger.error("Carbon token minting failed", error=str(e), user_id=current_user.id)
        raise HTTPException(status_code=500, detail=str(e))

@app.get(
    "/blockchain/carbon/balance/{address}",
    summary="Get carbon token balance",
    description="Get carbon token balance for an address"
)
async def get_carbon_balance(address: str):
    """Get carbon token balance"""
    try:
        balance = await blockchain_service.get_carbon_balance(address)
        return {"status": "success", "balance": balance}
    except Exception as e:
        logger.error("Carbon balance retrieval failed", error=str(e), address=address)
        raise HTTPException(status_code=500, detail=str(e))

# Carbon Dashboard and Management
@app.get("/carbon/dashboard")
async def get_carbon_dashboard(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get carbon dashboard data"""
    try:
        # Get user's carbon credits
        credits = db.query(CarbonCredit).filter(CarbonCredit.user_id == current_user.id).all()

        total_credits = sum(credit.amount for credit in credits)
        staked_amount = 0  # TODO: Get from staking contract
        available_balance = total_credits - staked_amount
        staking_rewards = 0  # TODO: Calculate staking rewards
        retired_credits = sum(credit.amount for credit in credits if credit.transaction_type == 'retired')

        # Recent transactions
        recent_transactions = [{
            "id": credit.id,
            "type": credit.transaction_type,
            "amount": credit.amount,
            "timestamp": credit.created_at.isoformat(),
            "hash": credit.transaction_hash
        } for credit in credits[-10:]]

        return {
            "total_credits": total_credits,
            "staked_amount": staked_amount,
            "available_balance": available_balance,
            "staking_rewards": staking_rewards,
            "retired_credits": retired_credits,
            "portfolio_value": total_credits * 0.1,  # Mock price
            "recent_transactions": recent_transactions
        }

    except Exception as e:
        logger.error("Carbon dashboard retrieval failed", error=str(e), user_id=current_user.id)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/carbon/climate-data")
async def submit_climate_data_endpoint(
    climate_data: Dict[str, Any],
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Submit climate data for analysis"""
    try:
        # Create climate analysis record
        analysis = ClimateAnalysis(
            user_id=current_user.id,
            satellite_data=climate_data.get('satellite_data', {}),
            iot_data=climate_data.get('iot_sensors', {}),
            recommendations=[],
            confidence=0.0
        )
        db.add(analysis)
        db.commit()
        db.refresh(analysis)

        # TODO: Trigger AI analysis
        # For now, return mock analysis

        return {
            "status": "success",
            "analysis_id": analysis.id,
            "message": "Climate data submitted for analysis"
        }

    except Exception as e:
        logger.error("Climate data submission failed", error=str(e), user_id=current_user.id)
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/carbon/generate-credit/{analysis_id}")
async def generate_carbon_credit_endpoint(
    analysis_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Generate carbon credit from analysis"""
    try:
        # Get analysis
        analysis = db.query(ClimateAnalysis).filter(
            ClimateAnalysis.id == analysis_id,
            ClimateAnalysis.user_id == current_user.id
        ).first()

        if not analysis:
            raise HTTPException(status_code=404, detail="Analysis not found")

        # Mock carbon credit generation
        credit_amount = analysis.carbon_tokens_mintable or 100

        # Create carbon credit record
        credit = CarbonCredit(
            user_id=current_user.id,
            amount=credit_amount,
            transaction_type='minted',
            verification_proof={'analysis_id': analysis_id}
        )
        db.add(credit)
        db.commit()

        return {
            "status": "success",
            "credit_id": credit.id,
            "amount": credit_amount,
            "message": f"Generated {credit_amount} carbon credits"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Carbon credit generation failed", error=str(e), user_id=current_user.id)
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/carbon/stake")
async def stake_carbon_tokens_endpoint(
    stake_data: Dict[str, Any],
    current_user: User = Depends(get_current_active_user)
):
    """Stake carbon tokens"""
    try:
        amount = stake_data['amount']

        # TODO: Interact with staking contract
        # For now, return mock response

        return {
            "status": "success",
            "stake_id": 123,  # Mock ID
            "amount": amount,
            "message": f"Staked {amount} carbon tokens"
        }

    except Exception as e:
        logger.error("Carbon token staking failed", error=str(e), user_id=current_user.id)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/carbon/claim-rewards")
async def claim_staking_rewards_endpoint(
    current_user: User = Depends(get_current_active_user)
):
    """Claim staking rewards"""
    try:
        # TODO: Calculate and claim rewards from staking contract
        # Mock reward amount
        reward_amount = 25.5

        return {
            "status": "success",
            "amount": reward_amount,
            "message": f"Claimed {reward_amount} staking rewards"
        }

    except Exception as e:
        logger.error("Staking rewards claim failed", error=str(e), user_id=current_user.id)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/carbon/retire")
async def retire_carbon_credits_endpoint(
    retire_data: Dict[str, Any],
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Retire carbon credits"""
    try:
        credit_id = retire_data['credit_id']
        amount = retire_data['amount']

        # Get credit
        credit = db.query(CarbonCredit).filter(
            CarbonCredit.id == credit_id,
            CarbonCredit.user_id == current_user.id
        ).first()

        if not credit:
            raise HTTPException(status_code=404, detail="Carbon credit not found")

        if credit.amount < amount:
            raise HTTPException(status_code=400, detail="Insufficient credit amount")

        # Create retirement record
        retirement = CarbonCredit(
            user_id=current_user.id,
            amount=amount,
            transaction_type='retired',
            verification_proof={'original_credit_id': credit_id}
        )
        db.add(retirement)
        db.commit()

        return {
            "status": "success",
            "transaction_hash": "0x" + "0" * 64,  # Mock hash
            "message": f"Retired {amount} carbon credits"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Carbon credit retirement failed", error=str(e), user_id=current_user.id)
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/carbon/market-analytics")
async def get_carbon_market_analytics():
    """Get carbon market analytics"""
    try:
        # TODO: Get real analytics from carbon service
        # For now, return mock data
        return {
            "total_supply": 1000000,
            "total_staked": 250000,
            "total_sequestered": 750000,
            "circulating_supply": 750000,
            "staking_ratio": 0.25,
            "avg_confidence_score": 85.5,
            "top_methodologies": ['reforestation', 'soil_carbon', 'agri_practices']
        }

    except Exception as e:
        logger.error("Carbon market analytics retrieval failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.post(
    "/blockchain/governance/propose",
    summary="Create governance proposal",
    description="Create a comprehensive governance proposal for DAO voting"
)
async def create_governance_proposal(
    title: str,
    description: str,
    targets: List[str] = [],
    values: List[int] = [],
    signatures: List[str] = [],
    calldatas: List[str] = [],
    start_block: Optional[int] = None,
    end_block: Optional[int] = None,
    current_user: User = Depends(get_current_active_user)
):
    """Create governance proposal"""
    try:
        # Get user address from username (simplified - in production use wallet address)
        proposer_address = current_user.username

        result = await governance_manager.create_proposal(
            proposer_address=proposer_address,
            title=title,
            description=description,
            targets=targets,
            values=values,
            signatures=signatures,
            calldatas=calldatas,
            start_block=start_block,
            end_block=end_block
        )
        return {"status": "success", "data": result}
    except Exception as e:
        logger.error("Proposal creation failed", error=str(e), user_id=current_user.id)
        raise HTTPException(status_code=500, detail=str(e))

@app.post(
    "/blockchain/governance/vote",
    summary="Vote on governance proposal",
    description="Cast a vote on a governance proposal with voting power"
)
async def vote_on_proposal(
    proposal_id: int,
    support: bool,
    reason: Optional[str] = None,
    current_user: User = Depends(get_current_active_user)
):
    """Vote on governance proposal"""
    try:
        # Get voter address from username (simplified - in production use wallet address)
        voter_address = current_user.username

        result = await governance_manager.vote_on_proposal(
            voter_address=voter_address,
            proposal_id=proposal_id,
            support=support,
            reason=reason
        )
        return {"status": "success", "data": result}
    except Exception as e:
        logger.error("Voting failed", error=str(e), user_id=current_user.id, proposal_id=proposal_id)
        raise HTTPException(status_code=500, detail=str(e))

@app.get(
    "/blockchain/governance/proposals/{proposal_id}",
    summary="Get governance proposal",
    description="Retrieve detailed governance proposal information including votes"
)
async def get_governance_proposal(proposal_id: int):
    """Get governance proposal"""
    try:
        proposal = await governance_manager.get_proposal(proposal_id)
        if not proposal:
            raise HTTPException(status_code=404, detail="Proposal not found")

        # Get voting results
        votes = await governance_manager.get_proposal_votes(proposal_id)

        return {"status": "success", "data": {**proposal, "votes": votes}}
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Proposal retrieval failed", error=str(e), proposal_id=proposal_id)
        raise HTTPException(status_code=500, detail=str(e))

@app.post(
    "/blockchain/governance/execute/{proposal_id}",
    summary="Execute governance proposal",
    description="Execute a successful governance proposal"
)
async def execute_governance_proposal(
    proposal_id: int,
    current_user: User = Depends(get_current_active_user)
):
    """Execute governance proposal"""
    try:
        # Get executor address from username
        executor_address = current_user.username

        result = await governance_manager.execute_proposal(
            proposal_id=proposal_id,
            executor_address=executor_address
        )
        return {"status": "success", "data": result}
    except Exception as e:
        logger.error("Proposal execution failed", error=str(e), proposal_id=proposal_id)
        raise HTTPException(status_code=500, detail=str(e))



# Marketplace Escrow Endpoints
@app.post(
    "/marketplace/escrow",
    summary="Create escrow for marketplace transaction",
    description="Create a secure escrow contract for marketplace purchase"
)
async def create_marketplace_escrow(
    escrow_data: Dict[str, Any],
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create escrow for marketplace transaction"""
    try:
        # Create escrow record in database
        escrow = MarketplaceEscrow(
            buyer_id=current_user.id,
            seller_address=escrow_data['seller'],
            amount=escrow_data['amount'],
            token_address=escrow_data['token'],
            listing_id=escrow_data['listing_id'],
            geo_location=escrow_data['geo_location'],
            status='active'
        )
        db.add(escrow)
        db.commit()
        db.refresh(escrow)

        # Deploy escrow contract on blockchain
        try:
            blockchain_result = await blockchain_service.deploy_escrow_contract(
                buyer=current_user.wallet_address or current_user.username,
                seller=escrow.seller.wallet_address or escrow.seller.username,
                amount=escrow.amount,
                token_address=escrow.token_address,
                listing_id=escrow.listing_id
            )
            escrow.blockchain_tx_hash = blockchain_result['tx_hash']
            escrow.blockchain_escrow_id = blockchain_result.get('escrow_id')
            db.commit()

        except Exception as blockchain_error:
            logger.warning("Blockchain escrow deployment failed", error=str(blockchain_error))
            # Continue without blockchain for now

        logger.info("Escrow created", escrow_id=escrow.id, user_id=current_user.id)
        return {
            "status": "success",
            "escrow_id": escrow.id,
            "message": "Escrow created successfully"
        }

    except Exception as e:
        logger.error("Escrow creation failed", error=str(e), user_id=current_user.id)
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.get(
    "/marketplace/escrow/user/{address}",
    summary="Get user escrows",
    description="Get all escrows for a user address"
)
async def get_user_marketplace_escrows(
    address: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get user escrows"""
    try:
        # Get escrows where user is buyer or seller
        escrows = db.query(MarketplaceEscrow).filter(
            (MarketplaceEscrow.buyer_id == current_user.id) |
            (MarketplaceEscrow.seller_address == address)
        ).all()

        return {
            "status": "success",
            "escrows": [{
                "id": escrow.id,
                "buyer_id": escrow.buyer_id,
                "seller": escrow.seller_address,
                "amount": escrow.amount,
                "token": escrow.token_address,
                "status": escrow.status,
                "listing_id": escrow.listing_id,
                "geo_location": escrow.geo_location,
                "created_at": escrow.created_at.isoformat(),
                "completed_at": escrow.completed_at.isoformat() if escrow.completed_at else None
            } for escrow in escrows]
        }

    except Exception as e:
        logger.error("User escrows retrieval failed", error=str(e), user_id=current_user.id)
        raise HTTPException(status_code=500, detail=str(e))

@app.post(
    "/marketplace/escrow/{escrow_id}/confirm-delivery",
    summary="Confirm delivery for escrow",
    description="Confirm that goods have been delivered in escrow transaction"
)
async def confirm_escrow_delivery(
    escrow_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Confirm delivery for escrow"""
    try:
        escrow = db.query(MarketplaceEscrow).filter(
            MarketplaceEscrow.id == escrow_id,
            MarketplaceEscrow.buyer_id == current_user.id
        ).first()

        if not escrow:
            raise HTTPException(status_code=404, detail="Escrow not found")

        if escrow.status != 'active':
            raise HTTPException(status_code=400, detail="Escrow not in active state")

        escrow.status = 'delivered'
        escrow.delivered_at = datetime.utcnow()
        db.commit()

        # Trigger blockchain escrow confirmation
        try:
            if escrow.blockchain_escrow_id:
                await blockchain_service.confirm_escrow_delivery(
                    escrow_id=int(escrow.blockchain_escrow_id),
                    delivery_proof=delivery_data.get('proof', ''),
                    quality_score=delivery_data.get('quality_score', 0)
                )
        except Exception as blockchain_error:
            logger.warning("Blockchain delivery confirmation failed", error=str(blockchain_error))
            # Continue without blockchain for now

        logger.info("Delivery confirmed", escrow_id=escrow_id, user_id=current_user.id)
        return {
            "status": "success",
            "message": "Delivery confirmed successfully"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Delivery confirmation failed", error=str(e), escrow_id=escrow_id)
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.post(
    "/marketplace/escrow/{escrow_id}/complete",
    summary="Complete escrow transaction",
    description="Complete the escrow transaction and release funds"
)
async def complete_marketplace_escrow(
    escrow_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Complete escrow transaction"""
    try:
        escrow = db.query(MarketplaceEscrow).filter(
            MarketplaceEscrow.id == escrow_id,
            MarketplaceEscrow.buyer_id == current_user.id
        ).first()

        if not escrow:
            raise HTTPException(status_code=404, detail="Escrow not found")

        if escrow.status != 'delivered':
            raise HTTPException(status_code=400, detail="Delivery not confirmed yet")

        escrow.status = 'completed'
        escrow.completed_at = datetime.utcnow()
        db.commit()

        # Release funds from blockchain escrow
        try:
            if escrow.blockchain_escrow_id:
                await blockchain_service.release_escrow_funds(
                    escrow_id=int(escrow.blockchain_escrow_id)
                )
        except Exception as blockchain_error:
            logger.warning("Blockchain fund release failed", error=str(blockchain_error))
            # Continue without blockchain for now

        logger.info("Escrow completed", escrow_id=escrow_id, user_id=current_user.id)
        return {
            "status": "success",
            "message": "Escrow completed successfully"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Escrow completion failed", error=str(e), escrow_id=escrow_id)
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.get(
    "/blockchain/governance/voting-power",
    summary="Get voting power",
    description="Get voting power for the current user"
)
async def get_user_voting_power(current_user: User = Depends(get_current_active_user)):
    """Get voting power for user"""
    try:
        # Get user address from username
        user_address = current_user.username

        voting_power = await governance_manager.get_voting_power(user_address)
        return {"status": "success", "data": {"voting_power": voting_power, "address": user_address}}
    except Exception as e:
        logger.error("Voting power retrieval failed", error=str(e), user_id=current_user.id)
        raise HTTPException(status_code=500, detail=str(e))

@app.post(
    "/blockchain/governance/delegate",
    summary="Delegate voting power",
    description="Delegate voting power to another address"
)
async def delegate_voting_power(
    delegate_address: str,
    current_user: User = Depends(get_current_active_user)
):
    """Delegate voting power"""
    try:
        # Get delegator address from username
        delegator_address = current_user.username

        result = await governance_manager.delegate_votes(
            delegator_address=delegator_address,
            delegate_address=delegate_address
        )
        return {"status": "success", "data": result}
    except Exception as e:
        logger.error("Vote delegation failed", error=str(e), user_id=current_user.id)
        raise HTTPException(status_code=500, detail=str(e))

@app.get(
    "/blockchain/governance/stats",
    summary="Get governance statistics",
    description="Get overall governance statistics"
)
async def get_governance_stats():
    """Get governance statistics"""
    try:
        stats = await governance_manager.get_governance_stats()
        return {"status": "success", "data": stats}
    except Exception as e:
        logger.error("Governance stats retrieval failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.post(
    "/blockchain/nft/farm/mint",
    summary="Mint farm NFT",
    description="Mint an NFT representing farm ownership and data with comprehensive metadata"
)
async def mint_farm_nft(
    farm_name: str,
    location: str,
    size: float,
    crop_type: str,
    expected_yield: float,
    soil_type: Optional[str] = None,
    irrigation_type: Optional[str] = None,
    certifications: Optional[List[str]] = None,
    current_user: User = Depends(get_current_active_user)
):
    """Mint farm NFT"""
    try:
        # Get farmer address from username
        farmer_address = current_user.username

        result = await nft_farming_manager.mint_farm_nft(
            farmer_address=farmer_address,
            farm_name=farm_name,
            location=location,
            size=size,
            crop_type=crop_type,
            expected_yield=expected_yield,
            soil_type=soil_type,
            irrigation_type=irrigation_type,
            certifications=certifications
        )
        return {"status": "success", "data": result}
    except Exception as e:
        logger.error("NFT minting failed", error=str(e), user_id=current_user.id)
        raise HTTPException(status_code=500, detail=str(e))

@app.post(
    "/blockchain/nft/farm/{token_id}/harvest",
    summary="Record harvest for farm NFT",
    description="Record actual harvest data for a farm NFT with detailed information"
)
async def record_nft_harvest(
    token_id: int,
    actual_yield: float,
    harvest_date: Optional[datetime] = None,
    quality_grade: Optional[str] = None,
    notes: Optional[str] = None,
    current_user: User = Depends(get_current_active_user)
):
    """Record harvest for NFT"""
    try:
        result = await nft_farming_manager.record_harvest(
            token_id=token_id,
            actual_yield=actual_yield,
            harvest_date=harvest_date,
            quality_grade=quality_grade,
            notes=notes
        )
        return {"status": "success", "data": result}
    except Exception as e:
        logger.error("Harvest recording failed", error=str(e), token_id=token_id)
        raise HTTPException(status_code=500, detail=str(e))

@app.get(
    "/blockchain/nft/farm/{token_id}",
    summary="Get farm NFT details",
    description="Retrieve detailed farm NFT information including harvest history"
)
async def get_farm_nft(token_id: int):
    """Get farm NFT details"""
    try:
        nft_data = await nft_farming_manager.get_farm_nft(token_id)
        if not nft_data:
            raise HTTPException(status_code=404, detail="NFT not found")
        return {"status": "success", "data": nft_data}
    except HTTPException:
        raise
    except Exception as e:
        logger.error("NFT retrieval failed", error=str(e), token_id=token_id)
        raise HTTPException(status_code=500, detail=str(e))

@app.get(
    "/blockchain/nft/farm",
    summary="Get farmer's NFTs",
    description="Retrieve all NFTs owned by the current user"
)
async def get_farmer_nfts(current_user: User = Depends(get_current_active_user)):
    """Get farmer's NFTs"""
    try:
        # Get farmer address from username
        farmer_address = current_user.username

        nfts = await nft_farming_manager.get_farmer_nfts(farmer_address)
        return {"status": "success", "data": nfts}
    except Exception as e:
        logger.error("Farmer NFTs retrieval failed", error=str(e), user_id=current_user.id)
        raise HTTPException(status_code=500, detail=str(e))

@app.get(
    "/blockchain/nft/farm/analytics",
    summary="Get farming analytics",
    description="Get farming analytics and statistics"
)
async def get_farming_analytics(
    farmer_address: Optional[str] = None,
    current_user: User = Depends(get_current_active_user)
):
    """Get farming analytics"""
    try:
        # If no farmer_address provided, use current user's address
        if not farmer_address:
            farmer_address = current_user.username

        analytics = await nft_farming_manager.get_farm_analytics(farmer_address)
        return {"status": "success", "data": analytics}
    except Exception as e:
        logger.error("Farming analytics retrieval failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.put(
    "/blockchain/nft/farm/{token_id}/metadata",
    summary="Update farm NFT metadata",
    description="Update farm NFT metadata information"
)
async def update_nft_metadata(
    token_id: int,
    updates: Dict[str, Any],
    current_user: User = Depends(get_current_active_user)
):
    """Update NFT metadata"""
    try:
        result = await nft_farming_manager.update_nft_metadata(token_id, updates)
        return {"status": "success", "data": result}
    except Exception as e:
        logger.error("NFT metadata update failed", error=str(e), token_id=token_id)
        raise HTTPException(status_code=500, detail=str(e))

@app.post(
    "/blockchain/pool/create",
    summary="Create liquidity pool",
    description="Create a new liquidity pool for token pair"
)
async def create_liquidity_pool(
    token_a: str,
    token_b: str,
    fee: int = 30,
    current_user: User = Depends(get_current_active_user)
):
    """Create liquidity pool"""
    try:
        result = await liquidity_pool_manager.create_pool(token_a, token_b, fee)
        return {"status": "success", "data": result}
    except Exception as e:
        logger.error("Pool creation failed", error=str(e), token_a=token_a, token_b=token_b)
        raise HTTPException(status_code=500, detail=str(e))

@app.post(
    "/blockchain/pool/add-liquidity",
    summary="Add liquidity to pool",
    description="Add liquidity to an existing pool"
)
async def add_liquidity(
    token_a: str,
    token_b: str,
    amount_a: float,
    amount_b: float,
    slippage: float = 0.5,
    current_user: User = Depends(get_current_active_user)
):
    """Add liquidity to pool"""
    try:
        # Get user address from username
        user_address = current_user.username

        result = await liquidity_pool_manager.add_liquidity(
            user_address=user_address,
            token_a=token_a,
            token_b=token_b,
            amount_a=amount_a,
            amount_b=amount_b,
            slippage=slippage
        )
        return {"status": "success", "data": result}
    except Exception as e:
        logger.error("Add liquidity failed", error=str(e), user_id=current_user.id)
        raise HTTPException(status_code=500, detail=str(e))

@app.post(
    "/blockchain/pool/remove-liquidity",
    summary="Remove liquidity from pool",
    description="Remove liquidity from a pool position"
)
async def remove_liquidity(
    position_id: int,
    liquidity_tokens: float,
    current_user: User = Depends(get_current_active_user)
):
    """Remove liquidity from pool"""
    try:
        # Get user address from username
        user_address = current_user.username

        result = await liquidity_pool_manager.remove_liquidity(
            user_address=user_address,
            position_id=position_id,
            liquidity_tokens=liquidity_tokens
        )
        return {"status": "success", "data": result}
    except Exception as e:
        logger.error("Remove liquidity failed", error=str(e), position_id=position_id)
        raise HTTPException(status_code=500, detail=str(e))

@app.get(
    "/blockchain/pool/info",
    summary="Get pool information",
    description="Get detailed information about a liquidity pool"
)
async def get_pool_info(token_a: str, token_b: str):
    """Get pool information"""
    try:
        pool_info = await liquidity_pool_manager.get_pool_info(token_a, token_b)
        if not pool_info:
            raise HTTPException(status_code=404, detail="Pool not found")
        return {"status": "success", "data": pool_info}
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Pool info retrieval failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.get(
    "/blockchain/pool/positions",
    summary="Get user liquidity positions",
    description="Get all liquidity positions for the current user"
)
async def get_user_liquidity_positions(current_user: User = Depends(get_current_active_user)):
    """Get user liquidity positions"""
    try:
        # Get user address from username
        user_address = current_user.username

        positions = await liquidity_pool_manager.get_user_positions(user_address)
        return {"status": "success", "data": positions}
    except Exception as e:
        logger.error("User positions retrieval failed", error=str(e), user_id=current_user.id)
        raise HTTPException(status_code=500, detail=str(e))

@app.post(
    "/blockchain/pool/claim-rewards",
    summary="Claim pool rewards",
    description="Claim accumulated rewards for a liquidity position"
)
async def claim_pool_rewards(
    position_id: int,
    current_user: User = Depends(get_current_active_user)
):
    """Claim pool rewards"""
    try:
        # Get user address from username
        user_address = current_user.username

        result = await liquidity_pool_manager.claim_rewards(user_address, position_id)
        return {"status": "success", "data": result}
    except Exception as e:
        logger.error("Reward claiming failed", error=str(e), position_id=position_id)
        raise HTTPException(status_code=500, detail=str(e))

@app.get(
    "/blockchain/pool/analytics",
    summary="Get pool analytics",
    description="Get overall liquidity pool analytics"
)
async def get_pool_analytics():
    """Get pool analytics"""
    try:
        analytics = await liquidity_pool_manager.get_pool_analytics()
        return {"status": "success", "data": analytics}
    except Exception as e:
        logger.error("Pool analytics retrieval failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.post(
    "/blockchain/bridge/transfer",
    summary="Initiate cross-chain token transfer",
    description="Transfer tokens between different blockchain networks"
)
async def initiate_bridge_transfer(
    from_chain: str,
    to_chain: str,
    token_symbol: str,
    amount: float,
    recipient_address: Optional[str] = None,
    current_user: User = Depends(get_current_active_user)
):
    """Initiate cross-chain transfer"""
    try:
        # Get user address from username
        user_address = current_user.username

        result = await cross_chain_bridge.initiate_bridge_transfer(
            user_address=user_address,
            from_chain=from_chain,
            to_chain=to_chain,
            token_symbol=token_symbol,
            amount=amount,
            recipient_address=recipient_address
        )
        return {"status": "success", "data": result}
    except Exception as e:
        logger.error("Bridge transfer initiation failed", error=str(e), user_id=current_user.id)
        raise HTTPException(status_code=500, detail=str(e))

@app.get(
    "/blockchain/bridge/transfer/{transfer_id}",
    summary="Get bridge transfer details",
    description="Get detailed information about a cross-chain transfer"
)
async def get_bridge_transfer(transfer_id: int):
    """Get bridge transfer details"""
    try:
        transfer = await cross_chain_bridge.get_bridge_transaction(transfer_id)
        if not transfer:
            raise HTTPException(status_code=404, detail="Transfer not found")
        return {"status": "success", "data": transfer}
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Bridge transfer retrieval failed", error=str(e), transfer_id=transfer_id)
        raise HTTPException(status_code=500, detail=str(e))

@app.get(
    "/blockchain/bridge/history",
    summary="Get bridge transfer history",
    description="Get cross-chain transfer history for the current user"
)
async def get_bridge_history(
    limit: int = 50,
    current_user: User = Depends(get_current_active_user)
):
    """Get bridge transfer history"""
    try:
        # Get user address from username
        user_address = current_user.username

        history = await cross_chain_bridge.get_user_bridge_history(user_address, limit)
        return {"status": "success", "data": history}
    except Exception as e:
        logger.error("Bridge history retrieval failed", error=str(e), user_id=current_user.id)
        raise HTTPException(status_code=500, detail=str(e))

@app.get(
    "/blockchain/bridge/fees",
    summary="Get bridge fees",
    description="Get bridge fees and estimated times for a route"
)
async def get_bridge_fees(from_chain: str, to_chain: str):
    """Get bridge fees"""
    try:
        fees = await cross_chain_bridge.get_bridge_fees(from_chain, to_chain)
        return {"status": "success", "data": fees}
    except Exception as e:
        logger.error("Bridge fees retrieval failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.get(
    "/blockchain/bridge/chains",
    summary="Get supported chains",
    description="Get list of supported blockchain networks"
)
async def get_supported_chains():
    """Get supported chains"""
    try:
        chains = await cross_chain_bridge.get_supported_chains()
        return {"status": "success", "data": chains}
    except Exception as e:
        logger.error("Supported chains retrieval failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.get(
    "/blockchain/bridge/analytics",
    summary="Get bridge analytics",
    description="Get cross-chain bridge analytics and statistics"
)
async def get_bridge_analytics():
    """Get bridge analytics"""
    try:
        analytics = await cross_chain_bridge.get_bridge_analytics()
        return {"status": "success", "data": analytics}
    except Exception as e:
        logger.error("Bridge analytics retrieval failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.post(
    "/blockchain/yield/deposit",
    summary="Deposit tokens for yield farming",
    description="Deposit tokens into yield farming contract"
)
async def deposit_yield_tokens(
    amount: float,
    current_user: User = Depends(get_current_active_user)
):
    """Deposit tokens for yield farming"""
    try:
        result = await blockchain_service.deposit_yield_tokens(amount)
        return {"status": "success", "data": result}
    except Exception as e:
        logger.error("Yield deposit failed", error=str(e), user_id=current_user.id)
        raise HTTPException(status_code=500, detail=str(e))

@app.post(
    "/blockchain/yield/claim",
    summary="Claim yield rewards",
    description="Claim accumulated yield rewards"
)
async def claim_yield_rewards(current_user: User = Depends(get_current_active_user)):
    """Claim yield rewards"""
    try:
        result = await blockchain_service.claim_yield()
        return {"status": "success", "data": result}
    except Exception as e:
        logger.error("Yield claim failed", error=str(e), user_id=current_user.id)
        raise HTTPException(status_code=500, detail=str(e))

@app.get(
    "/blockchain/yield/position/{address}",
    summary="Get yield farming position",
    description="Get yield farming position for an address"
)
async def get_yield_position(address: str):
    """Get yield farming position"""
    try:
        position = await blockchain_service.get_yield_position(address)
        return {"status": "success", "data": position}
    except Exception as e:
        logger.error("Yield position retrieval failed", error=str(e), address=address)
        raise HTTPException(status_code=500, detail=str(e))

# Oracle data feeds endpoints
@app.get(
    "/oracle/prices/{commodity}",
    summary="Get commodity price from oracle",
    description="Retrieve current price data for agricultural commodities from oracle feeds"
)
async def get_commodity_price(commodity: str):
    """Get commodity price from oracle"""
    try:
        from .core.cache import cache
        cached_price = await cache.get_oracle_price(f"{commodity}_price")
        if cached_price:
            return {"status": "success", "price": cached_price, "cached": True}

        # If not cached, return mock data (in production, this would query Chainlink)
        mock_prices = {
            'corn': 185.50,
            'wheat': 220.75,
            'soybean': 425.25,
            'cassava': 150.00,
            'rice': 380.25
        }

        price = mock_prices.get(commodity.lower(), 200.00)
        await cache.set_oracle_price(f"{commodity}_price", price)

        return {"status": "success", "price": price, "cached": False}
    except Exception as e:
        logger.error("Price retrieval failed", error=str(e), commodity=commodity)
        raise HTTPException(status_code=500, detail=str(e))

# Analytics and Insights endpoints
@app.get(
    "/analytics/dashboard-overview",
    summary="Dashboard Analytics Overview",
    description="Get comprehensive analytics overview for the AgriCredit platform"
)
async def get_dashboard_analytics(
    days: int = Query(30, ge=1, le=365, description="Number of days to analyze"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
    cache_client = Depends(get_cache)
):
    """Get comprehensive dashboard analytics"""
    try:
        # Check cache first
        cache_key = f"dashboard_analytics_{days}"
        cached_data = await cache_client.get_dashboard_analytics(cache_key)
        if cached_data:
            logger.info("Dashboard analytics served from cache", user_id=current_user.id, days=days)
            return api_response.success(cached_data, "Analytics retrieved from cache")

        # Calculate date range
        cutoff_date = datetime.utcnow() - timedelta(days=days)

        # User statistics
        total_users = db.query(User).count()
        active_users = db.query(User).filter(User.last_login >= cutoff_date).count()

        # Loan statistics
        total_loans = db.query(Loan).count()
        active_loans = db.query(Loan).filter(Loan.status == "active").count()
        recent_loans = db.query(Loan).filter(Loan.created_at >= cutoff_date).count()
        total_loan_amount = db.query(Loan).with_entities(func.sum(Loan.amount)).scalar() or 0

        # Marketplace statistics
        total_listings = db.query(MarketplaceListing).count()
        active_listings = db.query(MarketplaceListing).filter(MarketplaceListing.status == "active").count()
        recent_listings = db.query(MarketplaceListing).filter(MarketplaceListing.created_at >= cutoff_date).count()

        # Sensor data statistics
        total_devices = db.query(SensorDevice).count()
        active_devices = db.query(SensorDevice).filter(
            SensorDevice.last_seen >= cutoff_date
        ).count()
        total_readings = db.query(SensorReading).filter(
            SensorReading.timestamp >= cutoff_date
        ).count()

        # Carbon credit statistics
        total_credits = db.query(CarbonCredit).count()
        recent_credits = db.query(CarbonCredit).filter(
            CarbonCredit.created_at >= cutoff_date
        ).count()

        # AI model usage statistics
        credit_scores_count = db.query(CreditScore).filter(
            CreditScore.created_at >= cutoff_date
        ).count()
        yield_predictions_count = db.query(YieldPrediction).filter(
            YieldPrediction.created_at >= cutoff_date
        ).count()
        climate_analyses_count = db.query(ClimateAnalysis).filter(
            ClimateAnalysis.created_at >= cutoff_date
        ).count()

        analytics_data = {
            "time_range_days": days,
            "users": {
                "total": total_users,
                "active": active_users,
                "growth_rate": round((active_users / max(total_users, 1)) * 100, 2)
            },
            "loans": {
                "total": total_loans,
                "active": active_loans,
                "recent": recent_loans,
                "total_amount": float(total_loan_amount),
                "utilization_rate": round((active_loans / max(total_loans, 1)) * 100, 2)
            },
            "marketplace": {
                "total_listings": total_listings,
                "active_listings": active_listings,
                "recent_listings": recent_listings,
                "activity_rate": round((active_listings / max(total_listings, 1)) * 100, 2)
            },
            "iot": {
                "total_devices": total_devices,
                "active_devices": active_devices,
                "total_readings": total_readings,
                "device_utilization": round((active_devices / max(total_devices, 1)) * 100, 2)
            },
            "carbon_credits": {
                "total_credits": total_credits,
                "recent_credits": recent_credits
            },
            "ai_usage": {
                "credit_scores": credit_scores_count,
                "yield_predictions": yield_predictions_count,
                "climate_analyses": climate_analyses_count,
                "total_predictions": credit_scores_count + yield_predictions_count + climate_analyses_count
            },
            "generated_at": datetime.utcnow().isoformat()
        }

        # Cache the results
        await cache_client.set_dashboard_analytics(cache_key, analytics_data)

        logger.info("Dashboard analytics generated", user_id=current_user.id, days=days)
        return api_response.success(analytics_data, "Analytics generated successfully")

    except Exception as e:
        logger.error("Dashboard analytics generation failed", error=str(e), user_id=current_user.id)
        raise HTTPException(status_code=500, detail=str(e))

@app.get(
    "/analytics/user-insights/{user_id}",
    summary="User-Specific Analytics",
    description="Get detailed analytics and insights for a specific user"
)
async def get_user_insights(
    user_id: int,
    days: int = Query(90, ge=7, le=365, description="Analysis period in days"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get detailed user-specific analytics"""
    try:
        # Verify access (users can only see their own data or admins can see all)
        if current_user.id != user_id and current_user.role != "admin":
            raise HTTPException(status_code=403, detail="Access denied")

        cutoff_date = datetime.utcnow() - timedelta(days=days)

        # User loans
        user_loans = db.query(Loan).filter(
            Loan.user_id == user_id,
            Loan.created_at >= cutoff_date
        ).all()

        # User devices and sensor data
        user_devices = db.query(SensorDevice).filter(SensorDevice.owner_id == user_id).all()
        device_ids = [d.id for d in user_devices]

        sensor_readings = db.query(SensorReading).filter(
            SensorReading.device_id.in_(device_ids),
            SensorReading.timestamp >= cutoff_date
        ).count() if device_ids else 0

        # User marketplace activity
        user_listings = db.query(MarketplaceListing).filter(
            MarketplaceListing.seller_id == user_id,
            MarketplaceListing.created_at >= cutoff_date
        ).count()

        # User AI usage
        credit_scores = db.query(CreditScore).filter(
            CreditScore.user_id == user_id,
            CreditScore.created_at >= cutoff_date
        ).count()

        yield_predictions = db.query(YieldPrediction).filter(
            YieldPrediction.user_id == user_id,
            YieldPrediction.created_at >= cutoff_date
        ).count()

        climate_analyses = db.query(ClimateAnalysis).filter(
            ClimateAnalysis.user_id == user_id,
            ClimateAnalysis.created_at >= cutoff_date
        ).count()

        # Calculate insights
        loan_amount = sum(loan.amount for loan in user_loans) if user_loans else 0
        avg_loan_amount = loan_amount / len(user_loans) if user_loans else 0

        insights = {
            "user_id": user_id,
            "analysis_period_days": days,
            "loans": {
                "count": len(user_loans),
                "total_amount": float(loan_amount),
                "average_amount": round(avg_loan_amount, 2),
                "active_loans": len([l for l in user_loans if l.status == "active"])
            },
            "devices": {
                "total_devices": len(user_devices),
                "active_devices": len([d for d in user_devices if d.last_seen and d.last_seen >= cutoff_date]),
                "total_readings": sensor_readings,
                "avg_readings_per_device": round(sensor_readings / max(len(user_devices), 1), 1)
            },
            "marketplace": {
                "listings_created": user_listings
            },
            "ai_usage": {
                "credit_scores_requested": credit_scores,
                "yield_predictions_requested": yield_predictions,
                "climate_analyses_requested": climate_analyses,
                "total_ai_requests": credit_scores + yield_predictions + climate_analyses
            },
            "engagement_score": min(100, (
                len(user_loans) * 10 +
                len(user_devices) * 15 +
                user_listings * 5 +
                (credit_scores + yield_predictions + climate_analyses) * 2
            )),
            "generated_at": datetime.utcnow().isoformat()
        }

        logger.info("User insights generated", user_id=user_id, analysis_days=days)
        return api_response.success(insights, "User insights generated successfully")

    except HTTPException:
        raise
    except Exception as e:
        logger.error("User insights generation failed", error=str(e), user_id=user_id)
        raise HTTPException(status_code=500, detail=str(e))

@app.get(
    "/oracle/weather/{location}",
    summary="Get weather data from oracle",
    description="Retrieve current weather data for agricultural planning from oracle feeds"
)
async def get_weather_data(location: str):
    """Get weather data from oracle"""
    try:
        from .core.cache import cache
        cached_weather = await cache.get_weather_data(location)
        if cached_weather:
            return {"status": "success", "data": cached_weather, "cached": True}

        # Mock weather data (in production, this would query weather oracles)
        mock_weather = {
            'nairobi': {
                'temperature': 24.5,
                'humidity': 65.0,
                'rainfall': 12.5,
                'wind_speed': 8.5,
                'timestamp': datetime.utcnow().isoformat()
            },
            'lagos': {
                'temperature': 28.0,
                'humidity': 78.0,
                'rainfall': 8.2,
                'wind_speed': 6.2,
                'timestamp': datetime.utcnow().isoformat()
            },
            'accra': {
                'temperature': 26.8,
                'humidity': 72.0,
                'rainfall': 15.1,
                'wind_speed': 9.8,
                'timestamp': datetime.utcnow().isoformat()
            }
        }

        weather_data = mock_weather.get(location.lower(), {
            'temperature': 25.0,
            'humidity': 70.0,
            'rainfall': 10.0,
            'wind_speed': 7.5,
            'timestamp': datetime.utcnow().isoformat()
        })

        await cache.set_weather_data(location, weather_data)

        return {"status": "success", "data": weather_data, "cached": False}
    except Exception as e:
        logger.error("Weather data retrieval failed", error=str(e), location=location)
        raise HTTPException(status_code=500, detail=str(e))

@app.get(
    "/oracle/crop-yield/{crop_type}/{region}",
    summary="Get crop yield data from oracle",
    description="Retrieve crop yield predictions and historical data from agricultural oracles"
)
async def get_crop_yield_data(crop_type: str, region: str):
    """Get crop yield data from oracle"""
    try:
        from .core.cache import cache
        cache_key = f"{crop_type}_{region}"
        cached_yield = await cache.get_crop_yield_data(cache_key)
        if cached_yield:
            return {"status": "success", "data": cached_yield, "cached": True}

        # Mock crop yield data (in production, this would query agricultural oracles)
        mock_yields = {
            'corn': {
                'average_yield': 8.5,
                'predicted_yield': 9.2,
                'unit': 'tons/hectare',
                'confidence': 0.85,
                'region': region,
                'timestamp': datetime.utcnow().isoformat()
            },
            'wheat': {
                'average_yield': 3.2,
                'predicted_yield': 3.8,
                'unit': 'tons/hectare',
                'confidence': 0.82,
                'region': region,
                'timestamp': datetime.utcnow().isoformat()
            },
            'rice': {
                'average_yield': 6.8,
                'predicted_yield': 7.1,
                'unit': 'tons/hectare',
                'confidence': 0.88,
                'region': region,
                'timestamp': datetime.utcnow().isoformat()
            },
            'cassava': {
                'average_yield': 25.0,
                'predicted_yield': 26.5,
                'unit': 'tons/hectare',
                'confidence': 0.79,
                'region': region,
                'timestamp': datetime.utcnow().isoformat()
            }
        }

        yield_data = mock_yields.get(crop_type.lower(), {
            'average_yield': 5.0,
            'predicted_yield': 5.5,
            'unit': 'tons/hectare',
            'confidence': 0.75,
            'region': region,
            'timestamp': datetime.utcnow().isoformat()
        })

        await cache.set_crop_yield_data(cache_key, yield_data)

        return {"status": "success", "data": yield_data, "cached": False}
    except Exception as e:
        logger.error("Crop yield data retrieval failed", error=str(e), crop_type=crop_type, region=region)
        raise HTTPException(status_code=500, detail=str(e))

# Admin endpoints (would require admin role check)
@app.post("/admin/train-models")
async def train_models():
    """Train AI models with sample data (admin only)"""
    try:
        # Train credit scoring model
        X_credit, y_credit = credit_model.generate_sample_data(1000)
        credit_model.train(X_credit, y_credit)

        # Train yield prediction model
        X_yield, y_yield = yield_model.generate_sample_data(1000)
        yield_model.train(X_yield, y_yield)

        logger.info("AI models retrained")
        return {"status": "success", "message": "Models trained successfully"}
    except Exception as e:
        logger.error("Model training failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

# External API integrations
@app.get("/api/external/satellite-data")
async def get_satellite_data(location: str, start_date: str, end_date: str):
    """Get satellite data for location"""
    try:
        data = await external_apis_service.get_satellite_data(location, start_date, end_date)
        return {"status": "success", "data": data}
    except Exception as e:
        logger.error("Satellite data request failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/external/weather")
async def get_weather_data(location: str):
    """Get weather data for location"""
    try:
        data = await external_apis_service.get_weather_data(location)
        return {"status": "success", "data": data}
    except Exception as e:
        logger.error("Weather data request failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/external/mobile-money/send")
async def send_mobile_money(phone_number: str, amount: float, currency: str = "KES"):
    """Send mobile money"""
    try:
        result = await external_apis_service.send_mobile_money(phone_number, amount, currency)
        return {"status": "success", "data": result}
    except Exception as e:
        logger.error("Mobile money send failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/external/oracle/price")
async def get_oracle_price(asset: str, source: str = "chainlink"):
    """Get price from oracle"""
    try:
        data = await external_apis_service.get_oracle_price_feed(asset, source)
        return {"status": "success", "data": data}
    except Exception as e:
        logger.error("Oracle price request failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/external/copernicus")
async def get_copernicus_data(location: str, dataset: str = "NDVI"):
    """Get Copernicus satellite data"""
    try:
        data = await external_apis_service.get_copernicus_data(location, dataset)
        return {"status": "success", "data": data}
    except Exception as e:
        logger.error("Copernicus data request failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

# Startup and shutdown events
@app.on_event("startup")
async def startup_event():
    """Application startup tasks"""
    logger.info("Starting AgriCredit backend")

    # Start blockchain event listeners
    try:
        await event_listener.start_listening()
        logger.info("Blockchain event listeners started")
    except Exception as e:
        logger.error("Failed to start event listeners", error=str(e))

@app.on_event("shutdown")
async def shutdown_event():
    """Application shutdown tasks"""
    logger.info("Shutting down AgriCredit backend")

    # Stop blockchain event listeners
    try:
        await event_listener.stop_listening()
        logger.info("Blockchain event listeners stopped")
    except Exception as e:
        logger.error("Error stopping event listeners", error=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)