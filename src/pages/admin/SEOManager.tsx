import React, { useState, useEffect } from "react";
import { doc, getDoc, setDoc, serverTimestamp, collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase";
import { Save, Globe, X, Search, ArrowLeft } from "lucide-react";
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

function SEOForm({
  formData,
  handleChange,
  setFormData,
  handleSave,
  saving,
}: {
  formData: any;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  handleSave: (e: React.FormEvent) => void;
  saving: boolean;
}) {
  return (
    <form onSubmit={handleSave} className="space-y-8">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
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
              onChange={(newKws) => setFormData((prev: any) => ({ ...prev, keywordsIT: newKws }))}
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
              onChange={(newKws) => setFormData((prev: any) => ({ ...prev, keywordsEN: newKws }))}
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
  );
}

export default function SEOManager() {
  const [activeTab, setActiveTab] = useState("home");
  const [subTab, setSubTab] = useState<"general" | "individual">("general");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Individual Pages State
  const [listItems, setListItems] = useState<{ id: string; name: string }[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [seoStatusMap, setSeoStatusMap] = useState<Record<string, boolean>>({});
  const [showMobileList, setShowMobileList] = useState(true);

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

  const getIndividualPrefix = (type: string) => {
    if (type === "writers") return "writer_";
    if (type === "exhibitions") return "exhibition_";
    if (type === "magazine") return "article_";
    return "";
  };

  useEffect(() => {
    setSubTab("general");
    setShowMobileList(true);
    setSelectedEntityId(null);
    fetchSeoData(activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (subTab === "individual") {
      fetchListItems();
    }
  }, [subTab, activeTab]);

  const fetchListItems = async () => {
    if (activeTab === "home") return;
    setListLoading(true);
    try {
      let colName = "";
      if (activeTab === "writers") colName = "scrittori";
      else if (activeTab === "exhibitions") colName = "mostre";
      else if (activeTab === "magazine") colName = "articoli";

      if (!colName) return;

      const snap = await getDocs(collection(db, colName));
      const items = snap.docs.map((d) => ({
        id: d.id,
        name:
          activeTab === "writers"
            ? d.data().nome || d.data().nickname || "Senza nome"
            : d.data().titoloIT || d.data().titleIT || "Senza titolo",
      }));

      setListItems(items);

      const seoSnap = await getDocs(collection(db, "seoConfig"));
      const prefix = getIndividualPrefix(activeTab);
      const statuses: Record<string, boolean> = {};
      seoSnap.docs.forEach((d) => {
        if (d.id.startsWith(prefix)) {
          statuses[d.id.replace(prefix, "")] = true;
        }
      });
      setSeoStatusMap(statuses);
    } catch (error) {
      console.error("Error fetching list:", error);
    } finally {
      setListLoading(false);
    }
  };

  const handleSelectItem = (id: string) => {
    setSelectedEntityId(id);
    setShowMobileList(false);
    fetchSeoData(getIndividualPrefix(activeTab) + id);
  };

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
      const docId =
        subTab === "individual" && selectedEntityId
          ? getIndividualPrefix(activeTab) + selectedEntityId
          : activeTab;

      await setDoc(
        doc(db, "seoConfig", docId),
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

      if (subTab === "individual" && selectedEntityId) {
        setSeoStatusMap((prev) => ({ ...prev, [selectedEntityId]: true }));
      }

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
    <div className="w-full space-y-8 font-['Karla']">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-4xl md:text-6xl font-['Shamgod'] uppercase leading-[0.8] tracking-normal text-[#121212] mb-4">
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
      <div className="flex gap-2 border-b border-[#EAE3D9] mb-4 overflow-x-auto pb-2">
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

      {/* Sub-tab selector */}
      {activeTab !== "home" && (
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setSubTab("general")}
            className={clsx(
              "px-4 py-2 text-sm font-bold uppercase rounded-full transition-colors",
              subTab === "general"
                ? "bg-[#121212] text-white"
                : "bg-[#F2EEE8] text-[#59554E] hover:bg-[#EAE3D9]"
            )}
          >
            General Page
          </button>
          <button
            onClick={() => setSubTab("individual")}
            className={clsx(
              "px-4 py-2 text-sm font-bold uppercase rounded-full transition-colors",
              subTab === "individual"
                ? "bg-[#121212] text-white"
                : "bg-[#F2EEE8] text-[#59554E] hover:bg-[#EAE3D9]"
            )}
          >
            Individual Pages
          </button>
        </div>
      )}

      {subTab === "general" ? (
        loading ? (
          <div className="animate-pulse flex flex-col gap-6">
            <div className="h-12 bg-white/50 rounded-lg"></div>
            <div className="h-24 bg-white/50 rounded-lg"></div>
            <div className="h-24 bg-white/50 rounded-lg"></div>
          </div>
        ) : (
          <SEOForm
            formData={formData}
            handleChange={handleChange}
            setFormData={setFormData}
            handleSave={handleSave}
            saving={saving}
          />
        )
      ) : (
        <div className="flex flex-col md:flex-row gap-6 items-start">
          {/* Left panel */}
          <div
            className={clsx(
              "w-full md:w-[280px] shrink-0 bg-white border border-[#EAE3D9] rounded-2xl flex flex-col overflow-hidden h-[600px]",
              !showMobileList && "hidden md:flex"
            )}
          >
            <div className="p-4 border-b border-[#EAE3D9]">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="w-full pl-10 pr-3 py-2 bg-[#F2EEE8] rounded-xl text-sm focus:outline-none"
                />
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#59554E]"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {listLoading ? (
                <div className="p-4 flex flex-col gap-3">
                  <div className="h-10 bg-[#F2EEE8] rounded-lg animate-pulse"></div>
                  <div className="h-10 bg-[#F2EEE8] rounded-lg animate-pulse"></div>
                </div>
              ) : (
                listItems
                  .filter((it) =>
                    it.name.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((it) => (
                    <button
                      key={it.id}
                      onClick={() => handleSelectItem(it.id)}
                      className={clsx(
                        "w-full text-left px-4 py-3 border-b border-[#EAE3D9] hover:bg-[#F2EEE8] transition-colors flex items-center justify-between",
                        selectedEntityId === it.id && "bg-[#F2EEE8]"
                      )}
                    >
                      <span className="text-sm font-bold font-['Karla'] truncate pr-2 text-[#121212]">
                        {it.name}
                      </span>
                      <div
                        className={clsx(
                          "w-2.5 h-2.5 rounded-full shrink-0",
                          seoStatusMap[it.id] ? "bg-green-500" : "bg-gray-300"
                        )}
                      ></div>
                    </button>
                  ))
              )}
            </div>
          </div>

          {/* Right Panel */}
          <div
            className={clsx(
              "flex-1 min-w-0 w-full transition-all duration-300",
              showMobileList && "hidden md:block" // On mobile hide right panel if list is showing
            )}
          >
            {selectedEntityId ? (
              <div className="bg-white p-4 md:p-6 rounded-2xl border border-[#EAE3D9] shadow-sm">
                <button
                  type="button"
                  onClick={() => setShowMobileList(true)}
                  className="md:hidden flex items-center gap-2 mb-6 px-4 py-2 bg-[#F2EEE8] text-[#59554E] font-bold text-sm tracking-wider uppercase rounded-full w-fit hover:bg-[#EAE3D9] transition-colors"
                >
                  <ArrowLeft size={16} /> Back to list
                </button>
                {loading ? (
                  <div className="animate-pulse space-y-6">
                    <div className="h-12 bg-[#F2EEE8] rounded-lg"></div>
                    <div className="h-24 bg-[#F2EEE8] rounded-lg"></div>
                  </div>
                ) : (
                  <SEOForm
                    formData={formData}
                    handleChange={handleChange}
                    setFormData={setFormData}
                    handleSave={handleSave}
                    saving={saving}
                  />
                )}
              </div>
            ) : (
              <div className="h-[600px] flex flex-col items-center justify-center bg-white border border-[#EAE3D9] rounded-2xl p-6 text-center text-[#59554E]">
                <Globe size={48} className="mb-4 opacity-20" />
                <p className="text-lg font-bold font-['Shamgod'] uppercase">
                  Select a page
                </p>
                <p className="text-sm mt-2">
                  Choose a page from the list to edit its SEO configuration.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
