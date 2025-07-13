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
import QuizPage from './pages/QuizPage'; 
import QuizListPage from './pages/QuizListPage';
import LeaderboardPage from './pages/LeaderboardPage'; 
import DiscussionListPage from './pages/DiscussionListPage'; 
import DiscussionDetailPage from './pages/DiscussionDetailPage';
import CreateDiscussionPage from './pages/CreateDiscussionPage'; 
import HistoryPage from './pages/HistoryPage'; 
import BookmarkPage from './pages/BookmarkPage';
import SettingsPage from './pages/SettingsPage'; 

import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider> 
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

          <Route path="/course/:courseId" element={
            <AuthGuard>
              <CourseDetailsPage />
            </AuthGuard>
          } />

          <Route path="/course/:courseId/lesson/:lessonId" element={
            <AuthGuard>
              <LessonViewerPage />
            </AuthGuard>
          } />

          <Route path="/quiz/:quizId" element={
            <AuthGuard>
              <QuizPage />
            </AuthGuard>
          } />

          <Route path="/quizzes" element={
            <AuthGuard>
              <QuizListPage />
            </AuthGuard>
          } />

          <Route path="/leaderboard" element={
            <AuthGuard>
              <LeaderboardPage /> 
            </AuthGuard>
          } />

           {/* Rute baru untuk Diskusi */}
          <Route path="/discussions" element={
            <AuthGuard>
              <DiscussionListPage /> 
            </AuthGuard>
          } />
          <Route path="/discussions/:discussionId" element={
            <AuthGuard>
              <DiscussionDetailPage /> 
            </AuthGuard>
          } />

          <Route path="/discussions/new" element={
            <AuthGuard>
              <CreateDiscussionPage /> 
            </AuthGuard>
          } />

          <Route path="/history" element={
            <AuthGuard>
              <HistoryPage /> 
            </AuthGuard>
          } />

          <Route path="/bookmarks" element={
            <AuthGuard>
              <BookmarkPage /> 
            </AuthGuard>
          } />

          <Route path="/settings" element={
            <AuthGuard>
              <SettingsPage /> 
            </AuthGuard>
          } />

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

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    </AuthProvider>
  );
}

export default App;