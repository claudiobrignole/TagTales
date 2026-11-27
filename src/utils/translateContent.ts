const TOKEN = /\[\[TT(\d+)\]\]/g;
const NON_TRANSLATABLE =
  /<img\b[^>]*>|<iframe\b[^>]*>[\s\S]*?<\/iframe>|<iframe\b[^>]*\/?>|<!--TTIMG_\d+-->/gi;

export function shieldNonTranslatable(html: string): { text: string; tokens: string[] } {
  const tokens: string[] = [];
  const text = html.replace(NON_TRANSLATABLE, (tag) => {
    const token = `[[TT${tokens.length}]]`;
    tokens.push(tag);
    return token;
  });
  return { text, tokens };
}

export function restoreNonTranslatable(text: string, tokens: string[]): string {
  if (!tokens.length) return text;
  return text.replace(TOKEN, (full, index) => tokens[Number(index)] ?? full);
}

export function stripModelFences(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json|html|text|markdown)?\s*([\s\S]*?)\s*```$/i);
  return (fenced ? fenced[1] : trimmed).trim();
}

/** Split on block boundaries so a long article stays inside the host timeout. */
export function chunkTranslatable(text: string, maxLength = 2200): string[] {
  if (text.length <= maxLength) return [text];

  const parts = text.split(/(?<=<\/p>|<br\s*\/?>|\n)/i);
  const chunks: string[] = [];
  let current = "";

  const pushHard = (value: string) => {
    let rest = value;
    while (rest.length > maxLength) {
      const sliceAt = rest.lastIndexOf(" ", maxLength);
      const cut = sliceAt > maxLength * 0.5 ? sliceAt : maxLength;
      chunks.push(rest.slice(0, cut));
      rest = rest.slice(cut).trimStart();
    }
    if (rest) chunks.push(rest);
  };

  for (const part of parts) {
    if (part.length > maxLength) {
      if (current) {
        chunks.push(current);
        current = "";
      }
      pushHard(part);
      continue;
    }
    if (current && current.length + part.length > maxLength) {
      chunks.push(current);
      current = part;
    } else {
      current += part;
    }
  }
  if (current) chunks.push(current);
  return chunks.filter((chunk) => chunk.length > 0);
}

export async function translateMarkup(
  source: string,
  translateChunk: (chunk: string) => Promise<string>,
): Promise<string> {
  const { text, tokens } = shieldNonTranslatable(source);
  const chunks = chunkTranslatable(text);
  const translated: string[] = [];
  for (const chunk of chunks) {
    translated.push(stripModelFences(await translateChunk(chunk)));
  }
  let restored = restoreNonTranslatable(translated.join(""), tokens);
  for (const token of tokens) {
    if (!restored.includes(token)) restored += token;
  }
  return restored;
}
