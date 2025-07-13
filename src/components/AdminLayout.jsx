import { Outlet } from 'react-router-dom';
import Sidebar from './SidebarAdmin';

export default function AdminLayout() {
  return (
    <div className="h-screen flex"> 
      <Sidebar />
      <main className="flex-1 p-6 bg-emerald-800 dark:bg-adminDark-bg-primary">
        <Outlet />
      </main>
    </div>
  );
}