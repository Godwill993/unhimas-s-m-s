import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import type { AdminDashboardData } from '../../types/index';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';
import { Users, GraduationCap, BookOpen, Calendar, ShieldAlert } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export const AdminDashboard: React.FC = () => {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const res = await api.get('/admin/dashboard');
        setData(res.data);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-100">Admin Dashboard</h2>
        <p className="text-xs text-slate-400">System overview & performance metrics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="flex items-center space-x-4">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Total Students</p>
            <p className="text-2xl font-bold text-slate-100">{data?.stats.totalStudents || 0}</p>
          </div>
        </Card>

        <Card className="flex items-center space-x-4">
          <div className="p-3 bg-sky-500/10 text-sky-400 rounded-xl border border-sky-500/20">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Active Teachers</p>
            <p className="text-2xl font-bold text-slate-100">{data?.stats.totalTeachers || 0}</p>
          </div>
        </Card>

        <Card className="flex items-center space-x-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Total Classes</p>
            <p className="text-2xl font-bold text-slate-100">{data?.stats.totalClasses || 0}</p>
          </div>
        </Card>

        <Card className="flex items-center space-x-4">
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Active Period</p>
            <p className="text-sm font-semibold text-slate-100">
              {data?.stats.activePeriod ? data.stats.activePeriod.label : 'None Set'}
            </p>
          </div>
        </Card>
      </div>

      {/* Charts & Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Class Averages Bar Chart */}
        <Card className="lg:col-span-2" title="Class Performance Averages" subtitle="Weighted average mark (/20) per class for active period">
          {data?.classAverages && data.classAverages.length > 0 ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.classAverages}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="class_name" stroke="#94a3b8" fontSize={11} />
                  <YAxis domain={[0, 20]} stroke="#94a3b8" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }}
                  />
                  <Bar dataKey="average" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-500 text-sm">
              No score data available for current active period.
            </div>
          )}
        </Card>

        {/* Recent Discipline Incidents */}
        <Card title="Recent Discipline Incidents" subtitle="Latest logged student conduct issues">
          {data?.recentDiscipline && data.recentDiscipline.length > 0 ? (
            <div className="space-y-3">
              {data.recentDiscipline.map((rec: any) => (
                <div key={rec.id} className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg text-xs flex justify-between items-start">
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                      <span className="font-semibold text-slate-200">{rec.student?.full_name}</span>
                      <span className="text-slate-500">({rec.student?.student_code})</span>
                    </div>
                    <p className="text-slate-400 line-clamp-1">{rec.notes || rec.type}</p>
                  </div>
                  <Badge variant="danger" size="sm">{rec.type}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-500 text-sm">
              No recent discipline records.
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
