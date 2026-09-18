import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';

// Public
import { Login } from './pages/Login';
import { PublicCheckResults } from './pages/public/CheckResults';

// Admin
import { AdminDashboard } from './pages/admin/Dashboard';
import { AdminUsers } from './pages/admin/Users';
import { AdminStudents } from './pages/admin/Students';
import { AdminLecturers } from './pages/admin/Lecturers';
import { AdminAcademicStructure } from './pages/admin/AcademicStructure';
import { AdminReports } from './pages/admin/Reports';
import { AdminAuditLogs } from './pages/admin/AuditLogs';

// Lecturer
import { LecturerDashboard } from './pages/lecturer/Dashboard';
import { LecturerMyCourses } from './pages/lecturer/MyCourses';
import { LecturerScoreEntry } from './pages/lecturer/ScoreEntry';
import { LecturerAttendance } from './pages/lecturer/Attendance';
import { LecturerResources } from './pages/lecturer/Resources';

// Student
import { StudentDashboard } from './pages/student/Dashboard';
import { StudentCourseRegistration } from './pages/student/CourseRegistration';
import { StudentGrades } from './pages/student/Grades';
import { StudentAttendance } from './pages/student/Attendance';
import { StudentFinance } from './pages/student/Finance';
import { StudentResources } from './pages/student/Resources';

// Finance
import { FinanceDashboard } from './pages/finance/Dashboard';
import { FinanceFeeStructures } from './pages/finance/FeeStructures';
import { FinanceInvoices } from './pages/finance/Invoices';
import { FinancePayments } from './pages/finance/Payments';
import { FinanceDefaulters } from './pages/finance/Defaulters';

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
        {/* ── Public ────────────────────────────────────────────── */}
        <Route path="/login" element={<Login />} />
        <Route path="/check-results" element={<PublicCheckResults />} />

        {/* ── Admin ─────────────────────────────────────────────── */}
        <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/academic" element={<ProtectedRoute allowedRoles={['admin']}><AdminAcademicStructure /></ProtectedRoute>} />
        <Route path="/admin/students" element={<ProtectedRoute allowedRoles={['admin']}><AdminStudents /></ProtectedRoute>} />
        <Route path="/admin/lecturers" element={<ProtectedRoute allowedRoles={['admin']}><AdminLecturers /></ProtectedRoute>} />
        <Route path="/admin/reports" element={<ProtectedRoute allowedRoles={['admin']}><AdminReports /></ProtectedRoute>} />
        <Route path="/admin/audit" element={<ProtectedRoute allowedRoles={['admin']}><AdminAuditLogs /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><AdminUsers /></ProtectedRoute>} />

        {/* ── Lecturer ──────────────────────────────────────────── */}
        <Route path="/lecturer" element={<ProtectedRoute allowedRoles={['lecturer', 'admin']}><LecturerDashboard /></ProtectedRoute>} />
        <Route path="/lecturer/courses" element={<ProtectedRoute allowedRoles={['lecturer', 'admin']}><LecturerMyCourses /></ProtectedRoute>} />
        <Route path="/lecturer/scores" element={<ProtectedRoute allowedRoles={['lecturer', 'admin']}><LecturerScoreEntry /></ProtectedRoute>} />
        <Route path="/lecturer/attendance" element={<ProtectedRoute allowedRoles={['lecturer', 'admin']}><LecturerAttendance /></ProtectedRoute>} />
        <Route path="/lecturer/resources" element={<ProtectedRoute allowedRoles={['lecturer', 'admin']}><LecturerResources /></ProtectedRoute>} />

        {/* ── Student ───────────────────────────────────────────── */}
        <Route path="/student" element={<ProtectedRoute allowedRoles={['student', 'admin']}><StudentDashboard /></ProtectedRoute>} />
        <Route path="/student/courses" element={<ProtectedRoute allowedRoles={['student', 'admin']}><StudentCourseRegistration /></ProtectedRoute>} />
        <Route path="/student/grades" element={<ProtectedRoute allowedRoles={['student', 'admin']}><StudentGrades /></ProtectedRoute>} />
        <Route path="/student/attendance" element={<ProtectedRoute allowedRoles={['student', 'admin']}><StudentAttendance /></ProtectedRoute>} />
        <Route path="/student/finance" element={<ProtectedRoute allowedRoles={['student', 'admin']}><StudentFinance /></ProtectedRoute>} />
        <Route path="/student/resources" element={<ProtectedRoute allowedRoles={['student', 'admin']}><StudentResources /></ProtectedRoute>} />

        {/* ── Finance ───────────────────────────────────────────── */}
        <Route path="/finance" element={<ProtectedRoute allowedRoles={['finance', 'admin']}><FinanceDashboard /></ProtectedRoute>} />
        <Route path="/finance/fee-structures" element={<ProtectedRoute allowedRoles={['finance', 'admin']}><FinanceFeeStructures /></ProtectedRoute>} />
        <Route path="/finance/invoices" element={<ProtectedRoute allowedRoles={['finance', 'admin']}><FinanceInvoices /></ProtectedRoute>} />
        <Route path="/finance/payments" element={<ProtectedRoute allowedRoles={['finance', 'admin']}><FinancePayments /></ProtectedRoute>} />
        <Route path="/finance/defaulters" element={<ProtectedRoute allowedRoles={['finance', 'admin']}><FinanceDefaulters /></ProtectedRoute>} />

        {/* ── Fallback ──────────────────────────────────────────── */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
