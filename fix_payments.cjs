const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'src', 'locales');
const locales = ['en', 'it', 'de', 'fr', 'es'];

const newKeys = {
  payments: {
    andPayouts: {
      en: "& Payouts",
      it: "& Pagamenti",
      de: "& Auszahlungen",
      fr: "& Paiements",
      es: "& Pagos"
    },
    subtitle: {
      en: "Manage your earnings and request payouts.",
      it: "Gestisci i tuoi guadagni e richiedi pagamenti.",
      de: "Verwalten Sie Ihre Einnahmen und fordern Sie Auszahlungen an.",
      fr: "Gérez vos revenus et demandez des paiements.",
      es: "Gestione sus ganancias y solicite pagos."
    },
    minRequestAmount: {
      en: "Minimum request amount is €500.",
      it: "L'importo minimo della richiesta è di €500.",
      de: "Der Mindestauszahlungsbetrag beträgt 500 €.",
      fr: "Le montant minimum de la demande est de 500 €.",
      es: "El monto mínimo de solicitud es de 500 €."
    },
    exceedsBalance: {
      en: "Requested amount exceeds available balance.",
      it: "L'importo richiesto supera il saldo disponibile.",
      de: "Der angeforderte Betrag übersteigt das verfügbare Guthaben.",
      fr: "Le montant demandé dépasse le solde disponible.",
      es: "El monto solicitado excede el saldo disponible."
    },
    requestFailed: {
      en: "Failed to request payout",
      it: "Impossibile richiedere il pagamento",
      de: "Auszahlung konnte nicht angefordert werden",
      fr: "Échec de la demande de paiement",
      es: "Error al solicitar el pago"
    },
    requestSuccess: {
      en: "Payout requested successfully! We will process it shortly.",
      it: "Pagamento richiesto con successo! Lo elaboreremo a breve.",
      de: "Auszahlung erfolgreich angefordert! Wir werden sie in Kürze bearbeiten.",
      fr: "Paiement demandé avec succès ! Nous le traiterons sous peu.",
      es: "¡Pago solicitado con éxito! Lo procesaremos en breve."
    },
    balanceTooLow: {
      en: "Your available balance must be at least €500 to request a payout.",
      it: "Il tuo saldo disponibile deve essere di almeno €500 per richiedere un pagamento.",
      de: "Ihr verfügbares Guthaben muss mindestens 500 € betragen, um eine Auszahlung anzufordern.",
      fr: "Votre solde disponible doit être d'au moins 500 € pour demander un paiement.",
      es: "Su saldo disponible debe ser de al menos 500 € para solicitar un pago."
    },
    amountEur: {
      en: "Amount (EUR)",
      it: "Importo (EUR)",
      de: "Betrag (EUR)",
      fr: "Montant (EUR)",
      es: "Monto (EUR)"
    },
    euro: {
      en: "Euro",
      it: "Euro",
      de: "Euro",
      fr: "Euro",
      es: "Euro"
    },
    minPlaceholder: {
      en: "Min. 500.00",
      it: "Min. 500.00",
      de: "Min. 500.00",
      fr: "Min. 500.00",
      es: "Mín. 500.00"
    },
    paymentMethod: {
      en: "Payment Method",
      it: "Metodo di Pagamento",
      de: "Zahlungsmethode",
      fr: "Mode de Paiement",
      es: "Método de Pago"
    },
    bankTransfer: {
      en: "Bank Transfer",
      it: "Bonifico Bancario",
      de: "Banküberweisung",
      fr: "Virement Bancaire",
      es: "Transferencia Bancaria"
    },
    stripe: {
      en: "Stripe",
      it: "Stripe",
      de: "Stripe",
      fr: "Stripe",
      es: "Stripe"
    },
    uploadInvoicePdf: {
      en: "Upload Invoice (PDF)",
      it: "Carica Fattura (PDF)",
      de: "Rechnung hochladen (PDF)",
      fr: "Télécharger la Facture (PDF)",
      es: "Subir Factura (PDF)"
    },
    clickOrDrag: {
      en: "Click or drag PDF here",
      it: "Clicca o trascina il PDF qui",
      de: "Klicken oder PDF hierher ziehen",
      fr: "Cliquez ou faites glisser le PDF ici",
      es: "Haga clic o arrastre el PDF aquí"
    },
    submitting: {
      en: "Submitting...",
      it: "Invio in corso...",
      de: "Wird gesendet...",
      fr: "Soumission...",
      es: "Enviando..."
    },
    submitRequest: {
      en: "Submit Request",
      it: "Invia Richiesta",
      de: "Anfrage senden",
      fr: "Soumettre la Demande",
      es: "Enviar Solicitud"
    },
    payoutInformation: {
      en: "Payout Information",
      it: "Informazioni sul Pagamento",
      de: "Auszahlungsinformationen",
      fr: "Informations sur le Paiement",
      es: "Información de Pago"
    },
    infoMinAmount: {
      en: "Minimum payout amount is 500 Euro.",
      it: "L'importo minimo del pagamento è di 500 Euro.",
      de: "Der Mindestauszahlungsbetrag beträgt 500 Euro.",
      fr: "Le montant minimum de paiement est de 500 euros.",
      es: "El monto mínimo de pago es de 500 euros."
    },
    infoProcessingTime: {
      en: "Payments are processed within 3-5 business days.",
      it: "I pagamenti vengono elaborati entro 3-5 giorni lavorativi.",
      de: "Zahlungen werden innerhalb von 3-5 Werktagen bearbeitet.",
      fr: "Les paiements sont traités dans un délai de 3 à 5 jours ouvrables.",
      es: "Los pagos se procesan dentro de 3-5 días hábiles."
    },
    infoBillingDetails: {
      en: "Ensure your billing details in Profile are up to date.",
      it: "Assicurati che i tuoi dati di fatturazione nel Profilo siano aggiornati.",
      de: "Stellen Sie sicher, dass Ihre Rechnungsdaten im Profil aktuell sind.",
      fr: "Assurez-vous que vos informations de facturation dans le profil sont à jour.",
      es: "Asegúrese de que sus datos de facturación en el Perfil estén actualizados."
    },
    infoValidInvoice: {
      en: "A valid invoice is required for every payout request.",
      it: "È richiesta una fattura valida per ogni richiesta di pagamento.",
      de: "Für jede Auszahlungsanforderung ist eine gültige Rechnung erforderlich.",
      fr: "Une facture valide est requise pour chaque demande de paiement.",
      es: "Se requiere una factura válida para cada solicitud de pago."
    },
    noPaymentsDesc: {
      en: "Your payout requests will appear here.",
      it: "Le tue richieste di pagamento appariranno qui.",
      de: "Ihre Auszahlungsanforderungen werden hier angezeigt.",
      fr: "Vos demandes de paiement apparaîtront ici.",
      es: "Sus solicitudes de pago aparecerán aquí."
    },
    method: {
      en: "Method",
      it: "Metodo",
      de: "Methode",
      fr: "Méthode",
      es: "Método"
    },
    note: {
      en: "Note:",
      it: "Nota:",
      de: "Hinweis:",
      fr: "Note :",
      es: "Nota:"
    },
    view: {
      en: "View",
      it: "Visualizza",
      de: "Ansehen",
      fr: "Voir",
      es: "Ver"
    },
    noInvoice: {
      en: "No invoice",
      it: "Nessuna fattura",
      de: "Keine Rechnung",
      fr: "Pas de facture",
      es: "Sin factura"
    }
  }
};

locales.forEach(locale => {
  const filePath = path.join(localesDir, `${locale}.json`);
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    if (!data.payments) {
      data.payments = {};
    }

    Object.keys(newKeys.payments).forEach(key => {
      data.payments[key] = newKeys.payments[key][locale];
    });

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`Updated ${locale}.json`);
  }
});
