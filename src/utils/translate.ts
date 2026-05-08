export async function translateText(text: string, targetLang: string = 'en'): Promise<string> {
  if (!text || text.trim() === '') return text;
  
  try {
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, targetLanguages: [targetLang] })
    });
    const data = await response.json();
    return data[targetLang] || text;
  } catch (error) {
    console.error("Translation error:", error);
    return text;
  }
}

export async function translateObjectFields(obj: Record<string, any>, fieldsToTranslate: string[], targetLang: string = 'en'): Promise<Record<string, any>> {
  const stringsToTranslate: Record<string, string> = {};
  for (const field of fieldsToTranslate) {
    if (obj[field] && typeof obj[field] === 'string' && obj[field].trim() !== '') {
      stringsToTranslate[field] = obj[field];
    }
  }

  if (Object.keys(stringsToTranslate).length === 0) return obj;

  try {
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: JSON.stringify(stringsToTranslate), targetLanguages: [targetLang], context: "Translate the JSON string values. Output ONLY valid JSON containing the translated values." })
    });
    const data = await response.json();
    let translatedJson: any;
    try {
        let cleanedText = data[targetLang].replace(/^```json\n/, '').replace(/\n```$/, '');
        translatedJson = JSON.parse(cleanedText);
    } catch(e) {
        console.error("Error parsing translated JSON", e);
        return obj;
    }

    const result = { ...obj };
    for (const key of Object.keys(translatedJson)) {
      if (translatedJson[key] && typeof translatedJson[key] === 'string') {
        result[`${key}_en`] = translatedJson[key];
      }
    }
    
    return result;
  } catch (error) {
    console.error("Error batch translating object:", error);
    return obj;
  }
}

export async function translateDirtyFields(
  currentData: Record<string, any>,
  originalData: Record<string, any> | null,
  fieldsToTranslate: string[],
  targetLang: string = 'en'
): Promise<Record<string, any>> {

  const dirtyFields: Record<string, string> = {};
  const translatedData: Record<string, any> = { ...currentData };

  for (const field of fieldsToTranslate) {
    const currentVal = currentData[field];
    const originalVal = originalData ? originalData[field] : undefined;

    if (currentVal && typeof currentVal === 'string' && currentVal.trim() !== '') {
      if (!originalData || currentVal !== originalVal || !originalData[`${field}_${targetLang}`]) {
        dirtyFields[field] = currentVal;
      } else {
         translatedData[`${field}_${targetLang}`] = originalData[`${field}_${targetLang}`];
      }
    } else {
        translatedData[`${field}_${targetLang}`] = ''; 
    }
  }

  if (Object.keys(dirtyFields).length === 0) {
    console.log(`[Translate] No dirty fields detected. Skipping API call.`);
    return translatedData;
  }

  console.log(`[Translate] Dirty fields detected for translation to ${targetLang}:`, Object.keys(dirtyFields));

  try {
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: JSON.stringify(dirtyFields), targetLanguages: [targetLang], context: "Translate the JSON string values. Output ONLY valid JSON containing the translated values." })
    });
    const data = await response.json();
    let translatedJson: Record<string, string>;
    try {
        let cleanedText = data[targetLang].replace(/^```json\n/, '').replace(/\n```$/, '');
        translatedJson = JSON.parse(cleanedText);
        for (const key of Object.keys(translatedJson)) {
            if (translatedJson[key] && typeof translatedJson[key] === 'string') {
              translatedData[`${key}_${targetLang}`] = translatedJson[key];
            }
        }
    } catch(e) {
        console.error("Error parsing translated JSON", e);
    }
    
    return translatedData;
  } catch (error) {
    console.error("Error translation API call:", error);
    return translatedData;
  }
}
