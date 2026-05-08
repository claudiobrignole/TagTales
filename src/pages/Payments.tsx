import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db, storage } from '../firebase';
import { collection, query, where, getDocs, orderBy, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { CreditCard, FileText, Upload, Check, AlertCircle, Receipt, Wallet, Download } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { it, enUS } from 'date-fns/locale';
import clsx from 'clsx';
import { sendEmailNotification } from '../utils/emailService';
import { useI18n } from '../contexts/I18nContext';
import { calculateEarnings } from '../utils/earnings';


export default function Payments() {
  const { user } = useAuth();
  const { t, language } = useI18n();
  const dateLocale = language === 'IT' ? it : enUS;
  const [payments, setPayments] = useState<any[]>([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [excludedSalesCount, setExcludedSalesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');

  const fetchPaymentsAndSales = async () => {
    if (!user) return;
    try {
      // 1. Fetch payments
      const q = query(collection(db, 'payouts'), where('artistaId', '==', user.uid), orderBy('date', 'desc'));
      const snapshot = await getDocs(q);
      const paymentsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPayments(paymentsData);

      // 2. Fetch artist's artworks to get ecwidProductIds and costs
      const artworksQuery = query(collection(db, 'opere'), where('artistaId', '==', user.uid));
      const artworksSnapshot = await getDocs(artworksQuery);
      const artworksMap = new Map();
      artworksSnapshot.forEach(doc => {
        artworksMap.set(doc.data().ecwidId, doc.data());
      });
      const productIds = Array.from(artworksMap.keys());

      if (productIds.length > 0) {
        // 3. Fetch sales from backend
        const response = await fetch('/api/sales', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productIds })
        });

        if (response.ok) {
          const data = await response.json();
          const sales = data.sales || [];
          let excludedCount = 0;
          const earnings = sales.reduce((sum: number, sale: any) => {
            const artwork = artworksMap.get(sale.ecwidProductId);
            if (artwork && artwork.tipologia?.toLowerCase() !== 'original' && artwork.tipologia?.toLowerCase() !== 'originale') {
              const calc = calculateEarnings(sale, artwork);
              if (calc.hasMissingCosts) {
                excludedCount++;
                return sum;
              }
              return sum + (calc.artistEarnings || 0);
            }
            return sum;
          }, 0);
          setTotalEarnings(earnings);
          setExcludedSalesCount(excludedCount);
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentsAndSales();
  }, [user]);

  const totalRequestedOrPaid = payments.reduce((sum, p) => {
    const status = p.stato || p.status;
    const amountVal = p.ammontare || p.amount;
    if (status !== 'Rejected' && status !== 'rejected' && status !== 'rifiutato' && status !== 'rifiutata') {
      return sum + Number(amountVal || 0);
    }
    return sum;
  }, 0);

  const availableBalance = Math.max(0, totalEarnings - totalRequestedOrPaid);
  const canRequest = availableBalance >= 500;

  const handleRequestPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !invoiceFile || !amount || !canRequest) return;
    
    const requestamount = Number(amount);
    if (requestamount < 500) {
      setError(t('payments.minRequestAmount'));
      return;
    }
    if (requestamount > availableBalance) {
      setError(t('payments.exceedsBalance'));
      return;
    }

    setRequesting(true);
    setError('');
    setSuccess(false);

    try {
      // Upload invoice
      const storageRef = ref(storage, `invoices/${user.uid}/${Date.now()}_${invoiceFile.name}`);
      const snapshot = await uploadBytes(storageRef, invoiceFile);
      const invoiceUrl = await getDownloadURL(snapshot.ref);

      // Create payment request
      await addDoc(collection(db, 'payouts'), {
        artistaId: user.uid,
        artistEmail: user.email,
        ammontare: requestamount,
        currency: 'EUR',
        stato: 'Pending Review',
        paymentMethod: paymentMethod,
        invoiceUrl: invoiceUrl,
        date: new Date().toISOString()
      });

      // Send email to admin
      await sendEmailNotification('claudio@brignole.ch', 'payout_request', {
        amount: `${requestamount.toFixed(2)} ${t('dashboard.currency')}`,
        artistName: user.displayName || 'Writer',
        artistEmail: user.email
      }, 'en');

      setSuccess(true);
      setAmount('');
      setInvoiceFile(null);
      
      // Refresh list
      await fetchPaymentsAndSales();
      
    } catch (err: any) {
      console.error("Error requesting payout:", err);
      setError(err.message || t('payments.requestFailed'));
    } finally {
      setRequesting(false);
    }
  };

  const handleExportCSV = () => {
    if (payments.length === 0) return;
    const headers = ['ID', 'Date', 'Amount', 'Status', 'Payment Method'];
    const rows = payments.map(p => [
      p.id || '-',
      p.date ? format(parseISO(p.date), 'dd MMM yyyy', { locale: dateLocale }) : '-',
      p.amount || 0,
      p.status || '-',
      p.paymentMethod || '-'
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `payments_history_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full">{t('common.loading')}</div>;
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto font-['Karla']">
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl md:text-6xl font-['Shamgod'] leading-[0.8] tracking-tight text-[#121212] mb-4 uppercase">{t('payments.title')} {t('payments.andPayouts')}</h1>
          <p className="text-[#59554E] text-lg">{t('payments.subtitle')}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex gap-4">
            <button 
              onClick={handleExportCSV}
              className="inline-flex items-center justify-center gap-2 bg-white border border-[#EAE3D9] text-[#121212] font-bold py-3 px-6 rounded-2xl hover:bg-[#F2EEE8] transition-colors shadow-sm"
            >
              <Download size={20} />
              <span>{t('sales.exportCSV')}</span>
            </button>
            <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-[#EAE3D9] flex flex-col items-end">
              <span className="text-xs font-bold text-[#59554E] uppercase tracking-wider">{t('payments.availableBalance')}</span>
              <span className="text-2xl font-bold text-[#121212]">{availableBalance.toFixed(2)} {t('dashboard.currency')}</span>
            </div>
          </div>
          {excludedSalesCount > 0 && (
            <p className="text-xs text-orange-600 font-medium max-w-xs text-right">
              {t('dashboard.salesExcluded', { count: excludedSalesCount })}
            </p>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* {t('payments.requestPayout')} Form */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-[#EAE3D9]">
            <h2 className="text-xl font-bold text-[#121212] mb-6 flex items-center gap-2">
              <CreditCard size={24} className="text-[#FF4F00]" />
              {t('payments.requestPayout')}
            </h2>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-2xl text-sm font-medium flex items-start gap-3">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-2xl text-sm font-medium flex items-start gap-3">
                <Check size={16} className="shrink-0 mt-0.5" />
                <span>{t('payments.requestSuccess')}</span>
              </div>
            )}

            <form onSubmit={handleRequestPayout} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-[0.75rem] font-bold uppercase tracking-[0.1em] text-[#121212]">{t('payments.amountEur')}</label>
                <div className="relative">
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-[#59554E]">{t('payments.euro')}</span>
                  <input 
                    type="number" 
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    min="500"
                    max={availableBalance}
                    step="0.01"
                    disabled={!canRequest}
                    className="w-full pl-4 pr-16 py-3 bg-[#F2EEE8] border-none rounded-xl text-[#121212] focus:ring-2 focus:ring-[#FF4F00] outline-none transition-all disabled:opacity-50" 
                    placeholder={t('payments.minPlaceholder')} 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[0.75rem] font-bold uppercase tracking-[0.1em] text-[#121212]">{t('payments.paymentMethod')}</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  disabled={!canRequest}
                  className="w-full px-4 py-3 bg-[#F2EEE8] border-none rounded-xl text-[#121212] focus:ring-2 focus:ring-[#FF4F00] outline-none transition-all disabled:opacity-50"
                >
                  <option value="Bank Transfer">{t('payments.bankTransfer')}</option>
                  <option value="Stripe">{t('payments.stripe')}</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-[0.75rem] font-bold uppercase tracking-[0.1em] text-[#121212]">{t('payments.uploadInvoicePdf')}</label>
                <div className={clsx(
                  "relative border-2 border-dashed rounded-xl p-4 text-center transition-colors bg-[#F2EEE8]",
                  canRequest ? "border-[#EAE3D9] hover:border-[#FF4F00]" : "border-gray-200 opacity-50 cursor-not-allowed"
                )}>
                  <input 
                    type="file" 
                    accept=".pdf"
                    onChange={(e) => setInvoiceFile(e.target.files ? e.target.files[0] : null)}
                    required
                    disabled={!canRequest}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                  />
                  <div className="flex flex-col items-center gap-2 text-[#59554E]">
                    <Upload size={20} />
                    <span className="text-sm font-medium">
                      {invoiceFile ? invoiceFile.name : t('payments.clickOrDrag')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <button 
                  type="submit"
                  disabled={requesting || !amount || !invoiceFile || !canRequest}
                  className="w-full bg-[#121212] text-white font-bold py-4 px-6 rounded-full hover:bg-[#FF4F00] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:bg-[#121212]"
                >
                  {requesting ? t('payments.submitting') : t('payments.submitRequest')}
                </button>
                {!canRequest && (
                  <p className="text-sm text-center text-orange-600 font-medium mt-2">
                    {t('payments.minPayoutWarning', { amount: 500, balance: availableBalance.toFixed(2) })}
                  </p>
                )}
              </div>
            </form>
          </div>
          
          <div className="bg-[#F2EEE8] p-6 rounded-3xl border border-[#EAE3D9]">
            <h3 className="font-bold text-[#121212] mb-2">{t('payments.payoutInformation')}</h3>
            <ul className="text-sm text-[#59554E] space-y-2 list-disc pl-4">
              <li>{t('payments.infoMinAmount')}</li>
              <li>{t('payments.infoProcessingTime')}</li>
              <li>{t('payments.infoBillingDetails')}</li>
              <li>{t('payments.infoValidInvoice')}</li>
            </ul>
          </div>
        </div>

        {/* {t('payments.paymentHistory')} */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-3xl shadow-sm border border-[#EAE3D9] overflow-hidden">
            <div className="p-6 border-b border-[#EAE3D9]">
              <h2 className="text-xl font-bold tracking-tight text-[#121212]">{t('payments.paymentHistory')}</h2>
            </div>
            
            {payments.length === 0 ? (
              <div className="p-12 text-center text-[#59554E]">
                <div className="w-16 h-16 bg-[#F2EEE8] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Receipt size={24} />
                </div>
                <p className="text-lg font-medium">{t('payments.noPaymentsFound')}</p>
                <p className="text-sm mt-1">{t('payments.noPaymentsDesc')}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="bg-[#F2EEE8]/50 text-[10px] uppercase tracking-widest text-[#59554E]">
                      <th className="p-6 font-bold border-b border-[#EAE3D9]">{t('common.date')}</th>
                      <th className="p-6 font-bold border-b border-[#EAE3D9]">{t('payments.method')}</th>
                      <th className="p-6 font-bold border-b border-[#EAE3D9] text-right">{t('payments.amount')}</th>
                      <th className="p-6 font-bold border-b border-[#EAE3D9] text-center">{t('payments.status')}</th>
                      <th className="p-6 font-bold border-b border-[#EAE3D9] text-center">{t('payments.invoice')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-[#F2EEE8]/30 transition-colors border-b border-[#EAE3D9] last:border-0">
                        <td className="p-6 text-sm font-medium text-[#121212]">
                          {format(parseISO(payment.date), 'MMM d, yyyy', { locale: dateLocale })}
                        </td>
                        <td className="p-6 text-sm text-[#59554E]">
                          {payment.paymentMethod === 'Bank Transfer' ? t('payments.bankTransfer') : payment.paymentMethod === 'Stripe' ? t('payments.stripe') : payment.paymentMethod}
                        </td>
                        <td className="p-6 text-sm font-bold text-[#121212] text-right">
                          {Number(payment.ammontare || payment.amount).toFixed(2)} {t('dashboard.currency')}
                        </td>
                        <td className="p-6 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className={clsx(
                              "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                              (payment.stato || payment.status) === 'Paid' || (payment.stato || payment.status) === 'pagato' ? "bg-green-100 text-green-700" :
                              (payment.stato || payment.status) === 'Rejected' || (payment.stato || payment.status) === 'rejected' || (payment.stato || payment.status) === 'rifiutato' || (payment.stato || payment.status) === 'rifiutata' ? "bg-red-100 text-red-700" :
                              "bg-orange-100 text-orange-700"
                            )}>
                              {payment.stato || payment.status}
                            </span>
                            {payment.adminNote && (
                              <span className="text-xs text-[#59554E] italic max-w-[150px] truncate" title={payment.adminNote}>
                                {t('payments.note')} {payment.adminNote}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-6 text-center">
                          {payment.invoiceUrl ? (
                            <a 
                              href={payment.invoiceUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 text-sm text-[#FF4F00] hover:underline font-medium"
                            >
                              <FileText size={16} />
                              {t('payments.view')}
                            </a>
                          ) : (
                            <span className="text-sm text-gray-400 italic">{t('payments.noInvoice')}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
