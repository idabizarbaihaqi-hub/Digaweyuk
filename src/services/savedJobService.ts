import {
  collection,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { handleFirestoreError, OperationType } from '../firebase/errorHandler';

export const SAVED_JOBS_COLLECTION = 'savedJobs';

/**
 * Deterministic document ID generation: userId_jobId
 * Guarantees zero duplicate entries per user & job
 */
export function getSavedJobDocId(userId: string, jobId: string): string {
  return `${userId}_${jobId}`;
}

/**
 * Save a job for a user (PREMIUM only)
 */
export async function saveJob(userId: string, jobId: string): Promise<void> {
  const docId = getSavedJobDocId(userId, jobId);
  const docRef = doc(db, SAVED_JOBS_COLLECTION, docId);

  try {
    await setDoc(docRef, {
      userId,
      jobId,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error saving job:', error);
    handleFirestoreError(error, OperationType.CREATE, `${SAVED_JOBS_COLLECTION}/${docId}`);
  }
}

/**
 * Remove a saved job for a user
 */
export async function unsaveJob(userId: string, jobId: string): Promise<void> {
  const docId = getSavedJobDocId(userId, jobId);
  const docRef = doc(db, SAVED_JOBS_COLLECTION, docId);

  try {
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error unsaving job:', error);
    handleFirestoreError(error, OperationType.DELETE, `${SAVED_JOBS_COLLECTION}/${docId}`);
  }
}

/**
 * Check if a job is currently saved by user
 */
export async function isJobSaved(userId: string, jobId: string): Promise<boolean> {
  const docId = getSavedJobDocId(userId, jobId);
  const docRef = doc(db, SAVED_JOBS_COLLECTION, docId);
  try {
    const snapshot = await getDoc(docRef);
    return snapshot.exists();
  } catch (error) {
    console.error('Error checking saved job:', error);
    handleFirestoreError(error, OperationType.GET, `${SAVED_JOBS_COLLECTION}/${docId}`);
  }
}

/**
 * Real-time listener for user's saved jobs
 * Emits list of saved job IDs
 */
export function subscribeUserSavedJobIds(
  userId: string,
  onUpdate: (savedJobIds: Set<string>) => void,
  onError?: (error: Error) => void
): () => void {
  const collectionRef = collection(db, SAVED_JOBS_COLLECTION);
  const q = query(collectionRef, where('userId', '==', userId));

  return onSnapshot(
    q,
    (snapshot) => {
      const ids = new Set<string>();
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.jobId) {
          ids.add(data.jobId);
        }
      });
      onUpdate(ids);
    },
    (err) => {
      console.error('Error listening to saved jobs:', err);
      if (onError) onError(err);
      handleFirestoreError(err, OperationType.LIST, SAVED_JOBS_COLLECTION);
    }
  );
}
