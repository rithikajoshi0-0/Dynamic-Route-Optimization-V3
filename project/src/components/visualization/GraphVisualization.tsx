import React, { useRef, useEffect, useState } from 'react';
import { useGraph } from '../../contexts/GraphContext';
import { PathResult } from '../../types';

interface GraphVisualizationProps {
  pathResult?: PathResult;
  highlightedNodes?: string[];
}

const GraphVisualization: React.FC<GraphVisualizationProps> = ({ 
  pathResult, 
  highlightedNodes = [] 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { graph } = useGraph();
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    const updateDimensions = () => {
      const container = canvasRef.current?.parentElement;
      if (container) {
        setDimensions({
          width: container.clientWidth,
          height: Math.min(container.clientHeight || 400, window.innerWidth < 768 ? 300 : 600),
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, dimensions.width, dimensions.height);

    // Scale coordinates to fit canvas
    const maxLat = Math.max(...graph.nodes.map(n => n.location.lat));
    const minLat = Math.min(...graph.nodes.map(n => n.location.lat));
    const maxLng = Math.max(...graph.nodes.map(n => n.location.lng));
    const minLng = Math.min(...graph.nodes.map(n => n.location.lng));
    
    const padding = dimensions.width < 768 ? 40 : 100;
    const scaleX = (dimensions.width - padding) / (maxLng - minLng);
    const scaleY = (dimensions.height - padding) / (maxLat - minLat);

    // Draw edges
    graph.edges.forEach(edge => {
      const fromNode = graph.nodes.find(n => n.id === edge.from);
      const toNode = graph.nodes.find(n => n.id === edge.to);
      
      if (fromNode && toNode) {
        const x1 = (fromNode.location.lng - minLng) * scaleX + padding/2;
        const y1 = (maxLat - fromNode.location.lat) * scaleY + padding/2;
        const x2 = (toNode.location.lng - minLng) * scaleX + padding/2;
        const y2 = (maxLat - toNode.location.lat) * scaleY + padding/2;

        ctx.strokeStyle = edge.isBlocked ? '#ef4444' : 
                         edge.trafficLevel === 'high' ? '#f59e0b' :
                         edge.trafficLevel === 'medium' ? '#eab308' : '#10b981';
        ctx.lineWidth = pathResult?.path.includes(edge.from) && pathResult?.path.includes(edge.to) ? 
                       (dimensions.width < 768 ? 3 : 4) : (dimensions.width < 768 ? 1 : 2);
        ctx.globalAlpha = edge.isBlocked ? 0.3 : 1;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        // Draw weight label
        if (dimensions.width >= 768) {
          const midX = (x1 + x2) / 2;
          const midY = (y1 + y2) / 2;
          ctx.fillStyle = '#ffffff';
          ctx.font = '10px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(edge.currentWeight.toString(), midX, midY);
        }
      }
    });

    // Draw nodes
    graph.nodes.forEach(node => {
      const x = (node.location.lng - minLng) * scaleX + padding/2;
      const y = (maxLat - node.location.lat) * scaleY + padding/2;

      const isStart = pathResult?.path[0] === node.id;
      const isEnd = pathResult?.path[pathResult.path.length - 1] === node.id;
      const isInPath = pathResult?.path.includes(node.id);
      const isHighlighted = highlightedNodes.includes(node.id);

      ctx.fillStyle = isStart ? '#22c55e' : 
                     isEnd ? '#ef4444' : 
                     isInPath ? '#3b82f6' : 
                     isHighlighted ? '#f59e0b' : '#64748b';

      ctx.beginPath();
      const radius = dimensions.width < 768 ? 
                    (isStart || isEnd ? 8 : 6) : 
                    (isStart || isEnd ? 12 : 8);
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.fill();

      // Draw node label
      if (dimensions.width >= 768) {
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(node.name, x, y - 15);
      }
    });

    ctx.globalAlpha = 1;
  }, [graph, pathResult, highlightedNodes, dimensions]);

  return (
    <div className="w-full h-full bg-slate-900 rounded-lg p-4">
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        className="border border-slate-700 rounded-lg bg-slate-800"
      />
      <div className="mt-4 grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
          <span className="text-gray-300">Start</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
          <span className="text-gray-300">End</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-blue-500 rounded-full mr-2"></div>
          <span className="text-gray-300">Path</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-1 bg-green-500 mr-2"></div>
          <span className="text-gray-300">Low</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-1 bg-yellow-500 mr-2"></div>
          <span className="text-gray-300">Medium</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-1 bg-orange-500 mr-2"></div>
          <span className="text-gray-300">High</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-1 bg-red-500 opacity-30 mr-2"></div>
          <span className="text-gray-300">Blocked</span>
        </div>
      </div>
    </div>
  );
};

export default GraphVisualization;