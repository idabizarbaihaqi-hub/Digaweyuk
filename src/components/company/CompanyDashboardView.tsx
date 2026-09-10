import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  Award,
  FileQuestion,
  Sparkles,
  Plus,
  ArrowRight,
  ShieldCheck,
  Building2,
  TrendingUp,
} from 'lucide-react';
import { CompanyProfile, Job, JobApplication, Interview, User } from '../../types';
import {
  subscribeCompanyApplications,
  subscribeCompanyInterviews,
  getCompanyJobs,
} from '../../services/companyService';

interface CompanyDashboardViewProps {
  company: CompanyProfile | null;
  user: User | null;
  onNavigateTab: (tab: string) => void;
  onOpenUpgradeModal: () => void;
}

export const CompanyDashboardView: React.FC<CompanyDashboardViewProps> = ({
  company,
  user,
  onNavigateTab,
  onOpenUpgradeModal,
}) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const companyId = company?.id || user?.uid || '';
  const isPremium = company?.subscription?.status === 'PREMIUM';

  useEffect(() => {
    if (!companyId) {
      setLoading(false);
      return;
    }

    let unsubApps: (() => void) | null = null;
    let unsubInterviews: (() => void) | null = null;

    const loadData = async () => {
      setLoading(true);
      try {
        const companyJobs = await getCompanyJobs(companyId);
        setJobs(companyJobs || []);
      } catch (err) {
        console.error('Error loading company jobs:', err);
      }

      unsubApps = subscribeCompanyApplications(companyId, (apps) => {
        setApplications(apps);
      });

      unsubInterviews = subscribeCompanyInterviews(companyId, (invs) => {
        setInterviews(invs);
        setLoading(false);
      });
    };

    loadData();

    return () => {
      if (unsubApps) unsubApps();
      if (unsubInterviews) unsubInterviews();
    };
  }, [companyId]);

  // Real statistics calculated directly from authentic Firestore documents
  const activeJobsCount = jobs.filter((j) => j.status === 'active').length;
  const totalApplicantsCount = applications.length;
  const inSelectionCount = applications.filter(
    (a) => a.stage === 'SCREENING' || a.stage === 'INTERVIEW' || a.stage === 'ONLINE TEST' || a.stage === 'INTERVIEW HR' || a.stage === 'FINAL REVIEW'
  ).length;
  const upcomingInterviewsCount = interviews.filter(
    (i) => i.status === 'SCHEDULED' || i.status === 'OPEN'
  ).length;
  const passedCandidatesCount = applications.filter((a) => a.stage === 'DITERIMA').length;
  const rejectedCandidatesCount = applications.filter((a) => a.stage === 'DITOLAK').length;

  return (
    <div className="space-y-6">
      {/* Top Banner / Company Greeting */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-blue-200 text-xs font-semibold backdrop-blur-xs">
              <Building2 className="w-3.5 h-3.5" />
              <span>Portal Rekrutmen Resmi DIGAWE YUK</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {company?.name || user?.name || 'Perusahaan Mitra'}
            </h1>
            <p className="text-xs sm:text-sm text-blue-100 max-w-xl leading-relaxed">
              Kelola lowongan kerja, pipeline seleksi kandidat, dan lakukan interview online berbasis AI secara terpadu.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isPremium ? (
              <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-amber-400 text-slate-900 font-extrabold text-xs shadow-md">
                <Sparkles className="w-4 h-4 fill-slate-900" />
                <span>PREMIUM PARTNER</span>
              </div>
            ) : (
              <button
                onClick={onOpenUpgradeModal}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-900 font-extrabold text-xs shadow-lg transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4 fill-slate-900" />
                <span>Upgrade ke Premium</span>
              </button>
            )}

            <button
              onClick={() => onNavigateTab('buat_lowongan')}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-100 text-blue-800 font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Pasang Lowongan</span>
            </button>
          </div>
        </div>
      </div>

      {/* Real Firestore Statistics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-blue-600 mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Lowongan Aktif</span>
            <Briefcase className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-slate-900">{loading ? '...' : activeJobsCount}</div>
          <div className="text-[10px] text-slate-400 mt-1">Tayang di Jawa Barat</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-indigo-600 mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Pelamar</span>
            <Users className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-slate-900">{loading ? '...' : totalApplicantsCount}</div>
          <div className="text-[10px] text-slate-400 mt-1">Semua posisi</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-amber-600 mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Dalam Seleksi</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-slate-900">{loading ? '...' : inSelectionCount}</div>
          <div className="text-[10px] text-slate-400 mt-1">Screening & Interview</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-cyan-600 mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Interview Aktif</span>
            <Award className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-slate-900">{loading ? '...' : upcomingInterviewsCount}</div>
          <div className="text-[10px] text-slate-400 mt-1">Ruang online dibuka</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-emerald-600 mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Kandidat Lulus</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-slate-900">{loading ? '...' : passedCandidatesCount}</div>
          <div className="text-[10px] text-slate-400 mt-1">Status diterima</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-rose-600 mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Ditolak</span>
            <XCircle className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-slate-900">{loading ? '...' : rejectedCandidatesCount}</div>
          <div className="text-[10px] text-slate-400 mt-1">Tidak memenuhi syarat</div>
        </div>
      </div>

      {/* Quick Action Hub */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          onClick={() => onNavigateTab('pipeline')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:bg-blue-600 group-hover:text-white transition-colors">
            <Users className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-extrabold text-slate-900 mb-1">Recruitment Pipeline</h3>
          <p className="text-xs text-slate-500 mb-3 leading-relaxed">
            Pantau kandidat pelamar melalui 8 tahap seleksi dari Screening hingga Final Review.
          </p>
          <div className="flex items-center gap-1 text-xs font-bold text-blue-600 group-hover:translate-x-1 transition-transform">
            <span>Buka Pipeline</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>

        <div
          onClick={() => onNavigateTab('interviews')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
            <Award className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-extrabold text-slate-900 mb-1">Online Interview Room</h3>
          <p className="text-xs text-slate-500 mb-3 leading-relaxed">
            Buat ruang interview online berbatas waktu dengan kode ruangan unik untuk kandidat.
          </p>
          <div className="flex items-center gap-1 text-xs font-bold text-indigo-600 group-hover:translate-x-1 transition-transform">
            <span>Kelola Interview</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>

        <div
          onClick={() => onNavigateTab('bank_soal')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 hover:border-amber-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3 group-hover:bg-amber-600 group-hover:text-white transition-colors">
            <Sparkles className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-extrabold text-slate-900 mb-1">Bank Soal & AI Generator</h3>
          <p className="text-xs text-slate-500 mb-3 leading-relaxed">
            Gunakan AI cerdas server-side untuk membuat soal tes teknis, situasional, dan essay secara otomatis.
          </p>
          <div className="flex items-center gap-1 text-xs font-bold text-amber-600 group-hover:translate-x-1 transition-transform">
            <span>Buka Bank Soal</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* Recent Applications Preview */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">Pelamar Terbaru</h3>
            <p className="text-xs text-slate-500">Kandidat yang baru melamar lowongan pekerjaan Anda</p>
          </div>
          <button
            onClick={() => onNavigateTab('pipeline')}
            className="text-xs font-bold text-blue-600 hover:text-blue-800"
          >
            Lihat Semua
          </button>
        </div>

        {applications.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="font-medium">Belum ada data pelamar.</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Pelamar yang mendaftar ke lowongan Anda akan muncul otomatis di sini.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {applications.slice(0, 5).map((app) => (
              <div key={app.id} className="py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 truncate">{app.candidateName}</div>
                  <div className="text-[11px] text-slate-500 truncate">
                    Posisi: {app.jobTitle} • {new Date(app.appliedAt).toLocaleDateString('id-ID')}
                  </div>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
                    {app.stage}
                  </span>
                  <button
                    onClick={() => onNavigateTab('pipeline')}
                    className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-50"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
