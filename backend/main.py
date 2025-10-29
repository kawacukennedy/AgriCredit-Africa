from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import numpy as np
from typing import Dict, Any, Optional
from models.credit_scoring_model import CreditScoringModel
from models.yield_prediction_model import YieldPredictionModel
from models.climate_model import ClimateAnalysisModel

app = FastAPI(title="AgriCredit AI Services", version="1.0.0")

# Initialize AI models
credit_model = CreditScoringModel()
yield_model = YieldPredictionModel()
climate_model = ClimateAnalysisModel()

class CreditScoringRequest(BaseModel):
    crop_type: str
    farm_size: float
    location: str
    historical_data: Optional[Dict[str, Any]] = None
    mobile_money_usage: Optional[float] = None
    cooperative_membership: Optional[bool] = None

class YieldPredictionRequest(BaseModel):
    crop_type: str
    farm_size: float
    location: str
    weather_data: Optional[Dict[str, Any]] = None
    soil_quality: Optional[float] = None
    irrigation_access: Optional[bool] = None

class ClimateAnalysisRequest(BaseModel):
    satellite_data: Dict[str, Any]
    iot_sensors: Optional[Dict[str, Any]] = None

def extract_credit_features(request: CreditScoringRequest) -> np.ndarray:
    """Extract features for credit scoring model"""
    # Default values for missing data
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
    return np.array(features)

def extract_yield_features(request: YieldPredictionRequest) -> np.ndarray:
    """Extract features for yield prediction model"""
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
    return np.array(features)

@app.post("/credit-scoring")
async def credit_scoring(request: CreditScoringRequest):
    try:
        features = extract_credit_features(request)
        result = credit_model.predict(features)
        return {"status": "success", "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/yield-prediction")
async def yield_prediction(request: YieldPredictionRequest):
    try:
        features = extract_yield_features(request)
        result = yield_model.predict(features)
        return {"status": "success", "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/climate-analysis")
async def climate_analysis(request: ClimateAnalysisRequest):
    try:
        result = climate_model.analyze_climate_impact(request.satellite_data, request.iot_sensors or {})
        return {"status": "success", "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/train-models")
async def train_models():
    """Train AI models with sample data (for development)"""
    try:
        # Train credit scoring model
        X_credit, y_credit = credit_model.generate_sample_data(1000)
        credit_model.train(X_credit, y_credit, epochs=20)

        # Train yield prediction model
        X_yield, y_yield = yield_model.generate_sample_data(1000)
        yield_model.train(X_yield, y_yield)

        return {"status": "success", "message": "Models trained successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "AgriCredit AI"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)