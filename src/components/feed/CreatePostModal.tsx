import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Send,
  Loader2,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Briefcase,
  MapPin,
  GraduationCap,
  Clock,
  Link as LinkIcon,
  Tag,
  Eye,
  Edit3,
  CheckCircle2,
  DollarSign,
  Award,
  Building,
  UserCheck,
} from 'lucide-react';
import { PostType, User } from '../../types';
import { createPost, detectScamIntent } from '../../services/feedService';
import { CommunityGuidelinesModal } from './CommunityGuidelinesModal';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  initialType?: PostType;
  onSuccess?: () => void;
}

const CITIES = [
  'Bandung',
  'Bekasi',
  'Bogor',
  'Depok',
  'Cimahi',
  'Cirebon',
  'Sukabumi',
  'Tasikmalaya',
  'Karawang',
  'Purwakarta',
  'Subang',
  'Sumedang',
  'Garut',
  'Cianjur',
  'Indramayu',
  'Majalengka',
  'Kuningan',
  'Ciamis',
  'Pangandaran',
  'Banjar',
  'Remote / Seluruh Jawa Barat',
];

const EXPERIENCE_OPTIONS = [
  'Fresh Graduate / Pemula',
  '1 - 2 Tahun',
  '3 - 5 Tahun',
  'Lebih dari 5 Tahun',
];

const EDUCATION_OPTIONS = [
  'SMA / SMK Sederajat',
  'Diploma (D3)',
  'Sarjana (S1)',
  'Magister (S2)',
  'Semua Jenjang',
];

const EMPLOYMENT_TYPES = [
  'Full Time',
  'Part Time',
  'Freelance',
  'Kontrak',
  'Internship',
  'Remote',
];

const AVAILABILITY_OPTIONS = [
  'Siap bekerja segera / Langsung aktif',
  '1 Minggu ke depan',
  '1 Bulan (Notice Period)',
  'Dapat dinegosiasikan',
];

