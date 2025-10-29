from fastapi import FastAPI, Depends, HTTPException, status, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List, Optional
import structlog

from .database.config import get_db, engine, Base
from .database.models import User, SensorDevice, SensorReading, CreditScore, YieldPrediction, ClimateAnalysis, Loan, MarketplaceListing, Notification, CarbonCredit
from .core.config import settings
from .core.security import verify_password, get_password_hash, create_access_token, verify_token
from .core.cache import get_cache
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
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()

# Create database tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title="AgriCredit AI Services",
    description="Comprehensive agricultural credit and AI services platform",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# Initialize AI models
credit_model = CreditScoringModel()
yield_model = YieldPredictionModel()
climate_model = ClimateAnalysisModel()

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
@app.post("/auth/register", response_model=UserSchema)
async def register_user(user_data: UserCreate, db: Session = Depends(get_db)):
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

    logger.info("User registered", user_id=db_user.id, username=db_user.username)
    return db_user

@app.post("/auth/login", response_model=Token)
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
@app.post("/ai/credit-scoring")
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

@app.post("/ai/yield-prediction")
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

@app.post("/ai/climate-analysis")
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

@app.get("/marketplace/listings", response_model=List[MarketplaceListingSchema])
async def get_marketplace_listings(
    crop_type: Optional[str] = None,
    location: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get marketplace listings with optional filters"""
    query = db.query(MarketplaceListing).filter(MarketplaceListing.status == "active")

    if crop_type:
        query = query.filter(MarketplaceListing.crop_type == crop_type)
    if location:
        query = query.filter(MarketplaceListing.location.ilike(f"%{location}%"))

    listings = query.all()
    return listings

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

# Background tasks
async def analyze_sensor_data(device_id: int, reading_id: int):
    """Analyze sensor data and generate insights"""
    # This would trigger AI analysis, alerts, etc.
    logger.info("Analyzing sensor data", device_id=device_id, reading_id=reading_id)
    # TODO: Implement sensor data analysis logic

# Health check
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "AgriCredit AI",
        "version": "2.0.0",
        "timestamp": datetime.utcnow().isoformat()
    }

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)