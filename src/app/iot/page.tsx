'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslation } from 'react-i18next';
import { useGetSensorDataQuery } from '@/store/apiSlice';
import {
  Activity,
  Thermometer,
  Droplets,
  Wind,
  Eye,
  Settings,
  AlertTriangle,
  CheckCircle,
  Wifi,
  WifiOff,
  Battery,
  MapPin,
  TrendingUp,
  TrendingDown,
  BarChart3,
  RefreshCw
} from 'lucide-react';

export default function IoTPage() {
  const { t } = useTranslation();
  const [selectedDevice, setSelectedDevice] = useState('device-001');
  const { data: sensorData, isLoading, refetch } = useGetSensorDataQuery({ deviceId: selectedDevice });

  // Mock IoT devices
  const devices = [
    {
      id: 'device-001',
      name: 'Farm Sensor Alpha',
      location: 'Nairobi Farm',
      status: 'online',
      battery: 85,
      lastSeen: '2 minutes ago',
      sensors: ['temperature', 'humidity', 'soil_moisture']
    },
    {
      id: 'device-002',
      name: 'Weather Station Beta',
      location: 'Lagos Field',
      status: 'online',
      battery: 92,
      lastSeen: '1 minute ago',
      sensors: ['temperature', 'humidity', 'wind_speed', 'rainfall']
    },
    {
      id: 'device-003',
      name: 'Soil Monitor Gamma',
      location: 'Accra Plantation',
      status: 'offline',
      battery: 15,
      lastSeen: '2 hours ago',
      sensors: ['soil_moisture', 'ph_level', 'nutrients']
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'offline': return 'bg-red-500';
      case 'warning': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getSensorIcon = (sensorType: string) => {
    switch (sensorType) {
      case 'temperature': return <Thermometer className="w-4 h-4" />;
      case 'humidity': return <Droplets className="w-4 h-4" />;
      case 'soil_moisture': return <Droplets className="w-4 h-4" />;
      case 'wind_speed': return <Wind className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-paper-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-agri-green to-sky-teal text-white py-12">
        <div className="container">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-black mb-4">
              IoT Farm Monitoring
            </h1>
            <p className="text-xl opacity-90 max-w-2xl mx-auto">
              Real-time sensor data and automated farm monitoring for optimal crop management
            </p>
          </div>
        </div>
      </section>

      <div className="container py-8">
        <Tabs defaultValue="devices" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="devices">Device Overview</TabsTrigger>
            <TabsTrigger value="sensors">Sensor Data</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="devices" className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {devices.map((device) => (
                <Card key={device.id} className={`shadow-level2 border-0 cursor-pointer transition-all ${
                  selectedDevice === device.id ? 'ring-2 ring-agri-green' : ''
                }`} onClick={() => setSelectedDevice(device.id)}>
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{device.name}</CardTitle>
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(device.status)}`} />
                    </div>
                    <CardDescription className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      {device.location}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-gray/70">Status</span>
                      <Badge variant={device.status === 'online' ? 'default' : 'secondary'}>
                        {device.status === 'online' ? (
                          <><Wifi className="w-3 h-3 mr-1" /> Online</>
                        ) : (
                          <><WifiOff className="w-3 h-3 mr-1" /> Offline</>
                        )}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Battery</span>
                        <span>{device.battery}%</span>
                      </div>
                      <Progress value={device.battery} className="h-2" />
                    </div>

                    <div className="text-xs text-slate-gray/60">
                      Last seen: {device.lastSeen}
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {device.sensors.map((sensor) => (
                        <Badge key={sensor} variant="outline" className="text-xs">
                          {getSensorIcon(sensor)}
                          <span className="ml-1 capitalize">{sensor.replace('_', ' ')}</span>
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="sensors" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Sensor Readings</h2>
              <Button onClick={() => refetch()} disabled={isLoading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            {isLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="shadow-level1">
                    <CardContent className="p-6">
                      <div className="animate-pulse space-y-3">
                        <div className="h-4 bg-slate-gray/10 rounded w-3/4"></div>
                        <div className="h-6 bg-slate-gray/10 rounded w-1/2"></div>
                        <div className="h-4 bg-slate-gray/10 rounded w-2/3"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Mock sensor readings */}
                {[
                  { type: 'temperature', value: 24.5, unit: '°C', status: 'normal', trend: 'stable' },
                  { type: 'humidity', value: 65, unit: '%', status: 'normal', trend: 'up' },
                  { type: 'soil_moisture', value: 42, unit: '%', status: 'warning', trend: 'down' },
                  { type: 'wind_speed', value: 8.5, unit: 'km/h', status: 'normal', trend: 'stable' },
                  { type: 'rainfall', value: 12.5, unit: 'mm', status: 'normal', trend: 'up' },
                  { type: 'ph_level', value: 6.8, unit: 'pH', status: 'normal', trend: 'stable' }
                ].map((reading, index) => (
                  <Card key={index} className="shadow-level2 border-0">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2">
                          {getSensorIcon(reading.type)}
                          <span className="font-medium capitalize">
                            {reading.type.replace('_', ' ')}
                          </span>
                        </div>
                        <Badge variant={reading.status === 'normal' ? 'default' : 'secondary'}>
                          {reading.status}
                        </Badge>
                      </div>

                      <div className="text-3xl font-bold mb-2">
                        {reading.value} <span className="text-lg text-slate-gray/60">{reading.unit}</span>
                      </div>

                      <div className="flex items-center text-sm text-slate-gray/70">
                        {reading.trend === 'up' ? (
                          <TrendingUp className="w-4 h-4 mr-1 text-green-500" />
                        ) : reading.trend === 'down' ? (
                          <TrendingDown className="w-4 h-4 mr-1 text-red-500" />
                        ) : (
                          <BarChart3 className="w-4 h-4 mr-1 text-blue-500" />
                        )}
                        {reading.trend === 'stable' ? 'Stable' : reading.trend === 'up' ? 'Increasing' : 'Decreasing'}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="shadow-level2 border-0">
                <CardHeader>
                  <CardTitle>Device Health Overview</CardTitle>
                  <CardDescription>Status of all connected IoT devices</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Online Devices</span>
                      <span className="font-bold text-green-600">2/3</span>
                    </div>
                    <Progress value={66.7} className="h-2" />

                    <div className="flex justify-between items-center">
                      <span>Average Battery</span>
                      <span className="font-bold">64%</span>
                    </div>
                    <Progress value={64} className="h-2" />

                    <div className="flex justify-between items-center">
                      <span>Data Quality</span>
                      <span className="font-bold text-green-600">Excellent</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-level2 border-0">
                <CardHeader>
                  <CardTitle>Alerts & Notifications</CardTitle>
                  <CardDescription>Recent system alerts</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-yellow-800">Low Battery Warning</p>
                        <p className="text-sm text-yellow-700">Device Gamma battery below 20%</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-blue-800">Maintenance Completed</p>
                        <p className="text-sm text-blue-700">Sensor calibration updated</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}