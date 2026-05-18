import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, addDoc, orderBy, deleteDoc } from 'firebase/firestore';
import { Search, ExternalLink, Plus, X, Trash2, Video, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { sendEmailNotification } from '../utils/emailService';
import { createNotification } from '../utils/notificationService';
import { useI18n } from '../contexts/I18nContext';
import { format, parseISO } from 'date-fns';

export default function Artworks() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [artworks, setArtworks] = useState<any[]>([]);
  const [writers, setWriters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [filter, setFilter] = useState('all');

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newArtwork, setNewArtwork] = useState({ title: '', writerId: '', driveLink: '' });
  const [writerSearch, setWriterSearch] = useState('');
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userRole = userDoc.data()?.role;
        const adminStatus = userRole === 'admin' || user.email?.toLowerCase() === 'claudio@brignole.ch';
        setIsAdmin(adminStatus);

        let q;
        if (adminStatus) {
          q = query(collection(db, 'opere'), orderBy('createdAt', 'desc'));
        } else {
          q = query(collection(db, 'opere'), where('artistaId', '==', user.uid), orderBy('createdAt', 'desc'));
        }
        
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
        
        let writersData: any[] = [];
        if (adminStatus) {
          const usersQ = query(collection(db, 'users'), where('role', 'in', ['writer', 'artist']));
          const usersSnapshot = await getDocs(usersQ);
          writersData = usersSnapshot.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
          setWriters(writersData);
        }

        const enrichedData = data.map(item => {
          let wName = item.writerName;
          if (!wName && adminStatus) {
            const writer = writersData.find(w => w.id === item.artistaId);
            wName = writer?.fullName || writer?.artistName || writer?.email || 'Unknown Writer';
          }
          return { ...item, writerName: wName };
        });

        setArtworks(enrichedData);
      } catch (error) {
        console.error("Error fetching media deliveries:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleStatusChange = async (artworkId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'opere', artworkId), {
        statoApprovazione: newStatus,
        updatedAt: new Date().toISOString()
      });
      
      setArtworks(prev => prev.map(a => 
        a.id === artworkId ? { ...a, statoApprovazione: newStatus } : a
      ));

      // Optional: notification logic here
    } catch (err: any) {
      console.error("Error updating status:", err);
      alert('Errore durante l\'aggiornamento dello stato.');
    }
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      await deleteDoc(doc(db, 'opere', itemToDelete));
      setArtworks(prev => prev.filter(c => c.id !== itemToDelete));
    } catch (error) {
      console.error("Error deleting artwork:", error);
      alert('Errore durante l\'eliminazione.');
    } finally {
      setItemToDelete(null);
    }
  };

  const handleCreateDriveLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newArtwork.driveLink || !newArtwork.writerId || !newArtwork.title) return;

    setUploading(true);
    try {
      const payload = {
        artistaId: newArtwork.writerId,
        titolo: newArtwork.title,
        driveLink: newArtwork.driveLink,
        statoApprovazione: 'in_attesa',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      const docRef = await addDoc(collection(db, 'opere'), payload);
      
      const writer = writers.find(a => a.id === newArtwork.writerId);
      const newEntry = { 
        id: docRef.id, 
        ...payload,
        writerName: writer?.fullName || writer?.artistName || writer?.email || 'Unknown Writer'
      };

      if (writer?.email) {
        await sendEmailNotification(writer.email, 'new_media_link', { 
          title: newArtwork.title,
          userId: newArtwork.writerId
        });
      }

      await createNotification(
        newArtwork.writerId,
        "Nuovo Link Drive Creato",
        `Puoi caricare il tuo materiale audio/video per "${newArtwork.title}".`,
        'artwork_mod_requested',
        '/artworks'
      );

      setArtworks([newEntry, ...artworks]);
      setShowUploadModal(false);
      setNewArtwork({ title: '', writerId: '', driveLink: '' });
    } catch (error) {
      console.error("Error creating drive item:", error);
      alert('Errore durante il salvataggio.');
    } finally {
      setUploading(false);
    }
  };

  const getStatusLabel = (status: string) => {
    return t(`artworks.statusLabels.${status}`) || status || t('artworks.statusLabels.in_attesa');
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_attesa': return 'bg-yellow-100 text-yellow-700';
      case 'prima_revisione': return 'bg-orange-100 text-orange-700';
      case 'seconda_revisione': return 'bg-purple-100 text-purple-700';
      case 'terza_revisione': return 'bg-blue-100 text-blue-700';
      case 'approvata': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const statuses = ['in_attesa', 'prima_revisione', 'seconda_revisione', 'terza_revisione', 'approvata'];

  const filteredArtworks = artworks.filter(art => {
    if (filter === 'all') return true;
    return art.statoApprovazione === filter;
  });

  if (loading) {
    return <div className="flex items-center justify-center h-full font-['Karla']">{t('common.loading')}</div>;
  }

  return (
    <div className="w-full space-y-8 font-['Karla'] pb-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
        <div>
          <h1 className="text-4xl md:text-6xl font-['Shamgod'] uppercase leading-[0.8] tracking-tight text-[#121212] mb-4">
            {t('artworks.myArtworks')}
          </h1>
          <p className="text-[#59554E] text-lg">
            {isAdmin ? t('artworks.subtitleAdmin') : t('artworks.subtitleWriter')}
          </p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-[#121212] text-white rounded-full font-bold hover:bg-[#FF4F00] transition-colors shrink-0 uppercase text-xs tracking-widest"
          >
            <Plus size={20} />
            <span>{t('artworks.newMediaLink')}</span>
          </button>
        )}
      </header>


      <div className="bg-white rounded-3xl shadow-sm border border-[#EAE3D9] overflow-hidden">
        {filteredArtworks.length === 0 ? (
          <div className="p-16 text-center text-[#59554E] flex flex-col items-center">
            <div className="w-20 h-20 bg-[#F2EEE8] rounded-full flex items-center justify-center mb-6">
              <Video size={32} />
            </div>
            <h3 className="text-2xl font-bold text-[#121212] mb-2">{t('artworks.noProjectsFound')}</h3>
            <p className="max-w-md">{t('artworks.noMaterialsMessage')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-[#EAE3D9] bg-[#F2EEE8]/50">
                  <th className="p-4 font-bold text-sm text-[#59554E] uppercase tracking-wider">{t('artworks.projectTitle')}</th>
                  {isAdmin && <th className="p-4 font-bold text-sm text-[#59554E] uppercase tracking-wider">{t('artworks.writer')}</th>}
                  <th className="p-4 font-bold text-sm text-[#59554E] uppercase tracking-wider">{t('artworks.date')}</th>
                  <th className="p-4 font-bold text-sm text-[#59554E] uppercase tracking-wider">{t('artworks.status')}</th>
                  <th className="p-4 font-bold text-sm text-[#59554E] uppercase tracking-wider text-right">{t('artworks.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE3D9]">
                {filteredArtworks.map((item) => (
                  <tr key={item.id} className="hover:bg-[#F2EEE8]/30 transition-colors">
                    <td className="p-4 font-bold text-[#121212] max-w-[200px] truncate" title={item.titolo || item.title}>
                      {item.titolo || item.title}
                    </td>
                    {isAdmin && <td className="p-4 text-[#59554E] font-medium">{item.writerName}</td>}
                    <td className="p-4 text-[#59554E]">
                      {item.createdAt ? format(parseISO(item.createdAt), 'MMM dd, yyyy') : 'N/A'}
                    </td>
                    <td className="p-4">
                      {isAdmin ? (
                        <select
                          value={item.statoApprovazione || 'in_attesa'}
                          onChange={(e) => handleStatusChange(item.id, e.target.value)}
                          className={clsx(
                            "px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border-none outline-none cursor-pointer",
                            getStatusColor(item.statoApprovazione || 'in_attesa')
                          )}
                        >
                          {statuses.map(s => (
                            <option key={s} value={s}>{getStatusLabel(s)}</option>
                          ))}
                        </select>
                      ) : (
                        <span className={clsx(
                          "inline-block px-3 py-1.5 text-xs font-bold uppercase tracking-widest rounded-full",
                          getStatusColor(item.statoApprovazione || 'in_attesa')
                        )}>
                          {getStatusLabel(item.statoApprovazione || 'in_attesa')}
                        </span>
                      )}
                    </td>
                    <td className="p-4 flex flex-wrap items-center justify-end gap-2 text-right">
                      {(item.driveLink || item.documentUrl) && (
                        <a 
                          href={item.driveLink || item.documentUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold text-white bg-[#121212] hover:bg-[#FF4F00] transition-colors uppercase tracking-widest"
                        >
                          <ExternalLink size={14} />
                          <span>{t('artworks.openDrive')}</span>
                        </a>
                      )}
                      {isAdmin && (
                        <button
                          onClick={() => setItemToDelete(item.id)}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-bold text-red-600 hover:bg-red-50 transition-colors"
                          title={t('artworks.delete')}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showUploadModal && isAdmin && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-[#EAE3D9] flex justify-between items-center shrink-0">
              <h2 className="text-xl font-bold text-[#121212]">{t('artworks.newProjectMedia')}</h2>
              <button onClick={() => setShowUploadModal(false)} className="p-2 hover:bg-[#F2EEE8] rounded-full transition-colors">
                <X size={24} className="text-[#59554E]" />
              </button>
            </div>
            
            <form onSubmit={handleCreateDriveLink} className="p-6 space-y-6 overflow-y-auto">
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-widest text-[#121212]">{t('artworks.projectTitle')}</label>
                <input 
                  type="text" 
                  value={newArtwork.title}
                  onChange={(e) => setNewArtwork({...newArtwork, title: e.target.value})}
                  required
                  className="w-full px-4 py-3 bg-[#F2EEE8] border-none rounded-xl text-[#121212] focus:ring-2 focus:ring-[#FF4F00] outline-none" 
                  placeholder={t('artworks.projectTitlePlaceholder')}
                />
              </div>
              
              <div className="space-y-4">
                <label className="block text-xs font-bold uppercase tracking-widest text-[#121212]">{t('artworks.selectWriter')}</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#59554E]" size={18} />
                  <input
                    type="text"
                    value={writerSearch}
                    onChange={(e) => setWriterSearch(e.target.value)}
                    placeholder={t('artworks.searchNamePlaceholder')}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-[#EAE3D9] rounded-xl text-[#121212] focus:ring-2 focus:ring-[#FF4F00] outline-none"
                  />
                </div>
                <div className="bg-[#F2EEE8] rounded-xl p-2 max-h-48 overflow-y-auto space-y-1">
                  {writers.filter(w => {
                    const search = writerSearch.toLowerCase();
                    return (w.fullName || '').toLowerCase().includes(search) || 
                           (w.artistName || '').toLowerCase().includes(search);
                  }).map(writer => (
                    <label key={writer.id} className={clsx(
                      "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors",
                      newArtwork.writerId === writer.id ? "bg-white shadow-sm ring-1 ring-[#FF4F00]" : "hover:bg-white/50"
                    )}>
                      <input 
                        type="radio" 
                        name="writer_selection"
                        value={writer.id}
                        checked={newArtwork.writerId === writer.id}
                        onChange={(e) => setNewArtwork({...newArtwork, writerId: e.target.value})}
                        className="w-4 h-4 text-[#FF4F00] focus:ring-[#FF4F00] border-gray-300"
                        required
                      />
                      <span className="text-sm font-medium text-[#121212]">
                        {writer.artistName || writer.fullName || writer.email}
                      </span>
                    </label>
                  ))}
                  {writers.filter(w => (w.fullName || '').toLowerCase().includes(writerSearch.toLowerCase())).length === 0 && (
                    <div className="p-4 text-center text-sm text-[#59554E]">{t('artworks.noWriterFound')}</div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-widest text-[#121212]">{t('artworks.googleDriveLink')}</label>
                <input 
                  type="url" 
                  value={newArtwork.driveLink}
                  onChange={(e) => setNewArtwork({...newArtwork, driveLink: e.target.value})}
                  required
                  placeholder="https://drive.google.com/drive/folders/..."
                  className="w-full px-4 py-3 bg-[#F2EEE8] border-none rounded-xl text-[#121212] focus:ring-2 focus:ring-[#FF4F00] outline-none" 
                />
              </div>
              
              <div className="pt-4 flex justify-end gap-3 shrink-0">
                <button 
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-6 py-3 rounded-full font-bold text-xs uppercase tracking-widest text-[#121212] bg-[#F2EEE8] hover:bg-[#EAE3D9] transition-colors"
                >
                  {t('artworks.cancel')}
                </button>
                <button 
                  type="submit"
                  disabled={uploading || !newArtwork.writerId}
                  className="px-6 py-3 rounded-full font-bold text-xs uppercase tracking-widest text-white bg-[#FF4F00] hover:bg-[#E64700] transition-colors disabled:opacity-50"
                >
                  {uploading ? t('artworks.creating') : t('artworks.createLink')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#FAF8F5] rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl border border-[#EAE3D9]">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={32} />
              </div>
              <h2 className="text-xl font-bold text-[#121212] mb-2 font-['Shamgod'] uppercase">{t('artworks.confirmDeletion')}</h2>
              <p className="text-[#59554E] text-sm mb-6">
                {t('artworks.confirmDeletionMessage')}
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setItemToDelete(null)}
                  className="flex-1 py-3 px-4 bg-[#EAE3D9] text-[#121212] font-bold rounded-xl hover:bg-[#D8D0C5] transition-colors uppercase tracking-wider text-xs"
                >
                  {t('artworks.cancel')}
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 py-3 px-4 bg-[#FF4F00] text-white font-bold rounded-xl hover:bg-[#E64700] transition-colors uppercase tracking-wider text-xs"
                >
                  {t('artworks.delete')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
