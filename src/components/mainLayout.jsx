import React, { useState, createContext } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar'; // Ini mengimpor Sidebar.jsx
import { Bars3Icon } from '@heroicons/react/24/outline';


export const SidebarContext = createContext(); // Context untuk USER sidebar

export default function MainLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    console.log("Toggle Sidebar clicked!");
    setIsSidebarOpen(prev => !prev);
  };

  return (
    <div className="flex h-screen bg-light-purple overflow-hidden dark:bg-dark-bg-primary">
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={toggleSidebar}
        ></div>
      )}

      <SidebarContext.Provider value={{ isSidebarOpen, toggleSidebar, setIsSidebarOpen }}>
        <Sidebar /> {/* Render Sidebar.jsx di sini */}

        <div className="flex-1 p-6 overflow-y-auto">
          <div className="h-[95vh] overflow-y-auto pr-2 scrollbar-hide rounded-xl">
            <Outlet />
          </div>
        </div>
      </SidebarContext.Provider>
    </div>
  );
}