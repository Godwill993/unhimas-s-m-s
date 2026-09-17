import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';

import { Login } from './pages/Login';
import { PublicCheckResults } from './pages/public/CheckResults';

import { AdminDashboard } from './pages/admin/Dashboard';
import { AdminUsers } from './pages/admin/Users';
import { AdminClasses } from './pages/admin/Classes';
import { AdminStudents } from './pages/admin/Students';
import { AdminReports } from './pages/admin/Reports';

import { TeacherMyClasses } from './pages/teacher/MyClasses';
import { TeacherScoreEntry } from './pages/teacher/ScoreEntry';
import { TeacherAttendance } from './pages/teacher/Attendance';

import { DisciplineStudentSearch } from './pages/discipline/StudentSearch';
import { DisciplineLogIncident } from './pages/discipline/LogIncident';
import { DisciplineHistory } from './pages/discipline/History';

import { ProtectedRoute } from './components/layout/ProtectedRoute';

export function App() {
  return (
    <AuthProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#0f172a',
            color: '#f8fafc',
            border: '1px solid #334155',
          },
        }}
      />
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/check-results" element={<PublicCheckResults />} />

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminUsers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/classes"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminClasses />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/students"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminStudents />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminReports />
            </ProtectedRoute>
          }
        />

        {/* Teacher Routes */}
        <Route
          path="/teacher"
          element={
            <ProtectedRoute allowedRoles={['teacher', 'admin']}>
              <TeacherMyClasses />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/scores"
          element={
            <ProtectedRoute allowedRoles={['teacher', 'admin']}>
              <TeacherScoreEntry />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/attendance"
          element={
            <ProtectedRoute allowedRoles={['teacher', 'admin']}>
              <TeacherAttendance />
            </ProtectedRoute>
          }
        />

        {/* Discipline Routes */}
        <Route
          path="/discipline"
          element={
            <ProtectedRoute allowedRoles={['discipline', 'admin']}>
              <DisciplineStudentSearch />
            </ProtectedRoute>
          }
        />
        <Route
          path="/discipline/log"
          element={
            <ProtectedRoute allowedRoles={['discipline', 'admin']}>
              <DisciplineLogIncident />
            </ProtectedRoute>
          }
        />
        <Route
          path="/discipline/history"
          element={
            <ProtectedRoute allowedRoles={['discipline', 'admin']}>
              <DisciplineHistory />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/check-results" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
