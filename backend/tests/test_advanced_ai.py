import pytest
from unittest.mock import Mock, patch, AsyncMock
from fastapi.testclient import TestClient
from app.main import app
from app.core.advanced_ai import AdvancedAIService, advanced_ai_service
from app.database.models import User
from app.core.security import get_password_hash
import io


class TestAdvancedAIService:
    """Test advanced AI service functionality"""

    @pytest.fixture
    def ai_service(self):
        """Create AI service instance"""
        return AdvancedAIService()

    async def test_analyze_crop_health_mock(self, ai_service):
        """Test crop health analysis with mock data"""
        # Create mock image data
        image_data = b'mock_image_data'

        result = await ai_service.analyze_crop_health(image_data, 'maize', 'Nairobi')

        assert 'crop_type' in result
        assert 'health_score' in result
        assert 'recommendations' in result
        assert 'diseases' in result
        assert 'pests' in result
        assert result['crop_type'] == 'maize'
        assert result['location'] == 'Nairobi'
        assert 0 <= result['health_score'] <= 1

    async def test_analyze_crop_health_disease_detection(self, ai_service):
        """Test disease detection in crop analysis"""
        image_data = b'mock_image_data'

        result = await ai_service.analyze_crop_health(image_data, 'maize', 'Nairobi')

        # Check that disease detection fields are present
        assert 'disease_detected' in result
        assert 'diseases' in result
        assert 'pest_detected' in result
        assert 'pests' in result
        assert 'severity_levels' in result

        # Check recommendations are generated
        assert isinstance(result['recommendations'], list)
        assert len(result['recommendations']) > 0

    async def test_generate_crop_recommendations(self, ai_service):
        """Test crop recommendation generation"""
        diseases = ['late_blight', 'early_blight']
        pests = ['aphids', 'whiteflies']
        health_score = 0.6

        recommendations = ai_service._generate_crop_recommendations(
            'potato', diseases, pests, health_score
        )

        assert isinstance(recommendations, list)
        assert len(recommendations) > 0

        # Check that disease-specific recommendations are included
        recommendation_text = ' '.join(recommendations).lower()
        assert 'fungicide' in recommendation_text or 'copper' in recommendation_text

    async def test_analyze_market_sentiment(self, ai_service):
        """Test market sentiment analysis"""
        market_data = [
            {
                'news_headlines': [
                    'Crop prices expected to rise due to good harvest',
                    'Farmers optimistic about market conditions'
                ],
                'farmer_feedback': [
                    'Good yields this season',
                    'Prices are fair'
                ]
            }
        ]

        result = await ai_service.analyze_market_sentiment(market_data)

        assert 'overall_sentiment' in result
        assert 'sentiment_score' in result
        assert 'market_insights' in result
        assert 'price_impact_prediction' in result
        assert 'recommendations' in result

        # Check sentiment is valid
        assert result['overall_sentiment'] in ['positive', 'negative', 'neutral']

    async def test_analyze_farmer_sentiment_enhanced(self, ai_service):
        """Test enhanced farmer sentiment analysis"""
        text_data = [
            'The crop yields are excellent this year',
            'Market prices are too low',
            'Weather conditions have been favorable',
            'Pest problems reduced our harvest'
        ]

        result = await ai_service._analyze_sentiment_enhanced(text_data)

        assert 'overall_sentiment' in result
        assert 'sentiment_distribution' in result
        assert 'individual_sentiments' in result
        assert 'key_themes' in result

        # Check individual sentiments
        assert len(result['individual_sentiments']) == len(text_data)
        for sentiment in result['individual_sentiments']:
            assert 'sentiment' in sentiment
            assert 'confidence' in sentiment
            assert sentiment['sentiment'] in ['positive', 'negative', 'neutral']

    async def test_extract_market_themes(self, ai_service):
        """Test market theme extraction"""
        text_data = [
            'The price of maize has increased significantly',
            'Weather patterns are affecting crop yields',
            'Farmers are concerned about pest infestations',
            'Soil quality is improving with new fertilizers'
        ]

        themes = ai_service._extract_market_themes(text_data)

        assert isinstance(themes, list)
        # Should extract relevant themes
        theme_text = ' '.join(themes).lower()
        assert any(keyword in theme_text for keyword in ['price', 'weather', 'yield', 'pest', 'soil'])

    async def test_predict_price_impact(self, ai_service):
        """Test price impact prediction"""
        sentiment_result = {
            'sentiment_score': 0.3,
            'overall_sentiment': 'positive'
        }

        prediction = ai_service._predict_price_impact(sentiment_result)

        assert 'impact_type' in prediction
        assert 'predicted_change_percent' in prediction
        assert 'confidence_percent' in prediction
        assert 'factors' in prediction

        assert prediction['predicted_change_percent'] > 0  # Positive sentiment should predict increase

    async def test_market_sentiment_insights(self, ai_service):
        """Test market sentiment insights generation"""
        sentiment_result = {
            'overall_sentiment': 'positive',
            'sentiment_score': 0.4,
            'sentiment_distribution': {'positive': 10, 'negative': 2, 'neutral': 3}
        }
        market_data = [{'news_headlines': ['Prices rising']}, {'farmer_feedback': ['Good yields']}]

        insights = ai_service._generate_market_sentiment_insights(sentiment_result, market_data)

        assert isinstance(insights, list)
        assert len(insights) > 0

        # Should contain positive market insights
        insights_text = ' '.join(insights).lower()
        assert 'positive' in insights_text or 'bullish' in insights_text

    async def test_climate_risk_assessment(self, ai_service):
        """Test climate risk assessment"""
        location = 'Nairobi'
        crop_type = 'maize'
        weather_forecast = [
            {'temperature': 25, 'humidity': 70, 'rainfall': 50},
            {'temperature': 28, 'humidity': 65, 'rainfall': 30}
        ]

        result = await ai_service.assess_climate_risk(location, crop_type, weather_forecast)

        assert 'location' in result
        assert 'crop_type' in result
        assert 'risk_score' in result
        assert 'risk_level' in result
        assert 'recommendations' in result
        assert 'key_factors' in result

        assert result['location'] == location
        assert result['crop_type'] == crop_type
        assert 0 <= result['risk_score'] <= 1

    async def test_yield_prediction(self, ai_service):
        """Test yield prediction"""
        commodity = 'maize'
        location = 'Nairobi'
        historical_data = [
            {'price': 100, 'date': '2023-01-01'},
            {'price': 105, 'date': '2023-02-01'},
            {'price': 102, 'date': '2023-03-01'}
        ]
        days_ahead = 7

        result = await ai_service.predict_market_prices(
            commodity, location, historical_data, days_ahead
        )

        assert 'commodity' in result
        assert 'location' in result
        assert 'current_price' in result
        assert 'predictions' in result
        assert 'trend' in result

        assert len(result['predictions']) == days_ahead
        for prediction in result['predictions']:
            assert 'day' in prediction
            assert 'predicted_price' in prediction
            assert 'confidence_interval' in prediction


