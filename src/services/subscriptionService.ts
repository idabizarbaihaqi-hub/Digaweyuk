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
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import {
  SubscriptionPackage,
  PaymentSubmission,
  CompanyProfile,
  User,
  CompanyTrialStatus,
} from '../types';
import { createNotification } from './notificationService';

export const PACKAGES_COLLECTION = 'subscription_packages';
export const PAYMENT_SUBMISSIONS_COLLECTION = 'payment_submissions';

export const OFFICIAL_BANK_ACCOUNTS = [
  {
    id: 'bca',
    bankName: 'BCA (Bank Central Asia)',
    accountNumber: '139-284-9021',
    accountName: 'PT DIGAWE YUK NUSANTARA',
    badge: 'Otomatis dicek',
  },
  {
    id: 'mandiri',
    bankName: 'Bank Mandiri',
    accountNumber: '130-00-98213-41',
    accountName: 'PT DIGAWE YUK NUSANTARA',
    badge: 'Proses Cepat',
  },
  {
    id: 'bri',
    bankName: 'Bank BRI',
    accountNumber: '0102-01-098234-50-2',
    accountName: 'PT DIGAWE YUK NUSANTARA',
    badge: 'Seluruh Indonesia',
  },
  {
    id: 'qris',
    bankName: 'QRIS DIGAWE YUK (Semua E-Wallet)',
    accountNumber: 'NMID: ID10203498214',
    accountName: 'DIGAWE YUK OFFICIAL',
    badge: 'GoPay, OVO, Dana, ShopeePay',
  },
];

export const INITIAL_PACKAGES: SubscriptionPackage[] = [
  {
    id: 'pkg-user-7d',
    name: 'PREMIUM 7 HARI',
    targetAudience: 'user',
    price: 7900,
    durationDays: 7,
    popular: false,
    active: true,
    savingBadge: undefined,
    desc: 'Cocok untuk mencari kerja kilat dalam periode singkat.',
    features: [
      'Buka kunci tombol Lamar Sumber Asli resmi',
      'Akses rekomendasi loker AI prioritas',
      'Badge Premium di profil pencari kerja',
      'Dukungan bantuan prioritas',
    ],
  },
  {
    id: 'pkg-user-30d',
    name: 'PREMIUM 30 HARI',
    targetAudience: 'user',
    price: 19900,
    durationDays: 30,
    popular: true,
    active: true,
    savingBadge: 'Paling Populer',
    desc: 'Pilihan terbaik untuk pencarian kerja intensif dan terarah di Jawa Barat.',
    features: [
      'Buka kunci semua tautan pendaftaran resmi tanpa batas',
      'Rekomendasi AI harian berbasis keahlian & lokasi',
      'Simpan lowongan kerja favorit tanpa kuota',
      'Badge Emas Terverifikasi di postingan Komunitas',
      'Prioritas dilihat oleh rekruter perusahaan',
    ],
  },
  {
    id: 'pkg-user-90d',
    name: 'PREMIUM 90 HARI',
    targetAudience: 'user',
    price: 49900,
    durationDays: 90,
    popular: false,
    active: true,
    savingBadge: 'Hemat 30%',
    desc: 'Akses tanpa khawatir hingga resmi diterima bekerja di perusahaan impian.',
    features: [
      'Seluruh fitur Premium 30 Hari selama 3 bulan penuh',
      'Akses prioritas ruang tes online & interview perusahaan',
      'Garansi kurasi lowongan anti-penipuan 100%',
      'Konsultasi review profil pencari kerja',
    ],
  },
  {
    id: 'pkg-company-pro-monthly',
    name: 'COMPANY PRO MONTHLY',
    targetAudience: 'company',
    price: 299000,
    durationDays: 30,
    popular: true,
    active: true,
    savingBadge: 'Paling Populer Rekruter',
    desc: 'Akses penuh rekrutmen tanpa batas: lowongan, tes online, & AI generation.',
    features: [
      'Publikasi Lowongan Kerja Tanpa Batas (Unlimited)',
      'Ruang Online Test & Interview Berwaktu Unlimited',
      'AI Question Generator berbasis Gemini Flash',
      'AI Essay Evaluation instan & ranking otomatis',
      'Badge Resmi Rekruter Terverifikasi Jabar',
      'Akses & Hubungi Kandidat Open to Work tanpa batas',
    ],
    limits: {
      maxActiveJobs: 9999,
      maxLiveInterviewsPerDay: 9999,
      maxOnlineTestsPerDay: 9999,
      maxAiQuestionsPerDay: 9999,
    },
  },
  {
    id: 'pkg-company-pro-annual',
    name: 'COMPANY PRO ANNUAL',
    targetAudience: 'company',
    price: 2990000,
    durationDays: 365,
    popular: false,
    active: true,
    savingBadge: 'Hemat 2 Bulan',
    desc: 'Solusi tahunan terlengkap untuk divisi HRD & rekrutmen perusahaan.',
    features: [
      'Seluruh keuntungan Company Pro selama 1 tahun penuh',
      'Dedicated Account Manager DIGAWE YUK',
      'Prioritas penayangan lowongan kerja di feed & pencarian',
      'Ekspor laporan & audit rekrutmen lengkap',
    ],
    limits: {
      maxActiveJobs: 9999,
      maxLiveInterviewsPerDay: 9999,
      maxOnlineTestsPerDay: 9999,
      maxAiQuestionsPerDay: 9999,
    },
  },
];

