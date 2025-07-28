import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { GraphProvider } from './contexts/GraphContext';
import { MapDataProvider } from './contexts/MapDataContext';
import LoginForm from './components/auth/LoginForm';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import RoutePlanner from './components/route/RoutePlanner';
import AdminDashboard from './components/dashboard/AdminDashboard';
import TrafficControl from './components/admin/TrafficControl';
import DatasetManager from './components/admin/DatasetManager';
import MyRoutes from './components/user/MyRoutes';
import LiveTraffic from './components/traffic/LiveTraffic';

const AppContent: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('route-planner');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'route-planner':
        return <RoutePlanner />;
      case 'my-routes':
        return <MyRoutes />;
      case 'favorites':
        return <MyRoutes />;
      case 'live-traffic':
        return <LiveTraffic />;
      case 'dashboard':
        return <AdminDashboard />;
      case 'traffic-control':
        return <TrafficControl />;
      case 'dataset-manager':
        return <DatasetManager />;
      case 'graph-management':
        return <AdminDashboard />;
      case 'user-management':
        return <AdminDashboard />;
      default:
        return <RoutePlanner />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex">
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <main className="flex-1 p-4 sm:p-6 lg:ml-0">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <MapDataProvider>
        <GraphProvider>
          <AppContent />
        </GraphProvider>
      </MapDataProvider>
    </AuthProvider>
  );
}

export default App;