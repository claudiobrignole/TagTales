import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import dotenv from "dotenv";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";
import nodemailer from "nodemailer";
import compression from "compression";
import { initializeApp, cert, getApps, getApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

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

const getFirebaseConfig = () => {
  try {
    const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      return {
        projectId: config.projectId || process.env.FIREBASE_PROJECT_ID || "gen-lang-client-0591253558",
        databaseId: config.firestoreDatabaseId || process.env.FIREBASE_DATABASE_ID || "ai-studio-a2b09391-a17c-4730-a9b9-0ed2e7574168"
      };
    }
  } catch (e) {
    console.error("Could not load firebase-applet-config.json", e);
  }
  return {
    projectId: process.env.FIREBASE_PROJECT_ID || "gen-lang-client-0591253558",
    databaseId: process.env.FIREBASE_DATABASE_ID || "ai-studio-a2b09391-a17c-4730-a9b9-0ed2e7574168"
  };
};

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

const getSendFoxToken = () => {
  let token = process.env.SENDFOX_ACCESS_TOKEN?.trim() || "";
  if (!token) {
    const base64Token = process.env.SENDFOX_ACCESS_TOKEN_BASE64?.trim();
    if (base64Token) {
      try {
        token = Buffer.from(base64Token, "base64").toString("utf8").trim();
      } catch (e) {
        console.error("Failed to decode SENDFOX_ACCESS_TOKEN_BASE64:", e);
      }
    }
  }
  return token;
};

