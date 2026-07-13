import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useMotionValueEvent,
} from "motion/react";
import { Link } from "react-router-dom";
import clsx from "clsx";
import { useTranslation } from "react-i18next";
import { useI18n } from "../contexts/I18nContext";
import { usePublicData } from "../contexts/PublicDataContext";
import { db } from "../firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { useInView } from "react-intersection-observer";
import { Grid3x3, Maximize, ChevronDown } from "lucide-react";
import { getLocalizedField } from "../utils/localization";

import PublicLayout from "../components/PublicLayout";
import SEO from "../components/SEO";
import FullPageHero from "../components/FullPageHero";
import LazyImage from "../components/LazyImage";

interface Exhibition {
  id: string;
  titolo: string;
  preTitolo?: string;
  intro?: string;
  sottotitolo?: string;
  bannerHero?: string;
  bannerHeroFallback?: string;
  tagImage?: string;
  dataApertura?: string;
  artistaIds?: string[];
  slug?: string;
  artistNames?: string[];
  year?: string;
  order?: number;
}

export default function PublicExhibitions() {
  const { t, i18n } = useTranslation();
  const { language: lang } = useI18n();
  const langPrefix = lang === 'EN' ? '/en' : '';
  
  const [allExhibitions, setAllExhibitions] = useState<Exhibition[]>([]);
  const [filteredExhibitions, setFilteredExhibitions] = useState<Exhibition[]>(
    [],
  );
  const [visibleExhibitions, setVisibleExhibitions] = useState<Exhibition[]>(
    [],
  );

  const { scrollY } = useScroll();
  const [hiddenFilterBar, setHiddenFilterBar] = useState(false);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"fullscreen" | "grid">("fullscreen");

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() || 0;
    if (latest > previous && latest > 150) {
      setHiddenFilterBar(true);
    } else {
      setHiddenFilterBar(false);
    }
  });

  // Filters
  const [writerFilter, setWriterFilter] = useState("");
  const [titleFilter, setTitleFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Infinite Scroll
  const { ref: loadMoreRef, inView } = useInView();
  const ITEMS_PER_PAGE = 3;

  const { exhibitions: cachedExhibitions, loading: cachedPublicLoading } = usePublicData();

  useEffect(() => {
    if (!cachedPublicLoading) {
      const data = cachedExhibitions;

      // Extract available years for filter
      const years = Array.from(
        new Set(data.map((d) => d.year).filter((y) => y)),
      )
        .sort()
        .reverse();
      setAvailableYears(years as string[]);

      setAllExhibitions(data);
      setFilteredExhibitions(data);
      setVisibleExhibitions(data.slice(0, ITEMS_PER_PAGE));
      setLoading(false);
    }
  }, [cachedPublicLoading, cachedExhibitions]);

  // Filter effect
  useEffect(() => {
    let result = allExhibitions;

    if (writerFilter) {
      const q = writerFilter.toLowerCase();
      result = result.filter((ex) =>
        ex.artistNames?.some((name) => name.includes(q)),
      );
    }

    if (titleFilter) {
      const q = titleFilter.toLowerCase();
      result = result.filter((ex) => {
        const title = getLocalizedField(ex, 'titolo', lang) || getLocalizedField(ex, 'title', lang) || "MOSTRA";
        return title.toLowerCase().includes(q);
      });
    }

    if (yearFilter) {
      result = result.filter((ex) => ex.year === yearFilter);
    }

    setFilteredExhibitions(result);
    // Reset infinite scroll pagination when filters change
    setVisibleExhibitions(result.slice(0, ITEMS_PER_PAGE));
  }, [writerFilter, titleFilter, yearFilter, allExhibitions, lang]);

  // Handle infinite scroll load more
  useEffect(() => {
    if (
      inView &&
      visibleExhibitions.length < filteredExhibitions.length &&
      !loading
    ) {
      const currentLength = visibleExhibitions.length;
      const nextItems = filteredExhibitions.slice(
        currentLength,
        currentLength + ITEMS_PER_PAGE,
      );
      setVisibleExhibitions((prev) => [...prev, ...nextItems]);
    }
  }, [inView, visibleExhibitions, filteredExhibitions, loading]);

  const resetFilters = () => {
    setWriterFilter("");
    setTitleFilter("");
    setYearFilter("");
  };

  return (
    <PublicLayout>
      <SEO
        title={t("nav.mostre", "MOSTRE")}
        description={t(
          "seo.exhibitionsDesc",
          "Esplora le mini mostre di Tag Tales Gallery: opere originali e serie limitate.",
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
            {t("nav.mostre", "MOSTRE")}
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
              {t("nav.mostre", "MOSTRE")}
            </span>
            <input
              type="text"
              placeholder={t("search.writerName", "Nome Writer...")}
              value={writerFilter}
              onChange={(e) => setWriterFilter(e.target.value)}
              className="bg-white/10 text-white placeholder-white/50 px-4 py-2.5 rounded-full border-none outline-none focus:ring-2 focus:ring-[#FF4F00] text-sm w-full md:max-w-[200px]"
            />
            <input
              type="text"
              placeholder={t("search.exhibitionTitle", "Titolo Mostra...")}
              value={titleFilter}
              onChange={(e) => setTitleFilter(e.target.value)}
              className="bg-white/10 text-white placeholder-white/50 px-4 py-2.5 rounded-full border-none outline-none focus:ring-2 focus:ring-[#FF4F00] text-sm w-full md:max-w-[200px]"
            />
            <div className="relative w-full md:max-w-[200px] shrink-0">
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="appearance-none bg-white/10 text-white px-4 pr-10 py-2.5 rounded-full border-none outline-none focus:ring-2 focus:ring-[#FF4F00] text-sm [&>option]:bg-[#121212] w-full cursor-pointer"
              >
                <option value="">{t("search.allYears", "Tutti gli anni")}</option>
                {availableYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/50">
                <ChevronDown size={16} />
              </div>
            </div>
          </div>

          <div className="flex w-full md:w-auto items-center justify-between md:justify-end gap-4 shrink-0">
            <button
              onClick={() =>
                setViewMode((prev) =>
                  prev === "fullscreen" ? "grid" : "fullscreen",
                )
              }
              className="text-white border border-white/30 hover:bg-white hover:text-[#121212] p-2 rounded-full transition-colors shrink-0"
            >
              {viewMode === "fullscreen" ? (
                <Grid3x3 size={20} />
              ) : (
                <Maximize size={20} />
              )}
            </button>
            <div className="text-sm font-medium text-white/50 shrink-0">
              {t("search.resultsCount", { count: filteredExhibitions.length })}
            </div>
            {(writerFilter !== "" ||
              titleFilter !== "" ||
              yearFilter !== "") && (
              <button
                onClick={resetFilters}
                className="text-white border border-white/30 hover:bg-white hover:text-[#121212] px-4 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-colors shrink-0"
              >
                Reset Filtri
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {loading ? (
        <div className="pt-40 flex justify-center items-center h-[100svh]">
          <p className="font-['Shamgod'] text-4xl uppercase">
            {t("common.loading", "Caricamento...")}
          </p>
        </div>
      ) : visibleExhibitions.length === 0 ? (
        <div className="pt-40 flex justify-center items-center h-[100svh]">
          <p className="text-xl uppercase">
            Nessuna mostra trovata con i filtri attuali.
          </p>
        </div>
      ) : (
        <div
          className={clsx(
            "flex flex-col w-full",
            viewMode === "grid" && "bg-[#121212] pt-24 min-h-[100svh]",
          )}
        >
          {viewMode === "fullscreen" ? (
            visibleExhibitions.map((ex, index) => {
              const titolo = getLocalizedField(ex, 'titolo', lang) || getLocalizedField(ex, 'title', lang) || "MOSTRA";
              return (
              <FullPageHero
                key={ex.id}
                src={ex.bannerHero}
                fallback={ex.bannerHeroFallback}
                alt={titolo}
                tagImage={ex.tagImage}
                tagAlt={
                  getLocalizedField(ex, "preTitolo", lang) ||
                  ex.preTitolo ||
                  ex.artistNames?.join(", ") ||
                  "Tag"
                }
              >
                <motion.p
                  initial={{ y: 12 }}
                  animate={{ y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="hero-pretitle mb-2"
                >
                  {getLocalizedField(ex, 'preTitolo', lang) || ex.preTitolo || ex.artistNames?.join(", ") || "MOSTRA"}
                </motion.p>
                <motion.h2
                  initial={{ y: 12 }}
                  animate={{ y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="heading-hero mb-2 text-white md:mb-6"
                >
                  {titolo}
                </motion.h2>
                <motion.p
                  initial={{ y: 12 }}
                  animate={{ y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="hero-subtitle mb-6 md:mb-12"
                >
                  {getLocalizedField(ex, 'intro', lang) || getLocalizedField(ex, 'sottotitolo', lang)}
                </motion.p>

                <motion.div
                  initial={{ y: 12 }}
                  animate={{ y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="flex flex-col items-start"
                >
                  <Link
                    to={`${langPrefix}/exhibitions/${ex.slug || ex.id}`}
                    className="btn-text inline-flex items-center gap-4 rounded-full bg-[#FF4F00] px-10 py-4 uppercase text-white transition-colors hover:bg-white hover:text-[#121212]"
                  >
                    {t("home.visitExhibition", "VISITA LA MOSTRA")}
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-arrow-right"
                    >
                      <path d="M5 12h14" />
                      <path d="m12 5 7 7-7 7" />
                    </svg>
                  </Link>
                </motion.div>
              </FullPageHero>
            )})
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[15px] md:gap-[25px] px-[25px]">
              {visibleExhibitions.map((ex, i) => {
                const titolo = getLocalizedField(ex, 'titolo', lang) || getLocalizedField(ex, 'title', lang) || "MOSTRA";
                return (
                <Link
                  key={ex.id}
                  to={`${langPrefix}/exhibitions/${ex.slug || ex.id}`}
                  className="group cursor-pointer"
                >
                  <div className="aspect-square bg-[#2A2A2A] rounded-2xl overflow-hidden relative">
                    {ex.bannerHero && (
                      ex.bannerHero.match(/\.(mp4|webm|mov|m4v)(\?.*)?$/i) ? (
                        <video
                          src={ex.bannerHero}
                          poster={ex.bannerHeroFallback}
                          autoPlay
                          loop
                          muted
                          playsInline
                          className="w-full h-full object-cover grayscale transition-all duration-700 group-hover:grayscale-0 group-hover:scale-105"
                        />
                      ) : (
                        <LazyImage
                          src={ex.bannerHero}
                          alt={titolo}
                          className="grayscale transition-all duration-700 group-hover:grayscale-0 group-hover:scale-105"
                        />
                      )
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-transparent opacity-80" />
                    <div className="absolute bottom-6 left-6 pr-6 text-white">
                      <p className="font-['Karla'] font-bold text-lg tracking-widest text-[#FF4F00] uppercase mb-2">
                        {ex.artistNames?.join(", ")}
                      </p>
                      <h3 className="heading-h3 leading-none group-hover:text-[#FF4F00] transition-colors uppercase">
                        {titolo}
                      </h3>
                    </div>
                  </div>
                </Link>
              )})}
            </div>
          )}

          {/* Scroll observer target */}
          {visibleExhibitions.length < filteredExhibitions.length && (
            <div
              ref={loadMoreRef}
              className="h-32 flex items-center justify-center bg-[#121212] py-8 text-white"
            >
              <span className="font-['Shamgod'] uppercase text-xl">
                Caricamento in corso...
              </span>
            </div>
          )}
        </div>
      )}
    </PublicLayout>
  );
}
