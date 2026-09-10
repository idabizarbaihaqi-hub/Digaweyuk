import React, { useState } from 'react';
import {
  Crown,
  CheckCircle2,
  Rocket,
  Heart,
  Target,
  Sparkles,
  Zap,
  ArrowLeft,
  Check,
  ShieldCheck,
  Info,
} from 'lucide-react';
import { SubscriptionStatus } from '../types';

interface PremiumPageProps {
  subscriptionStatus: SubscriptionStatus;
  onBack: () => void;
  onActivateDemoPremium: () => void;
  onActivateDemoFree: () => void;
}

export const PremiumPage: React.FC<PremiumPageProps> = ({
  subscriptionStatus,
  onBack,
  onActivateDemoPremium,
  onActivateDemoFree,
}) => {
  const [selectedPlan, setSelectedPlan] = useState<'7' | '30' | '90'>('30');
  const [paymentNotice, setPaymentNotice] = useState<string | null>(null);

  const plans = [
    {
      id: '7',
      name: 'PREMIUM 7 HARI',
      duration: '7 Hari Akses',
      price: 'Rp7.900',
      period: 'per minggu',
      popular: false,
      saving: null,
      desc: 'Cocok untuk mencari kerja cepat dalam periode singkat.',
    },
    {
      id: '30',
      name: 'PREMIUM 30 HARI',
      duration: '30 Hari Akses',
      price: 'Rp19.900',
      period: 'per bulan',
      popular: true,
      saving: 'Paling Populer',
      desc: 'Pilihan terbaik untuk pencarian kerja intensif dan terarah.',
    },
    {
      id: '90',
      name: 'PREMIUM 90 HARI',
      duration: '90 Hari Akses',
      price: 'Rp49.900',
      period: '3 bulan',
      popular: false,
      saving: 'Hemat 30%',
      desc: 'Akses tanpa khawatir hingga resmi diterima bekerja.',
    },
  ];

  const handleSelectPackage = (planName: string, price: string) => {
    setPaymentNotice(
      `Paket ${planName} (${price}) dipilih. Sistem pembayaran akan diintegrasikan pada tahap berikutnya.`
    );
  };

  return (
    <div id="premium-page-container" className="pb-24">
      {/* Header Bar */}
      <div className="sticky top-14 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 flex items-center justify-between">
        <button
          id="btn-back-from-premium"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-blue-700 py-1.5 px-2 rounded-xl hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali</span>
        </button>

        <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full flex items-center gap-1">
          <Crown className="w-3.5 h-3.5 text-amber-600" />
          DIGAWE YUK PREMIUM
        </span>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-6 space-y-6">
        {/* Hero Section */}
        <div className="text-center bg-gradient-to-b from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 translate-x-1/4 -translate-y-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-2xl"></div>
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-300/30 text-amber-200 text-xs font-bold mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              DIGAWE YUK PREMIUM
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
              Lebih dekat dengan pekerjaan impianmu.
            </h1>
            <p className="text-sm text-blue-100/90 mt-2 max-w-md mx-auto leading-relaxed">
              Dapatkan akses langsung ke jalur lamaran sumber asli dan fitur
              pencarian kerja berbasis kurasi AI tingkat lanjut.
            </p>

            {/* Current Status banner */}
            <div className="mt-5 inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/15 text-xs">
              <span className="text-slate-300">Status Akun Anda:</span>
              <strong className={subscriptionStatus === 'PREMIUM' ? 'text-amber-300 font-extrabold' : 'text-white font-bold'}>
                {subscriptionStatus === 'PREMIUM' ? '⭐ PREMIUM AKTIF' : 'FREE USER'}
              </strong>
            </div>
          </div>
        </div>

        {/* Keuntungan Section */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
            Keuntungan Menjadi Premium
          </h2>

          <div className="space-y-3.5">
            <div className="flex items-start gap-3.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                <Check className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <span>Lamar melalui sumber asli</span>
                  <Rocket className="w-3.5 h-3.5 text-blue-600" />
                </h3>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                  Buka kunci tombol lamar langsung yang mengarah ke link formulir
                  resmi sumber lowongan tanpa perantara.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Check className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <span>Simpan lowongan</span>
                  <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-100" />
                </h3>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                  Bookmark loker favorit tanpa batas dan buka kembali di tab
                  Tersimpan kapan saja tanpa takut hilang.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Check className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <span>Dapatkan rekomendasi pekerjaan dasar</span>
                  <Target className="w-3.5 h-3.5 text-emerald-600" />
                </h3>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                  Algoritma kurasi DIGAWE YUK menampilkan loker yang paling cocok
                  dengan keterampilan dan preferensi lokasimu.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Pilihan Paket Section */}
        <div>
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 px-1">
            Pilihan Paket Berlangganan
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {plans.map((p) => {
              const isSelected = selectedPlan === p.id;
              return (
                <div
                  key={p.id}
                  id={`plan-card-${p.id}`}
                  onClick={() => setSelectedPlan(p.id as any)}
                  className={`relative bg-white rounded-2xl border p-4.5 cursor-pointer transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-md'
                      : 'border-slate-200/90 hover:border-slate-300 shadow-xs'
                  }`}
                >
                  {/* Badge top */}
                  {p.saving && (
                    <div className="absolute -top-2.5 right-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full shadow-xs">
                      {p.saving}
                    </div>
                  )}

                  <div>
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      {p.name}
                    </h3>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-2xl font-black text-slate-900">
                        {p.price}
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md inline-block mt-1">
                      {p.duration}
                    </span>
                    <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                      {p.desc}
                    </p>
                  </div>

                  <button
                    id={`btn-choose-plan-${p.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPlan(p.id as any);
                      handleSelectPackage(p.name, p.price);
                    }}
                    className={`mt-4 w-full py-2.5 px-3 rounded-xl font-bold text-xs transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-xs hover:bg-blue-700'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Pilih Paket
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Notice alert on selecting package */}
        {paymentNotice && (
          <div
            id="payment-notice-banner"
            className="p-4 bg-blue-50 border border-blue-200 text-blue-900 rounded-2xl text-xs leading-relaxed flex items-start gap-2.5"
          >
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">{paymentNotice}</p>
            </div>
          </div>
        )}

        {/* Tahap 1 Testing Switcher */}
        <div className="bg-slate-100 border border-slate-200 rounded-2xl p-4 text-xs">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div>
              <h4 className="font-bold text-slate-800">
                Mode Pengujian UI (Tahap 1)
              </h4>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Uji coba langsung perubahan tampilan antara akun FREE dan PREMIUM.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                id="btn-demo-set-free"
                onClick={onActivateDemoFree}
                className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
                  subscriptionStatus === 'FREE'
                    ? 'bg-slate-800 text-white'
                    : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                }`}
              >
                Set FREE
              </button>
              <button
                id="btn-demo-set-premium"
                onClick={onActivateDemoPremium}
                className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
                  subscriptionStatus === 'PREMIUM'
                    ? 'bg-amber-500 text-slate-950 font-black'
                    : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                }`}
              >
                Set PREMIUM ⭐
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
