import React from 'react';
import { Heart, Lock, Crown, ArrowRight, BookmarkCheck, Search } from 'lucide-react';
import { Job, SubscriptionStatus } from '../types';
import { JobCard } from './JobCard';

interface SavedJobsViewProps {
  subscriptionStatus: SubscriptionStatus;
  savedJobs: Job[];
  onSelectJob: (job: Job) => void;
  onToggleSave: (job: Job) => void;
  onGoToPremium: () => void;
  onGoToSearch: () => void;
}

export const SavedJobsView: React.FC<SavedJobsViewProps> = ({
  subscriptionStatus,
  savedJobs,
  onSelectJob,
  onToggleSave,
  onGoToPremium,
  onGoToSearch,
}) => {
  const isPremium = subscriptionStatus === 'PREMIUM';

  // If user is FREE: Show clear Upgrade Screen as required by prompt
  if (!isPremium) {
    return (
      <div id="saved-jobs-free-locked" className="px-4 py-8 max-w-md mx-auto text-center">
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8" />
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold mb-2">
            <Crown className="w-3.5 h-3.5 text-amber-600" />
            FITUR KHUSUS PREMIUM
          </span>

          <h2 className="text-xl font-extrabold text-slate-900 mt-1">
            Lowongan Tersimpan
          </h2>

          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
            Simpan lowongan favoritmu dan akses kembali kapan saja dengan{' '}
            <strong>DIGAWE YUK Premium</strong>. Jangan biarkan kesempatan karir
            impian terlewatkan.
          </p>

          <div className="mt-5 p-3.5 bg-slate-50 rounded-xl text-left space-y-2 border border-slate-100 text-xs text-slate-700">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-500 fill-rose-100" />
              <span>Simpan hingga ratusan lowongan kerja</span>
            </div>
            <div className="flex items-center gap-2">
              <BookmarkCheck className="w-4 h-4 text-blue-600" />
              <span>Akses cepat dari semua perangkat</span>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-2.5">
            <button
              id="btn-upgrade-saved-page"
              onClick={onGoToPremium}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2"
            >
              <Crown className="w-4 h-4 text-amber-300" />
              <span>Upgrade ke Premium Sekarang</span>
            </button>
            <button
              id="btn-explore-jobs-saved"
              onClick={onGoToSearch}
              className="w-full py-2.5 px-4 text-slate-600 hover:text-slate-900 font-semibold text-xs rounded-xl hover:bg-slate-100 transition-colors"
            >
              Cari Lowongan Dulu
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If user is PREMIUM: Show saved list
  return (
    <div id="saved-jobs-premium-view" className="space-y-4 max-w-2xl mx-auto px-4 pt-2 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <span>Lowongan Tersimpan</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
              {savedJobs.length}
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar lowongan yang telah Anda simpan.
          </p>
        </div>
      </div>

      {savedJobs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-400 flex items-center justify-center mx-auto mb-3">
            <Heart className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800">
            Belum Ada Lowongan Tersimpan
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            Tekan icon hati ❤️ pada lowongan yang Anda sukai untuk menyimpannya di
            sini.
          </p>
          <button
            id="btn-browse-jobs-empty"
            onClick={onGoToSearch}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-xs shadow-xs hover:bg-blue-700"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Jelajahi Lowongan</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {savedJobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              subscriptionStatus={subscriptionStatus}
              isSaved={true}
              onSelectJob={onSelectJob}
              onToggleSave={onToggleSave}
              onTriggerPremiumModal={() => {}}
            />
          ))}
        </div>
      )}
    </div>
  );
};
