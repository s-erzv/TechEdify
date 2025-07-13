// my-frontend/src/components/SidebarAdmin.jsx
import { Link, useLocation } from 'react-router-dom';
import React, { useState, useEffect } from 'react'; // Tambah useState dan useEffect

// Import Heroicons yang akan digunakan
import {
  ChartBarIcon, // Untuk Dashboard
  UsersIcon,    // Untuk Manage Users
  BookOpenIcon, // Untuk Manage Courses & Manage Materials
  CubeIcon,     // Untuk Manage Modules
  DocumentTextIcon, // Untuk Manage Lessons
  AcademicCapIcon, // Untuk Manage Quizzes
  ArrowRightOnRectangleIcon // Untuk Go to User Dashboard
} from '@heroicons/react/24/outline'; 

export default function SidebarAdmin() { 
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false); // State baru untuk mengontrol ciut/lebar
  const [currentTheme, setCurrentTheme] = useState('light'); // State for theme, added from Sidebar.jsx

  // Effect to detect current theme from documentElement class, added from Sidebar.jsx
  useEffect(() => {
    const checkTheme = () => {
      if (document.documentElement.classList.contains('dark')) {
        setCurrentTheme('dark');
      } else {
        setCurrentTheme('light');
      }
    };

    // Initial check
    checkTheme();

    // Create a MutationObserver to react to class changes on the html element
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    // Cleanup observer on component unmount
    return () => observer.disconnect();
  }, []); // Run once on mount

  const navItems = [
    { name: 'Dashboard', icon: ChartBarIcon, path: '/admin/dashboard' },
    { name: 'Manage Users', icon: UsersIcon, path: '/admin/users' },
    { name: 'Manage Courses', icon: BookOpenIcon, path: '/admin/courses' },
    { name: 'Manage Modules', icon: CubeIcon, path: '/admin/modules' },
    { name: 'Manage Lessons', icon: DocumentTextIcon, path: '/admin/lessons' },
    { name: 'Manage Materials', icon: BookOpenIcon, path: '/admin/materials' },
    { name: 'Manage Quizzes', icon: AcademicCapIcon, path: '/admin/quizzes' },
    { name: 'User Stats', icon: ChartBarIcon, path: '/admin/statistics' }, 
  ];

  return (
    <div className={`${isCollapsed ? 'w-20' : 'w-64'} bg-emerald-800 text-white flex flex-col p-4 shadow-lg transition-all duration-300 ease-in-out dark:bg-adminDark-bg-primary`}>
      {/* Header - Clickable to toggle */}
      <div
        className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-start'} mt-4 mb-8 cursor-pointer hover:bg-emerald-700/50 p-2 rounded-lg transition-colors duration-200`}
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <img
          src={currentTheme === 'dark' ? '/logo-white.svg' : '/logo-white.svg'} // Assuming you want a logo for admin sidebar too
          alt="Tech Edify Admin Logo"
          className="h-10 w-10" // Hapus mr-2 di sini
        />
        {!isCollapsed && (
          <span className="text-2xl font-semibold whitespace-nowrap ml-2">Tech Edify</span> // Tambah ml-2
        )}
      </div>

      <nav className="flex-1">
        <ul>
          {navItems.map((item) => (
            <li key={item.name} className="mb-2">
              <Link
                to={item.path}
                className={`flex items-center rounded-lg transition-colors duration-200 relative group
                  ${isCollapsed ? 'justify-center p-3' : 'px-4 py-3'} 
                  ${location.pathname === item.path 
                    ? 'bg-emerald-600 text-white font-semibold dark:bg-adminDark-accent-green dark:text-white' 
                    : 'hover:bg-emerald-700 text-gray-200 dark:text-gray-300 dark:hover:bg-adminDark-bg-tertiary dark:hover:text-white' 
                  }`}
                title={isCollapsed ? item.name : ''} // Tooltip untuk mode collapsed
              >
                <item.icon className={`h-5 w-5 flex-shrink-0 ${!isCollapsed ? 'mr-3' : ''}`} /> 
                {!isCollapsed && item.name} {/* Sembunyikan teks saat collapsed */}

                {/* Tooltip untuk collapsed state */}
                {isCollapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
                    {item.name}
                  </div>
                )}
              </Link>
            </li>
          ))}
          {/* Tombol/link menuju User Dashboard */}
          <li className={`${isCollapsed ? 'mt-6' : 'mt-6 px-4'} mb-2 pt-4 border-t border-emerald-700 dark:border-adminDark-bg-tertiary`}>
            <Link
              to="/dashboard" 
              className={`flex items-center rounded-lg transition-colors duration-200 hover:bg-emerald-700 text-gray-200 dark:text-gray-300 dark:hover:bg-adminDark-bg-tertiary dark:hover:text-white
                  ${isCollapsed ? 'justify-center p-3' : 'px-4 py-3'}`}
            >
              <ArrowRightOnRectangleIcon className={`h-5 w-5 flex-shrink-0 ${!isCollapsed ? 'mr-3' : ''}`} /> 
              {!isCollapsed && "Go to User Dashboard"}
            </Link>
          </li>
        </ul>
      </nav>
      {/* Footer */}
      <div className={`${isCollapsed ? 'hidden' : ''} mt-auto pt-4 border-t border-emerald-700 text-center text-gray-300 text-sm dark:border-adminDark-bg-tertiary dark:text-gray-400`}>
        © 2025 Tech Edify
      </div>
    </div>
  );
}