import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Cpu, 
  Settings as SettingsIcon, 
  PlusCircle,
  Server,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar }) => {
  return (
    <aside 
      className={`
        fixed lg:relative top-0 left-0 h-screen bg-gray-800 dark:bg-gray-900 text-white
        transition-all duration-300 ease-in-out z-20
        ${isOpen ? 'w-64' : 'w-0 lg:w-20'} overflow-hidden
      `}
    >
      <div className="flex flex-col h-full">
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4">
          {isOpen && (
            <div className="flex items-center space-x-2">
              <Cpu size={24} className="text-blue-400" />
              <h2 className="text-lg font-bold">DeviceManager</h2>
            </div>
          )}
          
          <button 
            onClick={toggleSidebar}
            className="hidden lg:block p-2 rounded-md hover:bg-gray-700"
          >
            {isOpen ? (
              <ChevronLeft size={20} />
            ) : (
              <ChevronRight size={20} />
            )}
          </button>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 overflow-y-auto">
          <ul className="space-y-1">
            <SidebarLink to="/" icon={<LayoutDashboard size={20} />} text="Dashboard" isOpen={isOpen} />
            <SidebarLink to="/devices" icon={<Cpu size={20} />} text="Devices" isOpen={isOpen} />
            <SidebarLink to="/devices/add" icon={<PlusCircle size={20} />} text="Add Device" isOpen={isOpen} />
            <SidebarLink to="/settings" icon={<SettingsIcon size={20} />} text="Settings" isOpen={isOpen} />
          </ul>
        </nav>
        
        {/* Footer */}
        <div className="p-4 border-t border-gray-700">
          {isOpen ? (
            <div className="flex items-center space-x-2">
              <Server size={20} className="text-gray-400" />
              <span className="text-sm text-gray-400">Connected to Pi</span>
            </div>
          ) : (
            <div className="flex justify-center">
              <Server size={20} className="text-gray-400" />
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

interface SidebarLinkProps {
  to: string;
  icon: React.ReactNode;
  text: string;
  isOpen: boolean;
}

const SidebarLink: React.FC<SidebarLinkProps> = ({ to, icon, text, isOpen }) => {
  return (
    <li>
      <NavLink 
        to={to} 
        className={({ isActive }) => `
          flex items-center p-3 rounded-lg transition-colors duration-200
          ${isActive 
            ? 'bg-blue-600 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}
        `}
      >
        <div className="flex items-center">
          <span className={isOpen ? 'mr-3' : ''}>{icon}</span>
          {isOpen && <span>{text}</span>}
        </div>
      </NavLink>
    </li>
  );
};

export default Sidebar;