async function sendEmailThroughSmtpOrService(to: string, subject: string, html: string) {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = Number(process.env.SMTP_PORT || 587);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpFrom = process.env.SMTP_FROM || "info@tagtales.gallery";
  const resendApiKey = process.env.RESEND_API_KEY;

  if (resendApiKey) {
    console.log("Attempting to send mail via Resend API...");
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: smtpFrom || "onboarding@resend.dev",
        to,
        subject,
        html
      })
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Resend email dispatch failed: ${errText}`);
    }
    console.log("Email dispatched via Resend successfully.");
    return { success: true, provider: "resend" };
  }

  if (smtpHost && smtpUser && smtpPass) {
    console.log(`Attempting to send mail via Nodemailer SMTP (${smtpHost})...`);
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465 || process.env.SMTP_SECURE === "true",
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    await transporter.sendMail({
      from: smtpFrom,
      to,
      subject,
      html,
    });
    console.log("Email sent successfully via SMTP.");
    return { success: true, provider: "smtp" };
  }

  throw new Error("No mail service configured on backend. Please configure either SMTP_HOST/SMTP_USER/SMTP_PASS or RESEND_API_KEY.");
}

function isLocalDevRequest(req: { get: (name: string) => string | undefined }): boolean {
  const host = (req.get("host") || "").toLowerCase();
  return host.startsWith("localhost:") || host.startsWith("127.0.0.1:");
}

let firebaseAdminInitError: string | null = null;

function initFirebaseAdmin(): boolean {
  try {
    if (getApps().length) {
      return true;
    }

    const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    const keyPaths = [
      path.resolve(process.cwd(), "serviceAccountKey.json"),
      path.resolve(process.cwd(), "var/serviceAccountKey.json"),
    ];

    let credentialSource = "";
    let credential;

    if (b64) {
      credential = cert(JSON.parse(Buffer.from(b64, "base64").toString("utf8")));
      credentialSource = "FIREBASE_SERVICE_ACCOUNT_BASE64";
    } else if (raw) {
      credential = cert(JSON.parse(raw));
      credentialSource = "FIREBASE_SERVICE_ACCOUNT_KEY";
    } else {
      const keyPath = keyPaths.find((p) => fs.existsSync(p));
      if (keyPath) {
        credential = cert(JSON.parse(fs.readFileSync(keyPath, "utf8")));
        credentialSource = keyPath;
      }
    }

    if (!credential) {
      firebaseAdminInitError =
        "Nessuna service account trovata. Metti serviceAccountKey.json nella root del progetto.";
      return false;
    }

    initializeApp({ credential });
    console.log(`Firebase Admin inizializzato (${credentialSource})`);
    firebaseAdminInitError = null;
    return true;
  } catch (err: any) {
    firebaseAdminInitError = err?.message || String(err);
    console.warn("Firebase Admin init failed:", firebaseAdminInitError);
    return false;
  }
}

async function getFirebaseAdminAuth() {
  if (!getApps().length && !initFirebaseAdmin()) {
    throw new Error(firebaseAdminInitError || "Firebase Admin non inizializzato");
  }

  return getAuth(getApp());
}

async function startServer() {
  initFirebaseAdmin();

  const app = express();
  app.use(compression());
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '10mb' }));

  // API routes
  app.get("/api/config", (req, res) => {
    res.json({
      ecwidStoreId: process.env.ECWID_STORE_ID || "",
    });
  });

  // Dev-only: mint a Firebase custom token for the super-admin (localhost only).
  app.post("/api/dev/admin-login", async (req, res) => {
    if (!isLocalDevRequest(req)) {
      return res.status(404).json({ error: "Not found" });
    }

    const adminUid = process.env.DEV_ADMIN_UID || "ZVQqmqZ99yPV6vVThQ56v9YjZsK2";
    const adminEmail = process.env.DEV_ADMIN_EMAIL || "claudio@brignole.ch";

    try {
      const authAdmin = await getFirebaseAdminAuth();
      const token = await authAdmin.createCustomToken(adminUid);
      return res.json({ method: "customToken", token, email: adminEmail });
    } catch (err: any) {
      console.warn("Dev admin custom token failed:", err?.message || err);
    }

    const password = process.env.DEV_ADMIN_PASSWORD;
    if (password) {
      return res.json({ method: "password", email: adminEmail, password });
    }

    return res.status(503).json({
      error:
        "Login dev non configurato. Aggiungi FIREBASE_SERVICE_ACCOUNT_BASE64 (consigliato) o DEV_ADMIN_PASSWORD in .env",
    });
  });

  app.post("/api/send-email", async (req, res) => {
    try {
      const { to, subject, html } = req.body;
      if (!to || !subject || !html) {
        return res.status(400).json({ error: "Missing required fields: to, subject, or html" });
      }

      const result = await sendEmailThroughSmtpOrService(to, subject, html);
      res.json(result);
    } catch (error: any) {
      console.error("Direct sendEmail error in server API:", error);
      res.status(500).json({ error: error.message || "Email send failed" });
    }
  });

  app.post(["/api/newsletter/subscribe", "/api/newsletter/subscribe/"], async (req, res) => {
    try {
      const { email, first_name, lists } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      const sendfoxToken = getSendFoxToken();
      if (!sendfoxToken) {
        console.warn("SendFox API Token is not configured. Falling back to local success simulation.");
        return res.json({ 
          success: true, 
          simulated: true, 
          message: "Mailing list subscription simulated successfully (SENDFOX_ACCESS_TOKEN is missing)." 
        });
      }

      // Use default list from environment variables if none passed and configured
      let targetLists = lists;
      if (!targetLists && process.env.SENDFOX_DEFAULT_LIST_ID) {
        const defaultListId = parseInt(process.env.SENDFOX_DEFAULT_LIST_ID, 10);
        if (!isNaN(defaultListId)) {
          targetLists = [defaultListId];
        }
      }

      const bodyPayload: any = {
        email: email,
      };
      if (first_name) {
        bodyPayload.first_name = first_name;
      }
      if (targetLists && Array.isArray(targetLists)) {
        bodyPayload.lists = targetLists;
      }

      const response = await fetch("https://api.sendfox.com/contacts", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${sendfoxToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(bodyPayload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("SendFox API error:", errorText);
        let errorMessage = `SendFox subscription failed: ${errorText}`;
        try {
          const parsed = JSON.parse(errorText);
          errorMessage = parsed.message || (parsed.errors ? Object.values(parsed.errors).flat().join(", ") : errorText);
        } catch (e) {
          // Fallback to text
        }
        return res.status(response.status).json({ success: false, error: errorMessage });
      }

      const data = await response.json();
      res.json({ success: true, data });
    } catch (error: any) {
      console.error("Newsletter subscription error:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });

  app.get("/api/newsletter/lists", async (req, res) => {
    try {
      const sendfoxToken = getSendFoxToken();
      if (!sendfoxToken) {
        return res.json({ 
          lists: [
            { id: 11, name: "Lista Generale TagTales", contacts_count: 3 },
            { id: 22, name: "Collezionisti Opere Originali", contacts_count: 1 },
            { id: 33, name: "Lista Newsletter Inglese (EN)", contacts_count: 0 }
          ],
          simulated: true 
        });
      }

      const response = await fetch("https://api.sendfox.com/lists", {
        headers: {
          "Authorization": `Bearer ${sendfoxToken}`,
          "Accept": "application/json"
        }
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error("SendFox fetch lists error:", errorData);
        return res.status(response.status).json({ error: "Failed to fetch lists from SendFox" });
      }

      const data = await response.json();
      res.json({ lists: data.data || [], simulated: false });
    } catch (error: any) {
      console.error("Fetch lists error:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });

  app.get("/api/newsletter/contacts", async (req, res) => {
    try {
      const sendfoxToken = getSendFoxToken();
      if (!sendfoxToken) {
        return res.json({
          contacts: [
            { id: 101, email: "collector.milano@art.it", first_name: "Alessandro", lists: [11, 22], status: "active", created_at: "2026-05-18T10:00:00.000000Z" },
            { id: 102, email: "phase2.legend@graff.ch", first_name: "Phase2 Tribute", lists: [11], status: "active", created_at: "2026-05-19T14:30:00.000000Z" },
            { id: 103, email: "spray_lover@gmail.com", first_name: "Marco", lists: [11], status: "unsubscribed", created_at: "2026-05-15T09:12:00.000000Z" },
            { id: 104, email: "claudio@brignole.ch", first_name: "Claudio", lists: [11, 22], status: "active", created_at: "2026-05-10T12:00:00.000000Z" },
          ],
          simulated: true
        });
      }

      const response = await fetch("https://api.sendfox.com/contacts", {
        headers: {
          "Authorization": `Bearer ${sendfoxToken}`,
          "Accept": "application/json"
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("SendFox fetch contacts error:", errorText);
        return res.status(response.status).json({ error: "Failed to fetch contacts from SendFox" });
      }

      const data = await response.json();
      res.json({ 
        contacts: data.data || [], 
        total: data.total || (data.data ? data.data.length : 0),
        simulated: false 
      });
    } catch (error: any) {
      console.error("Fetch contacts error:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });

  app.post("/api/newsletter/lists", async (req, res) => {
    try {
      const sendfoxToken = getSendFoxToken();
      const { name } = req.body;
      if (!name) {
        return res.status(400).json({ error: "List name is required" });
      }

      if (!sendfoxToken) {
        return res.json({
          success: true,
          data: { id: Math.floor(Math.random() * 1000) + 100, name: name, contacts_count: 0 },
          simulated: true
        });
      }

      const response = await fetch("https://api.sendfox.com/lists", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${sendfoxToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ name })
      });

      if (!response.ok) {
        const errorText = await response.text();
        return res.status(response.status).json({ error: `Failed to create list: ${errorText}` });
      }

      const data = await response.json();
      res.json({ success: true, data });
    } catch (error: any) {
      console.error("Create list error:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });

  app.get("/api/newsletter/campaigns", async (req, res) => {
    try {
      const sendfoxToken = getSendFoxToken();
      if (!sendfoxToken) {
        return res.json({
          campaigns: [
            { id: 501, name: "Lancio nuova Minimostra: Phase2", subject: "In anteprima le leggende del Writing di New York", status: "Sent", stats: { sent: 154, open_rate: "54%", click_rate: "12%" } },
            { id: 502, name: "Intervista a Rae Martini: Milano Graffiti", subject: "Rae Martini si racconta su TagTales Gallery", status: "Draft" },
          ],
          simulated: true
        });
      }

      const response = await fetch("https://api.sendfox.com/campaigns", {
        headers: {
          "Authorization": `Bearer ${sendfoxToken}`,
          "Accept": "application/json"
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("SendFox fetch campaigns error:", errorText);
        return res.status(response.status).json({ error: "Failed to fetch campaigns" });
      }

      const data = await response.json();
      res.json({ campaigns: data.data || [], simulated: false });
    } catch (error: any) {
      console.error("Fetch campaigns error:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });

  app.post("/api/newsletter/campaigns", async (req, res) => {
    try {
      const sendfoxToken = getSendFoxToken();
      const { name, subject, body, list_id } = req.body;

      if (!name || !subject || !body) {
        return res.status(400).json({ error: "Name, subject, and body are required to create a campaign." });
      }

      if (!sendfoxToken) {
        return res.json({
          success: true,
          data: { id: Math.floor(Math.random() * 1000) + 1000, name, subject, body, list_id, status: "Draft" },
          simulated: true
        });
      }

      let finalHtml = body;
      if (!finalHtml.includes("{{unsubscribe_url}}")) {
        // Automatically inject mandatory SendFox unsubscribe link
        finalHtml += `<br/><br/><hr style="border:0;border-top:1px solid #eae3d9;margin:20px 0;"/><p style="font-size:11px;color:#666;text-align:center;">Ricevi questa email perché sei iscritto alla newsletter di TagTales Gallery.<br/><a href="{{unsubscribe_url}}" style="color:#ff4f00;text-decoration:underline;">Disiscriviti</a> per non ricevere più comunicazioni.</p>`;
      }

      const response = await fetch("https://api.sendfox.com/campaigns", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${sendfoxToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
          title: name, 
          subject: subject, 
          html: finalHtml, 
          from_name: process.env.SENDFOX_FROM_NAME || "TagTales Gallery",
          from_email: process.env.SENDFOX_FROM_EMAIL || "info@tagtales.gallery",
          lists: (() => {
            if (!list_id) return [];
            const parsed = parseInt(list_id, 10);
            return isNaN(parsed) ? [] : [parsed];
          })()
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("SendFox campaign creation failed:", errorText);
        let errorMessage = `Failed to create campaign: ${errorText}`;
        try {
          const parsed = JSON.parse(errorText);
          errorMessage = parsed.message || (parsed.errors ? Object.values(parsed.errors).flat().join(", ") : errorText);
        } catch (e) {
          // Fallback to text
        }
        return res.status(response.status).json({ success: false, error: errorMessage });
      }

      const data = await response.json();
      res.json({ success: true, data });
    } catch (error: any) {
      console.error("Create campaign error:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });

  app.post("/api/newsletter/automation/suggest", async (req, res) => {
    try {
      const { type, writerName, exhibitionName, topic, extraContext } = req.body;
      const ai = getAi();
      
      let prompt = "";
      if (type === "writer") {
        prompt = `Scrivi una newsletter coinvolgente in lingua italiana per presentare il writer "${writerName}".
