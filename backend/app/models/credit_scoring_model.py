"""
Credit Scoring Model for AgriCredit
Uses machine learning to assess farmer creditworthiness
"""

import numpy as np
import pandas as pd
import joblib
import os
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import xgboost as xgb
import lightgbm as lgb
from typing import Dict, List, Any, Tuple
import logging

logger = logging.getLogger(__name__)

class CreditScoringModel:
    """Machine learning model for credit scoring"""

    def __init__(self):
        self.model = None
        self.scaler = None
        self.feature_names = [
            'farm_size', 'repayment_rate', 'mobile_money_usage',
            'satellite_ndvi', 'weather_risk', 'cooperative_membership',
            'loan_history', 'income_stability', 'location_risk', 'crop_diversity'
        ]
        self.model_path = os.path.join(os.path.dirname(__file__), 'credit_model.pkl')
        self.scaler_path = os.path.join(os.path.dirname(__file__), 'credit_scaler.pkl')

        # Load or train model
        self._load_or_train_model()

    def _load_or_train_model(self):
        """Load existing model or train new one"""
        try:
            if os.path.exists(self.model_path) and os.path.exists(self.scaler_path):
                self.model = joblib.load(self.model_path)
                self.scaler = joblib.load(self.scaler_path)
                logger.info("Loaded existing credit scoring model")
            else:
                self._train_model()
        except Exception as e:
            logger.warning(f"Failed to load model: {e}. Training new model.")
            self._train_model()

    def _train_model(self):
        """Train the credit scoring model with synthetic data"""
        # Generate synthetic training data
        np.random.seed(42)
        n_samples = 10000

        # Generate realistic agricultural data
        data = {
            'farm_size': np.random.uniform(0.5, 50, n_samples),  # hectares
            'repayment_rate': np.random.beta(2, 1, n_samples),  # 0-1
            'mobile_money_usage': np.random.exponential(10, n_samples),  # transactions/month
            'satellite_ndvi': np.random.normal(0.6, 0.1, n_samples),  # vegetation index
            'weather_risk': np.random.beta(1, 2, n_samples),  # 0-1 (lower is better)
            'cooperative_membership': np.random.choice([0, 1], n_samples, p=[0.7, 0.3]),
            'loan_history': np.random.poisson(2, n_samples),  # previous loans
            'income_stability': np.random.beta(2, 1, n_samples),  # 0-1
            'location_risk': np.random.beta(1, 3, n_samples),  # 0-1 (lower is better)
            'crop_diversity': np.random.poisson(3, n_samples)  # number of crops
        }

        df = pd.DataFrame(data)

        # Calculate credit score based on features (simplified model)
        credit_score = (
            df['repayment_rate'] * 200 +
            df['income_stability'] * 150 +
            (1 - df['weather_risk']) * 100 +
            (1 - df['location_risk']) * 100 +
            df['cooperative_membership'] * 50 +
            np.minimum(df['loan_history'], 5) * 20 +
            np.minimum(df['mobile_money_usage'] / 10, 1) * 80 +
            df['satellite_ndvi'] * 100 +
            np.minimum(df['farm_size'] / 10, 1) * 50 +
            np.minimum(df['crop_diversity'] / 5, 1) * 50
        ).astype(int)

        # Convert to FICO-like scale (300-850)
        credit_score = np.clip(credit_score, 300, 850)

        # Create risk levels
        df['credit_score'] = credit_score
        df['risk_level'] = pd.cut(
            df['credit_score'],
            bins=[0, 579, 669, 739, 799, 850],
            labels=['Very High', 'High', 'Medium', 'Low', 'Very Low']
        )

        # Prepare features and target
        X = df[self.feature_names].values
        y = (df['credit_score'] >= 580).astype(int)  # Binary classification for approval

        # Split data
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

        # Scale features
        self.scaler = StandardScaler()
        X_train_scaled = self.scaler.fit_transform(X_train)

        # Train model (using XGBoost for better performance)
        self.model = xgb.XGBClassifier(
            n_estimators=100,
            max_depth=6,
            learning_rate=0.1,
            random_state=42,
            n_jobs=-1
        )

        self.model.fit(X_train_scaled, y_train)

        # Evaluate
        X_test_scaled = self.scaler.transform(X_test)
        y_pred = self.model.predict(X_test_scaled)
        accuracy = accuracy_score(y_test, y_pred)

        logger.info(f"Credit scoring model trained with accuracy: {accuracy:.3f}")

        # Save model
        joblib.dump(self.model, self.model_path)
        joblib.dump(self.scaler, self.scaler_path)

    def predict(self, features: List[float]) -> Dict[str, Any]:
        """
        Predict credit score and risk assessment

        Args:
            features: List of features in order:
                [farm_size, repayment_rate, mobile_money_usage, satellite_ndvi,
                 weather_risk, cooperative_membership, loan_history, income_stability,
                 location_risk, crop_diversity]

        Returns:
            Dict with credit_score, risk_level, trust_score, confidence, explainability
        """
        try:
            # Validate input
            if len(features) != len(self.feature_names):
                raise ValueError(f"Expected {len(self.feature_names)} features, got {len(features)}")

            # Scale features
            features_scaled = self.scaler.transform([features])

            # Get prediction probability
            prob_approved = self.model.predict_proba(features_scaled)[0][1]

            # Calculate credit score (300-850 range)
            credit_score = int(300 + (prob_approved * 550))

            # Determine risk level
            if credit_score >= 800:
                risk_level = "Very Low"
                trust_score = 5
            elif credit_score >= 740:
                risk_level = "Low"
                trust_score = 4
            elif credit_score >= 670:
                risk_level = "Medium"
                trust_score = 3
            elif credit_score >= 580:
                risk_level = "High"
                trust_score = 2
            else:
                risk_level = "Very High"
                trust_score = 1

            # Calculate confidence based on feature consistency
            confidence = min(95, max(60, prob_approved * 100))

            # Generate explainability factors
            explainability = self._generate_explanation(features, credit_score)

            return {
                'credit_score': credit_score,
                'risk_level': risk_level,
                'trust_score': trust_score,
                'confidence': confidence,
                'explainability': explainability
            }

        except Exception as e:
            logger.error(f"Credit scoring prediction failed: {e}")
            # Return conservative default
            return {
                'credit_score': 500,
                'risk_level': 'High',
                'trust_score': 2,
                'confidence': 50,
                'explainability': ['Unable to assess creditworthiness']
            }

    def _generate_explanation(self, features: List[float], score: int) -> List[str]:
        """Generate human-readable explanation for the credit score"""
        explanations = []

        feature_values = dict(zip(self.feature_names, features))

        if feature_values['repayment_rate'] > 0.8:
            explanations.append("Strong repayment history")
        elif feature_values['repayment_rate'] < 0.5:
            explanations.append("Limited repayment history")

        if feature_values['income_stability'] > 0.8:
            explanations.append("Stable income sources")
        elif feature_values['income_stability'] < 0.5:
            explanations.append("Variable income sources")

        if feature_values['cooperative_membership'] == 1:
            explanations.append("Cooperative membership provides additional credibility")

        if feature_values['mobile_money_usage'] > 15:
            explanations.append("High mobile money usage indicates financial activity")

        if feature_values['satellite_ndvi'] > 0.7:
            explanations.append("Healthy vegetation index from satellite data")
        elif feature_values['satellite_ndvi'] < 0.4:
            explanations.append("Low vegetation index may indicate farming challenges")

        if feature_values['weather_risk'] > 0.7:
            explanations.append("High weather risk may affect repayment ability")

        if score >= 740:
            explanations.append("Overall excellent credit profile")
        elif score >= 670:
            explanations.append("Overall good credit profile")
        elif score >= 580:
            explanations.append("Overall fair credit profile")
        else:
            explanations.append("Overall poor credit profile - additional verification recommended")

        return explanations[:5]  # Limit to top 5 factors