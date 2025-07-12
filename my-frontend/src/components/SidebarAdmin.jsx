import { Link, useLocation } from 'react-router-dom';

export default function Sidebar() {
  const location = useLocation();
  //const [activeMenu, setActiveMenu] = useState(''); 

  const handleItemClick = (path) => {
  };

  return (
    <div className="w-64 bg-emerald-800 text-white flex flex-col p-4 shadow-lg"> {/* MODIFIKASI DISINI */}
      <div className="text-2xl font-bold my-8 text-center">
        Tech Edify
      </div>
      <nav className="flex-1">
        <ul>
          {/* Dashboard */}
          <li className="mb-2">
            <Link
              to="/admin/dashboard"
              onClick={() => handleItemClick('/admin/dashboard')}
              className={`flex items-center p-3 rounded-lg transition-colors duration-200 ${
                location.pathname === '/admin/dashboard'
                  ? 'bg-emerald-600 text-white font-semibold' // Latar belakang item aktif: hijau sedang
                  : 'hover:bg-emerald-700 text-gray-200' // Latar belakang hover: hijau sedikit lebih gelap, warna teks default
              }`}
            >
              <i className="fas fa-chart-line mr-3"></i>
              Dashboard
            </Link>
          </li>
          {/* Manage Users */}
          <li className="mb-2">
            <Link
              to="/admin/users"
              onClick={() => handleItemClick('/admin/users')}
              className={`flex items-center p-3 rounded-lg transition-colors duration-200 ${
                location.pathname === '/admin/users'
                  ? 'bg-emerald-600 text-white font-semibold'
                  : 'hover:bg-emerald-700 text-gray-200'
              }`}
            >
              <i className="fas fa-users mr-3"></i>
              Manage Users
            </Link>
          </li>
          {/* Manage Materials */}
          <li className="mb-2">
            <Link
              to="/admin/materials"
              onClick={() => handleItemClick('/admin/materials')}
              className={`flex items-center p-3 rounded-lg transition-colors duration-200 ${
                location.pathname === '/admin/materials'
                  ? 'bg-emerald-600 text-white font-semibold'
                  : 'hover:bg-emerald-700 text-gray-200'
              }`}
            >
              <i className="fas fa-book-open mr-3"></i>
              Manage Materials
            </Link>
          </li>
          {/* Manage Modules */}
          <li className="mb-2">
            <Link
              to="/admin/modules"
              onClick={() => handleItemClick('/admin/modules')}
              className={`flex items-center p-3 rounded-lg transition-colors duration-200 ${
                location.pathname === '/admin/modules'
                  ? 'bg-emerald-600 text-white font-semibold'
                  : 'hover:bg-emerald-700 text-gray-200'
              }`}
            >
              <i className="fas fa-cube mr-3"></i>
              Manage Modules
            </Link>
          </li>
          {/* Manage Lessons */}
          <li className="mb-2">
            <Link
              to="/admin/lessons"
              onClick={() => handleItemClick('/admin/lessons')}
              className={`flex items-center p-3 rounded-lg transition-colors duration-200 ${
                location.pathname === '/admin/lessons'
                  ? 'bg-emerald-600 text-white font-semibold'
                  : 'hover:bg-emerald-700 text-gray-200'
              }`}
            >
              <i className="fas fa-file-alt mr-3"></i>
              Manage Lessons
            </Link>
          </li>
          {/* Manage Quizzes */}
          <li className="mb-2">
            <Link
              to="/admin/quizzes"
              onClick={() => handleItemClick('/admin/quizzes')}
              className={`flex items-center p-3 rounded-lg transition-colors duration-200 ${
                location.pathname === '/admin/quizzes'
                  ? 'bg-emerald-600 text-white font-semibold'
                  : 'hover:bg-emerald-700 text-gray-200'
              }`}
            >
              <i className="fas fa-question-circle mr-3"></i>
              Manage Quizzes
            </Link>
          </li>
          {/* User Stats */}
          <li className="mb-2">
            <Link
              to="/admin/statistics"
              onClick={() => handleItemClick('/admin/statistics')}
              className={`flex items-center p-3 rounded-lg transition-colors duration-200 ${
                location.pathname === '/admin/statistics'
                  ? 'bg-emerald-600 text-white font-semibold'
                  : 'hover:bg-emerald-700 text-gray-200'
              }`}
            >
              <i className="fas fa-chart-pie mr-3"></i>
              User Stats
            </Link>
          </li>
        </ul>
      </nav>
      {/* Mengubah warna border footer sidebar menjadi emerald-700 */}
      <div className="mt-auto pt-4 border-t border-emerald-700 text-center text-gray-300 text-sm"> {/* MODIFIKASI DISINI */}
        © 2025 Tech Edify
      </div>
    </div>
  );
}