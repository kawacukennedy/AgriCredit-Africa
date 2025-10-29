// API utility functions for communicating with the backend

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface CreditScoringRequest {
  crop_type: string;
  farm_size: number;
  location: string;
  historical_data?: Record<string, any>;
  mobile_money_usage?: number;
  cooperative_membership?: boolean;
}

export interface YieldPredictionRequest {
  crop_type: string;
  farm_size: number;
  location: string;
  weather_data?: Record<string, any>;
  soil_quality?: number;
  irrigation_access?: boolean;
}

export interface CreditScoringResponse {
  status: string;
  data: {
    credit_score: number;
    risk_level: string;
    confidence: number;
    explanation: string;
  };
}

export interface YieldPredictionResponse {
  status: string;
  data: {
    predicted_yield: number;
    confidence: number;
    explanation: string;
  };
}

export async function getCreditScore(request: CreditScoringRequest): Promise<CreditScoringResponse> {
  const response = await fetch(`${API_BASE_URL}/credit-scoring`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Credit scoring failed: ${response.statusText}`);
  }

  return response.json();
}

export async function getYieldPrediction(request: YieldPredictionRequest): Promise<YieldPredictionResponse> {
  const response = await fetch(`${API_BASE_URL}/yield-prediction`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Yield prediction failed: ${response.statusText}`);
  }

  return response.json();
}

export async function trainModels(): Promise<{ status: string; message: string }> {
  const response = await fetch(`${API_BASE_URL}/train-models`, {
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error(`Model training failed: ${response.statusText}`);
  }

  return response.json();
}

export async function healthCheck(): Promise<{ status: string; service: string }> {
  const response = await fetch(`${API_BASE_URL}/health`);

  if (!response.ok) {
    throw new Error(`Health check failed: ${response.statusText}`);
  }

  return response.json();
}