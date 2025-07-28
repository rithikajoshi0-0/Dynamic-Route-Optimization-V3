import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, MapDataset, RouteVisualization } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface MapDataContextType {
  datasets: MapDataset[];
  routes: RouteVisualization[];
  isLoading: boolean;
  uploadDataset: (file: File, name: string, description?: string) => Promise<void>;
  deleteDataset: (id: string) => Promise<void>;
  toggleDatasetActive: (id: string, isActive: boolean) => Promise<void>;
  saveRoute: (name: string, routeData: any, datasetId?: string, isPublic?: boolean) => Promise<void>;
  deleteRoute: (id: string) => Promise<void>;
  refreshData: () => Promise<void>;
}

const MapDataContext = createContext<MapDataContextType | undefined>(undefined);

export const useMapData = () => {
  const context = useContext(MapDataContext);
  if (!context) {
    throw new Error('useMapData must be used within a MapDataProvider');
  }
  return context;
};

export const MapDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [datasets, setDatasets] = useState<MapDataset[]>([]);
  const [routes, setRoutes] = useState<RouteVisualization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const fetchDatasets = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('map_datasets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDatasets(data || []);
    } catch (error) {
      console.error('Error fetching datasets:', error);
      setDatasets([]);
    }
  }, []);

  const fetchRoutes = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('route_visualizations')
        .select('*')
        .or(`is_public.eq.true,created_by.eq.${user?.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRoutes(data || []);
    } catch (error) {
      console.error('Error fetching routes:', error);
      setRoutes([]);
    }
  }, [user?.id]);

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([fetchDatasets(), fetchRoutes()]);
    setIsLoading(false);
  }, [fetchDatasets, fetchRoutes]);

  useEffect(() => {
    if (user) {
      refreshData();
    }
  }, [user, refreshData]);

  // Real-time subscriptions
  useEffect(() => {
    if (!user) return;

    const datasetsSubscription = supabase
      .channel('map_datasets_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'map_datasets' },
        (payload) => {
          console.log('Dataset change:', payload);
          fetchDatasets();
        }
      )
      .subscribe();

    const routesSubscription = supabase
      .channel('route_visualizations_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'route_visualizations' },
        (payload) => {
          console.log('Route change:', payload);
          fetchRoutes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(datasetsSubscription);
      supabase.removeChannel(routesSubscription);
    };
  }, [user, fetchDatasets, fetchRoutes]);

  const uploadDataset = async (file: File, name: string, description?: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('osm')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('osm')
        .getPublicUrl(fileName);

      // Parse GeoJSON data if it's a GeoJSON file
      let geojsonData = null;
      if (file.type === 'application/json' || file.name.endsWith('.geojson')) {
        const text = await file.text();
        geojsonData = JSON.parse(text);
      }

      // Save dataset metadata to database
      const { error: dbError } = await supabase
        .from('map_datasets')
        .insert({
          name,
          description,
          file_type: fileExt as 'geojson' | 'shapefile' | 'kml',
          file_url: publicUrl,
          file_size: file.size,
          geojson_data: geojsonData,
          created_by: user.id,
          is_active: true,
        });

      if (dbError) throw dbError;
    } catch (error) {
      console.error('Error uploading dataset:', error);
      throw error;
    }
  };

  const deleteDataset = async (id: string) => {
    if (!user || user.role !== 'admin') {
      throw new Error('Unauthorized: Admin access required');
    }

    try {
      // Get dataset info first
      const { data: dataset, error: fetchError } = await supabase
        .from('map_datasets')
        .select('file_url')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      // Delete file from storage
      if (dataset?.file_url) {
        const fileName = dataset.file_url.split('/').pop();
        if (fileName) {
          await supabase.storage
            .from('osm')
            .remove([fileName]);
        }
      }

      // Delete from database
      const { error: deleteError } = await supabase
        .from('map_datasets')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
    } catch (error) {
      console.error('Error deleting dataset:', error);
      throw error;
    }
  };

  const toggleDatasetActive = async (id: string, isActive: boolean) => {
    if (!user || user.role !== 'admin') {
      throw new Error('Unauthorized: Admin access required');
    }

    try {
      const { error } = await supabase
        .from('map_datasets')
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error toggling dataset:', error);
      throw error;
    }
  };

  const saveRoute = async (name: string, routeData: any, datasetId?: string, isPublic = false) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { error } = await supabase
        .from('route_visualizations')
        .insert({
          name,
          route_data: routeData,
          dataset_id: datasetId,
          created_by: user.id,
          is_public: isPublic,
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving route:', error);
      throw error;
    }
  };

  const deleteRoute = async (id: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { error } = await supabase
        .from('route_visualizations')
        .delete()
        .eq('id', id)
        .eq('created_by', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting route:', error);
      throw error;
    }
  };

  return (
    <MapDataContext.Provider value={{
      datasets,
      routes,
      isLoading,
      uploadDataset,
      deleteDataset,
      toggleDatasetActive,
      saveRoute,
      deleteRoute,
      refreshData,
    }}>
      {children}
    </MapDataContext.Provider>
  );
};