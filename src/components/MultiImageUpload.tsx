import React, { useState, useRef } from 'react';
import { storage, auth } from '../firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { UploadCloud, X, Loader2, Plus } from 'lucide-react';

interface MultiImageUploadProps {
  label: string;
  values: string[];
  onChange: (urls: string[]) => void;
  folder?: string;
}

export default function MultiImageUpload({ label, values, onChange, folder = 'uploads' }: MultiImageUploadProps) {
  const [uploadingFiles, setUploadingFiles] = useState<{ [key: string]: number }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // We keep track of the results locally to handle parallel uploads correctly
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (!auth.currentUser) {
      alert('Autenticazione richiesta per il caricamento.');
      return;
    }

    // Use a temporary array to accumulate URLs from THIS batch
    let currentUrls = [...values];

    files.forEach((file: File) => {
      if (!file.type.startsWith('image/')) {
        return;
      }

      const fileId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      setUploadingFiles(prev => ({ ...prev, [fileId]: 0 }));

      const fileExtension = file.name.split('.').pop();
      const fileName = `${fileId}.${fileExtension}`;
      const storageRef = ref(storage, `${folder}/${fileName}`);

      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const p = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadingFiles(prev => ({ ...prev, [fileId]: p }));
        },
        (error) => {
          console.error('Upload failed details:', error);
          alert(`Errore nel caricamento di ${file.name}`);
          setUploadingFiles(prev => {
            const next = { ...prev };
            delete next[fileId];
            return next;
          });
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            currentUrls = [...currentUrls, downloadURL];
            onChange(currentUrls);
          } catch (err) {
            console.error('Error getting download URL:', err);
          } finally {
            setUploadingFiles(prev => {
              const next = { ...prev };
              delete next[fileId];
              return next;
            });
          }
        }
      );
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    const newValues = [...values];
    newValues.splice(index, 1);
    onChange(newValues);
  };

  return (
    <div className="mb-6">
      <label className="block text-sm font-bold text-[#59554E] mb-3 uppercase tracking-widest">{label}</label>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {values.filter(url => url && url.trim() !== '').map((url, index) => (
          <div key={index} className="relative aspect-square bg-[#F2EEE8] rounded-2xl overflow-hidden border border-[#EAE3D9] group shadow-sm">
            <img src={url} alt={`Gallery ${index}`} className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => removeImage(index)}
              className="absolute top-2 right-2 bg-black/60 backdrop-blur-md text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500"
            >
              <X size={14} />
            </button>
          </div>
        ))}
        
        {Object.entries(uploadingFiles).map(([id, progress]) => (
          <div key={id} className="relative aspect-square bg-[#F2EEE8] rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-[#FF4F00]/30 animate-pulse">
            <Loader2 className="w-6 h-6 text-[#FF4F00] animate-spin mb-2" />
            <div className="text-[10px] font-bold text-[#121212]">{Math.round(progress as number)}%</div>
          </div>
        ))}

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="aspect-square bg-[#F2EEE8] border-2 border-dashed border-[#EAE3D9] hover:border-[#FF4F00] hover:bg-[#FF4F00]/5 rounded-2xl flex flex-col items-center justify-center transition-all group"
        >
          <div className="bg-white p-2 rounded-full shadow-sm group-hover:scale-110 transition-transform mb-2">
            <Plus className="w-5 h-5 text-[#FF4F00]" />
          </div>
          <span className="text-[10px] font-bold text-[#59554E] uppercase tracking-tighter">Aggiungi</span>
        </button>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        multiple
        className="hidden"
      />
    </div>
  );
}
