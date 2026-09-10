import React, { useState, useEffect } from 'react';
import {
  Award,
  Plus,
  Clock,
  Users,
  Copy,
  Check,
  Calendar,
  Sparkles,
  Search,
  ExternalLink,
  ChevronRight,
  BookOpen,
  Trash2,
  AlertCircle,
  Loader2,
  X,
  FileQuestion,
  TrendingUp,
} from 'lucide-react';
import {
  CompanyProfile,
  Interview,
  Job,
  QuestionBankItem,
  InterviewQuestion,
  User,
} from '../../types';
import {
  subscribeCompanyInterviews,
  createInterview,
  updateInterview,
  deleteInterview,
  getCompanyJobs,
  getCompanyQuestionBank,
} from '../../services/companyService';
import { apiGenerateAIQuestions } from '../../services/interviewService';

interface CompanyInterviewsViewProps {
  company: CompanyProfile | null;
  user: User | null;
  onOpenUpgradeModal: () => void;
  onSelectInterviewForRanking: (interviewId: string) => void;
}

export const CompanyInterviewsView: React.FC<CompanyInterviewsViewProps> = ({
  company,
  user,
  onOpenUpgradeModal,
  onSelectInterviewForRanking,
}) => {
  const companyId = company?.id || user?.uid || '';
  const companyName = company?.name || user?.companyName || user?.name || 'Perusahaan';
  const isPremium = company?.subscription?.status === 'PREMIUM';

  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [questionBank, setQuestionBank] = useState<QuestionBankItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Create Interview Wizard State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form Fields
  const [interviewName, setInterviewName] = useState('');
  const [position, setPosition] = useState('');
  const [selectedJobId, setSelectedJobId] = useState('');
  const [instructions, setInstructions] = useState('Harap kerjakan secara jujur dan mandiri. Waktu akan terus berjalan setelah sesi dimulai.');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [maxAttempts, setMaxAttempts] = useState(1);
  const [minimumPassingScore, setMinimumPassingScore] = useState(70);
  const [showResultToCandidate, setShowResultToCandidate] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Questions to attach
  const [selectedQuestions, setSelectedQuestions] = useState<InterviewQuestion[]>([]);
  const [creating, setCreating] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Quick AI generator inside interview wizard
  const [quickAIGenerating, setQuickAIGenerating] = useState(false);

  useEffect(() => {
    if (!companyId) return;

    const loadMeta = async () => {
      try {
        const [jobsList, bankList] = await Promise.all([
          getCompanyJobs(companyId),
          getCompanyQuestionBank(companyId),
        ]);
        setJobs(jobsList || []);
        setQuestionBank(bankList || []);
      } catch (err) {
        console.error('Error loading metadata:', err);
      }
    };

    loadMeta();

    const unsub = subscribeCompanyInterviews(companyId, (list) => {
      setInterviews(list);
      setLoading(false);
    });

    return () => unsub();
  }, [companyId]);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleOpenCreateModal = () => {
    // Check free limit
    if (!isPremium && interviews.length >= 2) {
      onOpenUpgradeModal();
      return;
    }

    setStep(1);
    setInterviewName('');
    setPosition(jobs[0]?.title || '');
    setSelectedJobId(jobs[0]?.id || '');
    setDurationMinutes(30);
    setMaxAttempts(1);
    setMinimumPassingScore(70);
    setShowResultToCandidate(true);
    setSelectedQuestions([]);
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleToggleBankQuestion = (item: QuestionBankItem) => {
    const exists = selectedQuestions.find((q) => q.id === item.id);
    if (exists) {
      setSelectedQuestions(selectedQuestions.filter((q) => q.id !== item.id));
    } else {
      const newQ: InterviewQuestion = {
        id: item.id,
        question: item.question,
        type: item.type,
        options: item.options,
        correctAnswer: item.correctAnswer,
        points: item.points || 10,
        order: selectedQuestions.length + 1,
        required: true,
        category: item.category,
        difficulty: item.difficulty,
      };
      setSelectedQuestions([...selectedQuestions, newQ]);
    }
  };

  const handleQuickAIGenerate = async () => {
    if (!position.trim()) {
      setModalError('Masukkan posisi pekerjaan terlebih dahulu pada langkah 1.');
      return;
    }
    setQuickAIGenerating(true);
    setModalError(null);
    try {
      const res = await apiGenerateAIQuestions({
        position: position.trim(),
        count: 5,
        difficulty: 'Sedang',
      });
      const generated = res.questions || [];
      setSelectedQuestions((prev) => [...prev, ...generated]);
    } catch (err: any) {
      setModalError(err?.message || 'Gagal generate soal AI.');
    } finally {
      setQuickAIGenerating(false);
    }
  };

  const handleCreateInterview = async () => {
    if (!interviewName.trim() || !position.trim()) {
      setModalError('Nama interview dan posisi pekerjaan wajib diisi.');
      return;
    }
    if (selectedQuestions.length === 0) {
      setModalError('Sertakan minimal 1 butir soal untuk interview ini.');
      return;
    }

    setCreating(true);
    setModalError(null);

    // Generate unique Room Code (e.g. DGW-7492)
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const roomCode = `DGW-${randomSuffix}`;

    try {
      await createInterview({
        companyId,
        companyName,
        jobId: selectedJobId || undefined,
        interviewName: interviewName.trim(),
        position: position.trim(),
        roomCode,
        durationMinutes: Number(durationMinutes) || 30,
        maxAttempts: Number(maxAttempts) || 1,
        status: 'OPEN',
        questions: selectedQuestions,
        candidateInstructions: instructions,
        description: interviewName.trim(),
        minimumPassingScore: Number(minimumPassingScore) || 70,
        showResultToCandidate,
        startDate: startDate || new Date().toISOString(),
        endDate: endDate || new Date(Date.now() + 30 * 86400000).toISOString(),
        invitedCandidates: [],
      });

      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Error creating interview:', err);
      setModalError(err?.message || 'Gagal membuat ruang interview.');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleRoomStatus = async (interview: Interview) => {
    const newStatus = interview.status === 'OPEN' ? 'CLOSED' : 'OPEN';
    try {
      await updateInterview(interview.id, { status: newStatus });
    } catch (err) {
      console.error('Error updating interview status:', err);
    }
  };

  const handleDeleteInterview = async (interviewId: string) => {
    if (!window.confirm('Yakin ingin menghapus ruang interview ini?')) return;
    try {
      await deleteInterview(interviewId);
    } catch (err) {
      console.error('Error deleting interview:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">Online Interview Room</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Sistem ujian dan wawancara online terstandarisasi dengan kode ruangan unik untuk kandidat.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {!isPremium && (
            <div className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
              Kuota Free: <span className="text-indigo-700 font-extrabold">{interviews.length}/2</span> Ruang
            </div>
          )}
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Ruang Interview</span>
          </button>
        </div>
      </div>

      {/* Interview Rooms List */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
          <span className="text-xs font-medium">Memuat daftar interview...</span>
        </div>
      ) : interviews.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs">
          <Award className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-black text-slate-900 mb-1">Belum ada ruang interview</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mb-5 leading-relaxed">
            Buat ruang interview online untuk menguji kemampuan teknis, psikotes, atau studi kasus kandidat secara obyektif.
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-md hover:bg-indigo-700 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Ruang Sekarang</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {interviews.map((inv) => (
            <div
              key={inv.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-indigo-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <h3 className="text-base font-black text-slate-900">{inv.interviewName}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Posisi: {inv.position}</p>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                      inv.status === 'OPEN'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {inv.status === 'OPEN' ? 'RUANG DIBUKA' : 'DITUTUP'}
                  </span>
                </div>

                {/* Room Code Badge */}
                <div className="mt-3 p-3 rounded-xl bg-indigo-50/80 border border-indigo-200 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">
                      Kode Akses Ruangan (Room Code)
                    </span>
                    <span className="text-lg font-mono font-black text-indigo-900 tracking-wider">
                      {inv.roomCode}
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopyCode(inv.roomCode)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white text-indigo-700 text-xs font-bold shadow-xs hover:bg-indigo-100 transition-all"
                    title="Salin Kode Akses"
                  >
                    {copiedCode === inv.roomCode ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs py-2 border-y border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Durasi</span>
                    <strong className="text-slate-800">{inv.durationMinutes} Menit</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Passing Score</span>
                    <strong className="text-slate-800">{inv.minimumPassingScore} Poin</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Total Soal</span>
                    <strong className="text-slate-800">{(inv.questions || []).length} Butir</strong>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleRoomStatus(inv)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      inv.status === 'OPEN'
                        ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    }`}
                  >
                    {inv.status === 'OPEN' ? 'Tutup Ruang' : 'Buka Ruang'}
                  </button>

                  <button
                    onClick={() => handleDeleteInterview(inv.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                    title="Hapus Interview"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={() => onSelectInterviewForRanking(inv.id)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Hasil &amp; Ranking</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Wizard Modal: Buat Ruang Interview */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative my-8">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-5 top-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Stepper Header */}
            <div className="mb-6">
              <h3 className="text-xl font-black text-slate-900">Buat Ruang Online Interview Baru</h3>
              <p className="text-xs text-slate-500 mt-0.5">Langkah {step} dari 3</p>

              <div className="grid grid-cols-3 gap-2 mt-3">
                <div
                  className={`h-1.5 rounded-full ${
                    step >= 1 ? 'bg-indigo-600' : 'bg-slate-200'
                  }`}
                />
                <div
                  className={`h-1.5 rounded-full ${
                    step >= 2 ? 'bg-indigo-600' : 'bg-slate-200'
                  }`}
                />
                <div
                  className={`h-1.5 rounded-full ${
                    step >= 3 ? 'bg-indigo-600' : 'bg-slate-200'
                  }`}
                />
              </div>
            </div>

            {modalError && (
              <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            {/* STEP 1: Informasi & Jadwal */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama / Judul Interview *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Tes Teknis Frontend &amp; Karakter Kerja"
                    value={interviewName}
                    onChange={(e) => setInterviewName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Posisi Lowongan *</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Digital Marketer, Quality Control"
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Hubungkan ke Lowongan (Opsional)
                    </label>
                    <select
                      value={selectedJobId}
                      onChange={(e) => setSelectedJobId(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                    >
                      <option value="">-- Pilih Lowongan --</option>
                      {jobs.map((j) => (
                        <option key={j.id} value={j.id}>
                          {j.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Petunjuk Pengerjaan untuk Kandidat
                  </label>
                  <textarea
                    rows={3}
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                  />
                </div>

                <div className="pt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      if (!interviewName.trim() || !position.trim()) {
                        setModalError('Nama interview dan posisi lowongan wajib diisi.');
                        return;
                      }
                      setModalError(null);
                      setStep(2);
                    }}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-md hover:bg-indigo-700 cursor-pointer"
                  >
                    <span>Lanjut: Waktu &amp; Penilaian</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Pengaturan Waktu & Penilaian */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Durasi Pengerjaan (Menit)
                    </label>
                    <input
                      type="number"
                      min={5}
                      max={180}
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(Number(e.target.value))}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Kesempatan Ujian (Max Attempts)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={5}
                      value={maxAttempts}
                      onChange={(e) => setMaxAttempts(Number(e.target.value))}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nilai Minimal Lulus (Passing Score)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={minimumPassingScore}
                      onChange={(e) => setMinimumPassingScore(Number(e.target.value))}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-bold"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showResultToCandidate}
                      onChange={(e) => setShowResultToCandidate(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-xs font-bold text-slate-800">
                      Tampilkan Skor &amp; Kelulusan Langsung ke Kandidat Setelah Selesai
                    </span>
                  </label>
                  <p className="text-[11px] text-slate-500 mt-1 pl-6">
                    Jika tidak dicentang, kandidat hanya akan melihat status "Jawaban Terkirim, Sedang Ditinjau Tim Rekruter".
                  </p>
                </div>

                <div className="pt-3 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                  >
                    Kembali
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-md hover:bg-indigo-700 cursor-pointer"
                  >
                    <span>Lanjut: Pilih &amp; Susun Soal</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Pilih & Susun Soal */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-700">Daftar Soal Terpilih:</h4>
                    <p className="text-[11px] text-slate-400">
                      {selectedQuestions.length} butir soal dipilih • Total Poin:{' '}
                      {selectedQuestions.reduce((acc, q) => acc + (q.points || 10), 0)}
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={quickAIGenerating}
                    onClick={handleQuickAIGenerate}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {quickAIGenerating ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 fill-white" />
                    )}
                    <span>Generate 5 Soal AI</span>
                  </button>
                </div>

                {/* Selected Questions Preview */}
                {selectedQuestions.length > 0 && (
                  <div className="max-h-48 overflow-y-auto space-y-2 p-2 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                    {selectedQuestions.map((q, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 bg-white rounded-xl border border-indigo-100 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="truncate">
                          <span className="font-extrabold text-indigo-700 mr-1.5">#{idx + 1}</span>
                          <span className="font-bold text-slate-800">{q.question}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedQuestions(selectedQuestions.filter((_, i) => i !== idx))}
                          className="text-slate-400 hover:text-rose-600 shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Available from Question Bank */}
                <div>
                  <h4 className="text-xs font-bold text-slate-700 mb-2">
                    Atau Pilih dari Bank Soal ({questionBank.length} Soal Tersedia):
                  </h4>
                  {questionBank.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">
                      Bank soal masih kosong. Anda dapat menggunakan tombol "Generate 5 Soal AI" di atas.
                    </p>
                  ) : (
                    <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                      {questionBank.map((item) => {
                        const isSelected = Boolean(selectedQuestions.find((q) => q.id === item.id));
                        return (
                          <div
                            key={item.id}
                            onClick={() => handleToggleBankQuestion(item)}
                            className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between gap-2 ${
                              isSelected
                                ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-bold'
                                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <div className="truncate">
                              <span className="text-[10px] uppercase font-black mr-2 opacity-70">
                                {item.type.replace('_', ' ')}
                              </span>
                              <span>{item.question}</span>
                            </div>
                            <span
                              className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${
                                isSelected ? 'bg-indigo-600 text-white' : 'border border-slate-300'
                              }`}
                            >
                              {isSelected ? '✓' : '+'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="pt-3 flex items-center justify-between border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                  >
                    Kembali
                  </button>
                  <button
                    type="button"
                    disabled={creating || selectedQuestions.length === 0}
                    onClick={handleCreateInterview}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md disabled:opacity-50 cursor-pointer"
                  >
                    {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Award className="w-4 h-4" />}
                    <span>Terbitkan Ruang Interview</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
