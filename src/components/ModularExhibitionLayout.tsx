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
  const [inquiryLink, setInquiryLink] = useState<string | null>(null);

  const getContactUrl = (type?: string, value?: string) => {
    if (!value) return null;
    if (type === 'email') return `mailto:${value}`;
    if (type === 'whatsapp') return `https://wa.me/${value.replace(/[^0-9]/g, '')}`;
    return value; // 'link' implicitly or fallback
  };

  const allImages = useMemo(() => {
    const images: {url: string, ecwidLink?: string, contactLink?: string, contactType?: string, fallbackUrl?: string, blockType: string, id: string}[] = [];
    if (!blocks) return images;
    blocks.forEach(block => {
      if (block.type === 'image_fullscreen' && block.images?.[0]?.url) {
        images.push({ url: block.images[0].url, ecwidLink: block.images[0].ecwidLink, contactType: block.images[0].contactType, contactLink: block.images[0].contactLink, fallbackUrl: block.images[0].fallbackUrl, blockType: block.type, id: `${block.id}_0` });
      } else if (block.type === 'images_side_by_side_aligned' || block.type === 'images_side_by_side_creative') {
        if (block.images?.[0]?.url) images.push({ url: block.images[0].url, ecwidLink: block.images[0].ecwidLink, contactType: block.images[0].contactType, contactLink: block.images[0].contactLink, fallbackUrl: block.images[0].fallbackUrl, blockType: block.type, id: `${block.id}_0` });
        if (block.images?.[1]?.url) images.push({ url: block.images[1].url, ecwidLink: block.images[1].ecwidLink, contactType: block.images[1].contactType, contactLink: block.images[1].contactLink, fallbackUrl: block.images[1].fallbackUrl, blockType: block.type, id: `${block.id}_1` });
      }
    });
    return images;
  }, [blocks]);

  const imageIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    allImages.forEach((img, index) => map.set(img.id, index));
    return map;
  }, [allImages]);

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

  return (
    <div className="w-full space-y-0">
      {blocks.map((block) => {
        // --- TEXT BLOCK (Quote) ---
        if (block.type === 'text') {
          const isBlack = block.backgroundColor === 'black';
          const alignment = block.alignment || 'left';
          return (
            <div 
              key={block.id} 
              className={clsx(
                "w-full px-[25px] md:px-[50px] py-16 md:py-24",
                isBlack ? "bg-[#121212] text-white" : "bg-[#F2EEE8] text-[#121212]"
              )}
            >
              <div className={clsx("max-w-4xl mx-auto flex flex-col w-full min-w-0", alignment === 'center' ? 'items-center' : alignment === 'right' ? 'items-end' : 'items-start')}>
                <div className={clsx("prose max-w-none w-full mx-auto break-words whitespace-pre-wrap prose-p:my-2 prose-p:leading-[1.4] prose-headings:my-4 prose-img:my-4 font-['Karla'] text-inherit text-[clamp(16px,2.5vw,28px)] font-medium leading-snug uppercase", isBlack ? "prose-invert text-white" : "")} dangerouslySetInnerHTML={{ __html: cleanHtml(getLocalizedField(block, 'text', lang) || block.text) }} />
              </div>
            </div>
          );
        }

        // --- PARAGRAPH BLOCK ---
        if (block.type === 'paragraph') {
          const isBlack = block.backgroundColor === 'black';
          const alignment = block.alignment || 'left';
          return (
            <div 
              key={block.id} 
              className={clsx(
                "w-full px-[25px] md:px-[50px] py-16 md:py-24 flex",
                alignment === 'center' ? 'justify-center' : alignment === 'right' ? 'justify-end' : 'justify-start',
                isBlack ? "bg-[#121212] text-white" : "bg-[#F2EEE8] text-[#121212]"
              )}
            >
              <div className={clsx("w-full max-w-4xl min-w-0", alignment === 'center' ? 'mx-auto' : alignment === 'right' ? 'ml-auto' : 'mr-auto')}>
                <div 
                  className={clsx("columns-1 md:columns-2 gap-8 text-lg leading-relaxed text-left font-['Karla'] font-normal prose max-w-none w-full mx-auto break-words whitespace-pre-wrap prose-p:my-2 prose-p:leading-[1.4] prose-headings:my-4 prose-img:my-4 text-inherit", isBlack ? "prose-invert text-white" : "")} 
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
          
          const currentIndex = imageIndexMap.get(`${block.id}_0`) ?? -1;
          
          return (
            <div key={block.id} className="w-full relative bg-[#121212] cursor-pointer" onClick={() => setLightboxIndex(currentIndex)}>
              {isVideo(img.url) ? (
                <video src={img.url} poster={img.fallbackUrl} autoPlay loop muted playsInline className="w-full h-auto" />
              ) : (
                <img src={img.url} alt="Mostra Fullscreen" className="w-full h-auto" />
              )}
              {(img.ecwidLink || img.contactLink) && (
                <div className="absolute bottom-6 right-6 z-10">
                  {img.ecwidLink ? (
                    <a 
                      href={img.ecwidLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex bg-white text-[#121212] px-6 py-3 rounded-full uppercase font-bold tracking-widest text-xs md:text-sm hover:bg-[#FF4F00] hover:text-white transition-colors shadow-md border-none"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {t('exhibition.buy', 'Acquista')}
                    </a>
                  ) : (
                    <button 
                      onClick={(e) => { e.stopPropagation(); setInquiryLink(getContactUrl(img.contactType, img.contactLink)); }}
                      className="inline-flex bg-white text-[#121212] px-6 py-3 rounded-full uppercase font-bold tracking-widest text-xs md:text-sm hover:bg-[#FF4F00] hover:text-white transition-colors shadow-md border-none"
                    >
                      {t('exhibitionInquiry.title', 'Richiedi info')}
                    </button>
                  )}
                </div>
              )}
              {img.caption && (
                <div className={clsx(
                  "absolute z-10 p-4 text-xs font-['Karla'] font-bold uppercase tracking-widest",
                  img.captionColor === 'black' ? 'text-[#121212]' : 'text-white',
                  (img.captionPosition || 'top-left') === 'bottom-left' ? 'bottom-0 left-0' : 'top-0 left-0'
                )}>
                  {getLocalizedField(img, 'caption', lang) || img.caption}
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
          
          const index1 = img1.url ? (imageIndexMap.get(`${block.id}_0`) ?? -1) : -1;
          const index2 = img2.url ? (imageIndexMap.get(`${block.id}_1`) ?? -1) : -1;
          
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
                {(img1.ecwidLink || img1.contactLink) && (
                  <div className="absolute bottom-6 right-6 z-10">
                     {img1.ecwidLink ? (
                      <a 
                        href={img1.ecwidLink} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex bg-white text-[#121212] px-6 py-3 rounded-full uppercase font-bold tracking-widest text-xs md:text-sm hover:bg-[#FF4F00] hover:text-white transition-colors shadow-md border-none"
                      >
                        {t('exhibition.buy', 'Acquista')}
                      </a>
                    ) : (
                      <button 
                         onClick={(e) => { e.stopPropagation(); setInquiryLink(getContactUrl(img1.contactType, img1.contactLink)); }}
                         className="inline-flex bg-white text-[#121212] px-6 py-3 rounded-full uppercase font-bold tracking-widest text-xs md:text-sm hover:bg-[#FF4F00] hover:text-white transition-colors shadow-md border-none"
                      >
                        {t('exhibitionInquiry.title', 'Richiedi info')}
                      </button>
                    )}
                  </div>
                )}
                {img1.caption && (
                  <div className={clsx(
                    "absolute z-10 p-4 text-xs font-['Karla'] font-bold uppercase tracking-widest",
                    img1.captionColor === 'black' ? 'text-[#121212]' : 'text-white',
                    (img1.captionPosition || 'top-left') === 'bottom-left' ? 'bottom-0 left-0' : 'top-0 left-0'
                  )}>
                    {getLocalizedField(img1, 'caption', lang) || img1.caption}
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
                {(img2.ecwidLink || img2.contactLink) && (
                  <div className="absolute bottom-6 right-6 z-10">
                     {img2.ecwidLink ? (
                      <a 
                        href={img2.ecwidLink} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex bg-white text-[#121212] px-6 py-3 rounded-full uppercase font-bold tracking-widest text-xs md:text-sm hover:bg-[#FF4F00] hover:text-white transition-colors shadow-md border-none"
                      >
                        {t('exhibition.buy', 'Acquista')}
                      </a>
                    ) : (
                      <button 
                         onClick={(e) => { e.stopPropagation(); setInquiryLink(getContactUrl(img2.contactType, img2.contactLink)); }}
                         className="inline-flex bg-white text-[#121212] px-6 py-3 rounded-full uppercase font-bold tracking-widest text-xs md:text-sm hover:bg-[#FF4F00] hover:text-white transition-colors shadow-md border-none"
                      >
                        {t('exhibitionInquiry.title', 'Richiedi info')}
                      </button>
                    )}
                  </div>
                )}
                {img2.caption && (
                  <div className={clsx(
                    "absolute z-10 p-4 text-xs font-['Karla'] font-bold uppercase tracking-widest",
                    img2.captionColor === 'black' ? 'text-[#121212]' : 'text-white',
                    (img2.captionPosition || 'top-left') === 'bottom-left' ? 'bottom-0 left-0' : 'top-0 left-0'
                  )}>
                    {getLocalizedField(img2, 'caption', lang) || img2.caption}
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

          const index1 = img1.url ? (imageIndexMap.get(`${block.id}_0`) ?? -1) : -1;
          const index2 = img2.url ? (imageIndexMap.get(`${block.id}_1`) ?? -1) : -1;

          return (
            <div 
              key={block.id} 
              className={clsx(
                "w-full px-[25px] md:px-[50px] py-16 md:py-32 flex justify-center",
                isBlack ? "bg-[#121212]" : "bg-[#F2EEE8]"
              )}
            >
              <div className="max-w-[85rem] w-full grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center md:items-start">
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
                  {(img1.ecwidLink || img1.contactLink) && (
                    <div className="absolute bottom-6 right-6 z-10">
                      {img1.ecwidLink ? (
                        <a 
                          href={img1.ecwidLink} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex bg-white text-[#121212] px-6 py-3 rounded-full uppercase font-bold tracking-widest text-xs md:text-sm hover:bg-[#FF4F00] hover:text-white transition-colors shadow-md border-none"
                        >
                          {t('exhibition.buy', 'Acquista')}
                        </a>
                      ) : (
                        <button 
                          onClick={(e) => { e.stopPropagation(); setInquiryLink(getContactUrl(img1.contactType, img1.contactLink)); }}
                          className="inline-flex bg-white text-[#121212] px-6 py-3 rounded-full uppercase font-bold tracking-widest text-xs md:text-sm hover:bg-[#FF4F00] hover:text-white transition-colors shadow-md border-none"
                        >
                          {t('exhibitionInquiry.title', 'Richiedi info')}
                        </button>
                      )}
                    </div>
                  )}
                  {img1.caption && (
                    <div className={clsx(
                      "absolute z-10 p-4 text-xs font-['Karla'] font-bold uppercase tracking-widest",
                      img1.captionColor === 'black' ? 'text-[#121212]' : 'text-white',
                      (img1.captionPosition || 'top-left') === 'bottom-left' ? 'bottom-0 left-0' : 'top-0 left-0'
                    )}>
                      {getLocalizedField(img1, 'caption', lang) || img1.caption}
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
                  {(img2.ecwidLink || img2.contactLink) && (
                    <div className="absolute bottom-6 right-6 z-10">
                      {img2.ecwidLink ? (
                        <a 
                          href={img2.ecwidLink} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex bg-white text-[#121212] px-6 py-3 rounded-full uppercase font-bold tracking-widest text-xs md:text-sm hover:bg-[#FF4F00] hover:text-white transition-colors shadow-md border-none"
                        >
                          {t('exhibition.buy', 'Acquista')}
                        </a>
                      ) : (
                        <button 
                          onClick={(e) => { e.stopPropagation(); setInquiryLink(getContactUrl(img2.contactType, img2.contactLink)); }}
                          className="inline-flex bg-white text-[#121212] px-6 py-3 rounded-full uppercase font-bold tracking-widest text-xs md:text-sm hover:bg-[#FF4F00] hover:text-white transition-colors shadow-md border-none"
                        >
                          {t('exhibitionInquiry.title', 'Richiedi info')}
                        </button>
                      )}
                    </div>
                  )}
                  {img2.caption && (
                    <div className={clsx(
                      "absolute z-10 p-4 text-xs font-['Karla'] font-bold uppercase tracking-widest",
                      img2.captionColor === 'black' ? 'text-[#121212]' : 'text-white',
                      (img2.captionPosition || 'top-left') === 'bottom-left' ? 'bottom-0 left-0' : 'top-0 left-0'
                    )}>
                      {getLocalizedField(img2, 'caption', lang) || img2.caption}
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
             {(allImages[lightboxIndex].ecwidLink || allImages[lightboxIndex].contactLink) && (
               <div className="mt-6">
                 {allImages[lightboxIndex].ecwidLink ? (
                   <a 
                     href={allImages[lightboxIndex].ecwidLink}
                     target="_blank"
                     rel="noopener noreferrer"
                     className="inline-flex bg-[#FF4F00] text-white px-8 py-4 rounded-full uppercase font-bold tracking-widest text-sm hover:bg-white hover:text-[#FF4F00] transition-colors shadow-lg"
                   >
                     {t('exhibition.buy', 'Acquista')}
                   </a>
                 ) : (
                   <button 
                     onClick={(e) => { 
                       e.stopPropagation(); 
                       setInquiryLink(getContactUrl(allImages[lightboxIndex].contactType, allImages[lightboxIndex].contactLink)); 
                     }}
                     className="inline-flex bg-[#FF4F00] text-white px-8 py-4 rounded-full uppercase font-bold tracking-widest text-sm hover:bg-white hover:text-[#FF4F00] transition-colors shadow-lg"
                   >
                     {lang === 'EN' ? 'Info Request' : 'Richiedi info'}
                   </button>
                 )}
               </div>
             )}
          </div>
        </div>
      )}
      {/* Inquiry Modal */}
      {inquiryLink && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setInquiryLink(null)}>
          <div className="bg-[#F2EEE8] text-[#121212] p-8 max-w-md w-full rounded-xl shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
            <button className="absolute top-4 right-4 text-[#121212] hover:text-[#FF4F00]" onClick={() => setInquiryLink(null)}><X size={24} /></button>
            <h3 className="text-xl font-['Karla'] font-bold mb-4 uppercase">
              {t('exhibitionInquiry.title', 'Richiedi info')}
            </h3>
            <p className="mb-6 font-['Karla'] text-sm leading-relaxed">
              {t('exhibitionInquiry.desc', 'Questa opera è venduta direttamente dall\'artista; richiedi informazioni direttamente a lui o a un suo rappresentante')}
            </p>
            <a 
              href={inquiryLink}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-[#FF4F00] text-white text-center py-3 rounded-full font-bold uppercase tracking-widest text-sm hover:bg-[#121212] transition-colors"
              onClick={() => setInquiryLink(null)}
            >
              {t('exhibitionInquiry.btn', 'Contatta')}
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
