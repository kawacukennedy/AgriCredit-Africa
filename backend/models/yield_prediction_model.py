import numpy as np
import os

class YieldPredictionModel:
    def __init__(self):
        self.weights = None
        self.bias = None
        self.model_path = os.path.join(os.path.dirname(__file__), 'yield_model.npy')

    def build_model(self):
        """Initialize simple linear regression weights for yield prediction"""
        # Weights for each feature based on agricultural knowledge
        self.weights = np.array([
            0.1,   # farm_size
            2.0,   # soil_quality
            0.001, # rainfall (mm/year)
            -0.05, # temperature (optimal around 25C)
            0.5,   # fertilizer_usage
            0.5,   # pest_control
            0.2,   # crop_variety
            0.02,  # farming_experience
            1.0,   # irrigation_access
            -0.1   # market_distance (closer is better)
        ])
        self.bias = 4.0  # Base yield
        return self

    def train(self, X_train, y_train):
        """Simple training - just set predefined weights"""
        if self.weights is None:
            self.build_model()

        # Calculate predictions
        predictions = self._predict(X_train)

        # Simple R² calculation
        ss_res = np.sum((y_train - predictions) ** 2)
        ss_tot = np.sum((y_train - np.mean(y_train)) ** 2)
        r2 = 1 - (ss_res / ss_tot)

        print(f"Training R²: {r2:.4f}")

        # Save model
        self.save_model()

        return {"r2": r2}

    def predict(self, features):
        """Predict crop yield for given features"""
        if self.weights is None:
            self.load_model()

        # Ensure features is 2D
        if len(features.shape) == 1:
            features = features.reshape(1, -1)

        # Get prediction
        prediction = self._predict(features)[0]

        # Calculate simple confidence interval
        std_dev = 0.5  # Fixed std dev for simplicity
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

    def _predict(self, X):
        """Internal prediction method"""
        return np.dot(X, self.weights) + self.bias

    def _get_important_factors(self, features):
        """Get the most important factors affecting yield"""
        feature_names = [
            'farm_size', 'soil_quality', 'rainfall', 'temperature',
            'fertilizer_usage', 'pest_control', 'crop_variety',
            'farming_experience', 'irrigation_access', 'market_distance'
        ]

        # Return top factors based on weights
        weights_dict = dict(zip(feature_names, self.weights))
        sorted_factors = sorted(weights_dict.items(), key=lambda x: abs(x[1]), reverse=True)
        return [factor[0] for factor in sorted_factors[:3]]

    def save_model(self):
        """Save model weights"""
        if self.weights is not None:
            np.save(self.model_path, np.concatenate([self.weights, [self.bias]]))

    def load_model(self):
        """Load model weights"""
        if os.path.exists(self.model_path):
            params = np.load(self.model_path)
            self.weights = params[:-1]
            self.bias = params[-1]

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