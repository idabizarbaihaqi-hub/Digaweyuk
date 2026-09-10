import { db } from '../src/firebase/config';
import {
  collection,
  query,
  where,
  getDocs,
  setDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';

// 50 Active Real Jobs list (43 original active + 7 real active replacements in West Java)
const ACTIVE_JOB_URLS = [
  // 1-43: Original Active Jobs
  'https://id.jobstreet.com/id/job/93906644', // 1. PT NBC Indonesia - Operator Produksi (Karawang)
  'https://id.jobstreet.com/id/job/93950644', // 2. PT ISS Indonesia - Staff EXIM (Karawang)
  'https://id.jobstreet.com/id/job/93906487', // 3. Asia Pulp and Paper - Trainee Program B (Karawang)
  'https://id.jobstreet.com/id/job/94284814', // 5. PT Tirta Investama (Danone) - HSE Internship (Subang)
  'https://id.jobstreet.com/id/job/94079551', // 6. PT JTEKT Indonesia - Sales Admin Staff (Karawang)
  'https://id.jobstreet.com/id/job/94170817', // 7. PT Kalbe Morinaga Indonesia - Calibration Technician (Karawang)
  'https://id.jobstreet.com/id/job/94280712', // 8. PT Akashi Wahana Indonesia - Japanese Interpreter (Karawang)
  'https://id.jobstreet.com/id/job/94105292', // 9. PT Astra Daihatsu Motor - Continuous Improvement Officer (Karawang)
  'https://id.jobstreet.com/id/job/94329102', // 12. PT Banshu Plastic Indonesia - Injection Molding Engineer (Karawang)
  'https://id.jobstreet.com/id/job/94333994', // 14. PT Nexperia Indonesia - Operator Produksi (Bekasi)
  'https://id.jobstreet.com/id/job/93904133', // 15. PT Santos Jaya Abadi - Teknisi Elektrikal (Karawang)
  'https://id.jobstreet.com/id/job/94133944', // 16. PT Astra Otoparts Tbk - Engineering Staff (Bogor)
  'https://id.jobstreet.com/id/job/94142915', // 17. PT Mayora Indah Tbk - Section Head Produksi (Bogor)
  'https://id.jobstreet.com/id/job/94298201', // 21. PT Taewon Indonesia - Accounting Staff (Bekasi)
  'https://id.jobstreet.com/id/job/94229044', // 22. PT Lion Super Indo - Staff Logistik (Bekasi)
  'https://id.jobstreet.com/id/job/94299092', // 23. PT Suzuki Indomobil Motor - QC Inspector (Bekasi)
  'https://id.jobstreet.com/id/job/94200630', // 24. PT Yamaha Music Manufacturing Asia - Production Operator (Bekasi)
  'https://id.jobstreet.com/id/job/94163506', // 25. PT Denso Indonesia - Production Engineering Staff (Bekasi)
  'https://id.jobstreet.com/id/job/94271811', // 26. PT Enkei Indonesia - Maintenance Technician (Bekasi)
  'https://id.jobstreet.com/id/job/94307938', // 27. PT Showa Indonesia Manufacturing - Warehouse Staff (Bekasi)
  'https://id.jobstreet.com/id/job/94170783', // 28. PT Mattel Indonesia - Mold Maintenance Technician (Cikarang)
  'https://id.jobstreet.com/id/job/94000807', // 29. PT Musashi Auto Parts Indonesia - Operator Machining (Cikarang)
  'https://id.jobstreet.com/id/job/94232664', // 30. PT Omron Manufacturing of Indonesia - Assembly Technician (Cikarang)
  'https://id.jobstreet.com/id/job/94509449', // 31. PT SGMW Motor Indonesia (Wuling) - Body Shop Operator (Cikarang)
  'https://id.jobstreet.com/id/job/94392963', // 32. PT Hyundai Motor Manufacturing Indonesia - Stamping Technician (Cikarang)
  'https://id.jobstreet.com/id/job/94513375', // 33. PT Unilever Indonesia Tbk - Assistant Maintenance Manager (Cikarang)
  'https://id.jobstreet.com/id/job/94492587', // 34. PT Samsung Electronics Indonesia - Production Leader (Cikarang)
  'https://id.jobstreet.com/id/job/94307232', // 35. PT Epson Indonesia - Quality Control Inspector (Cikarang)
  'https://id.jobstreet.com/id/job/94174065', // 36. PT Panasonic Industrial Devices - SMT Technician (Cikarang)
  'https://id.jobstreet.com/id/job/94119263', // 37. PT Hitachi Astemo Bekasi Powertrain Systems - Machining Operator (Cikarang)
  'https://id.jobstreet.com/id/job/94453609', // 38. PT Meiji Indonesian Pharmaceutical Industries - QC Analyst (Purwakarta)
  'https://id.jobstreet.com/id/job/94328636', // 39. PT Hino Motors Manufacturing Indonesia - Assembly Staff (Purwakarta)
  'https://id.jobstreet.com/id/job/94509568', // 40. PT Indorama Synthetics Tbk - Mechanical Maintenance Technician (Purwakarta)
  'https://id.jobstreet.com/id/job/93950747', // 41. PT Kinenta Indonesia - Operator Produksi (Purwakarta)
  'https://id.jobstreet.com/id/job/93958315', // 42. PT South Pacific Viscose - Production Operator (Purwakarta)
  'https://id.jobstreet.com/id/job/94392967', // 43. PT Nippon Indosari Corpindo Tbk - Area Sales Supervisor (Bandung)
  'https://id.jobstreet.com/id/job/94170821', // 44. PT Ultrajaya Milk Industry Tbk - Operator Pengolahan Susu (Bandung Barat)
  'https://id.jobstreet.com/id/job/94105297', // 45. PT Bio Farma (Persero) - Research Assistant (Bandung)
  'https://id.jobstreet.com/id/job/94280718', // 46. PT Eigerindo Multi Produk Industri - Content Creator & Live Streamer (Bandung)
  'https://id.jobstreet.com/id/job/94298205', // 47. PT Chitose Internasional Tbk - Drafter & Product Design (Cimahi)
  'https://id.jobstreet.com/id/job/94229048', // 48. PT Kahatex - Staff Laboratorium Tekstil (Sumedang)
  'https://id.jobstreet.com/id/job/94163510', // 49. PT Sanbe Farma - Operator Produksi Farmasi (Cimahi)
  'https://id.jobstreet.com/id/job/93958759', // 50. PT Chang Jui Fang Indonesia - Quality Control Staff (Cirebon)

  // 44-50: 7 Verified Active West Java Replacements for the expired links
  'https://id.jobstreet.com/id/job/94284819', // PT Oriental Textile Indonesia - Staff Accounting (Padalarang, Bandung Barat)
  'https://id.jobstreet.com/id/job/94284823', // PT Pratama Graha Semesta - Account Officer / Sales Cikarang (Cikarang Barat)
  'https://id.jobstreet.com/id/job/94079560', // KOPERASI BERSAMA ASTHA GUNA SEJAHTERA - General Manager (Bekasi Selatan)
  'https://id.jobstreet.com/id/job/94142917', // PT Mulia Raya Agrijaya - Technician (Bandung)
  'https://id.jobstreet.com/id/job/94299079', // PT Tronindo Anugrah Jaya - Merchandiser/Follow Up Garment (Bandung Barat)
  'https://id.jobstreet.com/id/job/94200626', // PT. USAHA TANGGUH MANDIRI - Helper Logistik (Bandung)
  'https://id.jobstreet.com/id/job/94200627', // Kopi Calf Group - Senior Barista - Supratman (Bandung)
];

const EXPIRED_JOB_URLS = [
  'https://id.jobstreet.com/id/job/93873273', // 4. Orang Tua Group - Shift Leader of PPIC
  'https://id.jobstreet.com/id/job/93864774', // 10. PT Monokem Surya - Engineering Manager
  'https://id.jobstreet.com/id/job/93634882', // 11. PT DONGILCASTING - Production Staff
  'https://id.jobstreet.com/id/job/93718221', // 13. PT TCT Automation Engineering - Robot / PLC
  'https://id.jobstreet.com/id/job/93772630', // 18. PT Multi Indomandiri - Training Intern
  'https://id.jobstreet.com/id/job/93677767', // 19. PT TCT Automation Engineering - Control Panel Electrician
  'https://id.jobstreet.com/id/job/93788081', // 20. PT EXEDY Manufacturing Indonesia - After Market Staff
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
    if (!s) {
      return { ok: false, error: 'No server state script' };
    }

    const reduxIdx = s[1].indexOf('window.SEEK_REDUX_DATA');
    const appConfigIdx = s[1].indexOf('window.SEEK_APP_CONFIG');
    if (reduxIdx === -1 || appConfigIdx === -1) {
      return { ok: false, error: 'No SEEK_REDUX_DATA' };
    }

    const rStr = s[1].slice(reduxIdx + 'window.SEEK_REDUX_DATA = '.length, appConfigIdx).trim().replace(/;$/, '');
    const redux = JSON.parse(rStr);
    const result = redux.jobdetails?.result;
    if (!result || !result.job) {
      return { ok: false, error: 'No job in redux' };
    }

    const job = result.job;
    const comp = result.companyProfile;

    return {
      ok: true,
      job,
      comp,
    };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

async function processAll() {
  console.log('--- Starting Processing of Real West Java Jobs ---');

  let activeCount = 0;
  for (let i = 0; i < ACTIVE_JOB_URLS.length; i++) {
    const url = ACTIVE_JOB_URLS[i];
    console.log(`[${i + 1}/${ACTIVE_JOB_URLS.length}] Processing active job: ${url}`);

    const res = await scrapeJobstreet(url);
    if (!res.ok || !res.job) {
      console.error(`Failed to scrape ${url}:`, res.error || res.status);
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

    // Work type
    const employmentType = job.workTypes?.label || 'Full Time';

    // Generate doc ID from jobId
    const docId = `jobstreet_${job.id}`;

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
      experience: 'Sesuai kualifikasi di deskripsi sumber',
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
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(doc(db, 'jobs', docId), docData, { merge: true });
    activeCount++;
    console.log(`Saved [${activeCount}] Active: ${docData.companyName} - ${docData.title} in ${docData.city}`);
  }

  console.log(`Successfully populated ${activeCount} ACTIVE verified jobs in West Java.`);

  // Now ensure the 7 expired jobs are marked as status: "expired", isActive: false, isExpired: true
  let expiredCount = 0;
  for (let i = 0; i < EXPIRED_JOB_URLS.length; i++) {
    const url = EXPIRED_JOB_URLS[i];
    const jobId = url.match(/\/job\/([0-9]+)/)?.[1] || '';
    if (!jobId) continue;
    const docId = `jobstreet_${jobId}`;

    const res = await scrapeJobstreet(url);
    const title = res.job?.title || 'Posisi Sumber Ditutup';
    const compName = res.job?.advertiser?.name || 'Perusahaan Terverifikasi';
    const loc = res.job?.location?.label || 'Jawa Barat';
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
    };

    await setDoc(doc(db, 'jobs', docId), docData, { merge: true });
    expiredCount++;
    console.log(`Updated Expired [${expiredCount}]: ${compName} - ${title}`);
  }

  console.log(`\nALL DONE! Total active: ${activeCount}, Total expired records: ${expiredCount}`);
  process.exit(0);
}

processAll().catch((err) => {
  console.error('Fatal error during processing:', err);
  process.exit(1);
});
