import React, { useState } from 'react';
import { Play } from 'lucide-react';

interface VideoEmbedProps {
  url: string;
}

const VideoEmbed: React.FC<VideoEmbedProps> = ({ url }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const getYoutubeId = (url: string) => {
    const ytMatch = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=)?([^&\s\?]+)/);
    return ytMatch ? ytMatch[1].split('&')[0] : null;
  };

  const getVimeoId = (url: string) => {
    const vimeoMatch = url.match(/(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:\w+\/)?|album\/(?:\d+)\/video\/|video\/|)(\d+)(?:$|\/|\?)/);
    return vimeoMatch ? vimeoMatch[1] : null;
  };

  const ytId = getYoutubeId(url);
  const vimeoId = getVimeoId(url);

  const getEmbedUrl = () => {
    if (ytId) {
      return `https://www.youtube.com/embed/${ytId}?autoplay=1`;
    }
    if (vimeoId) {
      return `https://player.vimeo.com/video/${vimeoId}?autoplay=1`;
    }
    return url.includes('?') ? `${url}&autoplay=1` : `${url}?autoplay=1`;
  };

  // If we have a YouTube id, we can use the high-quality YouTube poster thumbnail
  const thumbnailUrl = ytId 
    ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`
    : null;

  if (isPlaying) {
    return (
      <div className="relative w-full aspect-video overflow-hidden rounded-2xl bg-black">
        <iframe
          src={getEmbedUrl()}
          className="absolute inset-0 w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div 
      onClick={() => setIsPlaying(true)}
      className="relative w-full aspect-video overflow-hidden rounded-2xl bg-[#121212] group cursor-pointer select-none"
    >
      {thumbnailUrl ? (
        <>
          <img 
            src={thumbnailUrl} 
            alt="Video Preview" 
            className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-75 transition-opacity duration-300"
            loading="lazy"
          />
          {/* Subtle vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
        </>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-gradient-to-br from-[#1E1C1A]/90 to-[#0A0A0A]/95 border border-white/5 rounded-2xl">
          <span className="font-['Shamgod'] text-white/40 tracking-widest text-lg mb-2">TAG TALES VIDEO</span>
        </div>
      )}

      {/* Big beautiful Play Button Overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-[#FF4F00] text-white flex items-center justify-center shadow-xl shadow-[#FF4F00]/20 transform group-hover:scale-110 active:scale-95 transition-all duration-300">
          <Play size={32} className="fill-current ml-1" />
        </div>
      </div>
    </div>
  );
};

export default VideoEmbed;
