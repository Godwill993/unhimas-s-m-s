import React, { useState } from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { ScrollProgressBar } from '../ui/ScrollProgressBar';
import { ScrollToTop } from '../ui/ScrollToTop';
import { FullSiteSearchModal } from '../ui/FullSiteSearchModal';
import { SkipToContent } from '../ui/SkipToContent';
import { FloatingActions } from '../ui/FloatingActions';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      <SkipToContent />
      <ScrollProgressBar />

      {/* Sticky Header */}
      <Navbar
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        isMobileMenuOpen={isMobileMenuOpen}
        onOpenSearch={() => setIsSearchOpen(true)}
      />

      {/* Main App Body */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Desktop Sidebar */}
        <div className="hidden md:block flex-shrink-0">
          <Sidebar />
        </div>

        {/* Mobile Sidebar Drawer */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-40 md:hidden flex">
            <div
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white dark:bg-slate-950 shadow-2xl z-50">
              <Sidebar onCloseMobile={() => setIsMobileMenuOpen(false)} />
            </div>
          </div>
        )}

        {/* Dynamic Page Content */}
        <main id="main-content" className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Interactive Floats & Search Modal */}
      <ScrollToTop />
      <FloatingActions />
      <FullSiteSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  );
};
