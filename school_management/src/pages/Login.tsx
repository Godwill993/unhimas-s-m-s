import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { School, Lock, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      const userProfile = await login(email, password);
      toast.success(`Welcome back, ${userProfile.full_name}!`);

      // Role-based redirect
      if (userProfile.role === 'admin') {
        navigate('/admin');
      } else if (userProfile.role === 'teacher') {
        navigate('/teacher');
      } else if (userProfile.role === 'discipline') {
        navigate('/discipline');
      } else {
        navigate('/login');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 font-sans relative overflow-hidden">
      {/* Subtle decorative background gradient */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-6 z-10">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20 mb-2">
            <School className="w-8 h-8 text-amber-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Cameroon Excellence Academy</h1>
          <p className="text-xs text-slate-400">Staff Access Portal — School Management System</p>
        </div>

        {/* Login Form Card */}
        <Card className="p-8 shadow-2xl bg-slate-900/90 border-slate-800 backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="e.g. teacher@school.cm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button
              type="submit"
              isLoading={loading}
              className="w-full py-2.5 mt-2 flex items-center justify-center space-x-2"
            >
              <Lock className="w-4 h-4" />
              <span>Sign In to Account</span>
            </Button>
          </form>

          {/* Quick Demo Credentials Info */}
          <div className="mt-6 pt-6 border-t border-slate-800 text-xs text-slate-400 space-y-1">
            <p className="font-semibold text-slate-300">Staff Account Credentials:</p>
            <p>Admin / Teacher / Discipline accounts are created by school administration.</p>
          </div>
        </Card>

        {/* Link to Public Portal */}
        <div className="text-center">
          <a
            href="/check-results"
            className="inline-flex items-center space-x-1.5 text-xs text-amber-400 hover:text-amber-300 transition-colors"
          >
            <span>Are you a student checking results? Click here</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
