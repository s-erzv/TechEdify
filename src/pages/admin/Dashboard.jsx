import React, { useState, useEffect, useContext } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { AuthContext } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { AdminSidebarContext } from '../../components/AdminLayout';

import {
  MagnifyingGlassIcon,
  BellIcon,
  UsersIcon,
  CubeIcon,
  UserPlusIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  BookOpenIcon,
  PlusCircleIcon,
  SunIcon,
  MoonIcon,
  Bars3Icon
} from '@heroicons/react/24/outline';


export default function AdminDashboard() {
  const { signOut, user, profile } = useContext(AuthContext);
  const { toggleSidebar } = useContext(AdminSidebarContext);

  const [dashboardStats, setDashboardStats] = useState({
    totalUsers: 0,
    activeModules: 0,
    newRegistrationsToday: 0,
    pendingTasks: 3,
  });

  const [recentActivities, setRecentActivities] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [errorStats, setErrorStats] = useState(null);
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

  useEffect(() => {
   const fetchDashboardData = async () => {
     setLoadingStats(true);
     setErrorStats(null);
     try {
       const { count: totalUsersCount, error: usersError } = await supabase
         .from('profiles')
         .select('id', { count: 'exact', head: true });

       if (usersError) throw usersError;

       const { count: activeModulesCount, error: modulesError } = await supabase
         .from('modules')
         .select('id', { count: 'exact', head: true })
         .eq('is_active', true);

       if (modulesError) throw modulesError;

       const today = new Date();
       today.setHours(0, 0, 0, 0);
       const tomorrow = new Date(today);
       tomorrow.setDate(today.getDate() + 1);

       const { count: newRegCount, error: regError } = await supabase
         .from('profiles')
         .select('id', { count: 'exact', head: true })
         .gte('created_at', today.toISOString())
         .lt('created_at', tomorrow.toISOString());

       if (regError) throw regError;

       setDashboardStats({
         totalUsers: totalUsersCount || 0,
         activeModules: activeModulesCount || 0,
         newRegistrationsToday: newRegCount || 0,
         pendingTasks: dashboardStats.pendingTasks,
       });

       const { data: quizAttempts, error: quizError } = await supabase
         .from('user_quiz_attempts')
         .select(`
           id, attempted_at, score_obtained, is_passed,
           quizzes(title), profiles(username, full_name)
         `)
         .order('attempted_at', { ascending: false })
         .limit(5);
       if (quizError) throw quizError;

       const { data: lessonCompletions, error: lessonError } = await supabase
         .from('user_lessons_completion')
         .select(`
           id, completed_at,
           lessons(title, modules(title, courses(title))),
           profiles(username, full_name)
         `)
         .order('completed_at', { ascending: false })
         .limit(5);
       if (lessonError) throw lessonError;

       const { data: newRegistrations, error: regActivitiesError } = await supabase
         .from('profiles')
         .select('id, username, full_name, created_at')
         .order('created_at', { ascending: false })
         .limit(5);
       if (regActivitiesError) throw regActivitiesError;


       const combinedActivities = [];

       quizAttempts.forEach(attempt => {
         if (attempt.profiles) {
           const userName = attempt.profiles.username || attempt.profiles.full_name || 'Unknown User';
           combinedActivities.push({
               id: `quiz-${attempt.id}`,
               type: 'Quiz Completed',
               description: `${userName} completed quiz "${attempt.quizzes?.title || 'Unknown'}" with score ${attempt.score_obtained}.`,
               time: new Date(attempt.attempted_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }),
               icon: ClipboardDocumentListIcon,
               iconColor: 'text-yellow-500',
           });
         }
       });

       lessonCompletions.forEach(completion => {
         if (completion.profiles) {
           const userName = completion.profiles.username || completion.profiles.full_name || 'Unknown User';
           combinedActivities.push({
               id: `lesson-${completion.id}`,
               type: 'Lesson Completed',
               description: `${userName} completed lesson "${completion.lessons?.title || 'Unknown'}" in course "${completion.lessons?.modules?.courses?.title || 'Unknown'}".`,
               time: new Date(completion.completed_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }),
               icon: BookOpenIcon,
               iconColor: 'text-green-500',
           });
         }
       });

       newRegistrations.forEach(reg => {
         const userName = reg.username || reg.full_name || 'Unknown User';
         combinedActivities.push({
           id: `reg-${reg.id}`,
           type: 'User Registered',
           description: `${userName} just registered to the system.`,
           time: new Date(reg.created_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }),
           icon: UserPlusIcon,
           iconColor: 'text-blue-500',
         });
       });

       combinedActivities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
       setRecentActivities(combinedActivities.slice(0, 5));

     } catch (error) {
       console.error('Error fetching dashboard data:', error.message);
       setErrorStats('Failed to load dashboard data: ' + error.message);
       setDashboardStats({ totalUsers: 0, activeModules: 0, newRegistrationsToday: 0, pendingTasks: 0 });
     } finally {
       setLoadingStats(false);
     }
   };

   fetchDashboardData();
  }, [user, dashboardStats.pendingTasks]);

  const adminUserName = profile?.username || profile?.full_name || user?.email?.split('@')[0] || 'Admin';
  const adminAvatarUrl = profile?.avatar_url || '/default-admin-avatar.jpg';


  if (loadingStats) {
    return (
     <div className="flex-grow flex justify-center items-center text-gray-500 text-lg dark:text-dark-text-dark">
         <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-500 dark:text-dark-text-dark" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
         <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
         <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
         </svg>
         Loading statistics...
       </div>
    );
  }

  if (errorStats) {
    return (
     <div className="flex-grow flex justify-center items-center text-red-600 text-lg dark:text-red-400">
         <svg className="h-6 w-6 mr-2 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
         <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
         </svg>
         Error: {errorStats}
       </div>
    );
  }

  return (
    <div className="flex-grow h-[95vh] scrollbar-hide overflow-y-auto p-6 bg-[#F9F9FB] rounded-xl dark:bg-admin-dark-secondary">
        {/* Page Title */}
        <h1 className="text-xl sm:text-3xl font-bold text-gray-900 mb-6 dark:text-dark-text-light">Admin Dashboard Overview</h1>


    <div className="bg-gradient-to-r from-admin-light-active to-admin-light-hover text-white p-6 rounded-xl shadow-md flex flex-col sm:flex-row items-center justify-between relative overflow-hidden mb-6 dark:bg-admin-dark-primary dark:bg-opacity-50 dark:shadow-none">
      <div className="mb-4 sm:mb-0 text-center sm:text-left">
        <h2 className="text-xl sm:text-2xl font-bold mb-2 dark:text-dark-text-light">Admin Panel Overview</h2>
        <p className="text-sm opacity-90 mb-4 dark:text-dark-text-medium">
          Welcome back, manage your Tech Edify application with ease!
        </p>
        <Link to="/admin/statistics" className="bg-white text-purple-700 font-semibold py-2 px-6 rounded-full hover:bg-gray-100 transition-colors dark:bg-admin-dark-tertiary dark:text-dark-text-light dark:hover:bg-gray-700">
          View Reports
        </Link>
      </div>
      <ChartBarIcon className="h-24 w-24 sm:h-32 sm:w-32 opacity-30 text-white flex-shrink-0" />
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-md flex flex-col items-start dark:bg-admin-dark-tertiary dark:shadow-none">
          <div className="flex justify-between items-center w-full mb-3">
           <h3 className="text-sm font-medium text-gray-600 dark:text-dark-text-medium">Total Users</h3>
           <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center dark:bg-blue-900 dark:bg-opacity-30">
            <UsersIcon className="h-6 w-6 text-blue-600" />
           </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-dark-text-light">{dashboardStats.totalUsers}</p>
          <p className="text-xs text-gray-500 mt-1 dark:text-dark-text-dark">Total number of registered users.</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md flex flex-col items-start dark:bg-admin-dark-tertiary dark:shadow-none">
          <div className="flex justify-between items-center w-full mb-3">
           <h3 className="text-sm font-medium text-gray-600 dark:text-dark-text-medium">Active Modules</h3>
           <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center dark:bg-green-900 dark:bg-opacity-30">
            <CubeIcon className="h-6 w-6 text-green-600" />
           </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-dark-text-light">{dashboardStats.activeModules}</p>
          <p className="text-xs text-gray-500 mt-1 dark:text-dark-text-dark">Number of modules currently active.</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md flex flex-col items-start dark:bg-admin-dark-tertiary dark:shadow-none">
          <div className="flex justify-between items-center w-full mb-3">
           <h3 className="text-sm font-medium text-gray-600 dark:text-dark-text-medium">New Registrations (Today)</h3>
           <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center dark:bg-yellow-900 dark:bg-opacity-30">
            <UserPlusIcon className="h-6 w-6 text-yellow-600" />
           </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-dark-text-light">{dashboardStats.newRegistrationsToday}</p>
          <p className="text-xs text-gray-500 mt-1 dark:text-dark-text-dark">New users registered today.</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md flex flex-col items-start dark:bg-admin-dark-tertiary dark:shadow-none">
          <div className="flex justify-between items-center w-full mb-3">
           <h3 className="text-sm font-medium text-gray-600 dark:text-dark-text-medium">Pending Tasks</h3>
           <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center dark:bg-red-900 dark:bg-opacity-30">
            <ClipboardDocumentListIcon className="h-6 w-6 text-red-600" />
           </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-dark-text-light">{dashboardStats.pendingTasks}</p>
          <p className="text-xs text-gray-500 mt-1 dark:text-dark-text-dark">Admin tasks that need to be completed.</p>
        </div>
    </div>

    <div className="bg-white p-6 rounded-xl shadow-md mb-6 dark:bg-admin-dark-tertiary">
       <h2 className="text-xl font-semibold text-gray-900 mb-4 dark:text-dark-text-light">Recent Activity</h2>
       <ul className="divide-y divide-gray-200 dark:divide-gray-700">
       {recentActivities.length > 0 ? (
          recentActivities.map((activity) => (
             <li key={activity.id} className="py-3 flex items-center space-x-3">
               <div className={`flex-shrink-0 ${activity.iconColor} p-2 rounded-full bg-gray-100 dark:bg-opacity-20`}>
                  <activity.icon className="h-5 w-5" />
               </div>
               <div className="flex-grow flex justify-between items-center">
                  <p className="text-gray-700 dark:text-dark-text-light">
                     <span className="font-medium">{activity.type}:</span> {activity.description}
                  </p>
                  <span className="text-sm text-gray-500 dark:text-dark-text-dark">{activity.time}</span>
               </div>
             </li>
          ))
       ) : (
          <li className="py-3 text-center text-gray-500 dark:text-dark-text-dark">No recent activity.</li>
       )}
       </ul>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
       <div className="bg-white p-6 rounded-xl shadow-md dark:bg-admin-dark-tertiary">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 dark:text-dark-text-light">Quick Links</h2>
          <ul className="space-y-3">
            <li>
              <Link to="/admin/users" className="flex items-center text-purple-600 hover:text-purple-800 transition-colors duration-200 dark:text-admin-accent-green dark:hover:text-green-600">
                  <UsersIcon className="h-5 w-5 mr-2" /> Manage Users
              </Link>
            </li>
            <li>
              <Link to="/admin/materials" className="flex items-center text-purple-600 hover:text-purple-800 transition-colors duration-200 dark:text-admin-accent-green dark:hover:text-green-600">
                  <BookOpenIcon className="h-5 w-5 mr-2" /> Manage Materials
              </Link>
            </li>
            <li>
              <Link to="/admin/modules" className="flex items-center text-purple-600 hover:text-purple-800 transition-colors duration-200 dark:text-admin-accent-green dark:hover:text-green-600">
                  <CubeIcon className="h-5 w-5 mr-2" /> Manage Modules
              </Link>
            </li>
            <li>
              <Link to="/admin/quizzes" className="flex items-center text-purple-600 hover:text-purple-800 transition-colors duration-200 dark:text-admin-accent-green dark:hover:text-green-600">
                  <ClipboardDocumentListIcon className="h-5 w-5 mr-2" /> Manage Quizzes
              </Link>
            </li>
          </ul>
       </div>
       <div className="bg-white p-6 rounded-xl shadow-md dark:bg-admin-dark-tertiary">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 dark:text-dark-text-light">System Summary</h2>
          <div className="space-y-2 text-gray-700 text-sm dark:text-dark-text-medium">
            <p><strong>App Version:</strong> 1.0.0</p>
            <p><strong>Server Status:</strong> <span className="text-green-600 font-medium dark:text-green-500">Online</span></p>
            <p><strong>Server Location:</strong> South Tangerang, Banten, Indonesia</p>
            <p><strong>Last Updated:</strong> {new Date().toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' })}</p>
          </div>
       </div>
    </div>
   </div>
  );
}
