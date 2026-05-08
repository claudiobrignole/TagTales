import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from './AuthContext';
import { db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

type Language = 'EN' | 'IT';

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, options?: any) => string;
  showLanguagePrompt: boolean;
  setShowLanguagePrompt: (show: boolean) => void;
  proposedLang: string;
}

const I18nContext = createContext<I18nContextType>({
  language: 'IT',
  setLanguage: () => {},
  t: (key) => key,
  showLanguagePrompt: false,
  setShowLanguagePrompt: () => {},
  proposedLang: 'EN',
});

export const useI18n = () => useContext(I18nContext);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [language, setLanguageState] = useState<Language>('IT');
  const [showLanguagePrompt, setShowLanguagePrompt] = useState(false);
  const [proposedLang, setProposedLang] = useState('EN');

  useEffect(() => {
    // Update HTML lang attribute for SEO
    document.documentElement.lang = i18n.language || 'it';
  }, [i18n.language]);

  useEffect(() => {
    const fetchUserLanguage = async () => {
      let resolvedLang = 'it';
      let hasExplicitPreference = false;

      // 1. Check user profile if logged in
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists() && userDoc.data().language) {
            resolvedLang = userDoc.data().language.toLowerCase();
            hasExplicitPreference = true;
          }
        } catch (error) {
          console.error("Error fetching user language preference:", error);
        }
      }

      // 2. Check local storage
      if (!hasExplicitPreference) {
        const storedLang = localStorage.getItem('app_language');
        if (storedLang && ['en', 'it'].includes(storedLang)) {
            resolvedLang = storedLang;
            hasExplicitPreference = true;
        }
      }

      // 3. Browser language
      if (!hasExplicitPreference) {
        const browserLangFull = navigator.language.split('-')[0].toLowerCase();
        const supported = ['en', 'it'];
        
        let proposed = 'it';
        if (supported.includes(browserLangFull)) {
            proposed = browserLangFull;
        } else {
            proposed = 'en';
        }
        setProposedLang(proposed.toUpperCase());

        if (browserLangFull !== 'it') {
            const hasPrompted = sessionStorage.getItem('language_prompted');
            if (!hasPrompted) {
                // If their browser isn't Italian, we still default the UI to Italian as requested,
                // but we prompt them if they want to switch to their browser's language (or English).
                resolvedLang = 'it'; 
                setShowLanguagePrompt(true);
                sessionStorage.setItem('language_prompted', 'true');
            } else {
                resolvedLang = 'it'; // Or we could keep whatever, but Italian is primary.
            }
        } else {
            resolvedLang = 'it';
        }
      }

      const langObj = String(resolvedLang).toUpperCase() as Language;
      setLanguageState(langObj);
      i18n.changeLanguage(resolvedLang);
      localStorage.setItem('app_language', resolvedLang);
    };
    
    fetchUserLanguage();
  }, [user]);

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);
    const langLow = lang.toLowerCase();
    i18n.changeLanguage(langLow);
    localStorage.setItem('app_language', langLow);
    
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid), { language: langLow });
      } catch (error) {
        console.error("Error saving language preference:", error);
      }
    }
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t, showLanguagePrompt, setShowLanguagePrompt, proposedLang }}>
      {children}
    </I18nContext.Provider>
  );
};
