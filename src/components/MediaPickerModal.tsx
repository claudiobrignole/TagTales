import React, { useState, useEffect } from 'react';
import { storage } from '../firebase';
import { ref, listAll, getDownloadURL } from 'firebase/storage';
import { X, Search, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface MediaItem {
  url: string;
  name: string;
  fullPath: string;
}

interface MediaPickerModalProps {
  onSelect: (url: string) => void;
  onClose: () => void;
}

export default function MediaPickerModal({ onSelect, onClose }: MediaPickerModalProps) {
  const { t } = useTranslation();
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Common folders
  const targetFolders = ['uploads', 'exhibition-blocks', 'page-blocks', 'profiles', 'exhibitions', 'opere', 'writers', 'articles'];

  useEffect(() => {
    fetchMedia();
  }, []);

  const fetchMedia = async () => {
    setLoading(true);
    try {
      let fetchedItems: MediaItem[] = [];

      const fetchFolder = async (folderPath: string) => {
        const folderRef = ref(storage, folderPath);
        try {
          const res = await listAll(folderRef);
          
          for (const itemRef of res.items) {
            try {
              const url = await getDownloadURL(itemRef);
              fetchedItems.push({
                url,
                name: itemRef.name,
                fullPath: itemRef.fullPath
              });
            } catch(e) {}
          }
          
          for (const prefixRef of res.prefixes) {
            await fetchFolder(prefixRef.fullPath);
          }
        } catch (e) {}
      };

      for (const folder of targetFolders) {
         await fetchFolder(folder);
      }

      setItems(fetchedItems.sort((a,b) => a.name.localeCompare(b.name)));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 md:p-8">
      <div className="bg-[#F2EEE8] rounded-3xl w-full max-w-5xl max-h-full flex flex-col shadow-2xl border border-[#EAE3D9] overflow-hidden">
        
        <div className="p-6 border-b border-[#EAE3D9] bg-white shrink-0">
          <div className="flex justify-between items-center mb-4">
             <h3 className="text-2xl font-['Shamgod'] uppercase tracking-tight text-[#121212]">
                Libreria Media
             </h3>
             <button onClick={onClose} className="p-2 hover:bg-[#F2EEE8] rounded-full transition-colors">
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
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="w-8 h-8 text-[#FF4F00] animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {items
                .filter(i => i.fullPath.toLowerCase().includes(searchQuery.toLowerCase()))
                .map(item => (
                  <div 
                    key={item.fullPath} 
                    className="group relative aspect-square bg-[#EAE3D9] rounded-xl overflow-hidden shadow-sm cursor-pointer border-2 border-transparent hover:border-[#FF4F00] transition-colors"
                    onClick={() => onSelect(item.url)}
                  >
                     {item.url.match(/\.(mp4|webm|mov|m4v)(\?.*)?$/i) ? (
                       <video src={item.url} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                     ) : (
                       <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                     )}
                     <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                        <p className="text-[10px] text-white truncate px-1" title={item.fullPath}>{item.fullPath}</p>
                     </div>
                     <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="bg-[#FF4F00] text-white text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-full">Scegli</span>
                     </div>
                  </div>
              ))}
              {items.length === 0 && (
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
