-- Supabase Database Setup for Map Dataset Management
-- Run these commands in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create map_datasets table
CREATE TABLE IF NOT EXISTS map_datasets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  file_type TEXT NOT NULL CHECK (file_type IN ('geojson', 'shapefile', 'kml')),
  file_url TEXT NOT NULL,
  file_size BIGINT NOT NULL DEFAULT 0,
  geojson_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true
);

-- Create route_visualizations table
CREATE TABLE IF NOT EXISTS route_visualizations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  route_data JSONB NOT NULL,
  dataset_id UUID REFERENCES map_datasets(id) ON DELETE SET NULL,
  created_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_public BOOLEAN DEFAULT false
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_map_datasets_created_by ON map_datasets(created_by);
CREATE INDEX IF NOT EXISTS idx_map_datasets_is_active ON map_datasets(is_active);
CREATE INDEX IF NOT EXISTS idx_route_visualizations_created_by ON route_visualizations(created_by);
CREATE INDEX IF NOT EXISTS idx_route_visualizations_is_public ON route_visualizations(is_public);
CREATE INDEX IF NOT EXISTS idx_route_visualizations_dataset_id ON route_visualizations(dataset_id);

-- Enable Row Level Security (RLS)
ALTER TABLE map_datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_visualizations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for map_datasets
-- Allow all users to read active datasets
CREATE POLICY "Allow read access to active datasets" ON map_datasets
  FOR SELECT USING (is_active = true);

-- Allow admins to do everything
CREATE POLICY "Allow admin full access to datasets" ON map_datasets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id::text = created_by 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Allow users to insert datasets (will be restricted by app logic)
CREATE POLICY "Allow authenticated users to insert datasets" ON map_datasets
  FOR INSERT WITH CHECK (auth.uid()::text = created_by);

-- RLS Policies for route_visualizations
-- Allow users to read their own routes and public routes
CREATE POLICY "Allow read access to own and public routes" ON route_visualizations
  FOR SELECT USING (
    created_by = auth.uid()::text OR is_public = true
  );

-- Allow users to insert their own routes
CREATE POLICY "Allow users to insert own routes" ON route_visualizations
  FOR INSERT WITH CHECK (auth.uid()::text = created_by);

-- Allow users to update/delete their own routes
CREATE POLICY "Allow users to modify own routes" ON route_visualizations
  FOR ALL USING (auth.uid()::text = created_by);

-- Create storage bucket for map datasets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('map-datasets', 'map-datasets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Allow authenticated users to upload datasets" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'map-datasets' AND 
    auth.role() = 'authenticated'
  );

CREATE POLICY "Allow public read access to datasets" ON storage.objects
  FOR SELECT USING (bucket_id = 'map-datasets');

CREATE POLICY "Allow admin delete access to datasets" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'map-datasets' AND
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_map_datasets_updated_at 
  BEFORE UPDATE ON map_datasets 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable real-time subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE map_datasets;
ALTER PUBLICATION supabase_realtime ADD TABLE route_visualizations;