const INDUSTRIES = [
  'Teknologi Informasi & Software',
  'Pemasaran & Media Kreatif',
  'Keuangan & Perbankan',
  'Manufaktur & Logistik',
  'Retail & E-commerce',
  'Pelayanan Pelanggan (Customer Service)',
  'Pendidikan & Pelatihan',
  'Kesehatan & Farmasi',
  'Administrasi & Operasional',
  'Semua Industri',
];

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  initialType = 'OPEN_TO_WORK',
  onSuccess,
}) => {
  const [postType, setPostType] = useState<PostType>(initialType);
  const [activeTab, setActiveTab] = useState<'form' | 'preview'>('form');

  // Form states
  const [positionWanted, setPositionWanted] = useState('');
  const [locationWanted, setLocationWanted] = useState('Bandung');
  const [experience, setExperience] = useState(EXPERIENCE_OPTIONS[0]);
  const [education, setEducation] = useState(EDUCATION_OPTIONS[2]);
  const [employmentType, setEmploymentType] = useState(EMPLOYMENT_TYPES[0]);
  const [availability, setAvailability] = useState(AVAILABILITY_OPTIONS[0]);
  const [industryPreference, setIndustryPreference] = useState(INDUSTRIES[0]);
  const [salaryExpectation, setSalaryExpectation] = useState('');
  const [certificationsInput, setCertificationsInput] = useState('');
  const [content, setContent] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [isSeekingJob, setIsSeekingJob] = useState(true);

  // Skills tags
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGuidelinesOpen, setIsGuidelinesOpen] = useState(false);

  useEffect(() => {
    if (initialType) {
      setPostType(initialType);
    }
  }, [initialType]);

  if (!isOpen) return null;

  const scamCheck = detectScamIntent(`${content} ${positionWanted} ${salaryExpectation}`);

  const handleAddSkill = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter') return;
    e.preventDefault();
    const val = skillInput.trim().replace(/^#/, '');
    if (val && !skills.includes(val) && skills.length < 10) {
      setSkills([...skills, val]);
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (sToRemove: string) => {
    setSkills(skills.filter((s) => s !== sToRemove));
  };

  const validate = () => {
    if (!positionWanted.trim()) {
      setError('Posisi yang dicari / judul postingan wajib diisi.');
      return false;
    }
    if (!content.trim()) {
      setError('Deskripsi singkat tentang diri atau isi postingan wajib diisi.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentUser) return;
    if (!validate()) {
      setActiveTab('form');
      return;
    }

    setSubmitting(true);
    setError(null);

    const certList = certificationsInput
      ? certificationsInput
          .split(',')
          .map((c) => c.trim())
          .filter(Boolean)
      : [];

    try {
      await createPost(currentUser.uid, {
        userName: currentUser.name || 'Pencari Kerja',
        userAvatar: currentUser.photoURL || '',
        userHeadline: currentUser.headline || positionWanted,
        userVerified: currentUser.subscriptionStatus === 'PREMIUM' || false,
        type: postType,
        positionWanted: positionWanted.trim(),
        locationWanted,
        city: locationWanted,
        province: 'Jawa Barat',
        experience,
        education,
        employmentType,
        availability,
        industryPreference,
        salaryExpectation: salaryExpectation.trim() || '',
        certifications: certList,
        skills,
        content: content.trim(),
        portfolioUrl: portfolioUrl.trim() || '',
        openToWork: postType === 'OPEN_TO_WORK' ? isSeekingJob : false,
        isSeekingJob,
        status: 'ACTIVE',
        visibility: 'PUBLIC',
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error creating post:', err);
      setError(err?.message || 'Gagal mempublikasikan postingan.');
      setActiveTab('form');
    } finally {
      setSubmitting(false);
    }
  };

  const getPostTypeBadge = (t: PostType) => {
    switch (t) {
      case 'OPEN_TO_WORK':
        return { label: '🟣 OPEN TO WORK', bg: 'bg-purple-100 text-purple-800 border-purple-200' };
      case 'PORTFOLIO':
        return { label: '💼 PORTOFOLIO', bg: 'bg-pink-100 text-pink-800 border-pink-200' };
      case 'EXPERIENCE':
        return { label: '🏢 PENGALAMAN KERJA', bg: 'bg-indigo-100 text-indigo-800 border-indigo-200' };
      case 'CERTIFICATE':
        return { label: '🏆 SERTIFIKAT / PRESTASI', bg: 'bg-amber-100 text-amber-900 border-amber-200' };
      case 'CAREER_TIPS':
        return { label: '💡 TIPS KARIER', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
      default:
        return { label: '📝 LAINNYA', bg: 'bg-slate-100 text-slate-800 border-slate-200' };
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in font-sans">
        <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-purple-100 overflow-hidden flex flex-col max-h-[92vh]">
          {/* Modal Header */}
          <div className="px-5 py-4 bg-gradient-to-r from-purple-600 via-purple-700 to-pink-500 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-white/20 rounded-xl">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-extrabold text-base sm:text-lg leading-tight">
                  Buat Postingan Karier
                </h3>
                <p className="text-xs text-purple-100">
                  Jangkau perusahaan dan bangun koneksi profesional di DIGAWE YUK
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tab: Formulir vs Preview */}
          <div className="flex border-b border-purple-100 px-5 pt-2 bg-purple-50/40">
            <button
              type="button"
              onClick={() => setActiveTab('form')}
              className={`flex items-center gap-2 py-2.5 px-4 font-bold text-xs border-b-2 transition-all cursor-pointer ${
                activeTab === 'form'
                  ? 'border-purple-600 text-purple-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Formulir Postingan</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (validate()) setActiveTab('preview');
              }}
              className={`flex items-center gap-2 py-2.5 px-4 font-bold text-xs border-b-2 transition-all cursor-pointer ${
                activeTab === 'preview'
                  ? 'border-purple-600 text-purple-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Lihat Preview</span>
            </button>
          </div>

          {/* Content Area */}
          <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2 font-medium">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{error}</span>
              </div>
            )}

            {activeTab === 'form' ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* 1. Pilih Jenis Postingan (6 Pilihan Lengkap) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Pilih Jenis Postingan
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { type: 'OPEN_TO_WORK', label: '🟣 OPEN TO WORK', icon: '🟣' },
                      { type: 'PORTFOLIO', label: '💼 PORTOFOLIO', icon: '💼' },
                      { type: 'EXPERIENCE', label: '🏢 PENGALAMAN', icon: '🏢' },
                      { type: 'CERTIFICATE', label: '🏆 SERTIFIKAT', icon: '🏆' },
                      { type: 'CAREER_TIPS', label: '💡 TIPS KARIER', icon: '💡' },
                      { type: 'OTHER', label: '📝 LAINNYA', icon: '📝' },
                    ].map((item) => (
                      <button
                        key={item.type}
                        type="button"
                        onClick={() => setPostType(item.type as PostType)}
                        className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-2 text-left ${
                          postType === item.type
                            ? 'border-purple-600 bg-purple-50 text-purple-800 shadow-xs ring-1 ring-purple-600'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <span>{item.icon}</span>
                        <span className="truncate">{item.label.replace(/^[^a-zA-Z0-9]+/, '')}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Open to work banner & checkbox */}
                {postType === 'OPEN_TO_WORK' && (
                  <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-200/80 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0">
                        <UserCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-purple-900">
                          Status: 🟣 OPEN TO WORK
                        </p>
                        <p className="text-[11px] text-purple-700">
                          Profil Anda akan diprioritaskan di pencarian kandidat perusahaan
                        </p>
                      </div>
                    </div>
                    <label className="flex items-center gap-1.5 text-xs font-bold text-purple-900 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isSeekingJob}
                        onChange={(e) => setIsSeekingJob(e.target.checked)}
                        className="rounded-md text-purple-600 focus:ring-purple-500 w-4 h-4"
                      />
                      <span>🔎 Aktif Mencari</span>
                    </label>
                  </div>
                )}

                {/* Posisi yang dicari */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Posisi / Profesi yang Dicari <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={positionWanted}
                    onChange={(e) => setPositionWanted(e.target.value)}
                    placeholder="Contoh: Staff Marketing, Frontend Developer, Admin Gudang"
                    className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-hidden bg-slate-50/50"
                  />
                </div>

                {/* Lokasi & Jenis Pekerjaan */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Lokasi yang Diinginkan
                    </label>
                    <select
                      value={locationWanted}
                      onChange={(e) => setLocationWanted(e.target.value)}
                      className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-hidden bg-slate-50/50"
                    >
                      {CITIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Jenis Pekerjaan
                    </label>
                    <select
                      value={employmentType}
                      onChange={(e) => setEmploymentType(e.target.value)}
                      className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-hidden bg-slate-50/50"
                    >
                      {EMPLOYMENT_TYPES.map((et) => (
                        <option key={et} value={et}>
                          {et}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Pengalaman & Pendidikan */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Pengalaman Kerja
                    </label>
                    <select
                      value={experience}
                      onChange={(e) => setExperience(e.target.value)}
                      className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-hidden bg-slate-50/50"
                    >
                      {EXPERIENCE_OPTIONS.map((exp) => (
                        <option key={exp} value={exp}>
                          {exp}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Pendidikan Terakhir
                    </label>
                    <select
                      value={education}
                      onChange={(e) => setEducation(e.target.value)}
                      className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-hidden bg-slate-50/50"
                    >
                      {EDUCATION_OPTIONS.map((edu) => (
                        <option key={edu} value={edu}>
                          {edu}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Ketersediaan & Preferensi Industri */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Ketersediaan Mulai Bekerja
                    </label>
                    <select
                      value={availability}
                      onChange={(e) => setAvailability(e.target.value)}
                      className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-hidden bg-slate-50/50"
                    >
                      {AVAILABILITY_OPTIONS.map((avail) => (
                        <option key={avail} value={avail}>
                          {avail}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Preferensi Industri
                    </label>
                    <select
                      value={industryPreference}
                      onChange={(e) => setIndustryPreference(e.target.value)}
                      className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-hidden bg-slate-50/50"
                    >
                      {INDUSTRIES.map((ind) => (
                        <option key={ind} value={ind}>
                          {ind}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Skills / Keahlian */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Keahlian / Skills (Maksimal 10 skill)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={handleAddSkill}
                      placeholder="Ketik skill lalu tekan Enter (misal: Excel, Canva)"
                      className="flex-1 text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-hidden bg-slate-50/50"
                    />
                    <button
                      type="button"
                      onClick={handleAddSkill}
                      className="px-4 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs rounded-xl border border-purple-200 cursor-pointer"
                    >
                      Tambah
                    </button>
                  </div>
                  {skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {skills.map((s) => (
                        <span
                          key={s}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-200 text-xs font-medium rounded-lg"
                        >
                          #{s}
                          <button
                            type="button"
                            onClick={() => handleRemoveSkill(s)}
                            className="hover:text-rose-600 cursor-pointer ml-1"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Sertifikasi & Ekspektasi Gaji (Opsional) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Sertifikasi (Opsional, pisahkan koma)
                    </label>
                    <input
                      type="text"
                      value={certificationsInput}
                      onChange={(e) => setCertificationsInput(e.target.value)}
                      placeholder="Contoh: BNSP Digital Marketing, Google Ads"
                      className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-hidden bg-slate-50/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Ekspektasi Gaji (Opsional)
                    </label>
                    <input
                      type="text"
                      value={salaryExpectation}
                      onChange={(e) => setSalaryExpectation(e.target.value)}
                      placeholder="Contoh: Rp 4.500.000 - Rp 6.000.000 / bulan"
                      className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-hidden bg-slate-50/50"
                    />
                  </div>
                </div>

                {/* Link Portofolio */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Link Portofolio / LinkedIn / GitHub (Opsional)
                  </label>
                  <div className="relative">
                    <LinkIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3.5" />
                    <input
                      type="url"
                      value={portfolioUrl}
                      onChange={(e) => setPortfolioUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full text-xs pl-8 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-hidden bg-slate-50/50"
                    />
                  </div>
                </div>

                {/* Deskripsi Singkat Diri */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Deskripsi Singkat Tentang Diri / Harapan Karier <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Ceritakan latar belakang Anda, pencapaian yang pernah diraih, dan apa yang ingin Anda kontribusikan pada perusahaan..."
                    className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-hidden bg-slate-50/50 leading-relaxed"
                  />
                </div>

                {/* Anti-scam warning preview */}
                {scamCheck.isScamSuspect && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">Peringatan Keamanan</span>
                      <span>
                        Sistem mendeteksi kata berisiko: <strong>{scamCheck.matched.join(', ')}</strong>. Postingan Anda akan ditinjau tim moderasi sebelum tayang publik.
                      </span>
                    </div>
                  </div>
                )}
              </form>
            ) : (
              /* PREVIEW TAB: Persis tampilan Feed yang sebenarnya */
              <div className="space-y-4">
                <div className="bg-purple-50 border border-purple-200 p-3 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-purple-700" />
                    <span className="text-xs font-bold text-purple-900">
                      Tampilan Preview di Feed DIGAWE YUK
                    </span>
                  </div>
                  <span className="text-[11px] text-purple-600 font-semibold">
                    Siap Ditayangkan
                  </span>
                </div>

                {/* Card Preview */}
                <div className="bg-white rounded-3xl border border-purple-100 p-5 shadow-md space-y-3.5">
                  {/* Header info */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {currentUser?.photoURL ? (
                        <img
                          src={currentUser.photoURL}
                          alt={currentUser.name}
                          className="w-11 h-11 rounded-2xl object-cover border border-purple-100 shadow-xs"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 text-white font-extrabold flex items-center justify-center text-base shadow-xs">
                          {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-sm font-extrabold text-slate-900">
                            {currentUser?.name || 'Nama Anda'}
                          </h4>
                          <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 fill-purple-50" />
                        </div>
                        <p className="text-[11px] text-slate-500">
                          {currentUser?.headline || positionWanted || 'Pencari Kerja Aktif'} • Baru saja
                        </p>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-black tracking-wide border ${
                        getPostTypeBadge(postType).bg
                      }`}
                    >
                      {getPostTypeBadge(postType).label}
                    </span>
                  </div>

                  {/* Pitch line */}
                  <p className="text-xs font-medium text-purple-950 bg-purple-50/70 p-2.5 rounded-xl border border-purple-100">
                    &ldquo;Saya sedang mencari peluang sebagai{' '}
                    <strong className="text-purple-700">{positionWanted || 'posisi yang dipilih'}</strong>
                    .&rdquo;
                  </p>

                  {/* Highlights Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                      <span className="truncate text-slate-700 font-medium">{locationWanted}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2">
                      <Briefcase className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                      <span className="truncate text-slate-700 font-medium">{employmentType}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                      <span className="truncate text-slate-700 font-medium">{experience}</span>
                    </div>
                  </div>

                  {/* Content body */}
                  <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                    {content || 'Deskripsi singkat tentang diri Anda akan muncul di sini...'}
                  </p>

                  {/* Skills chips */}
                  {skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {skills.map((s) => (
                        <span
                          key={s}
                          className="px-2.5 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 text-[11px] font-semibold"
                        >
                          #{s}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Ketersediaan */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-emerald-600" />
                      <strong className="text-slate-700">Ketersediaan:</strong> {availability}
                    </span>
                    <span className="text-purple-600 font-bold">Preview Mode</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="p-4 sm:p-5 bg-slate-50 border-t border-purple-50 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setIsGuidelinesOpen(true)}
              className="text-xs text-purple-700 hover:text-purple-900 font-bold flex items-center gap-1 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-purple-600" />
              <span>Pedoman Komunitas</span>
            </button>

            <div className="flex items-center gap-2">
              {activeTab === 'preview' ? (
                <button
                  type="button"
                  onClick={() => setActiveTab('form')}
                  className="px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors"
                >
                  Kembali Edit
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (validate()) setActiveTab('preview');
                  }}
                  className="px-4 py-2.5 border border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Lihat Preview</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => handleSubmit()}
                disabled={submitting}
                className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-xl text-xs font-bold hover:opacity-95 shadow-md shadow-purple-500/20 disabled:opacity-50 cursor-pointer flex items-center gap-2 transition-all"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Mempublikasikan...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Posting Sekarang</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <CommunityGuidelinesModal
        isOpen={isGuidelinesOpen}
        onClose={() => setIsGuidelinesOpen(false)}
      />
    </>
  );
};
