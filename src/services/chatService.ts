import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { cleanFirestoreData } from '../firebase/errorHandler';
import { ChatMessage, ChatRoom } from '../types';
import { detectScamIntent } from './feedService';
import { createNotification } from './notificationService';

export const CHATS_COLLECTION = 'chats';

export async function getOrCreateChatRoom(params: {
  userId: string;
  userName: string;
  userAvatar?: string;
  companyId: string;
  companyName: string;
  jobId?: string;
  jobTitle?: string;
}): Promise<string> {
  // Deterministic chat ID or query existing
  const chatId = `${params.userId}_${params.companyId}`.replace(/[^a-zA-Z0-9_-]/g, '_');
  const chatRef = doc(db, CHATS_COLLECTION, chatId);

  const snap = await getDoc(chatRef);
  if (!snap.exists()) {
    const now = new Date().toISOString();
    const newRoom: Omit<ChatRoom, 'id'> = {
      participants: [params.userId, params.companyId],
      participantDetails: {
        [params.userId]: {
          name: params.userName,
          role: 'user',
          avatar: params.userAvatar || '',
        },
        [params.companyId]: {
          name: params.companyName,
          role: 'company',
          companyName: params.companyName,
        },
      },
      lastMessage: 'Percakapan baru dimulai',
      lastMessageAt: now,
      lastSenderId: params.companyId,
      unreadCounts: {
        [params.userId]: 0,
        [params.companyId]: 0,
      },
      jobId: params.jobId || '',
      jobTitle: params.jobTitle || '',
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(chatRef, cleanFirestoreData(newRoom));
  }

  return chatId;
}

export function subscribeUserChatRooms(
  userId: string,
  callback: (rooms: ChatRoom[]) => void
): () => void {
  const colRef = collection(db, CHATS_COLLECTION);
  const q = query(
    colRef,
    where('participants', 'array-contains', userId),
    orderBy('updatedAt', 'desc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const rooms: ChatRoom[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      } as ChatRoom));
      callback(rooms);
    },
    (err) => {
      console.error('Error subscribing to chat rooms:', err);
      callback([]);
    }
  );
}

export function subscribeChatMessages(
  chatId: string,
  callback: (messages: ChatMessage[]) => void
): () => void {
  const messagesColRef = collection(db, CHATS_COLLECTION, chatId, 'messages');
  const q = query(messagesColRef, orderBy('createdAt', 'asc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const messages: ChatMessage[] = snapshot.docs.map((d) => ({
        id: d.id,
        chatId,
        ...d.data(),
      } as ChatMessage));
      callback(messages);
    },
    (err) => {
      console.error('Error subscribing to messages:', err);
      callback([]);
    }
  );
}

export async function sendChatMessage(params: {
  chatId: string;
  senderId: string;
  senderName: string;
  senderRole?: 'user' | 'company' | 'admin';
  recipientId: string;
  text: string;
  interviewInvite?: ChatMessage['interviewInvite'];
  jobCard?: ChatMessage['jobCard'];
  applicationCard?: ChatMessage['applicationCard'];
}): Promise<ChatMessage> {
  const scamCheck = detectScamIntent(params.text);
  const now = new Date().toISOString();

  const msgData: Omit<ChatMessage, 'id'> = {
    chatId: params.chatId,
    senderId: params.senderId,
    senderName: params.senderName,
    senderRole: params.senderRole || 'user',
    text: params.text,
    isCompany: params.senderRole === 'company',
    isScamSuspect: scamCheck.isScamSuspect,
    scamWarning: scamCheck.isScamSuspect
      ? '⚠️ Waspada Penipuan: DIGAWE YUK melarang segala bentuk pungutan biaya administrasi, seragam, atau transfer uang untuk proses seleksi kerja.'
      : '',
    interviewInvite: params.interviewInvite || undefined,
    jobCard: params.jobCard || undefined,
    applicationCard: params.applicationCard || undefined,
    createdAt: now,
  };

  const messagesColRef = collection(db, CHATS_COLLECTION, params.chatId, 'messages');
  const docRef = await addDoc(messagesColRef, cleanFirestoreData(msgData));

  // Update last message in chat room
  const chatRef = doc(db, CHATS_COLLECTION, params.chatId);
  const displaySnippet = params.jobCard
    ? `[Lowongan: ${params.jobCard.jobTitle}] ${params.text}`
    : params.interviewInvite
    ? `[Undangan Interview: ${params.interviewInvite.jobTitle}]`
    : params.text;

  await updateDoc(chatRef, {
    lastMessage: displaySnippet,
    lastMessageAt: now,
    lastSenderId: params.senderId,
    updatedAt: now,
  });

  // Notify recipient
  await createNotification({
    userId: params.recipientId,
    title: `Pesan baru dari ${params.senderName}`,
    message: displaySnippet.slice(0, 80),
    type: params.interviewInvite ? 'INTERVIEW_INVITE' : 'CHAT',
  });

  return {
    id: docRef.id,
    ...msgData,
  };
}

/**
 * Update response to an interview invite in chat
 */
export async function updateChatMessageInvite(
  chatId: string,
  messageId: string,
  status: 'ACCEPTED' | 'REJECTED'
): Promise<void> {
  const msgRef = doc(db, CHATS_COLLECTION, chatId, 'messages', messageId);
  await updateDoc(msgRef, {
    'interviewInvite.status': status,
  });
}

