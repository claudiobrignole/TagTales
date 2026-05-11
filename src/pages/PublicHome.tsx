import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Globe,
  ArrowRight,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
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
import {
  collection,
  query,
  where,
  getDocs,
  limit,
  orderBy,
  doc,
  getDoc,
} from "firebase/firestore";
import { getLocalizedField } from "../utils/localization";
import { cleanHtml } from "../utils/cleanHtml";
import { IMAGE_RADIUS } from "../constants/theme";
import PublicLayout from "../components/PublicLayout";
import SEO from "../components/SEO";
import VideoEmbed from "../components/VideoEmbed";

interface Exhibition {
  id: string;
  title: string;
  subtitle: string;
  img: string;
  link: string;
  buttonText: string;
  owner: string;
  featured?: boolean;
  order?: number;
  published?: boolean;
}

interface Writer {
  id: string;
  name: string;
  nation: string;
  img: string;
  order?: number;
  published?: boolean;
}

interface Article {
  id: string;
  title: string;
  img: string;
  published?: boolean;
}

const mockFeaturedExhibitions = [
  {
    id: "mock1",
    img: "https://images.unsplash.com/photo-1541818276538-3e4b78971af1?auto=format&fit=crop&q=80",
    image:
      "https://images.unsplash.com/photo-1541818276538-3e4b78971af1?auto=format&fit=crop&q=80",
    title: "TAG TALES",
    subtitle: "Every writer's story begins with a tag.",
    description:
      "ShaOne, primo writer italiano dal 1983 ritorna su Aelle - Tag Tales con la sua prima opera apparsa nel 1993 sulle pagine della rivista.",
    link: "/exhibitions/shaone",
    buttonText: "VISITA LA MOSTRA",
    owner: "SHAONE",
  },
];

