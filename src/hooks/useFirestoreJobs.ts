import { useState, useEffect } from 'react';
import { Job } from '../types';
import { subscribeActiveJobs } from '../services/jobService';

export function useFirestoreJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const unsubscribe = subscribeActiveJobs(
      (activeJobs) => {
        setJobs(activeJobs);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching jobs from Firestore:', err);
        setError('Terjadi kesalahan saat mengambil data lowongan.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return {
    jobs,
    loading,
    error,
  };
}
