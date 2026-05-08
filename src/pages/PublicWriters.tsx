import React, { useState, useEffect, useMemo } from "react";
import { motion, useScroll, useMotionValueEvent } from "motion/react";
import { Link } from "react-router-dom";
import clsx from "clsx";
import { useTranslation } from "react-i18next";
import { useI18n } from "../contexts/I18nContext";
import { db } from "../firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";

import PublicLayout from "../components/PublicLayout";
import SEO from "../components/SEO";
import { getLocalizedField } from "../utils/localization";
import { IMAGE_RADIUS } from "../constants/theme";

export default function PublicWriters() {
  const { t, i18n } = useTranslation();
  const { language: lang } = useI18n();

  const [writers, setWriters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const { scrollY } = useScroll();
  const [hiddenFilterBar, setHiddenFilterBar] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() || 0;
    if (latest > previous && latest > 150) {
      setHiddenFilterBar(true);
    } else {
      setHiddenFilterBar(false);
    }
  });

  useEffect(() => {
    const fetchWriters = async () => {
      try {
        const snapshot = await getDocs(collection(db, "scrittori"));
        const data = snapshot.docs
          .map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              fotoProfilo: data.fotoProfilo || data.profileImageUrl
            };
          })
          .filter((w: any) => w.published !== false && w.isPublished !== false)
          .sort((a: any, b: any) => {
            return (a.order ?? 999) - (b.order ?? 999);
          });
        setWriters(data);
      } catch (error) {
        console.error("Error fetching artists:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchWriters();
  }, []);

  const filteredWriters = useMemo(() => {
    return writers.filter(
      (w) => {
        const nickname = getLocalizedField(w, 'nickname', lang) || getLocalizedField(w, 'artistName', lang) || "Writer";
        const citta = getLocalizedField(w, 'citta', lang) || getLocalizedField(w, 'city', lang) || "";
        const paese = getLocalizedField(w, 'paese', lang) || getLocalizedField(w, 'country', lang) || "";
        return nickname.toLowerCase().includes(searchQuery.toLowerCase()) ||
          citta.toLowerCase().includes(searchQuery.toLowerCase()) ||
          paese.toLowerCase().includes(searchQuery.toLowerCase());
      }
    );
  }, [writers, searchQuery, lang]);

  return (
    <PublicLayout>
      <SEO
        title={t("nav.writers", "WRITERS")}
        description={t(
          "seo.writersDesc",
          "Scopri i migliori writer della scena internazionale su TagTales Gallery.",
        )}
      />

      {/* Search Filter Strip */}
      <motion.div
        animate={{
          opacity: hiddenFilterBar ? 0 : 1,
          y: hiddenFilterBar ? -100 : 0,
        }}
        transition={{ duration: 0.2 }}
        className="fixed top-[75px] w-full z-40 bg-[#121212] border-b border-white/10 px-4 py-3 md:px-8 shadow-xl"
      >
        {/* Mobile toggle */}
        <div className="md:hidden flex justify-between items-center text-white">
          <span className="font-['Shamgod'] text-2xl uppercase tracking-widest text-white leading-none">
            Writers
          </span>
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="text-xs border border-white/30 px-4 py-1.5 rounded-full uppercase"
          >
            {isFilterOpen ? "Chiudi" : "Apri"}
          </button>
        </div>

        {/* Filters Desktop & Mobile */}
        <div
          className={clsx(
            "flex-col md:flex-row gap-4 mt-4 md:mt-0 transition-all text-white",
            isFilterOpen ? "flex" : "hidden md:flex",
            "items-center justify-between",
          )}
        >
          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto flex-1 items-center">
            <span className="hidden md:block font-['Shamgod'] text-white text-[40px] leading-none uppercase shrink-0 mr-4 mt-1">
              WRITERS
            </span>
            <input
              type="text"
              placeholder={t("search.writers", "Cerca writer, città...")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white/10 text-white placeholder-white/50 px-4 py-2.5 rounded-full border-none outline-none focus:ring-2 focus:ring-[#FF4F00] text-sm flex-1 max-w-[300px]"
            />
          </div>
        </div>
      </motion.div>

      <div className="pt-[96px] px-[15px] md:px-[25px] pb-32 bg-[#121212] min-h-[100svh] text-white">
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           className="w-full mx-auto"
        >
          {loading ? (
            <div className="flex justify-center items-center py-20 uppercase font-['Shamgod'] text-4xl">
              {t("common.loading", "Caricamento...")}
            </div>
          ) : filteredWriters.length === 0 ? (
            <p className="text-xl mt-12 uppercase">
              {t("common.noResultsFound", "Nessun writer trovato.")}
            </p>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-[15px] md:gap-[25px]">
               {filteredWriters.map((writer) => {
                 const nickname = getLocalizedField(writer, 'nickname', lang) || getLocalizedField(writer, 'artistName', lang) || "Writer";
                 const citta = getLocalizedField(writer, 'citta', lang) || getLocalizedField(writer, 'city', lang) || "";
                 const paese = getLocalizedField(writer, 'paese', lang) || getLocalizedField(writer, 'country', lang) || "";
                 
                 return (
                <Link
                  key={writer.id}
                  to={`/writers/${writer.id}`}
                  className="group block"
                >
                  <div className={clsx("aspect-square bg-white overflow-hidden mb-4 relative group-hover:scale-[1.02] transition-transform duration-500", IMAGE_RADIUS.MD)}>
                    {writer.fotoProfilo && writer.fotoProfilo.trim() !== "" ? (
                      <>
                        <img
                          src={writer.fotoProfilo}
                          alt={nickname}
                          className="w-full h-full object-cover opacity-80 mix-blend-luminosity group-hover:mix-blend-normal group-hover:scale-105 transition-all duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-transparent opacity-60" />
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl font-['Shamgod'] text-[#121212]/20">
                        ?
                      </div>
                    )}
                  </div>
                  <h2 className="text-2xl md:text-3xl font-['Shamgod'] uppercase text-white group-hover:text-[#FF4F00] transition-colors leading-[0.9]">
                    {nickname}
                  </h2>
                  <p className="text-white/60 font-bold mt-1 uppercase tracking-wider text-[10px] md:text-sm">
                    {citta} {paese}
                  </p>
                </Link>
              )})}
            </div>
          )}
        </motion.div>
      </div>
    </PublicLayout>
  );
}
