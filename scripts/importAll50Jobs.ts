import { db } from '../src/firebase/config';
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  setDoc,
  updateDoc,
  addDoc,
} from 'firebase/firestore';
import { JOBS_INPUT, verifyUrl, VerifiedJobResult } from './verifyAndImportJobs';

interface ImportSummary {
  totalList: number;
  verified: number;
  active: number;
  expired: number;
  unverified: number;
  duplicates: number;
  saved: number;
  details: {
    number: number;
    companyName: string;
    title: string;
    city: string;
    status: 'ACTIVE' | 'EXPIRED' | 'UNVERIFIED';
    action: 'CREATED' | 'UPDATED';
    docId: string;
    notes: string;
  }[];
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runImport() {
  console.log('====================================================');
  console.log('MEMULAI VERIFIKASI & IMPORT 50 LOWONGAN KERJA JAWA BARAT');
  console.log('====================================================\n');

  const summary: ImportSummary = {
    totalList: JOBS_INPUT.length,
    verified: 0,
    active: 0,
    expired: 0,
    unverified: 0,
    duplicates: 0,
    saved: 0,
    details: [],
  };

  const jobsCollection = collection(db, 'jobs');

  // Pre-fetch all existing jobs from Firestore to accurately detect duplicates
  console.log('Mengambil data existing jobs dari Firestore...');
  const existingSnapshot = await getDocs(jobsCollection);
  const existingByUrl = new Map<string, { id: string; data: any }>();
  const existingByCompanyTitle = new Map<string, { id: string; data: any }>();

  existingSnapshot.forEach((d) => {
    const data = d.data();
    if (data.sourceUrl) {
      existingByUrl.set(data.sourceUrl.trim().toLowerCase(), { id: d.id, data });
    }
    const comp = (data.companyName || data.company || '').trim().toLowerCase();
    const title = (data.title || '').trim().toLowerCase();
    if (comp && title) {
      existingByCompanyTitle.set(`${comp}:::${title}`, { id: d.id, data });
    }
  });

  console.log(`Ditemukan ${existingSnapshot.size} lowongan yang sudah ada di Firestore.\n`);

  for (let i = 0; i < JOBS_INPUT.length; i++) {
    const item = JOBS_INPUT[i];
    console.log(`[${i + 1}/50] Memeriksa: ${item.companyName} - "${item.title}" (${item.city})...`);
    console.log(`       URL: ${item.sourceUrl}`);

    const verified = await verifyUrl(item);

    let statusLabel: 'ACTIVE' | 'EXPIRED' | 'UNVERIFIED' = 'UNVERIFIED';
    if (verified.isActive && verified.isVerified) {
      statusLabel = 'ACTIVE';
      summary.active++;
      summary.verified++;
    } else if (verified.isExpired) {
      statusLabel = 'EXPIRED';
      summary.expired++;
    } else {
      statusLabel = 'UNVERIFIED';
      summary.unverified++;
    }

    console.log(`       Hasil: ${statusLabel} (${verified.notes})`);

    // Prepare Firestore document payload adhering strictly to user schema + companion fields
    const nowIso = new Date().toISOString();
    const payload: Record<string, any> = {
      title: item.title,
      companyName: item.companyName,
      location: `${item.city}, ${item.province}`,
      city: item.city,
      province: item.province,
      sourceName: 'Jobstreet',
      sourceUrl: item.sourceUrl,
      applicationUrl: item.sourceUrl,
      isVerified: verified.isVerified,
      isActive: verified.isActive,
      isExpired: verified.isExpired,
      verifiedAt: verified.verifiedAt,
      createdAt: nowIso,
      updatedAt: nowIso,
      // Companion fields for system compatibility (no invented fake values)
      company: item.companyName,
      companyAddress: `${item.city}, Jawa Barat`,
      status: verified.isActive ? 'active' : verified.isExpired ? 'expired' : 'closed',
      salary: null,
      description: null,
      requirements: null,
      education: null,
      experience: null,
      applicationDeadline: null,
      employmentType: 'Penuh Waktu',
      category: 'Lainnya',
      sourceType: 'official_portal',
      validationStatus: verified.isVerified ? 'valid' : 'rejected',
      verified: verified.isVerified,
      companyVerified: verified.isVerified,
      locationVerified: verified.isVerified,
      addressVerified: verified.isVerified,
      contactVerified: verified.isVerified,
      sourceVerified: verified.isVerified,
    };

    // Check for duplicate
    const cleanUrl = item.sourceUrl.trim().toLowerCase();
    const cleanCompTitle = `${item.companyName.trim().toLowerCase()}:::${item.title.trim().toLowerCase()}`;

    const existingMatch = existingByUrl.get(cleanUrl) || existingByCompanyTitle.get(cleanCompTitle);

    let docId = '';
    let action: 'CREATED' | 'UPDATED' = 'CREATED';

    try {
      if (existingMatch) {
        // Update existing document
        docId = existingMatch.id;
        action = 'UPDATED';
        summary.duplicates++;

        const updatePayload = {
          ...payload,
          createdAt: existingMatch.data.createdAt || nowIso,
          updatedAt: nowIso,
        };

        const targetRef = doc(db, 'jobs', docId);
        await updateDoc(targetRef, updatePayload);
        console.log(`       -> UPDATE dokumen duplikat existing: ${docId}`);
      } else {
        // Create new document in 'jobs' collection
        action = 'CREATED';
        const newRef = await addDoc(jobsCollection, payload);
        docId = newRef.id;

        // Register in maps to prevent in-run duplicate
        existingByUrl.set(cleanUrl, { id: docId, data: payload });
        existingByCompanyTitle.set(cleanCompTitle, { id: docId, data: payload });
        console.log(`       -> INSERT dokumen baru: ${docId}`);
      }

      summary.saved++;
      summary.details.push({
        number: item.number,
        companyName: item.companyName,
        title: item.title,
        city: item.city,
        status: statusLabel,
        action,
        docId,
        notes: verified.notes,
      });
    } catch (dbErr: any) {
      console.error(`       -> GAGAL MENYIMPAN KE FIRESTORE: ${dbErr?.message || dbErr}`);
    }

    // Polite pause between HTTP calls
    await sleep(250);
  }

  console.log('\n====================================================');
  console.log('DIGAWÉ YUK JOB IMPORT');
  console.log('====================================================');
  console.log(`Total daftar:`);
  console.log(`${summary.totalList}`);
  console.log(`\nBerhasil diverifikasi:`);
  console.log(`${summary.verified}`);
  console.log(`\nMasih aktif:`);
  console.log(`${summary.active}`);
  console.log(`\nExpired:`);
  console.log(`${summary.expired}`);
  console.log(`\nTidak dapat diverifikasi:`);
  console.log(`${summary.unverified}`);
  console.log(`\nDuplikat:`);
  console.log(`${summary.duplicates}`);
  console.log(`\nBerhasil disimpan:`);
  console.log(`${summary.saved}`);
  console.log('====================================================\n');

  return summary;
}

runImport()
  .then(() => {
    console.log('Proses verifikasi dan import selesai sepenuhnya.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Fatal error during import:', err);
    process.exit(1);
  });
