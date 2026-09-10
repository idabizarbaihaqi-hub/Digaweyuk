import React from 'react';
import {
  X,
  Sparkles,
  Briefcase,
  Award,
  BookOpen,
  HelpCircle,
  Building2,
  Users,
  FilePlus,
  ArrowRight,
  UserCheck,
} from 'lucide-react';
import { PostType, User } from '../../types';

interface CreatePostChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onSelectUserPostType: (type: PostType) => void;
  onSelectCompanyAction: (action: 'CREATE_JOB' | 'FIND_CANDIDATE' | 'CREATE_TEST') => void;
  onOpenAuthModal?: () => void;
}

export const CreatePostChoiceModal: React.FC<CreatePostChoiceModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSelectUserPostType,
  onSelectCompanyAction,
  onOpenAuthModal,
}) => {
  if (!isOpen) return null;

  const isCompany = currentUser?.role === 'company';

  const handleUserChoice = (type: PostType) => {
    if (!currentUser) {
      onClose();
      if (onOpenAuthModal) onOpenAuthModal();
      return;
    }
    onClose();
    onSelectUserPostType(type);
  };

  const handleCompanyChoice = (action: 'CREATE_JOB' | 'FIND_CANDIDATE' | 'CREATE_TEST') => {
    if (!currentUser) {
      onClose();
      if (onOpenAuthModal) onOpenAuthModal();
      return;
    }
    onClose();
    onSelectCompanyAction(action);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl border border-purple-100 shadow-2xl p-5 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-300 font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-purple-50">
          <div>
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
              {isCompany ? 'Buat Konten Rekrutmen' : 'Bagikan Perjalanan Kariermu'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {isCompany
                ? 'Pasang lowongan atau jangkau kandidat berbakat langsung'
                : 'Pilih jenis konten yang ingin Anda publikasikan di Feed'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-purple-50 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Choices for USER */}
        {!isCompany ? (
          <div className="space-y-2.5 pt-1">
            {/* 1. OPEN TO WORK - Highlighted */}
            <button
              id="choice-open-to-work"
              onClick={() => handleUserChoice('OPEN_TO_WORK')}
              className="w-full text-left p-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-purple-700 to-pink-500 text-white shadow-md shadow-purple-500/20 hover:opacity-95 transition-all flex items-center justify-between group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shrink-0">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black tracking-wide">🟣 OPEN TO WORK</span>
                    <span className="px-2 py-0.2 bg-white text-purple-700 text-[10px] font-extrabold rounded-full">
                      Paling Populer
                    </span>
                  </div>
                  <p className="text-[11px] text-purple-100 mt-0.5">
                    Umumkan ketersediaan kerja Anda kepada perusahaan & rekruter
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-white/80 group-hover:translate-x-0.5 transition-transform shrink-0" />
            </button>

            {/* 2. PORTOFOLIO */}
            <button
              onClick={() => handleUserChoice('PORTFOLIO')}
              className="w-full text-left p-3.5 rounded-2xl border border-purple-100 hover:border-purple-300 hover:bg-purple-50/50 transition-all flex items-center justify-between group cursor-pointer bg-white"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-pink-100 text-pink-700 flex items-center justify-center shrink-0 font-bold">
                  💼
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Portofolio & Karya</span>
                  <p className="text-[11px] text-slate-500">Tampilkan hasil proyek, desain, kode, atau karya terbaik Anda</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>

            {/* 3. PENGALAMAN KERJA */}
            <button
              onClick={() => handleUserChoice('EXPERIENCE')}
              className="w-full text-left p-3.5 rounded-2xl border border-purple-100 hover:border-purple-300 hover:bg-purple-50/50 transition-all flex items-center justify-between group cursor-pointer bg-white"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 font-bold">
                  🏢
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Pengalaman Kerja</span>
                  <p className="text-[11px] text-slate-500">Ceritakan pengalaman proyek, magang, atau pekerjaan sebelumnya</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>

            {/* 4. SERTIFIKAT / PRESTASI */}
            <button
              onClick={() => handleUserChoice('CERTIFICATE')}
              className="w-full text-left p-3.5 rounded-2xl border border-purple-100 hover:border-purple-300 hover:bg-purple-50/50 transition-all flex items-center justify-between group cursor-pointer bg-white"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 font-bold">
                  🏆
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Sertifikat / Prestasi</span>
                  <p className="text-[11px] text-slate-500">Bagikan pencapaian kursus, sertifikasi profesi, atau penghargaan</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>

            {/* 5. TIPS KARIER */}
            <button
              onClick={() => handleUserChoice('CAREER_TIPS')}
              className="w-full text-left p-3.5 rounded-2xl border border-purple-100 hover:border-purple-300 hover:bg-purple-50/50 transition-all flex items-center justify-between group cursor-pointer bg-white"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 font-bold">
                  💡
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Tips Karier & Inspirasi</span>
                  <p className="text-[11px] text-slate-500">Berbagi wawasan persiapan interview, tips CV, atau dunia kerja</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>

            {/* 6. LAINNYA */}
            <button
              onClick={() => handleUserChoice('OTHER')}
              className="w-full text-left p-3.5 rounded-2xl border border-purple-100 hover:border-purple-300 hover:bg-purple-50/50 transition-all flex items-center justify-between group cursor-pointer bg-white"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 font-bold">
                  📝
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Lainnya</span>
                  <p className="text-[11px] text-slate-500">Informasi profesional atau pertanyaan seputar karier</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>
          </div>
        ) : (
          /* Choices for COMPANY */
          <div className="space-y-2.5 pt-1">
            <button
              onClick={() => handleCompanyChoice('CREATE_JOB')}
              className="w-full text-left p-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/20 hover:opacity-95 transition-all flex items-center justify-between group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white shrink-0">
                  <FilePlus className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-black block tracking-wide">📢 Pasang Lowongan Baru</span>
                  <p className="text-[11px] text-purple-100 mt-0.5">
                    Buat dan publikasikan loker resmi di DIGAWE YUK
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-white/80 group-hover:translate-x-0.5 transition-transform shrink-0" />
            </button>

            <button
              onClick={() => handleCompanyChoice('FIND_CANDIDATE')}
              className="w-full text-left p-3.5 rounded-2xl border border-purple-100 hover:border-purple-300 hover:bg-purple-50/50 transition-all flex items-center justify-between group cursor-pointer bg-white"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-pink-100 text-pink-700 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 block">🎯 Cari Kandidat (Candidate Discovery)</span>
                  <p className="text-[11px] text-slate-500">Temukan talenta yang Open to Work dan hubungi langsung</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>

            <button
              onClick={() => handleCompanyChoice('CREATE_TEST')}
              className="w-full text-left p-3.5 rounded-2xl border border-purple-100 hover:border-purple-300 hover:bg-purple-50/50 transition-all flex items-center justify-between group cursor-pointer bg-white"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 block">📝 Buat Tes Online / Soal Seleksi</span>
                  <p className="text-[11px] text-slate-500">Siapkan kuis dan online assessment untuk kandidat</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
