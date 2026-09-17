import React from 'react';

export const SkipToContent: React.FC = () => {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 z-50 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg shadow-lg border border-white/20 focus:outline-none focus:ring-2 focus:ring-amber-400"
    >
      Skip to main content
    </a>
  );
};
