import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { Plus, Filter, Search, Image as ImageIcon, CheckCircle, XCircle, X, Film } from 'lucide-react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { sendEmailNotification } from '../utils/emailService';
import { createNotification } from '../utils/notificationService';
import { useI18n } from '../contexts/I18nContext';


export default function Artworks() {
  const { t } = useI18n();

  const { user } = useAuth();
  const [artworks, setArtworks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [isAdmin, setIsAdmin] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [approvalCosts, setApprovalCosts] = useState({ productionCost: '', shippingCost: '' });
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [rejectingArtwork, setRejectingArtwork] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [requestingModArtwork, setRequestingModArtwork] = useState<any | null>(null);
  const [modReason, setModReason] = useState('');

  useEffect(() => {
    const fetchArtworks = async () => {
      if (!user) return;
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userRole = userDoc.data()?.role;
        const adminStatus = userRole === 'admin' || user.email?.toLowerCase() === 'claudio@brignole.ch';
        setIsAdmin(adminStatus);

        let q;
        if (adminStatus) {
          q = query(collection(db, 'opere'));
        } else {
          q = query(collection(db, 'opere'), where('artistaId', '==', user.uid));
        }
        
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
        setArtworks(data);
      } catch (error) {
        console.error("Error fetching artworks:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchArtworks();
  }, [user]);

  const handleApprove = async (artwork: any) => {
    setApprovingId(artwork.id);
    setMessage(null);
    try {
      const response = await fetch(`/api/artworks/${artwork.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: artwork.titolo,
          price: artwork.prezzo,
          description: artwork.descrizioneCritica,
          imageUrl: artwork.immagineHiRes || (artwork.galleria && artwork.galleria[0])
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || t('artworks.approveFailed'));
      }

      const { ecwidProductId } = await response.json();

      const artworkRef = doc(db, 'opere', artwork.id);
      await updateDoc(artworkRef, {
        statoApprovazione: 'approvata',
        ecwidId: ecwidProductId,
        costoProduzione: Number(approvalCosts.productionCost),
        costoSpedizione: Number(approvalCosts.shippingCost),
        published: true,
        updatedAt: new Date().toISOString()
      });

      setArtworks(prev => prev.map(a => 
        a.id === artwork.id ? { ...a, statoApprovazione: 'approvata', ecwidId: ecwidProductId, costoProduzione: Number(approvalCosts.productionCost), costoSpedizione: Number(approvalCosts.shippingCost), published: true } : a
      ));
      
      setApprovingId(null);
      setApprovalCosts({ productionCost: '', shippingCost: '' });
      setMessage({ type: 'success', text: t('artworks.approvedSuccess', { title: artwork.titolo }) });
      
      // Send email
      const artistDoc = await getDoc(doc(db, 'users', artwork.artistaId));
      if (artistDoc.exists()) {
        const artistEmail = artistDoc.data().email;
        await sendEmailNotification(artistEmail, 'artwork_approved', { artworkTitle: artwork.titolo, userId: artwork.artistaId });
      }

      // Create in-app notification
      await createNotification(
        artwork.artistaId,
        'Artwork Approved',
        `Your artwork "${artwork.titolo}" has been approved.`,
        'artwork_approved',
        '/artworks'
      );

      setTimeout(() => setMessage(null), 5000);
    } catch (error: any) {
      console.error("Approval error:", error);
      setMessage({ type: 'error', text: error.message });
    } finally {
      setApprovingId(null);
    }
  };

  const submitReject = async () => {
    if (!rejectingArtwork || !rejectReason.trim()) return;
    
    try {
      const artworkRef = doc(db, 'opere', rejectingArtwork.id);
      await updateDoc(artworkRef, {
        statoApprovazione: 'rifiutata',
        rejectReason: rejectReason,
        updatedAt: new Date().toISOString()
      });

      setArtworks(prev => prev.map(a => 
        a.id === rejectingArtwork.id ? { ...a, statoApprovazione: 'rifiutata', rejectReason } : a
      ));
      
      setMessage({ type: 'success', text: t('artworks.rejectedSuccess', { title: rejectingArtwork.titolo }) });
      
      // Send email
      const artistDoc = await getDoc(doc(db, 'users', rejectingArtwork.artistaId));
      if (artistDoc.exists()) {
        const artistEmail = artistDoc.data().email;
        await sendEmailNotification(artistEmail, 'artwork_rejected', { 
          artworkTitle: rejectingArtwork.titolo, 
          reason: rejectReason,
          userId: rejectingArtwork.artistaId 
        });
      }

      // Create in-app notification
      await createNotification(
        rejectingArtwork.artistaId,
        'Artwork Rejected',
        `Your artwork "${rejectingArtwork.titolo}" has been rejected. Reason: ${rejectReason}`,
        'artwork_rejected',
        '/artworks'
      );

      setRejectingArtwork(null);
      setRejectReason('');
      setTimeout(() => setMessage(null), 5000);
    } catch (error: any) {
      console.error("Rejection error:", error);
      setMessage({ type: 'error', text: error.message });
    }
  };

  const submitRequestMod = async () => {
    if (!requestingModArtwork || !modReason.trim()) return;
    
    try {
      const artworkRef = doc(db, 'opere', requestingModArtwork.id);
      await updateDoc(artworkRef, {
        statoApprovazione: 'modifica_richiesta',
        modReason: modReason,
        updatedAt: new Date().toISOString()
      });

      setArtworks(prev => prev.map(a => 
        a.id === requestingModArtwork.id ? { ...a, statoApprovazione: 'modifica_richiesta', modReason } : a
      ));
      
      setMessage({ type: 'success', text: `Modification requested for ${requestingModArtwork.titolo}` });
      
      // Send email
      const artistDoc = await getDoc(doc(db, 'users', requestingModArtwork.artistaId));
      if (artistDoc.exists()) {
        const artistEmail = artistDoc.data().email;
        await sendEmailNotification(artistEmail, 'artwork_mod_requested', { 
          artworkTitle: requestingModArtwork.titolo, 
          reason: modReason,
          userId: requestingModArtwork.artistaId 
        });
      }

      // Create in-app notification
      await createNotification(
        requestingModArtwork.artistaId,
        'Modification Requested',
        `Modifications requested for "${requestingModArtwork.titolo}". Reason: ${modReason}`,
        'artwork_mod_requested',
        '/artworks'
      );

      setRequestingModArtwork(null);
      setModReason('');
      setTimeout(() => setMessage(null), 5000);
    } catch (error: any) {
      console.error("Modification request error:", error);
      setMessage({ type: 'error', text: error.message });
    }
  };

  const handleMarkAsSoldExternally = async (artwork: any) => {
    try {
      const artworkRef = doc(db, 'opere', artwork.id);
      await updateDoc(artworkRef, {
        statoVendita: 'venduta',
        soldExternally: true,
        updatedAt: new Date().toISOString()
      });

      setArtworks(prev => prev.map(a => 
        a.id === artwork.id ? { ...a, statoVendita: 'venduta', soldExternally: true } : a
      ));
      
      // Notify Admin
      try {
        const adminsSnapshot = await getDocs(query(collection(db, 'users'), where('role', '==', 'admin')));
        adminsSnapshot.docs.forEach(async (adminDoc) => {
          await createNotification(
            adminDoc.id,
            'Artwork Sold Externally',
            `Artwork "${artwork.titolo || artwork.title}" was sold externally. Please unpublish it from Ecwid.`,
            'artwork_sold_externally',
            '/artworks'
          );
        });
      } catch (adminErr) {
        console.error("Failed to notify admins", adminErr);
      }

      setMessage({ type: 'success', text: `Artwork "${artwork.title}" marked as sold externally.` });
      setTimeout(() => setMessage(null), 5000);
    } catch (error: any) {
      console.error("Mark as sold externally error:", error);
      setMessage({ type: 'error', text: error.message });
    }
  };

  const handleMarkAsSold = async (artwork: any) => {
    try {
      const artworkRef = doc(db, 'opere', artwork.id);
      await updateDoc(artworkRef, {
        statoVendita: 'venduta',
        updatedAt: new Date().toISOString()
      });

      setArtworks(prev => prev.map(a => 
        a.id === artwork.id ? { ...a, statoVendita: 'venduta' } : a
      ));
      
      setMessage({ type: 'success', text: `Artwork "${artwork.titolo}" marked as sold.` });
      
      // Send email
      const artistDoc = await getDoc(doc(db, 'users', artwork.artistaId));
      if (artistDoc.exists()) {
        const artistEmail = artistDoc.data().email;
        await sendEmailNotification(artistEmail, 'artwork_sold', { 
          artworkTitle: artwork.titolo, 
          userId: artwork.artistaId 
        });
      }

      // Create in-app notification
      await createNotification(
        artwork.artistaId,
        'Artwork Sold',
        `Congratulations! Your artwork "${artwork.titolo}" has been marked as sold.`,
        'artwork_sold',
        '/artworks'
      );

      setTimeout(() => setMessage(null), 5000);
    } catch (error: any) {
      console.error("Mark as sold error:", error);
      setMessage({ type: 'error', text: error.message });
    }
  };

  const filteredArtworks = artworks.filter(art => {
    if (filter === 'all') return true;
    if (filter === 'sold') return art.statoVendita === 'venduta';
    return art.statoApprovazione === filter;
  });

  if (loading) {
    return <div className="flex items-center justify-center h-full font-['Karla']">{t('common.loading')}</div>;
  }

  return (
    <div className="space-y-8 font-['Karla']">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl md:text-6xl font-['Shamgod'] leading-[0.8] tracking-tight text-[#121212] mb-4 uppercase">
            {isAdmin ? t('artworks.allArtworks') : t('artworks.title')}
          </h1>
          <p className="text-[#59554E] text-lg">
            {isAdmin ? t('artworks.adminSubtitle') : t('artworks.subtitle')}
          </p>
        </div>
        <Link 
          to="/artworks/upload" 
          className="inline-flex items-center justify-center gap-2 bg-[#FF4F00] text-white font-bold py-3 px-6 rounded-full hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-[#FF4F00]/20 uppercase tracking-widest text-xs"
        >
          <Plus size={20} />
          <span>{t('artworks.uploadNew')}</span>
        </Link>
      </header>

      {/* Filters & Search */}
      {message && (
        <div className={clsx(
          "p-4 rounded-2xl text-sm font-medium mb-4",
          message.type === 'success' ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-600 border border-red-200"
        )}>
          {message.text}
        </div>
      )}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-[#EAE3D9]">
        <div className="flex gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
          {['all', 'approvata', 'in_attesa', 'venduta', 'bozza'].map((status) => (
            <button
              key={status}
              onClick={() => {
                if (status === 'venduta') setFilter('sold');
                else setFilter(status);
              }}
              className={clsx(
                "px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all",
                (filter === status || (filter === 'sold' && status === 'venduta'))
                  ? "bg-[#121212] text-white" 
                  : "bg-[#F2EEE8] text-[#59554E] hover:bg-[#EAE3D9]"
              )}
            >
              {status === 'all' ? t('artworks.all') : 
               status === 'approvata' ? t('artworks.statusApproved') : 
               status === 'in_attesa' ? t('artworks.statusPending') : 
               status === 'venduta' ? t('artworks.statusSold') : 
               status === 'bozza' ? t('artworks.statusDraft') : status}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <input 
            type="text" 
            placeholder={t('artworks.searchPlaceholder')} 
            className="w-full pl-10 pr-4 py-2 bg-[#F2EEE8] border-none rounded-full text-sm focus:ring-2 focus:ring-[#FF4F00] outline-none"
          />
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#59554E]" />
        </div>
      </div>

      {/* Grid */}
      {filteredArtworks.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#EAE3D9] p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
          <div className="w-20 h-20 bg-[#F2EEE8] rounded-full flex items-center justify-center text-[#59554E] mb-6">
            <ImageIcon size={32} />
          </div>
          <h3 className="text-2xl font-bold text-[#121212] mb-2">{t('artworks.noArtworksFound')}</h3>
          <p className="text-[#59554E] mb-8 max-w-md">{t('artworks.noArtworksDesc')}</p>
          <Link 
            to="/app/artworks/upload" 
            className="inline-flex items-center justify-center gap-2 bg-[#121212] text-white font-bold py-3 px-8 rounded-full hover:bg-[#FF4F00] transition-colors"
          >
            <Plus size={20} />
            <span>{t('artworks.uploadFirst')}</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredArtworks.map((artwork) => (
            <div key={artwork.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-[#EAE3D9] group hover:shadow-md transition-all">
              <div className="aspect-square bg-[#F2EEE8] relative overflow-hidden">
                {artwork.immagineHiRes ? (
                  <img src={artwork.immagineHiRes} alt={artwork.titolo} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#59554E]">
                    <ImageIcon size={48} opacity={0.2} />
                  </div>
                )}
                <div className="absolute top-3 right-3 flex flex-col gap-2 items-end">
                  <span className={clsx(
                    "px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full backdrop-blur-md",
                    artwork.statoApprovazione === 'approvata' && artwork.statoVendita !== 'venduta' ? "bg-green-500/90 text-white" :
                    artwork.statoVendita === 'venduta' && artwork.soldExternally ? "bg-gray-600/90 text-white" :
                    artwork.statoVendita === 'venduta' ? "bg-[#121212]/90 text-white" :
                    artwork.statoApprovazione === 'in_attesa' ? "bg-yellow-500/90 text-white" :
                    artwork.statoApprovazione === 'rifiutata' ? "bg-red-500/90 text-white" :
                    "bg-white/90 text-[#121212]"
                  )}>
                    {artwork.statoVendita === 'venduta' && artwork.soldExternally ? t('artworks.statusSoldExternally') :
                     artwork.statoVendita === 'venduta' ? t('artworks.statusSold') : 
                     artwork.statoApprovazione === 'approvata' ? t('artworks.statusApproved') : 
                     artwork.statoApprovazione === 'in_attesa' ? t('artworks.statusPending') : 
                     artwork.statoApprovazione === 'bozza' ? t('artworks.statusDraft') : 
                     artwork.statoApprovazione === 'rifiutata' ? t('artworks.statusRejected') : 
                     artwork.statoApprovazione === 'modifica_richiesta' ? 'MODIFICA RICHIESTA' : artwork.statoApprovazione}
                  </span>
                  {artwork.videoYoutube && (
                    <span className="px-2 py-1 bg-black/70 text-white text-[10px] font-bold uppercase tracking-widest rounded-full backdrop-blur-md flex items-center gap-1">
                      <Film size={12} /> {t('artworks.video')}
                    </span>
                  )}
                </div>
              </div>
              <div className="p-5">
                <h3 className="font-bold text-lg text-[#121212] truncate mb-1 uppercase tracking-tight font-['Shamgod'] leading-none h-6">{artwork.titolo}</h3>
                <p className="text-sm text-[#59554E] mb-3">{artwork.anno} • {artwork.tecnica || artwork.tipologia}</p>
                <div className="flex justify-between items-center pt-3 border-t border-[#EAE3D9]">
                  <span className="font-black text-xl text-[#121212] font-['Shamgod']">{artwork.prezzo?.toLocaleString() || 'N/A'} {artwork.valuta || 'EUR'}</span>
                  <div className="flex flex-wrap gap-2 justify-end">
                    {isAdmin && artwork.statoApprovazione === 'in_attesa' && (
                      <>
                        <button 
                          onClick={() => handleApprove(artwork)}
                          disabled={approvingId === artwork.id}
                          className="text-[10px] font-bold text-green-600 uppercase tracking-widest hover:underline flex items-center gap-1 disabled:opacity-50"
                        >
                          {approvingId === artwork.id ? t('artworks.approving') : <><CheckCircle size={14} /> {t('artworks.approve')}</>}
                        </button>
                        <button 
                          onClick={() => setRequestingModArtwork(artwork)}
                          className="text-[10px] font-bold text-yellow-600 uppercase tracking-widest hover:underline flex items-center gap-1"
                        >
                          {t('artworks.mod')}
                        </button>
                        <button 
                          onClick={() => setRejectingArtwork(artwork)}
                          className="text-[10px] font-bold text-red-600 uppercase tracking-widest hover:underline flex items-center gap-1"
                        >
                          <XCircle size={14} /> {t('artworks.reject')}
                        </button>
                      </>
                    )}
                    {artwork.statoApprovazione === 'approvata' && artwork.statoVendita !== 'venduta' && (
                      <button 
                        onClick={() => handleMarkAsSoldExternally(artwork)}
                        className="text-[10px] font-bold text-[#121212] uppercase tracking-widest hover:underline flex items-center gap-1"
                      >
                        {t('artworks.markSoldExternally')}
                      </button>
                    )}
                    {isAdmin && artwork.statoApprovazione === 'approvata' && artwork.statoVendita !== 'venduta' && (
                      <button 
                        onClick={() => handleMarkAsSold(artwork)}
                        className="text-[10px] font-bold text-[#121212] uppercase tracking-widest hover:underline flex items-center gap-1"
                      >
                        {t('artworks.markSold')}
                      </button>
                    )}
                    <button className="text-[10px] font-bold text-[#FF4F00] uppercase tracking-widest hover:underline">{t('artworks.edit')}</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Approve Modal */}
      {approvingId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative">
            <h2 className="text-2xl font-bold text-[#121212] mb-6">{t('artworks.setCostsForApproval')}</h2>
            <div className="space-y-4 mb-6">
              <input
                type="number"
                placeholder={t('artworks.productionCost')}
                value={approvalCosts.productionCost}
                onChange={(e) => setApprovalCosts({...approvalCosts, productionCost: e.target.value})}
                className="w-full px-4 py-3 bg-[#F2EEE8] border-none rounded-xl text-[#121212]"
              />
              <input
                type="number"
                placeholder={t('artworks.shippingCost')}
                value={approvalCosts.shippingCost}
                onChange={(e) => setApprovalCosts({...approvalCosts, shippingCost: e.target.value})}
                className="w-full px-4 py-3 bg-[#F2EEE8] border-none rounded-xl text-[#121212]"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setApprovingId(null)} className="px-6 py-3 font-bold text-[#59554E] hover:bg-[#F2EEE8] rounded-full transition-all">{t('common.cancel')}</button>
              <button 
                onClick={() => {
                  const artwork = artworks.find(a => a.id === approvingId);
                  if (artwork) handleApprove(artwork);
                }}
                disabled={!approvalCosts.productionCost || !approvalCosts.shippingCost}
                className="px-6 py-3 font-bold text-white bg-[#FF4F00] hover:bg-[#FF6600] rounded-full transition-all disabled:opacity-50"
              >
                {t('artworks.approve')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectingArtwork && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative">
            <button 
              onClick={() => { setRejectingArtwork(null); setRejectReason(''); }}
              className="absolute top-6 right-6 text-[#59554E] hover:text-[#121212]"
            >
              <X size={24} />
            </button>
            <h2 className="text-2xl font-bold text-[#121212] mb-2">{t('artworks.rejectArtwork')}</h2>
            <p className="text-[#59554E] mb-6">{t('artworks.rejectReasonPrompt', { title: rejectingArtwork.titolo || rejectingArtwork.title })}</p>
            
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder={t('artworks.rejectReasonPlaceholder')}
              rows={4}
              className="w-full px-4 py-3 bg-[#F2EEE8] border-none rounded-xl text-[#121212] focus:ring-2 focus:ring-[#FF4F00] outline-none transition-all resize-none mb-6"
            />
            
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => { setRejectingArtwork(null); setRejectReason(''); }}
                className="px-6 py-3 font-bold text-[#59554E] hover:bg-[#F2EEE8] rounded-full transition-all"
              >
                {t('common.cancel')}
              </button>
              <button 
                onClick={submitReject}
                disabled={!rejectReason.trim()}
                className="px-6 py-3 font-bold text-white bg-red-600 hover:bg-red-700 rounded-full transition-all disabled:opacity-50"
              >
                {t('artworks.confirmRejection')}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Request Mod Modal */}
      {requestingModArtwork && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative">
            <button 
              onClick={() => { setRequestingModArtwork(null); setModReason(''); }}
              className="absolute top-6 right-6 text-[#59554E] hover:text-[#121212]"
            >
              <X size={24} />
            </button>
            <h2 className="text-2xl font-bold text-[#121212] mb-2">{t('artworks.requestModification')}</h2>
            <p className="text-[#59554E] mb-6">{t('artworks.requestModPrompt', { title: requestingModArtwork.titolo || requestingModArtwork.title })}</p>
            
            <textarea
              value={modReason}
              onChange={(e) => setModReason(e.target.value)}
              placeholder={t('artworks.requestModPlaceholder')}
              rows={4}
              className="w-full px-4 py-3 bg-[#F2EEE8] border-none rounded-xl text-[#121212] focus:ring-2 focus:ring-[#FF4F00] outline-none transition-all resize-none mb-6"
            />
            
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => { setRequestingModArtwork(null); setModReason(''); }}
                className="px-6 py-3 font-bold text-[#59554E] hover:bg-[#F2EEE8] rounded-full transition-all"
              >
                {t('common.cancel')}
              </button>
              <button 
                onClick={submitRequestMod}
                disabled={!modReason.trim()}
                className="px-6 py-3 font-bold text-white bg-yellow-600 hover:bg-yellow-700 rounded-full transition-all disabled:opacity-50"
              >
                {t('artworks.requestModText')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
