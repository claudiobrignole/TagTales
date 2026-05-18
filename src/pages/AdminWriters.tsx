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
  where,
  getDoc
} from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { User, Plus, Edit2, Trash2, X, Image as ImageIcon, GripVertical, ChevronUp, ChevronDown } from "lucide-react";
import { Reorder } from "motion/react";
import clsx from "clsx";
import { useAuth } from "../contexts/AuthContext";
import ImageUpload from "../components/ImageUpload";
import AdminExhibitionBlocksEditor from "../components/AdminExhibitionBlocksEditor";
import { translateDirtyFields, translateText } from "../utils/translate";
import { generateSlug } from "../utils/slugify";

export default function AdminWriters() {
  const { user } = useAuth();
  const [writers, setWriters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [usersList, setUsersList] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    nickname: "",
    slug: "",
    bioBreve: "",
    paese: "",
    citta: "",
    fotoProfilo: "",
    bannerSocial: "",
    linkInstagram: "",
    linkInstagram_en: "",
    emailContatto: "",
    videoEmbeds: [] as string[],
    blocks: [] as any[],
    uid: "",
    published: false,
    stato: "inattivo" as "attivo" | "inattivo",
  });

  const fetchWriters = async () => {
    if (!user) return;
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const userIsAdmin = userDoc.data()?.role === "admin" || user.email?.toLowerCase() === "claudio@brignole.ch";
      setIsAdmin(userIsAdmin);

      let q;
      if (userIsAdmin) {
        q = query(collection(db, "scrittori"), orderBy("createdAt", "desc"));
        try {
          const usersSnap = await getDocs(collection(db, "users"));
          setUsersList(usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch(e) { console.error(e) }
      } else {
        q = query(collection(db, "scrittori"), where("uid", "==", user.uid));
      }
      
      const snapshot = await getDocs(q);
      const data = snapshot.docs
        .map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as any) }))
        .sort((a: any, b: any) => (a.order ?? 999) - (b.order ?? 999));
      setWriters(data);
    } catch (error) {
      console.error("Error fetching writers:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateWritersOrder = async (newWriters: any[]) => {
    setWriters(newWriters);
    try {
      const batch = writeBatch(db);
      newWriters.forEach((writer, index) => {
        const docRef = doc(db, "scrittori", writer.id);
        batch.update(docRef, { order: index });
      });
      await batch.commit();
    } catch (error) {
      console.error("Error updating writers order:", error);
    }
  };

  const moveWriter = async (index: number, direction: 'up' | 'down') => {
    const newWriters = [...writers];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= writers.length) return;
    
    const [movedItem] = newWriters.splice(index, 1);
    newWriters.splice(targetIndex, 0, movedItem);
    
    await updateWritersOrder(newWriters);
  };

  useEffect(() => {
    fetchWriters();
  }, []);

  const handleOpenModal = (writer: any = null) => {
    if (writer) {
      setEditingId(writer.id);
      setFormData({
        nickname: writer.nickname || "",
        slug: writer.slug || "",
        bioBreve: writer.bioBreve || "",
        paese: writer.paese || "",
        citta: writer.citta || "",
        fotoProfilo: writer.fotoProfilo || "",
        bannerSocial: writer.bannerSocial || "",
        linkInstagram: writer.linkInstagram || "",
        linkInstagram_en: writer.linkInstagram_en || "",
        emailContatto: writer.emailContatto || "",
        videoEmbeds: writer.videoEmbeds || [],
        blocks: writer.blocks || [],
        uid: writer.uid || "",
        published: writer.published || false,
        stato: writer.stato || "inattivo",
      });
    } else {
      setEditingId(null);
      setFormData({
        nickname: "",
        slug: "",
        bioBreve: "",
        paese: "",
        citta: "",
        fotoProfilo: "",
        bannerSocial: "",
        linkInstagram: "",
        linkInstagram_en: "",
        emailContatto: "",
        videoEmbeds: [],
        blocks: [],
        uid: "",
        published: false,
        stato: "inattivo",
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const [isSaving, setIsSaving] = useState(false);

  const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nickname = e.target.value;
    setFormData((prev) => ({
      ...prev,
      nickname,
      slug:
        prev.slug === generateSlug(prev.nickname) || prev.slug === ""
          ? generateSlug(nickname)
          : prev.slug,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    setIsSaving(true);
    try {
      const originalWriter = editingId ? writers.find(w => w.id === editingId) : null;
      
      const translatedData = await translateDirtyFields(
        formData,
        originalWriter,
        ['bioBreve', 'paese', 'citta'],
        'en'
      );
      
      const translatedBlocks = await Promise.all(formData.blocks.map(async (block, index) => {
        let newBlock = { ...block };
        if (newBlock.text) {
          const originalBlock = originalWriter?.blocks?.[index];
          if (!originalBlock || originalBlock.text !== newBlock.text || !originalBlock.text_en) {
             console.log(`[Translate] Block text changed. Translating...`);
             newBlock.text_en = await translateText(newBlock.text);
          } else {
             newBlock.text_en = originalBlock.text_en;
          }
        }
        return newBlock;
      }));

      let ecwidProductIds: any[] = [];
      const uidToSave = isAdmin ? formData.uid : (formData.uid || user.uid);
      if (uidToSave) {
        try {
          const userDoc = await getDoc(doc(db, "users", uidToSave));
          if (userDoc.exists() && userDoc.data().ecwidProductIds) {
             ecwidProductIds = userDoc.data().ecwidProductIds;
          }
        } catch (e) { console.error("Could not sync ecwid logic from users:", e) }
      }

      const payload = {
        ...translatedData,
        blocks: translatedBlocks,
        uid: uidToSave,
        ecwidProductIds,
        updatedAt: new Date().toISOString(),
      };

      if (editingId) {
        await updateDoc(doc(db, "scrittori", editingId), payload);
        alert("Writer aggiornato con successo!");
      } else {
        await addDoc(collection(db, "scrittori"), {
          ...payload,
          createdAt: new Date().toISOString(),
        });
        alert("Writer creato con successo!");
      }
      handleCloseModal();
      fetchWriters();
    } catch (error) {
      console.error("Error saving writer:", error);
      alert("Errore durante il salvataggio del writer.");
    } finally {
      setIsSaving(false);
    }
  };

  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    const id = itemToDelete;
    setItemToDelete(null);
    try {
      setWriters(writers.filter(w => w.id !== id));
      
      // 1. Fetch document to identify images
      const docRef = doc(db, "scrittori", id);
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

        if (data.fotoProfilo) await deleteImageFromStorage(data.fotoProfilo);
        if (data.bannerSocial) await deleteImageFromStorage(data.bannerSocial);
        
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
      fetchWriters();
    } catch (error) {
      console.error("Error deleting writer:", error);
      handleFirestoreError(error, OperationType.DELETE, `scrittori/${id}`);
      alert("Errore nell'eliminazione del writer: " + (error instanceof Error ? error.message : String(error)));
      fetchWriters(); // revert optimistic update
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
          <h1 className="text-3xl font-bold font-['Shamgod'] uppercase text-[#121212] mb-2 tracking-widest text-[8vw] md:text-[50px] leading-none">
            Gestione Writers
          </h1>
          <p className="text-[#59554E]">
            Gestisci i profili pubblici dei writer graffiti.
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-[#FF4F00] flex items-center gap-2 text-white px-6 py-3 rounded-full font-bold uppercase tracking-wider hover:bg-[#121212] transition-colors"
        >
          <Plus size={20} /> Aggiungi Writer
        </button>
      </motion.div>

      {loading ? (
        <div className="flex justify-center items-center py-20">Caricamento...</div>
      ) : writers.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-sm border border-[#EAE3D9] p-8 md:p-12 text-center text-[#59554E]">
          <p>
            Nessun writer aggiunto. Clicca "Aggiungi Writer" per creare il primo profilo.
          </p>
        </div>
      ) : (
        <Reorder.Group
          axis="y"
          values={writers}
          onReorder={updateWritersOrder}
          className="space-y-4"
        >
          {writers.map((writer, index) => (
            <Reorder.Item
              key={writer.id}
              value={writer}
              className="bg-white rounded-2xl shadow-sm border border-[#EAE3D9] overflow-hidden flex flex-col md:flex-row group p-4 gap-6 items-center"
            >
              <div className="flex items-center gap-4">
                <div className="cursor-grab active:cursor-grabbing text-[#59554E] hover:text-[#FF4F00] transition-colors">
                  <GripVertical size={24} />
                </div>
                <div className="flex flex-col gap-1">
                  <button
                    disabled={index === 0}
                    onClick={() => moveWriter(index, 'up')}
                    className="p-1 text-[#59554E] hover:bg-[#F2EEE8] rounded-md transition-colors disabled:opacity-30"
                  >
                    <ChevronUp size={16} />
                  </button>
                  <button
                    disabled={index === writers.length - 1}
                    onClick={() => moveWriter(index, 'down')}
                    className="p-1 text-[#59554E] hover:bg-[#F2EEE8] rounded-md transition-colors disabled:opacity-30"
                  >
                    <ChevronDown size={16} />
                  </button>
                </div>
              </div>

              <div className="w-16 h-16 rounded-full overflow-hidden bg-[#F2EEE8] flex items-center justify-center border-2 border-[#EAE3D9] shrink-0">
                {writer.fotoProfilo ? (
                  <img
                    src={writer.fotoProfilo}
                    alt={writer.nickname}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-8 h-8 text-[#59554E]" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-xl text-[#121212] font-['Shamgod'] uppercase tracking-wider leading-none mb-1">
                  {writer.nickname}
                </h3>
                <p className="text-sm text-[#59554E]">
                  {writer.citta}{writer.citta && writer.paese ? ", " : ""}{writer.paese}
                </p>
                <div className="mt-2">
                  <span
                    className={clsx(
                      "text-[10px] font-bold uppercase px-2 py-0.5 rounded-full",
                      writer.published
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500",
                    )}
                  >
                    {writer.published ? "Pubblicato" : "Bozza"}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleOpenModal(writer)}
                  className="p-3 text-[#59554E] hover:bg-[#F2EEE8] rounded-xl transition-colors border border-[#EAE3D9]"
                >
                  <Edit2 size={18} />
                </button>
                <button
                  onClick={() => handleDelete(writer.id)}
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
                Sei sicuro di voler eliminare questo writer? L'azione non può essere annullata.
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
              className="bg-[#F2EEE8] rounded-3xl shadow-2xl border border-[#EAE3D9] w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between p-6 border-b border-[#EAE3D9] sticky top-0 bg-[#F2EEE8] z-10">
                <h2 className="text-2xl font-bold font-['Shamgod'] uppercase text-[#121212] tracking-widest">
                  {editingId ? "Modifica Writer" : "Aggiungi Nuovo Writer"}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="text-[#59554E] hover:text-[#121212] transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-[#59554E] mb-2">
                       Nickname *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.nickname}
                      onChange={handleNicknameChange}
                      className="w-full bg-white border border-[#EAE3D9] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#FF4F00]/20 focus:border-[#FF4F00] transition-all"
                      placeholder="es. ShaOne"
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
                      placeholder="shaone"
                    />
                  </div>
                  {isAdmin && (
                    <div>
                      <label className="block text-sm font-bold text-[#59554E] mb-2">
                         Collega a Utente Firebase
                      </label>
                      <select
                        value={formData.uid}
                        onChange={(e) =>
                          setFormData({ ...formData, uid: e.target.value })
                        }
                        className="w-full bg-white border border-[#EAE3D9] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#FF4F00]/20 focus:border-[#FF4F00] transition-all"
                      >
                        <option value="">Nessun utente collegato</option>
                        {usersList.map(u => (
                          <option key={u.id} value={u.id}>
                            {u.fullName || u.artistName || u.email} ({u.email})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-[#59554E] mb-2">
                      Città
                    </label>
                    <input
                      type="text"
                      value={formData.citta}
                      onChange={(e) =>
                        setFormData({ ...formData, citta: e.target.value })
                      }
                      className="w-full bg-white border border-[#EAE3D9] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#FF4F00]/20 focus:border-[#FF4F00] transition-all"
                      placeholder="es. Napoli"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-[#59554E] mb-2">
                      Paese
                    </label>
                    <input
                      type="text"
                      value={formData.paese}
                      onChange={(e) =>
                        setFormData({ ...formData, paese: e.target.value })
                      }
                      className="w-full bg-white border border-[#EAE3D9] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#FF4F00]/20 focus:border-[#FF4F00] transition-all"
                      placeholder="es. Italy"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-[#59554E] mb-2">
                      Biografia Breve *
                    </label>
                    <textarea
                      rows={4}
                      value={formData.bioBreve}
                      onChange={(e) =>
                        setFormData({ ...formData, bioBreve: e.target.value })
                      }
                      className="w-full bg-white border border-[#EAE3D9] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#FF4F00]/20 focus:border-[#FF4F00] transition-all"
                      placeholder="Breve biografia..."
                    />
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-[#EAE3D9]">
                  <h3 className="font-bold text-[#121212]">Media & Links</h3>
                  <ImageUpload
                    label="Foto Profilo"
                    value={formData.fotoProfilo}
                    onChange={(url) => setFormData({ ...formData, fotoProfilo: url })}
                    folder="writers"
                  />
                  <ImageUpload
                    label="Banner Social"
                    value={formData.bannerSocial}
                    onChange={(url) => setFormData({ ...formData, bannerSocial: url })}
                    folder="writers"
                  />
                  <div>
                    <label className="block text-sm font-bold text-[#59554E] mb-2">
                      Link Instagram
                    </label>
                    <input
                      type="url"
                      value={formData.linkInstagram}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          linkInstagram: e.target.value,
                        })
                      }
                      className="w-full bg-white border border-[#EAE3D9] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#FF4F00]/20 focus:border-[#FF4F00] transition-all"
                      placeholder="https://instagram.com/..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-[#59554E] mb-2">
                      Link Instagram (EN)
                    </label>
                    <input
                      type="url"
                      value={formData.linkInstagram_en}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          linkInstagram_en: e.target.value,
                        })
                      }
                      className="w-full bg-white border border-[#EAE3D9] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#FF4F00]/20 focus:border-[#FF4F00] transition-all"
                      placeholder="https://instagram.com/..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-[#59554E] mb-2">
                      Email di Contatto (Protetta, Opzionale)
                    </label>
                    <input
                      type="email"
                      value={formData.emailContatto}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          emailContatto: e.target.value,
                        })
                      }
                      className="w-full bg-white border border-[#EAE3D9] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#FF4F00]/20 focus:border-[#FF4F00] transition-all"
                      placeholder="email@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-[#59554E] mb-2">Video Embeds (YouTube/Vimeo)</label>
                    <div className="space-y-3">
                      {formData.videoEmbeds.map((url, index) => (
                        <div key={index} className="flex gap-2">
                          <input
                            type="text"
                            value={url}
                            readOnly
                            className="flex-1 bg-gray-50 border border-[#EAE3D9] rounded-xl px-4 py-3 text-[#59554E]"
                          />
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, videoEmbeds: formData.videoEmbeds.filter((_, i) => i !== index) })}
                            className="bg-red-50 text-red-500 p-2 rounded-xl border border-red-100"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      ))}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          id="newVideoEmbedWriters"
                          placeholder="Nuovo URL video..."
                          className="flex-1 bg-white border border-[#EAE3D9] rounded-xl px-4 py-3"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const val = (e.target as HTMLInputElement).value;
                              if (val) {
                                setFormData({ ...formData, videoEmbeds: [...formData.videoEmbeds, val] });
                                (e.target as HTMLInputElement).value = '';
                              }
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const input = document.getElementById('newVideoEmbedWriters') as HTMLInputElement;
                            if (input.value) {
                              setFormData({ ...formData, videoEmbeds: [...formData.videoEmbeds, input.value] });
                              input.value = '';
                            }
                          }}
                          className="bg-[#121212] text-white px-6 rounded-xl font-bold uppercase"
                        >
                          Aggiungi
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#EAE3D9]">
                  <AdminExhibitionBlocksEditor 
                    blocks={formData.blocks}
                    onChange={(blocks) => setFormData({ ...formData, blocks })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-6 pt-4 border-t border-[#EAE3D9]">
                  <div className="flex items-center gap-3">
                    <input
                      id="published"
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
                      htmlFor="published"
                      className="font-bold text-[#121212] select-none cursor-pointer"
                    >
                      Pubblica Online
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-[#59554E] mb-2"> Stato Writer </label>
                    <select
                      value={formData.stato}
                      onChange={(e) => setFormData({ ...formData, stato: e.target.value as any })}
                      className="w-full bg-white border border-[#EAE3D9] rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#FF4F00]/20 focus:border-[#FF4F00] transition-all"
                    >
                      <option value="inattivo">Inattivo</option>
                      <option value="attivo">Attivo</option>
                    </select>
                  </div>
                </div>

                <div className="pt-6 flex justify-end gap-3 sticky bottom-0 bg-[#F2EEE8] pb-6">
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
                    {isSaving ? "Salvataggio..." : editingId ? "Salva Modifiche" : "Crea Writer"}
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
