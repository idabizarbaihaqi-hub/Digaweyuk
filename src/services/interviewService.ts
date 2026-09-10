import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { handleFirestoreError, OperationType } from '../firebase/errorHandler';
import { Interview, InterviewSession, InterviewQuestion } from '../types';

export const INTERVIEWS_COLLECTION = 'interviews';
export const SESSIONS_COLLECTION = 'interviewSessions';

/**
 * Fetch candidate's interview sessions
 */
export async function getCandidateSessions(candidateId: string): Promise<InterviewSession[]> {
  const colRef = collection(db, SESSIONS_COLLECTION);
  try {
    const q = query(colRef, where('candidateId', '==', candidateId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as InterviewSession));
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, SESSIONS_COLLECTION);
    return [];
  }
}

export const getCandidateInterviewSessions = getCandidateSessions;

/**
 * Verify Interview Room Code via backend API
 */
export async function apiVerifyInterviewRoom(roomCode: string): Promise<{ interview: Interview }> {
  const res = await fetch(`/api/interviews/verify-room/${encodeURIComponent(roomCode.toUpperCase().trim())}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Kode room tidak valid atau telah ditutup.');
  }
  return res.json();
}

/**
 * Subscribe to real-time interview session changes
 */
export function subscribeInterviewSession(
  sessionId: string,
  callback: (session: InterviewSession | null) => void
): () => void {
  const docRef = doc(db, SESSIONS_COLLECTION, sessionId);
  return onSnapshot(
    docRef,
    (snap) => {
      if (!snap.exists()) {
        callback(null);
      } else {
        callback({ id: snap.id, ...snap.data() } as InterviewSession);
      }
    },
    (err) => {
      console.error('Error listening to interview session:', err);
    }
  );
}

/**
 * Start or resume an interview session via backend API
 * Guarantees server-authoritative timer and max-attempts enforcement
 */
export async function apiStartInterviewSession(payload: {
  interviewId: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
}): Promise<{ session: InterviewSession; interview: Interview }> {
  const res = await fetch('/api/interviews/start-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Gagal memulai sesi interview.');
  }

  return res.json();
}

/**
 * Auto-save an answer in real-time
 */
export async function apiSaveInterviewAnswer(payload: {
  sessionId: string;
  candidateId: string;
  questionId: string;
  answer: string;
}): Promise<{ success: boolean; session?: InterviewSession; autoSubmitted?: boolean }> {
  const res = await fetch('/api/interviews/save-answer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Gagal menyimpan jawaban.');
  }

  return res.json();
}

/**
 * Submit interview session and trigger server-authoritative scoring
 */
export async function apiSubmitInterviewSession(payload: {
  sessionId: string;
  candidateId: string;
  answers: Record<string, { answer: string; answeredAt: string }>;
  isAutoSubmit?: boolean;
}): Promise<{ session: InterviewSession; score: number; passed: boolean }> {
  const res = await fetch('/api/interviews/submit-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Gagal mengirimkan jawaban interview.');
  }

  return res.json();
}

/**
 * Log candidate activity (anti-cheating)
 */
export async function apiLogInterviewActivity(payload: {
  sessionId: string;
  candidateId: string;
  event: string;
  details?: string;
}): Promise<void> {
  try {
    await fetch('/api/interviews/log-activity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.warn('Failed to send activity telemetry:', err);
  }
}

/**
 * Server-side AI Question Generator
 */
export async function apiGenerateAIQuestions(payload: {
  position: string;
  description?: string;
  requirements?: string[];
  level?: string;
  count?: number;
  types?: string[];
  difficulty?: string;
}): Promise<{ questions: InterviewQuestion[] }> {
  const res = await fetch('/api/interviews/ai-generate-questions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Gagal membuat soal dengan AI.');
  }

  return res.json();
}

/**
 * Server-side AI Essay Evaluation
 */
export async function apiEvaluateAIEssay(payload: {
  question: string;
  candidateAnswer: string;
  maxPoints: number;
  position?: string;
}): Promise<{
  suggestedScore: number;
  reasoning: string;
  strengths: string[];
  weaknesses: string[];
  relevance: string;
}> {
  const res = await fetch('/api/interviews/ai-evaluate-essay', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Gagal mengevaluasi essay dengan AI.');
  }

  return res.json();
}

/**
 * Company Subscription Upgrade
 */
export async function apiUpgradeCompanySubscription(payload: {
  companyId: string;
  plan: string;
}): Promise<{ success: boolean; message: string; expiresAt: string }> {
  const res = await fetch('/api/company/subscription-upgrade', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Gagal mengupgrade langganan perusahaan.');
  }

  return res.json();
}
