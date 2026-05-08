import { collection, addDoc, getDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

export async function sendEmailNotification(to: string, templateName: string, data: any, preferredLanguage?: string) {
  try {
    let lang = preferredLanguage || 'en';
    
    // If we have a userId but no preferredLanguage, try to fetch it
    if (data.userId && !preferredLanguage) {
      const userDoc = await getDoc(doc(db, 'users', data.userId));
      if (userDoc.exists() && userDoc.data().language) {
        lang = userDoc.data().language.toLowerCase();
      }
    }

    // Define email templates based on language
    const templates: Record<string, Record<string, { subject: string, html: string }>> = {
      welcome: {
        en: {
          subject: 'Welcome to TagTales!',
          html: `<p>Hello,</p><p>Welcome to TagTales! We are excited to have you on board.</p>`
        },
        it: {
          subject: 'Benvenuto su TagTales!',
          html: `<p>Ciao,</p><p>Benvenuto su TagTales! Siamo felici di averti con noi.</p>`
        },
        de: {
          subject: 'Willkommen bei TagTales!',
          html: `<p>Hallo,</p><p>Willkommen bei TagTales! Wir freuen uns, Sie an Bord zu haben.</p>`
        },
        fr: {
          subject: 'Bienvenue sur TagTales !',
          html: `<p>Bonjour,</p><p>Bienvenue sur TagTales ! Nous sommes ravis de vous compter parmi nous.</p>`
        },
        es: {
          subject: '¡Bienvenido a TagTales!',
          html: `<p>Hola,</p><p>¡Bienvenido a TagTales! Estamos emocionados de tenerte a bordo.</p>`
        }
      },
      artwork_approved: {
        en: {
          subject: 'Artwork Approved',
          html: `<p>Your artwork "${data.artworkTitle}" has been approved.</p>`
        },
        it: {
          subject: 'Opera Approvata',
          html: `<p>La tua opera "${data.artworkTitle}" è stata approvata.</p>`
        },
        de: {
          subject: 'Kunstwerk genehmigt',
          html: `<p>Ihr Kunstwerk "${data.artworkTitle}" wurde genehmigt.</p>`
        },
        fr: {
          subject: 'Œuvre approuvée',
          html: `<p>Votre œuvre "${data.artworkTitle}" a été approuvée.</p>`
        },
        es: {
          subject: 'Obra Aprobada',
          html: `<p>Tu obra "${data.artworkTitle}" ha sido aprobada.</p>`
        }
      },
      artwork_rejected: {
        en: {
          subject: 'Artwork Rejected',
          html: `<p>Your artwork "${data.artworkTitle}" has been rejected.</p><p>Reason: ${data.reason}</p>`
        },
        it: {
          subject: 'Opera Rifiutata',
          html: `<p>La tua opera "${data.artworkTitle}" è stata rifiutata.</p><p>Motivo: ${data.reason}</p>`
        },
        de: {
          subject: 'Kunstwerk abgelehnt',
          html: `<p>Ihr Kunstwerk "${data.artworkTitle}" wurde abgelehnt.</p><p>Grund: ${data.reason}</p>`
        },
        fr: {
          subject: 'Œuvre rejetée',
          html: `<p>Votre œuvre "${data.artworkTitle}" a été rejetée.</p><p>Raison : ${data.reason}</p>`
        },
        es: {
          subject: 'Obra Rechazada',
          html: `<p>Tu obra "${data.artworkTitle}" ha sido rechazada.</p><p>Razón: ${data.reason}</p>`
        }
      },
      new_contract: {
        en: {
          subject: 'New Contract to Sign',
          html: `<p>You have a new contract to sign for "${data.contractTitle}". Please log in to your dashboard to review and sign it.</p>`
        },
        it: {
          subject: 'Nuovo Contratto da Firmare',
          html: `<p>Hai un nuovo contratto da firmare per "${data.contractTitle}". Accedi alla tua dashboard per esaminarlo e firmarlo.</p>`
        },
        de: {
          subject: 'Neuer Vertrag zur Unterzeichnung',
          html: `<p>Sie haben einen neuen Vertrag für "${data.contractTitle}" zur Unterzeichnung. Bitte loggen Sie sich in Ihr Dashboard ein, um ihn zu überprüfen und zu unterschreiben.</p>`
        },
        fr: {
          subject: 'Nouveau contrat à signer',
          html: `<p>Vous avez un nouveau contrat à signer pour "${data.contractTitle}". Veuillez vous connecter à votre tableau de bord pour l'examiner et le signer.</p>`
        },
        es: {
          subject: 'Nuevo Contrato para Firmar',
          html: `<p>Tienes un nuevo contrato para firmar por "${data.contractTitle}". Inicia sesión en tu panel para revisarlo y firmarlo.</p>`
        }
      },
      payout_request: {
        en: {
          subject: 'New Payout Request',
          html: `<p>A new payout request of ${data.amount} has been received from ${data.artistName} (${data.artistEmail}).</p>`
        },
        it: {
          subject: 'Nuova Richiesta di Pagamento',
          html: `<p>È stata ricevuta una nuova richiesta di pagamento di ${data.amount} da ${data.artistName} (${data.artistEmail}).</p>`
        },
        de: {
          subject: 'Neue Auszahlungsanfrage',
          html: `<p>Eine neue Auszahlungsanfrage über ${data.amount} wurde von ${data.artistName} (${data.artistEmail}) empfangen.</p>`
        },
        fr: {
          subject: 'Nouvelle demande de paiement',
          html: `<p>Une nouvelle demande de paiement de ${data.amount} a été reçue de ${data.artistName} (${data.artistEmail}).</p>`
        },
        es: {
          subject: 'Nueva Solicitud de Pago',
          html: `<p>Se ha recibido una nueva solicitud de pago de ${data.amount} de ${data.artistName} (${data.artistEmail}).</p>`
        }
      },
      payout_paid: {
        en: {
          subject: 'Payout Processed',
          html: `<p>Your payout request of ${data.amount} has been marked as paid.</p>`
        },
        it: {
          subject: 'Pagamento Elaborato',
          html: `<p>La tua richiesta di pagamento di ${data.amount} è stata contrassegnata come pagata.</p>`
        },
        de: {
          subject: 'Auszahlung verarbeitet',
          html: `<p>Ihre Auszahlungsanfrage über ${data.amount} wurde als bezahlt markiert.</p>`
        },
        fr: {
          subject: 'Paiement traité',
          html: `<p>Votre demande de paiement de ${data.amount} a été marquée comme payée.</p>`
        },
        es: {
          subject: 'Pago Procesado',
          html: `<p>Tu solicitud de pago de ${data.amount} ha sido marcada como pagada.</p>`
        }
      }
    };

    const template = templates[templateName]?.[lang] || templates[templateName]?.['en'];

    if (!template) {
      console.error(`Template ${templateName} not found`);
      return;
    }

    await addDoc(collection(db, 'mail'), {
      to,
      message: {
        subject: template.subject,
        html: template.html
      },
      createdAt: new Date().toISOString()
    });

    console.log(`Email notification sent to ${to} for event ${templateName}`);
  } catch (error) {
    console.error('Error sending email notification:', error);
  }
}
