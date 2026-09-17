import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const PasswordInput: React.FC<PasswordInputProps> = ({
  label,
  error,
  helperText,
  className = '',
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          type={showPassword ? 'text' : 'password'}
          className={`w-full px-3.5 py-2.5 bg-white dark:bg-slate-900/90 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 border rounded-xl text-sm transition-all duration-200 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 ${
            error
              ? 'border-rose-500 dark:border-rose-500/80 focus:ring-rose-500/20'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          } ${className}`}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {error && <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">{error}</p>}
      {helperText && !error && <p className="text-xs text-slate-500 dark:text-slate-400">{helperText}</p>}
    </div>
  );
};
