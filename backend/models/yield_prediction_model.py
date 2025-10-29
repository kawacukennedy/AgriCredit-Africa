import tensorflow as tf
import numpy as np
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler
import joblib
import os

class YieldPredictionModel:
    def __init__(self):
        self.model = None
        self.scaler = None
        self.model_path = os.path.join(os.path.dirname(__file__), 'yield_model.pkl')
        self.scaler_path = os.path.join(os.path.dirname(__file__), 'yield_scaler.pkl')

    def build_model(self):
        """Build the gradient boosting model for yield prediction"""
        self.model = GradientBoostingRegressor(
            n_estimators=100,
            learning_rate=0.1,
            max_depth=6,
            random_state=42
        )
        return self.model

    def train(self, X_train, y_train):
        """Train the model with training data"""
        if self.model is None:
            self.build_model()

        # Normalize features
        self.scaler = StandardScaler()
        X_train_scaled = self.scaler.fit_transform(X_train)

        # Train model
        self.model.fit(X_train_scaled, y_train)

        # Save model and scaler
        self.save_model()

        return self.model

    def predict(self, features):
        """Predict crop yield for given features"""
        if self.model is None:
            self.load_model()

        # Ensure features is 2D
        if len(features.shape) == 1:
            features = features.reshape(1, -1)

        # Scale features
        features_scaled = self.scaler.transform(features)

        # Get prediction
        prediction = self.model.predict(features_scaled)[0]

        # Calculate confidence interval (simplified)
        std_dev = np.std(self.model.train_score_) if hasattr(self.model, 'train_score_') else 0.5
        confidence_interval = [
            max(0, prediction - 1.96 * std_dev),
            prediction + 1.96 * std_dev
        ]

        return {
            "predicted_yield": round(float(prediction), 2),
            "unit": "tons/hectare",
            "confidence_interval": [round(float(confidence_interval[0]), 2), round(float(confidence_interval[1]), 2)],
            "confidence_level": "95%",
            "factors": self._get_important_factors(features)
        }

    def _get_important_factors(self, features):
        """Get the most important factors affecting yield"""
        feature_names = [
            'farm_size', 'soil_quality', 'rainfall', 'temperature',
            'fertilizer_usage', 'pest_control', 'crop_variety',
            'farming_experience', 'irrigation_access', 'market_distance'
        ]

        # Get feature importances if available
        if hasattr(self.model, 'feature_importances_'):
            importances = self.model.feature_importances_
            top_indices = np.argsort(importances)[-3:][::-1]  # Top 3
            return [feature_names[i] for i in top_indices]
        else:
            return ["soil_quality", "rainfall", "fertilizer_usage"]  # Default

    def save_model(self):
        """Save model and scaler"""
        if self.model:
            joblib.dump(self.model, self.model_path)
        if self.scaler:
            joblib.dump(self.scaler, self.scaler_path)

    def load_model(self):
        """Load model and scaler"""
        if os.path.exists(self.model_path):
            self.model = joblib.load(self.model_path)
        if os.path.exists(self.scaler_path):
            self.scaler = joblib.load(self.scaler_path)

    def generate_sample_data(self, n_samples=1000):
        """Generate sample training data for demonstration"""
        np.random.seed(42)

        # Generate realistic agricultural yield data
        data = {
            'farm_size': np.random.normal(5, 2, n_samples),  # hectares
            'soil_quality': np.random.beta(7, 2, n_samples),  # 0-1
            'rainfall': np.random.normal(800, 200, n_samples),  # mm/year
            'temperature': np.random.normal(25, 5, n_samples),  # Celsius
            'fertilizer_usage': np.random.exponential(0.5, n_samples),  # kg/hectare
            'pest_control': np.random.binomial(1, 0.6, n_samples),  # 0 or 1
            'crop_variety': np.random.poisson(2, n_samples),  # number of varieties
            'farming_experience': np.random.poisson(10, n_samples),  # years
            'irrigation_access': np.random.binomial(1, 0.4, n_samples),  # 0 or 1
            'market_distance': np.random.exponential(0.2, n_samples)  # hours
        }

        # Create feature matrix
        X = np.column_stack([
            data['farm_size'],
            data['soil_quality'],
            data['rainfall'],
            data['temperature'],
            data['fertilizer_usage'],
            data['pest_control'],
            data['crop_variety'],
            data['farming_experience'],
            data['irrigation_access'],
            data['market_distance']
        ])

        # Generate target yield based on features
        # Simplified yield calculation
        base_yield = 4.0
        yield_modifier = (
            data['soil_quality'] * 2 +
            (data['rainfall'] - 600) / 1000 +
            data['fertilizer_usage'] * 0.5 +
            data['pest_control'] * 0.5 +
            data['irrigation_access'] * 1.0
        )
        y = base_yield + yield_modifier + np.random.normal(0, 0.5, n_samples)

        return X, np.maximum(y, 0)  # Ensure non-negative yields

if __name__ == "__main__":
    # Example usage
    model = YieldPredictionModel()

    # Generate sample data
    X_train, y_train = model.generate_sample_data(1000)

    # Train model
    print("Training yield prediction model...")
    model.train(X_train, y_train)

    # Test prediction
    sample_features = np.array([5.0, 0.8, 900.0, 24.0, 2.0, 1.0, 3.0, 15.0, 1.0, 0.5])
    result = model.predict(sample_features)
    print(f"Sample prediction: {result}")