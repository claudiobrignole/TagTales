import React, { useState, useEffect } from 'react';
import { X, Search, Check, Loader2 } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import clsx from 'clsx';
import { useI18n } from '../contexts/I18nContext';
import { ADMIN_MODAL } from '../constants/theme';


interface EcwidConnectionModalProps {
  user: any;
  onClose: () => void;
  onSave: (userId: string, productIds: number[]) => void;
}

export default function EcwidConnectionModal({ user, onClose, onSave }: EcwidConnectionModalProps) {
  const { t } = useI18n();

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>(user.ecwidProductIds || []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async (keyword?: string) => {
    setLoading(true);
    setError('');
    try {
      const url = new URL('/api/ecwid/products', window.location.origin);
      if (keyword) {
        url.searchParams.append('keyword', keyword);
      }
      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      const data = await response.json();
      setProducts(data.items || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load products from Ecwid');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts(searchQuery);
  };

  const toggleProduct = (productId: number) => {
    setSelectedProductIds(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await updateDoc(doc(db, 'users', user.id), {
        ecwidProductIds: selectedProductIds
      });
      
      // Also sync over to linked 'scrittori' profiles for public access
      const { query, collection, where, getDocs, or } = await import('firebase/firestore');
      
      const scrittoriRef = collection(db, 'scrittori');
      // Search by exact uid match, OR matching email, OR matching artist name
      const conditions = [where('uid', '==', user.id)];
      if (user.email) conditions.push(where('emailContatto', '==', user.email));
      if (user.artistName) {
        conditions.push(where('nomeDarte', '==', user.artistName));
        conditions.push(where('nickname', '==', user.artistName));
      }

      // getDocs in chunks or sequentially since 'or' might have limits if we don't index properly
      // Actually doing it sequentially is safer to avoid "index required" errors on OR queries.
      const syncToScrittori = async (q: any) => {
         try {
           const snap = await getDocs(q);
           const updatePromises = snap.docs.map(docSnap => 
             updateDoc(doc(db, 'scrittori', docSnap.id), {
               ecwidProductIds: selectedProductIds,
               uid: user.id // Fix the missing uid link while we're at it!
             })
           );
           await Promise.all(updatePromises);
         } catch (e) {
           console.warn("Failed to query scrittori for sync:", e);
         }
      };

      await syncToScrittori(query(scrittoriRef, where('uid', '==', user.id)));
      if (user.email) await syncToScrittori(query(scrittoriRef, where('emailContatto', '==', user.email)));
      if (user.artistName) {
        await syncToScrittori(query(scrittoriRef, where('nomeDarte', '==', user.artistName)));
        await syncToScrittori(query(scrittoriRef, where('nickname', '==', user.artistName)));
      }

      onSave(user.id, selectedProductIds);
    } catch (err: any) {
      console.error(err);
      setError('Failed to save connection');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={clsx(ADMIN_MODAL.backdrop, "bg-black/50 backdrop-blur-sm")}>
      <div className={clsx("bg-white rounded-3xl flex flex-col shadow-2xl overflow-hidden", ADMIN_MODAL.panelWide)}>
        <div className="flex items-center justify-between p-6 border-b border-[#EAE3D9]">
          <div>
            <h2 className="text-2xl font-bold text-[#121212]">Ecwid Connection</h2>
            <p className="text-[#59554E] text-sm mt-1">Link products to {user.fullName || user.email}</p>
          </div>
          <button onClick={onClose} className="p-2 text-[#59554E] hover:bg-[#F2EEE8] rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-hidden flex flex-col gap-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Ecwid products..."
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#EAE3D9] focus:outline-none focus:ring-2 focus:ring-[#FF4F00]/20 focus:border-[#FF4F00] transition-all"
              />
            </div>
            <button 
              type="submit"
              className="px-6 py-3 bg-[#121212] text-white font-bold rounded-xl hover:bg-black transition-colors"
            >
              Search
            </button>
          </form>

          <div className="flex-1 overflow-y-auto border border-[#EAE3D9] rounded-xl">
            {loading ? (
              <div className="flex items-center justify-center h-full p-8">
                <Loader2 className="animate-spin text-[#FF4F00]" size={32} />
              </div>
            ) : products.length === 0 ? (
              <div className="flex items-center justify-center h-full p-8 text-[#59554E]">
                No products found.
              </div>
            ) : (
              <div className="divide-y divide-[#EAE3D9]">
                {products.map(product => {
                  const isSelected = selectedProductIds.includes(product.id);
                  return (
                    <div 
                      key={product.id}
                      onClick={() => toggleProduct(product.id)}
                      className={clsx(
                        "flex items-center gap-4 p-4 cursor-pointer transition-colors hover:bg-[#F2EEE8]/50",
                        isSelected && "bg-[#FF4F00]/5"
                      )}
                    >
                      <div className={clsx(
                        "w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors",
                        isSelected ? "border-[#FF4F00] bg-[#FF4F00]" : "border-gray-300"
                      )}>
                        {isSelected && <Check size={14} className="text-white" />}
                      </div>
                      {product.thumbnailUrl && (
                        <img src={product.thumbnailUrl} alt={product.name} className="w-12 h-12 object-cover rounded-lg border border-[#EAE3D9]" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-[#121212] truncate">{product.name}</p>
                        <p className="text-sm text-[#59554E]">ID: {product.id} • {product.defaultDisplayedPriceFormatted}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          <div className="text-sm text-[#59554E]">
            {selectedProductIds.length} product(s) selected
          </div>
        </div>

        <div className="p-6 border-t border-[#EAE3D9] flex justify-end gap-3 bg-[#F2EEE8]/30">
          <button
            onClick={onClose}
            className="px-6 py-3 text-[#59554E] font-bold hover:bg-[#EAE3D9] rounded-xl transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 bg-[#FF4F00] text-white font-bold rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-[#FF4F00]/20 disabled:opacity-50 flex items-center gap-2"
          >
            {saving && <Loader2 size={18} className="animate-spin" />}
            {t('ecwidModal.saveConnection')}
          </button>
        </div>
      </div>
    </div>
  );
}
