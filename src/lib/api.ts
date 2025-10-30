// Enhanced API utility functions for communicating with the backend

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const GRAPHQL_URL = `${API_BASE_URL}/graphql`;
const WS_URL = API_BASE_URL.replace('http', 'ws');

// Authentication token management
let authToken: string | null = null;

// Offline support
let isOnline = true;
const CACHE_PREFIX = 'agricredit_cache_';
const CACHE_EXPIRY = 1000 * 60 * 30; // 30 minutes

// Check online status
if (typeof window !== 'undefined') {
  isOnline = navigator.onLine;
  window.addEventListener('online', () => { isOnline = true; });
  window.addEventListener('offline', () => { isOnline = false; });
}

export const setAuthToken = (token: string | null) => {
  authToken = token;
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }
};

export const getAuthToken = (): string | null => {
  if (authToken) return authToken;
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token');
  }
  return null;
};

// Cache management
const setCache = (key: string, data: any) => {
  if (typeof window === 'undefined') return;
  const cacheData = {
    data,
    timestamp: Date.now()
  };
  localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(cacheData));
};

const getCache = (key: string): any | null => {
  if (typeof window === 'undefined') return null;
  const cached = localStorage.getItem(CACHE_PREFIX + key);
  if (!cached) return null;

  try {
    const cacheData = JSON.parse(cached);
    if (Date.now() - cacheData.timestamp > CACHE_EXPIRY) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }
    return cacheData.data;
  } catch {
    return null;
  }
};

export const isOffline = () => !isOnline;

// GraphQL client
const graphqlRequest = async (query: string, variables: Record<string, any> = {}): Promise<any> => {
  const token = getAuthToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.errors?.[0]?.message || `GraphQL error: ${response.status}`);
  }

  const result = await response.json();

  if (result.errors) {
    throw new Error(result.errors[0].message);
  }

  return result.data;
};

// WebSocket connection management
class WebSocketManager {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 1000;
  private messageHandlers: Map<string, (data: any) => void> = new Map();

  connect(userId: number, channel: string = 'general') {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    const wsUrl = `${WS_URL}/ws/${userId}?channel=${channel}`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          const handler = this.messageHandlers.get(message.type);
          if (handler) {
            handler(message.data);
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.attemptReconnect(userId, channel);
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      this.attemptReconnect(userId, channel);
    }
  }

  private attemptReconnect(userId: number, channel: string) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return;

