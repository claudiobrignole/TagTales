import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { ExhibitionBlock } from './AdminExhibitionBlocksEditor';
import VideoEmbed from './VideoEmbed';
import ImageWatermarkOverlay, {
  resolveExhibitionImageSrc,
  resolveWatermarkMode,
} from './ImageWatermarkOverlay';
import { getLocalizedField } from '../utils/localization';
import { cleanHtml } from '../utils/cleanHtml';
import { hasEcwidLinks, normalizeEcwidLinks, type EcwidStoreLink } from '../utils/ecwidStoreLinks';
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
      ecwidLinks?: EcwidStoreLink[];
      contactLink?: string;
      contactType?: string;
      fallbackUrl?: string;
      blockType: string;
      id: string;
      isLimitedEdition?: boolean;
      limitedEditionQuantity?: number;
      isSold?: boolean;
      watermarkEnabled?: boolean;
      watermarkMode?: 'both' | 'text' | 'logo';
    }[] = [];
    if (!blocks) return images;
    blocks.forEach(block => {
      if (!block) return;
      if (block.hidden) return; // Skip hidden blocks
      if (block.type === 'image_fullscreen' && block.images?.[0]?.url) {
        images.push({ 
          url: block.images[0].url, 
          ecwidLink: block.images[0].ecwidLink,
          ecwidLinks: block.images[0].ecwidLinks,
          contactType: block.images[0].contactType, 
          contactLink: block.images[0].contactLink, 
          fallbackUrl: block.images[0].fallbackUrl, 
          blockType: block.type, 
          id: `${block.id}_0`,
          isLimitedEdition: block.images[0].isLimitedEdition,
          limitedEditionQuantity: block.images[0].limitedEditionQuantity,
          isSold: block.images[0].isSold,
          watermarkEnabled: block.images[0].watermarkEnabled,
          watermarkMode: block.images[0].watermarkMode,
        });
      } else if (
        block.type === 'images_side_by_side_aligned' ||
        block.type === 'images_side_by_side_creative' ||
        block.type === 'images_grid_4'
      ) {
        (block.images || []).forEach((img, idx) => {
          if (!img?.url) return;
          images.push({
            url: img.url,
            ecwidLink: img.ecwidLink,
            ecwidLinks: img.ecwidLinks,
            contactType: img.contactType,
            contactLink: img.contactLink,
            fallbackUrl: img.fallbackUrl,
            blockType: block.type,
            id: `${block.id}_${idx}`,
            isLimitedEdition: img.isLimitedEdition,
            limitedEditionQuantity: img.limitedEditionQuantity,
            isSold: img.isSold,
            watermarkEnabled: img.watermarkEnabled,
            watermarkMode: img.watermarkMode,
          });
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

  const captionPositionClass = (position?: string) =>
    position === 'top-right' ? 'top-0 right-0 text-right' : 'top-0 left-0';

  const renderMedia = (
    img: {
      url?: string;
      fallbackUrl?: string;
      watermarkEnabled?: boolean;
      watermarkMode?: 'both' | 'text' | 'logo';
    },
    className: string,
    alt: string,
  ) => {
    if (!img.url) return null;
    if (isVideo(img.url)) {
      return (
        <video
          src={img.url}
          poster={img.fallbackUrl}
          autoPlay
          loop
          muted
          playsInline
          className={className}
        />
      );
    }
    const originalUrl = img.url;
    const watermarkMode = resolveWatermarkMode(img);
    return (
      <>
        <img
          src={resolveExhibitionImageSrc(img)}
          alt={alt}
          className={className}
          onError={(e) => {
            const el = e.currentTarget;
            if (el.src !== originalUrl) {
              el.src = originalUrl;
            }
          }}
        />
        {watermarkMode && <ImageWatermarkOverlay mode={watermarkMode} />}
      </>
    );
  };

  const getButtonText = (img: any, isBuyButton: boolean, link?: EcwidStoreLink) => {
    if (img.isSold) {
      return t('exhibition.sold', 'Venduto');
    }
    if (isBuyButton && link) {
      const custom = getLocalizedField(link, 'label', lang);
      if (custom) return custom;
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

  const hasImageActions = (img: {
    ecwidLink?: string;
    ecwidLinks?: EcwidStoreLink[];
    contactLink?: string;
    isSold?: boolean;
  }) => img.isSold || hasEcwidLinks(img) || !!img.contactLink;

  const renderImageAction = (
    img: {
      ecwidLink?: string;
      ecwidLinks?: EcwidStoreLink[];
      contactLink?: string;
      contactType?: string;
      isSold?: boolean;
      isLimitedEdition?: boolean;
      limitedEditionQuantity?: number;
    },
    variant: "overlay" | "lightbox" = "overlay",
  ) => {
    if (!img.isSold && !hasEcwidLinks(img) && !img.contactLink) return null;

    if (img.isSold) {
      return (
        <span className={variant === "lightbox" ? lightboxSoldBadgeClass : soldBadgeClass}>
          {getButtonText(img, false)}
        </span>
      );
    }

    const btnClass = variant === "lightbox" ? lightboxActionBtnClass : actionBtnClass;
    const links = normalizeEcwidLinks(img);

    if (links.length > 0) {
      return (
        <div className="flex flex-col items-end gap-2">
          {links.map((link, i) => (
            <a
              key={`${link.url}-${i}`}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className={btnClass}
            >
              {getButtonText(img, true, link)}
            </a>
          ))}
        </div>
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

  const galleryGapTypes = new Set([
    'images_side_by_side_aligned',
    'images_grid_4',
  ]);

  const getGallerySpacingClass = (blockIndex: number) => {
    const prevVisible = [...blocks.slice(0, blockIndex)]
      .reverse()
      .find((b) => b && !b.hidden);
    const prevIsGalleryGap = Boolean(
      prevVisible && galleryGapTypes.has(prevVisible.type),
    );
    // Same step as horizontal gap between squares (15 / 25).
    // Skip top padding when previous block is also a gallery row to avoid double spacing.
    return clsx(
      "pb-[15px] md:pb-[25px]",
      !prevIsGalleryGap && "pt-[15px] md:pt-[25px]",
    );
  };

  return (
    <div className="w-full space-y-0">
      {blocks.map((block, blockIndex) => {
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
              <div className={clsx(
                "max-w-4xl mx-auto flex flex-col w-full min-w-0",
                alignment === 'center' ? 'items-center' : alignment === 'right' ? 'items-end' : 'items-start',
              )}>
                <div
                  className={clsx(
                    "prose max-w-none w-full break-words whitespace-pre-wrap prose-p:my-2 prose-p:leading-[1.4] prose-headings:my-4 prose-img:my-4 font-['Karla'] text-inherit text-[clamp(16px,2.5vw,28px)] font-medium leading-snug uppercase",
                    alignment === 'center' ? 'text-center mx-auto [&_p]:text-center [&_h1]:text-center [&_h2]:text-center [&_h3]:text-center [&_h4]:text-center' : alignment === 'right' ? 'text-right ml-auto [&_p]:text-right [&_h1]:text-right [&_h2]:text-right [&_h3]:text-right [&_h4]:text-right' : 'text-left mr-auto',
                    isBlack ? "prose-invert text-white" : "",
                  )}
                  dangerouslySetInnerHTML={{ __html: cleanHtml(getLocalizedField(block, 'text', lang) || block.text) }}
                />
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
                  className={clsx(
                    "columns-1 md:columns-2 gap-8 text-lg leading-relaxed font-['Karla'] font-normal prose max-w-none w-full break-words whitespace-pre-wrap prose-p:my-2 prose-p:leading-[1.4] prose-headings:my-4 prose-img:my-4 text-inherit text-left [&_p]:text-left [&_h1]:text-left [&_h2]:text-left [&_h3]:text-left [&_h4]:text-left",
                    isBlack ? "prose-invert text-white" : "",
                  )} 
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
              {renderMedia(img, "w-full h-auto", "Mostra Fullscreen")}
              {hasImageActions(img) && (
                <div className="absolute bottom-6 right-6 z-10">
                  {renderImageAction(img)}
                </div>
              )}
              {img.caption && (
                <div className={clsx(
                  "absolute z-10 p-4 text-xs font-['Karla'] font-bold uppercase tracking-widest",
                  img.captionColor === 'black' ? 'text-[#121212]' : 'text-white',
                  captionPositionClass(img.captionPosition)
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
                "w-full flex flex-col md:flex-row h-auto gap-[15px] md:gap-[25px] px-[25px] md:px-[50px]",
                getGallerySpacingClass(blockIndex),
                isBlack ? "bg-[#121212]" : "bg-[#F2EEE8]"
              )}
            >
              {/* Image 1 */}
              <div 
                className={clsx("w-full md:w-1/2 relative bg-black/5", img1.url ? "cursor-pointer" : "")} 
                onClick={img1.url ? () => setLightboxIndex(index1) : undefined}
              >
                {renderMedia(img1, "w-full h-auto", "Mostra 1")}
                {hasImageActions(img1) && (
                  <div className="absolute bottom-6 right-6 z-10">
                    {renderImageAction(img1)}
                  </div>
                )}
                {img1.caption && (
                  <div className={clsx(
                    "absolute z-10 p-4 text-xs font-['Karla'] font-bold uppercase tracking-widest",
                    img1.captionColor === 'black' ? 'text-[#121212]' : 'text-white',
                    captionPositionClass(img1.captionPosition)
                  )}>
                    {getLocalizedField(img1, 'caption', lang) || img1.caption}
                  </div>
                )}
              </div>
              {/* Image 2 */}
              <div 
                className={clsx("w-full md:w-1/2 relative bg-black/5", img2.url ? "cursor-pointer" : "")} 
                onClick={img2.url ? () => setLightboxIndex(index2) : undefined}
              >
                {renderMedia(img2, "w-full h-auto", "Mostra 2")}
                {hasImageActions(img2) && (
                  <div className="absolute bottom-6 right-6 z-10">
                    {renderImageAction(img2)}
                  </div>
                )}
                {img2.caption && (
                  <div className={clsx(
                    "absolute z-10 p-4 text-xs font-['Karla'] font-bold uppercase tracking-widest",
                    img2.captionColor === 'black' ? 'text-[#121212]' : 'text-white',
                    captionPositionClass(img2.captionPosition)
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
                  {renderMedia(img1, "w-full h-auto object-cover", "Mostra Creative 1")}
                  {hasImageActions(img1) && (
                    <div className="absolute bottom-6 right-6 z-10">
                      {renderImageAction(img1)}
                    </div>
                  )}
                  {img1.caption && (
                    <div className={clsx(
                      "absolute z-10 p-4 text-xs font-['Karla'] font-bold uppercase tracking-widest",
                      img1.captionColor === 'black' ? 'text-[#121212]' : 'text-white',
                      captionPositionClass(img1.captionPosition)
                    )}>
                      {getLocalizedField(img1, 'caption', lang) || img1.caption}
                    </div>
                  )}
                </div>
                <div 
                  className={clsx("md:mt-24 relative block w-full", img2.url ? "cursor-pointer" : "")} 
                  onClick={img2.url ? () => setLightboxIndex(index2) : undefined}
                >
                  {renderMedia(img2, "w-full h-auto object-cover", "Mostra Creative 2")}
                  {hasImageActions(img2) && (
                    <div className="absolute bottom-6 right-6 z-10">
                      {renderImageAction(img2)}
                    </div>
                  )}
                  {img2.caption && (
                    <div className={clsx(
                      "absolute z-10 p-4 text-xs font-['Karla'] font-bold uppercase tracking-widest",
                      img2.captionColor === 'black' ? 'text-[#121212]' : 'text-white',
                      captionPositionClass(img2.captionPosition)
                    )}>
                      {getLocalizedField(img2, 'caption', lang) || img2.caption}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        }

        // --- FOUR SQUARE IMAGES GRID ---
        if (block.type === 'images_grid_4') {
          const isBlack = block.backgroundColor === 'black';
          const slots = [0, 1, 2, 3].map((idx) => ({
            img: block.images?.[idx] || { url: '' },
            index: block.images?.[idx]?.url
              ? (imageIndexMap.get(`${block.id}_${idx}`) ?? -1)
              : -1,
          }));

          return (
            <div
              key={block.id}
              className={clsx(
                "w-full px-[25px] md:px-[50px]",
                getGallerySpacingClass(blockIndex),
                isBlack ? "bg-[#121212]" : "bg-[#F2EEE8]",
              )}
            >
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-[15px] md:gap-[25px]">
                {slots.map(({ img, index }, slotIdx) => (
                  <div
                    key={`${block.id}_${slotIdx}`}
                    className={clsx(
                      "relative w-full aspect-square bg-black/5 overflow-hidden",
                      img.url ? "cursor-pointer" : "",
                    )}
                    onClick={img.url && index >= 0 ? () => setLightboxIndex(index) : undefined}
                  >
                    {renderMedia(img, "w-full h-full object-cover", `Mostra grid ${slotIdx + 1}`)}
                    {hasImageActions(img) && (
                      <div className="absolute bottom-3 right-3 md:bottom-6 md:right-6 z-10">
                        {renderImageAction(img)}
                      </div>
                    )}
                    {img.caption && (
                      <div
                        className={clsx(
                          "absolute z-10 p-3 md:p-4 text-[10px] md:text-xs font-['Karla'] font-bold uppercase tracking-widest",
                          img.captionColor === 'black' ? 'text-[#121212]' : 'text-white',
                          captionPositionClass(img.captionPosition),
                        )}
                      >
                        {getLocalizedField(img, 'caption', lang) || img.caption}
                      </div>
                    )}
                  </div>
                ))}
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
               <div className="relative max-w-full max-h-[85vh]">
                 <img 
                   src={resolveExhibitionImageSrc(allImages[lightboxIndex])} 
                   className="max-w-full max-h-[85vh] object-contain shadow-2xl"
                   alt=""
                   onError={(e) => {
                     const originalUrl = allImages[lightboxIndex].url;
                     const el = e.currentTarget;
                     if (el.src !== originalUrl) {
                       el.src = originalUrl;
                     }
                   }}
                 />
                 {resolveWatermarkMode(allImages[lightboxIndex]) && (
                   <ImageWatermarkOverlay mode={resolveWatermarkMode(allImages[lightboxIndex])!} />
                 )}
               </div>
             )}
             {hasImageActions(allImages[lightboxIndex]) && (
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

