import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useI18n } from "../contexts/I18nContext";
import { db } from "../firebase";
import { doc, getDoc, collection, query, where, getDocs, limit } from "firebase/firestore";
import { Film, Mail } from "lucide-react";
import { getLocalizedField } from "../utils/localization";
import VideoEmbed from "../components/VideoEmbed";
import { cleanHtml } from "../utils/cleanHtml";
import { trackViewArtist } from "../utils/analytics";

import PublicLayout from "../components/PublicLayout";
import SEO from "../components/SEO";
import ModularExhibitionLayout from "../components/ModularExhibitionLayout";

export default function PublicWriterDetail() {
  const { slug } = useParams();
  const { t, i18n } = useTranslation();
  const { language: lang } = useI18n();

  const [rawWriterData, setRawWriterData] = useState<any>(null);
  const [exhibitions, setExhibitions] = useState<any[]>([]);
  const [ecwidProducts, setEcwidProducts] = useState<any[]>([]);
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
          trackViewArtist(docSnap.id);
          if (typeof (window as any).fbq === 'function') {
            (window as any).fbq('track', 'ViewContent', { content_type: 'writer', content_ids: [docSnap.id] });
          }

          // Fetch exhibitions where writer is participant
          const exhibitionsSnap = await getDocs(collection(db, "mostre"));
          const exhibitionsData = exhibitionsSnap.docs
            .map(eDoc => ({ id: eDoc.id, ...eDoc.data() }))
            .filter((ex: any) => 
              (ex.artistaIds?.includes(docSnap.id) || ex.artistaPrincipaleId === docSnap.id || ex.writerIds?.includes(docSnap.id)) && 
              ex.published !== false && ex.isPublished !== false
            );
          setExhibitions(exhibitionsData);

          // Fetch ecwid products if assigned
          let userEcwidProductIds: any[] = data.ecwidProductIds || [];
          
          if (userEcwidProductIds.length === 0 && data.uid) {
            try {
              const userDoc = await getDoc(doc(db, "users", data.uid));
              if (userDoc.exists()) {
                userEcwidProductIds = userDoc.data().ecwidProductIds || [];
              }
            } catch (e: any) {
              console.warn("Could not fetch user document for ecwidProductIds (missing permissions for public access, please resync products from Admin dashboard)");
            }
          }

          // Fallback if uid is not set or not matching
          if (userEcwidProductIds.length === 0) {
            try {
              const writersSnap = await getDocs(query(collection(db, "users"), where("role", "in", ["writer", "artist"])));
              writersSnap.forEach(uDoc => {
                const uData = uDoc.data();
                if (
                  (data.emailContatto && uData.email === data.emailContatto) ||
                  (data.nickname && uData.artistName === data.nickname) ||
                  (data.nomeDarte && uData.artistName === data.nomeDarte)
                ) {
                   if (uData.ecwidProductIds && uData.ecwidProductIds.length > 0) {
                      userEcwidProductIds = uData.ecwidProductIds;
                   }
                }
              });
            } catch (e: any) {
              // Ignore public access error
            }
          }

          if (userEcwidProductIds.length > 0) {
            try {
              console.log("Fetching ecwid products for IDs:", userEcwidProductIds);
              const ecwidRes = await fetch("/api/ecwid/products");
              if (ecwidRes.ok) {
                const ecwidData = await ecwidRes.json();
                console.log("Total ecwid products fetched:", ecwidData.items?.length);
                const allItems = ecwidData.items || [];
                const safeIdsStr = userEcwidProductIds.map(String);
                const writerProducts = allItems.filter((p: any) => safeIdsStr.includes(String(p.id)));
                console.log("Matched ecwid products:", writerProducts);
                setEcwidProducts(writerProducts);
              } else {
                console.error("Ecwid fetch failed with status:", ecwidRes.status);
              }
            } catch (e) {
              console.error("Failed to fetch ecwid products", e);
            }
          } else {
            console.log("No ecwid product IDs assigned to this writer.");
          }
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
      
      {/* Maximum Title Banner / Hero Section */}
      <div className="relative w-full h-[30vh] md:h-[40vh] min-h-[300px] flex flex-col items-center justify-center bg-[#121212] overflow-hidden -mt-[65px] lg:-mt-[75px] pt-[65px] lg:pt-[75px]">
        {writer.fotoProfilo && writer.fotoProfilo.trim() !== '' && (
          <div className="absolute inset-0 z-0">
            <img
              src={writer.fotoProfilo}
              alt={writer.nickname}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/70"></div>
          </div>
        )}
        <div className="relative z-10 w-full px-[25px] md:px-[50px] flex flex-col items-center justify-center text-center mt-auto mb-auto">
          <h1 className="font-['Shamgod'] text-[80px] md:text-[150px] lg:text-[200px] leading-[0.8] tracking-tight text-white uppercase mb-4 px-4 w-full break-words">
            {writer.nickname}
          </h1>
          {(writer.citta || writer.paese) && (
            <p className="text-xl md:text-3xl font-['Karla'] text-[#FF4F00] font-bold uppercase tracking-widest px-4 w-full break-words">
              {writer.citta} {writer.paese && `- ${writer.paese}`}
            </p>
          )}
        </div>
        
        <div className="absolute bottom-6 left-0 w-full flex justify-center z-20">
          <Link
            to="/writers"
            className="text-[#FF4F00] font-bold uppercase tracking-widest text-xs md:text-sm inline-block border-b border-[#FF4F00] pb-1 hover:text-white hover:border-white transition-colors"
          >
            &larr; {t('writer.backToWriters', 'Tutti i Writers')}
          </Link>
        </div>
      </div>

      <div className="px-[25px] md:px-[50px] pb-32 pt-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          <div className="flex flex-col gap-12 min-w-0">
            <div className="prose max-w-none w-full mx-auto break-words whitespace-pre-wrap prose-p:my-2 prose-p:leading-[1.4] prose-headings:my-4 prose-img:my-4 font-['Karla'] text-xl leading-relaxed text-inherit">
              {cleanHtml(writer.bioBreve) ? (
                <div dangerouslySetInnerHTML={{ __html: cleanHtml(writer.bioBreve) }} />
              ) : (
                <p>Nessuna biografia fornita.</p>
              )}
            </div>

            {(writer.videoEmbeds && writer.videoEmbeds.length > 0) && (
              <div className="space-y-8 w-full">
                {writer.videoEmbeds.map((url: string, index: number) => (
                  <VideoEmbed key={index} url={url} />
                ))}
              </div>
            )}
          </div>

          {(writer.blocks && writer.blocks.length > 0) && (
            <div className="mt-16">
              <ModularExhibitionLayout blocks={writer.blocks} />
            </div>
          )}

          <div className="mt-16 mb-16 flex flex-wrap gap-4">
            {writer.linkInstagram && (
              <a
                href={writer.linkInstagram}
                target="_blank"
                rel="noreferrer"
                className="inline-block bg-[#121212] text-white font-bold uppercase tracking-wider px-8 py-4 rounded-full hover:bg-[#FF4F00] transition-colors"
              >
                {t('writer.followInstagram', 'Segui su Instagram')}
              </a>
            )}
            {writer.emailContatto && (
              <a
                href={`mailto:${writer.emailContatto}`}
                className="inline-flex items-center gap-2 bg-[#F2EEE8] border border-[#121212] text-[#121212] font-bold uppercase tracking-wider px-8 py-4 rounded-full hover:bg-[#121212] hover:text-white transition-colors"
              >
                <Mail size={20} /> {t('writer.contactWriter', 'Contatta Writer')}
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
                        ex.bannerHero.match(/\.(mp4|webm|mov|m4v)(\?.*)?$/i) ? (
                          <video
                            src={ex.bannerHero}
                            poster={ex.bannerHeroFallback}
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <img src={ex.bannerHero} alt={ex.titolo} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        )
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

          {ecwidProducts.length > 0 && (
             <div className="mt-16 pt-16 border-t border-[#121212]/10">
               <h2 className="text-4xl md:text-5xl font-['Shamgod'] uppercase tracking-tight text-[#121212] mb-8">
                 {t('writer.products', 'Prodotti in Vendita')}
               </h2>
               <div className="space-y-4">
                 {ecwidProducts.map(product => (
                   <div key={product.id} className="flex items-center gap-4 p-4 border border-[#EAE3D9] rounded-xl hover:bg-[#F2EEE8]/30 transition-colors bg-white">
                     {(product.thumbnailUrl || product.imageUrl) && (
                       <img src={product.thumbnailUrl || product.imageUrl} alt={product.name} className="w-16 h-16 object-cover rounded-lg border border-[#EAE3D9]" />
                     )}
                     <div className="flex-1 min-w-0">
                       <p className="font-bold text-[#121212] truncate">{product.name}</p>
                       <p className="text-sm text-[#59554E]">{product.defaultDisplayedPriceFormatted || `${product.price?.toLocaleString()} Euro`}</p>
                     </div>
                     {product.url ? (
                       <a href={product.url} target="_blank" rel="noreferrer" className="px-4 py-2 bg-[#121212] text-white text-xs font-bold rounded-lg hover:bg-black transition-colors shrink-0">
                         {t('writer.goToStore', 'Vai allo store')}
                       </a>
                     ) : (
                       <span className="text-xs font-bold text-[#59554E] shrink-0">Non disponibile</span>
                     )}
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
