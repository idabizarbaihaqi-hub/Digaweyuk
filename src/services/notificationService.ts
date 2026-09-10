import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { AppNotification } from '../types';

export const NOTIFICATIONS_COLLECTION = 'notifications';

export async function createNotification(params: {
  userId: string;
  title: string;
  message: string;
  type: AppNotification['type'];
  link?: string;
}): Promise<string | undefined> {
  try {
    const colRef = collection(db, NOTIFICATIONS_COLLECTION);
    const docRef = await addDoc(colRef, {
      userId: params.userId,
      title: params.title,
      message: params.message,
      type: params.type,
      link: params.link || '',
      read: false,
      createdAt: new Date().toISOString(),
    });
    return docRef.id;
  } catch (err) {
    console.error('Error creating notification:', err);
    return undefined;
  }
}

export async function getUserNotifications(userId: string): Promise<AppNotification[]> {
  try {
    const colRef = collection(db, NOTIFICATIONS_COLLECTION);
    const q = query(
      colRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(30)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as AppNotification));
  } catch (err) {
    console.error('Error getting notifications:', err);
    return [];
  }
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  try {
    const docRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
    await updateDoc(docRef, { read: true });
  } catch (err) {
    console.error('Error marking notification read:', err);
  }
}
