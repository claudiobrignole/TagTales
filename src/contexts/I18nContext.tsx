import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from './AuthContext';
import { db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useNavigate, useLocation } from 'react-router-dom';

type Language = 'EN' | 'IT';

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language, skipRedirect?: boolean) => void;
  t: any;
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
  
  const navigate = useNavigate();
  const location = useLocation();

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
            resolvedLang = 'it'; // Default the UI to Italian first, and prompt them gracefully later
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

  // Handle staggered and coordinated LanguagePrompt orchestration
  useEffect(() => {
    let timer: NodeJS.Timeout;

    const triggerPrompt = () => {
      sessionStorage.setItem('language_prompted', 'true');
      setShowLanguagePrompt(true);
    };

    const handleCookieClosed = () => {
      // Show language prompt after 2.0s of breathing space once Cookie Banner is interacted/closed
      timer = setTimeout(() => {
        triggerPrompt();
      }, 2000);
    };

    const checkAndStaggerPrompt = () => {
      const hasPrompted = sessionStorage.getItem('language_prompted');
      if (hasPrompted) {
        // Skip prompt, dispatch event so PWA can coordinate
        window.dispatchEvent(new CustomEvent('language-prompt-closed', { detail: { action: 'skipped_prompted' } }));
        return;
      }

      const browserLangFull = navigator.language.split('-')[0].toLowerCase();
      if (browserLangFull === 'it') {
        // Already Italian, skip prompt and dispatch event for PWA coordination
        window.dispatchEvent(new CustomEvent('language-prompt-closed', { detail: { action: 'skipped_italian' } }));
        return;
      }

      const storedConsent = localStorage.getItem('tagtales_cookie_consent_prefs');
      if (storedConsent) {
        // Since cookie banner isn't showing, display language prompt after 3.5 seconds
        timer = setTimeout(() => {
          triggerPrompt();
        }, 3500);
      } else {
        // Cookie banner is active or pending. Listen for its close event.
        window.addEventListener('cookie-banner-closed', handleCookieClosed);
      }
    };

    // Stagger initial check slightly to let layout settle
    const initTimer = setTimeout(() => {
      checkAndStaggerPrompt();
    }, 1000);

    return () => {
      clearTimeout(initTimer);
      clearTimeout(timer);
      window.removeEventListener('cookie-banner-closed', handleCookieClosed);
    };
  }, []);

  const setLanguage = async (lang: Language, skipRedirect?: boolean) => {
    setLanguageState(lang);
    const langLow = lang.toLowerCase();
    i18n.changeLanguage(langLow);
    localStorage.setItem('app_language', langLow);

    if (!skipRedirect) {
      const currentPath = location.pathname;
      const isAppRoute = currentPath.startsWith('/app');

      if (!isAppRoute) {
        // Pattern delle pagine di dettaglio con slug traducibile
        const slugPatterns = [
          { it: /^\/exhibitions\/([^/]+)$/, en: /^\/en\/exhibitions\/([^/]+)$/, collection: 'mostre', itPath: '/exhibitions/', enPath: '/en/exhibitions/' },
          { it: /^\/magazine\/([^/]+)$/, en: /^\/en\/magazine\/([^/]+)$/, collection: 'articoli', itPath: '/magazine/', enPath: '/en/magazine/' },
        ];

        let redirected = false;

        for (const pattern of slugPatterns) {
          const matchIt = currentPath.match(pattern.it);
          const matchEn = currentPath.match(pattern.en);
          const match = matchIt || matchEn;

          if (match) {
            const currentSlug = match[1];
            try {
              const { collection: col, query: q, where, getDocs, limit, doc, getDoc } = await import('firebase/firestore');
              const { db: firestoreDb } = await import('../firebase');

              let targetSlug = currentSlug;

              if (lang === 'EN' && matchIt) {
                // Da IT a EN: cerca il documento per slug IT, prendi slug_en
                const snap = await getDocs(q(col(firestoreDb, pattern.collection), where('slug', '==', currentSlug), limit(1)));
                if (!snap.empty) {
                  const data = snap.docs[0].data();
                  targetSlug = data.slug_en || currentSlug;
                }
              } else if (lang === 'IT' && matchEn) {
                // Da EN a IT: cerca per slug_en, prendi slug
                const snap = await getDocs(q(col(firestoreDb, pattern.collection), where('slug_en', '==', currentSlug), limit(1)));
                if (!snap.empty) {
                  const data = snap.docs[0].data();
                  targetSlug = data.slug || currentSlug;
                }
              }

              const newPath = lang === 'EN'
                ? pattern.enPath + targetSlug
                : pattern.itPath + targetSlug;

              navigate(newPath);
              redirected = true;
            } catch (err) {
              console.error('[i18n] Slug translation failed, falling back:', err);
            }
            break;
          }
        }

        if (!redirected) {
          // Navigazione semplice per tutte le altre pagine
          if (lang === 'EN' && !currentPath.startsWith('/en')) {
            const pathMap: { [key: string]: string } = {
              '/': '/en',
              '/su-di-noi': '/en/about',
              '/assistenza': '/en/support',
            };
            const targetPath = pathMap[currentPath] || '/en' + currentPath;
            navigate(targetPath);
          } else if (lang === 'IT' && currentPath.startsWith('/en')) {
            const pathMap: { [key: string]: string } = {
              '/en': '/',
              '/en/about': '/su-di-noi',
              '/en/support': '/assistenza',
            };
            const rawPath = currentPath.replace(/\/en(\/|$)/, '/$1');
            const targetPath = pathMap[currentPath] || (rawPath === '//' ? '/' : rawPath.replace('//', '/'));
            navigate(targetPath);
          }
        }
      }
    }

    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid), { language: langLow });
      } catch (error) {
        console.error('Error saving language preference:', error);
      }
    }
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t, showLanguagePrompt, setShowLanguagePrompt, proposedLang }}>
      {children}
    </I18nContext.Provider>
  );
};
