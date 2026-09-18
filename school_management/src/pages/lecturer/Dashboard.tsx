import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { Spinner } from '../../components/ui/Spinner';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import {
  BookOpen,
  Users,
  Calendar,
  Award,
  ArrowRight,
  FileText,
  CheckSquare,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface LecturerStats {
  totalCourses: number;
  totalStudents: number;
  pendingGrades: number;
  totalResources: number;
}

export const LecturerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<LecturerStats | null>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      try {
        const [statsRes, coursesRes] = await Promise.all([
          api.get('/lecturer/dashboard/stats'),
          api.get('/lecturer/courses'),
        ]);
        setStats(statsRes.data.stats);
        setCourses(coursesRes.data.courses || []);
      } catch (err) {
        console.error('Failed to load lecturer dashboard:', err);
        toast.error('Could not load dashboard data');
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Spinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  const statCards = [
    {
      label: 'Assigned Courses',
      value: stats?.totalCourses ?? 0,
      icon: BookOpen,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-950/40',
      path: '/lecturer/courses',
    },
    {
      label: 'Students Enrolled',
      value: stats?.totalStudents ?? 0,
      icon: Users,
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-50 dark:bg-purple-950/40',
      path: '/lecturer/courses',
    },
    {
      label: 'Pending Grades',
      value: stats?.pendingGrades ?? 0,
      icon: Award,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      path: '/lecturer/scores',
    },
    {
      label: 'Resources Uploaded',
      value: stats?.totalResources ?? 0,
      icon: FileText,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      path: '/lecturer/resources',
    },
  ];

  const quickActions = [
    { label: 'Enter CA & Exam Scores', desc: 'Submit student scores for enrolled courses', path: '/lecturer/scores', icon: CheckSquare, color: 'from-blue-500 to-blue-600' },
    { label: 'Mark Attendance', desc: 'Record class attendance for today', path: '/lecturer/attendance', icon: Calendar, color: 'from-purple-500 to-purple-600' },
    { label: 'Upload Resources', desc: 'Share notes and past papers', path: '/lecturer/resources', icon: FileText, color: 'from-emerald-500 to-emerald-600' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fadeIn">
        {/* Welcome Banner */}
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="relative z-10">
            <div className="flex items-center space-x-2 mb-2">
              <Sparkles className="w-4 h-4 opacity-80" />
              <p className="text-xs font-semibold uppercase tracking-wider opacity-80">Lecturer Portal</p>
            </div>
            <h1 className="text-2xl font-bold">Welcome, {user?.full_name?.split(' ')[0] || 'Lecturer'} 👋</h1>
            <p className="text-sm opacity-75 mt-1">
              You have <strong>{stats?.totalCourses ?? 0} course{stats?.totalCourses !== 1 ? 's' : ''}</strong> assigned this semester with{' '}
              <strong>{stats?.totalStudents ?? 0} students</strong> enrolled.
            </p>
          </div>
          {/* Decorative circles */}
          <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/10" />
          <div className="absolute -bottom-12 -right-4 w-56 h-56 rounded-full bg-white/5" />
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <button
                key={card.label}
                onClick={() => navigate(card.path)}
                className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-5 flex items-center space-x-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 text-left w-full"
              >
                <div className={`p-3 rounded-xl ${card.bg}`}>
                  <Icon className={`w-5 h-5 ${card.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">{card.value}</p>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{card.label}</p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Quick Actions</h2>
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  onClick={() => navigate(action.path)}
                  className="group w-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-4 text-left flex items-center justify-between hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 shadow-sm"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2.5 rounded-xl bg-gradient-to-br ${action.color}`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{action.label}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{action.desc}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 group-hover:translate-x-1 transition-transform" />
                </button>
              );
            })}
          </div>

          {/* Assigned Courses */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">My Assigned Courses</h2>
              <button
                onClick={() => navigate('/lecturer/courses')}
                className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1"
              >
                <span>View all</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            {courses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80">
                <BookOpen className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-sm">No courses assigned yet.</p>
                <p className="text-xs mt-0.5">Contact the admin to assign courses to you.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {courses.slice(0, 5).map((course: any) => (
                  <div
                    key={course.id}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-4 flex items-center justify-between shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40">
                        <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{course.courses?.name || course.name}</p>
                        <p className="text-xs text-slate-400 font-mono">{course.courses?.code || course.code}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                        {course.enrollmentCount || 0} students
                      </p>
                      <p className="text-xs text-slate-400">
                        {course.courses?.credits ?? course.credits} cr · Sem {course.courses?.semester ?? course.semester}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
