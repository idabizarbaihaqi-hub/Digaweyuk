import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Search,
  MapPin,
  Filter,
  RefreshCw,
  Sparkles,
  Users,
  ShieldCheck,
  CheckCircle2,
  SlidersHorizontal,
  Compass,
  Briefcase,
  Award,
  BookOpen,
} from 'lucide-react';
import { Post, PostType, User } from '../../types';
import { getFeedPosts } from '../../services/feedService';
import { PostCard } from './PostCard';
import { CreatePostChoiceModal } from './CreatePostChoiceModal';
import { CreatePostModal } from './CreatePostModal';
import { CandidateProfileModal } from './CandidateProfileModal';
import { ContactCandidateModal } from './ContactCandidateModal';
import { ReportModal } from './ReportModal';
import { CommunityGuidelinesModal } from './CommunityGuidelinesModal';

interface SocialFeedViewProps {
  currentUser: User | null;
  onOpenAuthModal?: () => void;
  onNavigateToChat?: (chatId: string) => void;
  onOpenCompanyPortal?: () => void;
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
  'Sumedang',
  'Majalengka',
  'Indramayu',
  'Kuningan',
  'Ciamis',
  'Pangandaran',
  'Banjar',
];

export const SocialFeedView: React.FC<SocialFeedViewProps> = ({
  currentUser,
  onOpenAuthModal,
  onNavigateToChat,
  onOpenCompanyPortal,
}) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('Semua Lokasi');
  const [selectedType, setSelectedType] = useState<string>('ALL');

  // Modals state
  const [isChoiceModalOpen, setIsChoiceModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [initialPostType, setInitialPostType] = useState<PostType>('OPEN_TO_WORK');

  const [isGuidelinesOpen, setIsGuidelinesOpen] = useState(false);
  const [selectedProfilePost, setSelectedProfilePost] = useState<Post | null>(null);
  const [selectedContactPost, setSelectedContactPost] = useState<Post | null>(null);
  const [selectedReportPost, setSelectedReportPost] = useState<Post | null>(null);

  const fetchPosts = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        const res = await getFeedPosts({
          location: selectedCity,
          position: searchQuery,
          openToWorkOnly: selectedType === 'OPEN_TO_WORK',
          type: selectedType !== 'ALL' && selectedType !== 'OPEN_TO_WORK' ? (selectedType as PostType) : undefined,
          limitCount: 40,
        });

        // Client-side filter for post types if needed
        let filtered = res.posts;
        if (selectedType === 'OPEN_TO_WORK') {
          filtered = filtered.filter((p) => p.type === 'OPEN_TO_WORK' || p.openToWork);
        } else if (selectedType !== 'ALL') {
          filtered = filtered.filter((p) => p.type === selectedType);
        }

        setPosts(filtered);
      } catch (err) {
        console.error('Error fetching feed posts:', err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [selectedCity, searchQuery, selectedType]
  );

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleOpenCreateFlow = () => {
    if (!currentUser) {
      if (onOpenAuthModal) onOpenAuthModal();
      return;
    }
    setIsChoiceModalOpen(true);
  };

  const handleSelectUserPostType = (type: PostType) => {
    setInitialPostType(type);
    setIsCreateModalOpen(true);
  };

  const handleSelectCompanyAction = (action: 'CREATE_JOB' | 'FIND_CANDIDATE' | 'CREATE_TEST') => {
    if (onOpenCompanyPortal) {
      onOpenCompanyPortal();
    }
  };

  const TYPE_FILTERS = [
    { key: 'ALL', label: 'Semua Konten' },
    { key: 'OPEN_TO_WORK', label: '🟣 Open to Work' },
    { key: 'PORTFOLIO', label: '💼 Portofolio' },
    { key: 'EXPERIENCE', label: '🏢 Pengalaman' },
    { key: 'CERTIFICATE', label: '🏆 Sertifikat' },
    { key: 'CAREER_TIPS', label: '💡 Tips Karier' },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-5 font-sans">
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-pink-500 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-pink-300 animate-pulse" />
            Social Recruitment Feed Jawa Barat
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Panggung Karier & Temukan Talenta
          </h2>
          <p className="text-xs sm:text-sm text-purple-100 max-w-xl leading-relaxed">
            Pencari kerja mempublikasikan ketersediaan kerja, portofolio, dan keahlian mereka. Perusahaan dapat menemukan kandidat siap kerja dan menghubungi langsung.
          </p>

          <div className="pt-2 flex items-center gap-3 flex-wrap">
            <button
              onClick={handleOpenCreateFlow}
              className="px-5 py-2.5 bg-white text-purple-800 hover:bg-purple-50 font-extrabold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 text-purple-600 stroke-[2.5]" />
              <span>+ Buat Postingan</span>
            </button>
            <button
              onClick={() => setIsGuidelinesOpen(true)}
              className="px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white font-bold text-xs rounded-xl backdrop-blur-md flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-pink-200" />
              <span>Pedoman Komunitas</span>
            </button>
          </div>
        </div>

        {/* Soft decorative background circles */}
        <div className="absolute -right-8 -bottom-8 w-60 h-60 bg-pink-400/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute right-1/3 -top-10 w-48 h-48 bg-purple-400/20 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-3xl border border-purple-100/90 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
          {/* Keyword search */}
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-purple-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari posisi, skill, atau kata kunci..."
              className="w-full text-xs pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-hidden bg-slate-50/50"
            />
          </div>

          {/* City select */}
          <div className="sm:col-span-4 relative">
            <MapPin className="w-4 h-4 text-purple-400 absolute left-3 top-3" />
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-hidden bg-slate-50/50"
            >
              {CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Refresh button */}
          <div className="sm:col-span-2 flex items-center">
            <button
              onClick={() => fetchPosts(true)}
              disabled={refreshing}
              className="w-full py-2.5 px-3 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-purple-200"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Segarkan</span>
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center justify-between pt-2 border-t border-purple-50 flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            {TYPE_FILTERS.map((item) => {
              const active = selectedType === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => setSelectedType(item.key)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer ${
                    active
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-purple-50/60 text-slate-600 hover:bg-purple-100/60 border border-purple-100'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <span className="text-[11px] text-slate-400 font-medium">
            Menampilkan {posts.length} postingan
          </span>
        </div>
      </div>

      {/* Feed Posts List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-3xl p-5 border border-purple-100/80 animate-pulse space-y-3 shadow-xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-100" />
                <div className="space-y-1.5">
                  <div className="w-32 h-4 bg-slate-200 rounded-md" />
                  <div className="w-24 h-3 bg-slate-200 rounded-md" />
                </div>
              </div>
              <div className="w-full h-16 bg-purple-50/50 rounded-2xl" />
              <div className="w-2/3 h-4 bg-slate-200 rounded-md" />
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        /* Empty state */
        <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-purple-100 shadow-xs space-y-4">
          <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-3xl flex items-center justify-center mx-auto border border-purple-200">
            <Users className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-lg font-extrabold text-slate-800">
              Belum Ada Postingan Sesuai Kriteria
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Jadilah yang pertama mengumumkan kualifikasi Anda kepada ratusan perusahaan di Jawa Barat yang sedang merekrut talenta terbaik.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={handleOpenCreateFlow}
              className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-500 hover:opacity-95 text-white text-xs font-bold rounded-xl shadow-md shadow-purple-500/20 inline-flex items-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Buat Postingan Sekarang</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUser={currentUser}
              onOpenAuthModal={onOpenAuthModal}
              onViewProfile={(p) => setSelectedProfilePost(p)}
              onContactCandidate={(p) => setSelectedContactPost(p)}
              onReportPost={(p) => setSelectedReportPost(p)}
              onPostUpdated={() => fetchPosts(false)}
            />
          ))}
        </div>
      )}

      {/* Choice Modal (Role-based) */}
      <CreatePostChoiceModal
        isOpen={isChoiceModalOpen}
        onClose={() => setIsChoiceModalOpen(false)}
        currentUser={currentUser}
        onSelectUserPostType={handleSelectUserPostType}
        onSelectCompanyAction={handleSelectCompanyAction}
        onOpenAuthModal={onOpenAuthModal}
      />

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        currentUser={currentUser}
        initialType={initialPostType}
        onSuccess={() => fetchPosts(false)}
      />

      {/* Candidate Profile Modal */}
      <CandidateProfileModal
        isOpen={Boolean(selectedProfilePost)}
        onClose={() => setSelectedProfilePost(null)}
        post={selectedProfilePost || undefined}
        onContact={() => {
          setSelectedContactPost(selectedProfilePost);
          setSelectedProfilePost(null);
        }}
      />

      {/* Contact Candidate Modal with Chat Integration */}
      <ContactCandidateModal
        isOpen={Boolean(selectedContactPost)}
        onClose={() => setSelectedContactPost(null)}
        post={selectedContactPost || undefined}
        currentUser={currentUser}
        onNavigateToChat={onNavigateToChat}
      />

      {/* Report Modal */}
      <ReportModal
        isOpen={Boolean(selectedReportPost)}
        onClose={() => setSelectedReportPost(null)}
        targetType="POST"
        targetId={selectedReportPost?.id || ''}
        targetUserId={selectedReportPost?.userId}
        targetUserName={selectedReportPost?.userName}
        targetContentSnippet={selectedReportPost?.content}
        reporterId={currentUser?.uid || 'guest'}
        reporterEmail={currentUser?.email}
        reporterName={currentUser?.name}
      />

      {/* Community Guidelines Modal */}
      <CommunityGuidelinesModal
        isOpen={isGuidelinesOpen}
        onClose={() => setIsGuidelinesOpen(false)}
      />
    </div>
  );
};
