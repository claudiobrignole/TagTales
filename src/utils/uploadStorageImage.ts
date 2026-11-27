import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { auth, storage } from "../firebase";
import { compressImage } from "./imageCompressor";
import { dataUrlToFile, extractDataImageUrls } from "./articleBodyImages";

export async function uploadImageFile(file: File, folder = "articles"): Promise<string> {
  if (!auth.currentUser) {
    throw new Error("Autenticazione richiesta per il caricamento delle immagini.");
  }

  const ext = file.name.includes(".") ? file.name.split(".").pop() : "webp";
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`;
  const storageRef = ref(storage, `${folder}/${fileName}`);
  await uploadBytes(storageRef, file, file.type ? { contentType: file.type } : undefined);
  const url = await getDownloadURL(storageRef);

  const { invalidateMediaLibraryCache } = await import("./mediaLibraryCache");
  invalidateMediaLibraryCache();
  return url;
}

/** Quill embeds picked files as base64. Firestore rejects those documents, so store a URL instead. */
export async function replaceEmbeddedDataImages(html: string, folder = "articles"): Promise<string> {
  const dataUrls = extractDataImageUrls(html);
  if (dataUrls.length === 0) return html;

  let next = html;
  for (const dataUrl of dataUrls) {
    const file = dataUrlToFile(dataUrl);
    const prepared = file.type.startsWith("image/") ? await compressImage(file) : file;
    const url = await uploadImageFile(prepared, folder);
    next = next.split(dataUrl).join(url);
  }
  return next;
}
