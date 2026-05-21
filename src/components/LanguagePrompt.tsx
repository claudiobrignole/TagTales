import React, { useEffect, useState } from 'react';
import { useI18n } from '../contexts/I18nContext';
import { Globe, X } from 'lucide-react';
import clsx from 'clsx';

export default function LanguagePrompt() {
  const { language, setLanguage, t, showLanguagePrompt, setShowLanguagePrompt, proposedLang } = useI18n();

  if (!showLanguagePrompt) return null;

  const handleSelect = (lang: any) => {
    setLanguage(lang);
    setShowLanguagePrompt(false);
    window.dispatchEvent(new CustomEvent('language-prompt-closed', { detail: { action: 'selected', language: lang } }));
  };

  const handleClose = () => {
    setShowLanguagePrompt(false);
    window.dispatchEvent(new CustomEvent('language-prompt-closed', { detail: { action: 'closed' } }));
  };

  const langList = [
    { id: 'IT', label: 'Italiano (Italian)' },
    { id: 'EN', label: 'English' },
  ];

  const sortedLangs = [...langList].sort((a, b) => {
    if (a.id === proposedLang) return -1;
    if (b.id === proposedLang) return 1;
    return 0;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative">
        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 text-[#59554E] hover:bg-[#F2EEE8] rounded-full transition-colors"
        >
          <X size={24} />
        </button>

        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 bg-[#F2EEE8] rounded-full flex items-center justify-center mb-4 text-[#FF4F00]">
            <Globe size={32} />
          </div>
          <h2 className="text-2xl font-bold text-[#121212] mb-2">Select Language</h2>
          <p className="text-[#59554E]">
            {t('common.languagePromptMessage', { lng: proposedLang.toLowerCase() }) || "Would you like to browse in another language?"}
          </p>
        </div>

        <div className="space-y-3">
          {sortedLangs.map((lang) => (
            <button
              key={lang.id}
              onClick={() => handleSelect(lang.id)}
              className={clsx(
                "w-full p-4 rounded-xl font-bold text-left flex items-center justify-between transition-colors",
                language === lang.id 
                  ? "bg-[#FF4F00] text-white" 
                  : proposedLang === lang.id
                  ? "bg-[#FFE8CC] text-[#FF4F00] hover:bg-[#FFD1A6]" 
                  : "bg-[#F2EEE8] text-[#121212] hover:bg-[#EAE3D9]"
              )}
            >
              <span>{lang.label}</span>
              {(language === lang.id || proposedLang === lang.id) && (
                <span className={clsx("text-sm", language === lang.id ? "text-white" : "text-[#FF4F00]")}>
                  {language === lang.id ? 'Selected' : 'Suggested'}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
