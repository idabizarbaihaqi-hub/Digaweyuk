import React, { useState, useEffect } from 'react';
import {
  Search,
  MapPin,
  Briefcase,
  GraduationCap,
  Sparkles,
  Crown,
  Lock,
  MessageSquare,
  User as UserIcon,
  CheckCircle2,
  Filter,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { CompanyProfile, Post, User } from '../../types';
import { discoverCandidates } from '../../services/feedService';
import { CandidateProfileModal } from '../feed/CandidateProfileModal';
import { ContactCandidateModal } from '../feed/ContactCandidateModal';
import { CompanySubscriptionModal } from './CompanySubscriptionModal';

interface CandidateDiscoveryViewProps {
  company: CompanyProfile | null;
  currentUser: User | null;
  onRefreshCompany?: () => void;
}

const CITIES = [
  'Semua Lokasi',
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
  'Garut',
  'Cianjur',
];

const EXPERIENCES = [
  'Semua Pengalaman',
  'Fresh Graduate / Pemula',
  '1 - 2 Tahun',
  '3 - 5 Tahun',
  'Lebih dari 5 Tahun',
];

const EDUCATIONS = [
  'Semua Pendidikan',
  'SMA / SMK Sederajat',
  'Diploma (D3)',
  'Sarjana (S1)',
  'Magister (S2)',
];

export const CandidateDiscoveryView: React.FC<CandidateDiscoveryViewProps> = ({
  company,
  currentUser,
  onRefreshCompany,
}) => {
  const [candidates, setCandidates] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchPos, setSearchPos] = useState('');
  const [selectedCity, setSelectedCity] = useState('Semua Lokasi');
  const [selectedExp, setSelectedExp] = useState('Semua Pengalaman');
  const [selectedEdu, setSelectedEdu] = useState('Semua Pendidikan');
  const [skillQuery, setSkillQuery] = useState('');

  // Modals
  const [selectedProfilePost, setSelectedProfilePost] = useState<Post | null>(null);
  const [selectedContactPost, setSelectedContactPost] = useState<Post | null>(null);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  // Check Subscription / Trial Access
  const isPremium = company?.subscription?.status === 'PREMIUM';
  const hasUsedTrial = (company as any)?.trialUsedCandidateDiscovery || false;
  const canAccess = isPremium || !hasUsedTrial;

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const results = await discoverCandidates({
        position: searchPos,
        location: selectedCity,
        experience: selectedExp,
        education: selectedEdu,
        skill: skillQuery,
        openToWorkOnly: true,
      });
      setCandidates(results);
    } catch (err) {
      console.error('Error discovering candidates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canAccess) {
      fetchCandidates();
    } else {
      setLoading(false);
    }
  }, [searchPos, selectedCity, selectedExp, selectedEdu, skillQuery, canAccess]);

  // If user is on FREE and trial is used, show Premium Lock screen
  if (!canAccess) {
    return (
      <div className="space-y-6">
        <div className="bg-linear-to-r from-amber-500 via-amber-600 to-indigo-600 rounded-3xl p-8 text-white shadow-lg">
          <div className="max-w-xl space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold">
              <Crown className="w-3.5 h-3.5 text-amber-200" />
              Fitur Premium Rekruter
            </div>
            <h2 className="text-2xl font-bold">Cari & Temukan Kandidat Siap Kerja</h2>
            <p className="text-xs sm:text-sm text-amber-100 leading-relaxed">
              Dapatkan akses langsung ke ribuan pelamar kerja bertalenta di Jawa Barat yang berstatus "Open to Work".
              Hubungi mereka langsung tanpa menunggu lamaran masuk!
            </p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-10 border border-slate-200/80 text-center shadow-xs space-y-4">
          <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-lg font-bold text-slate-900">Masa Percobaan Akses Kandidat Telah Selesai</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Perusahaan Anda telah menggunakan 1x kesempatan trial Candidate Discovery. Upgrade ke paket Perusahaan
              Premium untuk pencarian dan kontak kandidat tanpa batas.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={() => setIsUpgradeModalOpen(true)}
              className="px-6 py-3 bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold rounded-xl shadow-md inline-flex items-center gap-2 cursor-pointer transition-all"
            >
              <Crown className="w-4 h-4 text-amber-100" />
              <span>Upgrade ke Perusahaan Premium</span>
            </button>
          </div>
        </div>

        {company && (
          <CompanySubscriptionModal
            isOpen={isUpgradeModalOpen}
            onClose={() => setIsUpgradeModalOpen(false)}
            company={company}
            user={currentUser}
            onUpgradeSuccess={() => {
              if (onRefreshCompany) onRefreshCompany();
              setIsUpgradeModalOpen(false);
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-linear-to-r from-blue-600 via-indigo-600 to-emerald-600 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-blue-200" />
              Candidate Discovery Center
            </span>
            {isPremium ? (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-400 text-amber-950 rounded-full text-xs font-bold">
                <Crown className="w-3.5 h-3.5" />
                PREMIUM RECRUITER
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-white/20 text-white rounded-full text-xs font-medium">
                Akses Percobaan (Trial Aktif)
              </span>
            )}
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight">
            Temukan Talenta Siap Kerja (Open to Work)
          </h2>
          <p className="text-xs sm:text-sm text-blue-100 max-w-xl leading-relaxed">
            Cari kandidat berdasarkan kualifikasi, pengalaman, keahlian, dan kota di Jawa Barat. Hubungi kandidat idaman Anda secara langsung.
          </p>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Position */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
              Posisi / Profesi
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchPos}
                onChange={(e) => setSearchPos(e.target.value)}
                placeholder="Contoh: Barista, Staff Gudang..."
                className="w-full text-xs pl-8.5 pr-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-hidden bg-slate-50/50"
              />
            </div>
          </div>

          {/* City */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
              Kota di Jawa Barat
            </label>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-hidden bg-slate-50/50"
            >
              {CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Experience */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
              Pengalaman
            </label>
            <select
              value={selectedExp}
              onChange={(e) => setSelectedExp(e.target.value)}
              className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-hidden bg-slate-50/50"
            >
              {EXPERIENCES.map((exp) => (
                <option key={exp} value={exp}>
                  {exp}
                </option>
              ))}
            </select>
          </div>

          {/* Education */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
              Pendidikan
            </label>
            <select
              value={selectedEdu}
              onChange={(e) => setSelectedEdu(e.target.value)}
              className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-hidden bg-slate-50/50"
            >
              {EDUCATIONS.map((edu) => (
                <option key={edu} value={edu}>
                  {edu}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Skill Keyword & Reset */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <span className="text-xs font-semibold text-slate-600 shrink-0">Filter Skill:</span>
            <input
              type="text"
              value={skillQuery}
              onChange={(e) => setSkillQuery(e.target.value)}
              placeholder="Contoh: Excel, AutoCAD, Sales..."
              className="w-full text-xs px-3 py-1.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-hidden bg-slate-50/50"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setSearchPos('');
                setSelectedCity('Semua Lokasi');
                setSelectedExp('Semua Pengalaman');
                setSelectedEdu('Semua Pendidikan');
                setSkillQuery('');
              }}
              className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
            >
              Reset Filter
            </button>
            <button
              onClick={fetchCandidates}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Cari</span>
            </button>
          </div>
        </div>
      </div>

      {/* Candidate Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-slate-200 animate-pulse space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-slate-200" />
                <div className="space-y-1">
                  <div className="w-28 h-4 bg-slate-200 rounded-md" />
                  <div className="w-20 h-3 bg-slate-200 rounded-md" />
                </div>
              </div>
              <div className="w-full h-12 bg-slate-100 rounded-lg" />
            </div>
          ))}
        </div>
      ) : candidates.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-2xl p-10 border border-slate-200/80 text-center space-y-3">
          <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
            <UserIcon className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-slate-800 text-base">Tidak Ada Kandidat yang Cocok</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Belum ada kandidat bertalenta yang sesuai dengan kriteria filter saat ini. Coba perluas pilihan kota atau kualifikasi.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {candidates.map((cand) => (
            <div
              key={cand.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div>
                {/* Header card */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden border border-slate-200 shrink-0">
                      {cand.userAvatar ? (
                        <img
                          src={cand.userAvatar}
                          alt={cand.userName}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full bg-linear-to-br from-blue-500 to-indigo-600 text-white font-bold text-lg flex items-center justify-center">
                          {cand.userName.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm leading-tight">{cand.userName}</h4>
                      <p className="text-xs font-semibold text-blue-600 mt-0.5">{cand.positionWanted}</p>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold rounded-full shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    OPEN TO WORK
                  </span>
                </div>

                {/* Badges info */}
                <div className="grid grid-cols-2 gap-2 mt-3 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{cand.locationWanted || cand.city || 'Jawa Barat'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{cand.experience}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{cand.education}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                    <span>Mulai: {cand.availability}</span>
                  </div>
                </div>

                {/* Self summary */}
                <p className="text-xs text-slate-600 mt-3 line-clamp-2 leading-relaxed italic bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  "{cand.content}"
                </p>

                {/* Skills tags */}
                {cand.skills && cand.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {cand.skills.slice(0, 4).map((s, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[11px] font-medium rounded-md"
                      >
                        #{s}
                      </span>
                    ))}
                    {cand.skills.length > 4 && (
                      <span className="text-[11px] text-slate-400 self-center">
                        +{cand.skills.length - 4} lagi
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => setSelectedProfilePost(cand)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Lihat Profil
                </button>
                <button
                  onClick={() => setSelectedContactPost(cand)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Hubungi Kandidat</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <CandidateProfileModal
        isOpen={Boolean(selectedProfilePost)}
        onClose={() => setSelectedProfilePost(null)}
        post={selectedProfilePost || undefined}
        onContact={() => {
          setSelectedContactPost(selectedProfilePost);
          setSelectedProfilePost(null);
        }}
      />

      <ContactCandidateModal
        isOpen={Boolean(selectedContactPost)}
        onClose={() => setSelectedContactPost(null)}
        post={selectedContactPost || undefined}
        currentUser={currentUser}
      />
    </div>
  );
};
