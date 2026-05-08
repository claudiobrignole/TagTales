const fs = require('fs');
const path = require('path');

const baseTranslations = {
  de: {
    "adminVideos.title": "Video-Bibliothek",
    "adminVideos.subtitle": "Künstlervideos verwalten und herunterladen.",
    "adminVideos.connectionError": "Verbindung zum Firebase-Speicher fehlgeschlagen. Bitte aktivieren.",
    "adminVideos.loadError": "Laden der Videoordner fehlgeschlagen.",
    "adminVideos.accessDenied": "Zugriff Verweigert",
    "adminVideos.artistFolders": "Künstlerordner",
    "adminVideos.noFolders": "Keine Videoordner gefunden.",
    "adminVideos.noVideos": "Keine Videos in diesem Ordner gefunden.",
    "adminVideos.download": "Herunterladen",
    "adminVideos.delete": "Löschen",
    "adminVideos.deleteTitle": "Video löschen",
    "adminVideos.deleteConfirm": "Möchten Sie dieses Video wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden."
  },
  it: {
    "adminVideos.title": "Libreria Video",
    "adminVideos.subtitle": "Gestisci e scarica i video degli artisti.",
    "adminVideos.connectionError": "Impossibile connettersi a Firebase Storage. Assicurati che sia abilitato.",
    "adminVideos.loadError": "Impossibile caricare le cartelle dei video.",
    "adminVideos.accessDenied": "Accesso Negato",
    "adminVideos.artistFolders": "Cartelle Artisti",
    "adminVideos.noFolders": "Nessuna cartella video trovata.",
    "adminVideos.noVideos": "Nessun video trovato in questa cartella.",
    "adminVideos.download": "Scarica",
    "adminVideos.delete": "Elimina",
    "adminVideos.deleteTitle": "Elimina Video",
    "adminVideos.deleteConfirm": "Sei sicuro di voler eliminare questo video? Questa azione non può essere annullata."
  },
  fr: {
    "adminVideos.title": "Vidéothèque",
    "adminVideos.subtitle": "Gérez et téléchargez les vidéos des artistes.",
    "adminVideos.connectionError": "Échec de la connexion à Firebase Storage. Veuillez vérifier qu'il est activé.",
    "adminVideos.loadError": "Échec du chargement des dossiers vidéo.",
    "adminVideos.accessDenied": "Accès Refusé",
    "adminVideos.artistFolders": "Dossiers d'Artistes",
    "adminVideos.noFolders": "Aucun dossier vidéo trouvé.",
    "adminVideos.noVideos": "Aucune vidéo trouvée dans ce dossier.",
    "adminVideos.download": "Télécharger",
    "adminVideos.delete": "Supprimer",
    "adminVideos.deleteTitle": "Supprimer la Vidéo",
    "adminVideos.deleteConfirm": "Êtes-vous sûr de vouloir supprimer cette vidéo ? Cette action est irréversible."
  },
  es: {
    "adminVideos.title": "Biblioteca de Videos",
    "adminVideos.subtitle": "Gestiona y descarga videos de artistas.",
    "adminVideos.connectionError": "Error al conectar con Firebase Storage. Asegúrese de que esté habilitado.",
    "adminVideos.loadError": "Error al cargar carpetas de videos.",
    "adminVideos.accessDenied": "Acceso Denegado",
    "adminVideos.artistFolders": "Carpetas de Artistas",
    "adminVideos.noFolders": "No se encontraron carpetas de videos.",
    "adminVideos.noVideos": "No se encontraron videos en esta carpeta.",
    "adminVideos.download": "Descargar",
    "adminVideos.delete": "Eliminar",
    "adminVideos.deleteTitle": "Eliminar Video",
    "adminVideos.deleteConfirm": "¿Está seguro de que desea eliminar este video? Esta acción no se puede deshacer."
  },
  en: {
    "adminVideos.title": "Video Library",
    "adminVideos.subtitle": "Manage and download artist videos for website insertion.",
    "adminVideos.connectionError": "Failed to connect to Firebase Storage. Please ensure Storage is enabled in your Firebase Console.",
    "adminVideos.loadError": "Failed to load video folders:",
    "adminVideos.accessDenied": "Access Denied",
    "adminVideos.artistFolders": "Artist Folders",
    "adminVideos.noFolders": "No video folders found.",
    "adminVideos.noVideos": "No videos found in this folder.",
    "adminVideos.download": "Download",
    "adminVideos.delete": "Delete",
    "adminVideos.deleteTitle": "Delete Video",
    "adminVideos.deleteConfirm": "Are you sure you want to delete this video? This action cannot be undone."
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
