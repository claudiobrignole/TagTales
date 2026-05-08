import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, getDocs, where, doc, getDoc, updateDoc } from 'firebase/firestore';
import { Users, Palette, CreditCard, FileText, Globe, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useI18n } from '../contexts/I18nContext';
import { translateText, translateObjectFields } from '../utils/translate';

export default function AdminDashboard() {
  const { t } = useI18n();

  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingArtworks: 0,
    pendingPayments: 0,
    totalContracts: 0
  });
  const [loading, setLoading] = useState(true);
  
  const [translationState, setTranslationState] = useState({
    running: false,
    progress: 0,
    total: 0,
    status: ''
  });

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.data()?.role !== 'admin' && user.email?.toLowerCase() !== 'claudio@brignole.ch') {
          navigate('/');
          return;
        }

        const usersSnap = await getDocs(collection(db, 'users'));
        const artworksSnap = await getDocs(query(collection(db, 'opere'), where('statoApprovazione', '==', 'in_attesa')));
        const paymentsSnap = await getDocs(query(collection(db, 'payouts'), where('stato', '==', 'in_attesa')));
        const contractsSnap = await getDocs(collection(db, 'contratti'));

        setStats({
          totalUsers: usersSnap.size,
          pendingArtworks: artworksSnap.size,
          pendingPayments: paymentsSnap.size,
          totalContracts: contractsSnap.size
        });
      } catch (error) {
        console.error("Error fetching admin stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  const runTranslations = async () => {
    if (!window.confirm("Sei sicuro di voler avviare la traduzione di tutti i contenuti mancanti? L'operazione potrebbe richiedere alcuni minuti.")) return;
    
    setTranslationState({ running: true, progress: 0, total: 1, status: 'Calcolo elementi da tradurre...' });
    
    try {
      const docsToUpdate = [];

      const isMissingOrSame = (it: any, en: any) => {
        if (!it) return false;
        if (!en) return true;
        if (typeof it === 'string' && typeof en === 'string' && it.length > 3 && it === en) return true;
        return false;
      };

      const pagineSnap = await getDocs(collection(db, 'pagine'));
      for (const d of pagineSnap.docs) {
        const data = d.data();
        let needsTranslation = isMissingOrSame(data.titolo, data.titolo_en);
        if (!needsTranslation && data.blocks) {
             needsTranslation = data.blocks.some((b: any) => 
               isMissingOrSame(b.text, b.text_en) || 
               isMissingOrSame(b.title, b.title_en) ||
               (b.accordionItems && b.accordionItems.some((a: any) => isMissingOrSame(a.title, a.title_en) || isMissingOrSame(a.content, a.content_en))) ||
               (b.qa && b.qa.some((q: any) => isMissingOrSame(q.question, q.question_en) || isMissingOrSame(q.answer, q.answer_en)))
             );
        }
        if (needsTranslation) {
          docsToUpdate.push({ ref: d.ref, type: 'pagina', data });
        }
      }

      const mostreSnap = await getDocs(collection(db, 'mostre'));
      for (const d of mostreSnap.docs) {
        const data = d.data();
        let needsTranslation = isMissingOrSame(data.titolo, data.titolo_en) || isMissingOrSame(data.intro, data.intro_en) || isMissingOrSame(data.testoCuratela, data.testoCuratela_en);
        if (!needsTranslation && data.blocks) {
            needsTranslation = data.blocks.some((b: any) => isMissingOrSame(b.text, b.text_en) || isMissingOrSame(b.title, b.title_en));
        }
        if (needsTranslation) {
          docsToUpdate.push({ ref: d.ref, type: 'mostra', data });
        }
      }

      const scrittoriSnap = await getDocs(collection(db, 'scrittori'));
      for (const d of scrittoriSnap.docs) {
        const data = d.data();
        let needsTranslation = isMissingOrSame(data.bioBreve, data.bioBreve_en) || isMissingOrSame(data.citta, data.citta_en);
        if (!needsTranslation && data.blocks) {
            needsTranslation = data.blocks.some((b: any) => isMissingOrSame(b.text, b.text_en) || isMissingOrSame(b.title, b.title_en));
        }
        if (needsTranslation) {
          docsToUpdate.push({ ref: d.ref, type: 'scrittore', data });
        }
      }

      const articoliSnap = await getDocs(collection(db, 'articoli'));
      for (const d of articoliSnap.docs) {
        const data = d.data();
        if (isMissingOrSame(data.titolo, data.titolo_en) || isMissingOrSame(data.sottotitolo, data.sottotitolo_en) || isMissingOrSame(data.contenuto, data.contenuto_en)) {
          docsToUpdate.push({ ref: d.ref, type: 'articolo', data });
        }
      }
      
      const faqsSnap = await getDocs(collection(db, 'faqs'));
      for (const d of faqsSnap.docs) {
        const data = d.data();
         if (isMissingOrSame(data.question, data.question_en) || isMissingOrSame(data.answer, data.answer_en)) {
           docsToUpdate.push({ ref: d.ref, type: 'faq', data });
         }
      }

      if (docsToUpdate.length === 0) {
        setTranslationState({ running: false, progress: 0, total: 0, status: `Tutti i contenuti sono già tradotti o non necessitano di traduzione.` });
        return;
      }

      setTranslationState({ running: true, progress: 0, total: docsToUpdate.length, status: `Trovati ${docsToUpdate.length} elementi da tradurre. Inizio traduzione...` });

      let completed = 0;
      for (const item of docsToUpdate) {
        try {
          const updates: any = {};
          
          if (item.type === 'pagina') {
            if (isMissingOrSame(item.data.titolo, item.data.titolo_en)) updates.titolo_en = await translateText(item.data.titolo);
            if (item.data.blocks) {
               updates.blocks = await Promise.all(item.data.blocks.map(async (block: any) => {
                 let newBlock = { ...block };
                 if (isMissingOrSame(newBlock.text, newBlock.text_en)) newBlock.text_en = await translateText(newBlock.text);
                 if (isMissingOrSame(newBlock.title, newBlock.title_en)) newBlock.title_en = await translateText(newBlock.title);
                 if (newBlock.accordionItems) {
                    newBlock.accordionItems = await Promise.all(newBlock.accordionItems.map(async (accItem: any) => {
                      if (isMissingOrSame(accItem.title, accItem.title_en) || isMissingOrSame(accItem.content, accItem.content_en)) {
                         const itemsEn = await translateObjectFields({title: accItem.title, content: accItem.content}, ['title', 'content']);
                         return { ...accItem, title_en: itemsEn.title_en, content_en: itemsEn.content_en };
                      }
                      return accItem;
                    }));
                 }
                 if (newBlock.qa) {
                    newBlock.qa = await Promise.all(newBlock.qa.map(async (qaItem: any) => {
                      if (isMissingOrSame(qaItem.question, qaItem.question_en) || isMissingOrSame(qaItem.answer, qaItem.answer_en)) {
                         const qaEn = await translateObjectFields({question: qaItem.question, answer: qaItem.answer}, ['question', 'answer']);
                         return { ...qaItem, question_en: qaEn.question_en, answer_en: qaEn.answer_en };
                      }
                      return qaItem;
                    }));
                 }
                 return newBlock;
               }));
            }
          } else if (item.type === 'mostra') {
            if (isMissingOrSame(item.data.titolo, item.data.titolo_en)) updates.titolo_en = await translateText(item.data.titolo);
            if (isMissingOrSame(item.data.intro, item.data.intro_en)) updates.intro_en = await translateText(item.data.intro);
            if (isMissingOrSame(item.data.testoCuratela, item.data.testoCuratela_en)) updates.testoCuratela_en = await translateText(item.data.testoCuratela);
            if (item.data.blocks) {
               updates.blocks = await Promise.all(item.data.blocks.map(async (block: any) => {
                 let newBlock = { ...block };
                 if (isMissingOrSame(newBlock.text, newBlock.text_en)) newBlock.text_en = await translateText(newBlock.text);
                 if (isMissingOrSame(newBlock.title, newBlock.title_en)) newBlock.title_en = await translateText(newBlock.title);
                 return newBlock;
               }));
            }
          } else if (item.type === 'scrittore') {
            if (isMissingOrSame(item.data.bioBreve, item.data.bioBreve_en)) updates.bioBreve_en = await translateText(item.data.bioBreve);
            if (isMissingOrSame(item.data.citta, item.data.citta_en)) updates.citta_en = await translateText(item.data.citta);
            if (isMissingOrSame(item.data.paese, item.data.paese_en)) updates.paese_en = await translateText(item.data.paese);
            if (item.data.blocks) {
               updates.blocks = await Promise.all(item.data.blocks.map(async (block: any) => {
                 let newBlock = { ...block };
                 if (isMissingOrSame(newBlock.text, newBlock.text_en)) newBlock.text_en = await translateText(newBlock.text);
                 if (isMissingOrSame(newBlock.title, newBlock.title_en)) newBlock.title_en = await translateText(newBlock.title);
                 return newBlock;
               }));
            }
          } else if (item.type === 'articolo') {
            if (isMissingOrSame(item.data.titolo, item.data.titolo_en)) updates.titolo_en = await translateText(item.data.titolo);
            if (isMissingOrSame(item.data.sottotitolo, item.data.sottotitolo_en)) updates.sottotitolo_en = await translateText(item.data.sottotitolo);
            if (isMissingOrSame(item.data.contenuto, item.data.contenuto_en)) updates.contenuto_en = await translateText(item.data.contenuto);
          } else if (item.type === 'faq') {
            if (isMissingOrSame(item.data.question, item.data.question_en) || isMissingOrSame(item.data.answer, item.data.answer_en)) {
               const qaEn = await translateObjectFields({ question: item.data.question, answer: item.data.answer }, ['question', 'answer']);
               updates.question_en = qaEn.question_en;
               updates.answer_en = qaEn.answer_en;
            }
          }

          if (Object.keys(updates).length > 0) {
             await updateDoc(item.ref, updates);
          }
          completed++;
          setTranslationState(prev => ({ ...prev, progress: completed, status: `Tradotti ${completed} su ${docsToUpdate.length}...` }));
        } catch (e) {
          console.error("Error translating doc", item.ref.id, e);
        }
      }
      
      setTranslationState({ running: false, progress: completed, total: docsToUpdate.length, status: `Traduzione di ${docsToUpdate.length} elementi completata con successo!` });
      
    } catch (e) {
      console.error(e);
      setTranslationState({ running: false, progress: 0, total: 0, status: 'Errore durante la traduzione.' });
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full">{t('common.loading')}</div>;
  }

  const statCards = [
    { label: t('adminDashboard.totalUsers'), value: stats.totalUsers, icon: Users, color: 'bg-blue-50 text-blue-600', link: '/admin/users' },
    { label: t('adminDashboard.pendingArtworks'), value: stats.pendingArtworks, icon: Palette, color: 'bg-orange-50 text-orange-600', link: '/artworks' },
    { label: t('adminDashboard.pendingPayments'), value: stats.pendingPayments, icon: CreditCard, color: 'bg-green-50 text-green-600', link: '/admin/payments' },
    { label: t('adminDashboard.totalContracts'), value: stats.totalContracts, icon: FileText, color: 'bg-purple-50 text-purple-600', link: '/admin/contracts' },
  ];

  return (
    <div className="space-y-8 font-['Karla']">
      <header className="mb-8">
        <h1 className="text-4xl md:text-6xl font-['Shamgod'] leading-[0.8] tracking-tight text-[#121212] mb-4 uppercase">{t('adminDashboard.title')}</h1>
        <p className="text-[#59554E] text-lg">{t('adminDashboard.subtitle')}</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <Link key={index} to={stat.link} className="bg-white p-6 rounded-3xl shadow-sm border border-[#EAE3D9] flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className={`p-4 rounded-2xl ${stat.color}`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-sm text-[#59554E] font-medium uppercase tracking-wider">{stat.label}</p>
              <p className="text-3xl font-bold text-[#121212]">{stat.value}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-8 bg-white p-6 rounded-3xl shadow-sm border border-[#EAE3D9]">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-4 rounded-2xl bg-indigo-50 text-indigo-600">
            <Globe size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#121212]">Traduzioni Automatiche (Batch)</h2>
            <p className="text-sm text-[#59554E] mt-1">Traduci tutto il contenuto esistente (Mostre, Magazine, Pagine, Writers) che non è ancora stato tradotto in inglese.</p>
          </div>
        </div>

        {translationState.status && (
          <div className="mb-4 text-sm font-medium text-indigo-700 bg-indigo-50 p-4 rounded-xl border border-indigo-100">
            {translationState.status}
            <div className="w-full bg-indigo-200 rounded-full h-2 mt-2">
              <div className="bg-indigo-600 h-2 rounded-full transition-all duration-300" style={{ width: `${translationState.total > 0 ? (translationState.progress / translationState.total) * 100 : 0}%` }}></div>
            </div>
          </div>
        )}

        <button
          onClick={runTranslations}
          disabled={translationState.running}
          className="flex items-center gap-2 px-6 py-3 bg-[#121212] text-white rounded-xl font-bold hover:bg-[#FF4F00] transition-colors uppercase disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {translationState.running ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              IN CORSO...
            </>
          ) : (
            'AVVIA TRADUZIONE CONTENUTI'
          )}
        </button>
      </div>
    </div>
  );
}
