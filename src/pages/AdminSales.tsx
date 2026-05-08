import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { Download, Filter, Search, Calendar, Receipt, AlertCircle } from 'lucide-react';
import { format, subDays, startOfMonth, startOfYear, parseISO, subMonths } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { useI18n } from '../contexts/I18nContext';
import { calculateEarnings } from '../utils/earnings';


export default function AdminSales() {
  const { t } = useI18n();

  const { user } = useAuth();
  const navigate = useNavigate();
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
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.data()?.role !== 'admin' && user.email?.toLowerCase() !== 'claudio@brignole.ch') {
          navigate('/');
          return;
        }

        // 1. Determine date range
        let createdFrom = '';
        let createdTo = '';
        const now = new Date();

        if (dateRange === 'this_month') {
          createdFrom = Math.floor(startOfMonth(now).getTime() / 1000).toString();
        } else if (dateRange === 'last_3_months') {
          createdFrom = Math.floor(subMonths(now, 3).getTime() / 1000).toString();
        } else if (dateRange === 'this_year') {
          createdFrom = Math.floor(startOfYear(now).getTime() / 1000).toString();
        } else if (dateRange === 'custom') {
          if (customStartDate) {
            createdFrom = Math.floor(new Date(customStartDate).getTime() / 1000).toString();
          }
          if (customEndDate) {
            // End of the day for the end date
            const end = new Date(customEndDate);
            end.setHours(23, 59, 59, 999);
            createdTo = Math.floor(end.getTime() / 1000).toString();
          }
        }

        // 2. Fetch all sales from backend
        const response = await fetch('/api/sales', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productIds: 'all',
            createdFrom: createdFrom || undefined,
            createdTo: createdTo || undefined
          })
        });

        if (!response.ok) {
          throw new Error('Failed to fetch sales data');
        }

        const data = await response.json();
        
        // 3. Fetch artworks from Firestore to get production/shipping costs
        const artworksSnapshot = await getDocs(collection(db, 'opere'));
        const artworksMap = new Map();
        artworksSnapshot.forEach(doc => {
          artworksMap.set(doc.data().ecwidId, doc.data());
        });

        // 4. Calculate earnings
        const processedSales = (data.sales || []).map((sale: any) => {
          const artwork = artworksMap.get(sale.ecwidProductId);
          
          // Filter out original artworks
          if (!artwork || artwork.tipo?.toLowerCase() === 'original' || artwork.tipo?.toLowerCase() === 'originale') return null;

          const earnings = calculateEarnings(sale, artwork);

          return {
            ...sale,
            ...earnings,
            format: artwork.tipo // Ensure type is displayed correctly
          };
        }).filter(Boolean);

        setSales(processedSales);
      } catch (err: any) {
        console.error("Error fetching sales:", err);
        setError(err.message || 'Error fetching sales data');
      } finally {
        setLoading(false);
      }
    };

    if (dateRange !== 'custom' || (dateRange === 'custom' && customStartDate && customEndDate)) {
      fetchSales();
    } else if (dateRange === 'custom') {
      fetchSales();
    }
  }, [user, dateRange, customStartDate, customEndDate]);

  const totalEarnings = sales.reduce((sum, sale) => sum + (sale.price || 0), 0);

  const handleExportCSV = () => {
    if (sales.length === 0) return;
    const headers = ['ID Ordine', 'Data', 'Writer', 'Prezzo', 'Costo Produzione', 'Spedizione', 'Commissione CC', 'IVA', 'Ricavo Netto', 'Guadagni Writer', 'Formato'];
    const rows = sales.map(sale => [
      sale.orderId || sale.id || '-',
      sale.createDate ? format(parseISO(sale.createDate), 'dd MMM yyyy') : sale.date || '-',
      sale.artistName || '-',
      sale.price || 0,
      sale.productionCost || 0,
      sale.shippingCost || 0,
      sale.ccFee || 0,
      sale.vat || 0,
      sale.netRevenue || 0,
      sale.artistEarnings || 0,
      sale.format || '-'
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `admin_sales_history_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full">{t('common.loading')}</div>;
  }

  return (
    <div className="space-y-8 font-['Karla']">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl md:text-6xl font-['Shamgod'] leading-[0.8] tracking-tight text-[#121212] mb-4 uppercase">{t('sales.allSalesTitle')}</h1>
          <p className="text-[#59554E] text-lg">{t('sales.allSalesSubtitle')}</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={handleExportCSV}
            className="inline-flex items-center justify-center gap-2 bg-white border border-[#EAE3D9] text-[#121212] font-bold py-3 px-6 rounded-2xl hover:bg-[#F2EEE8] transition-colors shadow-sm"
          >
            <Download size={20} />
            <span>{t('sales.exportCSV')}</span>
          </button>
          <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-[#EAE3D9] flex flex-col items-end">
            <span className="text-xs font-bold text-[#59554E] uppercase tracking-wider">{t('sales.totalRevenue')}</span>
            <span className="text-2xl font-bold text-[#121212]">{totalEarnings.toFixed(2)} {t('dashboard.currency')}</span>
          </div>
        </div>
      </header>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-2xl flex items-center gap-3 border border-red-200">
          <AlertCircle size={20} />
          <p className="font-medium">{error}</p>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-4 rounded-3xl shadow-sm border border-[#EAE3D9]">
        <div className="flex flex-wrap gap-2">
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
                  ? "bg-[#121212] text-white" 
                  : "bg-[#F2EEE8] text-[#59554E] hover:bg-[#EAE3D9]"
              )}
            >
              {range.label}
            </button>
          ))}
        </div>

        {dateRange === 'custom' && (
          <div className="flex items-center gap-2">
            <input 
              type="date" 
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="bg-[#F2EEE8] border-none rounded-full px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-[#FF4F00] outline-none"
            />
              <span className="text-[#59554E] font-medium">-</span>
            <input 
              type="date" 
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="bg-[#F2EEE8] border-none rounded-full px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-[#FF4F00] outline-none"
            />
          </div>
        )}
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-[#EAE3D9] overflow-hidden">
        <div className="p-6 border-b border-[#EAE3D9] flex items-center justify-between bg-[#F2EEE8]/30">
          <h2 className="text-xl font-bold text-[#121212] flex items-center gap-3">
            <Receipt className="text-[#FF4F00]" />
            {t('sales.salesHistory')}
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#EAE3D9] bg-[#F2EEE8]/50">
                <th className="p-4 text-xs font-bold text-[#59554E] uppercase tracking-wider">{t('sales.orderId')}</th>
                <th className="p-4 text-xs font-bold text-[#59554E] uppercase tracking-wider">{t('common.date')}</th>
                <th className="p-4 text-xs font-bold text-[#59554E] uppercase tracking-wider">{t('sales.productName')}</th>
                <th className="p-4 text-xs font-bold text-[#59554E] uppercase tracking-wider">{t('sales.type')}</th>
                <th className="p-4 text-xs font-bold text-[#59554E] uppercase tracking-wider text-right">{t('sales.grossSalePrice')}</th>
                <th className="p-4 text-xs font-bold text-[#59554E] uppercase tracking-wider text-right">{t('sales.deductions')}</th>
                <th className="p-4 text-xs font-bold text-[#59554E] uppercase tracking-wider text-right">{t('sales.netRevenue')}</th>
                <th className="p-4 text-xs font-bold text-[#59554E] uppercase tracking-wider text-right">{t('sales.yourShare')}</th>
                <th className="p-4 text-xs font-bold text-[#59554E] uppercase tracking-wider">{t('sales.status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE3D9]">
              {sales.map((sale) => (
                <tr key={sale.id} className="hover:bg-[#F2EEE8]/30 transition-colors">
                  <td className="p-4 text-sm font-bold text-[#121212]">#{sale.orderId}</td>
                  <td className="p-4 text-sm font-medium text-[#59554E]">{format(parseISO(sale.date), 'MMM d, yyyy')}</td>
                  <td className="p-4 text-sm font-bold text-[#121212] flex items-center gap-2">
                    {sale.productName || sale.artworkName}
                    {sale.hasMissingCosts && (
                      <span title="Missing production or shipping costs - Earnings are pending">
                        <AlertCircle size={16} className="text-orange-500" />
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-sm text-[#59554E]">{sale.format}</td>
                  <td className="p-4 text-sm font-bold text-[#121212] text-right">{Number(sale.price).toFixed(2)} {t('dashboard.currency')}</td>
                  <td className="p-4 text-sm font-bold text-[#121212] text-right">
                    {sale.hasMissingCosts ? '-' : `${(sale.vat + sale.productionCost + sale.shippingCost + sale.ccFee).toFixed(2)} ${t('dashboard.currency')}`}
                  </td>
                  <td className="p-4 text-sm font-bold text-[#121212] text-right">
                    {sale.hasMissingCosts ? '-' : `${sale.netRevenue?.toFixed(2)} ${t('dashboard.currency')}`}
                  </td>
                  <td className="p-4 text-sm font-bold text-[#FF4F00] text-right">
                    {sale.hasMissingCosts ? (
                      <span className="text-orange-500 text-xs font-medium">{t('sales.pendingCosts')}</span>
                    ) : (
                      `${sale.artistEarnings?.toFixed(2)} ${t('dashboard.currency')}`
                    )}
                  </td>
                  <td className="p-4">
                    <span className={clsx(
                      "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                      sale.status === 'PAID' 
                        ? "bg-green-100 text-green-700" 
                        : "bg-orange-100 text-orange-700"
                    )}>
                      {sale.status === 'PAID' ? t('sales.paid') : sale.status}
                    </span>
                  </td>
                </tr>
              ))}
              {sales.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-[#59554E]">
                    {t('sales.noSalesFound')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
