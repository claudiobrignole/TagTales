import React, { useState, useEffect } from 'react';
import { storage } from '../firebase';
import { ref, listAll, getDownloadURL, deleteObject } from 'firebase/storage';
import { useTranslation } from 'react-i18next';
import { ImageIcon, Trash2, Search, Loader2, UploadCloud, X } from 'lucide-react';
import ImageUpload from '../components/ImageUpload';

interface MediaItem {
  url: string;
  name: string;
  fullPath: string;
}

export default function AdminMedia() {
  const { t } = useTranslation();
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [showUpload, setShowUpload] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');

  const targetFolders = ['uploads', 'exhibition-blocks', 'page-blocks', 'profiles', 'exhibitions', 'opere', 'writers', 'articles'];

  useEffect(() => {
    fetchMedia();
  }, []);

  const fetchMedia = async () => {
    setLoading(true);
    setError(null);
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
            } catch(e) {
               console.warn("Could not get URL for", itemRef.fullPath);
            }
          }
          
          for (const prefixRef of res.prefixes) {
            await fetchFolder(prefixRef.fullPath);
          }
        } catch (e) {
           console.warn("Could not list path", folderPath, e);
        }
      };

      for (const folder of targetFolders) {
         await fetchFolder(folder);
      }

      setItems(fetchedItems.sort((a,b) => a.name.localeCompare(b.name)));
    } catch (err: any) {
      setError(err.message || 'Errore durante il caricamento dei media');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteObject(ref(storage, deleteConfirm));
      setItems(prev => prev.filter(i => i.fullPath !== deleteConfirm));
    } catch (e: any) {
      console.error(e);
      alert("Errore: " + e.message); // Not standard, but fallback
    } finally {
      setDeleteConfirm(null);
    }
  };

  return (
      <div className="w-full space-y-8">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl md:text-6xl font-['Shamgod'] uppercase leading-[0.8] tracking-normal text-[#121212] mb-4">
            {t('nav.mediaLibrary', 'Libreria Media')}
          </h1>
          <p className="text-[#59554E] mt-2 font-['Karla']">
            {t('adminMedia.manageImages', 'Gestisci tutte le immagini caricate sulla piattaforma.')}
          </p>
        </div>
        <button
           onClick={() => setShowUpload(!showUpload)}
           className="bg-[#121212] text-white px-6 py-3 rounded-full font-bold uppercase tracking-widest text-sm hover:bg-[#FF4F00] transition-colors flex items-center gap-2"
        >
          {showUpload ? <X size={20} /> : <UploadCloud size={20} />}
          {showUpload ? t('adminMedia.close', 'Chiudi') : t('adminMedia.uploadMedia', 'Carica Media')}
        </button>
      </div>

      <div className="relative mb-6 max-w-sm">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-2 border border-[#EAE3D9] rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-[#FF4F00] focus:border-[#FF4F00] sm:text-sm transition-colors"
          placeholder={t('adminMedia.searchPlaceholder', 'Cerca per nome file o percorso...')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

       {showUpload && (
          <div className="bg-white p-6 rounded-3xl border border-[#EAE3D9]">
             <ImageUpload 
               label={t('adminMedia.uploadIndependent', "Carica un file multimediale indipendente in archivio")}
               value=""
               onChange={(url) => { 
                  if(url) { 
                     setShowUpload(false); 
                     fetchMedia(); 
                  } 
               }}
             />
          </div>
       )}

       {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 text-[#FF4F00] animate-spin" />
          </div>
        ) : error ? (
           <div className="text-red-500 bg-red-50 p-4 rounded-xl">{error}</div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {items
              .filter(i => i.fullPath.toLowerCase().includes(searchQuery.toLowerCase()))
              .map(item => (
                <div key={item.fullPath} className="group relative aspect-square bg-[#EAE3D9] rounded-xl overflow-hidden shadow-sm">
                   {item.url.match(/\.(mp4|webm|mov|m4v)(\?.*)?$/i) ? (
                     <video src={item.url} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                   ) : (
                     <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                   )}
                   <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                      <p className="text-[10px] text-white truncate px-1" title={item.fullPath}>{item.fullPath}</p>
                   </div>
                   <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                       <button onClick={() => window.open(item.url, '_blank')} className="p-3 bg-white rounded-full hover:bg-gray-200 transition-transform hover:scale-110">
                          <Search size={18} className="text-[#121212]" />
                       </button>
                       <button onClick={() => setDeleteConfirm(item.fullPath)} className="p-3 bg-red-500 rounded-full hover:bg-red-600 transition-transform hover:scale-110 text-white">
                          <Trash2 size={18} />
                       </button>
                   </div>
                </div>
            ))}
            {items.length === 0 && (
                <div className="col-span-full py-10 text-center text-[#59554E] font-['Karla'] text-lg">
                   {t('adminMedia.noMedia', "Nessun media trovato nell'archivio.")}
                </div>
            )}
          </div>
        )}

      {/* Media Delete Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full border border-[#EAE3D9] shadow-xl">
            <h3 className="text-2xl font-['Shamgod'] uppercase tracking-tight text-[#121212] mb-4">{t('adminMedia.confirmDelete', 'Conferma Eliminazione')}</h3>
            <p className="text-[#59554E] mb-8 font-['Karla']">
              {t('adminMedia.deleteWarning', "Sei sicuro di voler eliminare permanentemente questa immagine? L'operazione non può essere annullata. Se l'immagine è usata in mostre o pagine, non sarà più visibile.")}
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-3 px-4 rounded-full font-bold uppercase tracking-widest text-[#121212] border-2 border-[#EAE3D9] hover:border-[#121212] transition-colors text-sm"
              >
                {t('adminMedia.cancel', 'Annulla')}
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-3 px-4 rounded-full font-bold uppercase tracking-widest text-white bg-red-500 hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20 text-sm"
              >
                {t('adminMedia.delete', 'Elimina')}
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
  );
}
