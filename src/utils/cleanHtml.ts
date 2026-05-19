export const cleanHtml = (htmlContent: string | undefined | null): string => {
  if (!htmlContent) return '';
  return htmlContent
    // Rimuove i soft hyphens e caratteri invisibili
    .replace(/&shy;/gi, '')
    .replace(/[\u00AD\u200B-\u200D\uFEFF]/g, '')
    // CONVERTE gli spazi non divisibili in spazi normali (FONDAMENTALE)
    .replace(/&nbsp;/gi, ' ')
    .replace(/\u00A0/g, ' ')
    // Rimuove i colori inline (es. color: rgb(...); o color: #... o color: black) per inherit dark mode
    .replace(/(?:background-)?color:\s*[^;"]+;?/gi, '')
    // Rimuove l'attributo style se è rimasto vuoto
    .replace(/style="\s*"/gi, '')
    // Rimuove i ritorni a capo dal sorgente HTML per evitare spazi extra con whitespace-pre-wrap
    .replace(/\r?\n|\r/g, '');
};

