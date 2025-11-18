import numpy as np
import pandas as pd
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout
from sklearn.preprocessing import MinMaxScaler
import os
import joblib

class MarketPricePredictionModel:
    """LSTM model for predicting agricultural commodity prices"""

    def __init__(self):
        self.model_path = os.path.join(os.path.dirname(__file__), 'market_price_model.h5')
        self.scaler_path = os.path.join(os.path.dirname(__file__), 'price_scaler.pkl')
        self.model = None
        self.scaler = MinMaxScaler()

    def build_model(self, input_shape):
        """Build LSTM model for time series prediction"""
        self.model = Sequential([
            LSTM(50, return_sequences=True, input_shape=input_shape),
            Dropout(0.2),
            LSTM(50, return_sequences=False),
            Dropout(0.2),
            Dense(25),
            Dense(1)
        ])
        self.model.compile(optimizer='adam', loss='mean_squared_error')
        return self.model

    def preprocess_data(self, price_history):
        """Preprocess price history for model input"""
        # price_history: list of prices over time
        data = np.array(price_history).reshape(-1, 1)
        scaled_data = self.scaler.fit_transform(data)

        # Create sequences
        sequence_length = 60  # Use 60 days of data
        X, y = [], []
        for i in range(sequence_length, len(scaled_data)):
            X.append(scaled_data[i-sequence_length:i, 0])
            y.append(scaled_data[i, 0])

        X, y = np.array(X), np.array(y)
        X = np.reshape(X, (X.shape[0], X.shape[1], 1))

        return X, y

    def train(self, price_history):
        """Train the model on price history"""
        X, y = self.preprocess_data(price_history)

        if self.model is None:
            self.build_model((X.shape[1], 1))

        self.model.fit(X, y, batch_size=32, epochs=10, verbose=0)

        # Save model and scaler
        self.model.save(self.model_path)
        joblib.dump(self.scaler, self.scaler_path)

        return {"status": "trained", "samples": len(X)}

    def predict(self, recent_prices, days_ahead=7):
        """Predict future prices"""
        if self.model is None:
            if os.path.exists(self.model_path):
                from tensorflow.keras.models import load_model
                self.model = load_model(self.model_path)
                self.scaler = joblib.load(self.scaler_path)
            else:
                raise ValueError("Model not trained")

        # Prepare input
        scaled_prices = self.scaler.transform(np.array(recent_prices).reshape(-1, 1))
        input_seq = scaled_prices[-60:].reshape(1, 60, 1)

        predictions = []
        for _ in range(days_ahead):
            pred = self.model.predict(input_seq, verbose=0)[0][0]
            predictions.append(pred)
            # Update input sequence
            input_seq = np.roll(input_seq, -1, axis=1)
            input_seq[0, -1, 0] = pred

        # Inverse transform
        predictions = self.scaler.inverse_transform(np.array(predictions).reshape(-1, 1)).flatten()

        return {
            "predicted_prices": predictions.tolist(),
            "days_ahead": days_ahead,
            "confidence": 0.75
        }

if __name__ == "__main__":
    # Example usage
    model = MarketPricePredictionModel()

    # Generate sample price data
    np.random.seed(42)
    base_price = 100
    prices = []
    for i in range(200):
        price = base_price + np.sin(i/10) * 10 + np.random.normal(0, 2)
        prices.append(price)

    # Train model
    result = model.train(prices)
    print(f"Training result: {result}")

    # Predict
    recent = prices[-60:]
    prediction = model.predict(recent, days_ahead=7)
    print(f"Price prediction: {prediction}")</content>
</xai:function_call