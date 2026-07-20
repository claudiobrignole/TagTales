import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { doc, getDoc, collection, query, where, limit, getDocs } from 'firebase/firestore';
import PublicLayout from '../components/PublicLayout';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { sendEmailNotification } from '../utils/emailService';
import clsx from 'clsx';
import VideoEmbed from '../components/VideoEmbed';
import { getLocalizedField } from '../utils/localization';
import { cleanHtml } from '../utils/cleanHtml';
import SEO from '../components/SEO';
import LazyImage from '../components/LazyImage';

interface PageData {
  titolo: string;
  contenuto?: string;
  blocks?: any[];
  [key: string]: any;
}


const ContactFormBlock: React.FC<{ block: any }> = ({ block }) => {
  const { t, i18n } = useTranslation();
  const [formData, setFormData] = useState({ name: '', email: '', message: '', gdpr: false });
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.gdpr) {
      alert(t('contactForm.gdprAlert', "Devi accettare l'informativa sulla privacy."));
      return;
    }
    
    setSubmitting(true);
    try {
      await sendEmailNotification(
        'claudio@brignole.ch', 
        'public_contact_message', 
        {
          name: formData.name,
          email: formData.email,
          message: formData.message
        }, 
        i18n.language.toLowerCase()
      );
      setSent(true);
    } catch (err) {
      console.error('Error sending contact message email:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className={clsx("py-20 px-6", block.backgroundColor === 'black' ? "bg-[#121212] text-white" : "bg-[#F2EEE8] text-[#121212]")}>
      <div className="max-w-xl mx-auto bg-white/5 backdrop-blur-sm p-8 md:p-12 rounded-[40px] border border-white/10 shadow-2xl">
        <h3 className="text-3xl md:text-5xl font-['Shamgod'] uppercase mb-4 md:mb-6 tracking-widest leading-none">
          {getLocalizedField(block, 'title', i18n.language) || block.title || t('contactForm.sendMessage', 'Inviaci un messaggio')}
        </h3>
        {((block.text && block.text !== '<p><br></p>') || (block.text_en && block.text_en !== '<p><br></p>')) && (
          <div className={clsx("prose max-w-none w-full mx-auto break-words whitespace-pre-wrap prose-p:my-2 prose-p:leading-[1.4] prose-headings:my-4 prose-img:my-4 font-['Karla'] text-inherit mb-8", block.backgroundColor === 'black' ? 'prose-invert text-white' : '')} dangerouslySetInnerHTML={{ __html: cleanHtml(getLocalizedField(block, 'text', i18n.language) || block.text) }} />
        )}
        
        {sent ? (
          <div className="text-center py-12 space-y-4">
             <div className="w-16 h-16 bg-[#FF4F00] rounded-full flex items-center justify-center mx-auto text-white">
                <ChevronDown size={32} className="-rotate-90" />
             </div>
             <p className="font-['Karla'] text-xl font-bold uppercase">{t('contactForm.sent', 'Messaggio inoltrato!')}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60">{t('contactForm.name', 'Nome')}</label>
              <input 
                type="text" required 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full bg-[#121212]/5 border-b-2 border-[#121212]/10 focus:border-[#FF4F00] py-3 px-1 outline-none transition-all font-['Karla'] text-lg" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60">{t('contactForm.email', 'Email')}</label>
              <input 
                type="email" required 
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                className="w-full bg-[#121212]/5 border-b-2 border-[#121212]/10 focus:border-[#FF4F00] py-3 px-1 outline-none transition-all font-['Karla'] text-lg" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60">{t('contactForm.message', 'Messaggio')}</label>
              <textarea 
                required rows={4}
                value={formData.message}
                onChange={e => setFormData({...formData, message: e.target.value})}
                className="w-full bg-[#121212]/5 border-b-2 border-[#121212]/10 focus:border-[#FF4F00] py-3 px-1 outline-none transition-all font-['Karla'] text-lg resize-none" 
              />
            </div>
            <div className="flex items-start gap-4">
              <input 
                type="checkbox" id="gdpr-p" required 
                checked={formData.gdpr}
                onChange={e => setFormData({...formData, gdpr: e.target.checked})}
                className="mt-1 accent-[#FF4F00] w-5 h-5 cursor-pointer" 
              />
              <label htmlFor="gdpr-p" className="text-sm opacity-60 cursor-pointer">
                {t('contactForm.gdprPage', 'Accetto che i miei dati vengano trattati per rispondere alla mia richiesta, in conformità con la Privacy Policy.')}
              </label>
            </div>
            <button 
              type="submit"
              disabled={submitting}
              className="w-full bg-[#121212] hover:bg-[#FF4F00] text-white py-5 rounded-full font-bold uppercase tracking-[0.2em] text-xs transition-all shadow-xl shadow-[#121212]/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin text-white" />}
              {submitting ? t('contactForm.sending', 'Invio in corso...') : t('contactForm.sendMessage', 'Invia Messaggio')}
            </button>
          </form>
        )}
      </div>
    </section>
  );
};

