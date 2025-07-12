// frontend/src/components/SidebarAdmin.jsx
import { Link, useLocation } from 'react-router-dom';
import React from 'react'; 

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
    // Menggunakan bg-emerald-800 untuk light mode, dan dark:bg-adminDark-bg-primary untuk dark mode
    <div className="w-64 bg-emerald-800 text-white flex flex-col p-4 shadow-lg dark:bg-adminDark-bg-primary">
      <div className="text-2xl font-bold my-8 text-center">
        Tech Edify Admin
      </div>
      <nav className="flex-1">
        <ul>
          {navItems.map((item) => (
            <li key={item.name} className="mb-2">
              <Link
                to={item.path}
                className={`flex items-center p-3 rounded-lg transition-colors duration-200 
                  ${location.pathname === item.path 
                    // Item aktif: bg-emerald-600 untuk light, dark:bg-adminDark-accent-green untuk dark
                    ? 'bg-emerald-600 text-white font-semibold dark:bg-adminDark-accent-green dark:text-white' 
                    // Default & hover: text-gray-200 untuk light, dark:text-gray-300 & dark:hover:bg-adminDark-bg-tertiary untuk dark
                    : 'hover:bg-emerald-700 text-gray-200 dark:text-gray-300 dark:hover:bg-adminDark-bg-tertiary dark:hover:text-white' 
                  }`}
              >
                <item.icon className="h-5 w-5 mr-3" /> 
                {item.name}
              </Link>
            </li>
          ))}
          {/* Tambah tombol/link menuju User Dashboard */}
          <li className="mt-6 mb-2 pt-4 border-t border-emerald-700 dark:border-adminDark-bg-tertiary"> {/* Border di dark mode */}
            <Link
              to="/dashboard" 
              className="flex items-center p-3 rounded-lg transition-colors duration-200 hover:bg-emerald-700 text-gray-200 dark:text-gray-300 dark:hover:bg-adminDark-bg-tertiary dark:hover:text-white"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5 mr-3" /> 
              Go to User Dashboard
            </Link>
          </li>
        </ul>
      </nav>
      {/* Mengubah warna border footer sidebar menjadi abu-abu gelap untuk dark mode */}
      <div className="mt-auto pt-4 border-t border-emerald-700 text-center text-gray-300 text-sm dark:border-adminDark-bg-tertiary dark:text-gray-400">
        © 2025 Tech Edify
      </div>
    </div>
  );
}