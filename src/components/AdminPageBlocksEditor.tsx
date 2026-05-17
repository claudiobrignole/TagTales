import React from 'react';
import { Plus, Trash2, Image as ImageIcon, HelpCircle, GripVertical } from 'lucide-react';
import { Reorder } from 'motion/react';
import clsx from 'clsx';
import ImageUpload from './ImageUpload';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

const quillModules = {
  toolbar: [
    ['bold', 'italic'],
    [{ 'list': 'bullet' }],
    [{ 'align': [] }],
    ['clean']
  ],
};

export interface PageBlock {
  id: string;
  type: 'text' | 'paragraph' | 'image_fullscreen' | 'images_side_by_side_aligned' | 'video_embed' | 'qa_module' | 'home_section' | 'accordion' | 'contact_form' | 'large_title' | 'text_with_image_half' | 'image_width_paragraph';
  text?: string;
  text_en?: string;
  title?: string;
  title_en?: string;
  imagePosition?: 'left' | 'right';
  backgroundColor?: 'black' | 'light';
  images?: { url: string; ecwidLink?: string; fallbackUrl?: string }[];
  videoUrl?: string;
  qa?: { question: string; answer: string; question_en?: string; answer_en?: string }[];
  accordionItems?: { title: string; content: string; title_en?: string; content_en?: string }[];
  sectionId?: 'hero' | 'magazine' | 'mostre' | 'writers' | 'newsletter';
}

interface Props {
  blocks: PageBlock[];
  onChange: (blocks: PageBlock[]) => void;
  pageId?: string;
}

