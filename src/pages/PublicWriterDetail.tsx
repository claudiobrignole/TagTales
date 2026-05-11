import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useI18n } from "../contexts/I18nContext";
import { db } from "../firebase";
import { doc, getDoc, collection, query, where, getDocs, limit } from "firebase/firestore";
import { Film, Mail } from "lucide-react";
import EcwidBuyButton from "../components/EcwidBuyButton";
import { getLocalizedField } from "../utils/localization";
import VideoEmbed from "../components/VideoEmbed";
import { cleanHtml } from "../utils/cleanHtml";

import PublicLayout from "../components/PublicLayout";
import SEO from "../components/SEO";
import ModularExhibitionLayout from "../components/ModularExhibitionLayout";

export default function PublicWriterDetail() {
  const { slug } = useParams();
  const { t, i18n } = useTranslation();
  const { language: lang } = useI18n();

  const [rawWriterData, setRawWriterData] = useState<any>(null);
  const [artworks, setArtworks] = useState<any[]>([]);
  const [exhibitions, setExhibitions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWriterData = async () => {
      try {
        if (!slug) return;
        
        let docSnap: any = null;
        
        // 1. Prova a cercare per slug
        const q = query(collection(db, "scrittori"), where("slug", "==", slug), limit(1));
        const slugSnap = await getDocs(q);
        
        if (!slugSnap.empty) {
          docSnap = slugSnap.docs[0];
        } else {
          // 2. Fallback all'ID diretto
          const docRef = doc(db, "scrittori", slug);
          const idSnap = await getDoc(docRef);
          if (idSnap.exists()) {
            docSnap = idSnap;
          }
        }
        
        if (docSnap) {
          const data = docSnap.data();
          setRawWriterData({ id: docSnap.id, ...data });

          // Fetch artworks
          const artworksSnap = await getDocs(collection(db, "opere"));
          const artworksData = artworksSnap.docs
            .map(aDoc => ({ id: aDoc.id, ...aDoc.data() }))
            .filter((a: any) => a.artistaId === docSnap.id && a.published !== false && a.isPublished !== false);
          setArtworks(artworksData);

          // Fetch exhibitions where writer is participant
          const exhibitionsSnap = await getDocs(collection(db, "mostre"));
          const exhibitionsData = exhibitionsSnap.docs
            .map(eDoc => ({ id: eDoc.id, ...eDoc.data() }))
            .filter((ex: any) => 
              (ex.artistaIds?.includes(docSnap.id) || ex.artistaPrincipaleId === docSnap.id || ex.writerIds?.includes(docSnap.id)) && 
              ex.published !== false && ex.isPublished !== false
            );
          setExhibitions(exhibitionsData);
        }
      } catch (error) {
        console.error("Error fetching writer details:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchWriterData();
  }, [slug]);

  const writer = rawWriterData ? {
    ...rawWriterData,
    nickname: getLocalizedField(rawWriterData, 'nickname', lang) || getLocalizedField(rawWriterData, 'artistName', lang) || "Writer",
    citta: getLocalizedField(rawWriterData, 'citta', lang) || getLocalizedField(rawWriterData, 'city', lang) || "",
    paese: getLocalizedField(rawWriterData, 'paese', lang) || getLocalizedField(rawWriterData, 'country', lang) || "",
    fotoProfilo: rawWriterData.fotoProfilo || rawWriterData.profileImageUrl,
    bannerSocial: rawWriterData.bannerSocial || rawWriterData.coverImageUrl,
    bioBreve: getLocalizedField(rawWriterData, 'bioBreve', lang) || getLocalizedField(rawWriterData, 'bio', lang) || ""
  } : null;

  if (loading) {
    return (
      <PublicLayout>
        <div className="flex items-center justify-center py-32">
          Caricamento...
        </div>
      </PublicLayout>
    );
  }

  if (!writer) {
    return (
      <PublicLayout>
        <div className="flex flex-col items-center justify-center px-4 py-32 text-center">
          <h1 className="text-4xl font-['Shamgod'] uppercase mb-4">
            Writer non trovato
          </h1>
          <Link
            to="/writers"
            className="text-[#FF4F00] font-bold uppercase tracking-widest hover:underline"
          >
            Torna ai Writers
          </Link>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      {writer && (
        <SEO 
          title={writer.nickname || getLocalizedField(writer, 'nomeDarte', lang)} 
          description={getLocalizedField(writer, 'bioBreve', lang) || writer.bioBreve || getLocalizedField(writer, 'bioStrada', lang) || writer.bioStrada} 
          image={writer.fotoProfilo || writer.fotoStrada} 
        />
      )}
      <div className="pt-24 px-[25px] md:px-[50px] pb-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          <Link
            to="/writers"
            className="text-[#FF4F00] font-bold uppercase tracking-widest text-sm mb-6 inline-block hover:underline"
          >
            &larr; Tutti i Writers
          </Link>
          <div className="flex items-center gap-6 mb-8">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-white shadow-lg bg-white shrink-0">
              {writer.fotoProfilo && writer.fotoProfilo.trim() !== '' ? (
                <img
                  src={writer.fotoProfilo}
                  alt={writer.nickname}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-[#121212]/10" />
              )}
            </div>
            <div>
              <h1 className="text-5xl md:text-7xl font-['Shamgod'] uppercase leading-[0.8] tracking-tight text-[#121212]">
                {writer.nickname}
              </h1>
              <p className="text-lg md:text-xl font-bold text-[#FF4F00] uppercase tracking-widest mt-2">
                {writer.citta} {writer.paese && `- ${writer.paese}`}
              </p>
            </div>
          </div>

          {writer.bannerSocial && writer.bannerSocial.trim() !== '' && (
            <div className="w-full aspect-[21/9] rounded-3xl overflow-hidden mb-12 shadow-md">
              <img
                src={writer.bannerSocial}
                alt="Cover"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="flex flex-col gap-8 min-w-0">
            {(writer.videoEmbeds && writer.videoEmbeds.length > 0) && (
              <div className="space-y-8 w-full">
                {writer.videoEmbeds.map((url: string, index: number) => (
                  <VideoEmbed key={index} url={url} />
                ))}
              </div>
            )}
            
            <div className="prose max-w-none w-full mx-auto break-words whitespace-pre-wrap prose-p:my-2 prose-p:leading-relaxed font-['Karla'] text-xl leading-relaxed text-inherit">
              <p>{cleanHtml(writer.bioBreve) || "Nessuna biografia fornita."}</p>
            </div>
          </div>

          {(writer.blocks && writer.blocks.length > 0) && (
            <div className="mt-16">
              <ModularExhibitionLayout blocks={writer.blocks} />
            </div>
          )}

          <div className="mt-12 mb-16 flex flex-wrap gap-4">
            {writer.linkInstagram && (
              <a
                href={writer.linkInstagram}
                target="_blank"
                rel="noreferrer"
                className="inline-block bg-[#121212] text-white font-bold uppercase tracking-wider px-8 py-4 rounded-full hover:bg-[#FF4F00] transition-colors"
              >
                Segui su Instagram
              </a>
            )}
            {writer.emailContatto && (
              <a
                href={`mailto:${writer.emailContatto}`}
                className="inline-flex items-center gap-2 bg-[#F2EEE8] border border-[#121212] text-[#121212] font-bold uppercase tracking-wider px-8 py-4 rounded-full hover:bg-[#121212] hover:text-white transition-colors"
              >
                <Mail size={20} /> Contatta Writer
              </a>
            )}
          </div>

          {exhibitions.length > 0 && (
            <div className="mt-16 pt-16 border-t border-[#121212]/10">
              <h2 className="text-4xl md:text-5xl font-['Shamgod'] uppercase tracking-tight text-[#121212] mb-8">
                {t('writer.participatingExhibitions', 'Mostre Partecipanti')}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {exhibitions.map((ex) => (
                  <Link
                    key={ex.id}
                    to={`/exhibitions/${ex.slug || ex.id}`}
                    className="bg-white rounded-3xl overflow-hidden shadow-sm border border-[#EAE3D9] group"
                  >
                    <div className="aspect-video bg-[#F2EEE8] relative overflow-hidden">
                      {ex.bannerHero && ex.bannerHero.trim() !== '' ? (
                        <img src={ex.bannerHero} alt={ex.titolo} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#59554E]">NO IMAGE</div>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white font-bold uppercase tracking-widest border-2 border-white px-6 py-2 rounded-full">Visualizza Mostra</span>
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="font-bold text-2xl text-[#121212] font-['Shamgod'] uppercase mb-1 leading-none">{getLocalizedField(ex, 'titolo', lang) || ex.titolo}</h3>
                      <p className="text-[#FF4F00] font-bold uppercase tracking-widest text-sm">{getLocalizedField(ex, 'intro', lang) || ex.intro}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {artworks.length > 0 && (
            <div className="mt-16 pt-16 border-t border-[#121212]/10">
              <h2 className="text-4xl md:text-5xl font-['Shamgod'] uppercase tracking-tight text-[#121212] mb-8">
                Opere
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {artworks.map((artwork) => (
                  <div key={artwork.id} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-[#EAE3D9] group">
                    <div className="aspect-[4/5] bg-[#F2EEE8] relative overflow-hidden">
                      {artwork.immagineHiRes && artwork.immagineHiRes.trim() !== '' ? (
                        <img src={artwork.immagineHiRes} alt={artwork.titolo} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#59554E]">NO IMAGE</div>
                      )}
                    </div>
                    <div className="p-6">
                      <h3 className="font-bold text-2xl text-[#121212] font-['Shamgod'] uppercase mb-2 leading-none">{getLocalizedField(artwork, 'titolo', lang) || artwork.titolo}</h3>
                      <p className="text-sm text-[#59554E] font-bold tracking-wider uppercase mb-4">{artwork.anno} • {artwork.tecnica}</p>
                      <div className="flex justify-between items-center pt-4 border-t border-[#EAE3D9]">
                         <span className="font-bold text-xl text-[#FF4F00]">{artwork.prezzo?.toLocaleString() || '0'} Euro</span>
                        
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
