const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'src', 'locales');
const locales = ['en', 'it', 'de', 'fr', 'es'];

const newKeys = {
  artworks: {
    allArtworks: {
      en: "All Artworks",
      it: "Tutte le Opere",
      de: "Alle Kunstwerke",
      fr: "Toutes les Œuvres",
      es: "Todas las Obras"
    },
    title: {
      en: "My Artworks",
      it: "Le Mie Opere",
      de: "Meine Kunstwerke",
      fr: "Mes Œuvres",
      es: "Mis Obras"
    },
    subtitle: {
      en: "Manage your portfolio and track sales.",
      it: "Gestisci il tuo portfolio e monitora le vendite.",
      de: "Verwalten Sie Ihr Portfolio und verfolgen Sie Verkäufe.",
      fr: "Gérez votre portfolio et suivez les ventes.",
      es: "Gestiona tu portafolio y realiza un seguimiento de las ventas."
    },
    adminSubtitle: {
      en: "Manage artist submissions and platform portfolio.",
      it: "Gestisci le candidature degli artisti e il portfolio della piattaforma.",
      de: "Verwalten Sie Künstlereinreichungen und das Plattform-Portfolio.",
      fr: "Gérez les soumissions d'artistes et le portfolio de la plateforme.",
      es: "Gestiona las solicitudes de artistas y el portafolio de la plataforma."
    },
    uploadNew: {
      en: "Upload New",
      it: "Carica Nuova",
      de: "Neu hochladen",
      fr: "Télécharger une nouvelle",
      es: "Subir Nueva"
    },
    searchPlaceholder: {
      en: "Search artworks...",
      it: "Cerca opere...",
      de: "Kunstwerke suchen...",
      fr: "Rechercher des œuvres...",
      es: "Buscar obras..."
    },
    noArtworksFound: {
      en: "No artworks found",
      it: "Nessuna opera trovata",
      de: "Keine Kunstwerke gefunden",
      fr: "Aucune œuvre trouvée",
      es: "No se encontraron obras"
    },
    noArtworksDesc: {
      en: "You haven't uploaded any artworks yet, or none match your current filters.",
      it: "Non hai ancora caricato alcuna opera, oppure nessuna corrisponde ai filtri attuali.",
      de: "Sie haben noch keine Kunstwerke hochgeladen, oder keines entspricht Ihren aktuellen Filtern.",
      fr: "Vous n'avez pas encore téléchargé d'œuvres, ou aucune ne correspond à vos filtres actuels.",
      es: "Aún no has subido ninguna obra, o ninguna coincide con tus filtros actuales."
    },
    uploadFirst: {
      en: "Upload Your First Artwork",
      it: "Carica la Tua Prima Opera",
      de: "Laden Sie Ihr erstes Kunstwerk hoch",
      fr: "Téléchargez votre première œuvre",
      es: "Sube tu primera obra"
    },
    approve: {
      en: "Approve",
      it: "Approva",
      de: "Genehmigen",
      fr: "Approuver",
      es: "Aprobar"
    },
    approving: {
      en: "Approving...",
      it: "Approvazione...",
      de: "Genehmige...",
      fr: "Approbation...",
      es: "Aprobando..."
    },
    reject: {
      en: "Reject",
      it: "Rifiuta",
      de: "Ablehnen",
      fr: "Rejeter",
      es: "Rechazar"
    },
    edit: {
      en: "Edit",
      it: "Modifica",
      de: "Bearbeiten",
      fr: "Modifier",
      es: "Editar"
    },
    rejectArtwork: {
      en: "Reject Artwork",
      it: "Rifiuta Opera",
      de: "Kunstwerk ablehnen",
      fr: "Rejeter l'œuvre",
      es: "Rechazar Obra"
    },
    rejectReasonPrompt: {
      en: "Please provide a reason for rejecting '{{title}}'. This will be sent to the artist.",
      it: "Fornisci un motivo per il rifiuto di '{{title}}'. Questo verrà inviato all'artista.",
      de: "Bitte geben Sie einen Grund für die Ablehnung von '{{title}}' an. Dies wird an den Künstler gesendet.",
      fr: "Veuillez fournir une raison pour le rejet de '{{title}}'. Cela sera envoyé à l'artiste.",
      es: "Proporcione un motivo para rechazar '{{title}}'. Esto se enviará al artista."
    },
    rejectReasonPlaceholder: {
      en: "Reason for rejection...",
      it: "Motivo del rifiuto...",
      de: "Grund für die Ablehnung...",
      fr: "Raison du rejet...",
      es: "Motivo del rechazo..."
    },
    confirmRejection: {
      en: "Confirm Rejection",
      it: "Conferma Rifiuto",
      de: "Ablehnung bestätigen",
      fr: "Confirmer le rejet",
      es: "Confirmar Rechazo"
    },
    approvedSuccess: {
      en: "Artwork \"{{title}}\" approved and Ecwid product created successfully!",
      it: "Opera \"{{title}}\" approvata e prodotto Ecwid creato con successo!",
      de: "Kunstwerk \"{{title}}\" genehmigt und Ecwid-Produkt erfolgreich erstellt!",
      fr: "Œuvre \"{{title}}\" approuvée et produit Ecwid créé avec succès !",
      es: "¡Obra \"{{title}}\" aprobada y producto Ecwid creado con éxito!"
    },
    rejectedSuccess: {
      en: "Artwork \"{{title}}\" rejected.",
      it: "Opera \"{{title}}\" rifiutata.",
      de: "Kunstwerk \"{{title}}\" abgelehnt.",
      fr: "Œuvre \"{{title}}\" rejetée.",
      es: "Obra \"{{title}}\" rechazada."
    },
    approveFailed: {
      en: "Failed to approve artwork",
      it: "Impossibile approvare l'opera",
      de: "Kunstwerk konnte nicht genehmigt werden",
      fr: "Échec de l'approbation de l'œuvre",
      es: "Error al aprobar la obra"
    },
    statusApproved: {
      en: "Approved",
      it: "Approvato",
      de: "Genehmigt",
      fr: "Approuvé",
      es: "Aprobado"
    },
    statusPending: {
      en: "Pending Approval",
      it: "In Attesa di Approvazione",
      de: "Ausstehende Genehmigung",
      fr: "En Attente d'Approbation",
      es: "Pendiente de Aprobación"
    },
    statusSold: {
      en: "Sold",
      it: "Venduto",
      de: "Verkauft",
      fr: "Vendu",
      es: "Vendido"
    },
    statusDraft: {
      en: "Draft",
      it: "Bozza",
      de: "Entwurf",
      fr: "Brouillon",
      es: "Borrador"
    },
    statusRejected: {
      en: "Rejected",
      it: "Rifiutato",
      de: "Abgelehnt",
      fr: "Rejeté",
      es: "Rechazado"
    },
    all: {
      en: "All",
      it: "Tutti",
      de: "Alle",
      fr: "Tous",
      es: "Todos"
    }
  }
};

locales.forEach(locale => {
  const filePath = path.join(localesDir, `${locale}.json`);
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    if (!data.artworks) {
      data.artworks = {};
    }

    Object.keys(newKeys.artworks).forEach(key => {
      data.artworks[key] = newKeys.artworks[key][locale];
    });

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`Updated ${locale}.json`);
  }
});
