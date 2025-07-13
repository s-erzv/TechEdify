// my-frontend/src/components/Sidebar.jsx
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  BookOpenIcon,
  AcademicCapIcon,
  TrophyIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  BookmarkIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';

export default function Sidebar() {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('light');

  useEffect(() => {
    const checkTheme = () => {
      if (document.documentElement.classList.contains('dark')) {
        setCurrentTheme('dark');
      } else {
        setCurrentTheme('light');
      }
    };

    checkTheme();

    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

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

  return (
    <aside className={`${isCollapsed ? 'w-20' : 'w-64'} rounded-xl flex p-4 flex-col h-full transition-all duration-300 ease-in-out bg-[#D9CBFE] dark:bg-dark-bg-primary`}>
      <div
        className="flex items-center mt-4 mb-8 cursor-pointer hover:bg-white/10 p-2 rounded-lg transition-colors duration-200 dark:hover:bg-white/5"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <img
          src={currentTheme === 'dark' ? '/logo-white.svg' : '/logo-purple.svg'}
          alt="Tech Edify Logo"
          className="h-10 w-10 mr-2"
        />
        {!isCollapsed && (
          <span className="text-2xl font-semibold text-[#2E0927] whitespace-nowrap dark:text-white">Tech Edify</span>
        )}
      </div>

      <nav className="flex-grow">
        <ul>
          {navItems.map((item) => (
            <li key={item.name} className="mb-2">
              <Link
                to={item.path}
                // --- PERUBAHAN DI SINI ---
                className={`flex items-center py-3 rounded-lg transition-colors duration-200 relative group
                  ${isCollapsed ? 'justify-center p-3' : 'px-4'} // Padding dan centering disesuaikan
                  ${location.pathname === item.path
                    ? 'bg-white text-purple-700 shadow-sm dark:bg-[#796CD6] dark:text-white'
                    : 'text-gray-700 hover:bg-[#D1C4E9] hover:text-[#533B87] dark:text-gray-300 dark:hover:bg-[#33333D] dark:hover:text-white'
                  }`}
                title={isCollapsed ? item.name : ''}
              >
                {/* --- PERUBAHAN DI SINI --- */}
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
        </ul>
      </nav>
    </aside>
  );
}