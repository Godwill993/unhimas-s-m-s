import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { Spinner } from '../../components/ui/Spinner';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Award, Download, TrendingUp, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';

interface GradeRow {
  course_code: string;
  course_name: string;
  credits: number;
  semester: number;
  ca_score?: number;
  exam_score?: number;
  total_score?: number;
  letter_grade?: string;
  gpa_points?: number;
  is_published?: boolean;
}

interface GradesSummary {
  cgpa: number;
  totalCredits: number;
  completedCredits: number;
  session_name: string;
}

export const StudentGrades: React.FC = () => {
  const [grades, setGrades] = useState<GradeRow[]>([]);
  const [summary, setSummary] = useState<GradesSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get('/student/grades');
        setGrades(res.data.grades || []);
        setSummary(res.data.summary);
      } catch {
        toast.error('Failed to load grades');
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const letterColor: Record<string, string> = {
    A: 'text-emerald-600 dark:text-emerald-400',
    B: 'text-blue-600 dark:text-blue-400',
    C: 'text-amber-600 dark:text-amber-400',
    D: 'text-orange-600 dark:text-orange-400',
    F: 'text-rose-600 dark:text-rose-400',
  };

  const groupedBySemester = grades.reduce<Record<number, GradeRow[]>>((acc, g) => {
    const sem = g.semester || 1;
    if (!acc[sem]) acc[sem] = [];
    acc[sem].push(g);
    return acc;
  }, {});

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
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">My Grades & CGPA</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {summary?.session_name || 'Current Academic Session'}
            </p>
          </div>
          <button className="flex items-center space-x-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
            <Download className="w-4 h-4" />
            <span>Download Transcript</span>
          </button>
        </div>

        {/* CGPA + Stats */}
        {summary && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-1 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg flex flex-col items-center justify-center">
              <Award className="w-8 h-8 mb-2 opacity-80" />
              <p className="text-xs font-medium opacity-80 uppercase tracking-wider">CGPA</p>
              <p className="text-5xl font-bold mt-1">{summary.cgpa?.toFixed(2) ?? '—'}</p>
              <p className="text-xs opacity-70 mt-1">out of 4.00</p>
            </div>
            <div className="sm:col-span-2 grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-5 shadow-sm flex items-center space-x-4">
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40">
                  <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Credits Completed</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">{summary.completedCredits}</p>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-5 shadow-sm flex items-center space-x-4">
                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40">
                  <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Total Credits</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">{summary.totalCredits}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Grades by Semester */}
        {grades.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Award className="w-10 h-10 mb-3 opacity-50" />
            <p className="text-sm font-medium">No grades published yet.</p>
            <p className="text-xs mt-1">Check back after your lecturers have submitted scores.</p>
          </div>
        ) : (
          Object.entries(groupedBySemester)
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([semester, rows]) => (
              <div key={semester} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50">
                  <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Semester {semester}
                  </h2>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400">Course</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400">Credits</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400">CA (40)</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400">Exam (60)</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400">Total (100)</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400">Grade</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400">GPA Pts</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {rows.map((g) => {
                      const letter = g.letter_grade?.charAt(0) || '';
                      return (
                        <tr key={g.course_code} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-5 py-3.5">
                            <p className="font-medium text-slate-800 dark:text-slate-100">{g.course_name}</p>
                            <p className="text-xs text-slate-400 font-mono">{g.course_code}</p>
                          </td>
                          <td className="px-4 py-3.5 text-center text-slate-600 dark:text-slate-300 font-medium">{g.credits}</td>
                          {g.is_published ? (
                            <>
                              <td className="px-4 py-3.5 text-center text-slate-600 dark:text-slate-300">{g.ca_score ?? '—'}</td>
                              <td className="px-4 py-3.5 text-center text-slate-600 dark:text-slate-300">{g.exam_score ?? '—'}</td>
                              <td className="px-4 py-3.5 text-center font-bold text-slate-800 dark:text-slate-100">{g.total_score ?? '—'}</td>
                              <td className={`px-4 py-3.5 text-center font-bold text-lg ${letterColor[letter] || 'text-slate-600'}`}>
                                {g.letter_grade || '—'}
                              </td>
                              <td className="px-4 py-3.5 text-center text-slate-600 dark:text-slate-300">{g.gpa_points?.toFixed(1) ?? '—'}</td>
                            </>
                          ) : (
                            <td colSpan={5} className="px-4 py-3.5 text-center text-xs text-slate-400 italic">
                              Pending publication
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ))
        )}
      </div>
    </DashboardLayout>
  );
};
