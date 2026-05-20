import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, getDocs, orderBy, where, doc, getDoc, updateDoc } from 'firebase/firestore';
import { CreditCard, FileText, Check, AlertCircle, ArrowLeft, ArrowRight, Download, Receipt, Bell, Send, CheckCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { useI18n } from '../contexts/I18nContext';
import { createNotification } from '../utils/notificationService';

export default function AdminPayments() {
  const { t } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Selected view tab: 'requests' or 'balances'
  const [activeTab, setActiveTab] = useState<'requests' | 'balances'>('requests');

  const [artists, setArtists] = useState<any[]>([]);
  const [payoutRequests, setPayoutRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Selected artist for detail view (balance sub-items)
  const [selectedArtist, setSelectedArtist] = useState<any | null>(null);
  const [artistRoyalties, setArtistRoyalties] = useState<any[]>([]);
  const [loadingRoyalties, setLoadingRoyalties] = useState(false);

  // Modal controls for registering payment
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedPayout, setSelectedPayout] = useState<any | null>(null);
  const [markingPaid, setMarkingPaid] = useState(false);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Admin verification
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.data()?.role !== 'admin' && user.email?.toLowerCase() !== 'claudio@brignole.ch') {
        navigate('/');
        return;
      }

      // 1. Fetch payout requests
      const payoutQ = query(collection(db, 'payouts'), orderBy('date', 'desc'));
      const payoutSnap = await getDocs(payoutQ);
      const payouts = payoutSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setPayoutRequests(payouts);

      // 2. Fetch all artists with some metadata or pending balance
      const artistsQ = query(
        collection(db, 'users'),
        where('role', '==', 'artista')
      );
      const artistsSnap = await getDocs(artistsQ);
      const artistsList = artistsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setArtists(artistsList);

    } catch (err: any) {
      console.error("Error fetching admin payments data:", err);
      setError("Errore nel caricamento delle informazioni: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user, navigate]);

  const handleSelectArtist = async (artist: any) => {
    setSelectedArtist(artist);
    setLoadingRoyalties(true);
    setError('');
    
    try {
      const royaltiesQ = query(
        collection(db, 'royalties'),
        where('artistId', '==', artist.id),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(royaltiesQ);
      const royalties = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setArtistRoyalties(royalties);
    } catch (err) {
      console.error('Error fetching royalties', err);
      setError('Errore durante il caricamento delle royalties d\'archivio.');
    } finally {
      setLoadingRoyalties(false);
    }
  };

  const handleOpenConfirmPayment = (payout: any) => {
    setSelectedPayout(payout);
    setShowConfirmModal(true);
  };

  const handleConfirmRegisterPayment = async () => {
    if (!selectedPayout) return;
    setMarkingPaid(true);
    setError('');
    setSuccess('');

    try {
      const currentPayoutId = selectedPayout.id;
      const payoutAmount = selectedPayout.ammontare || selectedPayout.amount || 0;
      const artistId = selectedPayout.artistaId;

      // 1. Update payout document status to 'Pagato'
      const payoutRef = doc(db, 'payouts', currentPayoutId);
      await updateDoc(payoutRef, {
        stato: 'Pagato',
        dataEmissione: new Date().toISOString()
      });

      // 2. Subtract the amount from the artist's pendingBalance in the database
      const artistRef = doc(db, 'users', artistId);
      const artistSnap = await getDoc(artistRef);
      if (artistSnap.exists()) {
        const currentBalance = artistSnap.data().pendingBalance || 0;
        const newBalance = Math.max(0, currentBalance - payoutAmount);
        
        await updateDoc(artistRef, {
          pendingBalance: newBalance
        });
      }

      // 3. Create a notification in the writer's timeline
      await createNotification(
        artistId,
        "Pagamento Effettuato (Bonifico)",
        `Il bonifico bancario di ${Number(payoutAmount).toFixed(2)} EUR richiesto il ${format(parseISO(selectedPayout.date), 'dd/MM/yyyy')} è stato completato con successo (Stato: Pagato).`,
        "payout_update",
        "/dashboard/payments"
      );

      setSuccess(`Pagamento di ${payoutAmount.toFixed(2)} EUR registrato e notificato con successo!`);
      setShowConfirmModal(false);
      setSelectedPayout(null);

      // Refresh data
      await fetchData();

      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      console.error("Error confirming payment:", err);
      setError("Errore nella registrazione del pagamento: " + err.message);
    } finally {
      setMarkingPaid(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-[#59554E] py-20 font-['Karla'] font-bold uppercase tracking-wider">
        {t('adminPayments.loading', 'Caricamento in corso...')}
      </div>
    );
  }

  const pendingRequestsCount = payoutRequests.filter(p => (p.stato || p.status) === 'Ricevuto').length;

  return (
    <div className="w-full space-y-8 font-['Karla']">
      <header className="mb-8">
        <h1 className="text-4xl md:text-6xl font-['Shamgod'] uppercase leading-[0.8] tracking-normal text-[#121212] mb-4">
          {selectedArtist ? 'DETTAGLIO ARTISTA' : 'GESTIONE PAGAMENTI'}
        </h1>
        <p className="text-[#59554E] text-lg">
          {selectedArtist 
            ? `Lista royalties pendenti per ${selectedArtist.artistName || selectedArtist.email}` 
            : 'Contratti di riscatto, fatture generate e registrazione bonifici bancari ad artisti.'}
        </p>
      </header>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-2xl flex items-center gap-3 border border-red-200">
          <AlertCircle size={20} />
          <p className="font-medium">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 text-green-700 p-4 rounded-2xl flex items-center gap-3 border border-green-200">
          <Check size={20} />
          <p className="font-medium">{success}</p>
        </div>
      )}

      {!selectedArtist && (
        <div className="flex border-b border-[#EAE3D9] gap-8 mb-6">
          <button
            onClick={() => setActiveTab('requests')}
            className={clsx(
              "pb-4 font-bold uppercase tracking-wider text-sm transition-all relative",
              activeTab === 'requests' ? "text-[#FF4F00]" : "text-[#59554E] hover:text-[#121212]"
            )}
          >
            Richieste Payout (Fatture)
            {pendingRequestsCount > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-[#FF4F00] text-white rounded-full font-bold">
                {pendingRequestsCount} Nuove
              </span>
            )}
            {activeTab === 'requests' && (
              <div className="absolute bottom-0 left-0 w-full h-1 bg-[#FF4F00]" />
            )}
          </button>
          
          <button
            onClick={() => setActiveTab('balances')}
            className={clsx(
              "pb-4 font-bold uppercase tracking-wider text-sm transition-all relative",
              activeTab === 'balances' ? "text-[#FF4F00]" : "text-[#59554E] hover:text-[#121212]"
            )}
          >
            Saldo Artisti
            {activeTab === 'balances' && (
              <div className="absolute bottom-0 left-0 w-full h-1 bg-[#FF4F00]" />
            )}
          </button>
        </div>
      )}

      {!selectedArtist ? (
        <>
          {activeTab === 'requests' ? (
            <div className="bg-white rounded-3xl shadow-sm border border-[#EAE3D9] overflow-hidden">
              <div className="p-6 border-b border-[#EAE3D9] flex items-center justify-between bg-[#F2EEE8]/30">
                <h2 className="text-xl font-bold text-[#121212] flex items-center gap-3 uppercase tracking-wider">
                  <FileText className="text-[#FF4F00]" />
                  Richieste di Riscatto Ricevute
                </h2>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="border-b border-[#EAE3D9] bg-[#F2EEE8]/50 text-xs font-bold text-[#59554E] uppercase tracking-wider">
                      <th className="p-4">Data</th>
                      <th className="p-4">Artista</th>
                      <th className="p-4 text-right">Importo</th>
                      <th className="p-4 text-center">Fattura PDF</th>
                      <th className="p-4 text-center">Stato</th>
                      <th className="p-4 text-right">Azioni</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAE3D9]">
                    {payoutRequests.map((payout) => (
                      <tr key={payout.id} className="hover:bg-[#F2EEE8]/30 transition-colors">
                        <td className="p-4 text-sm font-medium text-[#121212]">
                          {payout.date ? format(parseISO(payout.date), 'dd MMM yyyy HH:mm') : '-'}
                        </td>
                        <td className="p-4 text-sm">
                          <p className="font-bold text-[#121212]">{payout.artistEmail || 'Artista'}</p>
                          <p className="text-xs text-[#59554E]">ID: {payout.artistaId}</p>
                        </td>
                        <td className="p-4 text-sm font-black text-right text-[#121212]">
                          {Number(payout.ammontare || payout.amount || 0).toFixed(2)} EUR
                        </td>
                        <td className="p-4 text-center">
                          {payout.invoiceUrl ? (
                            <a
                              href={payout.invoiceUrl}
                              download={`fattura_${payout.id}.pdf`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#FF4F00] bg-orange-50 hover:bg-orange-100 transition-colors rounded-xl"
                            >
                              <Download size={14} />
                              <span>Scarica PDF</span>
                            </a>
                          ) : (
                            <span className="text-xs text-gray-400 italic">Nessuna Fattura</span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <span className={clsx(
                            "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                            (payout.stato || payout.status) === 'Pagato' ? "bg-green-150 text-green-700 bg-green-50" : "bg-orange-50 text-orange-700"
                          )}>
                            {payout.stato || payout.status || 'Ricevuto'}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          {(payout.stato || payout.status) === 'Ricevuto' ? (
                            <button
                              onClick={() => handleOpenConfirmPayment(payout)}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-full text-xs font-bold transition-all uppercase tracking-wider"
                            >
                              <CheckCircle size={14} />
                              Segna come Pagato
                            </button>
                          ) : (
                            <span className="text-xs text-green-700 font-bold flex items-center justify-end gap-1">
                              <Check size={14} /> Pagato
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {payoutRequests.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-[#59554E]">
                          Nessuna richiesta di riscatto presente nel sistema.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl shadow-sm border border-[#EAE3D9] overflow-hidden">
              <div className="p-6 border-b border-[#EAE3D9] flex items-center justify-between bg-[#F2EEE8]/30">
                <h2 className="text-xl font-bold text-[#121212] flex items-center gap-3 uppercase tracking-wider">
                  <CreditCard className="text-[#FF4F00]" />
                  Saldo Corrente degli Artisti
                </h2>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#EAE3D9] bg-[#F2EEE8]/50 text-xs font-bold text-[#59554E] uppercase tracking-wider">
                      <th className="p-4">Nome / Alias</th>
                      <th className="p-4">Email</th>
                      <th className="p-4 text-right">Saldo Cumulato (Total Earned)</th>
                      <th className="p-4 text-right">Saldo in Attesa (Pending Balance)</th>
                      <th className="p-4 text-right">Dettagli</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAE3D9]">
                    {artists.map((artist) => (
                      <tr key={artist.id} className="hover:bg-[#F2EEE8]/30 transition-colors">
                        <td className="p-4 text-sm font-bold text-[#121212]">
                          {artist.artistName || artist.displayName || 'Artista'}
                        </td>
                        <td className="p-4 text-sm text-[#59554E]">
                          {artist.email || '-'}
                        </td>
                        <td className="p-4 text-sm text-right text-[#59554E]">
                          {Number(artist.totalEarned || 0).toFixed(2)} EUR
                        </td>
                        <td className="p-4 text-sm font-bold text-[#FF4F00] text-right">
                          {Number(artist.pendingBalance || 0).toFixed(2)} EUR
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleSelectArtist(artist)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-[#121212] hover:bg-black text-white rounded-full text-xs font-bold transition-all uppercase tracking-wider"
                          >
                            Royalties <ArrowRight size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {artists.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-[#59554E]">
                          Nessun artista configurato.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="space-y-6">
          <button 
            onClick={() => { setSelectedArtist(null); setArtistRoyalties([]); }}
            className="inline-flex items-center gap-2 text-[#59554E] hover:text-[#121212] font-bold uppercase tracking-wider transition-colors"
          >
            <ArrowLeft size={20} />
            Torna alla Lista Codici
          </button>

          <div className="bg-white rounded-3xl shadow-sm border border-[#EAE3D9] overflow-hidden">
            <div className="p-6 border-b border-[#EAE3D9] flex items-center justify-between bg-[#F2EEE8]/30">
              <h2 className="text-xl font-bold text-[#121212] flex items-center gap-3 uppercase tracking-wider">
                <FileText className="text-[#FF4F00]" />
                Royalties per {selectedArtist.artistName || selectedArtist.email}
              </h2>
            </div>
            
            {loadingRoyalties ? (
              <div className="p-8 text-center text-[#59554E] font-bold uppercase tracking-wider">Caricamento in corso...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#EAE3D9] bg-[#F2EEE8]/50 text-xs font-bold text-[#59554E] uppercase tracking-wider">
                      <th className="p-4">Data Ordine</th>
                      <th className="p-4">Prodotto</th>
                      <th className="p-4 text-right">Q.tà</th>
                      <th className="p-4 text-right">Promo</th>
                      <th className="p-4 text-right">Fee Totale</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAE3D9]">
                    {artistRoyalties.map((royalty) => {
                      const date = royalty.createdAt?.toDate ? royalty.createdAt.toDate() : new Date();
                      const formatName = royalty.productType ? royalty.productType.replace(/_/g, ' ').toUpperCase() : 'ART';
                      return (
                        <tr key={royalty.id} className="hover:bg-[#F2EEE8]/30 transition-colors">
                          <td className="p-4 text-sm font-medium text-[#121212]">
                            {format(date, 'dd MMM yyyy HH:mm')}
                          </td>
                          <td className="p-4 text-sm text-[#59554E]">
                            {formatName}
                          </td>
                          <td className="p-4 text-sm text-[#121212] font-bold text-right">
                            {royalty.quantity || 1}
                          </td>
                          <td className="p-4 text-sm text-[#59554E] text-right">
                            {royalty.isPromo ? 'Sì' : 'No'}
                          </td>
                          <td className="p-4 text-sm font-bold text-[#121212] text-right">
                            {Number(royalty.feeAmount || 0).toFixed(2)} EUR
                          </td>
                        </tr>
                      )
                    })}
                    {artistRoyalties.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-[#59554E]">
                          Nessuna royalty singola rimasta in sospeso.
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {artistRoyalties.length > 0 && (
                    <tfoot className="bg-[#F2EEE8]/30 border-t-2 border-[#EAE3D9]">
                      <tr>
                        <td colSpan={4} className="p-4 text-right font-bold text-[#59554E] uppercase tracking-wider">
                          Totale Calcolato:
                        </td>
                        <td className="p-4 text-right font-black text-[#FF4F00] text-lg">
                          {Number(artistRoyalties.reduce((sum, r) => sum + (r.feeAmount || 0), 0)).toFixed(2)} EUR
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confim payout modal (NO standard window.confirm, Rule 5 compliant) */}
      {showConfirmModal && selectedPayout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowConfirmModal(false)} />
          <div className="relative bg-white w-full max-w-lg p-8 rounded-3xl shadow-xl border border-[#EAE3D9] z-10 animate-in fade-in zoom-in duration-200">
            <h3 className="text-2xl font-['Shamgod'] uppercase leading-[0.9] text-[#121212] mb-4">
              Registra Erogazione Bonifico
            </h3>
            <p className="text-[#59554E] mb-6">
              Stai registrando lo stato come **Pagato** per la richiesta effettuata da **{selectedPayout.artistEmail}** pari a **{Number(selectedPayout.ammontare || selectedPayout.amount).toFixed(2)} EUR**.
            </p>
            <div className="bg-[#F2EEE8] p-4 rounded-2xl mb-6 space-y-2 text-sm text-[#121212]">
              <div className="flex justify-between">
                <span className="font-bold">Richiedente:</span>
                <span>{selectedPayout.artistEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold">Metodo Ricevuto:</span>
                <span>Bonifico Bancario</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold">Importo Richiesto:</span>
                <span className="font-black text-[#FF4F00]">{Number(selectedPayout.ammontare || selectedPayout.amount).toFixed(2)} EUR</span>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={markingPaid}
                className="flex-1 bg-white border border-[#EAE3D9] font-bold py-3.5 px-6 rounded-2xl hover:bg-[#F2EEE8] text-[#121212] transition-all uppercase text-xs tracking-wider"
              >
                Annulla
              </button>
              <button
                onClick={handleConfirmRegisterPayment}
                disabled={markingPaid}
                className="flex-1 bg-green-600 hover:bg-green-700 font-bold py-3.5 px-6 rounded-2xl text-white transition-all uppercase text-xs tracking-wider flex items-center justify-center gap-2"
              >
                {markingPaid ? (
                  <span>Registrazione...</span>
                ) : (
                  <>
                    <Check size={16} />
                    <span>Invia & Notifica</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
