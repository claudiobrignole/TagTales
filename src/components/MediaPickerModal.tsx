import React, { useState, useEffect, useMemo } from 'react';
import { X, Search, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { ADMIN_MODAL } from '../constants/theme';
import {
  getMediaLibraryItems,
  isVideoMediaUrl,
  type MediaLibraryItem,
} from '../utils/mediaLibraryCache';

interface MediaPickerModalProps {
  onSelect: (url: string) => void;
  onClose: () => void;
}

export default function MediaPickerModal({ onSelect, onClose }: MediaPickerModalProps) {
  const { t } = useTranslation();
  const [items, setItems] = useState<MediaLibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const next = await getMediaLibraryItems();
        if (!cancelled) setItems(next);
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) => i.fullPath.toLowerCase().includes(q));
  }, [items, searchQuery]);

  return (
    <div className={clsx(ADMIN_MODAL.backdropTop, "bg-black/60 backdrop-blur-sm")}>
      <div className={clsx("bg-[#F2EEE8] rounded-3xl flex flex-col shadow-2xl border border-[#EAE3D9] overflow-hidden", ADMIN_MODAL.panelWide)}>
        
        <div className="p-6 border-b border-[#EAE3D9] bg-white shrink-0">
          <div className="flex justify-between items-center mb-4">
             <h3 className="text-2xl font-['Shamgod'] uppercase tracking-tight text-[#121212]">
                Libreria Media
             </h3>
             <button type="button" onClick={onClose} className="p-2 hover:bg-[#F2EEE8] rounded-full transition-colors">
               <X size={24} />
             </button>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-[#EAE3D9] rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-[#FF4F00] focus:border-[#FF4F00] sm:text-sm transition-colors"
              placeholder="Cerca per nome file o percorso..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {!loading && (
            <p className="mt-2 text-[11px] font-['Karla'] text-[#59554E]">
              {filtered.length} media{items.length !== filtered.length ? ` (su ${items.length})` : ''} · cache 10 min
            </p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="w-8 h-8 text-[#FF4F00] animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filtered.map(item => (
                  <div 
                    key={item.fullPath} 
                    className="group relative aspect-square bg-[#EAE3D9] rounded-xl overflow-hidden shadow-sm cursor-pointer border-2 border-transparent hover:border-[#FF4F00] transition-colors"
                    onClick={() => onSelect(item.url)}
                  >
                     {isVideoMediaUrl(item.url) ? (
                       <video
                         src={item.url}
                         muted
                         playsInline
                         preload="metadata"
                         className="w-full h-full object-cover"
                         onMouseEnter={(e) => {
                           void e.currentTarget.play().catch(() => undefined);
                         }}
                         onMouseLeave={(e) => {
                           e.currentTarget.pause();
                           e.currentTarget.currentTime = 0;
                         }}
                       />
                     ) : (
                       <img
                         src={item.url}
                         alt={item.name}
                         loading="lazy"
                         decoding="async"
                         className="w-full h-full object-cover"
                       />
                     )}
                     <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                        <p className="text-[10px] text-white truncate px-1" title={item.fullPath}>{item.fullPath}</p>
                     </div>
                     <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="bg-[#FF4F00] text-white text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-full">Scegli</span>
                     </div>
                  </div>
              ))}
              {filtered.length === 0 && (
                  <div className="col-span-full py-10 text-center text-[#59554E] font-['Karla'] text-lg">
                     Nessun media trovato.
                  </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
