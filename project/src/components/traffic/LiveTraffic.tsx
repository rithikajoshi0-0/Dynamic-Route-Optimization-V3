import React, { useEffect, useState } from 'react';
import { useGraph } from '../../contexts/GraphContext';
import { Activity, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import GraphVisualization from '../visualization/GraphVisualization';

interface TrafficEvent {
  id: string;
  type: 'congestion' | 'accident' | 'construction' | 'closure';
  location: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: Date;
  description: string;
}

const LiveTraffic: React.FC = () => {
  const { graph } = useGraph();
  const [trafficEvents, setTrafficEvents] = useState<TrafficEvent[]>([]);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    // Simulate real-time traffic events
    const generateRandomEvent = (): TrafficEvent => {
      const types: Array<'congestion' | 'accident' | 'construction' | 'closure'> = 
        ['congestion', 'accident', 'construction', 'closure'];
      const severities: Array<'low' | 'medium' | 'high'> = ['low', 'medium', 'high'];
      const locations = graph.nodes.map(node => node.name);
      
      const type = types[Math.floor(Math.random() * types.length)];
      const severity = severities[Math.floor(Math.random() * severities.length)];
      const location = locations[Math.floor(Math.random() * locations.length)];
      
      const descriptions: Record<string, string> = {
        congestion: `Heavy traffic congestion reported near ${location}`,
        accident: `Traffic accident causing delays near ${location}`,
        construction: `Road construction affecting traffic flow near ${location}`,
        closure: `Temporary road closure reported near ${location}`,
      };

      return {
        id: Math.random().toString(36).substr(2, 9),
        type,
        location,
        severity,
        timestamp: new Date(),
        description: descriptions[type],
      };
    };

    const interval = setInterval(() => {
      // Add new event occasionally
      if (Math.random() < 0.3) {
        const newEvent = generateRandomEvent();
        setTrafficEvents(prev => [newEvent, ...prev.slice(0, 9)]);
      }
      setLastUpdate(new Date());
    }, 3000);

    // Initialize with some events
    setTrafficEvents([
      generateRandomEvent(),
      generateRandomEvent(),
      generateRandomEvent(),
    ]);

    return () => clearInterval(interval);
  }, [graph.nodes]);

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'accident': return AlertTriangle;
      case 'construction': return Activity;
      case 'closure': return AlertTriangle;
      default: return Activity;
    }
  };

  const getEventColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-400 bg-red-900/20';
      case 'medium': return 'text-yellow-400 bg-yellow-900/20';
      default: return 'text-green-400 bg-green-900/20';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-600';
      case 'medium': return 'bg-yellow-600';
      default: return 'bg-green-600';
    }
  };

  const getTrafficStats = () => {
    const totalEdges = graph.edges.length;
    const blockedEdges = graph.edges.filter(e => e.isBlocked).length;
    const highTrafficEdges = graph.edges.filter(e => e.trafficLevel === 'high').length;
    const mediumTrafficEdges = graph.edges.filter(e => e.trafficLevel === 'medium').length;
    const lowTrafficEdges = graph.edges.filter(e => e.trafficLevel === 'low').length;

    return {
      totalEdges,
      blockedEdges,
      highTrafficEdges,
      mediumTrafficEdges,
      lowTrafficEdges,
    };
  };

  const stats = getTrafficStats();

  return (
    <div className="space-y-6">
      <div className="bg-slate-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Live Traffic Monitor</h2>
          <div className="flex items-center text-sm text-gray-300">
            <Clock className="h-4 w-4 mr-1" />
            Last updated: {lastUpdate.toLocaleTimeString()}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-700 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-400" />
              <div className="ml-4">
                <p className="text-xs sm:text-sm text-gray-300">Normal Traffic</p>
                <p className="text-2xl font-bold text-white">{stats.lowTrafficEdges}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-700 rounded-lg p-4">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-yellow-400" />
              <div className="ml-4">
                <p className="text-xs sm:text-sm text-gray-300">Medium Traffic</p>
                <p className="text-2xl font-bold text-white">{stats.mediumTrafficEdges}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-700 rounded-lg p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-400" />
              <div className="ml-4">
                <p className="text-xs sm:text-sm text-gray-300">High Traffic</p>
                <p className="text-2xl font-bold text-white">{stats.highTrafficEdges}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-700 rounded-lg p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-xs sm:text-sm text-gray-300">Blocked Routes</p>
                <p className="text-2xl font-bold text-white">{stats.blockedEdges}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-slate-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Traffic Events</h3>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {trafficEvents.map(event => {
              const Icon = getEventIcon(event.type);
              return (
                <div key={event.id} className="bg-slate-700 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <Icon className={`h-5 w-5 mt-1 ${getEventColor(event.severity).split(' ')[0]}`} />
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-white font-medium capitalize">{event.type}</span>
                          <span className={`px-2 py-1 rounded text-xs text-white ${getSeverityColor(event.severity)}`}>
                            {event.severity.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-300 mb-1 break-words">{event.description}</p>
                        <p className="text-xs text-gray-400">
                          {event.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Current Network Status</h3>
          <GraphVisualization />
        </div>
      </div>
    </div>
  );
};

export default LiveTraffic;