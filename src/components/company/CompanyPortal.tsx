import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Briefcase,
  Users,
  Award,
  BookOpen,
  TrendingUp,
  Building2,
  Sparkles,
  ArrowLeft,
  Crown,
  Bell,
  LogOut,
  ChevronRight,
  UserCheck,
} from 'lucide-react';
import { User, CompanyProfile } from '../../types';
import { getCompanyProfile, subscribeCompanyProfile } from '../../services/companyService';
import { CompanyDashboardView } from './CompanyDashboardView';
import { CompanyJobsView } from './CompanyJobsView';
import { RecruitmentPipelineView } from './RecruitmentPipelineView';
import { CompanyInterviewsView } from './CompanyInterviewsView';
import { QuestionBankView } from './QuestionBankView';
import { CandidateRankingView } from './CandidateRankingView';
import { CompanyProfileView } from './CompanyProfileView';
import { CompanySubscriptionModal } from './CompanySubscriptionModal';
import { CandidateDiscoveryView } from './CandidateDiscoveryView';

interface CompanyPortalProps {
  user: User | null;
  onBackToJobSeeker: () => void;
  onLogout?: () => void;
}

export type CompanyNavTab =
  | 'overview'
  | 'jobs'
  | 'candidates'
  | 'pipeline'
  | 'interviews'
  | 'bank_soal'
  | 'ranking'
  | 'profile';

export const CompanyPortal: React.FC<CompanyPortalProps> = ({
  user,
  onBackToJobSeeker,
  onLogout,
}) => {
  const companyId = user?.companyId || user?.uid || '';

  const [activeTab, setActiveTab] = useState<CompanyNavTab>('overview');
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [selectedJobIdForPipeline, setSelectedJobIdForPipeline] = useState<string | null>(null);
  const [selectedInterviewIdForRanking, setSelectedInterviewIdForRanking] = useState<string | null>(null);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState<boolean>(false);

  useEffect(() => {
    if (!companyId) return;

    const unsub = subscribeCompanyProfile(companyId, (profile) => {
      setCompany(profile);
    });

    return () => unsub();
  }, [companyId]);

  const isPremium = company?.subscription?.status === 'PREMIUM';

  const navItems: { id: CompanyNavTab; label: string; icon: any }[] = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'jobs', label: 'Lowongan Kerja', icon: Briefcase },
    { id: 'candidates', label: 'Cari Kandidat', icon: UserCheck },
    { id: 'pipeline', label: 'Pipeline Rekrutmen', icon: Users },
    { id: 'interviews', label: 'Online Interview', icon: Award },
    { id: 'bank_soal', label: 'Bank Soal & AI', icon: BookOpen },
    { id: 'ranking', label: 'Hasil & Ranking', icon: TrendingUp },
    { id: 'profile', label: 'Profil Perusahaan', icon: Building2 },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Recruiter Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
          {/* Left Brand & Switch Mode */}
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToJobSeeker}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title="Kembali ke Mode Pencari Kerja"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-black text-slate-900 tracking-tight leading-none">
                  DIGAWE <span className="text-orange-600">YUK</span>
                </span>
                <span className="px-2 py-0.5 text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-200 rounded-md">
                  RECRUITER
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium truncate max-w-[200px] sm:max-w-xs mt-0.5">
                {company?.name || user?.name || 'Perusahaan'}
              </p>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {isPremium ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-300 text-amber-900 rounded-full text-xs font-black">
                <Sparkles className="w-3.5 h-3.5 fill-amber-500" />
                <span>PREMIUM PARTNER</span>
              </div>
            ) : (
              <button
                onClick={() => setIsUpgradeModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                <Crown className="w-3.5 h-3.5" />
                <span>Upgrade Premium</span>
              </button>
            )}

            <button
              onClick={onBackToJobSeeker}
              className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-blue-700 bg-slate-100 hover:bg-blue-50 rounded-xl transition-all"
            >
              <span>Mode Pencari Kerja</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Recruiter Navigation Bar */}
        <div className="border-t border-slate-100 bg-slate-50/70 overflow-x-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-1 min-w-max">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                  }}
                  className={`inline-flex items-center gap-2 py-3 px-3.5 text-xs font-extrabold border-b-2 transition-all cursor-pointer ${
                    isActive
                      ? 'text-blue-700 border-blue-700 bg-blue-50/50'
                      : 'text-slate-500 border-transparent hover:text-slate-900 hover:border-slate-300'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-700' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 md:p-8">
        {activeTab === 'overview' && (
          <CompanyDashboardView
            company={company}
            user={user}
            onNavigateTab={(tab) => {
              if (tab === 'buat_lowongan') {
                setActiveTab('jobs');
              } else if (tab === 'pipeline') {
                setActiveTab('pipeline');
              } else if (tab === 'interview') {
                setActiveTab('interviews');
              } else if (tab === 'bank_soal') {
                setActiveTab('bank_soal');
              }
            }}
            onOpenUpgradeModal={() => setIsUpgradeModalOpen(true)}
          />
        )}

        {activeTab === 'jobs' && (
          <CompanyJobsView
            company={company}
            user={user}
            onOpenUpgradeModal={() => setIsUpgradeModalOpen(true)}
            onSelectJobForPipeline={(jobId) => {
              setSelectedJobIdForPipeline(jobId);
              setActiveTab('pipeline');
            }}
          />
        )}

        {activeTab === 'candidates' && (
          <CandidateDiscoveryView
            company={company as any}
            currentUser={user}
            onRefreshCompany={() => {}}
          />
        )}

        {activeTab === 'pipeline' && (
          <RecruitmentPipelineView
            company={company}
            user={user}
            selectedJobId={selectedJobIdForPipeline}
          />
        )}

        {activeTab === 'interviews' && (
          <CompanyInterviewsView
            company={company}
            user={user}
            onOpenUpgradeModal={() => setIsUpgradeModalOpen(true)}
            onSelectInterviewForRanking={(invId) => {
              setSelectedInterviewIdForRanking(invId);
              setActiveTab('ranking');
            }}
          />
        )}

        {activeTab === 'bank_soal' && (
          <QuestionBankView
            company={company}
            user={user}
            onOpenUpgradeModal={() => setIsUpgradeModalOpen(true)}
          />
        )}

        {activeTab === 'ranking' && (
          <CandidateRankingView
            company={company}
            user={user}
            selectedInterviewId={selectedInterviewIdForRanking}
          />
        )}

        {activeTab === 'profile' && (
          <CompanyProfileView
            company={company}
            user={user}
            onOpenUpgradeModal={() => setIsUpgradeModalOpen(true)}
          />
        )}
      </main>

      {/* Upgrade Subscription Modal */}
      <CompanySubscriptionModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        company={company}
        user={user}
      />
    </div>
  );
};
