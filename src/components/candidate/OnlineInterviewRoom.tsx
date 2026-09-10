import React, { useState, useEffect, useRef } from 'react';
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Send,
  ShieldAlert,
  Loader2,
  HelpCircle,
  Award,
  X,
} from 'lucide-react';
import { Interview, InterviewSession, InterviewQuestion } from '../../types';
import {
  apiSaveInterviewAnswer,
  apiSubmitInterviewSession,
  apiLogInterviewActivity,
  subscribeInterviewSession,
} from '../../services/interviewService';

interface OnlineInterviewRoomProps {
  interview: Interview;
  initialSession: InterviewSession;
  candidateId: string;
  onExit: () => void;
}

export const OnlineInterviewRoom: React.FC<OnlineInterviewRoomProps> = ({
  interview,
  initialSession,
  candidateId,
  onExit,
}) => {
  const [session, setSession] = useState<InterviewSession>(initialSession);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    Object.entries(initialSession.answers || {}).forEach(([qId, item]: [string, any]) => {
      map[qId] = item?.answer || '';
    });
    return map;
  });

  const [savingStatus, setSavingStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [timeLeftSec, setTimeLeftSec] = useState<number>(() => {
    const expiresMs = new Date(initialSession.expiresAt).getTime();
    return Math.max(0, Math.floor((expiresMs - Date.now()) / 1000));
  });

  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(
    initialSession.status === 'SUBMITTED' || initialSession.status === 'AUTO_SUBMITTED'
  );
  const [completedResult, setCompletedResult] = useState<{ score: number; passed: boolean } | null>(null);
  const [antiCheatWarning, setAntiCheatWarning] = useState<string | null>(null);

  const questions: InterviewQuestion[] = interview.questions || [];
  const currentQ: InterviewQuestion | undefined = questions[currentIdx];

  // Subscribe to real-time session updates from Firestore
  useEffect(() => {
    const unsub = subscribeInterviewSession(session.id, (updated) => {
      if (updated) {
        setSession(updated);
        if (updated.status === 'SUBMITTED' || updated.status === 'AUTO_SUBMITTED') {
          setIsCompleted(true);
          setCompletedResult({
            score: updated.companyFinalScore ?? updated.score ?? 0,
            passed: Boolean(updated.passed),
          });
        }
      }
    });
    return () => unsub();
  }, [session.id]);

  // Server-authoritative timer countdown
  useEffect(() => {
    if (isCompleted) return;

    const timer = setInterval(() => {
      const expiresMs = new Date(session.expiresAt).getTime();
      const diffSec = Math.max(0, Math.floor((expiresMs - Date.now()) / 1000));
      setTimeLeftSec(diffSec);

      if (diffSec <= 0) {
        clearInterval(timer);
        handleAutoSubmit();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [session.expiresAt, isCompleted]);

  // Anti-cheating activity listeners (visibility change & window blur)
  useEffect(() => {
    if (isCompleted) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setAntiCheatWarning('Peringatan: Berpindah tab terdeteksi dan tercatat dalam sistem audit ujian.');
        apiLogInterviewActivity({
          sessionId: session.id,
          candidateId,
          event: 'tab_switch',
          details: 'Kandidat meninggalkan jendela ujian (tab switch / background).',
        });
      }
    };

    const handleBlur = () => {
      apiLogInterviewActivity({
        sessionId: session.id,
        candidateId,
        event: 'window_blur',
        details: 'Kursor kandidat keluar dari area ujian (focus lost).',
      });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, [session.id, candidateId, isCompleted]);

  // Auto-save on answer change
  const handleAnswerChange = async (val: string) => {
    if (!currentQ || isCompleted) return;

    setAnswers((prev) => ({ ...prev, [currentQ.id]: val }));
    setSavingStatus('saving');

    try {
      const res = await apiSaveInterviewAnswer({
        sessionId: session.id,
        candidateId,
        questionId: currentQ.id,
        answer: val,
      });

      if (res.autoSubmitted) {
        setIsCompleted(true);
      }
      setSavingStatus('saved');
    } catch (err) {
      console.error('Error saving answer:', err);
      setSavingStatus('error');
    }
  };

  // Submit session
  const handleSubmitSession = async (isAuto = false) => {
    setIsSubmitting(true);
    try {
      const formattedAnswers: Record<string, { answer: string; answeredAt: string }> = {};
      Object.entries(answers).forEach(([qId, ans]: [string, string]) => {
        formattedAnswers[qId] = {
          answer: ans,
          answeredAt: new Date().toISOString(),
        };
      });

      const res = await apiSubmitInterviewSession({
        sessionId: session.id,
        candidateId,
        answers: formattedAnswers,
        isAutoSubmit: isAuto,
      });

      setCompletedResult({
        score: res.score,
        passed: res.passed,
      });
      setIsCompleted(true);
      setIsSubmitModalOpen(false);
    } catch (err) {
      console.error('Error submitting session:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAutoSubmit = () => {
    if (!isCompleted) {
      handleSubmitSession(true);
    }
  };

  const minutes = Math.floor(timeLeftSec / 60);
  const seconds = timeLeftSec % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const isTimeCritical = timeLeftSec <= 300; // Under 5 minutes

  const answeredCount = questions.filter((q) => answers[q.id]?.trim()).length;

  // Render Post-Submission Screen
  if (isCompleted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl max-w-lg w-full p-8 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-inner border border-emerald-200">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-2xl font-black text-slate-900">Interview Berhasil Diselesaikan!</h2>
            <p className="text-xs text-slate-500 mt-1">
              Jawaban Anda untuk <strong>{interview.interviewName}</strong> ({interview.position}) telah tersimpan aman di server DIGAWE YUK.
            </p>
          </div>

          {/* If company configured showResultToCandidate */}
          {interview.showResultToCandidate ? (
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">
                Hasil Penilaian Objektif
              </span>
              <div className="text-3xl font-black text-slate-900">
                {completedResult?.score ?? session.score ?? 0}{' '}
                <span className="text-sm font-medium text-slate-500">/ {session.maxScore} Poin</span>
              </div>
              <div>
                {(completedResult?.passed ?? session.passed) ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800">
                    <CheckCircle2 className="w-4 h-4" />
                    MEMENUHI NILAI MINIMAL (LULUS)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-800">
                    <AlertTriangle className="w-4 h-4" />
                    BELUM MEMENUHI NILAI MINIMAL
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Hasil evaluasi essay dan wawancara situasional akan ditinjau langsung oleh tim HR &amp; User.
              </p>
            </div>
          ) : (
            <div className="p-5 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 text-xs leading-relaxed">
              <Award className="w-6 h-6 mx-auto mb-2 text-blue-600" />
              <p className="font-bold">Jawaban Anda Sedang Ditinjau Tim Rekruter</p>
              <p className="text-blue-700 mt-1">
                Perusahaan akan mengumumkan keputusan kelulusan tahap ini melalui portal DIGAWE YUK.
              </p>
            </div>
          )}

          <button
            onClick={onExit}
            className="w-full py-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            Kembali ke Halaman Utama
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Top Header Bar */}
      <header className="bg-white border-b border-slate-200 px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3 truncate">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-black text-sm shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div className="truncate">
            <h1 className="text-sm font-black text-slate-900 truncate">{interview.interviewName}</h1>
            <p className="text-[11px] text-slate-500 truncate">
              {interview.companyName} • {interview.position} (Room: {interview.roomCode})
            </p>
          </div>
        </div>

        {/* Timer & Submit Action */}
        <div className="flex items-center gap-3 shrink-0">
          <div
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black tracking-wider transition-colors ${
              isTimeCritical
                ? 'bg-rose-50 text-rose-600 border border-rose-200 animate-pulse'
                : 'bg-indigo-50 text-indigo-900 border border-indigo-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>{timeFormatted}</span>
          </div>

          <button
            onClick={() => setIsSubmitModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Kirim Jawaban</span>
          </button>
        </div>
      </header>

      {/* Anti-cheat banner if triggered */}
      {antiCheatWarning && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-bold text-center flex items-center justify-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{antiCheatWarning}</span>
          <button
            onClick={() => setAntiCheatWarning(null)}
            className="ml-2 text-slate-900 hover:opacity-75"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Examination Layout */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Question Navigator (Sidebar on desktop) */}
        <div className="lg:col-span-1 space-y-4 order-2 lg:order-1">
          <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-extrabold text-slate-900">Daftar Soal</span>
              <span className="text-[11px] font-bold text-slate-500">
                {answeredCount} / {questions.length} Terjawab
              </span>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const isAnswered = Boolean(answers[q.id]?.trim());
                const isCurrent = idx === currentIdx;

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIdx(idx)}
                    className={`h-9 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-indigo-600 text-white shadow-md scale-105'
                        : isAnswered
                        ? 'bg-indigo-100 text-indigo-900 border border-indigo-200'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-[11px] text-slate-500">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-indigo-600" />
                <span>Soal Sedang Dibuka</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-indigo-100 border border-indigo-200" />
                <span>Sudah Dijawab</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-slate-100" />
                <span>Belum Dijawab</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs text-xs space-y-2">
            <span className="font-extrabold text-slate-900 block">Petunjuk Pengerjaan:</span>
            <p className="text-slate-500 text-[11px] leading-relaxed">{interview.instructions}</p>
          </div>
        </div>

        {/* Current Question View */}
        <div className="lg:col-span-3 space-y-4 order-1 lg:order-2">
          {currentQ ? (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between min-h-[500px]">
              <div>
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-50 text-indigo-700 uppercase">
                      Soal #{currentIdx + 1} dari {questions.length}
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-500 text-[11px] capitalize">
                      {currentQ.type.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-bold text-slate-500">
                      Bobot: <strong>{currentQ.points || 10} Poin</strong>
                    </span>
                    <span
                      className={`text-[10px] font-bold ${
                        savingStatus === 'saving'
                          ? 'text-amber-600'
                          : savingStatus === 'saved'
                          ? 'text-emerald-600'
                          : 'text-rose-600'
                      }`}
                    >
                      {savingStatus === 'saving' ? 'Menyimpan...' : 'Tersimpan'}
                    </span>
                  </div>
                </div>

                {/* Question Statement */}
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 leading-relaxed mb-6">
                  {currentQ.question}
                </h3>

                {/* Question Answer Inputs based on type */}
                {currentQ.type === 'multiple_choice' && currentQ.options && (
                  <div className="space-y-3">
                    {currentQ.options.map((opt, oIdx) => {
                      const isSelected = answers[currentQ.id] === opt;
                      return (
                        <div
                          key={oIdx}
                          onClick={() => handleAnswerChange(opt)}
                          className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-3 ${
                            isSelected
                              ? 'bg-indigo-50/70 border-indigo-600 text-indigo-950 font-bold shadow-xs'
                              : 'bg-white border-slate-200 text-slate-700 hover:border-indigo-200'
                          }`}
                        >
                          <span
                            className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black transition-colors ${
                              isSelected
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {String.fromCharCode(65 + oIdx)}
                          </span>
                          <span className="text-xs sm:text-sm">{opt}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {currentQ.type === 'true_false' && (
                  <div className="grid grid-cols-2 gap-4">
                    {['Benar', 'Salah'].map((choice) => {
                      const isSelected = answers[currentQ.id] === choice;
                      return (
                        <button
                          key={choice}
                          type="button"
                          onClick={() => handleAnswerChange(choice)}
                          className={`py-6 rounded-2xl border-2 font-black text-sm transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                              : 'bg-white text-slate-800 border-slate-200 hover:border-indigo-300'
                          }`}
                        >
                          {choice}
                        </button>
                      );
                    })}
                  </div>
                )}

                {currentQ.type === 'short_answer' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Tuliskan Jawaban Singkat Anda:
                    </label>
                    <input
                      type="text"
                      value={answers[currentQ.id] || ''}
                      onChange={(e) => handleAnswerChange(e.target.value)}
                      placeholder="Ketik jawaban di sini..."
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                )}

                {(currentQ.type === 'essay' || currentQ.type === 'situational' || currentQ.type === 'technical') && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Uraikan Jawaban / Solusi Kasus Anda:
                    </label>
                    <textarea
                      rows={6}
                      value={answers[currentQ.id] || ''}
                      onChange={(e) => handleAnswerChange(e.target.value)}
                      placeholder="Jelaskan langkah pemikiran, analisis, dan solusi Anda secara rinci..."
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500/20 leading-relaxed"
                    />
                  </div>
                )}
              </div>

              {/* Bottom Pagination Controls */}
              <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  disabled={currentIdx === 0}
                  onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Sebelumnya</span>
                </button>

                {currentIdx < questions.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentIdx((prev) => Math.min(questions.length - 1, prev + 1))}
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                  >
                    <span>Berikutnya</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsSubmitModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>Selesai &amp; Kirim Jawaban</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="py-20 text-center text-slate-400">Tidak ada butir soal.</div>
          )}
        </div>
      </main>

      {/* Submit Confirmation Modal */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
              <Send className="w-6 h-6" />
            </div>

            <h3 className="text-base font-black text-slate-900">Konfirmasi Pengiriman Jawaban</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Anda telah menjawab <strong>{answeredCount}</strong> dari <strong>{questions.length}</strong> butir soal.
              Setelah dikirimkan, Anda tidak dapat mengubah jawaban lagi.
            </p>

            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setIsSubmitModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Kembali Periksa
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSubmitSession(false)}
                className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>Ya, Kirim Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
