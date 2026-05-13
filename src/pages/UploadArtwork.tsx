import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db, storage } from '../firebase';
import { collection, addDoc, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, getDownloadURL, uploadBytesResumable } from 'firebase/storage';
import { Upload, X, Check, Image as ImageIcon, Film, AlertCircle } from 'lucide-react';
import clsx from 'clsx';
import { useI18n } from '../contexts/I18nContext';
import MultiImageUpload from '../components/MultiImageUpload';

export default function UploadArtwork() {
  const { t } = useI18n();

  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [writers, setWriters] = useState<any[]>([]);
  const [selectedWriterId, setSelectedWriterId] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    technique: '',
    year: new Date().getFullYear().toString(),
    width: '',
    height: '',
    type: 'Original',
    price: '',
    productionCost: '',
    shippingCost: '',
    description: '',
    exhibitionId: '',
  });

  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoProgress, setVideoProgress] = useState<number>(0);

  useEffect(() => {
    const checkAdminAndFetchWriters = async () => {
      if (!user) return;
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const role = userDoc.data()?.role;
        if (role === 'admin' || user.email?.toLowerCase() === 'claudio@brignole.ch') {
          setIsAdmin(true);
          const usersSnapshot = await getDocs(collection(db, 'users'));
          const writersData = usersSnapshot.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .filter((u: any) => u.role !== 'admin');
          setWriters(writersData);
        } else {
          setSelectedWriterId(user.uid);
        }
      } catch (err) {
        console.error("Error fetching user role:", err);
      }
    };
    checkAdminAndFetchWriters();
  }, [user]);

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      if (file.type !== 'video/mp4') {
        setError(t('uploadArtwork.errorMp4'));
        return;
      }
      if (file.size > 500 * 1024 * 1024) {
        setError(t('uploadArtwork.errorVideoSize'));
        return;
      }
      
      setError('');
      setVideoFile(file);
      setVideoProgress(0);
    }
  };

  const removeVideo = () => {
    setVideoFile(null);
    setVideoProgress(0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (imageUrls.length === 0) {
      setError(t('uploadArtwork.errorOneImage'));
      return;
    }
    if (isAdmin && !selectedWriterId) {
      setError('Please select a writer.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Get writer name for video folder
      let writerName = 'Unknown Writer';
      if (isAdmin) {
        const writer = writers.find(a => a.id === selectedWriterId);
        if (writer) writerName = writer.artistName || writer.fullName || 'Unknown Writer';
      } else {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          writerName = userDoc.data().artistName || userDoc.data().fullName || 'Unknown Writer';
        }
      }

      // Sanitize writer name for folder path
      const safeWriterName = writerName.replace(/[^a-z0-9]/gi, '_').toLowerCase();

      // 1. Upload Video (if exists)
      let videoUrl = '';
      if (videoFile) {
        const storageRef = ref(storage, `videos/${safeWriterName}/${Date.now()}_vid_${videoFile.name}`);
        const uploadTask = uploadBytesResumable(storageRef, videoFile);

        videoUrl = await new Promise((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setVideoProgress(progress);
            },
            (err) => {
              reject(err);
            },
            async () => {
              const url = await getDownloadURL(uploadTask.snapshot.ref);
              resolve(url);
            }
          );
        });
      }

      // Map tipologia to schema
      const tipologiaMap: Record<string, string> = {
        'Original': 'originale',
        'Limited Edition': 'edizione_limitata',
        'Print on Demand': 'print_on_demand'
      };

      // 2. Save to Firestore
      await addDoc(collection(db, 'opere'), {
        artistaId: selectedWriterId,
        titolo: formData.title,
        tecnica: formData.technique,
        anno: Number(formData.year),
        dimensioni: `${formData.width} x ${formData.height} cm`,
        width: Number(formData.width),
        height: Number(formData.height),
        tipologia: tipologiaMap[formData.type] || formData.type,
        prezzo: Number(formData.price),
        costoProduzione: Number(formData.productionCost),
        costoSpedizione: Number(formData.shippingCost),
        valuta: 'EUR',
        descrizioneCritica: formData.description,
        mostraId: formData.exhibitionId || null,
        statoApprovazione: isAdmin ? 'approvata' : 'in_attesa',
        statoVendita: 'disponibile',
        galleria: imageUrls,
        immagineHiRes: imageUrls[0],
        videoYoutube: videoUrl || null,
        published: isAdmin,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      setSuccess(true);
      setTimeout(() => {
        navigate('/artworks');
      }, 2000);

    } catch (err: any) {
      console.error("Error uploading artwork:", err);
      setError(err.message || t('uploadArtwork.errorUploadFailed'));
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="w-full space-y-8">
      <header className="mb-10">
        <h1 className="text-4xl md:text-6xl font-['Shamgod'] leading-[0.8] tracking-tight text-[#121212] mb-4 uppercase">{t('uploadArtwork.title')}</h1>
        <p className="font-['Karla'] text-[#59554E] text-lg">{t('uploadArtwork.subtitle')}</p>
      </header>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-2xl text-sm font-medium flex items-center gap-3 font-['Karla']">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-2xl text-sm font-medium flex items-center gap-3 font-['Karla']">
          <div className="p-1 bg-green-500 rounded-full text-white"><Check size={16} /></div>
          {t('uploadArtwork.successMessage')}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8 font-['Karla']">
        {/* Media Upload Column */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Images Upload */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-[#EAE3D9]">
            <h2 className="text-lg font-bold text-[#121212] mb-4 flex items-center gap-2 uppercase tracking-wide">
              <ImageIcon size={20} className="text-[#FF4F00]" />
              {t('uploadArtwork.images')}
            </h2>
            
            <MultiImageUpload
              label={t('uploadArtwork.addImages')}
              values={imageUrls}
              onChange={setImageUrls}
              folder={`opere/${selectedWriterId || 'temp'}`}
            />
          </div>

          {/* Video Upload */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-[#EAE3D9]">
            <h2 className="text-lg font-bold text-[#121212] mb-4 flex items-center gap-2">
              <Film size={20} className="text-[#FF4F00]" />
              {t('uploadArtwork.videoOptional')}
            </h2>
            
            {videoFile ? (
              <div className="relative rounded-xl border border-[#EAE3D9] bg-[#F2EEE8] p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="p-2 bg-white rounded-lg text-[#FF4F00]">
                      <Film size={20} />
                    </div>
                    <div className="truncate">
                      <p className="text-sm font-bold text-[#121212] truncate">{videoFile.name}</p>
                      <p className="text-xs text-[#59554E]">{(videoFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                    </div>
                  </div>
                  {!loading && (
                    <button
                      type="button"
                      onClick={removeVideo}
                      className="p-2 text-[#59554E] hover:text-red-500 hover:bg-white rounded-full transition-colors"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
                
                {loading && videoProgress > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-[#59554E]">{t('uploadArtwork.uploading')}</span>
                      <span className="text-[#FF4F00]">{Math.round(videoProgress)}%</span>
                    </div>
                    <div className="h-2 w-full bg-[#EAE3D9] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#FF4F00] transition-all duration-300"
                        style={{ width: `${videoProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <label className="relative rounded-xl border-2 border-dashed border-[#EAE3D9] bg-[#F2EEE8] flex flex-col items-center justify-center p-6 group hover:border-[#FF4F00] transition-colors cursor-pointer">
                <input 
                  type="file" 
                  accept="video/mp4" 
                  onChange={handleVideoChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="text-center pointer-events-none">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-[#59554E] mx-auto mb-3 shadow-sm group-hover:text-[#FF4F00] group-hover:scale-110 transition-all">
                    <Upload size={20} />
                  </div>
                  <p className="text-sm font-bold text-[#121212]">{t('uploadArtwork.uploadVideo')}</p>
                  <p className="text-xs text-[#59554E] mt-1">{t('uploadArtwork.videoFormat')}</p>
                </div>
              </label>
            )}
          </div>
        </div>

        {/* Details Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-[#EAE3D9] space-y-6">
            <h2 className="text-xl font-bold text-[#121212] mb-6 border-b border-[#EAE3D9] pb-4">{t('uploadArtwork.artworkDetails')}</h2>
            
            {isAdmin && (
              <div className="space-y-2">
                <label className="block text-[0.75rem] font-bold uppercase tracking-[0.1em] text-[#121212]">{t('uploadArtwork.assignToArtist')}</label>
                <select 
                  value={selectedWriterId}
                  onChange={(e) => setSelectedWriterId(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-[#F2EEE8] border-none rounded-xl text-[#121212] focus:ring-2 focus:ring-[#FF4F00] outline-none transition-all appearance-none"
                >
                  <option value="">{t('uploadArtwork.selectAnArtist')}</option>
                  {writers.map(writer => (
                    <option key={writer.id} value={writer.id}>
                      {writer.artistName || writer.fullName || writer.email}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-[0.75rem] font-bold uppercase tracking-[0.1em] text-[#121212]">{t('uploadArtwork.artworkTitle')}</label>
              <input 
                type="text" 
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-[#F2EEE8] border-none rounded-xl text-[#121212] placeholder:text-[#59554E] focus:ring-2 focus:ring-[#FF4F00] outline-none transition-all" 
                placeholder={t('uploadArtwork.titlePlaceholder')} 
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-[0.75rem] font-bold uppercase tracking-[0.1em] text-[#121212]">{t('uploadArtwork.technique')}</label>
                <input 
                  type="text" 
                  name="technique"
                  value={formData.technique}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-[#F2EEE8] border-none rounded-xl text-[#121212] placeholder:text-[#59554E] focus:ring-2 focus:ring-[#FF4F00] outline-none transition-all" 
                  placeholder={t('uploadArtwork.techniquePlaceholder')} 
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[0.75rem] font-bold uppercase tracking-[0.1em] text-[#121212]">{t('uploadArtwork.type')}</label>
                <select 
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-[#F2EEE8] border-none rounded-xl text-[#121212] focus:ring-2 focus:ring-[#FF4F00] outline-none transition-all appearance-none"
                >
                  <option value="Original">{t('uploadArtwork.typeOriginal')}</option>
                  <option value="Limited Edition">{t('uploadArtwork.typeLimited')}</option>
                  <option value="Print on Demand">{t('uploadArtwork.typePrint')}</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="block text-[0.75rem] font-bold uppercase tracking-[0.1em] text-[#121212]">{t('uploadArtwork.year')}</label>
                <input 
                  type="number" 
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  required
                  min="1900"
                  max={new Date().getFullYear()}
                  className="w-full px-4 py-3 bg-[#F2EEE8] border-none rounded-xl text-[#121212] focus:ring-2 focus:ring-[#FF4F00] outline-none transition-all" 
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[0.75rem] font-bold uppercase tracking-[0.1em] text-[#121212]">{t('uploadArtwork.width')} (cm)</label>
                <input 
                  type="number" 
                  name="width"
                  value={formData.width}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.1"
                  className="w-full px-4 py-3 bg-[#F2EEE8] border-none rounded-xl text-[#121212] focus:ring-2 focus:ring-[#FF4F00] outline-none transition-all" 
                  placeholder="0" 
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[0.75rem] font-bold uppercase tracking-[0.1em] text-[#121212]">{t('uploadArtwork.height')} (cm)</label>
                <input 
                  type="number" 
                  name="height"
                  value={formData.height}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.1"
                  className="w-full px-4 py-3 bg-[#F2EEE8] border-none rounded-xl text-[#121212] focus:ring-2 focus:ring-[#FF4F00] outline-none transition-all" 
                  placeholder="0" 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-[0.75rem] font-bold uppercase tracking-[0.1em] text-[#121212]">{t('uploadArtwork.price')} (EUR)</label>
                <div className="relative">
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-[#59554E]">{t('uploadArtwork.euro')}</span>
                  <input 
                    type="number" 
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    required
                    min="0"
                    step="0.01"
                    className="w-full pl-4 pr-16 py-3 bg-[#F2EEE8] border-none rounded-xl text-[#121212] focus:ring-2 focus:ring-[#FF4F00] outline-none transition-all" 
                    placeholder="0.00" 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-[0.75rem] font-bold uppercase tracking-[0.1em] text-[#121212]">{t('uploadArtwork.productionCost')}</label>
                <div className="relative">
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-[#59554E]">{t('uploadArtwork.euro')}</span>
                  <input 
                    type="number" 
                    name="productionCost"
                    value={formData.productionCost}
                    onChange={handleChange}
                    required
                    min="0"
                    step="0.01"
                    className="w-full pl-4 pr-16 py-3 bg-[#F2EEE8] border-none rounded-xl text-[#121212] focus:ring-2 focus:ring-[#FF4F00] outline-none transition-all" 
                    placeholder="0.00" 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-[0.75rem] font-bold uppercase tracking-[0.1em] text-[#121212]">{t('uploadArtwork.shippingCost')}</label>
                <div className="relative">
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-[#59554E]">{t('uploadArtwork.euro')}</span>
                  <input 
                    type="number" 
                    name="shippingCost"
                    value={formData.shippingCost}
                    onChange={handleChange}
                    required
                    min="0"
                    step="0.01"
                    className="w-full pl-4 pr-16 py-3 bg-[#F2EEE8] border-none rounded-xl text-[#121212] focus:ring-2 focus:ring-[#FF4F00] outline-none transition-all" 
                    placeholder="0.00" 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-[0.75rem] font-bold uppercase tracking-[0.1em] text-[#121212]">{t('uploadArtwork.exhibitionId')}</label>
                <select 
                  name="exhibitionId"
                  value={formData.exhibitionId}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-[#F2EEE8] border-none rounded-xl text-[#121212] focus:ring-2 focus:ring-[#FF4F00] outline-none transition-all appearance-none"
                >
                  <option value="">{t('uploadArtwork.none')}</option>
                  {/* We would map over actual exhibitions here */}
                  <option value="exh_1">{t('uploadArtwork.summerCollection')}</option>
                  <option value="exh_2">{t('uploadArtwork.abstractVisions')}</option>
                </select>
              </div>

            </div>

            <div className="space-y-2">
              <label className="block text-[0.75rem] font-bold uppercase tracking-[0.1em] text-[#121212]">{t('uploadArtwork.shortDescription')}</label>
              <textarea 
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={4}
                className="w-full px-4 py-3 bg-[#F2EEE8] border-none rounded-xl text-[#121212] placeholder:text-[#59554E] focus:ring-2 focus:ring-[#FF4F00] outline-none transition-all resize-none" 
                placeholder={t('uploadArtwork.descriptionPlaceholder')} 
              />
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <button 
              type="button"
              onClick={() => navigate('/artworks')}
              disabled={loading}
              className="px-8 py-4 rounded-full font-bold text-[#59554E] hover:bg-[#EAE3D9] transition-colors disabled:opacity-50"
            >
              {t('common.cancel')}
            </button>
            <button 
              type="submit"
              disabled={loading || imageUrls.length === 0}
              className="bg-[#FF4F00] text-white font-bold py-4 px-10 rounded-full hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-[#FF4F00]/20 disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-2"
            >
              {loading ? (
                <span>{t('uploadArtwork.uploading')}</span>
              ) : (
                <>
                  <Check size={20} />
                  <span>{t('uploadArtwork.submit')}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
