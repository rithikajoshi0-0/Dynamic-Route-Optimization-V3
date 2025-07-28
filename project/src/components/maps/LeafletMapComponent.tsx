import React, { useEffect, useRef, useState, useCallback } from 'react';
import { PathResult, LatLng, Place } from '../../types';
import { useMapData } from '../../contexts/MapDataContext';
import { MapPin, Navigation, Loader, ExternalLink, Layers, Save } from 'lucide-react';

interface LeafletMapComponentProps {
  pathResult?: PathResult;
  startPlace?: Place;
  endPlace?: Place;
  center?: LatLng;
  className?: string;
  showDatasetLayers?: boolean;
  onRouteClick?: (routeData: any) => void;
}

const LeafletMapComponent: React.FC<LeafletMapComponentProps> = ({
  pathResult,
  startPlace,
  endPlace,
  center = { lat: 37.7749, lng: -122.4194 },
  className = "w-full h-64 sm:h-80 lg:h-96",
  showDatasetLayers = true,
  onRouteClick,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [error, setError] = useState<string>('');
  const [showLayerControl, setShowLayerControl] = useState(false);
  const [activeLayers, setActiveLayers] = useState<Set<string>>(new Set());
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [routeName, setRouteName] = useState('');
  
  const { datasets, saveRoute } = useMapData();
  const layerGroupsRef = useRef<Map<string, any>>(new Map());

  useEffect(() => {
    let isMounted = true;

    const initializeMap = async () => {
      if (!mapRef.current || !isMounted) return;

      try {
        setIsLoading(true);
        setError('');
        
        // Check if Leaflet is already loaded
        if (window.L) {
          createMap(window.L);
          return;
        }

        // Load Leaflet CSS
        if (!document.querySelector('link[href*="leaflet"]')) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
          link.crossOrigin = '';
          document.head.appendChild(link);
        }

        // Load Leaflet JS
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
        script.crossOrigin = '';
        
        script.onload = () => {
          if (isMounted && window.L) {
            createMap(window.L);
          }
        };
        
        script.onerror = () => {
          if (isMounted) {
            setError('Failed to load map library');
            setIsLoading(false);
          }
        };
        
        document.head.appendChild(script);

      } catch (error) {
        console.error('Failed to initialize map:', error);
        if (isMounted) {
          setError('Failed to initialize map');
          setIsLoading(false);
        }
      }
    };

    const createMap = (L: any) => {
      if (!mapRef.current || !isMounted) return;

      try {
        // Clear any existing map
        if (mapRef.current._leaflet_id) {
          const existingMap = (window as any).leafletMaps?.[mapRef.current._leaflet_id];
          if (existingMap) {
            existingMap.remove();
          }
        }

        // Fix for default markers
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        });

        const map = L.map(mapRef.current, {
          zoomControl: true,
          attributionControl: true,
          maxZoom: 18,
          minZoom: 2,
          maxBounds: [
            [-90, -180], // Southwest coordinates
            [90, 180]    // Northeast coordinates
          ],
          maxBoundsViscosity: 1.0
        }).setView([center.lat, center.lng], 13);

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(map);

        // Store map reference globally for cleanup
        if (!window.leafletMaps) {
          window.leafletMaps = {};
        }
        window.leafletMaps[mapRef.current._leaflet_id] = map;

        if (isMounted) {
          setMapInstance(map);
          setLeafletLoaded(true);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Failed to create map:', error);
        if (isMounted) {
          setError('Failed to create map');
          setIsLoading(false);
        }
      }
    };

    initializeMap();

    return () => {
      isMounted = false;
      if (mapInstance) {
        try {
          mapInstance.remove();
        } catch (e) {
          console.warn('Error removing map:', e);
        }
      }
    };
  }, [center.lat, center.lng]);

  // Load dataset layers
  const loadDatasetLayers = useCallback(async () => {
    if (!mapInstance || !leafletLoaded || !window.L || !showDatasetLayers) return;

    const L = window.L;

    try {
      // Clear existing dataset layers
      layerGroupsRef.current.forEach((layerGroup) => {
        mapInstance.removeLayer(layerGroup);
      });
      layerGroupsRef.current.clear();

      // Add active datasets as layers
      for (const dataset of datasets.filter(d => d.is_active)) {
        if (dataset.geojson_data && activeLayers.has(dataset.id)) {
          const layerGroup = L.geoJSON(dataset.geojson_data, {
            style: {
              color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
              weight: 2,
              opacity: 0.8,
              fillOpacity: 0.3,
            },
            onEachFeature: (feature: any, layer: any) => {
              if (feature.properties) {
                const popupContent = Object.entries(feature.properties)
                  .map(([key, value]) => `<strong>${key}:</strong> ${value}`)
                  .join('<br>');
                layer.bindPopup(`
                  <div>
                    <h4 style="margin: 0 0 8px 0; color: #3b82f6;">${dataset.name}</h4>
                    ${popupContent}
                  </div>
                `);
              }
              
              layer.on('click', () => {
                if (onRouteClick) {
                  onRouteClick({
                    datasetId: dataset.id,
                    datasetName: dataset.name,
                    feature: feature,
                  });
                }
              });
            },
          }).addTo(mapInstance);

          layerGroupsRef.current.set(dataset.id, layerGroup);
        }
      }
    } catch (error) {
      console.error('Error loading dataset layers:', error);
    }
  }, [mapInstance, leafletLoaded, datasets, activeLayers, showDatasetLayers, onRouteClick]);

  useEffect(() => {
    loadDatasetLayers();
  }, [loadDatasetLayers]);

  // Update map with route and markers
  useEffect(() => {
    if (!mapInstance || !leafletLoaded || !window.L) return;

    const updateMap = async () => {
      const L = window.L;
      
      try {
        // Clear existing route layers (but keep dataset layers)
        mapInstance.eachLayer((layer: any) => {
          if (layer instanceof L.Marker || 
              (layer instanceof L.Polyline && !layerGroupsRef.current.has(layer._leaflet_id))) {
            mapInstance.removeLayer(layer);
          }
        });

        const markers: any[] = [];
        let bounds: any = null;

        // Add start marker
        if (startPlace) {
          const startIcon = L.divIcon({
            className: 'custom-div-icon',
            html: `
              <div style="
                background-color: #22c55e; 
                width: 24px; 
                height: 24px; 
                border-radius: 50%; 
                border: 3px solid white; 
                display: flex; 
                align-items: center; 
                justify-content: center;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
              ">
                <span style="color: white; font-size: 12px; font-weight: bold;">S</span>
              </div>
            `,
            iconSize: [30, 30],
            iconAnchor: [15, 15],
            popupAnchor: [0, -15]
          });

          const startMarker = L.marker([startPlace.location.lat, startPlace.location.lng], {
            icon: startIcon
          }).addTo(mapInstance);
          
          startMarker.bindPopup(`<div style="font-weight: bold; color: #22c55e;">Start Location</div><div>${startPlace.name}</div><div style="font-size: 12px; color: #666;">${startPlace.address}</div>`);
          markers.push(startMarker);
        }

        // Add end marker
        if (endPlace) {
          const endIcon = L.divIcon({
            className: 'custom-div-icon',
            html: `
              <div style="
                background-color: #ef4444; 
                width: 24px; 
                height: 24px; 
                border-radius: 50%; 
                border: 3px solid white; 
                display: flex; 
                align-items: center; 
                justify-content: center;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
              ">
                <span style="color: white; font-size: 12px; font-weight: bold;">E</span>
              </div>
            `,
            iconSize: [30, 30],
            iconAnchor: [15, 15],
            popupAnchor: [0, -15]
          });

          const endMarker = L.marker([endPlace.location.lat, endPlace.location.lng], {
            icon: endIcon
          }).addTo(mapInstance);
          
          endMarker.bindPopup(`<div style="font-weight: bold; color: #ef4444;">Destination</div><div>${endPlace.name}</div><div style="font-size: 12px; color: #666;">${endPlace.address}</div>`);
          markers.push(endMarker);
        }

        // Draw route if available
        if (pathResult?.directions?.features && 
            Array.isArray(pathResult.directions.features) && 
            pathResult.directions.features.length > 0 &&
            pathResult.directions.features[0]?.geometry?.coordinates &&
            Array.isArray(pathResult.directions.features[0].geometry.coordinates)) {
            
          const coordinates = pathResult.directions.features[0].geometry.coordinates.map(
            (coord: [number, number]) => [coord[1], coord[0]] // Swap lng,lat to lat,lng for Leaflet
          );

          if (coordinates.length > 1) {
            const polyline = L.polyline(coordinates, {
              color: '#3b82f6',
              weight: 5,
              opacity: 0.8,
              smoothFactor: 1
            }).addTo(mapInstance);

            // Add route popup with details
            const midpoint = coordinates[Math.floor(coordinates.length / 2)];
            const routePopup = L.popup()
              .setLatLng(midpoint)
              .setContent(`
                <div style="text-align: center;">
                  <div style="font-weight: bold; color: #3b82f6; margin-bottom: 5px;">Route Details</div>
                  <div>Distance: ${pathResult.totalDistance} km</div>
                  <div>Duration: ${pathResult.estimatedTime} min</div>
                  <div style="font-size: 12px; color: #666; margin-top: 5px;">${pathResult.algorithm}</div>
                </div>
              `);

            polyline.bindPopup(routePopup);

            // Create bounds including route and markers
            bounds = L.featureGroup([polyline, ...markers]).getBounds();
          }
        }

        // Fit map to show all elements
        if (bounds) {
          mapInstance.fitBounds(bounds, { 
            padding: [20, 20],
            maxZoom: 16,
            minZoom: 8
          });
        } else if (markers.length > 0) {
          if (markers.length === 1) {
            const markerLatLng = markers[0].getLatLng();
            mapInstance.setView([markerLatLng.lat, markerLatLng.lng], Math.min(15, mapInstance.getMaxZoom()));
          } else {
            const group = L.featureGroup(markers);
            mapInstance.fitBounds(group.getBounds(), { 
              padding: [50, 50],
              maxZoom: 16,
              minZoom: 8
            });
          }
        }

      } catch (error) {
        console.error('Error updating map:', error);
        setError('Error displaying route on map');
      }
    };

    updateMap();
  }, [mapInstance, leafletLoaded, pathResult, startPlace, endPlace]);

  const toggleLayer = (datasetId: string) => {
    const newActiveLayers = new Set(activeLayers);
    if (newActiveLayers.has(datasetId)) {
      newActiveLayers.delete(datasetId);
    } else {
      newActiveLayers.add(datasetId);
    }
    setActiveLayers(newActiveLayers);
  };

  const handleSaveRoute = async () => {
    if (!pathResult || !routeName.trim()) return;

    try {
      await saveRoute(routeName, {
        pathResult,
        startPlace,
        endPlace,
        timestamp: new Date().toISOString(),
      }, undefined, true);
      
      setShowSaveDialog(false);
      setRouteName('');
    } catch (error) {
      console.error('Error saving route:', error);
    }
  };

  if (error) {
    return (
      <div className={`${className} bg-slate-800 rounded-lg flex items-center justify-center`}>
        <div className="text-center text-red-400">
          <MapPin className="h-8 w-8 mx-auto mb-2" />
          <p className="text-sm">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className} relative`}>
      {isLoading && (
        <div className="absolute inset-0 bg-slate-800 rounded-lg flex items-center justify-center z-10">
          <div className="text-center">
            <Loader className="h-8 w-8 text-blue-400 animate-spin mx-auto mb-2" />
            <p className="text-gray-300 text-sm">Loading Interactive Map...</p>
          </div>
        </div>
      )}
      
      <div
        ref={mapRef}
        className={`${className} rounded-lg ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity`}
        style={{ background: '#1e293b' }}
      />
      
      {/* Layer Control */}
      {showDatasetLayers && datasets.length > 0 && !isLoading && (
        <div className="absolute top-2 left-2 sm:top-4 sm:left-4">
          <button
            onClick={() => setShowLayerControl(!showLayerControl)}
            className="bg-slate-800/90 backdrop-blur-sm rounded-lg p-2 text-white hover:bg-slate-700/90 transition-colors shadow-lg"
            title="Toggle Layers"
          >
            <Layers className="h-4 w-4" />
          </button>
          
          {showLayerControl && (
            <div className="absolute top-12 left-0 bg-slate-800/95 backdrop-blur-sm rounded-lg p-3 shadow-lg min-w-48 max-h-48 overflow-y-auto">
              <h4 className="text-white font-medium mb-2 text-sm">Map Layers</h4>
              <div className="space-y-2">
                {datasets.filter(d => d.is_active).map(dataset => (
                  <label key={dataset.id} className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      checked={activeLayers.has(dataset.id)}
                      onChange={() => toggleLayer(dataset.id)}
                      className="rounded"
                    />
                    <span className="text-gray-300 truncate">{dataset.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Route Info */}
      {pathResult && !isLoading && (
        <div className="absolute top-2 right-2 sm:top-4 sm:right-4 flex space-x-2">
          <div className="bg-slate-800/90 backdrop-blur-sm rounded-lg p-2 sm:p-3 text-white shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2 text-xs sm:text-sm">
              <Navigation className="h-4 w-4 text-blue-400" />
              <div className="flex items-center space-x-2">
                <span className="font-medium">{pathResult.totalDistance} km</span>
                <span className="hidden sm:inline text-gray-400">•</span>
                <span className="font-medium">{pathResult.estimatedTime} min</span>
              </div>
              <span className="text-blue-400 text-xs bg-blue-900/30 px-2 py-1 rounded">
                {pathResult.algorithm}
              </span>
            </div>
          </div>
          
          <button
            onClick={() => setShowSaveDialog(true)}
            className="bg-slate-800/90 backdrop-blur-sm rounded-lg p-2 text-white hover:bg-slate-700/90 transition-colors shadow-lg"
            title="Save Route"
          >
            <Save className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Save Route Dialog */}
      {showSaveDialog && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
          <div className="bg-slate-800 rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-white font-semibold mb-4">Save Route</h3>
            <input
              type="text"
              value={routeName}
              onChange={(e) => setRouteName(e.target.value)}
              placeholder="Enter route name..."
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            />
            <div className="flex space-x-3">
              <button
                onClick={handleSaveRoute}
                disabled={!routeName.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setShowSaveDialog(false);
                  setRouteName('');
                }}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {!pathResult && (startPlace || endPlace) && !isLoading && (
        <div className="absolute bottom-2 left-2 sm:bottom-4 sm:left-4 bg-slate-800/90 backdrop-blur-sm rounded-lg p-2 sm:p-3 text-white shadow-lg">
          <div className="flex items-center space-x-2 text-xs sm:text-sm">
            <MapPin className="h-4 w-4 text-blue-400" />
            <span>
              {startPlace && endPlace ? 'Ready to calculate route' : 
               startPlace ? 'Start location set' : 'End location set'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

// Extend Window interface for TypeScript
declare global {
  interface Window {
    L: any;
    leafletMaps: { [key: string]: any };
  }
}

export default LeafletMapComponent;