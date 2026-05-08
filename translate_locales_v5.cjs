const fs = require('fs');
const path = require('path');

const patchedTranslations = {
  it: {
    "dashboard.onboarding.allSet": "Hai finito! Benvenuto in TagTales",
    "dashboard.onboarding.welcome": "Benvenuto! Prepariamo il tuo account",
    "dashboard.onboarding.completed": "Completato",
    "dashboard.onboarding.step1": "Passo 1 — Completa il tuo profilo",
    "dashboard.onboarding.step1Desc": "Aggiungi il tuo nome, bio e foto nella sezione Profilo.",
    "dashboard.onboarding.step2": "Passo 2 — Aggiungi i dati bancari",
    "dashboard.onboarding.step2Desc": "Salva IBAN e BIC nella sezione Profilo per ricevere i pagamenti.",
    "dashboard.onboarding.step3": "Passo 3 — Firma il contratto",
    "dashboard.onboarding.step3Desc": "Rivedi e firma il tuo contratto nella sezione Contratti.",
    "dashboard.onboarding.step4": "Passo 4 — Attendi l'approvazione delle opere",
    "dashboard.onboarding.step4Desc": "Il nostro team completerà questo passaggio dopo aver approvato le tue opere.",
    
    "sales.subtitle": "Monitora le vendite delle tue opere e i tuoi guadagni.",
    "sales.totalEarnings": "Guadagni Totali",
    "sales.filtered": "Filtrato",
    "sales.artworksSold": "Opere Vendute",
    "sales.avgPrice": "Prezzo Medio",
    "sales.exportCSV": "Esporta CSV",
    "sales.noSalesFound": "Nessuna vendita trovata.",
    
    "contracts.subtitle": "Rivedi e gestisci i tuoi accordi con la galleria.",
    "contracts.noContractsFound": "Nessun contratto presente",
    "contracts.noContractsDesc": "Quando inizierai a vendere o a partecipare a mostre, i tuoi accordi legali appariranno qui.",
    
    "artworks.title": "Le Mie Opere",
    "artworks.subtitle": "Gestisci il tuo portfolio e traccia le vendite.",
    "artworks.uploadFirst": "Carica la Tua Prima Opera",
    "artworks.searchPlaceholder": "Cerca opere...",
    "artworks.noArtworksFound": "Nessuna opera trovata.",
    "artworks.noArtworksDesc": "Non hai ancora caricato opere d'arte, oppure nessuna corrisponde ai tuoi filtri attuali."
  },
  de: {
    "dashboard.onboarding.allSet": "Alles erledigt! Willkommen bei TagTales",
    "dashboard.onboarding.welcome": "Willkommen! Lassen Sie uns Ihr Konto einrichten",
    "dashboard.onboarding.completed": "Abgeschlossen",
    "dashboard.onboarding.step1": "Schritt 1 — Profil vervollständigen",
    "dashboard.onboarding.step1Desc": "Fügen Sie Ihren Namen, Ihre Bio und Ihr Foto im Profilbereich hinzu.",
    "dashboard.onboarding.step2": "Schritt 2 — Bankverbindung hinzufügen",
    "dashboard.onboarding.step2Desc": "Speichern Sie IBAN und BIC im Profilbereich, um Zahlungen zu erhalten.",
    "dashboard.onboarding.step3": "Schritt 3 — Vertrag unterschreiben",
    "dashboard.onboarding.step3Desc": "Überprüfen und unterschreiben Sie Ihren Vertrag im Bereich Verträge.",
    "dashboard.onboarding.step4": "Schritt 4 — Warten Sie auf die Verbindung der Kunstwerke",
    "dashboard.onboarding.step4Desc": "Unser Team wird diesen Schritt abschließen, nachdem Ihre Kunstwerke genehmigt wurden.",
    
    "sales.subtitle": "Verfolgen Sie die Verkäufe Ihrer Kunstwerke und Ihre Einnahmen.",
    "sales.totalEarnings": "Gesamteinnahmen",
    "sales.filtered": "Gefiltert",
    "sales.artworksSold": "Verkaufte Kunstwerke",
    "sales.avgPrice": "Durchschnittspreis",
    "sales.exportCSV": "CSV Exportieren",
    "sales.noSalesFound": "Keine Verkäufe gefunden.",
    
    "contracts.subtitle": "Überprüfen und verwalten Sie Ihre Galerievereinbarungen.",
    "contracts.noContractsFound": "Noch keine Verträge",
    "contracts.noContractsDesc": "Wenn Sie anfangen zu verkaufen oder an Ausstellungen teilzunehmen, erscheinen Ihre rechtlichen Vereinbarungen hier.",
    
    "artworks.title": "Meine Kunstwerke",
    "artworks.subtitle": "Verwalten Sie Ihr Portfolio und verfolgen Sie Verkäufe.",
    "artworks.uploadFirst": "Laden Sie Ihr erstes Kunstwerk hoch",
    "artworks.searchPlaceholder": "Kunstwerke suchen...",
    "artworks.noArtworksFound": "Keine Kunstwerke gefunden.",
    "artworks.noArtworksDesc": "Sie haben noch keine Kunstwerke hochgeladen oder keines entspricht Ihren aktuellen Filtern."
  },
  fr: {
    "dashboard.onboarding.allSet": "Tout est prêt ! Bienvenue sur TagTales",
    "dashboard.onboarding.welcome": "Bienvenue ! Configurons votre compte",
    "dashboard.onboarding.completed": "Terminé",
    "dashboard.onboarding.step1": "Étape 1 — Complétez votre profil",
    "dashboard.onboarding.step1Desc": "Ajoutez votre nom d'affichage, votre bio et votre photo dans la section Profil.",
    "dashboard.onboarding.step2": "Étape 2 — Ajoutez vos coordonnées bancaires",
    "dashboard.onboarding.step2Desc": "Enregistrez votre IBAN et BIC dans la section Profil pour recevoir les paiements.",
    "dashboard.onboarding.step3": "Étape 3 — Signez votre contrat",
    "dashboard.onboarding.step3Desc": "Lisez et signez votre contrat dans la section Contrats.",
    "dashboard.onboarding.step4": "Étape 4 — Attendez la connexion de vos œuvres",
    "dashboard.onboarding.step4Desc": "Notre équipe complétera cette étape après avoir approuvé vos œuvres.",
    
    "sales.subtitle": "Suivez les ventes de vos œuvres et vos revenus.",
    "sales.totalEarnings": "Revenus Totaux",
    "sales.filtered": "Filtré",
    "sales.artworksSold": "Œuvres Vendues",
    "sales.avgPrice": "Prix Moyen",
    "sales.exportCSV": "Exporter CSV",
    "sales.noSalesFound": "Aucune vente trouvée.",
    
    "contracts.subtitle": "Révisez et gérez vos accords de galerie.",
    "contracts.noContractsFound": "Aucun contrat",
    "contracts.noContractsDesc": "Lorsque vous commencerez à vendre ou à participer à des expositions, vos accords légaux apparaîtront ici.",
    
    "artworks.title": "Mes Œuvres",
    "artworks.subtitle": "Gérez votre portfolio et suivez les ventes.",
    "artworks.uploadFirst": "Téléchargez votre première œuvre",
    "artworks.searchPlaceholder": "Rechercher des œuvres...",
    "artworks.noArtworksFound": "Aucune œuvre trouvée.",
    "artworks.noArtworksDesc": "Vous n'avez pas encore téléchargé d'œuvres, ou aucune ne correspond à vos filtres actuels."
  },
  es: {
    "dashboard.onboarding.allSet": "¡Todo listo! Bienvenido a TagTales",
    "dashboard.onboarding.welcome": "¡Bienvenido! Configuremos tu cuenta",
    "dashboard.onboarding.completed": "Completado",
    "dashboard.onboarding.step1": "Paso 1 — Completa tu perfil",
    "dashboard.onboarding.step1Desc": "Agrega tu nombre para mostrar, biografía y foto en la sección Perfil.",
    "dashboard.onboarding.step2": "Paso 2 — Agrega tus datos bancarios",
    "dashboard.onboarding.step2Desc": "Guarda tu IBAN y BIC en la sección Perfil para recibir pagos.",
    "dashboard.onboarding.step3": "Paso 3 — Firma tu contrato",
    "dashboard.onboarding.step3Desc": "Revisa y firma tu contrato en la sección Contratos.",
    "dashboard.onboarding.step4": "Paso 4 — Espera la conexión de tus obras",
    "dashboard.onboarding.step4Desc": "Nuestro equipo completará este paso después de aprobar tus obras de arte.",
    
    "sales.subtitle": "Rastrea las ventas de tus obras y tus ganancias.",
    "sales.totalEarnings": "Ganancias Totales",
    "sales.filtered": "Filtrado",
    "sales.artworksSold": "Obras Vendidas",
    "sales.avgPrice": "Precio Promedio",
    "sales.exportCSV": "Exportar CSV",
    "sales.noSalesFound": "No se encontraron ventas.",
    
    "contracts.subtitle": "Revisa y gestiona tus acuerdos de galería.",
    "contracts.noContractsFound": "Aún no hay contratos",
    "contracts.noContractsDesc": "Cuando empieces a vender o expongas, tus acuerdos legales aparecerán aquí.",
    
    "artworks.title": "Mis Obras",
    "artworks.subtitle": "Gestiona tu portafolio y rastrea las ventas.",
    "artworks.uploadFirst": "Sube tu primera obra",
    "artworks.searchPlaceholder": "Buscar obras...",
    "artworks.noArtworksFound": "No se encontraron obras.",
    "artworks.noArtworksDesc": "Aún no has subido ninguna obra, o ninguna coincide con tus filtros actuales."
  },
  en: {
    "contracts.noContractsDesc": "When you start selling or participating in exhibitions, your legal agreements will appear here."
  }
};

const localesDir = path.join(__dirname, 'src', 'locales');

for (const [lang, patches] of Object.entries(patchedTranslations)) {
  const filePath = path.join(localesDir, `${lang}.json`);
  if (!fs.existsSync(filePath)) continue;
  
  const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  
  for (const [keyPath, value] of Object.entries(patches)) {
    const keys = keyPath.split('.');
    let current = content;
    for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
  }
  
  fs.writeFileSync(filePath, JSON.stringify(content, null, 2));
  console.log(`Updated ${lang}.json`);
}
