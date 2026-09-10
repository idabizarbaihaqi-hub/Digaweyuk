import React, { useState } from 'react';
import {
  Sparkles,
  Check,
  X,
  ShieldCheck,
  Zap,
  Building2,
  Award,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { CompanyProfile, User } from '../../types';
import { apiUpgradeCompanySubscription } from '../../services/interviewService';

interface CompanySubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: CompanyProfile | null;
  user: User | null;
  onUpgradeSuccess?: () => void;
}

export const CompanySubscriptionModal: React.FC<CompanySubscriptionModalProps> = ({
  isOpen,
  onClose,
  company,
  user,
  onUpgradeSuccess,
}) => {
  const companyId = company?.id || user?.uid || '';
  const isPremium = company?.subscription?.status === 'PREMIUM';

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleUpgrade = async () => {
    if (!companyId) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await apiUpgradeCompanySubscription({
        companyId,
        plan: 'COMPANY_PRO_MONTHLY',
      });
      setSuccessMsg(res.message);
      if (onUpgradeSuccess) onUpgradeSuccess();
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      console.error('Upgrade error:', err);
      setErrorMsg(err?.message || 'Gagal memproses upgrade.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative my-8">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-black mb-2">
            <Sparkles className="w-3.5 h-3.5 fill-amber-500" />
            <span>DIGAWE YUK COMPANY PREMIUM</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900">Tingkatkan Efisiensi Rekrutmen Anda</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
            Akses kuota tanpa batas untuk publikasi lowongan, ruang tes online berwaktu, dan kecerdasan AI.
          </p>
        </div>

        {successMsg && (
          <div className="p-4 mb-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs text-center font-bold flex items-center justify-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 mb-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs text-center font-bold">
            {errorMsg}
          </div>
        )}

        {/* Plan Comparison Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {/* FREE PLAN */}
          <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-extrabold text-slate-900 text-sm">FREE TIER</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                  Gratis
                </span>
              </div>
              <div className="text-xl font-black text-slate-900 mb-4">Rp 0</div>

              <ul className="space-y-2.5 text-xs text-slate-600">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Maksimal 3 Lowongan Aktif</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Maksimal 2 Ruang Online Interview</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Input Soal Manual</span>
                </li>
                <li className="flex items-center gap-2 text-slate-400 line-through">
                  <X className="w-3.5 h-3.5 shrink-0" />
                  <span>AI Question Generator</span>
                </li>
                <li className="flex items-center gap-2 text-slate-400 line-through">
                  <X className="w-3.5 h-3.5 shrink-0" />
                  <span>AI Essay Evaluation</span>
                </li>
              </ul>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200 text-center">
              <span className="text-[11px] font-bold text-slate-500">
                {!isPremium ? 'Paket Anda Saat Ini' : 'Paket Dasar'}
              </span>
            </div>
          </div>

          {/* PREMIUM PARTNER PLAN */}
          <div className="p-5 rounded-2xl border-2 border-amber-400 bg-gradient-to-b from-amber-50/50 to-white shadow-lg flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 px-3 py-1 bg-amber-400 text-slate-950 text-[10px] font-black rounded-bl-xl uppercase tracking-wider">
              TERPOPULER
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-extrabold text-slate-900 text-sm">PREMIUM PARTNER</h3>
              </div>
              <div className="text-xl font-black text-slate-900 mb-0.5">
                Rp 299.000 <span className="text-xs font-normal text-slate-500">/ bulan</span>
              </div>
              <p className="text-[10px] text-amber-700 font-bold mb-4">Akses Penuh Tanpa Batas</p>

              <ul className="space-y-2.5 text-xs text-slate-700">
                <li className="flex items-center gap-2 font-bold">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Lowongan Kerja Tanpa Batas (Unlimited)</span>
                </li>
                <li className="flex items-center gap-2 font-bold">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Ruang Online Test &amp; Interview Unlimited</span>
                </li>
                <li className="flex items-center gap-2 font-bold text-amber-800">
                  <Sparkles className="w-3.5 h-3.5 fill-amber-500 shrink-0" />
                  <span>AI Question Generator (Gemini)</span>
                </li>
                <li className="flex items-center gap-2 font-bold text-amber-800">
                  <Sparkles className="w-3.5 h-3.5 fill-amber-500 shrink-0" />
                  <span>AI Essay Evaluation Instan</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Badge Resmi "Terverifikasi / Premium"</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Prioritas Rekomendasi Kandidat</span>
                </li>
              </ul>
            </div>

            <div className="mt-6 pt-4 border-t border-amber-200/60">
              {isPremium ? (
                <div className="w-full py-2.5 rounded-xl bg-emerald-100 text-emerald-800 font-black text-xs text-center flex items-center justify-center gap-1.5">
                  <Check className="w-4 h-4" />
                  <span>Paket Anda Sedang Aktif</span>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleUpgrade}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black text-xs shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Zap className="w-4 h-4 fill-white" />
                  )}
                  <span>Aktifkan Paket Premium Sekarang</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="text-center text-[11px] text-slate-400">
          Dukungan pelanggan 24/7 resmi dari tim DIGAWE YUK Jawa Barat.
        </div>
      </div>
    </div>
  );
};
