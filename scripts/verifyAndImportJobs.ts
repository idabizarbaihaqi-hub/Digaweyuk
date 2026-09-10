import { db } from '../src/firebase/config';
import { collection, getDocs, query, where, doc, setDoc, updateDoc } from 'firebase/firestore';

interface RawJobInput {
  number: number;
  companyName: string;
  title: string;
  city: string;
  province: string;
  sourceUrl: string;
}

const JOBS_INPUT: RawJobInput[] = [
  { number: 1, companyName: "PT NBC Indonesia", title: "Operator Produksi", city: "Karawang", province: "Jawa Barat", sourceUrl: "https://id.jobstreet.com/id/job/93906644" },
  { number: 2, companyName: "PT ISS Indonesia", title: "Staff EXIM", city: "Karawang", province: "Jawa Barat", sourceUrl: "https://id.jobstreet.com/id/job/93950644" },
  { number: 3, companyName: "Asia Pulp and Paper", title: "Trainee Program Batch A7 & Batch 12", city: "Karawang", province: "Jawa Barat", sourceUrl: "https://id.jobstreet.com/id/job/93950747" },
  { number: 4, companyName: "Orang Tua Group", title: "Shift Leader of PPIC", city: "Karawang", province: "Jawa Barat", sourceUrl: "https://id.jobstreet.com/id/job/93873273" },
  { number: 5, companyName: "PT NBC Indonesia", title: "HSE Staff", city: "Karawang", province: "Jawa Barat", sourceUrl: "https://id.jobstreet.com/id/job/93906487" },
  { number: 6, companyName: "PT Monokem Surya", title: "HRD Staff", city: "Rengasdengklok", province: "Jawa Barat", sourceUrl: "https://id.jobstreet.com/id/job/93932005" },
  { number: 7, companyName: "PT Hasil Raya Industries", title: "Organization Development (HR Staff)", city: "Karawang Timur", province: "Jawa Barat", sourceUrl: "https://id.jobstreet.com/id/job/93921546" },
  { number: 8, companyName: "PT Wahana Duta Jaya Rucika", title: "Mould Maintenance Supervisor", city: "Karawang", province: "Jawa Barat", sourceUrl: "https://id.jobstreet.com/id/job/93924958" },
  { number: 9, companyName: "PT Tunas Mitra Sukses", title: "Business Development Officer", city: "Cikarang", province: "Jawa Barat", sourceUrl: "https://id.jobstreet.com/id/job/93949506" },
  { number: 10, companyName: "PT Monokem Surya", title: "Engineering Manager", city: "Rengasdengklok", province: "Jawa Barat", sourceUrl: "https://id.jobstreet.com/id/job/93864774" },
  { number: 11, companyName: "PT DONGILCASTING", title: "Production Staff", city: "Karawang Timur", province: "Jawa Barat", sourceUrl: "https://id.jobstreet.com/id/job/93634882" },
  { number: 12, companyName: "PT Arisu Graphic Prima", title: "Quality Supervisor", city: "Karawang", province: "Jawa Barat", sourceUrl: "https://id.jobstreet.com/id/job/93958315" },
  { number: 13, companyName: "PT TCT Automation Engineering", title: "Robot / Programmable Logic Controller", city: "Karawang", province: "Jawa Barat", sourceUrl: "https://id.jobstreet.com/id/job/93718221" },
  { number: 14, companyName: "PT BCA Finance", title: "Field Account Consultant BCA Finance", city: "Karawang", province: "Jawa Barat", sourceUrl: "https://id.jobstreet.com/id/job/93872720" },
  { number: 15, companyName: "PT Industrial Robotic Automation", title: "Electrical Engineer", city: "Karawang", province: "Jawa Barat", sourceUrl: "https://id.jobstreet.com/id/job/93958759" },
  { number: 16, companyName: "PT Astemo Indonesia Automotive System", title: "Quality Staff", city: "Cikarang", province: "Jawa Barat", sourceUrl: "https://id.jobstreet.com/id/job/93956045" },
  { number: 17, companyName: "PT Penguin Indonesia", title: "Kepala Bagian Maintenance", city: "Karawang", province: "Jawa Barat", sourceUrl: "https://id.jobstreet.com/id/job/93894162" },
  { number: 18, companyName: "PT Multi Indomandiri", title: "Training Intern", city: "Karawang", province: "Jawa Barat", sourceUrl: "https://id.jobstreet.com/id/job/93772630" },
  { number: 19, companyName: "PT TCT Automation Engineering", title: "Control Panel Electrician", city: "Karawang", province: "Jawa Barat", sourceUrl: "https://id.jobstreet.com/id/job/93677767" },
  { number: 20, companyName: "PT EXEDY Manufacturing Indonesia", title: "After Market Staff", city: "Karawang", province: "Jawa Barat", sourceUrl: "https://id.jobstreet.com/id/job/93788081" },
  { number: 21, companyName: "PT Gelora Aksara Pratama (Erlangga Group)", title: "Administrasi Marketing Wilayah Bandung", city: "Bandung", province: "Jawa Barat", sourceUrl: "https://id.jobstreet.com/id/job/94284814" },
  { number: 22, companyName: "PT Dua Tiga Kemilau (Matoa Group)", title: "Store Keeper", city: "Bandung", province: "Jawa Barat", sourceUrl: "https://id.jobstreet.com/id/job/94079551" },
  { number: 23, companyName: "PT Setiabudhi Jaya Abadi", title: "Pramuniaga", city: "Bandung", province: "Jawa Barat", sourceUrl: "https://id.jobstreet.com/id/job/94170817" },
  { number: 24, companyName: "PT Cahaya Inti Global Pratama", title: "Admin Sales Support", city: "Bandung", province: "Jawa Barat", sourceUrl: "https://id.jobstreet.com/id/job/94280712" },
  { number: 25, companyName: "PT Pendidikan Ganesha Operation", title: "Records & Information Management Staff", city: "Bandung", province: "Jawa Barat", sourceUrl: "https://id.jobstreet.com/id/job/94105292" },
  { number: 26, companyName: "PT Bank SBI Indonesia", title: "Frontliner Staff", city: "Bandung", province: "Jawa Barat", sourceUrl: "https://id.jobstreet.com/id/job/94329102" },
  { number: 27, companyName: "Stroberi Accessories", title: "Administration Staff", city: "Bandung", province: "Jawa Barat", sourceUrl: "https://id.jobstreet.com/id/job/94333994" },
  { number: 28, companyName: "PT Lander Accessories Indonesia", title: "HRGA Officer", city: "Bandung", province: "Jawa Barat", sourceUrl: "https://id.jobstreet.com/id/job/93904133" },
  { number: 29, companyName: "PT Triloka Bintang Fortuna", title: "Kepala Gudang Benang", city: "Bandung", province: "Jawa Barat", sourceUrl: "https://id.jobstreet.com/id/job/94133944" },
  { number: 30, companyName: "CV Cipta Indah Lestari", title: "Admin Purchasing", city: "Bandung", province: "Jawa Barat", sourceUrl: "https://id.jobstreet.com/id/job/94142915" },
  { number: 31, companyName: "PT Panasonic Gobel Energy Indonesia", title: "Production Staff (D3)", city: "Bekasi", province: "Jawa Barat", sourceUrl: "https://id.jobstreet.com/id/job/94298201" },
  { number: 32, companyName: "PT Multi Cipta Mas", title: "Inventory Planner", city: "Bekasi", province: "Jawa Barat", sourceUrl: "https://id.jobstreet.com/id/job/94229044" },
  { number: 33, companyName: "PT ITM Semiconductor Indonesia", title: "Accounting Staff", city: "Bekasi", province: "Jawa Barat", sourceUrl: "https://id.jobstreet.com/id/job/94299092" },
  { number: 34, companyName: "Yayasan Pendidikan dan Bahasa Victory", title: "School Administration Staff", city: "Bekasi", province: "Jawa Barat", sourceUrl: "https://id.jobstreet.com/id/job/94200630" },
  { number: 35, companyName: "PT Adidas Indonesia", title: "Store Supervisor", city: "Bekasi", province: "Jawa Barat", sourceUrl: "https://id.jobstreet.com/id/job/94163506" },
  { number: 36, companyName: "Pengiklan Anonim", title: "Foreman Produksi", city: "Cikarang", province: "Jawa Barat", sourceUrl: "https://id.jobstreet.com/id/job/94271811" },
  { number: 37, companyName: "PT Hankook Tire Indonesia", title: "Quality Control Staff", city: "Cikarang", province: "Jawa Barat", sourceUrl: "https://id.jobstreet.com/id/job/94307938" },
  { number: 38, companyName: "PT Intimas Chemindo", title: "SPV Maintenance", city: "Bekasi", province: "Jawa Barat", sourceUrl: "https://id.jobstreet.com/id/job/94170783" },
  { number: 39, companyName: "PT Berkat Citrani Mitra Sejati", title: "Purchasing & Import Staff", city: "Bekasi", province: "Jawa Barat", sourceUrl: "https://id.jobstreet.com/id/job/94000807" },
  { number: 40, companyName: "PT Mesin Isuzu Indonesia", title: "Staff Purchasing", city: "Bekasi", province: "Jawa Barat", sourceUrl: "https://id.jobstreet.com/id/job/94232664" },
  { number: 41, companyName: "Layo Wood Indonesia", title: "SPV Finance", city: "Cirebon", province: "Jawa Barat", sourceUrl: "https://id.jobstreet.com/id/job/94509449" },
  { number: 42, companyName: "PT Nirvana Wastu Pratama", title: "Marketing Casual Leasing & Event Promotion CSB Mall", city: "Cirebon", province: "Jawa Barat", sourceUrl: "https://id.jobstreet.com/id/job/94392963" },
  { number: 43, companyName: "PT Elements Venture International", title: "Account Manager Export Furniture Manufacturer", city: "Cirebon", province: "Jawa Barat", sourceUrl: "https://id.jobstreet.com/id/job/94513375" },
  { number: 44, companyName: "PT Bhinneka Sangkuriang Transport", title: "Head of Operasional Big Bus", city: "Cirebon", province: "Jawa Barat", sourceUrl: "https://id.jobstreet.com/id/job/94492587" },
  { number: 45, companyName: "PT Mitra Husada Mandiri", title: "Kepala Divisi Penunjang Medis", city: "Cirebon", province: "Jawa Barat", sourceUrl: "https://id.jobstreet.com/id/job/94307232" },
  { number: 46, companyName: "PT Diobeni Mebel Indonesia", title: "QC Manager", city: "Cirebon", province: "Jawa Barat", sourceUrl: "https://id.jobstreet.com/id/job/94174065" },
  { number: 47, companyName: "PT Pipamas Primasejati", title: "Admin Warehouse Cirebon", city: "Cirebon", province: "Jawa Barat", sourceUrl: "https://id.jobstreet.com/id/job/94119263" },
  { number: 48, companyName: "PT Puradelta Lestari Tbk", title: "Front Office Le Premier Hotel Deltamas", city: "Jawa Barat", province: "Jawa Barat", sourceUrl: "https://id.jobstreet.com/id/job/94453609" },
  { number: 49, companyName: "Kawan Lama Group", title: "Customer Service", city: "Cirebon", province: "Jawa Barat", sourceUrl: "https://id.jobstreet.com/id/job/94328636" },
  { number: 50, companyName: "PT Batik Sukses Sejahtera", title: "Content Creator", city: "Cirebon", province: "Jawa Barat", sourceUrl: "https://id.jobstreet.com/id/job/94509568" },
];

