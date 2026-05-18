import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, where, getDocs, orderBy, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { FileText, CheckCircle, Clock, AlertCircle, ExternalLink, Trash2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import clsx from 'clsx';
import { useI18n } from '../contexts/I18nContext';


export default function Contracts() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [contractToDelete, setContractToDelete] = useState<string | null>(null);

  useEffect(() => {
    const fetchContracts = async () => {
      if (!user) return;
      try {
        const q = query(collection(db, 'contratti'), where('artistaId', '==', user.uid), orderBy('date', 'desc'));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
        setContracts(data);
      } catch (error) {
        console.error("Error fetching contracts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchContracts();
  }, [user]);

  const confirmDeleteContract = async () => {
    if (!contractToDelete) return;
    try {
      await deleteDoc(doc(db, 'contratti', contractToDelete));
      setContracts(prev => prev.filter(c => c.id !== contractToDelete));
    } catch (error) {
      console.error("Error deleting contract:", error);
      alert('Errore durante l\'eliminazione del contratto.');
    } finally {
      setContractToDelete(null);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full">{t('common.loading')}</div>;
  }

  return (
    <div className="w-full space-y-8 font-['Karla']">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
        <div>
          <h1 className="text-4xl md:text-6xl font-['Shamgod'] leading-[0.8] tracking-tight text-[#121212] mb-4 uppercase">{t('contracts.title')}</h1>
          <p className="text-[#59554E] text-lg">{t('contracts.subtitle')} Il tuo archivio di contratti firmati.</p>
        </div>
      </header>

      <div className="bg-white rounded-3xl shadow-sm border border-[#EAE3D9] overflow-hidden">
        {contracts.length === 0 ? (
          <div className="p-16 text-center text-[#59554E] flex flex-col items-center">
            <div className="w-20 h-20 bg-[#F2EEE8] rounded-full flex items-center justify-center mb-6">
              <FileText size={32} />
            </div>
            <h3 className="text-2xl font-bold text-[#121212] mb-2">{t('contracts.noContractsFound')}</h3>
            <p className="max-w-md">{t('contracts.noContractsDesc')}</p>
          </div>
        ) : (
          <div className="divide-y divide-[#EAE3D9]">
            {contracts.map((contract) => (
              <div key={contract.id} className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-[#F2EEE8]/30 transition-colors">
                <div className="flex items-start gap-4">
                  <div className={clsx(
                    "p-3 rounded-2xl shrink-0 mt-1",
                    (contract.stato || contract.status) === 'signed' ? "bg-green-100 text-green-700" : 
                    (contract.stato || contract.status) === 'expired' ? "bg-gray-100 text-gray-700" : "bg-yellow-100 text-yellow-700"
                  )}>
                    {(contract.stato || contract.status) === 'signed' ? <CheckCircle size={24} /> : 
                     (contract.stato || contract.status) === 'expired' ? <AlertCircle size={24} /> : <Clock size={24} />}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#121212] mb-1">{contract.title}</h3>
                    <p className="text-sm text-[#59554E] mb-3">{format(parseISO(contract.date), 'MMMM dd, yyyy')}</p>
                    <span className={clsx(
                      "inline-block px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full",
                      (contract.stato || contract.status) === 'signed' ? "bg-green-100 text-green-700" : 
                      (contract.stato || contract.status) === 'expired' ? "bg-gray-100 text-gray-700" : "bg-yellow-100 text-yellow-700"
                    )}>
                      {t(`contracts.status.${(contract.stato || contract.status) === 'signed' ? 'signed' : (contract.stato || contract.status) === 'expired' ? 'expired' : 'pending'}`)}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 shrink-0">
                  {contract.documentUrl && (
                    <a 
                      href={contract.documentUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-6 py-3 rounded-full font-bold text-white bg-[#121212] hover:bg-[#FF4F00] transition-colors shadow-sm"
                    >
                      <ExternalLink size={18} />
                      <span>{t('contracts.openDocument')}</span>
                    </a>
                  )}
                  <button
                    onClick={() => setContractToDelete(contract.id)}
                    className="flex flex-col items-center justify-center p-3 rounded-full text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                    title={t('common.delete') || 'Elimina'}
                  >
                    <Trash2 size={24} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {contractToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#FAF8F5] rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl border border-[#EAE3D9]">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={32} />
              </div>
              <h2 className="text-xl font-bold text-[#121212] mb-2 font-['Shamgod'] uppercase">Conferma Eliminazione</h2>
              <p className="text-[#59554E] text-sm mb-6">
                Sei sicuro di voler eliminare questo contratto? Questa operazione non può essere annullata.
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setContractToDelete(null)}
                  className="flex-1 py-3 px-4 bg-[#EAE3D9] text-[#121212] font-bold rounded-xl hover:bg-[#D8D0C5] transition-colors uppercase tracking-wider text-xs"
                >
                  Annulla
                </button>
                <button
                  onClick={confirmDeleteContract}
                  className="flex-1 py-3 px-4 bg-[#FF4F00] text-white font-bold rounded-xl hover:bg-[#E64700] transition-colors uppercase tracking-wider text-xs shadow-md shadow-[#FF4F00]/20"
                >
                  Elimina
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

