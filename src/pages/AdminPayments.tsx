import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, getDocs, orderBy, doc, updateDoc, getDoc } from 'firebase/firestore';
import { CreditCard, FileText, Check, AlertCircle, X, Download } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { sendEmailNotification } from '../utils/emailService';
import { createNotification } from '../utils/notificationService';
import { useI18n } from '../contexts/I18nContext';


export default function AdminPayments() {
  const { t } = useI18n();

  const { user } = useAuth();
  const navigate = useNavigate();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [processingPayment, setProcessingPayment] = useState<any | null>(null);
  const [actionType, setActionType] = useState<'Paid' | 'Rejected' | null>(null);
  const [adminNote, setAdminNote] = useState('');

  useEffect(() => {
    const fetchPayments = async () => {
      if (!user) return;
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.data()?.role !== 'admin' && user.email?.toLowerCase() !== 'claudio@brignole.ch') {
          navigate('/');
          return;
        }

        const q = query(collection(db, 'payouts'), orderBy('dataRichiesta', 'desc'));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPayments(data);
      } catch (error) {
        console.error("Error fetching payments:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [user]);

  const handleUpdatestatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!processingPayment || !actionType) return;
    
    // Mapping internal types to Italian DB values
    const dbStatus = actionType === 'Paid' ? 'pagato' : 'rifiutato';

    try {
      await updateDoc(doc(db, 'payouts', processingPayment.id), { 
        stato: dbStatus,
        noteAdmin: adminNote
      });
      setPayments(prev => prev.map(p => p.id === processingPayment.id ? { ...p, stato: dbStatus, noteAdmin: adminNote } : p));
      setSuccess(t('adminPayments.paymentMarked', { status: actionType === 'Paid' ? t('adminPayments.paid') : t('adminPayments.rejected') }));

      if (actionType === 'Paid' && processingPayment.emailArtista) {
        await sendEmailNotification(processingPayment.emailArtista, 'payout_paid', {
          amount: `${Number(processingPayment.importo).toFixed(2)} ${t('dashboard.currency')}`,
          userId: processingPayment.artistaId
        });
      }

      await createNotification(
        processingPayment.artistaId,
        t('adminPayments.payoutStatus', { status: actionType === 'Paid' ? t('adminPayments.paid') : t('adminPayments.rejected') }),
        t('adminPayments.payoutStatusBody', { amount: Number(processingPayment.importo).toFixed(2), status: actionType === 'Paid' ? t('adminPayments.paid').toLowerCase() : t('adminPayments.rejected').toLowerCase() }),
        'payout_update',
        '/payments'
      );

      setTimeout(() => setSuccess(''), 3000);
      setProcessingPayment(null);
      setAdminNote('');
      setActionType(null);
    } catch (err: any) {
      console.error("Error updating payment:", err);
      setError(err.message || t('adminPayments.updateFailed'));
    }
  };

  const openProcessModal = (payment: any, type: 'Paid' | 'Rejected') => {
    setProcessingPayment(payment);
    setActionType(type);
    setAdminNote(payment.noteAdmin || '');
  };

  const handleExportCSV = () => {
    if (payments.length === 0) return;
    const headers = ['ID Richiesta', 'Data', 'Email Writer', 'Importo', 'Stato', 'Metodo Pagamento', 'Note Admin'];
    const rows = payments.map(p => [
      p.id || '-',
      p.dataRichiesta ? format(parseISO(p.dataRichiesta), 'dd MMM yyyy') : '-',
      p.emailArtista || '-',
      p.importo || 0,
      p.stato || '-',
      p.metodoPagamento || '-',
      p.noteAdmin || '-'
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `admin_payouts_history_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full text-[#59554E] py-20 font-['Karla'] font-bold uppercase tracking-wider">Caricamento...</div>;
  }

  return (
    <div className="space-y-8 p-4 md:p-8 max-w-7xl mx-auto min-h-screen">
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-[#121212] mb-2 font-['Shamgod'] uppercase leading-none text-[8vw] md:text-[60px]">{t('payments.allPaymentsTitle')}</h1>
          <p className="text-[#59554E] text-lg font-['Karla']">{t('adminPayments.subtitle')}</p>
        </div>
        <button 
          onClick={handleExportCSV}
          className="inline-flex items-center justify-center gap-2 bg-white border border-[#EAE3D9] text-[#121212] font-bold py-3 px-6 rounded-2xl hover:bg-[#F2EEE8] transition-colors shadow-sm font-['Karla'] uppercase tracking-wider"
        >
          <Download size={20} />
          <span>{t('sales.exportCSV')}</span>
        </button>
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

      <div className="bg-white rounded-3xl shadow-sm border border-[#EAE3D9] overflow-hidden">
        <div className="p-6 border-b border-[#EAE3D9] flex items-center justify-between bg-[#F2EEE8]/30">
          <h2 className="text-xl font-bold text-[#121212] flex items-center gap-3">
            <CreditCard className="text-[#FF4F00]" />
            {t('adminPayments.allRequests')}
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#EAE3D9] bg-[#F2EEE8]/50">
                <th className="p-4 text-xs font-bold text-[#59554E] uppercase tracking-wider">{t('common.date')}</th>
                <th className="p-4 text-xs font-bold text-[#59554E] uppercase tracking-wider">{t('adminPayments.artistEmail')}</th>
                <th className="p-4 text-xs font-bold text-[#59554E] uppercase tracking-wider">{t('payments.method')}</th>
                <th className="p-4 text-xs font-bold text-[#59554E] uppercase tracking-wider">{t('payments.amount')}</th>
                <th className="p-4 text-xs font-bold text-[#59554E] uppercase tracking-wider">{t('payments.invoice')}</th>
                <th className="p-4 text-xs font-bold text-[#59554E] uppercase tracking-wider">{t('payments.status')}</th>
                <th className="p-4 text-xs font-bold text-[#59554E] uppercase tracking-wider text-right">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE3D9]">
              {payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-[#F2EEE8]/30 transition-colors">
                  <td className="p-4 text-sm font-medium text-[#121212] font-['Karla']">
                    {payment.dataRichiesta ? format(parseISO(payment.dataRichiesta), 'dd MMM yyyy') : '-'}
                  </td>
                  <td className="p-4 text-sm text-[#59554E] font-['Karla']">
                    {payment.emailArtista || t('adminPayments.unknown')}
                  </td>
                  <td className="p-4 text-sm text-[#59554E] font-['Karla']">
                    {payment.metodoPagamento || t('payments.bankTransfer')}
                  </td>
                  <td className="p-4 text-sm font-bold text-[#121212] font-['Karla']">
                    {Number(payment.importo).toFixed(2)} {t('adminPayments.euro')}
                  </td>
                  <td className="p-4">
                    {payment.urlFattura ? (
                      <a 
                        href={payment.urlFattura} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-[#FF4F00] hover:underline font-medium font-['Karla'] uppercase tracking-wider"
                      >
                        <FileText size={16} />
                        {t('adminPayments.viewInvoice')}
                      </a>
                    ) : (
                      <span className="text-sm text-gray-400 italic font-['Karla']">{t('payments.noInvoice')}</span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1">
                      <span className={clsx(
                        "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest inline-block w-max font-['Karla']",
                        payment.stato === 'pagato' ? "bg-green-100 text-green-700" :
                        payment.stato === 'rifiutato' ? "bg-red-100 text-red-700" :
                        "bg-orange-100 text-orange-700"
                      )}>
                        {payment.stato === 'pagato' ? t('adminPayments.paid') : payment.stato === 'rifiutato' ? t('adminPayments.rejected') : t('adminPayments.pending')}
                      </span>
                      {payment.noteAdmin && (
                        <span className="text-xs text-[#59554E] italic max-w-[150px] truncate font-['Karla']" title={payment.noteAdmin}>
                          {t('adminPayments.note')}: {payment.noteAdmin}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    {(payment.stato === 'in_attesa' || !payment.stato) && (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openProcessModal(payment, 'Paid')}
                          className="px-4 py-2 bg-green-100 text-green-700 rounded-full text-xs font-bold hover:bg-green-200 transition-all font-['Karla'] uppercase tracking-wider"
                        >
                          {t('adminPayments.approve')}
                        </button>
                        <button
                          onClick={() => openProcessModal(payment, 'Rejected')}
                          className="px-4 py-2 bg-red-100 text-red-700 rounded-full text-xs font-bold hover:bg-red-200 transition-all font-['Karla'] uppercase tracking-wider"
                        >
                          {t('adminPayments.reject')}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {payments.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[#59554E]">
                    {t('adminPayments.noRequests')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Process Modal */}
      {processingPayment && actionType && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-[#121212]">
                {t('adminPayments.markAs', { status: actionType === 'Paid' ? t('adminPayments.paid') : t('adminPayments.rejected') })}
              </h3>
              <button 
                onClick={() => {
                  setProcessingPayment(null);
                  setActionType(null);
                }}
                className="text-[#59554E] hover:text-[#121212] transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleUpdatestatus} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-[0.75rem] font-bold uppercase tracking-[0.1em] text-[#121212]">
                  {t('adminPayments.adminNoteOptional')}
                </label>
                <textarea
                  value={adminNote}
                  onChange={e => setAdminNote(e.target.value)}
                  className="w-full p-4 bg-[#F2EEE8] border-none rounded-xl text-[#121212] focus:ring-2 focus:ring-[#FF4F00] outline-none transition-all resize-none"
                  rows={3}
                  placeholder={t('adminPayments.notePlaceholder', { status: actionType === 'Paid' ? t('adminPayments.paid').toLowerCase() : t('adminPayments.rejected').toLowerCase() })}
                />
              </div>
              
              <button 
                type="submit" 
                className={clsx(
                  "w-full text-white py-4 rounded-full font-bold transition-all active:scale-[0.98]",
                  actionType === 'Paid' ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
                )}
              >
                {t('adminPayments.confirmStatus', { status: actionType === 'Paid' ? t('adminPayments.paid') : t('adminPayments.rejected') })}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
