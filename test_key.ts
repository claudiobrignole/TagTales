import dotenv from "dotenv";
dotenv.config();

let apiKey = process.env.GEMINI_API_KEY?.trim();
console.log("Key length:", apiKey?.length);
console.log("Key starts with:", apiKey ? apiKey.substring(0, 4) : "null");
