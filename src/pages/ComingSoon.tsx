import React, { useEffect } from 'react';

export default function ComingSoon() {
  useEffect(() => {
    if (typeof (window as any).gtag === 'function') {
      (window as any).gtag('event', 'page_view', { page_path: '/coming-soon' });
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F2EEE8]">
      <div className="flex flex-col items-center">
        <img 
          src="/TagTales-tagline-medium.png" 
          alt="TagTales Logo" 
          className="max-w-[300px] w-full h-auto mb-8"
        />
        <h1 className="font-['Shamgod'] text-4xl md:text-6xl text-[#121212] uppercase">
          Coming Soon
        </h1>
      </div>
    </div>
  );
}
