import React, { createContext, useContext, useState, useEffect } from 'react';
import { Graph, Node, Edge, TrafficUpdate } from '../types';
import { openRouteService } from '../services/openRouteService';

interface GraphContextType {
  graph: Graph;
  updateTraffic: (update: TrafficUpdate) => void;
  blockEdge: (edgeId: string) => void;
  unblockEdge: (edgeId: string) => void;
  addNode: (node: Node) => void;
  addEdge: (edge: Edge) => void;
  removeNode: (nodeId: string) => void;
  removeEdge: (edgeId: string) => void;
  refreshGraph: (center?: { lat: number; lng: number }) => Promise<void>;
  isLoading: boolean;
}

const GraphContext = createContext<GraphContextType | undefined>(undefined);

export const useGraph = () => {
  const context = useContext(GraphContext);
  if (!context) {
    throw new Error('useGraph must be used within a GraphProvider');
  }
  return context;
};

export const GraphProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [graph, setGraph] = useState<Graph>({ nodes: [], edges: [], adjacencyList: new Map() });
  const [isLoading, setIsLoading] = useState(false);

  const buildAdjacencyList = (nodes: Node[], edges: Edge[]): Map<string, Edge[]> => {
    const adjacencyList = new Map<string, Edge[]>();
    
    nodes.forEach(node => {
      adjacencyList.set(node.id, []);
    });
    
    edges.forEach(edge => {
      if (!adjacencyList.has(edge.from)) {
        adjacencyList.set(edge.from, []);
      }
      if (!adjacencyList.has(edge.to)) {
        adjacencyList.set(edge.to, []);
      }
      adjacencyList.get(edge.from)!.push(edge);
      adjacencyList.get(edge.to)!.push({ ...edge, from: edge.to, to: edge.from });
    });
    
    return adjacencyList;
  };

  const refreshGraph = async (center = { lat: 37.7749, lng: -122.4194 }) => {
    setIsLoading(true);
    try {
      const { nodes, edges } = await openRouteService.buildRealTimeGraph(center, 15);
      const trafficAwareEdges = openRouteService.simulateRealTimeTraffic(edges);
      const adjacencyList = buildAdjacencyList(nodes, trafficAwareEdges);
      
      setGraph({ nodes, edges: trafficAwareEdges, adjacencyList });
    } catch (error) {
      console.error('Failed to refresh graph:', error);
      // Fallback to empty graph
      setGraph({ nodes: [], edges: [], adjacencyList: new Map() });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Initialize with San Francisco as default
    refreshGraph({ lat: 37.7749, lng: -122.4194 });
  }, []);

  useEffect(() => {
    // Real-time traffic updates every 30 seconds
    const interval = setInterval(() => {
      if (graph.edges.length > 0) {
        const updatedEdges = openRouteService.simulateRealTimeTraffic(graph.edges);
        const adjacencyList = buildAdjacencyList(graph.nodes, updatedEdges);
        setGraph(prev => ({ ...prev, edges: updatedEdges, adjacencyList }));
      }
    }, 60000); // Update every 60 seconds to reduce API calls

    return () => clearInterval(interval);
  }, [graph.nodes]);

  const updateTraffic = (update: TrafficUpdate) => {
    setGraph(prev => {
      const updatedEdges = prev.edges.map(edge => 
        edge.id === update.edgeId 
          ? { ...edge, currentWeight: update.newWeight, trafficLevel: update.trafficLevel }
          : edge
      );
      const adjacencyList = buildAdjacencyList(prev.nodes, updatedEdges);
      return { ...prev, edges: updatedEdges, adjacencyList };
    });
  };

  const blockEdge = (edgeId: string) => {
    setGraph(prev => {
      const updatedEdges = prev.edges.map(edge => 
        edge.id === edgeId ? { ...edge, isBlocked: true } : edge
      );
      const adjacencyList = buildAdjacencyList(prev.nodes, updatedEdges);
      return { ...prev, edges: updatedEdges, adjacencyList };
    });
  };

  const unblockEdge = (edgeId: string) => {
    setGraph(prev => {
      const updatedEdges = prev.edges.map(edge => 
        edge.id === edgeId ? { ...edge, isBlocked: false } : edge
      );
      const adjacencyList = buildAdjacencyList(prev.nodes, updatedEdges);
      return { ...prev, edges: updatedEdges, adjacencyList };
    });
  };

  const addNode = (node: Node) => {
    setGraph(prev => {
      const updatedNodes = [...prev.nodes, node];
      const adjacencyList = buildAdjacencyList(updatedNodes, prev.edges);
      return { ...prev, nodes: updatedNodes, adjacencyList };
    });
  };

  const addEdge = (edge: Edge) => {
    setGraph(prev => {
      const updatedEdges = [...prev.edges, edge];
      const adjacencyList = buildAdjacencyList(prev.nodes, updatedEdges);
      return { ...prev, edges: updatedEdges, adjacencyList };
    });
  };

  const removeNode = (nodeId: string) => {
    setGraph(prev => {
      const updatedNodes = prev.nodes.filter(node => node.id !== nodeId);
      const updatedEdges = prev.edges.filter(edge => edge.from !== nodeId && edge.to !== nodeId);
      const adjacencyList = buildAdjacencyList(updatedNodes, updatedEdges);
      return { nodes: updatedNodes, edges: updatedEdges, adjacencyList };
    });
  };

  const removeEdge = (edgeId: string) => {
    setGraph(prev => {
      const updatedEdges = prev.edges.filter(edge => edge.id !== edgeId);
      const adjacencyList = buildAdjacencyList(prev.nodes, updatedEdges);
      return { ...prev, edges: updatedEdges, adjacencyList };
    });
  };

  return (
    <GraphContext.Provider value={{
      graph,
      updateTraffic,
      blockEdge,
      unblockEdge,
      addNode,
      addEdge,
      removeNode,
      removeEdge,
      refreshGraph,
      isLoading,
    }}>
      {children}
    </GraphContext.Provider>
  );
};