const fs = require('fs');
const path = require('path');

const patchedTranslations = {
  it: {
    "connectionBanner.warningTitle": "Connessione Negozio Richiesta",
    "connectionBanner.warningText": "Il tuo profilo non è ancora collegato ad alcun prodotto dello store. I tuoi dati di vendita non appariranno finché un amministratore non collegherà il tuo account.",
    "connectionBanner.successTitle": "Negozio Connesso",
    "connectionBanner.successText": "Il tuo profilo è collegato con successo ai prodotti dello store. I tuoi dati di vendita sono in diretta.",
    "connectionBanner.notActiveTitle": "La tua connessione alle vendite non è ancora attiva.",
    "connectionBanner.notActiveText": "Il team di TagTales collegherà a breve le tue opere al sistema di vendita. Riceverai una notifica quando i tuoi dati di vendita saranno pronti.",
    "connectionBanner.activeTitle": "La tua connessione alle vendite è attiva.",
    "connectionBanner.activeText": "I tuoi dati di vendita sono aggiornati in tempo reale."
  },
  de: {
    "connectionBanner.warningTitle": "Shop-Verbindung Erforderlich",
    "connectionBanner.warningText": "Ihr Profil ist noch mit keinen Shop-Produkten verknüpft. Ihre Verkaufsdaten werden erst angezeigt, wenn ein Administrator Ihr Konto verknüpft.",
    "connectionBanner.successTitle": "Shop Verbunden",
    "connectionBanner.successText": "Ihr Profil ist erfolgreich mit Ihren Shop-Produkten verknüpft. Ihre Verkaufsdaten sind live.",
    "connectionBanner.notActiveTitle": "Ihre Verkaufsverbindung ist noch nicht aktiv.",
    "connectionBanner.notActiveText": "Das TagTales-Team wird Ihre Kunstwerke in Kürze mit dem Verkaufssystem verknüpfen. Sie werden benachrichtigt, sobald Ihre Verkaufsdaten bereitstehen.",
    "connectionBanner.activeTitle": "Ihre Verkaufsverbindung ist aktiv.",
    "connectionBanner.activeText": "Ihre Verkaufsdaten werden in Echtzeit aktualisiert."
  },
  fr: {
    "connectionBanner.warningTitle": "Connexion Boutique Requise",
    "connectionBanner.warningText": "Votre profil n'est pas encore lié à des produits de boutique. Vos données de vente n'apparaîtront pas tant qu'un administrateur n'aura pas lié votre compte.",
    "connectionBanner.successTitle": "Boutique Connectée",
    "connectionBanner.successText": "Votre profil est lié avec succès à vos produits. Vos données de vente sont en direct.",
    "connectionBanner.notActiveTitle": "Votre connexion aux ventes n'est pas encore active.",
    "connectionBanner.notActiveText": "L'équipe de TagTales liera bientôt vos œuvres au système de vente. Vous serez averti lorsque vos données de vente seront prêtes.",
    "connectionBanner.activeTitle": "Votre connexion aux ventes est active.",
    "connectionBanner.activeText": "Vos données de vente sont mises à jour en temps réel."
  },
  es: {
    "connectionBanner.warningTitle": "Conexión a Tienda Requerida",
    "connectionBanner.warningText": "Tu perfil aún no está vinculado a ningún producto de tienda. Tus datos de ventas no aparecerán hasta que un administrador vincule tu cuenta.",
    "connectionBanner.successTitle": "Tienda Conectada",
    "connectionBanner.successText": "Tu perfil está vinculado con éxito a tus productos de tienda. Tus datos de ventas están en vivo.",
    "connectionBanner.notActiveTitle": "Tu conexión de ventas aún no está activa.",
    "connectionBanner.notActiveText": "El equipo de TagTales vinculará pronto tus obras al sistema de ventas. Serás notificado cuando tus datos de ventas estén listos.",
    "connectionBanner.activeTitle": "Tu conexión de ventas está activa.",
    "connectionBanner.activeText": "Tus datos de ventas se actualizan en tiempo real."
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