    this.reconnectAttempts++;
    setTimeout(() => {
      console.log(`Attempting WebSocket reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      this.connect(userId, channel);
    }, this.reconnectInterval * this.reconnectAttempts);
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  onMessage(type: string, handler: (data: any) => void) {
    this.messageHandlers.set(type, handler);
  }

  sendMessage(type: string, data: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, data }));
    }
  }
}

export const websocketManager = new WebSocketManager();

// Generic API request helper
const apiRequest = async (
  endpoint: string,
  options: RequestInit = {},
  timeout: number = 10000
): Promise<any> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  const url = `${API_BASE_URL}${endpoint}`;
  const token = getAuthToken();

  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
    throw new Error('Network error');
  }
};

// User Management Interfaces
export interface User {
  id: number;
  email: string;
  username: string;
  full_name?: string;
  phone?: string;
  location?: string;
  farm_size?: number;
  is_active: boolean;
  is_verified: boolean;
  role: string;
  created_at: string;
  updated_at?: string;
}

export interface UserCreate {
  email: string;
  username: string;
  password: string;
  full_name?: string;
  phone?: string;
  location?: string;
  farm_size?: number;
}

export interface UserUpdate {
  full_name?: string;
  phone?: string;
  location?: string;
  farm_size?: number;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface Token {
  access_token: string;
  token_type: string;
}

// Sensor Device Interfaces
export interface SensorDevice {
  id: number;
  device_id: string;
  name?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  crop_type?: string;
  farm_size?: number;
  owner_id: number;
  is_active: boolean;
  last_seen?: string;
  created_at: string;
}

export interface SensorDeviceCreate {
  device_id: string;
  name?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  crop_type?: string;
  farm_size?: number;
}

export interface SensorReading {
  id: number;
  device_id: string;
  soil_moisture: number;
  temperature: number;
  humidity: number;
  light_level: number;
  ph_level?: number;
  nitrogen?: number;
  phosphorus?: number;
  potassium?: number;
  rainfall?: number;
  wind_speed?: number;
  solar_radiation?: number;
  timestamp: string;
}

export interface SensorReadingCreate {
  device_id: string;
  soil_moisture: number;
  temperature: number;
  humidity: number;
  light_level: number;
  ph_level?: number;
  nitrogen?: number;
  phosphorus?: number;
  potassium?: number;
  rainfall?: number;
  wind_speed?: number;
  solar_radiation?: number;
  timestamp?: string;
}

// AI Model Interfaces
export interface CreditScoringRequest {
  crop_type: string;
  farm_size: number;
  location: string;
  historical_data?: Record<string, any>;
  mobile_money_usage?: number;
  cooperative_membership?: boolean;
}

export interface CreditScore {
  id: number;
  user_id: number;
  score: number;
  risk_level: string;
  trust_score: number;
  confidence: number;
  explanation: string[];
  created_at: string;
}

export interface YieldPredictionRequest {
  crop_type: string;
  farm_size: number;
  location: string;
  weather_data?: Record<string, any>;
  soil_quality?: number;
  irrigation_access?: boolean;
}

export interface YieldPrediction {
  id: number;
  user_id: number;
  crop_type: string;
  predicted_yield: number;
  unit: string;
  confidence_interval_lower: number;
  confidence_interval_upper: number;
  important_factors: string[];
  created_at: string;
}

export interface ClimateAnalysisRequest {
  satellite_data: Record<string, any>;
  iot_sensors?: Record<string, any>;
}

export interface ClimateAnalysis {
  id: number;
  user_id?: number;
  co2_sequestered: number;
  ndvi_score: number;
  carbon_tokens_mintable: number;
  recommendations: string[];
  confidence: number;
  created_at: string;
}

// Loan Interfaces
export interface Loan {
  id: number;
  user_id: number;
  amount: number;
  interest_rate: number;
  duration_months: number;
  status: string;
  purpose?: string;
  repayment_schedule?: Record<string, any>;
  created_at: string;
  approved_at?: string;
  disbursed_at?: string;
}

export interface LoanCreate {
  amount: number;
  interest_rate: number;
  duration_months: number;
  purpose?: string;
}

// Marketplace Interfaces
export interface MarketplaceListing {
  id: number;
  seller_id: number;
  title: string;
  description?: string;
  crop_type: string;
  quantity: number;
  unit: string;
  price_per_unit: number;
  location?: string;
  quality_grade?: string;
  harvest_date?: string;
  expiry_date?: string;
  status: string;
  images?: string[];
  created_at: string;
}

export interface MarketplaceListingCreate {
  title: string;
  description?: string;
  crop_type: string;
  quantity: number;
  unit: string;
  price_per_unit: number;
  location?: string;
  quality_grade?: string;
  harvest_date?: string;
  expiry_date?: string;
}

// Notification Interfaces
export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  data?: Record<string, any>;
  created_at: string;
}

// Carbon Credit Interfaces
export interface CarbonCredit {
  id: number;
  user_id: number;
  amount: number;
  transaction_type: string;
  transaction_hash?: string;
  verification_proof?: Record<string, any>;
  created_at: string;
}

// Legacy interfaces for backward compatibility
export interface IoTSensorData {
  device_id: string;
  soil_moisture: number;
  temperature: number;
  humidity: number;
  light_level: number;
  ph_level?: number;
  location?: { lat: number; lng: number };
}

export interface IoTSensorReading {
  soilMoisture: number;
  temperature: number;
  humidity: number;
  lightLevel: number;
  phLevel?: number;
  timestamp: string;
}

// Authentication API
export async function registerUser(userData: UserCreate): Promise<User> {
  return apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
}

export async function login(credentials: LoginRequest): Promise<Token> {
  const response = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });

  if (response.access_token) {
    setAuthToken(response.access_token);
  }

  return response;
}

export async function getCurrentUser(): Promise<User> {
  const cacheKey = 'current_user';

  // Try to get from cache if offline
  if (isOffline()) {
    const cached = getCache(cacheKey);
    if (cached) return cached;
    throw new Error('You are offline and no cached user data is available');
  }

  try {
    const user = await apiRequest('/auth/me');
    setCache(cacheKey, user);
    return user;
  } catch (error) {
    // Try cache as fallback
    const cached = getCache(cacheKey);
    if (cached) return cached;
    throw error;
  }
}

export async function updateCurrentUser(userData: UserUpdate): Promise<User> {
  return apiRequest('/auth/me', {
    method: 'PUT',
    body: JSON.stringify(userData),
  });
}

export async function logout(): Promise<void> {
  setAuthToken(null);
}

// Sensor Device API
export async function registerDevice(deviceData: SensorDeviceCreate): Promise<SensorDevice> {
  return apiRequest('/devices', {
    method: 'POST',
    body: JSON.stringify(deviceData),
  });
}

export async function getUserDevices(): Promise<SensorDevice[]> {
  return apiRequest('/devices');
}

export async function getDevice(deviceId: string): Promise<SensorDevice> {
  return apiRequest(`/devices/${deviceId}`);
}

// Sensor Data API
export async function sendSensorData(data: SensorReadingCreate): Promise<{ status: string; message: string }> {
  return apiRequest('/sensor-data', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getSensorData(deviceId: string, hours: number = 24): Promise<{ status: string; data: IoTSensorReading[] }> {
  try {
    const response = await apiRequest(`/sensor-data/${deviceId}?hours=${hours}`);
    return {
      status: response.status,
      data: response.data.map((reading: any) => ({
        soilMoisture: reading.soilMoisture,
        temperature: reading.temperature,
        humidity: reading.humidity,
        lightLevel: reading.lightLevel,
        phLevel: reading.phLevel,
        timestamp: reading.timestamp
      }))
    };
  } catch (error) {
    console.warn('API call failed, using cached/mock data:', error);
    // Return mock data as fallback
    return {
      status: 'success',
      data: generateMockSensorData(hours)
    };
  }
}

export async function getLatestSensorData(deviceId: string): Promise<{ status: string; data: IoTSensorReading }> {
  try {
    const response = await apiRequest(`/sensor-data/${deviceId}/latest`);
    return {
      status: response.status,
      data: {
        soilMoisture: response.data.soilMoisture,
        temperature: response.data.temperature,
        humidity: response.data.humidity,
        lightLevel: response.data.lightLevel,
        phLevel: response.data.phLevel,
        timestamp: response.data.timestamp
      }
    };
  } catch (error) {
    console.warn('API call failed, using cached/mock data:', error);
    // Return mock data as fallback
    return {
      status: 'success',
      data: {
        soilMoisture: 65.0 + Math.random() * 20,
        temperature: 24.5 + Math.random() * 5,
        humidity: 70.0 + Math.random() * 10,
        lightLevel: 85.0 + Math.random() * 10,
        phLevel: 6.8 + Math.random() * 0.5,
        timestamp: new Date().toISOString()
      }
    };
  }
}

// AI Model API
export async function getCreditScore(request: CreditScoringRequest): Promise<{ status: string; data: CreditScore }> {
  const response = await apiRequest('/ai/credit-scoring', {
    method: 'POST',
    body: JSON.stringify(request),
  });

  return {
    status: response.status,
    data: {
      id: response.data.id,
      user_id: response.data.user_id,
      score: response.data.score,
      risk_level: response.data.risk_level,
      trust_score: response.data.trust_score,
      confidence: response.data.confidence,
      explanation: response.data.explanation,
      created_at: response.data.created_at
    }
  };
}

export async function getYieldPrediction(request: YieldPredictionRequest): Promise<{ status: string; data: YieldPrediction }> {
  const response = await apiRequest('/ai/yield-prediction', {
    method: 'POST',
    body: JSON.stringify(request),
  });

  return {
    status: response.status,
    data: {
      id: response.data.id,
      user_id: response.data.user_id,
      crop_type: response.data.crop_type,
      predicted_yield: response.data.predicted_yield,
      unit: response.data.unit,
      confidence_interval_lower: response.data.confidence_interval_lower,
      confidence_interval_upper: response.data.confidence_interval_upper,
      important_factors: response.data.important_factors,
      created_at: response.data.created_at
    }
  };
}

export async function getClimateAnalysis(request: ClimateAnalysisRequest): Promise<{ status: string; data: ClimateAnalysis }> {
  const response = await apiRequest('/ai/climate-analysis', {
    method: 'POST',
    body: JSON.stringify(request),
  });

  return {
    status: response.status,
    data: {
      id: response.data.id,
      user_id: response.data.user_id,
      co2_sequestered: response.data.co2_sequestered,
      ndvi_score: response.data.ndvi_score,
      carbon_tokens_mintable: response.data.carbon_tokens_mintable,
      recommendations: response.data.recommendations,
      confidence: response.data.confidence,
      created_at: response.data.created_at
    }
  };
}

// Loan API
export async function createLoanApplication(loanData: LoanCreate): Promise<Loan> {
  return apiRequest('/loans', {
    method: 'POST',
    body: JSON.stringify(loanData),
  });
}

export async function getUserLoans(): Promise<Loan[]> {
  const cacheKey = 'user_loans';

  // Try to get from cache if offline
  if (isOffline()) {
    const cached = getCache(cacheKey);
    if (cached) return cached;
    throw new Error('You are offline and no cached loan data is available');
  }

  try {
    const loans = await apiRequest('/loans');
    setCache(cacheKey, loans);
    return loans;
  } catch (error) {
    // Try cache as fallback
    const cached = getCache(cacheKey);
    if (cached) return cached;
    throw error;
  }
}

// Marketplace API
export async function createMarketplaceListing(listingData: MarketplaceListingCreate): Promise<MarketplaceListing> {
  return apiRequest('/marketplace/listings', {
    method: 'POST',
    body: JSON.stringify(listingData),
  });
}

export async function getMarketplaceListings(cropType?: string, location?: string): Promise<MarketplaceListing[]> {
  const params = new URLSearchParams();
  if (cropType) params.append('crop_type', cropType);
  if (location) params.append('location', location);

  const queryString = params.toString();
  const endpoint = `/marketplace/listings${queryString ? `?${queryString}` : ''}`;

  return apiRequest(endpoint);
}

// Notification API
export async function getUserNotifications(): Promise<Notification[]> {
  const cacheKey = 'user_notifications';

  // Try to get from cache if offline
  if (isOffline()) {
    const cached = getCache(cacheKey);
    if (cached) return cached;
    return []; // Return empty array if no cache
  }

  try {
    const notifications = await apiRequest('/notifications');
    setCache(cacheKey, notifications);
    return notifications;
  } catch (error) {
    // Try cache as fallback
    const cached = getCache(cacheKey);
    if (cached) return cached;
    throw error;
  }
}

export async function markNotificationRead(notificationId: number): Promise<{ status: string }> {
  return apiRequest(`/notifications/${notificationId}/read`, {
    method: 'PUT',
  });
}

// Legacy API functions for backward compatibility
export async function trainModels(): Promise<{ status: string; message: string }> {
  return apiRequest('/admin/train-models', {
    method: 'POST',
  });
}

export async function healthCheck(): Promise<{ status: string; service: string; version?: string; timestamp?: string }> {
  return apiRequest('/health');
}

// GraphQL API functions
export async function getUserDashboardData(userId: number): Promise<any> {
  const query = `
    query GetDashboardData($userId: Int!) {
      user(id: $userId) {
        id
        username
        full_name
        farm_size
        location
      }
      userLoans(userId: $userId, limit: 5) {
        id
        amount
        status
        created_at
      }
      userDevices(userId: $userId) {
        id
        device_id
        name
        last_seen
      }
      userNotifications(userId: $userId, limit: 10) {
        id
        title
        message
        type
        is_read
        created_at
      }
      dashboardStats {
        total_users
        active_loans
        total_marketplace_listings
        total_carbon_credits
      }
    }
  `;

  return graphqlRequest(query, { userId });
}

export async function getMarketplaceListingsGraphQL(
  cropType?: string,
  location?: string,
  limit: number = 20,
  offset: number = 0
): Promise<any> {
  const query = `
    query GetMarketplaceListings($filter: MarketplaceListingFilter, $limit: Int, $offset: Int) {
      marketplaceListings(filter: $filter, limit: $limit, offset: $offset) {
        id
        title
        description
        crop_type
        quantity
        unit
        price_per_unit
        location
        quality_grade
        status
        created_at
        seller {
          id
          username
          full_name
        }
      }
    }
  `;

  const variables: any = { limit, offset };
  if (cropType || location) {
    variables.filter = {};
    if (cropType) variables.filter.crop_type = cropType;
    if (location) variables.filter.location = location;
  }

  return graphqlRequest(query, variables);
}

export async function createMarketplaceListingGraphQL(listingData: MarketplaceListingCreate): Promise<any> {
  const query = `
    mutation CreateMarketplaceListing($input: MarketplaceListingCreateInput!) {
      createMarketplaceListing(input: $input) {
        id
        title
        description
        crop_type
        quantity
        unit
        price_per_unit
        location
        status
        created_at
      }
    }
  `;

  return graphqlRequest(query, { input: listingData });
}

export async function getSensorDataGraphQL(deviceId: string, hours: number = 24): Promise<any> {
  const query = `
    query GetSensorData($deviceId: String!, $hours: Int) {
      sensorReadings(deviceId: $deviceId, hours: $hours) {
        id
        soil_moisture
        temperature
        humidity
        light_level
        ph_level
        nitrogen
        phosphorus
        potassium
        rainfall
        wind_speed
        solar_radiation
        timestamp
      }
    }
  `;

  return graphqlRequest(query, { deviceId, hours });
}

// WebSocket connection helpers
export function connectWebSocket(userId: number, channel: string = 'general') {
  websocketManager.connect(userId, channel);
}

export function disconnectWebSocket() {
  websocketManager.disconnect();
}

export function onWebSocketMessage(type: string, handler: (data: any) => void) {
  websocketManager.onMessage(type, handler);
}

export function sendWebSocketMessage(type: string, data: any) {
  websocketManager.sendMessage(type, data);
}

// Real-time subscriptions using WebSocket
export function subscribeToNotifications(userId: number, callback: (notification: Notification) => void) {
  connectWebSocket(userId, 'notifications');
  onWebSocketMessage('notification', callback);
}

export function subscribeToSensorAlerts(userId: number, callback: (alert: any) => void) {
  connectWebSocket(userId, 'sensor_alerts');
  onWebSocketMessage('sensor_alert', callback);
}

// Helper function to generate mock sensor data
function generateMockSensorData(hours: number): IoTSensorReading[] {
  const data: IoTSensorReading[] = [];
  const now = new Date();

  for (let i = hours - 1; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
    data.push({
      soilMoisture: 40 + Math.random() * 40,
      temperature: 20 + Math.random() * 15,
      humidity: 40 + Math.random() * 40,
      lightLevel: Math.random() * 100,
      phLevel: 6.0 + Math.random() * 2.0,
      timestamp: timestamp.toISOString()
    });
  }

  return data;
}