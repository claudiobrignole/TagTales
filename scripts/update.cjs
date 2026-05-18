const fs = require('fs');

function updateJson(filePath, lang) {
  const content = fs.readFileSync(filePath, 'utf-8');
  let data;
  try {
    data = JSON.parse(content);
  } catch (e) {
    console.error("Error parsing " + filePath, e);
    return;
  }
  
  if (!data.adminArticles) data.adminArticles = {};
  data.adminArticles = {
    ...data.adminArticles,
    saving: lang === 'it' ? "Salvataggio..." : "Saving...",
    saved: lang === 'it' ? "Salvato!" : "Saved!",
    saveError: lang === 'it' ? "Errore durante il salvataggio dell'articolo." : "Error saving article.",
    deleteError: lang === 'it' ? "Errore nell'eliminazione dell'articolo: " : "Error deleting article: ",
    addArticle: lang === 'it' ? "Aggiungi Articolo" : "Add Article",
    loading: lang === 'it' ? "Caricamento..." : "Loading...",
    noArticles: lang === 'it' ? "Nessun articolo aggiunto. Clicca 'Aggiungi Articolo' per scrivere il primo." : "No articles added. Click 'Add Article' to write the first one.",
    confirmDelete: lang === 'it' ? "Conferma Eliminazione" : "Confirm Deletion",
    deleteWarning: lang === 'it' ? "Sei sicuro di voler eliminare questo articolo? L'azione non può essere annullata." : "Are you sure you want to delete this article? This action cannot be undone.",
    cancel: lang === 'it' ? "Annulla" : "Cancel",
    delete: lang === 'it' ? "Elimina" : "Delete",
    editArticle: lang === 'it' ? "Modifica Articolo" : "Edit Article",
    writeNew: lang === 'it' ? "Scrivi Nuovo Articolo" : "Write New Article",
    add: lang === 'it' ? "Aggiungi" : "Add",
    saveChanges: lang === 'it' ? "Salva Modifiche" : "Save Changes",
    publishArticle: lang === 'it' ? "Pubblica Articolo" : "Publish Article"
  };

  if (!data.adminExhibitions) data.adminExhibitions = {};
  data.adminExhibitions = {
    ...data.adminExhibitions,
    savingDb: lang === 'it' ? "Salvataggio su database..." : "Saving to database...",
    savedSuccess: lang === 'it' ? "Mostra salvata con successo!" : "Exhibition saved successfully!",
    saveError: lang === 'it' ? "Errore durante il salvataggio della mostra." : "Error saving exhibition.",
    deleteError: lang === 'it' ? "Errore nell'eliminazione della mostra: " : "Error deleting exhibition: ",
    addExhibition: lang === 'it' ? "Aggiungi Mostra" : "Add Exhibition",
    loading: lang === 'it' ? "Caricamento..." : "Loading...",
    noExhibitions: lang === 'it' ? "Nessuna mostra aggiunta. Clicca 'Aggiungi Mostra' per creare la prima." : "No exhibitions added. Click 'Add Exhibition' to create the first one.",
    confirmDelete: lang === 'it' ? "Conferma Eliminazione" : "Confirm Deletion",
    deleteWarning: lang === 'it' ? "Sei sicuro di voler eliminare questa mostra? L'azione non può essere annullata." : "Are you sure you want to delete this exhibition? This action cannot be undone.",
    cancel: lang === 'it' ? "Annulla" : "Cancel",
    delete: lang === 'it' ? "Elimina" : "Delete",
    editExhibition: lang === 'it' ? "Modifica Mostra" : "Edit Exhibition",
    addNew: lang === 'it' ? "Aggiungi Nuova Mostra" : "Add New Exhibition",
    noWriters: lang === 'it' ? "Nessun writer trovato. Aggiungi i writer prima." : "No writers found. Add writers first.",
    saveChanges: lang === 'it' ? "Salva Modifiche" : "Save Changes",
    createExhibition: lang === 'it' ? "Crea Mostra" : "Create Exhibition"
  };

  if (!data.adminHelp) data.adminHelp = {};
  data.adminHelp = {
    ...data.adminHelp,
    configSaved: lang === 'it' ? 'Configurazione salvata con successo!' : 'Configuration saved successfully!',
    saveError: lang === 'it' ? 'Errore nel salvataggio' : 'Error saving configuration',
    saveChanges: lang === 'it' ? "Salva Modifiche" : "Save Changes",
    add: lang === 'it' ? "Aggiungi" : "Add",
    title: lang === 'it' ? "Modifica Knowledge Base" : "Edit Knowledge Base"
  };

  if (!data.adminMedia) data.adminMedia = {};
  data.adminMedia = {
    ...data.adminMedia,
    uploadError: lang === 'it' ? 'Errore durante il caricamento dei media' : 'Error uploading media',
    manageImages: lang === 'it' ? 'Gestisci tutte le immagini caricate sulla piattaforma.' : 'Manage all images uploaded to the platform.',
    close: lang === 'it' ? 'Chiudi' : 'Close',
    uploadMedia: lang === 'it' ? 'Carica Media' : 'Upload Media',
    uploadIndependent: lang === 'it' ? 'Carica un file multimediale indipendente in archivio' : 'Upload an independent media file to the archive',
    noMedia: lang === 'it' ? 'Nessun media trovato nell\'archivio.' : 'No media found in the archive.',
    confirmDelete: lang === 'it' ? 'Conferma Eliminazione' : 'Confirm Deletion',
    deleteWarning: lang === 'it' ? 'Sei sicuro di voler eliminare permanentemente questa immagine? L\'operazione non può essere annullata. Se l\'immagine è usata in mostre o pagine, non sarà più visibile.' : 'Are you sure you want to permanently delete this image? This operation cannot be undone. If the image is used in exhibitions or pages, it will no longer be visible.',
    cancel: lang === 'it' ? 'Annulla' : 'Cancel',
    delete: lang === 'it' ? 'Elimina' : 'Delete',
  };

  if (!data.adminPages) data.adminPages = {};
  data.adminPages = {
    ...data.adminPages,
    saveError: lang === 'it' ? 'Errore al salvataggio' : 'Error saving',
    systemPageError: lang === 'it' ? 'Non puoi eliminare una pagina di sistema, puoi solo svuotarne il contenuto.' : 'You cannot delete a system page, you can only empty its content.',
    deleteError: lang === 'it' ? 'Errore durante l\'eliminazione della pagina: ' : 'Error deleting page: ',
    newPage: lang === 'it' ? 'Nuova Pagina' : 'New Page',
    deletePage: lang === 'it' ? 'Elimina Pagina' : 'Delete Page',
    deleteWarning: lang === 'it' ? 'Sei sicuro di voler eliminare questa pagina? L\'azione è irreversibile.' : 'Are you sure you want to delete this page? This action is irreversible.',
    cancel: lang === 'it' ? 'Annulla' : 'Cancel',
    delete: lang === 'it' ? 'Elimina' : 'Delete',
    edit: lang === 'it' ? 'Modifica: ' : 'Edit: ',
    placeholderId: lang === 'it' ? 'es. faq-nuova' : 'e.g. faq-new',
    saving: lang === 'it' ? 'Salvataggio...' : 'Saving...',
    saveChanges: lang === 'it' ? 'Salva Modifiche' : 'Save Changes'
  };

  // Admin Payments
  if (!data.adminPayments) data.adminPayments = {};
  data.adminPayments = {
    ...data.adminPayments,
    loadError: lang === 'it' ? 'Errore durante il caricamento delle royalties.' : 'Error loading royalties.',
    loading: lang === 'it' ? 'Caricamento...' : 'Loading...',
    noPending: lang === 'it' ? 'Nessun artista con saldo in attesa.' : 'No artist with pending balance.',
    noPendingArtist: lang === 'it' ? 'Nessuna royalty in attesa per questo artista. (L\'importo potrebbe derivare da uno stato incoerente)' : 'No pending royalties for this artist. (The amount might stem from an inconsistent state)',
    saving: lang === 'it' ? 'Salvataggio in corso...' : 'Saving in progress...',
    markPaid: lang === 'it' ? 'Segna come Pagato' : 'Mark as Paid',
    subtitle: lang === 'it' ? 'Lista degli artisti con saldo in attesa di pagamento.' : 'List of artists with a pending balance.',
    artistsToPay: lang === 'it' ? 'Artisti da Pagare' : 'Artists to Pay',
    nameAlias: lang === 'it' ? 'Nome / Alias' : 'Name / Alias',
    email: lang === 'it' ? 'Email' : 'Email',
    pendingBalance: lang === 'it' ? 'Saldo In Attesa' : 'Pending Balance',
    actions: lang === 'it' ? 'Azioni' : 'Actions',
    orderDate: lang === 'it' ? 'Data Ordine' : 'Order Date',
    product: lang === 'it' ? 'Prodotto' : 'Product',
    quantity: lang === 'it' ? 'Q.tà' : 'Qty',
    promo: lang === 'it' ? 'Promo' : 'Promo',
    totalFee: lang === 'it' ? 'Fee Totale' : 'Total Fee'
  };

  if (!data.adminUsers) data.adminUsers = {};
  data.adminUsers = {
    ...data.adminUsers,
    title: lang === 'it' ? 'Gestisci Utenti' : 'Manage Users',
    subtitle: lang === 'it' ? 'Visualizza i dettagli del writer e gestisci i ruoli di amministratore.' : 'View writer details and manage administrator roles.',
    deleteSuccess: lang === 'it' ? 'Utente eliminato con successo' : 'User deleted successfully',
    confirmDelete: lang === 'it' ? 'Conferma Eliminazione' : 'Confirm Deletion',
    deleteWarning: lang === 'it' ? 'Sei sicuro di voler eliminare questo utente? Questa operazione non può essere annullata.' : 'Are you sure you want to delete this user? This action cannot be undone.',
    cancel: lang === 'it' ? 'Annulla' : 'Cancel',
    delete: lang === 'it' ? 'Elimina' : 'Delete',
    viewProducts: lang === 'it' ? 'Visualizza / Assegna Prodotti' : 'View / Assign Products'
  };

  if (!data.adminWriters) data.adminWriters = {};
  data.adminWriters = {
    ...data.adminWriters,
    saveError: lang === 'it' ? 'Errore durante il salvataggio del writer.' : 'Error saving writer.',
    deleteError: lang === 'it' ? 'Errore nell\'eliminazione del writer: ' : 'Error deleting writer: ',
    addWriter: lang === 'it' ? 'Aggiungi Writer' : 'Add Writer',
    loading: lang === 'it' ? 'Caricamento...' : 'Loading...',
    noWriters: lang === 'it' ? 'Nessun writer aggiunto. Clicca "Aggiungi Writer" per creare il primo profilo.' : 'No writers added. Click "Add Writer" to create the first profile.',
    confirmDeleteTitle: lang === 'it' ? 'Conferma Eliminazione' : 'Confirm Deletion',
    confirmDeleteDesc: lang === 'it' ? 'Sei sicuro di voler eliminare questo writer? L\'azione non può essere annullata.' : 'Are you sure you want to delete this writer? This action cannot be undone.',
    editTitle: lang === 'it' ? 'Modifica Writer' : 'Edit Writer',
    newTitle: lang === 'it' ? 'Aggiungi Nuovo Writer' : 'Add New Writer',
    noUserLinked: lang === 'it' ? 'Nessun utente collegato' : 'No user linked',
    newVideoPlaceholder: lang === 'it' ? 'Nuovo URL video...' : 'New video URL...',
    add: lang === 'it' ? 'Aggiungi' : 'Add',
    saveChanges: lang === 'it' ? 'Salva Modifiche' : 'Save Changes',
    saving: lang === 'it' ? 'Salvataggio...' : 'Saving...',
    createWriter: lang === 'it' ? 'Crea Writer' : 'Create Writer',
    subtitle: lang === 'it' ? 'Gestisci i profili pubblici dei writer graffiti.' : 'Manage the public profiles of graffiti writers.',
    statusDraft: lang === 'it' ? 'Bozza' : 'Draft',
    statusPublished: lang === 'it' ? 'Pubblicato' : 'Published',
    statusArchived: lang === 'it' ? 'Archiviato' : 'Archived'
  };

  // Admin Exhibitions
  if (!data.adminExhibitions) data.adminExhibitions = {};
  data.adminExhibitions = {
    ...data.adminExhibitions,
    savingDb: lang === 'it' ? "Salvataggio su database..." : "Saving to database...",
    savedSuccess: lang === 'it' ? "Mostra salvata con successo!" : "Exhibition saved successfully!",
    saveError: lang === 'it' ? "Errore durante il salvataggio della mostra." : "Error saving exhibition.",
    deleteError: lang === 'it' ? "Errore nell'eliminazione della mostra: " : "Error deleting exhibition: ",
    addExhibition: lang === 'it' ? "Aggiungi Mostra" : "Add Exhibition",
    loading: lang === 'it' ? "Caricamento..." : "Loading...",
    noExhibitions: lang === 'it' ? "Nessuna mostra aggiunta. Clicca 'Aggiungi Mostra' per creare la prima." : "No exhibitions added. Click 'Add Exhibition' to create the first one.",
    confirmDelete: lang === 'it' ? "Conferma Eliminazione" : "Confirm Deletion",
    deleteWarning: lang === 'it' ? "Sei sicuro di voler eliminare questa mostra? L'azione non può essere annullata." : "Are you sure you want to delete this exhibition? This action cannot be undone.",
    cancel: lang === 'it' ? "Annulla" : "Cancel",
    delete: lang === 'it' ? "Elimina" : "Delete",
    editExhibition: lang === 'it' ? "Modifica Mostra" : "Edit Exhibition",
    addNew: lang === 'it' ? "Aggiungi Nuova Mostra" : "Add New Exhibition",
    noWriters: lang === 'it' ? "Nessun writer trovato. Aggiungi i writer prima." : "No writers found. Add writers first.",
    saveChanges: lang === 'it' ? "Salva Modifiche" : "Save Changes",
    createExhibition: lang === 'it' ? "Crea Mostra" : "Create Exhibition",
    title: lang === 'it' ? 'Gestione Mostre' : 'Exhibitions Management',
    subtitle: lang === 'it' ? 'Crea e gestisci le mini-mostre presentate sulla piattaforma.' : 'Create and manage the mini-exhibitions presented on the platform.',
    statusDraft: lang === 'it' ? 'Bozza' : 'Draft',
    statusPublished: lang === 'it' ? 'Pubblicata' : 'Published',
    statusFeatured: lang === 'it' ? 'In Evidenza' : 'Featured'
  };

  // Admin Articles
  if (!data.adminArticles) data.adminArticles = {};
  data.adminArticles = {
    ...data.adminArticles,
    saving: lang === 'it' ? "Salvataggio..." : "Saving...",
    saved: lang === 'it' ? "Salvato!" : "Saved!",
    saveError: lang === 'it' ? "Errore durante il salvataggio dell'articolo." : "Error saving article.",
    deleteError: lang === 'it' ? "Errore nell'eliminazione dell'articolo: " : "Error deleting article: ",
    addArticle: lang === 'it' ? "Aggiungi Articolo" : "Add Article",
    loading: lang === 'it' ? "Caricamento..." : "Loading...",
    noArticles: lang === 'it' ? "Nessun articolo aggiunto. Clicca 'Aggiungi Articolo' per scrivere il primo." : "No articles added. Click 'Add Article' to write the first one.",
    confirmDelete: lang === 'it' ? "Conferma Eliminazione" : "Confirm Deletion",
    deleteWarning: lang === 'it' ? "Sei sicuro di voler eliminare questo articolo? L'azione non può essere annullata." : "Are you sure you want to delete this article? This action cannot be undone.",
    cancel: lang === 'it' ? "Annulla" : "Cancel",
    delete: lang === 'it' ? "Elimina" : "Delete",
    editArticle: lang === 'it' ? "Modifica Articolo" : "Edit Article",
    writeNew: lang === 'it' ? "Scrivi Nuovo Articolo" : "Write New Article",
    add: lang === 'it' ? "Aggiungi" : "Add",
    saveChanges: lang === 'it' ? "Salva Modifiche" : "Save Changes",
    publishArticle: lang === 'it' ? "Pubblica Articolo" : "Publish Article",
    title: lang === 'it' ? 'Gestione Magazine' : 'Magazine Management',
    subtitle: lang === 'it' ? 'Gestisci articoli e notizie per la sezione magazine pubblica.' : 'Manage articles and news for the public magazine section.',
    statusDraft: lang === 'it' ? 'Bozza' : 'Draft',
    statusPublished: lang === 'it' ? 'Pubblicato' : 'Published',
    statusArchived: lang === 'it' ? 'Archiviato' : 'Archived'
  };

  // Admin Pages
  if (!data.adminPages) data.adminPages = {};
  data.adminPages = {
    ...data.adminPages,
    saveError: lang === 'it' ? 'Errore al salvataggio' : 'Error saving',
    systemPageError: lang === 'it' ? 'Non puoi eliminare una pagina di sistema, puoi solo svuotarne il contenuto.' : 'You cannot delete a system page, you can only empty its content.',
    deleteError: lang === 'it' ? 'Errore durante l\'eliminazione della pagina: ' : 'Error deleting page: ',
    newPage: lang === 'it' ? 'Nuova Pagina' : 'New Page',
    deletePage: lang === 'it' ? 'Elimina Pagina' : 'Delete Page',
    deleteWarning: lang === 'it' ? 'Sei sicuro di voler eliminare questa pagina? L\'azione è irreversibile.' : 'Are you sure you want to delete this page? This action is irreversible.',
    cancel: lang === 'it' ? 'Annulla' : 'Cancel',
    delete: lang === 'it' ? 'Elimina' : 'Delete',
    edit: lang === 'it' ? 'Modifica: ' : 'Edit: ',
    placeholderId: lang === 'it' ? 'es. faq-nuova' : 'e.g. faq-new',
    saving: lang === 'it' ? 'Salvataggio...' : 'Saving...',
    saveChanges: lang === 'it' ? 'Salva Modifiche' : 'Save Changes',
    title: lang === 'it' ? 'Pagine Statiche' : 'Static Pages',
    subtitle: lang === 'it' ? 'Gestisci i contenuti e il layout modulare delle pagine istituzionali. Puoi aggiungere blocchi di testo, immagini, video e moduli speciali.' : 'Manage the content and modular layout of institutional pages. You can add text blocks, images, videos, and special modules.',
    statusDraft: lang === 'it' ? 'Bozza' : 'Draft',
    statusPublished: lang === 'it' ? 'Pubblicata' : 'Published'
  };

  // Admin Help
  if (!data.adminHelp) data.adminHelp = {};
  data.adminHelp = {
    ...data.adminHelp,
    configSaved: lang === 'it' ? 'Configurazione salvata con successo!' : 'Configuration saved successfully!',
    saveError: lang === 'it' ? 'Errore nel salvataggio' : 'Error saving configuration',
    saveChanges: lang === 'it' ? "Salva Modifiche" : "Save Changes",
    add: lang === 'it' ? "Aggiungi" : "Add",
    title: lang === 'it' ? "Modifica Knowledge Base" : "Edit Knowledge Base",
    publicExperience: lang === 'it' ? 'Esperienza Pubblica' : 'Public Experience',
    writersExperience: lang === 'it' ? 'Esperienza Writers' : 'Writers Experience'
  };

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

updateJson('./src/locales/it.json', 'it');
updateJson('./src/locales/en.json', 'en');
console.log('Successfully updated locales');
