import React from 'react';
import { useI18n } from '../contexts/I18nContext';
import SupportChat from '../components/SupportChat';
import SEO from '../components/SEO';
import PublicLayout from '../components/PublicLayout';

export default function PublicAssistance() {
  const { t, language } = useI18n();

  const title = language === 'IT' 
    ? "Assistenza e Supporto | TagTales Gallery" 
    : "Assistance and Support | TagTales Gallery";
  
  const description = language === 'IT'
    ? "Hai domande? Il nostro assistente virtuale è pronto a darti tutto il supporto di cui hai bisogno sulla nostra galleria e i nostri servizi."
    : "Have questions? Our virtual assistant is ready to give you all the support you need regarding our gallery and services.";

  return (
    <PublicLayout>
      <SEO 
        title={title}
        description={description}
      />
      <div className="flex flex-col bg-[#121212] min-h-[calc(100vh-65px)] lg:min-h-[calc(100vh-75px)] pb-12">
        <div className="w-full pt-[25px] pb-[20px] px-4 md:px-[25px]">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-[60px] md:text-[80px] font-['Shamgod'] uppercase leading-[0.8] tracking-normal text-white">
              {t("help.pageTitle", "Assistenza")}
            </h1>
            <p className="font-['Karla'] text-white/80 mt-4 text-xl">
              {t("help.pageSubtitle", "Come possiamo aiutarti?")}
            </p>
          </div>
        </div>
        <div className="w-full px-4 md:px-[25px] flex-1">
          <div className="max-w-4xl mx-auto w-full h-full">
            <SupportChat mode="public" />
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
