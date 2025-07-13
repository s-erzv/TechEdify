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
import MainLayout from './components/mainLayout'; 

function App() {
  return (
    <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/Auth" element={<Auth />} />

          <Route element={<AuthGuard><MainLayout /></AuthGuard>}> 
            <Route path="/Dashboard" element={<Dashboard />} />
            <Route path="/material" element={<MaterialsPage />} />
            <Route path="/course/:courseId" element={<CourseDetailsPage />} />
            <Route path="/course/:courseId/lesson/:lessonId" element={<LessonViewerPage />} />
            <Route path="/quiz/:quizId" element={<QuizPage />} />
            <Route path="/quizzes" element={<QuizListPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/discussions" element={<DiscussionListPage />} />
            <Route path="/discussions/:discussionId" element={<DiscussionDetailPage />} />
            <Route path="/discussions/new" element={<CreateDiscussionPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/bookmarks" element={<BookmarkPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>

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