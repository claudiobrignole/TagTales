import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Globe, Shield } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useTranslation } from "react-i18next";
import { useI18n } from "../contexts/I18nContext";
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export default function Footer() {
  const { t, i18n } = useTranslation();
  const { language: currentLang, setLanguage } = useI18n();
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [dynamicPages, setDynamicPages] = useState<any[]>([]);
  const languages = ["IT", "EN"];

  const langPrefix = currentLang === "EN" ? "/en" : "";
  const localizedPath = (itPath: string, enPath?: string) =>
    currentLang === "EN" ? `/en${enPath ?? itPath}` : itPath;

  useEffect(() => {
    const fetchPages = async () => {
      try {
        const snap = await getDocs(query(collection(db, 'pagine'), where('published', '==', true)));
        const docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setDynamicPages(docs);
      } catch(err) {
        console.error(err);
      }
    };
    fetchPages();
  }, []);

  const handleLangChange = (lang: string) => {
    setLanguage(lang as 'IT' | 'EN');
    setLangDropdownOpen(false);
  };

  return (
    <footer className="bg-[#121212] flex-col text-white py-12 px-[25px] md:px-[25px] relative z-10 overflow-hidden">
      <div className="w-full relative z-10">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 mb-[35px]">
          <div className="w-full lg:w-1/3">
            <img
              src="/TagTales-tagline-bianco-medium.png"
              alt="TagTales"
              className="w-[220px] md:w-[275px] lg:w-[320px] h-auto mb-6"
            />
            <p className="max-w-md text-sm md:text-base lg:text-lg mb-6 text-white font-medium">
              {t('footer.description', 'La storia di ogni writer inizia con una tag. TagTales Gallery connette graffiti writers e collezionisti attraverso mini mostre: opere originali, stampe in edizione limitata, print-on-demand. Zero intelligenza artificiale, solo stile originale.')}
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative inline-block">
                <button
                  onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                  className="flex items-center gap-2 hover:text-[#FF4F00] transition-colors focus:outline-none text-white border border-white/20 px-4 md:px-6 py-2 md:py-3 rounded-lg"
                >
                  <Globe size={20} />
                  <span className="font-bold text-sm md:text-base lg:text-lg">
                    {currentLang}
                  </span>
                </button>
                <AnimatePresence>
                  {langDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute bottom-full left-0 mb-2 bg-[#F2EEE8] shadow-xl rounded-xl border border-[#EAE3D9] overflow-hidden min-w-[120px] z-50 text-[#121212]"
                    >
                      {languages.map((lang) => (
                        <button
                          key={lang}
                          onClick={() => handleLangChange(lang)}
                          className={
                            "w-full text-left px-4 md:px-5 py-2 md:py-3 text-sm lg:text-lg transition-colors block font-bold " +
                            (currentLang === lang
                              ? "bg-[#FF4F00] text-white"
                              : "hover:bg-white text-[#121212]")
                          }
                        >
                          {lang}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button
                onClick={() => window.dispatchEvent(new Event('open-cookie-settings'))}
                className="flex items-center gap-2 hover:text-[#FF4F00] transition-colors focus:outline-none text-white border border-white/20 px-4 md:px-6 py-2 md:py-3 rounded-lg cursor-pointer"
              >
                <Shield size={20} />
                <span className="font-bold text-sm md:text-base lg:text-lg uppercase">
                  {currentLang === 'EN' ? 'Cookies' : 'Cookie'}
                </span>
              </button>
            </div>
          </div>

          <div className="w-full lg:w-2/3 grid grid-cols-2 gap-12">
            <div>
              <h4 className="font-bold text-[#FF4F00] mb-4 md:mb-6 uppercase tracking-widest text-sm lg:text-lg">
                {t("footer.menu", "Menu")}
              </h4>
              <ul className="space-y-2 text-sm lg:text-lg font-medium text-white">
                <li>
                  <Link to="/" className="hover:text-[#FF4F00] transition-colors uppercase">
                    {t("nav.home", "HOME")}
                  </Link>
                </li>
                <li>
                  <Link to={localizedPath('/exhibitions')} className="hover:text-[#FF4F00] transition-colors uppercase">
                    {t("nav.mostre", "MOSTRE")}
                  </Link>
                </li>
                <li>
                  <Link to={localizedPath('/writers')} className="hover:text-[#FF4F00] transition-colors uppercase">
                    {t("nav.writers", "WRITERS")}
                  </Link>
                </li>
                <li>
                  <Link to={localizedPath('/magazine')} className="hover:text-[#FF4F00] transition-colors uppercase">
                    {t("nav.magazine", "MAGAZINE")}
                  </Link>
                </li>
                <li>
                  <Link to={localizedPath('/assistenza', '/support')} className="hover:text-[#FF4F00] transition-colors uppercase">
                    {t("nav.assistenza", "ASSISTENZA")}
                  </Link>
                </li>
                <li>
                  <Link to={localizedPath('/su-di-noi', '/about')} className="hover:text-[#FF4F00] transition-colors uppercase">
                    {t("nav.about", "SU DI NOI")}
                  </Link>
                </li>
                <li>
                  <a href="https://aelle.hiphop" target="_blank" rel="noopener noreferrer" className="hover:text-[#FF4F00] transition-colors uppercase">
                    AELLE
                  </a>
                </li>
                {dynamicPages.filter(p => p.inFooter1).map(p => {
                  const l = currentLang.toLowerCase();
                  return (
                    <li key={p.id}>
                      <Link to={`${langPrefix}/info/${p.id}`} className="hover:text-[#FF4F00] transition-colors uppercase">
                        {p[`titolo_${l}`] || p.titolo}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-[#FF4F00] mb-4 md:mb-6 uppercase tracking-widest text-sm lg:text-lg">
                {t("footer.more", "Altro")}
              </h4>
              <ul className="space-y-2 text-sm lg:text-lg font-medium text-white mb-8 md:mb-10">
                {dynamicPages.filter(p => p.inFooter2).map(p => {
                  const l = currentLang.toLowerCase();
                  return (
                    <li key={p.id}>
                      <Link to={`${langPrefix}/info/${p.id}`} className="hover:text-[#FF4F00] transition-colors uppercase">
                        {p[`titolo_${l}`] || p.titolo}
                      </Link>
                    </li>
                  );
                })}
                <li>
                  <a
                    href="https://www.instagram.com/tagtales.gallery/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[#FF4F00] transition-colors uppercase"
                  >
                    INSTAGRAM
                  </a>
                </li>
                <li>
                  <Link
                    to="/app"
                    className="hover:text-[#FF4F00] transition-colors uppercase flex items-center gap-2"
                  >
                    {t('footer.writersDashboard', 'Writers login')}{" "}
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-lock"
                    >
                      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-white/20 pt-8 text-center">
          <p className="font-medium text-white/80 w-full text-center">
            © {new Date().getFullYear()} TagTales Gallery by Brignole | {t('footer.country')}
          </p>
        </div>
      </div>
    </footer>
  );
}
