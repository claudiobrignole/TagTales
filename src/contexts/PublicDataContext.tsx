import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "../firebase";

interface PublicDataContextType {
  writers: any[];
  exhibitions: any[];
  articles: any[];
  loading: boolean;
  refreshData: () => Promise<void>;
}

const PublicDataContext = createContext<PublicDataContextType | undefined>(undefined);

export const usePublicData = () => {
  const context = useContext(PublicDataContext);
  if (!context) {
    throw new Error("usePublicData must be used within a PublicDataProvider");
  }
  return context;
};

export const PublicDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [writers, setWriters] = useState<any[]>([]);
  const [exhibitions, setExhibitions] = useState<any[]>([]);
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Parallel Queries with proper Firestore filters and order where supported (Optimization 1 & 2)
      const writersQuery = query(
        collection(db, "scrittori"),
        where("published", "==", true)
      );
      const exhibitionsQuery = query(
        collection(db, "mostre"),
        where("published", "==", true)
      );
      const articlesQuery = query(
        collection(db, "articoli"),
        where("published", "==", true)
      );

      const [writersSnap, exhibitionsSnap, articlesSnap] = await Promise.all([
        getDocs(writersQuery),
        getDocs(exhibitionsQuery),
        getDocs(articlesQuery)
      ]);

      // Process writers
      const writersMap: Record<string, string> = {};
      const writersMapClean: Record<string, string> = {};
      const processedWriters = writersSnap.docs.map((doc) => {
        const data = doc.data();
        const nickname = data.nickname || data.artistName || "Writer";
        writersMap[doc.id] = nickname;
        writersMapClean[doc.id] = nickname.toLowerCase();
        return {
          id: doc.id,
          ...data,
          name: nickname,
          fotoProfilo: data.fotoProfilo || data.profileImageUrl,
          nation: data.paese || data.country || "",
          img: data.fotoProfilo || data.profileImageUrl,
        };
      }).sort((a: any, b: any) => (a.order ?? 999) - (b.order ?? 999));

      // Process exhibitions
      const processedExhibitions = exhibitionsSnap.docs.map((doc) => {
        const data = doc.data();
        const year = data.dataApertura ? data.dataApertura.substring(0, 4) : "";
        const artistaId = data.artistaIds?.[0] || data.artistaPrincipaleId || data.writerIds?.[0];
        
        // Match names for Exhibitions filter matching
        const artistNames = (data.artistaIds || data.writerIds || [])
          .map((id: string) => writersMapClean[id] || writersMap[id])
          .filter(Boolean);

        if (artistNames.length === 0 && artistaId && (writersMapClean[artistaId] || writersMap[artistaId])) {
          artistNames.push(writersMapClean[artistaId] || writersMap[artistaId]);
        }

        return {
          id: doc.id,
          ...data,
          subtitle: data.intro || data.sottotitolo || data.subtitle || "",
          description: data.testoCuratela || data.descrizione || data.description || "",
          image: data.bannerHero || data.coverImageUrl,
          img: data.bannerHero || data.coverImageUrl,
          bannerHero: data.bannerHero || data.coverImageUrl,
          fallbackUrl: data.bannerHeroFallback || "",
          tagImage: data.tagImage || "",
          dataApertura: data.dataApertura || "",
          title: data.titolo || data.title,
          preTitolo: data.preTitolo || "",
          owner: artistaId ? writersMap[artistaId] || "MOSTRA" : "MOSTRA",
          link: `/exhibitions/${data.slug || doc.id}`,
          buttonText: "VISITA LA MOSTRA",
          year,
          artistNames,
        };
      }).sort((a: any, b: any) => {
        if (a.order !== undefined || b.order !== undefined) {
          return (a.order ?? 999) - (b.order ?? 999);
        }
        const dateA = a.dataApertura || "0";
        const dateB = b.dataApertura || "0";
        return dateB.localeCompare(dateA);
      });

      // Process articles
      const processedArticles = articlesSnap.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          titolo: data.titolo || data.title || "ARTICOLO",
          title: data.titolo || data.title,
          immagineCopertina: data.immagineCopertina || data.coverImageUrl,
          img: data.immagineCopertina || data.coverImageUrl,
          tag: data.tag?.[0] || data.tags?.[0] || "ARTICOLO",
        };
      }).sort((a: any, b: any) => {
        if (a.order !== undefined || b.order !== undefined) {
          return (a.order ?? 999) - (b.order ?? 999);
        }
        return (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0);
      });

      setWriters(processedWriters);
      setExhibitions(processedExhibitions);
      setArticles(processedArticles);
    } catch (error) {
      console.error("Error loading public Firestore cached context data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <PublicDataContext.Provider
      value={{
        writers,
        exhibitions,
        articles,
        loading,
        refreshData: fetchData,
      }}
    >
      {children}
    </PublicDataContext.Provider>
  );
};
