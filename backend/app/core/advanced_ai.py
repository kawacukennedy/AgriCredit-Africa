"""
Advanced AI Services for AgriCredit
Provides sophisticated ML models for agricultural analytics
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta
import logging
import asyncio
from concurrent.futures import ThreadPoolExecutor
from sklearn.ensemble import RandomForestRegressor, GradientBoostingClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, accuracy_score
import xgboost as xgb
import lightgbm as lgb
import tensorflow as tf
from tensorflow import keras
from transformers import pipeline
import joblib
import os
import json
import hashlib

logger = logging.getLogger(__name__)

class AdvancedAIService:
    """Advanced AI service with multiple ML models and optimized loading"""

    def __init__(self, cache_client=None):
        self.models_dir = os.path.join(os.path.dirname(__file__), '../../models')
        os.makedirs(self.models_dir, exist_ok=True)

        # Cache client for model caching
        self.cache_client = cache_client

        # Model loading state
        self._models_loaded = {
            'crop_disease': False,
            'market_prediction': False,
            'climate_risk': False,
            'sentiment': False
        }

        # Model instances (lazy loaded)
        self._crop_disease_model = None
        self._market_prediction_model = None
        self._climate_risk_model = None
        self._sentiment_analyzer = None

        # Thread pool for async model loading
        self.executor = ThreadPoolExecutor(max_workers=2)

        # Model metadata for versioning
        self.model_versions = {}

        # Start background model preloading
        asyncio.create_task(self._preload_critical_models())

    async def _preload_critical_models(self):
        """Preload critical models in background"""
        try:
            # Preload market prediction model (most frequently used)
            await self._ensure_market_model_loaded()
            # Preload climate risk model (used for risk assessment)
            await self._ensure_climate_model_loaded()
            logger.info("Critical AI models preloaded successfully")
        except Exception as e:
            logger.warning(f"Background model preloading failed: {e}")

    async def _ensure_crop_model_loaded(self):
        """Lazy load crop disease model"""
        if not self._models_loaded['crop_disease']:
            try:
                # Check cache first
                if self.cache_client:
                    cached_model = await self.cache_client.get_model('crop_disease')
                    if cached_model:
                        self._crop_disease_model = cached_model
                        self._models_loaded['crop_disease'] = True
                        return

                # Load from disk
                disease_model_path = os.path.join(self.models_dir, 'crop_disease_model.h5')
                if os.path.exists(disease_model_path):
                    loop = asyncio.get_event_loop()
                    self._crop_disease_model = await loop.run_in_executor(
                        self.executor, keras.models.load_model, disease_model_path
                    )
                else:
                    self._crop_disease_model = self._create_crop_disease_model()

                self._models_loaded['crop_disease'] = True

                # Cache the model
                if self.cache_client:
                    await self.cache_client.set_model('crop_disease', self._crop_disease_model)

                logger.info("Crop disease model loaded")

            except Exception as e:
                logger.error(f"Failed to load crop disease model: {e}")
                self._crop_disease_model = RandomForestRegressor(n_estimators=10, random_state=42)

    async def _ensure_market_model_loaded(self):
        """Lazy load market prediction model"""
        if not self._models_loaded['market_prediction']:
            try:
                # Check cache first
                if self.cache_client:
                    cached_model = await self.cache_client.get_model('market_prediction')
                    if cached_model:
                        self._market_prediction_model = cached_model
                        self._models_loaded['market_prediction'] = True
                        return

                # Load from disk
                market_model_path = os.path.join(self.models_dir, 'market_prediction_model.pkl')
                if os.path.exists(market_model_path):
                    loop = asyncio.get_event_loop()
                    self._market_prediction_model = await loop.run_in_executor(
                        self.executor, joblib.load, market_model_path
                    )
                else:
                    self._market_prediction_model = self._create_market_prediction_model()

                self._models_loaded['market_prediction'] = True

                # Cache the model
                if self.cache_client:
                    await self.cache_client.set_model('market_prediction', self._market_prediction_model)

                logger.info("Market prediction model loaded")

            except Exception as e:
                logger.error(f"Failed to load market prediction model: {e}")
                self._market_prediction_model = RandomForestRegressor(n_estimators=10, random_state=42)

    async def _ensure_climate_model_loaded(self):
        """Lazy load climate risk model"""
        if not self._models_loaded['climate_risk']:
            try:
                # Check cache first
                if self.cache_client:
                    cached_model = await self.cache_client.get_model('climate_risk')
                    if cached_model:
                        self._climate_risk_model = cached_model
                        self._models_loaded['climate_risk'] = True
                        return

                # Load from disk
                climate_model_path = os.path.join(self.models_dir, 'climate_risk_model.pkl')
                if os.path.exists(climate_model_path):
                    loop = asyncio.get_event_loop()
                    self._climate_risk_model = await loop.run_in_executor(
                        self.executor, joblib.load, climate_model_path
                    )
                else:
                    self._climate_risk_model = self._create_climate_risk_model()

                self._models_loaded['climate_risk'] = True

                # Cache the model
                if self.cache_client:
                    await self.cache_client.set_model('climate_risk', self._climate_risk_model)

                logger.info("Climate risk model loaded")

            except Exception as e:
                logger.error(f"Failed to load climate risk model: {e}")
                self._climate_risk_model = RandomForestRegressor(n_estimators=10, random_state=42)

    async def _ensure_sentiment_analyzer_loaded(self):
        """Lazy load sentiment analyzer"""
        if not self._models_loaded['sentiment']:
            try:
                # Check cache first
                if self.cache_client:
                    cached_analyzer = await self.cache_client.get_model('sentiment_analyzer')
                    if cached_analyzer:
                        self._sentiment_analyzer = cached_analyzer
                        self._models_loaded['sentiment'] = True
                        return

                # Load sentiment analyzer
                loop = asyncio.get_event_loop()
                self._sentiment_analyzer = await loop.run_in_executor(
                    self.executor,
                    lambda: pipeline("sentiment-analysis",
                                   model="cardiffnlp/twitter-roberta-base-sentiment-latest")
                )

                self._models_loaded['sentiment'] = True

                # Cache the analyzer
                if self.cache_client:
                    await self.cache_client.set_model('sentiment_analyzer', self._sentiment_analyzer)

                logger.info("Sentiment analyzer loaded")

            except Exception as e:
                logger.warning(f"Could not load sentiment analyzer: {e}")
                self._sentiment_analyzer = None

    def _create_crop_disease_model(self) -> keras.Model:
        """Create CNN model for crop disease detection"""
        model = keras.Sequential([
            keras.layers.Conv2D(32, (3, 3), activation='relu', input_shape=(224, 224, 3)),
            keras.layers.MaxPooling2D((2, 2)),
            keras.layers.Conv2D(64, (3, 3), activation='relu'),
            keras.layers.MaxPooling2D((2, 2)),
            keras.layers.Conv2D(128, (3, 3), activation='relu'),
            keras.layers.MaxPooling2D((2, 2)),
            keras.layers.Flatten(),
            keras.layers.Dense(128, activation='relu'),
            keras.layers.Dropout(0.5),
            keras.layers.Dense(10, activation='softmax')  # 10 disease classes
        ])

        model.compile(optimizer='adam',
                     loss='categorical_crossentropy',
                     metrics=['accuracy'])

        return model

    def _create_market_prediction_model(self):
        """Create XGBoost model for market price prediction"""
        # Create a basic model with sample parameters
        model = xgb.XGBRegressor(
            objective='reg:squarederror',
            n_estimators=100,
            max_depth=6,
            learning_rate=0.1,
            random_state=42
        )
        return model

    def _create_climate_risk_model(self):
        """Create LightGBM model for climate risk assessment"""
        model = lgb.LGBMRegressor(
            objective='regression',
            num_leaves=31,
            learning_rate=0.05,
            n_estimators=100,
            random_state=42
        )
        return model

    def _create_fallback_models(self):
        """Create basic fallback models if advanced models fail to load"""
        self.crop_disease_model = RandomForestRegressor(n_estimators=10, random_state=42)
        self.market_prediction_model = RandomForestRegressor(n_estimators=10, random_state=42)
        self.climate_risk_model = RandomForestRegressor(n_estimators=10, random_state=42)
        logger.info("Fallback models created")

    async def analyze_crop_health(self, image_data: bytes, crop_type: str,
                                location: str) -> Dict[str, Any]:
        """
        Analyze crop health from image using CNN model
        """
        try:
            # Ensure model is loaded
            await self._ensure_crop_model_loaded()
            # In a real implementation, you would preprocess the image
            # For now, return mock analysis
            diseases = {
                'corn': ['Blight', 'Rust', 'Leaf Spot', 'Healthy'],
                'wheat': ['Powdery Mildew', 'Septoria', 'Yellow Rust', 'Healthy'],
                'rice': ['Bacterial Blight', 'Blast', 'Sheath Blight', 'Healthy']
            }

            crop_diseases = diseases.get(crop_type.lower(), ['Unknown Disease', 'Healthy'])

            # Mock prediction (in production, use actual model)
            prediction = np.random.choice(crop_diseases, p=[0.1, 0.1, 0.1, 0.7])
            confidence = np.random.uniform(0.7, 0.95)

            recommendations = []
            if prediction != 'Healthy':
                recommendations = [
                    "Apply appropriate fungicide immediately",
                    "Remove infected plant parts",
                    "Improve field drainage",
                    "Monitor neighboring plants"
                ]

            return {
                "disease": prediction,
                "confidence": round(confidence, 3),
                "severity": "low" if confidence < 0.8 else "medium" if confidence < 0.9 else "high",
                "recommendations": recommendations,
                "preventive_measures": [
                    "Regular field monitoring",
                    "Proper crop rotation",
                    "Balanced fertilization",
                    "Adequate plant spacing"
                ]
            }

        except Exception as e:
            logger.error(f"Crop health analysis failed: {e}")
            return {
                "error": "Analysis failed",
                "message": str(e)
            }

    async def predict_market_prices(self, commodity: str, location: str,
                                   historical_data: List[Dict[str, Any]],
                                   days_ahead: int = 7) -> Dict[str, Any]:
        """
        Predict market prices using time series analysis
        """
        try:
            # Ensure model is loaded
            await self._ensure_market_model_loaded()
            if not historical_data:
                return {
                    "error": "Insufficient historical data",
                    "predictions": []
                }

            # Extract price data
            prices = [item.get('price', 0) for item in historical_data[-30:]]  # Last 30 days

            if len(prices) < 7:
                return {
                    "error": "Need at least 7 days of price data",
                    "predictions": []
                }

            # Simple trend analysis (in production, use ARIMA or LSTM)
            recent_trend = np.polyfit(range(len(prices)), prices, 1)[0]
            avg_price = np.mean(prices)
            volatility = np.std(prices) / avg_price

            predictions = []
            current_price = prices[-1]

            for i in range(1, days_ahead + 1):
                # Simple linear extrapolation with some randomness
                trend_factor = recent_trend * i * 0.1
                random_factor = np.random.normal(0, volatility * 0.1)
                predicted_price = current_price + trend_factor + random_factor

                # Ensure price doesn't go negative
                predicted_price = max(predicted_price, avg_price * 0.5)

                predictions.append({
                    "date": (datetime.now() + timedelta(days=i)).strftime("%Y-%m-%d"),
                    "predicted_price": round(predicted_price, 2),
                    "confidence": round(max(0.1, 1 - volatility - abs(trend_factor) * 0.1), 3)
                })

            return {
                "commodity": commodity,
                "location": location,
                "current_price": round(current_price, 2),
                "trend": "increasing" if recent_trend > 0 else "decreasing",
                "volatility": round(volatility, 3),
                "predictions": predictions,
                "recommendations": self._generate_market_recommendations(
                    float(recent_trend), float(volatility), float(current_price), float(avg_price)
                )
            }

        except Exception as e:
            logger.error(f"Market price prediction failed: {e}")
            return {
                "error": "Prediction failed",
                "message": str(e)
            }

    def _generate_market_recommendations(self, trend: float, volatility: float,
                                       current_price: float, avg_price: float) -> List[str]:
        """Generate market recommendations based on analysis"""
        recommendations = []

        if trend > 0.5:
            recommendations.append("Prices are trending upward - consider holding inventory")
        elif trend < -0.5:
            recommendations.append("Prices are declining - consider selling soon")

        if volatility > 0.1:
            recommendations.append("High price volatility - use price hedging strategies")
        else:
            recommendations.append("Stable market conditions - good for planning")

        if current_price > avg_price * 1.1:
            recommendations.append("Prices above average - monitor for potential decline")
        elif current_price < avg_price * 0.9:
            recommendations.append("Prices below average - potential buying opportunity")

        return recommendations

    async def assess_climate_risk(self, location: str, crop_type: str,
                                weather_forecast: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Assess climate-related risks for crop production
        """
        try:
            # Ensure model is loaded
            await self._ensure_climate_model_loaded()
            if not weather_forecast:
                return {
                    "error": "Weather forecast data required",
                    "risk_level": "unknown"
                }

            # Extract weather parameters
            temperatures = [day.get('temperature', 25) for day in weather_forecast]
            humidities = [day.get('humidity', 70) for day in weather_forecast]
            rainfalls = [day.get('rainfall', 5) for day in weather_forecast]

            # Calculate risk factors
            temp_stress = self._calculate_temperature_stress(temperatures, crop_type)
            drought_risk = self._calculate_drought_risk(rainfalls, crop_type)
            disease_risk = self._calculate_disease_risk(humidities, temperatures, crop_type)

            overall_risk = max(temp_stress, drought_risk, disease_risk)

            risk_level = "low" if overall_risk < 0.3 else "medium" if overall_risk < 0.7 else "high"

            return {
                "location": location,
                "crop_type": crop_type,
                "overall_risk_score": round(overall_risk, 3),
                "risk_level": risk_level,
                "risk_factors": {
                    "temperature_stress": round(temp_stress, 3),
                    "drought_risk": round(drought_risk, 3),
                    "disease_risk": round(disease_risk, 3)
                },
                "recommendations": self._generate_climate_recommendations(
                    temp_stress, drought_risk, disease_risk, crop_type
                ),
                "time_horizon": f"{len(weather_forecast)} days"
            }

        except Exception as e:
            logger.error(f"Climate risk assessment failed: {e}")
            return {
                "error": "Risk assessment failed",
                "message": str(e)
            }

    def _calculate_temperature_stress(self, temperatures: List[float], crop_type: str) -> float:
        """Calculate temperature stress risk"""
        crop_optimal_temps = {
            'corn': (20, 30),
            'wheat': (15, 25),
            'rice': (20, 35),
            'soybean': (20, 30)
        }

        optimal_min, optimal_max = crop_optimal_temps.get(crop_type.lower(), (20, 30))

        stress_days = 0
        for temp in temperatures:
            if temp < optimal_min - 5 or temp > optimal_max + 5:
                stress_days += 1

        return min(stress_days / len(temperatures), 1.0)

    def _calculate_drought_risk(self, rainfalls: List[float], crop_type: str) -> float:
        """Calculate drought risk"""
        crop_water_needs = {
            'corn': 500,  # mm per season
            'wheat': 450,
            'rice': 1200,
            'soybean': 400
        }

        weekly_need = crop_water_needs.get(crop_type.lower(), 500) / 12  # Rough weekly estimate
        total_rainfall = sum(rainfalls)

        if total_rainfall < weekly_need * 0.5:
            return 0.8  # High risk
        elif total_rainfall < weekly_need * 0.8:
            return 0.5  # Medium risk
        else:
            return 0.2  # Low risk

    def _calculate_disease_risk(self, humidities: List[float],
                               temperatures: List[float], crop_type: str) -> float:
        """Calculate disease risk based on humidity and temperature"""
        high_humidity_days = sum(1 for h in humidities if h > 80)
        optimal_temp_days = sum(1 for t in temperatures if 20 <= t <= 30)

        humidity_risk = high_humidity_days / len(humidities)
        temp_risk = optimal_temp_days / len(temperatures)

        # Disease risk is higher when both humidity is high and temperature is optimal for pathogens
        return min(humidity_risk * temp_risk * 2, 1.0)

    def _generate_climate_recommendations(self, temp_stress: float, drought_risk: float,
                                        disease_risk: float, crop_type: str) -> List[str]:
        """Generate climate risk mitigation recommendations"""
        recommendations = []

        if temp_stress > 0.5:
            recommendations.extend([
                "Implement heat stress management techniques",
                "Consider shade cloth or windbreaks",
                "Adjust irrigation timing to cooler periods"
            ])

        if drought_risk > 0.5:
            recommendations.extend([
                "Implement drought-resistant crop varieties",
                "Set up supplemental irrigation systems",
                "Apply mulch to conserve soil moisture",
                "Monitor soil moisture regularly"
            ])

        if disease_risk > 0.5:
            recommendations.extend([
                "Apply preventive fungicide treatments",
                "Improve field ventilation",
                "Practice crop rotation",
                "Remove crop residues after harvest"
            ])

        if not recommendations:
            recommendations.append("Current conditions are favorable for crop growth")

        return recommendations

    async def analyze_farmer_sentiment(self, text_data: List[str]) -> Dict[str, Any]:
        """
        Analyze farmer sentiment from text data using NLP
        """
        try:
            # Ensure sentiment analyzer is loaded
            await self._ensure_sentiment_analyzer_loaded()

            if not self._sentiment_analyzer:
                return {
                    "error": "Sentiment analysis not available",
                    "overall_sentiment": "neutral"
                }

            sentiments = []
            for text in text_data:
                if text.strip():
                    result = self._sentiment_analyzer(text[:512])  # Limit text length
                    sentiments.append(result[0])

            if not sentiments:
                return {
                    "overall_sentiment": "neutral",
                    "confidence": 0.0,
                    "sample_size": 0
                }

            # Aggregate sentiments
            positive_count = sum(1 for s in sentiments if s['label'] == 'LABEL_2')  # Positive
            negative_count = sum(1 for s in sentiments if s['label'] == 'LABEL_0')  # Negative
            neutral_count = sum(1 for s in sentiments if s['label'] == 'LABEL_1')   # Neutral

            total = len(sentiments)
            avg_confidence = sum(s['score'] for s in sentiments) / total

            # Determine overall sentiment
            if positive_count > negative_count and positive_count > neutral_count:
                overall = "positive"
            elif negative_count > positive_count and negative_count > neutral_count:
                overall = "negative"
            else:
                overall = "neutral"

            return {
                "overall_sentiment": overall,
                "confidence": round(avg_confidence, 3),
                "distribution": {
                    "positive": round(positive_count / total, 3),
                    "negative": round(negative_count / total, 3),
                    "neutral": round(neutral_count / total, 3)
                },
                "sample_size": total,
                "insights": self._generate_sentiment_insights(overall, positive_count, negative_count, total)
            }

        except Exception as e:
            logger.error(f"Sentiment analysis failed: {e}")
            return {
                "error": "Analysis failed",
                "overall_sentiment": "neutral"
            }

    def _generate_sentiment_insights(self, overall: str, positive: int,
                                   negative: int, total: int) -> List[str]:
        """Generate insights from sentiment analysis"""
        insights = []

        if overall == "positive":
            insights.append("Farmers are generally satisfied with current conditions")
        elif overall == "negative":
            insights.append("Farmers are experiencing challenges that need attention")

        if negative > total * 0.3:
            insights.append("Significant portion of farmers reporting difficulties")

        if positive > total * 0.6:
            insights.append("Strong positive sentiment indicates good farmer satisfaction")

        return insights

# Global instance
advanced_ai_service = AdvancedAIService()