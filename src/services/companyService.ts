import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { handleFirestoreError, OperationType } from '../firebase/errorHandler';
import {
  CompanyProfile,
  Job,
  JobApplication,
  PipelineStage,
  Interview,
  QuestionBankItem,
  InterviewSession,
} from '../types';
import { createNotification } from './notificationService';

export const COMPANIES_COLLECTION = 'companies';
export const JOBS_COLLECTION = 'jobs';
export const APPLICATIONS_COLLECTION = 'applications';
export const INTERVIEWS_COLLECTION = 'interviews';
export const SESSIONS_COLLECTION = 'interviewSessions';
export const QUESTION_BANKS_COLLECTION = 'questionBanks';

/**
 * Fetch Company Profile
 */
export async function getCompanyProfile(companyId: string): Promise<CompanyProfile | null> {
  const companyDocRef = doc(db, COMPANIES_COLLECTION, companyId);
  try {
    const snap = await getDoc(companyDocRef);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as CompanyProfile;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `${COMPANIES_COLLECTION}/${companyId}`);
  }
}

/**
 * Subscribe to Company Profile updates in real-time
 */
export function subscribeCompanyProfile(
  companyId: string,
  callback: (company: CompanyProfile | null) => void
): () => void {
  const companyDocRef = doc(db, COMPANIES_COLLECTION, companyId);
  return onSnapshot(
    companyDocRef,
    (snap) => {
      if (!snap.exists()) {
        callback(null);
      } else {
        callback({ id: snap.id, ...snap.data() } as CompanyProfile);
      }
    },
    (err) => {
      console.error('Error listening to company profile:', err);
    }
  );
}

/**
 * Update Company Profile
 */
export async function updateCompanyProfile(
  companyId: string,
  updates: Partial<CompanyProfile>
): Promise<void> {
  const companyDocRef = doc(db, COMPANIES_COLLECTION, companyId);
  try {
    await updateDoc(companyDocRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${COMPANIES_COLLECTION}/${companyId}`);
  }
}

/**
 * Fetch jobs published by a specific company
 */
export async function getCompanyJobs(companyId: string): Promise<Job[]> {
  const colRef = collection(db, JOBS_COLLECTION);
  try {
    const q = query(colRef, where('companyId', '==', companyId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Job));
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, JOBS_COLLECTION);
  }
}

/**
 * Create a new job vacancy posted directly by the company
 */
export async function createCompanyJob(
  companyId: string,
  companyName: string,
  jobData: Partial<Job>
): Promise<Job> {
  const colRef = collection(db, JOBS_COLLECTION);
  const now = new Date().toISOString();
  const newJobPayload = {
    ...jobData,
    companyId,
    company: companyName,
    companyName: companyName,
    province: 'Jawa Barat',
    status: 'active',
    verified: true,
    validationStatus: 'valid',
    sourceType: 'official_company',
    sourceName: companyName,
    publishedAt: now,
    foundAt: now,
  };

  try {
    const docRef = await addDoc(colRef, newJobPayload);
    return { id: docRef.id, ...newJobPayload } as Job;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, JOBS_COLLECTION);
  }
}

/**
 * Fetch all applications for a company
 */
export async function getCompanyApplications(
  companyId: string,
  jobId?: string
): Promise<JobApplication[]> {
  const colRef = collection(db, APPLICATIONS_COLLECTION);
  try {
    let q = query(colRef, where('companyId', '==', companyId));
    if (jobId) {
      q = query(colRef, where('companyId', '==', companyId), where('jobId', '==', jobId));
    }
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as JobApplication));
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, APPLICATIONS_COLLECTION);
  }
}

/**
 * Real-time listener for company applications
 */
export function subscribeCompanyApplications(
  companyId: string,
  callback: (apps: JobApplication[]) => void,
  jobId?: string
): () => void {
  const colRef = collection(db, APPLICATIONS_COLLECTION);
  let q = query(colRef, where('companyId', '==', companyId));
  if (jobId) {
    q = query(colRef, where('companyId', '==', companyId), where('jobId', '==', jobId));
  }

  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as JobApplication));
      callback(list);
    },
    (err) => {
      console.error('Error listening to company applications:', err);
    }
  );
}

/**
 * Move candidate between recruitment pipeline stages
 */
export async function updateApplicationStage(
  applicationId: string,
  newStage: PipelineStage,
  changedBy: string,
  note?: string
): Promise<void> {
  const appDocRef = doc(db, APPLICATIONS_COLLECTION, applicationId);
  try {
    const snap = await getDoc(appDocRef);
    if (!snap.exists()) return;
    const current = snap.data() as JobApplication;
    const auditItem = {
      stage: newStage,
      changedBy,
      changedAt: new Date().toISOString(),
      note: note || '',
    };
    const auditHistory = [...(current.auditHistory || []), auditItem];

    await updateDoc(appDocRef, {
      stage: newStage,
      auditHistory,
      updatedAt: new Date().toISOString(),
    });

    // Send real-time notification to candidate
    if (current.candidateId) {
      try {
        await createNotification({
          userId: current.candidateId,
          title: `Status Lamaran: ${newStage}`,
          message: `Lamaran Anda untuk posisi ${current.jobTitle} di ${current.companyName} dipindahkan ke tahap ${newStage}.${note ? ' Catatan: ' + note : ''}`,
          type: 'APPLICATION_UPDATE',
        });
      } catch (e) {
        console.error('Error creating notification for candidate:', e);
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${APPLICATIONS_COLLECTION}/${applicationId}`);
  }
}

