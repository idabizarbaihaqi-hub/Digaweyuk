export type SubscriptionStatus = 'FREE' | 'PREMIUM';

export type JobStatus = 'active' | 'closed' | 'expired';

export type SourceType =
  | 'official_company'
  | 'job_portal'
  | 'other_verified_source';

export type ValidationStatus = 'valid' | 'invalid' | 'needs_review';

export type EmploymentType =
  | 'Penuh Waktu'
  | 'Paruh Waktu'
  | 'Kontrak'
  | 'Magang'
  | 'Freelance'
  | 'Remote';

export type UserRole = 'user' | 'company' | 'admin' | 'super_admin';

export interface User {
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
  subscriptionStatus: SubscriptionStatus;
  role?: UserRole;
  companyId?: string;
  balance?: number;
  phone?: string;
  headline?: string;
  city?: string;
  province?: string;
  skills?: string[];
  experience?: string;
  education?: string;
  openToWork?: boolean;
  profileVisibility?: 'PUBLIC' | 'COMPANIES_ONLY' | 'PRIVATE';
  allowCompanyContact?: boolean;
  showExperience?: boolean;
  showEducation?: boolean;
  showSkills?: boolean;
  moderationStatus?: 'ACTIVE' | 'WARNING' | 'SUSPENDED' | 'BANNED';
  warningCount?: number;
  suspendedUntil?: string;
  suspensionReason?: string;
  bannedAt?: string;
  banReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Job {
  id: string;
  title: string;
  companyName: string;
  company: string; // backwards-compatible alias for companyName
  location: string;
  province: string;
  city: string;
  companyAddress: string;
  companyEmail: string | null;
  companyPhone: string | null;
  contactType: 'email' | 'phone' | 'both';
  contactSourceUrl?: string | null;
  category: string;
  salary: string | null;
  employmentType: EmploymentType;
  workModel?: 'onsite' | 'hybrid' | 'remote' | string;
  description: string;
  requirements: string[];
  qualifications?: string[];
  sourceName: string;
  sourceUrl: string;
  sourceType: SourceType;
  publishedAt: string;
  foundAt: string;
  applicationDeadline: string | null;
  expiresAt: string;
  status: JobStatus;
  verified: boolean; // backwards-compatible alias
  validationStatus: ValidationStatus;
  validationReason: string;
  companyVerified: boolean;
  locationVerified: boolean;
  addressVerified: boolean;
  contactVerified: boolean;
  sourceVerified: boolean;
  sourceCheckedAt: string;
  jobHash?: string;
  featured?: boolean;
  popular?: boolean;
  experience?: string;
  education?: string;
  responsibilities?: string[];
  deadline?: string;
  createdAt: string;
  updatedAt: string;
}

export interface JobHunterLog {
  id: string;
  runId?: string;
  startedAt: string;
  finishedAt: string;
  status: 'running' | 'success' | 'failed' | 'partial';
  totalDiscovered: number;
  totalAccepted: number;
  totalRejected: number;
  rejectedOutsideWestJava: number;
  rejectedNoAddress: number;
  rejectedNoContact: number;
  rejectedInvalidCompany: number;
  rejectedInvalidSource: number;
  duplicates: number;
  // Legacy aliases for backward compatibility
  jobsDiscovered?: number;
  jobsInserted?: number;
  jobsUpdated?: number;
  rejected?: number;
  validationFailed?: number;
  errors?: string[];
  executedBy?: string;
}

export interface JobHunterSettings {
  enabled: boolean;
  schedule: string;
  timezone: string;
  maxJobsPerRun: number;
  maxQueriesPerRun: number;
  maxAgeDays: number;
  searchLocations: string[];
  searchCategories: string[];
  updatedAt?: string;
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
  jobCount?: number;
}

export interface Location {
  id: string;
  name: string;
  jobCount?: number;
}

export interface Subscription {
  status: SubscriptionStatus;
  plan?: '7_hari' | '30_hari' | '90_hari';
  startDate?: string;
  endDate?: string;
}

export interface SavedJob {
  id: string;
  userId: string;
  jobId: string;
  createdAt: string;
  job?: Job;
}

export interface JobRecommendation {
  id: string;
  userId: string;
  jobId: string;
  job: Job;
  matchScore: number;
  reason: string;
}

export type NavigationTab =
  | 'beranda'
  | 'feed'
  | 'buat'
  | 'chat'
  | 'profil'
  | 'cari'
  | 'tersimpan'
  | 'interview_saya';

export type ActivePage =
  | 'main'
  | 'job_detail'
  | 'premium'
  | 'admin'
  | 'company_portal'
  | 'interview_room'
  | 'login'
  | 'register';

export type CompanyVerificationStatus = 'unverified' | 'pending' | 'verified';

export type CompanySubscriptionStatus = 'FREE' | 'PREMIUM' | 'EXPIRED' | 'CANCELLED';

export interface CompanySubscription {
  plan: string;
  status: CompanySubscriptionStatus;
  startAt: string;
  expiresAt: string | null;
  updatedAt: string;
}

export interface CompanyTrialStatus {
  liveInterviewUsed: boolean;
  onlineTestUsed: boolean;
  aiQuestionUsed: boolean;
  candidateDiscoveryUsed: boolean;
}

export interface CompanySubscriptionLimits {
  maxActiveJobs?: number;
  maxLiveInterviewsPerDay?: number;
  maxOnlineTestsPerDay?: number;
  maxAiQuestionsPerDay?: number;
}

export interface CompanyProfile {
  id: string; // matches companyId or user.uid
  name: string;
  logoUrl?: string;
  description: string;
  industry: string;
  address: string;
  city: string;
  province: string;
  website?: string;
  email: string;
  phone?: string;
  whatsapp?: string;
  foundedYear?: string;
  employeeCount?: string;
  verificationStatus: CompanyVerificationStatus;
  subscription: CompanySubscription;
  trial?: CompanyTrialStatus;
  limits?: CompanySubscriptionLimits;
  createdAt: string;
  updatedAt: string;
}

export type PipelineStage =
  | 'PELAMAR'
  | 'SCREENING'
  | 'SHORTLISTED'
  | 'INTERVIEW'
  | 'ONLINE TEST'
  | 'INTERVIEW HR'
  | 'FINAL REVIEW'
  | 'DITERIMA'
  | 'DITOLAK';

export interface ApplicationAuditItem {
  stage: PipelineStage;
  changedBy: string;
  changedAt: string;
  note?: string;
}

export interface JobApplication {
  id: string;
  jobId: string;
  jobTitle: string;
  companyId: string;
  companyName: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone?: string;
  resumeUrl?: string;
  coverNote?: string;
  stage: PipelineStage;
  appliedAt: string;
  updatedAt: string;
  interviewId?: string;
  interviewSessionId?: string;
  interviewScore?: number;
  interviewStatus?: 'NOT_INVITED' | 'INVITED' | 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED';
  auditHistory: ApplicationAuditItem[];
}

export type QuestionType =
  | 'multiple_choice'
  | 'true_false'
  | 'short_answer'
  | 'essay'
  | 'situational'
  | 'technical';

export interface InterviewQuestion {
  id: string;
  question: string;
  type: QuestionType;
  options?: string[];
  correctAnswer?: string;
  points: number;
  order?: number;
  required?: boolean;
  category?: string;
  difficulty?: 'Mudah' | 'Sedang' | 'Sulit';
}

export interface QuestionBankItem extends InterviewQuestion {
  companyId: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export type InterviewStatus =
  | 'DRAFT'
  | 'SCHEDULED'
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'CLOSED'
  | 'COMPLETED'
  | 'CANCELLED';

export interface InvitedCandidate {
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  invitedAt: string;
}

export interface Interview {
  id: string;
  companyId: string;
  companyName: string;
  interviewName: string;
  position: string;
  jobId?: string;
  roomCode: string;
  description: string;
  candidateInstructions: string;
  startDate: string;
  endDate: string;
  durationMinutes: number;
  minimumPassingScore: number;
  maxAttempts: number;
  status: InterviewStatus;
  showResultToCandidate: boolean;
  questions: InterviewQuestion[];
  invitedCandidates: InvitedCandidate[];
  createdAt: string;
  updatedAt: string;
}

export type InterviewSessionStatus =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'SUBMITTED'
  | 'AUTO_SUBMITTED'
  | 'EXPIRED'
  | 'CANCELLED';

export interface CandidateAnswerItem {
  questionId: string;
  answer: string;
  answeredAt: string;
  autoScore?: number;
  maxPoints?: number;
  isCorrect?: boolean;
  aiReview?: {
    suggestedScore: number;
    reasoning: string;
    strengths: string[];
    weaknesses: string[];
    relevance: string;
  };
  recruiterScore?: number;
  recruiterFeedback?: string;
}

export interface SuspiciousActivityItem {
  event: string;
  timestamp: string;
  details?: string;
}

export interface InterviewSession {
  id: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  companyId: string;
  companyName: string;
  interviewId: string;
  interviewName: string;
  position: string;
  startedAt: string;
  expiresAt: string;
  submittedAt?: string;
  status: InterviewSessionStatus;
  currentQuestionIndex: number;
  answers: Record<string, CandidateAnswerItem>;
  score: number | null;
  maxScore: number;
  percentage: number | null;
  passed: boolean | null;
  completionTimeSeconds?: number;
  activityLog: SuspiciousActivityItem[];
  aiOverallEvaluation?: string;
  companyFinalScore?: number;
  reviewedBy?: string;
  reviewedAt?: string;
  recruiterNotes?: string;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// TAHAP 5: SOCIAL RECRUITMENT & MODERATION
// ==========================================

export type PostType =
  | 'OPEN_TO_WORK'
  | 'PORTFOLIO'
  | 'EXPERIENCE'
  | 'CERTIFICATE'
  | 'CAREER_TIPS'
  | 'OTHER'
  | 'JOB_SEEKING';
export type PostStatus = 'ACTIVE' | 'ARCHIVED' | 'CLOSED';
export type PostModerationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'REMOVED';
export type PostVisibility = 'PUBLIC' | 'COMPANIES_ONLY' | 'PRIVATE';

export interface Post {
  id: string;
  postId?: string; // alias
  userId: string;
  userName: string;
  userAvatar?: string;
  userHeadline?: string;
  userVerified?: boolean;
  type: PostType;
  content: string;
  positionWanted: string;
  locationWanted: string;
  city?: string;
  province?: string;
  employmentType: string;
  experience: string;
  education: string;
  skills: string[];
  certifications?: string[];
  availability: string;
  salaryExpectation?: string;
  industryPreference?: string;
  isSeekingJob?: boolean;
  portfolioUrl?: string;
  imageUrl?: string;
  mediaUrls?: string[];
  openToWork: boolean;
  likesCount: number;
  commentsCount: number;
  likeCount?: number; // alias
  commentCount?: number; // alias
  shareCount?: number;
  saveCount?: number;
  viewsCount?: number;
  status: PostStatus;
  visibility: PostVisibility;
  moderationStatus: PostModerationStatus;
  moderationReason?: string;
  flaggedAsScam?: boolean;
  scamWarningText?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessageJobCard {
  jobId: string;
  jobTitle: string;
  companyName: string;
  location: string;
  salary?: string | null;
  employmentType?: string;
  category?: string;
}

export interface ChatMessageInterviewInvite {
  jobTitle: string;
  scheduledAt?: string;
  interviewDate?: string;
  interviewTime?: string;
  location?: string;
  locationOrLink?: string;
  notes?: string;
  interviewId?: string;
  status?: 'PENDING' | 'ACCEPTED' | 'REJECTED';
}

export interface ChatMessageApplicationCard {
  applicationId: string;
  jobId: string;
  jobTitle: string;
  candidateName: string;
  stage: PipelineStage;
  appliedAt: string;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderRole?: 'user' | 'company' | 'admin';
  text: string;
  isCompany?: boolean;
  isScamSuspect?: boolean;
  scamWarning?: string;
  jobCard?: ChatMessageJobCard;
  interviewInvite?: ChatMessageInterviewInvite;
  applicationCard?: ChatMessageApplicationCard;
  createdAt: string;
}

export interface ChatRoom {
  id: string;
  participants: string[];
  participantDetails: {
    [uid: string]: {
      name: string;
      role: string;
      avatar?: string;
      companyName?: string;
    };
  };
  lastMessage?: string;
  lastMessageAt?: string;
  lastSenderId?: string;
  unreadCounts?: {
    [uid: string]: number;
  };
  jobId?: string;
  jobTitle?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type:
    | 'LIKE'
    | 'COMMENT'
    | 'CHAT'
    | 'INTERVIEW_INVITE'
    | 'APPLICATION_UPDATE'
    | 'PREMIUM_APPROVED'
    | 'PREMIUM_REJECTED'
    | 'POST_APPROVED'
    | 'POST_REJECTED'
    | 'WARNING'
    | 'SYSTEM';
  read: boolean;
  link?: string;
  createdAt: string;
}

// ==========================================
// TAHAP 6: SUBSCRIPTION PACKAGES & MANUAL PAYMENT TYPES
// ==========================================

export interface SubscriptionPackage {
  id: string;
  packageId?: string;
  name: string;
  targetAudience: 'user' | 'company';
  price: number;
  durationDays: number;
  popular?: boolean;
  active: boolean;
  savingBadge?: string;
  desc?: string;
  features: string[];
  limits?: {
    maxActiveJobs?: number;
    maxLiveInterviewsPerDay?: number;
    maxOnlineTestsPerDay?: number;
    maxAiQuestionsPerDay?: number;
  };
  createdAt?: string;
  updatedAt?: string;
}

export type PaymentSubmissionStatus = 'PENDING_VERIFICATION' | 'APPROVED' | 'REJECTED';

export interface PaymentSubmission {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  targetType: 'user' | 'company';
  companyId?: string;
  companyName?: string;
  packageId: string;
  packageName: string;
  price: number;
  durationDays: number;
  bankDestination: string;
  senderBank?: string;
  senderAccountName: string;
  paymentProofUrl: string; // base64 data url or storage url
  notes?: string;
  status: PaymentSubmissionStatus;
  rejectReason?: string;
  approvedAt?: string;
  rejectedAt?: string;
  processedBy?: string;
  submittedAt: string;
  updatedAt: string;
}

export interface PostLike {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  createdAt: string;
}

export interface PostComment {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  moderationStatus?: PostModerationStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface SavedPost {
  id: string;
  userId: string;
  postId: string;
  postTitle?: string;
  savedAt: string;
}

export type ReportCategory =
  | 'SPAM'
  | 'PENIPUAN'
  | 'LOWONGAN_PALSU'
  | 'PELECEHAN'
  | 'PENGHINAAN'
  | 'KONTEN_TIDAK_PANTAS'
  | 'INFORMASI_PALSU'
  | 'AKUN_PALSU'
  | 'LAINNYA';

export type ReportTargetType = 'POST' | 'COMMENT' | 'USER' | 'COMPANY' | 'JOB';
export type ReportStatus = 'OPEN' | 'REVIEWING' | 'RESOLVED' | 'DISMISSED';

export interface ModerationReport {
  id: string;
  targetType: ReportTargetType;
  targetId: string;
  targetUserId?: string;
  targetUserName?: string;
  targetContentSnippet?: string;
  reporterId: string;
  reporterEmail?: string;
  reporterName?: string;
  category: ReportCategory;
  reason: string;
  status: ReportStatus;
  aiAnalysis?: {
    isSuspicious: boolean;
    flags: string[];
    confidence: number;
    summary: string;
  };
  resolvedBy?: string;
  resolutionAction?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserWarning {
  id: string;
  userId: string;
  adminId: string;
  adminEmail?: string;
  reason: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  createdAt: string;
  acknowledged?: boolean;
}

export interface ModerationAppeal {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  type: 'SUSPENSION' | 'BAN' | 'WARNING';
  reason: string;
  statement: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  adminNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface ModerationLog {
  id: string;
  adminId: string;
  adminEmail: string;
  action:
    | 'APPROVE_POST'
    | 'REMOVE_POST'
    | 'REMOVE_COMMENT'
    | 'WARN_USER'
    | 'SUSPEND_USER'
    | 'BAN_USER'
    | 'UNBAN_USER'
    | 'DISMISS_REPORT'
    | 'RESOLVE_APPEAL';
  targetType: 'POST' | 'COMMENT' | 'USER' | 'COMPANY';
  targetId: string;
  targetUserId?: string;
  reason: string;
  durationHours?: number;
  createdAt: string;
}

