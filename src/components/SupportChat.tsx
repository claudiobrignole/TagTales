import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader2, FileText, Info } from 'lucide-react';
import clsx from 'clsx';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useI18n } from '../contexts/I18nContext';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'model';
  text: string;
}

interface SupportChatProps {
  mode?: 'public' | 'writers';
}

export default function SupportChat({ mode = 'public' }: SupportChatProps) {
  const { t, language } = useI18n();
  
  const getGreeting = () => {
    return t('help.greeting', 'Ciao, chiedimi quello che vuoi su Tag Tales Gallery');
  };

  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: getGreeting() }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [icebreakers, setIcebreakers] = useState<string[]>([]);
  const [actionButtons, setActionButtons] = useState<{ id: string, text: string, url: string }[]>([]);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const [showChatNewsletter, setShowChatNewsletter] = useState(true);
  const [chatNewsletterEmail, setChatNewsletterEmail] = useState('');
  const [chatNewsletterStatus, setChatNewsletterStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  useEffect(() => {
    async function fetchConfig() {
      try {
        const configDoc = await getDoc(doc(db, 'chat_config', mode));
        if (configDoc.exists()) {
          const data = configDoc.data();
          const langCode = (language || 'IT').toLowerCase();
          
          if (data.icebreakers && Array.isArray(data.icebreakers)) {
            const texts = data.icebreakers.map(ib => langCode === 'en' ? ib.en : ib.it).filter(text => !!text);
            setIcebreakers(texts);
          }
          
          if (data.actionButtons && Array.isArray(data.actionButtons)) {
            const buttons = data.actionButtons.map(ab => ({
              id: ab.id,
              text: langCode === 'en' ? ab.en : ab.it,
              url: langCode === 'en' ? (ab.url_en || ab.url) : ab.url
            })).filter(ab => !!ab.text && !!ab.url);
            setActionButtons(buttons);
          }
        }
      } catch (err) {
        console.error('Error fetching chat config', err);
      }
    }
    fetchConfig();
  }, [mode, language]);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  useEffect(() => {
    setMessages([{ role: 'model', text: getGreeting() }]);
  }, [mode, language]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const newMessages: Message[] = [...messages, { role: 'user', text }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/assistance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, mode, language })
      });
      const data = await response.json();
      
      if (data.success) {
        setMessages([...newMessages, { role: 'model', text: data.text }]);
      } else {
        let errorMsg = language === 'IT' 
          ? 'Scusa, ho riscontrato un errore di sistema. Riprova più tardi.'
          : 'Sorry, I encountered a system error. Please try again later.';
          
        if (data.error && data.error.includes('API key not valid')) {
            errorMsg = language === 'IT'
              ? 'La chiave API di Gemini configurata non è valida. Assicurati di aver inserito una chiave API valida nel menu Impostazioni (Settings) in alto a destra.'
              : 'The configured Gemini API key is invalid. Please ensure you have entered a valid API key in the Settings menu (top right).';
        }
        
        setMessages([...newMessages, { role: 'model', text: errorMsg }]);
      }
    } catch (err) {
      console.error(err);
      const connErrorMsg = language === 'IT'
        ? 'Scusami, si è verificato un errore di connessione.'
        : 'Sorry, a connection error occurred.';
      setMessages([...newMessages, { role: 'model', text: connErrorMsg }]);
    }
    
    setLoading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      {actionButtons.length > 0 && (
        <div className="flex flex-wrap gap-3 items-center justify-start shrink-0 mb-2">
          {actionButtons.map((btn, idx) => (
            <a 
              key={btn.id} 
              href={btn.url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className={clsx(
                "text-white px-4 py-2 rounded-full font-['Karla'] font-bold text-xs uppercase tracking-wider transition-colors",
                idx % 2 === 0 ? "bg-[#FF4F00] hover:bg-black" : "bg-[#121212] hover:bg-[#FF4F00]"
              )}
            >
              {btn.text}
            </a>
          ))}
        </div>
      )}

      <div className="flex flex-col h-[calc(100dvh-350px)] lg:h-[calc(100dvh-370px)] min-h-[400px] w-full bg-white rounded-[32px] border border-[#EAE3D9] overflow-hidden shadow-none">
        
        {showChatNewsletter && (
          <div className="bg-[#EAE3D9] border-b border-[#C8C0B5] p-4 flex flex-col md:flex-row items-center justify-between gap-4 shrink-0 transition-all duration-300 relative">
             <div className="text-left w-full md:w-auto pr-6">
                <h4 className="font-['Shamgod'] text-[24px] leading-tight text-[#FF4F00] uppercase mb-1">
                  {t('chat.newsletterTitle', 'LISTA PRIORITARIA')}
                </h4>
                <p className="font-['Karla'] text-xs text-gray-600 max-w-md">
                  {t('chat.newsletterDesc', 'Iscriviti per ricevere aggiornamenti sulle minimostre, interviste ai writers e stampe in edizione limitata.')}
                </p>
             </div>
             {chatNewsletterStatus === 'success' ? (
               <div className="text-green-700 font-['Karla'] font-bold text-sm uppercase">
                  {t('chat.newsletterSuccess', '✓ Iscritto con successo!')}
               </div>
             ) : (
               <form 
                 onSubmit={async (e) => {
                   e.preventDefault();
                   if (!chatNewsletterEmail.trim()) return;
                   setChatNewsletterStatus('loading');
                   try {
                     const res = await fetch('/api/newsletter/subscribe', {
                       method: 'POST',
                       headers: { 'Content-Type': 'application/json' },
                       body: JSON.stringify({ email: chatNewsletterEmail.trim() })
                     });
                     const data = await res.json();
                     if (res.ok && data.success) {
                       setChatNewsletterStatus('success');
                       setTimeout(() => setShowChatNewsletter(false), 2500);
                     } else {
                       setChatNewsletterStatus('error');
                     }
                   } catch {
                     setChatNewsletterStatus('error');
                   }
                 }}
                 className="flex items-center gap-2 w-full md:w-auto"
               >
                 <input 
                   type="email" 
                   required
                   value={chatNewsletterEmail}
                   onChange={(e) => setChatNewsletterEmail(e.target.value)}
                   placeholder={t('chat.newsletterPlaceholder', 'Inserisci la tua email')}
                   className="bg-white text-sm px-4 py-2 rounded-full outline-none focus:ring-1 focus:ring-[#FF4F00] font-['Karla'] w-full md:w-48 border border-[#EAE3D9]"
                 />
                 <button 
                   type="submit"
                   disabled={chatNewsletterStatus === 'loading'}
                   className="bg-[#121212] text-white hover:bg-[#FF4F00] transition-colors font-['Karla'] font-bold uppercase text-[11px] tracking-wider py-2 px-4 rounded-full cursor-pointer shrink-0 disabled:opacity-50"
                 >
                   {chatNewsletterStatus === 'loading' ? t('common.loading', '...') : t('home.newsletterBtn', 'Iscriviti')}
                 </button>
               </form>
             )}
             <button 
               type="button" 
               onClick={() => setShowChatNewsletter(false)}
               className="absolute top-2 right-2 text-gray-400 hover:text-black font-bold p-1 text-xs"
               title="Chiudi"
             >
               ✕
             </button>
          </div>
        )}

        <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#F8F6F3]">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={clsx(
                "max-w-[85%] rounded-2xl p-4 font-['Karla'] text-[17px] leading-relaxed relative support-chat-message",
                msg.role === 'user' 
                  ? "ml-auto bg-[#121212] text-white rounded-br-sm" 
                  : "mr-auto bg-white text-[#121212] border border-[#EAE3D9] rounded-bl-sm"
              )}
            >
              <ReactMarkdown
                components={{
                  a: ({ node, ...props }) => (
                    <a {...props} target="_blank" rel="noopener noreferrer" className="text-[#FF4F00] underline break-all" />
                  ),
                  strong: ({ node, ...props }) => (
                    <strong {...props} className="font-bold" />
                  ),
                }}
              >
                {msg.text}
              </ReactMarkdown>
            </div>
          ))}
          {loading && (
            <div className="mr-auto bg-white border border-[#EAE3D9] p-4 rounded-2xl rounded-bl-sm">
               <Loader2 className="w-5 h-5 animate-spin text-[#FF4F00]" />
            </div>
          )}
        </div>

        <div className="p-4 bg-white border-t border-[#EAE3D9] shrink-0">
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              className="flex-1 bg-[#F8F6F3] border-none rounded-full px-6 py-4 font-['Karla'] text-[#121212] focus:ring-2 focus:ring-[#FF4F00] outline-none placeholder:text-[#121212]/50 text-lg"
              placeholder={t('help.inputPlaceholder', 'Scrivi qui la tua richiesta')}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="p-4 bg-[#FF4F00] text-white rounded-full hover:bg-black transition-colors disabled:opacity-50 disabled:bg-[#121212]"
            >
              <Send className="w-6 h-6" />
            </button>
          </form>
        </div>
      </div>
      
      {/* Icebreakers Esterni */}
      {icebreakers.length > 0 && (
         <div className="flex flex-wrap gap-2 shrink-0 justify-start">
           {icebreakers.map((question, i) => (
             <button
               key={i}
               onClick={() => sendMessage(question)}
               disabled={loading}
               className="bg-white border text-left border-[#EAE3D9] text-[#121212] px-4 py-2 rounded-full font-['Karla'] font-bold text-[13px] uppercase tracking-wider hover:border-[#FF4F00] transition-colors shadow-sm"
             >
               {question}
             </button>
           ))}
         </div>
      )}
    </div>
  );
}
