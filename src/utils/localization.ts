export const getLocalizedField = (data: any, field: string, lang: string): string => {
  if (!data) return "";
  if (!lang) lang = 'it';
  const language = lang.split('-')[0].toLowerCase() === 'en' ? 'en' : 'it';
  
  if (language === 'it') {
    return data[field] || data[`${field}_it`] || "";
  }
  
  return data[`${field}_${language}`] || data[field] || "";
};
