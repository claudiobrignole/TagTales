import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { ExhibitionBlock } from './AdminExhibitionBlocksEditor';
import VideoEmbed from './VideoEmbed';
import { getLocalizedField } from '../utils/localization';
import { cleanHtml } from '../utils/cleanHtml';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  blocks: ExhibitionBlock[];
}

export default function ModularExhibitionLayout({ blocks }: Props) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const allImages = useMemo(() => {
    const images: {url: string, ecwidLink?: string, fallbackUrl?: string, blockType: string}[] = [];
    if (!blocks) return images;
    blocks.forEach(block => {
      if (block.type === 'image_fullscreen' && block.images?.[0]?.url) {
        images.push({ url: block.images[0].url, ecwidLink: block.images[0].ecwidLink, fallbackUrl: block.images[0].fallbackUrl, blockType: block.type });
      } else if (block.type === 'images_side_by_side_aligned' || block.type === 'images_side_by_side_creative') {
        if (block.images?.[0]?.url) images.push({ url: block.images[0].url, ecwidLink: block.images[0].ecwidLink, fallbackUrl: block.images[0].fallbackUrl, blockType: block.type });
        if (block.images?.[1]?.url) images.push({ url: block.images[1].url, ecwidLink: block.images[1].ecwidLink, fallbackUrl: block.images[1].fallbackUrl, blockType: block.type });
      }
    });
    return images;
  }, [blocks]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxIndex === null) return;
      if (e.key === 'Escape') setLightboxIndex(null);
      if (e.key === 'ArrowLeft') setLightboxIndex(prev => (prev! - 1 + allImages.length) % allImages.length);
      if (e.key === 'ArrowRight') setLightboxIndex(prev => (prev! + 1) % allImages.length);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, allImages.length]);

  const isVideo = (url: string) => url.match(/\.(mp4|webm|mov|m4v)(\?.*)?$/i) !== null;

  if (!blocks || blocks.length === 0) return null;

  let imageCounter = 0;

  return (
    <div className="w-full space-y-0">
      {blocks.map((block) => {
        // --- TEXT BLOCK (Quote) ---
        if (block.type === 'text') {
          const isBlack = block.backgroundColor === 'black';
          return (
            <div 
              key={block.id} 
              className={clsx(
                "w-full px-[25px] md:px-[50px] py-16 md:py-24",
                isBlack ? "bg-[#121212] text-white" : "bg-[#F2EEE8] text-[#121212]"
              )}
            >
              <div className="max-w-4xl mx-auto flex flex-col items-center text-center w-full min-w-0">
                <div className="prose max-w-none w-full mx-auto break-words whitespace-pre-wrap prose-p:my-2 prose-p:leading-relaxed font-['Karla'] text-inherit text-[clamp(16px,2.5vw,28px)] font-medium leading-snug uppercase" dangerouslySetInnerHTML={{ __html: cleanHtml(getLocalizedField(block, 'text', lang) || block.text) }} />
              </div>
            </div>
          );
        }

        // --- PARAGRAPH BLOCK ---
        if (block.type === 'paragraph') {
          const isBlack = block.backgroundColor === 'black';
          return (
            <div 
              key={block.id} 
              className={clsx(
                "w-full px-[25px] md:px-[50px] py-16 md:py-24 flex justify-end",
                isBlack ? "bg-[#121212] text-white" : "bg-[#F2EEE8] text-[#121212]"
              )}
            >
              <div className="w-full max-w-4xl min-w-0">
                <div 
                  className="columns-1 md:columns-2 gap-8 text-lg leading-relaxed text-left font-['Karla'] font-normal prose max-w-none w-full mx-auto break-words whitespace-pre-wrap prose-p:my-2 prose-p:leading-relaxed text-inherit" 
                  dangerouslySetInnerHTML={{ __html: cleanHtml(getLocalizedField(block, 'text', lang) || block.text) }} 
                />
              </div>
            </div>
          );
        }

        // --- FULLSCREEN IMAGE ---
        if (block.type === 'image_fullscreen') {
          const img = block.images?.[0];
          if (!img || !img.url) return null;
          
          const currentIndex = imageCounter++;
          
          return (
            <div key={block.id} className="w-full relative h-[60vh] md:h-[100svh] bg-[#121212] cursor-pointer" onClick={() => setLightboxIndex(currentIndex)}>
              {isVideo(img.url) ? (
                <video src={img.url} poster={img.fallbackUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
              ) : (
                <img src={img.url} alt="Mostra Fullscreen" className="w-full h-full object-cover" />
              )}
              {img.ecwidLink && (
                <div className="absolute bottom-6 right-6 z-10">
                  <a 
                    href={img.ecwidLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex bg-white text-[#121212] px-6 py-3 rounded-full uppercase font-bold tracking-widest text-xs md:text-sm hover:bg-[#FF4F00] hover:text-white transition-colors shadow-md border-none"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Acquista
                  </a>
                </div>
              )}
            </div>
          );
        }

        // --- VIDEO EMBED ---
        if (block.type === 'video_embed') {
          if (!block.videoUrl) return null;
          const isBlack = block.backgroundColor === 'black';

          return (
            <div 
              key={block.id} 
              className={clsx(
                "w-full px-[25px] md:px-[50px] py-16 md:py-24",
                isBlack ? "bg-[#121212]" : "bg-[#F2EEE8]"
              )}
            >
              <div className="max-w-6xl mx-auto">
                <VideoEmbed url={block.videoUrl} />
              </div>
            </div>
          );
        }

        // --- TWO IMAGES ALIGNED ---
        if (block.type === 'images_side_by_side_aligned') {
          const img1 = block.images?.[0] || { url: '' };
          const img2 = block.images?.[1] || { url: '' };
          const isBlack = block.backgroundColor === 'black';
          
          const index1 = img1.url ? imageCounter++ : -1;
          const index2 = img2.url ? imageCounter++ : -1;
          
          return (
            <div 
              key={block.id} 
              className={clsx(
                "w-full flex flex-col md:flex-row h-auto md:h-[80vh] gap-[15px] md:gap-[25px] p-[15px] md:p-[25px]",
                isBlack ? "bg-[#121212]" : "bg-[#F2EEE8]"
              )}
            >
              {/* Image 1 */}
              <div 
                className={clsx("w-full md:w-1/2 relative h-[50vh] md:h-full bg-black/5", img1.url ? "cursor-pointer" : "")} 
                onClick={img1.url ? () => setLightboxIndex(index1) : undefined}
              >
                {img1.url && (
                  isVideo(img1.url) ? (
                    <video src={img1.url} poster={img1.fallbackUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                  ) : (
                    <img src={img1.url} alt="Mostra 1" className="w-full h-full object-cover" />
                  )
                )}
                {img1.ecwidLink && (
                  <div className="absolute bottom-6 right-6 z-10">
                    <a 
                      href={img1.ecwidLink} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex bg-white text-[#121212] px-6 py-3 rounded-full uppercase font-bold tracking-widest text-xs md:text-sm hover:bg-[#FF4F00] hover:text-white transition-colors shadow-md border-none"
                    >
                      Acquista
                    </a>
                  </div>
                )}
              </div>
              {/* Image 2 */}
              <div 
                className={clsx("w-full md:w-1/2 relative h-[50vh] md:h-full bg-black/5", img2.url ? "cursor-pointer" : "")} 
                onClick={img2.url ? () => setLightboxIndex(index2) : undefined}
              >
                {img2.url && (
                  isVideo(img2.url) ? (
                    <video src={img2.url} poster={img2.fallbackUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                  ) : (
                    <img src={img2.url} alt="Mostra 2" className="w-full h-full object-cover" />
                  )
                )}
                {img2.ecwidLink && (
                  <div className="absolute bottom-6 right-6 z-10">
                    <a 
                      href={img2.ecwidLink} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex bg-white text-[#121212] px-6 py-3 rounded-full uppercase font-bold tracking-widest text-xs md:text-sm hover:bg-[#FF4F00] hover:text-white transition-colors shadow-md border-none"
                    >
                      Acquista
                    </a>
                  </div>
                )}
              </div>
            </div>
          );
        }

        // --- TWO IMAGES CREATIVE (Staggered) ---
        if (block.type === 'images_side_by_side_creative') {
          const img1 = block.images?.[0] || { url: '' };
          const img2 = block.images?.[1] || { url: '' };
          const isBlack = block.backgroundColor === 'black';

          const index1 = img1.url ? imageCounter++ : -1;
          const index2 = img2.url ? imageCounter++ : -1;

          return (
            <div 
              key={block.id} 
              className={clsx(
                "w-full px-[25px] md:px-[50px] py-16 md:py-32 flex justify-center",
                isBlack ? "bg-[#121212]" : "bg-[#F2EEE8]"
              )}
            >
              <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center">
                <div 
                  className={clsx("md:-mt-24 relative block w-full", img1.url ? "cursor-pointer" : "")} 
                  onClick={img1.url ? () => setLightboxIndex(index1) : undefined}
                >
                  {img1.url && (
                    isVideo(img1.url) ? (
                      <video src={img1.url} poster={img1.fallbackUrl} autoPlay loop muted playsInline className="w-full aspect-[4/5] object-cover" />
                    ) : (
                      <img src={img1.url} alt="Mostra Creative 1" className="w-full aspect-[4/5] object-cover" />
                    )
                  )}
                  {img1.ecwidLink && (
                    <div className="absolute bottom-6 right-6 z-10">
                      <a 
                        href={img1.ecwidLink} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex bg-white text-[#121212] px-6 py-3 rounded-full uppercase font-bold tracking-widest text-xs md:text-sm hover:bg-[#FF4F00] hover:text-white transition-colors shadow-md border-none"
                      >
                        Acquista
                      </a>
                    </div>
                  )}
                </div>
                <div 
                  className={clsx("md:mt-24 relative block w-full", img2.url ? "cursor-pointer" : "")} 
                  onClick={img2.url ? () => setLightboxIndex(index2) : undefined}
                >
                  {img2.url && (
                    isVideo(img2.url) ? (
                      <video src={img2.url} poster={img2.fallbackUrl} autoPlay loop muted playsInline className="w-full aspect-[4/5] object-cover" />
                    ) : (
                      <img src={img2.url} alt="Mostra Creative 2" className="w-full aspect-[4/5] object-cover" />
                    )
                  )}
                  {img2.ecwidLink && (
                    <div className="absolute bottom-6 right-6 z-10">
                      <a 
                        href={img2.ecwidLink} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex bg-white text-[#121212] px-6 py-3 rounded-full uppercase font-bold tracking-widest text-xs md:text-sm hover:bg-[#FF4F00] hover:text-white transition-colors shadow-md border-none"
                      >
                        Acquista
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        }

        return null;
      })}

      {/* Lightbox */}
      {lightboxIndex !== null && allImages[lightboxIndex] && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 md:p-12" onClick={() => setLightboxIndex(null)}>
          {/* Close button */}
          <button 
            className="absolute top-6 right-6 md:top-10 md:right-10 text-white hover:text-[#FF4F00] transition-colors z-[110] p-4 cursor-pointer"
            onClick={() => setLightboxIndex(null)}
          >
            <X size={32} />
          </button>
          
          {/* Prev button */}
          {allImages.length > 1 && (
            <button 
              className="absolute left-4 md:left-10 top-1/2 -translate-y-1/2 text-white hover:text-[#FF4F00] transition-colors z-[110] p-4 cursor-pointer"
              onClick={(e) => { e.stopPropagation(); setLightboxIndex(prev => (prev! - 1 + allImages.length) % allImages.length); }}
            >
              <ChevronLeft size={48} />
            </button>
          )}

          {/* Next button */}
          {allImages.length > 1 && (
            <button 
              className="absolute right-4 md:right-10 top-1/2 -translate-y-1/2 text-white hover:text-[#FF4F00] transition-colors z-[110] p-4 cursor-pointer"
              onClick={(e) => { e.stopPropagation(); setLightboxIndex(prev => (prev! + 1) % allImages.length); }}
            >
              <ChevronRight size={48} />
            </button>
          )}

          {/* Image */}
          <div className="relative max-w-full max-h-full flex flex-col items-center justify-center p-4 md:p-12" onClick={(e) => e.stopPropagation()}>
             {isVideo(allImages[lightboxIndex].url) ? (
               <video 
                 src={allImages[lightboxIndex].url}
                 poster={allImages[lightboxIndex].fallbackUrl}
                 controls
                 autoPlay
                 playsInline
                 className="max-w-full max-h-[85vh] object-contain shadow-2xl"
               />
             ) : (
               <img 
                 src={allImages[lightboxIndex].url} 
                 className="max-w-full max-h-[85vh] object-contain shadow-2xl"
                 alt=""
               />
             )}
             {allImages[lightboxIndex].ecwidLink && (
               <a 
                 href={allImages[lightboxIndex].ecwidLink}
                 target="_blank"
                 rel="noopener noreferrer"
                 className="mt-6 inline-flex bg-[#FF4F00] text-white px-8 py-4 rounded-full uppercase font-bold tracking-widest text-sm hover:bg-white hover:text-[#FF4F00] transition-colors shadow-lg"
               >
                 {t('exhibition.buy', 'Acquista')}
               </a>
             )}
          </div>
        </div>
      )}
    </div>
  );
}
