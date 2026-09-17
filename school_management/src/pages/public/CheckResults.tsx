import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import type { PublicReportResult } from '../../types/index';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { School, Search, AlertCircle, ShieldCheck, Award } from 'lucide-react';
import toast from 'react-hot-toast';

export const PublicCheckResults: React.FC = () => {
  const [studentCode, setStudentCode] = useState('');
  const [selectedPeriodId, setSelectedPeriodId] = useState('');
  const [periods, setPeriods] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<PublicReportResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadPeriods() {
      try {
        const res = await api.get('/public/periods');
        setPeriods(res.data.periods);
        if (res.data.periods.length > 0) {
          setSelectedPeriodId(res.data.periods[0].id);
        }
      } catch {
        // fail silently
      }
    }
    loadPeriods();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentCode.trim() || !selectedPeriodId) {
      toast.error('Please enter your student code and select a period');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setReport(null);

    try {
      const res = await api.get(
        `/public/report?student_code=${encodeURIComponent(studentCode.trim())}&period_id=${selectedPeriodId}`
      );
      setReport(res.data);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setErrorMsg('No record found. Please check your student code and try again.');
      } else if (err.response?.status === 429) {
        setErrorMsg('Too many requests. Please wait a moment before trying again.');
      } else {
        setErrorMsg('Unable to retrieve report card at this time. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col justify-between">
      {/* Header */}
      <header className="bg-slate-900/80 border-b border-slate-800/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/20">
            <School className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-100">Cameroon Excellence Academy</h1>
            <p className="text-xs text-slate-400">Public Student Results Portal</p>
          </div>
        </div>
        <a
          href="/login"
          className="text-xs font-semibold text-amber-400 hover:text-amber-300 border border-amber-500/30 px-3 py-1.5 rounded-lg hover:bg-amber-500/10 transition-colors"
        >
          Staff Login
        </a>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-6 space-y-8">
        {/* Search Card */}
        <Card className="text-center p-8 bg-gradient-to-b from-slate-900 to-slate-950">
          <Award className="w-12 h-12 text-amber-500 mx-auto mb-3 animate-bounce" />
          <h2 className="text-2xl font-bold text-slate-100 mb-1">Check Your Academic Results</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto mb-6">
            Enter your unique student code (e.g. SCH-2026-F4-0142) and choose an academic sequence to view your official report card.
          </p>

          <form onSubmit={handleSearch} className="max-w-lg mx-auto space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <Input
                  placeholder="Enter Student Code (e.g. SCH-2026-F4-0142)"
                  value={studentCode}
                  onChange={(e) => setStudentCode(e.target.value.toUpperCase())}
                  required
                />
              </div>
              <Select
                value={selectedPeriodId}
                onChange={(e) => setSelectedPeriodId(e.target.value)}
                options={periods.map((p) => ({
                  value: p.id,
                  label: `${p.label} (${p.year})`,
                }))}
                required
              />
            </div>

            <Button
              type="submit"
              isLoading={loading}
              className="w-full sm:w-auto px-8 flex items-center justify-center space-x-2 mx-auto"
            >
              <Search className="w-4 h-4" />
              <span>Check Results</span>
            </Button>
          </form>
        </Card>

        {/* Error Alert */}
        {errorMsg && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl p-4 flex items-center space-x-3 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{errorMsg}</p>
          </div>
        )}

        {/* On-Screen Report Card Result */}
        {report && (
          <div className="space-y-6 animate-fadeIn">
            {/* Student Info Card */}
            <Card className="bg-slate-900 border-amber-500/30">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-4 mb-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-xl font-bold text-slate-100">{report.student.full_name}</h3>
                    <Badge variant="warning">{report.student.student_code}</Badge>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Class: <span className="text-slate-200 font-semibold">{report.student.class_name}</span>
                    {report.student.stream ? ` (${report.student.stream})` : ''}
                  </p>
                </div>
                <div className="mt-3 sm:mt-0 text-right">
                  <Badge variant="info" size="md">{report.period.label}</Badge>
                  <p className="text-xs text-slate-400 mt-1">Academic Year: {report.period.year}</p>
                </div>
              </div>

              {/* Subject Marks Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-950 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3">Subject</th>
                      <th className="px-4 py-3 text-center">Coeff</th>
                      <th className="px-4 py-3 text-center">Mark / 20</th>
                      <th className="px-4 py-3 text-center">Weighted Mark</th>
                      <th className="px-4 py-3 text-center">Grade</th>
                      <th className="px-4 py-3">Remark</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {report.subjects.map((sub, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30">
                        <td className="px-4 py-3 font-semibold text-slate-100">{sub.subject}</td>
                        <td className="px-4 py-3 text-center text-slate-400">{sub.coefficient}</td>
                        <td
                          className={`px-4 py-3 text-center font-bold font-mono ${
                            sub.mark >= 10 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {sub.mark}
                        </td>
                        <td className="px-4 py-3 text-center text-slate-300 font-mono">{sub.weighted_mark}</td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant={sub.mark >= 10 ? 'success' : 'danger'}>{sub.grade}</Badge>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-300">{sub.remark}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Overall Score Summary */}
              <Card className="flex flex-col justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Overall Performance</p>
                <div className="my-4">
                  <div className="text-3xl font-extrabold text-amber-400">
                    {report.summary.weighted_average} <span className="text-base text-slate-500">/ 20</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Weighted Average Mark</p>
                </div>
                <div className="flex items-center justify-between border-t border-slate-800 pt-3">
                  <span className="text-xs text-slate-400">Grade & Remark:</span>
                  <Badge variant={report.summary.weighted_average >= 10 ? 'success' : 'danger'}>
                    {report.summary.overall_grade} — {report.summary.overall_remark}
                  </Badge>
                </div>
              </Card>

              {/* Attendance Summary */}
              <Card className="flex flex-col justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Attendance Summary</p>
                <div className="grid grid-cols-3 gap-2 my-4 text-center">
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2">
                    <p className="text-lg font-bold text-emerald-400">{report.attendance.present}</p>
                    <p className="text-[10px] text-slate-400">Present</p>
                  </div>
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-2">
                    <p className="text-lg font-bold text-amber-400">{report.attendance.late}</p>
                    <p className="text-[10px] text-slate-400">Late</p>
                  </div>
                  <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-2">
                    <p className="text-lg font-bold text-rose-400">{report.attendance.absent}</p>
                    <p className="text-[10px] text-slate-400">Absent</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 text-center border-t border-slate-800 pt-3">
                  Total Sessions Logged: {report.attendance.total}
                </p>
              </Card>

              {/* Discipline Remarks */}
              <Card className="flex flex-col justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Discipline Status</p>
                <div className="my-4 space-y-2">
                  {report.discipline.map((d, idx) => (
                    <div key={idx} className="text-xs p-2 bg-slate-950 rounded border border-slate-800 text-slate-300">
                      {d.notes}
                    </div>
                  ))}
                </div>
                <div className="flex items-center space-x-1 text-xs text-emerald-400 border-t border-slate-800 pt-3">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Official Verified Record</span>
                </div>
              </Card>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900/60 border-t border-slate-800/80 py-4 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} Cameroon Excellence Academy — Powered by School Management System
      </footer>
    </div>
  );
};
