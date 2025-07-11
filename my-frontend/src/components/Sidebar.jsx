import React from 'react';
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

  const navItems = [
    { name: 'Dashboard', icon: HomeIcon, path: '/Dashboard' },
    { name: 'Material', icon: BookOpenIcon, path: '/material' },
    { name: 'Quiz', icon: AcademicCapIcon, path: '/quiz' },
    { name: 'Leaderboard', icon: TrophyIcon, path: '/leaderboard' },
    { name: 'Discussion', icon: ChatBubbleLeftRightIcon, path: '/discussion' },
    { name: 'History', icon: ClockIcon, path: '/history' },
    { name: 'Bookmark', icon: BookmarkIcon, path: '/bookmark' },
    { name: 'Settings', icon: Cog6ToothIcon, path: '/settings' },
  ];

  return (
    <aside className="w-64 rounded-xl flex p-8 flex-col bg-[#D9CBFE] h-full">
      <div className="flex items-center mt-4 mb-8">
        <img src="/logo-purple.svg" alt="Tech Edify Logo" className="h-10 w-10 mr-2" />
        <span className="text-2xl font-semibold text-[#2E0927]">Tech Edify</span>
      </div>

      <nav className="flex-grow">
        <ul>
          {navItems.map((item) => (
            <li key={item.name} className="mb-2">
              <Link
                to={item.path}
                className={`flex items-center py-3 px-4 rounded-lg transition-colors duration-200
                  ${location.pathname === item.path 
                    ? 'bg-white text-purple-700 shadow-sm' 
                    : 'text-gray-700 hover:bg-[#D1C4E9] hover:text-[#533B87]' 
                  }`
                }
              >
                <item.icon className="h-6 w-6 mr-3" />
                <span className="text-md font-medium">{item.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}