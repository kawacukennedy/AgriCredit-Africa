'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { useGetUserFarmsQuery } from '@/store/apiSlice';
import { MapPin, ZoomIn, ZoomOut, RotateCcw, Activity, TrendingUp, Cloud, Sun, AlertCircle } from 'lucide-react';

export default function FarmMap() {
  const { t } = useTranslation();

  const { data: farmsData, isLoading, error } = useGetUserFarmsQuery();

  // Use real farm data
  const primaryFarm = farmsData?.data?.[0];
  const farmSize = primaryFarm?.size_hectares || 5.2;
  const location = primaryFarm?.location || 'Nairobi Region, Kenya';
  const ndviScore = primaryFarm?.ndvi_score || 0.75;
  const weatherRisk = primaryFarm?.weather_risk || 0.2;

  // Mock NDVI data for the last 30 days - in future, get from API
  const ndviData = [0.65, 0.68, 0.72, 0.69, 0.74, 0.71, 0.76, 0.73, 0.78, ndviScore];
  const currentNDVI = ndviData[ndviData.length - 1];
  const previousNDVI = ndviData[ndviData.length - 2];
  const ndviChange = ((currentNDVI - previousNDVI) / previousNDVI * 100).toFixed(1);

  const getNDVIColor = (value: number) => {
    if (value >= 0.7) return 'text-sky-teal';
    if (value >= 0.6) return 'text-harvest-gold';
    return 'text-red-500';
  };

  const getNDVIStatus = (value: number) => {
    if (value >= 0.7) return 'Excellent';
    if (value >= 0.6) return 'Good';
    return 'Needs Attention';
  };

  if (isLoading) {
    return (
      <Card className="shadow-level2 border-0">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center text-slate-gray">
            <MapPin className="w-5 h-5 mr-2 text-agri-green" />
            Farm Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="loading-skeleton h-64 rounded-xl mb-6"></div>
          <div className="loading-skeleton h-16 rounded-lg"></div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="shadow-level2 border-0">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center text-slate-gray">
            <MapPin className="w-5 h-5 mr-2 text-agri-green" />
            Farm Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-gray mb-2">Unable to Load Farm Data</h3>
            <p className="text-slate-gray/70 text-sm mb-4">
              We couldn't load your farm information. Please try again.
            </p>
            <Button variant="outline" size="sm">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-level2 border-0">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center text-slate-gray">
          <MapPin className="w-5 h-5 mr-2 text-agri-green" />
          Farm Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Map Container */}
        <div className="relative">
          <div className="h-64 bg-gradient-to-br from-agri-green/5 to-sky-teal/5 rounded-xl border border-slate-gray/10 flex items-center justify-center overflow-hidden">
            {/* Mock map background */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-8 left-8 w-16 h-16 bg-agri-green/20 rounded-full blur-xl"></div>
              <div className="absolute bottom-8 right-8 w-20 h-20 bg-sky-teal/20 rounded-full blur-xl"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-harvest-gold/20 rounded-full blur-xl"></div>
            </div>

            {/* Map content */}
            <div className="relative z-10 text-center">
              <MapPin className="w-12 h-12 text-agri-green mx-auto mb-3 animate-map-pulse" />
              <h3 className="text-lg font-semibold text-slate-gray mb-1">Farm Location</h3>
              <p className="text-sm text-slate-gray/60">{location}</p>
              <p className="text-xs text-slate-gray/50 mt-1">{farmSize} hectares</p>
            </div>
          </div>

          {/* Map Controls */}
          <div className="absolute top-4 right-4 flex flex-col space-y-2">
            <Button size="sm" variant="secondary" className="w-8 h-8 p-0 bg-white/90 hover:bg-white">
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="secondary" className="w-8 h-8 p-0 bg-white/90 hover:bg-white">
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="secondary" className="w-8 h-8 p-0 bg-white/90 hover:bg-white">
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* NDVI Health Indicator */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-gray flex items-center">
              <Activity className="w-4 h-4 mr-2 text-agri-green" />
              Vegetation Health (NDVI)
            </h4>
            <Badge className={`${
              currentNDVI >= 0.7 ? 'bg-sky-teal/10 text-sky-teal border-sky-teal/20' :
              currentNDVI >= 0.6 ? 'bg-harvest-gold/10 text-harvest-gold border-harvest-gold/20' :
              'bg-red-500/10 text-red-500 border-red-500/20'
            }`}>
              {getNDVIStatus(currentNDVI)}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-gray/70">Current NDVI</span>
                <span className={`text-lg font-bold ${getNDVIColor(currentNDVI)}`}>
                  {currentNDVI}
                </span>
              </div>
              <div className="w-full bg-slate-gray/10 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all duration-300 ${
                    currentNDVI >= 0.7 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                    currentNDVI >= 0.6 ? 'bg-gradient-to-r from-amber-500 to-orange-500' :
                    'bg-gradient-to-r from-red-500 to-red-600'
                  }`}
                  style={{ width: `${currentNDVI * 100}%` }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-gray/70">7-Day Change</span>
                <div className="flex items-center space-x-1">
                  {parseFloat(ndviChange) > 0 ? (
                    <TrendingUp className="w-4 h-4 text-sky-teal" />
                  ) : (
                    <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />
                  )}
                  <span className={`text-sm font-medium ${
                    parseFloat(ndviChange) > 0 ? 'text-sky-teal' : 'text-red-500'
                  }`}>
                    {parseFloat(ndviChange) > 0 ? '+' : ''}{ndviChange}%
                  </span>
                </div>
              </div>

              {/* Mini sparkline */}
              <div className="flex items-end space-x-1 h-8">
                {ndviData.slice(-7).map((value, index) => (
                  <div
                    key={index}
                    className={`w-2 rounded-sm ${
                      value >= 0.7 ? 'bg-sky-teal' :
                      value >= 0.6 ? 'bg-harvest-gold' :
                      'bg-red-500'
                    }`}
                    style={{ height: `${(value - 0.5) * 200}%` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Weather & Environmental Data */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-gray/10">
          <div className="text-center">
            <Sun className="w-6 h-6 text-harvest-gold mx-auto mb-2" />
            <div className="text-lg font-semibold text-slate-gray">28°C</div>
            <div className="text-xs text-slate-gray/60">Temperature</div>
          </div>
          <div className="text-center">
            <Cloud className="w-6 h-6 text-slate-gray mx-auto mb-2" />
            <div className="text-lg font-semibold text-slate-gray">750mm</div>
            <div className="text-xs text-slate-gray/60">Rainfall</div>
          </div>
          <div className="text-center">
            <Activity className="w-6 h-6 text-agri-green mx-auto mb-2" />
            <div className="text-lg font-semibold text-slate-gray">85%</div>
            <div className="text-xs text-slate-gray/60">Soil Moisture</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2 pt-4">
          <Button variant="outline" size="sm" className="flex-1 border-slate-gray/20 hover:border-agri-green hover:text-agri-green">
            View Full Map
          </Button>
          <Button variant="outline" size="sm" className="flex-1 border-slate-gray/20 hover:border-harvest-gold hover:text-harvest-gold">
            NDVI History
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}