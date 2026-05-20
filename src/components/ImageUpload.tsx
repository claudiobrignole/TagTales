import React, { useState, useRef } from 'react';
import { storage, auth } from '../firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { UploadCloud, X, Loader2, Image as ImageIcon } from 'lucide-react';
import MediaPickerModal from './MediaPickerModal';
import { compressImage } from '../utils/imageCompressor';

interface ImageUploadProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  hideMediaPicker?: boolean;
}

export default function ImageUpload({ label, value, onChange, folder = 'uploads', hideMediaPicker = false }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!auth.currentUser) {
      alert('Autenticazione richiesta per il caricamento.');
      return;
    }

    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      alert('Seleziona un file immagine o video valido');
      return;
    }

    setIsUploading(true);
    setProgress(0);

    let fileToUpload = file;
    try {
      if (file.type.startsWith('image/')) {
        fileToUpload = await compressImage(file);
      }
    } catch (compressErr) {
      console.error('Image compression failed, uploading original', compressErr);
    }

    const fileExtension = fileToUpload.name.split('.').pop() || 'webp';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExtension}`;
    const storageRef = ref(storage, `${folder}/${fileName}`);

    const uploadTask = uploadBytesResumable(storageRef, fileToUpload);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const p = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setProgress(p);
      },
      (error) => {
        console.error('Upload failed details:', error);
        let message = 'Errore durante il caricamento.';
        if (error.code === 'storage/unauthorized') {
          message = 'Errore di permessi: controlla le regole di Firebase Storage.';
        } else if (error.code === 'storage/canceled') {
          message = 'Caricamento annullato.';
        }
        alert(message);
        setIsUploading(false);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          console.log('Upload successful:', downloadURL);
          onChange(downloadURL);
        } catch (err) {
          console.error('Error getting download URL:', err);
          alert('Errore nel recupero della URL dell\'immagine.');
        } finally {
          setIsUploading(false);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }
      }
    );
  };

  return (
    <div className="mb-4">
      <div className="flex justify-between items-end mb-2">
         <label className="block text-sm font-bold text-[#59554E]">{label}</label>
         {!hideMediaPicker && (
           <button
             type="button"
             onClick={() => setShowMediaPicker(true)}
             className="text-xs font-bold uppercase tracking-widest text-[#FF4F00] hover:underline flex items-center gap-1"
           >
             <ImageIcon size={14} /> Scegli da Archivio
           </button>
         )}
      </div>
      
      {value && value.trim() !== '' ? (
        <div className="relative w-full aspect-video md:aspect-[21/9] bg-[#F2EEE8] rounded-xl overflow-hidden border border-[#EAE3D9]">
          {value.match(/\.(mp4|webm|mov|m4v)(\?.*)?$/i) ? (
            <video src={value} autoPlay loop muted playsInline className="w-full h-full object-cover" />
          ) : (
            <img src={value} alt="Uploaded" className="w-full h-full object-cover" />
          )}
          <div className="absolute top-2 right-2 flex gap-2">
            <button
              type="button"
              onClick={() => onChange('')}
              className="bg-white/80 backdrop-blur-sm hover:bg-red-500 hover:text-white text-[#121212] p-2 rounded-full transition-colors shadow-sm"
              title="Remove image"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      ) : (
        <div 
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`w-full bg-[#F2EEE8] border-2 border-dashed border-[#EAE3D9] hover:border-[#FF4F00]/50 hover:bg-[#FF4F00]/5 rounded-xl px-4 py-8 flex flex-col items-center justify-center transition-all cursor-pointer ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center">
              <Loader2 className="w-8 h-8 text-[#FF4F00] animate-spin mb-2" />
              <div className="text-sm font-bold text-[#121212]">Uploading... {Math.round(progress)}%</div>
            </div>
          ) : (
            <div className="flex flex-col items-center text-[#59554E]">
              <UploadCloud className="w-8 h-8 mb-2 opacity-50" />
              <div className="text-sm font-bold">Clicca per caricare un file</div>
              <div className="text-xs opacity-70 mt-1">Immagini o Video (PNG, JPG, MP4)</div>
            </div>
          )}
        </div>
      )}
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*,video/mp4,video/webm,video/quicktime"
        className="hidden"
      />
      
      {showMediaPicker && (
         <MediaPickerModal 
           onClose={() => setShowMediaPicker(false)}
           onSelect={(url) => {
              onChange(url);
              setShowMediaPicker(false);
           }}
         />
      )}
    </div>
  );
}
