import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, getDocs, orderBy, where, doc, getDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { CreditCard, FileText, Check, AlertCircle, ArrowLeft, ArrowRight, Download } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { useI18n } from '../contexts/I18nContext';

export default function AdminPayments() {
  const { t } = useI18n();

  const { user } = useAuth();
  const navigate = useNavigate();
  const [artists, setArtists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [selectedArtist, setSelectedArtist] = useState<any | null>(null);
  const [artistRoyalties, setArtistRoyalties] = useState<any[]>([]);
  const [loadingRoyalties, setLoadingRoyalties] = useState(false);
  const [markingPaid, setMarkingPaid] = useState(false);

  useEffect(() => {
    const fetchArtists = async () => {
      if (!user) return;
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.data()?.role !== 'admin' && user.email?.toLowerCase() !== 'claudio@brignole.ch') {
          navigate('/');
          return;
        }

        const q = query(
          collection(db, 'users'),
          where('pendingBalance', '>', 0),
          orderBy('pendingBalance', 'desc')
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setArtists(data);
      } catch (error) {
        console.error("Error fetching artists to pay:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchArtists();
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
      setError(t('adminPayments.loadError', 'Errore durante il caricamento delle royalties.'));
    } finally {
      setLoadingRoyalties(false);
    }
  };

  const handleMarkAsPaid = async () => {
    if (!selectedArtist) return;
    setMarkingPaid(true);
    setError('');
    try {
      const functions = getFunctions();
      const markPaidCall = httpsCallable(functions, 'markArtistPaid');
      const result = await markPaidCall({ artistId: selectedArtist.id });

      // @ts-ignore
      if (result.data?.success) {
        setSuccess(`Pagamento di ${selectedArtist.pendingBalance} EUR completato con successo!`);
        setArtists(artists.filter(a => a.id !== selectedArtist.id));
        setSelectedArtist(null);
        setArtistRoyalties([]);
        setTimeout(() => setSuccess(''), 4000);
      } else {
        throw new Error('La function non ha restituito success = true');
      }
    } catch (err: any) {
      console.error('Error marking as paid:', err);
      setError('Errore durante il completamento del pagamento: ' + err.message);
    } finally {
      setMarkingPaid(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full text-[#59554E] py-20 font-['Karla'] font-bold uppercase tracking-wider">{t('adminPayments.loading', 'Caricamento...')}</div>;
  }

  return (
    <div className="w-full space-y-8 font-['Karla']">
      <header className="mb-8">
        <h1 className="text-4xl md:text-6xl font-['Shamgod'] uppercase leading-[0.8] tracking-normal text-[#121212] mb-4">
          {selectedArtist ? 'DETTAGLIO PAGAMENTO' : t('payments.allPaymentsTitle', 'PAGAMENTI RECENTI')}
        </h1>
        <p className="text-[#59554E] text-lg font-['Karla']">
          {selectedArtist ? `Royalties in attesa per ${selectedArtist.artistName || selectedArtist.email}` : t('adminPayments.subtitle', 'Lista degli artisti con saldo in attesa di pagamento.')}
        </p>
      </header>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-2xl flex items-center gap-3 border border-red-200 font-['Karla']">
          <AlertCircle size={20} />
          <p className="font-medium">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 text-green-700 p-4 rounded-2xl flex items-center gap-3 border border-green-200 font-['Karla']">
          <Check size={20} />
          <p className="font-medium">{success}</p>
        </div>
      )}

      {!selectedArtist ? (
        <div className="bg-white rounded-3xl shadow-sm border border-[#EAE3D9] overflow-hidden">
          <div className="p-6 border-b border-[#EAE3D9] flex items-center justify-between bg-[#F2EEE8]/30">
            <h2 className="text-xl font-bold text-[#121212] flex items-center gap-3 font-['Karla'] uppercase tracking-wider">
              <CreditCard className="text-[#FF4F00]" />
              {t('adminPayments.artistsToPay', 'Artisti da Pagare')}
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#EAE3D9] bg-[#F2EEE8]/50">
                  <th className="p-4 text-xs font-bold text-[#59554E] uppercase tracking-wider font-['Karla']">{t('adminPayments.nameAlias', 'Nome / Alias')}</th>
                  <th className="p-4 text-xs font-bold text-[#59554E] uppercase tracking-wider font-['Karla']">{t('adminPayments.email', 'Email')}</th>
                  <th className="p-4 text-xs font-bold text-[#59554E] uppercase tracking-wider text-right font-['Karla']">{t('adminPayments.pendingBalance', 'Saldo In Attesa')}</th>
                  <th className="p-4 text-xs font-bold text-[#59554E] uppercase tracking-wider text-right font-['Karla']">{t('adminPayments.actions', 'Azioni')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE3D9]">
                {artists.map((artist) => (
                  <tr key={artist.id} className="hover:bg-[#F2EEE8]/30 transition-colors">
                    <td className="p-4 text-sm font-bold text-[#121212] font-['Karla']">
                      {artist.artistName || artist.displayName || 'Sconosciuto'}
                    </td>
                    <td className="p-4 text-sm text-[#59554E] font-['Karla']">
                      {artist.email || '-'}
                    </td>
                    <td className="p-4 text-sm font-bold text-[#FF4F00] text-right font-['Karla']">
                      {Number(artist.pendingBalance).toFixed(2)} EUR
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleSelectArtist(artist)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#121212] text-white rounded-full text-xs font-bold hover:bg-black transition-all font-['Karla'] uppercase tracking-wider"
                      >
                        Visualizza <ArrowRight size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
                {artists.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-[#59554E] font-['Karla']">
                      {t('adminPayments.noPending', 'Nessun artista con saldo in attesa.')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <button 
            onClick={() => { setSelectedArtist(null); setArtistRoyalties([]); }}
            className="inline-flex items-center gap-2 text-[#59554E] hover:text-[#121212] font-bold font-['Karla'] uppercase tracking-wider transition-colors"
          >
            <ArrowLeft size={20} />
            Torna alla Lista
          </button>

          <div className="bg-white rounded-3xl shadow-sm border border-[#EAE3D9] overflow-hidden">
            <div className="p-6 border-b border-[#EAE3D9] flex items-center justify-between bg-[#F2EEE8]/30">
              <h2 className="text-xl font-bold text-[#121212] flex items-center gap-3 font-['Karla'] uppercase tracking-wider">
                <FileText className="text-[#FF4F00]" />
                Royalties per {selectedArtist.artistName || selectedArtist.email}
              </h2>
            </div>
            
            {loadingRoyalties ? (
              <div className="p-8 text-center text-[#59554E] font-['Karla'] font-bold uppercase tracking-wider">{t('adminPayments.loading', 'Caricamento...')}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#EAE3D9] bg-[#F2EEE8]/50">
                      <th className="p-4 text-xs font-bold text-[#59554E] uppercase tracking-wider font-['Karla']">{t('adminPayments.orderDate', 'Data Ordine')}</th>
                      <th className="p-4 text-xs font-bold text-[#59554E] uppercase tracking-wider font-['Karla']">{t('adminPayments.product', 'Prodotto')}</th>
                      <th className="p-4 text-xs font-bold text-[#59554E] uppercase tracking-wider text-right font-['Karla']">{t('adminPayments.quantity', 'Q.tà')}</th>
                      <th className="p-4 text-xs font-bold text-[#59554E] uppercase tracking-wider text-right font-['Karla']">{t('adminPayments.promo', 'Promo')}</th>
                      <th className="p-4 text-xs font-bold text-[#59554E] uppercase tracking-wider text-right font-['Karla']">{t('adminPayments.totalFee', 'Fee Totale')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAE3D9]">
                    {artistRoyalties.map((royalty) => {
                      const date = royalty.createdAt?.toDate ? royalty.createdAt.toDate() : new Date();
                      const formatName = royalty.productType ? royalty.productType.replace(/_/g, ' ').toUpperCase() : 'ART';
                      return (
                        <tr key={royalty.id} className="hover:bg-[#F2EEE8]/30 transition-colors">
                          <td className="p-4 text-sm font-medium text-[#121212] font-['Karla']">
                            {format(date, 'dd MMM yyyy HH:mm')}
                          </td>
                          <td className="p-4 text-sm text-[#59554E] font-['Karla']">
                            {formatName}
                          </td>
                          <td className="p-4 text-sm text-[#121212] font-bold text-right font-['Karla']">
                            {royalty.quantity || 1}
                          </td>
                          <td className="p-4 text-sm text-[#59554E] text-right font-['Karla']">
                            {royalty.isPromo ? 'Sì' : 'No'}
                          </td>
                          <td className="p-4 text-sm font-bold text-[#121212] text-right font-['Karla']">
                            {Number(royalty.feeAmount || 0).toFixed(2)} EUR
                          </td>
                        </tr>
                      )
                    })}
                    {artistRoyalties.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-[#59554E] font-['Karla']">
                          {t('adminPayments.noPendingArtist', "Nessuna royalty in attesa per questo artista. (L'importo potrebbe derivare da uno stato incoerente)")}
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {artistRoyalties.length > 0 && (
                    <tfoot className="bg-[#F2EEE8]/30 border-t-2 border-[#EAE3D9]">
                      <tr>
                        <td colSpan={4} className="p-4 text-right font-bold text-[#59554E] font-['Karla'] uppercase tracking-wider">
                          Totale Calcolato:
                        </td>
                        <td className="p-4 text-right font-black text-[#FF4F00] text-lg font-['Karla']">
                          {Number(artistRoyalties.reduce((sum, r) => sum + (r.feeAmount || 0), 0)).toFixed(2)} EUR
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4 border-t border-[#EAE3D9]">
            <button
              onClick={handleMarkAsPaid}
              disabled={markingPaid}
              className={clsx(
                "inline-flex items-center gap-2 bg-green-600 text-white px-8 py-4 rounded-full font-bold transition-all shadow-md font-['Karla'] uppercase tracking-wider",
                markingPaid ? "opacity-50 cursor-not-allowed" : "hover:bg-green-700 active:scale-[0.98]"
              )}
            >
              <Check size={20} />
              {markingPaid ? t('adminPayments.saving', 'Salvataggio in corso...') : `${t('adminPayments.markPaid', 'Segna come Pagato')} (${Number(selectedArtist.pendingBalance).toFixed(2)} EUR)`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
