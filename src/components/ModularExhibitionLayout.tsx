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
    const images: {
      url: string;
      ecwidLink?: string;
      contactLink?: string;
      contactType?: string;
      fallbackUrl?: string;
      blockType: string;
      id: string;
      isLimitedEdition?: boolean;
      limitedEditionQuantity?: number;
      isSold?: boolean;
    }[] = [];
    if (!blocks) return images;
    blocks.forEach(block => {
      if (!block) return;
      if (block.hidden) return; // Skip hidden blocks
      if (block.type === 'image_fullscreen' && block.images?.[0]?.url) {
        images.push({ 
          url: block.images[0].url, 
          ecwidLink: block.images[0].ecwidLink, 
          contactType: block.images[0].contactType, 
          contactLink: block.images[0].contactLink, 
          fallbackUrl: block.images[0].fallbackUrl, 
          blockType: block.type, 
          id: `${block.id}_0`,
          isLimitedEdition: block.images[0].isLimitedEdition,
          limitedEditionQuantity: block.images[0].limitedEditionQuantity,
          isSold: block.images[0].isSold,
        });
      } else if (block.type === 'images_side_by_side_aligned' || block.type === 'images_side_by_side_creative') {
        if (block.images?.[0]?.url) images.push({ 
          url: block.images[0].url, 
          ecwidLink: block.images[0].ecwidLink, 
          contactType: block.images[0].contactType, 
          contactLink: block.images[0].contactLink, 
          fallbackUrl: block.images[0].fallbackUrl, 
          blockType: block.type, 
          id: `${block.id}_0`,
          isLimitedEdition: block.images[0].isLimitedEdition,
          limitedEditionQuantity: block.images[0].limitedEditionQuantity,
          isSold: block.images[0].isSold,
        });
        if (block.images?.[1]?.url) images.push({ 
          url: block.images[1].url, 
          ecwidLink: block.images[1].ecwidLink, 
          contactType: block.images[1].contactType, 
          contactLink: block.images[1].contactLink, 
          fallbackUrl: block.images[1].fallbackUrl, 
          blockType: block.type, 
          id: `${block.id}_1`,
          isLimitedEdition: block.images[1].isLimitedEdition,
          limitedEditionQuantity: block.images[1].limitedEditionQuantity,
          isSold: block.images[1].isSold,
        });
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

  const getButtonText = (img: any, isBuyButton: boolean) => {
    if (img.isSold) {
      return t('exhibition.sold', 'Venduto');
    }
    if (img.isLimitedEdition) {
      const qty = img.limitedEditionQuantity !== undefined ? img.limitedEditionQuantity : 0;
      return t('exhibition.limitedEdition', {
        qty,
        defaultValue: lang && lang.toUpperCase() === 'EN'
          ? `Limited edition: ${qty} available`
          : `Edizione Limitata: ${qty} disponibili`,
      });
    }
    if (isBuyButton) {
      return t('exhibition.buy', 'Acquista');
    }
    return t('exhibition.originalRequestInfo', 'Opera originale: richiedi info');
  };

  const actionBtnClass =
    "inline-flex bg-white/70 backdrop-blur-sm text-[#121212] px-4 py-2 md:px-6 md:py-3 rounded-full uppercase font-bold tracking-widest text-[10px] md:text-sm hover:bg-[#FF4F00] hover:text-white transition-colors shadow-none md:shadow-md border border-white/20 md:border-none";
  const soldBadgeClass =
    "inline-flex bg-[#FF4F00] text-white px-4 py-2 md:px-6 md:py-3 rounded-full uppercase font-['Karla'] font-bold tracking-widest text-[10px] md:text-sm shadow-none md:shadow-md pointer-events-none";
  const lightboxSoldBadgeClass =
    "inline-flex bg-[#FF4F00] text-white px-8 py-4 rounded-full uppercase font-['Karla'] font-bold tracking-widest text-sm shadow-lg pointer-events-none";
  const lightboxActionBtnClass =
    "inline-flex bg-[#FF4F00] text-white px-8 py-4 rounded-full uppercase font-bold tracking-widest text-sm hover:bg-white hover:text-[#FF4F00] transition-colors shadow-lg";

  const renderImageAction = (
    img: {
      ecwidLink?: string;
      contactLink?: string;
      contactType?: string;
      isSold?: boolean;
      isLimitedEdition?: boolean;
      limitedEditionQuantity?: number;
    },
    variant: "overlay" | "lightbox" = "overlay",
  ) => {
    if (!img.isSold && !img.ecwidLink && !img.contactLink) return null;

    if (img.isSold) {
      return (
        <span className={variant === "lightbox" ? lightboxSoldBadgeClass : soldBadgeClass}>
          {getButtonText(img, false)}
        </span>
      );
    }

    const btnClass = variant === "lightbox" ? lightboxActionBtnClass : actionBtnClass;

    if (img.ecwidLink) {
      return (
        <a
          href={img.ecwidLink}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className={btnClass}
        >
          {getButtonText(img, true)}
        </a>
      );
    }

    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setInquiryLink(getContactUrl(img.contactType, img.contactLink));
        }}
        className={btnClass}
      >
        {getButtonText(img, false)}
      </button>
    );
  };

  if (!blocks || blocks.length === 0) return null;

  return (
    <div className="w-full space-y-0">
      {blocks.map((block) => {
        if (!block) return null;
        if (block.hidden) return null; // Skip rendering hidden blocks completely

        // --- TEXT BLOCK (Quote) ---
        if (block.type === 'text') {
          const isBlack = block.backgroundColor === 'black';
          const alignment = block.alignment || 'left';
          return (
            <div 
              key={block.id} 
              className={clsx(
                "w-full px-[25px] md:px-[50px] py-[50px]",
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
                "w-full px-[25px] md:px-[50px] py-[50px] flex",
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
              {(img.isSold || img.ecwidLink || img.contactLink) && (
                <div className="absolute bottom-6 right-6 z-10">
                  {renderImageAction(img)}
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
                "w-full px-[25px] md:px-[50px] py-[50px]",
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
                "w-full flex flex-col md:flex-row h-auto gap-[15px] md:gap-[25px] px-[25px] md:px-[50px] py-[35px]",
                isBlack ? "bg-[#121212]" : "bg-[#F2EEE8]"
              )}
            >
              {/* Image 1 */}
              <div 
                className={clsx("w-full md:w-1/2 relative bg-black/5 aspect-square", img1.url ? "cursor-pointer" : "")} 
                onClick={img1.url ? () => setLightboxIndex(index1) : undefined}
              >
                {img1.url && (
                  isVideo(img1.url) ? (
                    <video src={img1.url} poster={img1.fallbackUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                  ) : (
                    <img src={img1.url} alt="Mostra 1" className="w-full h-full object-cover" />
                  )
                )}
                {(img1.isSold || img1.ecwidLink || img1.contactLink) && (
                  <div className="absolute bottom-6 right-6 z-10">
                    {renderImageAction(img1)}
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
                className={clsx("w-full md:w-1/2 relative bg-black/5 aspect-square", img2.url ? "cursor-pointer" : "")} 
                onClick={img2.url ? () => setLightboxIndex(index2) : undefined}
              >
                {img2.url && (
                  isVideo(img2.url) ? (
                    <video src={img2.url} poster={img2.fallbackUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                  ) : (
                    <img src={img2.url} alt="Mostra 2" className="w-full h-full object-cover" />
                  )
                )}
                {(img2.isSold || img2.ecwidLink || img2.contactLink) && (
                  <div className="absolute bottom-6 right-6 z-10">
                    {renderImageAction(img2)}
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
                "w-full px-[25px] md:px-[50px] pt-[80px] md:pt-[150px] pb-[50px] md:pb-[100px] flex justify-center",
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
                      <video src={img1.url} poster={img1.fallbackUrl} autoPlay loop muted playsInline className="w-full h-auto object-cover" />
                    ) : (
                      <img src={img1.url} alt="Mostra Creative 1" className="w-full h-auto object-cover" />
                    )
                  )}
                  {(img1.isSold || img1.ecwidLink || img1.contactLink) && (
                    <div className="absolute bottom-6 right-6 z-10">
                      {renderImageAction(img1)}
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
                      <video src={img2.url} poster={img2.fallbackUrl} autoPlay loop muted playsInline className="w-full h-auto object-cover" />
                    ) : (
                      <img src={img2.url} alt="Mostra Creative 2" className="w-full h-auto object-cover" />
                    )
                  )}
                  {(img2.isSold || img2.ecwidLink || img2.contactLink) && (
                    <div className="absolute bottom-6 right-6 z-10">
                      {renderImageAction(img2)}
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

      {/* LIGHTBOX */}
      {lightboxIndex !== null && allImages[lightboxIndex] && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center" onClick={() => setLightboxIndex(null)}>
          <button className="absolute top-6 right-6 text-white hover:text-[#FF4F00] z-10" onClick={() => setLightboxIndex(null)}>
            <X size={32} />
          </button>
          <button 
            className="absolute left-4 md:left-8 text-white hover:text-[#FF4F00] z-10 p-2"
            onClick={(e) => { e.stopPropagation(); setLightboxIndex(prev => (prev! - 1 + allImages.length) % allImages.length); }}
          >
            <ChevronLeft size={40} />
          </button>
          <button 
            className="absolute right-4 md:right-8 text-white hover:text-[#FF4F00] z-10 p-2"
            onClick={(e) => { e.stopPropagation(); setLightboxIndex(prev => (prev! + 1) % allImages.length); }}
          >
            <ChevronRight size={40} />
          </button>
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
             {(allImages[lightboxIndex].isSold || allImages[lightboxIndex].ecwidLink || allImages[lightboxIndex].contactLink) && (
               <div className="mt-6">
                 {renderImageAction(allImages[lightboxIndex], "lightbox")}
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

