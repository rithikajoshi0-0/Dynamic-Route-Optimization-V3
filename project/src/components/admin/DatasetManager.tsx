import React, { useState } from 'react';
import { Upload, Trash2, Eye, EyeOff, FileText, Map } from 'lucide-react';
import { useMapData } from '../../contexts/MapDataContext';
import { useAuth } from '../../contexts/AuthContext';

export function DatasetManager() {
  const { datasets, addDataset, removeDataset } = useMapData();
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setIsUploading(true);

    try {
      // Simulate file processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Create mock GeoJSON data for demonstration
      const mockGeoJSON = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [-122.4194, 37.7749] // San Francisco
            },
            properties: {
              name: 'Sample Location',
              description: 'Demo dataset point'
            }
          }
        ]
      };

      const newDataset = {
        name: file.name.replace(/\.[^/.]+$/, ''),
        description: `Uploaded dataset: ${file.name}`,
        file_type: file.name.endsWith('.geojson') ? 'geojson' as const : 
                   file.name.endsWith('.kml') ? 'kml' as const : 'shapefile' as const,
        file_url: URL.createObjectURL(file),
        file_size: file.size,
        geojson_data: mockGeoJSON,
        created_by: user.id,
        is_active: true
      };

      addDataset(newDataset);
    } catch (error) {
      console.error('Error uploading dataset:', error);
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (user?.role !== 'admin') {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">Access denied. Admin privileges required.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Dataset Manager</h2>
        <div className="relative">
          <input
            type="file"
            accept=".geojson,.kml,.shp,.zip"
            onChange={handleFileUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isUploading}
          />
          <button
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            disabled={isUploading}
          >
            <Upload className="w-4 h-4" />
            {isUploading ? 'Uploading...' : 'Upload Dataset'}
          </button>
        </div>
      </div>

      <div className="grid gap-4">
        {datasets.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Map className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No datasets uploaded yet</p>
            <p className="text-sm text-gray-400">Upload GeoJSON, KML, or Shapefile formats</p>
          </div>
        ) : (
          datasets.map((dataset) => (
            <div key={dataset.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <div>
                    <h3 className="font-semibold text-gray-900">{dataset.name}</h3>
                    <p className="text-sm text-gray-500">{dataset.description}</p>
                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                      <span>{dataset.file_type.toUpperCase()}</span>
                      <span>{formatFileSize(dataset.file_size)}</span>
                      <span>{new Date(dataset.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className={`p-2 rounded-lg transition-colors ${
                      dataset.is_active 
                        ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                    }`}
                    title={dataset.is_active ? 'Hide from map' : 'Show on map'}
                  >
                    {dataset.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => removeDataset(dataset.id)}
                    className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                    title="Delete dataset"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
