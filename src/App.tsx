import React, { useState } from 'react';
import { Job, NavigationTab, ActivePage, PostType } from './types';
import { useAuth } from './hooks/useAuth';
import { useFirestoreJobs } from './hooks/useFirestoreJobs';
import { useSavedJobs } from './hooks/useSavedJobs';
import { Header } from './components/Header';
import { BottomNavigation } from './components/BottomNavigation';
import { HomeView } from './components/HomeView';
import { SearchView } from './components/SearchView';
import { SavedJobsView } from './components/SavedJobsView';
import { ProfileView } from './components/ProfileView';
import { JobDetail } from './components/JobDetail';
import { PremiumPage } from './components/PremiumPage';
import { AdminDashboard } from './components/AdminDashboard';
import { AuthModal } from './components/AuthModal';
import { PremiumModal } from './components/PremiumModal';
import { SplashScreen } from './components/SplashScreen';
import { CompanyPortal } from './components/company/CompanyPortal';
import { CandidateInterviewsView } from './components/candidate/CandidateInterviewsView';
import { SocialFeedView } from './components/feed/SocialFeedView';
import { ChatView } from './components/chat/ChatView';
import { CreatePostChoiceModal } from './components/feed/CreatePostChoiceModal';
import { CreatePostModal } from './components/feed/CreatePostModal';

