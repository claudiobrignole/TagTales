import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, where, getDocs, orderBy, doc, getDoc, updateDoc } from 'firebase/firestore';
import { FileText, Download, CheckCircle, Clock, X, AlertCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import clsx from 'clsx';
import { useI18n } from '../contexts/I18nContext';


export default function Contracts() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Writer specific state
  const [showSignModal, setShowSignModal] = useState(false);
  const [selectedContract, setSelectedContract] = useState<any>(null);
  const [signing, setSigning] = useState(false);

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

  const handleSignContract = async () => {
    if (!selectedContract || !user) return;
    setSigning(true);
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();
      const writerName = userData?.fullName || userData?.artistName || user.displayName || 'Writer';

      const contractRef = doc(db, 'contratti', selectedContract.id);
      const updateData = {
        stato: 'signed',
        signedBy: writerName,
        signedEmail: user.email || '',
        signedAt: new Date().toISOString()
      };
      await updateDoc(contractRef, updateData);
      
      setContracts(contracts.map(c => c.id === selectedContract.id ? { ...c, ...updateData } : c));
      setShowSignModal(false);
      setSelectedContract(null);
    } catch (error) {
      console.error("Error signing contract:", error);
      alert("Failed to sign contract.");
    } finally {
      setSigning(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full">{t('common.loading')}</div>;
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto font-['Karla']">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
        <div>
          <h1 className="text-4xl md:text-6xl font-['Shamgod'] leading-[0.8] tracking-tight text-[#121212] mb-4 uppercase">{t('contracts.title')}</h1>
          <p className="text-[#59554E] text-lg">{t('contracts.subtitle')}</p>
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
                      {(contract.stato || contract.status) === 'signed' ? 'Signed & Active' : 
                       (contract.stato || contract.status) === 'expired' ? 'Expired' : 'Pending Signature'}
                    </span>
                    {(contract.stato || contract.status) === 'signed' && contract.signedAt && (
                      <p className="text-xs text-[#59554E] mt-2">
                        Signed by {contract.signedBy} on {format(parseISO(contract.signedAt), 'MMM dd, yyyy HH:mm')}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-3 shrink-0">
                  {contract.documentUrl && (
                    <a 
                      href={contract.documentUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-6 py-3 rounded-full font-bold text-[#121212] bg-[#F2EEE8] hover:bg-[#EAE3D9] transition-colors"
                    >
                      <Download size={18} />
                      <span>Download PDF</span>
                    </a>
                  )}
                  {(contract.stato || contract.status) === 'pending' && (
                    <button 
                      onClick={() => {
                        setSelectedContract(contract);
                        setShowSignModal(true);
                      }}
                      className="flex items-center gap-2 px-6 py-3 rounded-full font-bold text-white bg-[#FF4F00] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-[#FF4F00]/20"
                    >
                      <FileText size={18} />
                      <span>Review & Sign</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Writer Sign Modal */}
      {showSignModal && selectedContract && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-[#EAE3D9] flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-2xl font-bold text-[#121212]">Review & Sign</h2>
                <p className="text-sm text-[#59554E]">{selectedContract.title}</p>
              </div>
              <button onClick={() => setShowSignModal(false)} className="p-2 hover:bg-[#F2EEE8] rounded-full transition-colors">
                <X size={24} className="text-[#59554E]" />
              </button>
            </div>
            
            <div className="flex-1 bg-gray-100 overflow-hidden relative">
              <iframe 
                src={`${selectedContract.documentUrl}#toolbar=0`} 
                className="w-full h-full border-none"
                title="Contract Document"
              />
            </div>

            <div className="p-6 border-t border-[#EAE3D9] bg-[#F2EEE8] shrink-0 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-[#59554E]">
                By clicking t('contracts.signContract'), you digitally accept the terms outlined in this document.
              </div>
              <div className="flex gap-3 w-full sm:w-auto">
                <button 
                  onClick={() => setShowSignModal(false)}
                  className="flex-1 sm:flex-none px-6 py-3 rounded-full font-bold text-[#121212] bg-white hover:bg-gray-50 transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button 
                  onClick={handleSignContract}
                  disabled={signing}
                  className="flex-1 sm:flex-none px-8 py-3 rounded-full font-bold text-white bg-[#FF4F00] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-[#FF4F00]/20 disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
                >
                  {signing ? (
                    <span>{t('contracts.signing')}</span>
                  ) : (
                    <>
                      <CheckCircle size={18} />
                      <span>{t('contracts.signContract')}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

