import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { isVideo } from "../utils/isVideo";

interface ImageSlideshowProps {
  images: string[];
  index: number | null;
  onClose: () => void;
  onChange: (index: number) => void;
  altPrefix?: string;
}

export default function ImageSlideshow({
  images,
  index,
  onClose,
  onChange,
  altPrefix = "Immagine",
}: ImageSlideshowProps) {
  useEffect(() => {
    if (index === null) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (images.length < 2) return;
      if (event.key === "ArrowLeft") onChange((index - 1 + images.length) % images.length);
      if (event.key === "ArrowRight") onChange((index + 1) % images.length);
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [images.length, index, onChange, onClose]);

  if (index === null || !images[index] || typeof document === "undefined") return null;

  const current = images[index];
  const shift = (delta: number) => onChange((index + delta + images.length) % images.length);

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Galleria"
    >
      <button
        type="button"
        className="absolute top-6 right-6 z-10 text-white hover:text-[#FF4F00]"
        onClick={onClose}
        aria-label="Chiudi"
      >
        <X size={32} />
      </button>
      {images.length > 1 && (
        <>
          <button
            type="button"
            className="absolute left-4 z-10 p-2 text-white hover:text-[#FF4F00] md:left-8"
            onClick={(event) => {
              event.stopPropagation();
              shift(-1);
            }}
            aria-label="Immagine precedente"
          >
            <ChevronLeft size={40} />
          </button>
          <button
            type="button"
            className="absolute right-4 z-10 p-2 text-white hover:text-[#FF4F00] md:right-8"
            onClick={(event) => {
              event.stopPropagation();
              shift(1);
            }}
            aria-label="Immagine successiva"
          >
            <ChevronRight size={40} />
          </button>
        </>
      )}
      <div
        className="relative flex max-h-full max-w-full flex-col items-center justify-center p-4 md:p-16"
        onClick={(event) => event.stopPropagation()}
      >
        {isVideo(current) ? (
          <video
            src={current}
            controls
            autoPlay
            playsInline
            className="max-h-[85vh] max-w-full object-contain shadow-2xl"
          />
        ) : (
          <img
            src={current}
            alt={`${altPrefix} ${index + 1}`}
            className="max-h-[85vh] max-w-full object-contain shadow-2xl"
          />
        )}
        {images.length > 1 && (
          <p className="mt-4 font-['Karla'] text-sm font-bold uppercase tracking-widest text-white/80">
            {index + 1} / {images.length}
          </p>
        )}
      </div>
    </div>,
    document.body,
  );
}
