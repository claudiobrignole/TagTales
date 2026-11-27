import { GoogleGenAI } from "@google/genai";
import { translateMarkup } from "./translateContent";

const MODELS = ["gemini-3.8-flash", "gemini-3.5-flash", "gemini-flash-latest"];

function promptFor(chunk: string): string {
  return `You translate Italian into English for Tag Tales, a street-art magazine.
Return only the English text.
Keep every HTML tag, attribute, line break, and placeholder written as [[TT0]].
Keep writer names and crew names unchanged.
Do not add markdown, quotes, or commentary.

${chunk}`;
}

async function translateChunk(ai: GoogleGenAI, chunk: string): Promise<string> {
  let lastError: unknown;
  for (const model of MODELS) {
    for (const disableThinking of [true, false]) {
      try {
        const response = await ai.models.generateContent({
          model,
          config: {
            temperature: 0,
            ...(disableThinking ? { thinkingConfig: { thinkingBudget: 0 } } : {}),
          },
          contents: promptFor(chunk),
        });
        const text = response.text?.trim();
        if (!text) throw new Error("Empty translation");
        return text;
      } catch (error) {
        lastError = error;
        const message = error instanceof Error ? error.message : String(error);
        const missingModel = /404|not found|no longer available|not available/i.test(message);
        const thinkingRejected = /thinking/i.test(message);
        if (thinkingRejected && disableThinking) continue;
        if (missingModel) break;
        throw error;
      }
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Traduzione non disponibile");
}

export async function translateToEnglish(ai: GoogleGenAI, source: string): Promise<string> {
  if (!source.trim()) return source;
  return translateMarkup(source, (chunk) => translateChunk(ai, chunk));
}

export async function translateFieldMap(
  ai: GoogleGenAI,
  fields: Record<string, string>,
): Promise<Record<string, string>> {
  const translated: Record<string, string> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (typeof value !== "string" || !value.trim()) {
      translated[key] = "";
      continue;
    }
    translated[key] = await translateToEnglish(ai, value);
  }
  return translated;
}
