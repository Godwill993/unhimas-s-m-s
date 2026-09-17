import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Layouts
const AdminLayout = () => <div className="p-4"><h1>Admin Dashboard</h1></div>;
const LecturerLayout = () => <div className="p-4"><h1>Lecturer Dashboard</h1></div>;
const StudentLayout = () => <div className="p-4"><h1>Student Dashboard</h1></div>;
const FinanceLayout = () => <div className="p-4"><h1>Finance Dashboard</h1></div>;

// Public pages
const Login = () => <div className="p-4"><h1>Login Page</h1></div>;
const PublicResults = () => <div className="p-4"><h1>Public Results Check</h1></div>;

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/results" element={<PublicResults />} />
        
        {/* Role-based routes (protected routes to be added later) */}
        <Route path="/admin/*" element={<AdminLayout />} />
        <Route path="/lecturer/*" element={<LecturerLayout />} />
        <Route path="/student/*" element={<StudentLayout />} />
        <Route path="/finance/*" element={<FinanceLayout />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
