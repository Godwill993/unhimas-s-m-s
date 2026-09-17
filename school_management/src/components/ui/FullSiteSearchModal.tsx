import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, BookOpen, Users, DollarSign, Award, FileText, ArrowRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface FullSiteSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FullSiteSearchModal: React.FC<FullSiteSearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const searchableItems = [
    // Admin items
    { title: 'Admin Overview', path: '/admin', category: 'Admin', icon: BookOpen, role: 'admin' },
    { title: 'Faculties & Programs', path: '/admin/academic', category: 'Admin', icon: BookOpen, role: 'admin' },
    { title: 'Student Registration & Credentials', path: '/admin/students', category: 'Admin', icon: Users, role: 'admin' },
    { title: 'Lecturer Assignments', path: '/admin/lecturers', category: 'Admin', icon: Users, role: 'admin' },
    { title: 'Publish Grades & Transcripts', path: '/admin/reports', category: 'Admin', icon: Award, role: 'admin' },
    // Lecturer items
    { title: 'My Assigned Courses', path: '/lecturer', category: 'Lecturer', icon: BookOpen, role: 'lecturer' },
    { title: 'Score Entry (CA + Exam)', path: '/lecturer/scores', category: 'Lecturer', icon: Award, role: 'lecturer' },
    { title: 'Mark Attendance', path: '/lecturer/attendance', category: 'Lecturer', icon: Users, role: 'lecturer' },
    { title: 'Upload Course Resources', path: '/lecturer/resources', category: 'Lecturer', icon: FileText, role: 'lecturer' },
    // Student items
    { title: 'Student Portal Overview', path: '/student', category: 'Student', icon: BookOpen, role: 'student' },
    { title: 'Course Registration', path: '/student/courses', category: 'Student', icon: BookOpen, role: 'student' },
    { title: 'My Grades & CGPA Tracker', path: '/student/grades', category: 'Student', icon: Award, role: 'student' },
    { title: 'Attendance History', path: '/student/attendance', category: 'Student', icon: Users, role: 'student' },
    { title: 'Tuition Fees & Invoices', path: '/student/finance', category: 'Student', icon: DollarSign, role: 'student' },
    { title: 'Past Papers & Resources', path: '/student/resources', category: 'Student', icon: FileText, role: 'student' },
    // Finance items
    { title: 'Finance Dashboard', path: '/finance', category: 'Finance', icon: DollarSign, role: 'finance' },
    { title: 'Fee Structures', path: '/finance/fee-structures', category: 'Finance', icon: DollarSign, role: 'finance' },
    { title: 'Invoices & Billing', path: '/finance/invoices', category: 'Finance', icon: DollarSign, role: 'finance' },
    { title: 'Record Payment & Receipt', path: '/finance/payments', category: 'Finance', icon: DollarSign, role: 'finance' },
    { title: 'Fee Defaulters Report', path: '/finance/defaulters', category: 'Finance', icon: Users, role: 'finance' },
    // Public items
    { title: 'Public Results Check (PIN)', path: '/check-results', category: 'Public', icon: Award, role: 'all' },
  ];

  const filtered = searchableItems.filter((item) => {
    if (item.role !== 'all' && user?.role !== 'admin' && item.role !== user?.role) return false;
    if (!query) return true;
    return (
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.category.toLowerCase().includes(query.toLowerCase())
    );
  });

  const handleSelect = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Search header */}
        <div className="flex items-center px-4 py-3 border-b border-slate-200 dark:border-slate-800">
          <Search className="w-5 h-5 text-slate-400 mr-3" />
          <input
            type="text"
            placeholder="Search UNHIMAS modules, courses, reports (Esc to close)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full bg-transparent text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none text-sm"
          />
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results list */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-500">No results found for "{query}"</div>
          ) : (
            filtered.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => handleSelect(item.path)}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{item.title}</p>
                      <span className="text-xs text-slate-400">{item.category}</span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-blue-500" />
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-400 flex items-center justify-between">
          <span>Navigate with click or arrow keys</span>
          <span className="bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[10px] font-mono">
            ESC to exit
          </span>
        </div>
      </div>
    </div>
  );
};