/**
 * Apply to a job (called by candidate)
 */
export async function applyToJob(
  job: Job,
  candidate: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    resumeUrl?: string;
    coverNote?: string;
  }
): Promise<JobApplication> {
  const colRef = collection(db, APPLICATIONS_COLLECTION);
  const now = new Date().toISOString();
  const companyId = (job as any).companyId || job.companyName || 'unknown';

  const newApp: Omit<JobApplication, 'id'> = {
    jobId: job.id,
    jobTitle: job.title,
    companyId,
    companyName: job.companyName || job.company,
    candidateId: candidate.id,
    candidateName: candidate.name,
    candidateEmail: candidate.email,
    candidatePhone: candidate.phone || '',
    resumeUrl: candidate.resumeUrl || '',
    coverNote: candidate.coverNote || '',
    stage: 'PELAMAR',
    appliedAt: now,
    updatedAt: now,
    interviewStatus: 'NOT_INVITED',
    auditHistory: [
      {
        stage: 'PELAMAR',
        changedBy: candidate.name,
        changedAt: now,
        note: 'Lamaran terkirim oleh kandidat',
      },
    ],
  };

  try {
    const docRef = await addDoc(colRef, newApp);

    // Notify company
    if (companyId && companyId !== 'unknown') {
      try {
        await createNotification({
          userId: companyId,
          title: `Pelamar Baru Masuk 📄`,
          message: `${candidate.name} melamar posisi ${job.title}. Cek di Recruitment Pipeline Anda.`,
          type: 'APPLICATION_UPDATE',
        });
      } catch (e) {
        // non-fatal
      }
    }

    return { id: docRef.id, ...newApp } as JobApplication;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, APPLICATIONS_COLLECTION);
  }
}

/**
 * Fetch candidate's submitted applications
 */
export async function getCandidateApplications(candidateId: string): Promise<JobApplication[]> {
  const colRef = collection(db, APPLICATIONS_COLLECTION);
  try {
    const q = query(colRef, where('candidateId', '==', candidateId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as JobApplication));
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, APPLICATIONS_COLLECTION);
  }
}

/**
 * Subscribe candidate's submitted applications in real-time
 */
export function subscribeCandidateApplications(
  candidateId: string,
  callback: (apps: JobApplication[]) => void
): () => void {
  const colRef = collection(db, APPLICATIONS_COLLECTION);
  const q = query(colRef, where('candidateId', '==', candidateId));

  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as JobApplication));
      list.sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime());
      callback(list);
    },
    (err) => {
      console.error('Error listening to candidate applications:', err);
    }
  );
}

/**
 * Fetch company's online interviews
 */
export async function getCompanyInterviews(companyId: string): Promise<Interview[]> {
  const colRef = collection(db, INTERVIEWS_COLLECTION);
  try {
    const q = query(colRef, where('companyId', '==', companyId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Interview));
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, INTERVIEWS_COLLECTION);
  }
}

/**
 * Real-time listener for company's interviews
 */
export function subscribeCompanyInterviews(
  companyId: string,
  callback: (interviews: Interview[]) => void
): () => void {
  const colRef = collection(db, INTERVIEWS_COLLECTION);
  const q = query(colRef, where('companyId', '==', companyId));

  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Interview));
      callback(list);
    },
    (err) => {
      console.error('Error listening to company interviews:', err);
    }
  );
}

/**
 * Get interview by ID
 */
export async function getInterviewById(interviewId: string): Promise<Interview | null> {
  const docRef = doc(db, INTERVIEWS_COLLECTION, interviewId);
  try {
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as Interview;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `${INTERVIEWS_COLLECTION}/${interviewId}`);
  }
}

/**
 * Find interview by Room Code
 */
export async function getInterviewByRoomCode(roomCode: string): Promise<Interview | null> {
  const colRef = collection(db, INTERVIEWS_COLLECTION);
  try {
    const q = query(colRef, where('roomCode', '==', roomCode.toUpperCase().trim()));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const first = snap.docs[0];
    return { id: first.id, ...first.data() } as Interview;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, INTERVIEWS_COLLECTION);
  }
}

/**
 * Create Interview
 */
export async function createInterview(
  interviewData: Omit<Interview, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Interview> {
  const colRef = collection(db, INTERVIEWS_COLLECTION);
  const now = new Date().toISOString();
  const payload = {
    ...interviewData,
    createdAt: now,
    updatedAt: now,
  };

  try {
    const docRef = await addDoc(colRef, payload);
    return { id: docRef.id, ...payload } as Interview;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, INTERVIEWS_COLLECTION);
  }
}

