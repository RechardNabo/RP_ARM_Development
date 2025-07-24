import React from 'react';
import { Menu, X, Moon, Sun, Bell, Settings } from 'lucide-react';

interface HeaderProps {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  sidebarOpen, 
  toggleSidebar, 
  darkMode, 
  toggleDarkMode 
}) => {
  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm z-10">
      <div className="flex items-center justify-between h-16 px-4">
        {/* Mobile menu button */}
        <div className="lg:hidden">
          <button 
            onClick={toggleSidebar}
            className="p-2 text-gray-500 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {sidebarOpen ? (
              <X size={24} className="text-gray-600 dark:text-gray-300" />
            ) : (
              <Menu size={24} className="text-gray-600 dark:text-gray-300" />
            )}
          </button>
        </div>
        
        <div className="flex-1 flex justify-center lg:justify-start">
          <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">
            Raspberry Pi Device Manager
          </h1>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <button className="p-2 text-gray-500 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
            <Bell size={20} className="text-gray-600 dark:text-gray-300" />
          </button>
          
          {/* Settings */}
          <button className="p-2 text-gray-500 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
            <Settings size={20} className="text-gray-600 dark:text-gray-300" />
          </button>
          
          {/* Dark mode toggle */}
          <button 
            onClick={toggleDarkMode} 
            className="p-2 text-gray-500 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {darkMode ? (
              <Sun size={20} className="text-yellow-400" />
            ) : (
              <Moon size={20} className="text-gray-600" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;