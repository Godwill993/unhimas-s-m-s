import { Suspense, lazy } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import ToastContainer from './components/common/Toast';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import UnauthorizedPage from './pages/auth/UnauthorizedPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import DepartmentsPage from './pages/admin/DepartmentsPage';
import BatchesPage from './pages/admin/BatchesPage';
import AcademicYearsPage from './pages/admin/AcademicYearsPage';
import SemestersPage from './pages/admin/SemestersPage';
import CoursesPage from './pages/admin/CoursesPage';
import BatchCoursesPage from './pages/admin/BatchCoursesPage';
import StudentsPage from './pages/admin/StudentsPage';
import LecturersPage from './pages/admin/LecturersPage';
import StaffPage from './pages/admin/StaffPage';
import MarkApprovalPage from './pages/admin/MarkApprovalPage';
import AdminMarksPage from './pages/admin/AdminMarksPage';
import AdminAttendancePage from './pages/admin/AdminAttendancePage';
import AdminResultsPage from './pages/admin/AdminResultsPage';
import AdminTimetablePage from './pages/admin/AdminTimetablePage';
import AdminAnnouncementsPage from './pages/admin/AdminAnnouncementsPage';
import SettingsPage from './pages/admin/SettingsPage';
import AuditLogPage from './pages/admin/AuditLogPage';
import AdminProfilePage from './pages/admin/AdminProfilePage';

// Other Role Dashboards
import FrontDeskDashboard from './pages/frontdesk/FrontDeskDashboard';
import LecturerAttendancePage from './pages/frontdesk/LecturerAttendancePage';
import ShiftHistoryPage from './pages/frontdesk/ShiftHistoryPage';
import FrontDeskProfilePage from './pages/frontdesk/FrontDeskProfilePage';
import LecturerDashboard from './pages/lecturer/LecturerDashboard';
import StudentDashboard from './pages/student/StudentDashboard';

import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

/**
 * Root redirect: send authenticated users to their role-specific dashboard.
 * Unauthenticated users go to /login.
 */
function RoleRouter() {
  const { session, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="route-loading">
        <div className="spinner" />
      </div>
    );
  }

  if (!session) return <Navigate to="/login" replace />;

  switch (profile?.role) {
    case 'admin':     return <Navigate to="/admin" replace />;
    case 'frontdesk': return <Navigate to="/frontdesk" replace />;
    case 'lecturer':  return <Navigate to="/lecturer" replace />;
    case 'student':   return <Navigate to="/student" replace />;
    default:          return <Navigate to="/student" replace />;
  }
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <ToastContainer />
          <Suspense fallback={<div className="route-loading"><div className="spinner" /></div>}>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/unauthorized" element={<UnauthorizedPage />} />

              {/* Role dispatch */}
              <Route path="/" element={<RoleRouter />} />

              {/* Admin routes */}
              <Route
                path="/admin/*"
                element={
                  <ProtectedRoute roles={['admin']}>
                    <Routes>
                      <Route index element={<AdminDashboard />} />
                      <Route path="departments" element={<DepartmentsPage />} />
                      <Route path="batches" element={<BatchesPage />} />
                      <Route path="academic-years" element={<AcademicYearsPage />} />
                      <Route path="semesters" element={<SemestersPage />} />
                      <Route path="courses" element={<CoursesPage />} />
                      <Route path="batch-courses" element={<BatchCoursesPage />} />
                      <Route path="students" element={<StudentsPage />} />
                      <Route path="lecturers" element={<LecturersPage />} />
                      <Route path="staff" element={<StaffPage />} />
                      <Route path="mark-approval" element={<MarkApprovalPage />} />
                      <Route path="marks" element={<AdminMarksPage />} />
                      <Route path="attendance" element={<AdminAttendancePage />} />
                      <Route path="results" element={<AdminResultsPage />} />
                      <Route path="timetable" element={<AdminTimetablePage />} />
                      <Route path="announcements" element={<AdminAnnouncementsPage />} />
                      <Route path="settings" element={<SettingsPage />} />
                      <Route path="audit-log" element={<AuditLogPage />} />
                      <Route path="profile" element={<AdminProfilePage />} />
                    </Routes>
                  </ProtectedRoute>
                }
              />

              {/* Front Desk routes */}
              <Route
                path="/frontdesk/*"
                element={
                  <ProtectedRoute roles={['frontdesk', 'admin']}>
                    <Routes>
                      <Route index element={<FrontDeskDashboard />} />
                      <Route path="lecturer-attendance" element={<LecturerAttendancePage />} />
                      <Route path="history" element={<ShiftHistoryPage />} />
                      <Route path="profile" element={<FrontDeskProfilePage />} />
                    </Routes>
                  </ProtectedRoute>
                }
              />

              {/* Lecturer routes */}
              <Route
                path="/lecturer/*"
                element={
                  <ProtectedRoute roles={['lecturer']}>
                    <Routes>
                      <Route index element={<LecturerDashboard />} />
                    </Routes>
                  </ProtectedRoute>
                }
              />

              {/* Student routes */}
              <Route
                path="/student/*"
                element={
                  <ProtectedRoute roles={['student']}>
                    <Routes>
                      <Route index element={<StudentDashboard />} />
                    </Routes>
                  </ProtectedRoute>
                }
              />

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
