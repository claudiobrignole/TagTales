import React from 'react';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { ExhibitionBlock } from './AdminExhibitionBlocksEditor';
import VideoEmbed from './VideoEmbed';
import { getLocalizedField } from '../utils/localization';
import { cleanHtml } from '../utils/cleanHtml';

interface Props {
  blocks: ExhibitionBlock[];
}

export default function ModularExhibitionLayout({ blocks }: Props) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  if (!blocks || blocks.length === 0) return null;

  return (
    <div className="w-full mt-16 space-y-0">
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
          
          return (
            <div key={block.id} className="w-full relative h-[60vh] md:h-[100svh] bg-[#121212]">
              <img 
                src={img.url} 
                alt="Mostra Fullscreen" 
                className="w-full h-full object-cover"
              />
              {img.ecwidLink && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity">
                  <a 
                    href={img.ecwidLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary"
                  >
                    Acquista Opera
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
          
          return (
            <div 
              key={block.id} 
              className={clsx(
                "w-full flex flex-col md:flex-row h-auto md:h-[80vh] gap-[15px] md:gap-[25px] p-[15px] md:p-[25px]",
                isBlack ? "bg-[#121212]" : "bg-[#F2EEE8]"
              )}
            >
              {/* Image 1 */}
              <div className="w-full md:w-1/2 relative h-[50vh] md:h-full group bg-black/5">
                {img1.url && (
                  <img src={img1.url} alt="Mostra 1" className="w-full h-full object-cover" />
                )}
                {img1.ecwidLink && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a href={img1.ecwidLink} target="_blank" rel="noopener noreferrer" className="btn-primary bg-white text-black px-6 py-3 rounded-full uppercase font-bold tracking-widest text-sm hover:bg-[#FF4F00] hover:text-white transition-colors">
                      Acquista
                    </a>
                  </div>
                )}
              </div>
              {/* Image 2 */}
              <div className="w-full md:w-1/2 relative h-[50vh] md:h-full group bg-black/5">
                {img2.url && (
                  <img src={img2.url} alt="Mostra 2" className="w-full h-full object-cover" />
                )}
                {img2.ecwidLink && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a href={img2.ecwidLink} target="_blank" rel="noopener noreferrer" className="btn-primary bg-white text-black px-6 py-3 rounded-full uppercase font-bold tracking-widest text-sm hover:bg-[#FF4F00] hover:text-white transition-colors">
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

          return (
            <div 
              key={block.id} 
              className={clsx(
                "w-full px-[25px] md:px-[50px] py-16 md:py-32 flex justify-center",
                isBlack ? "bg-[#121212]" : "bg-[#F2EEE8]"
              )}
            >
              <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center">
                <div className="md:-mt-24 relative group">
                  {img1.url && (
                    <img src={img1.url} alt="Mostra Creative 1" className="w-full aspect-[4/5] object-cover" />
                  )}
                  {img1.ecwidLink && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                      <a href={img1.ecwidLink} target="_blank" rel="noopener noreferrer" className="btn-primary bg-white text-black px-6 py-3 rounded-full uppercase font-bold tracking-widest text-sm hover:bg-[#FF4F00] hover:text-white transition-colors">
                        Acquista
                      </a>
                    </div>
                  )}
                </div>
                <div className="md:mt-24 relative group">
                  {img2.url && (
                    <img src={img2.url} alt="Mostra Creative 2" className="w-full aspect-[4/5] object-cover" />
                  )}
                  {img2.ecwidLink && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                      <a href={img2.ecwidLink} target="_blank" rel="noopener noreferrer" className="btn-primary bg-white text-black px-6 py-3 rounded-full uppercase font-bold tracking-widest text-sm hover:bg-[#FF4F00] hover:text-white transition-colors">
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
    </div>
  );
}
