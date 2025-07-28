# Dynamic Route Optimization System

A sophisticated web-based route optimization system that integrates OpenRouteService API with advanced pathfinding algorithms (Dijkstra's, A*, Bellman-Ford) to find optimal routes in real-world scenarios with real-time traffic data.

## Features

### 🗺️ Real-World Integration
- **OpenRouteService Integration**: Interactive maps with real geographic data
- **Place Search**: Search for any location worldwide using OpenRouteService Geocoding API
- **Live Directions**: Get actual driving, walking, and cycling directions with route visualization
- **Traffic-Aware Routing**: Real-time traffic consideration in route planning
- **Multiple Travel Modes**: Support for driving, walking, and cycling routes

### 🧮 Advanced Algorithms
- **Dijkstra's Algorithm**: Shortest distance optimization
- **A* Search**: Fastest route with heuristic optimization
- **Bellman-Ford**: Traffic-aware routing with dynamic weights

### 👥 User Management
- **Role-Based Access**: User and Admin roles with different permissions
- **Secure Authentication**: Login system with demo credentials
- **Personal Dashboard**: Save favorite routes and view history

### 📊 Admin Features
- **Traffic Control**: Simulate traffic conditions and road blockages
- **Analytics Dashboard**: Monitor system usage and performance
- **Real-time Network Management**: Control network parameters and weights with live data
- **Real-Time Updates**: Dynamic traffic simulation

### 🎨 Modern UI/UX
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Dark Theme**: Professional interface with blue/teal accents
- **Interactive Visualizations**: Real-time map updates and route display
- **Smooth Animations**: Polished user experience

## Setup Instructions

### 1. Supabase Setup (Required for Dataset Management)
1. Go to [Supabase](https://supabase.com) and create a new project
2. In your Supabase dashboard, go to the SQL Editor
3. Copy and run the contents of `supabase-setup.sql` to create the necessary tables and policies
4. Go to Settings > API to get your project URL and anon key
5. Add these to your `.env` file:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

### 2. OpenRouteService API Setup
1. Go to [OpenRouteService](https://openrouteservice.org/)
2. Sign up for a free account
3. Generate an API key from your dashboard
4. The free tier includes:
   - 2,000 requests per day
   - Geocoding, Directions, and Matrix services
   - Multiple travel profiles (driving, walking, cycling)
5. Copy `.env.example` to `.env`
6. Add your API key to the `.env` file

### 3. Installation
```bash
npm install
npm run dev
```

### 4. Demo Credentials
- **Admin**: admin@routeopt.com / password
- **User**: user@routeopt.com / password

## Technology Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Maps**: OpenRouteService API + Leaflet
- **Icons**: Lucide React
- **Build Tool**: Vite
- **State Management**: React Context
- **Real-time Data**: OpenRouteService Geocoding, Directions, and Matrix APIs

## Architecture

### Core Components
- **Route Planner**: Main interface for route calculation
- **OpenRouteService Integration**: Real-world map visualization and routing
- **Leaflet Map Component**: Interactive map with dataset layer support
- **Dataset Manager**: Admin interface for uploading and managing map datasets
- **Algorithm Engine**: Implementation of pathfinding algorithms
- **Real-time Traffic System**: Dynamic traffic condition modeling based on time and location
- **Admin Dashboard**: System monitoring and control
- **Real-time Synchronization**: Multi-user dataset updates via Supabase

### Data Structures
- **Graph Representation**: Adjacency list for efficient pathfinding
- **Priority Queues**: Optimized algorithm performance
- **Real-Time Updates**: Dynamic graph weight modifications
- **GeoJSON Support**: Native support for geographic data formats
- **Multi-user State**: Real-time synchronization across all connected clients

## Usage

### For Users
1. **Login** with user credentials
2. **Search** for start and destination locations
3. **Select** optimization algorithm and travel mode (driving/walking/cycling)
4. **Calculate** optimal route
5. **View** results on interactive map
6. **Save** favorite routes

### For Admins
1. **Monitor** real-time network analytics and usage
2. **Upload** new map datasets (GeoJSON, Shapefile, KML)
3. **Manage** dataset visibility and availability
4. **Control** traffic conditions and road blocks
5. **Manage** network parameters with live data
6. **View** real-time system performance and traffic distribution
7. **Simulate** various traffic scenarios
8. **Real-time Updates**: All changes are immediately visible to all users

## API Integration

The system integrates with OpenRouteService APIs to provide:
- **Geocoding**: Convert addresses to coordinates
- **Place Search**: Find locations by name or category worldwide
- **Directions**: Calculate routes between points with multiple travel modes
- **Distance Matrix**: Compute travel times and distances for network building
- **Real-time Updates**: Live traffic simulation based on time and location patterns

## Dataset Management Features

- **Multi-format Support**: Upload GeoJSON, Shapefile, and KML files
- **Real-time Synchronization**: Changes are instantly visible to all users
- **Layer Control**: Toggle dataset visibility on the map
- **Admin Controls**: Upload, delete, and manage dataset availability
- **Storage Integration**: Secure file storage via Supabase
- **Route Visualization**: Overlay calculated routes on custom datasets

## Performance Features

- **Efficient Algorithms**: Optimized pathfinding implementations with real coordinates
- **Real-time Updates**: Live traffic data updates every 30 seconds
- **Real-time Dataset Sync**: Instant multi-user synchronization
- **Responsive UI**: Smooth interactions and updates
- **Error Handling**: Graceful fallbacks and error messages
- **Network Optimization**: Intelligent graph building from real-world data
- **Efficient Data Loading**: Optimized GeoJSON rendering and caching

## Future Enhancements

- **Enhanced Offline Mode**: Cache routes for offline access
- **Public Transit Integration**: Add public transportation options
- **Route Preferences**: Avoid highways, tolls, etc.
- **Historical Data**: Route performance analytics over time
- **Mobile App**: Native mobile application
- **Machine Learning**: Predictive traffic modeling
- **Real-time Incidents**: Integration with traffic incident APIs

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.