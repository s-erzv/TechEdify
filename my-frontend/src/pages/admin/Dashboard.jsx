import { useState, useEffect, useContext } from 'react'; // Tambahkan useContext
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient'; // Pastikan path ini benar
import AdminLayout from '../../components/AdminLayout';
import { AuthContext } from '../../context/AuthContext'; // Import AuthContext

import {
  MagnifyingGlassIcon,
  BellIcon,
  ChevronDownIcon,
  UsersIcon,
  CubeIcon, // Untuk Modul Aktif (sesuai schema courses.is_published atau modules.is_active)
  UserPlusIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  ClockIcon,
  BookOpenIcon,
  PlusCircleIcon
} from '@heroicons/react/24/outline';


export default function AdminDashboard() {
  const { logout } = useContext(AuthContext); // Gunakan useContext untuk mendapatkan fungsi logout

  const [dashboardStats, setDashboardStats] = useState({
    totalUsers: 0,
    activeModules: 0, // Akan diisi dari database
    newRegistrationsToday: 0, // Akan diisi dari database
    pendingTasks: 0, // Masih hardcode atau dari tabel tasks jika ada
  });

  const [recentActivities, setRecentActivities] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [errorStats, setErrorStats] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoadingStats(true);
      setErrorStats(null);
      try {
        // 1. Ambil Total Pengguna dari 'profiles'
        const { count: totalUsersCount, error: usersError } = await supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true });

        if (usersError) throw usersError;

        // 2. Ambil Modul Aktif dari 'modules'
        // Ini akan berfungsi jika Anda sudah menambahkan kolom 'is_active' (boolean) ke tabel 'modules'
        const { count: activeModulesCount, error: modulesError } = await supabase
          .from('modules')
          .select('id', { count: 'exact', head: true })
          .eq('is_active', true); // QUERY INI SEKARANG HARUSNYA BERHASIL!

        if (modulesError) throw modulesError;

        // 3. Ambil Pendaftaran Baru Hari Ini dari 'profiles'
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set to start of today
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1); // Set to start of tomorrow

        const { count: newRegCount, error: regError } = await supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', today.toISOString())
          .lt('created_at', tomorrow.toISOString());

        if (regError) throw regError;

        // 4. Ambil Tugas Tertunda (Simulasi, karena tidak ada tabel 'tasks' di skema yang diberikan)
        // Jika Anda ingin ini dinamis, Anda perlu tabel terpisah untuk 'tasks' admin.
        const pendingTasksCount = 3; // Tetap hardcode untuk saat ini


        setDashboardStats({
          totalUsers: totalUsersCount || 0,
          activeModules: activeModulesCount || 0, // Menggunakan data dari Supabase
          newRegistrationsToday: newRegCount || 0, // Menggunakan data dari Supabase
          pendingTasks: pendingTasksCount,
        });

        // 5. Ambil Aktivitas Terbaru (Jika Anda punya tabel 'activities' atau custom logs)
        // Menggunakan data simulasi untuk sekarang. Anda bisa mengaktifkan bagian ini
        // jika Anda membuat tabel 'activities' untuk log peristiwa.
        /*
        const { data: fetchedActivities, error: activitiesError } = await supabase
            .from('activities') // Pastikan tabel ini ada dan berisi data log
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5);

        if (activitiesError) throw activitiesError;

        const mappedActivities = fetchedActivities.map(activity => ({
            id: activity.id,
            type: activity.type.replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
            description: activity.description,
            time: new Date(activity.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }),
            icon: activity.type === 'user_registered' ? UserPlusIcon :
                  activity.type === 'module_updated' ? BookOpenIcon :
                  activity.type === 'lesson_added' ? PlusCircleIcon :
                  activity.type === 'user_login' ? UsersIcon :
                  ClipboardDocumentListIcon, // default icon
            iconColor: activity.type === 'user_registered' ? 'text-green-500' :
                       activity.type === 'module_updated' ? 'text-blue-500' :
                       activity.type === 'lesson_added' ? 'text-purple-500' :
                       activity.type === 'user_login' ? 'text-indigo-500' :
                       'text-gray-500',
        }));
        setRecentActivities(mappedActivities);
        */

        // Simulasi aktivitas terbaru jika tabel 'activities' belum ada
        setRecentActivities([
          { id: 1, type: 'User Registered', description: 'John Doe baru saja mendaftar.', time: '2 jam lalu', icon: UserPlusIcon, iconColor: 'text-green-500' },
          { id: 2, type: 'Module Updated', description: 'Modul "Pengembangan Web" diperbarui.', time: 'Kemarin', icon: BookOpenIcon, iconColor: 'text-blue-500' },
          { id: 3, type: 'Lesson Added', description: 'Pelajaran "React Hooks" ditambahkan.', time: '3 hari lalu', icon: PlusCircleIcon, iconColor: 'text-purple-500' },
          { id: 4, type: 'User Login', description: 'Jane Smith login ke sistem.', time: '1 jam lalu', icon: UsersIcon, iconColor: 'text-indigo-500' },
          { id: 5, type: 'Quiz Completed', description: 'Ali menyelesaikan kuis "Basis Data".', time: '4 jam lalu', icon: ClipboardDocumentListIcon, iconColor: 'text-yellow-500' },
        ]);

      } catch (error) {
        console.error('Error fetching dashboard data:', error.message);
        setErrorStats('Gagal memuat data dashboard: ' + error.message);
        setDashboardStats({ totalUsers: 0, activeModules: 0, newRegistrationsToday: 0, pendingTasks: 0 });
      } finally {
        setLoadingStats(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Placeholder for user data (replace with actual admin user data)
  // Ini bisa diambil dari user Supabase yang sedang login jika admin juga login via Supabase Auth
  const adminUser = {
    user_metadata: {
      first_name: "Admin",
      avatar_url: "/default-admin-avatar.jpg" // Pastikan gambar ini ada di folder public Anda
    },
    email: "admin@example.com"
  };

  const adminUserName = adminUser?.user_metadata?.first_name || adminUser?.email?.split('@')[0] || 'Admin';

  if (loadingStats) {
    return (
      <div className="flex-grow flex justify-center items-center text-gray-500 text-lg">
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Memuat data dashboard...
        </div>
    );
  }

  if (errorStats) {
    return (
      <div className="flex-grow flex justify-center items-center text-red-600 text-lg">
          <svg className="h-6 w-6 mr-2 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          Error: {errorStats}
        </div>
    );
  }

  return (
    <div className="flex-grow h-[95vh] scrollbar-hide overflow-y-auto p-6 bg-[#F9F9FB] rounded-xl">
        {/* Header - Mimicking the user dashboard header */}
        <header className="flex justify-between items-center bg-white p-6 rounded-xl shadow-md mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Hi, {adminUserName}!</h1>

          <div className="flex items-center space-x-4">
            {/* Search Bar */}
            <div className="relative">
              <input
                type="text"
                placeholder="search"
                className="py-2 pl-10 pr-4 rounded-full bg-gray-100 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-200"
              />
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>

            {/* Notification */}
            <div className="relative">
              <BellIcon className="h-6 w-6 text-gray-600 cursor-pointer" />
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
            </div>

            {/* User Profile and Logout Button */}
            <div className="flex items-center space-x-2">
              <img
                src={adminUser?.user_metadata?.avatar_url || '/default-admin-avatar.jpg'}
                alt="Admin Avatar"
                className="h-10 w-10 rounded-full object-cover border-2 border-purple-300"
              />
              {/* Tambahkan tombol Logout di sini */}
              <button
                onClick={logout} // Panggil fungsi logout dari AuthContext
                className="bg-purple-600 text-white text-sm font-semibold py-2 px-4 rounded-full hover:bg-purple-700 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Dashboard Overview Section (Main Banner-like area for admin intro) */}
        <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white p-6 rounded-xl shadow-md flex items-center justify-between relative overflow-hidden mb-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">Admin Panel Overview</h2>
            <p className="text-sm opacity-90 mb-4">
              Selamat datang kembali, kelola aplikasi Tech Edify Anda dengan mudah!
            </p>
            <Link to="/admin/reports" className="bg-white text-purple-700 font-semibold py-2 px-6 rounded-full hover:bg-gray-100 transition-colors">
              Lihat Laporan
            </Link>
          </div>
          <ChartBarIcon className="absolute -right-4 -bottom-4 h-32 w-32 opacity-30 text-white" />
        </div>


        {/* Bagian Statistik Ringkas - Styled like the user dashboard cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Kartu Total Pengguna */}
            <div className="bg-white p-6 rounded-xl shadow-md flex flex-col items-start">
              <div className="flex justify-between items-center w-full mb-3">
                <h3 className="text-sm font-medium text-gray-600">Total Pengguna</h3>
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <UsersIcon className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{dashboardStats.totalUsers}</p>
              <p className="text-xs text-gray-500 mt-1">Jumlah total pengguna terdaftar.</p>
            </div>

            {/* Kartu Modul Aktif */}
            <div className="bg-white p-6 rounded-xl shadow-md flex flex-col items-start">
              <div className="flex justify-between items-center w-full mb-3">
                <h3 className="text-sm font-medium text-gray-600">Modul Aktif</h3>
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <CubeIcon className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{dashboardStats.activeModules}</p>
              <p className="text-xs text-gray-500 mt-1">Jumlah modul yang saat ini aktif.</p>
            </div>

            {/* Kartu Pendaftaran Baru Hari Ini */}
            <div className="bg-white p-6 rounded-xl shadow-md flex flex-col items-start">
              <div className="flex justify-between items-center w-full mb-3">
                <h3 className="text-sm font-medium text-gray-600">Pendaftaran Baru (Hari Ini)</h3>
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                  <UserPlusIcon className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{dashboardStats.newRegistrationsToday}</p>
              <p className="text-xs text-gray-500 mt-1">Pengguna baru yang mendaftar hari ini.</p>
            </div>

            {/* Kartu Tugas Tertunda */}
            <div className="bg-white p-6 rounded-xl shadow-md flex flex-col items-start">
              <div className="flex justify-between items-center w-full mb-3">
                <h3 className="text-sm font-medium text-gray-600">Tugas Tertunda</h3>
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <ClipboardDocumentListIcon className="h-6 w-6 text-red-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{dashboardStats.pendingTasks}</p>
              <p className="text-xs text-gray-500 mt-1">Tugas admin yang perlu diselesaikan.</p>
            </div>
        </div>

        {/* Bagian Aktivitas Terbaru - Styled with enhanced icons and layout */}
        <div className="bg-white p-6 rounded-xl shadow-md mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Aktivitas Terbaru</h2>
            <ul className="divide-y divide-gray-200">
            {recentActivities.map((activity) => (
                <li key={activity.id} className="py-3 flex items-center space-x-3">
                    <div className={`flex-shrink-0 ${activity.iconColor} p-2 rounded-full bg-gray-100`}>
                        <activity.icon className="h-5 w-5" />
                    </div>
                    <div className="flex-grow flex justify-between items-center">
                        <p className="text-gray-700">
                            <span className="font-medium">{activity.type}:</span> {activity.description}
                        </p>
                        <span className="text-sm text-gray-500">{activity.time}</span>
                    </div>
                </li>
            ))}
            {recentActivities.length === 0 && (
                <li className="py-3 text-center text-gray-500">Tidak ada aktivitas terbaru.</li>
            )}
            </ul>
        </div>

        {/* Bagian Tautan Cepat & Ringkasan Sistem - Side by Side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-md">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Tautan Cepat</h2>
                <ul className="space-y-3">
                    <li>
                        <Link to="/admin/users" className="flex items-center text-purple-600 hover:text-purple-800 transition-colors duration-200">
                            <UsersIcon className="h-5 w-5 mr-2" /> Kelola Pengguna
                        </Link>
                    </li>
                    <li>
                        <Link to="/admin/materials" className="flex items-center text-purple-600 hover:text-purple-800 transition-colors duration-200">
                            <BookOpenIcon className="h-5 w-5 mr-2" /> Kelola Materi
                        </Link>
                    </li>
                    <li>
                        <Link to="/admin/modules" className="flex items-center text-purple-600 hover:text-purple-800 transition-colors duration-200">
                            <CubeIcon className="h-5 w-5 mr-2" /> Kelola Modul
                        </Link>
                    </li>
                    <li>
                        <Link to="/admin/quizzes" className="flex items-center text-purple-600 hover:text-purple-800 transition-colors duration-200">
                            <ClipboardDocumentListIcon className="h-5 w-5 mr-2" /> Kelola Kuis
                        </Link>
                    </li>
                </ul>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Ringkasan Sistem</h2>
                <div className="space-y-2 text-gray-700 text-sm">
                    <p><strong>Versi Aplikasi:</strong> 1.0.0</p>
                    <p><strong>Status Server:</strong> <span className="text-green-600 font-medium">Online</span></p>
                    <p><strong>Lokasi Server:</strong> South Tangerang, Banten, Indonesia</p>
                    <p><strong>Waktu Terakhir Diperbarui:</strong> {new Date().toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })}</p>
                </div>
            </div>
        </div>
    </div>
  );
}