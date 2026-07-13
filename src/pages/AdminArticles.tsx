import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { db, storage, handleFirestoreError, OperationType } from "../firebase";
import {
  ref,
  deleteObject,
} from "firebase/storage";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  query,
  orderBy,
  writeBatch,
} from "firebase/firestore";
import { Plus, Edit2, Trash2, X, Image as ImageIcon, GripVertical, ChevronUp, ChevronDown } from "lucide-react";
import { Reorder } from "motion/react";
import clsx from "clsx";
import { useAuth } from "../contexts/AuthContext";
import ImageUpload from "../components/ImageUpload";
import MultiImageUpload from "../components/MultiImageUpload";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { translateDirtyFields } from "../utils/translate";
import { useI18n } from '../contexts/I18nContext';

import { generateSlug } from "../utils/slugify";
import { generatePreviewToken } from "../utils/previewAccess";
import PreviewLinkPanel from "../components/PreviewLinkPanel";
import { ADMIN_MODAL } from "../constants/theme";

export default function AdminArticles() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState("");

  const [formData, setFormData] = useState({
    preTitolo: "",
    titolo: "",
    sottotitolo: "",
    slug: "",
    slug_en: "",
    contenuto: "",
    autore: "",
    immagineCopertina: "",
    galleria: [] as string[],
    videoEmbeds: [] as string[],
    published: false,
    tag: [] as string[],
    previewToken: "",
  });

  const fetchArticles = async () => {
    try {
      const q = query(collection(db, "articoli"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const data = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .sort((a: any, b: any) => (a.order ?? 999) - (b.order ?? 999));
      setArticles(data);
    } catch (error) {
      console.error("Error fetching articles:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateArticlesOrder = async (newArticles: any[]) => {
    setArticles(newArticles);
    try {
      const batch = writeBatch(db);
      newArticles.forEach((article, index) => {
        const docRef = doc(db, "articoli", article.id);
        batch.update(docRef, { order: index });
      });
      await batch.commit();
    } catch (error) {
      console.error("Error updating articles order:", error);
    }
  };

  const moveArticle = async (index: number, direction: 'up' | 'down') => {
    const newArticles = [...articles];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= articles.length) return;
    
    const [movedItem] = newArticles.splice(index, 1);
    newArticles.splice(targetIndex, 0, movedItem);
    
    await updateArticlesOrder(newArticles);
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  const handleOpenModal = (article: any = null) => {
    if (article) {
      setEditingId(article.id);
      setFormData({
        preTitolo: article.preTitolo || "",
        titolo: article.titolo || "",
        sottotitolo: article.sottotitolo || "",
        slug: article.slug || "",
        slug_en: article.slug_en || "",
        contenuto: article.contenuto || "",
        autore: article.autore || "",
        immagineCopertina: article.immagineCopertina || "",
        galleria: article.galleria || [],
        videoEmbeds: article.videoEmbeds || [],
        published: article.published || false,
        tag: article.tag || [],
        previewToken: article.previewToken || generatePreviewToken(),
      });
    } else {
      setEditingId(null);
      setFormData({
        preTitolo: "",
        titolo: "",
        sottotitolo: "",
        slug: "",
        slug_en: "",
        contenuto: "",
        autore: "",
        immagineCopertina: "",
        galleria: [] as string[],
        videoEmbeds: [] as string[],
        published: false,
        tag: [],
        previewToken: generatePreviewToken(),
      });
    }
    setTagInput("");
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

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

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const newTag = tagInput.trim();
      if (newTag && !formData.tag.includes(newTag)) {
        setFormData((prev) => ({ ...prev, tag: [...prev.tag, newTag] }));
      }
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tag: prev.tag.filter((tag) => tag !== tagToRemove),
    }));
  };

  const [isSaving, setIsSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState(0);
  const [saveStatus, setSaveStatus] = useState("");

  const handleSubmit = async (e: React.FormEvent | null, forceTranslate = false) => {
    if (e) e.preventDefault();
    if (isSaving) return;
    setIsSaving(true);
    setSaveProgress(10);
    setSaveStatus("Traduzione...");

    try {
      const originalArticle = (editingId && !forceTranslate) ? articles.find(a => a.id === editingId) : null;
      
      const translatedData = await translateDirtyFields(
        formData,
        originalArticle,
        ['preTitolo', 'titolo', 'sottotitolo', 'contenuto'],
        'en'
      );
      
      setSaveProgress(80);
      setSaveStatus(t('adminArticles.saving', 'Salvataggio...'));

      const payload = {
        ...translatedData,
        slug_en: formData.slug_en || formData.slug,
        previewToken: formData.previewToken || generatePreviewToken(),
        updatedAt: new Date().toISOString(),
      };

      if (editingId) {
        await updateDoc(doc(db, "articoli", editingId), payload);
      } else {
        await addDoc(collection(db, "articoli"), {
          ...payload,
          previewTokenCreatedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        });
      }
      setSaveProgress(100);
      setSaveStatus(t('adminArticles.saved', 'Salvato!'));
      setTimeout(() => {
        handleCloseModal();
        fetchArticles();
        setIsSaving(false);
        setSaveProgress(0);
        setSaveStatus("");
      }, 1000);
    } catch (error) {
      console.error("Error saving article:", error);
      alert(t('adminArticles.saveError', "Errore durante il salvataggio dell'articolo."));
      setIsSaving(false);
      setSaveProgress(0);
      setSaveStatus("");
    }
  };

  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  // ... (inside the component)

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    const id = itemToDelete;
    setItemToDelete(null);
    try {
      setArticles(articles.filter(a => a.id !== id));

      // 1. Fetch document to identify images
      const docRef = doc(db, "articoli", id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        // Helper to delete from storage
        const deleteImageFromStorage = async (url: string) => {
          if (!url) return;
          try {
            let storageRef;
            if (url.startsWith('https://')) {
              // Extract path from download URL
              const path = decodeURIComponent(url.split('/o/')[1].split('?')[0]);
              storageRef = ref(storage, path);
            } else {
              storageRef = ref(storage, url);
            }
            await deleteObject(storageRef);
          } catch (e) {
            console.error("Could not delete image, possibly already gone:", e);
          }
        };

        // Delete cover image
        if (data.immagineCopertina) await deleteImageFromStorage(data.immagineCopertina);
        
        // Delete gallery images
        if (data.galleria && Array.isArray(data.galleria)) {
          await Promise.all(data.galleria.map(deleteImageFromStorage));
        }
      }
      
      // 2. Delete Firestore Document
      await deleteDoc(docRef);

      fetchArticles();
    } catch (error) {
      console.error("Error deleting article:", error);
      handleFirestoreError(error, OperationType.DELETE, `articoli/${id}`);
      alert(t('adminArticles.deleteError', "Errore nell'eliminazione dell'articolo: ") + (error instanceof Error ? error.message : String(error)));
      fetchArticles(); // revert optimistic update
    }
  };

  const handleDelete = (id: string) => {
     setItemToDelete(id);
  };

  return (
    <div className="w-full space-y-8 font-['Karla']">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:justify-between items-start md:items-center gap-4 mb-8"
      >
        <div>
          <h1 className="text-4xl md:text-6xl font-['Shamgod'] uppercase leading-[0.8] tracking-normal text-[#121212] mb-4">
            {t('adminArticles.title', 'Gestione Magazine')}
          </h1>
          <p className="text-[#59554E]">
            {t('adminArticles.subtitle', 'Gestisci articoli e notizie per la sezione magazine pubblica.')}
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-[#FF4F00] flex items-center gap-2 text-white px-6 py-3 rounded-full font-bold uppercase tracking-wider hover:bg-[#121212] transition-colors"
        >
          <Plus size={20} /> {t('adminArticles.addArticle', 'Aggiungi Articolo')}
        </button>
      </motion.div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          {t('adminArticles.loading', 'Caricamento...')}
        </div>
      ) : articles.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-sm border border-[#EAE3D9] p-8 md:p-12 text-center text-[#59554E]">
          <p>
            {t('adminArticles.noArticles', 'Nessun articolo aggiunto. Clicca "Aggiungi Articolo" per scrivere il primo.')}
          </p>
        </div>
      ) : (
        <Reorder.Group
          axis="y"
          values={articles}
          onReorder={updateArticlesOrder}
          className="space-y-4"
        >
          {articles.map((article, index) => (
            <Reorder.Item
              key={article.id}
              value={article}
              className="bg-white rounded-2xl shadow-sm border border-[#EAE3D9] overflow-hidden flex flex-col md:flex-row group p-4 gap-6 items-center"
            >
              <div className="flex items-center gap-4">
                <div className="cursor-grab active:cursor-grabbing text-[#59554E] hover:text-[#FF4F00] transition-colors">
                  <GripVertical size={24} />
                </div>
                <div className="flex flex-col gap-1">
                  <button
                    disabled={index === 0}
                    onClick={() => moveArticle(index, 'up')}
                    className="p-1 text-[#59554E] hover:bg-[#F2EEE8] rounded-md transition-colors disabled:opacity-30"
                  >
                    <ChevronUp size={16} />
                  </button>
                  <button
                    disabled={index === articles.length - 1}
                    onClick={() => moveArticle(index, 'down')}
                    className="p-1 text-[#59554E] hover:bg-[#F2EEE8] rounded-md transition-colors disabled:opacity-30"
                  >
                    <ChevronDown size={16} />
                  </button>
                </div>
              </div>

              <div className="w-24 h-24 md:w-32 md:h-32 flex-shrink-0 rounded-xl overflow-hidden bg-[#F2EEE8] flex items-center justify-center border border-[#EAE3D9]">
                {article.immagineCopertina ? (
                  <img
                    src={article.immagineCopertina}
                    alt={article.titolo}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageIcon className="w-6 h-6 text-[#59554E]" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex gap-2 mb-1">
                  <span
                    className={clsx(
                      "text-[10px] font-bold uppercase px-2 py-0.5 rounded-full",
                      article.published
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500",
                    )}
                  >
                    {article.published ? t('adminArticles.statusPublished', "Pubblicato") : "Solo link anteprima"}
                  </span>
                </div>
                <h3 className="font-bold text-lg text-[#121212] font-['Shamgod'] uppercase tracking-wider mb-1 leading-tight truncate">
                  {article.titolo}
                </h3>
                {article.autore && (
                  <p className="text-xs font-bold text-[#FF4F00]">
                    Di {article.autore}
                  </p>
                )}
                <p className="text-[10px] text-[#59554E] mt-1">
                  Creato il: {new Date(article.createdAt).toLocaleDateString()}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleOpenModal(article)}
                  className="p-3 text-[#59554E] hover:bg-[#F2EEE8] rounded-xl transition-colors border border-[#EAE3D9]"
                >
                  <Edit2 size={18} />
                </button>
                <button
                  onClick={() => handleDelete(article.id)}
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
          <div className={clsx(ADMIN_MODAL.backdropElevated, "bg-[#121212]/50 backdrop-blur-sm")}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full text-center"
            >
              <h3 className="font-['Shamgod'] text-2xl uppercase mb-4 text-[#121212]">
                {t('adminArticles.confirmDelete', 'Conferma Eliminazione')}
              </h3>
            <p className="text-[#59554E] mb-6">
              {t('adminArticles.deleteWarning', "Sei sicuro di voler eliminare questo articolo? L'azione non può essere annullata.")}
            </p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => setItemToDelete(null)}
                  className="px-6 py-2 rounded-full font-bold uppercase tracking-wider bg-gray-100 hover:bg-gray-200 text-[#121212] transition-colors"
                >
                  {t('adminArticles.cancel', 'Annulla')}
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-6 py-2 rounded-full font-bold uppercase tracking-wider bg-red-500 hover:bg-red-600 text-white transition-colors"
                >
                  {t('adminArticles.delete', 'Elimina')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isModalOpen && (
          <div className={clsx(ADMIN_MODAL.backdrop, "bg-[#121212]/50 backdrop-blur-sm")}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={clsx(
                "bg-[#F2EEE8] rounded-3xl shadow-2xl border border-[#EAE3D9] overflow-y-auto",
                ADMIN_MODAL.panelWide,
              )}
            >
              <div className="flex items-center justify-between p-6 border-b border-[#EAE3D9] sticky top-0 bg-[#F2EEE8] z-10">
                <h2 className="text-2xl font-bold font-['Shamgod'] uppercase text-[#121212] tracking-widest">
                  {editingId ? t('adminArticles.editArticle', "Modifica Articolo") : t('adminArticles.writeNew', "Scrivi Nuovo Articolo")}
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
                    placeholder="es. Intervista esclusiva, Zoom in..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                      placeholder="Titolo articolo..."
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
                      onChange={(e) =>
                        setFormData({ ...formData, slug: e.target.value })
                      }
                      className="w-full bg-white border border-[#EAE3D9] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#FF4F00]/20 focus:border-[#FF4F00] transition-all"
                      placeholder="slug-articolo"
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
                      placeholder="slug-article-en"
                    />
                    <p className="text-xs text-[#59554E] mt-1">Lascia vuoto per usare lo slug italiano anche in inglese.</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#59554E] mb-2">
                    Sottotitolo / Sommario
                  </label>
                  <textarea
                    rows={3}
                    value={formData.sottotitolo}
                    onChange={(e) =>
                      setFormData({ ...formData, sottotitolo: e.target.value })
                    }
                    className="w-full bg-white border border-[#EAE3D9] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#FF4F00]/20 focus:border-[#FF4F00] transition-all resize-none"
                    placeholder="Breve introduzione o sommario dell'articolo..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#59554E] mb-2">
                    Autore
                  </label>
                  <input
                    type="text"
                    value={formData.autore}
                    onChange={(e) =>
                      setFormData({ ...formData, autore: e.target.value })
                    }
                    className="w-full bg-white border border-[#EAE3D9] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#FF4F00]/20 focus:border-[#FF4F00] transition-all"
                    placeholder="es. Claudio B."
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#59554E] mb-2">
                    Contenuto * (Immagini e video possono essere inseriti qui)
                  </label>
                <div className="bg-white border border-[#EAE3D9] rounded-xl relative quill-wrapper-override">
                  <ReactQuill
                    theme="snow"
                    value={formData.contenuto}
                    onChange={(content) =>
                      setFormData({ ...formData, contenuto: content })
                    }
                    modules={{
                      toolbar: [
                        [{ header: [1, 2, 3, 4, false] }],
                        [
                          "bold",
                          "italic",
                          "underline",
                          "strike",
                          "blockquote",
                        ],
                        [
                          { list: "ordered" },
                          { list: "bullet" },
                          { indent: "-1" },
                          { indent: "+1" },
                        ],
                        ["link", "image", "video"],
                        ["clean"],
                      ],
                    }}
                    className="min-h-[300px]"
                  />
                </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-[#EAE3D9]">
                  <h3 className="font-bold text-[#121212]">Media & Tag</h3>
                  <ImageUpload
                    label="Immagine di Copertina"
                    value={formData.immagineCopertina}
                    onChange={(url) =>
                      setFormData({ ...formData, immagineCopertina: url })
                    }
                    folder="articles"
                  />

                  <MultiImageUpload
                    label="Galleria Immagini"
                    values={formData.galleria}
                    onChange={(urls) =>
                      setFormData({ ...formData, galleria: urls })
                    }
                    folder="articles"
                  />

                  <div>
                    <label className="block text-sm font-bold text-[#59554E] mb-2">
                      Video Embeds (YouTube/Vimeo)
                    </label>
                    <div className="space-y-3">
                      {formData.videoEmbeds.map((url, index) => (
                        <div key={index} className="flex gap-2">
                          <input
                            type="text"
                            value={url}
                            readOnly
                            className="flex-1 bg-white border border-[#EAE3D9] rounded-xl px-4 py-2 text-sm"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setFormData({
                                ...formData,
                                videoEmbeds: formData.videoEmbeds.filter(
                                  (_, i) => i !== index,
                                ),
                              })
                            }
                            className="bg-red-50 text-red-500 p-2 rounded-xl"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      ))}
                      <div className="flex gap-2">
                        <input
                          id="newVideoEmbedArt"
                          type="text"
                          placeholder="Incolla URL YouTube o Vimeo"
                          className="flex-1 bg-white border border-[#EAE3D9] rounded-xl px-4 py-2 text-sm focus:border-[#FF4F00] outline-none"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              const val = (e.target as HTMLInputElement).value;
                              if (val) {
                                setFormData({
                                  ...formData,
                                  videoEmbeds: [...formData.videoEmbeds, val],
                                });
                                (e.target as HTMLInputElement).value = "";
                              }
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const input = document.getElementById(
                              "newVideoEmbedArt",
                            ) as HTMLInputElement;
                            if (input.value) {
                              setFormData({
                                ...formData,
                                videoEmbeds: [
                                  ...formData.videoEmbeds,
                                  input.value,
                                ],
                              });
                              input.value = "";
                            }
                          }}
                          className="bg-[#121212] text-white px-4 py-2 rounded-xl text-xs font-bold uppercase"
                        >
                          {t('adminArticles.add', 'Aggiungi')}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-[#59554E] mb-2">
                      Tag
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {formData.tag.map((tag) => (
                        <span
                          key={tag}
                          className="bg-[#121212] text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-2"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="hover:text-[#FF4F00]"
                          >
                            <X size={14} />
                          </button>
                        </span>
                      ))}
                    </div>
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleAddTag}
                      className="w-full bg-white border border-[#EAE3D9] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#FF4F00]/20 focus:border-[#FF4F00] transition-all"
                      placeholder="Scrivi un tag e premi Invio..."
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-6 pt-4 border-t border-[#EAE3D9]">
                  <PreviewLinkPanel
                    type="article"
                    slug={formData.slug}
                    previewToken={formData.previewToken}
                    published={formData.published}
                    onRegenerateToken={(newToken) =>
                      setFormData((prev) => ({ ...prev, previewToken: newToken }))
                    }
                  />
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex items-center gap-3">
                    <input
                      id="publishedArticle"
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
                      htmlFor="publishedArticle"
                      className="font-bold text-[#121212] select-none cursor-pointer"
                    >
                      Pubblica Online
                    </label>
                  </div>
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
                    {t('adminArticles.cancel', 'Annulla')}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleSubmit(e, true)}
                    disabled={isSaving}
                    className="px-6 py-3 rounded-full font-bold uppercase tracking-wider text-white bg-blue-500 hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t('common.forceTranslate', 'Forza Traduzione')}
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-6 py-3 rounded-full font-bold uppercase tracking-wider text-white bg-[#FF4F00] hover:bg-[#121212] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? t('adminArticles.saving', "Salvataggio...") : editingId ? t('adminArticles.saveChanges', "Salva Modifiche") : t('adminArticles.publishArticle', "Pubblica Articolo")}
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
