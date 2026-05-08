const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'src', 'locales');
const locales = ['en', 'it', 'de', 'fr', 'es'];

const newKeys = {
  adminPayments: {
    paymentMarked: {
      en: "Payment marked as {{status}}.",
      it: "Pagamento contrassegnato come {{status}}.",
      de: "Zahlung als {{status}} markiert.",
      fr: "Paiement marqué comme {{status}}.",
      es: "Pago marcado como {{status}}."
    },
    payoutStatus: {
      en: "Payout {{status}}",
      it: "Pagamento {{status}}",
      de: "Auszahlung {{status}}",
      fr: "Paiement {{status}}",
      es: "Pago {{status}}"
    },
    payoutStatusBody: {
      en: "Your payout request for €{{amount}} has been marked as {{status}}.",
      it: "La tua richiesta di pagamento di €{{amount}} è stata contrassegnata come {{status}}.",
      de: "Ihre Auszahlungsanforderung über {{amount}} € wurde als {{status}} markiert.",
      fr: "Votre demande de paiement de {{amount}} € a été marquée comme {{status}}.",
      es: "Su solicitud de pago de {{amount}} € ha sido marcada como {{status}}."
    },
    updateFailed: {
      en: "Failed to update payment status.",
      it: "Impossibile aggiornare lo stato del pagamento.",
      de: "Zahlungsstatus konnte nicht aktualisiert werden.",
      fr: "Échec de la mise à jour du statut du paiement.",
      es: "Error al actualizar el estado del pago."
    },
    allRequests: {
      en: "All Requests",
      it: "Tutte le Richieste",
      de: "Alle Anfragen",
      fr: "Toutes les Demandes",
      es: "Todas las Solicitudes"
    },
    artistEmail: {
      en: "Artist Email",
      it: "Email Artista",
      de: "Künstler-E-Mail",
      fr: "E-mail de l'artiste",
      es: "Correo del Artista"
    },
    unknown: {
      en: "Unknown",
      it: "Sconosciuto",
      de: "Unbekannt",
      fr: "Inconnu",
      es: "Desconocido"
    },
    viewInvoice: {
      en: "View Invoice",
      it: "Visualizza Fattura",
      de: "Rechnung ansehen",
      fr: "Voir la Facture",
      es: "Ver Factura"
    },
    approve: {
      en: "Approve",
      it: "Approva",
      de: "Genehmigen",
      fr: "Approuver",
      es: "Aprobar"
    },
    reject: {
      en: "Reject",
      it: "Rifiuta",
      de: "Ablehnen",
      fr: "Rejeter",
      es: "Rechazar"
    },
    noRequests: {
      en: "No payment requests found.",
      it: "Nessuna richiesta di pagamento trovata.",
      de: "Keine Auszahlungsanforderungen gefunden.",
      fr: "Aucune demande de paiement trouvée.",
      es: "No se encontraron solicitudes de pago."
    },
    markAs: {
      en: "Mark as {{status}}",
      it: "Contrassegna come {{status}}",
      de: "Als {{status}} markieren",
      fr: "Marquer comme {{status}}",
      es: "Marcar como {{status}}"
    },
    adminNoteOptional: {
      en: "Admin Note (Optional)",
      it: "Nota Amministratore (Opzionale)",
      de: "Admin-Hinweis (Optional)",
      fr: "Note de l'administrateur (Facultatif)",
      es: "Nota del Administrador (Opcional)"
    },
    notePlaceholder: {
      en: "Add a note to explain why this was {{status}}...",
      it: "Aggiungi una nota per spiegare perché è stato {{status}}...",
      de: "Fügen Sie eine Notiz hinzu, um zu erklären, warum dies {{status}} wurde...",
      fr: "Ajoutez une note pour expliquer pourquoi cela a été {{status}}...",
      es: "Agregue una nota para explicar por qué esto fue {{status}}..."
    },
    confirmStatus: {
      en: "Confirm {{status}}",
      it: "Conferma {{status}}",
      de: "Bestätigen {{status}}",
      fr: "Confirmer {{status}}",
      es: "Confirmar {{status}}"
    },
    paid: {
      en: "Paid",
      it: "Pagato",
      de: "Bezahlt",
      fr: "Payé",
      es: "Pagado"
    },
    rejected: {
      en: "Rejected",
      it: "Rifiutato",
      de: "Abgelehnt",
      fr: "Rejeté",
      es: "Rechazado"
    }
  }
};

locales.forEach(locale => {
  const filePath = path.join(localesDir, `${locale}.json`);
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    if (!data.adminPayments) {
      data.adminPayments = {};
    }

    Object.keys(newKeys.adminPayments).forEach(key => {
      data.adminPayments[key] = newKeys.adminPayments[key][locale];
    });

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`Updated ${locale}.json`);
  }
});
