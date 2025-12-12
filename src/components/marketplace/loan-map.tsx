'use client';

import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface Loan {
  id: string;
  amount: number;
  location: string;
  crop: string;
  aiScore: number;
  riskLevel: string;
  farmer: string;
  fundedPercentage: number;
}

interface LoanMapProps {
  loans: Loan[];
  onLoanSelect: (loanId: string) => void;
}

export default function LoanMap({ loans, onLoanSelect }: LoanMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize map centered on Africa
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://demotiles.maplibre.org/style.json', // Default style
      center: [20, 0], // Center of Africa
      zoom: 3,
      attributionControl: false
    });

    // Add navigation control
    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

    // Add markers for loans
    loans.forEach((loan) => {
      // Mock coordinates based on location (in real app, use geocoding)
      const coordinates = getMockCoordinates(loan.location);

      const marker = new maplibregl.Marker({
        color: getRiskColor(loan.riskLevel)
      })
        .setLngLat(coordinates)
        .addTo(map.current!);

      // Create popup
      const popup = new maplibregl.Popup({ offset: 25 })
        .setHTML(`
          <div class="p-3 min-w-48">
            <h3 class="font-semibold text-slate-gray mb-2">${loan.farmer}</h3>
            <div class="space-y-1 text-sm">
              <div class="flex justify-between">
                <span>Amount:</span>
                <span class="font-medium">$${loan.amount}</span>
              </div>
              <div class="flex justify-between">
                <span>Crop:</span>
                <span>${loan.crop}</span>
              </div>
              <div class="flex justify-between">
                <span>Score:</span>
                <span>${loan.aiScore}</span>
              </div>
              <div class="flex justify-between">
                <span>Funded:</span>
                <span>${loan.fundedPercentage}%</span>
              </div>
            </div>
            <button
              onclick="window.location.href='/loan/${loan.id}'"
              class="mt-3 w-full bg-agri-green text-white px-3 py-2 rounded text-sm hover:bg-agri-green/90 transition-colors"
            >
              View Details
            </button>
          </div>
        `);

      marker.setPopup(popup);
    });

    // Fit bounds to show all markers
    if (loans.length > 0) {
      const bounds = new maplibregl.LngLatBounds();
      loans.forEach((loan) => {
        const coordinates = getMockCoordinates(loan.location);
        bounds.extend(coordinates);
      });
      map.current.fitBounds(bounds, { padding: 50 });
    }

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, [loans]);

  // Mock function to get coordinates from location string
  const getMockCoordinates = (location: string): [number, number] => {
    // In real app, use geocoding service
    const mockCoords: Record<string, [number, number]> = {
      'Nairobi, Kenya': [36.8219, -1.2921],
      'Lagos, Nigeria': [3.3792, 6.5244],
      'Accra, Ghana': [-0.1869, 5.6037],
      'Kampala, Uganda': [32.5825, 0.3476],
      'Dar es Salaam, Tanzania': [39.2083, -6.7924],
      'Addis Ababa, Ethiopia': [38.7578, 9.0054],
      'Cape Town, South Africa': [18.4241, -33.9249]
    };

    // Try to match location
    for (const [key, coords] of Object.entries(mockCoords)) {
      if (location.toLowerCase().includes(key.toLowerCase().split(',')[0])) {
        return coords;
      }
    }

    // Default to random location in Africa
    return [
      20 + (Math.random() - 0.5) * 40, // Longitude: 0 to 40
      (Math.random() - 0.5) * 30 // Latitude: -15 to 15
    ];
  };

  const getRiskColor = (riskLevel: string): string => {
    switch (riskLevel.toLowerCase()) {
      case 'low': return '#4CAF50'; // Green
      case 'medium': return '#FF9800'; // Orange
      case 'high': return '#F44336'; // Red
      default: return '#2196F3'; // Blue
    }
  };

  return (
    <div className="relative">
      <div ref={mapContainer} className="h-96 w-full rounded-lg" />
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Low Risk</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            <span>Medium Risk</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>High Risk</span>
          </div>
        </div>
      </div>
    </div>
  );
}