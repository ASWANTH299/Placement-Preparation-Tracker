import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import AdminDashboard from './components/Dashboard/AdminDashboard'
import AdminNavbar from './components/Common/AdminNavbar'
import CodingProfilesPage from './pages/CodingProfilesPage'
import ConceptLearningPage from './pages/ConceptLearningPage'
import Navbar from './components/Common/Navbar'
import CompanyQuestionsPage from './pages/CompanyQuestionsPage'
import DashboardPage from './pages/DashboardPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import LeaderboardPage from './pages/LeaderboardPage'
import LearningPathDetailPage from './pages/LearningPathDetailPage'
import LearningPathPage from './pages/LearningPathPage'
import LoginPage from './pages/LoginPage'
import MockInterviewDetailPage from './pages/MockInterviewDetailPage'
import MockInterviewsPage from './pages/MockInterviewsPage'
import NoteDetailPage from './pages/NoteDetailPage'
import NotesPage from './pages/NotesPage'
import NotFoundPage from './pages/NotFoundPage'
import ProfilePage from './pages/ProfilePage'
import PracticePage from './pages/PracticePage'
import QuestionDetailPage from './pages/QuestionDetailPage'
import RecordInterviewPage from './pages/RecordInterviewPage'
import RegisterPage from './pages/RegisterPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import ResumeTrackerPage from './pages/ResumeTrackerPage'
import ServerErrorPage from './pages/ServerErrorPage'
import SettingsPage from './pages/SettingsPage'
import UnauthorizedPage from './pages/UnauthorizedPage'
import AdminUsersPage from './pages/AdminUsersPage'
import AdminLearningPathPage from './pages/AdminLearningPathPage'
import AdminCompanyQuestionsPage from './pages/AdminCompanyQuestionsPage'

const authRoutes = ['/login', '/register', '/forgot-password', '/reset-password']
const adminRoutes = ['/admin-dashboard', '/admin-users', '/admin-learning-path', '/admin-company-questions']

function ProtectedRoute({ children }) {
  const token = useSelector((state) => state.auth.token)
  if (!token) return <Navigate to="/login" replace />
  return children
}

function AdminRoute({ children }) {
  const token = useSelector((state) => state.auth.token)
  const role = useSelector((state) => state.auth.role)

  if (!token) return <Navigate to="/login" replace />
  if (role !== 'admin') return <Navigate to="/403" replace />

  return children
}

function AppLayout() {
  const location = useLocation()
  const role = useSelector((state) => state.auth.role)
  const isAdminPath = adminRoutes.includes(location.pathname)
  const showNavbar = !authRoutes.includes(location.pathname)

  return (
    <div className="min-h-screen text-slate-800">
      <div className="app-animated-bg" aria-hidden="true" />
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-blue-700">
        Skip to main content
      </a>
      {showNavbar && (isAdminPath || role === 'admin' ? <AdminNavbar /> : <Navbar />)}
      <main id="main-content" className={showNavbar ? 'fade-rise relative z-10 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8' : 'fade-rise relative z-10'}>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/learning-path" element={<ProtectedRoute><LearningPathPage /></ProtectedRoute>} />
          <Route path="/learning-path/:topicId" element={<ProtectedRoute><LearningPathDetailPage /></ProtectedRoute>} />
          <Route path="/company-questions" element={<ProtectedRoute><CompanyQuestionsPage /></ProtectedRoute>} />
          <Route path="/company-questions/:questionId" element={<ProtectedRoute><QuestionDetailPage /></ProtectedRoute>} />
          <Route path="/questions/:questionId" element={<ProtectedRoute><QuestionDetailPage /></ProtectedRoute>} />
          <Route path="/practice/:questionId" element={<ProtectedRoute><PracticePage /></ProtectedRoute>} />
          <Route path="/mock-interviews" element={<ProtectedRoute><MockInterviewsPage /></ProtectedRoute>} />
          <Route path="/mock-interviews/new" element={<ProtectedRoute><RecordInterviewPage /></ProtectedRoute>} />
          <Route path="/mock-interviews/:interviewId" element={<ProtectedRoute><MockInterviewDetailPage /></ProtectedRoute>} />
          <Route path="/resume-tracker" element={<ProtectedRoute><ResumeTrackerPage /></ProtectedRoute>} />
          <Route path="/notes" element={<ProtectedRoute><NotesPage /></ProtectedRoute>} />
          <Route path="/notes/:noteId" element={<ProtectedRoute><NoteDetailPage /></ProtectedRoute>} />
          <Route path="/leaderboard" element={<ProtectedRoute><LeaderboardPage /></ProtectedRoute>} />
          <Route path="/coding-profiles" element={<ProtectedRoute><CodingProfilesPage /></ProtectedRoute>} />
          <Route path="/concept-learning" element={<ProtectedRoute><ConceptLearningPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

          <Route path="/admin-dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin-users" element={<AdminRoute><AdminUsersPage /></AdminRoute>} />
          <Route path="/admin-learning-path" element={<AdminRoute><AdminLearningPathPage /></AdminRoute>} />
          <Route path="/admin-company-questions" element={<AdminRoute><AdminCompanyQuestionsPage /></AdminRoute>} />

          <Route path="/500" element={<ServerErrorPage />} />
          <Route path="/403" element={<UnauthorizedPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  return <AppLayout />
}
