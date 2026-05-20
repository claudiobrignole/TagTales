import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useI18n } from "../contexts/I18nContext";
import { db } from "../firebase";
import { doc, getDoc, collection, query, where, getDocs, limit } from "firebase/firestore";
import { Film } from "lucide-react";
import EcwidBuyButton from "../components/EcwidBuyButton";
import VideoEmbed from "../components/VideoEmbed";
import { getLocalizedField } from "../utils/localization";
import { cleanHtml } from "../utils/cleanHtml";
import { trackViewArtwork } from "../utils/analytics";

import PublicLayout from "../components/PublicLayout";
import SEO from "../components/SEO";
import ModularExhibitionLayout from "../components/ModularExhibitionLayout";
import LazyImage from "../components/LazyImage";

export default function PublicExhibitionDetail() {
  const { slug } = useParams();
  const { t, i18n } = useTranslation();
  const { language: lang } = useI18n();

  const [rawExhibitionData, setRawExhibitionData] = useState<any>(null);
  const [artworks, setArtworks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExhibitionAndArtworks = async () => {
      try {
        if (!slug) return;
        
        let docSnap: any = null;
        
        // 1. Cerca per slug o slug_en
        const q = query(collection(db, "mostre"), where("slug", "==", slug), limit(1));
        const qEn = query(collection(db, "mostre"), where("slug_en", "==", slug), limit(1));
        
        const [snap, snapEn] = await Promise.all([getDocs(q), getDocs(qEn)]);
        
        if (!snap.empty) {
          docSnap = snap.docs[0];
        } else if (!snapEn.empty) {
          docSnap = snapEn.docs[0];
        }

        // 2. Ultimo fallback: cerca per ID diretto
        if (!docSnap) {
          const docRef = doc(db, "mostre", slug);
          const idSnap = await getDoc(docRef);
          if (idSnap.exists()) docSnap = idSnap;
        }
        
        if (docSnap) {
          const data = docSnap.data() as any;
          const exDataRaw = { id: docSnap.id, ...data };
          setRawExhibitionData(exDataRaw);
          trackViewArtwork(docSnap.id);
          if (typeof (window as any).fbq === 'function') {
            (window as any).fbq('track', 'ViewContent', { content_type: 'exhibition', content_ids: [docSnap.id] });
          }

          const artistIds = exDataRaw.artistaIds || exDataRaw.writerIds || (exDataRaw.artistaPrincipaleId ? [exDataRaw.artistaPrincipaleId] : []);

          if (artistIds.length > 0) {
            let allArtworks: any[] = [];
            const artworksSnap = await getDocs(collection(db, "opere"));
            const artworksData = artworksSnap.docs
              .map(aDoc => ({ id: aDoc.id, ...aDoc.data() }))
              .filter((a: any) => 
                artistIds.includes(a.artistaId) && 
                a.published !== false && 
                a.isPublished !== false
              );
            setArtworks(artworksData);
          }
        }
      } catch (error) {
        console.error("Error fetching exhibition details:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchExhibitionAndArtworks();
  }, [slug, lang]);

  const exhibition = rawExhibitionData ? {
    ...rawExhibitionData,
    titolo: getLocalizedField(rawExhibitionData, 'titolo', lang) || getLocalizedField(rawExhibitionData, 'title', lang) || "MOSTRA",
    preTitolo: getLocalizedField(rawExhibitionData, 'preTitolo', lang) || rawExhibitionData.preTitolo,
    bannerHero: rawExhibitionData.bannerHero || rawExhibitionData.coverImageUrl,
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

  if (loading) {
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
        <div className="flex flex-col items-center justify-center px-4 py-32 text-center">
          <h1 className="text-4xl font-['Shamgod'] uppercase mb-4">
            Mostra non trovata
          </h1>
          <Link
            to="/exhibitions"
            className="text-[#FF4F00] font-bold uppercase tracking-widest hover:underline"
          >
            {t('nav.backToExhibitions', 'Torna alle Mostre')}
          </Link>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      {exhibition && (
        <SEO 
          title={getLocalizedField(exhibition, 'titolo', lang) || exhibition.titolo} 
          description={getLocalizedField(exhibition, 'intro', lang) || exhibition.intro || getLocalizedField(exhibition, 'testoCuratela', lang) || exhibition.testoCuratela} 
          image={exhibition.bannerHero} 
        />
      )}
      <div className="pb-[25px]">
        <div className="relative min-h-[100svh] w-full overflow-hidden bg-[#121212]">
          {exhibition.bannerHero && exhibition.bannerHero.trim() !== '' && (
            exhibition.bannerHero.match(/\.(mp4|webm|mov|m4v)(\?.*)?$/i) ? (
              <video
                src={exhibition.bannerHero}
                poster={exhibition.bannerHeroFallback}
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover opacity-80"
              />
            ) : (
              <LazyImage
                src={exhibition.bannerHero}
                alt={exhibition.titolo}
                className="opacity-80"
                wrapperClassName="absolute inset-0 w-full h-full"
                loading="eager"
                width={1920}
                height={1080}
                style={{ objectFit: "cover" }}
              />
            )
          )}

          <Link
            to="/exhibitions"
            className="absolute top-[80px] md:top-[100px] left-6 md:left-[25px] lg:left-20 z-10 text-white hover:text-[#FF4F00] font-bold uppercase tracking-widest text-sm transition-colors"
          >
            &larr; {t('nav.allExhibitions', 'Tutte le Mostre')}
          </Link>

          <div className="absolute top-[55%] md:top-1/2 -translate-y-1/2 left-0 w-full px-6 md:px-[25px] lg:px-20 text-white flex justify-center lg:justify-start mt-8 md:mt-0">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-block bg-[#121212]/60 backdrop-blur-md p-6 md:p-10 rounded-[32px] max-w-4xl text-left"
            >
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.25 }}
                className="font-['Karla'] font-bold text-[clamp(14px,1.5vw,20px)] uppercase tracking-widest text-[#FF4F00] mb-2"
              >
                {exhibition.preTitolo || exhibition.artistNames?.join(", ") || "MOSTRA"}
              </motion.p>
              <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="heading-hero mb-2 md:mb-6 text-white leading-none uppercase"
              >
                {exhibition.titolo}
              </motion.h1>
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-[clamp(16px,2.5vw,28px)] font-medium max-w-lg md:max-w-2xl leading-snug uppercase text-white/90"
              >
                {exhibition.intro || exhibition.sottotitolo}
              </motion.p>
              {isValidDate(exhibition.dataApertura) && (
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mt-4 text-sm font-['Karla'] font-bold text-[#FF4F00] uppercase tracking-widest"
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
            </motion.div>
          </div>
        </div>

        {exhibition.blocks && exhibition.blocks.length > 0 ? (
          <ModularExhibitionLayout blocks={exhibition.blocks} />
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
                            alt={`${exhibition.titolo} - ${index}`} 
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
                {exhibition.artistaIds && exhibition.artistaIds.length > 0 && (
                  <div className="bg-white rounded-3xl p-8 border border-[#EAE3D9]">
                    <h4 className="text-sm font-bold uppercase tracking-widest text-[#59554E] mb-4">
                      Writers in Primo Piano
                    </h4>
                    <div className="flex flex-col gap-4">
                      {exhibition.artistaIds.map((aId: string) => (
                        <Link
                          key={aId}
                          to={`/writers/${aId}`}
                          className="text-lg font-bold hover:text-[#FF4F00] transition-colors flex items-center gap-2"
                        >
                          &rarr; Profilo Writer
                        </Link>
                      ))}
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
                {artworks.map((artwork) => (
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
                        ) : artwork.ecwidId ? (
                          <EcwidBuyButton productId={artwork.ecwidId} />
                        ) : (
                          <button className="px-6 py-3 rounded-full font-bold uppercase tracking-widest text-[#121212] border-2 border-[#121212] hover:bg-[#121212] hover:text-white transition-colors" disabled>
                            Non Disponibile
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </PublicLayout>
  );
}
