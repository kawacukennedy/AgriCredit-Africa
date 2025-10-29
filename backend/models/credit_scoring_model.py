import numpy as np
import os

class CreditScoringModel:
    def __init__(self):
        self.weights = None
        self.bias = None
        self.model_path = os.path.join(os.path.dirname(__file__), 'credit_model.npy')

    def build_model(self):
        """Initialize simple linear model weights"""
        # Simple weights for each feature based on importance
        self.weights = np.array([
            0.1,  # farm_size
            0.3,  # historical_repayment_rate
            0.1,  # mobile_money_usage
            0.1,  # satellite_ndvi
            -0.1, # weather_risk (negative because higher risk is bad)
            0.1,  # cooperative_membership
            0.05, # loan_history
            0.1,  # income_stability
            -0.05,# location_risk (negative)
            0.05  # crop_diversity
        ])
        self.bias = 0.5
        return self

    def train(self, X_train, y_train):
        """Simple training - just set predefined weights"""
        if self.weights is None:
            self.build_model()

        # Calculate predictions
        predictions = self._predict_proba(X_train)

        # Simple accuracy calculation
        binary_pred = (predictions > 0.5).astype(int)
        accuracy = np.mean(binary_pred == y_train)

        print(f"Training Accuracy: {accuracy:.4f}")

        # Save model
        self.save_model()

        return {"accuracy": accuracy}

    def predict(self, features):
        """Predict credit score for given features"""
        if self.weights is None:
            self.load_model()

        # Ensure features is 2D
        if len(features.shape) == 1:
            features = features.reshape(1, -1)

        # Get prediction probability
        prediction = self._predict_proba(features)[0]

        # Convert to credit score (300-850 range)
        credit_score = 300 + (prediction * 550)

        # Determine risk level
        if credit_score >= 750:
            risk_level = "Low"
            trust_score = 3
        elif credit_score >= 650:
            risk_level = "Medium"
            trust_score = 2
        else:
            risk_level = "High"
            trust_score = 1

        return {
            "credit_score": round(credit_score, 0),
            "risk_level": risk_level,
            "trust_score": trust_score,
            "confidence": float(prediction),
            "explainability": self._generate_explanation(features, prediction)
        }

    def _predict_proba(self, X):
        """Internal prediction method"""
        return 1 / (1 + np.exp(-(np.dot(X, self.weights) + self.bias)))

    def _generate_explanation(self, features, prediction):
        """Generate human-readable explanation"""
        feature_names = [
            'farm_size', 'historical_repayment_rate', 'mobile_money_usage',
            'satellite_ndvi', 'weather_risk', 'cooperative_membership',
            'loan_history', 'income_stability', 'location_risk', 'crop_diversity'
        ]

        explanations = []
        for i, feature in enumerate(features[0]):
            weight = self.weights[i]
            if weight > 0 and feature > 0.5:  # Positive weight and above average
                explanations.append(f"Positive factor: {feature_names[i]}")
            elif weight < 0 and feature < 0.5:  # Negative weight and below average (good)
                explanations.append(f"Positive factor: {feature_names[i]}")
            elif weight > 0 and feature < 0.5:
                explanations.append(f"Area for improvement: {feature_names[i]}")
            elif weight < 0 and feature > 0.5:
                explanations.append(f"Area for improvement: {feature_names[i]}")

        return explanations[:3]  # Top 3 factors

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

        # Generate realistic agricultural credit data
        data = {
            'farm_size': np.random.normal(5, 2, n_samples),  # hectares
            'historical_repayment_rate': np.random.beta(8, 2, n_samples),  # 0-1
            'mobile_money_usage': np.random.exponential(0.5, n_samples),  # transactions/month
            'satellite_ndvi': np.random.normal(0.6, 0.1, n_samples),  # vegetation index
            'weather_risk': np.random.beta(5, 2, n_samples),  # 0-1 (lower is better)
            'cooperative_membership': np.random.binomial(1, 0.7, n_samples),  # 0 or 1
            'loan_history': np.random.poisson(2, n_samples),  # number of previous loans
            'income_stability': np.random.beta(6, 2, n_samples),  # 0-1
            'location_risk': np.random.beta(4, 3, n_samples),  # 0-1 (lower is better)
            'crop_diversity': np.random.poisson(3, n_samples)  # number of crop types
        }

        # Create feature matrix
        X = np.column_stack([
            data['farm_size'],
            data['historical_repayment_rate'],
            data['mobile_money_usage'],
            data['satellite_ndvi'],
            1 - data['weather_risk'],  # Invert weather risk (higher is better)
            data['cooperative_membership'],
            data['loan_history'],
            data['income_stability'],
            1 - data['location_risk'],  # Invert location risk
            data['crop_diversity']
        ])

        # Generate target (good credit = 1, bad credit = 0)
        # Based on weighted combination of features
        weights = np.array([0.1, 0.3, 0.1, 0.1, 0.1, 0.1, 0.05, 0.1, 0.05, 0.05])
        scores = np.dot(X, weights)
        y = (scores > np.median(scores)).astype(int)

        return X, y

if __name__ == "__main__":
    # Example usage
    model = CreditScoringModel()

    # Generate sample data
    X_train, y_train = model.generate_sample_data(1000)

    # Train model
    print("Training credit scoring model...")
    model.train(X_train, y_train)

    # Test prediction
    sample_features = np.array([5.0, 0.9, 10.0, 0.7, 0.8, 1.0, 3.0, 0.85, 0.9, 4.0])
    result = model.predict(sample_features)
    print(f"Sample prediction: {result}")