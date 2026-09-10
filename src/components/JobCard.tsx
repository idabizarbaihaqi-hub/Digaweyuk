import React from 'react';
import {
  MapPin,
  Clock,
  CheckCircle,
  Heart,
  ChevronRight,
  AlertCircle,
  Briefcase,
  DollarSign,
} from 'lucide-react';
import { Job, SubscriptionStatus } from '../types';

interface JobCardProps {
  job: Job;
  subscriptionStatus: SubscriptionStatus;
  isSaved?: boolean;
  onSelectJob: (job: Job) => void;
  onToggleSave: (job: Job) => void;
  onTriggerPremiumModal: (title: string, desc: string) => void;
}

export const JobCard: React.FC<JobCardProps> = ({
  job,
  subscriptionStatus,
  isSaved = false,
  onSelectJob,
  onToggleSave,
  onTriggerPremiumModal,
}) => {
  const isPremium = subscriptionStatus === 'PREMIUM';
  const isExpired = job.status === 'expired';
  const companyDisplayName = job.companyName || job.company || 'Perusahaan';

  const handleHeartClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isPremium) {
      onTriggerPremiumModal(
        'Simpan Lowongan',
        'Simpan lowongan favoritmu dan akses kembali kapan saja dengan DIGAWE YUK Premium.'
      );
    } else {
      onToggleSave(job);
    }
  };

  return (
    <div
      id={`job-card-${job.id}`}
      onClick={() => onSelectJob(job)}
      className={`group relative bg-white rounded-2xl border p-4 transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md ${
        isExpired
          ? 'border-slate-200 opacity-75 bg-slate-50/70'
          : 'border-slate-200/90 hover:border-blue-300'
      }`}
    >
      {/* Top row: Company initials badge, title, save heart */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          {/* Avatar icon */}
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 border ${
              isExpired
                ? 'bg-slate-200 text-slate-600 border-slate-300'
                : 'bg-blue-50 text-blue-700 border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-colors'
            }`}
          >
            {companyDisplayName.substring(0, 2).toUpperCase()}
          </div>

          {/* Position and company */}
          <div className="min-w-0">
            <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-700 transition-colors leading-snug truncate">
              {job.title}
            </h3>
            <p className="text-xs font-semibold text-slate-600 truncate mt-0.5">
              {companyDisplayName}
            </p>
          </div>
        </div>

        {/* Heart / Save button */}
        <button
          id={`btn-save-job-${job.id}`}
          onClick={handleHeartClick}
          aria-label={isSaved ? 'Hapus simpanan' : 'Simpan lowongan'}
          className={`p-2 rounded-xl transition-all shrink-0 ${
            isSaved && isPremium
              ? 'bg-rose-50 text-rose-600 ring-1 ring-rose-200'
              : 'text-slate-400 hover:text-rose-500 hover:bg-rose-50'
          }`}
        >
          <Heart
            className={`w-4 h-4 ${
              isSaved && isPremium ? 'fill-rose-500 text-rose-500' : ''
            }`}
          />
        </button>
      </div>

      {/* Badges & Meta info */}
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-600">
        <span className="inline-flex items-center gap-1 font-medium bg-slate-100 px-2.5 py-0.5 rounded-lg text-slate-700">
          <MapPin className="w-3 h-3 text-slate-500" />
          {job.location || 'Jawa Barat'}
        </span>

        <span className="inline-flex items-center gap-1 font-medium bg-slate-100 px-2.5 py-0.5 rounded-lg text-slate-700">
          <Briefcase className="w-3 h-3 text-slate-500" />
          {job.category}
        </span>

        <span
          className={`inline-flex items-center gap-1 font-semibold px-2.5 py-0.5 rounded-lg ${
            job.salary
              ? 'text-emerald-700 bg-emerald-50 border border-emerald-100/80'
              : 'text-slate-500 bg-slate-100'
          }`}
        >
          <DollarSign className="w-3 h-3" />
          {job.salary || 'Informasi gaji tidak dicantumkan.'}
        </span>
      </div>

      {/* Verification status & time discovered */}
      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Badge Status Verifikasi (Requirement 11) */}
          {isExpired ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
              <AlertCircle className="w-3 h-3 text-amber-600" />
              Masa Aktif Berakhir
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded-md">
              <span>🟢</span>
              <span>TERVERIFIKASI</span>
            </span>
          )}

          <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
            <Clock className="w-3 h-3" />
            {job.sourceName || 'Sumber Resmi'}
          </span>
        </div>

        {/* Lihat Detail Button */}
        <button
          id={`btn-detail-${job.id}`}
          onClick={(e) => {
            e.stopPropagation();
            onSelectJob(job);
          }}
          className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 group-hover:translate-x-0.5 transition-transform"
        >
          <span>Lihat Detail</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
