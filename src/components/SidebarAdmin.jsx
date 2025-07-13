import { Link, useLocation } from 'react-router-dom';
import React, { useState, useEffect, useContext } from 'react';
import { AdminSidebarContext } from './AdminLayout';
import {
  ChartBarIcon,
  UsersIcon,
  BookOpenIcon,
  CubeIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';

export default function SidebarAdmin() {
  const location = useLocation();
  const { isSidebarOpen,  setIsSidebarOpen } = useContext(AdminSidebarContext);
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
    <aside
      className={`
        fixed inset-y-0 left-0 z-40 transform
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0
        ${isCollapsed ? 'md:w-20' : 'md:w-64'}
        bg-admin-light-primary text-admin-light-text flex flex-col p-4 shadow-lg transition-all duration-300 ease-in-out
        dark:bg-admin-dark-primary dark:text-admin-dark-text
      `}
    >
      <div
        className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-start'} mt-4 mb-8 cursor-pointer hover:bg-admin-light-hover p-2 rounded-lg transition-colors duration-200 dark:hover:bg-admin-dark-secondary`}
        onClick={() => {
          if (typeof window !== 'undefined' && window.innerWidth >= 768) {
            setIsCollapsed(!isCollapsed);
          } else if (typeof window !== 'undefined') {
            setIsSidebarOpen(false);
          }
        }}
      >
        <img
          src={currentTheme === 'dark' ? '/logo-white.svg' : '/logo-white.svg'}
          alt="Tech Edify Admin Logo"
          className="h-8 w-8"
        />
        {!isCollapsed && (
          <span className="text-lg font-semibold whitespace-nowrap ml-2">Tech Edify Admin</span>
        )}
      </div>

      <nav className="flex-1">
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
                className={`flex items-center rounded-lg transition-colors duration-200
                  ${isCollapsed ? 'justify-center p-3' : 'px-4 py-3'}
                  ${location.pathname === item.path
                    ? 'bg-admin-light-active text-white font-semibold dark:bg-admin-dark-tertiary dark:text-admin-dark-text'
                    : 'hover:bg-admin-light-hover text-gray-200 dark:text-gray-300 dark:hover:bg-admin-dark-secondary dark:hover:text-white'
                  }`}
                title={isCollapsed ? item.name : ''}
              >
                <item.icon className={`h-5 w-5 flex-shrink-0 ${!isCollapsed ? 'mr-3' : ''}`} />
                {!isCollapsed && item.name}

                {isCollapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
                    {item.name}
                  </div>
                )}
              </Link>
            </li>
          ))}
          <li className={`${isCollapsed ? 'mt-6' : 'mt-6 px-4'} mb-2 pt-4 border-t border-gray-700 dark:border-admin-dark-tertiary`}>
            <Link
              to="/dashboard"
              onClick={() => {
                if (typeof window !== 'undefined' && window.innerWidth < 768) {
                  setIsSidebarOpen(false);
                }
              }}
              className={`flex items-center rounded-lg transition-colors duration-200 hover:bg-admin-light-hover text-gray-200 dark:text-gray-300 dark:hover:bg-admin-dark-secondary dark:hover:text-white
                  ${isCollapsed ? 'justify-center p-3' : 'px-4 py-3'}`}
            >
              <ArrowRightOnRectangleIcon className={`h-5 w-5 flex-shrink-0 ${!isCollapsed ? 'mr-3' : ''}`} />
              {!isCollapsed && "Go to User Dashboard"}
            </Link>
          </li>
        </ul>
      </nav>
      <div className={`${isCollapsed ? 'hidden' : ''} mt-auto pt-4 border-t border-gray-700 text-center text-gray-300 text-sm dark:border-admin-dark-tertiary dark:text-gray-400`}>
        © 2025 Tech Edify
      </div>
    </aside>
  );
}