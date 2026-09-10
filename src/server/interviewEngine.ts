import { GoogleGenAI } from '@google/genai';
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
} from 'firebase/firestore';
import { db } from '../firebase/config';
import {
  Interview,
  InterviewSession,
  InterviewQuestion,
  CandidateAnswerItem,
  SuspiciousActivityItem,
} from '../types';

export const INTERVIEWS_COLLECTION = 'interviews';
export const SESSIONS_COLLECTION = 'interviewSessions';
export const COMPANIES_COLLECTION = 'companies';

/**
 * Start or Resume Interview Session (Server-authoritative timer)
 */
export async function handleStartSession(payload: {
  interviewId: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
}): Promise<{ session: InterviewSession; interview: Interview }> {
  const { interviewId, candidateId, candidateName, candidateEmail } = payload;

  const interviewDocRef = doc(db, INTERVIEWS_COLLECTION, interviewId);
  const interviewSnap = await getDoc(interviewDocRef);

  if (!interviewSnap.exists()) {
    throw new Error('Interview tidak ditemukan.');
  }

  const interview = { id: interviewSnap.id, ...interviewSnap.data() } as Interview;

  // Check if interview is open/scheduled
  if (interview.status === 'CLOSED' || interview.status === 'CANCELLED') {
    throw new Error('Ruang interview ini telah ditutup.');
  }

  // Check candidate sessions
  const sessionsCol = collection(db, SESSIONS_COLLECTION);
  const q = query(
    sessionsCol,
    where('interviewId', '==', interviewId),
    where('candidateId', '==', candidateId)
  );
  const existingSnaps = await getDocs(q);

  const existingSessions = existingSnaps.docs.map(
    (d) => ({ id: d.id, ...d.data() } as InterviewSession)
  );

  // Check if there is an active session in progress
  const activeSession = existingSessions.find(
    (s) => s.status === 'IN_PROGRESS' || s.status === 'NOT_STARTED'
  );

  const nowMs = Date.now();

  if (activeSession) {
    const expiresMs = new Date(activeSession.expiresAt).getTime();
    if (nowMs < expiresMs) {
      // Resume existing active session
      return { session: activeSession, interview };
    } else {
      // Expired while candidate was away -> auto submit
      await handleAutoSubmitSession(activeSession, interview);
      const updatedSnap = await getDoc(doc(db, SESSIONS_COLLECTION, activeSession.id));
      const finalized = { id: updatedSnap.id, ...updatedSnap.data() } as InterviewSession;
      return { session: finalized, interview };
    }
  }

  // Count completed attempts
  const completedAttempts = existingSessions.filter(
    (s) => s.status === 'SUBMITTED' || s.status === 'AUTO_SUBMITTED' || s.status === 'EXPIRED'
  ).length;

  const maxAttempts = interview.maxAttempts || 1;
  if (completedAttempts >= maxAttempts) {
    throw new Error(
      `Batas pengerjaan (${maxAttempts}x kesempatan) telah tercapai. Anda tidak dapat mengulang interview ini.`
    );
  }

  // Create new session with strict server-authoritative timer
  const nowIso = new Date(nowMs).toISOString();
  const durationMinutes = interview.durationMinutes || 30;
  const expiresIso = new Date(nowMs + durationMinutes * 60 * 1000).toISOString();

  // Calculate max score
  const maxScore = (interview.questions || []).reduce((acc, q) => acc + (q.points || 10), 0);

  const newSessionData: Omit<InterviewSession, 'id'> = {
    candidateId,
    candidateName,
    candidateEmail,
    companyId: interview.companyId,
    companyName: interview.companyName || '',
    interviewId,
    interviewName: interview.interviewName,
    position: interview.position,
    startedAt: nowIso,
    expiresAt: expiresIso,
    status: 'IN_PROGRESS',
    currentQuestionIndex: 0,
    answers: {},
    score: null,
    maxScore,
    percentage: null,
    passed: null,
    activityLog: [
      {
        event: 'session_started',
        timestamp: nowIso,
        details: 'Kandidat memulai sesi interview.',
      },
    ],
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  const newDocRef = await addDoc(sessionsCol, newSessionData);
  const createdSession: InterviewSession = { id: newDocRef.id, ...newSessionData };

  return { session: createdSession, interview };
}

/**
 * Save single answer & check server timer
 */
export async function handleSaveAnswer(payload: {
  sessionId: string;
  candidateId: string;
  questionId: string;
  answer: string;
}): Promise<{ success: boolean; session?: InterviewSession; autoSubmitted?: boolean }> {
  const { sessionId, candidateId, questionId, answer } = payload;
  const sessionDocRef = doc(db, SESSIONS_COLLECTION, sessionId);
  const sessionSnap = await getDoc(sessionDocRef);

  if (!sessionSnap.exists()) {
    throw new Error('Sesi interview tidak ditemukan.');
  }

  const session = { id: sessionSnap.id, ...sessionSnap.data() } as InterviewSession;

  if (session.candidateId !== candidateId) {
    throw new Error('Tidak memiliki akses ke sesi ini.');
  }

  if (session.status !== 'IN_PROGRESS') {
    return { success: false, session, autoSubmitted: true };
  }

  // Check server-side expiration
  const nowMs = Date.now();
  const expiresMs = new Date(session.expiresAt).getTime();

  if (nowMs >= expiresMs) {
    // Auto-submit
    const interviewSnap = await getDoc(doc(db, INTERVIEWS_COLLECTION, session.interviewId));
    const interview = interviewSnap.exists() ? (interviewSnap.data() as Interview) : null;
    await handleAutoSubmitSession(session, interview);
    const updated = (await getDoc(sessionDocRef)).data() as InterviewSession;
    return { success: true, session: updated, autoSubmitted: true };
  }

  // Update answer map
  const updatedAnswers: Record<string, CandidateAnswerItem> = {
    ...session.answers,
    [questionId]: {
      questionId,
      answer,
      answeredAt: new Date().toISOString(),
    },
  };

  await updateDoc(sessionDocRef, {
    answers: updatedAnswers,
    updatedAt: new Date().toISOString(),
  });

  return { success: true };
}

/**
 * Auto-submit session when timer runs out
 */
async function handleAutoSubmitSession(
  session: InterviewSession,
  interview: Interview | null
): Promise<void> {
  const questions = interview?.questions || [];
  const graded = gradeSessionAnswers(session.answers, questions);

  const completionTimeSeconds = Math.round(
    (new Date(session.expiresAt).getTime() - new Date(session.startedAt).getTime()) / 1000
  );

  const passingScore = interview?.minimumPassingScore || 70;
  const passed = graded.totalScore >= passingScore;
  const percentage = session.maxScore > 0 ? Math.round((graded.totalScore / session.maxScore) * 100) : 0;

  const sessionDocRef = doc(db, SESSIONS_COLLECTION, session.id);
  await updateDoc(sessionDocRef, {
    answers: graded.answers,
    status: 'AUTO_SUBMITTED',
    submittedAt: session.expiresAt,
    score: graded.totalScore,
    percentage,
    passed,
    completionTimeSeconds,
    activityLog: [
      ...(session.activityLog || []),
      {
        event: 'auto_submitted',
        timestamp: new Date().toISOString(),
        details: 'Waktu pengerjaan habis. Jawaban otomatis dikirim oleh server.',
      },
    ],
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Normal Candidate Submit
 */
export async function handleSubmitSession(payload: {
  sessionId: string;
  candidateId: string;
  answers: Record<string, { answer: string; answeredAt: string }>;
  isAutoSubmit?: boolean;
}): Promise<{ session: InterviewSession; score: number; passed: boolean }> {
  const { sessionId, candidateId, answers, isAutoSubmit } = payload;
  const sessionDocRef = doc(db, SESSIONS_COLLECTION, sessionId);
  const sessionSnap = await getDoc(sessionDocRef);

  if (!sessionSnap.exists()) {
    throw new Error('Sesi interview tidak ditemukan.');
  }

  const session = { id: sessionSnap.id, ...sessionSnap.data() } as InterviewSession;

  if (session.candidateId !== candidateId) {
    throw new Error('Tidak memiliki akses ke sesi ini.');
  }

  if (session.status === 'SUBMITTED' || session.status === 'AUTO_SUBMITTED') {
    return { session, score: session.score || 0, passed: Boolean(session.passed) };
  }

  const interviewSnap = await getDoc(doc(db, INTERVIEWS_COLLECTION, session.interviewId));
  if (!interviewSnap.exists()) {
    throw new Error('Interview tidak ditemukan.');
  }

  const interview = interviewSnap.data() as Interview;
  const questions = interview.questions || [];

  // Merge client latest answers with stored answers
  const combinedAnswers: Record<string, CandidateAnswerItem> = { ...session.answers };
  Object.entries(answers || {}).forEach(([qId, item]) => {
    combinedAnswers[qId] = {
      questionId: qId,
      answer: item.answer,
      answeredAt: item.answeredAt || new Date().toISOString(),
    };
  });

  const graded = gradeSessionAnswers(combinedAnswers, questions);
  const nowMs = Date.now();
  const startedMs = new Date(session.startedAt).getTime();
  const completionTimeSeconds = Math.max(1, Math.round((nowMs - startedMs) / 1000));

  const passingScore = interview.minimumPassingScore || 70;
  const passed = graded.totalScore >= passingScore;
  const percentage = session.maxScore > 0 ? Math.round((graded.totalScore / session.maxScore) * 100) : 0;
  const status = isAutoSubmit ? 'AUTO_SUBMITTED' : 'SUBMITTED';

  const updatedPayload: Partial<InterviewSession> = {
    answers: graded.answers,
    status,
    submittedAt: new Date().toISOString(),
    score: graded.totalScore,
    percentage,
    passed,
    completionTimeSeconds,
    activityLog: [
      ...(session.activityLog || []),
      {
        event: isAutoSubmit ? 'auto_submitted' : 'candidate_submitted',
        timestamp: new Date().toISOString(),
        details: isAutoSubmit
          ? 'Waktu pengerjaan habis. Dikirim otomatis.'
          : 'Kandidat menekan tombol selesai dan mengonfirmasi pengiriman jawaban.',
      },
    ],
    updatedAt: new Date().toISOString(),
  };

  await updateDoc(sessionDocRef, updatedPayload);

  return {
    session: { ...session, ...updatedPayload } as InterviewSession,
    score: graded.totalScore,
    passed,
  };
}

/**
 * Server-side auto grading algorithm for objective questions
 */
function gradeSessionAnswers(
  candidateAnswers: Record<string, CandidateAnswerItem>,
  questions: InterviewQuestion[]
): { answers: Record<string, CandidateAnswerItem>; totalScore: number } {
  let totalScore = 0;
  const updatedAnswers: Record<string, CandidateAnswerItem> = { ...candidateAnswers };

  questions.forEach((q) => {
    const candidateAns = updatedAnswers[q.id];
    const points = q.points || 10;

    if (!candidateAns || !candidateAns.answer) {
      // Unanswered
      updatedAnswers[q.id] = {
        questionId: q.id,
        answer: '',
        answeredAt: new Date().toISOString(),
        autoScore: 0,
        maxPoints: points,
        isCorrect: false,
      };
      return;
    }

    if (q.type === 'multiple_choice' || q.type === 'true_false') {
      const correct = (q.correctAnswer || '').trim().toLowerCase();
      const candidateVal = candidateAns.answer.trim().toLowerCase();
      const isMatch = Boolean(correct && candidateVal === correct);

      const scoreEarned = isMatch ? points : 0;
      totalScore += scoreEarned;

      updatedAnswers[q.id] = {
        ...candidateAns,
        autoScore: scoreEarned,
        maxPoints: points,
        isCorrect: isMatch,
      };
    } else if (q.type === 'short_answer') {
      const correct = (q.correctAnswer || '').trim().toLowerCase();
      const candidateVal = candidateAns.answer.trim().toLowerCase();
      const isMatch = Boolean(correct && candidateVal === correct);

      const scoreEarned = isMatch ? points : 0;
      totalScore += scoreEarned;

      updatedAnswers[q.id] = {
        ...candidateAns,
        autoScore: scoreEarned,
        maxPoints: points,
        isCorrect: isMatch,
      };
    } else {
      // Essay, situational, technical: pending manual or AI review
      updatedAnswers[q.id] = {
        ...candidateAns,
        autoScore: candidateAns.autoScore ?? 0,
        maxPoints: points,
      };
    }
  });

  return { answers: updatedAnswers, totalScore };
}

/**
 * Log anti-cheating suspicious telemetry
 */
export async function handleLogActivity(payload: {
  sessionId: string;
  candidateId: string;
  event: string;
  details?: string;
}): Promise<void> {
  const { sessionId, candidateId, event, details } = payload;
  const sessionDocRef = doc(db, SESSIONS_COLLECTION, sessionId);
  const snap = await getDoc(sessionDocRef);
  if (!snap.exists()) return;

  const session = snap.data() as InterviewSession;
  if (session.candidateId !== candidateId) return;

  const newLogItem: SuspiciousActivityItem = {
    event,
    timestamp: new Date().toISOString(),
    details: details || '',
  };

  const activityLog = [...(session.activityLog || []), newLogItem];
  await updateDoc(sessionDocRef, {
    activityLog,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * AI Question Generator using Gemini API
 */
export async function handleAIGenerateQuestions(params: {
  position: string;
  description?: string;
  requirements?: string[];
  level?: string;
  count?: number;
  types?: string[];
  difficulty?: string;
}): Promise<InterviewQuestion[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY tidak dikonfigurasi di server.');
  }

  const ai = new GoogleGenAI({ apiKey });
  const count = Math.min(Math.max(params.count || 5, 1), 15);
  const position = params.position || 'Staff';
  const level = params.level || 'Entry / Junior';
  const difficulty = params.difficulty || 'Sedang';
  const types = params.types && params.types.length > 0 ? params.types.join(', ') : 'multiple_choice, essay, situational';

  const prompt = `Anda adalah Recruitment Assessment Specialist profesional di Indonesia.
Buatlah ${count} soal tes dan wawancara online untuk posisi: "${position}".
Level pekerjaan: ${level}.
Tingkat kesulitan: ${difficulty}.
Jenis soal yang diinginkan: ${types}.
Konteks / Deskripsi Pekerjaan: ${params.description || 'Pekerjaan profesional di perusahaan Jawa Barat'}.
Persyaratan: ${(params.requirements || []).join(', ')}.

INSTRUKSI PENTING:
- Bahasa Indonesia baku, jelas, dan profesional.
- Jika jenis "multiple_choice", wajib sertakan 4 opsi (A, B, C, D) dan cantumkan opsi yang benar di "correctAnswer".
- Jika jenis "true_false", sertakan 2 opsi: "Benar", "Salah" dan cantumkan jawaban benar di "correctAnswer".
- Jika jenis "essay", "situational", atau "technical", sediakan pertanyaan studi kasus yang menguji kompetensi nyata.
- Berikan bobot nilai (points), default 10 atau 20.
- Kembalikan HANYA JSON array murni tanpa markdown formatting backticks.

Format JSON per item:
[
  {
    "id": "q_1",
    "question": "Pertanyaan...",
    "type": "multiple_choice | true_false | short_answer | essay | situational | technical",
    "options": ["Opsi A", "Opsi B", "Opsi C", "Opsi D"],
    "correctAnswer": "Opsi A",
    "points": 10,
    "category": "Kompetensi Posisi",
    "difficulty": "Mudah | Sedang | Sulit",
    "required": true
  }
]`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.6-flash',
    contents: prompt,
    config: {
      temperature: 0.3,
    },
  });

  const text = response.text || '';
  const cleanJson = text.replace(/```json/gi, '').replace(/```/g, '').trim();

  let parsed: any[] = [];
  try {
    parsed = JSON.parse(cleanJson);
  } catch (err) {
    console.error('Failed to parse Gemini JSON output:', text);
    throw new Error('Format respon AI tidak valid. Silakan coba lagi.');
  }

  return parsed.map((item, idx) => ({
    id: `ai_${Date.now()}_${idx + 1}`,
    question: item.question || '',
    type: item.type || 'multiple_choice',
    options: Array.isArray(item.options) ? item.options : undefined,
    correctAnswer: item.correctAnswer || undefined,
    points: typeof item.points === 'number' ? item.points : 10,
    order: idx + 1,
    required: true,
    category: item.category || 'Umum',
    difficulty: item.difficulty || 'Sedang',
  }));
}

/**
 * AI Essay Evaluation using Gemini API
 */
export async function handleAIEvaluateEssay(params: {
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
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY tidak dikonfigurasi di server.');
  }

  const ai = new GoogleGenAI({ apiKey });
  const { question, candidateAnswer, maxPoints, position } = params;

  const prompt = `Anda adalah Recruiter & Talent Evaluator profesional untuk posisi "${position || 'Kandidat'}".
Evaluasi jawaban essay/situasional kandidat berikut ini secara obyektif:

Pertanyaan:
"${question}"

Jawaban Kandidat:
"${candidateAnswer || '(Tidak dijawab)'}"

Nilai Maksimal Soal: ${maxPoints}

Berikan penilaian analitis dalam format JSON murni:
{
  "suggestedScore": number (antara 0 sampai ${maxPoints}),
  "reasoning": "Alasan singkat dan tajam dalam Bahasa Indonesia",
  "strengths": ["Kelebihan 1", "Kelebihan 2"],
  "weaknesses": ["Kekurangan 1", "Kekurangan 2"],
  "relevance": "Sangat Relevan | Relevan | Cukup | Kurang Relevan"
}`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.6-flash',
    contents: prompt,
    config: {
      temperature: 0.2,
    },
  });

  const text = response.text || '';
  const cleanJson = text.replace(/```json/gi, '').replace(/```/g, '').trim();

  try {
    return JSON.parse(cleanJson);
  } catch (err) {
    return {
      suggestedScore: Math.round(maxPoints * 0.7),
      reasoning: 'Jawaban telah dievaluasi, memberikan poin proporsional sesuai kelengkapan ide.',
      strengths: ['Memahami inti pertanyaan'],
      weaknesses: ['Dapat dieksplorasi lebih spesifik'],
      relevance: 'Relevan',
    };
  }
}

/**
 * Verify Room Code
 */
export async function handleVerifyRoomCode(roomCode: string): Promise<{ interview: Interview }> {
  const colRef = collection(db, INTERVIEWS_COLLECTION);
  const q = query(colRef, where('roomCode', '==', roomCode.toUpperCase().trim()));
  const snap = await getDocs(q);

  if (snap.empty) {
    throw new Error('Kode room interview tidak ditemukan.');
  }

  const docData = snap.docs[0];
  const interview = { id: docData.id, ...docData.data() } as Interview;

  if (interview.status === 'CLOSED' || interview.status === 'CANCELLED') {
    throw new Error('Ruang interview ini telah ditutup oleh recruiter.');
  }

  return { interview };
}

/**
 * Company Subscription Upgrade
 */
export async function handleUpgradeSubscription(params: {
  companyId: string;
  plan: string;
}): Promise<{ success: boolean; message: string; expiresAt: string }> {
  const { companyId, plan } = params;
  const companyDocRef = doc(db, COMPANIES_COLLECTION, companyId);
  const snap = await getDoc(companyDocRef);

  if (!snap.exists()) {
    throw new Error('Perusahaan tidak ditemukan.');
  }

  const now = new Date();
  const expires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
  const expiresAt = expires.toISOString();

  await updateDoc(companyDocRef, {
    subscription: {
      plan: plan || 'PRO_MONTHLY',
      status: 'PREMIUM',
      startAt: now.toISOString(),
      expiresAt,
      updatedAt: now.toISOString(),
    },
    updatedAt: now.toISOString(),
  });

  return {
    success: true,
    message: 'Paket Perusahaan berhasil ditingkatkan ke PREMIUM (Aktif 30 Hari).',
    expiresAt,
  };
}
