import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useI18n } from '../contexts/I18nContext';
import { Shield, Settings, Check, X, ShieldAlert, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Cookie consent structure
interface CookiePreferences {
  necessary: boolean;
  analytical: boolean;
  marketing: boolean;
}

export default function CookieBanner() {
  const { t } = useTranslation();
  const { language } = useI18n();
  const [showBanner, setShowBanner] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // State for preference toggles inside modal
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    analytical: false,
    marketing: false,
  });

  // Apply consent updates to third-party services (Google & Meta)
  const applyConsent = (prefs: CookiePreferences) => {
    try {
      if (typeof window !== 'undefined') {
        const anyWindow = window as any;
        
        // Update Google Consent Mode
        if (anyWindow.gtag) {
          anyWindow.gtag('consent', 'update', {
            'analytics_storage': prefs.analytical ? 'granted' : 'denied',
            'ad_storage': prefs.marketing ? 'granted' : 'denied',
            'ad_user_data': prefs.marketing ? 'granted' : 'denied',
            'ad_personalization': prefs.marketing ? 'granted' : 'denied',
            'personalization_storage': prefs.marketing ? 'granted' : 'denied',
          });
        }
        
        // Update Meta Pixel Consent
        if (anyWindow.fbq) {
          if (prefs.marketing || prefs.analytical) {
            anyWindow.fbq('consent', 'grant');
          } else {
            anyWindow.fbq('consent', 'revoke');
          }
        }
      }
    } catch (e) {
      console.error('Error applying cookie consent:', e);
    }
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;

    // Check if user already provided cookie preferences (with a tiny delay to optimize first-screen rendering speed)
    timer = setTimeout(() => {
      const storedConsent = localStorage.getItem('tagtales_cookie_consent_prefs');
      if (storedConsent) {
        try {
          const parsed = JSON.parse(storedConsent) as CookiePreferences;
          setPreferences({
            necessary: true,
            analytical: !!parsed.analytical,
            marketing: !!parsed.marketing,
          });
          // Apply consent settings on load
          applyConsent(parsed);
          // Dispatch closed/skipped event so other staggered popups know they can proceed
          window.dispatchEvent(new CustomEvent('cookie-banner-closed', { detail: { action: 'skipped' } }));
        } catch (e) {
          setShowBanner(true);
        }
      } else {
        // Show banner if no stored preference found
        setShowBanner(true);
      }
    }, 1500); // 1.5 seconds delay for better initial visual layout load

    // Listen to custom window event to open cookie preferences from the footer
    const handleOpenSettings = () => {
      setIsSettingsOpen(true);
    };
    window.addEventListener('open-cookie-settings', handleOpenSettings);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('open-cookie-settings', handleOpenSettings);
    };
  }, []);

  // Handle "Accept All"
  const handleAcceptAll = () => {
    const allAccepted: CookiePreferences = {
      necessary: true,
      analytical: true,
      marketing: true,
    };
    setPreferences(allAccepted);
    localStorage.setItem('tagtales_cookie_consent_prefs', JSON.stringify(allAccepted));
    applyConsent(allAccepted);
    setShowBanner(false);
    setIsSettingsOpen(false);
    window.dispatchEvent(new CustomEvent('cookie-banner-closed', { detail: { action: 'accepted' } }));
  };

  // Handle "Decline All" (Only keep necessary)
  const handleDeclineAll = () => {
    const allDeclined: CookiePreferences = {
      necessary: true,
      analytical: false,
      marketing: false,
    };
    setPreferences(allDeclined);
    localStorage.setItem('tagtales_cookie_consent_prefs', JSON.stringify(allDeclined));
    applyConsent(allDeclined);
    setShowBanner(false);
    setIsSettingsOpen(false);
    window.dispatchEvent(new CustomEvent('cookie-banner-closed', { detail: { action: 'declined' } }));
  };

  // Save selected preferences from the modal
  const handleSavePreferences = () => {
    localStorage.setItem('tagtales_cookie_consent_prefs', JSON.stringify(preferences));
    applyConsent(preferences);
    setShowBanner(false);
    setIsSettingsOpen(false);
    window.dispatchEvent(new CustomEvent('cookie-banner-closed', { detail: { action: 'saved' } }));
  };

  // Content helper based on language
  const isIt = language === 'IT';

  return (
    <>
      {/* 1. Main Bottom Cookie Banner */}
      <AnimatePresence>
        {showBanner && !isSettingsOpen && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 180 }}
            className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6"
          >
            <div className="max-w-6xl mx-auto bg-[#121212] border border-white/10 text-white rounded-2xl shadow-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 backdrop-blur-md bg-opacity-95">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Shield size={20} className="text-[#FF4F00]" />
                  <h4 className="font-['Shamgod'] text-xl md:text-2xl tracking-normal text-white uppercase leading-none">
                    {isIt ? 'Gestione Cookie & Privacy' : 'Cookie & Privacy Preference'}
                  </h4>
                </div>
                <p className="text-sm md:text-base font-['Karla'] text-[#EAE3D9]/90 leading-relaxed font-normal">
                  {isIt ? (
                    'I cookie analitici, funzionali e di terze parti vengono installati solo previo tuo consenso esplicito. Utilizziamo questi strumenti per migliorare l\'esperienza e analizzare il traffico del sito. Continuando o accettando acconsenti al loro utilizzo. Puoi revocare il consenso o modificare le tue preferenze in qualsiasi momento dal footer del sito.'
                  ) : (
                    'Analytical, functional and third-party cookies are only installed with your explicit consent. We use these tools to improve your browsing experience and analyze site traffic. By accepting, you consent to their use. You can revoke consent or change preferences at any time in the footer.'
                  )}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto shrink-0">
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 border border-white/20 hover:border-white text-white text-xs font-bold uppercase tracking-wider px-4 py-3 rounded-lg transition-all font-['Karla']"
                  title={isIt ? 'Personalizza preferenze' : 'Customize preferences'}
                >
                  <Settings size={14} />
                  {isIt ? 'Opzioni' : 'Preferences'}
                </button>
                <button
                  onClick={handleDeclineAll}
                  className="flex-1 md:flex-none border border-white/15 bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-wider px-4 py-3 rounded-lg transition-all font-['Karla']"
                >
                  {isIt ? 'Rifiuta' : 'Decline'}
                </button>
                <button
                  onClick={handleAcceptAll}
                  className="w-full md:w-auto bg-[#FF4F00] hover:bg-[#FF4F00]/90 text-white text-xs font-bold uppercase tracking-wider px-6 py-3 rounded-lg transition-all font-['Karla'] shadow-[0_4px_12px_rgba(255,79,0,0.25)]"
                >
                  {isIt ? 'Accetta Tutti' : 'Accept All'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Advanced Preferences Modal */}
      <AnimatePresence>
        {isSettingsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSettingsOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', damping: 25 }}
              className="relative w-full max-w-xl max-h-[90svh] sm:max-h-[85vh] bg-[#F2EEE8] border border-[#EAE3D9] rounded-2xl shadow-2xl p-5 md:p-8 flex flex-col text-[#121212] overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[#EAE3D9] pb-3 mb-4 shrink-0">
                <div className="flex items-center gap-3">
                  <ShieldAlert size={24} className="text-[#FF4F00]" />
                  <h3 className="font-['Shamgod'] text-xl sm:text-2xl md:text-3xl leading-none text-[#121212] uppercase">
                    {isIt ? 'Centro Preferenze Cookie' : 'Cookie Preferences'}
                  </h3>
                </div>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="p-1.5 text-gray-500 hover:text-black hover:bg-[#EAE3D9]/50 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Description */}
              <p className="text-xs sm:text-sm font-['Karla'] text-[#59554E] leading-relaxed mb-4 font-normal shrink-0">
                {isIt ? (
                  'Le tue scelte sulla privacy sono importanti. Di seguito puoi configurare e abilitare in modo granulare i diversi tipi di cookie utilizzati sul nostro portale. I cookie tecnici essenziali non possono essere disattivati in quanto necessari al funzionamento.'
                ) : (
                  'Your privacy choices are important. Below you can configure and enable different types of cookies used on our portal. Technical necessary cookies cannot be disabled as they are required for proper operation.'
                )}
              </p>

              {/* Preferences List */}
              <div className="space-y-3 mb-4 overflow-y-auto pr-1 flex-1 min-h-0">
                {/* 1. Necessary (Required) */}
                <div className="border border-[#EAE3D9] bg-white rounded-xl p-3.5 flex items-start gap-3 transition-shadow hover:shadow-sm">
                  <div className="p-2 bg-gray-100 rounded-lg text-gray-600 shrink-0">
                    <ShieldCheck size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-['Karla'] font-bold text-xs sm:text-sm tracking-wider uppercase text-[#121212] truncate">
                        {isIt ? 'Cookie Tecnici (Necessari)' : 'Technical Cookies (Necessary)'}
                      </span>
                      <span className="text-[9px] sm:text-[10px] bg-gray-100 text-gray-500 font-bold font-['Karla'] uppercase tracking-widest px-2 py-0.5 rounded shrink-0">
                        {isIt ? 'Sempre Attivi' : 'Always Active'}
                      </span>
                    </div>
                    <p className="text-[11px] sm:text-xs font-['Karla'] text-[#59554E] leading-relaxed">
                      {isIt ? (
                        'Questi cookie sono essenziali per navigare sul sito e utilizzare le sue funzionalità base (come ad esempio la gestione delle sessioni o il salvataggio dei carrelli di acquisto).'
                      ) : (
                        'These cookies are essential for navigating the site and using its basic features (such as secure session tokens or maintaining shopping carts).'
                      )}
                    </p>
                  </div>
                </div>

                {/* 2. Analytical & Functional */}
                <div className="border border-[#EAE3D9] bg-white rounded-xl p-3.5 flex items-start gap-3 transition-shadow hover:shadow-sm">
                  <div className={`p-2 rounded-lg transition-colors shrink-0 ${preferences.analytical ? 'bg-[#FF4F00]/10 text-[#FF4F00]' : 'bg-gray-100 text-gray-400'}`}>
                    <Check size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-['Karla'] font-bold text-xs sm:text-sm tracking-wider uppercase text-[#121212] truncate">
                        {isIt ? 'Cookie Analitici & Statistici' : 'Analytical & Statistical Cookies'}
                      </span>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          checked={preferences.analytical}
                          onChange={(e) => setPreferences({ ...preferences, analytical: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FF4F00]"></div>
                      </label>
                    </div>
                    <p className="text-[11px] sm:text-xs font-['Karla'] text-[#59554E] leading-relaxed">
                      {isIt ? (
                        'Ci consentono di contare le visite e le fonti di traffico in modo anonimo, al fine di misurare e migliorare le prestazioni del nostro sito web, identificando le pagine più visualizzate.'
                      ) : (
                        'Allow us to count visits and traffic sources anonymously so we can measure and improve the performance of our website, identifying the most and least popular pages.'
                      )}
                    </p>
                  </div>
                </div>

                {/* 3. Marketing & Third Party */}
                <div className="border border-[#EAE3D9] bg-white rounded-xl p-3.5 flex items-start gap-3 transition-shadow hover:shadow-sm">
                  <div className={`p-2 rounded-lg transition-colors shrink-0 ${preferences.marketing ? 'bg-[#FF4F00]/10 text-[#FF4F00]' : 'bg-gray-100 text-gray-400'}`}>
                    <Settings size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-['Karla'] font-bold text-xs sm:text-sm tracking-wider uppercase text-[#121212] truncate">
                        {isIt ? 'Cookie di Terze Parti & Profilazione' : 'Third-Party & Marketing Cookies'}
                      </span>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          checked={preferences.marketing}
                          onChange={(e) => setPreferences({ ...preferences, marketing: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FF4F00]"></div>
                      </label>
                    </div>
                    <p className="text-[11px] sm:text-xs font-['Karla'] text-[#59554E] leading-relaxed">
                      {isIt ? (
                        'Riguardano l\'integrazione di servizi esterni (Pixel Meta, Ecwid, Youtube, o strumenti di social sharing). Consentono di personalizzare funzionalità avanzate ed eventuali promozioni.'
                      ) : (
                        'Involves the integration of external services (Meta Pixel, Ecwid shop scripts, embedded videos, or social sharing components), enabling features tailored to your interests.'
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex flex-col sm:flex-row justify-end items-center gap-2 border-t border-[#EAE3D9] pt-4 shrink-0">
                <button
                  onClick={handleDeclineAll}
                  className="w-full sm:w-auto text-[#59554E] hover:text-[#121212] hover:bg-[#EAE3D9]/50 text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-lg transition-all font-['Karla']"
                >
                  {isIt ? 'Rifiuta Tutti' : 'Reject All'}
                </button>
                <button
                  onClick={handleSavePreferences}
                  className="w-full sm:w-auto border border-[#FF4F00] text-[#FF4F00] hover:bg-[#FF4F00]/5 text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-lg transition-all font-['Karla']"
                >
                  {isIt ? 'Salva Preferenze' : 'Save Preferences'}
                </button>
                <button
                  onClick={handleAcceptAll}
                  className="w-full sm:w-auto bg-[#FF4F00] hover:bg-[#FF4F00]/90 text-white text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-lg transition-all font-['Karla'] shadow-[0_4px_12px_rgba(255,79,0,0.25)]"
                >
                  {isIt ? 'Accetta Tutti' : 'Accept All'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