export interface VerifiedJobResult {
  number: number;
  companyName: string;
  title: string;
  location: string;
  city: string;
  province: string;
  sourceName: string;
  sourceUrl: string;
  applicationUrl: string;
  isVerified: boolean;
  isActive: boolean;
  isExpired: boolean;
  verifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
  notes: string;
}

export async function verifyUrl(item: RawJobInput): Promise<VerifiedJobResult> {
  const nowIso = new Date().toISOString();
  const location = `${item.city}, ${item.province}`;
  
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    
    const resp = await fetch(item.sourceUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
      }
    });
    clearTimeout(timeout);

    if (resp.status === 404 || resp.status === 410) {
      return {
        number: item.number,
        companyName: item.companyName,
        title: item.title,
        location,
        city: item.city,
        province: item.province,
        sourceName: "Jobstreet",
        sourceUrl: item.sourceUrl,
        applicationUrl: item.sourceUrl,
        isVerified: false,
        isActive: false,
        isExpired: true,
        verifiedAt: null,
        createdAt: nowIso,
        updatedAt: nowIso,
        notes: `HTTP ${resp.status} - Halaman sudah tidak tersedia / dihapus`
      };
    }

    if (!resp.ok) {
      return {
        number: item.number,
        companyName: item.companyName,
        title: item.title,
        location,
        city: item.city,
        province: item.province,
        sourceName: "Jobstreet",
        sourceUrl: item.sourceUrl,
        applicationUrl: item.sourceUrl,
        isVerified: false,
        isActive: false,
        isExpired: false,
        verifiedAt: null,
        createdAt: nowIso,
        updatedAt: nowIso,
        notes: `HTTP ${resp.status} - Status tidak dapat dipastikan`
      };
    }

    const html = await resp.text();

    // Check for explicit expiration indicators
    const isExpiredMatch = html.match(/"isExpired":\s*(true|false)/);
    const isExpiredFromData = isExpiredMatch ? isExpiredMatch[1] === 'true' : null;

    // Check for closed / expired banners in text
    const hasExpiredBanner =
      html.includes('Lowongan ini telah ditutup') ||
      html.includes('Lowongan ini sudah tidak aktif') ||
      html.includes('This job is no longer available') ||
      html.includes('This job has expired');

    // Check expiresAt in ISO format if available
    let isPastExpiresAt = false;
    const expiresAtMatch = html.match(/"expiresAt":\s*\{[^}]*"dateTimeUtc":\s*"([^"]+)"/);
    if (expiresAtMatch && expiresAtMatch[1]) {
      const expDate = new Date(expiresAtMatch[1]).getTime();
      if (!isNaN(expDate) && expDate < Date.now()) {
        isPastExpiresAt = true;
      }
    }

    // Check if apply button / application link is present
    const hasApplyCta =
      html.includes('apply-on-the-app-button') ||
      html.includes('Lamar') ||
      html.includes('Apply') ||
      html.includes('seek-job-details');

    if (isExpiredFromData === true || hasExpiredBanner || isPastExpiresAt) {
      return {
        number: item.number,
        companyName: item.companyName,
        title: item.title,
        location,
        city: item.city,
        province: item.province,
        sourceName: "Jobstreet",
        sourceUrl: item.sourceUrl,
        applicationUrl: item.sourceUrl,
        isVerified: false,
        isActive: false,
        isExpired: true,
        verifiedAt: null,
        createdAt: nowIso,
        updatedAt: nowIso,
        notes: `Halaman ditemukan namun lowongan telah kedaluwarsa / ditutup (isExpired=${isExpiredFromData}, isPastExpiresAt=${isPastExpiresAt})`
      };
    }

    if (isExpiredFromData === false && hasApplyCta) {
      return {
        number: item.number,
        companyName: item.companyName,
        title: item.title,
        location,
        city: item.city,
        province: item.province,
        sourceName: "Jobstreet",
        sourceUrl: item.sourceUrl,
        applicationUrl: item.sourceUrl,
        isVerified: true,
        isActive: true,
        isExpired: false,
        verifiedAt: nowIso,
        createdAt: nowIso,
        updatedAt: nowIso,
        notes: "Terverifikasi aktif dan masih dapat dilamar"
      };
    }

    // Available but cannot definitively verify
    return {
      number: item.number,
      companyName: item.companyName,
      title: item.title,
      location,
      city: item.city,
      province: item.province,
      sourceName: "Jobstreet",
      sourceUrl: item.sourceUrl,
      applicationUrl: item.sourceUrl,
      isVerified: false,
      isActive: false,
      isExpired: false,
      verifiedAt: null,
      createdAt: nowIso,
      updatedAt: nowIso,
      notes: "Halaman tersedia tetapi status lowongan tidak dapat dipastikan"
    };

  } catch (err: any) {
    return {
      number: item.number,
      companyName: item.companyName,
      title: item.title,
      location,
      city: item.city,
      province: item.province,
      sourceName: "Jobstreet",
      sourceUrl: item.sourceUrl,
      applicationUrl: item.sourceUrl,
      isVerified: false,
      isActive: false,
      isExpired: false,
      verifiedAt: null,
      createdAt: nowIso,
      updatedAt: nowIso,
      notes: `Gagal mengakses URL: ${err?.message || err}`
    };
  }
}

export { JOBS_INPUT };
