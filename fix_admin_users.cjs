const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'src', 'locales');
const locales = ['en', 'it', 'de', 'fr', 'es'];

const newKeys = {
  adminUsers: {
    subtitle: {
      en: "View artist details and manage administrator roles.",
      it: "Visualizza i dettagli dell'artista e gestisci i ruoli di amministratore.",
      de: "Künstlerdetails anzeigen und Administratorrollen verwalten.",
      fr: "Afficher les détails de l'artiste et gérer les rôles d'administrateur.",
      es: "Ver detalles de artistas y administrar roles de administrador."
    },
    roleUpdated: {
      en: "User role updated to {{role}}.",
      it: "Ruolo utente aggiornato a {{role}}.",
      de: "Benutzerrolle auf {{role}} aktualisiert.",
      fr: "Rôle de l'utilisateur mis à jour vers {{role}}.",
      es: "Rol de usuario actualizado a {{role}}."
    },
    roleUpdateFailed: {
      en: "Failed to update user role.",
      it: "Impossibile aggiornare il ruolo utente.",
      de: "Benutzerrolle konnte nicht aktualisiert werden.",
      fr: "Échec de la mise à jour du rôle de l'utilisateur.",
      es: "Error al actualizar el rol de usuario."
    },
    user: {
      en: "User",
      it: "Utente",
      de: "Benutzer",
      fr: "Utilisateur",
      es: "Usuario"
    },
    contactInfo: {
      en: "Contact Info",
      it: "Informazioni di contatto",
      de: "Kontaktinformationen",
      fr: "Coordonnées",
      es: "Información de contacto"
    },
    bankDetails: {
      en: "Bank Details",
      it: "Dettagli bancari",
      de: "Bankdaten",
      fr: "Coordonnées bancaires",
      es: "Detalles bancarios"
    },
    noPhone: {
      en: "No phone",
      it: "Nessun telefono",
      de: "Kein Telefon",
      fr: "Pas de téléphone",
      es: "Sin teléfono"
    },
    noAddress: {
      en: "No address",
      it: "Nessun indirizzo",
      de: "Keine Adresse",
      fr: "Pas d'adresse",
      es: "Sin dirección"
    },
    notProvided: {
      en: "Not provided",
      it: "Non fornito",
      de: "Nicht angegeben",
      fr: "Non fourni",
      es: "No proporcionado"
    },
    removeAdmin: {
      en: "Remove Admin",
      it: "Rimuovi Amministratore",
      de: "Admin entfernen",
      fr: "Supprimer l'administrateur",
      es: "Eliminar Administrador"
    },
    ecwidSaved: {
      en: "Ecwid connection saved successfully.",
      it: "Connessione Ecwid salvata con successo.",
      de: "Ecwid-Verbindung erfolgreich gespeichert.",
      fr: "Connexion Ecwid enregistrée avec succès.",
      es: "Conexión Ecwid guardada correctamente."
    }
  }
};

locales.forEach(locale => {
  const filePath = path.join(localesDir, `${locale}.json`);
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    if (!data.adminUsers) {
      data.adminUsers = {};
    }

    Object.keys(newKeys.adminUsers).forEach(key => {
      data.adminUsers[key] = newKeys.adminUsers[key][locale];
    });

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`Updated ${locale}.json`);
  }
});
