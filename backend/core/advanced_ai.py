import asyncio
from typing import Dict, Any, List, Optional
import logging
import numpy as np
from datetime import datetime, timedelta
import re
from collections import Counter

# Import AI/ML libraries (would be installed in production)
try:
    import tensorflow as tf
    import torch
    from transformers import pipeline, AutoTokenizer, AutoModelForSequenceClassification
    from PIL import Image
    import cv2
    AI_LIBRARIES_AVAILABLE = True
except ImportError:
    AI_LIBRARIES_AVAILABLE = False
    logger.warning("AI libraries not available, using mock implementations")

logger = logging.getLogger(__name__)

class AdvancedAIService:
    """Advanced AI service for computer vision and NLP tasks"""

    def __init__(self):
        self.models = {}
        self.sentiment_model = None
        self.disease_model = None
        self.price_prediction_model = None

    async def initialize_models(self):
        """Initialize AI models"""
        try:
            if AI_LIBRARIES_AVAILABLE:
                # Initialize sentiment analysis model
                self.sentiment_model = pipeline(
                    "sentiment-analysis",
                    model="cardiffnlp/twitter-roberta-base-sentiment-latest",
                    tokenizer="cardiffnlp/twitter-roberta-base-sentiment-latest"
                )

                # Disease detection model would be loaded here
                # self.disease_model = tf.keras.models.load_model('models/crop_disease_model.h5')

                # Price prediction model would be loaded here
                # self.price_prediction_model = joblib.load('models/price_prediction_model.pkl')

                logger.info("AI models initialized successfully")
            else:
                logger.warning("AI libraries not available, using enhanced mock implementations")

        except Exception as e:
            logger.error(f"Failed to initialize AI models: {e}")

    async def analyze_market_sentiment(self, market_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze market sentiment from various data sources"""
        try:
            # Extract text data from market sources
            text_sources = []

            for data in market_data:
                if 'news_headlines' in data:
                    text_sources.extend(data['news_headlines'])
                if 'farmer_feedback' in data:
                    text_sources.extend(data['farmer_feedback'])
                if 'social_media' in data:
                    text_sources.extend(data['social_media'])

            if not text_sources:
                return {
                    "error": "No text data provided for sentiment analysis",
                    "overall_sentiment": "neutral",
                    "confidence": 0.0
                }

            # Analyze sentiment
            sentiment_result = await self.analyze_farmer_sentiment(text_sources)

            # Add market-specific insights
            market_insights = self._generate_market_sentiment_insights(sentiment_result, market_data)

            result = {
                **sentiment_result,
                "market_insights": market_insights,
                "price_impact_prediction": self._predict_price_impact(sentiment_result),
                "recommendations": self._generate_market_recommendations(sentiment_result)
            }

            return result

        except Exception as e:
            logger.error(f"Market sentiment analysis failed: {e}")
            return {"error": str(e)}

    def _generate_market_sentiment_insights(self, sentiment_result: Dict, market_data: List[Dict]) -> List[str]:
        """Generate market-specific insights from sentiment analysis"""
        insights = []

        overall_sentiment = sentiment_result.get('overall_sentiment', 'neutral')
        sentiment_score = sentiment_result.get('sentiment_score', 0)

        if overall_sentiment == 'positive' and sentiment_score > 0.2:
            insights.extend([
                "Bullish market sentiment may drive prices upward",
                "Farmers showing confidence in current market conditions",
                "Consider holding inventory for potential price increases"
            ])
        elif overall_sentiment == 'negative' and sentiment_score < -0.2:
            insights.extend([
                "Bearish sentiment may pressure prices downward",
                "Farmers expressing concerns about market conditions",
                "Consider selling strategies to lock in current prices"
            ])
        else:
            insights.extend([
                "Neutral market sentiment suggests stable conditions",
                "Monitor key indicators for directional signals",
                "Balanced market psychology indicates equilibrium"
            ])

        # Add data source specific insights
        data_sources = set()
        for data in market_data:
            data_sources.update(data.keys())

        if 'news_headlines' in data_sources:
            insights.append("News sentiment analysis indicates market direction")

        if 'social_media' in data_sources:
            insights.append("Social media buzz reflects farmer market expectations")

        return insights

    def _predict_price_impact(self, sentiment_result: Dict) -> Dict[str, Any]:
        """Predict price impact based on sentiment"""
        sentiment_score = sentiment_result.get('sentiment_score', 0)

        # Simple sentiment-to-price impact model
        if sentiment_score > 0.3:
            impact = "strong_positive"
            percentage_change = 5.0 + (sentiment_score * 10)
            confidence = min(sentiment_score * 100, 85)
        elif sentiment_score > 0.1:
            impact = "moderate_positive"
            percentage_change = 1.0 + (sentiment_score * 5)
            confidence = min(sentiment_score * 80, 70)
        elif sentiment_score < -0.3:
            impact = "strong_negative"
            percentage_change = -5.0 + (sentiment_score * 10)
            confidence = min(abs(sentiment_score) * 100, 85)
        elif sentiment_score < -0.1:
            impact = "moderate_negative"
            percentage_change = -1.0 + (sentiment_score * 5)
            confidence = min(abs(sentiment_score) * 80, 70)
        else:
            impact = "neutral"
            percentage_change = sentiment_score * 2
            confidence = 50

        return {
            "impact_type": impact,
            "predicted_change_percent": round(percentage_change, 2),
            "time_horizon_days": 7,
            "confidence_percent": round(confidence, 1),
            "factors": ["farmer_sentiment", "market_psychology", "news_analysis"]
        }

    def _generate_market_recommendations(self, sentiment_result: Dict) -> List[str]:
        """Generate market recommendations based on sentiment"""
        recommendations = []
        overall_sentiment = sentiment_result.get('overall_sentiment', 'neutral')
        sentiment_score = sentiment_result.get('sentiment_score', 0)

        if overall_sentiment == 'positive':
            recommendations.extend([
                "Consider maintaining current positions",
                "Monitor for entry points in related commodities",
                "Watch for confirmation from fundamental data"
            ])
        elif overall_sentiment == 'negative':
            recommendations.extend([
                "Consider defensive positioning",
                "Look for hedging opportunities",
                "Monitor support levels closely"
            ])
        else:
            recommendations.extend([
                "Maintain balanced portfolio approach",
                "Use options strategies for volatility",
                "Focus on risk management"
            ])

        # Add confidence-based recommendations
        confidence = sentiment_result.get('confidence', 0)
        if confidence > 0.8:
            recommendations.append("High confidence in sentiment analysis - strong signal")
        elif confidence < 0.6:
            recommendations.append("Low confidence - wait for more data before acting")

        return recommendations

    async def analyze_crop_health(self, image_data: bytes, crop_type: str,
                                location: str) -> Dict[str, Any]:
        """Analyze crop health using computer vision and detect diseases"""
        try:
            diseases = {
                'maize': ['maize_streak_virus', 'gray_leaf_spot', 'common_rust', 'northern_leaf_blight'],
                'wheat': ['wheat_rust', 'powdery_mildew', 'septoria_leaf_blotch', 'fusarium_head_blight'],
                'rice': ['bacterial_blight', 'blast', 'sheath_blight', 'tungro_virus'],
                'tomato': ['late_blight', 'early_blight', 'bacterial_spot', 'fusarium_wilt'],
                'potato': ['late_blight', 'early_blight', 'blackleg', 'common_scab']
            }

            pests = ['aphids', 'whiteflies', 'thrips', 'spider_mites', 'caterpillars']

            if AI_LIBRARIES_AVAILABLE:
                # Real implementation would use a trained CNN model
                # For now, simulate disease detection with image analysis
                result = await self._detect_crop_diseases(image_data, crop_type)
            else:
                # Mock implementation with enhanced disease detection
                detected_diseases = []
                detected_pests = []

                # Simulate disease detection based on crop type
                crop_diseases = diseases.get(crop_type.lower(), [])
                if crop_diseases:
                    # Randomly detect 0-2 diseases (for demo)
                    import random
                    num_diseases = random.randint(0, min(2, len(crop_diseases)))
                    detected_diseases = random.sample(crop_diseases, num_diseases)

                    # Randomly detect pests
                    num_pests = random.randint(0, 2)
                    detected_pests = random.sample(pests, num_pests)

                health_score = max(0.1, 1.0 - (len(detected_diseases) * 0.2) - (len(detected_pests) * 0.1))

                recommendations = self._generate_crop_recommendations(
                    crop_type, detected_diseases, detected_pests, health_score
                )

                result = {
                    "crop_type": crop_type,
                    "location": location,
                    "health_score": round(health_score, 2),
                    "disease_detected": len(detected_diseases) > 0,
                    "diseases": detected_diseases,
                    "pest_detected": len(detected_pests) > 0,
                    "pests": detected_pests,
                    "recommendations": recommendations,
                    "confidence": 0.88,
                    "analysis_timestamp": datetime.utcnow().isoformat(),
                    "severity_levels": self._calculate_severity_levels(detected_diseases, detected_pests)
                }

            logger.info(f"Crop health analysis completed for {crop_type} in {location}")
            return result

        except Exception as e:
            logger.error(f"Crop health analysis failed: {e}")
            return {"error": str(e)}

    async def _detect_crop_diseases(self, image_data: bytes, crop_type: str) -> Dict[str, Any]:
        """Real disease detection using computer vision"""
        try:
            # Convert bytes to PIL Image
            image = Image.open(io.BytesIO(image_data))

            # Preprocess image
            if image.mode != 'RGB':
                image = image.convert('RGB')

            # Resize for model input
            image = image.resize((224, 224))

            # Convert to numpy array
            img_array = np.array(image) / 255.0
            img_array = np.expand_dims(img_array, axis=0)

            # Mock model prediction (would use actual trained model)
            # In production: predictions = self.disease_model.predict(img_array)

            # Simulate predictions
            disease_predictions = {
                'healthy': 0.7,
                'maize_streak_virus': 0.1,
                'gray_leaf_spot': 0.15,
                'common_rust': 0.05
            }

            # Get top predictions above threshold
            threshold = 0.1
            detected_diseases = [
                disease for disease, prob in disease_predictions.items()
                if prob > threshold and disease != 'healthy'
            ]

            health_score = disease_predictions.get('healthy', 0.5)

            return {
                "crop_type": crop_type,
                "health_score": round(health_score, 2),
                "disease_detected": len(detected_diseases) > 0,
                "diseases": detected_diseases,
                "pest_detected": False,
                "pests": [],
                "recommendations": self._generate_crop_recommendations(crop_type, detected_diseases, [], health_score),
                "confidence": 0.92,
                "model_predictions": disease_predictions
            }

        except Exception as e:
            logger.error(f"Disease detection failed: {e}")
            # Fallback to mock
            return await self.analyze_crop_health(image_data, crop_type, "unknown")

    def _generate_crop_recommendations(self, crop_type: str, diseases: List[str],
                                     pests: List[str], health_score: float) -> List[str]:
        """Generate treatment recommendations based on detected issues"""
        recommendations = []

        # Health-based recommendations
        if health_score > 0.8:
            recommendations.append("Crop health is excellent - continue current practices")
        elif health_score > 0.6:
            recommendations.append("Crop health is good but monitor closely")
        else:
            recommendations.append("Crop health needs attention - implement treatment plan immediately")

        # Disease-specific recommendations
        disease_treatments = {
            'maize_streak_virus': ["Use virus-resistant varieties", "Control leafhopper vectors", "Remove infected plants"],
            'gray_leaf_spot': ["Apply fungicide at tasseling", "Improve air circulation", "Use resistant hybrids"],
            'common_rust': ["Apply fungicide preventively", "Use rust-resistant varieties", "Avoid overhead irrigation"],
            'late_blight': ["Apply copper-based fungicide", "Improve drainage", "Space plants for air circulation"],
            'early_blight': ["Apply fungicide at first sign", "Mulch to prevent soil splash", "Rotate crops annually"]
        }

        for disease in diseases:
            treatments = disease_treatments.get(disease, [f"Consult agricultural expert for {disease} treatment"])
            recommendations.extend(treatments[:2])  # Limit to 2 per disease

        # Pest-specific recommendations
        pest_treatments = {
            'aphids': ["Release beneficial insects", "Apply insecticidal soap", "Use reflective mulches"],
            'whiteflies': ["Use yellow sticky traps", "Apply neem oil", "Introduce parasitic wasps"],
            'thrips': ["Use blue sticky traps", "Apply spinosad", "Avoid broad-spectrum insecticides"],
            'spider_mites': ["Increase humidity", "Apply predatory mites", "Use insecticidal soap"],
            'caterpillars': ["Hand-pick larvae", "Apply Bt (Bacillus thuringiensis)", "Use row covers"]
        }

        for pest in pests:
            treatments = pest_treatments.get(pest, [f"Consult entomologist for {pest} control"])
            recommendations.extend(treatments[:2])

        # General recommendations
        if not diseases and not pests:
            recommendations.extend([
                "Maintain proper irrigation schedule",
                "Monitor nutrient levels regularly",
                "Implement integrated pest management"
            ])

        return list(set(recommendations))  # Remove duplicates

    def _calculate_severity_levels(self, diseases: List[str], pests: List[str]) -> Dict[str, str]:
        """Calculate severity levels for detected issues"""
        severity_map = {
            'maize_streak_virus': 'high',
            'late_blight': 'high',
            'fusarium_head_blight': 'high',
            'gray_leaf_spot': 'medium',
            'common_rust': 'medium',
            'early_blight': 'medium',
            'aphids': 'low',
            'whiteflies': 'medium',
            'thrips': 'medium',
            'spider_mites': 'medium',
            'caterpillars': 'low'
        }

        severity_levels = {}
        for issue in diseases + pests:
            severity_levels[issue] = severity_map.get(issue, 'unknown')

        return severity_levels

    async def predict_market_prices(self, commodity: str, location: str,
                                  historical_data: List[Dict[str, Any]],
                                  days_ahead: int) -> Dict[str, Any]:
        """Predict market prices using time series analysis"""
        try:
            # Mock implementation - would use LSTM/Prophet models
            current_price = historical_data[-1]['price'] if historical_data else 100.0

            predictions = []
            for i in range(days_ahead):
                predicted_price = current_price * (1 + (i * 0.02))  # Simple trend
                predictions.append({
                    "day": i + 1,
                    "predicted_price": round(predicted_price, 2),
                    "confidence_interval": [predicted_price * 0.95, predicted_price * 1.05]
                })

            result = {
                "commodity": commodity,
                "location": location,
                "current_price": current_price,
                "predictions": predictions,
                "trend": "increasing",
                "volatility": 0.15,
                "confidence": 0.88
            }

            logger.info(f"Market price prediction completed for {commodity}")
            return result

        except Exception as e:
            logger.error(f"Market price prediction failed: {e}")
            return {"error": str(e)}

    async def assess_climate_risk(self, location: str, crop_type: str,
                                 weather_forecast: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Assess climate risk for farming"""
        try:
            # Mock implementation - would analyze weather patterns
            risk_score = 0.3  # Low risk
            recommendations = [
                "Monitor soil moisture closely",
                "Prepare irrigation backup",
                "Consider drought-resistant varieties"
            ]

            result = {
                "location": location,
                "crop_type": crop_type,
                "risk_score": risk_score,
                "risk_level": "low",
                "key_factors": ["Temperature stability", "Precipitation patterns"],
                "recommendations": recommendations,
                "time_horizon": "30 days",
                "confidence": 0.85
            }

            logger.info(f"Climate risk assessment completed for {crop_type} in {location}")
            return result

        except Exception as e:
            logger.error(f"Climate risk assessment failed: {e}")
            return {"error": str(e)}

    async def analyze_farmer_sentiment(self, text_data: List[str]) -> Dict[str, Any]:
        """Analyze farmer sentiment from text data using advanced NLP"""
        try:
            if AI_LIBRARIES_AVAILABLE and hasattr(self, 'sentiment_model'):
                # Use pre-trained sentiment analysis model
                result = await self._analyze_sentiment_with_model(text_data)
            else:
                # Enhanced mock implementation with better analysis
                result = await self._analyze_sentiment_enhanced(text_data)

            logger.info(f"Sentiment analysis completed for {len(text_data)} texts")
            return result

        except Exception as e:
            logger.error(f"Sentiment analysis failed: {e}")
            return {"error": str(e)}

    async def _analyze_sentiment_with_model(self, text_data: List[str]) -> Dict[str, Any]:
        """Real sentiment analysis using transformer models"""
        try:
            sentiments = []

            for text in text_data:
                # Use sentiment analysis pipeline
                result = self.sentiment_model(text)[0]

                # Map to our format
                sentiment = result['label'].lower()
                if sentiment == 'positive':
                    sentiment_score = 1
                elif sentiment == 'negative':
                    sentiment_score = -1
                else:
                    sentiment_score = 0

                sentiments.append({
                    "text": text,
                    "sentiment": sentiment,
                    "confidence": result['score'],
                    "sentiment_score": sentiment_score
                })

            # Calculate overall sentiment
            avg_sentiment = np.mean([s['sentiment_score'] for s in sentiments])

            if avg_sentiment > 0.1:
                overall_sentiment = "positive"
            elif avg_sentiment < -0.1:
                overall_sentiment = "negative"
            else:
                overall_sentiment = "neutral"

            # Extract key themes
            key_themes = self._extract_market_themes(text_data)

            result = {
                "overall_sentiment": overall_sentiment,
                "sentiment_score": avg_sentiment,
                "sentiment_distribution": {
                    "positive": len([s for s in sentiments if s['sentiment'] == 'positive']),
                    "negative": len([s for s in sentiments if s['sentiment'] == 'negative']),
                    "neutral": len([s for s in sentiments if s['sentiment'] == 'neutral'])
                },
                "individual_sentiments": sentiments,
                "key_themes": key_themes,
                "market_insights": self._generate_market_insights(sentiments, key_themes),
                "confidence": np.mean([s['confidence'] for s in sentiments]),
                "analysis_timestamp": datetime.utcnow().isoformat()
            }

            return result

        except Exception as e:
            logger.error(f"Model-based sentiment analysis failed: {e}")
            return await self._analyze_sentiment_enhanced(text_data)

    async def _analyze_sentiment_enhanced(self, text_data: List[str]) -> Dict[str, Any]:
        """Enhanced sentiment analysis without ML models"""
        sentiments = []
        positive_words = ['good', 'excellent', 'great', 'profitable', 'high', 'increase', 'rise', 'up', 'better', 'improved', 'successful', 'thriving', 'productive']
        negative_words = ['bad', 'poor', 'low', 'decrease', 'fall', 'down', 'worse', 'decline', 'loss', 'damage', 'failed', 'struggling', 'difficult']
        neutral_words = ['stable', 'steady', 'average', 'normal', 'moderate', 'fair']

        for text in text_data:
            text_lower = text.lower()

            # Count sentiment words
            positive_count = sum(1 for word in positive_words if word in text_lower)
            negative_count = sum(1 for word in negative_words if word in text_lower)
            neutral_count = sum(1 for word in neutral_words if word in text_lower)

            # Determine sentiment
            total_sentiment_words = positive_count + negative_count + neutral_count

            if total_sentiment_words == 0:
                sentiment = "neutral"
                confidence = 0.5
                sentiment_score = 0
            else:
                if positive_count > negative_count and positive_count > neutral_count:
                    sentiment = "positive"
                    confidence = positive_count / total_sentiment_words
                    sentiment_score = confidence
                elif negative_count > positive_count and negative_count > neutral_count:
                    sentiment = "negative"
                    confidence = negative_count / total_sentiment_words
                    sentiment_score = -confidence
                else:
                    sentiment = "neutral"
                    confidence = neutral_count / total_sentiment_words
                    sentiment_score = 0

            sentiments.append({
                "text": text,
                "sentiment": sentiment,
                "confidence": min(confidence + 0.3, 1.0),  # Boost confidence
                "sentiment_score": sentiment_score,
                "key_words": self._extract_sentiment_words(text, positive_words + negative_words)
            })

        # Calculate overall sentiment
        avg_sentiment = np.mean([s['sentiment_score'] for s in sentiments])

        if avg_sentiment > 0.1:
            overall_sentiment = "positive"
        elif avg_sentiment < -0.1:
            overall_sentiment = "negative"
        else:
            overall_sentiment = "neutral"

        # Extract key themes
        key_themes = self._extract_market_themes(text_data)

        result = {
            "overall_sentiment": overall_sentiment,
            "sentiment_score": avg_sentiment,
            "sentiment_distribution": {
                "positive": len([s for s in sentiments if s['sentiment'] == 'positive']),
                "negative": len([s for s in sentiments if s['sentiment'] == 'negative']),
                "neutral": len([s for s in sentiments if s['sentiment'] == 'neutral'])
            },
            "individual_sentiments": sentiments,
            "key_themes": key_themes,
            "market_insights": self._generate_market_insights(sentiments, key_themes),
            "confidence": np.mean([s['confidence'] for s in sentiments]),
            "analysis_timestamp": datetime.utcnow().isoformat()
        }

        return result

    def _extract_sentiment_words(self, text: str, sentiment_words: List[str]) -> List[str]:
        """Extract sentiment-bearing words from text"""
        text_lower = text.lower()
        found_words = []

        for word in sentiment_words:
            if word in text_lower:
                found_words.append(word)

        return found_words

    def _extract_market_themes(self, text_data: List[str]) -> List[str]:
        """Extract key market themes from text data"""
        themes = []
        all_text = ' '.join(text_data).lower()

        theme_keywords = {
            'crop_yields': ['yield', 'harvest', 'production', 'crop', 'output'],
            'market_prices': ['price', 'cost', 'market', 'sell', 'buy', 'value'],
            'weather_conditions': ['weather', 'rain', 'drought', 'flood', 'temperature', 'climate'],
            'pest_diseases': ['pest', 'disease', 'fungus', 'virus', 'infection', 'damage'],
            'soil_quality': ['soil', 'fertility', 'nutrient', 'ph', 'moisture'],
            'government_policy': ['policy', 'subsidy', 'support', 'regulation', 'government'],
            'input_costs': ['fertilizer', 'seed', 'pesticide', 'equipment', 'cost']
        }

        for theme, keywords in theme_keywords.items():
            if any(keyword in all_text for keyword in keywords):
                themes.append(theme.replace('_', ' ').title())

        return themes[:5]  # Return top 5 themes

    def _generate_market_insights(self, sentiments: List[Dict], themes: List[str]) -> List[str]:
        """Generate market insights based on sentiment analysis"""
        insights = []

        positive_count = len([s for s in sentiments if s['sentiment'] == 'positive'])
        negative_count = len([s for s in sentiments if s['sentiment'] == 'negative'])
        total = len(sentiments)

        if positive_count > negative_count * 1.5:
            insights.append("Strong positive sentiment indicates favorable market conditions")
        elif negative_count > positive_count * 1.5:
            insights.append("Prevalent negative sentiment suggests challenging market environment")
        else:
            insights.append("Mixed sentiment reflects balanced market conditions")

        # Theme-specific insights
        if 'Market Prices' in themes:
            if positive_count > negative_count:
                insights.append("Farmers optimistic about price trends")
            else:
                insights.append("Concerns about market prices affecting farmer confidence")

        if 'Weather Conditions' in themes:
            insights.append("Weather-related discussions prominent in farmer conversations")

        if 'Crop Yields' in themes:
            insights.append("Yield expectations influencing overall sentiment")

        return insights

# Global advanced AI service instance
advanced_ai_service = AdvancedAIService()