async function readTranslationError(response: Response): Promise<string> {
  try {
    const data = await response.json();
    if (typeof data?.error === "string" && data.error.trim()) return data.error;
  } catch {
    // The proxy sometimes returns an HTML timeout page.
  }
  return "Traduzione inglese non riuscita.";
}

export async function translateText(text: string, targetLang: string = "en"): Promise<string> {
  if (!text || text.trim() === "") return text;
  if (targetLang !== "en") return text;

  const response = await fetch("/api/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, targetLanguages: [targetLang] }),
  });
  if (!response.ok) {
    throw new Error(await readTranslationError(response));
  }
  const data = await response.json();
  if (typeof data?.en !== "string" || !data.en.trim()) {
    throw new Error("Traduzione inglese vuota.");
  }
  return data.en;
}

export async function translateObjectFields(
  obj: Record<string, any>,
  fieldsToTranslate: string[],
  targetLang: string = "en",
): Promise<Record<string, any>> {
  const fields: Record<string, string> = {};
  for (const field of fieldsToTranslate) {
    if (typeof obj[field] === "string" && obj[field].trim() !== "") {
      fields[field] = obj[field];
    }
  }
  if (Object.keys(fields).length === 0) return obj;

  const translated = await translateFields(fields, targetLang);
  const result = { ...obj };
  for (const [key, value] of Object.entries(translated)) {
    result[`${key}_${targetLang}`] = value;
  }
  return result;
}

async function translateFields(
  fields: Record<string, string>,
  targetLang: string,
): Promise<Record<string, string>> {
  const response = await fetch("/api/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fields, targetLanguage: targetLang }),
  });
  if (!response.ok) {
    throw new Error(await readTranslationError(response));
  }
  const data = await response.json();
  const translated = data?.fields;
  if (!translated || typeof translated !== "object") {
    throw new Error("Risposta di traduzione non valida.");
  }
  const result: Record<string, string> = {};
  for (const key of Object.keys(fields)) {
    const value = translated[key];
    if (typeof value !== "string" || !value.trim()) {
      throw new Error(`Traduzione inglese mancante per ${key}.`);
    }
    result[key] = value;
  }
  return result;
}

export async function translateDirtyFields(
  currentData: Record<string, any>,
  originalData: Record<string, any> | null,
  fieldsToTranslate: string[],
  targetLang: string = "en",
): Promise<Record<string, any>> {
  const dirtyFields: Record<string, string> = {};
  const translatedData: Record<string, any> = { ...currentData };

  for (const field of fieldsToTranslate) {
    const currentVal = currentData[field];
    const originalVal = originalData ? originalData[field] : undefined;

    if (typeof currentVal === "string" && currentVal.trim() !== "") {
      const existingTranslation = originalData?.[`${field}_${targetLang}`];
      const unchanged =
        Boolean(originalData) &&
        currentVal === originalVal &&
        typeof existingTranslation === "string" &&
        existingTranslation.trim() !== "" &&
        existingTranslation.trim() !== currentVal.trim();
      if (unchanged) {
        translatedData[`${field}_${targetLang}`] = existingTranslation;
      } else {
        dirtyFields[field] = currentVal;
      }
    } else {
      translatedData[`${field}_${targetLang}`] = "";
    }
  }

  if (Object.keys(dirtyFields).length === 0) {
    return translatedData;
  }

  const translated = await translateFields(dirtyFields, targetLang);
  for (const [key, value] of Object.entries(translated)) {
    translatedData[`${key}_${targetLang}`] = value;
  }
  return translatedData;
}