/**
 * Fetch all subscription packages from Firestore (or return initial defaults)
 */
export async function getSubscriptionPackages(): Promise<SubscriptionPackage[]> {
  try {
    const colRef = collection(db, PACKAGES_COLLECTION);
    const snap = await getDocs(colRef);
    if (snap.empty) {
      // Seed default packages into Firestore if none exist
      for (const p of INITIAL_PACKAGES) {
        await setDoc(doc(db, PACKAGES_COLLECTION, p.id), {
          ...p,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
      return INITIAL_PACKAGES;
    }
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as SubscriptionPackage));
  } catch (err) {
    console.warn('Error fetching subscription packages, using initial fallback:', err);
    return INITIAL_PACKAGES;
  }
}

/**
 * Subscribe to subscription packages in real-time
 */
export function subscribeSubscriptionPackages(
  callback: (packages: SubscriptionPackage[]) => void
): () => void {
  const colRef = collection(db, PACKAGES_COLLECTION);
  return onSnapshot(
    colRef,
    (snap) => {
      if (snap.empty) {
        callback(INITIAL_PACKAGES);
      } else {
        const pkgs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as SubscriptionPackage));
        callback(pkgs);
      }
    },
    (err) => {
      console.warn('Snapshot error for subscription packages:', err);
      callback(INITIAL_PACKAGES);
    }
  );
}

/**
 * Save / Update a subscription package (Super Admin only)
 */
