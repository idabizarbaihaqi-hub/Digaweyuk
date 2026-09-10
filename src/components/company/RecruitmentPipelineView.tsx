import React, { useState, useEffect } from 'react';
import {
  Users,
  Filter,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  Mail,
  Phone,
  Calendar,
  Award,
  ChevronRight,
  ShieldCheck,
  Search,
  Loader2,
  X,
  Send,
} from 'lucide-react';
import { JobApplication, PipelineStage, CompanyProfile, Job, Interview, User } from '../../types';
import {
  subscribeCompanyApplications,
  updateApplicationStage,
  getCompanyJobs,
  getCompanyInterviews,
} from '../../services/companyService';

interface RecruitmentPipelineViewProps {
  company: CompanyProfile | null;
  user: User | null;
  selectedJobId?: string | null;
}

const PIPELINE_STAGES: { key: PipelineStage; label: string; color: string; bg: string }[] = [
  { key: 'PELAMAR', label: 'Pelamar Masuk', color: 'text-slate-700', bg: 'bg-slate-100' },
  { key: 'SCREENING', label: 'Screening Berkas', color: 'text-blue-700', bg: 'bg-blue-100' },
  { key: 'INTERVIEW', label: 'Wawancara Awal', color: 'text-indigo-700', bg: 'bg-indigo-100' },
  { key: 'ONLINE TEST', label: 'Online Test & Interview', color: 'text-cyan-700', bg: 'bg-cyan-100' },
  { key: 'INTERVIEW HR', label: 'Interview HR / User', color: 'text-purple-700', bg: 'bg-purple-100' },
  { key: 'FINAL REVIEW', label: 'Final Review', color: 'text-amber-700', bg: 'bg-amber-100' },
  { key: 'DITERIMA', label: 'Diterima', color: 'text-emerald-700', bg: 'bg-emerald-100' },
  { key: 'DITOLAK', label: 'Ditolak', color: 'text-rose-700', bg: 'bg-rose-100' },
];

