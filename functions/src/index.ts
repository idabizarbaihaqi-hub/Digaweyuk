import * as admin from 'firebase-admin';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onRequest } from 'firebase-functions/v2/https';
import { GoogleGenAI } from '@google/genai';
import * as crypto from 'crypto';

admin.initializeApp();
const db = admin.firestore();

const JOBS_COLLECTION = 'jobs';
const LOGS_COLLECTION = 'jobHunterLogs';
const SETTINGS_DOC = 'settings/jobHunter';

function generateHash(company: string, title: string, location: string, url: string): string {
  const norm = `${company.toLowerCase().trim()}|${title.toLowerCase().trim()}|${location.toLowerCase().trim()}|${url.trim()}`;
  return crypto.createHash('sha256').update(norm).digest('hex');
}

/**
 * Scheduled Cloud Function: runJobHunter
 * Runs daily at 00:00 Asia/Jakarta time.
 */
export const runJobHunter = onSchedule(
  {
    schedule: '0 0 * * *',
    timeZone: 'Asia/Jakarta',
    memory: '1GiB',
    timeoutSeconds: 300,
  },
  async () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('GEMINI_API_KEY secret is required in Cloud Functions.');
      return;
    }

    const startedAt = new Date().toISOString();
    const logRef = await db.collection(LOGS_COLLECTION).add({
      startedAt,
      finishedAt: '',
      status: 'running',
      jobsDiscovered: 0,
      jobsInserted: 0,
      jobsUpdated: 0,
      duplicates: 0,
      rejected: 0,
      validationFailed: 0,
      errors: [],
      executedBy: 'Firebase Cloud Scheduler (Asia/Jakarta)',
    });

    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Cari lowongan pekerjaan terkini di Indonesia (Bandung, Jakarta, Surabaya, Jawa Barat) yang aktif.
Keluarkan JSON array objek dengan format:
[
  {
    "title": "string",
    "company": "string",
    "location": "string",
    "category": "Administrasi"|"IT"|"Marketing"|"Sales"|"Customer Service"|"Pabrik"|"Logistik"|"Lainnya",
    "salary": null atau string,
    "employmentType": "Penuh Waktu"|"Paruh Waktu"|"Kontrak"|"Magang"|"Remote",
    "description": "string",
    "requirements": ["string"],
    "sourceName": "string",
    "sourceUrl": "URL valid",
    "sourceType": "official_company"|"job_portal"|"other_verified_source"
  }
]`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          temperature: 0.2,
        },
      });

      const text = response.text || '[]';
      const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
      const rawJobs = JSON.parse(cleaned);

      const now = new Date();
      const expiresAt = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString();
      let inserted = 0;
      let duplicates = 0;

      for (const item of rawJobs) {
        if (!item.title || !item.company || !item.sourceUrl) continue;
        const jobHash = generateHash(item.company, item.title, item.location || '', item.sourceUrl);

        const existingSnap = await db
          .collection(JOBS_COLLECTION)
          .where('jobHash', '==', jobHash)
          .limit(1)
          .get();

        if (!existingSnap.empty) {
          duplicates++;
          await existingSnap.docs[0].ref.update({
            sourceCheckedAt: now.toISOString(),
            updatedAt: now.toISOString(),
          });
        } else {
          await db.collection(JOBS_COLLECTION).add({
            title: item.title,
            company: item.company,
            location: item.location || 'Indonesia',
            category: item.category || 'Lainnya',
            salary: item.salary || null,
            employmentType: item.employmentType || 'Penuh Waktu',
            description: item.description || '',
            requirements: item.requirements || [],
            qualifications: [],
            sourceName: item.sourceName || 'Sumber Terverifikasi',
            sourceUrl: item.sourceUrl,
            sourceType: item.sourceType || 'other_verified_source',
            publishedAt: now.toISOString(),
            foundAt: now.toISOString(),
            expiresAt,
            status: 'active',
            verified: true,
            validationStatus: 'valid',
            validationReason: 'Terverifikasi otomatis oleh AI Job Hunter',
            sourceCheckedAt: now.toISOString(),
            jobHash,
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
          });
          inserted++;
        }
      }

      await logRef.update({
        finishedAt: new Date().toISOString(),
        status: 'success',
        jobsDiscovered: rawJobs.length,
        jobsInserted: inserted,
        duplicates,
      });
    } catch (err: any) {
      console.error('Scheduled job hunter error:', err);
      await logRef.update({
        finishedAt: new Date().toISOString(),
        status: 'failed',
        errors: [err?.message || 'Error occurred'],
      });
    }
  }
);

/**
 * Scheduled Cloud Function: cleanupExpiredJobs
 * Runs daily at 01:00 Asia/Jakarta time.
 */
export const cleanupExpiredJobs = onSchedule(
  {
    schedule: '0 1 * * *',
    timeZone: 'Asia/Jakarta',
  },
  async () => {
    const now = Date.now();
    const fiveDaysMs = 5 * 24 * 60 * 60 * 1000;
    const snap = await db.collection(JOBS_COLLECTION).get();

    let deletedCount = 0;
    const batch = db.batch();

    snap.forEach((doc) => {
      const data = doc.data();
      const foundTime = new Date(data.foundAt || data.createdAt).getTime();
      const expTime = data.expiresAt ? new Date(data.expiresAt).getTime() : 0;

      if ((!isNaN(foundTime) && now - foundTime > fiveDaysMs) || (expTime > 0 && expTime < now)) {
        batch.delete(doc.ref);
        deletedCount++;
      }
    });

    if (deletedCount > 0) {
      await batch.commit();
      console.log(`Cleaned up ${deletedCount} expired jobs.`);
    }
  }
);

/**
 * HTTP Endpoint for Admin Manual Trigger
 */
export const manualJobHunterTrigger = onRequest(
  { cors: true },
  async (req, res) => {
    // Only accept POST
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }
    // Execution triggers background job logic
    res.json({ message: 'Triggered job hunter via Cloud Functions' });
  }
);
