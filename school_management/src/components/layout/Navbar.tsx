import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { LogOut, User as UserIcon, School } from 'lucide-react';
import { Badge } from '../ui/Badge';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

  const roleColors: Record<string, 'success' | 'warning' | 'info'> = {
    admin: 'warning',
    teacher: 'info',
    discipline: 'success',
  };

  return (
    <header className="sticky top-0 z-30 bg-slate-900/90 border-b border-slate-800/80 backdrop-blur-md px-6 py-3 flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
          <School className="w-5 h-5 text-amber-500" />
        </div>
        <div>
          <h1 className="text-sm font-semibold text-slate-100">Cameroon Excellence Academy</h1>
          <p className="text-xs text-slate-400">School Management System</p>
        </div>
      </div>

      {user && (
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3 pl-4 border-l border-slate-800">
            <div className="p-1.5 bg-slate-800 rounded-full text-slate-300">
              <UserIcon className="w-4 h-4" />
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-slate-200">{user.full_name}</p>
              <Badge variant={roleColors[user.role] || 'neutral'} size="sm">
                {user.role.toUpperCase()}
              </Badge>
            </div>
          </div>

          <button
            onClick={logout}
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      )}
    </header>
  );
};
