const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'src', 'locales');
const locales = ['en', 'it', 'de', 'fr', 'es'];

const newKeys = {
  adminDashboard: {
    totalUsers: {
      en: "Total Users",
      it: "Utenti Totali",
      de: "Benutzer Gesamt",
      fr: "Utilisateurs Totaux",
      es: "Usuarios Totales"
    },
    pendingArtworks: {
      en: "Pending Artworks",
      it: "Opere in Attesa",
      de: "Ausstehende Kunstwerke",
      fr: "Œuvres en Attente",
      es: "Obras Pendientes"
    },
    pendingPayments: {
      en: "Pending Payments",
      it: "Pagamenti in Attesa",
      de: "Ausstehende Zahlungen",
      fr: "Paiements en Attente",
      es: "Pagos Pendientes"
    },
    totalContracts: {
      en: "Total Contracts",
      it: "Contratti Totali",
      de: "Verträge Gesamt",
      fr: "Contrats Totaux",
      es: "Contratos Totales"
    },
    title: {
      en: "Admin Dashboard",
      it: "Dashboard Amministratore",
      de: "Admin-Dashboard",
      fr: "Tableau de Bord Administrateur",
      es: "Panel de Administrador"
    },
    subtitle: {
      en: "Overview of platform activity.",
      it: "Panoramica delle attività della piattaforma.",
      de: "Übersicht der Plattformaktivitäten.",
      fr: "Aperçu de l'activité de la plateforme.",
      es: "Resumen de la actividad de la plataforma."
    }
  }
};

locales.forEach(locale => {
  const filePath = path.join(localesDir, `${locale}.json`);
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    if (!data.adminDashboard) {
      data.adminDashboard = {};
    }

    Object.keys(newKeys.adminDashboard).forEach(key => {
      data.adminDashboard[key] = newKeys.adminDashboard[key][locale];
    });

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`Updated ${locale}.json`);
  }
});
