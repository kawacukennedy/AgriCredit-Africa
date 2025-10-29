import tensorflow as tf
import numpy as np
from sklearn.preprocessing import StandardScaler
import joblib
import os

class CreditScoringModel:
    def __init__(self):
        self.model = None
        self.scaler = None
        self.model_path = os.path.join(os.path.dirname(__file__), 'credit_model.h5')
        self.scaler_path = os.path.join(os.path.dirname(__file__), 'credit_scaler.pkl')

    def build_model(self):
        """Build the neural network model for credit scoring"""
        model = tf.keras.Sequential([
            tf.keras.layers.Dense(64, activation='relu', input_shape=(10,)),
            tf.keras.layers.Dropout(0.2),
            tf.keras.layers.Dense(32, activation='relu'),
            tf.keras.layers.Dropout(0.2),
            tf.keras.layers.Dense(16, activation='relu'),
            tf.keras.layers.Dense(1, activation='sigmoid')  # Binary classification: good/bad credit
        ])

        model.compile(
            optimizer='adam',
            loss='binary_crossentropy',
            metrics=['accuracy', tf.keras.metrics.AUC()]
        )

        self.model = model
        return model

    def train(self, X_train, y_train, epochs=100, batch_size=32):
        """Train the model with training data"""
        if self.model is None:
            self.build_model()

        # Normalize features
        self.scaler = StandardScaler()
        X_train_scaled = self.scaler.fit_transform(X_train)

        # Train model
        history = self.model.fit(
            X_train_scaled, y_train,
            epochs=epochs,
            batch_size=batch_size,
            validation_split=0.2,
            verbose=1
        )

        # Save model and scaler
        self.save_model()

        return history

    def predict(self, features):
        """Predict credit score for given features"""
        if self.model is None:
            self.load_model()

        # Ensure features is 2D
        if len(features.shape) == 1:
            features = features.reshape(1, -1)

        # Scale features
        features_scaled = self.scaler.transform(features)

        # Get prediction probability
        prediction = self.model.predict(features_scaled)[0][0]

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

    def _generate_explanation(self, features, prediction):
        """Generate human-readable explanation"""
        feature_names = [
            'farm_size', 'historical_repayment_rate', 'mobile_money_usage',
            'satellite_ndvi', 'weather_risk', 'cooperative_membership',
            'loan_history', 'income_stability', 'location_risk', 'crop_diversity'
        ]

        explanations = []
        for i, feature in enumerate(features[0]):
            if feature > np.mean(features):  # Above average
                explanations.append(f"Positive factor: {feature_names[i]}")
            else:
                explanations.append(f"Area for improvement: {feature_names[i]}")

        return explanations[:3]  # Top 3 factors

    def save_model(self):
        """Save model and scaler"""
        if self.model:
            self.model.save(self.model_path)
        if self.scaler:
            joblib.dump(self.scaler, self.scaler_path)

    def load_model(self):
        """Load model and scaler"""
        if os.path.exists(self.model_path):
            self.model = tf.keras.models.load_model(self.model_path)
        if os.path.exists(self.scaler_path):
            self.scaler = joblib.load(self.scaler_path)

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
    model.train(X_train, y_train, epochs=50)

    # Test prediction
    sample_features = np.array([5.0, 0.9, 10.0, 0.7, 0.8, 1.0, 3.0, 0.85, 0.9, 4.0])
    result = model.predict(sample_features)
    print(f"Sample prediction: {result}")