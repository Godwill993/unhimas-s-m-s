import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import {
  GraduationCap,
  BookOpen,
  Award,
  Calendar,
  DollarSign,
  FolderDown,
  ArrowRight,
  Bell,
  CheckCircle2,
} from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [student, setStudent] = useState<any>(null);
  const [gradesSummary, setGradesSummary] = useState<any>(null);
  const [attendanceStats, setAttendanceStats] = useState<any>(null);
  const [financeSummary, setFinanceSummary] = useState<any>(null);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadPortal() {
      try {
        const [pRes, gRes, aRes, fRes, annRes] = await Promise.all([
          api.get('/student/profile'),
          api.get('/student/grades'),
          api.get('/student/attendance'),
          api.get('/student/finance'),
          api.get('/announcements'),
        ]);
        setStudent(pRes.data.student);
        setGradesSummary(gRes.data.summary);
        setAttendanceStats(aRes.data.stats);
        setFinanceSummary(fRes.data.summary);
        setAnnouncements(annRes.data.announcements || []);
      } catch (err) {
        console.error('Failed to load student portal:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadPortal();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Student Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-700 via-indigo-700 to-amber-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="inline-block text-[11px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20">
              Student Self-Service Portal
            </span>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Welcome back, {user?.full_name}!
            </h2>
            <div className="flex flex-wrap items-center gap-3 text-xs text-blue-100 font-medium">
              <span className="font-mono font-bold bg-white/20 px-2 py-0.5 rounded text-white">
                {student?.matricule}
              </span>
              <span>&bull;</span>
              <span>{student?.programs?.name}</span>
              <span>&bull;</span>
              <span>Level {student?.level}</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="secondary"
              className="bg-white/15 text-white hover:bg-white/25 border-white/20 text-xs"
              onClick={() => navigate('/student/courses')}
            >
              <BookOpen className="w-4 h-4 mr-1.5" />
              Register Courses
            </Button>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => navigate('/student/grades')}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:border-blue-400 dark:hover:border-blue-500 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">CGPA</span>
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-2">
            {gradesSummary?.cgpa || '0.00'}
          </p>
          <span className="text-[11px] text-slate-500">
            {gradesSummary?.totalCredits || 0} Credits Completed
          </span>
        </div>

        <div
          onClick={() => navigate('/student/attendance')}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:border-emerald-400 dark:hover:border-emerald-500 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Attendance</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-2">
            {attendanceStats?.attendanceRate || '100%'}
          </p>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
            {attendanceStats?.present || 0} Sessions Present
          </span>
        </div>

        <div
          onClick={() => navigate('/student/finance')}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:border-amber-400 dark:hover:border-amber-500 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Fee Balance</span>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-2">
            {(financeSummary?.balance || 0).toLocaleString()} <span className="text-xs font-normal">FCFA</span>
          </p>
          <span className="text-[11px] text-slate-500">
            Paid: {(financeSummary?.totalPaid || 0).toLocaleString()} FCFA
          </span>
        </div>

        <div
          onClick={() => navigate('/student/resources')}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:border-indigo-400 dark:hover:border-indigo-500 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Handouts</span>
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <FolderDown className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-2">
            Past Papers
          </p>
          <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">
            Program Resources
          </span>
        </div>
      </div>

      {/* Quick Access Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          onClick={() => navigate('/student/courses')}
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md cursor-pointer group transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Course Registration</h3>
                <p className="text-xs text-slate-500">Semester Course Enrolment</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
          </div>
        </div>

        <div
          onClick={() => navigate('/student/grades')}
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md cursor-pointer group transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">My Grades & GPA</h3>
                <p className="text-xs text-slate-500">View Published Exam Scores</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-500 group-hover:translate-x-1 transition-all" />
          </div>
        </div>

        <div
          onClick={() => navigate('/student/resources')}
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md cursor-pointer group transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                <FolderDown className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Past Questions</h3>
                <p className="text-xs text-slate-500">Download Materials</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
          </div>
        </div>
      </div>

      {/* Announcements Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center space-x-2">
          <Bell className="w-5 h-5 text-amber-500" />
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            University Announcements
          </h3>
        </div>

        {announcements.length === 0 ? (
          <p className="text-xs text-slate-400">No active announcements at this time.</p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {announcements.map((ann) => (
              <div key={ann.id} className="py-3.5 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {ann.title}
                  </h4>
                  <span className="text-[10px] text-slate-400">
                    {new Date(ann.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {ann.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
