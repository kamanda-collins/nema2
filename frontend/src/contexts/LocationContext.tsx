
import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface LocationData {
  lat: number;
  lng: number;
  name: string;
  address?: string;
  boundingBox?: number[];
  source: 'map' | 'gps' | 'search' | 'manual';
  timestamp: Date;
}

interface LocationContextType {
  currentLocation: LocationData | null;
  setLocation: (location: LocationData) => void;
  clearLocation: () => void;
  locationHistory: LocationData[];
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};

interface LocationProviderProps {
  children: ReactNode;
}

export const LocationProvider: React.FC<LocationProviderProps> = ({ children }) => {
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [locationHistory, setLocationHistory] = useState<LocationData[]>([]);

  const setLocation = (location: LocationData) => {
    setCurrentLocation(location);
    setLocationHistory(prev => [location, ...prev.slice(0, 9)]); // Keep last 10 locations
  };

  const clearLocation = () => {
    setCurrentLocation(null);
  };

  return (
    <LocationContext.Provider value={{
      currentLocation,
      setLocation,
      clearLocation,
      locationHistory
    }}>
      {children}
    </LocationContext.Provider>
  );
};
