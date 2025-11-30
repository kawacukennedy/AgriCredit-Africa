import pytest
from unittest.mock import Mock, patch, AsyncMock
from fastapi.testclient import TestClient
from app.main import app
from app.core.ussd_service import USSDService, ussd_service
from app.database.models import User
from app.core.security import get_password_hash


class TestUSSDService:
    """Test USSD service functionality"""

    @pytest.fixture
    def ussd_svc(self):
        """Create USSD service instance"""
        return USSDService()

    def test_ussd_initialization(self, ussd_svc):
        """Test USSD service initialization"""
        assert ussd_svc.supported_languages is not None
        assert 'en' in ussd_svc.supported_languages
        assert 'sw' in ussd_svc.supported_languages
        assert 'ha' in ussd_svc.supported_languages

    async def test_process_ussd_request_new_session(self, ussd_svc):
        """Test processing new USSD session"""
        request_data = {
            'sessionId': '12345',
            'serviceCode': '*123#',
            'phoneNumber': '+254712345678',
            'text': ''
        }

        response = await ussd_svc.process_ussd_request(request_data)

        assert 'CON' in response  # Continue session
        assert 'Welcome' in response or 'Karibu' in response

    async def test_process_ussd_request_language_selection(self, ussd_svc):
        """Test language selection in USSD"""
        # Start new session
        request_data = {
            'sessionId': '12345',
            'serviceCode': '*123#',
            'phoneNumber': '+254712345678',
            'text': ''
        }
        response1 = await ussd_svc.process_ussd_request(request_data)

        # Select English
        request_data['text'] = '1'
        response2 = await ussd_svc.process_ussd_request(request_data)

        assert 'CON' in response2
        assert 'English' in response2 or 'Main Menu' in response2

    async def test_process_ussd_request_main_menu(self, ussd_svc):
        """Test main menu navigation"""
        # Simulate full flow: language selection -> main menu
        request_data = {
            'sessionId': '12345',
            'serviceCode': '*123#',
            'phoneNumber': '+254712345678',
            'text': ''
        }

        # Language selection
        request_data['text'] = '1'  # English
        response = await ussd_svc.process_ussd_request(request_data)

        # Should show main menu
        assert 'CON' in response
        assert any(option in response for option in ['Loan', 'Market', 'Weather', 'Balance'])

    async def test_ussd_loan_application_flow(self, ussd_svc):
        """Test loan application flow"""
        request_data = {
            'sessionId': '12345',
            'serviceCode': '*123#',
            'phoneNumber': '+254712345678',
            'text': ''
        }

        # Navigate to loan application
        responses = []
        texts = ['', '1', '1']  # Language -> Main Menu -> Loan Application

        for text in texts:
            request_data['text'] = text
            response = await ussd_svc.process_ussd_request(request_data)
            responses.append(response)

        # Should ask for loan amount
        assert 'CON' in responses[-1]
        assert 'amount' in responses[-1].lower() or 'kiasi' in responses[-1].lower()

    async def test_ussd_market_prices_flow(self, ussd_svc):
        """Test market prices flow"""
        request_data = {
            'sessionId': '12345',
            'serviceCode': '*123#',
            'phoneNumber': '+254712345678',
            'text': ''
        }

        # Navigate to market prices
        texts = ['', '1', '2']  # Language -> Main Menu -> Market Prices

        for text in texts:
            request_data['text'] = text
            response = await ussd_svc.process_ussd_request(request_data)

        # Should show market prices
        assert 'CON' in response or 'END' in response
        assert any(commodity in response for commodity in ['Maize', 'Beans', 'Rice', 'Muhindi'])

    async def test_ussd_weather_info_flow(self, ussd_svc):
        """Test weather information flow"""
        request_data = {
            'sessionId': '12345',
            'serviceCode': '*123#',
            'phoneNumber': '+254712345678',
            'text': ''
        }

        # Navigate to weather info
        texts = ['', '1', '3']  # Language -> Main Menu -> Weather

        for text in texts:
            request_data['text'] = text
            response = await ussd_svc.process_ussd_request(request_data)

        # Should show weather information
        assert 'CON' in response or 'END' in response
        assert any(weather_term in response for weather_term in ['Temperature', 'Rainfall', 'Weather', 'Hali ya hewa'])

    async def test_ussd_balance_check_flow(self, ussd_svc):
        """Test balance check flow"""
        request_data = {
            'sessionId': '12345',
            'serviceCode': '*123#',
            'phoneNumber': '+254712345678',
            'text': ''
        }

        # Navigate to balance check
        texts = ['', '1', '4']  # Language -> Main Menu -> Balance

        for text in texts:
            request_data['text'] = text
            response = await ussd_svc.process_ussd_request(request_data)

        # Should show balance information
        assert 'END' in response
        assert any(balance_term in response for balance_term in ['Balance', 'Saldo', 'Account'])

    async def test_ussd_invalid_input_handling(self, ussd_svc):
        """Test invalid input handling"""
        request_data = {
            'sessionId': '12345',
            'serviceCode': '*123#',
            'phoneNumber': '+254712345678',
            'text': ''
        }

        # Start session
        response1 = await ussd_svc.process_ussd_request(request_data)

        # Send invalid input
        request_data['text'] = '999'
        response2 = await ussd_svc.process_ussd_request(request_data)

        # Should handle invalid input gracefully
        assert 'CON' in response2 or 'END' in response2

    async def test_ussd_session_timeout(self, ussd_svc):
        """Test session timeout handling"""
        request_data = {
            'sessionId': '12345',
            'serviceCode': '*123#',
            'phoneNumber': '+254712345678',
            'text': ''
        }

        # Start session
        response1 = await ussd_svc.process_ussd_request(request_data)

        # Simulate timeout by clearing session data
        if hasattr(ussd_svc, 'session_data'):
            ussd_svc.session_data.pop('12345', None)

        # Try to continue session
        request_data['text'] = '1'
        response2 = await ussd_svc.process_ussd_request(request_data)

        # Should handle timeout gracefully
        assert 'CON' in response2 or 'END' in response2

    def test_get_supported_languages(self, ussd_svc):
        """Test getting supported languages"""
        languages = ussd_svc.get_supported_languages()

        assert isinstance(languages, list)
        assert 'en' in languages
        assert 'sw' in languages
        assert 'ha' in languages

    def test_format_currency(self, ussd_svc):
        """Test currency formatting"""
        # Test Kenyan Shillings
        formatted = ussd_svc._format_currency(1500.50, 'KES')
        assert '1,500.50' in formatted or '1500.50' in formatted

        # Test USD
        formatted = ussd_svc._format_currency(25.75, 'USD')
        assert '25.75' in formatted

    def test_format_date(self, ussd_svc):
        """Test date formatting"""
        from datetime import datetime
        test_date = datetime(2024, 3, 15, 14, 30)

        formatted = ussd_svc._format_date(test_date)
        assert '15/03/2024' in formatted or '2024-03-15' in formatted

    async def test_get_market_prices(self, ussd_svc):
        """Test getting market prices"""
        prices = await ussd_svc._get_market_prices()

        assert isinstance(prices, dict)
        # Should have some commodities
        assert len(prices) > 0

        # Check structure
        for commodity, data in prices.items():
            assert 'price' in data
            assert 'unit' in data
            assert 'change' in data

    async def test_get_weather_info(self, ussd_svc):
        """Test getting weather information"""
        weather = await ussd_svc._get_weather_info('Nairobi')

        assert isinstance(weather, dict)
        assert 'temperature' in weather
        assert 'condition' in weather
        assert 'location' in weather

    async def test_send_sms_notification(self, ussd_svc):
        """Test SMS notification sending"""
        phone = '+254712345678'
        message = 'Test message'

        result = await ussd_svc._send_sms_notification(phone, message)

        # Should not raise exception
        assert result is None or isinstance(result, bool)


