import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, doc, setDoc } from "firebase/firestore";

const writers = [
  {
    nickname: "Shaone",
    bioBreve: "Shaone, fondatore dei 'La Famiglia', è una figura leggendaria dell'hip hop e del graffiti writing napoletano. Il suo stile fonde la tradizione del lettering classico con una ricerca plastica continua.",
    paese: "Italia",
    citta: "Napoli",
    fotoProfilo: "https://images.unsplash.com/photo-1544328906-81e0ab4a4411?auto=format&fit=crop&q=80",
    bannerSocial: "https://images.unsplash.com/photo-1517511620798-cec17d428bc0?auto=format&fit=crop&q=80",
    linkInstagram: "https://instagram.com/shaone_official",
    stato: "attivo",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    published: true,
  },
  {
    nickname: "Phase 2",
    bioBreve: "Lonny Wood, meglio conosciuto come Phase 2, è stato un pioniere del graffiti writing di New York, accreditato per aver perfezionato il 'bubble style' e molte altre innovazioni tipografiche.",
    paese: "USA",
    citta: "New York",
    fotoProfilo: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&q=80",
    bannerSocial: "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&q=80",
    linkInstagram: "",
    stato: "attivo",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    published: true,
  },
  {
    nickname: "Futura 2000",
    bioBreve: "Un pioniere del graffitismo astratto, Futura ha portato un'estetica sci-fi e tecnica sui treni della metropolitana di New York negli anni '80, influenzando generazioni di artisti.",
    paese: "USA",
    citta: "New York",
    fotoProfilo: "https://images.unsplash.com/photo-1520004434532-668416a08753?auto=format&fit=crop&q=80",
    bannerSocial: "https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?auto=format&fit=crop&q=80",
    linkInstagram: "https://instagram.com/futuradosmil",
    stato: "attivo",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    published: true,
  },
  {
    nickname: "Mode 2",
    bioBreve: "Esponente chiave della scena europea, Mode 2 è celebre per i suoi personaggi dinamici e le sue raffigurazioni della cultura hip hop e della vita notturna.",
    paese: "Regno Unito",
    citta: "Londra",
    fotoProfilo: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80",
    bannerSocial: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&q=80",
    linkInstagram: "https://instagram.com/mode2official",
    stato: "attivo",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    published: true,
  },
];

const exhibitions = [
  {
    titolo: "URBAN ECHOES",
    intro: "Un viaggio attraverso la giungla di cemento. Una mostra immersiva che presenta le opere di leggendari writer che esplorano la connessione tra arte e paesaggio urbano.",
    bannerHero: "https://images.unsplash.com/photo-1517511620798-cec17d428bc0?auto=format&fit=crop&q=80",
    dataApertura: "2026-05-01",
    dataChiusura: "2026-06-15",
    featured: true,
    published: true,
    artistaIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    titolo: "STYLE MASTERS",
    intro: "L'evoluzione del lettering. Scopri l'intricata evoluzione del lettering dei graffiti dagli anni '70 ai giorni nostri.",
    bannerHero: "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&q=80",
    dataApertura: "2026-07-01",
    dataChiusura: "2026-08-15",
    featured: true,
    published: true,
    artistaIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    titolo: "ABSTRACT ROOTS",
    intro: "Dalla strada alla galleria: come l'astrazione ha ridefinito il linguaggio del writing.",
    bannerHero: "https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?auto=format&fit=crop&q=80",
    dataApertura: "2026-09-01",
    dataChiusura: "2026-10-15",
    featured: false,
    published: true,
    artistaIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const articles = [
  {
    titolo: "The Birth of NYC Style Writing",
    slug: "birth-of-nyc-style-writing",
    autore: "Martha Cooper",
    contenuto: "## Le Origini\n\nAll'inizio degli anni '70, i giovani di New York iniziarono a scrivere i loro nomi sui muri e sui treni. Quello che era iniziato come un semplice gesto di auto-affermazione si è evoluto in un sistema complesso di tipografia e stile.\n\n### L'Era dei Treni\n\nI treni della metropolitana divennero la tela principale, portando il nome dei writer attraverso tutti i distretti della città...",
    immagineCopertina: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&q=80",
    published: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tag: ["storia", "nyc"],
  },
  {
    titolo: "European Graffiti Evolution",
    slug: "european-graffiti-evolution",
    autore: "Henry Chalfant",
    contenuto: "## Oltre l'Oceano\n\nQuando il movimento dello stile writing raggiunse l'Europa attraverso film come Wild Style e libri come Subway Art, trovò un terreno fertile. Da Amsterdam a Parigi, da Napoli a Berlino, ogni città ha sviluppato la propria identità unica.\n\n### La Scena Italiana\n\nIn Italia, città come Napoli e Milano sono diventate hub fondamentali per il writing europeo...",
    immagineCopertina: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&q=80",
    published: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tag: ["europa", "evoluzione"],
  },
];

export default function Populate() {
  const [status, setStatus] = useState<string>(
    "Click to populate that data bro.",
  );

  const runPopulate = async () => {
    try {
      setStatus("Populating scrittori...");
      for (const w of writers) {
        const docRef = doc(collection(db, "scrittori"));
        await setDoc(docRef, w);
      }

      setStatus("Populating mostre...");
      for (const e of exhibitions) {
        const docRef = doc(collection(db, "mostre"));
        await setDoc(docRef, e);
      }

      setStatus("Populating articoli...");
      for (const a of articles) {
        const docRef = doc(collection(db, "articoli"));
        await setDoc(docRef, a);
      }

      setStatus("Done! Now visit the site to see content.");
    } catch (e: any) {
      console.error(e);
      setStatus("Error: " + e.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded text-center shadow">
        <h1 className="text-2xl font-bold mb-4">Populate Fake Data</h1>
        <button
          onClick={runPopulate}
          className="bg-black text-white px-4 py-2 rounded mb-4"
        >
          RUN
        </button>
        <p className="text-sm font-mono">{status}</p>
      </div>
    </div>
  );
}
