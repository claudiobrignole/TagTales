import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db, storage } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { ref, listAll, getDownloadURL, deleteObject } from 'firebase/storage';
import { Film, Folder, Download, Trash2, ArrowLeft } from 'lucide-react';
import { useI18n } from '../contexts/I18nContext';

export default function AdminVideos() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [folders, setFolders] = useState<string[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [videos, setVideos] = useState<{name: string, url: string, fullPath: string}[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const fetchFolders = async () => {
      try {
        const listRef = ref(storage, 'videos');
        
        // Add a timeout to listAll to prevent hanging
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Storage request timed out')), 10000)
        );
        
        const res = await Promise.race([
          listAll(listRef),
          timeoutPromise
        ]) as any;
        
        if (isMounted) {
          setFolders(res.prefixes.map((folderRef: any) => folderRef.name));
        }
      } catch (err: any) {
        console.error("Error fetching folders:", err);
        if (isMounted) {
          if (err.message === 'Storage request timed out') {
            setError(t('adminVideos.connectionError'));
          } else {
            setError(`${t('adminVideos.loadError')} ${err.message}`);
          }
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    const checkAdmin = async () => {
      if (!user) {
        if (isMounted) setLoading(false);
        return;
      }
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const role = userDoc.data()?.role;
        if (role === 'admin' || user.email?.toLowerCase() === 'claudio@brignole.ch') {
          if (isMounted) setIsAdmin(true);
          await fetchFolders();
        } else {
          if (isMounted) setLoading(false);
        }
      } catch (err) {
        console.error("Error checking admin:", err);
        if (isMounted) setLoading(false);
      }
    };

    checkAdmin();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const fetchVideosInFolder = async (folderName: string) => {
    setLoading(true);
    setCurrentFolder(folderName);
    try {
      const listRef = ref(storage, `videos/${folderName}`);
      const res = await listAll(listRef);
      
      const videoList = await Promise.all(res.items.map(async (itemRef) => {
        const url = await getDownloadURL(itemRef);
        return {
          name: itemRef.name,
          url,
          fullPath: itemRef.fullPath
        };
      }));
      
      setVideos(videoList);
    } catch (err: any) {
      console.error("Error fetching videos:", err);
      setError('Failed to load videos.');
    } finally {
      setLoading(false);
    }
  };

  const [deletingVideo, setDeletingVideo] = useState<string | null>(null);

  const handleDeleteVideo = async () => {
    if (!deletingVideo) return;
    
    try {
      const videoRef = ref(storage, deletingVideo);
      await deleteObject(videoRef);
      
      // Refresh video list
      if (currentFolder) {
        fetchVideosInFolder(currentFolder);
      }
    } catch (err: any) {
      console.error("Error deleting video:", err);
      setError('Failed to delete video.');
    } finally {
      setDeletingVideo(null);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full">{t('common.loading')}</div>;
  }

  if (!isAdmin) {
    return <div className="text-center p-8 text-red-500">{t('adminVideos.accessDenied')}</div>;
  }

  return (
    <div className="space-y-8 font-['Karla']">
      <header className="mb-10">
        <h1 className="text-4xl md:text-6xl font-['Shamgod'] leading-[0.8] tracking-tight text-[#121212] mb-4 uppercase">
          {t('adminVideos.title')}
        </h1>
        <p className="text-[#59554E] text-lg">
          {t('adminVideos.subtitle')}
        </p>
      </header>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200">
          {error}
        </div>
      )}

      {!currentFolder ? (
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-[#EAE3D9]">
          <h2 className="text-xl font-bold text-[#121212] mb-6">{t('adminVideos.artistFolders')}</h2>
          {folders.length === 0 ? (
            <p className="text-[#59554E]">{t('adminVideos.noFolders')}</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {folders.map(folder => (
                <button
                  key={folder}
                  onClick={() => fetchVideosInFolder(folder)}
                  className="flex items-center gap-4 p-6 bg-[#F2EEE8] hover:bg-[#EAE3D9] rounded-2xl transition-colors text-left"
                >
                  <Folder size={32} className="text-[#FF4F00]" />
                  <span className="font-bold text-[#121212] truncate">{folder}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-[#EAE3D9]">
          <div className="flex items-center gap-4 mb-6">
            <button 
              onClick={() => {
                setCurrentFolder(null);
                setVideos([]);
              }}
              className="p-2 hover:bg-[#F2EEE8] rounded-full transition-colors"
            >
              <ArrowLeft size={24} className="text-[#59554E]" />
            </button>
            <h2 className="text-xl font-bold text-[#121212] flex items-center gap-2">
              <Folder size={24} className="text-[#FF4F00]" />
              {currentFolder}
            </h2>
          </div>

          {videos.length === 0 ? (
            <p className="text-[#59554E]">{t('adminVideos.noVideos')}</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {videos.map(video => (
                <div key={video.fullPath} className="bg-[#F2EEE8] rounded-2xl overflow-hidden border border-[#EAE3D9]">
                  <div className="aspect-video bg-black flex items-center justify-center relative group">
                    <video 
                      src={video.url} 
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                      controls
                    />
                  </div>
                  <div className="p-4">
                    <p className="font-bold text-sm text-[#121212] truncate mb-4" title={video.name}>
                      {video.name}
                    </p>
                    <div className="flex justify-between items-center">
                      <a 
                        href={video.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                        className="flex items-center gap-2 text-sm font-bold text-[#FF4F00] hover:underline"
                      >
                        <Download size={16} /> {t('adminVideos.download')}
                      </a>
                      <button 
                        onClick={() => setDeletingVideo(video.fullPath)}
                        className="flex items-center gap-2 text-sm font-bold text-red-600 hover:underline"
                      >
                        <Trash2 size={16} /> {t('adminVideos.delete')}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingVideo && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative">
            <h2 className="text-2xl font-bold text-[#121212] mb-4">{t('adminVideos.deleteTitle')}</h2>
            <p className="text-[#59554E] mb-8">{t('adminVideos.deleteConfirm')}</p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setDeletingVideo(null)}
                className="px-6 py-3 font-bold text-[#59554E] hover:bg-[#F2EEE8] rounded-full transition-all"
              >
                {t('common.cancel')}
              </button>
              <button 
                onClick={handleDeleteVideo}
                className="px-6 py-3 font-bold text-white bg-red-600 hover:bg-red-700 rounded-full transition-all"
              >
                {t('adminVideos.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
