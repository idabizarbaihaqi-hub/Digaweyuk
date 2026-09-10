import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Award,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Sparkles,
  ChevronRight,
  Filter,
  Users,
  Search,
  Check,
  Save,
  Loader2,
  X,
  FileText,
  ShieldAlert,
} from 'lucide-react';
import {
  CompanyProfile,
  Interview,
  InterviewSession,
  User,
} from '../../types';
import {
  getCompanyInterviews,
  subscribeInterviewSessions,
  saveCandidateRecruiterReview,
} from '../../services/companyService';
import { apiEvaluateAIEssay } from '../../services/interviewService';

interface CandidateRankingViewProps {
  company: CompanyProfile | null;
  user: User | null;
  selectedInterviewId?: string | null;
}

export const CandidateRankingView: React.FC<CandidateRankingViewProps> = ({
  company,
  user,
  selectedInterviewId: initialInterviewId,
}) => {
  const companyId = company?.id || user?.uid || '';
  const recruiterName = user?.name || company?.name || 'Recruiter';

  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [activeInterviewId, setActiveInterviewId] = useState<string>(initialInterviewId || '');
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Active Session Detail Modal
  const [selectedSession, setSelectedSession] = useState<InterviewSession | null>(null);
  const [evaluatingQId, setEvaluatingQId] = useState<string | null>(null);
  const [aiEvals, setAiEvals] = useState<Record<string, any>>({});
  const [recruiterScores, setRecruiterScores] = useState<Record<string, { score: number; note: string }>>({});
  const [recruiterFinalScore, setRecruiterFinalScore] = useState<number | ''>('');
  const [recruiterGeneralNote, setRecruiterGeneralNote] = useState('');
  const [savingReview, setSavingReview] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load interviews for this company
  useEffect(() => {
    if (!companyId) return;

    const loadInterviews = async () => {
      try {
        const list = await getCompanyInterviews(companyId);
        setInterviews(list || []);
        if (!activeInterviewId && list && list.length > 0) {
          setActiveInterviewId(list[0].id);
        }
      } catch (err) {
        console.error('Error loading interviews for ranking:', err);
      }
    };

    loadInterviews();
  }, [companyId]);

  // Subscribe to sessions for the selected interview
  useEffect(() => {
    if (!activeInterviewId) {
      setLoading(false);
      setSessions([]);
      return;
    }

    setLoading(true);
    const unsub = subscribeInterviewSessions(activeInterviewId, (list) => {
      setSessions(list || []);
      setLoading(false);
    });

    return () => unsub();
  }, [activeInterviewId]);

  const activeInterview = interviews.find((i) => i.id === activeInterviewId);

  // Sort sessions: Completed first, then by score descending, then by completion time ascending
  const sortedSessions = [...sessions].sort((a, b) => {
    const scoreA = a.companyFinalScore ?? a.score ?? -1;
    const scoreB = b.companyFinalScore ?? b.score ?? -1;
    if (scoreB !== scoreA) return scoreB - scoreA;
    return (a.completionTimeSeconds || 99999) - (b.completionTimeSeconds || 99999);
  });

  const filteredSessions = sortedSessions.filter((s) =>
    (s.candidateName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.candidateEmail || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenDetailModal = (session: InterviewSession) => {
    setSelectedSession(session);
    setRecruiterFinalScore(session.companyFinalScore ?? session.score ?? '');
    setRecruiterGeneralNote(session.recruiterNotes || '');
    setSaveSuccess(false);

    // Populate existing recruiter scores
    const initialScores: Record<string, { score: number; note: string }> = {};
    Object.entries(session.answers || {}).forEach(([qId, ans]) => {
      if (ans.recruiterScore !== undefined && ans.recruiterScore !== null) {
        initialScores[qId] = {
          score: ans.recruiterScore,
          note: ans.recruiterFeedback || '',
        };
      }
    });
    setRecruiterScores(initialScores);
  };

  const handleRunAIEval = async (questionText: string, candidateAns: string, qId: string, maxPoints: number) => {
    setEvaluatingQId(qId);
    try {
      const result = await apiEvaluateAIEssay({
        question: questionText,
        candidateAnswer: candidateAns,
        maxPoints,
        position: activeInterview?.position,
      });

      setAiEvals((prev) => ({ ...prev, [qId]: result }));
      // Pre-fill recruiter score with AI suggested score
      setRecruiterScores((prev) => ({
        ...prev,
        [qId]: {
          score: result.suggestedScore,
          note: result.reasoning,
        },
      }));
    } catch (err) {
      console.error('Error running AI eval:', err);
    } finally {
      setEvaluatingQId(null);
    }
  };

  const handleSaveReview = async () => {
    if (!selectedSession) return;
    setSavingReview(true);
    setSaveSuccess(false);

    try {
      const formattedQScores: Record<string, { recruiterScore: number; recruiterFeedback?: string }> = {};
      Object.entries(recruiterScores).forEach(([qId, val]: [string, any]) => {
        formattedQScores[qId] = {
          recruiterScore: val?.score || 0,
          recruiterFeedback: val?.note || '',
        };
      });

      await saveCandidateRecruiterReview(selectedSession.id, {
        companyFinalScore: typeof recruiterFinalScore === 'number' ? recruiterFinalScore : undefined,
        reviewedBy: recruiterName,
        recruiterNotes: recruiterGeneralNote,
        questionScores: formattedQScores,
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving review:', err);
    } finally {
      setSavingReview(false);
    }
  };

  const formatSeconds = (sec?: number) => {
    if (!sec) return '-';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s}d`;
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Select Room */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">Hasil &amp; Ranking Kandidat</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Leaderboard penilaian otomatis dan tinjauan essay berbasis AI untuk seleksi akhir.
          </p>
        </div>

        {interviews.length > 0 && (
          <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-xs">
            <Award className="w-4 h-4 text-indigo-600" />
            <select
              value={activeInterviewId}
              onChange={(e) => setActiveInterviewId(e.target.value)}
              className="text-xs font-bold text-slate-800 bg-transparent border-none focus:outline-none"
            >
              {interviews.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.interviewName} (Kode: {inv.roomCode})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Main Ranking Table Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Table Search & Meta */}
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari kandidat..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-bold text-slate-600">
            <span>Total Peserta: <strong className="text-slate-900">{sessions.length}</strong></span>
            <span>Passing Score: <strong className="text-indigo-700">{activeInterview?.minimumPassingScore || 70} Poin</strong></span>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
            <span className="text-xs text-slate-500">Memuat hasil kandidat...</span>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            <Users className="w-10 h-10 mx-auto mb-2 opacity-40 text-indigo-600" />
            <p className="font-bold text-slate-700 text-sm">Belum ada kandidat yang mengerjakan interview ini.</p>
            <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
              Bagikan kode ruangan <strong>{activeInterview?.roomCode}</strong> kepada kandidat pelamar agar mereka dapat mulai mengerjakan.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-black uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4 text-center w-12">Rank</th>
                  <th className="py-3 px-4">Nama Kandidat</th>
                  <th className="py-3 px-4 text-center">Skor Akhir</th>
                  <th className="py-3 px-4 text-center">Status Kelulusan</th>
                  <th className="py-3 px-4 text-center">Waktu Pengerjaan</th>
                  <th className="py-3 px-4 text-center">Waktu Kirim</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSessions.map((session, index) => {
                  const finalScore = session.companyFinalScore ?? session.score ?? 0;
                  const passingScore = activeInterview?.minimumPassingScore || 70;
                  const isPassed = finalScore >= passingScore;
                  const isSubmitted = session.status === 'SUBMITTED' || session.status === 'AUTO_SUBMITTED';

                  return (
                    <tr
                      key={session.id}
                      className="hover:bg-indigo-50/30 transition-colors cursor-pointer"
                      onClick={() => handleOpenDetailModal(session)}
                    >
                      <td className="py-3.5 px-4 text-center font-black">
                        {index === 0 ? (
                          <span className="w-6 h-6 rounded-full bg-amber-400 text-slate-900 inline-flex items-center justify-center font-black text-xs shadow-xs">
                            1
                          </span>
                        ) : index === 1 ? (
                          <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 inline-flex items-center justify-center font-black text-xs">
                            2
                          </span>
                        ) : index === 2 ? (
                          <span className="w-6 h-6 rounded-full bg-amber-700/20 text-amber-900 inline-flex items-center justify-center font-black text-xs">
                            3
                          </span>
                        ) : (
                          <span className="text-slate-400 font-bold">{index + 1}</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-slate-900">{session.candidateName}</div>
                        <div className="text-[11px] text-slate-400">{session.candidateEmail}</div>
                      </td>

                      <td className="py-3.5 px-4 text-center font-black text-sm">
                        {isSubmitted ? (
                          <span className={isPassed ? 'text-emerald-600' : 'text-rose-600'}>
                            {finalScore} <span className="text-[10px] text-slate-400 font-normal">/ {session.maxScore}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium italic">Sedang Mengerjakan</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {isSubmitted ? (
                          isPassed ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" />
                              LULUS
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-200">
                              <XCircle className="w-3 h-3" />
                              TIDAK LULUS
                            </span>
                          )
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            IN PROGRESS
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center text-slate-600 font-medium">
                        {formatSeconds(session.completionTimeSeconds)}
                      </td>

                      <td className="py-3.5 px-4 text-center text-[11px] text-slate-400">
                        {session.submittedAt
                          ? new Date(session.submittedAt).toLocaleTimeString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '-'}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDetailModal(session);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition-colors"
                        >
                          <span>Review</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Candidate Evaluation & Review Modal */}
      {selectedSession && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl relative my-8">
            <button
              onClick={() => setSelectedSession(null)}
              className="absolute right-5 top-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-50 text-indigo-700 border border-indigo-200">
                  LEMBAR JAWABAN &amp; EVALUASI
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs text-slate-500">{activeInterview?.interviewName}</span>
              </div>

              <h3 className="text-xl font-black text-slate-900 mt-1">
                {selectedSession.candidateName}
              </h3>
              <p className="text-xs text-slate-500">
                Email: {selectedSession.candidateEmail} • Waktu Pengerjaan:{' '}
                {formatSeconds(selectedSession.completionTimeSeconds)}
              </p>
            </div>

            {/* Score Banner */}
            <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 flex flex-wrap items-center justify-between gap-4 mb-6">
              <div>
                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-wider block">
                  Skor Objektif Sistem
                </span>
                <span className="text-2xl font-black text-indigo-900">
                  {selectedSession.score || 0}{' '}
                  <span className="text-xs text-indigo-600 font-normal">/ {selectedSession.maxScore} Poin</span>
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-600 uppercase">
                    Skor Akhir Rekruter
                  </label>
                  <input
                    type="number"
                    value={recruiterFinalScore}
                    onChange={(e) => setRecruiterFinalScore(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-24 px-3 py-1.5 bg-white border border-indigo-200 rounded-xl font-black text-indigo-900 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Questions Breakdown */}
            <div className="space-y-4 max-h-96 overflow-y-auto pr-1 mb-6">
              {(activeInterview?.questions || []).map((q, idx) => {
                const ansObj = selectedSession.answers?.[q.id];
                const candidateAns = ansObj?.answer || '';
                const isEssay = q.type === 'essay' || q.type === 'situational' || q.type === 'technical';
                const aiResult = aiEvals[q.id];

                return (
                  <div key={q.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="font-extrabold text-slate-900">
                        {idx + 1}. {q.question}
                      </div>
                      <span className="shrink-0 px-2 py-0.5 rounded-md text-[10px] font-bold bg-white text-slate-600 border border-slate-200">
                        Maks {q.points || 10} Poin
                      </span>
                    </div>

                    {/* Candidate's Answer */}
                    <div className="p-3 bg-white rounded-xl border border-slate-200 text-slate-800 mb-3">
                      <span className="text-[10px] font-bold text-slate-400 block mb-0.5">
                        Jawaban Kandidat:
                      </span>
                      <p className="font-medium whitespace-pre-wrap">{candidateAns || '(Tidak ada jawaban)'}</p>
                    </div>

                    {/* Correct Key (Objective) */}
                    {!isEssay && (
                      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/60">
                        <div>
                          Kunci Benar: <strong className="text-emerald-700">{q.correctAnswer}</strong>
                        </div>
                        <div>
                          Nilai Otomatis:{' '}
                          <strong className={ansObj?.isCorrect ? 'text-emerald-600' : 'text-rose-600'}>
                            {ansObj?.autoScore || 0} Poin
                          </strong>
                        </div>
                      </div>
                    )}

                    {/* Essay & Situational Evaluation with AI */}
                    {isEssay && (
                      <div className="space-y-3 pt-2 border-t border-slate-200">
                        <div className="flex items-center justify-between">
                          <button
                            type="button"
                            disabled={evaluatingQId === q.id || !candidateAns}
                            onClick={() => handleRunAIEval(q.question, candidateAns, q.id, q.points || 10)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] shadow-xs cursor-pointer disabled:opacity-50"
                          >
                            {evaluatingQId === q.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Sparkles className="w-3 h-3 fill-white" />
                            )}
                            <span>Evaluasi AI (Gemini)</span>
                          </button>

                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold text-slate-600">Nilai Reviewer:</span>
                            <input
                              type="number"
                              min={0}
                              max={q.points || 10}
                              value={recruiterScores[q.id]?.score ?? ''}
                              onChange={(e) =>
                                setRecruiterScores({
                                  ...recruiterScores,
                                  [q.id]: {
                                    score: Number(e.target.value),
                                    note: recruiterScores[q.id]?.note || '',
                                  },
                                })
                              }
                              className="w-16 px-2 py-1 bg-white border border-slate-200 rounded-lg font-black text-center"
                            />
                          </div>
                        </div>

                        {/* AI Evaluation Insights */}
                        {aiResult && (
                          <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 space-y-1.5">
                            <div className="flex items-center justify-between font-bold">
                              <span>Saran Skor AI: {aiResult.suggestedScore} / {q.points || 10} Poin</span>
                              <span className="text-[10px] uppercase font-black">{aiResult.relevance}</span>
                            </div>
                            <p className="text-[11px] leading-relaxed">{aiResult.reasoning}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Anti-cheating activity telemetry timeline */}
            {selectedSession.activityLog && selectedSession.activityLog.length > 0 && (
              <div className="mb-6 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2 mb-2 text-slate-800 font-extrabold text-xs">
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  <span>Log Integritas &amp; Anti-Cheating</span>
                </div>
                <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1 text-[11px]">
                  {selectedSession.activityLog.map((log, i) => (
                    <div key={i} className="flex items-center justify-between text-slate-600">
                      <span>• {log.details || log.event}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(log.timestamp).toLocaleTimeString('id-ID')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recruiter Notes Input */}
            <div className="mb-6">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Catatan Evaluasi / Rekomendasi HR
              </label>
              <textarea
                rows={2}
                value={recruiterGeneralNote}
                onChange={(e) => setRecruiterGeneralNote(e.target.value)}
                placeholder="Tuliskan catatan pertimbangan kelulusan kandidat..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              {saveSuccess && (
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                  <Check className="w-4 h-4" /> Review berhasil disimpan!
                </span>
              )}
              <div className="ml-auto flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedSession(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  disabled={savingReview}
                  onClick={handleSaveReview}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {savingReview ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Simpan Review &amp; Nilai</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
