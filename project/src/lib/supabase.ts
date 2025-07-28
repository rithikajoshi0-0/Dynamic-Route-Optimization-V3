import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});

// Database types
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