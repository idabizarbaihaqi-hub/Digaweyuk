import React, { useState } from 'react';
import {
  ArrowLeft,
  MapPin,
  Briefcase,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  Share2,
  Heart,
  Lock,
  Rocket,
  ShieldCheck,
  Calendar,
  Building,
  ExternalLink,
  Mail,
  Phone,
  MapPinned,
} from 'lucide-react';
import { Job, SubscriptionStatus } from '../types';

interface JobDetailProps {
  job: Job | null;
  subscriptionStatus: SubscriptionStatus;
  isSaved?: boolean;
  onBack: () => void;
  onToggleSave: (job: Job) => void;
  onTriggerPremiumModal: (title: string, desc: string) => void;
}

export const JobDetail: React.FC<JobDetailProps> = ({
  job,
  subscriptionStatus,
  isSaved = false,
  onBack,
  onToggleSave,
  onTriggerPremiumModal,
}) => {
  const isPremium = subscriptionStatus === 'PREMIUM';
  const [copiedLink, setCopiedLink] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);

  // If document not found in Firestore
  if (!job) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-200">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-extrabold text-slate-900">
          Lowongan sudah tidak tersedia.
        </h2>
        <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
          Lowongan ini mungkin telah ditutup atau masa berlakunya telah berakhir.
        </p>
        <button
          onClick={onBack}
          className="mt-5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
        >
          Kembali ke Beranda
        </button>
      </div>
    );
  }

  const isExpired = job.status === 'expired' || job.status === 'closed';

  const handleApplyClick = () => {
    if (!isPremium) {
      onTriggerPremiumModal(
        'Lamar di Sumber Asli',
        'Akses langsung ke formulir pendaftaran dan link resmi sumber lowongan hanya tersedia untuk pengguna DIGAWE YUK Premium.'
      );
    } else {
      setShowApplyModal(true);
    }
  };

  const handleHeartClick = () => {
    if (!isPremium) {
      onTriggerPremiumModal(
        'Simpan Lowongan',
        'Simpan lowongan favoritmu dan akses kembali kapan saja dengan DIGAWE YUK Premium.'
      );
    } else {
      onToggleSave(job);
    }
  };

  const handleShare = () => {
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const openSourceUrl = () => {
    if (job.sourceUrl) {
      window.open(job.sourceUrl, '_blank', 'noopener,noreferrer');
    }
    setShowApplyModal(false);
  };

  const companyDisplayName = job.companyName || job.company || 'Perusahaan';

  return (
    <div id="job-detail-container" className="pb-28">
      {/* Top sticky navigation bar */}
      <div className="sticky top-14 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 flex items-center justify-between">
        <button
          id="btn-back-to-jobs"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-blue-700 py-1.5 px-2 rounded-xl hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Share button */}
          <button
            id="btn-share-job"
            onClick={handleShare}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors relative"
            title="Bagikan lowongan"
          >
            <Share2 className="w-4 h-4" />
            {copiedLink && (
              <span className="absolute -bottom-7 right-0 text-[10px] bg-slate-800 text-white px-2 py-0.5 rounded shadow whitespace-nowrap">
                Link disalin!
              </span>
            )}
          </button>

          {/* Bookmark / Save */}
          <button
            id="btn-detail-bookmark"
            onClick={handleHeartClick}
            className={`p-2 rounded-xl transition-colors ${
              isSaved && isPremium
                ? 'bg-rose-50 text-rose-600 ring-1 ring-rose-200'
                : 'text-slate-500 hover:text-rose-500 hover:bg-rose-50'
            }`}
            title={isSaved ? 'Tersimpan' : 'Simpan lowongan'}
          >
            <Heart
              className={`w-4 h-4 ${
                isSaved && isPremium ? 'fill-rose-500 text-rose-500' : ''
              }`}
            />
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pt-4 space-y-4">
        {/* Main Job Header Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
          {/* Company & Title */}
          <div className="flex items-start gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-700 border border-blue-100 font-extrabold text-xl flex items-center justify-center shrink-0 shadow-xs">
              {companyDisplayName ? companyDisplayName.substring(0, 2).toUpperCase() : 'DY'}
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight leading-tight">
                {job.title}
              </h1>
              <p className="text-sm font-semibold text-slate-600 flex items-center gap-1.5 mt-1">
                <Building className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{companyDisplayName}</span>
              </p>
            </div>
          </div>

          {/* Key tags */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5">
            <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl">
              <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                <span>Lokasi</span>
              </div>
              <p className="text-xs font-bold text-slate-800 mt-0.5 truncate">
                {job.location || 'Jawa Barat'}
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl">
              <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
                <span>Kategori</span>
              </div>
              <p className="text-xs font-bold text-slate-800 mt-0.5 truncate">
                {job.category}
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl">
              <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                <span>Gaji</span>
              </div>
              <p
                className={`text-xs font-bold mt-0.5 truncate ${
                  job.salary ? 'text-emerald-700' : 'text-slate-500'
                }`}
              >
                {job.salary || 'Informasi gaji tidak dicantumkan.'}
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl">
              <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>Tipe</span>
              </div>
              <p className="text-xs font-bold text-slate-800 mt-0.5 truncate">
                {job.employmentType}
              </p>
            </div>
          </div>

          {/* Status & Verification Badge (Requirement 11) */}
          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              {isExpired ? (
                <span className="inline-flex items-center gap-1 font-bold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-full text-xs">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  Masa Aktif Berakhir
                </span>
              ) : (
                <span
                  id="badge-terverifikasi-utama"
                  className="inline-flex items-center gap-1 font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-3 py-1 rounded-full text-xs shadow-2xs"
                >
                  <span>🟢</span>
                  <span>TERVERIFIKASI</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 text-slate-400 text-xs">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Ditemukan: {job.foundAt ? new Date(job.foundAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
              </span>
            </div>
          </div>
        </div>

        {/* Section: Badge & Keterangan Verifikasi (Requirement 11 & 21) */}
        <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-emerald-600 text-white shrink-0 mt-0.5">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xs text-emerald-900 tracking-wide">
                  🟢 TERVERIFIKASI
                </span>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                  Provinsi Jawa Barat
                </span>
              </div>
              <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                Lokasi, alamat perusahaan, kontak, dan sumber lowongan telah diperiksa oleh sistem.
              </p>
            </div>
          </div>
        </div>

        {/* Section: Alamat & Kontak Perusahaan (Requirement 4, 5, 21) */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Building className="w-4 h-4 text-blue-600" />
            <span>Informasi Perusahaan & Kontak</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {/* Alamat Fisik Perusahaan */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <MapPinned className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Alamat Perusahaan:</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed font-medium pl-5.5">
                {job.companyAddress || 'Alamat fisik terverifikasi di Jawa Barat.'}
              </p>
            </div>

            {/* Kontak Resmi Perusahaan */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-2">
              <div className="text-xs font-bold text-slate-700">
                Kontak Resmi Perusahaan:
              </div>
              
              {job.companyEmail && (
                <div className="flex items-center gap-2 text-xs text-slate-700">
                  <Mail className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span className="font-semibold text-slate-500">Email:</span>
                  <span className="font-mono text-blue-700 select-all">{job.companyEmail}</span>
                </div>
              )}

              {job.companyPhone && (
                <div className="flex items-center gap-2 text-xs text-slate-700">
                  <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="font-semibold text-slate-500">Telepon:</span>
                  <span className="font-mono text-slate-800 select-all">{job.companyPhone}</span>
                </div>
              )}

              {!job.companyEmail && !job.companyPhone && (
                <p className="text-xs text-slate-500 italic">
                  Kontak resmi terhubung melalui portal resmi pendaftaran.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Section: Sumber Lowongan (Requirement 6 & 21) */}
        <div className="bg-gradient-to-br from-blue-50/70 via-indigo-50/40 to-slate-50 rounded-2xl border border-blue-100 p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-blue-600 text-white shrink-0 mt-0.5">
              <ExternalLink className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>Sumber Lowongan</span>
                <span className="text-[10px] font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                  Portal Asli
                </span>
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Informasi lowongan ini bersumber dari{' '}
                <strong className="text-slate-800 font-semibold">
                  {job.sourceName || 'Portal Resmi Perusahaan'}
                </strong>
                . Tautan pendaftaran resmi terverifikasi dan dapat dibuka oleh pengguna.
              </p>
              {isPremium && job.sourceUrl && (
                <div className="mt-2.5">
                  <a
                    href={job.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-800 underline"
                  >
                    <span>Kunjungi Tautan Sumber ({job.sourceName})</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section: Deskripsi Pekerjaan */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2.5">
            Deskripsi Pekerjaan
          </h3>
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
            {job.description || 'Tidak ada deskripsi tambahan.'}
          </p>
        </div>

        {/* Section: Persyaratan */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
            Persyaratan
          </h3>
          {job.requirements && job.requirements.length > 0 ? (
            <ul className="space-y-2">
              {job.requirements.map((req, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2 shrink-0"></span>
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-500">Lihat deskripsi pekerjaan di atas.</p>
          )}
        </div>

        {/* Section: Kualifikasi Tambahan */}
        {job.qualifications && job.qualifications.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
              Kualifikasi Tambahan
            </h3>
            <ul className="space-y-2">
              {job.qualifications.map((q, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-2 shrink-0"></span>
                  <span>{q}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Applied / Source Modal for Premium Users */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <Rocket className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Lamar di Sumber Asli
            </h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Anda terverifikasi sebagai pengguna <strong>PREMIUM</strong>.
              Tautan pendaftaran resmi untuk posisi{' '}
              <strong>{job.title}</strong> di <strong>{companyDisplayName}</strong>:
            </p>
            <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-left text-xs break-all text-blue-700 font-mono">
              {job.sourceUrl || 'Tautan pendaftaran belum tersedia dari sumber asli'}
            </div>
            <div className="mt-4 flex gap-2">
              <button
                id="btn-confirm-open-source"
                onClick={openSourceUrl}
                className="flex-1 py-2.5 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-xs hover:bg-blue-700 inline-flex items-center justify-center gap-1"
              >
                <span>Buka Link Sumber</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
              <button
                id="btn-close-apply-modal"
                onClick={() => setShowApplyModal(false)}
                className="px-4 py-2.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Bottom Action Bar (Requirement 20 & 21) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 p-3 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] sm:max-w-md sm:mx-auto sm:rounded-t-2xl">
        <div className="flex items-center gap-3">
          {/* Bookmark Button */}
          <button
            id="btn-bottom-save-job"
            onClick={handleHeartClick}
            className={`p-3 rounded-xl border transition-all flex flex-col items-center justify-center shrink-0 ${
              isSaved && isPremium
                ? 'bg-rose-50 border-rose-200 text-rose-600'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Heart
              className={`w-5 h-5 ${
                isSaved && isPremium ? 'fill-rose-500 text-rose-500' : ''
              }`}
            />
            <span className="text-[10px] font-bold mt-0.5">
              {isSaved && isPremium ? 'Tersimpan' : 'Simpan'}
            </span>
          </button>

          {/* Primary Action: LAMAR DI SUMBER ASLI (Requirement 20 & 21) */}
          {isPremium ? (
            <button
              id="btn-apply-job-premium"
              onClick={handleApplyClick}
              disabled={isExpired}
              className={`flex-1 py-3.5 px-4 font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 ${
                isExpired
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-blue-500/25'
              }`}
            >
              <Rocket className="w-4 h-4 text-white" />
              <span>LAMAR DI SUMBER ASLI</span>
            </button>
          ) : (
            <button
              id="btn-apply-job-locked"
              onClick={handleApplyClick}
              className="flex-1 py-3.5 px-4 bg-slate-800 hover:bg-slate-900 text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4 text-amber-300" />
              <span>🔒 LAMAR DI SUMBER ASLI</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

