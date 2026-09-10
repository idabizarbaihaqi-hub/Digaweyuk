import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle2, Rocket, Heart, Target, Crown } from 'lucide-react';

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoToPremium: () => void;
  featureTitle?: string;
  customDescription?: string;
}

export const PremiumModal: React.FC<PremiumModalProps> = ({
  isOpen,
  onClose,
  onGoToPremium,
  featureTitle,
  customDescription,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div
          id="premium-upgrade-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
          onClick={onClose}
        >
          <motion.div
            id="premium-upgrade-modal-content"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with decorative badge */}
            <div className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-sky-700 text-white p-6 pb-7">
              <button
                id="btn-close-premium-modal"
                onClick={onClose}
                className="absolute top-4 right-4 p-1.5 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                aria-label="Tutup"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-300/40 text-amber-200 text-xs font-semibold mb-3">
                <Crown className="w-3.5 h-3.5 text-amber-300" />
                DIGAWE YUK PREMIUM
              </div>

              <h3 className="text-2xl font-extrabold text-white tracking-tight">
                {featureTitle || 'Fitur Premium'}
              </h3>
              <p className="text-sm text-blue-100 mt-1.5 leading-relaxed">
                {customDescription ||
                  'Fitur ini tersedia untuk pengguna DIGAWE YUK Premium.'}
              </p>
            </div>

            {/* Content & Benefits */}
            <div className="p-6">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Manfaat Eksklusif Premium
              </p>

              <div className="space-y-3.5">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="p-2 rounded-lg bg-blue-100 text-blue-700 shrink-0">
                    <Rocket className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800">
                      Lamar melalui sumber asli
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Akses link langsung ke sistem pendaftaran resmi instansi & perusahaan.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="p-2 rounded-lg bg-rose-100 text-rose-600 shrink-0">
                    <Heart className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800">
                      Simpan lowongan
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Simpan lowongan favoritmu dan akses kembali kapan saja tanpa batas.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700 shrink-0">
                    <Target className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800">
                      Rekomendasi pekerjaan
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Temukan rekomendasi pekerjaan yang lebih sesuai dengan minatmu.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex flex-col gap-2.5">
                <button
                  id="btn-modal-upgrade-action"
                  onClick={() => {
                    onClose();
                    onGoToPremium();
                  }}
                  className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <Crown className="w-4 h-4 text-amber-300" />
                  Lihat Premium
                </button>

                <button
                  id="btn-modal-cancel-action"
                  onClick={onClose}
                  className="w-full py-2.5 px-4 text-slate-500 hover:text-slate-800 font-semibold text-sm rounded-xl hover:bg-slate-100 transition-colors"
                >
                  Nanti
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
