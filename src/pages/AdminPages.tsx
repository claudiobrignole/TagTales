import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, Reorder } from 'motion/react';
import { db } from '../firebase';
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { Save, Plus, Trash2, Edit2, X, FileText, Layout, HelpCircle, Shield, Cookie, MessageSquare, GripVertical } from 'lucide-react';
import AdminPageBlocksEditor, { PageBlock } from '../components/AdminPageBlocksEditor';

const STATIC_PAGES = [
  { id: 'home', titolo: 'Home Page', icon: Layout },
  { id: 'su-di-noi', titolo: 'Su di noi', icon: FileText },
];

import { translateDirtyFields, translateText, translateObjectFields } from '../utils/translate';

export default function AdminPages() {
  const [pages, setPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [pageToDelete, setPageToDelete] = useState<{ id: string, isStatic: boolean } | null>(null);

  const [formData, setFormData] = useState({
    id: '',
    titolo: '',
    blocks: [] as PageBlock[],
    published: true,
    inHeader: false,
    inFooter1: false,
    inFooter2: false,
  });

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      const snap = await getDocs(collection(db, 'pagine'));
      const dbPages = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Merge with static definitions to ensure all required pages are visible
      const mergedPages = STATIC_PAGES.map(staticPage => {
        const found = dbPages.find(p => p.id === staticPage.id);
        return found || { ...staticPage, isNew: true };
      });

      // Add any custom pages
      const customPages = dbPages.filter(p => !STATIC_PAGES.find(sp => sp.id === p.id));
      
      setPages([...mergedPages, ...customPages]);
    } catch(err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (page: any = null) => {
    if (page) {
      setEditingId(page.id);
      let blocks = page.blocks || [];
      
      // If Home and no blocks, initialize with default sections
      if (page.id === 'home' && blocks.length === 0) {
        blocks = [
          { id: 'h1', type: 'home_section', sectionId: 'hero' },
          { id: 'h2', type: 'home_section', sectionId: 'magazine' },
          { id: 'h3', type: 'home_section', sectionId: 'mostre' },
          { id: 'h4', type: 'home_section', sectionId: 'writers' },
          { id: 'h5', type: 'home_section', sectionId: 'newsletter' },
        ];
      }

      setFormData({
        id: page.id,
        titolo: page.titolo || '',
        blocks: blocks,
        published: page.published !== false,
        inHeader: page.inHeader || false,
        inFooter1: page.inFooter1 || false,
        inFooter2: page.inFooter2 || false,
      });
    } else {
      setEditingId(null);
      setFormData({
        id: '',
        titolo: '',
        blocks: [],
        published: true,
        inHeader: false,
        inFooter1: false,
        inFooter2: false,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.id || !formData.titolo) return;
    setSaving(true);
    try {
      const originalPage = editingId ? pages.find(p => p.id === editingId) : null;
      
      const translatedData = await translateDirtyFields(
        { titolo: formData.titolo },
        originalPage,
        ['titolo'],
        'en'
      );
      
      const translatedBlocks = await Promise.all(formData.blocks.map(async (block, index) => {
        let newBlock = { ...block };
        const originalBlock = originalPage?.blocks?.[index];
        
        if (newBlock.text) {
          if (!originalBlock || originalBlock.text !== newBlock.text || !originalBlock.text_en) {
             console.log(`[Translate] Block text changed. Translating...`);
             newBlock.text_en = await translateText(newBlock.text);
          } else {
             newBlock.text_en = originalBlock.text_en;
          }
        }
        if (newBlock.title) {
          if (!originalBlock || originalBlock.title !== newBlock.title || !originalBlock.title_en) {
             console.log(`[Translate] Block title changed. Translating...`);
             newBlock.title_en = await translateText(newBlock.title);
          } else {
             newBlock.title_en = originalBlock.title_en;
          }
        }
        if (newBlock.accordionItems) {
           newBlock.accordionItems = await Promise.all(newBlock.accordionItems.map(async (item: any, idx: number) => {
             const origItem = originalBlock?.accordionItems?.[idx];
             if (!origItem || origItem.title !== item.title || origItem.content !== item.content || !origItem.title_en || !origItem.content_en) {
                console.log(`[Translate] Accordion item changed. Translating...`);
                const itemsEn = await translateObjectFields({title: item.title, content: item.content}, ['title', 'content']);
                return { ...item, title_en: itemsEn.title_en, content_en: itemsEn.content_en };
             }
             return { ...item, title_en: origItem.title_en, content_en: origItem.content_en };
           }));
        }
        if (newBlock.qa) {
           newBlock.qa = await Promise.all(newBlock.qa.map(async (item: any, idx: number) => {
             const origItem = originalBlock?.qa?.[idx];
             if (!origItem || origItem.question !== item.question || origItem.answer !== item.answer || !origItem.question_en || !origItem.answer_en) {
                console.log(`[Translate] QA item changed. Translating...`);
                const qaEn = await translateObjectFields({question: item.question, answer: item.answer}, ['question', 'answer']);
                return { ...item, question_en: qaEn.question_en, answer_en: qaEn.answer_en };
             }
             return { ...item, question_en: origItem.question_en, answer_en: origItem.answer_en };
           }));
        }
        return newBlock;
      }));

      const payload = {
        titolo: formData.titolo,
        titolo_en: translatedData.titolo_en,
        blocks: translatedBlocks,
        published: formData.published,
        inHeader: formData.inHeader,
        inFooter1: formData.inFooter1,
        inFooter2: formData.inFooter2,
        updatedAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'pagine', formData.id), payload, { merge: true });
      
      setIsModalOpen(false);
      await fetchPages();
    } catch(err) {
      console.error(err);
      alert('Errore al salvataggio');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!pageToDelete) return;
    try {
      if (pageToDelete.isStatic) {
        alert("Non puoi eliminare una pagina di sistema, puoi solo svuotarne il contenuto.");
        setPageToDelete(null);
        return;
      }
      await deleteDoc(doc(db, 'pagine', pageToDelete.id));
      await fetchPages();
    } catch(err) {
      console.error(err);
      alert('Errore durante l\'eliminazione della pagina: ' + (err instanceof Error ? err.message : 'Errore sconosciuto'));
    } finally {
      setPageToDelete(null);
    }
  };

  const handleDelete = (id: string, isStatic: boolean) => {
    if (isStatic) {
        alert("Non puoi eliminare una pagina di sistema, puoi solo svuotarne il contenuto.");
        return;
    }
    setPageToDelete({ id, isStatic });
  };

  if (loading) return (
    <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-4 border-[#FF4F00] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="space-y-12 font-['Karla'] pb-20">
      <header className="flex flex-col md:flex-row md:justify-between items-start md:items-end gap-6 border-b border-[#EAE3D9] pb-8">
        <div>
          <h1 className="text-[10vw] md:text-[60px] lg:text-[80px] font-['Shamgod'] uppercase leading-[0.8] mb-4">Pagine Statiche</h1>
          <p className="text-[#59554E] text-lg max-w-2xl">Gestisci i contenuti e il layout modulare delle pagine istituzionali. Puoi aggiungere blocchi di testo, immagini, video e moduli speciali.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()} 
          className="bg-[#121212] hover:bg-[#FF4F00] text-white font-bold py-4 px-8 rounded-full transition-all flex items-center gap-2 uppercase tracking-widest text-xs"
        >
          <Plus size={20} /> Nuova Pagina
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pages.map((page) => {
          const isStatic = STATIC_PAGES.some(sp => sp.id === page.id);
          const icon = STATIC_PAGES.find(sp => sp.id === page.id)?.icon || FileText;
          const IconComp = icon;

          return (
            <motion.div 
              key={page.id}
              whileHover={{ y: -5 }}
              className="bg-white p-8 rounded-[32px] border border-[#EAE3D9] shadow-sm hover:shadow-xl transition-all group flex flex-col justify-between min-h-[240px]"
            >
              <div>
                <div className="w-12 h-12 bg-[#F2EEE8] rounded-2xl flex items-center justify-center text-[#FF4F00] mb-6 group-hover:bg-[#FF4F00] group-hover:text-white transition-all">
                  <IconComp size={24} />
                </div>
                <h3 className="text-2xl font-['Shamgod'] uppercase leading-none mb-2">{page.titolo}</h3>
                <p className="text-xs font-bold text-[#59554E] uppercase tracking-widest opacity-60">ID: {page.id}</p>
                {!page.published && (
                    <span className="inline-block mt-2 px-2 py-0.5 bg-yellow-100 text-yellow-700 text-[10px] font-bold uppercase rounded-full">Bozza</span>
                )}
              </div>

              <div className="flex justify-end gap-2 mt-8">
                <button 
                  onClick={() => handleOpenModal(page)} 
                  className="p-3 bg-[#F8F6F3] text-[#121212] hover:bg-[#121212] hover:text-white rounded-2xl transition-all border border-transparent"
                >
                  <Edit2 size={18} />
                </button>
                {!isStatic && (
                  <button 
                    onClick={() => handleDelete(page.id, isStatic)} 
                    className="p-3 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-2xl transition-all border border-transparent"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {pageToDelete && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#121212]/30 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[32px] p-8 max-w-sm w-full border border-[#EAE3D9] shadow-xl text-center"
            >
              <Trash2 size={48} className="mx-auto text-red-500 mb-6" />
              <h3 className="text-2xl font-['Shamgod'] uppercase mb-4">Elimina Pagina</h3>
              <p className="text-[#59554E] mb-8 font-['Karla']">Sei sicuro di voler eliminare questa pagina? L'azione è irreversibile.</p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setPageToDelete(null)}
                  className="flex-1 py-3 px-4 bg-[#F8F6F3] hover:bg-[#EAE3D9] text-[#121212] rounded-xl font-bold uppercase text-xs tracking-widest transition-colors font-['Karla']"
                >
                  Annulla
                </button>
                <button 
                  onClick={handleDeleteConfirm}
                  className="flex-1 py-3 px-4 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold uppercase text-xs tracking-widest transition-colors font-['Karla']"
                >
                  Elimina
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#121212]/30 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#F2EEE8] rounded-[40px] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-white"
            >
              <div className="flex items-center justify-between p-8 border-b border-[#EAE3D9] bg-white/50">
                <div>
                    <h2 className="text-3xl font-['Shamgod'] uppercase leading-none tracking-widest">
                        {editingId ? `Modifica: ${formData.titolo}` : 'Nuova Pagina'}
                    </h2>
                    <p className="text-xs font-bold text-[#59554E] uppercase tracking-widest opacity-60 mt-1">
                        {editingId ? `ID: ${formData.id}` : 'Inserisci i dettagli della pagina'}
                    </p>
                </div>
                <button onClick={handleCloseModal} className="p-3 hover:bg-[#F2EEE8] rounded-2xl transition-colors">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white p-8 rounded-3xl border border-[#EAE3D9]">
                    <div className="space-y-4">
                        <label className="block text-xs font-bold text-[#59554E] uppercase tracking-[0.2em]">ID Pagina *</label>
                        <input 
                            type="text" 
                            value={formData.id} 
                            disabled={!!editingId}
                            onChange={e => setFormData({ ...formData, id: e.target.value.toLowerCase().replace(/\s/g, '-') })}
                            required
                            className="w-full bg-[#F8F6F3] text-[#121212] p-4 rounded-xl border border-transparent focus:border-[#FF4F00] outline-none font-bold uppercase text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            placeholder="es. faq-nuova"
                        />
                    </div>
                    <div className="space-y-4">
                        <label className="block text-xs font-bold text-[#59554E] uppercase tracking-[0.2em]">Titolo Visibile *</label>
                        <input 
                            type="text" 
                            value={formData.titolo} 
                            onChange={e => setFormData({ ...formData, titolo: e.target.value })}
                            required
                            className="w-full bg-[#F8F6F3] text-[#121212] p-4 rounded-xl border border-transparent focus:border-[#FF4F00] outline-none font-bold text-sm"
                            placeholder="es. Domande Frequenti"
                        />
                    </div>
                    
                    <div className="md:col-span-2 flex flex-wrap gap-6 pt-4 border-t border-[#EAE3D9]">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <div className="relative">
                                <input 
                                    type="checkbox" 
                                    className="sr-only"
                                    checked={formData.published}
                                    onChange={e => setFormData({...formData, published: e.target.checked})}
                                />
                                <div className={`block w-10 h-6 rounded-full transition-colors ${formData.published ? 'bg-[#FF4F00]' : 'bg-[#EAE3D9]'}`}></div>
                                <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${formData.published ? 'translate-x-4' : 'translate-x-0'}`}></div>
                            </div>
                            <span className="text-sm font-bold uppercase tracking-wider text-[#121212]">Pubblicata</span>
                        </label>
                        
                        <label className="flex items-center gap-3 cursor-pointer">
                            <div className="relative">
                                <input 
                                    type="checkbox" 
                                    className="sr-only"
                                    checked={formData.inHeader}
                                    onChange={e => setFormData({...formData, inHeader: e.target.checked})}
                                />
                                <div className={`block w-10 h-6 rounded-full transition-colors ${formData.inHeader ? 'bg-[#FF4F00]' : 'bg-[#EAE3D9]'}`}></div>
                                <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${formData.inHeader ? 'translate-x-4' : 'translate-x-0'}`}></div>
                            </div>
                            <span className="text-sm font-bold uppercase tracking-wider text-[#121212]">Mostra in Menu (Header)</span>
                        </label>
                        
                        <label className="flex items-center gap-3 cursor-pointer">
                            <div className="relative">
                                <input 
                                    type="checkbox" 
                                    className="sr-only"
                                    checked={formData.inFooter1}
                                    onChange={e => setFormData({...formData, inFooter1: e.target.checked})}
                                />
                                <div className={`block w-10 h-6 rounded-full transition-colors ${formData.inFooter1 ? 'bg-[#FF4F00]' : 'bg-[#EAE3D9]'}`}></div>
                                <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${formData.inFooter1 ? 'translate-x-4' : 'translate-x-0'}`}></div>
                            </div>
                            <span className="text-sm font-bold uppercase tracking-wider text-[#121212]">Mostra nel Footer 1</span>
                        </label>
                        
                        <label className="flex items-center gap-3 cursor-pointer">
                            <div className="relative">
                                <input 
                                    type="checkbox" 
                                    className="sr-only"
                                    checked={formData.inFooter2}
                                    onChange={e => setFormData({...formData, inFooter2: e.target.checked})}
                                />
                                <div className={`block w-10 h-6 rounded-full transition-colors ${formData.inFooter2 ? 'bg-[#FF4F00]' : 'bg-[#EAE3D9]'}`}></div>
                                <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${formData.inFooter2 ? 'translate-x-4' : 'translate-x-0'}`}></div>
                            </div>
                            <span className="text-sm font-bold uppercase tracking-wider text-[#121212]">Mostra nel Footer 2</span>
                        </label>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold font-['Shamgod'] uppercase tracking-wider">Composizione Layout</h3>
                        <div className="flex items-center gap-2">
                            <input 
                                id="published"
                                type="checkbox" 
                                checked={formData.published}
                                onChange={e => setFormData({ ...formData, published: e.target.checked })}
                                className="w-5 h-5 accent-[#FF4F00] rounded"
                            />
                            <label htmlFor="published" className="text-xs font-bold uppercase tracking-widest text-[#59554E] cursor-pointer">Visibile sul sito</label>
                        </div>
                    </div>
                    
                    <AdminPageBlocksEditor 
                      blocks={formData.blocks}
                      onChange={blocks => setFormData({ ...formData, blocks })}
                      pageId={formData.id}
                    />
                </div>

                <div className="pt-8 flex justify-end gap-4 border-t border-[#EAE3D9]">
                    <button 
                        type="button" 
                        onClick={handleCloseModal}
                        className="px-8 py-4 font-bold uppercase tracking-widest text-xs text-[#59554E] hover:bg-white rounded-full transition-all"
                    >
                        Annulla
                    </button>
                    <button 
                        disabled={saving}
                        type="submit"
                        className="bg-[#FF4F00] hover:bg-[#121212] text-white font-bold py-4 px-10 rounded-full transition-all shadow-lg shadow-[#FF4F00]/20 flex items-center gap-2 uppercase tracking-widest text-xs"
                    >
                        <Save size={18} /> {saving ? 'Salvataggio...' : 'Salva Modifiche'}
                    </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
