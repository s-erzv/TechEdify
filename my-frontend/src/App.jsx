import { Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard'; 
import { AdminGuard } from './components/AdminGuard';
import AuthGuard from './components/AuthGuard';
import AdminLayout from './components/AdminLayout';
import AdminDashboard from './pages/admin/Dashboard';
import Users from './pages/admin/Users';
import Materials from './pages/admin/Materials';
import Modules from './pages/admin/Modules';
import Lessons from './pages/admin/Lessons';
import Quizzes from './pages/admin/Quizzes';
import Statistics from './pages/admin/Statistics';


function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/Auth" element={<Auth />} />

      <Route path="/Dashboard" element={
        <AuthGuard>
          <Dashboard />
        </AuthGuard>
      } />

      <Route path="/admin" element={
        <AdminGuard>
          <AdminLayout />
        </AdminGuard>
      }>
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users" element={<Users />} />
        <Route path="materials" element={<Materials />} />
        <Route path="modules" element={<Modules />} />
        <Route path="lessons" element={<Lessons />} />
        <Route path="quizzes" element={<Quizzes />} />
        <Route path="statistics" element={<Statistics />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;