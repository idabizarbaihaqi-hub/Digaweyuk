import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { handleFirestoreError, OperationType } from '../firebase/errorHandler';
import { JobHunterLog, JobHunterSettings } from '../types';

export const LOGS_COLLECTION = 'jobHunterLogs';
export const SETTINGS_COLLECTION = 'settings';
export const SETTINGS_DOC = 'jobHunter';

export const DEFAULT_JOB_HUNTER_SETTINGS: JobHunterSettings = {
  enabled: true,
  schedule: '0 0 * * *', // daily
  timezone: 'Asia/Jakarta',
  maxJobsPerRun: 15,
  maxQueriesPerRun: 3,
  maxAgeDays: 5,
  searchLocations: ['Bandung', 'Jakarta', 'Jawa Barat', 'Surabaya', 'Semarang'],
  searchCategories: [
    'Administrasi',
    'IT',
    'Marketing',
    'Sales',
    'Customer Service',
    'Pabrik',
    'Operator',
    'Driver',
    'Logistik',
  ],
};

/**
 * Fetch Job Hunter Settings from Firestore
 */
export async function getJobHunterSettings(): Promise<JobHunterSettings> {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return {
        ...DEFAULT_JOB_HUNTER_SETTINGS,
        ...snap.data(),
      } as JobHunterSettings;
    }
    return DEFAULT_JOB_HUNTER_SETTINGS;
  } catch (error) {
    console.error('Error fetching job hunter settings:', error);
    return DEFAULT_JOB_HUNTER_SETTINGS;
  }
}

/**
 * Update Job Hunter Settings in Firestore
 */
export async function updateJobHunterSettings(
  settings: Partial<JobHunterSettings>
): Promise<void> {
  const docRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC);
  try {
    await setDoc(
      docRef,
      {
        ...settings,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error('Error saving job hunter settings:', error);
    handleFirestoreError(error, OperationType.UPDATE, `${SETTINGS_COLLECTION}/${SETTINGS_DOC}`);
  }
}

/**
 * Real-time listener for Job Hunter Settings
 */
export function subscribeJobHunterSettings(
  onUpdate: (settings: JobHunterSettings) => void
): () => void {
  const docRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC);
  return onSnapshot(
    docRef,
    (snap) => {
      if (snap.exists()) {
        onUpdate({
          ...DEFAULT_JOB_HUNTER_SETTINGS,
          ...snap.data(),
        } as JobHunterSettings);
      } else {
        onUpdate(DEFAULT_JOB_HUNTER_SETTINGS);
      }
    },
    (err) => {
      console.error('Error listening to job hunter settings:', err);
    }
  );
}

/**
 * Real-time listener for Job Hunter execution logs
 */
export function subscribeJobHunterLogs(
  onUpdate: (logs: JobHunterLog[]) => void,
  maxRecords = 25
): () => void {
  const logsRef = collection(db, LOGS_COLLECTION);
  const q = query(logsRef, orderBy('startedAt', 'desc'), limit(maxRecords));

  return onSnapshot(
    q,
    (snapshot) => {
      const logs: JobHunterLog[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        logs.push({
          id: docSnap.id,
          runId: data.runId || docSnap.id,
          startedAt: data.startedAt || '',
          finishedAt: data.finishedAt || '',
          status: data.status || 'running',
          totalDiscovered: Number(data.totalDiscovered ?? data.jobsDiscovered) || 0,
          totalAccepted: Number(data.totalAccepted ?? data.jobsInserted) || 0,
          totalRejected: Number(data.totalRejected ?? data.rejected) || 0,
          rejectedOutsideWestJava: Number(data.rejectedOutsideWestJava) || 0,
          rejectedNoAddress: Number(data.rejectedNoAddress) || 0,
          rejectedNoContact: Number(data.rejectedNoContact) || 0,
          rejectedInvalidCompany: Number(data.rejectedInvalidCompany) || 0,
          rejectedInvalidSource: Number(data.rejectedInvalidSource) || 0,
          jobsDiscovered: Number(data.jobsDiscovered ?? data.totalDiscovered) || 0,
          jobsInserted: Number(data.jobsInserted ?? data.totalAccepted) || 0,
          jobsUpdated: Number(data.jobsUpdated) || 0,
          duplicates: Number(data.duplicates) || 0,
          rejected: Number(data.rejected ?? data.totalRejected) || 0,
          validationFailed: Number(data.validationFailed) || 0,
          errors: Array.isArray(data.errors) ? data.errors : [],
          executedBy: data.executedBy || 'System / Admin',
        });
      });
      onUpdate(logs);
    },
    (err) => {
      console.warn('Notice: Could not subscribe to job hunter logs:', err?.message || err);
      onUpdate([]);
    }
  );
}

/**
 * Trigger manual execution of AI Job Hunter via server backend endpoint
 */
export async function triggerManualJobHunter(
  adminToken?: string
): Promise<{
  success: boolean;
  quotaExceeded?: boolean;
  discovered: number;
  inserted: number;
  updated: number;
  duplicates: number;
  rejected: number;
  validationFailed: number;
  errors?: string[];
  message?: string;
}> {
  const response = await fetch('/api/job-hunter/run', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {}),
    },
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    throw new Error(errBody.error || `Server error: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Trigger manual cleanup of expired jobs via server backend endpoint
 */
export async function triggerJobCleanup(
  adminToken?: string
): Promise<{
  success: boolean;
  deletedCount: number;
  closedCount: number;
  message: string;
}> {
  const response = await fetch('/api/job-hunter/cleanup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {}),
    },
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    throw new Error(errBody.error || `Server error: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}
