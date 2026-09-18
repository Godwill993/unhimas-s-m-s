import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { PasswordInput } from '../../components/ui/PasswordInput';
import { Button } from '../../components/ui/Button';
import { ExpandableFAQ } from '../../components/ui/ExpandableFAQ';
import {
  GraduationCap,
  Award,
  Printer,
  ArrowLeft,
  AlertCircle,
  FileCheck2,
  Calendar,
  BookOpen,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const PublicCheckResults: React.FC = () => {
  const [matricule, setMatricule] = useState('');
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resultData, setResultData] = useState<any | null>(null);
  const navigate = useNavigate();

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matricule.trim() || !pin.trim()) {
      toast.error('Both Matricule and Results PIN are required');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.post('/public/check-results', {
        matricule: matricule.trim().toUpperCase(),
        pin: pin.trim(),
      });
      setResultData(res.data);
      toast.success('Results verified successfully!');
    } catch (err: any) {
      setResultData(null);
      toast.error(
        err.response?.data?.error ||
          'Invalid Matricule or Results PIN. Please ensure you entered the correct details.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const faqItems = [
    {
      question: 'Where can I find my Results PIN?',
      answer:
        'Your Results PIN was provided on the official printable credentials slip issued by the UNHIMAS registry upon registration. It is a private 6-character code distinct from your portal password.',
    },
    {
      question: 'Why are some of my registered courses not showing here?',
      answer:
        'The Public Results Verification system displays only courses whose grades have been officially vetted and marked as "Published" by your Lecturer and the Dean of Academic Affairs.',
    },
    {
      question: 'Is this an official academic transcript?',
      answer:
        'This statement of results is for informational and verification purposes. Official sealed transcripts must be requested through the Student Portal or Academic Registry.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between p-4 sm:p-6 lg:p-8 transition-colors">
      {/* Header */}
      <header className="max-w-5xl w-full mx-auto flex items-center justify-between py-2 border-b border-slate-200/80 dark:border-slate-800/80 pb-4 print:hidden">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight">UNHIMAS Bilingual University</h1>
            <p className="text-[11px] text-slate-500">Public Examination Results Portal</p>
          </div>
        </div>

        <button
          onClick={() => navigate('/login')}
          className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Staff / Student Portal</span>
        </button>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl w-full mx-auto my-8 space-y-8 flex-1">
        {/* Search Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl print:hidden space-y-6">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 text-xs font-semibold border border-amber-500/20">
              <Award className="w-3.5 h-3.5" />
              <span>Instant Verification</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              Check Semester Examination Results
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Enter your student matricule and private results PIN to view your verified published grades.
            </p>
          </div>

          <form onSubmit={handleCheck} className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
            <div className="sm:col-span-6 space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Student Matricule
              </label>
              <input
                type="text"
                placeholder="e.g. UNH25-CS-0001"
                value={matricule}
                onChange={(e) => setMatricule(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900/90 text-slate-900 dark:text-slate-100 placeholder-slate-400 border border-slate-200 dark:border-slate-800 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 uppercase"
                required
              />
            </div>

            <div className="sm:col-span-4">
              <PasswordInput
                label="Results PIN"
                placeholder="Enter confidential PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                required
              />
            </div>

            <div className="sm:col-span-2">
              <Button type="submit" variant="primary" className="w-full py-2.5" isLoading={isLoading}>
                Verify
              </Button>
            </div>
          </form>
        </div>

        {/* Results Slip Display (Printable) */}
        {resultData && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 print:border-none print:shadow-none print:p-0">
            {/* Header for slip */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-800 gap-4">
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
                  Official Statement of Examination Results
                </p>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
                  {resultData.student.fullName}
                </h3>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                    {resultData.student.matricule}
                  </span>
                  <span>&bull;</span>
                  <span>{resultData.student.programName}</span>
                  <span>&bull;</span>
                  <span>Level: {resultData.student.level}</span>
                </div>
              </div>

              <div className="flex items-center space-x-2 print:hidden">
                <Button variant="secondary" onClick={handlePrint}>
                  <Printer className="w-4 h-4 mr-2" />
                  Print Statement
                </Button>
              </div>
            </div>

            {/* Results Table */}
            {resultData.results.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  No published grades found
                </p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Grades for this academic session have either not yet been entered or are awaiting official publication by the faculty board.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-3.5 rounded-l-xl">Course Code</th>
                      <th className="py-3 px-3.5">Course Title</th>
                      <th className="py-3 px-3.5 text-center">Credits</th>
                      <th className="py-3 px-3.5 text-center">CA (/30)</th>
                      <th className="py-3 px-3.5 text-center">Exam (/70)</th>
                      <th className="py-3 px-3.5 text-center">Total (/100)</th>
                      <th className="py-3 px-3.5 text-center">Grade</th>
                      <th className="py-3 px-3.5 text-center rounded-r-xl">GPA Pts</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {resultData.results.map((r: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-3.5 px-3.5 font-bold font-mono text-blue-600 dark:text-blue-400">
                          {r.courseCode}
                        </td>
                        <td className="py-3.5 px-3.5">{r.courseName}</td>
                        <td className="py-3.5 px-3.5 text-center">{r.credits}</td>
                        <td className="py-3.5 px-3.5 text-center">{r.caScore}</td>
                        <td className="py-3.5 px-3.5 text-center">{r.examScore}</td>
                        <td className="py-3.5 px-3.5 text-center font-bold">{r.totalScore}</td>
                        <td className="py-3.5 px-3.5 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-md font-bold text-xs ${
                              r.letterGrade === 'A'
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                : r.letterGrade?.startsWith('B')
                                ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                                : r.letterGrade?.startsWith('C')
                                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                                : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                            }`}
                          >
                            {r.letterGrade}
                          </span>
                        </td>
                        <td className="py-3.5 px-3.5 text-center font-mono font-semibold">
                          {r.gpaPoints?.toFixed(1)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Summary Statistics Card */}
            {resultData.results.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Courses Completed
                  </p>
                  <p className="text-xl font-black text-slate-900 dark:text-slate-100">
                    {resultData.summary.totalCourses}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Total Credits Earned
                  </p>
                  <p className="text-xl font-black text-slate-900 dark:text-slate-100">
                    {resultData.summary.totalCredits}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Cumulative GPA (CGPA)
                  </p>
                  <p className="text-xl font-black text-amber-500">
                    {resultData.summary.cgpa} / 4.00
                  </p>
                </div>
              </div>
            )}

            {/* Official Footer Note */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
              <div className="flex items-center space-x-1.5">
                <FileCheck2 className="w-4 h-4 text-emerald-500" />
                <span>Digitally verified via UNHIMAS Academic Registry Security Hash</span>
              </div>
              <span>Generated: {new Date().toLocaleDateString()}</span>
            </div>
          </div>
        )}

        {/* Expandable FAQ */}
        <div className="print:hidden">
          <ExpandableFAQ items={faqItems} />
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-5xl w-full mx-auto text-center py-4 border-t border-slate-200/80 dark:border-slate-800/80 text-xs text-slate-400 print:hidden">
        &copy; {new Date().getFullYear()} UNHIMAS Bilingual University (Yaoundé, Cameroon). All rights reserved.
      </footer>
    </div>
  );
};