export default function App() {
  // Splash Screen display state
  const [showSplash, setShowSplash] = useState<boolean>(true);

  // Real-time Firebase Authentication & User Profile from Firestore
  const { user, firebaseUser, loading: authLoading, logout, isPremium } = useAuth();

  // Real-time Cloud Firestore jobs collection
  const { jobs, loading: jobsLoading, error: jobsError } = useFirestoreJobs();

  // Real-time user saved jobs in Cloud Firestore
  const {
    savedJobIds,
    savedJobs,
    toggleSaveJob,
  } = useSavedJobs(user?.uid, jobs);

  // Active navigation tab
  const [currentTab, setCurrentTab] = useState<NavigationTab>('beranda');

  // Active full-screen view (e.g. job_detail, premium, admin, company_portal)
  const [activePage, setActivePage] = useState<ActivePage>('main');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  // Chat Navigation state
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  // Post creation modal states
  const [isChoiceModalOpen, setIsChoiceModalOpen] = useState(false);
  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);
  const [selectedPostType, setSelectedPostType] = useState<PostType>('OPEN_TO_WORK');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<string>('Semua Lokasi');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua Kategori');

  // Modals state
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState<boolean>(false);
  const [premiumModalTitle, setPremiumModalTitle] = useState<string>('Fitur Premium');
  const [premiumModalDesc, setPremiumModalDesc] = useState<string>(
    'Fitur ini tersedia untuk pengguna DIGAWE YUK Premium.'
  );

  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Trigger reusable Premium Upgrade modal
  const handleTriggerPremiumModal = (title: string, desc: string) => {
    setPremiumModalTitle(title);
    setPremiumModalDesc(desc);
    setIsPremiumModalOpen(true);
  };

  // Save / Bookmark toggle with Firestore persistence & Premium gating
  const handleToggleSaveJob = async (job: Job) => {
    if (!firebaseUser) {
      setAuthMode('login');
      setIsAuthModalOpen(true);
      return;
    }

    if (!isPremium) {
      handleTriggerPremiumModal(
        'Simpan Lowongan',
        'Simpan lowongan tanpa batas adalah fitur khusus DIGAWE YUK Premium. Upgrade sekarang untuk mengaktifkannya.'
      );
      return;
    }

    try {
      await toggleSaveJob(job);
    } catch (err: any) {
      console.error('Error saving job:', err);
    }
  };

  // Select job to view details
  const handleSelectJob = (job: Job) => {
    setSelectedJob(job);
    setActivePage('job_detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Switch to search with query
  const handleSearchSubmitFromHome = () => {
    setCurrentTab('cari');
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedLocation('Semua Lokasi');
    setSelectedCategory('Semua Kategori');
  };

  const subscriptionStatus = user?.subscriptionStatus || 'FREE';
  const isSuperAdmin =
    user?.email?.toLowerCase().trim() === 'id.agnesyakartika@gmail.com' &&
    user?.role === 'super_admin';

  const handleOpenAdmin = () => {
    if (isSuperAdmin) {
      setActivePage('admin');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setActivePage('main');
    }
  };

  const handleOpenCompanyPortal = () => {
    setActivePage('company_portal');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenCreateChoice = () => {
    if (!user) {
      setAuthMode('login');
      setIsAuthModalOpen(true);
      return;
    }
    setIsChoiceModalOpen(true);
  };

  const handleSelectUserPostType = (type: PostType) => {
    setSelectedPostType(type);
    setIsCreatePostModalOpen(true);
  };

  const handleSelectCompanyAction = (action: 'CREATE_JOB' | 'FIND_CANDIDATE' | 'CREATE_TEST') => {
    handleOpenCompanyPortal();
  };

  const handleNavigateToChat = (chatId: string) => {
    setActiveChatId(chatId);
    setActivePage('main');
    setCurrentTab('chat');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-purple-200">
      {/* Official Splash Screen */}
      {showSplash && (
        <SplashScreen
          onFinish={() => setShowSplash(false)}
          isReady={!authLoading}
        />
      )}

      {/* If Company Portal view is active */}
      {activePage === 'company_portal' ? (
        <CompanyPortal
          user={user}
          onBackToJobSeeker={() => setActivePage('main')}
          onLogout={logout}
        />
      ) : activePage === 'admin' ? (
        <AdminDashboard
          onBack={() => setActivePage('main')}
          jobs={jobs}
          user={user}
        />
      ) : activePage === 'premium' ? (
        <>
          <Header
            user={user}
            onOpenAdmin={handleOpenAdmin}
            onOpenCompanyPortal={handleOpenCompanyPortal}
            onOpenProfile={() => {
              setActivePage('main');
              setCurrentTab('profil');
            }}
            onGoToPremium={() => setActivePage('premium')}
            onOpenAuth={() => {
              setAuthMode('login');
              setIsAuthModalOpen(true);
            }}
            onOpenFeed={() => {
              setActivePage('main');
              setCurrentTab('feed');
            }}
            onOpenChat={() => {
              setActivePage('main');
              setCurrentTab('chat');
            }}
          />
          <PremiumPage
            subscriptionStatus={subscriptionStatus}
            onBack={() => setActivePage('main')}
            onActivateDemoPremium={() => {
              handleTriggerPremiumModal(
                'Uji Coba Premium',
                'Status langganan di Firestore dikunci oleh Security Rules server-side. Sistem pembayaran otomatis akan diintegrasikan pada tahap berikutnya.'
              );
            }}
            onActivateDemoFree={() => {}}
          />
        </>
      ) : activePage === 'job_detail' && selectedJob ? (
        <>
          <Header
            user={user}
            onOpenAdmin={handleOpenAdmin}
            onOpenCompanyPortal={handleOpenCompanyPortal}
            onOpenProfile={() => {
              setActivePage('main');
              setCurrentTab('profil');
            }}
            onGoToPremium={() => setActivePage('premium')}
            onOpenAuth={() => {
              setAuthMode('login');
              setIsAuthModalOpen(true);
            }}
            onOpenFeed={() => {
              setActivePage('main');
              setCurrentTab('feed');
            }}
            onOpenChat={() => {
              setActivePage('main');
              setCurrentTab('chat');
            }}
          />
          <JobDetail
            job={selectedJob}
            subscriptionStatus={subscriptionStatus}
            isSaved={savedJobIds.has(selectedJob.id)}
            onBack={() => setActivePage('main')}
            onToggleSave={handleToggleSaveJob}
            onTriggerPremiumModal={handleTriggerPremiumModal}
          />
        </>
      ) : (
        /* Main Navigation View */
        <>
          <Header
            user={user}
            onOpenAdmin={handleOpenAdmin}
            onOpenCompanyPortal={handleOpenCompanyPortal}
            onOpenProfile={() => setCurrentTab('profil')}
            onGoToPremium={() => setActivePage('premium')}
            onOpenAuth={() => {
              setAuthMode('login');
              setIsAuthModalOpen(true);
            }}
            onOpenFeed={() => setCurrentTab('feed')}
            onOpenChat={() => setCurrentTab('chat')}
          />

          <main className="flex-1 w-full pb-20">
            {/* 1. BERANDA */}
            {currentTab === 'beranda' && (
              <HomeView
                jobs={jobs}
                loading={jobsLoading}
                error={jobsError}
                subscriptionStatus={subscriptionStatus}
                savedJobIds={savedJobIds}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onSearchSubmit={handleSearchSubmitFromHome}
                onSelectJob={handleSelectJob}
                onToggleSave={handleToggleSaveJob}
                onGoToPremium={() => setActivePage('premium')}
                onGoToSearch={() => setCurrentTab('cari')}
                onTriggerPremiumModal={handleTriggerPremiumModal}
              />
            )}

            {/* 2. FEED KOMUNITAS REKRUTMEN */}
            {currentTab === 'feed' && (
              <div className="max-w-4xl mx-auto px-4 py-4 sm:py-6">
                <SocialFeedView
                  currentUser={user}
                  onOpenAuthModal={() => {
                    setAuthMode('login');
                    setIsAuthModalOpen(true);
                  }}
                  onNavigateToChat={handleNavigateToChat}
                  onOpenCompanyPortal={handleOpenCompanyPortal}
                />
              </div>
            )}

            {/* 3. CHAT */}
            {currentTab === 'chat' && (
              <div className="max-w-5xl mx-auto px-2 sm:px-4 py-4 sm:py-6">
                <ChatView
                  currentUser={user}
                  activeChatId={activeChatId}
                  onSelectChatId={setActiveChatId}
                  onOpenAuthModal={() => {
                    setAuthMode('login');
                    setIsAuthModalOpen(true);
                  }}
                />
              </div>
            )}

            {/* 4. CARI LOWONGAN */}
            {currentTab === 'cari' && (
              <SearchView
                jobs={jobs}
                loading={jobsLoading}
                error={jobsError}
                subscriptionStatus={subscriptionStatus}
                savedJobIds={savedJobIds}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                selectedLocation={selectedLocation}
                onSelectLocation={setSelectedLocation}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
                onResetFilters={handleResetFilters}
                onSelectJob={handleSelectJob}
                onToggleSave={handleToggleSaveJob}
                onTriggerPremiumModal={handleTriggerPremiumModal}
              />
            )}

            {/* 5. TERSIMPAN */}
            {currentTab === 'tersimpan' && (
              <SavedJobsView
                subscriptionStatus={subscriptionStatus}
                savedJobs={savedJobs}
                onSelectJob={handleSelectJob}
                onToggleSave={handleToggleSaveJob}
                onGoToPremium={() => setActivePage('premium')}
                onGoToSearch={() => setCurrentTab('cari')}
              />
            )}

            {/* 6. INTERVIEW SAYA */}
            {currentTab === 'interview_saya' && (
              <CandidateInterviewsView
                user={user}
                onOpenAuthModal={() => {
                  setAuthMode('login');
                  setIsAuthModalOpen(true);
                }}
              />
            )}

            {/* 7. PROFIL */}
            {currentTab === 'profil' && (
              <ProfileView
                user={user}
                onGoToPremium={() => setActivePage('premium')}
                onGoToSaved={() => setCurrentTab('tersimpan')}
                onOpenAdmin={handleOpenAdmin}
                onOpenCompanyPortal={handleOpenCompanyPortal}
                onOpenAuth={() => {
                  setAuthMode('login');
                  setIsAuthModalOpen(true);
                }}
                onLogout={logout}
              />
            )}
          </main>

          {/* Bottom Navigation for Mobile / Tablet */}
          <BottomNavigation
            currentTab={currentTab}
            onSelectTab={(tab) => {
              setActivePage('main');
              if (tab === 'buat') {
                handleOpenCreateChoice();
              } else {
                setCurrentTab(tab);
              }
            }}
            onOpenCreate={handleOpenCreateChoice}
          />
        </>
      )}

      {/* Choice Modal (Role-based: Pencari Kerja vs Perusahaan) */}
      <CreatePostChoiceModal
        isOpen={isChoiceModalOpen}
        onClose={() => setIsChoiceModalOpen(false)}
        currentUser={user}
        onSelectUserPostType={handleSelectUserPostType}
        onSelectCompanyAction={handleSelectCompanyAction}
        onOpenAuthModal={() => {
          setAuthMode('login');
          setIsAuthModalOpen(true);
        }}
      />

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={isCreatePostModalOpen}
        onClose={() => setIsCreatePostModalOpen(false)}
        currentUser={user}
        initialType={selectedPostType}
        onSuccess={() => {
          setIsCreatePostModalOpen(false);
          setActivePage('main');
          setCurrentTab('feed');
        }}
      />

      {/* Reusable Premium Modal for Locked Features */}
      <PremiumModal
        isOpen={isPremiumModalOpen}
        onClose={() => setIsPremiumModalOpen(false)}
        onGoToPremium={() => {
          setIsPremiumModalOpen(false);
          setActivePage('premium');
        }}
        featureTitle={premiumModalTitle}
        customDescription={premiumModalDesc}
      />

      {/* Auth Modal (Login & Register) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authMode}
      />
    </div>
  );
}
