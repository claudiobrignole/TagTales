import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useI18n } from "../contexts/I18nContext";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import { writerCollectionUrl } from "../utils/fourthwallStore";
import { getLocalizedField } from "../utils/localization";
import { trackViewArtwork } from "../utils/analytics";
import { fetchPreviewableContent } from "../utils/fetchPreviewableContent";
import { useIsAdmin } from "../hooks/useIsAdmin";
import { PREVIEW_QUERY_PARAM, appendPreviewToLink } from "../utils/previewAccess";

import PublicLayout from "../components/PublicLayout";
import SEO, { CANONICAL_ORIGIN } from "../components/SEO";
import { exhibitionJsonLd, exhibitionMeta } from "../utils/seoDocument";
import { localizedDetailPath } from "../utils/paths";
import PreviewBanner from "../components/PreviewBanner";
import ModularExhibitionLayout from "../components/ModularExhibitionLayout";
import LazyImage from "../components/LazyImage";
import FullPageHero from "../components/FullPageHero";
import { usePublicData } from "../contexts/PublicDataContext";

export default function PublicExhibitionDetail() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const previewToken = searchParams.get(PREVIEW_QUERY_PARAM);
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const { t } = useTranslation();
  const { language: lang } = useI18n();
  const { writers, exhibitions: allExhibitions } = usePublicData();
  const langPrefix = lang === "EN" ? "/en" : "";
  const exhibitionsListPath = `${langPrefix}/exhibitions`;

  const [rawExhibitionData, setRawExhibitionData] = useState<any>(null);
  const [artworks, setArtworks] = useState<any[]>([]);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExhibitionAndArtworks = async () => {
      if (!slug || adminLoading) return;
      setLoading(true);
      try {
        const result = await fetchPreviewableContent<any>("exhibition", slug, {
          previewToken,
          isAdmin,
        });

        if (result.accessDenied || !result.data) {
          setRawExhibitionData(null);
          setArtworks([]);
          return;
        }

        const exDataRaw = result.data;
        setRawExhibitionData(exDataRaw);
        setIsPreviewMode(result.isPreviewMode);
        trackViewArtwork(exDataRaw.id);
        if (typeof (window as any).fbq === "function") {
          (window as any).fbq("track", "ViewContent", {
            content_type: "exhibition",
            content_ids: [exDataRaw.id],
          });
        }

        const artistIds =
          exDataRaw.artistaIds ||
          exDataRaw.writerIds ||
          (exDataRaw.artistaPrincipaleId ? [exDataRaw.artistaPrincipaleId] : []);

        if (artistIds.length > 0) {
          const artworksSnap = await getDocs(collection(db, "opere"));
          const artworksData = artworksSnap.docs
            .map((aDoc) => ({ id: aDoc.id, ...aDoc.data() }))
            .filter(
              (a: any) =>
                artistIds.includes(a.artistaId) &&
                a.published !== false &&
                a.isPublished !== false,
            );
          setArtworks(artworksData);
        } else {
          setArtworks([]);
        }
      } catch (error) {
        console.error("Error fetching exhibition details:", error);
        setRawExhibitionData(null);
      } finally {
        setLoading(false);
      }
    };
    fetchExhibitionAndArtworks();
  }, [slug, lang, previewToken, isAdmin, adminLoading]);

  const exhibition = rawExhibitionData ? {
    ...rawExhibitionData,
    titolo: getLocalizedField(rawExhibitionData, 'titolo', lang) || getLocalizedField(rawExhibitionData, 'title', lang) || "MOSTRA",
    preTitolo: getLocalizedField(rawExhibitionData, 'preTitolo', lang) || rawExhibitionData.preTitolo,
    bannerHero: rawExhibitionData.bannerHero || rawExhibitionData.coverImageUrl,
    tagImage: rawExhibitionData.tagImage || "",
    intro: getLocalizedField(rawExhibitionData, 'intro', lang) || getLocalizedField(rawExhibitionData, 'sottotitolo', lang) || getLocalizedField(rawExhibitionData, 'subtitle', lang) || "",
    testoCuratela: getLocalizedField(rawExhibitionData, 'testoCuratela', lang) || getLocalizedField(rawExhibitionData, 'descrizione', lang) || getLocalizedField(rawExhibitionData, 'description', lang) || ""
  } : null;

  const isValidDate = (d: any) => {
    if (!d) return false;
    if (typeof d !== 'string') return false;
    const trimmed = d.trim();
    if (trimmed === '' || trimmed === 'undefined' || trimmed === 'null') return false;
    const parsed = Date.parse(trimmed);
    return !isNaN(parsed);
  };

  if (loading || adminLoading) {
    return (
      <PublicLayout>
        <div className="flex items-center justify-center py-32">
          Caricamento...
        </div>
      </PublicLayout>
    );
  }

  if (!exhibition) {
    return (
      <PublicLayout>
        <SEO title="404 - Not Found" noIndex />
        <div className="flex flex-col items-center justify-center px-4 py-32 text-center">
          <h1 className="text-4xl font-['Shamgod'] uppercase mb-4">
            Mostra non trovata
          </h1>
          <Link
            to={exhibitionsListPath}
            className="text-[#FF4F00] font-bold uppercase tracking-widest hover:underline"
          >
            {t('nav.backToExhibitions', 'Torna alle Mostre')}
          </Link>
        </div>
      </PublicLayout>
    );
  }

  const artistIds: string[] =
    exhibition.artistaIds ||
    exhibition.writerIds ||
    (exhibition.artistaPrincipaleId ? [exhibition.artistaPrincipaleId] : []);

  const linkedWriters = artistIds
    .map((id) => writers.find((w: any) => w.id === id))
    .filter(Boolean);

  const exhibitionSlug =
    lang === "EN"
      ? exhibition.slug_en || exhibition.slug || exhibition.id
      : exhibition.slug || exhibition.id;
  const italianSlug = exhibition.slug || exhibition.id;
  const englishSlug = exhibition.slug_en || exhibition.slug || exhibition.id;
  const canonicalUrl = `${CANONICAL_ORIGIN}${langPrefix}/exhibitions/${exhibitionSlug}`;
  const showTitle = getLocalizedField(exhibition, "titolo", lang) || exhibition.titolo;
  const showArtist =
    linkedWriters
      .map((w: any) => w.nickname || w.name || w.nomeDarte)
      .filter(Boolean)
      .join(", ") ||
    exhibition.preTitolo ||
    "";
  const showMeta = exhibitionMeta(lang === "EN" ? "en" : "it", {
    title: showTitle,
    artist: showArtist,
    city: exhibition.citta || exhibition.luogo || "Lugano",
    start: isValidDate(exhibition.dataApertura) ? exhibition.dataApertura : "",
    end: isValidDate(exhibition.dataChiusura) ? exhibition.dataChiusura : "",
    intro:
      getLocalizedField(exhibition, "intro", lang) ||
      exhibition.intro ||
      getLocalizedField(exhibition, "testoCuratela", lang) ||
      exhibition.testoCuratela,
  });

  const exhibitionSchema = exhibitionJsonLd({
    name: showTitle,
    description: showMeta.description,
    image: exhibition.bannerHero || undefined,
    url: canonicalUrl,
    start: isValidDate(exhibition.dataApertura) ? exhibition.dataApertura : undefined,
    end: isValidDate(exhibition.dataChiusura) ? exhibition.dataChiusura : undefined,
    performers: linkedWriters.map((w: any) => ({
      name: w.nickname || w.name || w.nomeDarte,
      url: `${CANONICAL_ORIGIN}${localizedDetailPath(lang, "/writers", w.slug || w.id, w.slug_en)}`,
    })),
  });

  const otherExhibitions = allExhibitions.filter((item: any) => item.id !== exhibition.id);

  return (
    <PublicLayout>
      {exhibition && (
        <SEO 
          title={showMeta.title} 
          description={showMeta.description} 
          image={exhibition.bannerHero}
          noIndex={isPreviewMode}
          alternateIt={`${CANONICAL_ORIGIN}/exhibitions/${italianSlug}`}
          alternateEn={`${CANONICAL_ORIGIN}/en/exhibitions/${englishSlug}`}
          keywords={t(
            "seo.exhibitionKeywords",
            "mostra graffiti, street art exhibition, tag tales gallery",
          )}
          jsonLd={exhibitionSchema}
        />
      )}
      {isPreviewMode && <PreviewBanner />}
      <div className="pb-[25px]">
        <FullPageHero
          src={exhibition.bannerHero}
          fallback={exhibition.bannerHeroFallback}
          alt={exhibition.titolo}
          tagImage={exhibition.tagImage}
          tagAlt={exhibition.preTitolo || exhibition.artistNames?.join(", ") || "Tag"}
          backLink={{ to: exhibitionsListPath, label: t('nav.allExhibitions', 'Tutte le Mostre') }}
        >
          <motion.p
            initial={{ y: 12 }}
            animate={{ y: 0 }}
            transition={{ delay: 0.25 }}
            className="hero-pretitle mb-2"
          >
            {exhibition.preTitolo || exhibition.artistNames?.join(", ") || "MOSTRA"}
          </motion.p>
          <motion.h1
            initial={{ y: 12 }}
            animate={{ y: 0 }}
            transition={{ delay: 0.3 }}
            className="heading-hero mb-2 text-white md:mb-6"
          >
            {getLocalizedField(exhibition, "titolo", lang) || exhibition.titolo}
          </motion.h1>
          <motion.p
            initial={{ y: 12 }}
            animate={{ y: 0 }}
            transition={{ delay: 0.4 }}
            className="hero-subtitle"
          >
            {getLocalizedField(exhibition, "intro", lang) ||
              exhibition.intro ||
              getLocalizedField(exhibition, "sottotitolo", lang) ||
              exhibition.sottotitolo}
          </motion.p>
          {isValidDate(exhibition.dataApertura) && (
            <motion.p
              initial={{ y: 12 }}
              animate={{ y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-4 font-['Karla'] text-sm font-bold uppercase tracking-widest text-[#FF4F00]"
            >
              {lang === 'EN' ? 'Opening ' : 'Inaugurazione '}
              {new Date(exhibition.dataApertura).toLocaleDateString(lang === 'EN' ? 'en-US' : 'it-IT', { month: 'long', day: 'numeric', year: 'numeric' })}
              {isValidDate(exhibition.dataChiusura) && (
                <>
                  {lang === 'EN' ? ' - Open until ' : ' - Aperta fino al '}
                  {new Date(exhibition.dataChiusura).toLocaleDateString(lang === 'EN' ? 'en-US' : 'it-IT', { month: 'long', day: 'numeric', year: 'numeric' })}
                </>
              )}
            </motion.p>
          )}
        </FullPageHero>

        {exhibition.blocks && exhibition.blocks.length > 0 ? (
          <ModularExhibitionLayout
            blocks={exhibition.blocks}
            writerSlugs={linkedWriters
              .map((w: any) => (typeof w?.slug === "string" ? w.slug : ""))
              .filter(Boolean)}
          />
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-6xl mx-auto px-[25px] md:px-[50px] mt-16"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              <div className="lg:col-span-8 min-w-0">
                {(exhibition.galleria && exhibition.galleria.length > 0) && (
                  <div className="mt-0">
                    <h3 className="text-xl font-bold uppercase tracking-widest mb-6 border-b border-[#121212]/10 pb-4">
                      Galleria Immagini
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {exhibition.galleria.filter((url: string) => url && url.trim() !== '').map((url: string, index: number) => (
                        <div key={index} className="aspect-video sm:aspect-square rounded-2xl overflow-hidden border border-[#EAE3D9] shadow-sm">
                          <LazyImage 
                            src={url} 
                            alt={`${exhibition.titolo} — immagine ${index + 1} della mostra`} 
                            loading="lazy"
                            width={800}
                            height={450}
                            style={{ objectFit: "cover" }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="lg:col-span-4 space-y-8">
                {artistIds.length > 0 && (
                  <div className="bg-white rounded-3xl p-8 border border-[#EAE3D9]">
                    <h4 className="text-sm font-bold uppercase tracking-widest text-[#59554E] mb-4">
                      Writers in Primo Piano
                    </h4>
                    <div className="flex flex-col gap-4">
                      {artistIds.map((aId: string) => {
                        const writer = writers.find((w: any) => w.id === aId);
                        const writerSlug = writer?.slug || aId;
                        const writerName =
                          writer?.nickname || writer?.name || writer?.nomeDarte || "Writer";
                        return (
                          <Link
                            key={aId}
                            to={appendPreviewToLink(
                              `${langPrefix}/writers/${writerSlug}`,
                              previewToken,
                            )}
                            className="text-lg font-bold hover:text-[#FF4F00] transition-colors flex items-center gap-2"
                          >
                            &rarr; {writerName}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           className="max-w-6xl mx-auto px-[25px] md:px-[50px]"
        >
          {artworks.length > 0 && (
            <div className="mt-16 pt-16 border-t border-[#121212]/10">
              <h2 className="text-4xl md:text-5xl font-['Shamgod'] uppercase tracking-tight text-[#121212] mb-8">
                Opere in Mostra
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {artworks.map((artwork) => {
                  const collectionHref = writerCollectionUrl(
                    writers.find((w: any) => w.id === artwork.artistaId)?.slug,
                  );
                  return (
                  <div key={artwork.id} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-[#EAE3D9] group">
                    <div className="aspect-[4/5] bg-[#F2EEE8] relative overflow-hidden">
                      {artwork.immagineHiRes && artwork.immagineHiRes.trim() !== '' ? (
                        <LazyImage 
                          src={artwork.immagineHiRes} 
                          alt={artwork.titolo} 
                          className="group-hover:scale-105 transition-transform duration-500" 
                          loading="lazy"
                          width={600}
                          height={750}
                          style={{ objectFit: "cover" }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#59554E]">NO IMAGE</div>
                      )}
                    </div>
                    <div className="p-6">
                      <h3 className="font-bold text-2xl text-[#121212] font-['Shamgod'] uppercase mb-2 leading-none">{getLocalizedField(artwork, 'titolo', lang) || artwork.titolo}</h3>
                      <p className="text-sm text-[#59554E] font-bold tracking-wider uppercase mb-4">{artwork.anno} • {artwork.tecnica}</p>
                      <div className="flex justify-between items-center pt-4 border-t border-[#EAE3D9]">
                        <span className="font-bold text-xl text-[#FF4F00]">{artwork.prezzo?.toLocaleString() || 'N/A'} Euro</span>
                        
                        {artwork.statoVendita === 'sold' || artwork.statoVendita === 'venduta' ? (
                          <span className="px-6 py-3 rounded-full font-bold uppercase tracking-widest bg-[#EAE3D9] text-[#59554E]">Sold</span>
                        ) : collectionHref ? (
                          <a
                            href={collectionHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-6 py-3 rounded-full font-bold uppercase tracking-widest text-white bg-[#121212] hover:bg-[#FF4F00] transition-colors"
                          >
                            {t('exhibition.buy', 'Acquista')}
                          </a>
                        ) : (
                          <button className="px-6 py-3 rounded-full font-bold uppercase tracking-widest text-[#121212] border-2 border-[#121212] hover:bg-[#121212] hover:text-white transition-colors" disabled>
                            Non Disponibile
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>
          )}
        </motion.div>

        <section className="max-w-6xl mx-auto mt-16 border-t border-[#121212]/10 px-[25px] pb-16 pt-16 md:px-[50px]">
          {linkedWriters.length > 0 && (
            <div className="mb-12">
              <h2 className="mb-6 font-['Shamgod'] text-[30px] uppercase leading-none text-[#121212] md:text-[40px]">
                {lang === "EN" ? "WRITERS" : "WRITERS"}
              </h2>
              <ul className="flex flex-col gap-3">
                {linkedWriters.map((writer: any) => (
                  <li key={writer.id}>
                    <Link
                      to={localizedDetailPath(lang, "/writers", writer.slug || writer.id, writer.slug_en)}
                      className="font-['Karla'] text-lg font-bold uppercase tracking-wider text-[#121212] hover:text-[#FF4F00]"
                    >
                      {writer.nickname || writer.name || writer.nomeDarte}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <h2 className="mb-6 font-['Shamgod'] text-[30px] uppercase leading-none text-[#121212] md:text-[40px]">
            {lang === "EN" ? "OTHER EXHIBITIONS" : "ALTRE MOSTRE"}
          </h2>
          <ul className="flex flex-col gap-3">
            {otherExhibitions.length === 0 ? (
              <li>
                <Link
                  to={exhibitionsListPath}
                  className="font-['Karla'] text-lg font-bold uppercase tracking-wider text-[#121212] hover:text-[#FF4F00]"
                >
                  {lang === "EN" ? "All exhibitions" : "Tutte le mostre"}
                </Link>
              </li>
            ) : (
              otherExhibitions.map((item: any) => {
                const label =
                  getLocalizedField(item, "titolo", lang) ||
                  getLocalizedField(item, "title", lang) ||
                  item.titolo ||
                  item.title;
                return (
                  <li key={item.id}>
                    <Link
                      to={localizedDetailPath(lang, "/exhibitions", item.slug || item.id, item.slug_en)}
                      className="font-['Karla'] text-lg font-bold uppercase tracking-wider text-[#121212] hover:text-[#FF4F00]"
                    >
                      {label}
                    </Link>
                  </li>
                );
              })
            )}
          </ul>
        </section>
      </div>
    </PublicLayout>
  );
}