export default function AdminPageBlocksEditor({ blocks, onChange, pageId }: Props) {
  const addBlock = (type: PageBlock['type']) => {
    const newBlock: PageBlock = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      type,
    };
    
    if (type === 'text' || type === 'paragraph' || type === 'large_title') {
      newBlock.text = '';
      newBlock.text_en = '';
      newBlock.backgroundColor = 'light';
    } else if (type === 'image_fullscreen') {
      newBlock.images = [{ url: '', ecwidLink: '' }];
      newBlock.backgroundColor = 'light';
    } else if (type === 'video_embed') {
      newBlock.videoUrl = '';
      newBlock.backgroundColor = 'light';
    } else if (type === 'images_side_by_side_aligned') {
      newBlock.images = [{ url: '', ecwidLink: '' }, { url: '', ecwidLink: '' }];
      newBlock.backgroundColor = 'light';
    } else if (type === 'qa_module') {
      newBlock.qa = [{ question: '', answer: '', question_en: '', answer_en: '' }];
      newBlock.backgroundColor = 'light';
    } else if (type === 'accordion') {
      newBlock.accordionItems = [{ title: '', content: '', title_en: '', content_en: '' }];
      newBlock.backgroundColor = 'light';
    } else if (type === 'contact_form') {
      newBlock.backgroundColor = 'light';
    } else if (type === 'text_with_image_half') {
      newBlock.title = '';
      newBlock.title_en = '';
      newBlock.text = '';
      newBlock.text_en = '';
      newBlock.images = [{ url: '', ecwidLink: '' }];
      newBlock.imagePosition = 'left';
      newBlock.backgroundColor = 'light';
    } else if (type === 'image_width_paragraph') {
      newBlock.images = [{ url: '', ecwidLink: '' }];
      newBlock.backgroundColor = 'light';
    }

    onChange([...blocks, newBlock]);
  };

  const updateBlock = (id: string, updates: Partial<PageBlock>) => {
    onChange(blocks.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const removeBlock = (id: string) => {
    onChange(blocks.filter(b => b.id !== id));
  };

  const updateImage = (blockId: string, imageIndex: number, field: 'url' | 'ecwidLink' | 'fallbackUrl', value: string) => {
    onChange(blocks.map(b => {
      if (b.id !== blockId || !b.images) return b;
      const newImages = [...b.images];
      newImages[imageIndex] = { ...newImages[imageIndex], [field]: value };
      return { ...b, images: newImages };
    }));
  };

  const addQA = (blockId: string) => {
    onChange(blocks.map(b => {
      if (b.id !== blockId || !b.qa) return b;
      return { ...b, qa: [...b.qa, { question: '', answer: '', question_en: '', answer_en: '' }] };
    }));
  };

  const updateQA = (blockId: string, qaIndex: number, field: 'question' | 'answer' | 'question_en' | 'answer_en', value: string) => {
    onChange(blocks.map(b => {
      if (b.id !== blockId || !b.qa) return b;
      const newQA = [...b.qa];
      newQA[qaIndex] = { ...newQA[qaIndex], [field]: value };
      return { ...b, qa: newQA };
    }));
  };

  const removeQA = (blockId: string, qaIndex: number) => {
    onChange(blocks.map(b => {
      if (b.id !== blockId || !b.qa) return b;
      return { ...b, qa: b.qa.filter((_, i) => i !== qaIndex) };
    }));
  };

  const addAccordionItem = (blockId: string) => {
    onChange(blocks.map(b => {
      if (b.id !== blockId || !b.accordionItems) return b;
      return { ...b, accordionItems: [...b.accordionItems, { title: '', content: '', title_en: '', content_en: '' }] };
    }));
  };

  const updateAccordionItem = (blockId: string, idx: number, field: 'title' | 'content' | 'title_en' | 'content_en', value: string) => {
    onChange(blocks.map(b => {
      if (b.id !== blockId || !b.accordionItems) return b;
      const newItems = [...b.accordionItems];
      newItems[idx] = { ...newItems[idx], [field]: value };
      return { ...b, accordionItems: newItems };
    }));
  };

  const removeAccordionItem = (blockId: string, idx: number) => {
    onChange(blocks.map(b => {
      if (b.id !== blockId || !b.accordionItems) return b;
      return { ...b, accordionItems: b.accordionItems.filter((_, i) => i !== idx) };
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-[#F2EEE8] p-4 rounded-xl border border-[#EAE3D9]">
        <h3 className="font-bold text-[#121212] uppercase tracking-wider text-sm font-['Shamgod']">Blocchi Layout</h3>
        <div className="flex gap-2 flex-wrap justify-end">
          <button type="button" onClick={() => addBlock('large_title')} className="text-[10px] bg-[#121212] text-white px-3 py-1.5 rounded-lg font-bold uppercase transition-all">+ Titolo Maxi</button>
          <button type="button" onClick={() => addBlock('text')} className="text-[10px] bg-white text-[#121212] px-3 py-1.5 rounded-lg border border-[#EAE3D9] hover:border-[#121212] font-bold uppercase transition-all">+ Quote</button>
          <button type="button" onClick={() => addBlock('paragraph')} className="text-[10px] bg-white text-[#121212] px-3 py-1.5 rounded-lg border border-[#EAE3D9] hover:border-[#121212] font-bold uppercase transition-all">+ Paragrafo</button>
          <button type="button" onClick={() => addBlock('image_fullscreen')} className="text-[10px] bg-white text-[#121212] px-3 py-1.5 rounded-lg border border-[#EAE3D9] hover:border-[#121212] font-bold uppercase transition-all">+ Immagine Full</button>
          <button type="button" onClick={() => addBlock('image_width_paragraph')} className="text-[10px] bg-white text-[#121212] px-3 py-1.5 rounded-lg border border-[#EAE3D9] hover:border-[#121212] font-bold uppercase transition-all">+ Immagine Paragrafo</button>
          <button type="button" onClick={() => addBlock('images_side_by_side_aligned')} className="text-[10px] bg-white text-[#121212] px-3 py-1.5 rounded-lg border border-[#EAE3D9] hover:border-[#121212] font-bold uppercase transition-all">+ 2 Immagini</button>
          <button type="button" onClick={() => addBlock('text_with_image_half')} className="text-[10px] bg-white text-[#121212] px-3 py-1.5 rounded-lg border border-[#EAE3D9] hover:border-[#121212] font-bold uppercase transition-all">+ Testo & Immagine</button>
          <button type="button" onClick={() => addBlock('video_embed')} className="text-[10px] bg-white text-[#121212] px-3 py-1.5 rounded-lg border border-[#EAE3D9] hover:border-[#121212] font-bold uppercase transition-all">+ Video</button>
          <button type="button" onClick={() => addBlock('accordion')} className="text-[10px] bg-white text-[#121212] px-3 py-1.5 rounded-lg border border-[#EAE3D9] hover:border-[#121212] font-bold uppercase transition-all">+ Accordion</button>
          <button type="button" onClick={() => addBlock('contact_form')} className="text-[10px] bg-white text-[#121212] px-3 py-1.5 rounded-lg border border-[#EAE3D9] hover:border-[#121212] font-bold uppercase transition-all">+ Form Contatti</button>
          {pageId === 'faq' && (
            <button type="button" onClick={() => addBlock('qa_module')} className="text-[10px] bg-[#FF4F00] text-white px-3 py-1.5 rounded-lg border border-[#FF4F00] hover:bg-[#121212] hover:border-[#121212] font-bold uppercase transition-all">+ Q&A</button>
          )}
        </div>
      </div>

      <Reorder.Group axis="y" values={blocks} onReorder={onChange} className="space-y-4">
        {blocks.map((block) => (
          <Reorder.Item 
            key={block.id} 
            value={block}
            className="border border-[#EAE3D9] bg-white rounded-2xl p-6 flex flex-col gap-4 shadow-sm relative group transition-all hover:border-[#FF4F00]/30"
          >
            <div className="absolute top-4 right-4 flex items-center gap-1">
              <div className="cursor-grab active:cursor-grabbing p-2 text-[#59554E] hover:text-[#FF4F00] transition-colors"><GripVertical size={18} /></div>
              <div className="w-px h-5 bg-[#EAE3D9] mx-2"></div>
              <button type="button" onClick={() => removeBlock(block.id)} className="p-2 text-red-400 hover:text-red-600 transition-colors"><Trash2 size={18} /></button>
            </div>

            <div className="text-[10px] font-bold uppercase text-[#FF4F00] tracking-[0.2em] mb-2 flex items-center gap-2">
              <span className="w-2 h-2 bg-[#FF4F00] rounded-full"></span>
              {block.type === 'text' && 'Citazione'}
              {block.type === 'paragraph' && 'Testo / Paragrafo'}
              {block.type === 'large_title' && 'Titolo Gigante (Shamgod)'}
              {block.type === 'text_with_image_half' && 'Testo e Immagine (Metà)'}
              {block.type === 'image_fullscreen' && 'Immagine Schermo Intero'}
              {block.type === 'image_width_paragraph' && 'Immagine (Larghezza Paragrafo)'}
              {block.type === 'images_side_by_side_aligned' && 'Due Immagini Allineate'}
              {block.type === 'video_embed' && 'Video Embed'}
              {block.type === 'qa_module' && 'Modulo FAQ (Q&A)'}
              {block.type === 'accordion' && 'Accordion (Menu a tendina)'}
              {block.type === 'contact_form' && 'Modulo Contatti (Email)'}
              {block.type === 'home_section' && `Sezione Predefinita: ${block.sectionId?.toUpperCase()}`}
            </div>

            {(block.type === 'text' || block.type === 'paragraph' || block.type === 'large_title') && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider font-['Karla'] text-[#121212] mb-1">Testo (IT)</label>
                  {block.type === 'large_title' ? (
                    <textarea
                      value={block.text || ''}
                      onChange={e => updateBlock(block.id, { text: e.target.value })}
                      rows={2}
                      className="w-full bg-[#F8F6F3] border border-transparent focus:border-[#FF4F00] focus:bg-white rounded-xl px-4 py-3 font-['Shamgod'] text-2xl uppercase transition-all"
                      placeholder="TITOLO GIGANTE..."
                    />
                  ) : (
                    <div className="bg-[#F8F6F3] rounded-xl overflow-hidden border border-transparent focus-within:border-[#FF4F00] focus-within:bg-white transition-all">
                      <ReactQuill 
                        theme="snow" 
                        value={block.text || ''} 
                        onChange={val => updateBlock(block.id, { text: val })}
                        modules={quillModules}
                        className="text-lg"
                      />
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider font-['Karla'] text-[#121212] mb-1">Text (EN)</label>
                  {block.type === 'large_title' ? (
                    <textarea
                      value={block.text_en || ''}
                      onChange={e => updateBlock(block.id, { text_en: e.target.value })}
                      rows={2}
                      className="w-full bg-[#F8F6F3] border border-transparent focus:border-[#FF4F00] focus:bg-white rounded-xl px-4 py-3 font-['Shamgod'] text-2xl uppercase transition-all"
                      placeholder="LARGE TITLE..."
                    />
                  ) : (
                    <div className="bg-[#F8F6F3] rounded-xl overflow-hidden border border-transparent focus-within:border-[#FF4F00] focus-within:bg-white transition-all">
                      <ReactQuill 
                        theme="snow" 
                        value={block.text_en || ''} 
                        onChange={val => updateBlock(block.id, { text_en: val })}
                        modules={quillModules}
                        className="text-lg"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {block.type === 'text_with_image_half' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider font-['Karla'] text-[#121212] mb-1">Titolo (IT)</label>
                    <input
                      type="text"
                      value={block.title || ''}
                      onChange={e => updateBlock(block.id, { title: e.target.value })}
                      className="w-full bg-[#F8F6F3] border border-transparent focus:border-[#FF4F00] focus:bg-white rounded-xl px-4 py-3 font-['Shamgod'] text-2xl uppercase transition-all"
                      placeholder="TITOLO (SHAMGOD)..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider font-['Karla'] text-[#121212] mb-1">Title (EN)</label>
                    <input
                      type="text"
                      value={block.title_en || ''}
                      onChange={e => updateBlock(block.id, { title_en: e.target.value })}
                      className="w-full bg-[#F8F6F3] border border-transparent focus:border-[#FF4F00] focus:bg-white rounded-xl px-4 py-3 font-['Shamgod'] text-2xl uppercase transition-all"
                      placeholder="TITLE (SHAMGOD)..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider font-['Karla'] text-[#121212] mb-1">Testo (IT)</label>
                    <div className="bg-[#F8F6F3] rounded-xl overflow-hidden border border-transparent focus-within:border-[#FF4F00] focus-within:bg-white transition-all">
                      <ReactQuill 
                        theme="snow" 
                        value={block.text || ''} 
                        onChange={val => updateBlock(block.id, { text: val })}
                        modules={quillModules}
                        className="text-lg"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider font-['Karla'] text-[#121212] mb-1">Text (EN)</label>
                    <div className="bg-[#F8F6F3] rounded-xl overflow-hidden border border-transparent focus-within:border-[#FF4F00] focus-within:bg-white transition-all">
                      <ReactQuill 
                        theme="snow" 
                        value={block.text_en || ''} 
                        onChange={val => updateBlock(block.id, { text_en: val })}
                        modules={quillModules}
                        className="text-lg"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex gap-4 items-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#59554E]">Posizione Immagine:</span>
                  <label className="flex items-center gap-2 text-xs font-bold uppercase cursor-pointer">
                    <input type="radio" className="accent-[#FF4F00]" checked={block.imagePosition === 'left' || !block.imagePosition} onChange={() => updateBlock(block.id, { imagePosition: 'left' })} />
                    Sinistra
                  </label>
                  <label className="flex items-center gap-2 text-xs font-bold uppercase cursor-pointer">
                    <input type="radio" className="accent-[#FF4F00]" checked={block.imagePosition === 'right'} onChange={() => updateBlock(block.id, { imagePosition: 'right' })} />
                    Destra
                  </label>
                </div>
              </div>
            )}

            {block.type === 'video_embed' && (
              <div className="space-y-4">
                <input
                  type="url"
                  value={block.videoUrl || ''}
                  onChange={e => updateBlock(block.id, { videoUrl: e.target.value })}
                  className="w-full bg-[#F8F6F3] border border-transparent focus:border-[#FF4F00] focus:bg-white rounded-xl px-4 py-3 text-lg transition-all"
                  placeholder="URL YouTube o Vimeo"
                />
              </div>
            )}

            {block.type === 'contact_form' && (
              <div className="space-y-6">
                <div className="p-4 bg-[#F2EEE8] rounded-xl border border-[#EAE3D9]">
                  <p className="text-sm font-medium text-[#121212]">
                    Questo modulo mostrerà un form di contatto con campi Nome, Email, Messaggio e approvazione GDPR.
                    Le email verranno inviate a: <span className="font-bold">tagtales@brignole.ch</span>
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider font-['Karla'] text-[#121212] mb-1">Titolo (IT)</label>
                    <input
                      type="text"
                      value={block.title || ''}
                      onChange={e => updateBlock(block.id, { title: e.target.value })}
                      className="w-full bg-[#F8F6F3] border border-transparent focus:border-[#FF4F00] focus:bg-white rounded-xl px-4 py-3 font-['Shamgod'] text-2xl uppercase transition-all"
                      placeholder="CONTATTACI..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider font-['Karla'] text-[#121212] mb-1">Title (EN)</label>
                    <input
                      type="text"
                      value={block.title_en || ''}
                      onChange={e => updateBlock(block.id, { title_en: e.target.value })}
                      className="w-full bg-[#F8F6F3] border border-transparent focus:border-[#FF4F00] focus:bg-white rounded-xl px-4 py-3 font-['Shamgod'] text-2xl uppercase transition-all"
                      placeholder="CONTACT US..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider font-['Karla'] text-[#121212] mb-1">Testo Introduttivo (IT)</label>
                    <div className="bg-[#F8F6F3] rounded-xl overflow-hidden border border-transparent focus-within:border-[#FF4F00] focus-within:bg-white transition-all">
                      <ReactQuill 
                        theme="snow" 
                        value={block.text || ''} 
                        onChange={val => updateBlock(block.id, { text: val })}
                        modules={quillModules}
                        className="text-lg"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider font-['Karla'] text-[#121212] mb-1">Intro Text (EN)</label>
                    <div className="bg-[#F8F6F3] rounded-xl overflow-hidden border border-transparent focus-within:border-[#FF4F00] focus-within:bg-white transition-all">
                      <ReactQuill 
                        theme="snow" 
                        value={block.text_en || ''} 
                        onChange={val => updateBlock(block.id, { text_en: val })}
                        modules={quillModules}
                        className="text-lg"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {block.type === 'accordion' && block.accordionItems && (
              <div className="space-y-4">
                {block.accordionItems.map((item, idx) => (
                  <div key={idx} className="bg-[#F8F6F3] p-4 rounded-xl space-y-4 border border-[#EAE3D9] relative">
                    <button 
                      onClick={() => removeAccordionItem(block.id, idx)}
                      className="absolute top-4 right-4 text-red-400 hover:text-red-500 transition-opacity"
                    >
                      <Trash2 size={16} />
                    </button>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider font-['Karla'] text-[#121212] mb-1">Titolo (IT)</label>
                        <input
                          type="text"
                          value={item.title}
                          onChange={e => updateAccordionItem(block.id, idx, 'title', e.target.value)}
                          className="w-full bg-white border border-[#EAE3D9] rounded-lg px-4 py-2 text-sm font-bold focus:border-[#FF4F00] outline-none"
                          placeholder="Titolo dell'elemento..."
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider font-['Karla'] text-[#121212] mb-1">Title (EN)</label>
                        <input
                          type="text"
                          value={item.title_en || ''}
                          onChange={e => updateAccordionItem(block.id, idx, 'title_en', e.target.value)}
                          className="w-full bg-white border border-[#EAE3D9] rounded-lg px-4 py-2 text-sm font-bold focus:border-[#FF4F00] outline-none"
                          placeholder="Item title..."
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider font-['Karla'] text-[#121212] mb-1">Contenuto (IT)</label>
                        <div className="bg-white rounded-lg overflow-hidden border border-[#EAE3D9] focus-within:border-[#FF4F00] transition-all">
                          <ReactQuill 
                            theme="snow" 
                            value={item.content || ''} 
                            onChange={val => updateAccordionItem(block.id, idx, 'content', val)}
                            modules={quillModules}
                            className="text-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider font-['Karla'] text-[#121212] mb-1">Content (EN)</label>
                        <div className="bg-white rounded-lg overflow-hidden border border-[#EAE3D9] focus-within:border-[#FF4F00] transition-all">
                          <ReactQuill 
                            theme="snow" 
                            value={item.content_en || ''} 
                            onChange={val => updateAccordionItem(block.id, idx, 'content_en', val)}
                            modules={quillModules}
                            className="text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <button 
                  type="button" 
                  onClick={() => addAccordionItem(block.id)}
                  className="w-full py-3 border-2 border-dashed border-[#EAE3D9] rounded-xl text-[#59554E] hover:border-[#FF4F00] hover:text-[#FF4F00] font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                >
                  <Plus size={16} /> Aggiungi Elemento Accordion
                </button>
              </div>
            )}

            {block.type !== 'home_section' && (
              <div className="flex gap-6 items-center mt-2 pt-4 border-t border-[#F2EEE8]">
                <span className="text-xs font-bold uppercase tracking-wider text-[#59554E]">Tema Modulo:</span>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-xs font-bold uppercase cursor-pointer">
                    <input type="radio" className="accent-[#FF4F00]" checked={block.backgroundColor === 'light'} onChange={() => updateBlock(block.id, { backgroundColor: 'light' })} />
                    Light (Chiaro)
                  </label>
                  <label className="flex items-center gap-2 text-xs font-bold uppercase cursor-pointer">
                    <input type="radio" className="accent-[#FF4F00]" checked={block.backgroundColor === 'black'} onChange={() => updateBlock(block.id, { backgroundColor: 'black' })} />
                    Black (Scuro)
                  </label>
                </div>
              </div>
            )}

            {block.type === 'qa_module' && block.qa && (
              <div className="space-y-4">
                {block.qa.map((item, qaIdx) => (
                  <div key={qaIdx} className="bg-[#F8F6F3] p-4 rounded-xl space-y-4 border border-[#EAE3D9] relative">
                    <button 
                      onClick={() => removeQA(block.id, qaIdx)}
                      className="absolute top-4 right-4 text-red-400 hover:text-red-500 transition-opacity"
                    >
                      <Trash2 size={16} />
                    </button>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-[#59554E] mb-2">Domanda (IT)</label>
                        <input
                          type="text"
                          value={item.question}
                          onChange={e => updateQA(block.id, qaIdx, 'question', e.target.value)}
                          className="w-full bg-white border border-[#EAE3D9] rounded-lg px-4 py-2 text-sm focus:border-[#FF4F00] outline-none"
                          placeholder="La tua domanda..."
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-[#59554E] mb-2">Question (EN)</label>
                        <input
                          type="text"
                          value={item.question_en || ''}
                          onChange={e => updateQA(block.id, qaIdx, 'question_en', e.target.value)}
                          className="w-full bg-white border border-[#EAE3D9] rounded-lg px-4 py-2 text-sm focus:border-[#FF4F00] outline-none"
                          placeholder="Your question..."
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-[#59554E] mb-2">Risposta (IT)</label>
                        <div className="bg-white rounded-lg overflow-hidden border border-[#EAE3D9] focus-within:border-[#FF4F00] transition-all">
                          <ReactQuill 
                            theme="snow" 
                            value={item.answer || ''} 
                            onChange={val => updateQA(block.id, qaIdx, 'answer', val)}
                            modules={quillModules}
                            className="text-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-[#59554E] mb-2">Answer (EN)</label>
                        <div className="bg-white rounded-lg overflow-hidden border border-[#EAE3D9] focus-within:border-[#FF4F00] transition-all">
                          <ReactQuill 
                            theme="snow" 
                            value={item.answer_en || ''} 
                            onChange={val => updateQA(block.id, qaIdx, 'answer_en', val)}
                            modules={quillModules}
                            className="text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <button 
                  type="button" 
                  onClick={() => addQA(block.id)}
                  className="w-full py-3 border-2 border-dashed border-[#EAE3D9] rounded-xl text-[#59554E] hover:border-[#FF4F00] hover:text-[#FF4F00] font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                >
                  <Plus size={16} /> Aggiungi Domanda/Risposta
                </button>
              </div>
            )}

            {block.type === 'home_section' && (
              <div className="p-4 bg-[#F2EEE8] rounded-xl border border-[#EAE3D9]">
                <p className="text-sm font-medium text-[#121212]">
                  Questa sezione è collegata al layout predefinito della Home Page. 
                </p>
                <div className="mt-4 flex gap-4">
                   <select 
                    value={block.sectionId} 
                    onChange={e => updateBlock(block.id, { sectionId: e.target.value as any })}
                    className="bg-white border border-[#EAE3D9] rounded-lg px-4 py-2 text-sm font-bold uppercase focus:ring-2 focus:ring-[#FF4F00]/20"
                   >
                     <option value="hero">Hero (Featured slider)</option>
                     <option value="magazine">Magazine (Latest Articles)</option>
                     <option value="mostre">Mostre (Latest Exhibitions)</option>
                     <option value="writers">Writers (Featured Writers)</option>
                     <option value="newsletter">Newsletter</option>
                   </select>
                </div>
              </div>
            )}

            {block.images && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {block.images.map((img, imgIndex) => (
                  <div key={imgIndex} className="bg-[#F8F6F3] p-4 rounded-xl border border-[#EAE3D9]">
                    <ImageUpload
                      label={`Immagine ${imgIndex + 1}`}
                      value={img.url}
                      onChange={url => updateImage(block.id, imgIndex, 'url', url)}
                      folder="page-blocks"
                    />
                    {img.url && img.url.match(/\.(mp4|webm|mov|m4v)(\?.*)?$/i) && (
                      <div className="mt-4 pt-4 border-t border-[#EAE3D9]">
                        <ImageUpload
                          label={`Immagine Fallback ${imgIndex + 1} (SEO/Poster Opzionale)`}
                          value={img.fallbackUrl || ''}
                          onChange={url => updateImage(block.id, imgIndex, 'fallbackUrl', url)}
                          folder="page-blocks"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Reorder.Item>
        ))}
      </Reorder.Group>

      {blocks.length === 0 && (
        <div className="text-center py-16 text-[#59554E] border-2 border-dashed border-[#EAE3D9] rounded-3xl space-y-2">
          <div className="flex justify-center"><Plus size={32} className="text-[#EAE3D9]" /></div>
          <p className="font-bold uppercase tracking-widest text-xs">Nessun blocco di contenuto</p>
          <p className="text-sm opacity-60">Inizia ad aggiungere blocchi dai pulsanti sopra</p>
        </div>
      )}
    </div>
  );
}
