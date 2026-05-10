import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc } from "firebase/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app);

const writers = [
  {
    artistName: "Shaone",
    bio: "Shaone is a legendary writer known for intricate characters and storytelling.",
    country: "Italy",
    city: "Naples",
    profileImageUrl: "https://placehold.co/400x400/FF4F00/FFF?text=Coming+Soon",
    coverImageUrl: "https://placehold.co/1200x400/121212/FFF?text=Coming+Soon",
    instagramUrl: "https://instagram.com/shaone",
    isPublished: true,
    createdAt: new Date().toISOString(),
  },
  {
    artistName: "Phase 2",
    bio: "Pioneer of bubble letters and early NYC style writing.",
    country: "USA",
    city: "New York",
    profileImageUrl: "https://placehold.co/400x400/4CAF50/FFF?text=Coming+Soon",
    coverImageUrl: "https://placehold.co/1200x400/121212/FFF?text=Coming+Soon",
    instagramUrl: "",
    isPublished: true,
    createdAt: new Date().toISOString(),
  },
  {
    artistName: "Futura 2000",
    bio: "Abstract graffiti pioneer.",
    country: "USA",
    city: "New York",
    profileImageUrl: "https://placehold.co/400x400/2196F3/FFF?text=Coming+Soon",
    coverImageUrl: "https://placehold.co/1200x400/121212/FFF?text=Coming+Soon",
    instagramUrl: "",
    isPublished: true,
    createdAt: new Date().toISOString(),
  },
  {
    artistName: "Dondi White",
    bio: "Style master and one of the most influential graffiti artists.",
    country: "USA",
    city: "New York",
    profileImageUrl: "https://placehold.co/400x400/9C27B0/FFF?text=Coming+Soon",
    coverImageUrl: "https://placehold.co/1200x400/121212/FFF?text=Coming+Soon",
    instagramUrl: "",
    isPublished: true,
    createdAt: new Date().toISOString(),
  },
  {
    artistName: "Lady Pink",
    bio: "First lady of graffiti.",
    country: "USA",
    city: "New York",
    profileImageUrl: "https://placehold.co/400x400/E91E63/FFF?text=Coming+Soon",
    coverImageUrl: "https://placehold.co/1200x400/121212/FFF?text=Coming+Soon",
    instagramUrl: "",
    isPublished: true,
    createdAt: new Date().toISOString(),
  },
  {
    artistName: "Mode 2",
    bio: "Legendary European graffiti artist known for characters.",
    country: "UK",
    city: "London",
    profileImageUrl: "https://placehold.co/400x400/FFC107/121212?text=Coming+Soon",
    coverImageUrl: "https://placehold.co/1200x400/121212/FFF?text=Coming+Soon",
    instagramUrl: "",
    isPublished: true,
    createdAt: new Date().toISOString(),
  }
];

const exhibitions = [
  {
    title: "Urban Echoes",
    subtitle: "A journey through the concrete jungle",
    description: "An immersive exhibition featuring the works of legendary graffiti artists exploring the connection between art and the urban landscape.",
    coverImageUrl: "https://placehold.co/800x600/FF4F00/FFF?text=Coming+Soon",
    dateStart: "2026-05-01",
    dateEnd: "2026-06-15",
    isFeatured: true,
    isPublished: true,
    writerIds: [],
    createdAt: new Date().toISOString(),
  },
  {
    title: "Style Masters",
    subtitle: "The evolution of lettering",
    description: "Discover the intricate evolution of graffiti lettering from the 70s to modern times.",
    coverImageUrl: "https://placehold.co/800x600/2196F3/FFF?text=Coming+Soon",
    dateStart: "2026-07-01",
    dateEnd: "2026-08-15",
    isFeatured: false,
    isPublished: true,
    writerIds: [],
    createdAt: new Date().toISOString(),
  },
  {
    title: "Colors of the Street",
    subtitle: "Vibrancy and emotion in graffiti",
    description: "A celebration of color used in public spaces to convey powerful messages.",
    coverImageUrl: "https://placehold.co/800x600/4CAF50/FFF?text=Coming+Soon",
    dateStart: "2026-09-01",
    dateEnd: "2026-10-31",
    isFeatured: false,
    isPublished: true,
    writerIds: [],
    createdAt: new Date().toISOString(),
  },
  {
    title: "Characters in Focus",
    subtitle: "Beyond the letters",
    description: "Exploring the iconic characters that have become synonymous with graffiti culture.",
    coverImageUrl: "https://placehold.co/800x600/9C27B0/FFF?text=Coming+Soon",
    dateStart: "2026-11-01",
    dateEnd: "2026-12-15",
    isFeatured: false,
    isPublished: true,
    writerIds: [],
    createdAt: new Date().toISOString(),
  },
  {
    title: "Train Canvas",
    subtitle: "The rolling galieries",
    description: "A tribute to the golden era of subway art.",
    coverImageUrl: "https://placehold.co/800x600/E91E63/FFF?text=Coming+Soon",
    dateStart: "2027-01-01",
    dateEnd: "2027-02-28",
    isFeatured: true,
    isPublished: true,
    writerIds: [],
    createdAt: new Date().toISOString(),
  },
  {
    title: "Global Voices",
    subtitle: "Graffiti around the world",
    description: "Showcasing how the NYC movement influenced the global scene.",
    coverImageUrl: "https://placehold.co/800x600/FFC107/121212?text=Coming+Soon",
    dateStart: "2027-03-01",
    dateEnd: "2027-04-30",
    isFeatured: false,
    isPublished: true,
    writerIds: [],
    createdAt: new Date().toISOString(),
  }
];

const articles = [
  {
    title: "The Birth of NYC Style Writing",
    slug: "birth-of-nyc-style-writing",
    author: "Martha Cooper",
    content: "## The Beginning\n\nIn the early 1970s, young people in New York City started writing their names on the walls and trains...",
    coverImageUrl: "https://placehold.co/800x400/FF4F00/FFF?text=Coming+Soon",
    isPublished: true,
    createdAt: new Date().toISOString(),
    tags: ["history", "nyc"]
  },
  {
    title: "European Graffiti Evolution",
    slug: "european-graffiti-evolution",
    author: "Henry Chalfant",
    content: "## Across the Pond\n\nWhen the style writing movement reached Europe, it took on new forms and embraced local cultures...",
    coverImageUrl: "https://placehold.co/800x400/2196F3/FFF?text=Coming+Soon",
    isPublished: true,
    createdAt: new Date().toISOString(),
    tags: ["europe", "evolution"]
  },
  {
    title: "Digital Art vs Traditional Spray",
    slug: "digital-art-vs-traditional-spray",
    author: "Claudio Brignole",
    content: "## Modern Times\n\nHow the digital age is impacting traditional graffiti culture...",
    coverImageUrl: "https://placehold.co/800x400/4CAF50/FFF?text=Coming+Soon",
    isPublished: true,
    createdAt: new Date().toISOString(),
    tags: ["digital", "modern"]
  }
];

async function populate() {
  console.log("Populating writers...");
  for (const w of writers) {
    const docRef = doc(collection(db, "writers"));
    await setDoc(docRef, w);
  }
  
  console.log("Populating exhibitions...");
  for (const e of exhibitions) {
    const docRef = doc(collection(db, "exhibitions"));
    await setDoc(docRef, e);
  }
  
  console.log("Populating articles...");
  for (const a of articles) {
    const docRef = doc(collection(db, "articles"));
    await setDoc(docRef, a);
  }
  
  console.log("Done!");
  process.exit(0);
}

populate().catch(console.error);
