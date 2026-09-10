import React, { useState } from 'react';
import { X, ShieldAlert, Send, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { submitModerationAppeal } from '../../services/feedService';

interface AppealModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userEmail: string;
  userName: string;
  accountStatus: 'SUSPENDED' | 'BANNED';
  suspensionReason?: string;
  banReason?: string;
  suspendedUntil?: string;
}

export const AppealModal: React.FC<AppealModalProps> = ({
  isOpen,
  onClose,
  userId,
  userEmail,
  userName,
  accountStatus,
  suspensionReason,
  banReason,
  suspendedUntil,
}) => {
  const [statement, setStatement] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentReason = suspensionReason || banReason || 'Pelanggaran pedoman komunitas.';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statement.trim()) {
      setError('Harap masukkan alasan dan penjelasan banding Anda.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await submitModerationAppeal({
        userId,
        userEmail,
        userName,
        type: accountStatus === 'SUSPENDED' ? 'SUSPENSION' : 'BAN',
        reason: currentReason,
        statement: statement.trim(),
      });

      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setStatement('');
        onClose();
      }, 2500);
    } catch (err: any) {
      console.error('Error submitting appeal:', err);
      setError(err?.message || 'Gagal mengirim pengajuan banding.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-amber-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-xl">
              <ShieldAlert className="w-5 h-5 text-amber-100" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">Pengajuan Banding Akun</h3>
              <p className="text-xs text-amber-100">
                {accountStatus === 'SUSPENDED' ? 'Akun Sedang Ditangguhkan' : 'Akun Dinonaktifkan'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {submitted ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h4 className="font-bold text-slate-800 text-base">Banding Berhasil Diajukan</h4>
            <p className="text-xs text-slate-600 max-w-sm mx-auto">
              Tim Super Admin DIGAWE YUK akan meninjau penjelasan Anda. Hasil peninjauan akan diperbarui
              pada akun Anda.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
              <div className="font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Alasan Tindakan Moderasi:</span>
              </div>
              <p className="italic pl-5.5 text-amber-800">{currentReason}</p>
              {suspendedUntil && (
                <p className="pl-5.5 text-[11px] text-amber-700">
                  Masa penangguhan sampai: {new Date(suspendedUntil).toLocaleString('id-ID')}
                </p>
              )}
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Alasan & Penjelasan Pembelaan Anda <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={statement}
                onChange={(e) => setStatement(e.target.value)}
                placeholder="Tuliskan klarifikasi, itikad baik, atau penjelasan lengkap mengapa akun Anda layak dipulihkan..."
                rows={4}
                className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-hidden resize-none"
                required
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Harap berikan informasi yang jelas dan sopan kepada Tim Moderasi.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Mengirim...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Kirim Banding</span>
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
