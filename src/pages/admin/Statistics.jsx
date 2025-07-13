// frontend/src/pages/admin/Statistics.jsx
import React, { useState, useEffect } from 'react'; // Hapus useContext jika tidak digunakan
import { supabase } from '../../lib/supabaseClient'; 

import {
    UsersIcon,
    UserPlusIcon,
    ClipboardDocumentCheckIcon, 
    ChartBarIcon, 
    // BellIcon, ChevronDownIcon, // Tidak digunakan, bisa dihapus
} from '@heroicons/react/24/outline'; 

// Import Chart.js dan komponen dari react-chartjs-2
import { Bar, Line, Doughnut } from 'react-chartjs-2'; // <--- Tambah Line, Doughnut
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    LineElement, // <--- Tambah LineElement
    PointElement // <--- Tambah PointElement
} from 'chart.js';

// Mendaftarkan komponen Chart.js yang diperlukan
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    LineElement, // <--- Daftarkan LineElement
    PointElement // <--- Daftarkan PointElement
);


export default function AdminStatistics() {
    const [stats, setStats] = useState({
        totalUsers: 0,
        adminUsers: 0,
        studentUsers: 0,
        newRegistrationsToday: 0,
        totalCourseCompletions: 0,
        totalLessonsCompleted: 0, // <--- State baru
        totalQuizzesAttempted: 0, // <--- State baru
        monthlyUserRegistrations: { labels: [], data: [] }, // <--- State baru untuk Line Chart
        courseCompletionRates: { labels: [], data: [] }, // <--- State baru untuk Doughnut Chart
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- Fungsi untuk Fetch Statistik Pengguna ---
    const fetchStatsData = async () => { // <--- Ubah nama fungsi untuk lebih umum
        setLoading(true);
        setError(null);

        try {
            // 1. Total Pengguna
            const { count: totalUsersCount, error: usersError } = await supabase
                .from('profiles')
                .select('id', { count: 'exact', head: true });
            if (usersError) throw usersError;

            // 2. Pengguna Admin
            const { count: adminUsersCount, error: adminError } = await supabase
                .from('profiles')
                .select('id', { count: 'exact', head: true })
                .eq('role', 'admin');
            if (adminError) throw adminError;

            // 3. Pengguna Siswa
            const { count: studentUsersCount, error: studentError } = await supabase
                .from('profiles')
                .select('id', { count: 'exact', head: true })
                .eq('role', 'student');
            if (studentError) throw studentError;

            // 4. Pendaftaran Baru Hari Ini
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

            // 5. Total Penyelesaian Kursus
            const { count: completedCoursesCount, error: completedCoursesError } = await supabase
                .from('user_course_progress')
                .select('id', { count: 'exact', head: true })
                .eq('is_completed', true);
            if (completedCoursesError) throw completedCoursesError;

            // <--- Tambah fetch untuk Total Lessons Completed
            const { count: totalLessonsCompletedCount, error: lessonsCompletedError } = await supabase
                .from('user_lessons_completion')
                .select('id', { count: 'exact', head: true });
            if (lessonsCompletedError) throw lessonsCompletedError;

            // <--- Tambah fetch untuk Total Quizzes Attempted
            const { count: totalQuizzesAttemptedCount, error: quizzesAttemptedError } = await supabase
                .from('user_quiz_attempts')
                .select('id', { count: 'exact', head: true });
            if (quizzesAttemptedError) throw quizzesAttemptedError;

            // <--- Fetch data untuk User Growth Over Time (per bulan)
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

            // <--- Fetch data untuk Course Completion Rates
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

            const courseCompletionSummary = {}; // { courseTitle: { completed: X, total: Y } }
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
                return summary.total > 0 ? (summary.completed / summary.total) * 100 : 0; // Percentage
            });


            setStats(prevStats => ({ // <--- Menggunakan prevStats
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
        fetchStatsData(); // <--- Panggil fungsi utama fetching data
    }, []);

    // --- Data dan Opsi untuk Bar Chart (Aktivitas Pengguna) ---
    const userActivityData = {
        labels: ['Lessons Completed', 'Quizzes Attempted', 'New Registrations'],
        datasets: [
            {
                label: 'Number of Activities',
                data: [stats.totalLessonsCompleted, stats.totalQuizzesAttempted, stats.newRegistrationsToday],
                backgroundColor: [
                    'rgba(54, 162, 235, 0.6)', // Blue
                    'rgba(255, 159, 64, 0.6)', // Orange
                    'rgba(153, 102, 255, 0.6)' // Purple
                ],
                borderColor: [
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 159, 64, 1)',
                    'rgba(153, 102, 255, 1)'
                ],
            },
        ],
    };

    const userActivityOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    color: (context) => { 
                        return document.documentElement.classList.contains('dark') ? 'white' : 'rgb(55, 65, 81)';
                    },
                },
            },
            title: {
                display: true,
                text: 'User Activity Overview', 
                font: {
                    size: 16
                },
                color: (context) => { 
                    return document.documentElement.classList.contains('dark') ? 'white' : 'rgb(17, 24, 39)';
                },
            },
            tooltip: { 
                titleColor: (context) => { return document.documentElement.classList.contains('dark') ? 'white' : 'black'; },
                bodyColor: (context) => { return document.documentElement.classList.contains('dark') ? 'white' : 'black'; },
            }
        },
        scales: {
            x: {
                ticks: {
                    color: (context) => { return document.documentElement.classList.contains('dark') ? 'rgb(209, 213, 219)' : 'rgb(55, 65, 81)'; },
                },
                grid: {
                    color: (context) => { return document.documentElement.classList.contains('dark') ? 'rgba(75, 85, 99, 0.5)' : 'rgba(209, 213, 219, 0.5)'; },
                    borderColor: (context) => { return document.documentElement.classList.contains('dark') ? 'rgb(75, 85, 99)' : 'rgb(209, 213, 219)'; },
                }
            },
            y: {
                beginAtZero: true,
                ticks: {
                    color: (context) => { return document.documentElement.classList.contains('dark') ? 'rgb(209, 213, 219)' : 'rgb(55, 65, 81)'; },
                },
                grid: {
                    color: (context) => { return document.documentElement.classList.contains('dark') ? 'rgba(75, 85, 99, 0.5)' : 'rgba(209, 213, 219, 0.5)'; },
                    borderColor: (context) => { return document.documentElement.classList.contains('dark') ? 'rgb(75, 85, 99)' : 'rgb(209, 213, 219)'; },
                },
                title: {
                    display: true,
                    text: 'Number of Activities',
                    color: (context) => { return document.documentElement.classList.contains('dark') ? 'white' : 'rgb(55, 65, 81)'; },
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
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                tension: 0.4,
                pointBackgroundColor: 'rgba(75, 192, 192, 1)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgba(75, 192, 192, 1)',
            },
        ],
    };

    const userGrowthOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    color: (context) => { return document.documentElement.classList.contains('dark') ? 'white' : 'rgb(55, 65, 81)'; },
                },
            },
            title: {
                display: true,
                text: 'User Growth Over Time',
                font: { size: 16 },
                color: (context) => { return document.documentElement.classList.contains('dark') ? 'white' : 'rgb(17, 24, 39)'; },
            },
            tooltip: {
                titleColor: (context) => { return document.documentElement.classList.contains('dark') ? 'white' : 'black'; },
                bodyColor: (context) => { return document.documentElement.classList.contains('dark') ? 'white' : 'black'; },
            }
        },
        scales: {
            x: {
                ticks: {
                    color: (context) => { return document.documentElement.classList.contains('dark') ? 'rgb(209, 213, 219)' : 'rgb(55, 65, 81)'; },
                },
                grid: {
                    color: (context) => { return document.documentElement.classList.contains('dark') ? 'rgba(75, 85, 99, 0.3)' : 'rgba(209, 213, 219, 0.5)'; },
                }
            },
            y: {
                beginAtZero: true,
                ticks: {
                    color: (context) => { return document.documentElement.classList.contains('dark') ? 'rgb(209, 213, 219)' : 'rgb(55, 65, 81)'; },
                },
                grid: {
                    color: (context) => { return document.documentElement.classList.contains('dark') ? 'rgba(75, 85, 99, 0.3)' : 'rgba(209, 213, 219, 0.5)'; },
                },
                title: {
                    display: true,
                    text: 'Number of New Users',
                    color: (context) => { return document.documentElement.classList.contains('dark') ? 'white' : 'rgb(55, 65, 81)'; },
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
                    `hsl(${i * 60}, 70%, 50%)` // Dynamic hues
                ),
                borderColor: stats.courseCompletionRates.labels.map((_, i) =>
                    `hsl(${i * 60}, 70%, 30%)`
                ),
                hoverOffset: 4,
            },
        ],
    };

    const courseCompletionOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    color: (context) => { return document.documentElement.classList.contains('dark') ? 'white' : 'rgb(55, 65, 81)'; },
                },
            },
            title: {
                display: true,
                text: 'Course Completion Rates',
                font: { size: 16 },
                color: (context) => { return document.documentElement.classList.contains('dark') ? 'white' : 'rgb(17, 24, 39)'; },
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
                titleColor: (context) => { return document.documentElement.classList.contains('dark') ? 'white' : 'black'; },
                bodyColor: (context) => { return document.documentElement.classList.contains('dark') ? 'white' : 'black'; },
            }
        }
    };


    // Dinamiskan warna latar belakang bar Chart.js untuk dark mode
    useEffect(() => {
        // Set warna default light mode untuk User Activity Chart
        let lightModeActivityBackgrounds = [
            'rgba(54, 162, 235, 0.6)', // Blue
            'rgba(255, 159, 64, 0.6)', // Orange
            'rgba(153, 102, 255, 0.6)' // Purple
        ];
        let lightModeActivityBorders = [
            'rgba(54, 162, 235, 1)',
            'rgba(255, 159, 64, 1)',
            'rgba(153, 102, 255, 1)'
        ];

        // Warna untuk dark mode (adminDark palette) untuk User Activity Chart
        let darkModeActivityBackgrounds = [
            'rgba(0, 200, 83, 0.6)',   // adminDark-accent-green dengan opacity
            'rgba(255, 206, 86, 0.6)', // Kuning, untuk kontras
            'rgba(75, 192, 192, 0.6)'  // Teal, untuk kontras
        ];
        let darkModeActivityBorders = [
            'rgba(0, 200, 83, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)'
        ];

        const updateChartColors = () => {
            const isDark = document.documentElement.classList.contains('dark');
            userActivityData.datasets[0].backgroundColor = isDark ? darkModeActivityBackgrounds : lightModeActivityBackgrounds;
            userActivityData.datasets[0].borderColor = isDark ? darkModeActivityBorders : lightModeActivityBorders;
            // Line Chart colors are set directly in its data object based on global theme detection.
            // Doughnut Chart colors are dynamically generated based on HSL.
        };

        updateChartColors(); 
        const observer = new MutationObserver(updateChartColors);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

        return () => observer.disconnect();
    }, []); 

    if (loading) {
        return (
            <div className="flex-grow h-screen flex justify-center items-center text-gray-700 text-xl dark:text-gray-300">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-700 dark:text-gray-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
        <div className="flex-grow h-[95vh] scrollbar-hide overflow-y-auto rounded-xl p-6 bg-[#F9F9FB] dark:bg-adminDark-bg-secondary">
            {/* Header Admin Page - Dihapus sesuai permintaan */}

            <div className="bg-white p-6 mb-6 rounded-xl shadow-md dark:bg-adminDark-bg-tertiary dark:shadow-none">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 dark:text-white">User Statistics Overview</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Card: Total Users */}
                    <div className="bg-blue-50 p-6 rounded-lg flex items-center space-x-4 shadow-sm dark:bg-adminDark-bg-secondary dark:shadow-none">
                        <div className="p-3 bg-blue-200 rounded-full dark:bg-gray-800 dark:bg-opacity-50">
                            <UsersIcon className="h-8 w-8 text-blue-700 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-xl font-semibold text-gray-800 dark:text-white">{stats.totalUsers}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">Total Users</p>
                        </div>
                    </div>

                    {/* Card: Admin Users */}
                    <div className="bg-purple-50 p-6 rounded-lg flex items-center space-x-4 shadow-sm dark:bg-adminDark-bg-secondary dark:shadow-none">
                        <div className="p-3 bg-purple-200 rounded-full dark:bg-gray-800 dark:bg-opacity-50">
                            <UsersIcon className="h-8 w-8 text-purple-700 dark:text-purple-400" />
                        </div>
                        <div>
                            <p className="text-xl font-semibold text-gray-800 dark:text-white">{stats.adminUsers}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">Admin Users</p>
                        </div>
                    </div>

                    {/* Card: Student Users */}
                    <div className="bg-green-50 p-6 rounded-lg flex items-center space-x-4 shadow-sm dark:bg-adminDark-bg-secondary dark:shadow-none">
                        <div className="p-3 bg-green-200 rounded-full dark:bg-gray-800 dark:bg-opacity-50">
                            <UsersIcon className="h-8 w-8 text-green-700 dark:text-green-400" />
                        </div>
                        <div>
                            <p className="text-xl font-semibold text-gray-800 dark:text-white">{stats.studentUsers}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">Student Users</p>
                        </div>
                    </div>

                    {/* Card: New Registrations Today */}
                    <div className="bg-yellow-50 p-6 rounded-lg flex items-center space-x-4 shadow-sm dark:bg-adminDark-bg-secondary dark:shadow-none">
                        <div className="p-3 bg-yellow-200 rounded-full dark:bg-gray-800 dark:bg-opacity-50">
                            <UserPlusIcon className="h-8 w-8 text-yellow-700 dark:text-yellow-400" />
                        </div>
                        <div>
                            <p className="text-xl font-semibold text-gray-800 dark:text-white">{stats.newRegistrationsToday}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">New Registrations Today</p>
                        </div>
                    </div>

                    {/* Card: Total Course Completions */}
                    <div className="bg-teal-50 p-6 rounded-lg flex items-center space-x-4 shadow-sm dark:bg-adminDark-bg-secondary dark:shadow-none">
                        <div className="p-3 bg-teal-200 rounded-full dark:bg-gray-800 dark:bg-opacity-50">
                            <ClipboardDocumentCheckIcon className="h-8 w-8 text-teal-700 dark:text-teal-400" />
                        </div>
                        <div>
                            <p className="text-xl font-semibold text-gray-800 dark:text-white">{stats.totalCourseCompletions}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">Total Course Completions</p>
                        </div>
                    </div>

                    {/* Card: Placeholder for future stats */}
                    <div className="bg-gray-50 p-6 rounded-lg flex items-center space-x-4 shadow-sm dark:bg-adminDark-bg-secondary dark:shadow-none">
                        <div className="p-3 bg-gray-200 rounded-full dark:bg-gray-800 dark:bg-opacity-50">
                            <ChartBarIcon className="h-8 w-8 text-gray-700 dark:text-gray-400" />
                        </div>
                        <div>
                            <p className="text-xl font-semibold text-gray-800 dark:text-white">...</p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">Other Stats</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bagian Laporan Grafis atau Detail */}
            <div className="bg-white p-6 rounded-xl shadow-md dark:bg-adminDark-bg-tertiary dark:shadow-none">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 dark:text-white">Detailed Reports & Charts</h2>
                
                {/* Bar Chart: User Activity Overview */}
                <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                    <Bar data={userActivityData} options={userActivityOptions} />
                </div>

                {/* <--- Line Chart: User Growth Over Time (Placeholder diganti) */}
                <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                    <Line data={userGrowthData} options={userGrowthOptions} />
                </div>

                {/* <--- Doughnut Chart: Course Completion Rates (Placeholder diganti) */}
                <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                    <Doughnut data={courseCompletionData} options={courseCompletionOptions} />
                </div>
            </div>
        </div>
    );
}