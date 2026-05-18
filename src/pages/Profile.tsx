import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { db, storage } from '../firebase';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateProfile } from 'firebase/auth';
import { User, Mail, Globe, Instagram, Camera, Check, AlertCircle, CreditCard, Building } from 'lucide-react';
import clsx from 'clsx';
import ConnectionBanner from '../components/ConnectionBanner';
import ImageUpload from '../components/ImageUpload';
import { getAvatarFallback } from '../utils/avatar';

export default function Profile() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    artistName: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    website: '',
    instagram: '',
    social1Type: '',
    social1Url: '',
    social2Type: '',
    social2Url: '',
    social3Type: '',
    social3Url: '',
    vatNumber: '',
    invoiceLanguage: 'EN',
    accountHolder: '',
    iban: '',
    bic: '',
    bankName: ''
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [vatWarning, setVatWarning] = useState(false);
  const [forceVat, setForceVat] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          // Map legacy fields if they exist to the new aligned keys
          setProfile(prev => ({ 
            ...prev, 
            ...data,
            website: data.website || data.websiteUrl || '',
            instagram: data.instagram || data.instagramUrl || '',
            accountHolder: data.accountHolder || data.bankAccountHolder || '',
            iban: data.iban || data.bankIban || '',
            bic: data.bic || data.bankBic || '',
            bankName: data.bankName || data.bankName || '' // already match but just in case
          }));
          if (data.profilePictureUrl) {
            setImagePreview(data.profilePictureUrl);
          }
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const isValidVatFormat = (vat: string) => {
    if (!vat) return false;
    const cleanVat = vat.replace(/[^A-Z0-9]/gi, '').toUpperCase();
    if (cleanVat.length < 5) return false;
    
    const prefix = cleanVat.substring(0, 2);
    const isEU = /^[A-Z]{2}$/.test(prefix);
    
    if (isEU) {
      if (prefix === 'IT' && cleanVat.length !== 13) return false;
      if (cleanVat.length < 8 || cleanVat.length > 15) return false;
    } else {
      if (/^\d{11}$/.test(cleanVat)) return true; // Italian without IT
      if (cleanVat.length < 6) return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setError('');
    setSuccess(false);

    if (profile.vatNumber && !forceVat) {
      const isVatValid = isValidVatFormat(profile.vatNumber);
      if (!isVatValid) {
        setVatWarning(true);
        setSaving(false);
        return;
      }
    }
    setVatWarning(false);

    try {
      console.log("Submitting profile update:", profile);

      const requiredFields = ['firstName', 'lastName', 'artistName', 'phone', 'address', 'city', 'country', 'vatNumber', 'accountHolder', 'iban', 'bic', 'bankName'];
      const missingFields = requiredFields.filter(field => !profile[field as keyof typeof profile]);
      
      const isComplete = missingFields.length === 0;

      const updatedProfile = { 
        ...profile,
        isProfileComplete: isComplete 
      };
      console.log("Saving profile to Firestore:", updatedProfile);
      const docRef = doc(db, 'users', user.uid);
      await setDoc(docRef, {
        ...updatedProfile,
        uid: user.uid,
        email: user.email,
        role: (profile as any).role || 'artist',
      }, { merge: true });
      console.log("Profile saved to Firestore successfully");

      setProfile(updatedProfile);
      
      if (!isComplete) {
        setError(t('profile.incompleteWarning', 'Profilo salvato ma incompleto. Per favore compila tutti i campi obbligatori contrassegnati con l\'asterisco (*).'));
      } else {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err: any) {
      console.error("Error updating profile:", err);
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full">{t('common.loading')}</div>;
  }

  return (
    <div className="w-full space-y-8">
      <ConnectionBanner showWhenActive={true} />
      <header className="mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-[#121212] mb-2">{t('profileTitle')}</h1>
          <p className="text-[#59554E] text-lg">{t('profileSubtitle')}</p>
        </div>
        <button 
          onClick={handleSubmit}
          disabled={saving}
          className="bg-[#121212] text-white font-bold py-3 px-8 rounded-full hover:bg-[#FF4F00] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center gap-2"
        >
          {saving ? t('saving') : (
            <>
              <Check size={18} />
              <span>{t('saveChanges')}</span>
            </>
          )}
        </button>
      </header>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-2xl text-sm font-medium flex items-start gap-3">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-2xl text-sm font-medium flex items-start gap-3">
          <Check size={16} className="shrink-0 mt-0.5" />
          <span>{t('profileUpdated')}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-8">
        {/* Single Column: Public Profile */}
        <div className="space-y-8">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-[#EAE3D9] space-y-8">
            <div className="flex items-center gap-4 border-b border-[#EAE3D9] pb-6">
              <User size={24} className="text-[#FF4F00]" />
              <h2 className="text-xl font-bold text-[#121212]">{t('personalInfo')}</h2>
            </div>

            <div className="flex flex-col gap-8 items-start">
              <div className="w-full space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <label className="block text-[0.75rem] font-bold uppercase tracking-[0.1em] text-[#121212]">{t('firstName')} *</label>
                    <input 
                      type="text" name="firstName" value={profile.firstName} onChange={handleChange}
                      className="w-full px-4 py-3 bg-[#F2EEE8] border-none rounded-xl text-[#121212] focus:ring-2 focus:ring-[#FF4F00] outline-none transition-all" 
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[0.75rem] font-bold uppercase tracking-[0.1em] text-[#121212]">{t('lastName')} *</label>
                    <input 
                      type="text" name="lastName" value={profile.lastName} onChange={handleChange}
                      className="w-full px-4 py-3 bg-[#F2EEE8] border-none rounded-xl text-[#121212] focus:ring-2 focus:ring-[#FF4F00] outline-none transition-all" 
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-[0.75rem] font-bold uppercase tracking-[0.1em] text-[#121212]">{t('artistName')} *</label>
                    <input 
                      type="text" name="artistName" value={profile.artistName} onChange={handleChange}
                      className="w-full px-4 py-3 bg-[#F2EEE8] border-none rounded-xl text-[#121212] focus:ring-2 focus:ring-[#FF4F00] outline-none transition-all" 
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[0.75rem] font-bold uppercase tracking-[0.1em] text-[#121212]">{t('profile.phone')} *</label>
                    <input 
                      type="text" name="phone" value={profile.phone} onChange={handleChange}
                      className="w-full px-4 py-3 bg-[#F2EEE8] border-none rounded-xl text-[#121212] focus:ring-2 focus:ring-[#FF4F00] outline-none transition-all" 
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-[0.75rem] font-bold uppercase tracking-[0.1em] text-[#121212]">{t('profile.address')} *</label>
                  <input 
                    type="text" name="address" value={profile.address} onChange={handleChange}
                    className="w-full px-4 py-3 bg-[#F2EEE8] border-none rounded-xl text-[#121212] focus:ring-2 focus:ring-[#FF4F00] outline-none transition-all" 
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-[0.75rem] font-bold uppercase tracking-[0.1em] text-[#121212]">{t('profile.city')} *</label>
                    <input 
                      type="text" name="city" value={profile.city} onChange={handleChange}
                      className="w-full px-4 py-3 bg-[#F2EEE8] border-none rounded-xl text-[#121212] focus:ring-2 focus:ring-[#FF4F00] outline-none transition-all" 
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[0.75rem] font-bold uppercase tracking-[0.1em] text-[#121212]">{t('profile.country')} *</label>
                    <input 
                      type="text" name="country" value={profile.country} onChange={handleChange}
                      className="w-full px-4 py-3 bg-[#F2EEE8] border-none rounded-xl text-[#121212] focus:ring-2 focus:ring-[#FF4F00] outline-none transition-all" 
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-[0.75rem] font-bold uppercase tracking-[0.1em] text-[#121212]">{t('language')}</label>
                  <select 
                    name="invoiceLanguage" value={profile.invoiceLanguage} onChange={handleChange}
                    className="w-full px-4 py-3 bg-[#F2EEE8] border-none rounded-xl text-[#121212] focus:ring-2 focus:ring-[#FF4F00] outline-none transition-all appearance-none"
                  >
                    <option value="EN">English</option>
                    <option value="IT">Italian</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-[#EAE3D9]">
              <div className="space-y-2">
                <label className="block text-[0.75rem] font-bold uppercase tracking-[0.1em] text-[#121212]">{t('website')}</label>
                <div className="relative">
                  <Globe size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#59554E]" />
                  <input 
                    type="url" name="website" value={profile.website} onChange={handleChange}
                    className="w-full pl-12 pr-4 py-3 bg-[#F2EEE8] border-none rounded-xl text-[#121212] focus:ring-2 focus:ring-[#FF4F00] outline-none transition-all" 
                    placeholder="https://"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-[0.75rem] font-bold uppercase tracking-[0.1em] text-[#121212]">{t('instagram')}</label>
                <div className="relative">
                  <Instagram size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#59554E]" />
                  <input 
                    type="text" name="instagram" value={profile.instagram} onChange={handleChange}
                    className="w-full pl-12 pr-4 py-3 bg-[#F2EEE8] border-none rounded-xl text-[#121212] focus:ring-2 focus:ring-[#FF4F00] outline-none transition-all" 
                    placeholder="@username"
                  />
                </div>
              </div>
              
              {/* Altro Social 1 */}                <div className="space-y-2 md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-[#EAE3D9] pt-4 mt-2">
                <div className="space-y-2">
                  <label className="block text-[0.75rem] font-bold uppercase tracking-[0.1em] text-[#121212]">{t('profile.social1')}</label>
                  <select name="social1Type" value={profile.social1Type} onChange={handleChange} className="w-full px-4 py-3 bg-[#F2EEE8] border-none rounded-xl text-[#121212] focus:ring-2 focus:ring-[#FF4F00] outline-none transition-all appearance-none cursor-pointer">
                    <option value="">{t('profile.select')}</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Facebook">Facebook</option>
                    <option value="Twitter">Twitter / X</option>
                    <option value="TikTok">TikTok</option>
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="YouTube">YouTube</option>
                  </select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="block text-[0.75rem] font-bold uppercase tracking-[0.1em] text-[#121212]">{t('profile.linkUsernameNumber')}</label>
                  <input type="text" name="social1Url" value={profile.social1Url} onChange={handleChange} placeholder={t('profile.placeholder')} className="w-full px-4 py-3 bg-[#F2EEE8] border-none rounded-xl text-[#121212] focus:ring-2 focus:ring-[#FF4F00] outline-none transition-all" />
                </div>
              </div>

              {/* Altro Social 2 */}
              <div className="space-y-2 md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="block text-[0.75rem] font-bold uppercase tracking-[0.1em] text-[#121212]">{t('profile.social2')}</label>
                  <select name="social2Type" value={profile.social2Type} onChange={handleChange} className="w-full px-4 py-3 bg-[#F2EEE8] border-none rounded-xl text-[#121212] focus:ring-2 focus:ring-[#FF4F00] outline-none transition-all appearance-none cursor-pointer">
                    <option value="">{t('profile.select')}</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Facebook">Facebook</option>
                    <option value="Twitter">Twitter / X</option>
                    <option value="TikTok">TikTok</option>
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="YouTube">YouTube</option>
                  </select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="block text-[0.75rem] font-bold uppercase tracking-[0.1em] text-[#121212]">{t('profile.linkUsernameNumber')}</label>
                  <input type="text" name="social2Url" value={profile.social2Url} onChange={handleChange} placeholder={t('profile.placeholder')} className="w-full px-4 py-3 bg-[#F2EEE8] border-none rounded-xl text-[#121212] focus:ring-2 focus:ring-[#FF4F00] outline-none transition-all" />
                </div>
              </div>

              {/* Altro Social 3 */}
              <div className="space-y-2 md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="block text-[0.75rem] font-bold uppercase tracking-[0.1em] text-[#121212]">{t('profile.social3')}</label>
                  <select name="social3Type" value={profile.social3Type} onChange={handleChange} className="w-full px-4 py-3 bg-[#F2EEE8] border-none rounded-xl text-[#121212] focus:ring-2 focus:ring-[#FF4F00] outline-none transition-all appearance-none cursor-pointer">
                    <option value="">{t('profile.select')}</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Facebook">Facebook</option>
                    <option value="Twitter">Twitter / X</option>
                    <option value="TikTok">TikTok</option>
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="YouTube">YouTube</option>
                  </select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="block text-[0.75rem] font-bold uppercase tracking-[0.1em] text-[#121212]">{t('profile.linkUsernameNumber')}</label>
                  <input type="text" name="social3Url" value={profile.social3Url} onChange={handleChange} placeholder={t('profile.placeholder')} className="w-full px-4 py-3 bg-[#F2EEE8] border-none rounded-xl text-[#121212] focus:ring-2 focus:ring-[#FF4F00] outline-none transition-all" />
                </div>
              </div>


            </div>
          </div>

          {(profile as any).role !== 'admin' && user?.email?.toLowerCase() !== 'claudio@brignole.ch' && (
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-[#EAE3D9] space-y-6">
              <div className="flex items-center gap-4 border-b border-[#EAE3D9] pb-6">
                <CreditCard size={24} className="text-[#FF4F00]" />
                <h2 className="text-xl font-bold text-[#121212]">{t('bankDetails')}</h2>
              </div>

              <div className="space-y-2">
                <label className="block text-[0.75rem] font-bold uppercase tracking-[0.1em] text-[#121212]">{t('vatNumber')} *</label>
                <input 
                  type="text" name="vatNumber" value={profile.vatNumber} onChange={(e) => {
                    handleChange(e);
                    setVatWarning(false);
                    setForceVat(false);
                  }}
                  className="w-full px-4 py-3 bg-[#F2EEE8] border-none rounded-xl text-[#121212] focus:ring-2 focus:ring-[#FF4F00] outline-none transition-all uppercase" 
                  required
                />
                {vatWarning && (
                  <div className="mt-3 p-4 bg-yellow-50 border border-yellow-200 rounded-xl space-y-3">
                    <p className="text-sm font-medium text-amber-800">
                      {t('profile.vatWarning')}
                    </p>
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={forceVat}
                        onChange={(e) => setForceVat(e.target.checked)}
                        className="w-4 h-4 text-[#FF4F00] bg-white border-yellow-300 rounded focus:ring-[#FF4F00]"
                      />
                      <span className="text-sm text-amber-900 group-hover:text-amber-700 transition-colors">
                        {t('profile.vatConfirm')}
                      </span>
                    </label>
                  </div>
                )}
              </div>

              <div className="pt-6 border-t border-[#EAE3D9] space-y-6">
                <h3 className="font-bold text-[#121212] flex items-center gap-2">
                  <Building size={18} className="text-[#59554E]" />
                  {t('bankDetails')}
                </h3>
                
                <div className="space-y-2">
                  <label className="block text-[0.75rem] font-bold uppercase tracking-[0.1em] text-[#121212]">{t('accountHolder')} *</label>
                  <input 
                    type="text" name="accountHolder" value={profile.accountHolder} onChange={handleChange}
                    className="w-full px-4 py-3 bg-[#F2EEE8] border-none rounded-xl text-[#121212] focus:ring-2 focus:ring-[#FF4F00] outline-none transition-all" 
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="block text-[0.75rem] font-bold uppercase tracking-[0.1em] text-[#121212]">{t('iban')} *</label>
                  <input 
                    type="text" name="iban" value={profile.iban} onChange={handleChange}
                    className="w-full px-4 py-3 bg-[#F2EEE8] border-none rounded-xl text-[#121212] focus:ring-2 focus:ring-[#FF4F00] outline-none transition-all uppercase font-mono text-sm" 
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-[0.75rem] font-bold uppercase tracking-[0.1em] text-[#121212]">{t('bic')} *</label>
                    <input 
                      type="text" name="bic" value={profile.bic} onChange={handleChange}
                      className="w-full px-4 py-3 bg-[#F2EEE8] border-none rounded-xl text-[#121212] focus:ring-2 focus:ring-[#FF4F00] outline-none transition-all uppercase font-mono text-sm" 
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[0.75rem] font-bold uppercase tracking-[0.1em] text-[#121212]">{t('bankName')} *</label>
                    <input 
                      type="text" name="bankName" value={profile.bankName} onChange={handleChange}
                      className="w-full px-4 py-3 bg-[#F2EEE8] border-none rounded-xl text-[#121212] focus:ring-2 focus:ring-[#FF4F00] outline-none transition-all" 
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex justify-end pt-4">
          <button 
            onClick={handleSubmit}
            disabled={saving}
            className="bg-[#121212] text-white font-bold py-3 px-8 rounded-full hover:bg-[#FF4F00] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? t('saving') : (
              <>
                <Check size={18} />
                <span>{t('saveChanges')}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
