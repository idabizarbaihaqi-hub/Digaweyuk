import React, { useState, useEffect } from 'react';
import {
  Award,
  Search,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Play,
  Loader2,
  Calendar,
  Building2,
  FileQuestion,
  TrendingUp,
} from 'lucide-react';
import { User, Interview, InterviewSession } from '../../types';
import {
  apiVerifyInterviewRoom,
  apiStartInterviewSession,
  getCandidateInterviewSessions,
} from '../../services/interviewService';
import { OnlineInterviewRoom } from './OnlineInterviewRoom';

interface CandidateInterviewsViewProps {
  user: User | null;
  onOpenAuthModal?: () => void;
}

export const CandidateInterviewsView: React.FC<CandidateInterviewsViewProps> = ({
  user,
  onOpenAuthModal,
}) => {
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [verifiedInterview, setVerifiedInterview] = useState<Interview | null>(null);

  // Active examination state
  const [activeExam, setActiveExam] = useState<{
    interview: Interview;
    session: InterviewSession;
  } | null>(null);

  // Candidate Sessions History
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;

    const loadHistory = async () => {
      setLoadingHistory(true);
      try {
        const list = await getCandidateInterviewSessions(user.uid);
        setSessions(list || []);
      } catch (err) {
        console.error('Error loading candidate sessions:', err);
      } finally {
        setLoadingHistory(false);
      }
    };

    loadHistory();
  }, [user?.uid, activeExam]);

  // Handle Verify Room Code
  const handleVerifyRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomCodeInput.trim()) return;

    setVerifying(true);
    setVerifyError(null);
    setVerifiedInterview(null);

    try {
      const interview = await apiVerifyInterviewRoom(roomCodeInput.trim());
      setVerifiedInterview(interview);
    } catch (err: any) {
      console.error('Verify error:', err);
      setVerifyError(err?.message || 'Kode ruangan tidak ditemukan atau sudah ditutup.');
    } finally {
      setVerifying(false);
    }
  };

  // Start the interview session
  const handleStartInterview = async (interview: Interview) => {
    if (!user) {
      if (onOpenAuthModal) onOpenAuthModal();
      return;
    }

    setStarting(true);
    setVerifyError(null);

    try {
      const res = await apiStartInterviewSession({
        interviewId: interview.id,
        candidateId: user.uid,
        candidateName: user.name || 'Kandidat',
        candidateEmail: user.email,
      });

      setActiveExam({
        interview: res.interview || interview,
        session: res.session,
      });
      setVerifiedInterview(null);
    } catch (err: any) {
      console.error('Start interview error:', err);
      setVerifyError(err?.message || 'Gagal memulai sesi interview.');
    } finally {
      setStarting(false);
    }
  };

  // If in active examination room, render fullscreen room
  if (activeExam && user) {
    return (
      <OnlineInterviewRoom
        interview={activeExam.interview}
        initialSession={activeExam.session}
        candidateId={user.uid}
        onExit={() => setActiveExam(null)}
      />
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Top Banner & Room Code Input */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-800 to-blue-900 rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="max-w-xl relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs text-xs font-black text-indigo-100 mb-3 border border-white/20">
            <Award className="w-3.5 h-3.5" />
            <span>ONLINE INTERVIEW &amp; TEST</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
            Masuk Ruang Interview &amp; Tes Kerja
          </h1>
          <p className="text-xs sm:text-sm text-indigo-100/90 mt-2 leading-relaxed">
            Masukkan Kode Ruangan (Room Code) yang Anda terima dari recruiter atau email undangan untuk memulai tes online.
          </p>

          {/* Room Code Form */}
          <form onSubmit={handleVerifyRoom} className="mt-6 flex flex-col sm:flex-row gap-2 max-w-md">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={roomCodeInput}
                onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                placeholder="Contoh: DGW-7492"
                className="w-full pl-10 pr-4 py-3 bg-white text-slate-900 font-mono font-bold text-sm rounded-2xl shadow-inner focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
            <button
              type="submit"
              disabled={verifying || !roomCodeInput.trim()}
              className="px-6 py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-2xl shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {verifying ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Periksa Ruangan</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {verifyError && (
            <div className="mt-3 text-xs font-bold text-amber-200 bg-black/20 p-2.5 rounded-xl inline-flex items-center gap-1.5 border border-amber-400/30">
              <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0" />
              <span>{verifyError}</span>
            </div>
          )}
        </div>
      </div>

      {/* Verified Room Preview Card */}
      {verifiedInterview && (
        <div className="bg-white rounded-3xl border-2 border-indigo-500/40 p-6 sm:p-8 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-4 border-b border-slate-100">
            <div>
              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2.5 py-0.5 rounded-full">
                RUANG INTERVIEW DITEMUKAN
              </span>
              <h2 className="text-xl font-black text-slate-900 mt-1">
                {verifiedInterview.interviewName}
              </h2>
              <p className="text-xs text-slate-500">
                {verifiedInterview.companyName} • Posisi: <strong>{verifiedInterview.position}</strong>
              </p>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-400 block font-bold">KODE AKSES</span>
              <span className="text-lg font-mono font-black text-indigo-900">
                {verifiedInterview.roomCode}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 text-center">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <Clock className="w-4 h-4 text-indigo-600 mx-auto mb-1" />
              <span className="text-[10px] text-slate-400 block">Durasi Pengerjaan</span>
              <strong className="text-xs font-black text-slate-800">
                {verifiedInterview.durationMinutes} Menit
              </strong>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <FileQuestion className="w-4 h-4 text-indigo-600 mx-auto mb-1" />
              <span className="text-[10px] text-slate-400 block">Jumlah Soal</span>
              <strong className="text-xs font-black text-slate-800">
                {(verifiedInterview.questions || []).length} Butir Soal
              </strong>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <TrendingUp className="w-4 h-4 text-indigo-600 mx-auto mb-1" />
              <span className="text-[10px] text-slate-400 block">Passing Score</span>
              <strong className="text-xs font-black text-slate-800">
                {verifiedInterview.minimumPassingScore} Poin
              </strong>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 mb-6">
            <h4 className="font-extrabold mb-1">Petunjuk Rekruter:</h4>
            <p className="leading-relaxed">{verifiedInterview.instructions}</p>
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setVerifiedInterview(null)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={starting}
              onClick={() => handleStartInterview(verifiedInterview)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-md disabled:opacity-50 cursor-pointer"
            >
              {starting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4 fill-white" />
              )}
              <span>Mulai Sesi Ujian Sekarang</span>
            </button>
          </div>
        </div>
      )}

      {/* Candidate's History Section */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-4">
        <div>
          <h3 className="text-base font-black text-slate-900">Riwayat Ujian &amp; Interview Saya</h3>
          <p className="text-xs text-slate-500">
            Daftar sesi tes online yang telah Anda ikuti dan status penilaiannya.
          </p>
        </div>

        {!user ? (
          <div className="py-12 text-center text-slate-400">
            <p className="text-xs font-medium mb-3">Silakan login untuk melihat riwayat ujian Anda.</p>
            <button
              onClick={onOpenAuthModal}
              className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-xs"
            >
              Masuk / Daftar Akun
            </button>
          </div>
        ) : loadingHistory ? (
          <div className="py-12 text-center text-slate-400 flex flex-col items-center">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mb-2" />
            <span className="text-xs font-medium">Memuat riwayat...</span>
          </div>
        ) : sessions.length === 0 ? (
          <div className="py-12 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
            <Award className="w-8 h-8 mx-auto mb-2 opacity-30 text-indigo-600" />
            <p className="text-xs font-bold text-slate-700">Belum ada riwayat interview.</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Gunakan kotak kode ruangan di atas untuk mengikuti tes online pertama Anda.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {sessions.map((sess) => (
              <div key={sess.id} className="py-4 flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-black text-slate-900">{sess.interviewTitle}</h4>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                    <span>{sess.companyName}</span>
                    <span>•</span>
                    <span>
                      {sess.submittedAt
                        ? new Date(sess.submittedAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                        : 'Sedang Berlangsung'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-xs font-black text-slate-900 block">
                      {sess.companyFinalScore ?? sess.score ?? 0}{' '}
                      <span className="text-[10px] text-slate-400 font-normal">/ {sess.maxScore} Poin</span>
                    </span>
                    <span
                      className={`inline-flex items-center text-[10px] font-bold ${
                        sess.passed ? 'text-emerald-600' : 'text-slate-500'
                      }`}
                    >
                      {sess.passed ? 'Lulus Passing Score' : 'Selesai Dikerjakan'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
