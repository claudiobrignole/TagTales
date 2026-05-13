import React from 'react';
import { useI18n } from '../contexts/I18nContext';
import SupportChat from '../components/SupportChat';

export default function Help() {
  const { t } = useI18n();

  return (
    <div className="w-full space-y-8 font-['Karla']">
      <header className="mb-10">
        <h1 className="text-4xl md:text-6xl font-['Shamgod'] leading-[0.8] tracking-tight text-[#121212] mb-4 uppercase">
          {t('help.pageTitle', 'Assistenza')}
        </h1>
        <p className="text-[#59554E] text-lg">
          {t('help.pageSubtitle', 'Come possiamo aiutarti? Chiedi al nostro chatbot intelligente.')}
        </p>
      </header>

      <SupportChat mode="writers" />
    </div>
  );
}
