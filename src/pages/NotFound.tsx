import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SEO from '../components/SEO';
import PublicLayout from '../components/PublicLayout';

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <PublicLayout>
      <div className="min-h-screen bg-[#F2EEE8] flex flex-col items-center justify-center p-6 text-center">
        <SEO title="404 - Not Found" />
        
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
          
          <Link
            to="/"
            className="inline-block bg-[#121212] text-white px-8 py-4 rounded-full font-bold uppercase tracking-widest hover:bg-[#FF4F00] transition-colors"
          >
            {t('errors.backHome', 'Torna alla Home')}
          </Link>
        </motion.div>
      </div>
    </PublicLayout>
  );
}