export async function saveSubscriptionPackage(pkg: SubscriptionPackage): Promise<void> {
  const pkgDocRef = doc(db, PACKAGES_COLLECTION, pkg.id);
  await setDoc(
    pkgDocRef,
    {
      ...pkg,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
}

/**
 * Delete a subscription package (Super Admin only)
 */
export async function deleteSubscriptionPackage(pkgId: string): Promise<void> {
  const pkgDocRef = doc(db, PACKAGES_COLLECTION, pkgId);
  await deleteDoc(pkgDocRef);
}

/**
 * Submit payment proof for verification
 */
export async function submitPaymentProof(data: {
  userId: string;
  userName: string;
  userEmail: string;
  targetType: 'user' | 'company';
  companyId?: string;
  companyName?: string;
  packageId: string;
  packageName: string;
  price: number;
  durationDays: number;
  bankDestination: string;
  senderBank?: string;
  senderAccountName: string;
  paymentProofUrl: string;
  notes?: string;
}): Promise<string> {
  const colRef = collection(db, PAYMENT_SUBMISSIONS_COLLECTION);
  const now = new Date().toISOString();

  const payload: Omit<PaymentSubmission, 'id'> = {
    userId: data.userId,
    userName: data.userName,
    userEmail: data.userEmail,
    targetType: data.targetType,
    companyId: data.companyId || (data.targetType === 'company' ? data.userId : undefined),
    companyName: data.companyName,
    packageId: data.packageId,
    packageName: data.packageName,
    price: data.price,
    durationDays: data.durationDays,
    bankDestination: data.bankDestination,
    senderBank: data.senderBank || 'Bank Transfer',
    senderAccountName: data.senderAccountName,
    paymentProofUrl: data.paymentProofUrl,
    notes: data.notes || '',
    status: 'PENDING_VERIFICATION',
    submittedAt: now,
    updatedAt: now,
  };

  const docRef = await addDoc(colRef, payload);

  // Notify admin
  try {
    await createNotification({
      userId: data.userId,
      title: 'Bukti Pembayaran Terkirim',
      message: `Pembayaran paket ${data.packageName} sebesar Rp ${data.price.toLocaleString('id-ID')} berhasil diajukan. Tim Admin akan memverifikasi bukti transfer dalam waktu singkat.`,
      type: 'SYSTEM',
    });
  } catch (e) {
    console.error('Error notifying user after submission:', e);
  }

  return docRef.id;
}

/**
 * Subscribe to user's payment submissions
 */
export function subscribeUserPaymentSubmissions(
  userId: string,
  callback: (submissions: PaymentSubmission[]) => void
): () => void {
  const colRef = collection(db, PAYMENT_SUBMISSIONS_COLLECTION);
  const q = query(colRef, where('userId', '==', userId));

  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as PaymentSubmission));
      // Sort in-memory by submittedAt desc
      list.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
      callback(list);
    },
    (err) => {
      console.error('Error listening to user payment submissions:', err);
    }
  );
}

/**
 * Subscribe to all payment submissions (Super Admin)
 */
export function subscribeAllPaymentSubmissions(
  callback: (submissions: PaymentSubmission[]) => void
): () => void {
  const colRef = collection(db, PAYMENT_SUBMISSIONS_COLLECTION);

  return onSnapshot(
    colRef,
    (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as PaymentSubmission));
      list.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
      callback(list);
    },
    (err) => {
      console.error('Error listening to all payment submissions:', err);
    }
  );
}

/**
 * Super Admin: APPROVE payment submission
 * Activates subscription on user or company, calculates expiry, notifies user
 */
export async function approvePaymentSubmission(params: {
  submission: PaymentSubmission;
  adminEmail: string;
  notes?: string;
}): Promise<void> {
  const { submission, adminEmail, notes } = params;
  const now = new Date();
  const startAt = now.toISOString();
  const expiresDate = new Date(now.getTime() + submission.durationDays * 24 * 60 * 60 * 1000);
  const expiresAt = expiresDate.toISOString();

  // 1. Update Payment Submission doc
  const subDocRef = doc(db, PAYMENT_SUBMISSIONS_COLLECTION, submission.id);
  await updateDoc(subDocRef, {
    status: 'APPROVED',
    approvedAt: startAt,
    processedBy: adminEmail,
    adminNotes: notes || 'Pembayaran telah diverifikasi sah oleh Super Admin.',
    updatedAt: startAt,
  });

  // 2. Activate Premium for User or Company
  if (submission.targetType === 'user') {
    const userDocRef = doc(db, 'users', submission.userId);
    await updateDoc(userDocRef, {
      subscriptionStatus: 'PREMIUM',
      subscription: {
        status: 'PREMIUM',
        plan: submission.packageName,
        startAt,
        expiresAt,
        updatedAt: startAt,
      },
      updatedAt: startAt,
    });

    // Notify User
    await createNotification({
      userId: submission.userId,
      title: 'Selamat! Akun Premium Anda Aktif ⭐',
      message: `Pembayaran untuk ${submission.packageName} telah diverifikasi. Akun Anda aktif hingga ${expiresDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}.`,
      type: 'PREMIUM_APPROVED',
    });
  } else {
    // Target is Company
    const targetCompanyId = submission.companyId || submission.userId;
    const companyDocRef = doc(db, 'companies', targetCompanyId);

    await updateDoc(companyDocRef, {
      'subscription.status': 'PREMIUM',
      'subscription.plan': submission.packageName,
      'subscription.startAt': startAt,
      'subscription.expiresAt': expiresAt,
      'subscription.updatedAt': startAt,
      verificationStatus: 'verified',
      updatedAt: startAt,
    });

    // Also update company owner user document if present
    try {
      const userDocRef = doc(db, 'users', submission.userId);
      await updateDoc(userDocRef, {
        subscriptionStatus: 'PREMIUM',
        updatedAt: startAt,
      });
    } catch (e) {
      // Non-fatal if company doc is separate
    }

    // Notify Company
    await createNotification({
      userId: submission.userId,
      title: 'Perusahaan Premium Aktif 🏢⭐',
      message: `Pembayaran paket ${submission.packageName} berhasil diverifikasi! Perusahaan Anda kini memiliki akses tak terbatas hingga ${expiresDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}.`,
      type: 'PREMIUM_APPROVED',
    });
  }
}

