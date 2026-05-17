import React from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown, Image as ImageIcon } from 'lucide-react';
import ImageUpload from './ImageUpload';

export interface ExhibitionBlock {
  id: string;
  type: 'text' | 'paragraph' | 'image_fullscreen' | 'images_side_by_side_aligned' | 'images_side_by_side_creative' | 'video_embed';
  text?: string;
  text_en?: string;
  backgroundColor?: 'black' | 'light';
  images?: { url: string; ecwidLink?: string; fallbackUrl?: string }[];
  videoUrl?: string;
}

interface Props {
  blocks: ExhibitionBlock[];
  onChange: (blocks: ExhibitionBlock[]) => void;
}

export default function AdminExhibitionBlocksEditor({ blocks, onChange }: Props) {
  const addBlock = (type: ExhibitionBlock['type']) => {
    const newBlock: ExhibitionBlock = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      type,
    };
    
    if (type === 'text' || type === 'paragraph') {
      newBlock.text = '';
      newBlock.text_en = '';
      newBlock.backgroundColor = 'light';
    } else if (type === 'image_fullscreen') {
      newBlock.images = [{ url: '', ecwidLink: '' }];
    } else if (type === 'video_embed') {
      newBlock.videoUrl = '';
      newBlock.backgroundColor = 'light';
    } else if (type.startsWith('images_side_by_side')) {
      newBlock.images = [{ url: '', ecwidLink: '' }, { url: '', ecwidLink: '' }];
      newBlock.backgroundColor = 'light';
    }

    onChange([...blocks, newBlock]);
  };

  const updateBlock = (id: string, updates: Partial<ExhibitionBlock>) => {
    onChange(blocks.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const removeBlock = (id: string) => {
    onChange(blocks.filter(b => b.id !== id));
  };

  const moveBlock = (index: number, direction: -1 | 1) => {
    if (index + direction < 0 || index + direction >= blocks.length) return;
    const newBlocks = [...blocks];
    const temp = newBlocks[index];
    newBlocks[index] = newBlocks[index + direction];
    newBlocks[index + direction] = temp;
    onChange(newBlocks);
  };

  const updateImage = (blockId: string, imageIndex: number, field: 'url' | 'ecwidLink' | 'fallbackUrl', value: string) => {
    onChange(blocks.map(b => {
      if (b.id !== blockId || !b.images) return b;
      const newImages = [...b.images];
      newImages[imageIndex] = { ...newImages[imageIndex], [field]: value };
      return { ...b, images: newImages };
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-[#121212]">Blocchi Layout Modulari</h3>
        <div className="flex gap-2 flex-wrap">
          <button type="button" onClick={() => addBlock('text')} className="text-xs bg-[#F2EEE8] text-[#121212] px-3 py-1.5 rounded-lg border border-[#EAE3D9] hover:bg-white font-medium">+ Quote</button>
          <button type="button" onClick={() => addBlock('paragraph')} className="text-xs bg-[#F2EEE8] text-[#121212] px-3 py-1.5 rounded-lg border border-[#EAE3D9] hover:bg-white font-medium">+ Paragrafo</button>
          <button type="button" onClick={() => addBlock('image_fullscreen')} className="text-xs bg-[#F2EEE8] text-[#121212] px-3 py-1.5 rounded-lg border border-[#EAE3D9] hover:bg-white font-medium">+ 1 Immagine</button>
          <button type="button" onClick={() => addBlock('images_side_by_side_aligned')} className="text-xs bg-[#F2EEE8] text-[#121212] px-3 py-1.5 rounded-lg border border-[#EAE3D9] hover:bg-white font-medium">+ 2 Affiancate</button>
          <button type="button" onClick={() => addBlock('images_side_by_side_creative')} className="text-xs bg-[#F2EEE8] text-[#121212] px-3 py-1.5 rounded-lg border border-[#EAE3D9] hover:bg-white font-medium">+ 2 Creative</button>
          <button type="button" onClick={() => addBlock('video_embed')} className="text-xs bg-[#F2EEE8] text-[#121212] px-3 py-1.5 rounded-lg border border-[#EAE3D9] hover:bg-white font-medium">+ Video</button>
        </div>
      </div>

      <div className="space-y-6">
        {blocks.map((block, index) => (
          <div key={block.id} className="border border-[#EAE3D9] bg-white rounded-xl p-4 flex flex-col gap-4 shadow-sm relative group">
            <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button type="button" onClick={() => moveBlock(index, -1)} disabled={index === 0} className="p-1.5 text-gray-400 hover:text-[#121212] disabled:opacity-30"><ArrowUp size={16} /></button>
              <button type="button" onClick={() => moveBlock(index, 1)} disabled={index === blocks.length - 1} className="p-1.5 text-gray-400 hover:text-[#121212] disabled:opacity-30"><ArrowDown size={16} /></button>
              <div className="w-px h-4 bg-gray-200 mx-1"></div>
              <button type="button" onClick={() => removeBlock(block.id)} className="p-1.5 text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
            </div>

            <div className="text-xs font-bold uppercase text-[#59554E] tracking-wider mb-2">
              {block.type === 'text' && 'Blocco Quote'}
              {block.type === 'paragraph' && 'Blocco Paragrafo'}
              {block.type === 'image_fullscreen' && 'Immagine Schermo Intero'}
              {block.type === 'images_side_by_side_aligned' && 'Due Immagini Allineate'}
              {block.type === 'images_side_by_side_creative' && 'Due Immagini Sfalsate (Creative)'}
              {block.type === 'video_embed' && 'Video Embed (YouTube/Vimeo)'}
            </div>

            {(block.type === 'text' || block.type === 'paragraph') && (
              <div className="space-y-4">
                <textarea
                  value={block.text || ''}
                  onChange={e => updateBlock(block.id, { text: e.target.value })}
                  rows={4}
                  className="w-full bg-white border border-[#EAE3D9] rounded-xl px-4 py-3 text-lg"
                  placeholder="Inserisci il testo qui..."
                />
                <div className="flex gap-4 items-center">
                  <span className="text-sm font-medium">Sfondo:</span>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="radio" checked={block.backgroundColor === 'light'} onChange={() => updateBlock(block.id, { backgroundColor: 'light' })} />
                    Chiaro (Testo Scuro)
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="radio" checked={block.backgroundColor === 'black'} onChange={() => updateBlock(block.id, { backgroundColor: 'black' })} />
                    Scuro (Testo Chiaro)
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
                  className="w-full bg-white border border-[#EAE3D9] rounded-xl px-4 py-3 text-lg"
                  placeholder="URL del video (es. https://www.youtube.com/... o https://vimeo.com/...)"
                />
                <div className="flex gap-4 items-center">
                  <span className="text-sm font-medium">Sfondo Container:</span>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="radio" checked={block.backgroundColor === 'light'} onChange={() => updateBlock(block.id, { backgroundColor: 'light' })} />
                    Chiaro
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="radio" checked={block.backgroundColor === 'black'} onChange={() => updateBlock(block.id, { backgroundColor: 'black' })} />
                    Scuro
                  </label>
                </div>
              </div>
            )}

            {block.type !== 'text' && block.type !== 'paragraph' && block.type !== 'video_embed' && block.images && (
              <div className="space-y-4">
                {(block.type === 'images_side_by_side_aligned' || block.type === 'images_side_by_side_creative') && (
                  <div className="flex gap-4 items-center mb-4">
                    <span className="text-sm font-medium">Sfondo Container:</span>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="radio" checked={block.backgroundColor === 'light'} onChange={() => updateBlock(block.id, { backgroundColor: 'light' })} />
                      Chiaro
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="radio" checked={block.backgroundColor === 'black'} onChange={() => updateBlock(block.id, { backgroundColor: 'black' })} />
                      Scuro
                    </label>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {block.images.map((img, imgIndex) => (
                    <div key={imgIndex} className="bg-gray-50 p-4 border border-gray-100 rounded-lg space-y-3">
                      <ImageUpload
                        label={`Immagine ${imgIndex + 1}`}
                        value={img.url}
                        onChange={url => updateImage(block.id, imgIndex, 'url', url)}
                        folder="exhibition-blocks"
                      />
                      {img.url && img.url.match(/\.(mp4|webm|mov|m4v)(\?.*)?$/i) && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <ImageUpload
                            label={`Immagine Fallback ${imgIndex + 1} (SEO/Poster Opzionale)`}
                            value={img.fallbackUrl || ''}
                            onChange={url => updateImage(block.id, imgIndex, 'fallbackUrl', url)}
                            folder="exhibition-blocks"
                          />
                        </div>
                      )}
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Link prodotto Ecwid (Opzionale)</label>
                        <input
                          type="url"
                          value={img.ecwidLink || ''}
                          onChange={e => updateImage(block.id, imgIndex, 'ecwidLink', e.target.value)}
                          placeholder="https://..."
                          className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        ))}

        {blocks.length === 0 && (
          <div className="text-center py-10 text-gray-400 border border-dashed border-[#EAE3D9] rounded-xl">
            Nessun blocco aggiunto. Clicca sui pulsanti in alto per costruire il layout.
          </div>
        )}
      </div>
    </div>
  );
}
