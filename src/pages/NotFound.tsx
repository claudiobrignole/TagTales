import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useI18n } from '../contexts/I18nContext';
import SEO from '../components/SEO';
import PublicLayout from '../components/PublicLayout';
import { homePath } from '../utils/paths';

export default function NotFound() {
  const { t } = useTranslation();
  const { language } = useI18n();
  const langPrefix = language === 'EN' ? '/en' : '';

  return (
    <PublicLayout>
      <div className="min-h-screen bg-[#F2EEE8] flex flex-col items-center justify-center p-6 text-center">
        <SEO title="404 - Not Found" noIndex />
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full"
        >
          <span className="font-['Shamgod'] text-[150px] md:text-[200px] leading-none text-[#FF4F00] block mb-4 uppercase">
            404
          </span>
          
          <h1 className="font-['Shamgod'] text-4xl md:text-5xl text-[#121212] uppercase mb-4 leading-none">
            {t('errors.notFoundTitle', 'Pagina non trovata')}
          </h1>
          
          <p className="font-['Karla'] text-lg text-[#59554E] mb-10">
            {t('errors.notFoundDesc', 'Spiacenti, il tag che stai cercando non esiste o è stato cancellato.')}
          </p>
          
          <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-4">
            <Link
              to={homePath(language)}
              className="inline-block bg-[#121212] text-white px-8 py-4 rounded-full font-bold uppercase tracking-widest hover:bg-[#FF4F00] transition-colors"
            >
              {t('errors.backHome', 'Torna alla Home')}
            </Link>
            <Link
              to={`${langPrefix}/exhibitions`}
              className="inline-block border-2 border-[#121212] text-[#121212] px-8 py-4 rounded-full font-bold uppercase tracking-widest hover:bg-[#121212] hover:text-white transition-colors"
            >
              {t('errors.backExhibitions', 'Mostre')}
            </Link>
            <Link
              to={`${langPrefix}/writers`}
              className="inline-block border-2 border-[#121212] text-[#121212] px-8 py-4 rounded-full font-bold uppercase tracking-widest hover:bg-[#121212] hover:text-white transition-colors"
            >
              {t('errors.backWriters', 'Writers')}
            </Link>
          </div>
        </motion.div>
      </div>
    </PublicLayout>
  );
}
