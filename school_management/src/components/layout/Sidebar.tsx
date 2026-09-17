import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  GraduationCap,
  FileText,
  CheckSquare,
  ShieldAlert,
  Search,
  History,
  ExternalLink,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  if (!user) return null;

  const adminNav = [
    { label: 'Dashboard', to: '/admin', icon: LayoutDashboard },
    { label: 'Users', to: '/admin/users', icon: Users },
    { label: 'Classes & Subjects', to: '/admin/classes', icon: BookOpen },
    { label: 'Students', to: '/admin/students', icon: GraduationCap },
    { label: 'Report Cards', to: '/admin/reports', icon: FileText },
  ];

  const teacherNav = [
    { label: 'My Classes', to: '/teacher', icon: BookOpen },
    { label: 'Score Entry', to: '/teacher/scores', icon: CheckSquare },
    { label: 'Attendance', to: '/teacher/attendance', icon: Users },
  ];

  const disciplineNav = [
    { label: 'Search Students', to: '/discipline', icon: Search },
    { label: 'Log Incident', to: '/discipline/log', icon: ShieldAlert },
    { label: 'Discipline History', to: '/discipline/history', icon: History },
  ];

  const navItems =
    user.role === 'admin'
      ? adminNav
      : user.role === 'teacher'
      ? teacherNav
      : disciplineNav;

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800/80 flex flex-col justify-between min-h-[calc(100vh-57px)]">
      <div className="p-4 space-y-1">
        <p className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
          {user.role} Navigation
        </p>

        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/admin' || item.to === '/teacher' || item.to === '/discipline'}
              className={({ isActive }: { isActive: boolean }) =>
                `flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>

      <div className="p-4 border-t border-slate-900">
        <a
          href="/check-results"
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-400 hover:text-amber-400 transition-colors"
        >
          <span>Public Portal</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </aside>
  );
};
