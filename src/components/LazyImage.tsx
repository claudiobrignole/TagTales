import React, { useState, useEffect } from 'react';
import { getBustedUrl, isImagePreloaded, markImagePreloaded } from '../utils/cacheManager';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  wrapperClassName?: string;
}

export default function LazyImage({
  src,
  alt,
  className = '',
  wrapperClassName = '',
  loading = 'lazy',
  ...props
}: LazyImageProps) {
  const bustedSrc = getBustedUrl(src);
  const alreadyPreloaded = src ? isImagePreloaded(bustedSrc) : false;

  const [isLoaded, setIsLoaded] = useState(alreadyPreloaded);
  const [error, setError] = useState(false);

  if (!src) return null;

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-[#EAE3D9]/30 text-[#59554E] min-h-[100px] ${className}`}>
        <span className="text-[10px] font-bold font-['Karla'] uppercase tracking-widest opacity-60">Immagine non trovata</span>
      </div>
    );
  }

  const handleLoad = () => {
    markImagePreloaded(bustedSrc);
    setIsLoaded(true);
  };

  const handleError = () => {
    setError(true);
  };

  return (
    <div className={`relative overflow-hidden ${wrapperClassName || 'w-full h-full'}`}>
      {/* Elegant fade-out placeholder */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-[#EAE3D9]/50 animate-pulse flex items-center justify-center z-10 transition-opacity duration-300">
          <div className="w-6 h-6 border-2 border-t-[#FF4F00] border-[#FF4F00]/20 rounded-full animate-spin opacity-40" />
        </div>
      )}

      <img
        src={bustedSrc}
        alt={alt}
        className={`w-full h-full object-cover transition-all duration-700 ease-out select-none ${
          isLoaded ? 'opacity-100 scale-100 filter-none' : 'opacity-0 scale-105 blur-sm'
        } ${className}`}
        loading={loading}
        onLoad={handleLoad}
        onError={handleError}
        referrerPolicy="no-referrer"
        {...props}
      />
    </div>
  );
}
