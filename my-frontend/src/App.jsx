// src/App.jsx
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
import Courses from './pages/admin/Courses'
import MaterialsPage from './pages/Material';
import CourseDetailsPage from './pages/CourseDetailsPage';
import LessonViewerPage from './pages/LessonViewerPage';
// import CourseLayout from './components/CourseLayout'; // <--- HAPUS BARIS INI!

// Jika AuthProvider dan TextProvider ada, pastikan diimpor
import { AuthProvider } from './context/AuthContext';
// import { TextProvider } from './components/TextContext'; // Hapus ini juga jika tidak dipakai

function App() {
  return (
    <AuthProvider> {/* Pastikan AuthProvider membungkus semua Routes */}
      {/* Hapus TextProvider jika sudah tidak dipakai */}
      {/* <TextProvider> */}
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/Auth" element={<Auth />} />

          <Route path="/Dashboard" element={
            <AuthGuard>
              <Dashboard />
            </AuthGuard>
          } />

          <Route path="/material" element={
            <AuthGuard>
              <MaterialsPage />
            </AuthGuard>
          } />

          {/* Rute untuk Course Details Page */}
          <Route path="/course/:courseId" element={
            <AuthGuard>
              <CourseDetailsPage />
            </AuthGuard>
          } />

          {/* Rute untuk Lesson Viewer Page */}
          <Route path="/course/:courseId/lesson/:lessonId" element={
            <AuthGuard>
              <LessonViewerPage />
            </AuthGuard>
          } />

          {/* Rute Admin */}
          <Route path="/admin" element={
            <AdminGuard>
              <AdminLayout />
            </AdminGuard>
          }>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<Users />} />
            <Route path="courses" element={<Courses />} />
            <Route path="materials" element={<Materials />} />
            <Route path="modules" element={<Modules />} />
            <Route path="lessons" element={<Lessons />} />
            <Route path="quizzes" element={<Quizzes />} />
            <Route path="statistics" element={<Statistics />} />
          </Route>

          {/* Fallback Route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      {/* </TextProvider> */}
    </AuthProvider>
  );
}

export default App;