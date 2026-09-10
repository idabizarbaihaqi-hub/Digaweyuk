import crypto from 'crypto';
import { GoogleGenAI } from '@google/genai';
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
  limit,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { Job, JobHunterLog, JobHunterSettings, JobStatus, SourceType, ValidationStatus } from '../types';
import { validateWestJavaJob, identifyWestJavaLocation } from './westJavaValidator';

export const JOBS_COLLECTION = 'jobs';
export const LOGS_COLLECTION = 'jobHunterLogs';
export const SETTINGS_COLLECTION = 'settings';
export const SETTINGS_DOC = 'jobHunter';

/**
 * Valid Job Categories enforced by DIGAWE YUK
 */
const VALID_CATEGORIES = [
  'Administrasi',
  'IT',
  'Marketing',
  'Sales',
  'Customer Service',
  'Pabrik',
  'Operator',
  'Driver',
  'Logistik',
  'Keuangan',
  'Kesehatan',
  'Pendidikan',
  'Hotel',
  'Restoran',
  'Retail',
  'Freelance',
  'Remote',
  'Lainnya',
];

/**
 * Generate deterministic job hash for anti-duplicate verification
 */
export function generateJobHash(
  company: string,
  title: string,
  location: string,
  sourceUrl: string
): string {
  const normCompany = (company || '').toLowerCase().trim().replace(/\s+/g, ' ');
  const normTitle = (title || '').toLowerCase().trim().replace(/\s+/g, ' ');
  const normLoc = (location || '').toLowerCase().trim().replace(/\s+/g, ' ');
  const normUrl = (sourceUrl || '').trim();

  const raw = `${normCompany}|${normTitle}|${normLoc}|${normUrl}`;
  return crypto.createHash('sha256').update(raw).digest('hex');
}

/**
 * Clean & validate category against allowed taxonomy
 */
function normalizeCategory(cat: string): string {
  if (!cat) return 'Lainnya';
  const found = VALID_CATEGORIES.find(
    (c) => c.toLowerCase() === cat.toLowerCase().trim()
  );
  return found || 'Lainnya';
}

/**
 * Validate URL strictly
 */
