import React from 'react';

export default function ComingSoon() {
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
