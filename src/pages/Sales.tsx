import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { Download, Search, Calendar, AlertCircle } from 'lucide-react';
import { format, subDays, startOfMonth, startOfYear, parseISO, subMonths } from 'date-fns';
import { it, enUS } from 'date-fns/locale';
import clsx from 'clsx';
import ConnectionBanner from '../components/ConnectionBanner';
import { useI18n } from '../contexts/I18nContext';


export default function Sales() {
  const { t, language } = useI18n();
  const dateLocale = language === 'IT' ? it : enUS;

  const { user } = useAuth();
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('this_month'); // 'this_month', 'last_3_months', 'this_year', 'custom'
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSales = async () => {
      if (!user) return;
      setLoading(true);
      setError('');
      try {
        const royaltiesQ = query(collection(db, 'royalties'), where('artistId', '==', user.uid), orderBy('createdAt', 'desc'));
        const royaltiesSnap = await getDocs(royaltiesQ);
        
        let allSales = royaltiesSnap.docs.map(doc => {
          const data = doc.data();
          const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();
          return {
            id: doc.id,
            orderId: data.orderId || '-',
            date: createdAt.toISOString(),
            artworkName: data.productType ? data.productType.replace(/_/g, ' ').toUpperCase() : 'ART',
            format: data.productType || '-',
            price: data.unitPrice || 0,
            artistShare: data.feeAmount || 0,
            status: data.status || 'pending',
            hasMissingCosts: false
          };
        });

        // 2. Filter by date range
        const now = new Date();
        let fromDate: Date | null = null;
        let toDate: Date | null = null;

        if (dateRange === 'this_month') {
          fromDate = startOfMonth(now);
        } else if (dateRange === 'last_3_months') {
          fromDate = subMonths(now, 3);
        } else if (dateRange === 'this_year') {
          fromDate = startOfYear(now);
        } else if (dateRange === 'custom') {
          if (customStartDate) fromDate = new Date(customStartDate);
          if (customEndDate) {
            toDate = new Date(customEndDate);
            toDate.setHours(23, 59, 59, 999);
          }
        }

        if (fromDate) {
           allSales = allSales.filter(s => new Date(s.date) >= fromDate!);
        }
        if (toDate) {
           allSales = allSales.filter(s => new Date(s.date) <= toDate!);
        }

        setSales(allSales);
      } catch (err: any) {
        console.error("Error fetching sales:", err);
        setError(err.message || 'Error fetching sales data');
      } finally {
        setLoading(false);
      }
    };

    // Only fetch if not custom, or if custom and both dates are set (or we just want to allow partial)
    if (dateRange !== 'custom' || (dateRange === 'custom' && customStartDate && customEndDate)) {
      fetchSales();
    } else if (dateRange === 'custom') {
      // If custom but dates aren't fully set, we might not want to fetch yet, but let's fetch all or partial
      fetchSales();
    }
  }, [user, dateRange, customStartDate, customEndDate]);

  // We don't need frontend filtering anymore since backend handles it via Ecwid API
  const filteredSales = sales;

  const totalEarnings = filteredSales.reduce((sum, sale) => sum + (sale.artistShare || 0), 0);

  const handleExportCSV = () => {
    if (filteredSales.length === 0) return;
    const headers = ['Order ID', 'Date', 'Price', 'Status', 'Format'];
    const rows = filteredSales.map(sale => [
      sale.orderId || sale.id || '-',
      sale.date ? format(parseISO(sale.date), 'dd MMM yyyy', { locale: dateLocale }) : '-',
      sale.price || 0,
      sale.status || '-',
      sale.format || '-'
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sales_history_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full">{t('common.loading')}</div>;
  }

  return (
    <div className="w-full space-y-8 font-['Karla']">
      <ConnectionBanner />
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl md:text-6xl font-['Shamgod'] leading-[0.8] tracking-tight text-[#121212] mb-4 uppercase">{t('sales.salesHistory')}</h1>
          <p className="text-[#59554E] text-lg">{t('sales.subtitle')}</p>
        </div>
        <button 
          onClick={handleExportCSV}
          className="inline-flex items-center justify-center gap-2 bg-white border border-[#EAE3D9] text-[#121212] font-bold py-3 px-6 rounded-full hover:bg-[#F2EEE8] transition-colors shadow-sm"
        >
          <Download size={20} />
          <span>{t('sales.exportCSV')}</span>
        </button>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#121212] p-6 rounded-3xl shadow-lg text-white flex flex-col justify-between">
          <p className="text-sm font-bold text-white/70 uppercase tracking-widest mb-4">{t('sales.totalEarnings')} ({t('sales.filtered')})</p>
          <h3 className="text-5xl font-black tracking-tighter">{totalEarnings.toLocaleString()} {t('common.amount')}</h3>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-[#EAE3D9] flex flex-col justify-between">
          <p className="text-sm font-bold text-[#59554E] uppercase tracking-widest mb-4">{t('sales.artworksSold')}</p>
          <h3 className="text-5xl font-black tracking-tighter text-[#121212]">{filteredSales.length}</h3>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-[#EAE3D9] flex flex-col justify-between">
          <p className="text-sm font-bold text-[#59554E] uppercase tracking-widest mb-4">{t('sales.avgPrice')}</p>
          <h3 className="text-5xl font-black tracking-tighter text-[#121212]">
            {filteredSales.length > 0 ? Math.round(totalEarnings / filteredSales.length).toLocaleString() : 0} {t('common.amount')}
          </h3>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-[#EAE3D9]">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
          <div className="flex items-center gap-3">
            <Calendar size={20} className="text-[#59554E] hidden sm:block" />
            {[
              { id: 'this_month', label: t('sales.thisMonth') },
              { id: 'last_3_months', label: t('sales.last3Months') },
              { id: 'this_year', label: t('sales.thisYear') },
              { id: 'custom', label: t('sales.custom') }
            ].map((range) => (
              <button
                key={range.id}
                onClick={() => setDateRange(range.id)}
                className={clsx(
                  "px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-all",
                  dateRange === range.id 
                    ? "bg-[#FF4F00] text-white" 
                    : "bg-[#F2EEE8] text-[#59554E] hover:bg-[#EAE3D9]"
                )}
              >
                {range.label}
              </button>
            ))}
          </div>
          
          {dateRange === 'custom' && (
            <div className="flex items-center gap-2 mt-2 sm:mt-0">
              <input 
                type="date" 
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-3 py-1.5 bg-[#F2EEE8] border-none rounded-lg text-sm focus:ring-2 focus:ring-[#FF4F00] outline-none"
              />
              <span className="text-[#59554E]">-</span>
              <input 
                type="date" 
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-3 py-1.5 bg-[#F2EEE8] border-none rounded-lg text-sm focus:ring-2 focus:ring-[#FF4F00] outline-none"
              />
            </div>
          )}
        </div>
        <div className="relative w-full sm:w-64">
          <input 
            type="text" 
            placeholder={t('sales.searchPlaceholder')} 
            className="w-full pl-10 pr-4 py-2 bg-[#F2EEE8] border-none rounded-full text-sm focus:ring-2 focus:ring-[#FF4F00] outline-none"
          />
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#59554E]" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-[#EAE3D9] overflow-hidden">
        {filteredSales.length === 0 ? (
          <div className="p-12 text-center text-[#59554E]">
            <p className="text-lg font-medium">{t('sales.noSalesFound')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-[#F2EEE8]/50 text-[10px] uppercase tracking-widest text-[#59554E]">
                  <th className="p-6 font-bold border-b border-[#EAE3D9]">{t('common.date')}</th>
                  <th className="p-6 font-bold border-b border-[#EAE3D9]">{t('sales.artwork')}</th>
                  <th className="p-6 font-bold border-b border-[#EAE3D9]">{t('sales.format')}</th>
                  <th className="p-6 font-bold border-b border-[#EAE3D9] text-right">{t('sales.salePrice')}</th>
                  <th className="p-6 font-bold border-b border-[#EAE3D9] text-right">{t('sales.yourShare')}</th>
                  <th className="p-6 font-bold border-b border-[#EAE3D9] text-center">{t('sales.status')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-[#F2EEE8]/30 transition-colors border-b border-[#EAE3D9] last:border-0">
                    <td className="p-6 text-sm text-[#59554E] font-medium">{format(parseISO(sale.date), 'MMM dd, yyyy', { locale: dateLocale })}</td>
                    <td className="p-6 font-bold text-[#121212] flex items-center gap-2">
                      {sale.productName || sale.artworkName}
                      {sale.hasMissingCosts && (
                        <span title={t('sales.missingCostsTooltip')}>
                          <AlertCircle size={16} className="text-orange-500" />
                        </span>
                      )}
                    </td>
                    <td className="p-6 text-sm text-[#59554E]">{sale.format === 'Original' ? t('sales.original') : sale.format === 'Limited Edition' ? t('sales.limitedEdition') : sale.format === 'Print on Demand' ? t('sales.printOnDemand') : sale.format || t('sales.original')}</td>
                    <td className="p-6 text-sm text-[#59554E] text-right">{sale.price?.toLocaleString()} {t('sales.euro')}</td>
                    <td className="p-6 font-black text-[#121212] text-right text-lg">
                      {sale.hasMissingCosts ? (
                        <span className="text-orange-500 text-sm font-medium">{t('sales.pendingCosts')}</span>
                      ) : (
                        `${sale.artistShare?.toLocaleString()} ${t('sales.euro')}`
                      )}
                    </td>
                    <td className="p-6 text-center">
                      <span className={clsx(
                        "px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full",
                        sale.status === 'PAID' ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                      )}>
                        {sale.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
