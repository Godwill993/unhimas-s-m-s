import React, { useState } from 'react';
import { HelpCircle, ExternalLink, Mail, Phone, X, ShieldCheck } from 'lucide-react';

export const FloatingActions: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  // Helper with UTM tracking parameters
  const getUtmUrl = (url: string, medium: string, campaign: string) => {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}utm_source=unhimas_portal&utm_medium=${medium}&utm_campaign=${campaign}&utm_content=floating_support`;
  };

  return (
    <div className="fixed bottom-6 left-6 z-40">
      {isOpen && (
        <div className="mb-3 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-4 space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-amber-500" />
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                UNHIMAS Support
              </h4>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400">
            Need help with your student matricule, portal login, or payment issues? Contact the Academic Registry.
          </p>

          <div className="space-y-2 text-xs">
            <a
              href={getUtmUrl('mailto:registry@unhimas.edu.cm', 'email', 'support_ticket')}
              className="flex items-center space-x-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <Mail className="w-4 h-4 text-blue-500" />
              <span>registry@unhimas.edu.cm</span>
            </a>
            <div className="flex items-center space-x-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300">
              <Phone className="w-4 h-4 text-emerald-500" />
              <span>+237 670 000 000 (Yaoundé)</span>
            </div>
            <a
              href={getUtmUrl('https://unhimas.edu.cm', 'web', 'official_website')}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:underline"
            >
              <span>Visit Official Website</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="UNHIMAS Help and Support"
        className="flex items-center space-x-2 px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 rounded-full shadow-lg hover:shadow-xl hover:border-blue-500 dark:hover:border-blue-500 transition-all duration-200 hover:-translate-y-0.5 group"
      >
        <HelpCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 group-hover:rotate-12 transition-transform" />
        <span className="text-xs font-semibold">Help & Desk</span>
      </button>
    </div>
  );
};
