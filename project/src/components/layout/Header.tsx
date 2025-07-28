import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LogOut, User, Settings, Menu } from 'lucide-react';

interface HeaderProps {
  onMenuToggle?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuToggle }) => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-slate-900 border-b border-slate-700">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            {/* Mobile menu button */}
            <button
              onClick={onMenuToggle}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 mr-3"
            >
              <Menu className="h-6 w-6" />
            </button>
            
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Settings className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="ml-3 hidden sm:block">
              <h1 className="text-lg sm:text-xl font-semibold text-white">
                Route Optimization System
              </h1>
            </div>
            <div className="ml-3 sm:hidden">
              <h1 className="text-lg font-semibold text-white">
                RouteOpt
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-2">
              <User className="h-5 w-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-300">
                {user?.name}
              </span>
              <span className="text-xs px-2 py-1 bg-blue-600 text-white rounded-full">
                {user?.role}
              </span>
            </div>

            <button
              onClick={logout}
              className="flex items-center space-x-2 px-2 sm:px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span className="text-sm hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;