import { useParams } from 'react-router-dom';

export default function PublicPage({ id: propId }: { id?: string }) {
  const { id: paramId } = useParams();
  const id = propId === 'dynamic' ? paramId || '' : propId || paramId || '';
  const { t, i18n } = useTranslation();
  const lang = i18n.language || 'it';

  const [data, setData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeQA, setActiveQA] = useState<any | null>(null);

  const isVideo = (url?: string) => url ? url.match(/\.(mp4|webm|mov|m4v)(\?.*)?$/i) !== null : false;

  useEffect(() => {
    const fetchPage = async () => {
      try {
        let snap: any = null;

        if (lang === 'EN' || lang === 'en') {
          const qEn = query(collection(db, 'pagine'), where('slug_en', '==', id), limit(1));
          const snapEn = await getDocs(qEn);
          if (!snapEn.empty) {
            snap = snapEn.docs[0];
          }
        }

        if (!snap) {
          const idSnap = await getDoc(doc(db, 'pagine', id));
          if (idSnap.exists()) {
            snap = idSnap;
          }
        }

        if (snap) {
          const raw = snap.data();
          const blocks = raw.blocks || null;
          setData({ ...raw, blocks } as PageData);
        } else {
          setData(null);
        }
      } catch(err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPage();
  }, [id, lang]);

  const renderBlock = (block: any, idx: number) => {
    const isFirst = idx === 0;
    switch (block.type) {
      case 'text':
        return (
          <section key={block.id} className={clsx(`flex justify-center text-center px-6 ${isFirst ? 'pb-20 md:pb-32' : 'py-20 md:py-32'}`, block.backgroundColor === 'black' ? "bg-[#121212] text-white" : "bg-[#F2EEE8] text-[#121212]")}>
            <div className="max-w-4xl w-full mx-auto min-w-0">
              <div className={clsx("prose max-w-none w-full mx-auto break-words whitespace-pre-wrap prose-p:my-2 prose-p:leading-[1.4] prose-headings:my-4 prose-img:my-4 font-['Karla'] italic text-3xl md:text-5xl leading-tight text-inherit", block.backgroundColor === 'black' ? "prose-invert text-white" : "")} dangerouslySetInnerHTML={{ __html: cleanHtml(getLocalizedField(block, 'text', lang) || block.text) }} />
            </div>
          </section>
        );
      case 'large_title':
        return (
          <section key={block.id} className={clsx(`px-6 ${isFirst ? 'pb-20 md:pb-32 pt-28' : 'py-20 md:py-32'}`, block.backgroundColor === 'black' ? "bg-[#121212] text-white" : "bg-[#F2EEE8] text-[#121212]")}>
             <h2 className="text-[18vw] sm:text-[15vw] md:text-[150px] lg:text-[200px] font-['Shamgod'] uppercase leading-[0.8] text-center w-full break-words">
                {getLocalizedField(block, 'text', lang) || block.text}
             </h2>
          </section>
        );
      case 'paragraph':
        return (
          <section key={block.id} className={clsx(`px-6 ${isFirst ? 'pb-12 md:pb-20 pt-28' : 'py-12 md:py-20'}`, block.backgroundColor === 'black' ? "bg-[#121212] text-white" : "bg-[#F2EEE8] text-[#121212]")}>
            <div className="max-w-4xl mx-auto w-full min-w-0">
              <div className={clsx("prose max-w-none w-full mx-auto break-words whitespace-pre-wrap prose-p:my-2 prose-p:leading-[1.4] prose-headings:my-4 prose-img:my-4 font-['Karla'] !text-xl leading-[1.35] text-inherit", block.backgroundColor === 'black' ? "prose-invert text-white" : "")} dangerouslySetInnerHTML={{ __html: cleanHtml(getLocalizedField(block, 'text', lang) || block.text) }} />
            </div>
          </section>
        );
      case 'text_with_image_half': {
        const imageOnRight = block.imagePosition === 'right';
        const mobileBelow = block.mobileImageStack === 'below';
        return (
          <section key={block.id} className={clsx(`px-6 ${isFirst ? 'pb-12 md:pb-20 pt-28' : 'py-12 md:py-20'}`, block.backgroundColor === 'black' ? "bg-[#121212] text-white" : "bg-[#F2EEE8] text-[#121212]")}>
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-8 md:gap-16 items-center md:items-start">
              <div
                className={clsx(
                  "w-full md:w-1/2 space-y-6 min-w-0",
                  mobileBelow ? "order-1" : "order-2",
                  imageOnRight ? "md:order-1" : "md:order-2",
                )}
              >
                {(getLocalizedField(block, 'title', lang) || block.title) && (
                  <h3 className="font-['Shamgod'] text-[50px] md:text-[75px] leading-[0.9] uppercase">
                    {getLocalizedField(block, 'title', lang) || block.title}
                  </h3>
                )}
                <div className={clsx("prose max-w-none w-full mx-auto break-words whitespace-pre-wrap prose-p:my-2 prose-p:leading-[1.4] prose-headings:my-4 prose-img:my-4 font-['Karla'] !text-xl leading-[1.35] text-inherit", block.backgroundColor === 'black' ? "prose-invert text-white" : "")} dangerouslySetInnerHTML={{ __html: cleanHtml(getLocalizedField(block, 'text', lang) || block.text) }} />
              </div>
              <div
                className={clsx(
                  "w-full md:w-1/2 min-w-0",
                  mobileBelow ? "order-2" : "order-1",
                  imageOnRight ? "md:order-2" : "md:order-1",
                )}
              >
                {block.images?.[0]?.url && (
                  isVideo(block.images[0].url) ? (
                    <video src={block.images[0].url} poster={block.images[0].fallbackUrl} autoPlay loop muted playsInline className="w-full h-auto object-cover rounded-3xl" />
                  ) : (
                    <LazyImage
                      src={block.images[0].url}
                      alt=""
                      className="w-full h-auto object-cover rounded-3xl"
                      wrapperClassName="w-full h-auto"
                      loading="lazy"
                      width={600}
                      height={450}
                      style={{ objectFit: "cover" }}
                    />
                  )
                )}
              </div>
            </div>
          </section>
        );
      }
      case 'image_half_centered':
        return (
          <section key={block.id} className={clsx(`px-6 ${isFirst ? 'pb-12 pt-4' : 'py-12'}`, block.backgroundColor === 'black' ? "bg-[#121212]" : "bg-[#F2EEE8]")}>
            <div className="max-w-7xl mx-auto flex justify-center">
              <div className="w-full md:w-1/2 min-w-0">
                {block.images?.[0]?.url && (
                  isVideo(block.images[0].url) ? (
                    <video src={block.images[0].url} poster={block.images[0].fallbackUrl} autoPlay loop muted playsInline className="w-full h-auto object-cover rounded-3xl" />
                  ) : (
                    <LazyImage
                      src={block.images[0].url}
                      alt=""
                      className="w-full h-auto object-cover rounded-3xl"
                      wrapperClassName="w-full h-auto"
                      loading="lazy"
                      width={600}
                      height={450}
                      style={{ objectFit: "cover" }}
                    />
                  )
                )}
              </div>
            </div>
          </section>
        );
      case 'image_width_paragraph':
        return (
          <section key={block.id} className={clsx(`px-6 ${isFirst ? 'pb-12 md:pb-20 pt-28' : 'py-12 md:py-20'}`, block.backgroundColor === 'black' ? "bg-[#121212] text-white" : "bg-[#F2EEE8] text-[#121212]")}>
            <div className="max-w-4xl mx-auto">
              {block.images?.[0]?.url && (
                isVideo(block.images[0].url) ? (
                  <video src={block.images[0].url} poster={block.images[0].fallbackUrl} autoPlay loop muted playsInline className="w-full h-auto object-cover rounded-3xl" />
                ) : (
                  <LazyImage
                    src={block.images[0].url}
                    alt=""
                    className="w-full h-auto object-cover rounded-3xl"
                    wrapperClassName="w-full h-auto"
                    loading="lazy"
                    width={1200}
                    height={675}
                    style={{ objectFit: "cover" }}
                  />
                )
              )}
            </div>
          </section>
        );
      case 'image_fullscreen':
        return (
          <section key={block.id} className={clsx(`w-full overflow-hidden ${isFirst ? 'h-[calc(60vh-65px)] lg:h-[calc(80vh-75px)]' : 'h-[60vh] md:h-[80vh]'}`, block.backgroundColor === 'black' ? "bg-[#121212]" : "bg-[#F2EEE8]")}>
            {isVideo(block.images?.[0]?.url) ? (
              <video src={block.images?.[0]?.url} poster={block.images?.[0]?.fallbackUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
            ) : (
              <LazyImage
                src={block.images?.[0]?.url}
                alt=""
                className="w-full h-full object-cover"
                wrapperClassName="w-full h-full"
                loading="lazy"
                width={1920}
                height={1080}
                style={{ objectFit: "cover" }}
              />
            )}
          </section>
        );
      case 'video_embed':
        return (
          <section key={block.id} className={clsx(`px-6 ${isFirst ? 'pb-12 pt-4' : 'py-12'}`, block.backgroundColor === 'black' ? "bg-[#121212]" : "bg-[#F2EEE8]")}>
             <div className="max-w-7xl mx-auto">
               <VideoEmbed url={block.videoUrl} />
             </div>
          </section>
        );
      case 'images_side_by_side_aligned':
        return (
          <section key={block.id} className={clsx(`px-6 ${isFirst ? 'pb-12 pt-4' : 'py-12'}`, block.backgroundColor === 'black' ? "bg-[#121212]" : "bg-[#F2EEE8]")}>
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
              {block.images?.map((img: any, idx: number) => (
                isVideo(img.url) ? (
                  <video key={idx} src={img.url} poster={img.fallbackUrl} autoPlay loop muted playsInline className="w-full aspect-[4/5] md:aspect-square object-cover object-center rounded-3xl" />
                ) : (
                  <LazyImage
                    key={idx}
                    src={img.url}
                    alt=""
                    className="w-full aspect-[4/5] md:aspect-square object-cover object-center rounded-3xl"
                    wrapperClassName="w-full aspect-[4/5] md:aspect-square"
                    loading="lazy"
                    width={800}
                    height={800}
                    style={{ objectFit: "cover" }}
                  />
                )
              ))}
            </div>
          </section>
        );
      case 'images_grid_4':
        return (
          <section key={block.id} className={clsx(`px-6 ${isFirst ? 'pb-6 pt-4' : 'py-6 md:py-8'}`, block.backgroundColor === 'black' ? "bg-[#121212]" : "bg-[#F2EEE8]")}>
            <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-[15px] md:gap-[25px]">
              {(block.images || []).slice(0, 4).map((img: any, idx: number) => (
                <div key={idx} className="w-full aspect-square overflow-hidden">
                  {img?.url && (isVideo(img.url) ? (
                    <video src={img.url} poster={img.fallbackUrl} autoPlay loop muted playsInline className="w-full h-full object-cover object-center" />
                  ) : (
                    <LazyImage
                      src={img.url}
                      alt=""
                      className="w-full h-full object-cover object-center"
                      wrapperClassName="w-full h-full"
                      loading="lazy"
                      width={600}
                      height={600}
                      style={{ objectFit: "cover" }}
                    />
                  ))}
                </div>
              ))}
            </div>
          </section>
        );
      case 'qa_module':
        return (
          <section key={block.id} className={clsx(`px-6 ${isFirst ? 'pb-20 pt-4' : 'py-20'}`, block.backgroundColor === 'black' ? "bg-[#121212] text-white" : "bg-[#F2EEE8] text-[#121212]")}>
            <div className="max-w-4xl mx-auto space-y-4">
              {block.qa?.map((item: any, idx: number) => (
                <div key={idx} className={clsx("border-b last:border-0 overflow-hidden", block.backgroundColor === 'black' ? "border-white/10" : "border-[#EAE3D9]")}>
                  <button 
                    onClick={() => setActiveQA(activeQA === idx ? null : idx)}
                    className="w-full py-6 flex justify-between items-center text-left hover:text-[#FF4F00] transition-colors"
                  >
                    <span className="text-xl md:text-2xl font-bold font-['Karla'] leading-tight pr-8">{getLocalizedField(item, 'question', lang) || item.question}</span>
                    {activeQA === idx ? <ChevronUp className="shrink-0" /> : <ChevronDown className="shrink-0" />}
                  </button>
                  <AnimatePresence>
                    {activeQA === idx && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className={clsx("pb-8 prose max-w-none w-full mx-auto break-words whitespace-pre-wrap prose-p:my-2 prose-p:leading-[1.4] prose-headings:my-4 prose-img:my-4 font-['Karla'] text-inherit", block.backgroundColor === 'black' ? "prose-invert text-white/70" : "text-[#59554E]")} dangerouslySetInnerHTML={{ __html: cleanHtml(getLocalizedField(item, 'answer', lang) || item.answer) }} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </section>
        );
      case 'accordion':
        return (
          <section key={block.id} className={clsx(`px-6 ${isFirst ? 'pb-20 pt-4' : 'py-20'}`, block.backgroundColor === 'black' ? "bg-[#121212] text-white" : "bg-[#F2EEE8] text-[#121212]")}>
            <div className="max-w-4xl mx-auto space-y-4">
              {block.accordionItems?.map((item: any, idx: number) => (
                <div key={idx} className={clsx("border-b last:border-0 overflow-hidden", block.backgroundColor === 'black' ? "border-white/10" : "border-[#EAE3D9]")}>
                  <button 
                    onClick={() => setActiveQA(activeQA === `acc-${block.id}-${idx}` ? null : `acc-${block.id}-${idx}`)}
                    className="w-full py-6 flex justify-between items-center text-left hover:text-[#FF4F00] transition-colors"
                  >
                    <span className="text-xl md:text-2xl font-bold font-['Karla'] leading-tight pr-8 uppercase tracking-widest">{getLocalizedField(item, 'title', lang) || item.title}</span>
                    {activeQA === `acc-${block.id}-${idx}` ? <ChevronUp className="shrink-0" /> : <ChevronDown className="shrink-0" />}
                  </button>
                  <AnimatePresence>
                    {activeQA === `acc-${block.id}-${idx}` && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className={clsx("pb-8 prose max-w-none w-full mx-auto break-words whitespace-pre-wrap prose-p:my-2 prose-p:leading-[1.4] prose-headings:my-4 prose-img:my-4 font-['Karla'] text-inherit", block.backgroundColor === 'black' ? "prose-invert text-white/70" : "text-[#59554E]")} dangerouslySetInnerHTML={{ __html: cleanHtml(getLocalizedField(item, 'content', lang) || item.content) }} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </section>
        );
      case 'contact_form':
        return <ContactFormBlock key={block.id} block={block} />;
      default:
        return null;
    }
  };

  return (
    <PublicLayout>
       <div className="min-h-screen bg-[#F2EEE8]">
         <SEO title={data ? (getLocalizedField(data, 'titolo', lang) || data.title) : 'Tag Tales'} />
         {loading ? (
           <div className="pb-20 px-[25px]">
             <div className="animate-pulse flex flex-col gap-4 max-w-4xl mx-auto mt-20">
                 <div className="h-20 bg-gray-300 rounded w-1/2"></div>
                 <div className="h-6 bg-gray-300 rounded w-full"></div>
                 <div className="h-6 bg-gray-300 rounded w-3/4"></div>
             </div>
           </div>
         ) : data ? (
            <div className="flex flex-col">
                {data.blocks && data.blocks.length > 0 ? (
                  <div className="flex flex-col">
                    {data.blocks.map((block: any, idx: number) => {
                      if (!block) return null;
                      if (block.hidden) return null;
                      return renderBlock(block, idx);
                    })}
                  </div>
                ) : (
                  <div className="max-w-4xl mx-auto px-6 pb-32">
                    <div className="prose max-w-4xl w-full mx-auto break-words whitespace-pre-wrap prose-p:my-2 prose-p:leading-[1.4] prose-headings:my-4 prose-img:my-4 font-['Karla'] text-[#121212]">
                      {cleanHtml(getLocalizedField(data, 'contenuto', lang))}
                    </div>
                  </div>
                )}
            </div>
         ) : (
             <div className="max-w-4xl mx-auto pt-32 pb-20 px-6 text-center">
                 <h1 className="text-4xl font-['Shamgod'] uppercase mb-4 text-[#121212]">Pagina non trovata</h1>
                 <p className="font-['Karla'] text-lg">La risorsa richiesta non è disponibile.</p>
             </div>
         )}
       </div>
    </PublicLayout>
  );
}
