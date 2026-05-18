import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, orderBy, limit } from 'firebase/firestore';
import { TrendingUp, Palette, Receipt, ArrowRight, CreditCard, CheckCircle2, Circle, MessagesSquare, ShoppingBag } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import ConnectionBanner from '../components/ConnectionBanner';
import DirectChat from '../components/DirectChat';
import EcwidPreviewModal from '../components/EcwidPreviewModal';
import clsx from 'clsx';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useI18n();
  const [stats, setStats] = useState({
    totalArtworks: 0,
    totalSales: 0,
    pendingPayments: 0,
    excludedSalesCount: 0,
  });
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [productIds, setProductIds] = useState<number[]>([]);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [onboarding, setOnboarding] = useState({
    show: false,
    profileComplete: false,
    bankComplete: false,
    contractComplete: false,
    artworksConnected: false,
    allCompletedAt: null as string | null,
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      try {
        // Fetch artworks count and data
        const artworksQ = query(collection(db, 'opere'), where('artistaId', '==', user.uid));
        const artworksSnapshot = await getDocs(artworksQ);
        const totalArtworks = artworksSnapshot.size;
        const artworksMap = new Map();
        artworksSnapshot.forEach(doc => {
          artworksMap.set(doc.data().ecwidId, doc.data());
        });

        // Get artist's ecwidProductIds from user profile
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.data() || {};
        const productIds = userData.ecwidProductIds || [];

        // Check onboarding steps
        const requiredProfileFields = ['firstName', 'lastName', 'artistName', 'phone', 'address', 'city', 'country', 'vatNumber', 'accountHolder', 'iban', 'bic', 'bankName'];
        const missingFields = requiredProfileFields.filter(f => !userData[f]);
        const profileComplete = missingFields.length === 0;

        const isAdmin = userData.role === 'admin' || user.email?.toLowerCase() === 'claudio@brignole.ch';
        if (isAdmin) {
          navigate('/app/admin');
          return;
        }

        const bankComplete = !!((userData.iban || userData.bankIban) && (userData.bic || userData.bankBic));

        const contractsQ = query(collection(db, 'contratti'), where('artistaId', '==', user.uid), where('stato', '==', 'approvato'));
        const contractsSnapshot = await getDocs(contractsQ);
        const contractComplete = !contractsSnapshot.empty;

        const artworksConnected = productIds.length > 0;

        let currentAllCompletedAt = userData.onboardingCompletedAt || null;
        
        if (profileComplete && bankComplete && contractComplete && artworksConnected && !currentAllCompletedAt) {
          currentAllCompletedAt = new Date().toISOString();
          try {
            await updateDoc(doc(db, 'users', user.uid), {
              onboardingCompletedAt: currentAllCompletedAt
            });
          } catch (e) {
            console.error("Failed to update onboarding status", e);
          }
        }

        let showOnboarding = true;
        
        if (currentAllCompletedAt) {
          const completedDate = new Date(currentAllCompletedAt);
          const threeDaysAgo = new Date();
          threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
          if (completedDate < threeDaysAgo) {
            showOnboarding = false;
          }
        }

        setOnboarding({
          show: showOnboarding,
          profileComplete,
          bankComplete,
          contractComplete,
          artworksConnected,
          allCompletedAt: currentAllCompletedAt,
        });

        // Fetch recent royalties
        let totalSales = userData.totalEarned || 0;
        let pendingBalance = userData.pendingBalance || 0;
        let excludedSalesCount = 0;
        const recent: any[] = [];

        const royaltiesQ = query(collection(db, 'royalties'), where('artistId', '==', user.uid), orderBy('createdAt', 'desc'), limit(5));
        const royaltiesSnap = await getDocs(royaltiesQ);
        royaltiesSnap.forEach((royaltyDoc) => {
          const sale = royaltyDoc.data();
          recent.push({
            id: royaltyDoc.id,
            orderId: sale.orderId,
            date: sale.createdAt?.toDate ? sale.createdAt.toDate().toISOString() : new Date().toISOString(),
            artworkTitle: sale.productType ? sale.productType.replace(/_/g, ' ').toUpperCase() : 'Art',
            artistShare: sale.feeAmount || 0,
            status: sale.status || 'pending'
          });
        });

        const availableBalance = pendingBalance;

        setStats({ totalArtworks, totalSales, pendingPayments: availableBalance, excludedSalesCount });
        setRecentSales(recent);
        setProductIds(productIds);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  if (loading) {
    return <div className="flex items-center justify-center h-full">{t('common.loading')}</div>;
  }

  return (
    <div className="w-full space-y-8 font-['Karla']">
      <ConnectionBanner />
      <header className="mb-10">
        <h1 className="text-4xl md:text-6xl font-['Shamgod'] leading-[0.8] tracking-tight text-[#121212] mb-4 uppercase">
          {t('dashboard.welcome', { name: user?.email?.split('@')[0] })}
        </h1>
        <p className="text-[#59554E] text-lg">{t('dashboard.subtitle')}</p>
      </header>

      {onboarding.show && (
        <div className="bg-white rounded-3xl shadow-sm border border-[#EAE3D9] overflow-hidden">
          {onboarding.allCompletedAt ? (
              <div className="p-6 bg-green-50 border-b border-green-100 flex items-center gap-3">
              <CheckCircle2 className="text-green-600" size={24} />
              <h3 className="text-lg font-bold text-green-800">{t('dashboard.onboarding.allSet')}</h3>
            </div>
          ) : (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-[#121212]">{t('dashboard.onboarding.welcome')}</h3>
                <div className="text-sm font-bold text-[#59554E] bg-[#F2EEE8] px-3 py-1 rounded-full">
                  {[onboarding.profileComplete, onboarding.bankComplete, onboarding.contractComplete, onboarding.artworksConnected].filter(Boolean).length}/4 {t('dashboard.onboarding.completed')}
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  {onboarding.profileComplete ? <CheckCircle2 className="text-green-500 mt-0.5" size={20} /> : <Circle className="text-[#D8D0C5] mt-0.5" size={20} />}
                  <div>
                    <p className={clsx("font-semibold", onboarding.profileComplete ? "text-[#A39E93] line-through" : "text-[#121212]")}>{t('dashboard.onboarding.step1')}</p>
                    {!onboarding.profileComplete && <p className="text-sm text-[#59554E]">{t('dashboard.onboarding.step1Desc')}</p>}
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  {onboarding.bankComplete ? <CheckCircle2 className="text-green-500 mt-0.5" size={20} /> : <Circle className="text-[#D8D0C5] mt-0.5" size={20} />}
                  <div>
                    <p className={clsx("font-semibold", onboarding.bankComplete ? "text-[#A39E93] line-through" : "text-[#121212]")}>{t('dashboard.onboarding.step2')}</p>
                    {!onboarding.bankComplete && <p className="text-sm text-[#59554E]">{t('dashboard.onboarding.step2Desc')}</p>}
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  {onboarding.contractComplete ? <CheckCircle2 className="text-green-500 mt-0.5" size={20} /> : <Circle className="text-[#D8D0C5] mt-0.5" size={20} />}
                  <div>
                    <p className={clsx("font-semibold", onboarding.contractComplete ? "text-[#A39E93] line-through" : "text-[#121212]")}>{t('dashboard.onboarding.step3')}</p>
                    {!onboarding.contractComplete && <p className="text-sm text-[#59554E]">{t('dashboard.onboarding.step3Desc')}</p>}
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  {onboarding.artworksConnected ? <CheckCircle2 className="text-green-500 mt-0.5" size={20} /> : <Circle className="text-[#D8D0C5] mt-0.5" size={20} />}
                  <div>
                    <p className={clsx("font-semibold", onboarding.artworksConnected ? "text-[#A39E93] line-through" : "text-[#121212]")}>{t('dashboard.onboarding.step4')}</p>
                    {!onboarding.artworksConnected && <p className="text-sm text-[#59554E]">{t('dashboard.onboarding.step4Desc')}</p>}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-[#EAE3D9] flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-[#F2EEE8] rounded-2xl text-[#FF4F00]">
              <Palette size={24} />
            </div>
          </div>
          <div>
            <p className="text-sm font-bold text-[#59554E] uppercase tracking-widest mb-1">{t('dashboard.totalArtworks')}</p>
            <h3 className="text-4xl font-black tracking-tighter text-[#121212]">{stats.totalArtworks}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-[#EAE3D9] flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-[#F2EEE8] rounded-2xl text-[#FF4F00]">
              <TrendingUp size={24} />
            </div>
          </div>
          <div>
            <p className="text-sm font-bold text-[#59554E] uppercase tracking-widest mb-1">{t('sales.totalEarnings')}</p>
            <h3 className="text-4xl font-black tracking-tighter text-[#121212]">{stats.totalSales.toLocaleString()} {t('dashboard.currency')}</h3>
          </div>
        </div>

        <div className="bg-[#FF4F00] p-6 rounded-3xl shadow-lg shadow-[#FF4F00]/20 text-white flex flex-col justify-between hover:scale-[1.02] transition-transform cursor-pointer">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-white/20 rounded-2xl text-white">
              <CreditCard size={24} />
            </div>
            <Link to="/app/payments" className="p-2 hover:bg-white/20 rounded-full transition-colors">
              <ArrowRight size={20} />
            </Link>
          </div>
          <div>
            <p className="text-sm font-bold text-white/80 uppercase tracking-widest mb-1">{t('payments.availableBalance')}</p>
            <h3 className="text-4xl font-black tracking-tighter">{stats.pendingPayments.toLocaleString()} {t('dashboard.currency')}</h3>
            {stats.excludedSalesCount > 0 && (
              <p className="text-xs text-white/80 mt-2 font-medium">
                {t('dashboard.salesExcluded', { count: stats.excludedSalesCount })}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity & Chat */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        {/* Col 1 & 2: Chat */}
        <div className="lg:col-span-2 flex flex-col h-[500px] lg:h-[600px]">
            {user && (
                <DirectChat 
                    userId={user.uid} 
                    isAdmin={false} 
                    currentUserId={user.uid} 
                />
            )}
        </div>

        {/* Col 3: Vendite Recenti + Azioni Rapide */}
        <div className="space-y-8 lg:col-span-1">
            {/* Products (Ecwid) Section if any are connected */}
            {productIds.length > 0 && (
                <div className="bg-white rounded-3xl shadow-sm border border-[#EAE3D9] overflow-hidden">
                    <div className="p-6 border-b border-[#EAE3D9]">
                        <h2 className="text-xl font-bold tracking-tight text-[#121212] flex items-center gap-2">
                           <ShoppingBag size={20} className="text-[#FF4F00]"/> {t('dashboard.productsConnected')}
                        </h2>
                    </div>
                    <div className="p-0">
                       <ul className="divide-y divide-[#EAE3D9]">
                          {productIds.map((pid: string | number) => (
                              <li key={pid} className="p-4 flex items-center gap-3">
                                 <div className="w-10 h-10 bg-[#F2EEE8] rounded-xl flex items-center justify-center text-[#59554E]">
                                    <ShoppingBag size={18} />
                                 </div>
                                 <span className="font-bold text-[#121212] text-sm truncate flex-1">{t('dashboard.productId', { pid })}</span>
                                 <button 
                                   onClick={() => setShowPreviewModal(true)}
                                   className="text-xs uppercase font-bold tracking-wider text-[#FF4F00] hover:underline"
                                 >
                                    {t('dashboard.view')}
                                 </button>
                              </li>
                          ))}
                       </ul>
                    </div>
                </div>
            )}

            {showPreviewModal && (
              <EcwidPreviewModal productIds={productIds} onClose={() => setShowPreviewModal(false)} />
            )}

            <div className="bg-white rounded-3xl shadow-sm border border-[#EAE3D9] overflow-hidden">
                <div className="p-6 border-b border-[#EAE3D9] flex justify-between items-center">
                    <h2 className="text-xl font-bold tracking-tight text-[#121212]">{t('dashboard.recentSales')}</h2>
                    <Link to="/app/sales" className="text-sm font-bold text-[#FF4F00] hover:underline">{t('dashboard.viewAllSales')}</Link>
                </div>
                <div className="p-0">
                    {recentSales.length === 0 ? (
                    <div className="p-8 text-center text-[#59554E]">{t('dashboard.noRecentSales')}</div>
                    ) : (
                    <table className="w-full text-left border-collapse">
                        <thead>
                        <tr className="bg-[#F2EEE8]/50 text-[10px] uppercase tracking-widest text-[#59554E]">
                            <th className="p-4 font-bold border-b border-[#EAE3D9]">{t('sales.artwork')}</th>
                            <th className="p-4 font-bold border-b border-[#EAE3D9] text-right">{t('common.amount')}</th>
                        </tr>
                        </thead>
                        <tbody>
                        {recentSales.map((sale) => (
                            <tr key={sale.id} className="hover:bg-[#F2EEE8]/30 transition-colors border-b border-[#EAE3D9] last:border-0">
                            <td className="p-4 font-medium text-[#121212]">
                                {sale.productName || sale.artworkTitle}
                                <div className="text-xs text-[#59554E] font-normal">{new Date(sale.date).toLocaleDateString()}</div>
                            </td>
                            <td className="p-4 font-bold text-[#121212] text-right">
                                {sale.artistShare?.toLocaleString()} {t('dashboard.currency')}
                                <div className="text-[10px] font-bold uppercase tracking-wider text-green-600 mt-1">{sale.status}</div>
                            </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                    )}
                </div>
            </div>


        </div>
      </div>
    </div>
  );
}
