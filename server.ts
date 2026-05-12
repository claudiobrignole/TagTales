import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import dotenv from "dotenv";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

// Attempt to inject latest keys from AI Studio container
try {
  const devEnvPath = path.resolve(process.cwd(), '../.dev.env.json');
  if (fs.existsSync(devEnvPath)) {
    const devEnv = JSON.parse(fs.readFileSync(devEnvPath, 'utf8'));
    for (const key in devEnv) {
       process.env[key] = devEnv[key];
    }
  }
} catch (e) {
  console.error("Could not load .dev.env.json", e);
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

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '10mb' }));

  // API routes
  app.get("/api/config", (req, res) => {
    res.json({
      ecwidStoreId: process.env.ECWID_STORE_ID || "",
    });
  });

  app.post("/api/translate", async (req, res) => {
    try {
      const { text, targetLanguages, context } = req.body;
      const ai = getAi();
      
      const results: Record<string, string> = {};

      for (const lang of targetLanguages) {
        const response = await ai.models.generateContent({
          model: "gemini-3.1-flash-lite",
          config: {
              temperature: 0.2
          },
          contents: `Translate the following text into the language with language code: ${lang}. 
Return exactly the translated text and nothing else. Do not use markdown blocks unless they were in the original text.
Preserve all formatting, line breaks, and HTML tags in the translated text.
${context ? `Context: ${context}` : ""}

Text to translate:
${text}`,
        });

        results[lang] = response.text || "";
      }

      res.json(results);
    } catch (error: any) {
      console.error("Translation error:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });

  app.post("/api/artworks/:id/approve", async (req, res) => {
    try {
      const { id } = req.params;
      const { title, price, description, imageUrl } = req.body;

      const storeId = process.env.ECWID_STORE_ID;
      const secretToken = process.env.ECWID_SECRET_TOKEN;

      if (!storeId || !secretToken) {
        return res.status(500).json({ error: "Ecwid credentials not configured" });
      }

      // 1. Create product in Ecwid
      const ecwidResponse = await fetch(`https://app.ecwid.com/api/v3/${storeId}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${secretToken}`
        },
        body: JSON.stringify({
          name: title,
          price: price,
          description: description,
          enabled: true,
        })
      });

      if (!ecwidResponse.ok) {
        const errorData = await ecwidResponse.text();
        console.error("Ecwid API Error:", errorData);
        return res.status(ecwidResponse.status).json({ error: "Failed to create product in Ecwid" });
      }

      const ecwidData = await ecwidResponse.json();
      const productId = ecwidData.id;

      // 2. Upload image to Ecwid product if imageUrl is provided
      if (imageUrl && productId) {
        try {
          // Fetch the image to get a blob/buffer
          const imageResponse = await fetch(imageUrl);
          const imageBuffer = await imageResponse.arrayBuffer();

          await fetch(`https://app.ecwid.com/api/v3/${storeId}/products/${productId}/image`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${secretToken}`,
              'Content-Type': imageResponse.headers.get('content-type') || 'image/jpeg'
            },
            body: Buffer.from(imageBuffer)
          });
        } catch (imgErr) {
          console.error("Failed to upload image to Ecwid:", imgErr);
          // We don't fail the whole request if image upload fails, but we log it
        }
      }

      res.json({ success: true, ecwidProductId: productId });
    } catch (error: any) {
      console.error("Approval error:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });

  app.get("/api/ecwid/products", async (req, res) => {
    try {
      const storeId = process.env.ECWID_STORE_ID;
      const secretToken = process.env.ECWID_SECRET_TOKEN;

      if (!storeId || !secretToken) {
        return res.status(500).json({ error: "Ecwid credentials not configured" });
      }

      const keyword = req.query.keyword as string;
      const params = new URLSearchParams();
      if (keyword) {
        params.append('keyword', keyword);
      }
      params.append('limit', '100');

      const response = await fetch(`https://app.ecwid.com/api/v3/${storeId}/products?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${secretToken}`
        }
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error("Ecwid API Error:", errorData);
        return res.status(response.status).json({ error: "Failed to fetch products from Ecwid" });
      }

      const data = await response.json();
      res.json({ items: data.items || [] });
    } catch (error: any) {
      console.error("Fetch products error:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });

  app.post("/api/sales", async (req, res) => {
    try {
      const { productIds, createdFrom, createdTo } = req.body;
      
      const storeId = process.env.ECWID_STORE_ID;
      const secretToken = process.env.ECWID_SECRET_TOKEN;

      if (!storeId || !secretToken) {
        return res.status(500).json({ error: "Ecwid credentials not configured" });
      }

      if (!productIds || (Array.isArray(productIds) && productIds.length === 0)) {
        return res.json({ sales: [] });
      }

      const fetchAll = productIds === 'all';

      // Build query params
      const params = new URLSearchParams();
      if (createdFrom) params.append('createdFrom', createdFrom);
      if (createdTo) params.append('createdTo', createdTo);
      params.append('limit', '100'); // Adjust limit as needed

      const ordersResponse = await fetch(`https://app.ecwid.com/api/v3/${storeId}/orders?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${secretToken}`,
          'Accept': 'application/json'
        }
      });

      if (!ordersResponse.ok) {
        const errorData = await ordersResponse.text();
        console.error("Ecwid API Error:", errorData);
        return res.status(ordersResponse.status).json({ error: "Failed to fetch orders from Ecwid" });
      }

      const ordersData = await ordersResponse.json();
      const orders = ordersData.items || [];

      const sales: any[] = [];

      // Filter and map orders
      orders.forEach((order: any) => {
        const items = order.items || [];
        items.forEach((item: any) => {
          // Check if this item matches one of the artist's products
          if (fetchAll || productIds.includes(item.productId)) {
            sales.push({
              id: `${order.id}-${item.id}`,
              orderId: order.id,
              date: order.createDate, // ISO string
              artworkName: item.name,
              format: item.selectedOptions ? item.selectedOptions.map((o: any) => o.value).join(', ') : 'Original',
              price: item.price,
              ecwidProductId: item.productId,
              status: order.paymentStatus // e.g. PAID, AWAITING_PAYMENT
            });
          }
        });
      });

      // Sort sales by date descending
      sales.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      res.json({ sales });
    } catch (error: any) {
      console.error("Sales fetch error:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });

  app.post("/api/assistance", async (req, res) => {
    try {
      const { messages, mode = 'public', language = 'it' } = req.body; 

      const projectId = "gen-lang-client-0591253558";
      const databaseId = "ai-studio-a2b09391-a17c-4730-a9b9-0ed2e7574168";
      const configUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/chat_config/${mode}`;
      
      let systemInstruction = `You are the official assistant for TagTales Gallery. Maintain a professional, authentic tone focused on supporting graffiti culture.
You are in mode: ${mode.toUpperCase()}.
CRITICAL INSTRUCTION: You MUST detect the language of the user's input and reply ENTIRELY in that exact same language, no matter what language the user writes in. If the user writes in French, answer in French. If the user writes in Spanish, answer in Spanish. This overrides any other language instruction. The provided knowledge base may be in Italian or English, but you must translate your answer into the user's language. If you cannot recognize the language, default to English. IMPORTANT: Ensure that the term 'writer' (or 'writers') is used consistently instead of 'artist' or 'artista' in your responses, as TagTales Gallery exclusively identifies its artists as writers.`;
      
      // Fetch mode-specific config (knowledge base)
      try {
        const configResponse = await fetch(configUrl);
        if (configResponse.ok) {
           const configData = await configResponse.json();
           const knowledgeBase = configData.fields?.knowledgeBase?.stringValue;
           if (knowledgeBase) {
systemInstruction += "\n\n=== KNOWLEDGE BASE ===\nUse EXACTLY and ONLY this information to respond. The knowledge base might be in Italian, but you MUST translate the relevant facts into the user's language before presenting the answer to them. If the knowledge base does not contain the answer or instructions to the user's question, you MUST reply that you do not know the answer and suggest that the user writes an email to tagtales@brignole.ch. Translate this suggestion to the user's language. IMPORTANT: Ensure that the term 'writer' (or 'writers') is used consistently instead of 'artist' or 'artista' in your responses, as TagTales Gallery exclusively identifies its artists as writers.\n" + knowledgeBase;
           } else {
             systemInstruction += "\n\nIf you do not know the answer to the user's question, you MUST reply that you do not know the answer and suggest that the user writes an email to tagtales@brignole.ch.";
           }
        } else {
           systemInstruction += "\n\nIf you do not know the answer to the user's question, you MUST reply that you do not know the answer and suggest that the user writes an email to tagtales@brignole.ch.";
        }
      } catch (err) {
        console.error("Error fetching chat config", err);
      }

      const ai = getAi();
      
      const formattedContents = [];
      for (const m of messages) {
         formattedContents.push({
           role: m.role === 'ai' || m.role === 'model' ? 'model' : 'user',
           parts: [{ text: m.text }]
         });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: formattedContents,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.3
        }
      });

      res.json({ success: true, text: response.text });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.get("/api/test-gemini", async (req, res) => {
    try {
      const ai = getAi();
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: "Hello, world!"
      });
      res.json({ success: true, text: response.text });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message, fullError: e });
    }
  });

  app.get("/api/check-key", (req, res) => {
      res.json(process.env);
  });

  app.get("/sitemap.xml", async (req, res) => {
    try {
      const projectId = "gen-lang-client-0591253558";
      const databaseId = "ai-studio-a2b09391-a17c-4730-a9b9-0ed2e7574168";
      const baseUrl = "https://tagtales.gallery";
      
      const fetchIds = async (collection: string) => {
        const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/${collection}?pageSize=1000`;
        try {
          const response = await fetch(url);
          if (!response.ok) return [];
          const data = await response.json();
          return (data.documents || []).map((doc: any) => {
            const parts = doc.name.split('/');
            return parts[parts.length - 1];
          });
        } catch {
          return [];
        }
      };

      const [writers, exhibitions, articles, pages] = await Promise.all([
        fetchIds("scrittori"),
        fetchIds("mostre"),
        fetchIds("articoli"),
        fetchIds("pagine"),
      ]);

      let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

      const addUrl = (path: string, priority: string = "0.8") => {
        xml += `  <url>\n    <loc>${baseUrl}${path}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>${priority}</priority>\n  </url>\n`;
      };

      // Static routes
      addUrl("/", "1.0");
      addUrl("/writers", "0.9");
      addUrl("/exhibitions", "0.9");
      addUrl("/magazine", "0.9");
      addUrl("/privacy", "0.5");
      addUrl("/terms", "0.5");
      addUrl("/cookies", "0.5");

      // Dynamic routes
      writers.forEach((id: string) => addUrl(`/writer/${id}`, "0.8"));
      exhibitions.forEach((id: string) => addUrl(`/exhibition/${id}`, "0.8"));
      articles.forEach((id: string) => addUrl(`/magazine/${id}`, "0.8"));
      pages.forEach((id: string) => addUrl(`/page/${id}`, "0.7"));

      xml += `</urlset>`;

      res.header('Content-Type', 'application/xml');
      res.send(xml);
    } catch (error) {
      console.error("Sitemap error:", error);
      res.status(500).send("Error generating sitemap");
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