class TestAdvancedAIAPI:
    """Test advanced AI API endpoints"""

    @pytest.fixture
    def client(self):
        return TestClient(app)

    @pytest.fixture
    def test_user(self):
        """Create a test user"""
        return User(
            id=1,
            email="test@example.com",
            username="testuser",
            hashed_password=get_password_hash("testpass123"),
            full_name="Test User"
        )

    def test_crop_disease_detection_unauthorized(self, client):
        """Test crop disease detection without authentication"""
        response = client.post("/ai/crop-disease-detection")
        assert response.status_code == 401

    def test_market_sentiment_analysis_unauthorized(self, client):
        """Test market sentiment analysis without authentication"""
        response = client.post("/ai/market-sentiment-analysis")
        assert response.status_code == 401

    def test_crop_health_analysis_unauthorized(self, client):
        """Test crop health analysis without authentication"""
        response = client.post("/ai/crop-health-analysis")
        assert response.status_code == 401

    def test_sentiment_analysis_unauthorized(self, client):
        """Test sentiment analysis without authentication"""
        response = client.post("/ai/sentiment-analysis")
        assert response.status_code == 401

    @patch('app.core.advanced_ai.advanced_ai_service.analyze_crop_health')
    def test_crop_disease_detection_success(self, mock_analyze, client, test_user):
        """Test successful crop disease detection"""
        # Mock the AI service response
        mock_analyze.return_value = {
            'crop_type': 'maize',
            'health_score': 0.85,
            'disease_detected': True,
            'diseases': ['gray_leaf_spot'],
            'recommendations': ['Apply fungicide']
        }

        # Create mock image file
        image_data = b'mock_image_data'
        files = {'file': ('test.jpg', io.BytesIO(image_data), 'image/jpeg')}
        data = {'crop_type': 'maize', 'location': 'Nairobi'}

        # Mock authentication
        with patch('app.api.auth.get_current_active_user', return_value=test_user):
            response = client.post("/ai/crop-disease-detection", files=files, data=data)

        assert response.status_code == 200
        result = response.json()
        assert result['status'] == 'success'
        assert 'data' in result

    def test_crop_disease_detection_invalid_file_type(self, client, test_user):
        """Test crop disease detection with invalid file type"""
        # Create mock text file
        files = {'file': ('test.txt', io.BytesIO(b'text content'), 'text/plain')}
        data = {'crop_type': 'maize', 'location': 'Nairobi'}

        with patch('app.api.auth.get_current_active_user', return_value=test_user):
            response = client.post("/ai/crop-disease-detection", files=files, data=data)

        assert response.status_code == 400
        assert "File must be an image" in response.json()['detail']

    def test_crop_disease_detection_unsupported_crop(self, client, test_user):
        """Test crop disease detection with unsupported crop type"""
        image_data = b'mock_image_data'
        files = {'file': ('test.jpg', io.BytesIO(image_data), 'image/jpeg')}
        data = {'crop_type': 'unsupported_crop', 'location': 'Nairobi'}

        with patch('app.api.auth.get_current_active_user', return_value=test_user):
            response = client.post("/ai/crop-disease-detection", files=files, data=data)

        assert response.status_code == 400
        assert "Unsupported crop type" in response.json()['detail']