class TestUSSDAPI:
    """Test USSD API endpoints"""

    @pytest.fixture
    def client(self):
        return TestClient(app)

    def test_ussd_callback_endpoint(self, client):
        """Test USSD callback endpoint"""
        ussd_data = {
            'sessionId': '12345',
            'serviceCode': '*123#',
            'phoneNumber': '+254712345678',
            'text': ''
        }

        response = client.post("/ussd/callback", data=ussd_data)

        assert response.status_code == 200
        response_text = response.text

        # Should return USSD response
        assert 'CON' in response_text or 'END' in response_text

    def test_ussd_callback_invalid_data(self, client):
        """Test USSD callback with invalid data"""
        # Missing required fields
        ussd_data = {
            'sessionId': '12345',
            'text': ''
        }

        response = client.post("/ussd/callback", data=ussd_data)

        # Should handle gracefully
        assert response.status_code == 200

    def test_ussd_status_endpoint(self, client):
        """Test USSD service status endpoint"""
        response = client.get("/ussd/status")

        assert response.status_code == 200
        data = response.json()

        assert 'status' in data
        assert 'supported_languages' in data
        assert 'active_sessions' in data

    def test_ussd_languages_endpoint(self, client):
        """Test supported languages endpoint"""
        response = client.get("/ussd/languages")

        assert response.status_code == 200
        languages = response.json()

        assert isinstance(languages, list)
        assert 'en' in languages
        assert 'sw' in languages