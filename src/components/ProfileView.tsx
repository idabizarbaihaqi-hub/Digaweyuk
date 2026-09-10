import React, { useState } from 'react';
import {
  User as UserIcon,
  Crown,
  Heart,
  Settings,
  HelpCircle,
  LogOut,
  ChevronRight,
  Shield,
  Mail,
  LogIn,
  Camera,
  CheckCircle2,
  Loader2,
  Wallet,
  Building2,
  Sparkles,
  AlertTriangle,
  ShieldAlert,
  Lock,
  Eye,
  Check,
  Briefcase,
  ShieldCheck,
} from 'lucide-react';
import { User } from '../types';
import { PremiumBadge } from './PremiumBadge';
import { uploadProfilePhoto } from '../services/storageService';
import { AppLogo } from './AppLogo';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { AppealModal } from './feed/AppealModal';
import { CommunityGuidelinesModal } from './feed/CommunityGuidelinesModal';
import { CandidateApplicationsView } from './candidate/CandidateApplicationsView';

interface ProfileViewProps {
  user: User | null;
  onGoToPremium: () => void;
  onGoToSaved: () => void;
  onToggleStatus?: () => void;
  onOpenAdmin: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  onOpenCompanyPortal?: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  onGoToPremium,
  onGoToSaved,
  onToggleStatus,
  onOpenAdmin,
  onOpenAuth,
  onLogout,
  onOpenCompanyPortal,
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Tahap 5: Open to Work & Privacy State
  const [isOpenToWork, setIsOpenToWork] = useState(user?.openToWork ?? false);
  const [headline, setHeadline] = useState(user?.headline || '');
  const [allowContact, setAllowContact] = useState(user?.allowCompanyContact ?? true);
  const [showExp, setShowExp] = useState(user?.showExperience ?? true);
  const [showEdu, setShowEdu] = useState(user?.showEducation ?? true);
  const [showSkills, setShowSkills] = useState(user?.showSkills ?? true);
  const [profileVis, setProfileVis] = useState(user?.profileVisibility || 'PUBLIC');
  const [savingSettings, setSavingSettings] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Modals
  const [isAppealModalOpen, setIsAppealModalOpen] = useState(false);
  const [isGuidelinesOpen, setIsGuidelinesOpen] = useState(false);
  const [isApplicationsOpen, setIsApplicationsOpen] = useState(false);

  if (!user) {
    return (
      <div id="profile-guest-container" className="space-y-4 max-w-md mx-auto px-4 pt-10 pb-24 text-center">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xs">
          <div className="flex justify-center mb-4">
            <AppLogo size="xl" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">
            Belum Masuk Akun
          </h2>
          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
            Masuk atau daftar akun untuk mengakses fitur pencarian lowongan,
            menyimpan pekerjaan favorit, dan mengelola profil Anda.
          </p>
          <button
            id="btn-guest-login"
            onClick={onOpenAuth}
            className="mt-6 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs inline-flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            <span>Masuk / Daftar Akun</span>
          </button>
        </div>
      </div>
    );
  }

