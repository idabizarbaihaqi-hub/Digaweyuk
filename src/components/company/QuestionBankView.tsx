import React, { useState, useEffect } from 'react';
import {
  FileQuestion,
  Plus,
  Sparkles,
  Trash2,
  Edit2,
  Filter,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Layers,
  HelpCircle,
  Search,
  BookOpen,
} from 'lucide-react';
import { CompanyProfile, QuestionBankItem, InterviewQuestion, User } from '../../types';
import {
  subscribeQuestionBank,
  saveQuestionBankItem,
  deleteQuestionBankItem,
} from '../../services/companyService';
import { apiGenerateAIQuestions } from '../../services/interviewService';

interface QuestionBankViewProps {
  company: CompanyProfile | null;
  user: User | null;
  onOpenUpgradeModal: () => void;
}

export const QuestionBankView: React.FC<QuestionBankViewProps> = ({
  company,
  user,
  onOpenUpgradeModal,
}) => {
  const companyId = company?.id || user?.uid || '';
  const isPremium = company?.subscription?.status === 'PREMIUM';

  const [questions, setQuestions] = useState<QuestionBankItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');

  // Manual Question Modal
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [questionText, setQuestionText] = useState('');
  const [questionType, setQuestionType] = useState<'multiple_choice' | 'true_false' | 'short_answer' | 'essay' | 'situational' | 'technical'>('multiple_choice');
  const [options, setOptions] = useState<string[]>(['', '', '', '']);
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [points, setPoints] = useState(10);
  const [category, setCategory] = useState('Kompetensi Teknis');
  const [difficulty, setDifficulty] = useState<'Mudah' | 'Sedang' | 'Sulit'>('Sedang');
  const [savingManual, setSavingManual] = useState(false);

  // AI Generator Modal
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [aiPosition, setAiPosition] = useState('');
  const [aiDescription, setAiDescription] = useState('');
  const [aiLevel, setAiLevel] = useState('Entry / Junior');
  const [aiDifficulty, setAiDifficulty] = useState('Sedang');
  const [aiCount, setAiCount] = useState(5);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiResults, setAiResults] = useState<InterviewQuestion[]>([]);
  const [savingAIItems, setSavingAIItems] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
    if (!companyId) return;
    const unsub = subscribeQuestionBank(companyId, (items) => {
      setQuestions(items);
      setLoading(false);
    });
    return () => unsub();
  }, [companyId]);

  const handleOpenManualModal = (item?: QuestionBankItem) => {
    if (item) {
      setEditingItemId(item.id);
      setQuestionText(item.question);
      setQuestionType(item.type);
      setOptions(item.options || ['', '', '', '']);
      setCorrectAnswer(item.correctAnswer || '');
      setPoints(item.points || 10);
      setCategory(item.category || 'Umum');
      setDifficulty(item.difficulty || 'Sedang');
    } else {
      setEditingItemId(null);
      setQuestionText('');
      setQuestionType('multiple_choice');
      setOptions(['', '', '', '']);
      setCorrectAnswer('');
      setPoints(10);
      setCategory('Kompetensi Teknis');
      setDifficulty('Sedang');
    }
    setIsManualModalOpen(true);
  };

  const handleSaveManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId || !questionText.trim()) return;

    setSavingManual(true);
    try {
      const filteredOptions = options.map((o) => o.trim()).filter(Boolean);
      await saveQuestionBankItem(
        companyId,
        {
          question: questionText.trim(),
          type: questionType,
          options: filteredOptions.length > 0 ? filteredOptions : undefined,
          correctAnswer: correctAnswer.trim() || undefined,
          points: Number(points) || 10,
          category,
          difficulty,
          active: true,
        },
        editingItemId || undefined
      );

      setIsManualModalOpen(false);
    } catch (err) {
      console.error('Error saving question:', err);
    } finally {
      setSavingManual(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!window.confirm('Yakin ingin menghapus soal ini dari Bank Soal?')) return;
    try {
      await deleteQuestionBankItem(itemId);
    } catch (err) {
      console.error('Error deleting question:', err);
    }
  };

  // Generate with AI
  const handleGenerateAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPosition.trim()) return;

    setAiGenerating(true);
    setAiError(null);
    setAiResults([]);

    try {
      const res = await apiGenerateAIQuestions({
        position: aiPosition.trim(),
        description: aiDescription.trim(),
        level: aiLevel,
        difficulty: aiDifficulty,
        count: aiCount,
        types: ['multiple_choice', 'essay', 'situational'],
      });

      setAiResults(res.questions || []);
    } catch (err: any) {
      console.error('Error generating AI questions:', err);
      setAiError(err?.message || 'Gagal membuat soal dengan AI.');
    } finally {
      setAiGenerating(false);
    }
  };

  // Save all AI-generated questions into Question Bank
  const handleSaveAllAIToBank = async () => {
    if (!companyId || aiResults.length === 0) return;
    setSavingAIItems(true);
    try {
      for (const q of aiResults) {
        await saveQuestionBankItem(companyId, {
          question: q.question,
          type: q.type,
          options: q.options,
          correctAnswer: q.correctAnswer,
          points: q.points || 10,
          category: q.category || aiPosition,
          difficulty: (q.difficulty as any) || 'Sedang',
          active: true,
        });
      }
      setIsAIModalOpen(false);
      setAiResults([]);
    } catch (err) {
      console.error('Error saving AI questions to bank:', err);
    } finally {
      setSavingAIItems(false);
    }
  };

  // Filters
  const filteredQuestions = questions.filter((q) => {
    const matchSearch = (q.question || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = selectedCategory === 'all' || q.category === selectedCategory;
    const matchType = selectedType === 'all' || q.type === selectedType;
    return matchSearch && matchCat && matchType;
  });

  const categories = Array.from(new Set(questions.map((q) => q.category).filter(Boolean)));

  return (
    <div className="space-y-6">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">Bank Soal &amp; Generator AI</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Kumpulan soal tes online, studi kasus, dan wawancara yang dapat digunakan berulang kali.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAIModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 fill-white" />
            <span>Generate Soal dengan AI</span>
          </button>

          <button
            onClick={() => handleOpenManualModal()}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Soal Manual</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari teks soal..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
          >
            <option value="all">Semua Tipe Soal</option>
            <option value="multiple_choice">Pilihan Ganda</option>
            <option value="true_false">Benar / Salah</option>
            <option value="essay">Essay / Uraian</option>
            <option value="situational">Studi Kasus Situasional</option>
            <option value="technical">Tes Teknis</option>
          </select>

          {categories.length > 0 && (
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
            >
              <option value="all">Semua Kategori</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Question List */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
          <span className="text-xs font-medium">Memuat bank soal...</span>
        </div>
      ) : filteredQuestions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-black text-slate-900 mb-1">Bank Soal Masih Kosong</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mb-5 leading-relaxed">
            Belum ada soal yang tersimpan di Bank Soal. Anda dapat menambah soal manual atau menggunakan fitur AI Generator untuk membuat soal otomatis dalam hitungan detik.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setIsAIModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 text-white font-bold text-xs shadow-xs hover:bg-amber-600"
            >
              <Sparkles className="w-4 h-4 fill-white" />
              <span>Buat dengan AI</span>
            </button>
            <button
              onClick={() => handleOpenManualModal()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-700 text-white font-bold text-xs shadow-xs hover:bg-blue-800"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Manual</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredQuestions.map((q, idx) => (
            <div
              key={q.id}
              className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-blue-300 transition-all flex flex-col md:flex-row md:items-start justify-between gap-4"
            >
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-blue-50 text-blue-700 uppercase">
                    {q.type.replace('_', ' ')}
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600">
                    {q.category || 'Umum'}
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600">
                    Kesulitan: {q.difficulty || 'Sedang'}
                  </span>
                  <span className="text-[11px] font-bold text-slate-500">
                    Bobot: <strong>{q.points || 10} Poin</strong>
                  </span>
                </div>

                <p className="text-xs sm:text-sm font-bold text-slate-900 leading-relaxed mb-3">
                  {idx + 1}. {q.question}
                </p>

                {q.type === 'multiple_choice' && q.options && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {q.options.map((opt, oIdx) => {
                      const isCorrect = q.correctAnswer && opt.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
                      return (
                        <div
                          key={oIdx}
                          className={`p-2 rounded-xl border flex items-center gap-2 ${
                            isCorrect
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                              : 'bg-slate-50 border-slate-200 text-slate-700'
                          }`}
                        >
                          <span className="w-5 h-5 rounded-full bg-white border border-slate-300 flex items-center justify-center text-[10px] font-bold shrink-0">
                            {String.fromCharCode(65 + oIdx)}
                          </span>
                          <span className="truncate">{opt}</span>
                          {isCorrect && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 ml-auto shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {q.type === 'true_false' && (
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-slate-500">Kunci Jawaban:</span>
                    <strong className="text-emerald-700 font-black">{q.correctAnswer || '-'}</strong>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end md:self-start">
                <button
                  onClick={() => handleOpenManualModal(q)}
                  className="p-2 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                  title="Edit Soal"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteItem(q.id)}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Hapus Soal"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Manual Question Modal */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl relative my-8">
            <button
              onClick={() => setIsManualModalOpen(false)}
              className="absolute right-5 top-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-slate-900 mb-1">
              {editingItemId ? 'Edit Soal' : 'Tambah Soal ke Bank Soal'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Konfigurasikan teks pertanyaan, jenis soal, opsi pilihan, dan kunci jawaban.
            </p>

            <form onSubmit={handleSaveManual} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tipe Soal</label>
                  <select
                    value={questionType}
                    onChange={(e) => setQuestionType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-bold"
                  >
                    <option value="multiple_choice">Pilihan Ganda</option>
                    <option value="true_false">Benar / Salah</option>
                    <option value="essay">Essay / Uraian</option>
                    <option value="situational">Studi Kasus Situasional</option>
                    <option value="technical">Tes Teknis / Praktek</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tingkat Kesulitan</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                  >
                    <option value="Mudah">Mudah</option>
                    <option value="Sedang">Sedang</option>
                    <option value="Sulit">Sulit</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kategori / Kompetensi</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Misal: Pengetahuan Dasar, Pemrograman, Sikap Kerja"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Teks Pertanyaan *</label>
                <textarea
                  required
                  rows={3}
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder="Tuliskan pertanyaan ujian atau wawancara secara jelas..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                />
              </div>

              {/* Multiple Choice Options */}
              {questionType === 'multiple_choice' && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700">
                    Pilihan Jawaban &amp; Tandai Kunci Jawaban
                  </label>
                  {options.map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-black text-slate-600 shrink-0">
                        {String.fromCharCode(65 + i)}
                      </span>
                      <input
                        type="text"
                        required
                        value={opt}
                        onChange={(e) => {
                          const next = [...options];
                          next[i] = e.target.value;
                          setOptions(next);
                        }}
                        placeholder={`Opsi ${String.fromCharCode(65 + i)}`}
                        className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                      />
                      <input
                        type="radio"
                        name="correctOpt"
                        checked={Boolean(correctAnswer && correctAnswer === opt && opt.trim() !== '')}
                        onChange={() => setCorrectAnswer(opt)}
                        className="text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                        title="Pilih sebagai kunci jawaban yang benar"
                      />
                    </div>
                  ))}
                  <p className="text-[11px] text-slate-400 italic">
                    Klik tombol radio di sebelah kanan opsi yang merupakan jawaban benar.
                  </p>
                </div>
              )}

              {questionType === 'true_false' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kunci Jawaban Benar</label>
                  <select
                    value={correctAnswer}
                    onChange={(e) => setCorrectAnswer(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-bold"
                  >
                    <option value="">Pilih Kunci Jawaban</option>
                    <option value="Benar">Benar</option>
                    <option value="Salah">Salah</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Bobot Poin</label>
                <input
                  type="number"
                  value={points}
                  onChange={(e) => setPoints(Number(e.target.value))}
                  className="w-28 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-bold"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingManual}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-md disabled:opacity-50"
                >
                  {savingManual ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>Simpan ke Bank Soal</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Question Generator Modal */}
      {isAIModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative my-8">
            <button
              onClick={() => setIsAIModalOpen(false)}
              className="absolute right-5 top-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                <Sparkles className="w-5 h-5 fill-amber-500" />
              </div>
              <h3 className="text-lg font-black text-slate-900">AI Question Generator</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Buat paket soal tes objektif, studi kasus situasional, dan essay secara otomatis menggunakan kecerdasan buatan Google Gemini.
            </p>

            {aiError && (
              <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{aiError}</span>
              </div>
            )}

            {aiResults.length === 0 ? (
              <form onSubmit={handleGenerateAI} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Posisi / Profesi yang Dites *
                  </label>
                  <input
                    type="text"
                    required
                    value={aiPosition}
                    onChange={(e) => setAiPosition(e.target.value)}
                    placeholder="Contoh: Frontend Developer, Admin Gudang, Marketing Executive"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Level Pengalaman</label>
                    <select
                      value={aiLevel}
                      onChange={(e) => setAiLevel(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                    >
                      <option value="Entry / Fresh Graduate">Entry / Fresh Graduate</option>
                      <option value="Junior (1-2 Tahun)">Junior (1-2 Tahun)</option>
                      <option value="Mid-Level (3-5 Tahun)">Mid-Level (3-5 Tahun)</option>
                      <option value="Senior / Lead (> 5 Tahun)">Senior / Lead (&gt; 5 Tahun)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Tingkat Kesulitan</label>
                    <select
                      value={aiDifficulty}
                      onChange={(e) => setAiDifficulty(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                    >
                      <option value="Mudah">Mudah</option>
                      <option value="Sedang">Sedang</option>
                      <option value="Sulit">Sulit</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Jumlah Soal</label>
                    <input
                      type="number"
                      min={1}
                      max={15}
                      value={aiCount}
                      onChange={(e) => setAiCount(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Konteks / Ruang Lingkup Pekerjaan (Opsional)
                  </label>
                  <textarea
                    rows={3}
                    value={aiDescription}
                    onChange={(e) => setAiDescription(e.target.value)}
                    placeholder="Contoh: Perusahaan ritel modern membutuhkan staf yang cekatan, memahami Microsoft Excel, dan mampu mengelola persediaan stok."
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                  />
                </div>

                <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsAIModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={aiGenerating}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs shadow-md disabled:opacity-50 cursor-pointer"
                  >
                    {aiGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>AI sedang merancang soal...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 fill-white" />
                        <span>Generate Soal Sekarang</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                    Berhasil membuat {aiResults.length} butir soal AI
                  </span>
                  <button
                    onClick={() => setAiResults([])}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800"
                  >
                    Ulangi Generator
                  </button>
                </div>

                <div className="max-h-80 overflow-y-auto space-y-3 pr-1">
                  {aiResults.map((q, i) => (
                    <div key={i} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="font-extrabold text-blue-700 uppercase text-[10px]">
                          {q.type.replace('_', ' ')}
                        </span>
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-500 text-[10px]">Bobot: {q.points || 10} poin</span>
                      </div>
                      <p className="font-bold text-slate-900 mb-2">
                        {i + 1}. {q.question}
                      </p>
                      {q.options && (
                        <div className="grid grid-cols-2 gap-1.5 text-[11px] mb-2">
                          {q.options.map((opt, oIdx) => (
                            <div
                              key={oIdx}
                              className={`p-1.5 rounded-lg border ${
                                opt === q.correctAnswer
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-bold'
                                  : 'bg-white border-slate-200 text-slate-700'
                              }`}
                            >
                              {String.fromCharCode(65 + oIdx)}. {opt}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsAIModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                  >
                    Tutup
                  </button>
                  <button
                    type="button"
                    disabled={savingAIItems}
                    onClick={handleSaveAllAIToBank}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-md disabled:opacity-50 cursor-pointer"
                  >
                    {savingAIItems ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    <span>Simpan Semua Soal ke Bank Soal</span>
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
