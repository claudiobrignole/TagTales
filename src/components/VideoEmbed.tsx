import React from 'react';

interface VideoEmbedProps {
  url: string;
}

const VideoEmbed: React.FC<VideoEmbedProps> = ({ url }) => {
  const getEmbedUrl = (url: string) => {
    // YouTube
    const ytMatch = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=)?(.+)/);
    if (ytMatch) {
      const id = ytMatch[1].split('&')[0];
      return `https://www.youtube.com/embed/${id}`;
    }
    
    // Vimeo
    const vimeoMatch = url.match(/(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:\w+\/)?|album\/(?:\d+)\/video\/|video\/|)(\d+)(?:$|\/|\?)/);
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }

    return url; // Fallback to original url if already an embed or unknown
  };

  const embedUrl = getEmbedUrl(url);

  return (
    <div className="relative w-full aspect-video overflow-hidden rounded-2xl bg-black">
      <iframe
        src={embedUrl}
        className="absolute inset-0 w-full h-full border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
};

export default VideoEmbed;
