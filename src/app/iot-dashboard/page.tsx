'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'next-i18next';

interface SensorData {
  soilMoisture: number;
  temperature: number;
  humidity: number;
  lightLevel: number;
  phLevel: number;
  timestamp: string;
}

export default function IoTDashboard() {
  const { t } = useTranslation('common');
  const [sensorData, setSensorData] = useState<SensorData | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Mock sensor data
  useEffect(() => {
    const mockData: SensorData = {
      soilMoisture: Math.random() * 100,
      temperature: 20 + Math.random() * 15,
      humidity: 40 + Math.random() * 40,
      lightLevel: Math.random() * 100,
      phLevel: 5.5 + Math.random() * 2,
      timestamp: new Date().toISOString()
    };

    setSensorData(mockData);
    setIsConnected(true);

    // Update every 30 seconds
    const interval = setInterval(() => {
      setSensorData({
        soilMoisture: Math.random() * 100,
        temperature: 20 + Math.random() * 15,
        humidity: 40 + Math.random() * 40,
        lightLevel: Math.random() * 100,
        phLevel: 5.5 + Math.random() * 2,
        timestamp: new Date().toISOString()
      });
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const SensorCard = ({ title, value, unit, min, max, color }: {
    title: string;
    value: number;
    unit: string;
    min: number;
    max: number;
    color: string;
  }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">{title}</h3>
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl font-bold text-gray-900 dark:text-white">
          {value.toFixed(1)} {unit}
        </span>
        <div className={`w-4 h-4 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div
          className={`h-2 rounded-full ${color}`}
          style={{ width: `${((value - min) / (max - min)) * 100}%` }}
        ></div>
      </div>
      <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mt-1">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            IoT Farm Monitoring
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Real-time sensor data from your agricultural IoT devices
          </p>
          <div className="mt-4 flex items-center">
            <span className="text-sm text-gray-500 dark:text-gray-400 mr-2">Connection Status:</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              isConnected
                ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200'
                : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200'
            }`}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>

        {sensorData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <SensorCard
              title="Soil Moisture"
              value={sensorData.soilMoisture}
              unit="%"
              min={0}
              max={100}
              color="bg-blue-500"
            />
            <SensorCard
              title="Temperature"
              value={sensorData.temperature}
              unit="°C"
              min={0}
              max={50}
              color="bg-red-500"
            />
            <SensorCard
              title="Humidity"
              value={sensorData.humidity}
              unit="%"
              min={0}
              max={100}
              color="bg-cyan-500"
            />
            <SensorCard
              title="Light Level"
              value={sensorData.lightLevel}
              unit="%"
              min={0}
              max={100}
              color="bg-yellow-500"
            />
            <SensorCard
              title="Soil pH"
              value={sensorData.phLevel}
              unit=""
              min={0}
              max={14}
              color="bg-purple-500"
            />
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Last Update</h3>
              <p className="text-gray-600 dark:text-gray-300">
                {new Date(sensorData.timestamp).toLocaleString()}
              </p>
              <button
                className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                onClick={() => {
                  // Refresh data
                  window.location.reload();
                }}
              >
                Refresh Data
              </button>
            </div>
          </div>
        )}

        {!sensorData && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-300">Loading sensor data...</p>
          </div>
        )}

        <div className="mt-8 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Farm Insights</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 dark:bg-green-900 rounded-lg">
              <h3 className="font-medium text-green-800 dark:text-green-200">Optimal Conditions</h3>
              <p className="text-sm text-green-600 dark:text-green-300 mt-1">
                Soil moisture and temperature are within ideal ranges for crop growth.
              </p>
            </div>
            <div className="p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
              <h3 className="font-medium text-blue-800 dark:text-blue-200">Irrigation Recommendation</h3>
              <p className="text-sm text-blue-600 dark:text-blue-300 mt-1">
                Consider watering if soil moisture drops below 40%.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}