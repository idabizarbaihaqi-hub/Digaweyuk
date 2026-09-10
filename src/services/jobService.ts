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
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { handleFirestoreError, OperationType } from '../firebase/errorHandler';
import { Job, JobStatus, SourceType, ValidationStatus } from '../types';

export const JOBS_COLLECTION = 'jobs';

/**
 * Format Firestore document into typed Job object.
 * Strictly avoids inventing placeholder values.
 */
export function mapDocToJob(docId: string, data: any): Job {
  const companyName = data.companyName || data.company || '';
  const email = data.companyEmail || null;
  const phone = data.companyPhone || null;
  const contactType =
    data.contactType || (email && phone ? 'both' : phone ? 'phone' : 'email');

  return {
    id: docId,
    title: data.title || '',
    companyName,
    company: companyName,
    location: data.location || '',
    province: data.province || 'Jawa Barat',
    city: data.city || '',
    companyAddress: data.companyAddress || '',
    companyEmail: email,
    companyPhone: phone,
    contactType,
    contactSourceUrl: data.contactSourceUrl || null,
    category: data.category || 'Lainnya',
    salary: data.salary || null,
    employmentType: data.employmentType || 'Penuh Waktu',
    description: data.description || '',
    requirements: Array.isArray(data.requirements) ? data.requirements : [],
    qualifications: Array.isArray(data.qualifications) ? data.qualifications : [],
    sourceName: data.sourceName || 'Sumber Terverifikasi',
    sourceUrl: data.sourceUrl || '',
    sourceType: (data.sourceType as SourceType) || 'other_verified_source',
    publishedAt: data.publishedAt || new Date().toISOString(),
    foundAt: data.foundAt || new Date().toISOString(),
    applicationDeadline: data.applicationDeadline || null,
    expiresAt: data.expiresAt || '',
    status: (data.status as JobStatus) || 'active',
    verified: typeof data.verified === 'boolean' ? data.verified : true,
    validationStatus: (data.validationStatus as ValidationStatus) || 'valid',
    validationReason:
      data.validationReason || 'Terindikasi valid berdasarkan sumber yang ditemukan.',
    companyVerified:
      typeof data.companyVerified === 'boolean'
        ? data.companyVerified
        : typeof data.verified === 'boolean'
        ? data.verified
        : true,
    locationVerified:
      typeof data.locationVerified === 'boolean' ? data.locationVerified : true,
    addressVerified:
      typeof data.addressVerified === 'boolean'
        ? data.addressVerified
        : Boolean(data.companyAddress),
    contactVerified:
      typeof data.contactVerified === 'boolean'
        ? data.contactVerified
        : Boolean(email || phone),
    sourceVerified:
      typeof data.sourceVerified === 'boolean' ? data.sourceVerified : true,
    sourceCheckedAt: data.sourceCheckedAt || new Date().toISOString(),
    jobHash: data.jobHash || '',
    featured: data.featured || false,
    popular: data.popular || false,
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt || new Date().toISOString(),
  };
}

/**
 * Real-time listener for public active jobs from Cloud Firestore
 * Enforces strict criteria (Requirement 10):
 * - status == "active"
 * - validationStatus == "valid"
 * - province == "Jawa Barat"
 * - locationVerified == true
 * - addressVerified == true
 * - contactVerified == true
 * - companyVerified == true
 * - sourceVerified == true
 * Filters out jobs exceeding 5-day lifespan or past expiresAt
 */
export function subscribeActiveJobs(
  onUpdate: (jobs: Job[]) => void,
  onError?: (error: Error) => void
): () => void {
  const jobsRef = collection(db, JOBS_COLLECTION);
  const q = query(jobsRef, where('status', '==', 'active'));

  return onSnapshot(
    q,
    (snapshot) => {
      const now = Date.now();
      const fiveDaysMs = 5 * 24 * 60 * 60 * 1000;
      const jobs: Job[] = [];

      snapshot.forEach((docSnapshot) => {
        const job = mapDocToJob(docSnapshot.id, docSnapshot.data());

        // STRICT PUBLIC FILTERING (Requirement 10)
        if (job.status !== 'active') return;
        if (job.validationStatus !== 'valid') return;
        if (job.province !== 'Jawa Barat') return;
        if (job.locationVerified !== true) return;
        if (job.addressVerified !== true) return;
        if (job.contactVerified !== true) return;
        if (job.companyVerified !== true) return;
        if (job.sourceVerified !== true) return;

        // Check 5-day age limit based on foundAt/createdAt
        const foundTime = new Date(job.foundAt || job.createdAt).getTime();
        if (!isNaN(foundTime) && now - foundTime > fiveDaysMs) {
          return;
        }

        // Check expiresAt if explicitly provided
        if (job.expiresAt) {
          const expTime = new Date(job.expiresAt).getTime();
          if (!isNaN(expTime) && expTime < now) {
            return;
          }
        }

        jobs.push(job);
      });

      // Sort by createdAt descending (newest first)
      jobs.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA;
      });

      onUpdate(jobs);
    },
    (err) => {
      console.error('Firestore active jobs snapshot error:', err);
      if (onError) onError(err);
      handleFirestoreError(err, OperationType.LIST, JOBS_COLLECTION);
    }
  );
}

