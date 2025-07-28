import { Graph, PathResult } from '../types';

class PriorityQueue {
  private items: Array<{ node: string; priority: number }> = [];

  enqueue(node: string, priority: number) {
    this.items.push({ node, priority });
    this.items.sort((a, b) => a.priority - b.priority);
  }

  dequeue() {
    return this.items.shift();
  }

  isEmpty() {
    return this.items.length === 0;
  }
}

export const dijkstra = (graph: Graph, start: string, end: string): PathResult => {
  const distances = new Map<string, number>();
  const previous = new Map<string, string | null>();
  const visited = new Set<string>();
  const visitedNodes: string[] = [];
  const pq = new PriorityQueue();

  // Initialize distances
  graph.nodes.forEach(node => {
    distances.set(node.id, node.id === start ? 0 : Infinity);
    previous.set(node.id, null);
  });

  pq.enqueue(start, 0);

  while (!pq.isEmpty()) {
    const current = pq.dequeue();
    if (!current) break;

    const { node: currentNode } = current;
    if (visited.has(currentNode)) continue;

    visited.add(currentNode);
    visitedNodes.push(currentNode);

    if (currentNode === end) break;

    const neighbors = graph.adjacencyList.get(currentNode) || [];
    for (const edge of neighbors) {
      if (edge.isBlocked) continue;

      const neighbor = edge.to;
      const newDistance = distances.get(currentNode)! + edge.currentWeight;

      if (newDistance < distances.get(neighbor)!) {
        distances.set(neighbor, newDistance);
        previous.set(neighbor, currentNode);
        pq.enqueue(neighbor, newDistance);
      }
    }
  }

  // Reconstruct path
  const path: string[] = [];
  let current = end;
  while (current !== null) {
    path.unshift(current);
    current = previous.get(current)!;
  }

  return {
    path: path.length > 1 ? path : [],
    totalDistance: distances.get(end) || Infinity,
    estimatedTime: Math.round((distances.get(end) || 0) * 1.2),
    visitedNodes,
    algorithm: 'Dijkstra',
  };
};

export const astar = (graph: Graph, start: string, end: string): PathResult => {
  const getHeuristic = (nodeId: string): number => {
    const node = graph.nodes.find(n => n.id === nodeId);
    const endNode = graph.nodes.find(n => n.id === end);
    if (!node || !endNode) return 0;
    
    // Haversine distance heuristic using lat/lng
    const R = 6371; // Earth's radius in km
    const dLat = toRadians(endNode.location.lat - node.location.lat);
    const dLng = toRadians(endNode.location.lng - node.location.lng);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(node.location.lat)) * Math.cos(toRadians(endNode.location.lat)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const toRadians = (degrees: number): number => {
    return degrees * (Math.PI / 180);
  };

  const gScore = new Map<string, number>();
  const fScore = new Map<string, number>();
  const previous = new Map<string, string | null>();
  const visited = new Set<string>();
  const visitedNodes: string[] = [];
  const pq = new PriorityQueue();

  graph.nodes.forEach(node => {
    gScore.set(node.id, node.id === start ? 0 : Infinity);
    fScore.set(node.id, node.id === start ? getHeuristic(start) : Infinity);
    previous.set(node.id, null);
  });

  pq.enqueue(start, fScore.get(start)!);

  while (!pq.isEmpty()) {
    const current = pq.dequeue();
    if (!current) break;

    const { node: currentNode } = current;
    if (visited.has(currentNode)) continue;

    visited.add(currentNode);
    visitedNodes.push(currentNode);

    if (currentNode === end) break;

    const neighbors = graph.adjacencyList.get(currentNode) || [];
    for (const edge of neighbors) {
      if (edge.isBlocked) continue;

      const neighbor = edge.to;
      const tentativeGScore = gScore.get(currentNode)! + edge.currentWeight;

      if (tentativeGScore < gScore.get(neighbor)!) {
        previous.set(neighbor, currentNode);
        gScore.set(neighbor, tentativeGScore);
        fScore.set(neighbor, tentativeGScore + getHeuristic(neighbor));
        pq.enqueue(neighbor, fScore.get(neighbor)!);
      }
    }
  }

  // Reconstruct path
  const path: string[] = [];
  let current = end;
  while (current !== null) {
    path.unshift(current);
    current = previous.get(current)!;
  }

  return {
    path: path.length > 1 ? path : [],
    totalDistance: gScore.get(end) || Infinity,
    estimatedTime: Math.round((gScore.get(end) || 0) * 1.2),
    visitedNodes,
    algorithm: 'A*',
  };
};

export const bellmanFord = (graph: Graph, start: string, end: string): PathResult => {
  const distances = new Map<string, number>();
  const previous = new Map<string, string | null>();
  const visitedNodes: string[] = [];

  // Initialize distances
  graph.nodes.forEach(node => {
    distances.set(node.id, node.id === start ? 0 : Infinity);
    previous.set(node.id, null);
  });

  // Relax edges repeatedly
  for (let i = 0; i < graph.nodes.length - 1; i++) {
    for (const edge of graph.edges) {
      if (edge.isBlocked) continue;

      const fromDistance = distances.get(edge.from)!;
      const toDistance = distances.get(edge.to)!;

      if (fromDistance + edge.currentWeight < toDistance) {
        distances.set(edge.to, fromDistance + edge.currentWeight);
        previous.set(edge.to, edge.from);
        if (!visitedNodes.includes(edge.to)) {
          visitedNodes.push(edge.to);
        }
      }
    }
  }

  // Reconstruct path
  const path: string[] = [];
  let current = end;
  while (current !== null) {
    path.unshift(current);
    current = previous.get(current)!;
  }

  return {
    path: path.length > 1 ? path : [],
    totalDistance: distances.get(end) || Infinity,
    estimatedTime: Math.round((distances.get(end) || 0) * 1.2),
    visitedNodes,
    algorithm: 'Bellman-Ford',
  };
};