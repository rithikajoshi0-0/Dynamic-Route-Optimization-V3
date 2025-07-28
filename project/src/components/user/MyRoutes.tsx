import React, { useState } from 'react';
import { useGraph } from '../../contexts/GraphContext';
import { useAuth } from '../../contexts/AuthContext';
import { Route, Clock, MapPin, Heart, Trash2 } from 'lucide-react';

const MyRoutes: React.FC = () => {
  const { graph } = useGraph();
  const { user } = useAuth();
  const [routes, setRoutes] = useState<Route[]>([]);

  const getNodeName = (nodeId: string) => {
    return graph.nodes.find(n => n.id === nodeId)?.name || nodeId;
  };

  const toggleFavorite = (routeId: string) => {
    setRoutes(routes.map(route => 
      route.id === routeId 
        ? { ...route, isFavorite: !route.isFavorite }
        : route
    ));
  };

  const deleteRoute = (routeId: string) => {
    setRoutes(routes.filter(route => route.id !== routeId));
  };

  const getAlgorithmColor = (algorithm: string) => {
    switch (algorithm) {
      case 'dijkstra': return 'bg-blue-600';
      case 'astar': return 'bg-green-600';
      case 'bellman-ford': return 'bg-purple-600';
      default: return 'bg-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">My Routes</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {routes.map(route => (
            <div key={route.id} className="bg-slate-700 rounded-lg p-4 relative">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5 text-blue-400" />
                  <span className="text-white font-medium text-sm sm:text-base">
                    {getNodeName(route.startNode)} → {getNodeName(route.endNode)}
                  </span>
                </div>
                <button
                  onClick={() => toggleFavorite(route.id)}
                  className={`p-1 rounded ${
                    route.isFavorite ? 'text-red-400' : 'text-gray-400 hover:text-red-400'
                  }`}
                >
                  <Heart className={`h-4 w-4 ${route.isFavorite ? 'fill-current' : ''}`} />
                </button>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Distance:</span>
                  <span className="text-white font-medium">{route.totalDistance} km</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Time:</span>
                  <span className="text-white font-medium">{route.estimatedTime} min</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Algorithm:</span>
                  <span className={`px-2 py-1 rounded text-xs text-white ${getAlgorithmColor(route.algorithm)}`}>
                    {route.algorithm.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="mb-4">
                <div className="text-sm text-gray-300 mb-2">Route Path:</div>
                <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                  {route.path.map((nodeId, index) => (
                    <React.Fragment key={nodeId}>
                      <span className="px-2 py-1 bg-blue-600 text-white rounded text-xs break-all">
                        {getNodeName(nodeId)}
                      </span>
                      {index < route.path.length - 1 && (
                        <span className="text-gray-400 self-center text-xs">→</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-600">
                <div className="flex items-center text-gray-400 text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  {new Date(route.createdAt).toLocaleDateString()}
                </div>
                <button
                  onClick={() => deleteRoute(route.id)}
                  className="text-red-400 hover:text-red-300 p-1 rounded transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {routes.length === 0 && (
          <div className="text-center py-8">
            <Route className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">
              No routes saved yet. Start by planning your first route with real-time data!
            </p>
          </div>
        )}
      </div>

      <div className="bg-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Route Statistics</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-white mb-2">{routes.length}</div>
            <div className="text-sm text-gray-300">Total Routes</div>
          </div>
          
          <div className="bg-slate-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-white mb-2">
              {routes.filter(r => r.isFavorite).length}
            </div>
            <div className="text-sm text-gray-300">Favorite Routes</div>
          </div>
          
          <div className="bg-slate-700 rounded-lg p-4 text-center">
            <div className="text-xl sm:text-2xl font-bold text-white mb-2">
              {routes.reduce((sum, route) => sum + route.totalDistance, 0).toFixed(1)} km
            </div>
            <div className="text-sm text-gray-300">Total Distance</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyRoutes;