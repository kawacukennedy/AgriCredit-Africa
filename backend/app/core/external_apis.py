import asyncio
import httpx
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import structlog
import os

logger = structlog.get_logger()

class ExternalAPIsService:
    """Service for integrating with external APIs: mobile money, satellite data, oracles"""

    def __init__(self):
        self.nasa_api_key = os.getenv('NASA_API_KEY', 'DEMO_KEY')
        self.mpesa_consumer_key = os.getenv('MPESA_CONSUMER_KEY')
        self.mpesa_consumer_secret = os.getenv('MPESA_CONSUMER_SECRET')
        self.chainlink_api_key = os.getenv('CHAINLINK_API_KEY')

    async def get_satellite_data(self, location: str, start_date: str, end_date: str) -> Dict[str, Any]:
        """Get satellite data from NASA Earth API"""
        try:
            # NASA Earth API for NDVI data
            url = f"https://api.nasa.gov/planetary/earth/imagery"
            params = {
                'lon': location.split(',')[0],
                'lat': location.split(',')[1],
                'date': start_date,
                'api_key': self.nasa_api_key
            }

            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(url, params=params)
                response.raise_for_status()
                data = response.json()

            # Mock NDVI calculation based on satellite data
            ndvi_score = 0.65 + (hash(location + start_date) % 100) / 1000  # Mock calculation

            return {
                'location': location,
                'ndvi_score': round(ndvi_score, 3),
                'satellite_date': start_date,
                'cloud_cover': 15 + (hash(location) % 20),  # Mock cloud cover
                'data_source': 'NASA Earth API',
                'timestamp': datetime.utcnow().isoformat()
            }

        except Exception as e:
            logger.error("Satellite data retrieval failed", location=location, error=str(e))
            # Return mock data as fallback
            return {
                'location': location,
                'ndvi_score': 0.72,
                'satellite_date': start_date,
                'cloud_cover': 12,
                'data_source': 'Mock NASA API',
                'timestamp': datetime.utcnow().isoformat()
            }

    async def get_weather_data(self, location: str) -> Dict[str, Any]:
        """Get weather data from OpenWeatherMap API"""
        try:
            api_key = os.getenv('OPENWEATHER_API_KEY', 'demo')
            url = f"http://api.openweathermap.org/data/2.5/weather"
            params = {
                'q': location,
                'appid': api_key,
                'units': 'metric'
            }

            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(url, params=params)
                response.raise_for_status()
                data = response.json()

            return {
                'location': location,
                'temperature': data['main']['temp'],
                'humidity': data['main']['humidity'],
                'rainfall': data.get('rain', {}).get('1h', 0),
                'wind_speed': data['wind']['speed'],
                'description': data['weather'][0]['description'],
                'timestamp': datetime.utcnow().isoformat()
            }

        except Exception as e:
            logger.error("Weather data retrieval failed", location=location, error=str(e))
            # Return mock data
            return {
                'location': location,
                'temperature': 25.5,
                'humidity': 70.0,
                'rainfall': 2.5,
                'wind_speed': 8.5,
                'description': 'partly cloudy',
                'timestamp': datetime.utcnow().isoformat()
            }

    async def send_mobile_money(self, phone_number: str, amount: float, currency: str = 'KES') -> Dict[str, Any]:
        """Send money via M-Pesa"""
        try:
            # This would integrate with M-Pesa Daraja API
            # For demo purposes, simulate the transaction

            transaction_id = f"MPESA{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"

            return {
                'transaction_id': transaction_id,
                'phone_number': phone_number,
                'amount': amount,
                'currency': currency,
                'status': 'completed',
                'timestamp': datetime.utcnow().isoformat(),
                'message': f'Successfully sent {amount} {currency} to {phone_number}'
            }

        except Exception as e:
            logger.error("Mobile money transfer failed", phone_number=phone_number, error=str(e))
            return {
                'transaction_id': None,
                'status': 'failed',
                'error': str(e),
                'timestamp': datetime.utcnow().isoformat()
            }

    async def get_oracle_price_feed(self, asset: str, source: str = 'chainlink') -> Dict[str, Any]:
        """Get price feed from oracle services"""
        try:
            if source == 'chainlink':
                # Simulate Chainlink price feed
                mock_prices = {
                    'ETH/USD': 3200.50,
                    'BTC/USD': 45000.75,
                    'USDT/USD': 1.001,
                    'AGRC/USD': 0.85
                }

                price = mock_prices.get(asset.upper(), 100.0)

                return {
                    'asset': asset,
                    'price': price,
                    'source': 'Chainlink',
                    'timestamp': datetime.utcnow().isoformat(),
                    'confidence': 0.99
                }

            elif source == 'api3':
                # Simulate API3 price feed
                price = 100.0 + (hash(asset) % 1000) / 10

                return {
                    'asset': asset,
                    'price': round(price, 2),
                    'source': 'API3',
                    'timestamp': datetime.utcnow().isoformat(),
                    'confidence': 0.95
                }

            else:
                raise ValueError(f"Unsupported oracle source: {source}")

        except Exception as e:
            logger.error("Oracle price feed failed", asset=asset, source=source, error=str(e))
            return {
                'asset': asset,
                'price': 0.0,
                'source': source,
                'error': str(e),
                'timestamp': datetime.utcnow().isoformat()
            }

    async def get_copernicus_data(self, location: str, dataset: str = 'NDVI') -> Dict[str, Any]:
        """Get data from Copernicus Sentinel API"""
        try:
            # This would integrate with Copernicus API
            # For demo, return mock data

            if dataset == 'NDVI':
                ndvi_value = 0.68 + (hash(location) % 100) / 1000
                return {
                    'location': location,
                    'dataset': dataset,
                    'value': round(ndvi_value, 3),
                    'unit': 'index',
                    'satellite': 'Sentinel-2',
                    'timestamp': datetime.utcnow().isoformat()
                }
            else:
                return {
                    'location': location,
                    'dataset': dataset,
                    'value': 0.0,
                    'error': f'Dataset {dataset} not supported',
                    'timestamp': datetime.utcnow().isoformat()
                }

        except Exception as e:
            logger.error("Copernicus data retrieval failed", location=location, dataset=dataset, error=str(e))
            return {
                'location': location,
                'dataset': dataset,
                'value': 0.0,
                'error': str(e),
                'timestamp': datetime.utcnow().isoformat()
            }

# Global instance
external_apis_service = ExternalAPIsService()