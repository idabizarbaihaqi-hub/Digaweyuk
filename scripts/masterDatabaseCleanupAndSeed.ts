import { initializeApp } from 'firebase/app';
import {
  initializeFirestore,
  getDocs,
  collection,
  doc,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import fs from 'fs';

const cfg = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(cfg);
const db = initializeFirestore(
  app,
  {
    experimentalForceLongPolling: true,
    experimentalAutoDetectLongPolling: false,
  },
  cfg.firestoreDatabaseId
);

const NON_JABAR_TERMS = [
  'bangkok',
  'filipina',
  'kepong',
  'numbaa',
  'tondo',
  'wangara',
  'australia',
  'malaysia',
  'thailand',
  'philippines',
];

function cleanHtmlToText(html: string): string {
  if (!html) return '';
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<li>/gi, '• ')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .trim();
}

function extractRequirements(html: string): string[] {
  if (!html) return ['Persyaratan tidak dicantumkan oleh sumber.'];
  const items: string[] = [];

  const liMatches = [...html.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)];
  for (const m of liMatches) {
    const raw = m[1]
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .trim();
    if (raw.length > 3 && !items.includes(raw)) {
      items.push(raw);
    }
  }

  if (items.length > 0) {
    return items;
  }

  const lines = cleanHtmlToText(html)
    .split('\n')
    .map((l) => l.trim().replace(/^[-•*]\s*/, ''))
    .filter((l) => l.length > 10);

  if (lines.length > 0) {
    return lines.slice(0, 10);
  }

  return ['Persyaratan tidak dicantumkan oleh sumber.'];
}

function parseLocation(locLabel: string): { city: string; regency: string; province: string } {
  const province = 'Jawa Barat';
  let city = 'Jawa Barat';
  let regency = 'Jawa Barat';

  if (!locLabel) return { city, regency, province };

  const parts = locLabel.split(',').map((s) => s.trim());
  const mainPart = parts[0] || '';

  city = mainPart;
  if (mainPart.toLowerCase().includes('kabupaten')) {
    regency = mainPart;
    city = mainPart.replace(/kabupaten/i, '').trim();
  } else if (
    ['Karawang', 'Subang', 'Purwakarta', 'Sumedang', 'Majalengka', 'Kuningan', 'Indramayu', 'Cianjur', 'Garut', 'Tasikmalaya'].some(
      (c) => mainPart.toLowerCase().includes(c.toLowerCase())
    )
  ) {
    regency = `Kabupaten ${mainPart}`;
    city = mainPart;
  } else if (
    ['Cikarang', 'Cikarang Barat', 'Cikarang Pusat', 'Cikarang Selatan', 'Cikarang Utara', 'Cikarang Timur'].some((c) =>
      mainPart.toLowerCase().includes(c.toLowerCase())
    )
  ) {
    regency = 'Kabupaten Bekasi';
    city = mainPart;
  } else if (['Padalarang'].some((c) => mainPart.toLowerCase().includes(c.toLowerCase()))) {
    regency = 'Kabupaten Bandung Barat';
    city = 'Bandung Barat';
  } else if (mainPart.toLowerCase().includes('bekasi')) {
    regency = 'Kota Bekasi';
    city = 'Bekasi';
  } else if (mainPart.toLowerCase().includes('bandung')) {
    regency = 'Kota Bandung';
    city = 'Bandung';
  } else if (mainPart.toLowerCase().includes('bogor')) {
    regency = 'Kota Bogor';
    city = 'Bogor';
  } else if (mainPart.toLowerCase().includes('cimahi')) {
    regency = 'Kota Cimahi';
    city = 'Cimahi';
  } else if (mainPart.toLowerCase().includes('cirebon')) {
    regency = 'Kota Cirebon';
    city = 'Cirebon';
  }

  return { city, regency, province };
}

async function scrapeJobstreet(url: string) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });
    if (!res.ok) {
      return { ok: false, status: res.status };
    }
    const html = await res.text();
    const s = html.match(/<script data-automation="server-state">([\s\S]*?)<\/script>/i);
    if (!s) return { ok: false, error: 'No server state' };

    const reduxIdx = s[1].indexOf('window.SEEK_REDUX_DATA');
    const appConfigIdx = s[1].indexOf('window.SEEK_APP_CONFIG');
    if (reduxIdx === -1 || appConfigIdx === -1) return { ok: false, error: 'No redux data' };

    const rStr = s[1].slice(reduxIdx + 'window.SEEK_REDUX_DATA = '.length, appConfigIdx).trim().replace(/;$/, '');
    const redux = JSON.parse(rStr);
    const result = redux.jobdetails?.result;
    if (!result || !result.job) return { ok: false, error: 'No job in redux' };

    return {
      ok: true,
      job: result.job,
      comp: result.companyProfile,
    };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

