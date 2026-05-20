import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useI18n } from "../contexts/I18nContext";
import { db } from "../firebase";
import { doc, getDoc, collection, query, where, getDocs, limit } from "firebase/firestore";
import VideoEmbed from "../components/VideoEmbed";
import DOMPurify from "dompurify";
import { getLocalizedField } from "../utils/localization";
import { cleanHtml } from "../utils/cleanHtml";
import { trackViewArtwork } from "../utils/analytics";

import clsx from "clsx";
import PublicLayout from "../components/PublicLayout";
import SEO from "../components/SEO";
import { IMAGE_RADIUS } from "../constants/theme";
import LazyImage from "../components/LazyImage";

export default function PublicArticleDetail() {
  const { slug } = useParams();
  const { t, i18n } = useTranslation();
  const { language: lang } = useI18n();

  const [rawData, setRawData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [relatedArticles, setRelatedArticles] = useState<any[]>([]);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        if (!slug) return;
        
        let articleDoc: any = null;
        
        // 1. Se lingua EN, cerca prima per slug_en
        if (lang === 'EN') {
          const qEn = query(collection(db, "articoli"), where("slug_en", "==", slug), limit(1));
          const snapEn = await getDocs(qEn);
          if (!snapEn.empty) {
            articleDoc = snapEn.docs[0];
          }
        }

        // 2. Fallback: cerca per slug italiano
        if (!articleDoc) {
          const q = query(collection(db, "articoli"), where("slug", "==", slug), limit(1));
          const slugSnap = await getDocs(q);
          if (!slugSnap.empty) {
            articleDoc = slugSnap.docs[0];
          }
        }

        // 3. Ultimo fallback: cerca per ID diretto
        if (!articleDoc) {
          const docRef = doc(db, "articoli", slug);
          const idSnap = await getDoc(docRef);
          if (idSnap.exists()) articleDoc = idSnap;
        }

        if (articleDoc) {
          const data = { id: articleDoc.id, ...articleDoc.data() as any };
          setRawData(data);
          trackViewArtwork(articleDoc.id);
          if (typeof (window as any).fbq === 'function') {
            (window as any).fbq('track', 'ViewContent', { content_type: 'article', content_ids: [articleDoc.id] });
          }

          // Fetch related articles
          const isPublished = (d: any) => d.published !== false && d.isPublished !== false;
          const snapshotArticles = await getDocs(collection(db, "articoli"));
          let articlesData = snapshotArticles.docs
            .map((doc) => {
              const docData = doc.data();
              return {
                id: doc.id,
                ...docData,
                img: docData.immagineCopertina || docData.coverImageUrl,
                title: docData.titolo || docData.title,
                tag: docData.tag?.[0] || docData.tags?.[0] || "ARTICOLO",
              };
            })
            .filter(isPublished)
            .filter((a) => a.id !== articleDoc.id) as any[];

          // Shuffle and pick 2
          articlesData = articlesData.sort(() => 0.5 - Math.random());
          setRelatedArticles(articlesData.slice(0, 2));
        }
      } catch (error) {
        console.error("Error fetching article:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchArticle();
  }, [slug, lang]);

  const article = rawData ? {
    ...rawData,
    preTitolo: getLocalizedField(rawData, 'preTitolo', lang) || rawData.preTitolo,
    titolo: getLocalizedField(rawData, 'titolo', lang) || rawData.titolo,
    sottotitolo: getLocalizedField(rawData, 'sottotitolo', lang) || rawData.sottotitolo,
    contenuto: getLocalizedField(rawData, 'contenuto', lang) || rawData.contenuto
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

  if (!article) {
    return (
      <PublicLayout>
        <div className="flex flex-col items-center justify-center px-4 py-32 text-center">
          <h1 className="text-4xl font-['Shamgod'] uppercase mb-4">
            Articolo non trovato
          </h1>
          <Link
            to="/magazine"
            className="text-[#FF4F00] font-bold uppercase tracking-widest hover:underline"
          >
            Torna al Magazine
          </Link>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      {article && (
        <SEO 
          title={getLocalizedField(article, 'titolo', lang) || article.titolo} 
          description={getLocalizedField(article, 'sottotitolo', lang) || article.sottotitolo} 
          image={article.immagineCopertina} 
          article={true}
        />
      )}
      <div className="pb-32">
        <div className="relative min-h-[100svh] w-full overflow-hidden bg-[#121212]">
          {article.immagineCopertina &&
            article.immagineCopertina.trim() !== "" && (
              <LazyImage
                src={article.immagineCopertina}
                alt={article.titolo}
                className="absolute inset-0 opacity-80"
              />
            )}

          <Link
            to="/magazine"
            className="absolute top-[80px] md:top-[100px] left-6 md:left-[25px] lg:left-20 z-10 text-white hover:text-[#FF4F00] font-bold uppercase tracking-widest text-sm transition-colors"
          >
            &larr; {t("nav.allArticles", "TUTTI GLI ARTICOLI")}
          </Link>

          <div className="absolute top-[55%] md:top-1/2 -translate-y-1/2 left-0 w-full px-6 md:px-[25px] lg:px-20 text-white flex justify-center lg:justify-start mt-8 md:mt-0">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-block bg-[#121212]/60 backdrop-blur-md p-6 md:p-10 rounded-[32px] max-w-4xl text-left"
            >
              {article.tag && article.tag.length > 0 && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.25 }}
                  className="flex gap-2 flex-wrap mb-4"
                >
                  {article.tag.map((tag: string) => (
                    <span
                      key={tag}
                      className="font-['Karla'] font-bold text-xs uppercase tracking-widest text-[#FF4F00] border border-[#FF4F00] rounded-full px-3 py-1.5"
                    >
                      {tag}
                    </span>
                  ))}
                </motion.div>
              )}
              {article.preTitolo && (
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.28 }}
                  className="font-['Karla'] font-bold text-[clamp(14px,1.5vw,20px)] uppercase tracking-wider text-white/80 mb-2"
                >
                  {article.preTitolo}
                </motion.p>
              )}
              <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="heading-hero mb-2 md:mb-4 text-white leading-none uppercase break-normal whitespace-normal"
              >
                {article.titolo}
              </motion.h1>
              {article.sottotitolo && (
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.35 }}
                  className="text-[clamp(16px,2.5vw,28px)] font-medium max-w-lg md:max-w-2xl leading-snug uppercase text-white/90 mb-4 md:mb-6"
                >
                  {article.sottotitolo}
                </motion.p>
              )}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="flex flex-wrap items-center gap-2 md:gap-4 text-white/90 border-l-4 border-[#FF4F00] pl-4"
              >
                <span className="font-bold uppercase tracking-widest text-sm md:text-base">
                  {article.autore ? `${t("article.by", "A cura di")} ${article.autore}` : t("article.editorial", "Redazione")}
                </span>
              </motion.div>
            </motion.div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-[950px] mx-auto px-4 md:px-[25px] mt-16 md:mt-24 w-full flex flex-col min-w-0"
        >
          <div
            className={clsx(
              "w-full bg-[#F8F6F3] p-[20px] md:p-[25px] rounded-[24px] md:rounded-[32px] border border-[#EAE3D9] shadow-sm mb-12 block min-w-0 overflow-x-hidden",
            )}
          >
            {article.videoEmbeds && article.videoEmbeds.length > 0 && (
              <div className="space-y-8 w-full">
                {article.videoEmbeds.map((url: string, index: number) => (
                  <VideoEmbed key={index} url={url} />
                ))}
              </div>
            )}
            
            <div
              className="prose max-w-none w-full mx-auto break-words whitespace-pre-wrap prose-p:my-2 prose-p:leading-[1.4] prose-headings:my-4 prose-img:my-4 font-['Karla'] text-xl leading-[1.4] text-[#121212]"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(
                  cleanHtml((getLocalizedField(article, 'contenuto', lang) || article.contenuto || "").replace(/<p>\s*<\/p>/gi, "<p><br></p>")),
                  {
                    ADD_TAGS: ["iframe"],
                    ADD_ATTR: [
                      "allow",
                      "allowfullscreen",
                      "frameborder",
                      "scrolling",
                      "target"
                    ],
                  },
                ),
              }}
            />
          </div>

          {article.galleria && article.galleria.length > 0 && (
            <div className="mt-12 mb-16">
              <h3 className="text-2xl font-['Shamgod'] uppercase tracking-widest mb-8 text-[#121212]">
                Galleria
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {article.galleria
                  .filter((url: string) => url && url.trim() !== "")
                  .map((url: string, index: number) => (
                    <div
                      key={index}
                      className="rounded-3xl overflow-hidden border border-[#EAE3D9] shadow-md aspect-square md:aspect-video"
                    >
                      <LazyImage
                        src={url}
                        alt={`${article.titolo} - ${index}`}
                      />
                    </div>
                  ))}
              </div>
            </div>
          )}

          {relatedArticles.length > 0 && (
            <div className="mt-12 md:mt-16">
              <h3 className="font-['Shamgod'] text-[50px] md:text-[75px] leading-[0.9] uppercase mb-8 md:mb-10 text-[#121212]">
                {lang === 'EN' ? 'You might also read...' : 'Puoi leggere anche...'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-[15px] md:gap-[25px]">
                {relatedArticles.map((relArticle: any, i) => (
                  <Link
                    key={i}
                    to={`/magazine/${relArticle.slug || relArticle.id}`}
                    className="group cursor-pointer flex flex-col gap-4"
                  >
                    <div
                      className={clsx(
                        "aspect-[4/3] bg-[#2A2A2A] overflow-hidden",
                        IMAGE_RADIUS.MD,
                      )}
                    >
                      {relArticle.img && (
                        <LazyImage
                          src={relArticle.img}
                          alt={relArticle.title}
                          className="group-hover:scale-105 transition-transform duration-700"
                        />
                      )}
                    </div>
                    <div className="flex flex-col flex-1 px-2 md:px-0">
                      {(getLocalizedField(relArticle, "preTitolo", lang) ||
                        relArticle.preTitolo) && (
                        <p className="font-['Karla'] font-bold text-[12px] md:text-[14px] uppercase tracking-widest text-[#FF4F00] mb-2 leading-none">
                          {getLocalizedField(relArticle, "preTitolo", lang) ||
                            relArticle.preTitolo}
                        </p>
                      )}
                      <h3 className="font-['Shamgod'] uppercase text-[#121212] group-hover:text-[#FF4F00] transition-colors leading-[0.9] text-[30px] md:text-[40px] mb-2 md:mb-4">
                        {getLocalizedField(relArticle, "titolo", lang) ||
                          getLocalizedField(relArticle, "title", lang) ||
                          relArticle.title}
                      </h3>
                      {(getLocalizedField(relArticle, "sottotitolo", lang) ||
                        relArticle.sottotitolo ||
                        relArticle.sommario) && (
                        <p className="font-['Karla'] text-[#121212] opacity-80 leading-[1.35] text-base md:text-lg line-clamp-3">
                          {getLocalizedField(relArticle, "sottotitolo", lang) ||
                            relArticle.sottotitolo ||
                            relArticle.sommario}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </PublicLayout>
  );
}
