import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Map, 
  Route, 
  BarChart3, 
  Settings, 
  Users, 
  Navigation,
  Heart,
  Activity,
  Database,
  X
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isOpen, onClose }) => {
  const { user } = useAuth();

  const userTabs = [
    { id: 'route-planner', label: 'Route Planner', icon: Navigation },
    { id: 'my-routes', label: 'My Routes', icon: Route },
    { id: 'favorites', label: 'Favorites', icon: Heart },
    { id: 'live-traffic', label: 'Live Traffic', icon: Activity },
    { id: 'map-demo', label: 'Interactive Map', icon: Map },
  ];

  const adminTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'dataset-manager', label: 'Dataset Manager', icon: Database },
    { id: 'graph-management', label: 'Graph Management', icon: Map },
    { id: 'user-management', label: 'User Management', icon: Users },
    { id: 'traffic-control', label: 'Traffic Control', icon: Settings },
  ];

  const tabs = user?.role === 'admin' ? [...userTabs, ...adminTabs] : userTabs;

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    onClose(); // Close sidebar on mobile after selection
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-slate-800 border-r border-slate-700 transform transition-transform duration-300 ease-in-out lg:transform-none
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Mobile close button */}
        <div className="lg:hidden flex justify-end p-4">
          <button
            onClick={onClose}
            className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-slate-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        {/* User info on mobile */}
        <div className="lg:hidden px-4 pb-4 border-b border-slate-700 mb-4">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-medium">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <div className="text-white font-medium">{user?.name}</div>
              <div className="text-xs px-2 py-1 bg-blue-600 text-white rounded-full inline-block">
                {user?.role}
              </div>
            </div>
          </div>
        </div>
        
      <nav className="mt-5 px-2">
        <div className="space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-slate-700 hover:text-white'
                } group flex items-center px-2 py-2 text-sm font-medium rounded-lg w-full transition-colors`}
              >
                <Icon className="mr-3 h-5 w-5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </nav>
      </div>
    </>
  );
};

export default Sidebar;
