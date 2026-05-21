import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "motion/react";
import { X, Download, Share, PlusSquare, ArrowUp, Info } from "lucide-react";
import clsx from "clsx";

export default function PWAInstallBanner() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showHowTo, setShowHowTo] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    // Check if already in standalone mode
    const standalone = 
      window.matchMedia("(display-mode: standalone)").matches || 
      (navigator as any).standalone === true;
    
    setIsStandalone(standalone);

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(ios);

    // Save beforeinstallprompt event for Android/Chrome
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Coordinated auto-prompt trigger listener (called after language preferences & cookies are resolved)
    const handleTriggerAutoPrompt = () => {
      const isDismissed = localStorage.getItem("pwa-dismissed");
      if (!isDismissed && !standalone) {
        // Wait 6.0 more seconds of browsing room after the previous modal is closed/skipped
        timer = setTimeout(() => {
          setIsOpen(true);
        }, 6000);
      }
    };

    window.addEventListener("language-prompt-closed", handleTriggerAutoPrompt);

    // Direct trigger from external elements (e.g. Footer Link)
    const handleTriggerOpen = () => {
      setShowHowTo(false); // Reset to main panel
      setIsOpen(true);
    };

    window.addEventListener("open-pwa-install", handleTriggerOpen);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("language-prompt-closed", handleTriggerAutoPrompt);
      window.removeEventListener("open-pwa-install", handleTriggerOpen);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`PWA Install choice: ${outcome}`);
      setDeferredPrompt(null);
      setIsOpen(false);
    } else {
      // If no native prompt is available (e.g., Firefox, iOS, or other browsers), show manual instructions
      setShowHowTo(true);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem("pwa-dismissed", "true");
    setIsOpen(false);
  };

  // If already installed, don't show automatically but still allow triggering via footer if they click it
  if (isStandalone && !isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-end justify-center pointer-events-none p-4 md:p-6 font-['Karla']">
          {/* Overlay when showing manual guide */}
          {showHowTo && (
            <div 
              className="fixed inset-0 bg-black/60 pointer-events-auto backdrop-blur-sm transition-opacity"
              onClick={() => setShowHowTo(false)}
            />
          )}

          {/* Banner Container */}
          <motion.div
            initial={{ y: 150, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 150, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className={clsx(
              "w-full max-w-lg bg-[#F8F6F3] border border-[#EAE3D9] text-[#121212] shadow-2xl rounded-[30px] p-6 pointer-events-auto relative",
              showHowTo ? "z-50 border-[#FF4F00]" : "z-40"
            )}
          >
            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 text-gray-500 hover:text-black transition-colors rounded-full p-1 hover:bg-[#EAE3D9] cursor-pointer"
            >
              <X size={18} />
            </button>

            {!showHowTo ? (
              <div className="flex flex-col gap-4">
                {/* Visual Header */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#FF4F00] text-white rounded-2xl flex items-center justify-center shadow-lg shadow-[#FF4F00]/20 shrink-0">
                    <Download size={22} className="animate-bounce" />
                  </div>
                  <div>
                    <h3 className="font-['Shamgod'] text-2xl leading-none uppercase tracking-normal m-0 pt-1">
                      {t("pwa.installTitle", "INSTALLA TAGTALES APP")}
                    </h3>
                    <p className="text-[10px] font-bold uppercase text-[#FF4F00] tracking-wider mt-1">
                      {t("pwa.subtitle", "Vivi l'esperienza a schermo intero")}
                    </p>
                  </div>
                </div>

                <p className="text-sm md:text-base text-[#59554E] leading-relaxed">
                  {t(
                    "pwa.description",
                    "Aggiungi TagTales Gallery alla schermata home del tuo telefono. Occupa pochissimo spazio, si carica all'istante e ti permette di esplorare mini mostre e chattare con i writer come un'app nativa!"
                  )}
                </p>

                {/* Footer buttons */}
                <div className="flex flex-col sm:flex-row gap-2 mt-2">
                  {isIOS ? (
                    <button
                      onClick={() => setShowHowTo(true)}
                      className="flex-1 bg-[#121212] hover:bg-[#FF4F00] text-white py-3.5 rounded-full font-bold uppercase tracking-wider text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Share size={16} />
                      {t("pwa.installIOSBtn", "COME SCARICARE")}
                    </button>
                  ) : (
                    <button
                      onClick={handleInstallClick}
                      className="flex-1 bg-[#121212] hover:bg-[#FF4F00] text-white py-3.5 rounded-full font-bold uppercase tracking-wider text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Download size={16} />
                      {t("pwa.installBtn", "INSTALLA ORA")}
                    </button>
                  )}

                  <button
                    onClick={() => setShowHowTo(true)}
                    className="bg-white border border-[#EAE3D9] hover:bg-white/80 hover:border-[#121212] text-[#121212] py-3.5 px-6 rounded-full font-bold uppercase tracking-wider text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Info size={16} />
                    {t("pwa.guideBtn", "GUIDA")}
                  </button>
                  
                  <button
                    onClick={handleDismiss}
                    className="sm:hidden text-gray-500 hover:text-black py-2 rounded-full font-bold uppercase text-[10px] tracking-wider transition-all"
                  >
                    {t("pwa.dismiss", "FORSE PIÙ TARDI")}
                  </button>
                </div>
              </div>
            ) : (
              // Installation Instructions (How-To) Modal
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#121212] text-white rounded-xl flex items-center justify-center shrink-0">
                    <Info size={20} />
                  </div>
                  <div>
                    <h3 className="font-['Shamgod'] text-2xl leading-none uppercase tracking-normal">
                      {t("pwa.guideHeader", "GUIDA DI INSTALLAZIONE")}
                    </h3>
                    <p className="text-[10px] font-bold uppercase text-[#FF4F00] tracking-wider mt-0.5">
                      {isIOS ? "iOS Safari" : "Chrome / Android / Firefox"}
                    </p>
                  </div>
                </div>

                {isIOS ? (
                  // iOS Safari instructions
                  <div className="space-y-4 my-2 text-sm text-[#59554E] leading-relaxed">
                    <p>
                      {t(
                        "pwa.iosIntro",
                        "Apple iOS non supporta l'installazione automatica con un click, ma puoi aggiungerla in pochi secondi così:"
                      )}
                    </p>
                    <div className="bg-white p-4 rounded-2xl border border-[#EAE3D9] space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-[#F2EEE8] text-[#121212] font-bold text-xs rounded-full flex items-center justify-center shrink-0 mt-0.5">1</div>
                        <p className="pt-0.5">
                          {t("pwa.iosStep1", "Apri questo sito all'interno del browser ")} 
                          <span className="font-bold text-[#121212]">Safari</span>.
                        </p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-[#F2EEE8] text-[#121212] font-bold text-xs rounded-full flex items-center justify-center shrink-0 mt-0.5">2</div>
                        <p className="pt-0.5 flex flex-wrap items-center gap-1">
                          {t("pwa.iosStep2", "Tocca l'icona di")} 
                          <span className="font-bold text-[#121212] inline-flex items-center gap-1 bg-[#F2EEE8] px-2 py-0.5 rounded text-xs"><Share size={12} /> Condividi</span> 
                          {t("pwa.iosStep2_end", "nella barra in basso (su iPhone) o in alto (su iPad).")}
                        </p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-[#F2EEE8] text-[#121212] font-bold text-xs rounded-full flex items-center justify-center shrink-0 mt-0.5">3</div>
                        <p className="pt-0.5 flex flex-wrap items-center gap-1">
                          {t("pwa.iosStep3", "Scorri l'elenco e seleziona")} 
                          <span className="font-bold text-[#121212] inline-flex items-center gap-1 bg-[#F2EEE8] px-2 py-0.5 rounded text-xs"><PlusSquare size={12} /> Aggiungi alla schermata Home</span>.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Android/other browsers instructions
                  <div className="space-y-4 my-2 text-sm text-[#59554E] leading-relaxed">
                    <p>
                      {t(
                        "pwa.androidIntro",
                        "Se la richiesta di installazione automatica non si è aperta, puoi installare l'app manualmente attraverso il browser:"
                      )}
                    </p>
                    <div className="bg-white p-4 rounded-2xl border border-[#EAE3D9] space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-[#F2EEE8] text-[#121212] font-bold text-xs rounded-full flex items-center justify-center shrink-0 mt-0.5">1</div>
                        <p className="pt-0.5">
                          {t("pwa.androidStep1", "Tocca il pulsante con i ")}
                          <span className="font-bold text-[#121212]">{t("pwa.threeDots", "tre puntini")}</span> 
                          {t("pwa.androidStep1_end", " in alto a destra nel browser.")}
                        </p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-[#F2EEE8] text-[#121212] font-bold text-xs rounded-full flex items-center justify-center shrink-0 mt-0.5">2</div>
                        <p className="pt-0.5 text-[#121212] font-bold">
                          {t("pwa.androidStep2", "Seleziona 'Installa applicazione' o 'Aggiungi a schermata Home'.")}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => setShowHowTo(false)}
                    className="flex-1 bg-[#121212] hover:bg-[#FF4F00] text-white py-3 rounded-full font-bold uppercase tracking-wider text-xs transition-colors cursor-pointer"
                  >
                    {t("pwa.back", "INDIETRO")}
                  </button>
                  <button
                    onClick={handleDismiss}
                    className="border border-[#EAE3D9] hover:border-[#121212] text-[#121212] px-6 py-3 rounded-full font-bold uppercase tracking-wider text-xs transition-colors cursor-pointer"
                  >
                    {t("pwa.close", "CHIUDI")}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
