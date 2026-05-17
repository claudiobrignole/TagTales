import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { db, storage, handleFirestoreError, OperationType } from "../firebase";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  writeBatch,
  getDoc
} from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import {
  Plus,
  Edit2,
  Trash2,
  X,
  Image as ImageIcon,
  Calendar,
  GripVertical,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { Reorder } from "motion/react";
import clsx from "clsx";
import { useAuth } from "../contexts/AuthContext";
import ImageUpload from "../components/ImageUpload";
import MultiImageUpload from "../components/MultiImageUpload";
import AdminExhibitionBlocksEditor from "../components/AdminExhibitionBlocksEditor";
import { translateDirtyFields, translateText } from "../utils/translate";
import { generateSlug } from "../utils/slugify";

export default function AdminExhibitions() {
  const { user } = useAuth();
  const [exhibitions, setExhibitions] = useState<any[]>([]);
  const [writers, setWriters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    preTitolo: "",
    titolo: "",
    slug: "",
    slug_en: "",
    intro: "",
    blocks: [] as any[],
    bannerHero: "",
    bannerHeroFallback: "",
    galleria: [] as string[],
    dataApertura: "",
    published: false,
    featured: false,
    artistaIds: [] as string[],
  });

  const fetchData = async () => {
    try {
      const qMostre = query(collection(db, "mostre"), orderBy("createdAt", "desc"));
      const [exhibitionsSnap, writersSnap] = await Promise.all([
        getDocs(qMostre),
        getDocs(collection(db, "scrittori")),
      ]);

      setExhibitions(
        exhibitionsSnap.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .sort((a: any, b: any) => (a.order ?? 999) - (b.order ?? 999)),
      );
      setWriters(
        writersSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
      );
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateExhibitionsOrder = async (newExhibitions: any[]) => {
    setExhibitions(newExhibitions);
    try {
      const batch = writeBatch(db);
      newExhibitions.forEach((exhibition, index) => {
        const docRef = doc(db, "mostre", exhibition.id);
        batch.update(docRef, { order: index });
      });
      await batch.commit();
    } catch (error) {
      console.error("Error updating exhibitions order:", error);
    }
  };

  const moveExhibition = async (index: number, direction: 'up' | 'down') => {
    const newExhibitions = [...exhibitions];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= exhibitions.length) return;
    
    const [movedItem] = newExhibitions.splice(index, 1);
    newExhibitions.splice(targetIndex, 0, movedItem);
    
    await updateExhibitionsOrder(newExhibitions);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (exhibition: any = null) => {
    if (exhibition) {
      setEditingId(exhibition.id);
      setFormData({
        preTitolo: exhibition.preTitolo || "",
        titolo: exhibition.titolo || "",
        slug: exhibition.slug || "",
        slug_en: exhibition.slug_en || "",
        intro: exhibition.intro || "",
        blocks: exhibition.blocks || [],
        bannerHero: exhibition.bannerHero || "",
        bannerHeroFallback: exhibition.bannerHeroFallback || "",
        galleria: exhibition.galleria || [],
        dataApertura: exhibition.dataApertura || "",
        published: exhibition.published || false,
        featured: exhibition.featured || false,
        artistaIds: exhibition.artistaIds || [],
      });
    } else {
      setEditingId(null);
      setFormData({
        preTitolo: "",
        titolo: "",
        slug: "",
        slug_en: "",
        intro: "",
        blocks: [],
        bannerHero: "",
        bannerHeroFallback: "",
        galleria: [] as string[],
        dataApertura: "",
        published: false,
        featured: false,
        artistaIds: [],
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const [isSaving, setIsSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState(0);
  const [saveStatus, setSaveStatus] = useState("");

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const titolo = e.target.value;
    setFormData((prev) => ({
      ...prev,
      titolo,
      slug:
        prev.slug === generateSlug(prev.titolo) || prev.slug === ""
          ? generateSlug(titolo)
          : prev.slug,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    setIsSaving(true);
    setSaveProgress(10);
    setSaveStatus("Traduzione titoli...");
    try {
      const originalExhibition = editingId ? exhibitions.find(e => e.id === editingId) : null;
      
      const translatedData = await translateDirtyFields(
        formData,
        originalExhibition,
        ['preTitolo', 'titolo', 'intro'],
        'en'
      );
      
      setSaveProgress(70);
      setSaveStatus("Traduzione blocchi...");
      const translatedBlocks = await Promise.all(formData.blocks.map(async (block, index) => {
        let newBlock = { ...block };
        if (newBlock.text) {
          const originalBlock = originalExhibition?.blocks?.[index];
          if (!originalBlock || originalBlock.text !== newBlock.text || !originalBlock.text_en) {
             console.log(`[Translate] Block text changed. Translating...`);
             newBlock.text_en = await translateText(newBlock.text);
          } else {
             newBlock.text_en = originalBlock.text_en;
          }
        }
        return newBlock;
      }));

      setSaveProgress(85);
      setSaveStatus("Salvataggio su database...");

      const payload = {
        ...translatedData,
        slug_en: formData.slug_en || formData.slug,
        blocks: translatedBlocks,
        updatedAt: new Date().toISOString(),
      };

      if (editingId) {
        await updateDoc(doc(db, "mostre", editingId), payload);
      } else {
        await addDoc(collection(db, "mostre"), {
          ...payload,
          createdAt: new Date().toISOString(),
        });
      }
      setSaveProgress(100);
      setSaveStatus("Mostra salvata con successo!");
      setTimeout(() => {
        handleCloseModal();
        fetchData();
        setIsSaving(false);
        setSaveProgress(0);
        setSaveStatus("");
      }, 1500);
    } catch (error) {
      console.error("Error saving exhibition:", error);
      alert("Errore durante il salvataggio della mostra.");
      setIsSaving(false);
      setSaveProgress(0);
      setSaveStatus("");
    }
  };

  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    const id = itemToDelete;
    setItemToDelete(null);
    try {
      setExhibitions(exhibitions.filter(e => e.id !== id));
      
      // 1. Fetch document to identify images
      const docRef = doc(db, "mostre", id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        // Helper to delete from storage (soft fail)
        const deleteImageFromStorage = async (url: string) => {
          if (!url) return;
          try {
            let storageRef;
            if (url.startsWith('https://')) {
              const path = decodeURIComponent(url.split('/o/')[1].split('?')[0]);
              storageRef = ref(storage, path);
            } else {
              storageRef = ref(storage, url);
            }
            await deleteObject(storageRef);
          } catch (e) {
            console.warn("Soft failure: Could not delete image:", e);
          }
        };

        if (data.bannerHero) await deleteImageFromStorage(data.bannerHero);
        
        if (data.galleria && Array.isArray(data.galleria)) {
          for (const img of data.galleria) {
            await deleteImageFromStorage(img);
          }
        }
        
        if (data.blocks && Array.isArray(data.blocks)) {
           for (const block of data.blocks) {
              if (block.type === 'image' && block.url) await deleteImageFromStorage(block.url);
              if (block.type === 'gallery' && Array.isArray(block.images)) {
                 for (const img of block.images) await deleteImageFromStorage(img);
              }
           }
        }
      }

      // 2. Delete Firestore Document
      await deleteDoc(docRef);
      fetchData();
    } catch (error) {
      console.error("Error deleting exhibition:", error);
      handleFirestoreError(error, OperationType.DELETE, `mostre/${id}`);
      alert("Errore nell'eliminazione della mostra: " + (error instanceof Error ? error.message : String(error)));
      fetchData();
    }
  };

  const handleDelete = (id: string) => {
    setItemToDelete(id);
  };

  const toggleWriter = (writerId: string) => {
    setFormData((prev) => ({
      ...prev,
      artistaIds: prev.artistaIds.includes(writerId)
        ? prev.artistaIds.filter((id) => id !== writerId)
        : [...prev.artistaIds, writerId],
    }));
  };

  return (
    <div className="w-full space-y-8 font-['Karla']">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:justify-between items-start md:items-center gap-4 mb-8"
      >
        <div>
          <h1 className="text-3xl font-bold font-['Shamgod'] uppercase text-[#121212] mb-2 tracking-widest text-[8vw] md:text-[50px] leading-none">
            Gestione Mostre
          </h1>
          <p className="text-[#59554E]">
            Crea e gestisci le mini-mostre presentate sulla piattaforma.
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-[#FF4F00] flex items-center gap-2 text-white px-6 py-3 rounded-full font-bold uppercase tracking-wider hover:bg-[#121212] transition-colors"
        >
          <Plus size={20} /> Aggiungi Mostra
        </button>
      </motion.div>

      {loading ? (
        <div className="flex justify-center items-center py-20">Caricamento...</div>
      ) : exhibitions.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-sm border border-[#EAE3D9] p-8 md:p-12 text-center text-[#59554E]">
          <p>
            Nessuna mostra aggiunta. Clicca "Aggiungi Mostra" per creare la prima.
          </p>
        </div>
      ) : (
        <Reorder.Group
          axis="y"
          values={exhibitions}
          onReorder={updateExhibitionsOrder}
          className="space-y-4"
        >
          {exhibitions.map((exhibition, index) => (
            <Reorder.Item
              key={exhibition.id}
              value={exhibition}
              className="bg-white rounded-2xl shadow-sm border border-[#EAE3D9] overflow-hidden flex flex-col md:flex-row group p-4 gap-6 items-center"
            >
              <div className="flex items-center gap-4">
                <div className="cursor-grab active:cursor-grabbing text-[#59554E] hover:text-[#FF4F00] transition-colors">
                  <GripVertical size={24} />
                </div>
                <div className="flex flex-col gap-1">
                  <button
                    disabled={index === 0}
                    onClick={() => moveExhibition(index, 'up')}
                    className="p-1 text-[#59554E] hover:bg-[#F2EEE8] rounded-md transition-colors disabled:opacity-30"
                  >
                    <ChevronUp size={16} />
                  </button>
                  <button
                    disabled={index === exhibitions.length - 1}
                    onClick={() => moveExhibition(index, 'down')}
                    className="p-1 text-[#59554E] hover:bg-[#F2EEE8] rounded-md transition-colors disabled:opacity-30"
                  >
                    <ChevronDown size={16} />
                  </button>
                </div>
              </div>

              <div className="w-24 h-24 md:w-32 md:h-32 flex-shrink-0 rounded-xl overflow-hidden bg-[#F2EEE8] flex items-center justify-center border border-[#EAE3D9]">
                {exhibition.bannerHero ? (
                  exhibition.bannerHero.match(/\.(mp4|webm|mov|m4v)(\?.*)?$/i) ? (
                    <video
                      src={exhibition.bannerHero}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      src={exhibition.bannerHero}
                      alt={exhibition.titolo}
                      className="w-full h-full object-cover"
                    />
                  )
                ) : (
                  <ImageIcon className="w-8 h-8 text-[#59554E]" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex gap-2 mb-2 flex-wrap">
                  <span
                    className={clsx(
                      "text-[10px] font-bold uppercase px-2 py-0.5 rounded-full",
                      exhibition.published
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500",
                    )}
                  >
                    {exhibition.published ? "Pubblicata" : "Bozza"}
                  </span>
                  {exhibition.featured && (
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                      In Evidenza
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-xl text-[#121212] font-['Shamgod'] uppercase tracking-wider mb-1 leading-none truncate">
                  {exhibition.titolo}
                </h3>
                {exhibition.intro && (
                  <p className="text-xs font-bold text-[#FF4F00] uppercase tracking-wider">
                    {exhibition.intro}
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleOpenModal(exhibition)}
                  className="p-3 text-[#59554E] hover:bg-[#F2EEE8] rounded-xl transition-colors border border-[#EAE3D9]"
                >
                  <Edit2 size={18} />
                </button>
                <button
                  onClick={() => handleDelete(exhibition.id)}
                  className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors border border-red-100"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </Reorder.Item>
          ))}
        </Reorder.Group>
      )}

      <AnimatePresence>
        {itemToDelete && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#121212]/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full text-center"
            >
              <h3 className="font-['Shamgod'] text-2xl uppercase mb-4 text-[#121212]">
                Conferma Eliminazione
              </h3>
              <p className="text-[#59554E] mb-6">
                Sei sicuro di voler eliminare questa mostra? L'azione non può essere annullata.
              </p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => setItemToDelete(null)}
                  className="px-6 py-2 rounded-full font-bold uppercase tracking-wider bg-gray-100 hover:bg-gray-200 text-[#121212] transition-colors"
                >
                  Annulla
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-6 py-2 rounded-full font-bold uppercase tracking-wider bg-red-500 hover:bg-red-600 text-white transition-colors"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#121212]/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#F2EEE8] rounded-3xl shadow-2xl border border-[#EAE3D9] w-full max-w-3xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between p-6 border-b border-[#EAE3D9] sticky top-0 bg-[#F2EEE8] z-10">
                <h2 className="text-2xl font-bold font-['Shamgod'] uppercase text-[#121212] tracking-widest">
                  {editingId ? "Modifica Mostra" : "Aggiungi Nuova Mostra"}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="text-[#59554E] hover:text-[#121212] transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-bold text-[#59554E] mb-2">
                    Pre-titolo (Occhiello)
                  </label>
                  <input
                    type="text"
                    value={formData.preTitolo}
                    onChange={(e) => setFormData({ ...formData, preTitolo: e.target.value })}
                    className="w-full bg-white border border-[#EAE3D9] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#FF4F00]/20 focus:border-[#FF4F00] transition-all"
                    placeholder="es. PRESENTATO DA, IN COLLABORAZIONE CON..."
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-[#59554E] mb-2">
                      Titolo *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.titolo}
                      onChange={handleTitleChange}
                      className="w-full bg-white border border-[#EAE3D9] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#FF4F00]/20 focus:border-[#FF4F00] transition-all"
                      placeholder="es. TAG TALES"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-[#59554E] mb-2">
                       Slug URL *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      className="w-full bg-white border border-[#EAE3D9] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#FF4F00]/20 focus:border-[#FF4F00] transition-all"
                      placeholder="tag-tales"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-[#59554E] mb-2">
                      Slug URL Inglese (EN)
                    </label>
                    <input
                      type="text"
                      value={formData.slug_en}
                      onChange={(e) => setFormData({ ...formData, slug_en: e.target.value })}
                      className="w-full bg-white border border-[#EAE3D9] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#FF4F00]/20 focus:border-[#FF4F00] transition-all"
                      placeholder="es. tag-tales-exhibition"
                    />
                    <p className="text-xs text-[#59554E] mt-1">Lascia vuoto per usare lo slug italiano anche in inglese.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-[#59554E] mb-2">
                      Sottotitolo / Intro
                    </label>
                    <textarea
                      rows={5}
                      value={formData.intro}
                      onChange={(e) =>
                        setFormData({ ...formData, intro: e.target.value })
                      }
                      className="w-full bg-white border border-[#EAE3D9] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#FF4F00]/20 focus:border-[#FF4F00] transition-all"
                      placeholder="es. Ogni storia di writer inizia con un tag."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-[#59554E] mb-2">
                      Data di Apertura
                    </label>
                    <input
                      type="date"
                      value={
                        formData.dataApertura
                          ? formData.dataApertura.split("T")[0]
                          : ""
                      }
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          dataApertura: e.target.value
                            ? new Date(e.target.value).toISOString()
                            : "",
                        })
                      }
                      className="w-full bg-white border border-[#EAE3D9] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#FF4F00]/20 focus:border-[#FF4F00] transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-[#EAE3D9]">
                  <h3 className="font-bold text-[#121212]">Media</h3>
                  <ImageUpload
                    label="Immagine di Copertina (Banner Hero) *"
                    value={formData.bannerHero}
                    onChange={(url) => setFormData({ ...formData, bannerHero: url })}
                    folder="exhibitions"
                  />
                  {formData.bannerHero && formData.bannerHero.match(/\.(mp4|webm|mov|m4v)(\?.*)?$/i) && (
                    <ImageUpload
                      label="Immagine Fallback Copertina (SEO/Poster Opzionale)"
                      value={formData.bannerHeroFallback}
                      onChange={(url) => setFormData({ ...formData, bannerHeroFallback: url })}
                      folder="exhibitions"
                    />
                  )}

                  <MultiImageUpload
                    label="Galleria Immagini (Fallback / Vecchio formato)"
                    values={formData.galleria}
                    onChange={(urls) => setFormData({ ...formData, galleria: urls })}
                    folder="exhibitions"
                  />

                  <AdminExhibitionBlocksEditor 
                    blocks={formData.blocks}
                    onChange={blocks => setFormData({ ...formData, blocks })}
                  />


                </div>

                <div className="space-y-4 pt-4 border-t border-[#EAE3D9]">
                  <h3 className="font-bold text-[#121212]">Writers Partecipanti</h3>
                  <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto bg-white border border-[#EAE3D9] rounded-xl p-2">
                    {writers.length === 0 ? (
                      <p className="text-sm text-center text-[#59554E] p-4">
                        Nessun writer trovato. Aggiungi i writer prima.
                      </p>
                    ) : (
                      writers.map((writer) => (
                        <label
                          key={writer.id}
                          className="flex items-center gap-3 p-2 hover:bg-[#F2EEE8] rounded-lg cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={formData.artistaIds.includes(writer.id)}
                            onChange={() => toggleWriter(writer.id)}
                            className="w-5 h-5 accent-[#FF4F00] rounded"
                          />
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#121212] overflow-hidden shrink-0">
                              {writer.fotoProfilo && (
                                <img
                                  src={writer.fotoProfilo}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              )}
                            </div>
                            <span className="font-bold text-[#121212]">
                              {writer.nickname}
                            </span>
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-6 pt-4 border-t border-[#EAE3D9]">
                  <div className="flex items-center gap-3">
                    <input
                      id="publishedExhibition"
                      type="checkbox"
                      checked={formData.published}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          published: e.target.checked,
                        })
                      }
                      className="w-5 h-5 accent-[#FF4F00] rounded"
                    />
                    <label
                      htmlFor="publishedExhibition"
                      className="font-bold text-[#121212] select-none cursor-pointer"
                    >
                      Pubblica Online
                    </label>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      id="featuredExhibition"
                      type="checkbox"
                      checked={formData.featured}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          featured: e.target.checked,
                        })
                      }
                      className="w-5 h-5 accent-[#FF4F00] rounded"
                    />
                    <label
                      htmlFor="featuredExhibition"
                      className="font-bold text-[#121212] select-none cursor-pointer"
                    >
                      In Evidenza (Home Page)
                    </label>
                  </div>
                </div>

                <div className="pt-6 flex justify-end gap-3 sticky bottom-0 bg-[#F2EEE8] pb-6">
                  {isSaving && (
                      <div className="w-full mr-4">
                          <div className="w-full bg-[#EAE3D9] h-2 rounded-full overflow-hidden">
                              <div className="bg-[#FF4F00] h-full transition-all duration-300" style={{ width: `${saveProgress}%` }} />
                          </div>
                          <p className="text-xs font-bold text-[#59554E] mt-2">{saveStatus}</p>
                      </div>
                  )}
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-6 py-3 rounded-full font-bold uppercase tracking-wider text-[#59554E] hover:bg-white transition-colors"
                  >
                    Annulla
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-6 py-3 rounded-full font-bold uppercase tracking-wider text-white bg-[#FF4F00] hover:bg-[#121212] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? "Salvataggio..." : editingId ? "Salva Modifiche" : "Crea Mostra"}
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