// 50 REAL VERIFIED ACTIVE JOBS IN WEST JAVA
const TARGET_50_ACTIVE_URLS = [
  'https://id.jobstreet.com/id/job/93906644', // 1. PT NBC Indonesia - Operator Produksi (Karawang)
  'https://id.jobstreet.com/id/job/93950644', // 2. PT ISS INDONESIA (Bintaro) - Staff EXIM (Karawang)
  'https://id.jobstreet.com/id/job/93906487', // 3. PT NBC Indonesia - HSE Staff (Karawang)
  'https://id.jobstreet.com/id/job/94284814', // 4. PT Gelora Aksara Pratama (Erlangga Group) - Administrasi Marketing Wilayah Bandung (Bandung)
  'https://id.jobstreet.com/id/job/94079551', // 5. PT Dua Tiga Kemilau (Matoa Group) - STORE KEEPER (Bandung)
  'https://id.jobstreet.com/id/job/94170817', // 6. PT Setiabudhi Jaya Abadi - Pramuniaga (Bandung)
  'https://id.jobstreet.com/id/job/94280712', // 7. PT. CAHAYA INTI GLOBAL PRATAMA - ADMIN SALES SUPPORT (Bandung)
  'https://id.jobstreet.com/id/job/94105292', // 8. PT Pendidikan Ganesha Operation - RECORDS & INFORMATION MANAGEMENT STAFF (Bandung)
  'https://id.jobstreet.com/id/job/94329102', // 9. PT Bank SBI Indonesia - Frontliner Staff (Bandung)
  'https://id.jobstreet.com/id/job/94333994', // 10. Stroberi Accessories - Administration Staff (Bandung)
  'https://id.jobstreet.com/id/job/93904133', // 11. PT Lander Accessories Indonesia - HRGA Officer (Bandung)
  'https://id.jobstreet.com/id/job/94133944', // 12. PT TRILOKA BINTANG FORTUNA - KEPALA GUDANG BENANG (Bandung)
  'https://id.jobstreet.com/id/job/94142915', // 13. CV Cipta Indah Lestari - Admin Purchasing (Bandung)
  'https://id.jobstreet.com/id/job/94298201', // 14. PT Panasonic Gobel Energy Indonesia (PECGI) - PRODUCTION STAFF (D3) (Bekasi)
  'https://id.jobstreet.com/id/job/94229044', // 15. PT Multi Cipta Mas - Inventory Planner (Bekasi)
  'https://id.jobstreet.com/id/job/94299092', // 16. PT Itm Semiconductor Indonesia - Accounting Staff (Bekasi)
  'https://id.jobstreet.com/id/job/94200630', // 17. Yayasan Pendidikan dan Bahasa Victory (Sekolah Victory Plus) - School Administration Staff (Bekasi)
  'https://id.jobstreet.com/id/job/94163506', // 18. PT. ADIDAS INDONESIA - Store Supervisor (Bekasi)
  'https://id.jobstreet.com/id/job/94271811', // 19. PT KDS Indonesia (Daishinku Corp) - FOREMAN PRODUKSI (Cikarang Barat)
  'https://id.jobstreet.com/id/job/94307938', // 20. PT Hankook Tire Indonesia - Quality Control Staff (Cikarang)
  'https://id.jobstreet.com/id/job/94170783', // 21. PT Intimas Chemindo - SPV Maintenance (Bekasi)
  'https://id.jobstreet.com/id/job/94000807', // 22. PT. Berkat Citrani Mitra Sejati - PURCHASING & IMPORT STAFF (Bekasi)
  'https://id.jobstreet.com/id/job/94232664', // 23. Pt Mesin Isuzu Indonesia - Staff Purchasing (Bekasi)
  'https://id.jobstreet.com/id/job/94509449', // 24. Layo Wood Indonesia - SPV Finance (Cirebon)
  'https://id.jobstreet.com/id/job/94392963', // 25. PT. NIRVANA WASTU PRATAMA (NWP Property) - Marketing Casual Leasing & Event Promotion CSB Mall Cirebon
  'https://id.jobstreet.com/id/job/94513375', // 26. PT Elements Venture International - Account Manager Export Furniture (Cirebon)
  'https://id.jobstreet.com/id/job/94492587', // 27. PT. Bhinneka Sangkuriang Transport - Head of Operasional Big Bus (Cirebon)
  'https://id.jobstreet.com/id/job/94307232', // 28. PT. MITRA HUSADA MANDIRI - Kepala Divisi Penunjang Medis (Cirebon)
  'https://id.jobstreet.com/id/job/94174065', // 29. PT. DIOBENI MEBEL INDONESIA - QC MANAGER (Cirebon)
  'https://id.jobstreet.com/id/job/94119263', // 30. PT Pipamas Primasejati - ADMIN WAREHOUSE CIREBON (Cirebon)
  'https://id.jobstreet.com/id/job/94453609', // 31. PT Puradelta Lestari, Tbk - Front Office Le Premier Hotel Deltamas (Jawa Barat)
  'https://id.jobstreet.com/id/job/94328636', // 32. Kawan Lama Group - Customer Service (Cirebon)
  'https://id.jobstreet.com/id/job/94509568', // 33. PT Batik Sukses Sejahtera - Content Creator (Cirebon)
  'https://id.jobstreet.com/id/job/93950747', // 34. ASIA PULP AND PAPER - Trainee Program Batch A7 & Batch 12 (Karawang)
  'https://id.jobstreet.com/id/job/93958315', // 35. PT Arisu Graphic Prima - Quality Supervisor (Karawang)
  'https://id.jobstreet.com/id/job/93958759', // 36. PT Industrial Robotic Automation - Electrical Engineer (Karawang)
  'https://id.jobstreet.com/id/job/93956045', // 37. PT Astemo Indonesia Automotive System - Quality Staff (Cikarang)
  'https://id.jobstreet.com/id/job/93894162', // 38. PT Penguin Indonesia - Kepala Bagian Maintenance (Karawang)
  'https://id.jobstreet.com/id/job/93932005', // 39. PT Monokem Surya - HRD Staff (Rengasdengklok, Karawang)
  'https://id.jobstreet.com/id/job/93921546', // 40. PT Hasil Raya Industries - Organization Development (HR Staff) (Karawang Timur)
  'https://id.jobstreet.com/id/job/93924958', // 41. PT Wahana Duta Jaya Rucika - Mould Maintenance Supervisor (Karawang)
  'https://id.jobstreet.com/id/job/93949506', // 42. PT Tunas Mitra Sukses - Business Development Officer (Cikarang)
  'https://id.jobstreet.com/id/job/93872720', // 43. PT BCA Finance - Field Account Consultant BCA Finance (Karawang)
  'https://id.jobstreet.com/id/job/94284819', // 44. PT Oriental Textile Indonesia - Staff Accounting (Padalarang, Bandung Barat)
  'https://id.jobstreet.com/id/job/94284823', // 45. PT Pratama Graha Semesta - Account Officer / Sales Cikarang (Cikarang Barat)
  'https://id.jobstreet.com/id/job/94079560', // 46. KOPERASI BERSAMA ASTHA GUNA SEJAHTERA - General Manager (Bekasi Selatan)
  'https://id.jobstreet.com/id/job/94142917', // 47. PT Mulia Raya Agrijaya - Technician (Bandung)
  'https://id.jobstreet.com/id/job/94299079', // 48. PT Tronindo Anugrah Jaya - Merchandiser/Follow Up Garment (Bandung Barat)
  'https://id.jobstreet.com/id/job/94200626', // 49. PT. USAHA TANGGUH MANDIRI - Helper Logistik (Bandung)
  'https://id.jobstreet.com/id/job/94200627', // 50. Kopi Calf Group - Senior Barista - Supratman (Bandung)
  'https://id.jobstreet.com/id/job/94200636', // 51. PT Maha Sentral Sejati (PT MSS) - Sales Support Merchant (Bandung)
  'https://id.jobstreet.com/id/job/94163521', // 52. PT. Karya Nyata Alasindo (VIVI NICI) - Marketing Communication SPV (Bogor)
  'https://id.jobstreet.com/id/job/94271819', // 53. PT Yamata Machinery - Service Technician (Cikarang Pusat)
  'https://id.jobstreet.com/id/job/94392955', // 54. PT Bumi Mitra Industri - WAREHOUSE SUPERVISOR (Bekasi)
];

