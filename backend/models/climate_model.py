import numpy as np
import os

class ClimateAnalysisModel:
    def __init__(self):
        self.model_path = os.path.join(os.path.dirname(__file__), 'climate_model.npy')

    def preprocess_satellite_data(self, satellite_data):
        """Preprocess satellite data for model input"""
        # Extract relevant features from satellite data
        features = []

        # NDVI (Normalized Difference Vegetation Index)
        if 'ndvi' in satellite_data:
            features.append(satellite_data['ndvi'])
        else:
            features.append(0.6)  # Default

        # Land cover classification
        if 'land_cover' in satellite_data:
            features.append(satellite_data['land_cover'])
        else:
            features.append(0.5)

        # Temperature
        if 'temperature' in satellite_data:
            features.append(satellite_data['temperature'])
        else:
            features.append(25.0)

        # Precipitation
        if 'precipitation' in satellite_data:
            features.append(satellite_data['precipitation'])
        else:
            features.append(800.0)

        # IoT sensor data
        iot_features = self._extract_iot_features(satellite_data.get('iot_sensors', {}))
        features.extend(iot_features)

        return np.array(features)

    def _extract_iot_features(self, iot_data):
        """Extract features from IoT sensor data"""
        features = []

        # Soil moisture
        features.append(iot_data.get('soil_moisture', 0.5))

        # Air temperature
        features.append(iot_data.get('air_temp', 25.0))

        # Humidity
        features.append(iot_data.get('humidity', 60.0))

        # Wind speed
        features.append(iot_data.get('wind_speed', 5.0))

        # Solar radiation
        features.append(iot_data.get('solar_radiation', 200.0))

        return features

    def analyze_climate_impact(self, satellite_data, iot_sensors):
        """Analyze climate impact and calculate carbon sequestration"""
        # Combine satellite and IoT data
        combined_data = {**satellite_data, 'iot_sensors': iot_sensors}

        # Extract features
        features = self.preprocess_satellite_data(combined_data)

        # For now, use rule-based calculation (real model would use trained CNN)
        co2_sequestration = self._calculate_co2_sequestration(features)

        # Calculate CARBT tokens (1 token = 1 ton CO2)
        carb_tokens = co2_sequestration

        return {
            "co2_sequestered": round(co2_sequestration, 2),
            "ndvi_score": features[0],
            "carbon_tokens_mintable": round(carb_tokens, 2),
            "recommendations": self._generate_recommendations(features),
            "confidence": 0.85
        }

    def _calculate_co2_sequestration(self, features):
        """Calculate CO2 sequestration based on features"""
        # Simplified calculation based on vegetation, soil, and climate factors
        ndvi = features[0]
        soil_moisture = features[4]
        temperature = features[2]
        precipitation = features[3]

        # Base sequestration rate (tons CO2 per hectare per year)
        base_rate = 2.5

        # Modifiers
        vegetation_modifier = ndvi * 1.5  # Higher NDVI = more sequestration
        soil_modifier = soil_moisture * 0.5  # Better soil moisture = more sequestration
        climate_modifier = 1.0 - abs(temperature - 22) / 30  # Optimal temp around 22°C
        precipitation_modifier = min(precipitation / 1000, 1.5)  # Optimal precipitation

        total_sequestration = base_rate * vegetation_modifier * soil_modifier * climate_modifier * precipitation_modifier

        return max(total_sequestration, 0)

    def _generate_recommendations(self, features):
        """Generate climate-smart farming recommendations"""
        recommendations = []

        ndvi = features[0]
        soil_moisture = features[4]
        temperature = features[2]
        precipitation = features[3]

        if ndvi < 0.5:
            recommendations.append("Increase tree cover or vegetation density")
        if soil_moisture < 0.4:
            recommendations.append("Implement water conservation techniques")
        if temperature > 28:
            recommendations.append("Consider shade crops or irrigation")
        if precipitation < 600:
            recommendations.append("Implement drought-resistant crop varieties")

        if not recommendations:
            recommendations.append("Continue current sustainable practices")

        return recommendations

    def save_model(self):
        """Save model parameters (placeholder)"""
        # No model to save for rule-based system
        pass

    def load_model(self):
        """Load model parameters (placeholder)"""
        # No model to load for rule-based system
        pass

if __name__ == "__main__":
    # Example usage
    model = ClimateAnalysisModel()

    # Sample satellite and IoT data
    satellite_data = {
        'ndvi': 0.72,
        'land_cover': 0.8,
        'temperature': 24.5,
        'precipitation': 850.0
    }

    iot_sensors = {
        'soil_moisture': 0.65,
        'air_temp': 24.5,
        'humidity': 65.0,
        'wind_speed': 4.2,
        'solar_radiation': 180.0
    }

    result = model.analyze_climate_impact(satellite_data, iot_sensors)
    print(f"Climate analysis result: {result}")