  const isPremium = user.subscriptionStatus === 'PREMIUM';
  const isSuperAdmin =
    user.email?.toLowerCase().trim() === 'id.agnesyakartika@gmail.com' &&
    user.role === 'super_admin';

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setUploadError('Ukuran foto maksimal 2MB.');
      return;
    }

    setUploading(true);
    setUploadError(null);
    try {
      await uploadProfilePhoto(user.uid, file);
    } catch (err) {
      console.error('Photo upload failed:', err);
      setUploadError('Gagal mengunggah foto profil.');
    } finally {
      setUploading(false);
    }
  };

  const handleSavePreferences = async () => {
    setSavingSettings(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        openToWork: isOpenToWork,
        headline: headline.trim(),
        allowCompanyContact: allowContact,
        showExperience: showExp,
        showEducation: showEdu,
        showSkills,
        profileVisibility: profileVis,
        updatedAt: new Date().toISOString(),
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to save preferences:', err);
    } finally {
      setSavingSettings(false);
    }
  };

  const modStatus = user.moderationStatus || 'ACTIVE';

  return (
    <div id="profile-view-container" className="space-y-4 max-w-2xl mx-auto px-4 pt-2 pb-24">
      {/* Moderation Status Banner (if Warning, Suspended, or Banned) */}
      {modStatus === 'BANNED' && (
        <div className="p-4 bg-rose-50 border border-rose-300 rounded-3xl text-rose-900 shadow-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm text-rose-800">
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
            <span>Akun Anda Dinonaktifkan (Banned)</span>
          </div>
          <p className="text-xs leading-relaxed text-rose-700">
            Akun Anda dinonaktifkan karena pelanggaran Pedoman Komunitas: {user.banReason || 'Pelanggaran ketentuan layanan.'}.
          </p>
          <button
            onClick={() => setIsAppealModalOpen(true)}
            className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Ajukan Banding Akun
          </button>
        </div>
      )}

      {modStatus === 'SUSPENDED' && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-3xl text-amber-900 shadow-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm text-amber-800">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <span>Akun Anda Sedang Ditangguhkan (Suspended)</span>
          </div>
          <p className="text-xs leading-relaxed text-amber-700">
            Alasan: {user.suspensionReason || 'Pelanggaran pedoman etika rekruitment.'}
            {user.suspendedUntil && (
              <span className="block mt-0.5 text-[11px] font-semibold">
                Ditangguhkan hingga: {new Date(user.suspendedUntil).toLocaleString('id-ID')}
              </span>
            )}
          </p>
          <button
            onClick={() => setIsAppealModalOpen(true)}
            className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Ajukan Banding Akun
          </button>
        </div>
      )}

      {modStatus === 'WARNING' && (
        <div className="p-3.5 bg-orange-50 border border-orange-200 rounded-2xl text-orange-900 text-xs flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold block">Peringatan Akun ({user.warningCount || 1}x Peringatan)</span>
            <span>
              Harap patuhi Pedoman Komunitas DIGAWE YUK demi menjaga lingkungan rekrutmen yang aman dan profesional.
            </span>
          </div>
        </div>
      )}

      {/* Header Profile Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="relative">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.name}
                className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shadow-md"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-extrabold text-2xl flex items-center justify-center shadow-md">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
            )}

            {/* Photo Upload Trigger */}
            <label
              htmlFor="avatar-upload-input"
              className="absolute -bottom-1 -left-1 bg-white text-slate-700 p-1.5 rounded-full border border-slate-200 shadow-xs cursor-pointer hover:bg-slate-50 transition-colors"
              title="Ubah Foto Profil (Firebase Storage)"
            >
              {uploading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
              ) : (
                <Camera className="w-3.5 h-3.5" />
              )}
              <input
                id="avatar-upload-input"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                disabled={uploading}
              />
            </label>

            {isPremium && (
              <span className="absolute -bottom-1 -right-1 bg-amber-400 text-slate-950 p-1 rounded-full border-2 border-white shadow-xs">
                <Crown className="w-3.5 h-3.5" />
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-extrabold text-slate-900 truncate">
                {user.name}
              </h2>
            </div>
            <p className="text-xs text-slate-500 truncate flex items-center gap-1 mt-0.5">
              <Mail className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="truncate">{user.email}</span>
            </p>

            <div className="mt-2 flex items-center gap-2 flex-wrap">
              {isSuperAdmin ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-black text-blue-800 bg-blue-100 px-2 py-0.5 rounded-full border border-blue-300">
                  <Shield className="w-3 h-3 text-blue-700" />
                  SUPER ADMIN
                </span>
              ) : (
                <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                  PENCARI KERJA
                </span>
              )}
              {isOpenToWork && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  OPEN TO WORK
                </span>
              )}
              <PremiumBadge status={user.subscriptionStatus} size="sm" onClick={onGoToPremium} />
              {isPremium && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3" />
                  PREMIUM AKTIF
                </span>
              )}
            </div>
          </div>
        </div>

        {uploadError && (
          <p className="text-xs text-rose-600 mt-2 font-semibold">{uploadError}</p>
        )}

        {/* Saldo Information (Default Rp0) */}
        <div className="mt-4 p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] text-slate-500 font-medium">Saldo Akun</p>
              <p className="text-xs font-extrabold text-slate-900">
                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(user.balance || 0)}
              </p>
            </div>
          </div>
          <span className="text-[10px] font-semibold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-full">
            Tersimpan Aman
          </span>
        </div>

        {/* Banner Upgrade if FREE and not Super Admin */}
        {!isPremium && !isSuperAdmin && (
          <div
            id="banner-upgrade-profile"
            onClick={onGoToPremium}
            className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-yellow-500/15 to-orange-500/15 border border-amber-300/80 cursor-pointer hover:border-amber-400 transition-all"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500 text-slate-950 font-bold">
                  <Crown className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-amber-950 uppercase tracking-wide">
                    👑 Upgrade ke Premium
                  </h4>
                  <p className="text-[11px] text-amber-900 mt-0.5">
                    Lamar sumber asli & simpan lowongan tanpa batas.
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-amber-900 shrink-0" />
            </div>
          </div>
        )}
      </div>

      {/* Tahap 5: Open to Work & Privacy Controls Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Status & Privasi Open to Work</h3>
              <p className="text-[11px] text-slate-500">Bantu perusahaan menemukan profil Anda</p>
            </div>
          </div>

          {/* Toggle Switch */}
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isOpenToWork}
              onChange={(e) => setIsOpenToWork(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
          </label>
        </div>

        {isOpenToWork && (
          <div className="space-y-3 pt-2 border-t border-slate-100 text-xs text-slate-700">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Headline / Posisi yang Dicari:
              </label>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="Contoh: Barista Berpengalaman | Staff Admin Gudang"
                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-hidden"
              />
            </div>

            {/* Privacy toggles */}
            <div className="space-y-2 pt-1">
              <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wide">
                Pengaturan Privasi Profil
              </span>

              <label className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100/70 transition-colors">
                <span className="font-medium">Izinkan Perusahaan Menghubungi Langsung</span>
                <input
                  type="checkbox"
                  checked={allowContact}
                  onChange={(e) => setAllowContact(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100/70 transition-colors">
                <span className="font-medium">Tampilkan Riwayat Pengalaman di Pencarian</span>
                <input
                  type="checkbox"
                  checked={showExp}
                  onChange={(e) => setShowExp(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100/70 transition-colors">
                <span className="font-medium">Tampilkan Pendidikan Terakhir</span>
                <input
                  type="checkbox"
                  checked={showEdu}
                  onChange={(e) => setShowEdu(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100/70 transition-colors">
                <span className="font-medium">Tampilkan Keahlian / Skill</span>
                <input
                  type="checkbox"
                  checked={showSkills}
                  onChange={(e) => setShowSkills(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                />
              </label>
            </div>

            <div className="pt-2 flex items-center justify-between">
              {savedSuccess ? (
                <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold text-xs animate-in fade-in">
                  <Check className="w-4 h-4" />
                  Pengaturan Tersimpan!
                </span>
              ) : (
                <span />
              )}

              <button
                onClick={handleSavePreferences}
                disabled={savingSettings}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                {savingSettings ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>Simpan Pengaturan</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Menu List */}
      <div className="bg-white rounded-3xl border border-slate-200/90 divide-y divide-slate-100 overflow-hidden shadow-xs">
        {/* Profil Saya */}
        <div className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-slate-100 text-slate-600">
              <UserIcon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">Profil Saya</p>
              <p className="text-[11px] text-slate-400">UID: {user.uid.slice(0, 8)}... (Firestore)</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </div>

        {/* Status Premium */}
        <div
          id="menu-status-premium"
          onClick={onGoToPremium}
          className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
              <Crown className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">Status Premium</p>
              <p className="text-[11px] text-slate-400">
                {isPremium ? 'Langganan Aktif' : 'Lihat paket dan keuntungan'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <PremiumBadge status={user.subscriptionStatus} size="sm" />
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>
        </div>

        {/* Lowongan Tersimpan */}
        <div
          id="menu-saved-jobs"
          onClick={onGoToSaved}
          className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-100 text-rose-600">
              <Heart className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">Lowongan Tersimpan</p>
              <p className="text-[11px] text-slate-400">Koleksi loker yang disimpan</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </div>

        {/* Lamaran Saya (Tahap 6 Smart Recruitment) */}
        <div
          id="menu-my-applications"
          onClick={() => setIsApplicationsOpen(true)}
          className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
              <Briefcase className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">Lamaran Saya</p>
              <p className="text-[11px] text-slate-400">Pantau status seleksi & timeline recruitment real-time</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-full">
              Status Aktif
            </span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>
        </div>

        {/* Portal Perusahaan & Rekruter */}
        {onOpenCompanyPortal && (
          <div
            id="menu-company-portal"
            onClick={onOpenCompanyPortal}
            className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">Portal Perusahaan &amp; Rekruter</p>
                <p className="text-[11px] text-slate-400">
                  {user.role === 'company'
                    ? 'Kelola lowongan, kandidat, dan online interview'
                    : 'Pasang lowongan kerja & buat tes online'}
                </p>
              </div>
            </div>
            <span className="px-2 py-0.5 text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-full">
              Buka
            </span>
          </div>
        )}

        {/* Panel Super Admin - STRICTLY rendered ONLY for id.agnesyakartika@gmail.com */}
        {isSuperAdmin && (
          <div
            id="menu-admin-structure"
            onClick={onOpenAdmin}
            className="p-3.5 flex items-center justify-between bg-blue-50/70 hover:bg-blue-100/60 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-600 text-white">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-extrabold text-blue-900">Panel Super Admin</p>
                <p className="text-[11px] text-blue-700">Kelola AI Hunter, lowongan, & database</p>
              </div>
            </div>
            <span className="px-2 py-0.5 text-[10px] font-bold text-blue-700 bg-blue-100 rounded-full border border-blue-200">
              Buka
            </span>
          </div>
        )}

        {/* Pengaturan */}
        <div className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-slate-100 text-slate-600">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">Pengaturan</p>
              <p className="text-[11px] text-slate-400">Notifikasi & preferensi aplikasi</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </div>

        {/* Bantuan */}
        <div className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-slate-100 text-slate-600">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">Bantuan & FAQ</p>
              <p className="text-[11px] text-slate-400">Pusat panduan pencari kerja</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </div>

        {/* Pedoman Komunitas */}
        <div
          onClick={() => setIsGuidelinesOpen(true)}
          className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">Pedoman Komunitas &amp; Keamanan</p>
              <p className="text-[11px] text-slate-400">Aturan postingan anti-scam &amp; etika rekrutmen</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </div>

        {/* Keluar */}
        <div
          id="menu-logout"
          onClick={onLogout}
          className="p-3.5 flex items-center justify-between hover:bg-rose-50 transition-colors cursor-pointer text-rose-600"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-100 text-rose-600">
              <LogOut className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold">Keluar Akun</p>
              <p className="text-[11px] text-rose-400">Keluar dari sesi Firebase</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-rose-400" />
        </div>
      </div>

      {/* App Version Info */}
      <div className="text-center pt-2">
        <p className="text-[11px] font-semibold text-slate-400">
          DIGAWE YUK v2.0.0 — Terhubung ke Cloud Firestore & Firebase Auth
        </p>
      </div>

      {/* Tahap 5 Modals */}
      <AppealModal
        isOpen={isAppealModalOpen}
        onClose={() => setIsAppealModalOpen(false)}
        user={user}
        currentPenaltyReason={user.banReason || user.suspensionReason}
      />

      <CommunityGuidelinesModal
        isOpen={isGuidelinesOpen}
        onClose={() => setIsGuidelinesOpen(false)}
      />

      {/* Tahap 6: Candidate Applications Modal */}
      {isApplicationsOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto p-4 sm:p-6 shadow-2xl border border-slate-200">
            <CandidateApplicationsView
              user={user}
              onClose={() => setIsApplicationsOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
