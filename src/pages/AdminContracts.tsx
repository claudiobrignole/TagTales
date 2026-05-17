import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, where, getDocs, orderBy, addDoc, doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { FileText, CheckCircle, Clock, Plus, X, Search, AlertCircle, ExternalLink, Trash2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';
import { sendEmailNotification } from '../utils/emailService';
import { createNotification } from '../utils/notificationService';
import { useI18n } from '../contexts/I18nContext';


export default function AdminContracts() {
  const { t } = useI18n();

  const { user } = useAuth();
  const navigate = useNavigate();
  const [contracts, setContracts] = useState<any[]>([]);
  const [writers, setWriters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newContract, setNewContract] = useState({ title: '', writerId: '', documentUrl: '' });
  const [writerSearch, setWriterSearch] = useState('');
  const [contractToDelete, setContractToDelete] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.data()?.role !== 'admin' && user.email?.toLowerCase() !== 'claudio@brignole.ch') {
          navigate('/');
          return;
        }

        const contractsQ = query(collection(db, 'contratti'), orderBy('date', 'desc'));
        const contractsSnapshot = await getDocs(contractsQ);
        const contractsData = contractsSnapshot.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
        
        const usersQ = query(collection(db, 'users'), where('role', 'in', ['writer', 'artist']));
        const usersSnapshot = await getDocs(usersQ);
        const writersData = usersSnapshot.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
        
        // Map writer details to contracts
        const enrichedContracts = contractsData.map(c => {
          const writer = writersData.find(a => a.id === (c.artistaId || c.artistId));
          return {
            ...c,
            writerName: writer?.fullName || writer?.artistName || writer?.email || 'Unknown Writer'
          };
        });

        setContracts(enrichedContracts);
        setWriters(writersData);
      } catch (error) {
        console.error("Error fetching admin data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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

  const handleMarkAsSigned = async (contract: any) => {
    try {
      await updateDoc(doc(db, 'contratti', contract.id), {
        stato: 'signed',
        signedAt: new Date().toISOString(),
        signedBy: contract.writerName || 'Writer'
      });
      
      setContracts(prev => prev.map(c => 
        c.id === contract.id 
          ? { ...c, stato: 'signed', signedAt: new Date().toISOString(), signedBy: contract.writerName || 'Writer' } 
          : c
      ));

      // Create in-app notification for the writer
      if (contract.artistaId || contract.artistId) {
        await createNotification(
          contract.artistaId || contract.artistId,
          "Contratto Validato",
          `Il documento "${contract.title}" è stato verificato e contrassegnato come firmato.`,
          'contract',
          '/app/contracts'
        );
      }
    } catch (error) {
      console.error("Error marking contract as signed:", error);
      alert('Errore durante l\'aggiornamento del contratto.');
    }
  };

  const handleUploadContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContract.documentUrl || !newContract.writerId || !newContract.title) return;

    setUploading(true);
    try {
      const contractData = {
        artistaId: newContract.writerId,
        title: newContract.title,
        stato: 'in_review', // Set as in review initially
        documentUrl: newContract.documentUrl,
        date: new Date().toISOString(),
      };
      const docRef = await addDoc(collection(db, 'contratti'), contractData);
      
      const writer = writers.find(a => a.id === newContract.writerId);
      const newContractDataObj = { 
        id: docRef.id, 
        ...contractData,
        writerName: writer?.fullName || writer?.artistName || writer?.email || 'Unknown Writer'
      };

      // Send email notification (Note: might need a new email template for Archival)
      if (writer?.email) {
        await sendEmailNotification(writer.email, 'new_contract', { 
          contractTitle: newContract.title,
          userId: newContract.writerId
        });
      }

      // Create in-app notification
      await createNotification(
        newContract.writerId,
        "Nuovo Contratto in Revisione",
        `Il documento "${newContract.title}" è in attesa della tua firma.`,
        'contract',
        '/app/contracts'
      );

      setContracts([newContractDataObj, ...contracts]);
      setShowUploadModal(false);
      setNewContract({ title: '', writerId: '', documentUrl: '' });
    } catch (error) {
      console.error("Error archiving contract:", error);
      alert(t('adminContracts.uploadFailed') || 'Errore durante il salvataggio.');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full">{t('adminContracts.loading')}</div>;
  }

  return (
    <div className="w-full space-y-8 font-['Karla'] pb-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
        <div>
          <h1 className="text-4xl md:text-6xl font-['Shamgod'] uppercase leading-[0.8] tracking-tight text-[#121212] mb-4">{t('adminContracts.title')}</h1>
          <p className="text-[#59554E] text-lg">{t('adminContracts.subtitle') || 'Gestisci i contratti firmati tramite Google Docs'}</p>
        </div>
        <button 
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-[#121212] text-white rounded-full font-bold hover:bg-[#FF4F00] transition-colors shrink-0"
        >
          <Plus size={20} />
          <span>{t('adminContracts.newContract') || 'Archivia Contratto'}</span>
        </button>
      </header>

      <div className="bg-white rounded-3xl shadow-sm border border-[#EAE3D9] overflow-hidden">
        {contracts.length === 0 ? (
          <div className="p-16 text-center text-[#59554E] flex flex-col items-center">
            <div className="w-20 h-20 bg-[#F2EEE8] rounded-full flex items-center justify-center mb-6">
              <FileText size={32} />
            </div>
            <h3 className="text-2xl font-bold text-[#121212] mb-2">{t('adminContracts.noContracts')}</h3>
            <p className="max-w-md">{t('adminContracts.noContractsDesc')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#EAE3D9] bg-[#F2EEE8]/50">
                  <th className="p-4 font-bold text-sm text-[#59554E] uppercase tracking-wider">{t('contracts.contractTitle')}</th>
                  <th className="p-4 font-bold text-sm text-[#59554E] uppercase tracking-wider">{t('adminContracts.artist')}</th>
                  <th className="p-4 font-bold text-sm text-[#59554E] uppercase tracking-wider">{t('adminContracts.sentDate')}</th>
                  <th className="p-4 font-bold text-sm text-[#59554E] uppercase tracking-wider">{t('adminContracts.status')}</th>
                  <th className="p-4 font-bold text-sm text-[#59554E] uppercase tracking-wider text-right">{t('adminContracts.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE3D9]">
                {contracts.map((contract) => (
                  <tr key={contract.id} className="hover:bg-[#F2EEE8]/30 transition-colors">
                    <td className="p-4 font-medium text-[#121212]">{contract.title}</td>
                    <td className="p-4 text-[#59554E]">{contract.writerName}</td>
                    <td className="p-4 text-[#59554E]">{format(parseISO(contract.date), 'MMM dd, yyyy')}</td>
                    <td className="p-4">
                      <span className={clsx(
                        "inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full",
                        (contract.stato || contract.status) === 'signed' ? "bg-green-100 text-green-700" : 
                        (contract.stato || contract.status) === 'expired' ? "bg-gray-100 text-gray-700" : "bg-yellow-100 text-yellow-700"
                      )}>
                        {(contract.stato || contract.status) === 'signed' ? <CheckCircle size={12} /> : 
                         (contract.stato || contract.status) === 'expired' ? <AlertCircle size={12} /> : <Clock size={12} />}
                        {(contract.stato || contract.status) === 'signed' ? t('adminContracts.signed') : 
                         (contract.stato || contract.status) === 'expired' ? t('adminContracts.expired') : t('adminContracts.pending')}
                      </span>
                    </td>
                    <td className="p-4 flex items-center justify-end gap-2 text-right">
                      {(contract.stato || contract.status) !== 'signed' && (
                        <button
                          onClick={() => handleMarkAsSigned(contract)}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold text-white bg-green-600 hover:bg-green-700 transition-colors shrink-0"
                        >
                          <CheckCircle size={14} />
                          <span>Segna come Firmato</span>
                        </button>
                      )}
                      <a 
                        href={contract.documentUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold text-[#121212] bg-[#F2EEE8] hover:bg-[#EAE3D9] transition-colors shrink-0"
                      >
                        <ExternalLink size={14} />
                        <span>Apri Documento</span>
                      </a>
                      <button
                        onClick={() => setContractToDelete(contract.id)}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors shrink-0"
                        title={t('common.delete') || 'Elimina'}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-[#EAE3D9] flex justify-between items-center shrink-0">
              <h2 className="text-2xl font-bold text-[#121212]">Archivia Contratto Firmato</h2>
              <button onClick={() => setShowUploadModal(false)} className="p-2 hover:bg-[#F2EEE8] rounded-full transition-colors">
                <X size={24} className="text-[#59554E]" />
              </button>
            </div>
            
            <form onSubmit={handleUploadContract} className="p-6 space-y-6 overflow-y-auto">
              <div className="space-y-2">
                <label className="block text-[0.75rem] font-bold uppercase tracking-[0.1em] text-[#121212]">{t('contracts.contractTitle')}</label>
                <input 
                  type="text" 
                  value={newContract.title}
                  onChange={(e) => setNewContract({...newContract, title: e.target.value})}
                  required
                  className="w-full px-4 py-3 bg-[#F2EEE8] border-none rounded-xl text-[#121212] focus:ring-2 focus:ring-[#FF4F00] outline-none" 
                  placeholder={t('adminContracts.egTitle')} 
                />
              </div>
              
              <div className="space-y-4">
                <label className="block text-[0.75rem] font-bold uppercase tracking-[0.1em] text-[#121212]">
                  {t('contracts.selectWriter', 'Seleziona Writer')}
                </label>
                
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#59554E]" size={18} />
                  <input
                    type="text"
                    value={writerSearch}
                    onChange={(e) => setWriterSearch(e.target.value)}
                    placeholder="Cerca nome o email..."
                    className="w-full pl-10 pr-4 py-3 bg-white border border-[#EAE3D9] rounded-xl text-[#121212] focus:ring-2 focus:ring-[#FF4F00] outline-none"
                  />
                </div>

                <div className="bg-[#F2EEE8] rounded-xl p-2 max-h-48 overflow-y-auto space-y-1">
                  {writers.filter(w => {
                    const search = writerSearch.toLowerCase();
                    return (w.fullName || '').toLowerCase().includes(search) || 
                           (w.artistName || '').toLowerCase().includes(search) || 
                           (w.email || '').toLowerCase().includes(search);
                  }).map(writer => (
                    <label key={writer.id} className={clsx(
                      "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors",
                      newContract.writerId === writer.id ? "bg-white shadow-sm ring-1 ring-[#FF4F00]" : "hover:bg-white/50"
                    )}>
                      <input 
                        type="radio" 
                        name="contract_writer"
                        value={writer.id}
                        checked={newContract.writerId === writer.id}
                        onChange={(e) => setNewContract({...newContract, writerId: e.target.value})}
                        className="w-4 h-4 text-[#FF4F00] focus:ring-[#FF4F00] border-gray-300"
                        required
                      />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-[#121212]">
                          {writer.fullName || writer.artistName || writer.email}
                        </span>
                        {(writer.fullName || writer.artistName) && writer.email && (
                          <span className="text-xs text-[#59554E]">{writer.email}</span>
                        )}
                      </div>
                    </label>
                  ))}
                  {writers.filter(w => {
                    const search = writerSearch.toLowerCase();
                    return (w.fullName || '').toLowerCase().includes(search) || 
                           (w.artistName || '').toLowerCase().includes(search) || 
                           (w.email || '').toLowerCase().includes(search);
                  }).length === 0 && (
                    <div className="p-4 text-center text-sm text-[#59554E]">Nessun writer trovato</div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[0.75rem] font-bold uppercase tracking-[0.1em] text-[#121212]">Link Google Drive (PDF Firmato)</label>
                <input 
                  type="url" 
                  value={newContract.documentUrl}
                  onChange={(e) => setNewContract({...newContract, documentUrl: e.target.value})}
                  required
                  placeholder="https://drive.google.com/file/d/..."
                  className="w-full px-4 py-3 bg-[#F2EEE8] border-none rounded-xl text-[#121212] focus:ring-2 focus:ring-[#FF4F00] outline-none" 
                />
                <p className="text-xs text-[#59554E]">Assicurati che il link condivida l'accesso in visualizzazione per il writer.</p>
              </div>
              
              <div className="pt-4 flex justify-end gap-3 shrink-0">
                <button 
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-6 py-3 rounded-full font-bold text-[#121212] bg-[#F2EEE8] hover:bg-[#EAE3D9] transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button 
                  type="submit"
                  disabled={uploading || !newContract.writerId}
                  className="px-6 py-3 rounded-full font-bold text-white bg-[#121212] hover:bg-[#FF4F00] transition-colors disabled:opacity-50"
                >
                  {uploading ? "Salvataggio..." : "Salva Contratto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

