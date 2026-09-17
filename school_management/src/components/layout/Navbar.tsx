import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import {
  LogOut,
  GraduationCap,
  Sun,
  Moon,
  Search,
  Menu,
  X,
  ExternalLink,
} from 'lucide-react';

interface NavbarProps {
  onToggleMobileMenu?: () => void;
  isMobileMenuOpen?: boolean;
  onOpenSearch?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleMobileMenu,
  isMobileMenuOpen,
  onOpenSearch,
}) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case 'admin':
        return 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/20';
      case 'lecturer':
        return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'student':
        return 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20';
      case 'finance':
        return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      default:
        return 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/20';
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Mobile menu button */}
          <div className="flex items-center space-x-3">
            {onToggleMobileMenu && (
              <button
                onClick={onToggleMobileMenu}
                aria-label="Toggle navigation menu"
                className="md:hidden p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}

            <div
              onClick={() => navigate(user ? `/${user.role}` : '/check-results')}
              className="flex items-center space-x-2.5 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="font-black text-lg tracking-tight text-slate-900 dark:text-slate-100">
                    UNHIMAS
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    ERP
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 -mt-0.5">
                  Bilingual University Yaoundé
                </p>
              </div>
            </div>
          </div>

          {/* Center: Search Button (Ctrl + K) */}
          <div className="hidden md:flex items-center">
            <button
              onClick={onOpenSearch}
              className="flex items-center space-x-3 px-3.5 py-1.5 rounded-xl text-xs text-slate-400 dark:text-slate-500 bg-slate-100/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors w-64 shadow-inner"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="flex-1 text-left">Search portal modules...</span>
              <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded shadow-xs">
                Ctrl K
              </kbd>
            </button>
          </div>

          {/* Right actions */}
          <div className="flex items-center space-x-2.5">
            {/* Quick search on mobile */}
            {onOpenSearch && (
              <button
                onClick={onOpenSearch}
                aria-label="Search"
                className="md:hidden p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
              >
                <Search className="w-4 h-4" />
              </button>
            )}

            {/* Dark mode toggle */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle color theme"
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all duration-200 hover:rotate-12"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600" />
              )}
            </button>

            {/* Public Results Link */}
            <button
              onClick={() => navigate('/check-results')}
              className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-amber-500 dark:hover:text-amber-400 transition-colors"
            >
              <span>Public Results</span>
              <ExternalLink className="w-3 h-3" />
            </button>

            {/* User Profile & Logout */}
            {user ? (
              <div className="flex items-center space-x-2 pl-2 border-l border-slate-200 dark:border-slate-800">
                <div className="hidden sm:block text-right">
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate max-w-[130px]">
                    {user.full_name}
                  </p>
                  <span
                    className={`inline-block text-[10px] font-semibold uppercase px-1.5 py-0.2 rounded border ${getRoleBadgeColor(
                      user.role
                    )}`}
                  >
                    {user.role}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  title="Logout"
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm hover:shadow transition-all"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
