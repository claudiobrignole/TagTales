import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, Globe, Menu, X, ArrowRight } from "lucide-react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useMotionValueEvent,
} from "motion/react";
import clsx from "clsx";
import { useTranslation } from "react-i18next";
import { useI18n } from "../contexts/I18nContext";
import { db } from "../firebase";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { getLocalizedField } from "../utils/localization";

export default function Header() {
  const { t, i18n } = useTranslation();
  const { language: currentLang, setLanguage } = useI18n();
  const { scrollY } = useScroll();
  const [hiddenNav, setHiddenNav] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [dynamicPages, setDynamicPages] = useState<any[]>([]);

  const langPrefix = currentLang === "EN" ? "/en" : "";
  const localizedPath = (itPath: string, enPath?: string) =>
    currentLang === "EN" ? `/en${enPath ?? itPath}` : itPath;

  useEffect(() => {
    const fetchPages = async () => {
      try {
        const snap = await getDocs(
          query(
            collection(db, "pagine"),
            where("published", "==", true),
            where("inHeader", "==", true),
          ),
        );
        const docs = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setDynamicPages(docs);
      } catch (err) {
        console.error(err);
      }
    };
    fetchPages();
  }, []);

  const languages = ["IT", "EN"];

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() || 0;
    if (latest > previous && latest > 150) {
      setHiddenNav(true);
      setLangDropdownOpen(false);
    } else {
      setHiddenNav(false);
    }
  });

  useEffect(() => {
    const performSearch = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }
      try {
        const results: any[] = [];

        // Search Exhibitions
        const qEx = query(
          collection(db, "mostre"),
          where("published", "==", true),
          limit(5),
        );
        const snapEx = await getDocs(qEx);
        snapEx.docs.forEach((doc) => {
          const data = doc.data();
          const localizedTitle =
            getLocalizedField(data, "titolo", currentLang) || data.titolo;
          if (
            data.titolo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            data.titolo_en?.toLowerCase().includes(searchQuery.toLowerCase())
          ) {
            results.push({
              id: doc.id,
              title: localizedTitle,
              type: "Mostra",
              image: data.bannerHero,
              link: `/exhibitions/${data.slug || doc.id}`,
            });
          }
        });

        // Search Artists
        const qWr = query(
          collection(db, "scrittori"),
          where("stato", "==", "attivo"),
          limit(5),
        );
        const snapWr = await getDocs(qWr);
        snapWr.docs.forEach((doc) => {
          const data = doc.data();
          const localizedNickname =
            getLocalizedField(data, "nickname", currentLang) || data.nickname;
          if (
            data.nickname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            data.nickname_en?.toLowerCase().includes(searchQuery.toLowerCase())
          ) {
            results.push({
              id: doc.id,
              title: localizedNickname,
              type: t("common.writer", "Writer"),
              image: data.fotoProfilo,
              link: `/writers/${data.slug || doc.id}`,
            });
          }
        });

        setSearchResults(results);
      } catch (error) {
        console.error("Search error:", error);
      }
    };

    const timeoutId = setTimeout(performSearch, 500);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  return (
    <>
      {/* Navbar */}
      <motion.nav
        initial={{ opacity: 1 }}
        animate={{ opacity: hiddenNav ? 0 : 1, y: hiddenNav ? -20 : 0 }}
        transition={{ duration: 0.2 }}
        className="fixed top-0 w-full z-50 bg-[#F2EEE8] text-[#121212] px-[25px] flex justify-between items-center h-[65px] lg:h-[75px]"
      >
        <Link to="/" className="relative z-50 flex items-center h-full">
          <img
            src="/TAGTALES-logo-header.png"
            alt="TagTales"
            className="w-[190px] lg:w-[150px] xl:w-[260px] h-auto object-contain"
          />
        </Link>

        {/* Desktop Menu */}
        <div className="hidden lg:flex items-center lg:gap-2 xl:gap-5 font-bold text-[0.65rem] lg:text-[0.70rem] xl:text-[0.95rem] lg:tracking-[0.02em] xl:tracking-[0.05em] uppercase whitespace-nowrap">
          <Link to="/" className="hover:text-[#FF4F00] transition-colors">
            {t("nav.home", "HOME")}
          </Link>
          <Link to={localizedPath('/exhibitions')} className="hover:text-[#FF4F00] transition-colors">
            {t("nav.mostre", "MOSTRE")}
          </Link>
          <Link
            to={localizedPath('/writers')}
            className="hover:text-[#FF4F00] transition-colors"
          >
            {t("nav.writers", "WRITERS")}
          </Link>
          <Link
            to={localizedPath('/magazine')}
            className="hover:text-[#FF4F00] transition-colors"
          >
            {t("nav.magazine", "MAGAZINE")}
          </Link>
          <Link
            to={localizedPath('/assistenza', '/support')}
            className="hover:text-[#FF4F00] transition-colors"
          >
            {t("nav.assistenza", "ASSISTENZA")}
          </Link>
          {dynamicPages.map((p) => {
            const l = currentLang.toLowerCase();
            return (
              <Link
                key={p.id}
                to={`${langPrefix}/p/${p.id}`}
                className="hover:text-[#FF4F00] transition-colors"
              >
                {p[`titolo_${l}`] || p.titolo}
              </Link>
            );
          })}

          <div className="relative">
            <button
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className="flex items-center gap-1 hover:text-[#FF4F00] transition-colors focus:outline-none"
            >
              <Globe size={18} />
              <span>{currentLang}</span>
            </button>
            <AnimatePresence>
              {langDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full right-0 mt-2 bg-white shadow-xl rounded-xl border border-[#EAE3D9] overflow-hidden min-w-[80px] flex flex-col z-50"
                >
                  {languages.map((lang) => (
                    <button
                      key={lang}
                      onClick={() => {
                        setLanguage(lang as "IT" | "EN");
                        setLangDropdownOpen(false);
                      }}
                      className={clsx(
                        "w-full block text-left px-4 py-2 text-sm transition-colors",
                        currentLang === lang
                          ? "bg-[#FF4F00] text-white font-bold"
                          : "hover:bg-[#F2EEE8] text-[#121212] font-normal",
                      )}
                    >
                      {lang}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={() => setSearchOpen(true)}
            className="hover:text-[#FF4F00] transition-colors"
          >
            <Search size={22} />
          </button>
        </div>

        {/* Mobile Menu Icon */}
        <div className="lg:hidden flex items-center gap-4 relative z-50">
          <button
            onClick={() => setSearchOpen(true)}
            className="hover:text-[#FF4F00] transition-colors"
          >
            <Search size={22} />
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-[#121212] hover:text-[#FF4F00] transition-colors focus:outline-none"
          >
            {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </motion.nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-40 bg-[#F2EEE8] pt-[100px] px-[25px] overflow-y-auto"
          >
            <div className="flex flex-col gap-6 font-['Shamgod'] text-5xl text-[#121212]">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-[#FF4F00]"
              >
                {t("nav.home", "HOME")}
              </Link>
              <Link
                to={localizedPath('/exhibitions')}
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-[#FF4F00]"
              >
                {t("nav.mostre", "MOSTRE")}
              </Link>
              <Link
                to={localizedPath('/writers')}
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-[#FF4F00]"
              >
                {t("nav.writers", "WRITERS")}
              </Link>
              <Link
                to={localizedPath('/magazine')}
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-[#FF4F00]"
              >
                {t("nav.magazine", "MAGAZINE")}
              </Link>
              <Link
                to={localizedPath('/assistenza', '/support')}
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-[#FF4F00]"
              >
                {t("nav.assistenza", "ASSISTENZA")}
              </Link>
              {dynamicPages.map((p) => {
                const l = currentLang.toLowerCase();
                return (
                  <Link
                    key={p.id}
                    to={`${langPrefix}/p/${p.id}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="hover:text-[#FF4F00]"
                  >
                    {p[`titolo_${l}`] || p.titolo}
                  </Link>
                );
              })}

              <div className="mt-8 border-t border-[#121212]/10 pt-8">
                <p className="font-sans font-bold text-sm tracking-widest uppercase mb-4 text-[#59554E]">
                  {t("common.language", "Lingua")}
                </p>
                <div className="flex flex-wrap gap-4 font-sans font-bold text-lg">
                  {languages.map((lang) => (
                    <button
                      key={lang}
                      onClick={() => {
                        setLanguage(lang as "IT" | "EN");
                        setMobileMenuOpen(false);
                      }}
                      className={clsx(
                        "w-12 h-12 rounded-full flex items-center justify-center transition-colors",
                        currentLang === lang
                          ? "bg-[#FF4F00] text-white"
                          : "bg-white text-[#121212]",
                      )}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Modal */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-start justify-center px-[25px]"
          >
            <motion.div
              initial={{ y: 0, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -50, opacity: 0 }}
              className="w-full max-w-4xl bg-[#F2EEE8] rounded-b-3xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh] mt-[65px] lg:mt-[75px]"
            >
              <div className="px-8 py-6 border-b border-[#EAE3D9] flex items-center gap-4">
                <Search size={28} className="text-[#FF4F00]" />
                <input
                  type="text"
                  autoFocus
                  placeholder={t(
                    "common.searchPlaceholder",
                    "Cerca mostre, writer, articoli...",
                  )}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent border-none outline-none text-2xl font-bold font-['Karla'] text-[#121212] placeholder:text-[#121212]/30"
                />
                <button
                  onClick={() => setSearchOpen(false)}
                  className="p-2 bg-white/50 hover:bg-white rounded-full transition-colors text-[#121212]"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-8 overflow-y-auto">
                {searchQuery.length > 0 ? (
                  <div className="space-y-6">
                    <h3 className="font-bold text-sm tracking-widest uppercase text-[#59554E]">
                      {t("common.results", "Risultati")}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {searchResults.map((result) => (
                        <Link
                          key={result.id}
                          to={result.link}
                          onClick={() => setSearchOpen(false)}
                          className="flex items-center gap-6 p-4 bg-white rounded-2xl hover:shadow-md hover:-translate-y-1 transition-all group"
                        >
                          <img
                            src={result.image}
                            alt={result.title}
                            className="w-24 h-24 rounded-xl object-cover"
                          />
                          <div className="flex-1">
                            <div className="text-[#FF4F00] text-xs font-bold uppercase tracking-widest mb-1">
                              {result.type}
                            </div>
                            <h4 className="font-['Shamgod'] text-3xl group-hover:text-[#FF4F00] transition-colors">
                              {result.title}
                            </h4>
                          </div>
                          <div className="w-10 h-10 bg-[#F2EEE8] rounded-full flex items-center justify-center group-hover:bg-[#FF4F00] group-hover:text-white transition-colors">
                            <ArrowRight size={20} />
                          </div>
                        </Link>
                      ))}
                      {searchResults.length === 0 && (
                        <div className="col-span-full py-12 text-center text-[#59554E] font-medium text-lg">
                          {t(
                            "common.noResultsFound",
                            "Nessun risultato trovato per",
                          )}{" "}
                          "{searchQuery}".
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <p className="text-[#59554E] font-medium text-xl">
                      {t(
                        "common.startTyping",
                        "Inizia a digitare per cercare...",
                      )}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
