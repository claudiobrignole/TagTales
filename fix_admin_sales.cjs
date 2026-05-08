const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'src', 'locales');
const locales = ['en', 'it', 'de', 'fr', 'es'];

const newKeys = {
  sales: {
    totalRevenue: {
      en: "Total Revenue",
      it: "Entrate Totali",
      de: "Gesamtumsatz",
      fr: "Revenu Total",
      es: "Ingresos Totales"
    },
    custom: {
      en: "Custom",
      it: "Personalizzato",
      de: "Benutzerdefiniert",
      fr: "Personnalisé",
      es: "Personalizado"
    },
    format: {
      en: "Format",
      it: "Formato",
      de: "Format",
      fr: "Format",
      es: "Formato"
    },
    totalPrice: {
      en: "Total Price",
      it: "Prezzo Totale",
      de: "Gesamtpreis",
      fr: "Prix Total",
      es: "Precio Total"
    },
    status: {
      en: "Status",
      it: "Stato",
      de: "Status",
      fr: "Statut",
      es: "Estado"
    },
    paid: {
      en: "PAID",
      it: "PAGATO",
      de: "BEZAHLT",
      fr: "PAYÉ",
      es: "PAGADO"
    },
    salesHistory: {
      en: "Sales History",
      it: "Cronologia Vendite",
      de: "Verkaufshistorie",
      fr: "Historique des Ventes",
      es: "Historial de Ventas"
    }
  }
};

locales.forEach(locale => {
  const filePath = path.join(localesDir, `${locale}.json`);
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    if (!data.sales) {
      data.sales = {};
    }

    Object.keys(newKeys.sales).forEach(key => {
      data.sales[key] = newKeys.sales[key][locale];
    });

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`Updated ${locale}.json`);
  }
});