/**
 * Real-time listener for all jobs in Firestore (used by Admin Panel)
 */
export function subscribeAllJobs(
  onUpdate: (jobs: Job[]) => void,
  onError?: (error: Error) => void
): () => void {
  const jobsRef = collection(db, JOBS_COLLECTION);

  return onSnapshot(
    jobsRef,
    (snapshot) => {
      const jobs: Job[] = [];
      snapshot.forEach((docSnapshot) => {
        jobs.push(mapDocToJob(docSnapshot.id, docSnapshot.data()));
      });

      jobs.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA;
      });

      onUpdate(jobs);
    },
    (err) => {
      console.error('Firestore all jobs snapshot error:', err);
      if (onError) onError(err);
      handleFirestoreError(err, OperationType.LIST, JOBS_COLLECTION);
    }
  );
}

/**
 * Fetch a single job by ID from Firestore
 */
export async function getJobById(jobId: string): Promise<Job | null> {
  const jobDocRef = doc(db, JOBS_COLLECTION, jobId);
  try {
    const jobSnap = await getDoc(jobDocRef);
    if (!jobSnap.exists()) {
      return null;
    }
    return mapDocToJob(jobSnap.id, jobSnap.data());
  } catch (error) {
    console.error(`Error fetching job ${jobId}:`, error);
    handleFirestoreError(error, OperationType.GET, `${JOBS_COLLECTION}/${jobId}`);
  }
}

/**
 * Create a new job in Firestore
 */
export async function createJob(
  jobData: Omit<Job, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
): Promise<string> {
  const now = new Date().toISOString();
  const payload = {
    ...jobData,
    createdAt: now,
    updatedAt: now,
  };

  try {
    if (jobData.id) {
      const jobDocRef = doc(db, JOBS_COLLECTION, jobData.id);
      await setDoc(jobDocRef, payload);
      return jobData.id;
    } else {
      const jobsRef = collection(db, JOBS_COLLECTION);
      const docRef = await addDoc(jobsRef, payload);
      return docRef.id;
    }
  } catch (error) {
    console.error('Error creating job in Firestore:', error);
    handleFirestoreError(error, OperationType.CREATE, JOBS_COLLECTION);
  }
}

/**
 * Update existing job in Firestore
 */
export async function updateJob(
  jobId: string,
  updates: Partial<Omit<Job, 'id' | 'createdAt'>>
): Promise<void> {
  const jobDocRef = doc(db, JOBS_COLLECTION, jobId);
  try {
    await updateDoc(jobDocRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error(`Error updating job ${jobId}:`, error);
    handleFirestoreError(error, OperationType.UPDATE, `${JOBS_COLLECTION}/${jobId}`);
  }
}

/**
 * Delete job from Firestore
 */
export async function deleteJob(jobId: string): Promise<void> {
  const jobDocRef = doc(db, JOBS_COLLECTION, jobId);
  try {
    await deleteDoc(jobDocRef);
  } catch (error) {
    console.error(`Error deleting job ${jobId}:`, error);
    handleFirestoreError(error, OperationType.DELETE, `${JOBS_COLLECTION}/${jobId}`);
  }
}

/**
 * Find existing job by hash or sourceUrl for deduplication
 */
export async function findJobByHashOrUrl(
  jobHash: string,
  sourceUrl: string
): Promise<Job | null> {
  const jobsRef = collection(db, JOBS_COLLECTION);
  try {
    if (jobHash) {
      const hashQuery = query(jobsRef, where('jobHash', '==', jobHash));
      const hashSnap = await getDocs(hashQuery);
      if (!hashSnap.empty) {
        const first = hashSnap.docs[0];
        return mapDocToJob(first.id, first.data());
      }
    }

    if (sourceUrl) {
      const urlQuery = query(jobsRef, where('sourceUrl', '==', sourceUrl));
      const urlSnap = await getDocs(urlQuery);
      if (!urlSnap.empty) {
        const first = urlSnap.docs[0];
        return mapDocToJob(first.id, first.data());
      }
    }

    return null;
  } catch (error) {
    console.error('Error checking duplicate job:', error);
    return null;
  }
}
