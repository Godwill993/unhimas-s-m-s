import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { PasswordInput } from '../components/ui/PasswordInput';
import { Button } from '../components/ui/Button';
import { ExpandableFAQ } from '../components/ui/ExpandableFAQ';
import { GraduationCap, ArrowRight, ShieldCheck, HelpCircle, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export const Login: React.FC = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      toast.error('Please enter your matricule/email and password');
      return;
    }

    setIsLoading(true);
    try {
      const user = await login(identifier.trim(), password);
      toast.success(`Welcome back, ${user.full_name}!`);
      
      // Navigate to appropriate role dashboard
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'lecturer') navigate('/lecturer');
      else if (user.role === 'finance') navigate('/finance');
      else navigate('/student');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Invalid credentials. Please verify your login details.');
    } finally {
      setIsLoading(false);
    }
  };

  const setDemoCredentials = (roleId: string, pass: string) => {
    setIdentifier(roleId);
    setPassword(pass);
    toast('Demo credentials populated', { icon: '🔑' });
  };

  const faqItems = [
    {
      question: 'How do I log in as a student?',
      answer:
        'Students can log in using their unique UNHIMAS Matricule (e.g., UNH25-CS-0001) or their synthetic email and the temporary portal password provided on their registration credentials slip.',
    },
    {
      question: 'Where can I check my semester exam results without logging in?',
      answer:
        'You can visit the Public Results Verification page using the link in the top right or bottom of this page. You will only need your Matricule and confidential Results PIN.',
    },
    {
      question: 'I forgot my password or results PIN. What should I do?',
      answer:
        'Please contact the UNHIMAS Academic Registry or your Department Coordinator with your Student ID card to request a secure password or PIN reset.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-between p-4 sm:p-6 lg:p-8 transition-colors">
      {/* Top Header */}
      <div className="max-w-6xl w-full mx-auto flex items-center justify-between py-2">
        <div className="flex items-center space-x-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight text-slate-900 dark:text-slate-100">
              UNHIMAS ERP
            </h1>
            <p className="text-[10px] text-slate-500">Yaoundé, Cameroon</p>
          </div>
        </div>

        <button
          onClick={() => navigate('/check-results')}
          className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 transition-colors"
        >
          <span>Public Results Verification</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Login Card & Portal Info */}
      <div className="max-w-5xl w-full mx-auto my-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: University Branding & Info */}
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/50 border border-blue-200/60 dark:border-blue-800/60 text-blue-700 dark:text-blue-300 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-blue-500" />
            <span>Official University Management Portal</span>
          </div>

          <div className="space-y-3">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
              Bilingual Academic Excellence at <span className="text-blue-600 dark:text-blue-400">UNHIMAS</span>
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-lg">
              Welcome to the centralized portal for UNHIMAS Bilingual University. Access course registration, academic performance tracking, fee statements, and verified transcripts.
            </p>
          </div>

          {/* Quick role highlights */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Student Self-Service</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Register courses, track GPA & CGPA, check fee balance & download materials.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
                <span>Lecturer Grading</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Enter CA + Exam scores with automated grade point and CGPA computations.
              </p>
            </div>
          </div>

          {/* Demo Credentials Quick Switch for Testing */}
          <div className="p-4 rounded-2xl bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs space-y-2">
            <p className="font-bold text-slate-700 dark:text-slate-300">Quick Test Credentials:</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setDemoCredentials('admin@unhimas.cm', 'admin123')}
                className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-medium hover:bg-rose-500/20 transition-colors"
              >
                Admin (admin@unhimas.cm)
              </button>
              <button
                type="button"
                onClick={() => setDemoCredentials('lecturer@unhimas.cm', 'lecturer123')}
                className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-medium hover:bg-amber-500/20 transition-colors"
              >
                Lecturer (lecturer@unhimas.cm)
              </button>
              <button
                type="button"
                onClick={() => setDemoCredentials('UNH25-CS-0001', 'student123')}
                className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-medium hover:bg-blue-500/20 transition-colors"
              >
                Student (UNH25-CS-0001)
              </button>
              <button
                type="button"
                onClick={() => setDemoCredentials('finance@unhimas.cm', 'finance123')}
                className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-medium hover:bg-emerald-500/20 transition-colors"
              >
                Finance (finance@unhimas.cm)
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Sign In Form */}
        <div className="lg:col-span-5">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Sign In to Portal</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Enter your student matricule or staff email address
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Matricule or Email
                </label>
                <input
                  type="text"
                  placeholder="e.g. UNH25-CS-0001 or admin@unhimas.cm"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900/90 text-slate-900 dark:text-slate-100 placeholder-slate-400 border border-slate-200 dark:border-slate-800 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                  required
                />
              </div>

              <PasswordInput
                label="Password"
                placeholder="Enter your account password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <Button type="submit" variant="primary" className="w-full py-3" isLoading={isLoading}>
                Sign In to Dashboard
              </Button>
            </form>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-center space-y-2">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Student checking examination results only?
              </p>
              <button
                type="button"
                onClick={() => navigate('/check-results')}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
              >
                No login required — Use Matricule & PIN &rarr;
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Expandable FAQ Section */}
      <div className="max-w-4xl w-full mx-auto my-6">
        <ExpandableFAQ items={faqItems} />
      </div>

      {/* Footer */}
      <footer className="max-w-6xl w-full mx-auto text-center py-4 border-t border-slate-200/80 dark:border-slate-800/80 text-xs text-slate-400">
        &copy; {new Date().getFullYear()} UNHIMAS Bilingual University (Yaoundé, Cameroon). All rights reserved.
      </footer>
    </div>
  );
};
