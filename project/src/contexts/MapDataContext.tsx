import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface MapDataset {
  id: string;
  name: string;
  description?: string;
  file_type: 'geojson' | 'shapefile' | 'kml';
  file_url: string;
  file_size: number;
  geojson_data: any;
  created_at: string;
  updated_at: string;
  created_by: string;
  is_active: boolean;
}

export interface RouteVisualization {
  id: string;
  name: string;
  route_data: any;
  dataset_id?: string;
  created_by: string;
  created_at: string;
  is_public: boolean;
}

interface MapDataContextType {
  datasets: MapDataset[];
  routes: RouteVisualization[];
  addDataset: (dataset: Omit<MapDataset, 'id' | 'created_at' | 'updated_at'>) => void;
  removeDataset: (id: string) => void;
  addRoute: (route: Omit<RouteVisualization, 'id' | 'created_at'>) => void;
  removeRoute: (id: string) => void;
  isLoading: boolean;
}

const MapDataContext = createContext<MapDataContextType | undefined>(undefined);

export function MapDataProvider({ children }: { children: ReactNode }) {
  const [datasets, setDatasets] = useState<MapDataset[]>([]);
  const [routes, setRoutes] = useState<RouteVisualization[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addDataset = (dataset: Omit<MapDataset, 'id' | 'created_at' | 'updated_at'>) => {
    const newDataset: MapDataset = {
      ...dataset,
      id: Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    setDatasets(prev => [...prev, newDataset]);
  };

  const removeDataset = (id: string) => {
    setDatasets(prev => prev.filter(d => d.id !== id));
  };

  const addRoute = (route: Omit<RouteVisualization, 'id' | 'created_at'>) => {
    const newRoute: RouteVisualization = {
      ...route,
      id: Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString()
    };
    setRoutes(prev => [...prev, newRoute]);
  };

  const removeRoute = (id: string) => {
    setRoutes(prev => prev.filter(r => r.id !== id));
  };

  return (
    <MapDataContext.Provider value={{
      datasets,
      routes,
      addDataset,
      removeDataset,
      addRoute,
      removeRoute,
      isLoading
    }}>
      {children}
    </MapDataContext.Provider>
  );
}

export function useMapData() {
  const context = useContext(MapDataContext);
  if (context === undefined) {
    throw new Error('useMapData must be used within a MapDataProvider');
  }
  return context;
}
