export function generateSlug(text: string): string {
  if (!text) return "";
  return text
    .toString()
    .normalize("NFD") // Scompone i caratteri accentati
    .replace(/[\u0300-\u036f]/g, "") // Rimuove gli accenti
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9 ]/g, "") // Rimuove caratteri speciali (mantiene spazi e alfanumerici)
    .replace(/\s+/g, "-"); // Sostituisce gli spazi con trattini
}
