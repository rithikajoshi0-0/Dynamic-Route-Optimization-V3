import React, { useState } from 'react';
import { AdvancedMap } from '@/components/ui/interactive-map';
import type { MarkerData, PolygonData, CircleData } from '@/components/ui/interactive-map';

export default function MapDemo() {
  const [markers, setMarkers] = useState<MarkerData[]>([
    {
      id: 1,
      position: [51.505, -0.09],
      color: 'blue',
      size: 'medium',
      popup: {
        title: 'London',
        content: 'Capital of England',
        image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400&h=300&fit=crop'
      }
    },
    {
      id: 2,
      position: [51.51, -0.1],
      color: 'red',
      size: 'large',
      popup: {
        title: 'Westminster',
        content: 'Political center of London'
      }
    },
    {
      id: 3,
      position: [51.515, -0.072],
      color: 'green',
      size: 'medium',
      popup: {
        title: 'Tower Bridge',
        content: 'Famous London landmark',
        image: 'https://images.unsplash.com/photo-1533929736458-ca588d08c8be?w=400&h=300&fit=crop'
      }
    }
  ]);

  const polygons: PolygonData[] = [
    {
      id: 1,
      positions: [
        [51.515, -0.09],
        [51.52, -0.1],
        [51.52, -0.12],
        [51.515, -0.11]
      ],
      style: { color: 'green', weight: 2, fillOpacity: 0.4 },
      popup: 'Hyde Park Area'
    }
  ];

  const circles: CircleData[] = [
    {
      id: 1,
      center: [51.508, -0.11],
      radius: 500,
      style: { color: 'purple', fillOpacity: 0.3 },
      popup: '500m radius from center'
    }
  ];

  const handleMarkerClick = (marker: MarkerData) => {
    console.log('Marker clicked:', marker);
    alert(`Clicked on ${marker.popup?.title || 'marker'}`);
  };

  const handleMapClick = (latlng: L.LatLng) => {
    console.log('Map clicked at:', latlng);
    
    // Add a new marker where clicked
    const newMarker: MarkerData = {
      id: Date.now(),
      position: [latlng.lat, latlng.lng],
      color: 'orange',
      size: 'small',
      popup: {
        title: 'New Location',
        content: `Lat: ${latlng.lat.toFixed(4)}, Lng: ${latlng.lng.toFixed(4)}`
      }
    };
    
    setMarkers(prev => [...prev, newMarker]);
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-800 rounded-lg p-6">
        <h1 className="text-2xl font-bold text-white mb-4">Advanced Interactive Map Demo</h1>
        <p className="text-gray-300 mb-4">
          This demo showcases the integrated interactive map component with clustering, search, and custom controls.
          Click anywhere on the map to add new markers!
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-700 rounded-lg p-4">
            <div className="text-2xl font-bold text-white">{markers.length}</div>
            <div className="text-sm text-gray-300">Total Markers</div>
          </div>
          <div className="bg-slate-700 rounded-lg p-4">
            <div className="text-2xl font-bold text-white">{polygons.length}</div>
            <div className="text-sm text-gray-300">Polygon Areas</div>
          </div>
          <div className="bg-slate-700 rounded-lg p-4">
            <div className="text-2xl font-bold text-white">{circles.length}</div>
            <div className="text-sm text-gray-300">Circle Overlays</div>
          </div>
        </div>

        <AdvancedMap
          center={[51.505, -0.09]}
          zoom={13}
          markers={markers}
          polygons={polygons}
          circles={circles}
          onMarkerClick={handleMarkerClick}
          onMapClick={handleMapClick}
          enableClustering={true}
          enableSearch={true}
          enableControls={true}
          className="rounded-lg overflow-hidden border border-slate-600"
          style={{ height: '600px', width: '100%' }}
        />
        
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => setMarkers([])}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Clear Markers
          </button>
          <button
            onClick={() => {
              const newMarker: MarkerData = {
                id: Date.now(),
                position: [51.505 + (Math.random() - 0.5) * 0.02, -0.09 + (Math.random() - 0.5) * 0.02],
                color: ['blue', 'red', 'green', 'orange', 'yellow'][Math.floor(Math.random() * 5)],
                size: ['small', 'medium', 'large'][Math.floor(Math.random() * 3)] as 'small' | 'medium' | 'large',
                popup: {
                  title: `Random Location ${Date.now()}`,
                  content: 'Randomly generated marker'
                }
              };
              setMarkers(prev => [...prev, newMarker]);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Random Marker
          </button>
        </div>
      </div>
    </div>
  );
}
