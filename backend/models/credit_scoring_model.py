import numpy as np
import pandas as pd
import os
import json
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional, Tuple
import logging

logger = logging.getLogger(__name__)

class CreditScoringModel:
    """Advanced AI Credit Scoring Model with explainability and federated learning"""

    def __init__(self):
        self.model_path = os.path.join(os.path.dirname(__file__), 'credit_model.npy')
        self.metadata_path = os.path.join(os.path.dirname(__file__), 'credit_model_metadata.json')
        self.weights = None
        self.bias = None
        self.feature_names = [
            'farm_size', 'historical_repayment_rate', 'mobile_money_usage',
            'satellite_ndvi', 'weather_risk', 'cooperative_membership',
            'loan_history', 'income_stability', 'location_risk', 'crop_diversity',
            'soil_quality', 'irrigation_access', 'market_distance', 'digital_literacy'
        ]
        self.metadata = {
            'version': '2.0.0',
            'training_samples': 0,
            'last_trained': None,
            'accuracy': 0.0,
            'features': self.feature_names,
            'federated_rounds': 0
        }

    def build_model(self):
        """Initialize advanced model with more features"""
        n_features = len(self.feature_names)
        # Initialize with small random weights
        np.random.seed(42)
        self.weights = np.random.normal(0, 0.1, n_features)
        self.bias = 0.0
        return self

    def train(self, X_train: np.ndarray, y_train: np.ndarray,
              federated: bool = False, client_id: Optional[str] = None) -> Dict[str, Any]:
        """Advanced training with federated learning support"""
        if self.weights is None:
            self.build_model()

        # Ensure X_train has correct shape
        if len(X_train.shape) == 1:
            X_train = X_train.reshape(-1, 1)
        if X_train.shape[1] != len(self.feature_names):
            # Pad or truncate features
            if X_train.shape[1] < len(self.feature_names):
                padding = np.zeros((X_train.shape[0], len(self.feature_names) - X_train.shape[1]))
                X_train = np.hstack([X_train, padding])
            else:
                X_train = X_train[:, :len(self.feature_names)]

        # Simple gradient descent training
        learning_rate = 0.01
        n_epochs = 100

        for epoch in range(n_epochs):
            # Forward pass
            predictions = self._predict_proba(X_train)

            # Compute loss (binary cross-entropy)
            epsilon = 1e-15
            predictions = np.clip(predictions, epsilon, 1 - epsilon)
            loss = -np.mean(y_train * np.log(predictions) + (1 - y_train) * np.log(1 - predictions))

            # Backward pass
            errors = predictions - y_train.reshape(-1, 1)
            weight_gradients = np.dot(X_train.T, errors).flatten() / len(X_train)
            bias_gradient = np.mean(errors)

            # Update weights
            self.weights -= learning_rate * weight_gradients
            self.bias -= learning_rate * bias_gradient

            if epoch % 20 == 0:
                logger.info(f"Epoch {epoch}, Loss: {loss:.4f}")

        # Calculate final metrics
        final_predictions = self._predict_proba(X_train)
        binary_pred = (final_predictions.flatten() > 0.5).astype(int)
        accuracy = np.mean(binary_pred == y_train)

        # Update metadata
        self.metadata['training_samples'] += len(X_train)
        self.metadata['last_trained'] = datetime.utcnow().isoformat()
        self.metadata['accuracy'] = accuracy
        if federated:
            self.metadata['federated_rounds'] += 1

        # Save model
        self.save_model()

        logger.info(f"Training completed. Accuracy: {accuracy:.4f}")

        return {
            "accuracy": accuracy,
            "loss": loss,
            "federated": federated,
            "client_id": client_id
        }

    def predict(self, features: np.ndarray) -> Dict[str, Any]:
        """Advanced prediction with explainability"""
        if self.weights is None:
            self.load_model()

        # Ensure features is correct shape
        if isinstance(features, list):
            features = np.array(features)
        if len(features.shape) == 1:
            features = features.reshape(1, -1)

        # Pad features if necessary
        if features.shape[1] < len(self.feature_names):
            padding = np.zeros((features.shape[0], len(self.feature_names) - features.shape[1]))
            features = np.hstack([features, padding])

        # Get prediction
        prediction_proba = self._predict_proba(features)[0][0]

        # Convert to credit score (300-850 range)
        credit_score = 300 + (prediction_proba * 550)

        # Determine risk level and trust score
        if credit_score >= 750:
            risk_level = "Low"
            trust_score = 3
        elif credit_score >= 650:
            risk_level = "Medium"
            trust_score = 2
        else:
            risk_level = "High"
            trust_score = 1

        # Generate explainability
        explanation = self._generate_shap_explanation(features[0])

        # Confidence interval
        confidence_interval = self._calculate_confidence_interval(features[0])

        return {
            "credit_score": round(credit_score, 0),
            "risk_level": risk_level,
            "trust_score": trust_score,
            "confidence": float(prediction_proba),
            "confidence_interval": confidence_interval,
            "explainability": explanation,
            "model_version": self.metadata.get('version', '1.0.0'),
            "prediction_timestamp": datetime.utcnow().isoformat()
        }

    def _predict_proba(self, X: np.ndarray) -> np.ndarray:
        """Internal prediction with sigmoid activation"""
        if self.weights is None:
            raise ValueError("Model weights not initialized")
        return 1 / (1 + np.exp(-(np.dot(X, self.weights) + self.bias)))

    def _generate_shap_explanation(self, features: np.ndarray) -> Dict[str, Any]:
        """Generate SHAP-like explanations"""
        explanations = []

        # Calculate feature contributions
        for i, feature_value in enumerate(features):
            if i < len(self.feature_names):
                feature_name = self.feature_names[i]
                contribution = feature_value * self.weights[i]

                # Determine if positive or negative factor
                if contribution > 0:
                    impact = "positive"
                    description = f"Good factor: {feature_name} contributes positively"
                else:
                    impact = "negative"
                    description = f"Area for improvement: {feature_name} reduces score"

                explanations.append({
                    "feature": feature_name,
                    "value": float(feature_value),
                    "contribution": float(contribution),
                    "impact": impact,
                    "description": description
                })

        # Sort by absolute contribution
        explanations.sort(key=lambda x: abs(x['contribution']), reverse=True)

        return {
            "method": "SHAP-like",
            "top_factors": explanations[:5],
            "summary": f"Top influencing factors: {', '.join([e['feature'] for e in explanations[:3]])}"
        }

    def _calculate_confidence_interval(self, features: np.ndarray) -> Tuple[float, float]:
        """Calculate prediction confidence interval"""
        # Simple approximation using model uncertainty
        base_prediction = self._predict_proba(features.reshape(1, -1))[0][0]

        # Estimate uncertainty based on feature variance
        feature_std = np.std(features)
        uncertainty = min(feature_std * 0.1, 0.2)  # Cap uncertainty

        lower_bound = max(0, base_prediction - uncertainty)
        upper_bound = min(1, base_prediction + uncertainty)

        return (float(lower_bound), float(upper_bound))

    def federated_update(self, client_updates: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Aggregate federated learning updates"""
        if not client_updates:
            return {"error": "No client updates provided"}

        # Simple federated averaging
        weight_updates = []
        bias_updates = []

        for update in client_updates:
            if 'weights' in update and 'bias' in update:
                weight_updates.append(update['weights'])
                bias_updates.append(update['bias'])

        if weight_updates:
            # Average weights
            avg_weights = np.mean(weight_updates, axis=0)
            avg_bias = np.mean(bias_updates)

            # Update global model
            self.weights = avg_weights
            self.bias = avg_bias

            self.metadata['federated_rounds'] += 1
            self.save_model()

            return {
                "status": "success",
                "clients_aggregated": len(client_updates),
                "new_global_weights": avg_weights.tolist(),
                "federated_round": self.metadata['federated_rounds']
            }

        return {"error": "Invalid client updates"}

    def continuous_retrain(self, new_data: Tuple[np.ndarray, np.ndarray]) -> Dict[str, Any]:
        """Continuous retraining with new data"""
        X_new, y_new = new_data

        # Combine with existing model knowledge (simplified)
        # In practice, you'd store historical data

        result = self.train(X_new, y_new, federated=False)

        return {
            "retraining_result": result,
            "samples_processed": len(X_new),
            "timestamp": datetime.utcnow().isoformat()
        }

    def save_model(self):
        """Save model weights and metadata"""
        if self.weights is not None:
            # Save weights
            np.save(self.model_path, np.concatenate([self.weights, [self.bias]]))

            # Save metadata
            with open(self.metadata_path, 'w') as f:
                json.dump(self.metadata, f, indent=2)

    def load_model(self):
        """Load model weights and metadata"""
        if os.path.exists(self.model_path):
            params = np.load(self.model_path)
            self.weights = params[:-1]
            self.bias = params[-1]

        if os.path.exists(self.metadata_path):
            with open(self.metadata_path, 'r') as f:
                self.metadata.update(json.load(f))

    def get_model_info(self) -> Dict[str, Any]:
        """Get model information and statistics"""
        return {
            "version": self.metadata.get('version', '1.0.0'),
            "features": self.feature_names,
            "training_samples": self.metadata.get('training_samples', 0),
            "accuracy": self.metadata.get('accuracy', 0.0),
            "last_trained": self.metadata.get('last_trained'),
            "federated_rounds": self.metadata.get('federated_rounds', 0),
            "model_type": "Logistic Regression with Explainability"
        }

    def generate_sample_data(self, n_samples: int = 1000) -> Tuple[np.ndarray, np.ndarray]:
        """Generate comprehensive sample training data"""
        np.random.seed(42)

        # Generate realistic agricultural credit data
        data = {
            'farm_size': np.random.normal(5, 2, n_samples),
            'historical_repayment_rate': np.random.beta(8, 2, n_samples),
            'mobile_money_usage': np.random.exponential(0.5, n_samples),
            'satellite_ndvi': np.random.normal(0.6, 0.1, n_samples),
            'weather_risk': np.random.beta(5, 2, n_samples),
            'cooperative_membership': np.random.binomial(1, 0.7, n_samples),
            'loan_history': np.random.poisson(2, n_samples),
            'income_stability': np.random.beta(6, 2, n_samples),
            'location_risk': np.random.beta(4, 3, n_samples),
            'crop_diversity': np.random.poisson(3, n_samples),
            'soil_quality': np.random.beta(7, 2, n_samples),
            'irrigation_access': np.random.binomial(1, 0.6, n_samples),
            'market_distance': np.random.exponential(1.0, n_samples),
            'digital_literacy': np.random.beta(5, 3, n_samples)
        }

        # Create feature matrix
        X = np.column_stack([
            data['farm_size'],
            data['historical_repayment_rate'],
            data['mobile_money_usage'],
            data['satellite_ndvi'],
            1 - data['weather_risk'],  # Invert (higher is better)
            data['cooperative_membership'],
            data['loan_history'],
            data['income_stability'],
            1 - data['location_risk'],  # Invert (higher is better)
            data['crop_diversity'],
            data['soil_quality'],
            data['irrigation_access'],
            1 / (1 + data['market_distance']),  # Invert distance (closer is better)
            data['digital_literacy']
        ])

        # Generate target based on complex relationships
        weights = np.array([0.08, 0.25, 0.08, 0.08, 0.08, 0.08, 0.04, 0.08, 0.04, 0.04,
                           0.06, 0.06, 0.06, 0.06])
        scores = np.dot(X, weights)

        # Add some non-linear effects
        non_linear_bonus = (data['cooperative_membership'] * data['digital_literacy'] * 0.1)
        scores += non_linear_bonus

        y = (scores > np.percentile(scores, 60)).astype(int)  # Top 40% get good credit

        return X, y

if __name__ == "__main__":
    # Example usage
    model = CreditScoringModel()

    # Generate sample data
    X_train, y_train = model.generate_sample_data(1000)

    # Train model
    print("Training advanced credit scoring model...")
    result = model.train(X_train, y_train)
    print(f"Training result: {result}")

    # Test prediction
    sample_features = np.array([5.0, 0.9, 10.0, 0.7, 0.2, 1.0, 3.0, 0.85, 0.1, 4.0,
                               0.8, 1.0, 0.5, 0.9])
    prediction = model.predict(sample_features)
    print(f"Sample prediction: {prediction}")

    # Get model info
    info = model.get_model_info()
    print(f"Model info: {info}")