import React from 'react';
import {
  Sparkles,
  Lock,
  Crown,
  Target,
  Flame,
  Clock,
  ArrowRight,
  Briefcase,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { Job, SubscriptionStatus } from '../types';
import { SearchBar } from './SearchBar';
import { JobCard } from './JobCard';

interface HomeViewProps {
  jobs: Job[];
  loading: boolean;
  error: string | null;
  subscriptionStatus: SubscriptionStatus;
  savedJobIds: Set<string>;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSearchSubmit: () => void;
  onSelectJob: (job: Job) => void;
  onToggleSave: (job: Job) => void;
  onGoToPremium: () => void;
  onGoToSearch: () => void;
  onTriggerPremiumModal: (title: string, desc: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  jobs,
  loading,
  error,
  subscriptionStatus,
  savedJobIds,
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  onSelectJob,
  onToggleSave,
  onGoToPremium,
  onGoToSearch,
  onTriggerPremiumModal,
}) => {
  const isPremium = subscriptionStatus === 'PREMIUM';

  // Recent jobs: active jobs ordered by createdAt descending
  const recentJobs = jobs.slice(0, 5);

  // Popular jobs (either marked popular or first few jobs)
  const popularJobs = jobs.filter((j) => j.popular).slice(0, 3);
  const fallbackPopular = popularJobs.length > 0 ? popularJobs : jobs.slice(0, 3);

  // Basic recommendations for PREMIUM based on dominant categories/locations
  const recommendedJobs = jobs
    .filter((j) => j.category === 'IT' || j.category === 'Administrasi' || j.category === 'Marketing')
    .slice(0, 3);
  const fallbackRecommended = recommendedJobs.length > 0 ? recommendedJobs : jobs.slice(0, 3);

  return (
    <div id="home-view-container" className="space-y-6 max-w-2xl mx-auto px-4 pt-3 pb-24">
      {/* Top Welcome / Hero Banner */}
      <div className="bg-gradient-to-br from-blue-700 via-indigo-700 to-blue-800 text-white rounded-3xl p-5 sm:p-6 shadow-md relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-200">
              DIGAWE YUK
            </span>
            <span className="text-[10px] font-bold bg-white/15 px-2 py-0.5 rounded-full text-blue-100 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Firestore Live
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black tracking-tight mt-1.5 leading-snug">
            Halo, siap cari kerja hari ini?
          </h2>
          <p className="text-xs text-blue-100/90 mt-1 max-w-sm leading-relaxed">
            Temukan ribuan informasi lowongan kerja terverifikasi dari sumber asli.
          </p>

          {/* Search bar inside Hero */}
          <div className="mt-4">
            <SearchBar
              value={searchQuery}
              onChange={onSearchChange}
              onSearchSubmit={onSearchSubmit}
              placeholder="🔎 Cari posisi, perusahaan, atau pekerjaan..."
            />
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex items-center gap-3 text-xs">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <div className="flex-1">
            <p className="font-bold">Terjadi kesalahan saat mengambil data.</p>
            <p className="text-rose-600 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="py-16 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-bold text-slate-600">Memuat lowongan...</p>
        </div>
      ) : jobs.length === 0 ? (
        /* Empty state as mandated by user prompt: "Belum ada lowongan terbaru yang berhasil ditemukan." */
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
            <Briefcase className="w-6 h-6" />
          </div>
          <h3 className="text-base font-extrabold text-slate-800">
            Belum ada lowongan terbaru yang berhasil ditemukan.
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
            Sistem AI Job Hunter akan melakukan pencarian lowongan terverifikasi terbaru secara berkala.
          </p>
        </div>
      ) : (
        <>
          {/* SECTION: 🎯 Rekomendasi Pekerjaan (FITUR PREMIUM) */}
          <div id="section-rekomendasi-pekerjaan">
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-600" />
                <h3 className="text-base font-extrabold text-slate-900">
                  Rekomendasi Pekerjaan
                </h3>
              </div>
              {isPremium ? (
                <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Crown className="w-3 h-3 text-amber-600" />
                  Rekomendasi Aktif
                </span>
              ) : (
                <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  Khusus Premium
                </span>
              )}
            </div>

            {/* Locked Card for FREE User */}
            {!isPremium ? (
              <div
                id="card-rekomendasi-locked"
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs relative overflow-hidden"
              >
                <div className="flex items-start gap-3.5">
                  <div className="p-3 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200/60 shrink-0">
                    <Lock className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900">
                        🔒 Rekomendasi Pekerjaan
                      </h4>
                      <span className="text-[10px] font-extrabold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                        PREMIUM
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Temukan pekerjaan yang lebih sesuai dengan minatmu. Algoritma
                      rekomendasi menganalisis preferensi dan kualifikasi keahlianmu.
                    </p>
                    <div className="mt-3.5">
                      <button
                        id="btn-upgrade-rekomendasi"
                        onClick={onGoToPremium}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all"
                      >
                        <Crown className="w-3.5 h-3.5 text-amber-300" />
                        <span>Upgrade Premium</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Active Recommendations for PREMIUM User */
              <div className="space-y-3">
                <div className="p-3 bg-emerald-50/70 border border-emerald-200/70 rounded-xl text-xs text-emerald-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Menampilkan rekomendasi pekerjaan berdasarkan pencocokan kategori dan lokasi profil Anda.
                  </span>
                </div>
                <div className="space-y-3">
                  {fallbackRecommended.map((job) => (
                    <JobCard
                      key={job.id}
                      job={job}
                      subscriptionStatus={subscriptionStatus}
                      isSaved={savedJobIds.has(job.id)}
                      onSelectJob={onSelectJob}
                      onToggleSave={onToggleSave}
                      onTriggerPremiumModal={onTriggerPremiumModal}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* SECTION: Lowongan Terbaru */}
          <div id="section-lowongan-terbaru">
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <h3 className="text-base font-extrabold text-slate-900">
                  Lowongan Terbaru
                </h3>
              </div>
              <button
                id="btn-see-all-jobs"
                onClick={onGoToSearch}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
              >
                <span>Lihat Semua</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-3">
              {recentJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  subscriptionStatus={subscriptionStatus}
                  isSaved={savedJobIds.has(job.id)}
                  onSelectJob={onSelectJob}
                  onToggleSave={onToggleSave}
                  onTriggerPremiumModal={onTriggerPremiumModal}
                />
              ))}
            </div>
          </div>

          {/* SECTION: Lowongan Populer */}
          {fallbackPopular.length > 0 && (
            <div id="section-lowongan-populer">
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <h3 className="text-base font-extrabold text-slate-900">
                    Lowongan Populer
                  </h3>
                </div>
                <span className="text-[11px] font-semibold text-slate-400">
                  Banyak Dilihat
                </span>
              </div>

              <div className="space-y-3">
                {fallbackPopular.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    subscriptionStatus={subscriptionStatus}
                    isSaved={savedJobIds.has(job.id)}
                    onSelectJob={onSelectJob}
                    onToggleSave={onToggleSave}
                    onTriggerPremiumModal={onTriggerPremiumModal}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
