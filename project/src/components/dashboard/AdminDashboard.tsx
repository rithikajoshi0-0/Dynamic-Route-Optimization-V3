import React from 'react';
import { useGraph } from '../../contexts/GraphContext';
import { 
  Users, 
  Route, 
  Activity, 
  TrendingUp, 
  AlertTriangle,
  Clock
} from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const { graph } = useGraph();
  
  // Calculate real-time analytics from actual graph data
  const analytics = {
    totalRoutes: 0, // This would come from a real database
    algorithmUsage: {
      dijkstra: 0,
      astar: 0,
      'bellman-ford': 0,
    },
    mostCongestedPaths: graph.edges
      .filter(edge => edge.trafficLevel === 'high')
      .slice(0, 3)
      .map(edge => {
        const fromNode = graph.nodes.find(n => n.id === edge.from);
        const toNode = graph.nodes.find(n => n.id === edge.to);
        return {
          path: `${fromNode?.name || 'Unknown'} → ${toNode?.name || 'Unknown'}`,
          congestionLevel: edge.currentWeight / edge.baseWeight,
        };
      }),
    activeUsers: 1, // This would come from real user session data
    peakHours: [8, 9, 17, 18, 19], // This could be calculated from real traffic data
  };

  const getTrafficColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-red-400';
      case 'medium': return 'text-yellow-400';
      default: return 'text-green-400';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">System Overview</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-700 rounded-lg p-4">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-400" />
              <div className="ml-4">
                <p className="text-sm text-gray-300">Network Nodes</p>
                <p className="text-2xl font-bold text-white">{graph.nodes.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-700 rounded-lg p-4">
            <div className="flex items-center">
              <Route className="h-8 w-8 text-green-400" />
              <div className="ml-4">
                <p className="text-sm text-gray-300">Network Edges</p>
                <p className="text-2xl font-bold text-white">{graph.edges.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-700 rounded-lg p-4">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-purple-400" />
              <div className="ml-4">
                <p className="text-sm text-gray-300">High Traffic Routes</p>
                <p className="text-2xl font-bold text-white">
                  {graph.edges.filter(e => e.trafficLevel === 'high').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-700 rounded-lg p-4">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-orange-400" />
              <div className="ml-4">
                <p className="text-sm text-gray-300">Blocked Routes</p>
                <p className="text-2xl font-bold text-white">
                  {graph.edges.filter(e => e.isBlocked).length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-slate-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Real-time Traffic Distribution</h3>
          <div className="space-y-3">
            {['low', 'medium', 'high'].map((level) => {
              const count = graph.edges.filter(e => e.trafficLevel === level).length;
              const percentage = graph.edges.length > 0 ? (count / graph.edges.length) * 100 : 0;
              return (
                <div key={level} className="flex items-center justify-between">
                  <span className="text-gray-300 capitalize">{level} Traffic</span>
                  <div className="flex items-center">
                    <div className="w-20 sm:w-32 bg-slate-700 rounded-full h-2 mr-3">
                      <div 
                        className={`h-2 rounded-full ${
                          level === 'high' ? 'bg-red-500' : 
                          level === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-white font-medium">{count}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Most Congested Routes</h3>
          <div className="space-y-3">
            {analytics.mostCongestedPaths.length > 0 ? (
              analytics.mostCongestedPaths.map((path, index) => (
                <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between space-y-1 sm:space-y-0">
                  <span className="text-gray-300 text-sm break-words">{path.path}</span>
                  <div className="flex items-center">
                    <AlertTriangle className="h-4 w-4 text-red-400 mr-2" />
                    <span className="text-red-400 font-medium">
                      {Math.round(path.congestionLevel * 100)}%
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-400">No high traffic routes detected</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Current Network Status</h3>
        {graph.nodes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {graph.edges.slice(0, 6).map(edge => {
              const fromNode = graph.nodes.find(n => n.id === edge.from);
              const toNode = graph.nodes.find(n => n.id === edge.to);
              
              return (
                <div key={edge.id} className="bg-slate-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-300 truncate mr-2">
                      {fromNode?.name} → {toNode?.name}
                    </span>
                    <span className={`text-xs font-medium uppercase ${getTrafficColor(edge.trafficLevel)}`}>
                      {edge.trafficLevel}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 text-gray-400 mr-1" />
                      <span className="text-white font-medium">{edge.currentWeight.toFixed(1)}km</span>
                    </div>
                    {edge.isBlocked && (
                      <span className="text-red-400 text-xs">BLOCKED</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">Loading real-time network data...</p>
          </div>
        )}
      </div>

      <div className="bg-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Network Statistics</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-white mb-1">{graph.nodes.length}</div>
            <div className="text-sm text-gray-300">Total Nodes</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white mb-1">{graph.edges.length}</div>
            <div className="text-sm text-gray-300">Total Edges</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white mb-1">
              {graph.edges.length > 0 ? 
                (graph.edges.reduce((sum, edge) => sum + edge.distance, 0) / graph.edges.length).toFixed(1) : 
                '0'
              }km
            </div>
            <div className="text-sm text-gray-300">Avg Distance</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white mb-1">
              {new Date().toLocaleTimeString()}
            </div>
            <div className="text-sm text-gray-300">Last Update</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;