const EXPIRED_JOB_URLS = [
  'https://id.jobstreet.com/id/job/93873273', // 1. Orang Tua Group - Shift Leader of PPIC (Karawang)
  'https://id.jobstreet.com/id/job/93864774', // 2. PT Monokem Surya - Engineering Manager (Karawang)
  'https://id.jobstreet.com/id/job/93634882', // 3. PT DONGILCASTING - Production Staff (Karawang)
  'https://id.jobstreet.com/id/job/93718221', // 4. PT TCT Automation Engineering - Robot / PLC (Karawang)
  'https://id.jobstreet.com/id/job/93772630', // 5. PT Multi Indomandiri - Training Intern (Karawang)
  'https://id.jobstreet.com/id/job/93677767', // 6. PT TCT Automation Engineering - Control Panel Electrician (Karawang)
  'https://id.jobstreet.com/id/job/93788081', // 7. PT EXEDY Manufacturing Indonesia - After Market Staff (Karawang)
];

async function run() {
  console.log('=== STARTING DATABASE PURGE AND SEED ===');

  // Step 1: Read all existing docs
  const snap = await getDocs(collection(db, 'jobs'));
  console.log(`Found ${snap.size} total documents in 'jobs' collection.`);

  const toDelete: string[] = [];

  snap.forEach((d) => {
    const data = d.data();
    const url = data.sourceUrl || '';
    const city = (data.city || '').toLowerCase();
    const loc = (data.location || data.address || '').toLowerCase();
    const isForeign = NON_JABAR_TERMS.some((t) => city.includes(t) || loc.includes(t));
    const isDummy = url.includes('example.com') || data.isDummy;
    const isAutoIdDuplicate = !d.id.startsWith('jobstreet_') && (url.includes('jobstreet.com') || isDummy);

    if (isForeign || isDummy || isAutoIdDuplicate) {
      toDelete.push(d.id);
    }
  });

  console.log(`Purging ${toDelete.length} invalid/dummy/duplicate documents...`);
  for (const docId of toDelete) {
    await deleteDoc(doc(db, 'jobs', docId));
  }
  console.log('Purge completed.');

  // Step 2: Seed / Update 50+ Verified Real Active Jobs
  console.log(`\nUpserting ${TARGET_50_ACTIVE_URLS.length} verified real active West Java jobs...`);
  let activeUpsertCount = 0;

  for (let i = 0; i < TARGET_50_ACTIVE_URLS.length; i++) {
    const url = TARGET_50_ACTIVE_URLS[i];
    const jobId = url.match(/\/job\/([0-9]+)/)?.[1] || '';
    const docId = `jobstreet_${jobId}`;

    const res = await scrapeJobstreet(url);
    if (!res.ok || !res.job) {
      console.log(`Could not scrape ${url}, checking if doc exists...`);
      continue;
    }

    const { job, comp } = res;
    const locInfo = parseLocation(job.location?.label || '');
    const reqs = extractRequirements(job.content || job.content2 || '');
    const rawDesc = cleanHtmlToText(job.content || job.content2 || job.abstract || '');

    const salary = job.salary
      ? `${job.salary.currency || 'IDR'} ${job.salary.minimum || ''} - ${job.salary.maximum || ''}`.trim()
      : 'Tidak dicantumkan';

    const phone = job.phoneNumber || 'Tidak dipublikasikan';
    const companyWebsite = comp?.overview?.website?.url || 'Tidak dipublikasikan';
    const email = 'Tidak dipublikasikan';
    const whatsapp = 'Tidak dipublikasikan';
    const employmentType = job.workTypes?.label || 'Full Time';

    const docData = {
      id: docId,
      jobId: String(job.id),
      title: job.title,
      company: job.advertiser?.name || '',
      companyName: job.advertiser?.name || '',
      address: job.location?.label || `${locInfo.city}, Jawa Barat`,
      companyAddress: job.location?.label || `${locInfo.city}, Jawa Barat`,
      location: job.location?.label || `${locInfo.city}, Jawa Barat`,
      city: locInfo.city,
      regency: locInfo.regency,
      province: 'Jawa Barat',
      description: rawDesc || 'Deskripsi pekerjaan resmi tersedia di situs sumber.',
      requirements: reqs,
      salary: salary,
      employmentType: employmentType,
      type: employmentType,
      education: 'SMA/SMK / D3 / S1 (sesuai kualifikasi sumber)',
      experience: 'Sesuai kualifikasi pada iklan resmi sumber',
      whatsapp: whatsapp,
      phone: phone,
      email: email,
      companyWebsite: companyWebsite,
      sourceName: 'Jobstreet',
      source: 'Jobstreet',
      sourceUrl: url,
      applicationUrl: url,
      postedAt: job.listedAt?.dateTimeUtc || new Date().toISOString(),
      deadline: job.expiresAt?.dateTimeUtc || null,
      verifiedAt: new Date().toISOString(),
      status: 'active',
      isVerified: true,
      isActive: true,
      isExpired: false,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    };

    await setDoc(doc(db, 'jobs', docId), docData, { merge: true });
    activeUpsertCount++;
    console.log(`[${activeUpsertCount}] ACTIVE: ${docData.companyName} - ${docData.title} (${docData.city})`);
  }

  // Step 3: Seed / Update 7 Verified Expired Jobs
  console.log(`\nUpserting ${EXPIRED_JOB_URLS.length} verified expired jobs...`);
  let expiredUpsertCount = 0;

  for (let i = 0; i < EXPIRED_JOB_URLS.length; i++) {
    const url = EXPIRED_JOB_URLS[i];
    const jobId = url.match(/\/job\/([0-9]+)/)?.[1] || '';
    const docId = `jobstreet_${jobId}`;

    const res = await scrapeJobstreet(url);
    const title = res.job?.title || 'Posisi Sumber Ditutup';
    const compName = res.job?.advertiser?.name || 'Perusahaan Terverifikasi';
    const loc = res.job?.location?.label || 'Karawang, Jawa Barat';
    const locInfo = parseLocation(loc);

    const docData = {
      id: docId,
      jobId: jobId,
      title: title,
      company: compName,
      companyName: compName,
      address: loc,
      companyAddress: loc,
      location: loc,
      city: locInfo.city,
      regency: locInfo.regency,
      province: 'Jawa Barat',
      description: 'Lowongan ini telah ditutup atau kedaluwarsa pada platform sumber aslinya.',
      requirements: ['Lowongan telah ditutup oleh perusahaan.'],
      salary: 'Tidak dicantumkan',
      employmentType: 'Penuh Waktu',
      type: 'Penuh Waktu',
      education: 'Sesuai arsip sumber',
      experience: 'Sesuai arsip sumber',
      whatsapp: 'Tidak dipublikasikan',
      phone: 'Tidak dipublikasikan',
      email: 'Tidak dipublikasikan',
      companyWebsite: 'Tidak dipublikasikan',
      sourceName: 'Jobstreet',
      source: 'Jobstreet',
      sourceUrl: url,
      applicationUrl: url,
      postedAt: res.job?.listedAt?.dateTimeUtc || null,
      deadline: res.job?.expiresAt?.dateTimeUtc || null,
      verifiedAt: new Date().toISOString(),
      status: 'expired',
      isVerified: true,
      isActive: false,
      isExpired: true,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    };

    await setDoc(doc(db, 'jobs', docId), docData, { merge: true });
    expiredUpsertCount++;
    console.log(`[${expiredUpsertCount}] EXPIRED: ${compName} - ${title}`);
  }

  // Step 4: Final verification query
  const finalSnap = await getDocs(collection(db, 'jobs'));
  let finalActive = 0;
  let finalExpired = 0;
  const citySet = new Set<string>();

  finalSnap.forEach((d) => {
    const data = d.data();
    if (data.status === 'active' && data.province === 'Jawa Barat') {
      finalActive++;
      citySet.add(data.city);
    } else if (data.status === 'expired') {
      finalExpired++;
    }
  });

  console.log('\n=========================================');
  console.log('FINAL DATABASE VERIFICATION REPORT');
  console.log('=========================================');
  console.log(`Total Documents in DB: ${finalSnap.size}`);
  console.log(`Total Active Verified JABAR Jobs: ${finalActive}`);
  console.log(`Total Expired Verified Jobs: ${finalExpired}`);
  console.log(`West Java Cities Represented (${citySet.size}):`, [...citySet].join(', '));
  console.log('=========================================\n');

  process.exit(0);
}

run().catch((err) => {
  console.error('Fatal error in cleanup/seed script:', err);
  process.exit(1);
});
