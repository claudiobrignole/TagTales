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
          subject: 'Welcome to Tag Tales!',
          html: `<p>Hello,</p><p>Welcome to Tag Tales! We are excited to have you on board.</p>`
        },
        it: {
          subject: 'Benvenuto su Tag Tales!',
          html: `<p>Ciao,</p><p>Benvenuto su Tag Tales! Siamo felici di averti con noi.</p>`
        },
        de: {
          subject: 'Willkommen bei Tag Tales!',
          html: `<p>Hallo,</p><p>Willkommen bei Tag Tales! Wir freuen uns, Sie an Bord zu haben.</p>`
        },
        fr: {
          subject: 'Bienvenue sur Tag Tales !',
          html: `<p>Bonjour,</p><p>Bienvenue sur Tag Tales ! Nous sommes ravis de vous compter parmi nous.</p>`
        },
        es: {
          subject: '¡Bienvenido a Tag Tales!',
          html: `<p>Hola,</p><p>¡Bienvenido a Tag Tales! Estamos emocionados de tenerte a bordo.</p>`
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
      },
      admin_new_register: {
        en: {
          subject: 'New User Registration - Tag Tales Gallery',
          html: `<p>Hello Claudio,</p>
                 <p>A new user has just registered on Tag Tales Gallery.</p>
                 <p><strong>Email:</strong> ${data.email}</p>
                 <p><strong>UserID:</strong> ${data.userId}</p>
                 <br/><p>Best regards,<br/>Tag Tales Automation</p>`
        },
        it: {
          subject: 'Nuova Registrazione Utente - Tag Tales Gallery',
          html: `<p>Ciao Claudio,</p>
                 <p>Un nuovo utente si è appena registrato su Tag Tales Gallery.</p>
                 <p><strong>Email:</strong> ${data.email}</p>
                 <p><strong>ID Utente (UID):</strong> ${data.userId}</p>
                 <br/><p>Un cordiale saluto,<br/>Tag Tales Automation</p>`
        }
      },
      chat_message_received: {
        en: {
          subject: 'New Chat Message Received - Tag Tales Gallery',
          html: `<p>Hello Claudio,</p>
                 <p>You have received a new chat message from the writer <strong>${data.senderName}</strong>:</p>
                 <blockquote style="border-left: 4px solid #FF4F00; padding-left: 12px; margin: 15px 0; color: #333; font-style: italic; background-color: #F8F6F3; padding-top: 8px; padding-bottom: 8px;">
                   ${data.messageText}
                 </blockquote>
                 <p><a href="https://tagtalesgallery.com/app/admin?chat=${data.writerId}" style="color: #FF4F00; font-weight: bold; text-decoration: underline;">Click here to view the chat and reply</a></p>
                 <br/><p>Best regards,<br/>Tag Tales Automation</p>`
        },
        it: {
          subject: 'Nuovo Messaggio in Chat - Tag Tales Gallery',
          html: `<p>Ciao Claudio,</p>
                 <p>Hai ricevuto un nuovo messaggio in chat dal writer <strong>${data.senderName}</strong>:</p>
                 <blockquote style="border-left: 4px solid #FF4F00; padding-left: 12px; margin: 15px 0; color: #333; font-style: italic; background-color: #F8F6F3; padding-top: 8px; padding-bottom: 8px;">
                   ${data.messageText}
                 </blockquote>
                 <p><a href="https://tagtalesgallery.com/app/admin?chat=${data.writerId}" style="color: #FF4F00; font-weight: bold; text-decoration: underline;">Clicca qui per visualizzare la chat e rispondere</a></p>
                 <br/><p>Un cordiale saluto,<br/>Tag Tales Automation</p>`
        }
      },
      public_contact_message: {
        en: {
          subject: 'New Public Contact Message - Tag Tales Gallery',
          html: `<p>Hello Claudio,</p>
                 <p>You received a new message from the contact form on your website:</p>
                 <p><strong>Sender Name:</strong> ${data.name}</p>
                 <p><strong>Sender Email:</strong> ${data.email}</p>
                 <p><strong>Message:</strong></p>
                 <blockquote style="border-left: 4px solid #FF4F00; padding-left: 12px; margin: 15px 0; color: #333; background-color: #F8F6F3; padding-top: 8px; padding-bottom: 8px; white-space: pre-wrap;">
                   ${data.message}
                 </blockquote>
                 <br/><p>Best regards,<br/>Tag Tales Automation</p>`
        },
        it: {
          subject: 'Nuovo Messaggio dal Modulo Contatti - Tag Tales Gallery',
          html: `<p>Ciao Claudio,</p>
                 <p>Hai ricevuto un nuovo messaggio compilato tramite il modulo contatti del tuo sito:</p>
                 <p><strong>Nome mittente:</strong> ${data.name}</p>
                 <p><strong>Email mittente:</strong> ${data.email}</p>
                 <p><strong>Messaggio:</strong></p>
                 <blockquote style="border-left: 4px solid #FF4F00; padding-left: 12px; margin: 15px 0; color: #333; background-color: #F8F6F3; padding-top: 8px; padding-bottom: 8px; white-space: pre-wrap;">
                   ${data.message}
                 </blockquote>
                 <br/><p>Un cordiale saluto,<br/>Tag Tales Automation</p>`
        }
      }
    };

    const template = templates[templateName]?.[lang] || templates[templateName]?.['en'];

    if (!template) {
      console.error(`Template ${templateName} not found`);
      return;
    }

    // Try sending email via backend direct router API (supports SMTP and Resend)
    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to,
          subject: template.subject,
          html: template.html
        })
      });
      if (response.ok) {
        console.log(`Email successfully routed through direct backend to ${to} for event ${templateName}`);
        return;
      }
      console.warn('Backend email API responded with error status. Falling back to writing mail in Firestore.');
    } catch (apiErr) {
      console.error('Error calling /api/send-email, falling back to Firestore database write:', apiErr);
    }

    // Fallback: original Firestore save which triggers Firebase Extension
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
