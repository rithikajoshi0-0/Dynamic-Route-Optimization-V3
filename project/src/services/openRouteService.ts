import { LatLng, Place, Node, Edge, PathResult, ORSGeocodingResult, ORSDirectionsResult, ORSMatrixResult } from '../types';

class OpenRouteService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = import.meta.env.VITE_OPENROUTESERVICE_API_KEY || '';
    this.baseUrl = import.meta.env.VITE_OPENROUTESERVICE_BASE_URL || 'https://api.openrouteservice.org';
    
    if (!this.apiKey) {
      console.warn('OpenRouteService API key not found. Please set VITE_OPENROUTESERVICE_API_KEY in your environment variables.');
    }
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Authorization': this.apiKey,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouteService API error: ${response.status} - ${errorText}`);
      }

      return response.json();
    } catch (error) {
      console.error('OpenRouteService request failed:', error);
      throw error;
    }
  }

  async searchPlaces(query: string, limit: number = 5): Promise<Place[]> {
    try {
      const result = await this.makeRequest<ORSGeocodingResult>(
        `/geocode/search?text=${encodeURIComponent(query)}&size=${limit}`
      );

      // Check if result is valid and has features
      if (!result || !Array.isArray(result.features)) {
        console.warn('Invalid geocoding response:', result);
        return [];
      }

      return result.features.map((feature, index) => ({
        id: feature.properties.id || `place_${index}`,
        name: feature.properties.name || feature.properties.label,
        address: feature.properties.label,
        location: {
          lat: feature.geometry.coordinates[1],
          lng: feature.geometry.coordinates[0],
        },
        placeId: feature.properties.id,
      }));
    } catch (error) {
      console.error('Place search failed:', error);
      // Return empty array instead of throwing to prevent UI crashes
      return [];
    }
  }

  async getDirections(
    start: LatLng,
    end: LatLng,
    waypoints?: LatLng[],
    profile: 'driving-car' | 'foot-walking' | 'cycling-regular' = 'driving-car'
  ): Promise<PathResult> {
    try {
      const coordinates = [
        [start.lng, start.lat],
        ...(waypoints?.map(wp => [wp.lng, wp.lat]) || []),
        [end.lng, end.lat],
      ];

      const result = await this.makeRequest<ORSDirectionsResult>(`/v2/directions/${profile}`, {
        method: 'POST',
        body: JSON.stringify({
          coordinates,
          format: 'geojson'
        }),
      });

      // Check if result is valid and has features
      if (!result || !Array.isArray(result.features) || result.features.length === 0) {
        throw new Error('No route found - API response was invalid or empty');
      }

      const route = result.features[0];
      if (!route || !route.properties || !route.properties.summary) {
        throw new Error('Invalid route data received from API');
      }

      const distance = route.properties.summary.distance / 1000; // Convert to km
      const duration = route.properties.summary.duration / 60; // Convert to minutes

      return {
        path: [start.lat + ',' + start.lng, end.lat + ',' + end.lng],
        totalDistance: Math.round(distance * 10) / 10, // Round to 1 decimal
        estimatedTime: Math.round(duration),
        visitedNodes: [start.lat + ',' + start.lng, end.lat + ',' + end.lng],
        algorithm: 'OpenRouteService',
        directions: result,
      };
    } catch (error) {
      console.error('Directions request failed:', error);
      throw new Error(`Route calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getMatrix(
    locations: LatLng[],
    profile: 'driving-car' | 'foot-walking' | 'cycling-regular' = 'driving-car'
  ): Promise<ORSMatrixResult> {
    try {
      const coordinates = locations.map(loc => [loc.lng, loc.lat]);

      return await this.makeRequest<ORSMatrixResult>(`/v2/matrix/${profile}`, {
        method: 'POST',
        body: JSON.stringify({
          locations: coordinates,
          metrics: ['distance', 'duration'],
        }),
      });
    } catch (error) {
      console.error('Matrix request failed:', error);
      throw error;
    }
  }

  async buildRealTimeGraph(center: LatLng, radiusKm: number = 10): Promise<{ nodes: Node[], edges: Edge[] }> {
    try {
      // Create a basic network with some predefined locations around the center
      const nodes: Node[] = [];
      const edges: Edge[] = [];

      // Add center as main node
      nodes.push({
        id: 'center',
        name: 'Center Point',
        location: center,
        type: 'city',
      });

      // Create a grid of points around the center for demonstration
      const offsets = [
        { lat: 0.01, lng: 0.01, name: 'Northeast Point' },
        { lat: 0.01, lng: -0.01, name: 'Northwest Point' },
        { lat: -0.01, lng: 0.01, name: 'Southeast Point' },
        { lat: -0.01, lng: -0.01, name: 'Southwest Point' },
        { lat: 0.02, lng: 0, name: 'North Point' },
        { lat: -0.02, lng: 0, name: 'South Point' },
        { lat: 0, lng: 0.02, name: 'East Point' },
        { lat: 0, lng: -0.02, name: 'West Point' },
      ];

      offsets.forEach((offset, index) => {
        nodes.push({
          id: `node_${index}`,
          name: offset.name,
          location: {
            lat: center.lat + offset.lat,
            lng: center.lng + offset.lng,
          },
          type: 'landmark',
        });
      });

      // Create edges between nodes
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const distance = this.calculateDistance(nodes[i].location, nodes[j].location);
          
          if (distance < 5) { // Only connect nearby nodes
            edges.push({
              id: `edge_${i}_${j}`,
              from: nodes[i].id,
              to: nodes[j].id,
              distance: Math.round(distance * 10) / 10,
              duration: Math.round(distance * 2), // Rough estimate
              roadType: distance > 2 ? 'highway' : 'street',
              baseWeight: Math.round(distance * 10) / 10,
              currentWeight: Math.round(distance * 10) / 10,
              isBlocked: false,
              trafficLevel: 'low',
            });
          }
        }
      }

      return { nodes, edges };
    } catch (error) {
      console.error('Failed to build real-time graph:', error);
      // Return a minimal graph instead of throwing
      return {
        nodes: [{
          id: 'center',
          name: 'Center Point',
          location: center,
          type: 'city',
        }],
        edges: []
      };
    }
  }

  async reverseGeocode(location: LatLng): Promise<string> {
    try {
      const result = await this.makeRequest<ORSGeocodingResult>(
        `/geocode/reverse?point.lon=${location.lng}&point.lat=${location.lat}&size=1`
      );

      if (!result || !Array.isArray(result.features) || result.features.length === 0) {
        return 'Unknown location';
      }

      return result.features[0]?.properties.label || 'Unknown location';
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      return 'Unknown location';
    }
  }

  private calculateDistance(point1: LatLng, point2: LatLng): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRadians(point2.lat - point1.lat);
    const dLng = this.toRadians(point2.lng - point1.lng);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(point1.lat)) * Math.cos(this.toRadians(point2.lat)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  // Real-time traffic simulation based on time of day and location
  simulateRealTimeTraffic(edges: Edge[]): Edge[] {
    const now = new Date();
    const hour = now.getHours();
    const isRushHour = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19);
    const isWeekend = now.getDay() === 0 || now.getDay() === 6;

    return edges.map(edge => {
      let trafficMultiplier = 1;
      let trafficLevel: 'low' | 'medium' | 'high' = 'low';

      if (isRushHour && !isWeekend) {
        trafficMultiplier = edge.roadType === 'highway' ? 1.8 : 1.5;
        trafficLevel = 'high';
      } else if (hour >= 10 && hour <= 16 && !isWeekend) {
        trafficMultiplier = 1.2;
        trafficLevel = 'medium';
      } else if (isWeekend && hour >= 12 && hour <= 18) {
        trafficMultiplier = 1.3;
        trafficLevel = 'medium';
      }

      // Add some randomness
      trafficMultiplier += (Math.random() - 0.5) * 0.3;

      return {
        ...edge,
        currentWeight: Math.round(edge.baseWeight * Math.max(1, trafficMultiplier) * 10) / 10,
        trafficLevel,
      };
    });
  }
}

export const openRouteService = new OpenRouteService();