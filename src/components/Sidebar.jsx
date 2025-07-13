import React, { useState, useEffect, useContext } from 'react'; // Tambah useContext
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext'; // Import AuthContext
import {
  HomeIcon,
  BookOpenIcon,
  AcademicCapIcon,
  TrophyIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  BookmarkIcon,
  Cog6ToothIcon, // Icon untuk Settings, bisa juga dipakai untuk admin dashboard
  ShieldCheckIcon // Contoh ikon untuk admin, jika ada di @heroicons/react/24/outline
} from '@heroicons/react/24/outline';
import { SidebarContext } from './mainLayout'; 

export default function Sidebar() {
  const location = useLocation();
  const { isSidebarOpen, setIsSidebarOpen } = useContext(SidebarContext);
  const { user, profile } = useContext(AuthContext); // Dapatkan user dan profile dari AuthContext
  const [isCollapsed, setIsCollapsed] = useState(false);
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

  const navItems = [
    { name: 'Dashboard', icon: HomeIcon, path: '/dashboard' },
    { name: 'Material', icon: BookOpenIcon, path: '/material' },
    { name: 'Quiz', icon: AcademicCapIcon, path: '/quizzes' },
    { name: 'Leaderboard', icon: TrophyIcon, path: '/leaderboard' },
    { name: 'Discussion', icon: ChatBubbleLeftRightIcon, path: '/discussions' },
    { name: 'History', icon: ClockIcon, path: '/history' },
    { name: 'Bookmark', icon: BookmarkIcon, path: '/bookmarks' },
    { name: 'Settings', icon: Cog6ToothIcon, path: '/settings' },
  ];

  // Tambahkan item navigasi admin jika user adalah admin
  const adminNavItem = {
    name: 'Admin Dashboard', // Ubah teks menjadi "Admin Dashboard"
    icon: Cog6ToothIcon, // Menggunakan Cog6ToothIcon, atau ShieldCheckIcon jika diimpor
    path: '/admin/dashboard'
  };

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-40 transform
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0
        ${isCollapsed ? 'md:w-20' : 'md:w-64'}
        bg-light-purple text-light-text-dark flex flex-col p-4 shadow-lg transition-all duration-300 ease-in-out dark:bg-dark-bg-primary
      `}
    >
      <div
        className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-start'} mt-4 mb-8 cursor-pointer hover:bg-white/10 p-2 rounded-lg transition-colors duration-200 dark:hover:bg-white/5`}
        onClick={() => {
          if (typeof window !== 'undefined' && window.innerWidth >= 768) {
            setIsCollapsed(!isCollapsed);
          } else if (typeof window !== 'undefined') {
            setIsSidebarOpen(false);
          }
        }}
      >
        <img
          src={currentTheme === 'dark' ? '/logo-white.svg' : '/logo-purple.svg'}
          alt="Tech Edify Logo"
          className="h-10 w-10 mr-2"
        />
        {!isCollapsed && (
          <span className="text-2xl font-semibold whitespace-nowrap dark:text-white">Tech Edify</span>
        )}
      </div>

      <nav className="flex-grow">
        <ul>
          {navItems.map((item) => (
            <li key={item.name} className="mb-2">
              <Link
                to={item.path}
                onClick={() => {
                  if (typeof window !== 'undefined' && window.innerWidth < 768) {
                    setIsSidebarOpen(false);
                  }
                }}
                className={`flex items-center py-3 rounded-lg transition-colors duration-200 relative group
                  ${isCollapsed ? 'justify-center p-3' : 'px-4'}
                  ${location.pathname === item.path
                    ? 'bg-white text-purple-700 shadow-sm dark:bg-dark-accent-purple dark:text-dark-text-light'
                    : 'text-gray-700 hover:bg-[#D1C4E9] hover:text-[#533B87] dark:text-dark-text-medium dark:hover:bg-dark-bg-tertiary dark:hover:text-dark-text-light'
                  }`}
                title={isCollapsed ? item.name : ''}
              >
                <item.icon className={`h-6 w-6 flex-shrink-0 ${!isCollapsed ? 'mr-3' : ''}`} />
                {!isCollapsed && (
                  <span className="text-md font-medium whitespace-nowrap">{item.name}</span>
                )}

                {isCollapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
                    {item.name}
                  </div>
                )}
              </Link>
            </li>
          ))}
          
          {/* Menu Admin tambahan (hanya jika user adalah admin) */}
          {profile?.role === 'admin' && (
            <li className={`${isCollapsed ? 'mt-6' : 'mt-6 px-4'} mb-2 pt-4 border-t border-gray-200 dark:border-gray-700`}>
              <Link
                to={adminNavItem.path}
                onClick={() => {
                  if (typeof window !== 'undefined' && window.innerWidth < 768) {
                    setIsSidebarOpen(false);
                  }
                }}
                className={`flex items-center rounded-lg transition-colors duration-200 relative group
                  ${isCollapsed ? 'justify-center p-3' : 'px-4 py-3'}
                  ${location.pathname === adminNavItem.path
                    ? 'bg-white text-purple-700 shadow-sm dark:bg-dark-accent-purple dark:text-dark-text-light'
                    : 'text-gray-700 hover:bg-[#D1C4E9] hover:text-[#533B87] dark:text-dark-text-medium dark:hover:bg-dark-bg-tertiary dark:hover:text-dark-text-light'
                  }`}
                title={isCollapsed ? adminNavItem.name : ''}
              >
                <adminNavItem.icon className={`h-6 w-6 flex-shrink-0 ${!isCollapsed ? 'mr-3' : ''}`} />
                {!isCollapsed && (
                  <span className="text-md font-medium whitespace-nowrap">{adminNavItem.name}</span>
                )}
                {isCollapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
                    {adminNavItem.name}
                  </div>
                )}
              </Link>
            </li>
          )}
        </ul>
      </nav>
      <div className={`${isCollapsed ? 'hidden' : ''} mt-auto pt-4 border-t border-gray-200 text-center text-gray-300 text-sm dark:border-gray-700 dark:text-gray-400`}>
        © 2025 Tech Edify
      </div>
    </aside>
  );
}