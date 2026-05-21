import React, { useState, useEffect, useMemo } from "react";
import { motion, useScroll, useMotionValueEvent } from "motion/react";
import { Link } from "react-router-dom";
import clsx from "clsx";
import { useTranslation } from "react-i18next";
import { useI18n } from "../contexts/I18nContext";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import { getLocalizedField } from "../utils/localization";
import { IMAGE_RADIUS } from "../constants/theme";

import PublicLayout from "../components/PublicLayout";
import SEO from "../components/SEO";
import LazyImage from "../components/LazyImage";

export default function PublicMagazine() {
  const { t, i18n } = useTranslation();
  const { language: lang } = useI18n();
  const langPrefix = lang === 'EN' ? '/en' : '';
  const [articles, setArticles] = useState<any[]>([]);
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
    const fetchArticles = async () => {
      try {
        const snapshot = await getDocs(collection(db, "articoli"));
        const data = snapshot.docs
          .map((doc) => {
            const docData = doc.data();
            return {
              id: doc.id,
              ...docData,
              titolo: docData.titolo || docData.title || "ARTICOLO",
              immagineCopertina:
                docData.immagineCopertina || docData.coverImageUrl,
            };
          })
          .filter((a: any) => a.published !== false && a.isPublished !== false)
          .sort((a: any, b: any) => {
            // Priority to manual order, fallback to createdAt
            if (a.order !== undefined || b.order !== undefined) {
              return (a.order ?? 999) - (b.order ?? 999);
            }
            return (
              (b.createdAt?.toMillis?.() || 0) -
              (a.createdAt?.toMillis?.() || 0)
            );
          });
        setArticles(data);
      } catch (error) {
        console.error("Error fetching articles:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchArticles();
  }, []);

  const filteredArticles = useMemo(() => {
    return articles.filter(
      (a) =>
        (getLocalizedField(a, "titolo", lang) || a.titolo || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (a.autore || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.tag?.some((t: string) =>
          t.toLowerCase().includes(searchQuery.toLowerCase()),
        ),
    );
  }, [articles, searchQuery, lang]);

  return (
    <PublicLayout>
      <SEO
        title={t("nav.magazine", "MAGAZINE")}
        description={t(
          "seo.magazineDesc",
          "Approfondimenti, interviste e storie dal mondo della graffiti culture su Tag Tales Magazine.",
        )}
      />

      {/* Search Filter Strip */}
      <motion.div
        animate={{
          opacity: hiddenFilterBar ? 0 : 1,
          y: hiddenFilterBar ? -100 : 0,
        }}
        transition={{ duration: 0.2 }}
        className="fixed top-[65px] lg:top-[75px] w-full z-40 bg-[#121212] border-b border-white/10 px-4 py-3 md:px-8 shadow-xl"
      >
        {/* Mobile toggle */}
        <div className="md:hidden flex justify-between items-center text-white">
          <span className="font-['Shamgod'] text-2xl uppercase tracking-widest text-white leading-none">
            Magazine
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
            "items-stretch md:items-center justify-between",
          )}
        >
          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto flex-1 items-stretch md:items-center">
            <span className="hidden md:block font-['Shamgod'] text-white text-[40px] leading-none uppercase shrink-0 mr-4 mt-1">
              MAGAZINE
            </span>
            <input
              type="text"
              placeholder={t(
                "search.articles",
                "Cerca articoli, tag, autori...",
              )}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white/10 text-white placeholder-white/50 px-4 py-2.5 rounded-full border-none outline-none focus:ring-2 focus:ring-[#FF4F00] text-sm w-full md:max-w-[300px]"
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
          ) : filteredArticles.length === 0 ? (
            <p className="text-xl mt-12 uppercase">
              {t("common.noResultsFound", "Nessun articolo trovato.")}
            </p>
          ) : (
            <div className="w-full pb-32 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[15px] md:gap-[25px]">
              {filteredArticles.map((article) => {
                const articleContent = (
                  <>
                    <div className={`overflow-hidden border-hidden ${IMAGE_RADIUS.MD} aspect-[4/3]`}>
                      {article.immagineCopertina &&
                      article.immagineCopertina.trim() !== "" ? (
                        <LazyImage
                          src={article.immagineCopertina}
                          alt={
                            getLocalizedField(article, "titolo", lang) ||
                            article.titolo
                          }
                          className="group-hover:scale-105 transition-transform duration-700"
                          loading="lazy"
                          width={800}
                          height={600}
                          style={{ objectFit: "cover" }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl font-['Shamgod'] text-white/20">
                          NO IMAGE
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col flex-1 px-2 md:px-0">
                      {(getLocalizedField(article, "preTitolo", lang) ||
                        article.preTitolo) && (
                        <p className="font-['Karla'] font-bold text-[12px] md:text-[14px] uppercase tracking-widest text-[#FF4F00] mb-2 leading-none">
                          {getLocalizedField(article, "preTitolo", lang) ||
                            article.preTitolo}
                        </p>
                      )}

                      <h2 className="font-['Shamgod'] uppercase text-white group-hover:text-[#FF4F00] transition-colors leading-[0.9] mb-2 md:mb-4 text-[40px] md:text-[50px]">
                        {getLocalizedField(article, "titolo", lang) ||
                          article.titolo}
                      </h2>

                      {(getLocalizedField(article, "sottotitolo", lang) ||
                        article.sottotitolo ||
                        article.sommario) && (
                        <p className="font-['Karla'] text-white/60 leading-[1.35] mb-6 text-lg line-clamp-3">
                          {getLocalizedField(article, "sottotitolo", lang) ||
                            article.sottotitolo ||
                            article.sommario}
                        </p>
                      )}
                    </div>
                  </>
                );

                return (
                  <Link
                    key={article.id}
                    to={`${langPrefix}/magazine/${article.slug || article.id}`}
                    className="group block transition-colors flex flex-col gap-4"
                  >
                    {articleContent}
                  </Link>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </PublicLayout>
  );
}
