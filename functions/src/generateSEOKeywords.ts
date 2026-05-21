import * as admin from "firebase-admin";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { GoogleGenAI } from "@google/genai";

if (!admin.apps.length) {
  admin.initializeApp();
}

let aiInstance: GoogleGenAI | null = null;

function getAi(): GoogleGenAI {
  if (!aiInstance) {
    let apiKey = process.env.GEMINI_API_KEY?.trim();
    if (apiKey) {
       apiKey = apiKey.replace(/^["']|["']$/g, '');
    }
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not set");
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

export const generateSEOKeywords = onCall(async (request: any) => {
  try {
    const { pageContent, language, pageContext } = request.data;

    if (!pageContent || !language || !pageContext) {
      throw new HttpsError('invalid-argument', 'Missing required arguments: pageContent, language, pageContext');
    }

    const ai = getAi();

    const prompt = `You are an SEO expert specializing in urban art, graffiti culture and street art.
Generate exactly 8 to 10 SEO keywords in ${language} for the following page.
Page context: ${pageContext}
Page content: ${pageContent.substring(0, 2000)}
Rules:
- Return ONLY a JSON array of strings, nothing else. No markdown, no explanation.
- Keywords must be specific, search-intent oriented, and relevant to graffiti/street art culture.
- Mix short-tail (1-2 words) and long-tail (3-4 words) keywords.
- Do not repeat the same concept twice.
Example output: ["graffiti writer", "arte urbana Milano", "opere originali street art"]`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt
    });

    let responseText = response.text || "[]";
    // Ensure we parse exactly the JSON array if there's any markdown wrapper
    responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

    let keywords: string[] = [];
    try {
      keywords = JSON.parse(responseText);
      if (!Array.isArray(keywords)) {
          keywords = [];
      }
    } catch (parseError) {
      logger.error('Failed to parse Gemini response as JSON', parseError, 'Response:', responseText);
      throw new Error('Invalid JSON response from AI');
    }

    return { keywords };
  } catch (error: any) {
    logger.error('Error generating SEO keywords', error);
    throw new HttpsError("internal", error.message || 'Internal error');
  }
});
