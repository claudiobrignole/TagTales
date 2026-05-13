import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db, storage } from '../firebase';
import { collection, query, where, getDocs, orderBy, addDoc, doc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { FileText, Download, CheckCircle, Clock, Plus, X, AlertCircle, Users } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import clsx from 'clsx';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
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
  const [newContract, setNewContract] = useState({ title: '', writerIds: [] as string[], file: null as File | null });

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

  const handleWriterSelection = (writerId: string) => {
    setNewContract(prev => {
      const isSelected = prev.writerIds.includes(writerId);
      if (isSelected) {
        return { ...prev, writerIds: prev.writerIds.filter(id => id !== writerId) };
      } else {
        return { ...prev, writerIds: [...prev.writerIds, writerId] };
      }
    });
  };

  const handleUploadContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContract.file || newContract.writerIds.length === 0 || !newContract.title) return;

    setUploading(true);
    try {
      // Upload the file once
      const storageRef = ref(storage, `contracts/templates/${Date.now()}_${newContract.file.name}`);
      const snapshot = await uploadBytes(storageRef, newContract.file, { contentType: 'application/pdf' });
      const url = await getDownloadURL(snapshot.ref);

      // Create a contract document for each selected writer
      const newContractsData = [];
      for (const writerId of newContract.writerIds) {
        const contractData = {
          artistaId: writerId,
          title: newContract.title,
          stato: 'pending',
          documentUrl: url,
          date: new Date().toISOString()
        };
        const docRef = await addDoc(collection(db, 'contratti'), contractData);
        
        const writer = writers.find(a => a.id === writerId);
        newContractsData.push({ 
          id: docRef.id, 
          ...contractData,
          writerName: writer?.fullName || writer?.artistName || writer?.email || 'Unknown Writer'
        });

        // Send email notification
        if (writer?.email) {
          await sendEmailNotification(writer.email, 'new_contract', { 
            contractTitle: newContract.title,
            userId: writerId
          });
        }

        // Create in-app notification
        await createNotification(
          writerId,
          t('adminContracts.newContractNotification'),
          t('adminContracts.newContractNotificationBody', { title: newContract.title }),
          'contract',
          '/contracts'
        );
      }

      setContracts([...newContractsData, ...contracts]);
      setShowUploadModal(false);
      setNewContract({ title: '', writerIds: [], file: null });
    } catch (error) {
      console.error("Error uploading contract:", error);
      alert(t('adminContracts.uploadFailed'));
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadSigned = async (contract: any) => {
    try {
      // Fetch the original PDF
      const response = await fetch(contract.documentUrl);
      if (!response.ok) throw new Error('Network response was not ok');
      const originalPdfBytes = await response.arrayBuffer();

      // Load the PDF
      const pdfDoc = await PDFDocument.load(originalPdfBytes);
      
      // Embed font
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      // Add a new page for the signature record
      const page = pdfDoc.addPage();
      const { width, height } = page.getSize();

      // Draw signature details
      page.drawText(t('adminContracts.signatureRecord'), { x: 50, y: height - 50, size: 24, font: boldFont, color: rgb(0, 0, 0) });
      
      page.drawText(`${t('contracts.contractTitle')}: ${contract.title}`, { x: 50, y: height - 100, size: 12, font });
      page.drawText(`${t('adminContracts.signedBy')}: ${contract.signedBy}`, { x: 50, y: height - 130, size: 12, font });
      page.drawText(`${t('adminContracts.email')}: ${contract.signedEmail}`, { x: 50, y: height - 160, size: 12, font });
      page.drawText(`${t('adminContracts.dateTime')}: ${format(parseISO(contract.signedAt), 'MMMM dd, yyyy HH:mm:ss')}`, { x: 50, y: height - 190, size: 12, font });
      page.drawText(t('adminContracts.statusDigitallySigned'), { x: 50, y: height - 220, size: 12, font, color: rgb(0, 0.5, 0) });

      // Serialize the PDFDocument to bytes
      const pdfBytes = await pdfDoc.save();

      // Trigger download
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${contract.title.replace(/\s+/g, '_')}_Signed_${contract.writerName.replace(/\s+/g, '_')}.pdf`;
      link.click();
    } catch (error) {
      console.error("Error generating signed PDF:", error);
      alert(t('adminContracts.downloadFailed'));
      window.open(contract.documentUrl, '_blank');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full">{t('adminContracts.loading')}</div>;
  }

  return (
    <div className="w-full space-y-8 font-['Karla']">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
        <div>
          <h1 className="text-4xl md:text-6xl font-['Shamgod'] uppercase leading-[0.8] tracking-tight text-[#121212] mb-4">{t('adminContracts.title')}</h1>
          <p className="text-[#59554E] text-lg">{t('adminContracts.subtitle')}</p>
        </div>
        <button 
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-[#121212] text-white rounded-full font-bold hover:bg-[#FF4F00] transition-colors shrink-0"
        >
          <Plus size={20} />
          <span>{t('adminContracts.newContract')}</span>
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
                      {(contract.stato || contract.status) === 'signed' && contract.signedAt && (
                        <div className="text-[10px] text-[#59554E] mt-1">
                          {format(parseISO(contract.signedAt), 'MMM dd, yyyy HH:mm')}
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      {(contract.stato || contract.status) === 'signed' ? (
                        <button 
                          onClick={() => handleDownloadSigned(contract)}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold text-[#121212] bg-[#F2EEE8] hover:bg-[#EAE3D9] transition-colors"
                        >
                          <Download size={14} />
                          <span>{t('adminContracts.signedPdf')}</span>
                        </button>
                      ) : (
                        <a 
                          href={contract.documentUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold text-[#59554E] hover:text-[#121212] hover:bg-[#F2EEE8] transition-colors"
                        >
                          <FileText size={14} />
                          <span>{t('adminContracts.viewOriginal')}</span>
                        </a>
                      )}
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
              <h2 className="text-2xl font-bold text-[#121212]">{t('adminContracts.assignContract')}</h2>
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
              
              <div className="space-y-2">
                <label className="block text-[0.75rem] font-bold uppercase tracking-[0.1em] text-[#121212] flex justify-between">
                  <span>{t('contracts.selectWriter', 'Seleziona Writer')}</span>
                  <span className="text-[#FF4F00]">{newContract.writerIds.length} {t('adminContracts.selected')}</span>
                </label>
                <div className="bg-[#F2EEE8] rounded-xl p-2 max-h-48 overflow-y-auto space-y-1">
                  {writers.length === 0 ? (
                    <div className="p-4 text-center text-sm text-[#59554E]">{t('adminContracts.noWriters', 'Nessun writer trovato')}</div>
                  ) : (
                    writers.map(writer => (
                      <label key={writer.id} className="flex items-center gap-3 p-2 hover:bg-white rounded-lg cursor-pointer transition-colors">
                        <input 
                          type="checkbox" 
                          checked={newContract.writerIds.includes(writer.id)}
                          onChange={() => handleWriterSelection(writer.id)}
                          className="w-4 h-4 text-[#FF4F00] rounded border-gray-300 focus:ring-[#FF4F00]"
                        />
                        <span className="text-sm font-medium text-[#121212]">
                          {writer.fullName || writer.artistName || writer.email}
                        </span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[0.75rem] font-bold uppercase tracking-[0.1em] text-[#121212]">{t('adminContracts.pdfDocument')}</label>
                <input 
                  type="file" 
                  accept=".pdf"
                  onChange={(e) => setNewContract({...newContract, file: e.target.files?.[0] || null})}
                  required
                  className="w-full px-4 py-3 bg-[#F2EEE8] border-none rounded-xl text-[#121212] focus:ring-2 focus:ring-[#FF4F00] outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-[#121212] file:text-white hover:file:bg-[#FF4F00] file:transition-colors file:cursor-pointer" 
                />
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
                  disabled={uploading || newContract.writerIds.length === 0}
                  className="px-6 py-3 rounded-full font-bold text-white bg-[#121212] hover:bg-[#FF4F00] transition-colors disabled:opacity-50"
                >
                  {uploading ? t('adminContracts.sending') : t('adminContracts.sendContract')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
