import React, { useState } from 'react';
import { useGraph } from '../../contexts/GraphContext';
import { dijkstra, astar, bellmanFord } from '../../utils/algorithms';
import { PathResult, Place, LatLng } from '../../types';
import { Play, MapPin, Clock, Route as RouteIcon, RefreshCw, AlertCircle } from 'lucide-react';
import LeafletMapComponent from '../maps/LeafletMapComponent';
import PlaceSearchInput from './PlaceSearchInput';
import { openRouteService } from '../../services/openRouteService';

const RoutePlanner: React.FC = () => {
  const { graph, refreshGraph, isLoading: graphLoading } = useGraph();
  const [startPlace, setStartPlace] = useState<Place | null>(null);
  const [endPlace, setEndPlace] = useState<Place | null>(null);
  const [algorithm, setAlgorithm] = useState<'dijkstra' | 'astar' | 'bellman-ford'>('dijkstra');
  const [pathResult, setPathResult] = useState<PathResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [profile, setProfile] = useState<'driving-car' | 'foot-walking' | 'cycling-regular'>('driving-car');
  const [error, setError] = useState<string>('');

  const canCalculateRoute = startPlace && endPlace && !isCalculating;

  const handleCalculateRoute = async () => {
    if (!startPlace || !endPlace) {
      setError('Please select both start and destination locations');
      return;
    }

    setIsCalculating(true);
    setError('');
    
    try {
      console.log('Calculating route from', startPlace.name, 'to', endPlace.name);
      
      // Get OpenRouteService directions
      const orsResult = await openRouteService.getDirections(
        startPlace.location,
        endPlace.location,
        undefined,
        profile
      );

      console.log('ORS Result:', orsResult);

      // Apply algorithm optimization if we have graph data
      let optimizedResult: PathResult = orsResult;
      
      if (graph.nodes.length > 0) {
        // Find nearest nodes to start and end points
        const startNode = findNearestNode(startPlace.location);
        const endNode = findNearestNode(endPlace.location);
        
        if (startNode && endNode) {
          let algorithmResult: PathResult;
          
          switch (algorithm) {
            case 'astar':
              algorithmResult = astar(graph, startNode.id, endNode.id);
              break;
            case 'bellman-ford':
              algorithmResult = bellmanFord(graph, startNode.id, endNode.id);
              break;
            default:
              algorithmResult = dijkstra(graph, startNode.id, endNode.id);
          }
          
          // Combine ORS route with algorithm optimization
          optimizedResult = {
            ...orsResult,
            algorithm: `${algorithmResult.algorithm} + OpenRouteService (${algorithmResult.path.length} nodes)`,
          };
        }
      }
      
      setPathResult(optimizedResult);
      console.log('Route calculated successfully:', optimizedResult);
    } catch (error) {
      console.error('Route calculation failed:', error);
      setError(error instanceof Error ? error.message : 'Failed to calculate route. Please check your API key and try again.');
    } finally {
      setIsCalculating(false);
    }
  };

  const findNearestNode = (location: LatLng) => {
    if (graph.nodes.length === 0) return null;
    
    let nearestNode = graph.nodes[0];
    let minDistance = calculateDistance(location, nearestNode.location);
    
    for (const node of graph.nodes) {
      const distance = calculateDistance(location, node.location);
      if (distance < minDistance) {
        minDistance = distance;
        nearestNode = node;
      }
    }
    
    return nearestNode;
  };

  const calculateDistance = (point1: LatLng, point2: LatLng): number => {
    const R = 6371; // Earth's radius in km
    const dLat = toRadians(point2.lat - point1.lat);
    const dLng = toRadians(point2.lng - point1.lng);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(point1.lat)) * Math.cos(toRadians(point2.lat)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const toRadians = (degrees: number): number => {
    return degrees * (Math.PI / 180);
  };

  const handleRefreshGraph = async () => {
    const center = startPlace?.location || endPlace?.location || { lat: 37.7749, lng: -122.4194 };
    await refreshGraph(center);
  };

  const clearRoute = () => {
    setPathResult(null);
    setError('');
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Real-World Route Planner</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Start Location
            </label>
            <PlaceSearchInput
              placeholder="Search for starting location..."
              onPlaceSelect={(place) => {
                setStartPlace(place);
                clearRoute();
              }}
              value={startPlace?.name || ''}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Destination
            </label>
            <PlaceSearchInput
              placeholder="Search for destination..."
              onPlaceSelect={(place) => {
                setEndPlace(place);
                clearRoute();
              }}
              value={endPlace?.name || ''}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Travel Mode
            </label>
            <select
              value={profile}
              onChange={(e) => {
                setProfile(e.target.value as 'driving-car' | 'foot-walking' | 'cycling-regular');
                clearRoute();
              }}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="driving-car">🚗 Driving</option>
              <option value="foot-walking">🚶 Walking</option>
              <option value="cycling-regular">🚴 Cycling</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Optimization Algorithm
            </label>
            <select
              value={algorithm}
              onChange={(e) => setAlgorithm(e.target.value as 'dijkstra' | 'astar' | 'bellman-ford')}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="dijkstra">Dijkstra's (Shortest Distance)</option>
              <option value="astar">A* (Fastest Route)</option>
              <option value="bellman-ford">Bellman-Ford (Traffic Aware)</option>
            </select>
          </div>

          <div className="flex items-end space-x-2 sm:col-span-2 lg:col-span-1">
            <button
              onClick={handleCalculateRoute}
              disabled={!canCalculateRoute}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
            >
              {isCalculating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  <span className="hidden sm:inline">Calculating...</span>
                  <span className="sm:hidden">...</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Find Route</span>
                  <span className="sm:hidden">Find</span>
                </>
              )}
            </button>
            
            <button
              onClick={handleRefreshGraph}
              disabled={graphLoading}
              className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
              title="Refresh network data"
            >
              <RefreshCw className={`h-4 w-4 ${graphLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
        
        {error && (
          <div className="mt-4 p-3 bg-red-900/20 border border-red-600 rounded-lg flex items-center">
            <AlertCircle className="h-5 w-5 text-red-400 mr-2 flex-shrink-0" />
            <span className="text-red-400 text-sm">{error}</span>
          </div>
        )}

        {!import.meta.env.VITE_OPENROUTESERVICE_API_KEY && (
          <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-600 rounded-lg flex items-center">
            <AlertCircle className="h-5 w-5 text-yellow-400 mr-2 flex-shrink-0" />
            <span className="text-yellow-400 text-sm">
              OpenRouteService API key not configured. Please add VITE_OPENROUTESERVICE_API_KEY to your .env file.
            </span>
          </div>
        )}
        
        {graphLoading && (
          <div className="mt-4 text-center text-gray-300">
            <div className="inline-flex items-center">
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              Loading real-time network data...
            </div>
          </div>
        )}
      </div>

      {pathResult && (
        <div className="bg-slate-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Route Results</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div className="bg-slate-700 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <RouteIcon className="h-5 w-5 text-blue-400 mr-2" />
                <span className="text-sm text-gray-300">Total Distance</span>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-white">
                {pathResult.totalDistance === Infinity ? 'No Path' : `${pathResult.totalDistance} km`}
              </div>
            </div>

            <div className="bg-slate-700 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <Clock className="h-5 w-5 text-green-400 mr-2" />
                <span className="text-sm text-gray-300">Estimated Time</span>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-white">
                {pathResult.estimatedTime === Infinity ? 'N/A' : `${pathResult.estimatedTime} min`}
              </div>
            </div>

            <div className="bg-slate-700 rounded-lg p-4 sm:col-span-2 lg:col-span-1">
              <div className="flex items-center mb-2">
                <MapPin className="h-5 w-5 text-purple-400 mr-2" />
                <span className="text-sm text-gray-300">Algorithm Used</span>
              </div>
              <div className="text-lg font-bold text-white">
                {pathResult.algorithm}
              </div>
            </div>
          </div>

          {startPlace && endPlace && (
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-300 mb-2">Route Details:</h4>
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-white text-sm">{startPlace.name}</span>
                </div>
                <span className="text-gray-400 hidden sm:inline">→</span>
                <span className="text-gray-400 sm:hidden">↓</span>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-white text-sm">{endPlace.name}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="bg-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Interactive Map</h3>
        <LeafletMapComponent
          pathResult={pathResult || undefined}
          startPlace={startPlace || undefined}
          endPlace={endPlace || undefined}
          center={startPlace?.location || endPlace?.location || { lat: 37.7749, lng: -122.4194 }}
          className="w-full h-64 sm:h-80 lg:h-96"
          showDatasetLayers={true}
        />
      </div>
    </div>
  );
};

export default RoutePlanner;