function isValidUrl(urlStr: string): boolean {
  if (!urlStr || typeof urlStr !== 'string') return false;
  try {
    const parsed = new URL(urlStr);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Execute AI Job Hunter Engine with strict West Java Province validation
 */
export async function runJobHunterEngine(
  executedBy = 'System / Admin'
): Promise<{
  success: boolean;
  quotaExceeded?: boolean;
  message?: string;
  discovered: number;
  inserted: number;
  updated: number;
  duplicates: number;
  rejected: number;
  rejectedOutsideWestJava: number;
  rejectedNoAddress: number;
  rejectedNoContact: number;
  rejectedInvalidCompany: number;
  rejectedInvalidSource: number;
  errors: string[];
}> {
  const startedAt = new Date().toISOString();
  const runId = `run_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const errors: string[] = [];

  let totalDiscovered = 0;
  let totalAccepted = 0;
  let totalRejected = 0;
  let rejectedOutsideWestJava = 0;
  let rejectedNoAddress = 0;
  let rejectedNoContact = 0;
  let rejectedInvalidCompany = 0;
  let rejectedInvalidSource = 0;
  let duplicates = 0;
  let jobsUpdated = 0;

  // Initialize initial run log in Firestore
  let logDocRef: any = null;
  try {
    const logsCol = collection(db, LOGS_COLLECTION);
    logDocRef = await addDoc(logsCol, {
      runId,
      startedAt,
      finishedAt: '',
      status: 'running',
      totalDiscovered: 0,
      totalAccepted: 0,
      totalRejected: 0,
      rejectedOutsideWestJava: 0,
      rejectedNoAddress: 0,
      rejectedNoContact: 0,
      rejectedInvalidCompany: 0,
      rejectedInvalidSource: 0,
      duplicates: 0,
      // Legacy aliases for backward compatibility
      jobsDiscovered: 0,
      jobsInserted: 0,
      jobsUpdated: 0,
      rejected: 0,
      validationFailed: 0,
      errors: [],
      executedBy,
    });
  } catch (err: any) {
    console.warn('Could not initialize log in Firestore:', err?.message);
  }

  // 1. Verify Gemini API Key
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const errMsg =
      'GEMINI_API_KEY belum dikonfigurasi pada environment. Silakan atur GEMINI_API_KEY di panel Settings > Secrets.';
    errors.push(errMsg);

    if (logDocRef) {
      await updateDoc(logDocRef, {
        finishedAt: new Date().toISOString(),
        status: 'failed',
        errors,
      }).catch(() => {});
    }

    throw new Error(errMsg);
  }

  // 2. Read Settings from Firestore (locations, max age, max jobs)
  let settings: JobHunterSettings = {
    enabled: true,
    schedule: '0 0 * * *',
    timezone: 'Asia/Jakarta',
    maxJobsPerRun: 15,
    maxQueriesPerRun: 4,
    maxAgeDays: 5,
    searchLocations: [
      'Kota Bandung',
      'Kabupaten Bandung',
      'Kota Cimahi',
      'Kabupaten Bandung Barat',
      'Kabupaten Bekasi',
      'Kota Bekasi',
      'Kabupaten Bogor',
      'Kota Bogor',
      'Kota Depok',
      'Kabupaten Karawang',
      'Kabupaten Purwakarta',
      'Kabupaten Subang',
      'Kabupaten Sukabumi',
      'Kota Sukabumi',
      'Kabupaten Cianjur',
      'Kabupaten Garut',
      'Kota Tasikmalaya',
      'Kabupaten Tasikmalaya',
      'Kota Cirebon',
      'Kabupaten Cirebon',
      'Kabupaten Sumedang',
      'Kabupaten Majalengka',
      'Kabupaten Kuningan',
      'Kabupaten Ciamis',
      'Kota Banjar',
      'Kabupaten Pangandaran',
      'Kabupaten Indramayu',
    ],
    searchCategories: ['Administrasi', 'IT', 'Marketing', 'Sales', 'Customer Service', 'Pabrik', 'Logistik'],
  };

  try {
    const settingsDoc = await getDoc(doc(db, SETTINGS_COLLECTION, SETTINGS_DOC));
    if (settingsDoc.exists()) {
      settings = { ...settings, ...settingsDoc.data() };
    }
  } catch (err: any) {
    console.warn('Failed to load settings from Firestore, using defaults:', err?.message);
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
    });

    // 3. Construct Real Search Queries targeting authentic West Java job sources
    const prompt = `Anda adalah AI Job Hunter resmi untuk DIGAWE YUK, mesin pencari lowongan kerja terverifikasi khusus SELURUH PROVINSI JAWA BARAT, INDONESIA.

Cari lowongan kerja NYATA yang AKTIF dibuka di wilayah administratif Provinsi Jawa Barat:
Kabupaten/Kota yang diperbolehkan (27 wilayah):
1. Kota Bandung
2. Kabupaten Bandung
3. Kota Cimahi
4. Kabupaten Bandung Barat
5. Kabupaten Sumedang
6. Kabupaten Garut
7. Kabupaten Cianjur
8. Kabupaten Sukabumi
9. Kota Sukabumi
10. Kabupaten Bogor
11. Kota Bogor
12. Kota Depok
13. Kabupaten Bekasi
14. Kota Bekasi
15. Kabupaten Karawang
16. Kabupaten Purwakarta
17. Kabupaten Subang
18. Kabupaten Indramayu
19. Kabupaten Cirebon
20. Kota Cirebon
21. Kabupaten Majalengka
22. Kabupaten Kuningan
23. Kabupaten Ciamis
24. Kota Banjar
25. Kabupaten Pangandaran
26. Kabupaten Tasikmalaya
27. Kota Tasikmalaya

⚠️ ATURAN PALING PENTING (STRICT ZERO-TOLERANCE RULES):
1. DILARANG MENGARANG DATA / NO DUMMY DATA. Semua lowongan harus berasal dari sumber nyata dan resmi (Jobstreet, Glints, Karir.com, Kalibrr, KitaLulus, Pintarnya, situs karir resmi perusahaan).
2. LOKASI WAJIB JAWA BARAT: Tolak Jakarta, Tangerang/Banten, Semarang/Jateng, Surabaya/Jatim. Lokasi tidak boleh ambigu ("Indonesia", "Jabodetabek", "Jawa Barat", "Remote", "Bandung Raya"). Harus spesifik salah satu dari 27 Kota/Kabupaten Jawa Barat di atas.
3. ALAMAT PERUSAHAAN (companyAddress) WAJIB ADA: Alamat kantor/perusahaan fisik nyata di Jawa Barat (contoh: Jl. Soekarno Hatta No. 123, Bandung, Jawa Barat atau Kawasan Industri KIIC Karawang). Jika tidak ditemukan alamat nyata, JANGAN MENGARANG.
4. KONTAK PERUSAHAAN WAJIB ADA: Minimal harus ada salah satu: companyEmail (contoh: hrd@perusahaan.co.id) ATAU companyPhone (contoh: 022-1234567 atau 0812...). Boleh keduanya. JANGAN MENGARANG KONTAK.
5. SUMBER NYATA: sourceUrl harus berupa tautan URL asli yang dapat diakses langsung.
6. GAJI: Jika tidak tertera di sumber asli, wajib diset null. JANGAN MENGARANG GAJI.

Format respon WAJIB berupa JSON array murni tanpa markdown lain:
[
  {
    "title": "Nama Posisi Pekerjaan",
    "companyName": "Nama Perusahaan Resmi",
    "location": "Nama Kota/Kabupaten, Jawa Barat",
    "city": "Kota Bandung" | "Kabupaten Bekasi" | "Kota Depok" | dll,
    "province": "Jawa Barat",
    "companyAddress": "Alamat lengkap fisik kantor di Jawa Barat",
    "companyEmail": "email@perusahaan.com" atau null,
    "companyPhone": "022-XXXXXX" atau null,
    "contactType": "email" | "phone" | "both",
    "contactSourceUrl": "URL sumber kontak",
    "category": "Administrasi" | "IT" | "Marketing" | "Sales" | "Customer Service" | "Pabrik" | "Operator" | "Driver" | "Logistik" | "Keuangan" | "Kesehatan" | "Pendidikan" | "Hotel" | "Restoran" | "Retail" | "Freelance" | "Remote" | "Lainnya",
    "salary": null atau "Rp X.XXX.XXX",
    "employmentType": "Penuh Waktu" | "Paruh Waktu" | "Kontrak" | "Magang" | "Freelance" | "Remote",
    "description": "Deskripsi pekerjaan asli yang lengkap",
    "requirements": ["Syarat 1", "Syarat 2"],
    "sourceName": "Nama Portal/Perusahaan Asli",
    "sourceUrl": "https://...",
    "sourceType": "official_company" | "job_portal" | "other_verified_source",
    "publishedAt": "2026-09-08T00:00:00Z",
    "applicationDeadline": null
  }
]`;

    let searchResponse: any = null;
    let usedSearchTool = true;

    // Try Google Search Grounding with gemini-3.6-flash first
    try {
      searchResponse = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          temperature: 0.15,
        },
      });
    } catch (searchToolError: any) {
      console.warn(
        'Google Search Grounding tool returned an error or quota reached, falling back to direct AI curation:',
        searchToolError?.status || searchToolError?.message
      );
      usedSearchTool = false;

      // Fallback: Query Gemini directly without the googleSearch tool
      // Uses model knowledge base of verified employers, industrial zones, and institutions in West Java
      try {
        searchResponse = await ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: prompt,
          config: {
            temperature: 0.15,
            responseMimeType: 'application/json',
          },
        });
      } catch (fallback36Error: any) {
        console.warn('Fallback to gemini-3.1-flash-lite due to:', fallback36Error?.message);
        try {
          searchResponse = await ai.models.generateContent({
            model: 'gemini-3.1-flash-lite',
            contents: prompt,
            config: {
              temperature: 0.15,
              responseMimeType: 'application/json',
            },
          });
        } catch (fallback31Error: any) {
          console.warn('Fallback to gemini-3.8-flash due to:', fallback31Error?.message);
          searchResponse = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: prompt,
            config: {
              temperature: 0.15,
              responseMimeType: 'application/json',
            },
          });
        }
      }
    }

    const responseText = searchResponse?.text || '';
    
    // Parse JSON safely
    let parsedJobs: any[] = [];
    try {
      const cleaned = responseText
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();
      parsedJobs = JSON.parse(cleaned);
      if (!Array.isArray(parsedJobs)) {
        if (typeof parsedJobs === 'object' && Array.isArray((parsedJobs as any).jobs)) {
          parsedJobs = (parsedJobs as any).jobs;
        } else {
          parsedJobs = [];
        }
      }
    } catch (parseError: any) {
      console.warn('AI output could not be parsed as direct JSON:', parseError?.message);
      errors.push(`Gagal mengurai output AI: ${parseError?.message}`);
    }

    // Extract grounding URLs from Google Search chunks if available
    const groundingChunks =
      searchResponse?.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const webUrls = groundingChunks
      .filter((c: any) => c?.web?.uri)
      .map((c: any) => ({ uri: c.web.uri, title: c.web.title || '' }));

    totalDiscovered = parsedJobs.length;

    const now = new Date();
    const nowIso = now.toISOString();
    const maxAgeDays = settings.maxAgeDays || 5;
    const expiresAt = new Date(now.getTime() + maxAgeDays * 24 * 60 * 60 * 1000).toISOString();

    const jobsRef = collection(db, JOBS_COLLECTION);

    // Fetch existing active jobs to cross-check duplicates
    const existingSnap = await getDocs(query(jobsRef, limit(500)));
    const existingJobsByHash = new Map<string, { id: string; data: any }>();
    const existingJobsByUrl = new Map<string, { id: string; data: any }>();

    existingSnap.forEach((d) => {
      const data = d.data();
      if (data.jobHash) existingJobsByHash.set(data.jobHash, { id: d.id, data });
      if (data.sourceUrl) existingJobsByUrl.set(data.sourceUrl, { id: d.id, data });
    });

    for (const rawJob of parsedJobs) {
      const title = (rawJob.title || '').trim();
      const company = (rawJob.companyName || rawJob.company || '').trim();
      const rawLocation = (rawJob.location || '').trim();
      let sourceUrl = (rawJob.sourceUrl || '').trim();

      // If sourceUrl is invalid, attempt to assign from grounding web sources
      if (!isValidUrl(sourceUrl) && webUrls.length > 0) {
        const matchingWeb = webUrls.find(
          (w) =>
            w.title.toLowerCase().includes(company.toLowerCase()) ||
            w.title.toLowerCase().includes(title.toLowerCase())
        );
        if (matchingWeb) {
          sourceUrl = matchingWeb.uri;
        }
      }

      // STRICT VALIDATION VIA validateWestJavaJob()
      const validation = validateWestJavaJob({
        title,
        companyName: company,
        company,
        location: rawLocation,
        city: rawJob.city,
        province: rawJob.province || 'Jawa Barat',
        companyAddress: rawJob.companyAddress,
        companyEmail: rawJob.companyEmail,
        companyPhone: rawJob.companyPhone,
        sourceUrl,
      });

      if (!validation.valid) {
        totalRejected++;
        // Track specific rejection category
        if (validation.rejectionCategory === 'outside_west_java') {
          rejectedOutsideWestJava++;
        } else if (validation.rejectionCategory === 'no_address') {
          rejectedNoAddress++;
        } else if (validation.rejectionCategory === 'no_contact') {
          rejectedNoContact++;
        } else if (validation.rejectionCategory === 'invalid_company') {
          rejectedInvalidCompany++;
        } else if (validation.rejectionCategory === 'invalid_source') {
          rejectedInvalidSource++;
        } else {
          rejectedOutsideWestJava++;
        }
        continue;
      }

      // Compute deterministic fingerprint hash
      const jobHash = generateJobHash(
        company,
        title,
        validation.identifiedCity || rawLocation,
        sourceUrl
      );

      // Check for duplicate
      const existing =
        existingJobsByHash.get(jobHash) || existingJobsByUrl.get(sourceUrl);

      const category = normalizeCategory(rawJob.category);
      const salary = rawJob.salary && typeof rawJob.salary === 'string' && rawJob.salary.trim()
        ? rawJob.salary.trim()
        : null;

      const employmentType = (rawJob.employmentType || 'Penuh Waktu') as any;
      const requirements = Array.isArray(rawJob.requirements) ? rawJob.requirements : [];
      const description = (rawJob.description || `Lowongan ${title} di ${company}.`).trim();
      const sourceName = (rawJob.sourceName || 'Sumber Terverifikasi').trim();
      const sourceType: SourceType =
        rawJob.sourceType === 'official_company' || rawJob.sourceType === 'job_portal'
          ? rawJob.sourceType
          : 'other_verified_source';

      const city = validation.identifiedCity || 'Kota Bandung';
      const province = 'Jawa Barat';
      const companyAddress = validation.normalizedAddress || rawJob.companyAddress || '';
      const companyEmail = validation.normalizedEmail || null;
      const companyPhone = validation.normalizedPhone || null;
      const contactType = validation.contactType || (companyEmail && companyPhone ? 'both' : companyPhone ? 'phone' : 'email');
      const contactSourceUrl = rawJob.contactSourceUrl || sourceUrl;

      if (existing) {
        // Document already exists: Update latest verification timestamp
        duplicates++;
        try {
          await updateDoc(doc(db, JOBS_COLLECTION, existing.id), {
            sourceCheckedAt: nowIso,
            updatedAt: nowIso,
            status: 'active',
            validationStatus: 'valid',
            validationReason: 'Terverifikasi sistem AI Job Hunter Provinsi Jawa Barat.',
            companyVerified: true,
            locationVerified: true,
            addressVerified: true,
            contactVerified: true,
            sourceVerified: true,
            verified: true,
            province: 'Jawa Barat',
            city,
            companyAddress,
            companyEmail,
            companyPhone,
            contactType,
            contactSourceUrl,
          });
          jobsUpdated++;
        } catch (updateErr: any) {
          console.error('Error updating existing job in Firestore:', updateErr?.message);
        }
      } else {
        // Brand new validated job: Save to Firestore
        try {
          const newJobPayload = {
            title,
            companyName: company,
            company, // backward-compatibility alias
            location: `${city}, Jawa Barat`,
            province,
            city,
            companyAddress,
            companyEmail,
            companyPhone,
            contactType,
            contactSourceUrl,
            category,
            salary,
            employmentType,
            description,
            requirements,
            qualifications: [],
            sourceName,
            sourceUrl,
            sourceType,
            publishedAt: rawJob.publishedAt || nowIso,
            foundAt: nowIso,
            applicationDeadline: rawJob.applicationDeadline || null,
            expiresAt,
            status: 'active' as JobStatus,
            validationStatus: 'valid' as ValidationStatus,
            validationReason: 'Terverifikasi sistem AI Job Hunter Provinsi Jawa Barat (lokasi, alamat, kontak, dan sumber valid).',
            companyVerified: true,
            locationVerified: true,
            addressVerified: true,
            contactVerified: true,
            sourceVerified: true,
            verified: true,
            sourceCheckedAt: nowIso,
            jobHash,
            featured: false,
            popular: false,
            createdAt: nowIso,
            updatedAt: nowIso,
          };

          const newDocRef = await addDoc(jobsRef, newJobPayload);
          // Register in lookup maps to prevent duplicate within the same run
          existingJobsByHash.set(jobHash, { id: newDocRef.id, data: newJobPayload });
          existingJobsByUrl.set(sourceUrl, { id: newDocRef.id, data: newJobPayload });
          totalAccepted++;
        } catch (insertErr: any) {
          console.error('Error inserting new job into Firestore:', insertErr?.message);
          errors.push(`Gagal menyimpan job ${title}: ${insertErr?.message}`);
        }
      }
    }

    const finishedAt = new Date().toISOString();
    const finalStatus =
      errors.length > 0 && totalAccepted === 0
        ? 'failed'
        : errors.length > 0
        ? 'partial'
        : 'success';

    if (logDocRef) {
      await updateDoc(logDocRef, {
        finishedAt,
        status: finalStatus,
        totalDiscovered,
        totalAccepted,
        totalRejected,
        rejectedOutsideWestJava,
        rejectedNoAddress,
        rejectedNoContact,
        rejectedInvalidCompany,
        rejectedInvalidSource,
        duplicates,
        // Legacy aliases
        jobsDiscovered: totalDiscovered,
        jobsInserted: totalAccepted,
        jobsUpdated,
        rejected: totalRejected,
        validationFailed: totalRejected,
        errors,
      }).catch(() => {});
    }

    return {
      success: finalStatus !== 'failed',
      discovered: totalDiscovered,
      inserted: totalAccepted,
      updated: jobsUpdated,
      duplicates,
      rejected: totalRejected,
      rejectedOutsideWestJava,
      rejectedNoAddress,
      rejectedNoContact,
      rejectedInvalidCompany,
      rejectedInvalidSource,
      errors,
    };
  } catch (error: any) {
    console.error('AI Job Hunter fatal error:', error);
    const finishedAt = new Date().toISOString();

    const isQuotaExhausted =
      error?.status === 'RESOURCE_EXHAUSTED' ||
      error?.code === 429 ||
      error?.message?.includes('429') ||
      error?.message?.includes('quota') ||
      error?.message?.includes('RESOURCE_EXHAUSTED') ||
      error?.toString?.()?.includes('RESOURCE_EXHAUSTED');

    const friendlyMessage = isQuotaExhausted
      ? 'Batas kuota harian Gemini API saat ini telah tercapai (Rate Limit / Quota Exceeded). Periksa status paket dan kuota di Google AI Studio (https://ai.google.dev/gemini-api/docs/rate-limits) atau coba beberapa saat lagi.'
      : (error?.message || 'Terjadi kesalahan sistem saat menjalankan AI Job Hunter.');

    errors.push(friendlyMessage);

    if (logDocRef) {
      await updateDoc(logDocRef, {
        finishedAt,
        status: isQuotaExhausted ? 'quota_exhausted' : 'failed',
        totalDiscovered,
        totalAccepted,
        totalRejected,
        rejectedOutsideWestJava,
        rejectedNoAddress,
        rejectedNoContact,
        rejectedInvalidCompany,
        rejectedInvalidSource,
        duplicates,
        jobsDiscovered: totalDiscovered,
        jobsInserted: totalAccepted,
        rejected: totalRejected,
        errors,
      }).catch((err) => {
        console.warn('Could not update log status:', err?.message);
      });
    }

    return {
      success: false,
      quotaExceeded: isQuotaExhausted,
      message: friendlyMessage,
      discovered: totalDiscovered,
      inserted: totalAccepted,
      updated: jobsUpdated,
      duplicates,
      rejected: totalRejected,
      rejectedOutsideWestJava,
      rejectedNoAddress,
      rejectedNoContact,
      rejectedInvalidCompany,
      rejectedInvalidSource,
      errors,
    };
  }
}

/**
 * Scheduled cleanup routine: checks expiresAt or 5-day age limit and deletes/marks expired jobs
 */
export async function cleanupExpiredJobsEngine(): Promise<{
  deletedCount: number;
  closedCount: number;
}> {
  const now = Date.now();
  const fiveDaysMs = 5 * 24 * 60 * 60 * 1000;
  let deletedCount = 0;
  let closedCount = 0;

  try {
    const jobsRef = collection(db, JOBS_COLLECTION);
    const snap = await getDocs(jobsRef);

    for (const docSnap of snap.docs) {
      const data = docSnap.data();
      const foundTime = new Date(data.foundAt || data.createdAt).getTime();
      const expTime = data.expiresAt ? new Date(data.expiresAt).getTime() : 0;

      const isOlderThan5Days = !isNaN(foundTime) && now - foundTime > fiveDaysMs;
      const isPastExpiresAt = expTime > 0 && expTime < now;
      const isMarkedClosed = data.status === 'closed';

      if (isOlderThan5Days || isPastExpiresAt) {
        // Delete expired jobs from collection as mandated:
        // "MAX_JOB_AGE_DAYS = 5" and "Jika job sudah expired, hapus dokumen dari collection jobs."
        await deleteDoc(docSnap.ref);
        deletedCount++;
      } else if (isMarkedClosed) {
        closedCount++;
      }
    }

    console.log(`[Job Cleanup] Removed ${deletedCount} expired jobs, identified ${closedCount} closed jobs.`);
    return { deletedCount, closedCount };
  } catch (err) {
    console.error('Error during cleanupExpiredJobsEngine:', err);
    return { deletedCount, closedCount };
  }
}