/**
 * Super Admin: REJECT payment submission
 */
export async function rejectPaymentSubmission(params: {
  submission: PaymentSubmission;
  adminEmail: string;
  reason: string;
}): Promise<void> {
  const { submission, adminEmail, reason } = params;
  const now = new Date().toISOString();

  // 1. Update submission doc
  const subDocRef = doc(db, PAYMENT_SUBMISSIONS_COLLECTION, submission.id);
  await updateDoc(subDocRef, {
    status: 'REJECTED',
    rejectReason: reason,
    rejectedAt: now,
    processedBy: adminEmail,
    updatedAt: now,
  });

  // 2. Notify User / Company
  await createNotification({
    userId: submission.userId,
    title: 'Pengajuan Pembayaran Ditolak',
    message: `Pengajuan pembayaran paket ${submission.packageName} belum dapat disetujui. Alasan: ${reason}. Silakan periksa kembali bukti transfer Anda atau hubungi admin.`,
    type: 'PREMIUM_REJECTED',
  });
}

/**
 * Check if company has used a lifetime trial feature (1x lifetime limit)
 */
export async function checkCompanyTrial(
  companyId: string,
  feature: 'liveInterview' | 'onlineTest' | 'aiQuestion' | 'candidateDiscovery'
): Promise<{ canUse: boolean; isUsed: boolean; isPremium: boolean }> {
  try {
    const compDoc = await getDoc(doc(db, 'companies', companyId));
    if (!compDoc.exists()) {
      return { canUse: true, isUsed: false, isPremium: false };
    }
    const data = compDoc.data() as CompanyProfile;
    const isPremium = data?.subscription?.status === 'PREMIUM';
    if (isPremium) {
      return { canUse: true, isUsed: false, isPremium: true };
    }

    const trialKey = `${feature}Used` as keyof CompanyTrialStatus;
    const isUsed = Boolean(data?.trial?.[trialKey]);

    return {
      canUse: !isUsed,
      isUsed,
      isPremium: false,
    };
  } catch (err) {
    console.error('Error checking company trial:', err);
    return { canUse: true, isUsed: false, isPremium: false };
  }
}

/**
 * Mark company lifetime trial feature as permanently used in Firestore
 */
export async function useCompanyTrial(
  companyId: string,
  feature: 'liveInterview' | 'onlineTest' | 'aiQuestion' | 'candidateDiscovery'
): Promise<void> {
  const trialKey = `${feature}Used`;
  const compDocRef = doc(db, 'companies', companyId);
  await updateDoc(compDocRef, {
    [`trial.${trialKey}`]: true,
    updatedAt: new Date().toISOString(),
  });
}
