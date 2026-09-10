import React, { useState } from 'react';
import { X, Flag, AlertTriangle, Send, Loader2, CheckCircle2 } from 'lucide-react';
import { ReportCategory, ReportTargetType } from '../../types';
import { createModerationReport } from '../../services/feedService';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: ReportTargetType;
  targetId: string;
  targetUserId?: string;
  targetUserName?: string;
  targetContentSnippet?: string;
  reporterId: string;
  reporterEmail?: string;
  reporterName?: string;
}

const CATEGORIES: { value: ReportCategory; label: string; desc: string }[] = [
  { value: 'PENIPUAN', label: 'Penipuan / Scam', desc: 'Permintaan uang, biaya tes/interview, atau lowongan palsu.' },
  { value: 'SPAM', label: 'Spam / Iklan Ilegal', desc: 'Postingan berulang, promosi produk tidak relevan.' },
  { value: 'LOWONGAN_PALSU', label: 'Lowongan Kerja Fiktif', desc: 'Perusahaan atau lowongan tidak terbukti nyata.' },
  { value: 'PELECEHAN', label: 'Pelecehan / Tidak Senonoh', desc: 'Pelecehan seksual, ancaman, atau pesan tidak pantas.' },
  { value: 'PENGHINAAN', label: 'Ujaran Kebencian & SARA', desc: 'Penghinaan suku, agama, ras, atau individu.' },
  { value: 'INFORMASI_PALSU', label: 'Informasi Palsu', desc: 'Mengaku pengalaman/kualifikasi palsu.' },
  { value: 'AKUN_PALSU', label: 'Akun Palsu / Kloning', desc: 'Menyamar sebagai orang atau perusahaan lain.' },
  { value: 'KONTEN_TIDAK_PANTAS', label: 'Konten Tidak Pantas', desc: 'Melanggar norma umum dan profesional.' },
  { value: 'LAINNYA', label: 'Lainnya', desc: 'Pelanggaran pedoman komunitas lainnya.' },
];

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  targetType,
  targetId,
  targetUserId,
  targetUserName,
  targetContentSnippet,
  reporterId,
  reporterEmail,
  reporterName,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<ReportCategory>('PENIPUAN');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Harap tuliskan alasan atau detail laporan Anda.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await createModerationReport({
        targetType,
        targetId,
        targetUserId,
        targetUserName,
        targetContentSnippet: targetContentSnippet?.slice(0, 180),
        reporterId,
        reporterEmail,
        reporterName,
        category: selectedCategory,
        reason: reason.trim(),
      });

      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setReason('');
        onClose();
      }, 2000);
    } catch (err: any) {
      console.error('Error submitting report:', err);
      setError(err?.message || 'Gagal mengirimkan laporan.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-rose-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-xl">
              <Flag className="w-5 h-5 text-rose-100" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">Laporkan Konten / Akun</h3>
              <p className="text-xs text-rose-100">Bantu jaga keamanan komunitas DIGAWE YUK</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        {submitted ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h4 className="font-bold text-slate-800 text-base">Laporan Berhasil Terkirim</h4>
            <p className="text-xs text-slate-600 max-w-sm mx-auto">
              Terima kasih atas laporan Anda. Tim Moderasi DIGAWE YUK akan segera meninjau konten ini sesuai
              dengan Pedoman Komunitas.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
            {targetContentSnippet && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
                <span className="font-semibold text-slate-800 block mb-1">Objek Laporan:</span>
                <p className="italic line-clamp-2">"{targetContentSnippet}"</p>
                {targetUserName && (
                  <span className="text-[11px] text-slate-500 block mt-1">Oleh: {targetUserName}</span>
                )}
              </div>
            )}

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Pilih Kategori Pelanggaran <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
                {CATEGORIES.map((cat) => (
                  <label
                    key={cat.value}
                    className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex flex-col ${
                      selectedCategory === cat.value
                        ? 'border-rose-500 bg-rose-50/70 text-rose-900 font-medium shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{cat.label}</span>
                      <input
                        type="radio"
                        name="report_cat"
                        value={cat.value}
                        checked={selectedCategory === cat.value}
                        onChange={() => setSelectedCategory(cat.value)}
                        className="text-rose-600 focus:ring-rose-500 h-3.5 w-3.5"
                      />
                    </div>
                    <span className="text-[11px] text-slate-500 mt-0.5">{cat.desc}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Keterangan & Bukti Pelanggaran <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Jelaskan alasan laporan atau bukti yang Anda temukan secara rinci..."
                rows={3}
                className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-hidden resize-none"
                required
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Mengirim...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Kirim Laporan</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
