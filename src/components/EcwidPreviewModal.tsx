import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import { useI18n } from '../contexts/I18nContext';
import { ADMIN_MODAL } from '../constants/theme';

interface EcwidPreviewModalProps {
  productIds: number[];
  onClose: () => void;
}

export default function EcwidPreviewModal({ productIds, onClose }: EcwidPreviewModalProps) {
  const { t } = useI18n();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProducts();
  }, [productIds]);

  const fetchProducts = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/ecwid/products');
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      const data = await response.json();
      // Filter to show only the products connected to this writer
      const filtered = (data.items || []).filter((p: any) => productIds.includes(p.id));
      setProducts(filtered);
    } catch (err: any) {
      console.error(err);
      setError('Failed to load products from Ecwid');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={clsx(ADMIN_MODAL.backdrop, "bg-black/50 backdrop-blur-sm")}>
      <div className={clsx("bg-white rounded-3xl flex flex-col shadow-2xl overflow-hidden", ADMIN_MODAL.panelWide)}>
        <div className="flex items-center justify-between p-6 border-b border-[#EAE3D9]">
          <h2 className="text-2xl font-bold text-[#121212]">Prodotti Connessi</h2>
          <button onClick={onClose} className="p-2 text-[#59554E] hover:bg-[#F2EEE8] rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          {error && <div className="p-3 bg-red-50 text-red-600 rounded-xl mb-4 text-sm border border-red-200">{error}</div>}

          {loading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="animate-spin text-[#FF4F00]" size={32} />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-10 text-[#59554E]">Nessun prodotto trovato.</div>
          ) : (
            <div className="space-y-4">
              {products.map(product => (
                <div key={product.id} className="flex items-center gap-4 p-4 border border-[#EAE3D9] rounded-xl hover:bg-[#F2EEE8]/30 transition-colors">
                  {product.thumbnailUrl && (
                    <img src={product.thumbnailUrl} alt={product.name} className="w-16 h-16 object-cover rounded-lg border border-[#EAE3D9]" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[#121212] truncate">{product.name}</p>
                    <p className="text-sm text-[#59554E]">{product.defaultDisplayedPriceFormatted}</p>
                  </div>
                  <a href={product.url} target="_blank" rel="noreferrer" className="px-4 py-2 bg-[#121212] text-white text-xs font-bold rounded-lg hover:bg-black transition-colors">
                    Vai allo store
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
