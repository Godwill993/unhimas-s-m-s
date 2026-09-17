import React, { useEffect, useState } from 'react';

export const ScrollProgressBar: React.FC = () => {
  const [scrollPercentage, setScrollPercentage] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const winScroll = document.documentElement.scrollTop || document.body.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      if (height > 0) {
        setScrollPercentage((winScroll / height) * 100);
      } else {
        setScrollPercentage(0);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="fixed top-0 left-0 w-full h-1 bg-transparent z-50 pointer-events-none">
      <div
        className="h-full bg-gradient-to-r from-blue-600 via-amber-500 to-indigo-600 transition-all duration-150 ease-out shadow-sm shadow-blue-500/50"
        style={{ width: `${scrollPercentage}%` }}
      />
    </div>
  );
};
