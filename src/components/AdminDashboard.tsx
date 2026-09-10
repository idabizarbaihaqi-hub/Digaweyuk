import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  LayoutDashboard,
  Briefcase,
  PlusCircle,
  CheckCircle2,
  Clock,
  Globe,
  Users,
  Crown,
  Bot,
  FileText,
  Settings,
  Database,
  Info,
  Loader2,
  Sparkles,
  ExternalLink,
  Plus,
  Play,
  Trash2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  ShieldCheck,
  Calendar,
  Layers,
  ShieldAlert,
} from 'lucide-react';
import { Job, EmploymentType, JobStatus, JobHunterLog, JobHunterSettings, User } from '../types';
import { subscribeAllJobs, createJob, deleteJob } from '../services/jobService';
import {
  subscribeJobHunterLogs,
  subscribeJobHunterSettings,
  updateJobHunterSettings,
  triggerManualJobHunter,
  triggerJobCleanup,
} from '../services/jobHunterService';
import { LOCATIONS, CATEGORIES } from '../constants/jobFilters';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { AppLogo } from './AppLogo';
import { ModerationCenterView } from './admin/ModerationCenterView';

interface AdminDashboardProps {
  onBack: () => void;
  jobs?: Job[];
  user?: User | null;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack, user }) => {
  const isSuperAdmin =
    user?.email?.toLowerCase().trim() === 'id.agnesyakartika@gmail.com' &&
    user?.role === 'super_admin';

  const [activeAdminTab, setActiveAdminTab] = useState<string>('ai_job_hunter');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);

  // Job Hunter Logs & Settings
  const [logs, setLogs] = useState<JobHunterLog[]>([]);
  const [settings, setSettings] = useState<JobHunterSettings | null>(null);

  // Manual Trigger Run State
  const [isRunningHunter, setIsRunningHunter] = useState(false);
  const [hunterRunResult, setHunterRunResult] = useState<any | null>(null);
  const [hunterError, setHunterError] = useState<string | null>(null);

  // Cleanup state
  const [isCleaning, setIsCleaning] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<string | null>(null);

  // Users State (from Firestore)
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // New Job Form State
  const [newTitle, setNewTitle] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newLocation, setNewLocation] = useState('Kota Bandung');
  const [newAddress, setNewAddress] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newCategory, setNewCategory] = useState('IT');
  const [newSalary, setNewSalary] = useState('');
  const [newType, setNewType] = useState<EmploymentType>('Penuh Waktu');
  const [newDesc, setNewDesc] = useState('');
  const [newReq, setNewReq] = useState('');
  const [newSourceName, setNewSourceName] = useState('Portal Karir Resmi');
  const [newSourceUrl, setNewSourceUrl] = useState('');
  const [isSubmittingJob, setIsSubmittingJob] = useState(false);
  const [jobSubmitMsg, setJobSubmitMsg] = useState<string | null>(null);

  // Settings form
  const [savedSettingsMsg, setSavedSettingsMsg] = useState<string | null>(null);

  // 1. Subscribe to all jobs in Firestore
  useEffect(() => {
    setLoadingJobs(true);
    const unsubscribe = subscribeAllJobs(
      (allJobs) => {
        setJobs(allJobs);
        setLoadingJobs(false);
      },
      (err) => {
        console.error('Error fetching admin jobs:', err);
        setLoadingJobs(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // 2. Subscribe to Job Hunter Logs
  useEffect(() => {
    const unsubscribeLogs = subscribeJobHunterLogs((allLogs) => {
      setLogs(allLogs);
    });
    return () => unsubscribeLogs();
  }, []);

  // 3. Subscribe to Job Hunter Settings
  useEffect(() => {
    const unsubscribeSettings = subscribeJobHunterSettings((st) => {
      setSettings(st);
    });
    return () => unsubscribeSettings();
  }, []);

  // 4. Subscribe to Users Collection
  useEffect(() => {
    setLoadingUsers(true);
    const usersRef = collection(db, 'users');
    const unsubUsers = onSnapshot(
      usersRef,
      (snapshot) => {
        const uList: User[] = [];
        snapshot.forEach((d) => {
          const data = d.data();
          uList.push({
            uid: d.id,
            name: data.name || 'Pengguna',
            email: data.email || '',
            photoURL: data.photoURL || '',
            subscriptionStatus: data.subscriptionStatus || 'FREE',
            role: data.role || 'user',
            createdAt: data.createdAt || '',
            updatedAt: data.updatedAt || '',
          });
        });
        setUsers(uList);
        setLoadingUsers(false);
      },
      (err) => {
        console.warn('Users snapshot error (non-fatal):', err?.message);
        setLoadingUsers(false);
      }
    );
    return () => unsubUsers();
  }, []);

  // Compute Real Metrics
  const totalActiveJobs = jobs.filter(
    (j) => j.status === 'active' && j.validationStatus === 'valid'
  ).length;

  const now = Date.now();
  const fiveDaysMs = 5 * 24 * 60 * 60 * 1000;
  const expiredJobsCount = jobs.filter((j) => {
    const foundTime = new Date(j.foundAt || j.createdAt).getTime();
    const expTime = j.expiresAt ? new Date(j.expiresAt).getTime() : 0;
    return (
      j.status === 'expired' ||
      (!isNaN(foundTime) && now - foundTime > fiveDaysMs) ||
      (expTime > 0 && expTime < now)
    );
  }).length;

  const closedJobsCount = jobs.filter((j) => j.status === 'closed').length;

  // Real calculation: Jobs found today (Asia/Jakarta comparison)
  const todayStr = new Date().toISOString().slice(0, 10);
  const jobsFoundToday = jobs.filter((j) => {
    const foundDateStr = (j.foundAt || j.createdAt || '').slice(0, 10);
    return foundDateStr === todayStr;
  }).length;

  // Latest run stats from logs
  const latestLog = logs.length > 0 ? logs[0] : null;
  const latestSuccessLog = logs.find((l) => l.status === 'success');

  const lastRunText = latestLog
    ? new Date(latestLog.startedAt).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }) +
      ' WIB'
    : 'Belum pernah dijalankan.';

  const lastSuccessText = latestSuccessLog
    ? new Date(latestSuccessLog.startedAt).toLocaleString('id-ID', {
        timeZone: 'Asia/Jakarta',
      }) + ' WIB'
    : 'Belum pernah dijalankan.';

  const aiStatusText = isRunningHunter
    ? 'Sedang Berjalan (Running...)'
    : latestLog?.status === 'running'
    ? 'Sedang Berjalan di Cloud'
    : latestLog
    ? 'Siaga (Jadwal Aktif)'
    : 'Belum pernah dijalankan.';

  // Handle Manual Run Trigger
  const handleRunJobHunterNow = async () => {
    setIsRunningHunter(true);
    setHunterRunResult(null);
    setHunterError(null);

    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await triggerManualJobHunter(token);
      setHunterRunResult(res);
    } catch (err: any) {
      console.error('Job Hunter execution failed:', err);
      setHunterError(err?.message || 'Gagal menjalankan AI Job Hunter.');
    } finally {
      setIsRunningHunter(false);
    }
  };

  // Handle Manual Cleanup
  const handleRunCleanupNow = async () => {
    setIsCleaning(true);
    setCleanupResult(null);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await triggerJobCleanup(token);
      setCleanupResult(res.message);
    } catch (err: any) {
      setCleanupResult(`Gagal membersihkan lowongan: ${err?.message}`);
    } finally {
      setIsCleaning(false);
    }
  };

  // Submit Manual Job
  const handleCreateJobSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newCompany.trim() || !newSourceUrl.trim()) return;

    setIsSubmittingJob(true);
    setJobSubmitMsg(null);
    try {
      const requirementsList = newReq
        .split('\n')
        .map((r) => r.trim())
        .filter(Boolean);

      const nowIso = new Date().toISOString();
      const expiresAt = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();

      await createJob({
        title: newTitle.trim(),
        companyName: newCompany.trim(),
        company: newCompany.trim(),
        location: `${newLocation}, Jawa Barat`,
        province: 'Jawa Barat',
        city: newLocation,
        companyAddress: newAddress.trim() || `Jl. Utama ${newLocation}, Jawa Barat`,
        companyEmail: newEmail.trim() || null,
        companyPhone: newPhone.trim() || null,
        contactType:
          newEmail.trim() && newPhone.trim()
            ? 'both'
            : newPhone.trim()
            ? 'phone'
            : 'email',
        contactSourceUrl: newSourceUrl.trim(),
        category: newCategory,
        salary: newSalary.trim() ? newSalary.trim() : null,
        employmentType: newType,
        description: newDesc.trim() || `Lowongan kerja ${newTitle} di ${newCompany}.`,
        requirements: requirementsList,
        qualifications: [],
        sourceName: newSourceName.trim() || 'Sumber Terverifikasi',
        sourceUrl: newSourceUrl.trim(),
        sourceType: 'official_company',
        publishedAt: nowIso,
        foundAt: nowIso,
        applicationDeadline: null,
        expiresAt,
        status: 'active',
        verified: true,
        companyVerified: true,
        locationVerified: true,
        addressVerified: true,
        contactVerified: true,
        sourceVerified: true,
        validationStatus: 'valid',
        validationReason: 'Diverifikasi langsung oleh Administrator DIGAWE YUK untuk wilayah Jawa Barat.',
        sourceCheckedAt: nowIso,
        jobHash: '',
        featured: false,
        popular: false,
      });

      setJobSubmitMsg('Lowongan terverifikasi Jawa Barat berhasil ditambahkan ke Cloud Firestore!');
      setNewTitle('');
      setNewCompany('');
      setNewAddress('');
      setNewEmail('');
      setNewPhone('');
      setNewSalary('');
      setNewDesc('');
      setNewReq('');
      setNewSourceUrl('');
    } catch (err: any) {
      setJobSubmitMsg(`Gagal menambahkan lowongan: ${err?.message}`);
    } finally {
      setIsSubmittingJob(false);
    }
  };

  // Delete Job
  const handleDeleteJob = async (jobId: string) => {
    if (!window.confirm('Yakin ingin menghapus lowongan ini dari Firestore?')) return;
    try {
      await deleteJob(jobId);
    } catch (err: any) {
      alert(`Gagal menghapus: ${err?.message}`);
    }
  };

  // Toggle user subscription status
  const handleToggleUserSubscription = async (u: User) => {
    const newStatus = u.subscriptionStatus === 'PREMIUM' ? 'FREE' : 'PREMIUM';
    try {
      const userRef = doc(db, 'users', u.uid);
      await updateDoc(userRef, {
        subscriptionStatus: newStatus,
        updatedAt: new Date().toISOString(),
      });
    } catch (err: any) {
      alert(`Gagal mengubah status: ${err?.message}`);
    }
  };

  const adminMenuItems = [
    { id: 'dashboard', label: 'Dashboard Real-Time', icon: LayoutDashboard },
    { id: 'moderasi', label: 'Pusat Moderasi & Keamanan', icon: ShieldAlert, highlight: true },
    { id: 'ai_job_hunter', label: 'AI Job Hunter', icon: Bot, highlight: true },
    { id: 'ai_logs', label: 'AI Logs (Firestore)', icon: FileText },
    { id: 'lowongan', label: 'Semua Lowongan', icon: Briefcase },
    { id: 'lowongan_baru', label: 'Tambah Lowongan Manual', icon: PlusCircle },
    { id: 'pengguna', label: 'Pengguna & Member', icon: Users },
    { id: 'premium', label: 'Langganan Premium', icon: Crown },
    { id: 'pengaturan', label: 'Pengaturan & Deployment', icon: Settings },
  ];

  if (!isSuperAdmin) {
    return (
      <div id="admin-access-denied" className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-3xl border border-rose-200 p-8 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-100">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">Akses Ditolak</h2>
          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
            Panel Admin ini dikunci khusus dan hanya dapat diakses oleh Super Admin resmi (<strong>id.agnesyakartika@gmail.com</strong>).
          </p>
          <button
            onClick={onBack}
            className="mt-6 w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs inline-flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Beranda</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div id="admin-dashboard-container" className="max-w-4xl mx-auto px-4 py-4 pb-28">
      {/* Top Header */}
      <div className="bg-slate-900 text-white p-5 rounded-3xl shadow-sm mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-white rounded-2xl shadow-sm flex items-center justify-center shrink-0">
            <AppLogo size="sm" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black tracking-tight">Super Admin Control Panel</h1>
              <span className="text-[10px] font-black bg-blue-500/20 text-blue-300 border border-blue-500/40 px-2 py-0.5 rounded-full">
                SUPER ADMIN
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              id.agnesyakartika@gmail.com • Kelola AI Hunter, database Firestore, & pengguna.
            </p>
          </div>
        </div>

        <button
          id="btn-admin-back-to-app"
          onClick={onBack}
          className="inline-flex items-center gap-1 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-2 rounded-xl transition-colors border border-slate-700"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali</span>
        </button>
      </div>

      {/* Admin Navigation Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
        {adminMenuItems.map((item) => {
          const Icon = item.icon;
          const active = activeAdminTab === item.id;
          return (
            <button
              key={item.id}
              id={`tab-admin-${item.id}`}
              onClick={() => setActiveAdminTab(item.id)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                active
                  ? 'bg-blue-600 text-white shadow-xs shadow-blue-500/30'
                  : 'bg-white text-slate-600 border border-slate-200/90 hover:bg-slate-50'
              }`}
            >
              <Icon className={`w-4 h-4 ${active ? 'text-white' : item.highlight ? 'text-blue-600' : 'text-slate-400'}`} />
              <span>{item.label}</span>
              {item.highlight && !active && (
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: REAL-TIME DASHBOARD */}
      {activeAdminTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Status AI Banner */}
          <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white p-5 rounded-2xl border border-blue-800/60 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-bold tracking-wider text-blue-300 uppercase">
                  Status AI Job Hunter
                </span>
                <h2 className="text-xl font-extrabold mt-0.5 flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${isRunningHunter ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`}></span>
                  <span>{aiStatusText}</span>
                </h2>
                <div className="flex flex-wrap gap-4 mt-2 text-xs text-blue-200/80">
                  <span>⏱ Terakhir Dijalankan: <strong>{lastRunText}</strong></span>
                  <span>✅ Terakhir Berhasil: <strong>{lastSuccessText}</strong></span>
                </div>
              </div>

              <button
                id="btn-dash-run-hunter"
                onClick={handleRunJobHunterNow}
                disabled={isRunningHunter}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2"
              >
                {isRunningHunter ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Running...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white" />
                    <span>Jalankan Sekarang</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Real Metrics Grid */}
          <div>
            <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-3">
              Statistik Real Database Firestore
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Lowongan Aktif</span>
                <p className="text-2xl font-black text-blue-600 mt-1">{totalActiveJobs}</p>
                <span className="text-[10px] text-slate-400">Terverifikasi & valid</span>
              </div>

              <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Ditemukan Hari Ini</span>
                <p className="text-2xl font-black text-emerald-600 mt-1">{jobsFoundToday}</p>
                <span className="text-[10px] text-slate-400">{todayStr}</span>
              </div>

              <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Kadaluarsa</span>
                <p className="text-2xl font-black text-amber-600 mt-1">{expiredJobsCount}</p>
                <span className="text-[10px] text-slate-400">&gt; 5 hari / lewat batas</span>
              </div>

              <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Ditutup</span>
                <p className="text-2xl font-black text-slate-600 mt-1">{closedJobsCount}</p>
                <span className="text-[10px] text-slate-400">Status closed</span>
              </div>
            </div>
          </div>

          {/* Latest Execution Breakdown */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
            <h3 className="text-sm font-extrabold text-slate-900 mb-3 flex items-center justify-between">
              <span>Hasil Eksekusi AI Job Hunter Terakhir</span>
              {latestLog && (
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                  latestLog.status === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  {latestLog.status.toUpperCase()}
                </span>
              )}
            </h3>

            {latestLog ? (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-500 font-bold block">Ditemukan</span>
                  <span className="text-lg font-black text-slate-900">{latestLog.jobsDiscovered}</span>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                  <span className="text-[10px] text-emerald-700 font-bold block">Baru Disimpan</span>
                  <span className="text-lg font-black text-emerald-700">{latestLog.jobsInserted}</span>
                </div>
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                  <span className="text-[10px] text-blue-700 font-bold block">Diperbarui</span>
                  <span className="text-lg font-black text-blue-700">{latestLog.jobsUpdated}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-500 font-bold block">Duplikat</span>
                  <span className="text-lg font-black text-slate-700">{latestLog.duplicates}</span>
                </div>
                <div className="p-3 bg-rose-50 rounded-xl border border-rose-100">
                  <span className="text-[10px] text-rose-700 font-bold block">Ditolak / Invalid</span>
                  <span className="text-lg font-black text-rose-700">{latestLog.rejected + latestLog.validationFailed}</span>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-slate-400 text-xs">
                Belum ada catatan log eksekusi. Tekan tombol &quot;Jalankan Sekarang&quot; untuk menjalankan AI Job Hunter.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: AI JOB HUNTER */}
      {activeAdminTab === 'ai_job_hunter' && (
        <div className="space-y-6">
          {/* Action Card: Manual Run */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-md">
                <div className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-blue-600" />
                  <h3 className="text-base font-extrabold text-slate-900">
                    Eksekusi AI Job Hunter
                  </h3>
                </div>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  Menjalankan pencarian web nyata melalui Google Gemini dengan Search Grounding
                  untuk menemukan lowongan kerja aktif terbaru dari portal resmi di Indonesia.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  id="btn-run-job-hunter-now"
                  onClick={handleRunJobHunterNow}
                  disabled={isRunningHunter}
                  className="px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                  {isRunningHunter ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Running...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-white" />
                      <span>▶ Jalankan Job Hunter Sekarang</span>
                    </>
                  )}
                </button>

                <button
                  id="btn-run-cleanup-now"
                  onClick={handleRunCleanupNow}
                  disabled={isCleaning}
                  className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
                >
                  {isCleaning ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Clock className="w-4 h-4 text-slate-500" />
                  )}
                  <span>🧹 Bersihkan Lowongan &gt; 5 Hari</span>
                </button>
              </div>
            </div>

            {/* Run Feedback / Results */}
            {hunterRunResult && (
              <div className="mt-5 p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-xs">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>Hasil Nyata AI Job Hunter (Wilayah Provinsi Jawa Barat):</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                  <div className="bg-white p-2.5 rounded-lg border border-emerald-100 text-center">
                    <span className="text-[10px] text-slate-400 block font-bold">Total Ditemukan</span>
                    <span className="text-base font-black text-slate-800">{hunterRunResult.discovered}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-emerald-100 text-center">
                    <span className="text-[10px] text-emerald-600 block font-bold">Lolos & Disimpan</span>
                    <span className="text-base font-black text-emerald-600">{hunterRunResult.inserted}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-emerald-100 text-center">
                    <span className="text-[10px] text-blue-600 block font-bold">Diperbarui</span>
                    <span className="text-base font-black text-blue-600">{hunterRunResult.updated}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-emerald-100 text-center">
                    <span className="text-[10px] text-slate-400 block font-bold">Duplikat</span>
                    <span className="text-base font-black text-slate-700">{hunterRunResult.duplicates}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-emerald-100 text-center">
                    <span className="text-[10px] text-rose-600 block font-bold">Total Ditolak</span>
                    <span className="text-base font-black text-rose-600">
                      {hunterRunResult.rejected ?? (hunterRunResult.validationFailed || 0)}
                    </span>
                  </div>
                </div>

                {/* Granular Rejection Breakdown */}
                <div className="bg-white/90 p-3 rounded-lg border border-rose-200 text-xs">
                  <span className="text-[11px] font-bold text-slate-700 block mb-1.5">
                    Rincian Alasan Penolakan (Strict Zero-Tolerance):
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px]">
                    <div className="p-1.5 bg-rose-50/70 rounded text-center">
                      <span className="text-slate-500 block text-[10px]">Di Luar Jawa Barat</span>
                      <strong className="text-rose-700 font-bold">{hunterRunResult.rejectedOutsideWestJava || 0}</strong>
                    </div>
                    <div className="p-1.5 bg-rose-50/70 rounded text-center">
                      <span className="text-slate-500 block text-[10px]">Tanpa Alamat Fisik</span>
                      <strong className="text-rose-700 font-bold">{hunterRunResult.rejectedNoAddress || 0}</strong>
                    </div>
                    <div className="p-1.5 bg-rose-50/70 rounded text-center">
                      <span className="text-slate-500 block text-[10px]">Tanpa Kontak (Email/Telp)</span>
                      <strong className="text-rose-700 font-bold">{hunterRunResult.rejectedNoContact || 0}</strong>
                    </div>
                    <div className="p-1.5 bg-rose-50/70 rounded text-center">
                      <span className="text-slate-500 block text-[10px]">Perusahaan Tidak Valid</span>
                      <strong className="text-rose-700 font-bold">{hunterRunResult.rejectedInvalidCompany || 0}</strong>
                    </div>
                    <div className="p-1.5 bg-rose-50/70 rounded text-center">
                      <span className="text-slate-500 block text-[10px]">Sumber/URL Tidak Valid</span>
                      <strong className="text-rose-700 font-bold">{hunterRunResult.rejectedInvalidSource || 0}</strong>
                    </div>
                  </div>
                </div>

                {hunterRunResult.errors && hunterRunResult.errors.length > 0 && (
                  <div className="mt-2 text-[11px] text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200">
                    <strong>Catatan sistem:</strong> {hunterRunResult.errors.join(', ')}
                  </div>
                )}
              </div>
            )}

            {hunterError && (
              <div className={`mt-5 p-4 rounded-xl text-xs border ${
                hunterError.toLowerCase().includes('quota') || hunterError.includes('429')
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}>
                <div className="flex items-center gap-2 font-bold mb-1.5">
                  {hunterError.toLowerCase().includes('quota') || hunterError.includes('429') ? (
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>
                    {hunterError.toLowerCase().includes('quota') || hunterError.includes('429')
                      ? 'Batas Kuota Gemini API Tercapai (Rate Limit)'
                      : 'Eksekusi Gagal'}
                  </span>
                </div>
                <p className="leading-relaxed">{hunterError}</p>
                {(hunterError.toLowerCase().includes('quota') || hunterError.includes('429')) && (
                  <div className="mt-3 pt-2.5 border-t border-amber-200/70 text-[11px] text-amber-800 flex items-center justify-between flex-wrap gap-2">
                    <span>Aplikasi tetap aktif melayani data lowongan yang tersimpan.</span>
                    <a
                      href="https://ai.google.dev/gemini-api/docs/rate-limits"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline font-semibold hover:text-amber-950 inline-flex items-center gap-1"
                    >
                      Pelajari Kuota Gemini API &rarr;
                    </a>
                  </div>
                )}
              </div>
            )}

            {cleanupResult && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-600 shrink-0" />
                <span>{cleanupResult}</span>
              </div>
            )}
          </div>

          {/* Configuration Card */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs">
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Settings className="w-4 h-4 text-slate-500" />
              <span>Konfigurasi Pencarian Wilayah & Batas Waktu</span>
            </h3>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Wilayah Prioritas Pencarian (Indonesia)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {LOCATIONS.filter((l) => l !== 'Semua Lokasi').map((loc) => (
                    <span
                      key={loc}
                      className="px-2.5 py-1 bg-slate-100 text-slate-800 rounded-lg font-semibold text-xs flex items-center gap-1"
                    >
                      <Globe className="w-3 h-3 text-blue-600" />
                      {loc}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                  <span className="text-[11px] font-bold text-slate-500 block">Batas Umur Lowongan</span>
                  <p className="text-sm font-extrabold text-slate-800 mt-1">5 Hari</p>
                  <span className="text-[10px] text-slate-400">Otomatis dihapus / expired</span>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                  <span className="text-[11px] font-bold text-slate-500 block">Jadwal Otomatis (Scheduler)</span>
                  <p className="text-sm font-extrabold text-slate-800 mt-1">1x Sehari (00:00)</p>
                  <span className="text-[10px] text-slate-400">Zona Asia/Jakarta</span>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                  <span className="text-[11px] font-bold text-slate-500 block">Model AI & Grounding</span>
                  <p className="text-sm font-extrabold text-slate-800 mt-1">Gemini 3.8 Flash</p>
                  <span className="text-[10px] text-slate-400">Google Search Grounding</span>
                </div>
              </div>
            </div>
          </div>

          {/* Deployment Requirements Checklist */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-2xl shadow-sm">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2 mb-2">
              <ShieldCheck className="w-4 h-4 text-blue-400" />
              <span>Panduan Layanan Cloud & Firebase Deployment</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Untuk mendeploy Scheduled Cloud Functions (`runJobHunter` dan `cleanupExpiredJobs`)
              ke project Firebase Anda, layanan berikut wajib diaktifkan pada Google Cloud Console:
            </p>

            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Firebase Blaze Plan:</strong> Diperlukan untuk outgoing network requests ke Gemini API & Cloud Scheduler.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Cloud Functions v2 & Cloud Scheduler API:</strong> Diperlukan untuk eksekusi terjadwal otomatis (Asia/Jakarta).</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Secret Manager API:</strong> Untuk menyimpan `GEMINI_API_KEY` secara aman di backend.</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-700/80 text-[11px] font-mono text-blue-300">
              Perintah deploy: <code className="bg-slate-950 px-2 py-1 rounded text-white">firebase deploy --only functions,firestore</code>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: AI LOGS */}
      {activeAdminTab === 'ai_logs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
              Riwayat Eksekusi AI Job Hunter (Firestore: jobHunterLogs)
            </h3>
            <span className="text-xs text-slate-500 font-semibold">
              {logs.length} Log Tercatat
            </span>
          </div>

          {logs.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-500">
              Belum ada log eksekusi tercatat di Firestore.
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          log.status === 'success'
                            ? 'bg-emerald-100 text-emerald-800'
                            : log.status === 'running'
                            ? 'bg-amber-100 text-amber-800 animate-pulse'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {log.status.toUpperCase()}
                      </span>
                      <span className="text-xs font-bold text-slate-800">
                        {log.executedBy || 'System'}
                      </span>
                    </div>

                    <span className="text-[11px] text-slate-400 font-mono">
                      {new Date(log.startedAt).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs pt-1">
                    <div className="bg-slate-50 p-2 rounded-lg text-center">
                      <span className="text-[10px] text-slate-400 block font-semibold">Total Ditemukan</span>
                      <span className="font-extrabold text-slate-800">{log.totalDiscovered ?? log.jobsDiscovered}</span>
                    </div>
                    <div className="bg-emerald-50 p-2 rounded-lg text-center">
                      <span className="text-[10px] text-emerald-600 block font-semibold">Lolos Jawa Barat</span>
                      <span className="font-extrabold text-emerald-700">{log.totalAccepted ?? log.jobsInserted}</span>
                    </div>
                    <div className="bg-blue-50 p-2 rounded-lg text-center">
                      <span className="text-[10px] text-blue-600 block font-semibold">Diperbarui</span>
                      <span className="font-extrabold text-blue-700">{log.jobsUpdated}</span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg text-center">
                      <span className="text-[10px] text-slate-400 block font-semibold">Duplikat</span>
                      <span className="font-extrabold text-slate-700">{log.duplicates}</span>
                    </div>
                    <div className="bg-rose-50 p-2 rounded-lg text-center">
                      <span className="text-[10px] text-rose-600 block font-semibold">Total Ditolak</span>
                      <span className="font-extrabold text-rose-700">
                        {log.totalRejected ?? (log.rejected + (log.validationFailed || 0))}
                      </span>
                    </div>
                  </div>

                  {/* Rejection Details */}
                  {((log.rejectedOutsideWestJava || 0) > 0 ||
                    (log.rejectedNoAddress || 0) > 0 ||
                    (log.rejectedNoContact || 0) > 0 ||
                    (log.rejectedInvalidCompany || 0) > 0 ||
                    (log.rejectedInvalidSource || 0) > 0) && (
                    <div className="flex flex-wrap gap-1.5 pt-1 text-[10px]">
                      {(log.rejectedOutsideWestJava || 0) > 0 && (
                        <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded">
                          Luar Jabar: {log.rejectedOutsideWestJava}
                        </span>
                      )}
                      {(log.rejectedNoAddress || 0) > 0 && (
                        <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded">
                          Tanpa Alamat: {log.rejectedNoAddress}
                        </span>
                      )}
                      {(log.rejectedNoContact || 0) > 0 && (
                        <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded">
                          Tanpa Kontak: {log.rejectedNoContact}
                        </span>
                      )}
                      {(log.rejectedInvalidCompany || 0) > 0 && (
                        <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded">
                          Perusahaan Invalid: {log.rejectedInvalidCompany}
                        </span>
                      )}
                      {(log.rejectedInvalidSource || 0) > 0 && (
                        <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded">
                          Sumber Invalid: {log.rejectedInvalidSource}
                        </span>
                      )}
                    </div>
                  )}

                  {log.errors && log.errors.length > 0 && (
                    <div className="text-[11px] text-rose-700 bg-rose-50/80 p-2 rounded-lg">
                      {log.errors.join('; ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: SEMUA LOWONGAN FIRESTORE */}
      {activeAdminTab === 'lowongan' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
              Daftar Lowongan Nyata ({jobs.length} Total di Firestore)
            </h3>
            <button
              onClick={() => setActiveAdminTab('lowongan_baru')}
              className="inline-flex items-center gap-1 text-xs font-bold bg-blue-600 text-white px-3 py-1.5 rounded-xl hover:bg-blue-700"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Manual</span>
            </button>
          </div>

          {loadingJobs ? (
            <div className="py-12 text-center text-xs text-slate-500">Memuat data dari Firestore...</div>
          ) : jobs.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-500">
              Belum ada lowongan di Cloud Firestore.
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs flex items-start justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-slate-900 truncate">{job.title}</h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        job.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {job.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 font-semibold mt-0.5">
                      {job.company} • {job.location} • {job.category}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                      <span>Gaji: <strong>{job.salary || 'Tidak dicantumkan'}</strong></span>
                      <span>Sumber: <strong>{job.sourceName}</strong></span>
                      {job.sourceUrl && (
                        <a
                          href={job.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 underline flex items-center gap-0.5"
                        >
                          <span>URL Asli</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>

                  <button
                    id={`btn-delete-job-${job.id}`}
                    onClick={() => handleDeleteJob(job.id)}
                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                    title="Hapus Lowongan"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: TAMBAH LOWONGAN MANUAL */}
      {activeAdminTab === 'lowongan_baru' && (
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs">
          <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider mb-4">
            Tambah Lowongan Terverifikasi Manual ke Firestore
          </h3>

          {jobSubmitMsg && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold">
              {jobSubmitMsg}
            </div>
          )}

          <form onSubmit={handleCreateJobSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Posisi Lowongan *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Contoh: Staff Administrasi Kantor"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Perusahaan *</label>
                <input
                  type="text"
                  required
                  value={newCompany}
                  onChange={(e) => setNewCompany(e.target.value)}
                  placeholder="Contoh: PT Sumber Jaya Nusantara"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Lokasi (Kabupaten/Kota Jabar) *</label>
                <select
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                >
                  {LOCATIONS.filter((l) => l !== 'Semua Lokasi').map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Kategori</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                >
                  {CATEGORIES.filter((c) => c !== 'Semua Kategori').map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Gaji (Boleh dikosongkan)</label>
                <input
                  type="text"
                  value={newSalary}
                  onChange={(e) => setNewSalary(e.target.value)}
                  placeholder="Kosongkan jika tidak tertera"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Alamat Fisik Jawa Barat & Kontak Resmi */}
            <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Alamat Fisik Lengkap Perusahaan di Jawa Barat *
                </label>
                <input
                  type="text"
                  required
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  placeholder="Contoh: Jl. Soekarno Hatta No. 456, Batununggal, Kota Bandung, Jawa Barat"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Email Resmi Perusahaan
                  </label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="hrd@perusahaan.co.id"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    No. Telepon / WhatsApp Resmi
                  </label>
                  <input
                    type="tel"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="022-1234567 atau 0812xxxx"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Sumber Asli</label>
                <input
                  type="text"
                  value={newSourceName}
                  onChange={(e) => setNewSourceName(e.target.value)}
                  placeholder="Contoh: Portal Karir Resmi Perusahaan"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">URL Sumber Pendaftaran Asli *</label>
                <input
                  type="url"
                  required
                  value={newSourceUrl}
                  onChange={(e) => setNewSourceUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Deskripsi Pekerjaan</label>
              <textarea
                rows={3}
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Rincian tugas dan tanggung jawab..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Persyaratan (Satu baris per syarat)</label>
              <textarea
                rows={3}
                value={newReq}
                onChange={(e) => setNewReq(e.target.value)}
                placeholder="Pendidikan min. SMA/SMK&#10;Pengalaman min. 1 tahun&#10;Menguasai Microsoft Office"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmittingJob}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2"
            >
              {isSubmittingJob && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Simpan ke Firestore</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 6: PENGGUNA */}
      {activeAdminTab === 'pengguna' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
              Daftar Pengguna ({users.length} Akun Terdaftar di Firestore)
            </h3>
          </div>

          {loadingUsers ? (
            <div className="py-12 text-center text-xs text-slate-500">Memuat data pengguna...</div>
          ) : users.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-500">
              Belum ada pengguna terdaftar di Cloud Firestore.
            </div>
          ) : (
            <div className="space-y-3">
              {users.map((u) => (
                <div
                  key={u.uid}
                  className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900">{u.name}</h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        u.role === 'admin' ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {u.role ? u.role.toUpperCase() : 'USER'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">{u.email}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-xl flex items-center gap-1 ${
                      u.subscriptionStatus === 'PREMIUM'
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {u.subscriptionStatus === 'PREMIUM' && <Crown className="w-3.5 h-3.5 text-amber-600" />}
                      <span>{u.subscriptionStatus}</span>
                    </span>

                    <button
                      onClick={() => handleToggleUserSubscription(u)}
                      className="text-xs font-semibold px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700"
                    >
                      Ubah ke {u.subscriptionStatus === 'PREMIUM' ? 'FREE' : 'PREMIUM'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 7: LANGGANAN PREMIUM */}
      {activeAdminTab === 'premium' && (
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-4">
          <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
            Pengaturan & Ringkasan Langganan Premium
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl">
              <span className="text-xs font-bold text-amber-800 block">Total Pengguna Premium</span>
              <p className="text-2xl font-black text-amber-700 mt-1">
                {users.filter((u) => u.subscriptionStatus === 'PREMIUM').length}
              </p>
              <span className="text-[11px] text-amber-700/80">Memiliki akses ke link sumber asli & rekomendasi AI</span>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-xs font-bold text-slate-700 block">Total Pengguna Free</span>
              <p className="text-2xl font-black text-slate-800 mt-1">
                {users.filter((u) => u.subscriptionStatus === 'FREE').length}
              </p>
              <span className="text-[11px] text-slate-500">Melihat ringkasan lowongan tanpa link sumber langsung</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB MODERASI & KEAMANAN (TAHAP 5) */}
      {activeAdminTab === 'moderasi' && user && (
        <ModerationCenterView currentUser={user} />
      )}

      {/* TAB 8: PENGATURAN & DEPLOYMENT */}
      {activeAdminTab === 'pengaturan' && (
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-4 text-xs">
          <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
            Informasi Sistem & Konfigurasi Firebase
          </h3>

          <div className="space-y-2">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Database Engine:</span>
              <strong className="text-slate-800">Google Cloud Firestore</strong>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">AI Framework:</span>
              <strong className="text-slate-800">@google/genai (Gemini 3.8 Flash)</strong>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Search Grounding:</span>
              <strong className="text-slate-800">Google Search Tools Enabled</strong>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Timezone Engine:</span>
              <strong className="text-slate-800">Asia/Jakarta (WIB)</strong>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Batas Umur Lowongan:</span>
              <strong className="text-slate-800">Maksimal 5 Hari</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
