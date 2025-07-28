import React, { useState, useRef } from 'react';
import { useMapData } from '../../contexts/MapDataContext';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Upload, 
  Trash2, 
  Eye, 
  EyeOff, 
  FileText, 
  Download,
  AlertCircle,
  CheckCircle,
  Loader
} from 'lucide-react';

const DatasetManager: React.FC = () => {
  const { user } = useAuth();
  const { datasets, uploadDataset, deleteDataset, toggleDatasetActive, isLoading } = useMapData();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadForm, setUploadForm] = useState({
    name: '',
    description: '',
    file: null as File | null,
  });

  const isAdmin = user?.role === 'admin';

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadForm(prev => ({ ...prev, file }));
      if (!uploadForm.name) {
        setUploadForm(prev => ({ 
          ...prev, 
          name: file.name.replace(/\.[^/.]+$/, '') 
        }));
      }
    }
  };

  const handleUpload = async () => {
    if (!uploadForm.file || !uploadForm.name.trim()) {
      setError('Please select a file and enter a name');
      return;
    }

    if (!isAdmin) {
      setError('Only administrators can upload datasets');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      await uploadDataset(uploadForm.file, uploadForm.name, uploadForm.description);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      setSuccess('Dataset uploaded successfully!');
      setUploadForm({ name: '', description: '', file: null });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      setTimeout(() => {
        setSuccess('');
        setUploadProgress(0);
      }, 3000);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!isAdmin) {
      setError('Only administrators can delete datasets');
      return;
    }

    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setError('');
      await deleteDataset(id);
      setSuccess('Dataset deleted successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Delete failed');
    }
  };

  const handleToggleActive = async (id: string, currentState: boolean) => {
    if (!isAdmin) {
      setError('Only administrators can modify dataset visibility');
      return;
    }

    try {
      setError('');
      await toggleDatasetActive(id, !currentState);
      setSuccess(`Dataset ${!currentState ? 'activated' : 'deactivated'} successfully!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Update failed');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileTypeIcon = (fileType: string) => {
    switch (fileType) {
      case 'geojson':
        return '🗺️';
      case 'shapefile':
        return '📊';
      case 'kml':
        return '🌍';
      default:
        return '📄';
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      {isAdmin && (
        <div className="bg-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Upload New Dataset</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Dataset Name *
              </label>
              <input
                type="text"
                value={uploadForm.name}
                onChange={(e) => setUploadForm(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter dataset name..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <input
                type="text"
                value={uploadForm.description}
                onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Optional description..."
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Select File *
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".geojson,.json,.shp,.kml"
              onChange={handleFileSelect}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
            />
            <p className="text-xs text-gray-400 mt-1">
              Supported formats: GeoJSON (.geojson, .json), Shapefile (.shp), KML (.kml)
            </p>
          </div>

          {uploadForm.file && (
            <div className="mb-4 p-3 bg-slate-700 rounded-lg">
              <div className="flex items-center space-x-2 text-sm text-gray-300">
                <FileText className="h-4 w-4" />
                <span>{uploadForm.file.name}</span>
                <span className="text-gray-400">({formatFileSize(uploadForm.file.size)})</span>
              </div>
            </div>
          )}

          {uploading && (
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm text-gray-300 mb-2">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={!uploadForm.file || !uploadForm.name.trim() || uploading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {uploading ? (
              <Loader className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            <span>{uploading ? 'Uploading...' : 'Upload Dataset'}</span>
          </button>
        </div>
      )}

      {/* Status Messages */}
      {error && (
        <div className="bg-red-900/20 border border-red-600 rounded-lg p-4 flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
          <span className="text-red-400">{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-900/20 border border-green-600 rounded-lg p-4 flex items-center space-x-2">
          <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
          <span className="text-green-400">{success}</span>
        </div>
      )}

      {/* Datasets List */}
      <div className="bg-slate-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Map Datasets</h2>
        
        {isLoading ? (
          <div className="text-center py-8">
            <Loader className="h-8 w-8 text-blue-400 animate-spin mx-auto mb-2" />
            <p className="text-gray-400">Loading datasets...</p>
          </div>
        ) : datasets.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">No datasets uploaded yet.</p>
            {isAdmin && (
              <p className="text-gray-500 text-sm mt-2">Upload your first dataset to get started!</p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-2 text-gray-300">Dataset</th>
                  <th className="text-left py-3 px-2 text-gray-300 hidden sm:table-cell">Type</th>
                  <th className="text-left py-3 px-2 text-gray-300 hidden md:table-cell">Size</th>
                  <th className="text-left py-3 px-2 text-gray-300 hidden lg:table-cell">Created</th>
                  <th className="text-left py-3 px-2 text-gray-300">Status</th>
                  {isAdmin && <th className="text-left py-3 px-2 text-gray-300">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {datasets.map(dataset => (
                  <tr key={dataset.id} className="hover:bg-slate-700/50">
                    <td className="py-3 px-2">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{getFileTypeIcon(dataset.file_type)}</span>
                          <div>
                            <div className="text-white font-medium">{dataset.name}</div>
                            {dataset.description && (
                              <div className="text-gray-400 text-xs">{dataset.description}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-gray-300 hidden sm:table-cell">
                      <span className="px-2 py-1 bg-slate-600 rounded text-xs uppercase">
                        {dataset.file_type}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-gray-300 hidden md:table-cell">
                      {formatFileSize(dataset.file_size)}
                    </td>
                    <td className="py-3 px-2 text-gray-300 hidden lg:table-cell">
                      {new Date(dataset.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-2">
                      <span className={`flex items-center space-x-1 text-xs ${
                        dataset.is_active ? 'text-green-400' : 'text-gray-400'
                      }`}>
                        {dataset.is_active ? (
                          <>
                            <Eye className="h-3 w-3" />
                            <span>Active</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="h-3 w-3" />
                            <span>Hidden</span>
                          </>
                        )}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="py-3 px-2">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleToggleActive(dataset.id, dataset.is_active)}
                            className={`p-1 rounded ${
                              dataset.is_active 
                                ? 'text-yellow-400 hover:bg-yellow-900/20' 
                                : 'text-green-400 hover:bg-green-900/20'
                            }`}
                            title={dataset.is_active ? 'Hide dataset' : 'Show dataset'}
                          >
                            {dataset.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                          <a
                            href={dataset.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-blue-400 hover:bg-blue-900/20 rounded"
                            title="Download dataset"
                          >
                            <Download className="h-4 w-4" />
                          </a>
                          <button
                            onClick={() => handleDelete(dataset.id, dataset.name)}
                            className="p-1 text-red-400 hover:bg-red-900/20 rounded"
                            title="Delete dataset"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Usage Statistics */}
      <div className="bg-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Dataset Statistics</h3>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-white mb-1">{datasets.length}</div>
            <div className="text-sm text-gray-300">Total Datasets</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white mb-1">
              {datasets.filter(d => d.is_active).length}
            </div>
            <div className="text-sm text-gray-300">Active Datasets</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white mb-1">
              {formatFileSize(datasets.reduce((sum, d) => sum + d.file_size, 0))}
            </div>
            <div className="text-sm text-gray-300">Total Size</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white mb-1">
              {datasets.filter(d => d.file_type === 'geojson').length}
            </div>
            <div className="text-sm text-gray-300">GeoJSON Files</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatasetManager;