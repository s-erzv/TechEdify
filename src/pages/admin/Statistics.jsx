import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

import {
  UsersIcon,
  UserPlusIcon,
  ClipboardDocumentCheckIcon,
  ChartBarIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline';

import { Bar, Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  LineElement,
  PointElement
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  LineElement,
  PointElement
);


export default function AdminStatistics() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    adminUsers: 0,
    studentUsers: 0,
    newRegistrationsToday: 0,
    totalCourseCompletions: 0,
    totalLessonsCompleted: 0,
    totalQuizzesAttempted: 0,
    monthlyUserRegistrations: { labels: [], data: [] },
    courseCompletionRates: { labels: [], data: [] },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTheme, setCurrentTheme] = useState('light');

  const fetchStatsData = async () => {
    setLoading(true);
    setError(null);

    try {
      const { count: totalUsersCount, error: usersError } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true });
      if (usersError) throw usersError;

      const { count: adminUsersCount, error: adminError } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'admin');
      if (adminError) throw adminError;

      const { count: studentUsersCount, error: studentError } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'student');
      if (studentError) throw studentError;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      const { count: newRegCount, error: newRegError } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', today.toISOString())
        .lt('created_at', tomorrow.toISOString());
      if (newRegError) throw newRegError;

      const { count: completedCoursesCount, error: completedCoursesError } = await supabase
        .from('user_course_progress')
        .select('id', { count: 'exact', head: true })
        .eq('is_completed', true);
      if (completedCoursesError) throw completedCoursesError;

      const { count: totalLessonsCompletedCount, error: lessonsCompletedError } = await supabase
        .from('user_lessons_completion')
        .select('id', { count: 'exact', head: true });
      if (lessonsCompletedError) throw lessonsCompletedError;

      const { count: totalQuizzesAttemptedCount, error: quizzesAttemptedError } = await supabase
        .from('user_quiz_attempts')
        .select('id', { count: 'exact', head: true });
      if (quizzesAttemptedError) throw quizzesAttemptedError;

      const { data: monthlyRegistrations, error: monthlyRegDataError } = await supabase
        .from('profiles')
        .select('created_at')
        .order('created_at', { ascending: true });
      if (monthlyRegDataError) throw monthlyRegDataError;

      const monthlyCounts = {};
      monthlyRegistrations.forEach(profile => {
        const date = new Date(profile.created_at);
        const yearMonth = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        monthlyCounts[yearMonth] = (monthlyCounts[yearMonth] || 0) + 1;
      });

      const sortedMonths = Object.keys(monthlyCounts).sort();
      const monthlyLabels = sortedMonths.map(ym => {
        const [year, month] = ym.split('-');
        const date = new Date(year, parseInt(month) - 1);
        return date.toLocaleString('en-US', { month: 'short', year: '2-digit' });
      });
      const monthlyData = sortedMonths.map(ym => monthlyCounts[ym]);

      const { data: allCoursesData, error: allCoursesError } = await supabase
        .from('courses')
        .select(`
          id,
          title,
          user_course_progress (
            id,
            is_completed
          )
        `);
      if (allCoursesError) throw allCoursesError;

      const courseCompletionSummary = {};
      allCoursesData.forEach(course => {
        const courseTitle = course.title;
        courseCompletionSummary[courseTitle] = { completed: 0, total: 0 };
        if (course.user_course_progress && course.user_course_progress.length > 0) {
          course.user_course_progress.forEach(progress => {
            courseCompletionSummary[courseTitle].total++;
            if (progress.is_completed) {
              courseCompletionSummary[courseTitle].completed++;
            }
          });
        }
      });

      const completionLabels = Object.keys(courseCompletionSummary);
      const completionRatesData = completionLabels.map(title => {
        const summary = courseCompletionSummary[title];
        return summary.total > 0 ? (summary.completed / summary.total) * 100 : 0;
      });


      setStats(prevStats => ({
        ...prevStats,
        totalUsers: totalUsersCount || 0,
        adminUsers: adminUsersCount || 0,
        studentUsers: studentUsersCount || 0,
        newRegistrationsToday: newRegCount || 0,
        totalCourseCompletions: completedCoursesCount || 0,
        totalLessonsCompleted: totalLessonsCompletedCount || 0,
        totalQuizzesAttempted: totalQuizzesAttemptedCount || 0,
        monthlyUserRegistrations: { labels: monthlyLabels, data: monthlyData },
        courseCompletionRates: { labels: completionLabels, data: completionRatesData },
      }));

    } catch (err) {
      console.error('Error fetching admin statistics data:', err.message);
      setError('Failed to load admin statistics: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatsData();
  }, []);

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

  // Warna dinamis untuk Chart.js (berdasarkan tema Tailwind)
  const getChartColors = (isDark) => ({
    // Bar Chart
    barBackgrounds: isDark ? [
      '#00C853B0', // admin-accent-green with opacity
      '#FFCE56B0', // Yellow for contrast
      '#4BC0C0B0'  // Teal for contrast
    ] : [
      '#36A2EB99', // Blue
      '#FF9F4099', // Orange
      '#9966FF99'  // Purple
    ],
    barBorders: isDark ? [
      '#00C853',
      '#FFCE56',
      '#4BC0C0'
    ] : [
      '#36A2EB',
      '#FF9F40',
      '#9966FF'
    ],
    // Line Chart
    lineBackground: isDark ? '#4BC0C033' : '#4BC0C033', // Teal with opacity
    lineBorder: isDark ? '#4BC0C0' : '#4BC0C0', // Teal
    linePointBackground: isDark ? '#4BC0C0' : '#4BC0C0',
    linePointBorder: isDark ? '#1A1A1A' : '#FFFFFF',
    linePointHoverBackground: isDark ? '#1A1A1A' : '#FFFFFF',
    linePointHoverBorder: isDark ? '#4BC0C0' : '#4BC0C0',
    // Text colors for charts
    textColorPrimary: isDark ? '#E0E0E0' : '#111827', // dark-text-light / gray-900
    textColorSecondary: isDark ? '#B0B0B0' : '#4B5563', // dark-text-medium / gray-600
    gridColor: isDark ? '#4B556380' : '#D1D5DB80', // gray-600 with opacity / gray-300 with opacity
    gridBorderColor: isDark ? '#4B5563' : '#D1D5DB',
  });

  const chartColors = getChartColors(currentTheme === 'dark');

  // --- Data dan Opsi untuk Bar Chart (Aktivitas Pengguna) ---
  const userActivityData = {
    labels: ['Lessons Completed', 'Quizzes Attempted', 'New Registrations'],
    datasets: [
      {
        label: 'Number of Activities',
        data: [stats.totalLessonsCompleted, stats.totalQuizzesAttempted, stats.newRegistrationsToday],
        backgroundColor: chartColors.barBackgrounds,
        borderColor: chartColors.barBorders,
        borderWidth: 1,
      },
    ],
  };

  const userActivityOptions = {
    responsive: true,
    maintainAspectRatio: false, // Ditambahkan untuk responsivitas yang lebih baik
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: chartColors.textColorSecondary,
        },
      },
      title: {
        display: true,
        text: 'User Activity Overview',
        font: {
          size: 16
        },
        color: chartColors.textColorPrimary,
      },
      tooltip: {
        titleColor: chartColors.textColorPrimary,
        bodyColor: chartColors.textColorPrimary,
        backgroundColor: currentTheme === 'dark' ? '#0F3460' : '#FFFFFF',
        borderColor: currentTheme === 'dark' ? '#363640' : '#D1D5DB',
        borderWidth: 1,
      }
    },
    scales: {
      x: {
        ticks: {
          color: chartColors.textColorSecondary,
        },
        grid: {
          color: chartColors.gridColor,
          borderColor: chartColors.gridBorderColor,
        }
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: chartColors.textColorSecondary,
        },
        grid: {
          color: chartColors.gridColor,
          borderColor: chartColors.gridBorderColor,
        },
        title: {
          display: true,
          text: 'Number of Activities',
          color: chartColors.textColorSecondary,
        }
      }
    }
  };

  // --- Data dan Opsi untuk Line Chart (Pertumbuhan Pengguna) ---
  const userGrowthData = {
    labels: stats.monthlyUserRegistrations.labels,
    datasets: [
      {
        label: 'New Users per Month',
        data: stats.monthlyUserRegistrations.data,
        fill: true,
        backgroundColor: chartColors.lineBackground,
        borderColor: chartColors.lineBorder,
        tension: 0.4,
        pointBackgroundColor: chartColors.linePointBackground,
        pointBorderColor: chartColors.linePointBorder,
        pointHoverBackgroundColor: chartColors.linePointHoverBackground,
        pointHoverBorderColor: chartColors.linePointHoverBorder,
      },
    ],
  };

  const userGrowthOptions = {
    responsive: true,
    maintainAspectRatio: false, // Ditambahkan untuk responsivitas yang lebih baik
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: chartColors.textColorSecondary,
        },
      },
      title: {
        display: true,
        text: 'User Growth Over Time',
        font: { size: 16 },
        color: chartColors.textColorPrimary,
      },
      tooltip: {
        titleColor: chartColors.textColorPrimary,
        bodyColor: chartColors.textColorPrimary,
        backgroundColor: currentTheme === 'dark' ? '#0F3460' : '#FFFFFF',
        borderColor: currentTheme === 'dark' ? '#363640' : '#D1D5DB',
        borderWidth: 1,
      }
    },
    scales: {
      x: {
        ticks: {
          color: chartColors.textColorSecondary,
        },
        grid: {
          color: chartColors.gridColor,
          borderColor: chartColors.gridBorderColor,
        }
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: chartColors.textColorSecondary,
        },
        grid: {
          color: chartColors.gridColor,
          borderColor: chartColors.gridBorderColor,
        },
        title: {
          display: true,
          text: 'Number of New Users',
          color: chartColors.textColorSecondary,
        }
      }
    }
  };

  // --- Data dan Opsi untuk Doughnut Chart (Tingkat Penyelesaian Kursus) ---
  const courseCompletionData = {
    labels: stats.courseCompletionRates.labels,
    datasets: [
      {
        label: 'Completion Rate',
        data: stats.courseCompletionRates.data,
        backgroundColor: stats.courseCompletionRates.labels.map((_, i) =>
          currentTheme === 'dark' ? `hsl(${i * 60 + 180}, 60%, 70%)` : `hsl(${i * 60}, 70%, 50%)`
        ),
        borderColor: stats.courseCompletionRates.labels.map((_, i) =>
          currentTheme === 'dark' ? `hsl(${i * 60 + 180}, 60%, 50%)` : `hsl(${i * 60}, 70%, 30%)`
        ),
        hoverOffset: 4,
      },
    ],
  };

  const courseCompletionOptions = {
    responsive: true,
    maintainAspectRatio: false, // Ditambahkan untuk responsivitas yang lebih baik
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: chartColors.textColorSecondary,
        },
      },
      title: {
        display: true,
        text: 'Course Completion Rates',
        font: { size: 16 },
        color: chartColors.textColorPrimary,
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed !== null) {
              label += context.parsed.toFixed(2) + '%';
            }
            return label;
          }
        },
        titleColor: chartColors.textColorPrimary,
        bodyColor: chartColors.textColorPrimary,
        backgroundColor: currentTheme === 'dark' ? '#0F3460' : '#FFFFFF',
        borderColor: currentTheme === 'dark' ? '#363640' : '#D1D5DB',
        borderWidth: 1,
      }
    }
  };


  if (loading) {
    return (
      <div className="flex-grow h-screen flex justify-center items-center text-gray-700 text-xl dark:text-dark-text-medium">
        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-700 dark:text-dark-text-medium" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Loading statistics...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-grow h-screen flex justify-center items-center text-red-600 text-xl dark:text-red-400">
        <svg className="h-6 w-6 mr-2 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        Error: {error}
      </div>
    );
  }

  return (
    <div className="flex-grow h-[95vh] scrollbar-hide overflow-y-auto p-6 bg-[#F9F9FB] rounded-xl dark:bg-admin-dark-secondary">
        {/* Page Title */}
        <h1 className="text-xl sm:text-3xl font-bold text-gray-900 mb-6 dark:text-dark-text-light">User Statistics Overview</h1>

        <div className="bg-white p-6 mb-6 rounded-xl shadow-md dark:bg-admin-dark-tertiary">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 dark:text-dark-text-light">Overview</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-blue-50 p-6 rounded-lg flex items-center space-x-4 shadow-sm dark:bg-admin-dark-secondary">
                    <div className="p-3 bg-blue-200 rounded-full dark:bg-gray-800 dark:bg-opacity-50">
                        <UsersIcon className="h-8 w-8 text-blue-700 dark:text-blue-400" />
                    </div>
                    <div>
                        <p className="text-xl font-semibold text-gray-800 dark:text-dark-text-light">{stats.totalUsers}</p>
                        <p className="text-sm text-gray-600 dark:text-dark-text-medium">Total Users</p>
                    </div>
                </div>

                <div className="bg-purple-50 p-6 rounded-lg flex items-center space-x-4 shadow-sm dark:bg-admin-dark-secondary">
                    <div className="p-3 bg-purple-200 rounded-full dark:bg-gray-800 dark:bg-opacity-50">
                        <UsersIcon className="h-8 w-8 text-purple-700 dark:text-purple-400" />
                    </div>
                    <div>
                        <p className="text-xl font-semibold text-gray-800 dark:text-dark-text-light">{stats.adminUsers}</p>
                        <p className="text-sm text-gray-600 dark:text-dark-text-medium">Admin Users</p>
                    </div>
                </div>

                <div className="bg-green-50 p-6 rounded-lg flex items-center space-x-4 shadow-sm dark:bg-admin-dark-secondary">
                    <div className="p-3 bg-green-200 rounded-full dark:bg-gray-800 dark:bg-opacity-50">
                        <UsersIcon className="h-8 w-8 text-green-700 dark:text-green-400" />
                    </div>
                    <div>
                        <p className="text-xl font-semibold text-gray-800 dark:text-dark-text-light">{stats.studentUsers}</p>
                        <p className="text-sm text-gray-600 dark:text-dark-text-medium">Student Users</p>
                    </div>
                </div>

                <div className="bg-yellow-50 p-6 rounded-lg flex items-center space-x-4 shadow-sm dark:bg-admin-dark-secondary">
                    <div className="p-3 bg-yellow-200 rounded-full dark:bg-gray-800 dark:bg-opacity-50">
                        <UserPlusIcon className="h-8 w-8 text-yellow-700 dark:text-yellow-400" />
                    </div>
                    <div>
                        <p className="text-xl font-semibold text-gray-800 dark:text-dark-text-light">{stats.newRegistrationsToday}</p>
                        <p className="text-sm text-gray-600 dark:text-dark-text-medium">New Registrations Today</p>
                    </div>
                </div>

                <div className="bg-teal-50 p-6 rounded-lg flex items-center space-x-4 shadow-sm dark:bg-admin-dark-secondary">
                    <div className="p-3 bg-teal-200 rounded-full dark:bg-gray-800 dark:bg-opacity-50">
                        <ClipboardDocumentCheckIcon className="h-8 w-8 text-teal-700 dark:text-teal-400" />
                    </div>
                    <div>
                        <p className="text-xl font-semibold text-gray-800 dark:text-dark-text-light">{stats.totalCourseCompletions}</p>
                        <p className="text-sm text-gray-600 dark:text-dark-text-medium">Total Course Completions</p>
                    </div>
                </div>

                <div className="bg-orange-50 p-6 rounded-lg flex items-center space-x-4 shadow-sm dark:bg-admin-dark-secondary">
                    <div className="p-3 bg-orange-200 rounded-full dark:bg-gray-800 dark:bg-opacity-50">
                        <BookOpenIcon className="h-8 w-8 text-orange-700 dark:text-orange-400" />
                    </div>
                    <div>
                        <p className="text-xl font-semibold text-gray-800 dark:text-dark-text-light">{stats.totalLessonsCompleted}</p>
                        <p className="text-sm text-gray-600 dark:text-dark-text-medium">Total Lessons Completed</p>
                    </div>
                </div>

                <div className="bg-pink-50 p-6 rounded-lg flex items-center space-x-4 shadow-sm dark:bg-admin-dark-secondary">
                    <div className="p-3 bg-pink-200 rounded-full dark:bg-gray-800 dark:bg-opacity-50">
                        <ClipboardDocumentCheckIcon className="h-8 w-8 text-pink-700 dark:text-pink-400" />
                    </div>
                    <div>
                        <p className="text-xl font-semibold text-gray-800 dark:text-dark-text-light">{stats.totalQuizzesAttempted}</p>
                        <p className="text-sm text-gray-600 dark:text-dark-text-medium">Total Quizzes Attempted</p>
                    </div>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-md dark:bg-admin-dark-tertiary">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 dark:text-dark-text-light">User Activity Overview</h2>
                <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                    <Bar data={userActivityData} options={userActivityOptions} />
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md dark:bg-admin-dark-tertiary">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 dark:text-dark-text-light">User Growth Over Time</h2>
                <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                    <Line data={userGrowthData} options={userGrowthOptions} />
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md dark:bg-admin-dark-tertiary">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 dark:text-dark-text-light">Course Completion Rates</h2>
                <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                    <Doughnut data={courseCompletionData} options={courseCompletionOptions} />
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md dark:bg-admin-dark-tertiary">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 dark:text-dark-text-light">System Summary</h2>
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