const AccordionItem: React.FC<{ item: any; isBlack: boolean }> = ({
  item,
  isBlack,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { i18n } = useTranslation();
  return (
    <div
      className={clsx(
        "border-b last:border-0 overflow-hidden",
        isBlack ? "border-white/10" : "border-[#EAE3D9]",
      )}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-6 flex justify-between items-center text-left hover:text-[#FF4F00] transition-colors"
      >
        <span className="text-xl md:text-2xl font-bold font-['Karla'] leading-tight pr-8 uppercase tracking-widest">
          {getLocalizedField(item, "title", i18n.language) || item.title}
        </span>
        {isOpen ? (
          <ChevronUp size={24} className="shrink-0" />
        ) : (
          <ChevronDown size={24} className="shrink-0" />
        )}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div
              className={clsx(
                "pb-8 prose max-w-none w-full mx-auto break-words whitespace-pre-wrap prose-p:my-2 prose-p:leading-relaxed font-['Karla'] text-inherit",
                isBlack ? "prose-invert text-white/70" : "text-[#59554E]",
              )}
              dangerouslySetInnerHTML={{
                __html: cleanHtml(
                  getLocalizedField(item, "content", i18n.language) ||
                    item.content,
                ),
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const HomeContactForm: React.FC<{ block: any }> = ({ block }) => {
  const { i18n } = useTranslation();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
    gdpr: false,
  });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.gdpr) {
      alert("Devi accettare l'informativa sulla privacy.");
      return;
    }
    const to = atob("dGFndGFsZXNAYnJpZ25vbGUuY2g=");
    const subject = `Nuovo messaggio da ${formData.name}`;
    const body = `Nome: ${formData.name}\nEmail: ${formData.email}\n\nMessaggio:\n${formData.message}`;
    window.location.href = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setSent(true);
  };

  return (
    <section
      className={clsx(
        "py-20 px-[25px]",
        block.backgroundColor === "black"
          ? "bg-[#121212] text-white"
          : "bg-[#F2EEE8] text-[#121212]",
      )}
    >
      <div className="max-w-xl mx-auto bg-white/5 backdrop-blur-sm p-8 md:p-12 rounded-[40px] border border-white/10 shadow-2xl">
        <h3 className="text-3xl md:text-5xl font-['Shamgod'] uppercase mb-4 md:mb-6 tracking-widest leading-none">
          {getLocalizedField(block, "title", i18n.language) ||
            block.title ||
            "Contattaci"}
        </h3>
        {((block.text && block.text !== "<p><br></p>") ||
          (block.text_en && block.text_en !== "<p><br></p>")) && (
          <div
            className="prose max-w-none w-full mx-auto break-words whitespace-pre-wrap prose-p:my-2 prose-p:leading-relaxed font-['Karla'] text-inherit mb-8"
            dangerouslySetInnerHTML={{
              __html: cleanHtml(
                getLocalizedField(block, "text", i18n.language) || block.text,
              ),
            }}
          />
        )}
        {sent ? (
          <div className="text-center py-12 space-y-4">
            <div className="w-16 h-16 bg-[#FF4F00] rounded-full flex items-center justify-center mx-auto text-white">
              <ChevronDown size={32} className="-rotate-90" />
            </div>
            <p className="font-['Karla'] text-xl font-bold uppercase">
              Messaggio inoltrato!
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60">
                Nome
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full bg-transparent border-b-2 border-[#121212]/10 focus:border-[#FF4F00] py-3 outline-none transition-all font-['Karla'] text-lg"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60">
                Email
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full bg-transparent border-b-2 border-[#121212]/10 focus:border-[#FF4F00] py-3 outline-none transition-all font-['Karla'] text-lg"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60">
                Messaggio
              </label>
              <textarea
                required
                rows={4}
                value={formData.message}
                onChange={(e) =>
                  setFormData({ ...formData, message: e.target.value })
                }
                className="w-full bg-transparent border-b-2 border-[#121212]/10 focus:border-[#FF4F00] py-3 outline-none transition-all font-['Karla'] text-lg resize-none"
              />
            </div>
            <div className="flex items-start gap-4">
              <input
                type="checkbox"
                id="gdpr-h"
                required
                checked={formData.gdpr}
                onChange={(e) =>
                  setFormData({ ...formData, gdpr: e.target.checked })
                }
                className="mt-1 accent-[#FF4F00] w-5 h-5 cursor-pointer"
              />
              <label
                htmlFor="gdpr-h"
                className="text-sm opacity-60 cursor-pointer text-left"
              >
                Accetto il trattamento dei dati.
              </label>
            </div>
            <button
              type="submit"
              className="w-full bg-[#121212] hover:bg-[#FF4F00] text-white py-5 rounded-full font-bold uppercase tracking-[0.2em] text-xs transition-all"
            >
              Invia
            </button>
          </form>
        )}
      </div>
    </section>
  );
};

export default function PublicHome() {
  const { t, i18n } = useTranslation();
  const { language: lang } = useI18n();

  const [featuredExhibitions, setFeaturedExhibitions] = useState<Exhibition[]>(
    [],
  );
  const [mostre, setMostre] = useState<Exhibition[]>([]);
  const [writers, setWriters] = useState<Writer[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [pageData, setPageData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Page Config
        const pageDoc = await getDoc(doc(db, "pagine", "home"));
        if (pageDoc.exists()) {
          setPageData(pageDoc.data());
          setBlocks(pageDoc.data().blocks || []);
        } else {
          // Default blocks if none exist
          setBlocks([
            { id: "h1", type: "home_section", sectionId: "hero" },
            { id: "h2", type: "home_section", sectionId: "magazine" },
            { id: "h3", type: "home_section", sectionId: "mostre" },
            { id: "h4", type: "home_section", sectionId: "writers" },
            { id: "h5", type: "home_section", sectionId: "newsletter" },
          ]);
        }

        const isPublished = (data: any) => {
          if (data.published === false || data.isPublished === false)
            return false;
          return true;
        };

        const snapshotWriters = await getDocs(collection(db, "scrittori"));
        const writersMap: Record<string, string> = {};
        const writersData = snapshotWriters.docs
          .map((doc) => {
            const data = doc.data();
            const nickname = data.nickname || data.artistName || "Writer";
            writersMap[doc.id] = nickname;
            return {
              id: doc.id,
              ...data,
              name: nickname,
              nation: data.paese || data.country || "",
              img: data.fotoProfilo || data.profileImageUrl,
            };
          })
          .filter(isPublished) as any[];

        const sortedWriters = writersData.sort(
          (a, b) => (a.order ?? 999) - (b.order ?? 999),
        );
        setWriters(sortedWriters.slice(0, 8));

        const snapshotExhibitions = await getDocs(collection(db, "mostre"));
        const exhibitionsData = snapshotExhibitions.docs
          .map((doc) => {
            const data = doc.data();
            const artistaId =
              data.artistaIds?.[0] ||
              data.artistaPrincipaleId ||
              data.writerIds?.[0];
            return {
              id: doc.id,
              ...data,
              subtitle: data.intro || data.sottotitolo || data.subtitle || "",
              description:
                data.testoCuratela ||
                data.descrizione ||
                data.description ||
                "",
              image: data.bannerHero || data.coverImageUrl,
              img: data.bannerHero || data.coverImageUrl,
              title: data.titolo || data.title,
              owner: artistaId ? writersMap[artistaId] || "MOSTRA" : "MOSTRA",
              link: `/exhibitions/${data.slug || doc.id}`,
              buttonText: "VISITA LA MOSTRA", // handled via getLoc or translation
            };
          })
          .filter(isPublished) as any[];

        const sortedExhibitions = exhibitionsData.sort(
          (a, b) => (a.order ?? 999) - (b.order ?? 999),
        );

        const featured = sortedExhibitions.filter(
          (e) => e.featured || e.isFeatured,
        );
        setFeaturedExhibitions(
          featured.length > 0 ? featured : mockFeaturedExhibitions,
        );
        setMostre(sortedExhibitions.slice(0, 6));

        const snapshotArticles = await getDocs(collection(db, "articoli"));
        const articlesData = snapshotArticles.docs
          .map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              img: data.immagineCopertina || data.coverImageUrl,
              title: data.titolo || data.title,
              tag: data.tag?.[0] || data.tags?.[0] || "ARTICOLO",
            };
          })
          .filter(isPublished) as any[];

        const sortedArticles = articlesData.sort(
          (a, b) => (a.order ?? 999) - (b.order ?? 999),
        );
        setArticles(sortedArticles.slice(0, 6));

        setLoading(false);
      } catch (error) {
        console.error("Error fetching homepage data:", error);
        setFeaturedExhibitions(mockFeaturedExhibitions);
        setLoading(false);
      }
    };

    fetchData();
  }, [t]);

  useEffect(() => {
    if (featuredExhibitions.length === 0) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % featuredExhibitions.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [featuredExhibitions]);

  const nextSlide = () =>
    setCurrentSlide((prev) => (prev + 1) % featuredExhibitions.length);
  const prevSlide = () =>
    setCurrentSlide(
      (prev) =>
        (prev - 1 + featuredExhibitions.length) % featuredExhibitions.length,
    );

  const renderSection = (sectionId: string) => {
    switch (sectionId) {
      case "hero":
        return (
          <div
            key="hero"
            className="relative h-[100svh] w-full overflow-hidden bg-[#121212] group"
          >
            {featuredExhibitions.length > 0 ? (
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlide}
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8 }}
                  className="absolute inset-0"
                >
                  {featuredExhibitions[currentSlide] &&
                    (featuredExhibitions[currentSlide] as any).image && (
                      <img
                        src={(featuredExhibitions[currentSlide] as any).image}
                        alt={featuredExhibitions[currentSlide].title}
                        className="w-full h-full object-cover opacity-80"
                      />
                    )}
                  <div className="absolute top-[55%] md:top-1/2 -translate-y-1/2 left-0 w-full px-6 md:px-[25px] lg:px-20 text-white flex justify-center lg:justify-start">
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="inline-block bg-[#121212]/60 backdrop-blur-md p-6 md:p-10 rounded-[32px] max-w-4xl text-left"
                    >
                      <motion.p className="font-['Karla'] font-bold text-[clamp(16px,2.5vw,28px)] uppercase tracking-widest text-[#FF4F00] mb-2">
                        {featuredExhibitions[currentSlide].owner}
                      </motion.p>
                      <motion.h1 className="heading-hero mb-2 md:mb-6 text-white leading-none uppercase">
                        {getLocalizedField(
                          featuredExhibitions[currentSlide],
                          "titolo",
                          lang,
                        ) ||
                          getLocalizedField(
                            featuredExhibitions[currentSlide],
                            "title",
                            lang,
                          ) ||
                          featuredExhibitions[currentSlide].title}
                      </motion.h1>
                      <motion.p className="text-[clamp(16px,2.5vw,28px)] font-medium mb-6 md:mb-12 max-w-lg md:max-w-2xl leading-snug">
                        {getLocalizedField(
                          featuredExhibitions[currentSlide],
                          "intro",
                          lang,
                        ) ||
                          getLocalizedField(
                            featuredExhibitions[currentSlide],
                            "sottotitolo",
                            lang,
                          ) ||
                          featuredExhibitions[currentSlide].subtitle}
                      </motion.p>
                      <motion.div className="flex flex-col items-start">
                        <Link
                          to={featuredExhibitions[currentSlide].link}
                          className="inline-flex items-center gap-4 btn-text bg-[#FF4F00] text-white py-4 px-10 rounded-full hover:bg-white hover:text-[#121212] transition-colors uppercase"
                        >
                          {t("home.visitExhibition", "VISITA LA MOSTRA")}
                          <ArrowRight size={24} />
                        </Link>
                      </motion.div>
                    </motion.div>
                  </div>
                </motion.div>
              </AnimatePresence>
            ) : (
              <div className="flex items-center justify-center h-full text-white">
                <p className="font-['Shamgod'] text-4xl">CARICAMENTO...</p>
              </div>
            )}
            <div className="absolute bottom-10 right-10 flex gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={prevSlide}
                className="p-4 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white transition-colors"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                onClick={nextSlide}
                className="p-4 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white transition-colors"
              >
                <ChevronRight size={24} />
              </button>
            </div>
          </div>
        );
      case "mostre":
        return (
          <section
            key="mostre"
            className="bg-[#121212] text-white pt-32 pb-32 px-[25px] md:px-[25px] w-full relative"
          >
            <div className="flex justify-between items-end mb-16">
              <h2 className="heading-hero text-white uppercase">
                {t("nav.mostre", "MOSTRE")}
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[15px] md:gap-[25px]">
              {mostre.map((item: any, i) => (
                <Link
                  key={i}
                  to={`/exhibitions/${item.slug || item.id}`}
                  className="group cursor-pointer"
                >
                  <div className="aspect-square bg-[#2A2A2A] rounded-2xl overflow-hidden relative">
                    {item.img && (
                      <img
                        src={item.img}
                        alt={item.title}
                        className="w-full h-full object-cover grayscale transition-all duration-700 group-hover:grayscale-0 group-hover:scale-105"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-transparent opacity-80" />
                    <div className="absolute bottom-6 left-6 pr-6 text-white">
                      <p className="font-['Karla'] font-bold text-lg tracking-widest text-[#FF4F00] uppercase mb-2">
                        {item.owner}
                      </p>
                      <h3 className="heading-h3 leading-none group-hover:text-[#FF4F00] transition-colors uppercase">
                        {getLocalizedField(item, "titolo", lang) ||
                          getLocalizedField(item, "title", lang) ||
                          item.title}
                      </h3>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <div className="mt-20 flex justify-center w-full">
              <Link
                to="/mostre"
                className="inline-flex items-center gap-4 btn-text bg-[#FF4F00] text-white py-4 px-10 rounded-full hover:bg-white hover:text-[#121212] transition-colors uppercase"
              >
                {t("home.allExhibitions", "TUTTE LE MOSTRE")}{" "}
                <ArrowRight size={24} />
              </Link>
            </div>
          </section>
        );
      case "magazine":
        return (
          <section
            key="magazine"
            className="bg-[#121212] text-white pt-24 pb-20 px-[25px] md:px-[25px] w-full relative"
          >
            <h2 className="heading-hero text-[#FF4F00] mb-16 uppercase">
              {t("nav.magazine", "MAGAZINE")}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[15px] md:gap-[25px]">
              {articles.map((article: any, i) => (
                <Link
                  key={i}
                  to={`/magazine/${article.slug || article.id}`}
                  className="group cursor-pointer flex flex-col gap-4"
                >
                  <div
                    className={clsx(
                      "aspect-[4/3] bg-[#2A2A2A] overflow-hidden",
                      IMAGE_RADIUS.MD,
                    )}
                  >
                    {article.img && (
                      <img
                        src={article.img}
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
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
                    <h3 className="font-['Shamgod'] uppercase text-white group-hover:text-[#FF4F00] transition-colors leading-[0.9] text-[40px] md:text-[50px] mb-2 md:mb-4">
                      {getLocalizedField(article, "titolo", lang) ||
                        getLocalizedField(article, "title", lang) ||
                        article.title}
                    </h3>
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
                </Link>
              ))}
            </div>
            <div className="mt-20 flex justify-center w-full">
              <Link
                to="/magazine"
                className="inline-flex items-center gap-4 btn-text bg-[#FF4F00] text-white py-4 px-10 rounded-full hover:bg-white hover:text-[#121212] transition-colors uppercase"
              >
                {t("home.allArticles", "TUTTI GLI ARTICOLI")}{" "}
                <ArrowRight size={24} />
              </Link>
            </div>
          </section>
        );
      case "writers":
        return (
          <section
            key="writers"
            className="px-[25px] md:px-[25px] pt-32 pb-32 relative z-20"
          >
            <h2 className="heading-hero text-[#121212] mb-16 uppercase">
              {t("nav.writers", "WRITERS")}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-[15px] md:gap-[25px]">
              {writers.map((writer: any, i) => (
                <Link
                  key={i}
                  to={`/writers/${writer.slug || writer.id}`}
                  className="group cursor-pointer"
                >
                  <div className="aspect-square bg-white rounded-2xl overflow-hidden relative border border-[#EAE3D9]">
                    {writer.img && (
                      <img
                        src={writer.img}
                        alt={writer.name}
                        className="w-full h-full object-cover opacity-80 mix-blend-luminosity group-hover:mix-blend-normal group-hover:scale-105 transition-all duration-700"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-transparent opacity-60" />
                    <div className="absolute bottom-6 left-6 pr-6 text-white">
                      <p className="font-bold text-sm tracking-widest text-[#FF4F00] uppercase mb-2">
                        {writer.nation}
                      </p>
                      <h3 className="heading-h3 leading-none group-hover:text-[#FF4F00] transition-colors text-white mb-2 uppercase">
                        {getLocalizedField(writer, "nickname", lang) ||
                          getLocalizedField(writer, "artistName", lang) ||
                          writer.name}
                      </h3>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <div className="mt-20 flex justify-center w-full">
              <Link
                to="/writers"
                className="inline-flex items-center gap-4 btn-text bg-[#FF4F00] text-white py-4 px-10 rounded-full hover:bg-white hover:text-[#121212] transition-colors uppercase"
              >
                {t("home.allWriters", "TUTTI I WRITERS")}{" "}
                <ArrowRight size={24} />
              </Link>
            </div>
          </section>
        );
      case "newsletter":
        return (
          <section
            key="newsletter"
            className="bg-[#F2EEE8] text-[#121212] pb-32 z-20 relative overflow-hidden"
          >
            <div className="bg-[#FF4F00] text-white py-6 mb-6 w-[110%] -ml-[5%] flex overflow-hidden whitespace-nowrap">
              <motion.div
                className="flex items-center shrink-0 gap-8"
                animate={{ x: ["0%", "-50%"] }}
                transition={{
                  repeat: Infinity,
                  ease: "linear",
                  duration: 20,
                  repeatType: "loop",
                }}
              >
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center shrink-0">
                    <span className="heading-h2 whitespace-nowrap text-white uppercase">
                      {t(
                        "home.newsletterTitle",
                        "ISCRIVITI ALLA LISTA PRIORITARIA",
                      )}
                    </span>
                    <span className="heading-h2 text-white/50 ml-8">•</span>
                  </div>
                ))}
              </motion.div>
            </div>
            <div className="max-w-4xl mx-auto flex flex-col items-center text-center px-[25px]">
              <p className="body-text mb-12 max-w-xl">
                {t(
                  "home.newsletterSubtitle",
                  "Entra a far parte della nostra community...",
                )}
              </p>
              <div className="w-full max-w-lg text-left">
                <form
                  method="post"
                  action="https://sendfox.com/form/m5egn8/mnkywx"
                  className="sendfox-form flex flex-col gap-6"
                  id="mnkywx"
                  data-async="true"
                  data-recaptcha="true"
                >
                  <input
                    type="text"
                    name="first_name"
                    required
                    className="w-full bg-transparent border-b-2 border-[#121212]/20 focus:border-[#FF4F00] py-3 outline-none"
                    placeholder={t("home.newsletterName", "Nome")}
                  />
                  <input
                    type="email"
                    name="email"
                    required
                    className="w-full bg-transparent border-b-2 border-[#121212]/20 focus:border-[#FF4F00] py-3 outline-none"
                    placeholder={t("home.newsletterEmail", "Email")}
                  />
                  <div className="flex items-start gap-4 mt-4">
                    <input
                      type="checkbox"
                      id="sendfox_gdpr"
                      name="gdpr"
                      value="1"
                      required
                      className="mt-1 w-5 h-5 accent-[#FF4F00]"
                    />
                    <label
                      htmlFor="sendfox_gdpr"
                      className="body-text text-base"
                    >
                      {t(
                        "home.newsletterPrivacy",
                        "Accetto di ricevere aggiornamenti e promozioni via e-mail.",
                      )}
                    </label>
                  </div>
                  <div
                    style={{ position: "absolute", left: "-5000px" }}
                    aria-hidden="true"
                  >
                    <input
                      type="text"
                      name="a_password"
                      tabIndex={-1}
                      defaultValue=""
                      autoComplete="off"
                    />
                  </div>
                  <button
                    type="submit"
                    className="mt-8 inline-flex items-center gap-4 btn-text bg-[#121212] text-white py-4 px-12 rounded-full hover:bg-[#FF4F00] transition-colors uppercase cursor-pointer"
                  >
                    {t("home.newsletterBtn", "Iscriviti")}{" "}
                    <ArrowRight size={24} />
                  </button>
                </form>
              </div>
            </div>
          </section>
        );
      default:
        return null;
    }
  };

  const renderBlock = (block: any) => {
    switch (block.type) {
      case "home_section":
        return renderSection(block.sectionId);
      case "text":
        return (
          <section
            key={block.id}
            className={clsx(
              "py-32 px-[25px] flex justify-center text-center",
              block.backgroundColor === "black"
                ? "bg-[#121212] text-white"
                : "bg-[#F8F6F3] text-[#121212]",
            )}
          >
            <div className="max-w-4xl w-full mx-auto min-w-0">
              <div
                className="prose max-w-none w-full mx-auto break-words whitespace-pre-wrap prose-p:my-2 prose-p:leading-relaxed font-['Karla'] italic text-3xl md:text-5xl leading-tight text-inherit"
                dangerouslySetInnerHTML={{
                  __html: cleanHtml(
                    getLocalizedField(block, "text", lang) || block.text,
                  ),
                }}
              />
            </div>
          </section>
        );
      case "large_title":
        return (
          <section
            key={block.id}
            className={clsx(
              "py-20 md:py-32 px-6",
              block.backgroundColor === "black"
                ? "bg-[#121212] text-white"
                : "bg-[#F2EEE8] text-[#121212]",
            )}
          >
            <h2 className="text-[10vw] md:text-[150px] lg:text-[200px] font-['Shamgod'] uppercase leading-[0.8] text-center w-full break-words">
              {getLocalizedField(block, "text", lang) || block.text}
            </h2>
          </section>
        );
      case "paragraph":
        return (
          <section
            key={block.id}
            className={clsx(
              "py-32 px-[25px]",
              block.backgroundColor === "black"
                ? "bg-[#121212] text-white"
                : "bg-white text-[#121212]",
            )}
          >
            <div className="max-w-4xl mx-auto w-full min-w-0">
              <div
                className="prose max-w-none w-full mx-auto break-words whitespace-pre-wrap prose-p:my-2 prose-p:leading-relaxed font-['Karla'] text-inherit !text-xl md:!text-2xl opacity-80"
                dangerouslySetInnerHTML={{
                  __html: cleanHtml(
                    getLocalizedField(block, "text", lang) || block.text,
                  ),
                }}
              />
            </div>
          </section>
        );
      case "text_with_image_half":
        return (
          <section
            key={block.id}
            className={clsx(
              "py-32 px-[25px]",
              block.backgroundColor === "black"
                ? "bg-[#121212] text-white"
                : "bg-[#F2EEE8] text-[#121212]",
            )}
          >
            <div
              className={clsx(
                "max-w-7xl mx-auto flex flex-col gap-8 md:gap-16 items-center",
                block.imagePosition === "right"
                  ? "md:flex-row-reverse"
                  : "md:flex-row",
              )}
            >
              <div className="w-full md:w-1/2 space-y-6 min-w-0">
                {(getLocalizedField(block, "title", lang) || block.title) && (
                  <h3 className="font-['Shamgod'] text-[40px] md:text-[60px] leading-[0.9] uppercase">
                    {getLocalizedField(block, "title", lang) || block.title}
                  </h3>
                )}
                <div
                  className="prose max-w-none w-full mx-auto break-words whitespace-pre-wrap prose-p:my-2 prose-p:leading-relaxed font-['Karla'] text-inherit !text-xl leading-[1.35]"
                  dangerouslySetInnerHTML={{
                    __html: cleanHtml(
                      getLocalizedField(block, "text", lang) || block.text,
                    ),
                  }}
                />
              </div>
              <div className="w-full md:w-1/2 min-w-0">
                {block.images?.[0]?.url && (
                  <img
                    src={block.images[0].url}
                    alt=""
                    className="w-full h-auto object-cover rounded-3xl"
                  />
                )}
              </div>
            </div>
          </section>
        );
      case "image_width_paragraph":
        return (
          <section
            key={block.id}
            className={clsx(
              "py-32 px-[25px]",
              block.backgroundColor === "black"
                ? "bg-[#121212] text-white"
                : "bg-[#F2EEE8] text-[#121212]",
            )}
          >
            <div className="max-w-4xl mx-auto">
              {block.images?.[0]?.url && (
                <img
                  src={block.images[0].url}
                  alt=""
                  className="w-full h-auto object-cover rounded-3xl"
                />
              )}
            </div>
          </section>
        );
      case "image_fullscreen":
        return (
          <section
            key={block.id}
            className={clsx(
              "w-full h-[80vh] overflow-hidden",
              block.backgroundColor === "black" ? "bg-[#121212]" : "bg-white",
            )}
          >
            <img
              src={block.images[0]?.url}
              alt=""
              className="w-full h-full object-cover"
            />
          </section>
        );
      case "video_embed":
        return (
          <section
            key={block.id}
            className={clsx(
              "py-20 px-[25px]",
              block.backgroundColor === "black" ? "bg-[#121212]" : "bg-white",
            )}
          >
            <div className="max-w-7xl mx-auto">
              <VideoEmbed url={block.videoUrl} />
            </div>
          </section>
        );
      case "images_side_by_side_aligned":
        return (
          <section
            key={block.id}
            className={clsx(
              "py-20 px-[25px]",
              block.backgroundColor === "black" ? "bg-[#121212]" : "bg-white",
            )}
          >
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
              {block.images.map((img: any, idx: number) => (
                <img
                  key={idx}
                  src={img.url}
                  alt=""
                  className="w-full aspect-[4/5] object-cover rounded-2xl"
                />
              ))}
            </div>
          </section>
        );
      case "accordion":
        return (
          <section
            key={block.id}
            className={clsx(
              "py-20 px-[25px]",
              block.backgroundColor === "black"
                ? "bg-[#121212] text-white"
                : "bg-white text-[#121212]",
            )}
          >
            <div className="max-w-4xl mx-auto space-y-4">
              {block.accordionItems?.map((item: any, idx: number) => (
                <AccordionItem
                  key={idx}
                  item={item}
                  isBlack={block.backgroundColor === "black"}
                />
              ))}
            </div>
          </section>
        );
      case "contact_form":
        return <HomeContactForm block={block} key={block.id} />;
      default:
        return null;
    }
  };

  return (
    <PublicLayout>
      <SEO
        title={
          pageData
            ? getLocalizedField(pageData, "titolo", lang) ||
              pageData.title ||
              t("home.title", "TagTales")
            : t("home.title", "TagTales")
        }
        description={
          pageData
            ? getLocalizedField(pageData, "descrizione", lang) ||
              pageData.description ||
              t(
                "home.desc",
                "TagTales - Graffiti Culture, Exhibition and Magazine",
              )
            : t(
                "home.desc",
                "TagTales - Graffiti Culture, Exhibition and Magazine",
              )
        }
      />
      {loading ? (
        <div className="h-screen flex items-center justify-center font-['Shamgod'] text-4xl">
          CARICAMENTO...
        </div>
      ) : (
        <div className="flex flex-col">
          {blocks.map((block, i) => (
            <React.Fragment key={block.id || i}>
              {renderBlock(block)}
            </React.Fragment>
          ))}
        </div>
      )}
    </PublicLayout>
  );
}
