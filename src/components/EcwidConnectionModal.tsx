import React, { useState, useEffect, useMemo } from 'react';
import { X, Search, Check, Loader2, ArrowUp, ArrowDown, GripVertical } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import clsx from 'clsx';
import { useI18n } from '../contexts/I18nContext';
import { ADMIN_MODAL } from '../constants/theme';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface EcwidConnectionModalProps {
  user: any;
  onClose: () => void;
  onSave: (userId: string, productIds: number[]) => void;
}

function SortableProductRow({
  id,
  index,
  product,
  total,
  onMove,
}: {
  id: number;
  index: number;
  product?: any;
  total: number;
  onMove: (productId: number, direction: -1 | 1) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: String(id) });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={clsx(
        "flex items-center gap-3 p-3 bg-white border-b border-[#EAE3D9] last:border-b-0",
        isDragging && "relative z-10 shadow-lg bg-[#F8F6F3] opacity-95",
      )}
    >
      <button
        type="button"
        className="cursor-grab active:cursor-grabbing p-1.5 text-[#59554E] hover:text-[#FF4F00] shrink-0 touch-none"
        title="Trascina per riordinare"
        {...attributes}
        {...listeners}
      >
        <GripVertical size={18} />
      </button>
      <span className="text-xs font-bold text-[#59554E] w-6 shrink-0">{index + 1}.</span>
      {product?.thumbnailUrl && (
        <img src={product.thumbnailUrl} alt="" className="w-10 h-10 object-cover rounded-lg border border-[#EAE3D9] shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <p className="font-bold text-[#121212] text-sm truncate">
          {product?.name || `Product #${id}`}
        </p>
        <p className="text-xs text-[#59554E]">ID: {id}</p>
      </div>
      <div className="flex gap-1 shrink-0">
        <button
          type="button"
          onClick={() => onMove(id, -1)}
          disabled={index === 0}
          className="p-1.5 rounded-lg border border-[#EAE3D9] text-[#121212] hover:bg-[#F2EEE8] disabled:opacity-30"
          title="Sposta su"
        >
          <ArrowUp size={16} />
        </button>
        <button
          type="button"
          onClick={() => onMove(id, 1)}
          disabled={index === total - 1}
          className="p-1.5 rounded-lg border border-[#EAE3D9] text-[#121212] hover:bg-[#F2EEE8] disabled:opacity-30"
          title="Sposta giù"
        >
          <ArrowDown size={16} />
        </button>
      </div>
    </div>
  );
}

export default function EcwidConnectionModal({ user, onClose, onSave }: EcwidConnectionModalProps) {
  const { t } = useI18n();

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>(user.ecwidProductIds || []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const productsById = useMemo(() => {
    const map = new Map<number, any>();
    for (const p of products) {
      if (p?.id != null) map.set(Number(p.id), p);
    }
    return map;
  }, [products]);

  useEffect(() => {
    fetchProducts();
  }, []);

  // Ensure selected products have names/thumbnails even if not in the current catalog page
  useEffect(() => {
    const missing = selectedProductIds.filter((id) => !productsById.has(Number(id)));
    if (missing.length === 0) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/ecwid/products?ids=${encodeURIComponent(missing.join(","))}`);
        if (!res.ok || cancelled) return;
        const data = await res.json();
        const extras = data.items || [];
        if (extras.length === 0 || cancelled) return;
        setProducts((prev) => {
          const seen = new Set(prev.map((p) => Number(p.id)));
          const merged = [...prev];
          for (const item of extras) {
            if (!seen.has(Number(item.id))) merged.push(item);
          }
          return merged;
        });
      } catch {
        // ignore — order list still shows IDs
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedProductIds, productsById]);

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
    fetchProducts(searchQuery.trim() || undefined);
  };

  const toggleProduct = (productId: number) => {
    setSelectedProductIds(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const moveSelected = (productId: number, direction: -1 | 1) => {
    setSelectedProductIds((prev) => {
      const index = prev.indexOf(productId);
      if (index < 0) return prev;
      const next = index + direction;
      if (next < 0 || next >= prev.length) return prev;
      const copy = [...prev];
      const [item] = copy.splice(index, 1);
      copy.splice(next, 0, item);
      return copy;
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setSelectedProductIds((prev) => {
      const oldIndex = prev.findIndex((id) => String(id) === String(active.id));
      const newIndex = prev.findIndex((id) => String(id) === String(over.id));
      if (oldIndex < 0 || newIndex < 0) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  const selectedProductsOrdered = useMemo(
    () =>
      selectedProductIds.map((id) => ({
        id,
        product: productsById.get(Number(id)),
      })),
    [selectedProductIds, productsById],
  );

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await updateDoc(doc(db, 'users', user.id), {
        ecwidProductIds: selectedProductIds
      });
      
      // Also sync over to linked 'scrittori' profiles for public access
      const { query, collection, where, getDocs } = await import('firebase/firestore');
      
      const scrittoriRef = collection(db, 'scrittori');

      const syncToScrittori = async (q: any) => {
         try {
           const snap = await getDocs(q);
           const updatePromises = snap.docs.map(docSnap => 
             updateDoc(doc(db, 'scrittori', docSnap.id), {
               ecwidProductIds: selectedProductIds,
               uid: user.id
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
      <div
        className={clsx(
          "bg-white rounded-3xl flex flex-col shadow-2xl overflow-hidden h-[calc(100dvh-1.5rem)] max-h-[calc(100dvh-1.5rem)] md:h-[calc(100dvh-2rem)] md:max-h-[calc(100dvh-2rem)]",
          "w-full max-w-[min(96rem,100%)]",
        )}
      >
        <div className="flex items-center justify-between p-6 border-b border-[#EAE3D9] shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-[#121212]">Ecwid Connection</h2>
            <p className="text-[#59554E] text-sm mt-1">Link products to {user.fullName || user.email}</p>
          </div>
          <button onClick={onClose} className="p-2 text-[#59554E] hover:bg-[#F2EEE8] rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 flex-1 min-h-0 flex flex-col gap-4 overflow-hidden">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-200 shrink-0">
              {error}
            </div>
          )}

          {selectedProductIds.length > 0 && (
            <div className="border border-[#EAE3D9] rounded-xl flex flex-col min-h-0 flex-[0_0_45%] max-h-[45%] overflow-hidden">
              <div className="px-4 py-2 bg-[#F2EEE8] border-b border-[#EAE3D9] shrink-0">
                <p className="text-xs font-bold uppercase tracking-wider text-[#121212]">
                  Ordine prodotti sul writer ({selectedProductIds.length})
                </p>
                <p className="text-[11px] text-[#59554E] mt-0.5">
                  Trascina l’icona ⋮⋮ oppure usa le frecce per l’ordine sulla pagina pubblica
                </p>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={selectedProductIds.map(String)}
                    strategy={verticalListSortingStrategy}
                  >
                    {selectedProductsOrdered.map(({ id, product }, index) => (
                      <SortableProductRow
                        key={id}
                        id={id}
                        index={index}
                        product={product}
                        total={selectedProductIds.length}
                        onMove={moveSelected}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              </div>
            </div>
          )}

          <form onSubmit={handleSearch} className="flex gap-2 shrink-0">
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

          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain border border-[#EAE3D9] rounded-xl">
            {loading ? (
              <div className="flex items-center justify-center h-full min-h-[160px] p-8">
                <Loader2 className="animate-spin text-[#FF4F00]" size={32} />
              </div>
            ) : products.length === 0 ? (
              <div className="flex items-center justify-center h-full min-h-[160px] p-8 text-[#59554E]">
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
          
          <div className="text-sm text-[#59554E] shrink-0">
            {selectedProductIds.length} product(s) selected
            {!loading && products.length > 0 && (
              <span className="text-[#59554E]/70"> · {products.length} active product(s) listed</span>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-[#EAE3D9] flex justify-end gap-3 bg-[#F2EEE8]/30 shrink-0">
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
