import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  // Toggle dark mode
  React.useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <div className={`min-h-screen flex flex-col lg:flex-row transition-colors duration-200`}>
      <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          sidebarOpen={sidebarOpen}
          toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          darkMode={darkMode}
          toggleDarkMode={() => setDarkMode(!darkMode)}
        />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6 bg-gray-100 dark:bg-gray-900">
          <div className="container mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;