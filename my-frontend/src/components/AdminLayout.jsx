import { Link, Outlet } from 'react-router-dom';

export default function AdminLayout() {
  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-[#071735] text-white p-6">
        <h2 className="text-2xl font-bold mb-6">Tech Edify Admin</h2>
        <nav className="space-y-4">
          <Link to="/admin/dashboard" className="block hover:text-purple-300">Dashboard</Link>
          <Link to="/admin/users" className="block hover:text-purple-300">Manage Users</Link>
          <Link to="/admin/materials" className="block hover:text-purple-300">Manage Materials</Link>
          <Link to="/admin/modules" className="block hover:text-purple-300">Manage Modules</Link>
          <Link to="/admin/lessons" className="block hover:text-purple-300">Manage Lessons</Link>
          <Link to="/admin/quizzes" className="block hover:text-purple-300">Manage Quizzes</Link>
          <Link to="/admin/statistics" className="block hover:text-purple-300">User Stats</Link>
        </nav>
      </aside>

      {/* Content */}
      <main className="flex-1 bg-gray-50 p-6">
        <Outlet />
      </main>
    </div>
  );
}