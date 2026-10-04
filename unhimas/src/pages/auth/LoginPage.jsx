import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MdVisibility, MdVisibilityOff, MdErrorOutline, MdWarning, MdOpenInNew } from 'react-icons/md';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import logo from '../../assets/unhimas_logo.jpg';
import '../../styles/components.css';

const schema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async ({ email, password }) => {
    if (!isSupabaseConfigured) {
      setServerError('Supabase is not configured. Please add your .env credentials first.');
      return;
    }

    setLoading(true);
    setServerError('');

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setServerError(
        error.message === 'Invalid login credentials'
          ? 'Incorrect email or password. Please try again.'
          : 'An error occurred. Please try again later.'
      );
      setLoading(false);
      return;
    }

    navigate('/');
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Header */}
        <div className="auth-card-header">
          <img src={logo} alt="UNHIMAS logo" className="auth-logo" />
          <div>
            <div className="auth-school-name">UNHIMAS</div>
            <div className="auth-school-subtitle">Universal Higher Institute of Management and Sciences</div>
          </div>
        </div>

        {/* Body */}
        <div className="auth-card-body">
          <h1 className="auth-title">Sign in to your account</h1>

          {/* Setup warning — only shown when .env is missing */}
          {!isSupabaseConfigured && (
            <div className="auth-alert error" role="alert" style={{ marginBottom: '1rem', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}>
                <MdWarning style={{ flexShrink: 0 }} /> Supabase credentials not configured
              </div>
              <div style={{ fontSize: '0.78rem', lineHeight: 1.5 }}>
                Create a <code style={{ background: 'rgba(183,0,50,0.1)', padding: '0 4px', borderRadius: 3 }}>.env</code> file
                in the project root with your Supabase project URL and anon key.
              </div>
              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#9a002a' }}
              >
                Open Supabase Dashboard <MdOpenInNew style={{ fontSize: '0.9rem' }} />
              </a>
              <div style={{ fontSize: '0.75rem', background: 'rgba(0,0,0,0.05)', padding: '0.5rem 0.75rem', borderRadius: 4, fontFamily: 'monospace', lineHeight: 1.6 }}>
                VITE_SUPABASE_URL=https://xxx.supabase.co<br />
                VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
              </div>
            </div>
          )}

          {serverError && (
            <div className="auth-alert error" role="alert">
              <MdErrorOutline style={{ flexShrink: 0 }} />
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            {/* Email */}
            <div className="form-group">
              <label htmlFor="email" className="form-label">Email address</label>
              <input
                id="email"
                type="email"
                className={`form-input ${errors.email ? 'error' : ''}`}
                autoComplete="email"
                disabled={!isSupabaseConfigured}
                {...register('email')}
              />
              {errors.email && (
                <div className="form-error" role="alert"><MdErrorOutline />{errors.email.message}</div>
              )}
            </div>

            {/* Password */}
            <div className="form-group">
              <label htmlFor="password" className="form-label">Password</label>
              <div className="form-input-wrapper">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className={`form-input with-icon-right ${errors.password ? 'error' : ''}`}
                  autoComplete="current-password"
                  disabled={!isSupabaseConfigured}
                  {...register('password')}
                />
                <button
                  type="button"
                  className="input-icon-right"
                  onClick={() => setShowPassword(v => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <MdVisibilityOff /> : <MdVisibility />}
                </button>
              </div>
              {errors.password && (
                <div className="form-error" role="alert"><MdErrorOutline />{errors.password.message}</div>
              )}
            </div>

            {/* Forgot password */}
            <div className="auth-links">
              <span />
              <Link to="/forgot-password" className="auth-link">Forgot password?</Link>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full"
              disabled={loading || !isSupabaseConfigured}
            >
              {loading ? (
                <>
                  <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                  Signing in…
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div style={{
          padding: '0.875rem 2rem',
          borderTop: '1px solid var(--color-border)',
          textAlign: 'center',
          fontSize: '0.75rem',
          color: 'var(--color-text-muted)'
        }}>
          © {new Date().getFullYear()} UNHIMAS. All rights reserved.
        </div>
      </div>
    </div>
  );
}
