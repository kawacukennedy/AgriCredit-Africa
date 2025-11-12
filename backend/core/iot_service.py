"""
IoT Service for AgriCredit DApp
Handles sensor data processing, device management, and IoT integrations
"""

import asyncio
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass

from .config import settings
from .cache import CacheClient
from .advanced_ai import AdvancedAIModels
from .api_utils import APIResponse

logger = logging.getLogger(__name__)

@dataclass
class SensorReading:
    """Sensor reading data structure"""
    device_id: str
    soil_moisture: float
    temperature: float
    humidity: float
    light_level: float
    ph_level: Optional[float] = None
    nitrogen: Optional[float] = None
    phosphorus: Optional[float] = None
    potassium: Optional[float] = None
    rainfall: Optional[float] = None
    wind_speed: Optional[float] = None
    solar_radiation: Optional[float] = None
    timestamp: datetime

@dataclass
class IoTDevice:
    """IoT device information"""
    device_id: str
    name: Optional[str]
    location: Optional[str]
    latitude: Optional[float]
    longitude: Optional[float]
    crop_type: Optional[str]
    farm_size: Optional[float]
    owner_id: int
    is_active: bool
    last_seen: Optional[datetime]
    firmware_version: Optional[str]
    battery_level: Optional[float]

class IoTService:
    """Service for managing IoT devices and sensor data"""

    def __init__(self, cache_client: CacheClient, ai_models: AdvancedAIModels):
        self.cache = cache_client
        self.ai = ai_models
        self.devices: Dict[str, IoTDevice] = {}
        self.active_connections: Dict[str, Any] = {}

    async def register_device(self, device_data: Dict[str, Any], owner_id: int) -> IoTDevice:
        """Register a new IoT device"""
        try:
            device = IoTDevice(
                device_id=device_data['device_id'],
                name=device_data.get('name'),
                location=device_data.get('location'),
                latitude=device_data.get('latitude'),
                longitude=device_data.get('longitude'),
                crop_type=device_data.get('crop_type'),
                farm_size=device_data.get('farm_size'),
                owner_id=owner_id,
                is_active=True,
                last_seen=None,
                firmware_version=device_data.get('firmware_version'),
                battery_level=device_data.get('battery_level')
            )

            self.devices[device.device_id] = device
            logger.info(f"Device registered: {device.device_id}")

            return device

        except Exception as e:
            logger.error(f"Device registration failed: {e}")
            raise

    async def process_sensor_data(self, device_id: str, sensor_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process incoming sensor data"""
        try:
            # Validate device exists and is active
            if device_id not in self.devices:
                raise ValueError(f"Unknown device: {device_id}")

            device = self.devices[device_id]
            if not device.is_active:
                raise ValueError(f"Device not active: {device_id}")

            # Create sensor reading
            reading = SensorReading(
                device_id=device_id,
                soil_moisture=sensor_data['soil_moisture'],
                temperature=sensor_data['temperature'],
                humidity=sensor_data['humidity'],
                light_level=sensor_data['light_level'],
                ph_level=sensor_data.get('ph_level'),
                nitrogen=sensor_data.get('nitrogen'),
                phosphorus=sensor_data.get('phosphorus'),
                potassium=sensor_data.get('potassium'),
                rainfall=sensor_data.get('rainfall'),
                wind_speed=sensor_data.get('wind_speed'),
                solar_radiation=sensor_data.get('solar_radiation'),
                timestamp=datetime.now()
            )

            # Update device last seen
            device.last_seen = reading.timestamp
            device.battery_level = sensor_data.get('battery_level')

            # Process and analyze data
            analysis = await self._analyze_sensor_data(reading, device)

            # Cache recent readings
            await self._cache_sensor_reading(reading)

            # Check for alerts
            alerts = await self._check_alerts(reading, device)

            logger.info(f"Processed sensor data for device: {device_id}")

            return {
                'status': 'processed',
                'device_id': device_id,
                'timestamp': reading.timestamp.isoformat(),
                'analysis': analysis,
                'alerts': alerts
            }

        except Exception as e:
            logger.error(f"Failed to process sensor data for {device_id}: {e}")
            raise

    async def get_device_readings(self, device_id: str, hours: int = 24) -> List[SensorReading]:
        """Get historical sensor readings for a device"""
        try:
            cache_key = f"sensor_readings:{device_id}:{hours}"
            cached_data = await self.cache.get(cache_key)

            if cached_data:
                return [SensorReading(**r) for r in cached_data]

            # Fetch from database (mock implementation)
            readings = await self._fetch_readings_from_db(device_id, hours)

            # Cache for 30 minutes
            await self.cache.set(cache_key, [r.__dict__ for r in readings], expire=1800)

            return readings

        except Exception as e:
            logger.error(f"Failed to get readings for {device_id}: {e}")
            return []

    async def get_device_status(self, device_id: str) -> Dict[str, Any]:
        """Get current status of a device"""
        try:
            if device_id not in self.devices:
                raise ValueError(f"Unknown device: {device_id}")

            device = self.devices[device_id]

            # Get latest reading
            latest_reading = await self._get_latest_reading(device_id)

            return {
                'device_id': device.device_id,
                'is_active': device.is_active,
                'last_seen': device.last_seen.isoformat() if device.last_seen else None,
                'battery_level': device.battery_level,
                'latest_reading': latest_reading.__dict__ if latest_reading else None,
                'connection_status': device_id in self.active_connections
            }

        except Exception as e:
            logger.error(f"Failed to get device status for {device_id}: {e}")
            raise

    async def send_command_to_device(self, device_id: str, command: str, params: Dict[str, Any]) -> bool:
        """Send command to IoT device"""
        try:
            if device_id not in self.active_connections:
                raise ValueError(f"Device not connected: {device_id}")

            # Send command via WebSocket or MQTT (mock implementation)
            success = await self._send_device_command(device_id, command, params)

            logger.info(f"Command sent to device {device_id}: {command}")
            return success

        except Exception as e:
            logger.error(f"Failed to send command to {device_id}: {e}")
            return False

    async def get_farm_insights(self, device_ids: List[str], days: int = 7) -> Dict[str, Any]:
        """Generate farm-wide insights from multiple devices"""
        try:
            all_readings = []
            for device_id in device_ids:
                readings = await self.get_device_readings(device_id, days * 24)
                all_readings.extend(readings)

            if not all_readings:
                return {'error': 'No readings available'}

            # Use AI to generate insights
            insights = await self.ai.generate_farm_insights(all_readings)

            return {
                'total_devices': len(device_ids),
                'total_readings': len(all_readings),
                'time_range_days': days,
                'insights': insights
            }

        except Exception as e:
            logger.error(f"Failed to generate farm insights: {e}")
            return {'error': str(e)}

    async def _analyze_sensor_data(self, reading: SensorReading, device: IoTDevice) -> Dict[str, Any]:
        """Analyze sensor data using AI models"""
        try:
            # Prepare data for AI analysis
            data = {
                'soil_moisture': reading.soil_moisture,
                'temperature': reading.temperature,
                'humidity': reading.humidity,
                'light_level': reading.light_level,
                'ph_level': reading.ph_level,
                'crop_type': device.crop_type,
                'season': self._get_current_season()
            }

            # Get AI predictions and recommendations
            analysis = await self.ai.analyze_sensor_data(data)

            return analysis

        except Exception as e:
            logger.error(f"AI analysis failed: {e}")
            return {'error': 'Analysis failed'}

    async def _check_alerts(self, reading: SensorReading, device: IoTDevice) -> List[Dict[str, Any]]:
        """Check for alert conditions"""
        alerts = []

        # Soil moisture alerts
        if reading.soil_moisture < 20:
            alerts.append({
                'type': 'warning',
                'message': 'Soil moisture is critically low',
                'recommendation': 'Irrigate immediately'
            })
        elif reading.soil_moisture < 40:
            alerts.append({
                'type': 'info',
                'message': 'Soil moisture is low',
                'recommendation': 'Consider irrigation'
            })

        # Temperature alerts
        if reading.temperature > 35:
            alerts.append({
                'type': 'warning',
                'message': 'High temperature detected',
                'recommendation': 'Provide shade or cooling'
            })

        # pH alerts
        if reading.ph_level and (reading.ph_level < 5.5 or reading.ph_level > 7.5):
            alerts.append({
                'type': 'warning',
                'message': f'Soil pH is {reading.ph_level:.1f}, outside optimal range',
                'recommendation': 'Test soil and adjust pH if needed'
            })

        return alerts

    async def _cache_sensor_reading(self, reading: SensorReading) -> None:
        """Cache sensor reading for quick access"""
        cache_key = f"latest_reading:{reading.device_id}"
        await self.cache.set(cache_key, reading.__dict__, expire=3600)  # 1 hour

    async def _fetch_readings_from_db(self, device_id: str, hours: int) -> List[SensorReading]:
        """Fetch readings from database (mock implementation)"""
        # Mock data generation
        readings = []
        now = datetime.now()

        for i in range(hours * 4):  # 4 readings per hour
            timestamp = now - timedelta(minutes=i * 15)
            readings.append(SensorReading(
                device_id=device_id,
                soil_moisture=40 + (i % 20),  # Vary between 40-60
                temperature=25 + (i % 10),    # Vary between 25-35
                humidity=60 + (i % 20),       # Vary between 60-80
                light_level=70 + (i % 30),    # Vary between 70-100
                ph_level=6.5 + (i % 1),       # Vary around 6.5
                timestamp=timestamp
            ))

        return readings[-hours * 4:]  # Return last N readings

    async def _get_latest_reading(self, device_id: str) -> Optional[SensorReading]:
        """Get latest reading from cache"""
        cache_key = f"latest_reading:{device_id}"
        data = await self.cache.get(cache_key)

        if data:
            return SensorReading(**data)
        return None

    async def _send_device_command(self, device_id: str, command: str, params: Dict[str, Any]) -> bool:
        """Send command to device (mock implementation)"""
        # In real implementation, this would send via MQTT/WebSocket
        logger.info(f"Sending command {command} to device {device_id}")
        return True

    def _get_current_season(self) -> str:
        """Get current season based on date"""
        month = datetime.now().month
        if month in [12, 1, 2]:
            return 'winter'
        elif month in [3, 4, 5]:
            return 'spring'
        elif month in [6, 7, 8]:
            return 'summer'
        else:
            return 'autumn'

# Global service instance
iot_service = IoTService(None, None)  # Will be initialized in main app