import { collection, addDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: 'contract' | 'artwork_approved' | 'artwork_rejected' | 'artwork_mod_requested' | 'artwork_sold' | 'artwork_sold_externally' | 'payout_update',
  link: string
) {
  try {
    await addDoc(collection(db, 'notifications'), {
      userId,
      title,
      message,
      type,
      link,
      read: false,
      createdAt: new Date().toISOString()
    });
    console.log(`Notification created for user ${userId}`);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'notifications');
  }
}
