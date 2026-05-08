const fs = require('fs');
const path = require('path');

const baseTranslations = {
  de: {
    "dashboard.currency": "€",
    "common.date": "Datum",
    "common.actions": "Aktionen",
    "common.loading": "Wird geladen...",
    "common.error": "Fehler",
    "common.status": "Status",
    "common.cancel": "Abbrechen",
    "sales.exportCSV": "CSV Exportieren",
    "sales.orderId": "Bestell-ID",
    "sales.productName": "Kunstwerk",
    "sales.type": "Typ",
    "sales.grossSalePrice": "Bruttopreis",
    "sales.deductions": "Abzüge",
    "sales.netRevenue": "Nettoumsatz",
    "sales.status": "Status",
    "sales.pendingCosts": "Ausstehende Kosten",
    "sales.paid": "Bezahlt",
    "sales.noSalesFound": "Keine Verkäufe gefunden.",
    "payments.amount": "Betrag",
    "payments.invoice": "Rechnung",
    "payments.method": "Methode"
  },
  it: {
    "dashboard.currency": "€",
    "common.date": "Data",
    "common.actions": "Azioni",
    "common.loading": "Caricamento...",
    "common.error": "Errore",
    "common.status": "Stato",
    "common.cancel": "Annulla",
    "sales.exportCSV": "Esporta CSV",
    "sales.orderId": "ID Ordine",
    "sales.productName": "Opera",
    "sales.type": "Tipo",
    "sales.grossSalePrice": "Prezzo Lordo",
    "sales.deductions": "Detrazioni",
    "sales.netRevenue": "Ricavo Netto",
    "sales.status": "Stato",
    "sales.pendingCosts": "Costi in Sospeso",
    "sales.paid": "Pagato",
    "sales.noSalesFound": "Nessuna vendita trovata.",
    "payments.amount": "Importo",
    "payments.invoice": "Fattura",
    "payments.method": "Metodo"
  },
  fr: {
    "dashboard.currency": "€",
    "common.date": "Date",
    "common.actions": "Actions",
    "common.loading": "Chargement...",
    "common.error": "Erreur",
    "common.status": "Statut",
    "common.cancel": "Annuler",
    "sales.exportCSV": "Exporter CSV",
    "sales.orderId": "ID de Commande",
    "sales.productName": "Œuvre",
    "sales.type": "Type",
    "sales.grossSalePrice": "Prix Brut",
    "sales.deductions": "Déductions",
    "sales.netRevenue": "Revenu Net",
    "sales.status": "Statut",
    "sales.pendingCosts": "Coûts en Attente",
    "sales.paid": "Payé",
    "sales.noSalesFound": "Aucune vente trouvée.",
    "payments.amount": "Montant",
    "payments.invoice": "Facture",
    "payments.method": "Méthode"
  },
  es: {
    "dashboard.currency": "€",
    "common.date": "Fecha",
    "common.actions": "Acciones",
    "common.loading": "Cargando...",
    "common.error": "Error",
    "common.status": "Estado",
    "common.cancel": "Cancelar",
    "sales.exportCSV": "Exportar CSV",
    "sales.orderId": "ID de Pedido",
    "sales.productName": "Obra",
    "sales.type": "Tipo",
    "sales.grossSalePrice": "Precio Bruto",
    "sales.deductions": "Deducciones",
    "sales.netRevenue": "Ingreso Neto",
    "sales.status": "Estado",
    "sales.pendingCosts": "Costos Pendientes",
    "sales.paid": "Pagado",
    "sales.noSalesFound": "No se encontraron ventas.",
    "payments.amount": "Monto",
    "payments.invoice": "Factura",
    "payments.method": "Método"
  },
  en: {
    "dashboard.currency": "€",
    "common.date": "Date",
    "common.actions": "Actions",
    "common.loading": "Loading...",
    "common.error": "Error",
    "common.status": "Status",
    "common.cancel": "Cancel",
    "sales.exportCSV": "Export CSV",
    "sales.orderId": "Order ID",
    "sales.productName": "Artwork",
    "sales.type": "Type",
    "sales.grossSalePrice": "Gross Sale Price",
    "sales.deductions": "Deductions",
    "sales.netRevenue": "Net Revenue",
    "sales.status": "Status",
    "sales.pendingCosts": "Pending Costs",
    "sales.paid": "Paid",
    "sales.noSalesFound": "No sales found.",
    "payments.amount": "Amount",
    "payments.invoice": "Invoice",
    "payments.method": "Method"
  }
};

const localesDir = path.join(__dirname, 'src', 'locales');
const languages = ['en', 'de', 'it', 'fr', 'es'];

languages.forEach(lang => {
  const filePath = path.join(localesDir, lang + '.json');
  if (!fs.existsSync(filePath)) return;
  
  const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const patches = baseTranslations[lang] || {};
  
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
  console.log('Updated ' + lang + '.json');
});
