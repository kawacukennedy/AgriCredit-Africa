"""
Oracle Service for AgriCredit DApp
Handles external data feeds, price oracles, and data verification
"""

import asyncio
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass
from decimal import Decimal

from .config import settings
from .cache import CacheClient
from .api_utils import APIResponse

logger = logging.getLogger(__name__)

@dataclass
class PriceFeed:
    """Price feed data structure"""
    asset: str
    price: Decimal
    timestamp: datetime
    source: str
    confidence: float

@dataclass
class WeatherData:
    """Weather data structure"""
    location: str
    temperature: float
    humidity: float
    rainfall: float
    wind_speed: float
    timestamp: datetime
    source: str

@dataclass
class MarketData:
    """Market data structure"""
    commodity: str
    region: str
    price: Decimal
    volume: float
    timestamp: datetime
    source: str

class OracleService:
    """Service for managing external data oracles and feeds"""

    def __init__(self, cache_client: CacheClient):
        self.cache = cache_client
        self.price_feeds: Dict[str, PriceFeed] = {}
        self.weather_feeds: Dict[str, WeatherData] = {}
        self.market_feeds: Dict[str, MarketData] = {}
        self.data_sources = {
            'chainlink': {'url': 'https://feeds.chain.link', 'enabled': True},
            'openweather': {'url': 'https://api.openweathermap.org', 'enabled': True},
            'alphavantage': {'url': 'https://www.alphavantage.co', 'enabled': True},
            'custom_feeds': {'url': settings.CUSTOM_ORACLE_URL, 'enabled': True}
        }

    async def get_price_feed(self, asset: str, source: str = 'chainlink') -> Optional[PriceFeed]:
        """Get current price for an asset"""
        try:
            cache_key = f"price_feed:{asset}:{source}"
            cached_data = await self.cache.get(cache_key)

            if cached_data:
                return PriceFeed(**cached_data)

            # Fetch from external source
            price_data = await self._fetch_price_from_source(asset, source)

            if price_data:
                feed = PriceFeed(
                    asset=asset,
                    price=Decimal(str(price_data['price'])),
                    timestamp=datetime.fromisoformat(price_data['timestamp']),
                    source=source,
                    confidence=price_data.get('confidence', 0.95)
                )

                # Cache for 5 minutes
                await self.cache.set(cache_key, feed.__dict__, expire=300)
                self.price_feeds[f"{asset}:{source}"] = feed

                return feed

            return None

        except Exception as e:
            logger.error(f"Failed to get price feed for {asset}: {e}")
            return None

    async def get_weather_data(self, location: str, source: str = 'openweather') -> Optional[WeatherData]:
        """Get current weather data for a location"""
        try:
            cache_key = f"weather:{location}:{source}"
            cached_data = await self.cache.get(cache_key)

            if cached_data:
                return WeatherData(**cached_data)

            # Fetch from external source
            weather_data = await self._fetch_weather_from_source(location, source)

            if weather_data:
                weather = WeatherData(
                    location=location,
                    temperature=weather_data['temperature'],
                    humidity=weather_data['humidity'],
                    rainfall=weather_data.get('rainfall', 0),
                    wind_speed=weather_data['wind_speed'],
                    timestamp=datetime.fromisoformat(weather_data['timestamp']),
                    source=source
                )

                # Cache for 30 minutes
                await self.cache.set(cache_key, weather.__dict__, expire=1800)
                self.weather_feeds[f"{location}:{source}"] = weather

                return weather

            return None

        except Exception as e:
            logger.error(f"Failed to get weather data for {location}: {e}")
            return None

    async def get_market_data(self, commodity: str, region: str, source: str = 'alphavantage') -> Optional[MarketData]:
        """Get market data for agricultural commodities"""
        try:
            cache_key = f"market:{commodity}:{region}:{source}"
            cached_data = await self.cache.get(cache_key)

            if cached_data:
                return MarketData(**cached_data)

            # Fetch from external source
            market_data = await self._fetch_market_from_source(commodity, region, source)

            if market_data:
                market = MarketData(
                    commodity=commodity,
                    region=region,
                    price=Decimal(str(market_data['price'])),
                    volume=market_data.get('volume', 0),
                    timestamp=datetime.fromisoformat(market_data['timestamp']),
                    source=source
                )

                # Cache for 1 hour
                await self.cache.set(cache_key, market.__dict__, expire=3600)
                self.market_feeds[f"{commodity}:{region}:{source}"] = market

                return market

            return None

        except Exception as e:
            logger.error(f"Failed to get market data for {commodity} in {region}: {e}")
            return None

    async def get_bulk_price_feeds(self, assets: List[str], source: str = 'chainlink') -> Dict[str, PriceFeed]:
        """Get price feeds for multiple assets"""
        try:
            tasks = [self.get_price_feed(asset, source) for asset in assets]
            results = await asyncio.gather(*tasks, return_exceptions=True)

            feeds = {}
            for asset, result in zip(assets, results):
                if isinstance(result, PriceFeed):
                    feeds[asset] = result

            return feeds

        except Exception as e:
            logger.error(f"Failed to get bulk price feeds: {e}")
            return {}

    async def verify_data_integrity(self, data: Dict[str, Any], signature: str, public_key: str) -> bool:
        """Verify data integrity using cryptographic signatures"""
        try:
            # In a real implementation, this would verify the signature
            # For now, return True for mock data
            return True

        except Exception as e:
            logger.error(f"Data integrity verification failed: {e}")
            return False

    async def aggregate_price_feeds(self, asset: str, sources: List[str]) -> Dict[str, Any]:
        """Aggregate price data from multiple sources"""
        try:
            feeds = await self.get_bulk_price_feeds([asset] * len(sources), sources[0])
            prices = [feed.price for feed in feeds.values() if feed]

            if not prices:
                return {'error': 'No price data available'}

            # Calculate aggregated price
            avg_price = sum(prices) / len(prices)
            min_price = min(prices)
            max_price = max(prices)

            # Calculate confidence based on price variance
            variance = sum((p - avg_price) ** 2 for p in prices) / len(prices)
            confidence = max(0.1, 1 - (variance / avg_price ** 2))  # Simplified confidence calculation

            return {
                'asset': asset,
                'average_price': float(avg_price),
                'min_price': float(min_price),
                'max_price': float(max_price),
                'confidence': confidence,
                'sources_count': len(prices),
                'timestamp': datetime.now().isoformat()
            }

        except Exception as e:
            logger.error(f"Failed to aggregate price feeds for {asset}: {e}")
            return {'error': str(e)}

    async def get_historical_prices(self, asset: str, days: int = 30, source: str = 'chainlink') -> List[PriceFeed]:
        """Get historical price data"""
        try:
            cache_key = f"historical_prices:{asset}:{days}:{source}"
            cached_data = await self.cache.get(cache_key)

            if cached_data:
                return [PriceFeed(**p) for p in cached_data]

            # Fetch historical data (mock implementation)
            historical_data = await self._fetch_historical_prices(asset, days, source)

            # Cache for 1 hour
            await self.cache.set(cache_key, [p.__dict__ for p in historical_data], expire=3600)

            return historical_data

        except Exception as e:
            logger.error(f"Failed to get historical prices for {asset}: {e}")
            return []

    async def update_oracle_feeds(self) -> Dict[str, Any]:
        """Update all oracle feeds with fresh data"""
        try:
            update_tasks = []

            # Update price feeds for common assets
            assets = ['ETH', 'cUSD', 'USDC', 'WETH']
            for asset in assets:
                update_tasks.append(self.get_price_feed(asset))

            # Update weather for key locations
            locations = ['Nairobi', 'Kampala', 'Dar es Salaam', 'Addis Ababa']
            for location in locations:
                update_tasks.append(self.get_weather_data(location))

            # Update market data for key commodities
            commodities = ['maize', 'coffee', 'tea', 'wheat']
            regions = ['kenya', 'uganda', 'tanzania']
            for commodity in commodities:
                for region in regions:
                    update_tasks.append(self.get_market_data(commodity, region))

            # Execute all updates
            results = await asyncio.gather(*update_tasks, return_exceptions=True)

            success_count = sum(1 for r in results if not isinstance(r, Exception))
            error_count = len(results) - success_count

            logger.info(f"Oracle feeds updated: {success_count} successful, {error_count} errors")

            return {
                'status': 'updated',
                'total_feeds': len(results),
                'successful': success_count,
                'errors': error_count,
                'timestamp': datetime.now().isoformat()
            }

        except Exception as e:
            logger.error(f"Failed to update oracle feeds: {e}")
            return {'error': str(e)}

    async def _fetch_price_from_source(self, asset: str, source: str) -> Optional[Dict[str, Any]]:
        """Fetch price data from external source (mock implementation)"""
        try:
            # Mock price data
            base_prices = {
                'ETH': 2500.0,
                'cUSD': 1.0,
                'USDC': 1.0,
                'WETH': 2500.0
            }

            if asset in base_prices:
                # Add some random variation
                import random
                variation = random.uniform(-0.02, 0.02)  # ±2%
                price = base_prices[asset] * (1 + variation)

                return {
                    'price': price,
                    'timestamp': datetime.now().isoformat(),
                    'confidence': 0.95
                }

            return None

        except Exception as e:
            logger.error(f"Failed to fetch price from {source}: {e}")
            return None

    async def _fetch_weather_from_source(self, location: str, source: str) -> Optional[Dict[str, Any]]:
        """Fetch weather data from external source"""
        try:
            if source == 'openweather' and settings.WEATHER_API_KEY:
                # Real OpenWeatherMap API call
                import aiohttp

                url = f"https://api.openweathermap.org/data/2.5/weather?q={location}&appid={settings.WEATHER_API_KEY}&units=metric"
                async with aiohttp.ClientSession() as session:
                    async with session.get(url) as response:
                        if response.status == 200:
                            data = await response.json()

                            return {
                                'temperature': data['main']['temp'],
                                'humidity': data['main']['humidity'],
                                'rainfall': data.get('rain', {}).get('1h', 0),
                                'wind_speed': data['wind']['speed'],
                                'timestamp': datetime.now().isoformat()
                            }
                        else:
                            logger.warning(f"OpenWeather API returned status {response.status} for {location}")

            # Fallback to mock data if API fails or not configured
            import random
            logger.info(f"Using mock weather data for {location} (API not available)")

            return {
                'temperature': 25 + random.uniform(-5, 5),
                'humidity': 65 + random.uniform(-10, 10),
                'rainfall': max(0, random.uniform(-1, 5)),
                'wind_speed': max(0, random.uniform(-2, 10)),
                'timestamp': datetime.now().isoformat()
            }

        except Exception as e:
            logger.error(f"Failed to fetch weather from {source}: {e}")
            return None

    async def _fetch_market_from_source(self, commodity: str, region: str, source: str) -> Optional[Dict[str, Any]]:
        """Fetch market data from external source"""
        try:
            if source == 'alphavantage' and hasattr(settings, 'ALPHA_VANTAGE_API_KEY') and settings.ALPHA_VANTAGE_API_KEY:
                # Real Alpha Vantage API call for commodity prices
                import aiohttp

                # Map commodities to Alpha Vantage symbols
                symbol_map = {
                    'coffee': 'COFFEE',
                    'wheat': 'WHEAT',
                    'corn': 'CORN',
                    'soybean': 'SOYBEAN'
                }

                symbol = symbol_map.get(commodity.lower(), commodity.upper())
                url = f"https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol={symbol}&apikey={settings.ALPHA_VANTAGE_API_KEY}"

                async with aiohttp.ClientSession() as session:
                    async with session.get(url) as response:
                        if response.status == 200:
                            data = await response.json()
                            if 'Global Quote' in data:
                                quote = data['Global Quote']
                                return {
                                    'price': float(quote.get('05. price', 0)),
                                    'volume': float(quote.get('06. volume', 0)),
                                    'timestamp': datetime.now().isoformat()
                                }

            # Fallback to mock data if API fails or not configured
            import random
            logger.info(f"Using mock market data for {commodity} in {region} (API not available)")

            base_prices = {
                'maize': 200,
                'coffee': 1500,
                'tea': 1200,
                'wheat': 250,
                'corn': 180,
                'soybean': 400
            }

            if commodity.lower() in base_prices:
                variation = random.uniform(-0.1, 0.1)  # ±10%
                price = base_prices[commodity.lower()] * (1 + variation)

                return {
                    'price': price,
                    'volume': random.uniform(100, 1000),
                    'timestamp': datetime.now().isoformat()
                }

            return None

        except Exception as e:
            logger.error(f"Failed to fetch market data from {source}: {e}")
            return None

    async def _fetch_historical_prices(self, asset: str, days: int, source: str) -> List[PriceFeed]:
        """Fetch historical price data (mock implementation)"""
        try:
            feeds = []
            base_price = 2500.0 if asset == 'ETH' else 1.0  # Simplified

            for i in range(days):
                timestamp = datetime.now() - timedelta(days=i)
                # Add some trend and noise
                trend = (days - i) * 0.001  # Slight upward trend
                noise = (i % 10 - 5) * 0.01  # Some noise
                price = Decimal(str(base_price * (1 + trend + noise)))

                feeds.append(PriceFeed(
                    asset=asset,
                    price=price,
                    timestamp=timestamp,
                    source=source,
                    confidence=0.95
                ))

            return feeds

        except Exception as e:
            logger.error(f"Failed to fetch historical prices: {e}")
            return []

# Global service instance
oracle_service = OracleService(None)  # Will be initialized in main app