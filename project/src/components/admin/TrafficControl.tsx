import React, { useState } from 'react';
import { useGraph } from '../../contexts/GraphContext';
import { AlertTriangle, Play, Pause, Settings } from 'lucide-react';

const TrafficControl: React.FC = () => {
  const { graph, updateTraffic, blockEdge, unblockEdge } = useGraph();
  const [selectedEdge, setSelectedEdge] = useState('');
  const [newWeight, setNewWeight] = useState('');
  const [trafficLevel, setTrafficLevel] = useState<'low' | 'medium' | 'high'>('medium');

  const handleUpdateTraffic = () => {
    if (!selectedEdge || !newWeight) return;

    updateTraffic({
      edgeId: selectedEdge,
      newWeight: parseFloat(newWeight),
      trafficLevel,
      timestamp: new Date(),
    });

    setSelectedEdge('');
    setNewWeight('');
  };

  const getTrafficColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-red-400 bg-red-900/20';
      case 'medium': return 'text-yellow-400 bg-yellow-900/20';
      default: return 'text-green-400 bg-green-900/20';
    }
  };

  const getNodeName = (nodeId: string) => {
    return graph.nodes.find(n => n.id === nodeId)?.name || nodeId;
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Traffic Control Center</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Select Edge
            </label>
            <select
              value={selectedEdge}
              onChange={(e) => setSelectedEdge(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose edge to modify</option>
              {graph.edges.map(edge => (
                <option key={edge.id} value={edge.id}>
                  {getNodeName(edge.from)} → {getNodeName(edge.to)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              New Weight (km)
            </label>
            <input
              type="number"
              value={newWeight}
              onChange={(e) => setNewWeight(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter new weight"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Traffic Level
            </label>
            <select
              value={trafficLevel}
              onChange={(e) => setTrafficLevel(e.target.value as 'low' | 'medium' | 'high')}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="low">Low Traffic</option>
              <option value="medium">Medium Traffic</option>
              <option value="high">High Traffic</option>
            </select>
          </div>

          <div className="flex items-end sm:col-span-2 lg:col-span-1">
            <button
              onClick={handleUpdateTraffic}
              disabled={!selectedEdge || !newWeight}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
            >
              <Settings className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Update Traffic</span>
              <span className="sm:hidden">Update</span>
            </button>
          </div>
        </div>
      </div>

      <div className="bg-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Current Edge Status</h3>
        
        <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 px-2 sm:px-4 text-gray-300 min-w-[120px]">Route</th>
                <th className="text-left py-3 px-2 sm:px-4 text-gray-300 hidden sm:table-cell">Base Weight</th>
                <th className="text-left py-3 px-2 sm:px-4 text-gray-300">Current</th>
                <th className="text-left py-3 px-2 sm:px-4 text-gray-300">Traffic</th>
                <th className="text-left py-3 px-2 sm:px-4 text-gray-300 hidden md:table-cell">Status</th>
                <th className="text-left py-3 px-2 sm:px-4 text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {graph.edges.map(edge => (
                <tr key={edge.id} className="hover:bg-slate-700/50">
                  <td className="py-3 px-2 sm:px-4 text-white text-xs sm:text-sm">
                    {getNodeName(edge.from)} → {getNodeName(edge.to)}
                  </td>
                  <td className="py-3 px-2 sm:px-4 text-gray-300 hidden sm:table-cell">
                    {edge.baseWeight} km
                  </td>
                  <td className="py-3 px-2 sm:px-4 text-white font-medium text-xs sm:text-sm">
                    {edge.currentWeight} km
                  </td>
                  <td className="py-3 px-2 sm:px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTrafficColor(edge.trafficLevel)}`}>
                      <span className="hidden sm:inline">{edge.trafficLevel.toUpperCase()}</span>
                      <span className="sm:hidden">{edge.trafficLevel.charAt(0).toUpperCase()}</span>
                    </span>
                  </td>
                  <td className="py-3 px-2 sm:px-4 hidden md:table-cell">
                    {edge.isBlocked ? (
                      <span className="flex items-center text-red-400">
                        <AlertTriangle className="h-4 w-4 mr-1" />
                        Blocked
                      </span>
                    ) : (
                      <span className="flex items-center text-green-400">
                        <Play className="h-4 w-4 mr-1" />
                        Active
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-2 sm:px-4">
                    <div className="flex space-x-2">
                      {edge.isBlocked ? (
                        <button
                          onClick={() => unblockEdge(edge.id)}
                          className="px-2 sm:px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors"
                        >
                          <span className="hidden sm:inline">Unblock</span>
                          <span className="sm:hidden">✓</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => blockEdge(edge.id)}
                          className="px-2 sm:px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors"
                        >
                          <span className="hidden sm:inline">Block</span>
                          <span className="sm:hidden">✕</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <button
            onClick={() => {
              // Simulate traffic jam
              const randomEdges = graph.edges.slice(0, 3);
              randomEdges.forEach(edge => {
                updateTraffic({
                  edgeId: edge.id,
                  newWeight: edge.baseWeight * 2,
                  trafficLevel: 'high',
                  timestamp: new Date(),
                });
              });
            }}
            className="p-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <AlertTriangle className="h-6 w-6 mx-auto mb-2" />
            <div className="text-sm font-medium">
              <span className="hidden sm:inline">Simulate Traffic Jam</span>
              <span className="sm:hidden">Traffic Jam</span>
            </div>
          </button>

          <button
            onClick={() => {
              // Clear all traffic
              graph.edges.forEach(edge => {
                updateTraffic({
                  edgeId: edge.id,
                  newWeight: edge.baseWeight,
                  trafficLevel: 'low',
                  timestamp: new Date(),
                });
              });
            }}
            className="p-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Play className="h-6 w-6 mx-auto mb-2" />
            <div className="text-sm font-medium">
              <span className="hidden sm:inline">Clear All Traffic</span>
              <span className="sm:hidden">Clear Traffic</span>
            </div>
          </button>

          <button
            onClick={() => {
              // Random traffic simulation
              graph.edges.forEach(edge => {
                const levels: Array<'low' | 'medium' | 'high'> = ['low', 'medium', 'high'];
                const randomLevel = levels[Math.floor(Math.random() * 3)];
                const multiplier = randomLevel === 'high' ? 2 : randomLevel === 'medium' ? 1.5 : 1;
                
                updateTraffic({
                  edgeId: edge.id,
                  newWeight: edge.baseWeight * multiplier,
                  trafficLevel: randomLevel,
                  timestamp: new Date(),
                });
              });
            }}
            className="p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors sm:col-span-2 lg:col-span-1"
          >
            <Settings className="h-6 w-6 mx-auto mb-2" />
            <div className="text-sm font-medium">
              <span className="hidden sm:inline">Random Traffic</span>
              <span className="sm:hidden">Random</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TrafficControl;