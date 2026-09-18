import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { Spinner } from '../../components/ui/Spinner';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Calendar, CheckCircle2, XCircle, Clock, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';

interface AttendanceRecord {
  id: string;
  date: string;
  course_code: string;
  course_name: string;
  status: 'present' | 'absent' | 'late';
}

interface AttendanceStats {
  total: number;
  present: number;
  absent: number;
  late: number;
  rate: number;
}

const statusConfig = {
  present: { icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-950/40', label: 'Present' },
  absent: { icon: XCircle, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-100 dark:bg-rose-950/40', label: 'Absent' },
  late: { icon: Clock, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-950/40', label: 'Late' },
};

export const StudentAttendance: React.FC = () => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filterCourse, setFilterCourse] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get('/student/attendance');
        setRecords(res.data.records || []);
        setStats(res.data.stats);
      } catch {
        toast.error('Failed to load attendance');
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const courses = Array.from(new Set(records.map((r) => r.course_code)));
  const filtered = filterCourse ? records.filter((r) => r.course_code === filterCourse) : records;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[50vh]"><Spinner size="lg" /></div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fadeIn">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">My Attendance</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Track your class attendance record</p>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Attendance Rate', value: `${stats.rate}%`, icon: TrendingUp, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/40' },
              { label: 'Present', value: stats.present, icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/40' },
              { label: 'Absent', value: stats.absent, icon: XCircle, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/40' },
              { label: 'Late', value: stats.late, icon: Clock, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/40' },
            ].map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.label} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-5 flex items-center space-x-4 shadow-sm">
                  <div className={`p-3 rounded-xl ${card.bg}`}>
                    <Icon className={`w-5 h-5 ${card.color}`} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{card.label}</p>
                    <p className="text-xl font-bold text-slate-900 dark:text-slate-50">{card.value}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Attendance Rate Bar */}
        {stats && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Overall Attendance Progress</p>
              <p className={`text-sm font-bold ${stats.rate >= 75 ? 'text-emerald-600' : stats.rate >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>
                {stats.rate}%
              </p>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-700 ${stats.rate >= 75 ? 'bg-emerald-500' : stats.rate >= 50 ? 'bg-amber-400' : 'bg-rose-500'}`}
                style={{ width: `${stats.rate}%` }}
              />
            </div>
            {stats.rate < 75 && (
              <p className="text-xs text-rose-600 dark:text-rose-400 mt-2">
                ⚠️ Your attendance is below the required 75% threshold. You may be barred from exams.
              </p>
            )}
          </div>
        )}

        {/* Filter */}
        {courses.length > 0 && (
          <div className="flex items-center space-x-3">
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Filter by course:</label>
            <select
              value={filterCourse}
              onChange={(e) => setFilterCourse(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All courses</option>
              {courses.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        )}

        {/* Records Table */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Calendar className="w-10 h-10 mb-3 opacity-50" />
            <p className="text-sm font-medium">No attendance records found.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400">Date</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400">Course</th>
                  <th className="text-center px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((rec) => {
                  const cfg = statusConfig[rec.status] || statusConfig.present;
                  const Icon = cfg.icon;
                  return (
                    <tr key={rec.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300 text-sm">
                        {new Date(rec.date).toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-slate-800 dark:text-slate-100">{rec.course_name}</p>
                        <p className="text-xs text-slate-400 font-mono">{rec.course_code}</p>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.color}`}>
                          <Icon className="w-3.5 h-3.5" />
                          <span>{cfg.label}</span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
