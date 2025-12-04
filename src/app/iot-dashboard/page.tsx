'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Thermometer, Droplets, Sun, Leaf, AlertTriangle, TrendingUp, Activity, MapPin, BarChart3, Zap } from 'lucide-react';
import { getSensorData, getLatestSensorData, sendSensorData, connectWebSocket, onWebSocketMessage, disconnectWebSocket } from '@/lib/api';

interface SensorData {
  soilMoisture: number;
  temperature: number;
  humidity: number;
  lightLevel: number;
  phLevel: number;
  timestamp: string;
}

interface FarmDevice {
  id: string;
  name: string;
  location: string;
  cropType: string;
  status: 'online' | 'offline' | 'warning';
  lastUpdate: string;
}

interface Alert {
  id: number;
  deviceId: string;
  type: 'critical' | 'warning' | 'info';
  message: string;
  timestamp: string;
  resolved: boolean;
}

export default function IoTDashboard() {
  const { t } = useTranslation('common');
  const [sensorData, setSensorData] = useState<SensorData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [devices, setDevices] = useState<FarmDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('device-001');
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [predictiveData, setPredictiveData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('monitoring');

  // Fetch sensor data from API
  useEffect(() => {
    const fetchSensorData = async () => {
      try {
        const result = await getLatestSensorData(selectedDevice);

        if (result.status === 'success') {
          const data = result.data;
          setSensorData({
            soilMoisture: data.soilMoisture,
            temperature: data.temperature,
            humidity: data.humidity,
            lightLevel: data.lightLevel,
            phLevel: data.phLevel || 7.0,
            timestamp: data.timestamp
          });
          setIsConnected(true);
        }
      } catch (error) {
        console.error('Failed to fetch sensor data:', error);
        // Fallback to mock data
        setSensorData({
          soilMoisture: 65.0,
          temperature: 24.5,
          humidity: 70.0,
          lightLevel: 85.0,
          phLevel: 6.8,
          timestamp: new Date().toISOString()
        });
        setIsConnected(false);
      }
    };

    const loadDevices = () => {
      // Mock device data
      const mockDevices: FarmDevice[] = [
        { id: 'device-001', name: 'North Field Sensor', location: 'Nairobi, Kenya', cropType: 'Maize', status: 'online', lastUpdate: new Date().toISOString() },
        { id: 'device-002', name: 'South Field Sensor', location: 'Nairobi, Kenya', cropType: 'Rice', status: 'online', lastUpdate: new Date(Date.now() - 300000).toISOString() },
        { id: 'device-003', name: 'East Field Sensor', location: 'Kampala, Uganda', cropType: 'Cassava', status: 'warning', lastUpdate: new Date(Date.now() - 900000).toISOString() },
        { id: 'device-004', name: 'West Field Sensor', location: 'Dar es Salaam, Tanzania', cropType: 'Maize', status: 'offline', lastUpdate: new Date(Date.now() - 3600000).toISOString() }
      ];
      setDevices(mockDevices);
    };

    const loadAlerts = () => {
      // Mock alerts data
      const mockAlerts: Alert[] = [
        { id: 1, deviceId: 'device-003', type: 'warning', message: 'Soil moisture below optimal level (35%)', timestamp: new Date(Date.now() - 900000).toISOString(), resolved: false },
        { id: 2, deviceId: 'device-004', type: 'critical', message: 'Device offline for 1 hour', timestamp: new Date(Date.now() - 3600000).toISOString(), resolved: false },
        { id: 3, deviceId: 'device-001', type: 'info', message: 'Optimal growing conditions detected', timestamp: new Date(Date.now() - 1800000).toISOString(), resolved: true }
      ];
      setAlerts(mockAlerts);
    };

    const loadPredictiveData = () => {
      // Mock predictive analytics data
      setPredictiveData({
        yieldPrediction: 85.5,
        confidence: 92,
        riskFactors: ['Drought potential in 2 weeks', 'Pest activity increasing'],
        recommendations: ['Increase irrigation by 15%', 'Apply preventive pest control', 'Monitor weather forecasts closely']
      });
    };

    const fetchHistoricalData = async () => {
      try {
        const result = await getSensorData('device-001', 24);

        if (result.status === 'success' && result.data.length > 0) {
          const formattedData = result.data.map((item) => ({
            time: new Date(item.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            soilMoisture: item.soilMoisture,
            temperature: item.temperature,
            humidity: item.humidity,
            lightLevel: item.lightLevel,
          }));
          setHistoricalData(formattedData);
        } else {
          // Generate mock historical data
          const data = [];
          const now = new Date();
          for (let i = 23; i >= 0; i--) {
            const time = new Date(now.getTime() - i * 60 * 60 * 1000);
            data.push({
              time: time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
              soilMoisture: 40 + Math.random() * 40,
              temperature: 20 + Math.random() * 15,
              humidity: 40 + Math.random() * 40,
              lightLevel: Math.random() * 100,
            });
          }
          setHistoricalData(data);
        }
      } catch (error) {
        console.error('Failed to fetch historical data:', error);
        // Fallback to mock data
        const data = [];
        const now = new Date();
        for (let i = 23; i >= 0; i--) {
          const time = new Date(now.getTime() - i * 60 * 60 * 1000);
          data.push({
            time: time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            soilMoisture: 40 + Math.random() * 40,
            temperature: 20 + Math.random() * 15,
            humidity: 40 + Math.random() * 40,
            lightLevel: Math.random() * 100,
          });
        }
        setHistoricalData(data);
      }
    };

    // Initial fetch
    fetchSensorData();
    fetchHistoricalData();
    loadDevices();
    loadAlerts();
    loadPredictiveData();

    // Connect to WebSocket for real-time sensor updates
    connectWebSocket(1, 'sensor_alerts'); // Using dummy user ID

    // Listen for sensor alerts
    onWebSocketMessage('sensor_alert', (alert: any) => {
      console.log('Received sensor alert:', alert);
      // Refresh data when alerts are received
      fetchSensorData();
      loadAlerts();
    });

    // Update every 30 seconds as backup
    const interval = setInterval(() => {
      fetchSensorData();
      fetchHistoricalData();
      loadAlerts();
    }, 30000);

    return () => {
      clearInterval(interval);
      disconnectWebSocket();
    };
  }, [selectedDevice]);

  // const SensorCard = ({ title, value, unit, min, max, color, icon: Icon }: {
  //   title: string;
  //   value: number;
  //   unit: string;
  //   min: number;
  //   max: number;
  //   color: string;
  //   icon: any;
  // }) => {
  //   return (
  //     <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
  //       <div className="flex items-center gap-2 mb-4">
  //         <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
  //         <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{title}</h3>
  //       </div>
  //       <div className="flex items-center justify-between mb-2">
  //         <span className="text-2xl font-bold text-gray-900 dark:text-white">
  //           {value.toFixed(1)} {unit}
  //         </span>
  //         <div className={`w-4 h-4 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
  //       </div>
  //       <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
  //         <div
  //           className={`h-2 rounded-full ${color}`}
  //           style={{ width: `${((value - min) / (max - min)) * 100}%` }}
  //         ></div>
  //       </div>
  //       <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mt-1">
  //         <span>{min}{unit}</span>
  //         <span>{max}{unit}</span>
  //       </div>
  //     </div>
  //   );
  // };

  return (
    <div>
      <h1>IoT Dashboard</h1>
    </div>
  );
}