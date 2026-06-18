import React from 'react';
import { EyeOff } from 'lucide-react';

export default function PreviewBanner() {
  return (
    <div className="bg-[#121212] text-white py-3 px-4 text-center text-sm font-['Karla'] border-b border-[#FF4F00]/30">
      <span className="inline-flex items-center gap-2 font-bold uppercase tracking-wider">
        <EyeOff size={16} className="text-[#FF4F00]" />
        Anteprima privata — non indicizzata
      </span>
    </div>
  );
}
