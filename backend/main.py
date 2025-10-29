from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import tensorflow as tf
import numpy as np
from typing import Dict, Any

app = FastAPI(title="AgriCredit AI Services", version="1.0.0")

class CreditScoringRequest(BaseModel):
    crop_type: str
    farm_size: float
    location: str
    historical_data: Dict[str, Any]

class YieldPredictionRequest(BaseModel):
    crop_type: str
    farm_size: float
    location: str
    weather_data: Dict[str, Any]

class ClimateAnalysisRequest(BaseModel):
    satellite_data: Dict[str, Any]
    iot_sensors: Dict[str, Any]

# Mock AI models (in production, load trained models)
def mock_credit_score(features: Dict[str, Any]) -> Dict[str, Any]:
    # Simple mock scoring based on inputs
    base_score = 500
    if features.get('farm_size', 0) > 5:
        base_score += 100
    if features.get('crop_type') in ['maize', 'rice']:
        base_score += 50

    return {
        "credit_score": min(base_score, 850),
        "trust_level": "High" if base_score > 700 else "Medium",
        "confidence": 0.85,
        "explainability": "Score based on farm size, crop type, and location stability"
    }

def mock_yield_prediction(features: Dict[str, Any]) -> Dict[str, Any]:
    base_yield = 8.0
    if features.get('crop_type') == 'maize':
        base_yield = 9.5
    elif features.get('crop_type') == 'rice':
        base_yield = 7.2

    return {
        "predicted_yield": base_yield,
        "unit": "tons/hectare",
        "confidence_interval": [base_yield * 0.8, base_yield * 1.2],
        "factors": ["weather_patterns", "soil_quality", "historical_performance"]
    }

def mock_climate_analysis(data: Dict[str, Any]) -> Dict[str, Any]:
    # Mock carbon sequestration calculation
    base_co2 = 2.5  # tons per hectare
    return {
        "co2_sequestered": base_co2,
        "ndvi_score": 0.72,
        "carbon_tokens_mintable": base_co2,
        "recommendations": ["Increase tree cover", "Implement no-till farming"]
    }

@app.post("/credit-scoring")
async def credit_scoring(request: CreditScoringRequest):
    try:
        result = mock_credit_score(request.dict())
        return {"status": "success", "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/yield-prediction")
async def yield_prediction(request: YieldPredictionRequest):
    try:
        result = mock_yield_prediction(request.dict())
        return {"status": "success", "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/climate-analysis")
async def climate_analysis(request: ClimateAnalysisRequest):
    try:
        result = mock_climate_analysis(request.dict())
        return {"status": "success", "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "AgriCredit AI"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)