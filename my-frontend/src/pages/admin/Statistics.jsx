// frontend/src/pages/admin/Statistics.jsx
import React, { useState, useEffect, useContext } from 'react';
import { supabase } from '../../lib/supabaseClient'; 
// import AdminLayout from '../../components/AdminLayout'; // Hapus import ini
// import { AuthContext } from '../../context/AuthContext'; // Tidak digunakan jika header dihapus
import {
    UsersIcon,
    UserPlusIcon,
    ClipboardDocumentCheckIcon, 
    ChartBarIcon, 
    BellIcon, // Tidak digunakan jika header dihapus
    ChevronDownIcon, // Tidak digunakan jika header dihapus
} from '@heroicons/react/24/outline'; 

// Import Chart.js dan komponen dari react-chartjs-2
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement 
} from 'chart.js';

// Mendaftarkan komponen Chart.js yang diperlukan
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement 
);


export default function AdminStatistics() {
    // Jika header admin dihapus, user dan profile dari AuthContext tidak diperlukan di sini
    // const { user, profile } = useContext(AuthContext); 
    // const adminUserName = profile?.username || profile?.full_name || user?.email?.split('@')[0] || 'Admin';
    // const adminAvatarUrl = profile?.avatar_url || '/default-admin-avatar.jpg';

    const [stats, setStats] = useState({
        totalUsers: 0,
        adminUsers: 0,
        studentUsers: 0,
        newRegistrationsToday: 0,
        totalCourseCompletions: 0,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- Fungsi untuk Fetch Statistik Pengguna ---
    const fetchUserStats = async () => {
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
            if (completedCoursesCount) throw completedCoursesError; // Perbaikan dari completedCoursesError

            setStats({
                totalUsers: totalUsersCount || 0,
                adminUsers: adminUsersCount || 0,
                studentUsers: studentUsersCount || 0,
                newRegistrationsToday: newRegCount || 0,
                totalCourseCompletions: completedCoursesCount || 0,
            });

        } catch (err) {
            console.error('Error fetching user stats:', err.message);
            setError('Failed to load user statistics: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUserStats();
    }, []);

    // --- Data dan Opsi untuk Bar Chart (Distribusi Peran Pengguna) ---
    const userRoleData = {
        labels: ['Admin Users', 'Student Users'],
        datasets: [
            {
                label: 'Number of Users',
                data: [stats.adminUsers, stats.studentUsers],
                // Warna untuk light mode dan dark mode (menggunakan palet adminDark)
                backgroundColor: [
                    'rgba(139, 92, 246, 0.6)', // Purple for light mode
                    'rgba(34, 197, 94, 0.6)'  // Green for light mode
                ],
                borderColor: [
                    'rgba(139, 92, 246, 1)',
                    'rgba(34, 197, 94, 1)'
                ],
                // Tambahkan warna khusus untuk dark mode di sini (akan diatur via Tailwind jika di-style dengan class)
                // Jika Chart.js tidak bisa mengambil dari Tailwind, ini perlu diatur secara dinamis
                // berdasarkan isDarkMode state. Untuk demo ini, kita akan asumsikan
                // Chart.js tidak secara langsung membaca class Tailwind dark.
                // Oleh karena itu, kita akan hardcode warna dark mode di sini.
                // Jika ingin dinamis, perlu AuthContext atau context tema di sini.
            },
        ],
    };

    const userRoleOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    color: (context) => { // Mengatur warna label legend
                        // Contoh sederhana: Asumsikan dark mode jika body punya class 'dark'
                        return document.documentElement.classList.contains('dark') ? 'white' : 'rgb(55, 65, 81)'; // text-gray-700
                    },
                },
            },
            title: {
                display: true,
                text: 'User Distribution by Role',
                font: {
                    size: 16
                },
                color: (context) => { // Mengatur warna title
                    return document.documentElement.classList.contains('dark') ? 'white' : 'rgb(17, 24, 39)'; // text-gray-900
                },
            },
            tooltip: { // Sesuaikan warna tooltip jika diperlukan
                titleColor: (context) => { return document.documentElement.classList.contains('dark') ? 'white' : 'black'; },
                bodyColor: (context) => { return document.documentElement.classList.contains('dark') ? 'white' : 'black'; },
            }
        },
        scales: {
            x: {
                ticks: {
                    color: (context) => { return document.documentElement.classList.contains('dark') ? 'rgb(209, 213, 219)' : 'rgb(55, 65, 81)'; }, // text-gray-300
                },
                grid: {
                    color: (context) => { return document.documentElement.classList.contains('dark') ? 'rgba(75, 85, 99, 0.5)' : 'rgba(209, 213, 219, 0.5)'; }, // gray-600 dark:gray-700 grid lines
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
                    text: 'Number of Users',
                    color: (context) => { return document.documentElement.classList.contains('dark') ? 'white' : 'rgb(55, 65, 81)'; },
                }
            }
        }
    };

    // Dinamiskan warna latar belakang bar Chart.js untuk dark mode
    useEffect(() => {
        // Set warna default light mode
        let lightModeBackgrounds = [
            'rgba(139, 92, 246, 0.6)', // Purple
            'rgba(34, 197, 94, 0.6)'   // Green
        ];
        let lightModeBorders = [
            'rgba(139, 92, 246, 1)',
            'rgba(34, 197, 94, 1)'
        ];

        // Warna untuk dark mode (adminDark palette)
        let darkModeBackgrounds = [
            'rgba(0, 200, 83, 0.6)', // adminDark-accent-green dengan opacity
            'rgba(0, 200, 83, 0.3)'  // adminDark-accent-green yang lebih terang (atau warna lain dari palet)
        ];
        let darkModeBorders = [
            'rgba(0, 200, 83, 1)',
            'rgba(0, 200, 83, 0.8)'
        ];

        const updateChartColors = () => {
            const isDark = document.documentElement.classList.contains('dark');
            userRoleData.datasets[0].backgroundColor = isDark ? darkModeBackgrounds : lightModeBackgrounds;
            userRoleData.datasets[0].borderColor = isDark ? darkModeBorders : lightModeBorders;
            // Penting: Perlu re-render chart agar perubahan warna diaplikasikan
            // Jika chart adalah komponen terpisah, Anda mungkin perlu passing state
            // Atau, jika ini satu-satunya chart, ini bisa memicu update.
            // Tidak ada cara langsung untuk memicu update Chart.js tanpa memicu re-render React.
            // Karena userRoleData adalah object, perubahannya akan memicu re-render jika direferensikan di JSX.
        };

        updateChartColors(); // Panggil saat mount
        // Observer untuk perubahan tema
        const observer = new MutationObserver(updateChartColors);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

        return () => observer.disconnect();
    }, []); // Run once on mount

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
                
                {/* Bar Chart: User Distribution by Role */}
                <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                    <Bar data={userRoleData} options={userRoleOptions} />
                </div>

                {/* Placeholder untuk chart components lainnya */}
                <div className="mt-4 p-4 border border-gray-200 rounded-lg h-64 flex items-center justify-center text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
                    [Chart Placeholder - e.g., User Growth Over Time]
                </div>
                <div className="mt-4 p-4 border border-gray-200 rounded-lg h-64 flex items-center justify-center text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
                    [Chart Placeholder - e.g., Course Completion Rates]
                </div>
            </div>
        </div>
    );
}