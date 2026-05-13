import React, { useState, useEffect } from "react";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase";
import { Save, Globe, X } from "lucide-react";
import clsx from "clsx";

const SEO_PAGES = [
  { id: "home", label: "Home" },
  { id: "writers", label: "Writers" },
  { id: "exhibitions", label: "Exhibitions" },
  { id: "magazine", label: "Magazine" },
];

function KeywordsInput({
  keywords,
  onChange,
  placeholder,
}: {
  keywords: string[];
  onChange: (newKeywords: string[]) => void;
  placeholder?: string;
}) {
  const [inputValue, setInputValue] = useState("");

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const val = inputValue.trim();
      if (val && !keywords.includes(val)) {
        onChange([...keywords, val]);
      }
      setInputValue("");
    } else if (e.key === "Backspace" && !inputValue && keywords.length > 0) {
      onChange(keywords.slice(0, -1));
    }
  };

  const removeKeyword = (index: number) => {
    onChange(keywords.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-wrap gap-2 p-2 border border-[#EAE3D9] rounded-lg bg-transparent focus-within:border-[#FF4F00] min-h-[50px] items-center">
      {keywords.map((kw, index) => (
        <span
          key={index}
          className="flex items-center gap-1 bg-[#F2EEE8] text-[#121212] px-3 py-1 rounded-full text-sm font-bold"
        >
          {kw}
          <button
            type="button"
            onClick={() => removeKeyword(index)}
            className="text-[#59554E] hover:text-[#121212]"
          >
            <X size={14} />
          </button>
        </span>
      ))}
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        className="flex-1 min-w-[120px] bg-transparent focus:outline-none text-[#121212] py-1 px-2"
        placeholder={keywords.length === 0 ? placeholder : ""}
      />
    </div>
  );
}

export default function SEOManager() {
  const [activeTab, setActiveTab] = useState("home");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    titleIT: "",
    titleEN: "",
    descriptionIT: "",
    descriptionEN: "",
    keywordsIT: [] as string[],
    keywordsEN: [] as string[],
    ogImageUrl: "",
    ogImageAlt: "",
  });

  useEffect(() => {
    fetchSeoData(activeTab);
  }, [activeTab]);

  const fetchSeoData = async (pageId: string) => {
    setLoading(true);
    try {
      const docSnap = await getDoc(doc(db, "seoConfig", pageId));
      if (docSnap.exists()) {
        const data = docSnap.data();
        setFormData({
          titleIT: data.titleIT || "",
          titleEN: data.titleEN || "",
          descriptionIT: data.descriptionIT || "",
          descriptionEN: data.descriptionEN || "",
          keywordsIT: Array.isArray(data.keywordsIT) ? data.keywordsIT : [],
          keywordsEN: Array.isArray(data.keywordsEN) ? data.keywordsEN : [],
          ogImageUrl: data.ogImageUrl || "",
          ogImageAlt: data.ogImageAlt || "",
        });
      } else {
        setFormData({
          titleIT: "",
          titleEN: "",
          descriptionIT: "",
          descriptionEN: "",
          keywordsIT: [],
          keywordsEN: [],
          ogImageUrl: "",
          ogImageAlt: "",
        });
      }
    } catch (error) {
      console.error("Error fetching SEO config:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await setDoc(
        doc(db, "seoConfig", activeTab),
        {
          titleIT: formData.titleIT,
          titleEN: formData.titleEN,
          descriptionIT: formData.descriptionIT,
          descriptionEN: formData.descriptionEN,
          keywordsIT: formData.keywordsIT,
          keywordsEN: formData.keywordsEN,
          ogImageUrl: formData.ogImageUrl,
          ogImageAlt: formData.ogImageAlt,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      setToast("SEO configuration saved successfully!");
      setTimeout(() => setToast(null), 3000);
    } catch (error) {
      console.error("Error saving SEO config:", error);
      alert("Failed to save SEO configuration");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold font-['Shamgod'] uppercase">
            SEO Manager
          </h1>
          <p className="text-[#59554E] mt-2">
            Manage titles, descriptions, and meta tags for public pages.
          </p>
        </div>
      </div>

      {toast && (
        <div className="mb-6 p-4 bg-green-50 text-green-700 border border-green-200 rounded-lg shadow-sm flex items-center gap-2">
          <Globe size={20} />
          <span>{toast}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#EAE3D9] mb-8 overflow-x-auto pb-2">
        {SEO_PAGES.map((page) => (
          <button
            key={page.id}
            onClick={() => setActiveTab(page.id)}
            className={clsx(
              "px-6 py-3 font-bold text-sm tracking-wider uppercase transition-colors whitespace-nowrap",
              activeTab === page.id
                ? "border-b-2 border-[#FF4F00] text-[#FF4F00]"
                : "text-[#59554E] hover:text-[#121212]"
            )}
          >
            {page.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="animate-pulse flex flex-col gap-6">
          <div className="h-12 bg-white/50 rounded-lg"></div>
          <div className="h-24 bg-white/50 rounded-lg"></div>
          <div className="h-24 bg-white/50 rounded-lg"></div>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* IT Section */}
            <div className="space-y-6 bg-white p-6 rounded-2xl border border-[#EAE3D9] shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-6 h-6 rounded-full bg-[#121212] text-white flex items-center justify-center text-xs font-bold">
                  IT
                </span>
                <h2 className="text-xl font-bold font-['Shamgod'] uppercase">
                  Italian
                </h2>
              </div>

              <div>
                <label className="block text-sm font-bold uppercase tracking-wider text-[#59554E] mb-2">
                  Meta Title
                </label>
                <input
                  type="text"
                  name="titleIT"
                  value={formData.titleIT}
                  onChange={handleChange}
                  className="w-full p-3 border border-[#EAE3D9] rounded-lg bg-transparent focus:outline-none focus:border-[#FF4F00]"
                  placeholder="e.g. TagTales Gallery — Arte Graffiti"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-bold uppercase tracking-wider text-[#59554E]">
                    Meta Description
                  </label>
                  <span
                    className={clsx(
                      "text-xs font-mono",
                      formData.descriptionIT.length > 160
                        ? "text-red-500"
                        : "text-[#59554E]"
                    )}
                  >
                    {formData.descriptionIT.length}/160
                  </span>
                </div>
                <textarea
                  name="descriptionIT"
                  value={formData.descriptionIT}
                  onChange={handleChange}
                  rows={3}
                  className="w-full p-3 border border-[#EAE3D9] rounded-lg bg-transparent focus:outline-none focus:border-[#FF4F00] resize-none"
                  placeholder="A brief description for search engines..."
                />
              </div>

              <div>
                <label className="block text-sm font-bold uppercase tracking-wider text-[#59554E] mb-2">
                  Keywords (comma separated)
                </label>
                <KeywordsInput
                  keywords={formData.keywordsIT}
                  onChange={(newKws) => setFormData(prev => ({ ...prev, keywordsIT: newKws }))}
                  placeholder="graffiti, street art, type and press Enter"
                />
              </div>
            </div>

            {/* EN Section */}
            <div className="space-y-6 bg-white p-6 rounded-2xl border border-[#EAE3D9] shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-6 h-6 rounded-full bg-[#FF4F00] text-white flex items-center justify-center text-xs font-bold">
                  EN
                </span>
                <h2 className="text-xl font-bold font-['Shamgod'] uppercase">
                  English
                </h2>
              </div>

              <div>
                <label className="block text-sm font-bold uppercase tracking-wider text-[#59554E] mb-2">
                  Meta Title
                </label>
                <input
                  type="text"
                  name="titleEN"
                  value={formData.titleEN}
                  onChange={handleChange}
                  className="w-full p-3 border border-[#EAE3D9] rounded-lg bg-transparent focus:outline-none focus:border-[#FF4F00]"
                  placeholder="e.g. TagTales Gallery — Graffiti Art"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-bold uppercase tracking-wider text-[#59554E]">
                    Meta Description
                  </label>
                  <span
                    className={clsx(
                      "text-xs font-mono",
                      formData.descriptionEN.length > 160
                        ? "text-red-500"
                        : "text-[#59554E]"
                    )}
                  >
                    {formData.descriptionEN.length}/160
                  </span>
                </div>
                <textarea
                  name="descriptionEN"
                  value={formData.descriptionEN}
                  onChange={handleChange}
                  rows={3}
                  className="w-full p-3 border border-[#EAE3D9] rounded-lg bg-transparent focus:outline-none focus:border-[#FF4F00] resize-none"
                  placeholder="A brief description for search engines..."
                />
              </div>

              <div>
                <label className="block text-sm font-bold uppercase tracking-wider text-[#59554E] mb-2">
                  Keywords (comma separated)
                </label>
                <KeywordsInput
                  keywords={formData.keywordsEN}
                  onChange={(newKws) => setFormData(prev => ({ ...prev, keywordsEN: newKws }))}
                  placeholder="graffiti, street art, type and press Enter"
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#EAE3D9] shadow-sm space-y-4">
            <h3 className="text-lg font-bold font-['Shamgod'] uppercase border-b border-[#EAE3D9] pb-2">
              Social Media Preview (Open Graph)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div>
                <label className="block text-sm font-bold uppercase tracking-wider text-[#59554E] mb-2">
                  OG Image URL (Read-only)
                </label>
                <input
                  type="text"
                  name="ogImageUrl"
                  value={formData.ogImageUrl}
                  readOnly
                  className="w-full p-3 border border-[#EAE3D9] rounded-lg bg-[#F2EEE8] text-[#59554E] focus:outline-none cursor-not-allowed"
                  placeholder="Will be uploaded in a later step"
                />
              </div>
              <div>
                <label className="block text-sm font-bold uppercase tracking-wider text-[#59554E] mb-2">
                  OG Image Alt
                </label>
                <input
                  type="text"
                  name="ogImageAlt"
                  value={formData.ogImageAlt}
                  onChange={handleChange}
                  className="w-full p-3 border border-[#EAE3D9] rounded-lg bg-transparent focus:outline-none focus:border-[#FF4F00]"
                  placeholder="Image description"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 bg-[#FF4F00] text-white px-8 py-3 rounded-full font-bold uppercase tracking-wider hover:bg-[#e04600] disabled:opacity-50 transition-colors shadow-md shadow-[#FF4F00]/20"
            >
              <Save size={20} />
              {saving ? "Saving..." : "Save Configuration"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
