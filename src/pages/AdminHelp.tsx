import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useI18n } from '../contexts/I18nContext';
import { Save, Loader2, Plus, Trash2, GripVertical } from 'lucide-react';
import clsx from 'clsx';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableIcebreaker({ ib, removeIcebreaker, updateIcebreaker }: { ib: any, removeIcebreaker: (id: string) => void, updateIcebreaker: (id: string, field: 'it' | 'en', value: string) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: ib.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="bg-[#F8F6F3] p-4 rounded-[20px] border border-[#EAE3D9] relative pr-12 pl-12 group">
      <div 
        {...attributes} 
        {...listeners} 
        className="absolute left-2 top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing p-2 text-[#59554E] hover:text-[#FF4F00] transition-colors"
      >
        <GripVertical className="w-5 h-5" />
      </div>
      <button
        onClick={() => removeIcebreaker(ib.id)}
        className="absolute top-4 right-4 text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors"
      >
        <Trash2 className="w-4 h-4" />
      </button>
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider font-['Karla'] text-[#121212] mb-1">Domanda (IT)</label>
          <input
            type="text"
            value={ib.it}
            onChange={(e) => updateIcebreaker(ib.id, 'it', e.target.value)}
            className="w-full bg-white border border-[#EAE3D9] rounded-lg px-3 py-2 font-['Karla'] text-sm focus:border-[#FF4F00] outline-none"
            placeholder="Es. Come funziona la spedizione?"
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider font-['Karla'] text-[#121212] mb-1">Question (EN)</label>
          <input
            type="text"
            value={ib.en}
            onChange={(e) => updateIcebreaker(ib.id, 'en', e.target.value)}
            className="w-full bg-white border border-[#EAE3D9] rounded-lg px-3 py-2 font-['Karla'] text-sm focus:border-[#FF4F00] outline-none"
            placeholder="E.g. How does shipping work?"
          />
        </div>
      </div>
    </div>
  );
}

export default function AdminHelp() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<'public' | 'writers'>('public');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [publicData, setPublicData] = useState({
    knowledgeBase: '',
    icebreakers: [] as { id: string, it: string, en: string }[]
  });

  const [writersData, setWritersData] = useState({
    knowledgeBase: '',
    actionButtons: [] as { id: string, it: string, en: string, url: string }[],
    icebreakers: [] as { id: string, it: string, en: string }[]
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const pDoc = await getDoc(doc(db, 'chat_config', 'public'));
      if (pDoc.exists()) {
        const d = pDoc.data();
        setPublicData({
          knowledgeBase: d.knowledgeBase || '',
          icebreakers: d.icebreakers || []
        });
      }

      const wDoc = await getDoc(doc(db, 'chat_config', 'writers'));
      if (wDoc.exists()) {
        const d = wDoc.data();
        setWritersData({
          knowledgeBase: d.knowledgeBase || '',
          actionButtons: d.actionButtons || [],
          icebreakers: d.icebreakers || []
        });
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (activeTab === 'public') {
        await setDoc(doc(db, 'chat_config', 'public'), publicData);
      } else {
        await setDoc(doc(db, 'chat_config', 'writers'), writersData);
      }
      alert('Configurazione salvata con successo!');
    } catch (e) {
      console.error(e);
      alert('Errore nel salvataggio');
    }
    setSaving(false);
  };

  const currentData = activeTab === 'public' ? publicData : writersData;
  const setCurrentData = activeTab === 'public' ? setPublicData : setWritersData;

  const addIcebreaker = () => {
    // @ts-ignore
    setCurrentData(prev => ({
      ...prev,
      icebreakers: [...prev.icebreakers, { id: Date.now().toString(), it: '', en: '' }]
    }));
  };

  const updateIcebreaker = (id: string, field: 'it' | 'en', value: string) => {
    // @ts-ignore
    setCurrentData(prev => ({
      ...prev,
      icebreakers: prev.icebreakers.map(ib => ib.id === id ? { ...ib, [field]: value } : ib)
    }));
  };

  const removeIcebreaker = (id: string) => {
    // @ts-ignore
    setCurrentData(prev => ({
      ...prev,
      icebreakers: prev.icebreakers.filter(ib => ib.id !== id)
    }));
  };

  const addActionButton = () => {
    setWritersData(prev => ({
      ...prev,
      actionButtons: [...prev.actionButtons, { id: Date.now().toString(), it: '', en: '', url: '' }]
    }));
  };

  const updateActionButton = (id: string, field: 'it' | 'en' | 'url', value: string) => {
    setWritersData(prev => ({
      ...prev,
      actionButtons: prev.actionButtons.map(ab => ab.id === id ? { ...ab, [field]: value } : ab)
    }));
  };

  const removeActionButton = (id: string) => {
    setWritersData(prev => ({
      ...prev,
      actionButtons: prev.actionButtons.filter(ab => ab.id !== id)
    }));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setCurrentData(prev => {
        const oldIndex = prev.icebreakers.findIndex(ib => ib.id === active.id);
        const newIndex = prev.icebreakers.findIndex(ib => ib.id === over.id);

        return {
          ...prev,
          icebreakers: arrayMove(prev.icebreakers, oldIndex, newIndex)
        };
      });
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#FF4F00]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl lg:text-[40px] font-['Shamgod'] uppercase leading-[0.8] tracking-normal text-[#121212]">
            Gestione Assistenza AI
          </h1>
          <p className="font-['Karla'] text-[#121212] mt-2 text-lg">
            Configura la Knowledge Base e gli Icebreakers per l'Assistente AI.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-[#FF4F00] text-white px-6 py-3 rounded-full font-['Karla'] font-bold uppercase tracking-wider text-sm flex items-center gap-2 hover:bg-black transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Salva Modifiche
        </button>
      </div>

      <div className="flex bg-white rounded-full p-1 border border-[#EAE3D9] max-w-fit">
        <button
          onClick={() => setActiveTab('public')}
          className={clsx(
            "px-6 py-2 rounded-full font-['Karla'] font-bold uppercase tracking-wider text-sm transition-colors",
            activeTab === 'public' ? "bg-[#121212] text-white" : "text-[#121212] hover:bg-[#F8F6F3]"
          )}
        >
          Esperienza Pubblica
        </button>
        <button
          onClick={() => setActiveTab('writers')}
          className={clsx(
            "px-6 py-2 rounded-full font-['Karla'] font-bold uppercase tracking-wider text-sm transition-colors",
            activeTab === 'writers' ? "bg-[#121212] text-white" : "text-[#121212] hover:bg-[#F8F6F3]"
          )}
        >
          Esperienza Writers
        </button>
      </div>

      <div className="bg-white p-6 rounded-[24px] border border-[#EAE3D9] space-y-6">
        <div>
          <h2 className="text-2xl font-['Shamgod'] uppercase leading-[0.8] text-[#121212] mb-2">Knowledge Base</h2>
          <p className="font-['Karla'] text-[#121212]/70 text-sm mb-4">
            Inserisci qui tutto il contesto generale e le informazioni di supporto in un unico testo (usa il Markdown). 
            Queste informazioni verranno fornite al chatbot per istruirlo.
          </p>
          <textarea
            rows={15}
            // @ts-ignore
            value={currentData.knowledgeBase}
            // @ts-ignore
            onChange={(e) => setCurrentData(prev => ({ ...prev, knowledgeBase: e.target.value }))}
            className="w-full bg-[#F8F6F3] border-none rounded-xl px-4 py-3 font-['Karla'] text-[#121212] focus:ring-2 focus:ring-[#FF4F00] transition-shadow placeholder:text-[#121212]/50 font-mono text-sm leading-relaxed"
            placeholder="# Knowledge Base..."
          />
        </div>

        {activeTab === 'writers' && (
          <div className="border-t border-[#EAE3D9] pt-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-2xl font-['Shamgod'] uppercase leading-[0.8] text-[#121212] mb-2">Bottoni Esterni (Header Chat)</h2>
                <p className="font-['Karla'] text-[#121212]/70 text-sm">
                  Bottoni con link personalizzati che appaiono sopra la chat.
                </p>
              </div>
              <button
                onClick={addActionButton}
                className="bg-[#121212] text-white px-4 py-2 rounded-full font-['Karla'] font-bold uppercase tracking-wider text-sm flex items-center gap-2 hover:bg-[#FF4F00] transition-colors"
              >
                <Plus className="w-4 h-4" /> Aggiungi
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {writersData.actionButtons.map((ab) => (
                <div key={ab.id} className="bg-[#F8F6F3] p-4 rounded-[20px] border border-[#EAE3D9] relative pr-12">
                  <button
                    onClick={() => removeActionButton(ab.id)}
                    className="absolute top-4 right-4 text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider font-['Karla'] text-[#121212] mb-1">Testo Bottone (IT)</label>
                      <input
                        type="text"
                        value={ab.it}
                        onChange={(e) => updateActionButton(ab.id, 'it', e.target.value)}
                        className="w-full bg-white border border-[#EAE3D9] rounded-lg px-3 py-2 font-['Karla'] text-sm focus:border-[#FF4F00] outline-none"
                        placeholder="Es. Vedi Contratto"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider font-['Karla'] text-[#121212] mb-1">Button Text (EN)</label>
                      <input
                        type="text"
                        value={ab.en}
                        onChange={(e) => updateActionButton(ab.id, 'en', e.target.value)}
                        className="w-full bg-white border border-[#EAE3D9] rounded-lg px-3 py-2 font-['Karla'] text-sm focus:border-[#FF4F00] outline-none"
                        placeholder="E.g. View Contract"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider font-['Karla'] text-[#121212] mb-1">URL / Link</label>
                      <input
                        type="url"
                        value={ab.url}
                        onChange={(e) => updateActionButton(ab.id, 'url', e.target.value)}
                        className="w-full bg-white border border-[#EAE3D9] rounded-lg px-3 py-2 font-['Karla'] text-sm focus:border-[#FF4F00] outline-none"
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-[#EAE3D9] pt-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-2xl font-['Shamgod'] uppercase leading-[0.8] text-[#121212] mb-2">Icebreakers Esterni</h2>
              <p className="font-['Karla'] text-[#121212]/70 text-sm">
                Domande suggerite all'utente. Appariranno come card esterne da copiare. Inserisci OBBLIGATORIAMENTE italiano e inglese.
              </p>
            </div>
            <button
              onClick={addIcebreaker}
              className="bg-[#121212] text-white px-4 py-2 rounded-full font-['Karla'] font-bold uppercase tracking-wider text-sm flex items-center gap-2 hover:bg-[#FF4F00] transition-colors"
            >
              <Plus className="w-4 h-4" /> Aggiungi
            </button>
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            {/* @ts-ignore */}
            <SortableContext items={currentData.icebreakers.map(ib => ib.id)} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* @ts-ignore */}
                {currentData.icebreakers.map(ib => (
                  <SortableIcebreaker 
                    key={ib.id} 
                    ib={ib} 
                    removeIcebreaker={removeIcebreaker} 
                    updateIcebreaker={updateIcebreaker} 
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      </div>
    </div>
  );
}