Concentrati sulla storia del graffiti writing, lo stile puro, l'energia della cultura hip-hop / street, ed evita espressioni artificiali generiche. 
Argomento e dettagli extra: ${topic || ""} ${extraContext || ""}. 
Assicurati di includere un Oggetto dell'email accattivante (Oggetto: ...) ed un corpo del messaggio con saluti amichevoli nello spirito di TagTales Gallery. Non usare riferimenti a contenuti generati da intelligenze artificiali, solo storie umane ed arte originale.`;
      } else if (type === "exhibition") {
        prompt = `Scrivi una newsletter promozionale per il lancio della mini-mostra "${exhibitionName}" del writer "${writerName}".
La mini-mostra si tiene su TagTales Gallery e contiene opere originali, stampe e poster limited edition.
Argomento e dettagli extra: ${topic || ""} ${extraContext || ""}.
Scrivi in lingua italiana. Includi un Oggetto dell'email d'impatto (Oggetto: ...) e un invito all'azione a visitare la mini-mostra per collezionare pezzi iconici firmati dal writer.`;
      } else {
        prompt = `Scrivi una newsletter speciale in lingua italiana per gli iscritti di TagTales Gallery sull'argomento: "${topic || "Cultura Graffiti"}".
Dettagli extra: ${extraContext || ""}.
Usa uno stile street, autentico e diretto. Includi un Oggetto dell'email (Oggetto: ...) e un corpo dell'email completo.`;
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      const text = response.text || "";
      res.json({ text });
    } catch (error: any) {
      console.error("Gemini suggestion error:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });

  app.post("/api/newsletter/automation/report", async (req, res) => {
    try {
      const { contactsCount, listsCount, activeCount, unsubscribeCount, sampleEmails } = req.body;
      const ai = getAi();

      const prompt = `Fornisci un report strategico in formato Markdown (lingua italiana) per analizzare la crescita e l'engagement della mailing list di TagTales Gallery.
Dati correnti:
- Iscritti totali: ${contactsCount}
- Liste attive: ${listsCount}
- Contatti attivi: ${activeCount}
- Disiscritti: ${unsubscribeCount}
- Esempi di iscritti/domini: ${sampleEmails ? sampleEmails.join(", ") : "Nessuno"}

Il report dovrebbe contenere tre sezioni:
1. **Analisi dello Stato Attuale**: un riepilogo critico ma incoraggiante della composizione dei contatti (es. collezionisti vs appassionati).
2. **Strategie ed Idee di Segmentazione**: consiglia come raggruppare i contatti per aumentare le vendite di stampe digitali o quadri originali dei graffiti moderni.
3. **Puntate Ideali della Newsletter**: dai 3 idee pratiche d'invio newsletter con relativi argomenti (es. interviste storiche repentine, offerte lampo firmate).

Ritorna SOLO il testo Markdown strutturato con titoli ed elenchi puntati.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      res.json({ report: response.text || "" });
    } catch (error: any) {
      console.error("Gemini report error:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });

  app.post("/api/translate", async (req, res) => {
    try {
      const { text, targetLanguages, context } = req.body;
      const ai = getAi();
      
      const results: Record<string, string> = {};

      for (const lang of targetLanguages) {
        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
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

  app.get(["/api/assistance", "/api/assistance/"], async (req, res) => {
    res.status(405).json({ 
        success: false, 
        error: "The assistance API expects a POST request containing user messages. Received GET instead. This is often caused by your hosting provider's redirect rules (such as HTTP to HTTPS, non-www to www, or trailing slash rewrites) converting the browser's POST request to GET on redirect. Please check your web server URL redirection rules.",
        suggestion: "Please use POST protocol directly or check if SSL/WWW redirection is causing method modification."
    });
  });

  app.post(["/api/assistance", "/api/assistance/"], async (req, res) => {
    try {
      const { messages, mode = 'public', language = 'it' } = req.body; 

      const firebaseConfig = getFirebaseConfig();
      const projectId = firebaseConfig.projectId;
      const databaseId = firebaseConfig.databaseId;
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
        model: "gemini-3.5-flash",
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
        model: "gemini-3.5-flash",
        contents: "Hello, world!"
      });
      res.json({ success: true, text: response.text });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message, fullError: e });
    }
  });

  app.get("/api/pagespeed", async (req, res) => {
    try {
      const { url, strategy = "mobile" } = req.query;
      if (!url) {
        return res.status(400).json({ success: false, error: "Missing required parameter: url" });
      }

      const targetUrl = encodeURIComponent(String(url));
      let psiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${targetUrl}&strategy=${strategy}&category=performance`;

      // Utilize dedicated PageSpeed API key, or fallback to the Gemini API Key if it's a standard Google developer key
      const apiKey = process.env.PAGESPEED_API_KEY || 
                     (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.startsWith("AIzaSy") ? process.env.GEMINI_API_KEY : "");
      
      if (apiKey) {
        psiUrl += `&key=${apiKey}`;
      }

      const response = await fetch(psiUrl);
      if (!response.ok) {
        const errDetails = await response.text();
        return res.status(response.status).json({ success: false, error: `Google API Error: ${errDetails}` });
      }

      const data = await response.json();
      res.json(data);
    } catch (e: any) {
      console.error("PageSpeed proxy error:", e);
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.get("/sitemap.xml", async (req, res) => {
    try {
      const firebaseConfig = getFirebaseConfig();
      const projectId = firebaseConfig.projectId;
      const databaseId = firebaseConfig.databaseId;
      const baseUrl = "https://tagtalesgallery.com";
      
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

      let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n`;

      const addUrl = (pathIt: string, pathEn: string, priority: string = "0.8", changefreq: string = "weekly") => {
        const lastmod = new Date().toISOString().split('T')[0];
        xml += `  <url>\n`;
        xml += `    <loc>${baseUrl}${pathIt}</loc>\n`;
        xml += `    <lastmod>${lastmod}</lastmod>\n`;
        xml += `    <xhtml:link rel="alternate" hreflang="it" href="${baseUrl}${pathIt}"/>\n`;
        xml += `    <xhtml:link rel="alternate" hreflang="en" href="${baseUrl}${pathEn}"/>\n`;
        xml += `    <xhtml:link rel="alternate" hreflang="x-default" href="${baseUrl}${pathIt}"/>\n`;
        xml += `    <changefreq>${changefreq}</changefreq>\n`;
        xml += `    <priority>${priority}</priority>\n`;
        xml += `  </url>\n`;
        xml += `  <url>\n`;
        xml += `    <loc>${baseUrl}${pathEn}</loc>\n`;
        xml += `    <lastmod>${lastmod}</lastmod>\n`;
        xml += `    <xhtml:link rel="alternate" hreflang="it" href="${baseUrl}${pathIt}"/>\n`;
        xml += `    <xhtml:link rel="alternate" hreflang="en" href="${baseUrl}${pathEn}"/>\n`;
        xml += `    <xhtml:link rel="alternate" hreflang="x-default" href="${baseUrl}${pathIt}"/>\n`;
        xml += `    <changefreq>${changefreq}</changefreq>\n`;
        xml += `    <priority>${priority}</priority>\n`;
        xml += `  </url>\n`;
      };

      // Static routes
      addUrl("/", "/en", "1.0", "weekly");
      addUrl("/writers", "/en/writers", "0.9", "weekly");
      addUrl("/exhibitions", "/en/exhibitions", "0.9", "weekly");
      addUrl("/magazine", "/en/magazine", "0.9", "weekly");
      addUrl("/privacy", "/en/privacy", "0.5", "monthly");
      addUrl("/terms", "/en/terms", "0.5", "monthly");
      addUrl("/cookies", "/en/cookies", "0.5", "monthly");
      addUrl("/assistance", "/en/assistance", "0.5", "monthly");

      // Dynamic routes
      writers.forEach((id: string) => addUrl(`/writer/${id}`, `/en/writer/${id}`, "0.8"));
      exhibitions.forEach((id: string) => addUrl(`/exhibition/${id}`, `/en/exhibition/${id}`, "0.8"));
      articles.forEach((id: string) => addUrl(`/magazine/${id}`, `/en/magazine/${id}`, "0.8"));
      pages.forEach((id: string) => addUrl(`/page/${id}`, `/en/page/${id}`, "0.7"));

      xml += `</urlset>`;

      res.header('Content-Type', 'application/xml');
      res.send(xml);
    } catch (error) {
      console.error("Sitemap error:", error);
      res.status(500).send("Error generating sitemap");
    }
  });

  app.get("/robots.txt", (req, res) => {
    res.header("Content-Type", "text/plain");
    res.send(`User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/
Sitemap: https://tagtalesgallery.com/sitemap.xml`);
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
    app.use(express.static(distPath, {
      maxAge: '1y',
      setHeaders: (res, filePath) => {
        if (filePath.includes('/assets/') || filePath.endsWith('.woff2') || filePath.endsWith('.woff') || filePath.endsWith('.js') || filePath.endsWith('.css') || filePath.endsWith('.png') || filePath.endsWith('.jpg') || filePath.endsWith('.jpeg') || filePath.endsWith('.webp') || filePath.endsWith('.ico') || filePath.endsWith('.svg')) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        } else {
          res.setHeader('Cache-Control', 'public, max-age=3600, must-revalidate');
        }
      }
    }));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
