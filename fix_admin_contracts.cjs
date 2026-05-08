const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'src', 'locales');
const locales = ['en', 'it', 'de', 'fr', 'es'];

const newKeys = {
  adminContracts: {
    loading: {
      en: "Loading admin panel...",
      it: "Caricamento pannello di amministrazione...",
      de: "Admin-Panel wird geladen...",
      fr: "Chargement du panneau d'administration...",
      es: "Cargando panel de administración..."
    },
    title: {
      en: "Admin Panel: Contracts",
      it: "Pannello di Amministrazione: Contratti",
      de: "Admin-Panel: Verträge",
      fr: "Panneau d'administration : Contrats",
      es: "Panel de Administración: Contratos"
    },
    subtitle: {
      en: "Manage gallery agreements and track signatures.",
      it: "Gestisci gli accordi della galleria e traccia le firme.",
      de: "Galerievereinbarungen verwalten und Unterschriften verfolgen.",
      fr: "Gérez les accords de la galerie et suivez les signatures.",
      es: "Gestione los acuerdos de la galería y realice un seguimiento de las firmas."
    },
    newContract: {
      en: "New Contract",
      it: "Nuovo Contratto",
      de: "Neuer Vertrag",
      fr: "Nouveau Contrat",
      es: "Nuevo Contrato"
    },
    noContracts: {
      en: "No contracts sent",
      it: "Nessun contratto inviato",
      de: "Keine Verträge gesendet",
      fr: "Aucun contrat envoyé",
      es: "No se han enviado contratos"
    },
    noContractsDesc: {
      en: "Upload and assign contracts to artists to start tracking signatures.",
      it: "Carica e assegna contratti agli artisti per iniziare a tracciare le firme.",
      de: "Laden Sie Verträge hoch und weisen Sie sie Künstlern zu, um die Unterschriften zu verfolgen.",
      fr: "Téléchargez et attribuez des contrats aux artistes pour commencer à suivre les signatures.",
      es: "Cargue y asigne contratos a los artistas para comenzar a rastrear las firmas."
    },
    artist: {
      en: "Artist",
      it: "Artista",
      de: "Künstler",
      fr: "Artiste",
      es: "Artista"
    },
    sentDate: {
      en: "Sent Date",
      it: "Data di invio",
      de: "Sendedatum",
      fr: "Date d'envoi",
      es: "Fecha de envío"
    },
    status: {
      en: "Status",
      it: "Stato",
      de: "Status",
      fr: "Statut",
      es: "Estado"
    },
    actions: {
      en: "Actions",
      it: "Azioni",
      de: "Aktionen",
      fr: "Actions",
      es: "Acciones"
    },
    signed: {
      en: "Signed",
      it: "Firmato",
      de: "Unterzeichnet",
      fr: "Signé",
      es: "Firmado"
    },
    expired: {
      en: "Expired",
      it: "Scaduto",
      de: "Abgelaufen",
      fr: "Expiré",
      es: "Expirado"
    },
    pending: {
      en: "Pending",
      it: "In attesa",
      de: "Ausstehend",
      fr: "En attente",
      es: "Pendiente"
    },
    signedPdf: {
      en: "Signed PDF",
      it: "PDF Firmato",
      de: "Unterzeichnetes PDF",
      fr: "PDF Signé",
      es: "PDF Firmado"
    },
    viewOriginal: {
      en: "View Original",
      it: "Vedi Originale",
      de: "Original ansehen",
      fr: "Voir l'original",
      es: "Ver Original"
    },
    assignContract: {
      en: "Assign Contract",
      it: "Assegna Contratto",
      de: "Vertrag zuweisen",
      fr: "Attribuer le contrat",
      es: "Asignar Contrato"
    },
    egTitle: {
      en: "e.g. Representation Agreement 2026",
      it: "es. Accordo di Rappresentanza 2026",
      de: "z.B. Vertretungsvereinbarung 2026",
      fr: "ex. Accord de représentation 2026",
      es: "ej. Acuerdo de Representación 2026"
    },
    selected: {
      en: "selected",
      it: "selezionati",
      de: "ausgewählt",
      fr: "sélectionné(s)",
      es: "seleccionados"
    },
    noArtists: {
      en: "No artists found",
      it: "Nessun artista trovato",
      de: "Keine Künstler gefunden",
      fr: "Aucun artiste trouvé",
      es: "No se encontraron artistas"
    },
    pdfDocument: {
      en: "PDF Document",
      it: "Documento PDF",
      de: "PDF-Dokument",
      fr: "Document PDF",
      es: "Documento PDF"
    },
    sending: {
      en: "Sending...",
      it: "Invio in corso...",
      de: "Senden...",
      fr: "Envoi en cours...",
      es: "Enviando..."
    },
    sendContract: {
      en: "Send Contract",
      it: "Invia Contratto",
      de: "Vertrag senden",
      fr: "Envoyer le contrat",
      es: "Enviar Contrato"
    },
    signatureRecord: {
      en: "Signature Record",
      it: "Registro della Firma",
      de: "Unterschriftenprotokoll",
      fr: "Registre de signature",
      es: "Registro de Firma"
    },
    signedBy: {
      en: "Signed By",
      it: "Firmato Da",
      de: "Unterzeichnet von",
      fr: "Signé par",
      es: "Firmado Por"
    },
    email: {
      en: "Email",
      it: "Email",
      de: "E-Mail",
      fr: "E-mail",
      es: "Correo electrónico"
    },
    dateTime: {
      en: "Date & Time",
      it: "Data e Ora",
      de: "Datum & Uhrzeit",
      fr: "Date et Heure",
      es: "Fecha y Hora"
    },
    statusDigitallySigned: {
      en: "Status: Digitally Signed",
      it: "Stato: Firmato Digitalmente",
      de: "Status: Digital signiert",
      fr: "Statut : Signé numériquement",
      es: "Estado: Firmado Digitalmente"
    },
    uploadFailed: {
      en: "Failed to upload contract.",
      it: "Caricamento del contratto fallito.",
      de: "Vertrag konnte nicht hochgeladen werden.",
      fr: "Échec du téléchargement du contrat.",
      es: "Error al cargar el contrato."
    },
    downloadFailed: {
      en: "Failed to download the signed contract. If this is a CORS issue, please ensure your Firebase Storage bucket has CORS configured for your domain. Opening original document instead.",
      it: "Impossibile scaricare il contratto firmato. Se si tratta di un problema CORS, assicurati che il bucket Firebase Storage abbia CORS configurato per il tuo dominio. Apertura del documento originale.",
      de: "Das herunterladen des unterschriebenen Vertrags ist fehlgeschlagen. Wenn dies ein CORS-Problem ist, stellen Sie bitte sicher, dass Ihr Firebase Storage-Bucket CORS für Ihre Domain konfiguriert hat. Originaldokument wird stattdessen geöffnet.",
      fr: "Échec du téléchargement du contrat signé. S'il s'agit d'un problème CORS, veuillez vous assurer que votre bucket Firebase Storage a CORS configuré pour votre domaine. Ouverture du document original à la place.",
      es: "Error al descargar el contrato firmado. Si este es un problema de CORS, asegúrese de que su depósito de Firebase Storage tenga CORS configurado para su dominio. Abriendo el documento original en su lugar."
    },
    newContractNotification: {
      en: "New Contract to Sign",
      it: "Nuovo Contratto da Firmare",
      de: "Neuer Vertrag zur Unterschrift",
      fr: "Nouveau contrat à signer",
      es: "Nuevo Contrato para Firmar"
    },
    newContractNotificationBody: {
      en: "You have a new contract to sign: \"{{title}}\"",
      it: "Hai un nuovo contratto da firmare: \"{{title}}\"",
      de: "Sie haben einen neuen Vertrag zu unterschreiben: \"{{title}}\"",
      fr: "Vous avez un nouveau contrat à signer : \"{{title}}\"",
      es: "Tiene un nuevo contrato para firmar: \"{{title}}\""
    }
  }
};

locales.forEach(locale => {
  const filePath = path.join(localesDir, `${locale}.json`);
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    if (!data.adminContracts) {
      data.adminContracts = {};
    }

    Object.keys(newKeys.adminContracts).forEach(key => {
      data.adminContracts[key] = newKeys.adminContracts[key][locale];
    });

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`Updated ${locale}.json`);
  }
});
