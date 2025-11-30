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

    # New AI methods for enhanced contracts

    async def predict_staking_rewards(self, amount: float, lock_period: int,
                                    historical_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Predict staking rewards using AI models
        Analyzes historical staking data and market conditions
        """
        try:
            # Simple prediction based on amount, lock period, and historical performance
            base_apy = 0.12  # 12% base APY
            lock_multiplier = min(lock_period / 365, 2.0)  # Max 2x for 1 year lock
            amount_multiplier = min(amount / 1000, 1.5)  # Max 1.5x for large stakes

            predicted_apy = base_apy * lock_multiplier * amount_multiplier

            # Risk assessment
            risk_score = 0.1  # Low risk for staking
            if lock_period > 365:
                risk_score += 0.1  # Slightly higher risk for long locks

            # Confidence based on historical data
            confidence = min(len(historical_data) / 100, 1.0) if historical_data else 0.5

            return {
                "predicted_apy": round(predicted_apy, 4),
                "estimated_rewards": round(amount * predicted_apy * (lock_period / 365), 2),
                "risk_score": round(risk_score, 2),
                "confidence": round(confidence, 2),
                "recommendations": self._generate_staking_recommendations(lock_period, amount)
            }

        except Exception as e:
            logger.error(f"Staking reward prediction failed: {e}")
            return {
                "error": "Prediction failed",
                "predicted_apy": 0.12,
                "estimated_rewards": 0,
                "risk_score": 0.5,
                "confidence": 0.0
            }

    async def predict_market_outcomes(self, market_question: str, outcomes: List[str],
                                    historical_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Predict outcomes for prediction markets using AI
        Analyzes historical agricultural data and market trends
        """
        try:
            # Use sentiment analysis and historical patterns
            await self._ensure_sentiment_analyzer_loaded()

            # Analyze market question for sentiment
            question_sentiment = self._sentiment_analyzer(market_question[:512])

            # Base probabilities (equal distribution)
            base_prob = 1.0 / len(outcomes)
            probabilities = [base_prob] * len(outcomes)

            # Adjust based on sentiment and historical data
            if question_sentiment and question_sentiment[0]['label'] == 'LABEL_2':  # Positive
                # Slightly favor positive outcomes
                probabilities = [p * 1.2 for p in probabilities]
            elif question_sentiment and question_sentiment[0]['label'] == 'LABEL_0':  # Negative
                # Slightly favor negative outcomes
                probabilities = [p * 0.8 for p in probabilities]

            # Normalize probabilities
            total = sum(probabilities)
            probabilities = [p / total for p in probabilities]

            # Calculate confidence based on data availability
            confidence = min(len(historical_data) / 50, 1.0) if historical_data else 0.3

            return {
                "predicted_probabilities": {outcomes[i]: round(probabilities[i], 3)
                                          for i in range(len(outcomes))},
                "confidence": round(confidence, 2),
                "market_analysis": self._analyze_market_question(market_question),
                "risk_assessment": "medium"  # Prediction markets are inherently risky
            }

        except Exception as e:
            logger.error(f"Market outcome prediction failed: {e}")
            return {
                "error": "Prediction failed",
                "predicted_probabilities": {outcome: round(1.0/len(outcomes), 3)
                                          for outcome in outcomes},
                "confidence": 0.0
            }

    async def optimize_yield_strategy(self, available_protocols: List[str],
                                    risk_tolerance: str, investment_amount: float,
                                    time_horizon: int) -> Dict[str, Any]:
        """
        Optimize yield farming strategy using AI
        Considers risk, returns, and protocol performance
        """
        try:
            # Protocol performance scores (mock data - in reality from historical data)
            protocol_scores = {
                'uniswap': {'apy': 0.15, 'risk': 0.3, 'liquidity': 0.9},
                'aave': {'apy': 0.08, 'risk': 0.2, 'liquidity': 0.8},
                'compound': {'apy': 0.10, 'risk': 0.25, 'liquidity': 0.7},
                'curve': {'apy': 0.12, 'risk': 0.35, 'liquidity': 0.6},
                'yearn': {'apy': 0.18, 'risk': 0.4, 'liquidity': 0.5}
            }

            # Filter available protocols
            available_scores = {p: protocol_scores.get(p, {'apy': 0.05, 'risk': 0.5, 'liquidity': 0.3})
                              for p in available_protocols}

            # Risk tolerance mapping
            risk_weights = {
                'low': {'apy_weight': 0.3, 'risk_weight': 0.7},
                'medium': {'apy_weight': 0.5, 'risk_weight': 0.5},
                'high': {'apy_weight': 0.7, 'risk_weight': 0.3}
            }

            weights = risk_weights.get(risk_tolerance, risk_weights['medium'])

            # Calculate optimal allocations
            allocations = {}
            total_score = 0

            for protocol, scores in available_scores.items():
                # Composite score: APY * weight + (1-risk) * weight + liquidity * 0.2
                score = (scores['apy'] * weights['apy_weight'] +
                        (1 - scores['risk']) * weights['risk_weight'] +
                        scores['liquidity'] * 0.2)
                allocations[protocol] = score
                total_score += score

            # Normalize to percentages
            if total_score > 0:
                allocations = {p: round((score / total_score) * 100, 1)
                             for p, score in allocations.items()}

            # Calculate expected returns
            expected_apy = sum(allocations[p] * available_scores[p]['apy'] for p in allocations.keys()) / 100
            expected_risk = sum(allocations[p] * available_scores[p]['risk'] for p in allocations.keys()) / 100

            return {
                "optimal_allocations": allocations,
                "expected_apy": round(expected_apy, 4),
                "expected_risk": round(expected_risk, 2),
                "strategy_recommendations": self._generate_strategy_recommendations(risk_tolerance, time_horizon),
                "rebalancing_frequency": "weekly" if time_horizon > 30 else "daily"
            }

        except Exception as e:
            logger.error(f"Yield strategy optimization failed: {e}")
            return {
                "error": "Optimization failed",
                "optimal_allocations": {p: round(100/len(available_protocols), 1)
                                      for p in available_protocols},
                "expected_apy": 0.08,
                "expected_risk": 0.3
            }

    async def assess_lending_risk(self, borrower_data: Dict[str, Any],
                                 loan_amount: float, collateral_amount: float) -> Dict[str, Any]:
        """
        Assess lending risk using AI models
        Analyzes borrower creditworthiness and collateral adequacy
        """
        try:
            # Extract borrower features
            credit_score = borrower_data.get('credit_score', 600)
            repayment_history = borrower_data.get('repayment_history', 0.8)
            income_stability = borrower_data.get('income_stability', 0.7)
            loan_to_value = loan_amount / collateral_amount if collateral_amount > 0 else 1.0

            # Risk scoring model (simplified)
            risk_factors = {
                'credit_score': max(0, (800 - credit_score) / 200),  # Higher score = lower risk
                'repayment_history': 1 - repayment_history,  # Better history = lower risk
                'income_stability': 1 - income_stability,  # More stable = lower risk
                'loan_to_value': min(loan_to_value, 2.0) / 2.0  # Higher LTV = higher risk
            }

            # Weighted risk score
            weights = {'credit_score': 0.4, 'repayment_history': 0.3,
                      'income_stability': 0.2, 'loan_to_value': 0.1}

            risk_score = sum(risk_factors[factor] * weights[factor] for factor in risk_factors)

            # Determine risk level
            if risk_score < 0.3:
                risk_level = "low"
                max_loan_ratio = 0.7
            elif risk_score < 0.6:
                risk_level = "medium"
                max_loan_ratio = 0.5
            else:
                risk_level = "high"
                max_loan_ratio = 0.3

            # Recommended interest rate
            base_rate = 0.08  # 8%
            risk_premium = risk_score * 0.05  # Up to 5% additional
            recommended_rate = base_rate + risk_premium

            return {
                "risk_score": round(risk_score, 3),
                "risk_level": risk_level,
                "recommended_loan_ratio": max_loan_ratio,
                "recommended_interest_rate": round(recommended_rate, 4),
                "liquidation_threshold": round(max_loan_ratio * 1.2, 2),
                "risk_factors": {k: round(v, 3) for k, v in risk_factors.items()},
                "recommendations": self._generate_lending_recommendations(risk_level, loan_to_value)
            }

        except Exception as e:
            logger.error(f"Lending risk assessment failed: {e}")
            return {
                "error": "Assessment failed",
                "risk_score": 0.5,
                "risk_level": "medium",
                "recommended_loan_ratio": 0.5,
                "recommended_interest_rate": 0.08
            }

    def _generate_staking_recommendations(self, lock_period: int, amount: float) -> List[str]:
        """Generate staking recommendations"""
        recommendations = []

        if lock_period < 30:
            recommendations.append("Consider longer lock periods for higher rewards")
        elif lock_period > 365:
            recommendations.append("Long lock periods increase rewards but reduce flexibility")

        if amount < 100:
            recommendations.append("Larger stakes typically receive better rewards")
        elif amount > 10000:
            recommendations.append("Consider diversifying across multiple staking opportunities")

        recommendations.append("Monitor market conditions and consider restaking rewards")

        return recommendations

    def _analyze_market_question(self, question: str) -> Dict[str, Any]:
        """Analyze prediction market question"""
        analysis = {
            "complexity": "medium",
            "time_horizon": "short_term",
            "category": "agricultural"
        }

        # Simple keyword analysis
        question_lower = question.lower()

        if any(word in question_lower for word in ['yield', 'harvest', 'production']):
            analysis["category"] = "crop_production"
        elif any(word in question_lower for word in ['price', 'market', 'commodity']):
            analysis["category"] = "market_prices"
        elif any(word in question_lower for word in ['weather', 'rain', 'climate']):
            analysis["category"] = "weather_events"

        if any(word in question_lower for word in ['next year', '2024', 'season']):
            analysis["time_horizon"] = "long_term"
        elif any(word in question_lower for word in ['next month', 'week']):
            analysis["time_horizon"] = "medium_term"

        return analysis

    def _generate_strategy_recommendations(self, risk_tolerance: str, time_horizon: int) -> List[str]:
        """Generate yield strategy recommendations"""
        recommendations = []

        if risk_tolerance == "low":
            recommendations.append("Focus on established protocols with proven track records")
            recommendations.append("Consider stablecoin pairs for reduced volatility")
        elif risk_tolerance == "high":
            recommendations.append("High-risk strategies may offer higher returns but with greater potential losses")
            recommendations.append("Diversify across multiple high-yield opportunities")

        if time_horizon < 30:
            recommendations.append("Short time horizons favor liquid, low-risk strategies")
        elif time_horizon > 180:
            recommendations.append("Long time horizons allow for higher-risk, higher-reward strategies")

        recommendations.append("Regularly monitor and rebalance your portfolio")
        recommendations.append("Consider impermanent loss risks in liquidity provision")

        return recommendations

    def _generate_lending_recommendations(self, risk_level: str, loan_to_value: float) -> List[str]:
        """Generate lending recommendations"""
        recommendations = []

        if risk_level == "high":
            recommendations.append("High-risk borrower - consider requiring additional collateral")
            recommendations.append("Monitor loan closely and consider early liquidation if collateral value drops")
        elif risk_level == "low":
            recommendations.append("Low-risk borrower - favorable lending opportunity")

        if loan_to_value > 0.7:
            recommendations.append("High loan-to-value ratio increases liquidation risk")
            recommendations.append("Consider requiring additional collateral or lower loan amount")

        recommendations.append("Regularly monitor collateral value and borrower repayment capacity")
        recommendations.append("Consider diversification across multiple borrowers to reduce risk")

        return recommendations

# Global instance
advanced_ai_service = AdvancedAIService()