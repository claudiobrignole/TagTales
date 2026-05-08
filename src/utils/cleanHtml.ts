export const cleanHtml = (htmlContent: string | undefined | null): string => {
  if (!htmlContent) return '';
  return htmlContent
    // Rimuove i soft hyphens e caratteri invisibili
    .replace(/&shy;/gi, '')
    .replace(/[\u00AD\u200B-\u200D\uFEFF]/g, '')
    // CONVERTE gli spazi non divisibili in spazi normali (FONDAMENTALE)
    .replace(/&nbsp;/gi, ' ')
    .replace(/\u00A0/g, ' ');
};
