import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  GraduationCap,
  FileText,
  CheckSquare,
  DollarSign,
  Award,
  Calendar,
  ExternalLink,
  Shield,
  FolderDown,
  CreditCard,
  AlertCircle,
} from 'lucide-react';

interface SidebarProps {
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onCloseMobile }) => {
  const { user } = useAuth();
  if (!user) return null;

  const adminNav = [
    { label: 'Admin Overview', to: '/admin', icon: LayoutDashboard },
    { label: 'Academic Structure', to: '/admin/academic', icon: BookOpen },
    { label: 'Student Registration', to: '/admin/students', icon: GraduationCap },
    { label: 'Lecturer Assignments', to: '/admin/lecturers', icon: Users },
    { label: 'Grades & Transcripts', to: '/admin/reports', icon: Award },
    { label: 'Audit Trail', to: '/admin/audit', icon: Shield },
  ];

  const lecturerNav = [
    { label: 'Assigned Courses', to: '/lecturer', icon: BookOpen },
    { label: 'Score Entry (CA + Exam)', to: '/lecturer/scores', icon: CheckSquare },
    { label: 'Attendance Tracking', to: '/lecturer/attendance', icon: Calendar },
    { label: 'Course Resources', to: '/lecturer/resources', icon: FileText },
  ];

  const studentNav = [
    { label: 'Student Portal', to: '/student', icon: LayoutDashboard },
    { label: 'Course Registration', to: '/student/courses', icon: BookOpen },
    { label: 'My Grades & CGPA', to: '/student/grades', icon: Award },
    { label: 'My Attendance', to: '/student/attendance', icon: Calendar },
    { label: 'Tuition Fees & Invoices', to: '/student/finance', icon: DollarSign },
    { label: 'Past Papers & Resources', to: '/student/resources', icon: FolderDown },
  ];

  const financeNav = [
    { label: 'Finance Dashboard', to: '/finance', icon: LayoutDashboard },
    { label: 'Fee Structures', to: '/finance/fee-structures', icon: DollarSign },
    { label: 'Invoices & Billing', to: '/finance/invoices', icon: CreditCard },
    { label: 'Record Payments', to: '/finance/payments', icon: CheckSquare },
    { label: 'Defaulter Reports', to: '/finance/defaulters', icon: AlertCircle },
  ];

  let navItems = studentNav;
  if (user.role === 'admin') navItems = adminNav;
  else if (user.role === 'lecturer') navItems = lecturerNav;
  else if (user.role === 'finance') navItems = financeNav;

  return (
    <aside className="w-64 bg-white dark:bg-slate-950 border-r border-slate-200/80 dark:border-slate-800/80 flex flex-col justify-between min-h-[calc(100vh-64px)] transition-colors">
      <div className="p-4 space-y-1.5">
        <div className="px-3 py-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            {user.role} Navigation
          </p>
          {user.matricule && (
            <p className="text-xs font-mono font-semibold text-blue-600 dark:text-blue-400 mt-0.5">
              {user.matricule}
            </p>
          )}
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={
                  item.to === '/admin' ||
                  item.to === '/lecturer' ||
                  item.to === '/student' ||
                  item.to === '/finance'
                }
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 group ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/80 dark:hover:bg-slate-900/80'
                  }`
                }
              >
                <Icon className="w-4 h-4 transition-transform group-hover:scale-110" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-slate-100 dark:border-slate-900 space-y-2">
        <a
          href="/check-results"
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
        >
          <span>Public Results Verification</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>

        <div className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 text-[10px] text-slate-400">
          <p className="font-semibold text-slate-600 dark:text-slate-300">UNHIMAS ERP v2.0</p>
          <p>Cameroon Bilingual System</p>
        </div>
      </div>
    </aside>
  );
};