export const RecruitmentPipelineView: React.FC<RecruitmentPipelineViewProps> = ({
  company,
  user,
  selectedJobId: initialSelectedJobId,
}) => {
  const companyId = company?.id || user?.uid || '';
  const recruiterName = user?.name || company?.name || 'Recruiter';

  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>(initialSelectedJobId || 'all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // Selected application for detail modal
  const [activeApp, setActiveApp] = useState<JobApplication | null>(null);
  const [showMoveStageModal, setShowMoveStageModal] = useState<boolean>(false);
  const [targetStage, setTargetStage] = useState<PipelineStage>('SCREENING');
  const [stageNote, setStageNote] = useState<string>('');
  const [updatingStage, setUpdatingStage] = useState<boolean>(false);

  // Invite to interview modal
  const [showInviteModal, setShowInviteModal] = useState<boolean>(false);
  const [selectedInterviewId, setSelectedInterviewId] = useState<string>('');
  const [inviting, setInviting] = useState<boolean>(false);

  useEffect(() => {
    if (!companyId) return;

    const loadMeta = async () => {
      try {
        const [jobsList, interviewsList] = await Promise.all([
          getCompanyJobs(companyId),
          getCompanyInterviews(companyId),
        ]);
        setJobs(jobsList || []);
        setInterviews(interviewsList || []);
        if (interviewsList && interviewsList.length > 0) {
          setSelectedInterviewId(interviewsList[0].id);
        }
      } catch (err) {
        console.error('Error loading metadata:', err);
      }
    };

    loadMeta();

    const unsub = subscribeCompanyApplications(companyId, (apps) => {
      setApplications(apps);
      setLoading(false);
    });

    return () => unsub();
  }, [companyId]);

  const handleStageChange = async () => {
    if (!activeApp) return;
    setUpdatingStage(true);
    try {
      await updateApplicationStage(activeApp.id, targetStage, recruiterName, stageNote);
      setShowMoveStageModal(false);
      setStageNote('');
      // Update local active app modal state
      setActiveApp((prev) =>
        prev
          ? {
              ...prev,
              stage: targetStage,
              auditHistory: [
                ...(prev.auditHistory || []),
                {
                  stage: targetStage,
                  changedBy: recruiterName,
                  changedAt: new Date().toISOString(),
                  note: stageNote,
                },
              ],
            }
          : null
      );
    } catch (err) {
      console.error('Error updating application stage:', err);
    } finally {
      setUpdatingStage(false);
    }
  };

  const handleInviteToInterview = async () => {
    if (!activeApp || !selectedInterviewId) return;
    setInviting(true);
    try {
      const chosen = interviews.find((i) => i.id === selectedInterviewId);
      const note = `Diundang ke Online Interview: ${chosen?.interviewName || 'Online Test'} (Kode Room: ${chosen?.roomCode || '-'})`;
      await updateApplicationStage(activeApp.id, 'ONLINE TEST', recruiterName, note);
      setShowInviteModal(false);
      setActiveApp((prev) =>
        prev
          ? {
              ...prev,
              stage: 'ONLINE TEST',
              interviewStatus: 'INVITED',
              interviewId: selectedInterviewId,
            }
          : null
      );
    } catch (err) {
      console.error('Error inviting to interview:', err);
    } finally {
      setInviting(false);
    }
  };

  // Filter applications
  const filteredApps = applications.filter((app) => {
    const matchJob = selectedJobId === 'all' || app.jobId === selectedJobId;
    const matchSearch =
      (app.candidateName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.candidateEmail || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.jobTitle || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchJob && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">Recruitment Pipeline</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola tahapan seleksi kandidat secara real-time dari pelamar masuk hingga keputusan akhir.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="text-xs font-bold text-slate-700 bg-transparent border-none focus:outline-none"
            >
              <option value="all">Semua Lowongan ({applications.length} Pelamar)</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title}
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari kandidat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-white border border-slate-200/80 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>
      </div>

      {/* Kanban Board Layout */}
      {loading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
          <span className="text-xs text-slate-500 font-medium">Memuat pipeline rekrutmen...</span>
        </div>
      ) : (
        <div className="overflow-x-auto pb-4">
          <div className="inline-flex gap-4 min-w-full">
            {PIPELINE_STAGES.map((stage) => {
              const stageApps = filteredApps.filter((a) => a.stage === stage.key);
              return (
                <div
                  key={stage.key}
                  className="w-72 shrink-0 bg-slate-50 rounded-2xl p-3 border border-slate-200/80 flex flex-col max-h-[750px]"
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${stage.bg}`} />
                      <h4 className="text-xs font-black text-slate-800">{stage.label}</h4>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-white border border-slate-200 text-slate-700 shadow-xs">
                      {stageApps.length}
                    </span>
                  </div>

                  {/* Cards Container */}
                  <div className="overflow-y-auto space-y-2.5 flex-1 pr-1">
                    {stageApps.length === 0 ? (
                      <div className="py-8 text-center text-slate-400 text-[11px] font-medium border-2 border-dashed border-slate-200 rounded-xl">
                        Belum ada kandidat
                      </div>
                    ) : (
                      stageApps.map((app) => (
                        <div
                          key={app.id}
                          onClick={() => {
                            setActiveApp(app);
                            setTargetStage(app.stage);
                          }}
                          className="bg-white p-3.5 rounded-xl border border-slate-200/80 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <h5 className="text-xs font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors">
                              {app.candidateName}
                            </h5>
                          </div>

                          <div className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                            {app.jobTitle}
                          </div>

                          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                            <span>{new Date(app.appliedAt).toLocaleDateString('id-ID')}</span>
                            <span className="font-bold text-blue-600 group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-0.5">
                              Detail <ChevronRight className="w-3 h-3" />
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Candidate Detail & Action Drawer/Modal */}
      {activeApp && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl relative my-8">
            <button
              onClick={() => setActiveApp(null)}
              className="absolute right-5 top-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 font-black text-lg flex items-center justify-center border border-blue-200 shrink-0">
                {activeApp.candidateName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">{activeApp.candidateName}</h3>
                <p className="text-xs text-slate-500">
                  Melamar: <strong className="text-slate-800">{activeApp.jobTitle}</strong>
                </p>
              </div>
            </div>

            {/* Candidate Contacts */}
            <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-200/80 mb-5 text-xs text-slate-700">
              <div className="flex items-center gap-2 truncate">
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{activeApp.candidateEmail}</span>
              </div>
              <div className="flex items-center gap-2 truncate">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{activeApp.candidatePhone || 'Belum diisi'}</span>
              </div>
            </div>

            {/* Current Stage Badge */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-blue-50 border border-blue-200 mb-5">
              <div>
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
                  Tahap Seleksi Saat Ini
                </span>
                <span className="text-sm font-black text-blue-900">{activeApp.stage}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>Undang Interview</span>
                </button>
                <button
                  onClick={() => setShowMoveStageModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold shadow-xs transition-all"
                >
                  Pindah Tahap
                </button>
              </div>
            </div>

            {/* Cover Note & Resume */}
            <div className="space-y-3 mb-5 text-xs">
              {activeApp.coverNote && (
                <div>
                  <h4 className="font-bold text-slate-700 mb-1">Catatan Pelamar / Cover Letter:</h4>
                  <p className="p-3 bg-slate-50 rounded-xl text-slate-600 border border-slate-200 leading-relaxed">
                    {activeApp.coverNote}
                  </p>
                </div>
              )}

              {activeApp.resumeUrl && (
                <div>
                  <h4 className="font-bold text-slate-700 mb-1">Berkas CV / Resume:</h4>
                  <a
                    href={activeApp.resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all"
                  >
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span>Buka Tautan CV / Portofolio</span>
                  </a>
                </div>
              )}
            </div>

            {/* Stage Audit History */}
            <div>
              <h4 className="text-xs font-extrabold text-slate-900 mb-2">Riwayat Perjalanan Kandidat:</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {(activeApp.auditHistory || []).map((audit, i) => (
                  <div key={i} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px]">
                    <div className="flex items-center justify-between font-bold text-slate-800">
                      <span>{audit.stage}</span>
                      <span className="text-slate-400 font-normal">
                        {new Date(audit.changedAt).toLocaleString('id-ID')}
                      </span>
                    </div>
                    {audit.note && <div className="text-slate-600 mt-1 italic">"{audit.note}"</div>}
                    <div className="text-[10px] text-slate-400 mt-0.5">Oleh: {audit.changedBy}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Move Stage Modal */}
      {showMoveStageModal && activeApp && (
        <div className="fixed inset-0 z-60 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-base font-black text-slate-900 mb-1">Pindahkan Tahap Seleksi</h3>
            <p className="text-xs text-slate-500 mb-4">
              Pindahkan <strong>{activeApp.candidateName}</strong> ke tahap selanjutnya dalam proses rekrutmen.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Pilih Tahap Baru</label>
                <select
                  value={targetStage}
                  onChange={(e) => setTargetStage(e.target.value as PipelineStage)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-bold"
                >
                  {PIPELINE_STAGES.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Catatan Rekruter (Opsional)</label>
                <textarea
                  rows={3}
                  value={stageNote}
                  onChange={(e) => setStageNote(e.target.value)}
                  placeholder="Alasan pemindahan, hasil screening, atau catatan khusus..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                />
              </div>
            </div>

            <div className="pt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowMoveStageModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={updatingStage}
                onClick={handleStageChange}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-md disabled:opacity-50"
              >
                {updatingStage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                <span>Simpan Perubahan</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite to Interview Modal */}
      {showInviteModal && activeApp && (
        <div className="fixed inset-0 z-60 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-base font-black text-slate-900 mb-1">Undang ke Online Interview</h3>
            <p className="text-xs text-slate-500 mb-4">
              Kandidat akan dipindahkan ke tahap <strong>ONLINE TEST</strong> dan diberikan akses ke ruang tes online.
            </p>

            {interviews.length === 0 ? (
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-800 mb-4">
                Perusahaan Anda belum membuat ruang Online Interview aktif. Silakan buat interview terlebih dahulu di tab "Online Interview".
              </div>
            ) : (
              <div className="space-y-3 mb-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Pilih Ruang Interview</label>
                  <select
                    value={selectedInterviewId}
                    onChange={(e) => setSelectedInterviewId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-bold"
                  >
                    {interviews.map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        {inv.interviewName} (Kode: {inv.roomCode}) • {inv.durationMinutes} Menit
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={inviting || interviews.length === 0}
                onClick={handleInviteToInterview}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md disabled:opacity-50"
              >
                {inviting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>Kirim Undangan</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
