import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function run() {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  console.log("API Key exists:", !!apiKey);
  console.log("API Key length:", apiKey?.length);
  if (!apiKey) return;
  const ai = new GoogleGenAI({ apiKey });
  try {
    const res = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: "Hello",
    });
    console.log("Success:", res.text);
  } catch (e: any) {
    console.error("Error:", e.message);
  }
}
run();
