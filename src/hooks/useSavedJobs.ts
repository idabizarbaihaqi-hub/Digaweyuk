import { useState, useEffect } from 'react';
import { subscribeUserSavedJobIds, saveJob, unsaveJob } from '../services/savedJobService';
import { Job, User } from '../types';

export function useSavedJobs(userId: string | undefined, allJobs: Job[] = []) {
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!userId) {
      setSavedJobIds(new Set());
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeUserSavedJobIds(
      userId,
      (ids) => {
        setSavedJobIds(ids);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching saved jobs from Firestore:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  const toggleSaveJob = async (job: Job) => {
    if (!userId) {
      throw new Error('User belum login');
    }

    const isAlreadySaved = savedJobIds.has(job.id);
    if (isAlreadySaved) {
      await unsaveJob(userId, job.id);
    } else {
      await saveJob(userId, job.id);
    }
  };

  // Compute full Job objects for saved jobs from available jobs
  const savedJobs = allJobs.filter((job) => savedJobIds.has(job.id));

  return {
    savedJobIds,
    savedJobs,
    savedJobsList: savedJobs,
    loading,
    toggleSaveJob,
    isSaved: (jobId: string) => savedJobIds.has(jobId),
  };
}
