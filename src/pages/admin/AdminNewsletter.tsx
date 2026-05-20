import React, { useState, useEffect } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../firebase";
import { 
  Mail, Users, PlusCircle, AlertCircle, FileText, Send, Sparkles, 
  BarChart2, RefreshCw, Layers, CheckCircle, Search, Edit3, ArrowRight, UserPlus
} from "lucide-react";
import clsx from "clsx";
import ReactMarkdown from "react-markdown";

interface SendFoxList {
  id: number;
  name: string;
  contacts_count?: number;
}

interface SendFoxContact {
  id: number;
  email: string;
  first_name?: string;
  lists: number[];
  status: string;
  created_at: string;
}

interface SendFoxCampaign {
  id: number;
  name: string;
  subject: string;
  body?: string;
  status: string;
  stats?: {
    sent: number;
    open_rate: string;
    click_rate: string;
  };
}

export default function AdminNewsletter() {
  const [activeTab, setActiveTab] = useState<"lists" | "campaigns" | "copilot">("lists");
  
  // Data States
  const [lists, setLists] = useState<SendFoxList[]>([]);
  const [contacts, setContacts] = useState<SendFoxContact[]>([]);
  const [totalContactsCount, setTotalContactsCount] = useState<number>(0);
  const [campaigns, setCampaigns] = useState<SendFoxCampaign[]>([]);
  const [writers, setWriters] = useState<any[]>([]);
  const [exhibitions, setExhibitions] = useState<any[]>([]);
  
  // Flags & Loaders
  const [loadingLists, setLoadingLists] = useState(true);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [simulatedMode, setSimulatedMode] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Creation/Form States
  const [newListForm, setNewListForm] = useState({ name: "" });
  const [creatingList, setCreatingList] = useState(false);
  
  const [newCampaignForm, setNewCampaignForm] = useState({
    name: "",
    subject: "",
    body: "",
    listId: ""
  });
  const [creatingCampaign, setCreatingCampaign] = useState(false);

  // Filter state
  const [contactSearch, setContactSearch] = useState("");

  // Gemini Copilot bozza Generator States
  const [copilotType, setCopilotType] = useState<"writer" | "exhibition" | "general">("writer");
  const [selectedWriter, setSelectedWriter] = useState("");
  const [selectedExhibition, setSelectedExhibition] = useState("");
  const [copilotTopic, setCopilotTopic] = useState("");
  const [copilotExtra, setCopilotExtra] = useState("");
  const [generatingBozza, setGeneratingBozza] = useState(false);
  
  // Generated result
  const [generatedDraft, setGeneratedDraft] = useState({
    subject: "",
    body: ""
  });
  const [draftEdited, setDraftEdited] = useState(false);
  const [savingGeminiDraft, setSavingGeminiDraft] = useState(false);

  // Gemini growth report state
  const [generatingReport, setGeneratingReport] = useState(false);
  const [growthReport, setGrowthReport] = useState("");

  // Fetch lists and variables
  const fetchNewsletterData = async () => {
    setLoadingLists(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/newsletter/lists");
      if (!res.ok) throw new Error("Errore nel caricamento delle liste SendFox");
      const data = await res.json();
      setLists(data.lists || []);
      setSimulatedMode(!!data.simulated);
      
      // Default to first list for target campaign creation
      if (data.lists && data.lists.length > 0) {
        setNewCampaignForm(prev => ({ ...prev, listId: String(data.lists[0].id) }));
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Impossibile recuperare le liste");
    } finally {
      setLoadingLists(false);
    }
  };

  const fetchContactsData = async () => {
    setLoadingContacts(true);
    try {
      const res = await fetch("/api/newsletter/contacts");
      if (!res.ok) throw new Error("Errore nel caricamento dei contatti SendFox");
      const data = await res.json();
      setContacts(data.contacts || []);
      setTotalContactsCount(data.total || (data.contacts ? data.contacts.length : 0));
    } catch {
      // Non critical
    } finally {
      setLoadingContacts(false);
    }
  };

  const fetchCampaignsData = async () => {
    setLoadingCampaigns(true);
    try {
      const res = await fetch("/api/newsletter/campaigns");
      if (!res.ok) throw new Error("Errore nel caricamento delle campagne SendFox");
      const data = await res.json();
      setCampaigns(data.campaigns || []);
    } catch {
      // Non critical
    } finally {
      setLoadingCampaigns(false);
    }
  };

  // Fetch Firestore writers and exhibitions for Gemini dropdown variables
  const fetchFirestoreMetadata = async () => {
    try {
      const writersSnap = await getDocs(query(collection(db, "users"), where("role", "in", ["writer", "artist"])));
      const writersList: any[] = writersSnap.docs.map(d => ({ id: d.id, ...d.data() } as any)).filter((w: any) => !w.isDeleted);
      setWriters(writersList);
      if (writersList.length > 0) {
        setSelectedWriter(writersList[0].artistName || writersList[0].displayName || "Phase2");
      }

      const exhibitionSnap = await getDocs(collection(db, "mostre"));
      const exhibitionList: any[] = exhibitionSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      setExhibitions(exhibitionList);
      if (exhibitionList.length > 0) {
        setSelectedExhibition((exhibitionList[0].titolo_it || exhibitionList[0].titolo || "Wild Style Legacy"));
      }
    } catch (err) {
      console.error("Errore fetch firestore metadata per newsletter", err);
    }
  };

  useEffect(() => {
    fetchNewsletterData();
    fetchContactsData();
    fetchCampaignsData();
    fetchFirestoreMetadata();
  }, []);

  // Actions
  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListForm.name.trim()) return;
    setCreatingList(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await fetch("/api/newsletter/lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newListForm.name.trim() })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(`Lista "${newListForm.name}" creata con successo!`);
        setNewListForm({ name: "" });
        await fetchNewsletterData();
      } else {
        throw new Error(data.error || "Impossibile creare la lista");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Errore sconosciuto");
    } finally {
      setCreatingList(false);
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    const { name, subject, body, listId } = newCampaignForm;
    if (!name.trim() || !subject.trim() || !body.trim()) return;
    
    setCreatingCampaign(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await fetch("/api/newsletter/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          subject: subject.trim(),
          body: body.trim(),
          list_id: listId
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(`Campagna "${name}" salvata in bozza su SendFox!`);
        setNewCampaignForm({
          name: "",
          subject: "",
          body: "",
          listId: lists[0] ? String(lists[0].id) : ""
        });
        await fetchCampaignsData();
      } else {
        throw new Error(data.error || "Impossibile creare la campagna");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Errore nella creazione della campagna");
    } finally {
      setCreatingCampaign(false);
    }
  };

  // Gemini generative draft function
  const handleGenerateGeminiDraft = async () => {
    setGeneratingBozza(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const payload: any = { type: copilotType };
      if (copilotType === "writer") {
        payload.writerName = selectedWriter;
      } else if (copilotType === "exhibition") {
        payload.writerName = selectedWriter;
        payload.exhibitionName = selectedExhibition;
      }
      payload.topic = copilotTopic;
      payload.extraContext = copilotExtra;

      const res = await fetch("/api/newsletter/automation/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Gemini ha riscontrato un errore di elaborazione.");
      
      const data = await res.json();
      const rawText = data.text || "";
      
      // Parse object and body if possible from Gemini text (usually formatted as Oggetto: Subject \n\n Body)
      let subject = `Novità da TagTales Gallery`;
      let bodyText = rawText;

      const subjectMatchResult = rawText.match(/^(?:Oggetto|Subject|Subject Line):\s*(.+)$/mi);
      if (subjectMatchResult && subjectMatchResult[1]) {
        subject = subjectMatchResult[1].trim();
        bodyText = rawText.replace(subjectMatchResult[0], "").trim();
      } else {
        // Fallback search
        const lines = rawText.split("\n");
        const containsOggetto = lines[0]?.toLowerCase().includes("oggetto:") || lines[0]?.toLowerCase().includes("subject:");
        if (containsOggetto) {
          subject = lines[0].replace(/oggetto:|subject:/i, "").trim();
          bodyText = lines.slice(1).join("\n").trim();
        }
      }

      setGeneratedDraft({
        subject: subject,
        body: bodyText
      });
      setDraftEdited(false);
    } catch (err: any) {
      setErrorMsg(err.message || "Mancata generazione della newsletter bozza.");
    } finally {
      setGeneratingBozza(false);
    }
  };

  // Submit Gemini Draft to SendFox (Calls POST to /api/newsletter/campaigns)
  const handleSaveGeminiDraftToSendFox = async () => {
    if (!generatedDraft.subject.trim() || !generatedDraft.body.trim()) return;
    setSavingGeminiDraft(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const name = `Bozza Gemini: ${generatedDraft.subject.slice(0, 30)}`;
      const targetListId = lists[0] ? String(lists[0].id) : "";
      
      const res = await fetch("/api/newsletter/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name,
          subject: generatedDraft.subject.trim(),
          body: generatedDraft.body.trim().replace(/\n/g, "<br/>"), // convert to simple rich text break for email client
          list_id: targetListId
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(`La newsletter generata è stata caricata in bozza (Draft) su SendFox!`);
        // Reset generated draft view or clear
        setGeneratedDraft({ subject: "", body: "" });
        await fetchCampaignsData();
      } else {
        throw new Error(data.error || "Impossibile trasferire la bozza su SendFox");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Errore nel salvataggio su SendFox");
    } finally {
      setSavingGeminiDraft(false);
    }
  };

  // Gemini statistics report generator
  const handleGenerateStrategicReport = async () => {
    setGeneratingReport(true);
    setErrorMsg("");
    try {
      const sampleEmails = contacts.slice(0, 5).map(c => c.email);
      const activeCount = contacts.filter(c => c.status === "active").length;
      const unsubscribeCount = contacts.filter(c => c.status !== "active").length;

      const res = await fetch("/api/newsletter/automation/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactsCount: contacts.length,
          listsCount: lists.length,
          activeCount,
          unsubscribeCount,
          sampleEmails
        })
      });
      if (!res.ok) throw new Error("Errore durante la compilazione del report");
      
      const data = await res.json();
      setGrowthReport(data.report || "Nessun report generato.");
    } catch (err: any) {
      setErrorMsg(err.message || "Errore nel caricamento del report strategico.");
    } finally {
      setGeneratingReport(false);
    }
  };

  // Search contact helper
  const filteredContacts = contacts.filter(c => 
    c.email.toLowerCase().includes(contactSearch.toLowerCase()) || 
    (c.first_name && c.first_name.toLowerCase().includes(contactSearch.toLowerCase()))
  );

  return (
    <div className="w-full space-y-8">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#121212]/5 pb-6">
        <div>
          <h1 className="font-['Shamgod'] text-[60px] md:text-[80px] leading-[0.8] text-[#121212] tracking-normal mb-2 uppercase">
            Mailing List
          </h1>
          <p className="font-['Karla'] text-lg text-gray-600">
            Pannello di controllo newsletter per integrare SendFox, gestire contatti e automatizzare report con Gemini.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={fetchNewsletterData}
            title="Aggiorna Dati"
            className="flex items-center gap-2 bg-white hover:bg-[#F2EEE8] text-gray-800 font-bold uppercase py-3 px-5 rounded-full border border-[#EAE3D9] text-xs tracking-wider font-['Karla'] transition-all"
          >
            <RefreshCw size={14} className={clsx((loadingLists || loadingContacts || loadingCampaigns) && "animate-spin")} />
            <span>AGGIORNA DATI</span>
          </button>
        </div>
      </div>

      {/* Warning Overlay when Access Token is Missing (Simulated Data Mode) */}
      {simulatedMode && (
        <div className="bg-[#FFF4E5] border border-[#F5E1C9] rounded-[32px] p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center gap-6 justify-between animate-in fade-in duration-300">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-[#FF4F00]/10 rounded-full text-[#FF4F00] shrink-0">
              <AlertCircle size={28} />
            </div>
            <div>
              <h4 className="font-['Karla'] font-bold text-lg text-[#121212] uppercase mb-1">
                La piattaforma è in Modalità di Simulazione
              </h4>
              <p className="font-['Karla'] text-sm text-gray-600 max-w-2xl leading-relaxed">
                Nessuna chiave <code className="bg-white/60 px-1.5 py-0.5 rounded font-mono text-xs text-[#FF4F00]">SENDFOX_ACCESS_TOKEN</code> è configurata nel file delle variabili d'ambiente. Venite mostrati dati fittizi strutturati al fine di testare l'esperienza visiva, l'automazione locale e i report intelligenti con l'intelligenza artificiale Gemini.
              </p>
            </div>
          </div>
          <div className="bg-amber-100 text-amber-800 font-bold uppercase text-[10px] tracking-wider py-2 px-4 rounded-full font-['Karla'] border border-amber-200 w-full md:w-auto text-center shrink-0">
            SIMULAZIONE ATTIVA
          </div>
        </div>
      )}

      {/* Error & Success Messages */}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 md:p-6 rounded-[24px] flex items-center gap-3 font-['Karla'] animate-in slide-in-from-top duration-300">
          <AlertCircle size={20} className="shrink-0 text-red-600" />
          <p className="text-sm">{errorMsg}</p>
        </div>
      )}

      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-800 p-4 md:p-6 rounded-[24px] flex items-center gap-3 font-['Karla'] animate-in slide-in-from-top duration-300">
          <CheckCircle size={20} className="shrink-0 text-green-600" />
          <p className="text-sm font-semibold">{successMsg}</p>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex border-b border-[#EAE3D9]">
        <button
          onClick={() => setActiveTab("lists")}
          className={clsx(
            "pb-4 px-6 font-bold uppercase text-xs tracking-wider transition-all border-b-2 font-['Karla'] flex items-center gap-2",
            activeTab === "lists" 
              ? "border-[#FF4F00] text-[#FF4F00]" 
              : "border-transparent text-gray-500 hover:text-black hover:border-gray-300"
          )}
        >
          <Users size={16} />
          <span>Liste & Contatti</span>
        </button>
        <button
          onClick={() => setActiveTab("campaigns")}
          className={clsx(
            "pb-4 px-6 font-bold uppercase text-xs tracking-wider transition-all border-b-2 font-['Karla'] flex items-center gap-2",
            activeTab === "campaigns" 
              ? "border-[#FF4F00] text-[#FF4F00]" 
              : "border-transparent text-gray-500 hover:text-black hover:border-gray-300"
          )}
        >
          <Mail size={16} />
          <span>Newsletters (Campagne)</span>
        </button>
        <button
          onClick={() => setActiveTab("copilot")}
          className={clsx(
            "pb-4 px-6 font-bold uppercase text-xs tracking-wider transition-all border-b-2 font-['Karla'] flex items-center gap-2",
            activeTab === "copilot"
              ? "border-[#FF4F00] text-[#FF4F00]" 
              : "border-transparent text-gray-500 hover:text-black hover:border-gray-300"
          )}
        >
          <Sparkles size={16} />
          <span>Gemini AI Copilot</span>
        </button>
      </div>

      {/* Lists & Contacts Tab Contents */}
      {activeTab === "lists" && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Quick stats boxes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-[28px] border border-[#EAE3D9] flex items-center justify-between shadow-sm">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wider text-gray-500 font-bold">Liste Mailing</p>
                <h3 className="text-3xl font-bold font-['Karla'] text-[#121212]">{lists.length}</h3>
              </div>
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                <Layers size={22} />
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-[28px] border border-[#EAE3D9] flex items-center justify-between shadow-sm">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wider text-gray-500 font-bold">Iscritti Totali</p>
                <h3 className="text-3xl font-bold font-['Karla'] text-[#121212]">
                  {totalContactsCount || contacts.length}
                </h3>
              </div>
              <div className="p-3 bg-green-50 text-green-600 rounded-2xl">
                <Users size={22} />
              </div>
            </div>

            <div className="bg-white p-6 rounded-[28px] border border-[#EAE3D9] flex items-center justify-between shadow-sm">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wider text-gray-500 font-bold">Iscritti Attivi</p>
                <h3 className="text-3xl font-bold font-['Karla'] text-[#121212]">
                  {totalContactsCount 
                    ? Math.floor(totalContactsCount * (contacts.filter(c => c.status === "active").length / (contacts.length || 1))) 
                    : contacts.filter(c => c.status === "active").length}
                </h3>
              </div>
              <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl">
                <UserPlus size={22} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Left section: Create List form & lists directory */}
            <div className="xl:col-span-1 space-y-6">
              {/* Form Create List */}
              <div className="bg-white p-6 rounded-2xl border border-[#EAE3D9] shadow-sm">
                <h3 className="font-['Karla'] font-bold text-md uppercase text-[#121212] mb-4 flex items-center gap-2">
                  <PlusCircle size={18} className="text-[#FF4F00]" />
                  <span>Nuova mailing list</span>
                </h3>
                
                <form onSubmit={handleCreateList} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Nome della Lista</label>
                    <input
                      required
                      type="text"
                      value={newListForm.name}
                      onChange={(e) => setNewListForm({ name: e.target.value })}
                      placeholder="es. Collezionisti Svizzera"
                      className="w-full bg-transparent border border-[#EAE3D9] rounded-lg px-4 py-2 text-sm outline-none focus:border-[#FF4F00] font-['Karla']"
                    />
                  </div>
                  
                  <button
                    type="submit"
                    disabled={creatingList}
                    className="w-full bg-[#121212] hover:bg-[#FF4F00] text-white font-bold uppercase text-[11px] tracking-wider py-3 rounded-full cursor-pointer transition-colors disabled:opacity-50"
                  >
                    {creatingList ? "CREAZIONE IN CORSO..." : "CREA LISTA"}
                  </button>
                </form>
              </div>

              {/* Lists Viewer */}
              <div className="bg-white p-6 rounded-2xl border border-[#EAE3D9] shadow-sm">
                <h3 className="font-['Karla'] font-bold text-md uppercase text-[#121212] mb-4">Le tue Liste su SendFox</h3>
                {loadingLists ? (
                  <div className="text-center py-6 text-sm text-gray-500">Recuperando le liste...</div>
                ) : lists.length === 0 ? (
                  <div className="text-center py-6 text-sm text-gray-500">Nessuna lista trovata.</div>
                ) : (
                  <div className="space-y-3">
                    {lists.map(list => (
                      <div key={list.id} className="flex justify-between items-center p-3 rounded-xl bg-[#F8F6F3] border border-[#EAE3D9]/30 text-sm">
                        <div className="text-left">
                          <p className="font-bold text-[#121212]">{list.name}</p>
                          <p className="text-[10px] font-mono text-gray-400">ID: {list.id}</p>
                        </div>
                        <div className="flex items-center gap-1.5 bg-white py-1 px-3 rounded-full border border-[#EAE3D9] text-xs font-bold">
                          <span>{list.contacts_count ?? 0}</span>
                          <span className="text-gray-400 font-normal">membri</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right section: Contact database viewer */}
            <div className="xl:col-span-2 space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-[#EAE3D9] shadow-sm overflow-hidden flex flex-col">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="font-['Karla'] font-bold text-md uppercase text-[#121212]">Contatti & Iscritti</h3>
                    <p className="text-xs text-gray-500">Elenco completo dei contatti che si sono iscritti alla newsletter.</p>
                  </div>
                  
                  {/* Search box */}
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                    <input
                      type="text"
                      value={contactSearch}
                      onChange={(e) => setContactSearch(e.target.value)}
                      placeholder="Cerca per email o nome..."
                      className="pl-9 pr-4 py-1.5 w-full md:w-64 bg-transparent border border-[#EAE3D9] rounded-full text-xs outline-none focus:border-[#FF4F00] font-['Karla']"
                    />
                  </div>
                </div>

                {loadingContacts ? (
                  <div className="text-center py-12 text-sm text-gray-500">In caricamento...</div>
                ) : filteredContacts.length === 0 ? (
                  <div className="text-center py-12 text-sm text-gray-500">Nessun contatto trovato con questo filtro.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-[#EAE3D9] text-gray-500 uppercase font-bold tracking-wider">
                          <th className="pb-3 pr-2">Email</th>
                          <th className="pb-3 pr-2 font-normal">Nome</th>
                          <th className="pb-3 pr-2 font-normal">Liste</th>
                          <th className="pb-3 pr-2 font-normal">Stato</th>
                          <th className="pb-3 text-right font-normal">Data Iscrizione</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EAE3D9]/50 font-['Karla']">
                        {filteredContacts.map(contact => (
                          <tr key={contact.id} className="hover:bg-[#F8F6F3]/50 transition-colors">
                            <td className="py-3 font-bold text-[#121212] pr-2 break-all">{contact.email}</td>
                            <td className="py-3 text-gray-600 pr-2">{contact.first_name || "-"}</td>
                            <td className="py-3 pr-2">
                              <div className="flex flex-wrap gap-1">
                                {contact.lists.length === 0 ? (
                                  <span className="text-[9px] bg-red-50 text-red-700 px-1.5 py-0.5 rounded font-bold border border-red-200">Nessuna</span>
                                ) : (
                                  contact.lists.map(lid => {
                                    const mappedList = lists.find(l => l.id === lid);
                                    return (
                                      <span key={lid} className="text-[9px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-bold border border-blue-200 max-w-[120px] truncate" title={mappedList?.name || `ID ${lid}`}>
                                        {mappedList?.name || `ID ${lid}`}
                                      </span>
                                    );
                                  })
                                )}
                              </div>
                            </td>
                            <td className="py-3 pr-2">
                              <span className={clsx(
                                "text-[9px] px-2 py-0.5 rounded-full font-bold uppercase",
                                contact.status === "active" 
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-600"
                              )}>
                                {contact.status === "active" ? "ATTIVO" : contact.status}
                              </span>
                            </td>
                            <td className="py-3 text-right text-gray-400">
                              {new Date(contact.created_at).toLocaleDateString("it-IT", {
                                year: "numeric", month: "short", day: "numeric"
                              })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Campaigns NEWSLETTER Tab Contents */}
      {activeTab === "campaigns" && (
        <div className="space-y-8 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            
            {/* Left side: Newsletter template form creation */}
            <div className="bg-white p-6 rounded-2xl border border-[#EAE3D9] shadow-sm">
              <h3 className="font-['Karla'] font-bold text-md uppercase text-[#121212] mb-6 flex items-center gap-2">
                <Edit3 size={18} className="text-[#FF4F00]" />
                <span>Crea nuova bozza newsletter</span>
              </h3>
              
              <form onSubmit={handleCreateCampaign} className="space-y-5 text-left">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Nome Campagna (Uso Interno)</label>
                  <input
                    required
                    type="text"
                    value={newCampaignForm.name}
                    onChange={(e) => setNewCampaignForm({ ...newCampaignForm, name: e.target.value })}
                    placeholder="es. Promo Phase2 - Maggio 2026"
                    className="w-full bg-transparent border border-[#EAE3D9] rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#FF4F00] font-['Karla']"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Oggetto dell'Email (Visibile all'utente)</label>
                  <input
                    required
                    type="text"
                    value={newCampaignForm.subject}
                    onChange={(e) => setNewCampaignForm({ ...newCampaignForm, subject: e.target.value })}
                    placeholder="es. Scopri in anteprima le leggende dei graffiti di New York"
                    className="w-full bg-transparent border border-[#EAE3D9] rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#FF4F00] font-['Karla']"
                  />
                </div>

                <div>
                  <label className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                    <span>Corpo del canovaccio (HTML supportato)</span>
                    <span className="text-[10px] text-gray-400 lowercase font-normal">Usa &lt;br/&gt; per andare a capo</span>
                  </label>
                  <textarea
                    required
                    rows={8}
                    value={newCampaignForm.body}
                    onChange={(e) => setNewCampaignForm({ ...newCampaignForm, body: e.target.value })}
                    placeholder="Ciao, siamo felici di invitarti alla nuova mini-mostra... <br/><br/> Speriamo di vederti là!"
                    className="w-full bg-transparent border border-[#EAE3D9] rounded-lg p-4 text-sm outline-none focus:border-[#FF4F00] font-mono leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Lista SendFox destinataria</label>
                  <select
                    value={newCampaignForm.listId}
                    onChange={(e) => setNewCampaignForm({ ...newCampaignForm, listId: e.target.value })}
                    className="w-full bg-transparent border border-[#EAE3D9] rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#FF4F00] font-['Karla'] cursor-pointer"
                  >
                    {lists.length === 0 ? (
                      <option value="">Nessuna lista definita</option>
                    ) : (
                      lists.map(list => (
                        <option key={list.id} value={list.id}>{list.name} (id: {list.id})</option>
                      ))
                    )}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={creatingCampaign}
                  className="w-full bg-[#121212] hover:bg-[#FF4F00] text-white font-bold uppercase text-[11px] tracking-wider py-3.5 rounded-full cursor-pointer transition-colors disabled:opacity-50"
                >
                  {creatingCampaign ? "CREAZIONE IN CORSO..." : "SALVA COME BOZZA SU SENDFOX"}
                </button>
              </form>
            </div>

            {/* Right side: Existing campaigns library list */}
            <div className="bg-white p-6 rounded-2xl border border-[#EAE3D9] shadow-sm">
              <h3 className="font-['Karla'] font-bold text-md uppercase text-[#121212] mb-6">Campagne Invii Precedenti</h3>
              {loadingCampaigns ? (
                <div className="text-center py-12 text-sm text-gray-500">Recuperando l'archivio campagne...</div>
              ) : campaigns.length === 0 ? (
                <div className="text-center py-12 text-sm text-gray-500">Nessuna campagna email registrata su SendFox.</div>
              ) : (
                <div className="space-y-4">
                  {campaigns.map(camp => (
                    <div key={camp.id} className="p-4 rounded-xl bg-[#F8F6F3] border border-[#EAE3D9]/40 flex flex-col gap-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="text-left">
                          <p className="font-bold text-[#121212] leading-tight text-sm">{camp.name}</p>
                          <p className="text-xs text-gray-500 font-['Karla'] mt-1">Oggetto: {camp.subject}</p>
                        </div>
                        <span className={clsx(
                          "text-[9px] font-bold uppercase py-0.5 px-2.5 rounded-full border shrink-0",
                          camp.status === "Sent" || camp.status === "sent"
                            ? "bg-green-50 text-green-800 border-green-200" 
                            : "bg-amber-50 text-amber-800 border-amber-200"
                        )}>
                          {camp.status}
                        </span>
                      </div>
                      
                      {camp.stats && (
                        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#EAE3D9]/40 text-left font-['Karla'] text-[10px] font-bold text-gray-500">
                          <div>
                            <span className="block font-normal text-gray-400">Inviato a:</span>
                            <span className="text-[#121212] text-xs">{camp.stats.sent} contatti</span>
                          </div>
                          <div>
                            <span className="block font-normal text-gray-400">Aperture:</span>
                            <span className="text-green-700 text-xs">{camp.stats.open_rate}</span>
                          </div>
                          <div>
                            <span className="block font-normal text-gray-400">Clic:</span>
                            <span className="text-blue-700 text-xs">{camp.stats.click_rate}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
          </div>
        </div>
      )}

      {/* Gemini AI Copilot Tab Contents */}
      {activeTab === "copilot" && (
        <div className="space-y-8 animate-in fade-in duration-300">
          
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Control Panel Generator (Left) */}
            <div className="xl:col-span-1 bg-white p-6 rounded-2xl border border-[#EAE3D9] shadow-sm space-y-6">
              <div>
                <h3 className="font-['Karla'] font-bold text-md uppercase text-[#121212] mb-1 flex items-center gap-2">
                  <Sparkles size={18} className="text-[#FF4F00]" />
                  <span>Assistente di Scrittura</span>
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Genera una bozza mail strutturata, con stile d'ispirazione street-writing e storicità priva di clichés artificiali.
                </p>
              </div>

              <div className="space-y-4 text-left font-['Karla']">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#59554E] mb-2">
                    Tipo di Newsletter
                  </label>
                  <select
                    value={copilotType}
                    onChange={(e: any) => setCopilotType(e.target.value)}
                    className="w-full bg-transparent border border-[#EAE3D9] rounded-lg px-4 py-2 text-sm outline-none focus:border-[#FF4F00]"
                  >
                    <option value="writer">Presentazione Writer</option>
                    <option value="exhibition">Lancio di una Mini-Mostra</option>
                    <option value="general">Editoriale / Cultura Generica</option>
                  </select>
                </div>

                {copilotType !== "general" && (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#59554E] mb-2">
                      Seleziona Writer (Leggenda)
                    </label>
                    <select
                      value={selectedWriter}
                      onChange={(e) => setSelectedWriter(e.target.value)}
                      className="w-full bg-transparent border border-[#EAE3D9] rounded-lg px-4 py-2 text-sm outline-none focus:border-[#FF4F00]"
                    >
                      {writers.length === 0 ? (
                        <option value="Phase2">Phase2 (Default)</option>
                      ) : (
                        writers.map(w => (
                          <option key={w.id} value={w.artistName || w.displayName}>{w.artistName || w.displayName}</option>
                        ))
                      )}
                    </select>
                  </div>
                )}

                {copilotType === "exhibition" && (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#59554E] mb-2">
                      Mini-Mostra di riferimento
                    </label>
                    <select
                      value={selectedExhibition}
                      onChange={(e) => setSelectedExhibition(e.target.value)}
                      className="w-full bg-transparent border border-[#EAE3D9] rounded-lg px-4 py-2 text-sm outline-none focus:border-[#FF4F00]"
                    >
                      {exhibitions.length === 0 ? (
                        <option value="Wild Style Legacy">The Wild Style Legacy</option>
                      ) : (
                        exhibitions.map(ex => (
                          <option key={ex.id} value={ex.titolo_it || ex.titolo}>{ex.titolo_it || ex.titolo}</option>
                        ))
                      )}
                    </select>
                  </div>
                )}

                {(copilotType === "general" || copilotType === "writer") && (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#59554E] mb-2">
                      Argomento di base (Opzionale)
                    </label>
                    <input
                      type="text"
                      value={copilotTopic}
                      onChange={(e) => setCopilotTopic(e.target.value)}
                      placeholder="es. Anni '80, metropolitane a New York"
                      className="w-full bg-transparent border border-[#EAE3D9] rounded-lg px-4 py-2 text-sm outline-none focus:border-[#FF4F00]"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#59554E] mb-2">
                    Dettagli Extra o Aneddoti
                  </label>
                  <textarea
                    rows={4}
                    value={copilotExtra}
                    onChange={(e) => setCopilotExtra(e.target.value)}
                    placeholder="es. Menziona la transizione dallo spray su metallo ai poster su tela per gallerie private..."
                    className="w-full bg-transparent border border-[#EAE3D9] rounded-lg p-3 text-sm outline-none focus:border-[#FF4F00]"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleGenerateGeminiDraft}
                  disabled={generatingBozza}
                  className="w-full bg-[#121212] hover:bg-[#FF4F00] text-white font-bold uppercase text-[11px] tracking-wider py-3.5 rounded-full cursor-pointer flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  <Sparkles size={14} className={generatingBozza ? "animate-spin" : ""} />
                  <span>{generatingBozza ? "ELABORAZIONE IN CORSO" : "GENERA CON GEMINI"}</span>
                </button>
              </div>
            </div>

            {/* Generated output editor (Right) */}
            <div className="xl:col-span-2 space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-[#EAE3D9] shadow-sm flex flex-col space-y-4">
                <div className="flex items-center justify-between pointer-events-none">
                  <h3 className="font-['Karla'] font-bold text-md uppercase text-[#121212]">Risultato Elaborazione Gemini</h3>
                  <span className="text-[10px] font-bold text-gray-400 font-mono">EDITABILE</span>
                </div>

                {generatedDraft.body === "" ? (
                  <div className="border-2 border-dashed border-[#EAE3D9] rounded-2xl p-12 text-center text-gray-500 font-['Karla'] space-y-3">
                    <p className="text-xl font-bold uppercase">Nessuna bozza generata</p>
                    <p className="text-sm">Configura i parametri sulla sinistra e premi "Genera con Gemini" per iniziare la stesura assistita.</p>
                  </div>
                ) : (
                  <div className="space-y-4 text-left font-['Karla'] flex-1">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Oggetto Generato</label>
                      <input
                        type="text"
                        value={generatedDraft.subject}
                        onChange={(e) => {
                          setGeneratedDraft({ ...generatedDraft, subject: e.target.value });
                          setDraftEdited(true);
                        }}
                        className="w-full bg-transparent border-b border-[#EAE3D9] pb-2 text-lg font-bold text-[#121212] outline-none focus:border-[#FF4F00]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Testo dell'Email</label>
                      <textarea
                        rows={12}
                        value={generatedDraft.body}
                        onChange={(e) => {
                          setGeneratedDraft({ ...generatedDraft, body: e.target.value });
                          setDraftEdited(true);
                        }}
                        className="w-full bg-[#F8F6F3] border border-[#EAE3D9] rounded-xl p-4 text-sm leading-relaxed outline-none focus:border-[#FF4F00] font-sans"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={handleSaveGeminiDraftToSendFox}
                        disabled={savingGeminiDraft}
                        className="bg-[#FF4F00] hover:bg-[#121212] text-white font-bold uppercase text-[11px] tracking-wider py-3 px-6 rounded-full cursor-pointer flex items-center gap-2 transition-all disabled:opacity-50 justify-center"
                      >
                        <Send size={14} className={savingGeminiDraft ? "animate-spin" : ""} />
                        <span>{savingGeminiDraft ? "TRASFERIMENTO IN CORSO..." : "SALVA COME BOZZA SU SENDFOX"}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Golden section: growth report strategy analysis */}
          <div className="bg-white p-6 md:p-8 rounded-[32px] border border-[#EAE3D9] shadow-sm text-left space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#EAE3D9]/50 pb-4">
              <div>
                <h3 className="font-['Shamgod'] text-[32px] md:text-[40px] leading-[0.8] text-[#121212] tracking-normal uppercase flex items-center gap-3">
                  <BarChart2 className="text-[#FF4F00]" size={32} />
                  <span>Report Strategico Crescita</span>
                </h3>
                <p className="text-xs text-gray-500 font-['Karla'] mt-1">
                  Genera un'analisi dettagliata sui sotto-domini dei tuoi iscritti e ottieni raccomandazioni strategiche di marketing automatizzate da Gemini.
                </p>
              </div>

              <button
                type="button"
                onClick={handleGenerateStrategicReport}
                disabled={generatingReport}
                className="bg-[#121212] hover:bg-[#FF4F00] text-white font-bold uppercase text-[11px] tracking-wider py-3 px-6 rounded-full cursor-pointer flex items-center justify-center gap-2 transition-colors disabled:opacity-50 w-full md:w-auto self-start"
              >
                <Sparkles size={14} className={generatingReport ? "animate-spin" : ""} />
                <span>{generatingReport ? "ANALISI IN CORSO..." : "GENERA REPORT CON GEMINI"}</span>
              </button>
            </div>

            {growthReport === "" ? (
              <div className="py-12 text-center text-gray-500 font-['Karla']">
                Premi il bottone "GENERA REPORT CON GEMINI" per analizzare la composizione dei contatti e ricevere idee di segmentazione e vendite mirate.
              </div>
            ) : (
              <div className="prose max-w-none w-full mx-auto break-words whitespace-pre-wrap prose-p:my-2 prose-p:leading-[1.4] prose-headings:my-4 prose-img:my-4 font-['Karla'] p-6 bg-[#F8F6F3] rounded-[24px] border border-[#EAE3D9]/60">
                <ReactMarkdown>{growthReport}</ReactMarkdown>
              </div>
            )}
          </div>
          
        </div>
      )}
    </div>
  );
}
