// frontend/src/pages/admin/Statistics.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient'; // Pastikan path ini benar
import AdminLayout from '../../components/AdminLayout'; // Jika Anda menggunakan AdminLayout di sini
import {
    UsersIcon,
    UserPlusIcon,
    ClipboardDocumentCheckIcon, // Untuk Course Completions
    ChartBarIcon, // Untuk statistik umum
    BellIcon, // Untuk header
    ChevronDownIcon, // Untuk header
} from '@heroicons/react/24/outline'; // Pastikan semua ikon diimpor

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
    ArcElement // ArcElement juga dibutuhkan jika nanti Anda ingin Pie Chart
} from 'chart.js';

// Mendaftarkan komponen Chart.js yang diperlukan
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement // Daftar ArcElement agar siap untuk Pie Chart juga
);


export default function AdminStatistics() {
    const [stats, setStats] = useState({
        totalUsers: 0,
        adminUsers: 0,
        studentUsers: 0,
        newRegistrationsToday: 0,
        totalCourseCompletions: 0,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Data dummy admin user untuk header (ini harusnya dari AuthContext Anda)
    const adminUser = {
        user_metadata: {
            first_name: "Admin",
            avatar_url: "/default-avatar.jpg"
        },
        email: "techedifysma@gmail.com"
    };
    const adminUserName = adminUser?.user_metadata?.first_name || adminUser?.email?.split('@')[0] || 'Admin';

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
            today.setHours(0, 0, 0, 0); // Set to start of today
            const tomorrow = new Date(today);
            tomorrow.setDate(today.getDate() + 1); // Set to start of tomorrow

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

            setStats({
                totalUsers: totalUsersCount || 0,
                adminUsers: adminUsersCount || 0,
                studentUsers: studentUsersCount || 0,
                newRegistrationsToday: newRegCount || 0,
                totalCourseCompletions: completedCoursesCount || 0,
            });

        } catch (err) {
            console.error('Error fetching user stats:', err.message);
            setError('Gagal memuat statistik pengguna: ' + err.message);
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
                backgroundColor: [
                    'rgba(139, 92, 246, 0.6)', // Purple
                    'rgba(34, 197, 94, 0.6)'  // Green
                ],
                borderColor: [
                    'rgba(139, 92, 246, 1)',
                    'rgba(34, 197, 94, 1)'
                ],
                borderWidth: 1,
            },
        ],
    };

    const userRoleOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'User Distribution by Role',
                font: {
                    size: 16
                }
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Number of Users'
                }
            }
        }
    };


    if (loading) {
        return (
            <div className="flex-grow h-screen flex justify-center items-center text-gray-700 text-xl">
                <i className="fas fa-spinner fa-spin mr-2"></i> Memuat statistik...
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex-grow h-screen flex justify-center items-center text-red-600 text-xl">
                <i className="fas fa-exclamation-triangle mr-2"></i> Error: {error}
            </div>
        );
    }

    return (
        <div className="flex-grow h-[95vh] scrollbar-hide overflow-y-auto rounded-xl p-6 bg-[#F9F9FB]">
            <header className="sticky top-0 z-10 bg-[#F9F9FB] flex justify-between items-center p-6 mb-6 shadow-sm rounded-xl">
                <h1 className="text-3xl font-bold text-gray-900">Hi, {adminUserName}!</h1>
                <div className="flex items-center space-x-4">
                    <div className="relative">
                        <BellIcon className="h-6 w-6 text-gray-600 cursor-pointer" />
                        <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <img
                            className="h-10 w-10 rounded-full object-cover"
                            src={adminUser?.user_metadata?.avatar_url || '/default-avatar.jpg'}
                            alt="Admin Avatar"
                        />
                        <ChevronDownIcon className="h-5 w-5 text-gray-500 cursor-pointer" />
                    </div>
                </div>
            </header>

            <div className="bg-white p-6 mb-6 rounded-xl shadow-md">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">User Statistics Overview</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Card: Total Users */}
                    <div className="bg-blue-50 p-6 rounded-lg flex items-center space-x-4 shadow-sm">
                        <div className="p-3 bg-blue-200 rounded-full">
                            <UsersIcon className="h-8 w-8 text-blue-700" />
                        </div>
                        <div>
                            <p className="text-xl font-semibold text-gray-800">{stats.totalUsers}</p>
                            <p className="text-sm text-gray-600">Total Users</p>
                        </div>
                    </div>

                    {/* Card: Admin Users */}
                    <div className="bg-purple-50 p-6 rounded-lg flex items-center space-x-4 shadow-sm">
                        <div className="p-3 bg-purple-200 rounded-full">
                            <UsersIcon className="h-8 w-8 text-purple-700" />
                        </div>
                        <div>
                            <p className="text-xl font-semibold text-gray-800">{stats.adminUsers}</p>
                            <p className="text-sm text-gray-600">Admin Users</p>
                        </div>
                    </div>

                    {/* Card: Student Users */}
                    <div className="bg-green-50 p-6 rounded-lg flex items-center space-x-4 shadow-sm">
                        <div className="p-3 bg-green-200 rounded-full">
                            <UsersIcon className="h-8 w-8 text-green-700" />
                        </div>
                        <div>
                            <p className="text-xl font-semibold text-gray-800">{stats.studentUsers}</p>
                            <p className="text-sm text-gray-600">Student Users</p>
                        </div>
                    </div>

                    {/* Card: New Registrations Today */}
                    <div className="bg-yellow-50 p-6 rounded-lg flex items-center space-x-4 shadow-sm">
                        <div className="p-3 bg-yellow-200 rounded-full">
                            <UserPlusIcon className="h-8 w-8 text-yellow-700" />
                        </div>
                        <div>
                            <p className="text-xl font-semibold text-gray-800">{stats.newRegistrationsToday}</p>
                            <p className="text-sm text-gray-600">New Registrations Today</p>
                        </div>
                    </div>

                    {/* Card: Total Course Completions */}
                    <div className="bg-teal-50 p-6 rounded-lg flex items-center space-x-4 shadow-sm">
                        <div className="p-3 bg-teal-200 rounded-full">
                            <ClipboardDocumentCheckIcon className="h-8 w-8 text-teal-700" />
                        </div>
                        <div>
                            <p className="text-xl font-semibold text-gray-800">{stats.totalCourseCompletions}</p>
                            <p className="text-sm text-gray-600">Total Course Completions</p>
                        </div>
                    </div>

                    {/* Card: Placeholder for future stats */}
                    <div className="bg-gray-50 p-6 rounded-lg flex items-center space-x-4 shadow-sm">
                        <div className="p-3 bg-gray-200 rounded-full">
                            <ChartBarIcon className="h-8 w-8 text-gray-700" />
                        </div>
                        <div>
                            <p className="text-xl font-semibold text-gray-800">...</p>
                            <p className="text-sm text-gray-600">Other Stats</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bagian Laporan Grafis atau Detail */}
            <div className="bg-white p-6 rounded-xl shadow-md">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Detailed Reports & Charts</h2>
                
                {/* Bar Chart: User Distribution by Role */}
                <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <Bar data={userRoleData} options={userRoleOptions} />
                </div>

                {/* Placeholder untuk chart components lainnya */}
                <div className="mt-4 p-4 border border-gray-200 rounded-lg h-64 flex items-center justify-center text-gray-500">
                    [Chart Placeholder - e.g., User Growth Over Time]
                </div>
                <div className="mt-4 p-4 border border-gray-200 rounded-lg h-64 flex items-center justify-center text-gray-500">
                    [Chart Placeholder - e.g., Course Completion Rates]
                </div>
            </div>
        </div>
    );
}