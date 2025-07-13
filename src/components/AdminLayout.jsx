import React, { useState, createContext, useEffect, useContext } from 'react';
import { Outlet, useNavigate, Link } from 'react-router-dom';
import SidebarAdmin from './SidebarAdmin';
import {
  MagnifyingGlassIcon,
  BellIcon,
  UserCircleIcon as UserCircleOutlineIcon,
  SunIcon, // Import SunIcon
  MoonIcon, // Import MoonIcon
  Bars3Icon
} from '@heroicons/react/24/outline';
import { AuthContext } from '../context/AuthContext';

export const AdminSidebarContext = createContext();

export default function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { signOut, user, profile } = useContext(AuthContext);
  const navigate = useNavigate();
  const [currentTheme, setCurrentTheme] = useState('light');
  
    useEffect(() => {
      const checkTheme = () => {
        if (typeof document !== 'undefined') {
          if (document.documentElement.classList.contains('dark')) {
            setCurrentTheme('dark');
          } else {
            setCurrentTheme('light');
          }
        }
      };
  
      checkTheme();
  
      const observer = new MutationObserver(checkTheme);
      if (typeof document !== 'undefined') {
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
      }
  
      return () => observer.disconnect();
    }, []);
  
    const toggleTheme = () => {
      if (typeof document !== 'undefined') {
        if (document.documentElement.classList.contains('dark')) {
          document.documentElement.classList.remove('dark');
          localStorage.setItem('theme', 'light');
        } else {
          document.documentElement.classList.add('dark');
          localStorage.setItem('theme', 'dark');
        }
      }
    };

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  const handleLogout = async () => {
    if (signOut) {
      const { error } = await signOut();
      if (error) {
        console.error("Logout failed:", error.message);
        alert("Logout failed: " + error.message);
      } else {
        console.log("Logout successful.");
        navigate('/auth');
      }
    } else {
      console.error("signOut function is not available.");
      alert("Logout function not available.");
    }
  };

  const adminUserName = profile?.username || profile?.full_name || user?.email?.split('@')[0] || 'Admin';
  const adminAvatarUrl = profile?.avatar_url || '/default-avatar.jpg';

  return (
    <div className="flex h-screen bg-white overflow-hidden dark:bg-gray-900">
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={toggleSidebar}
        ></div>
      )}

      <AdminSidebarContext.Provider value={{ isSidebarOpen, toggleSidebar, setIsSidebarOpen }}>
        <SidebarAdmin />

        <div className="flex-1 p-6 overflow-y-auto dark:bg-admin-dark-primary bg-admin-light-primary">
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 rounded-xl shadow-md mb-6 dark:bg-admin-dark-tertiary">
            <div className="flex items-center mb-4 sm:mb-0">
              <button onClick={toggleSidebar} className="md:hidden p-2 rounded-full bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-dark-text-light focus:outline-none focus:ring-2 focus:ring-blue-500 mr-2" aria-label="Toggle sidebar">
                <Bars3Icon className="h-6 w-6" />
              </button>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text-light">Hi, {adminUserName}!</h1>
            </div>

            <div className="flex items-center space-x-4 w-full sm:w-auto justify-end">
              <div className="relative flex-grow sm:flex-grow-0">
                <input
                  type="text"
                  placeholder="Search"
                  className="py-2 pl-10 pr-4 w-full sm:w-64 rounded-full bg-gray-100 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-200 dark:bg-gray-700 dark:border-gray-600 dark:text-dark-text-light dark:focus:ring-admin-accent-green"
                />
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2 dark:text-gray-400" />
              </div>

              {/* <div className="relative flex-shrink-0">
                <BellIcon className="h-6 w-6 text-gray-600 cursor-pointer dark:text-dark-text-medium" />
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
              </div> */}

              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Toggle theme"
              >
                {currentTheme === 'dark' ? (
                  <SunIcon className="h-6 w-6 text-yellow-400" />
                ) : (
                  <MoonIcon className="h-6 w-6 text-gray-600" />
                )}
              </button>

              <div className="flex items-center space-x-2 flex-shrink-0">
                <img
                  src={adminAvatarUrl}
                  alt="Admin Avatar"
                  className="h-10 w-10 rounded-full object-cover border-2 border-purple-300 dark:border-admin-accent-green"
                />
                <button
                  onClick={handleLogout}
                  className="bg-purple-600 text-white text-sm font-semibold py-2 px-4 rounded-full hover:bg-purple-700 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 dark:bg-admin-dark-tertiary dark:hover:bg-green-700"
                >
                  Logout
                </button>
              </div>
            </div>
          </header>

          <div className="h-[calc(95vh-100px)] overflow-y-auto pr-2 scrollbar-hide rounded-xl">
            <Outlet />
          </div>
        </div>
      </AdminSidebarContext.Provider>
    </div>
  );
}