/**
 * Update Interview
 */
export async function updateInterview(
  interviewId: string,
  updates: Partial<Interview>
): Promise<void> {
  const docRef = doc(db, INTERVIEWS_COLLECTION, interviewId);
  try {
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${INTERVIEWS_COLLECTION}/${interviewId}`);
  }
}

/**
 * Delete Interview
 */
export async function deleteInterview(interviewId: string): Promise<void> {
  const docRef = doc(db, INTERVIEWS_COLLECTION, interviewId);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${INTERVIEWS_COLLECTION}/${interviewId}`);
  }
}

/**
 * Fetch Question Bank for a company
 */
export async function getCompanyQuestionBank(companyId: string): Promise<QuestionBankItem[]> {
  const colRef = collection(db, QUESTION_BANKS_COLLECTION);
  try {
    const q = query(colRef, where('companyId', '==', companyId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as QuestionBankItem));
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, QUESTION_BANKS_COLLECTION);
  }
}

/**
 * Real-time listener for question bank
 */
export function subscribeQuestionBank(
  companyId: string,
  callback: (items: QuestionBankItem[]) => void
): () => void {
  const colRef = collection(db, QUESTION_BANKS_COLLECTION);
  const q = query(colRef, where('companyId', '==', companyId));

  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as QuestionBankItem));
      callback(list);
    },
    (err) => {
      console.error('Error listening to question bank:', err);
    }
  );
}

/**
 * Save / Update Question in Bank Soal
 */
export async function saveQuestionBankItem(
  companyId: string,
  itemData: Omit<QuestionBankItem, 'id' | 'companyId' | 'createdAt' | 'updatedAt'>,
  itemId?: string
): Promise<void> {
  const now = new Date().toISOString();
  if (itemId) {
    const docRef = doc(db, QUESTION_BANKS_COLLECTION, itemId);
    try {
      await updateDoc(docRef, {
        ...itemData,
        updatedAt: now,
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${QUESTION_BANKS_COLLECTION}/${itemId}`);
    }
  } else {
    const colRef = collection(db, QUESTION_BANKS_COLLECTION);
    try {
      await addDoc(colRef, {
        ...itemData,
        companyId,
        active: true,
        createdAt: now,
        updatedAt: now,
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, QUESTION_BANKS_COLLECTION);
    }
  }
}

/**
 * Delete Question from Question Bank
 */
export async function deleteQuestionBankItem(itemId: string): Promise<void> {
  const docRef = doc(db, QUESTION_BANKS_COLLECTION, itemId);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${QUESTION_BANKS_COLLECTION}/${itemId}`);
  }
}

/**
 * Fetch candidate interview sessions for an interview
 */
export async function getInterviewSessions(interviewId: string): Promise<InterviewSession[]> {
  const colRef = collection(db, SESSIONS_COLLECTION);
  try {
    const q = query(colRef, where('interviewId', '==', interviewId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as InterviewSession));
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, SESSIONS_COLLECTION);
  }
}

/**
 * Real-time listener for interview sessions (for real-time ranking and candidate scoring)
 */
export function subscribeInterviewSessions(
  interviewId: string,
  callback: (sessions: InterviewSession[]) => void
): () => void {
  const colRef = collection(db, SESSIONS_COLLECTION);
  const q = query(colRef, where('interviewId', '==', interviewId));

  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as InterviewSession));
      callback(list);
    },
    (err) => {
      console.error('Error listening to interview sessions:', err);
    }
  );
}

/**
 * Save Recruiter Review & Final Scoring
 */
export async function saveCandidateRecruiterReview(
  sessionId: string,
  review: {
    companyFinalScore?: number;
    reviewedBy: string;
    recruiterNotes?: string;
    questionScores?: Record<string, { recruiterScore: number; recruiterFeedback?: string }>;
  }
): Promise<void> {
  const docRef = doc(db, SESSIONS_COLLECTION, sessionId);
  try {
    const now = new Date().toISOString();
    const snap = await getDoc(docRef);
    if (!snap.exists()) return;
    const session = snap.data() as InterviewSession;

    // Update individual question recruiter scores if provided
    let updatedAnswers = { ...session.answers };
    if (review.questionScores) {
      Object.entries(review.questionScores).forEach(([qId, qReview]) => {
        if (updatedAnswers[qId]) {
          updatedAnswers[qId] = {
            ...updatedAnswers[qId],
            recruiterScore: qReview.recruiterScore,
            recruiterFeedback: qReview.recruiterFeedback || '',
          };
        }
      });
    }

    await updateDoc(docRef, {
      companyFinalScore: review.companyFinalScore ?? session.companyFinalScore,
      reviewedBy: review.reviewedBy,
      reviewedAt: now,
      recruiterNotes: review.recruiterNotes ?? session.recruiterNotes ?? '',
      answers: updatedAnswers,
      updatedAt: now,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${SESSIONS_COLLECTION}/${sessionId}`);
  }
}
