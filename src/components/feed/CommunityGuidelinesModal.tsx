import React from 'react';
import { X, ShieldCheck, AlertCircle, CheckCircle2, HeartHandshake } from 'lucide-react';

interface CommunityGuidelinesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommunityGuidelinesModal: React.FC<CommunityGuidelinesModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const rules = [
    {
      title: '1. Gunakan Bahasa yang Sopan & Profesional',
      desc: 'Setiap postingan, komentar, dan interaksi wajib mencerminkan etika kerja yang baik tanpa ujaran kebencian, SARA, atau penghinaan.',
    },
    {
      title: '2. Dilarang Meminta Biaya / Uang untuk Pekerjaan',
      desc: 'Lowongan atau tawaran kerja TIDAK BOLEH memungut biaya pendaftaran, seragam, materi tes, atau biaya administrasi apapun. Semua bentuk pemerasan dilarang keras.',
    },
    {
      title: '3. Informasi Jujur & Akurat',
      desc: 'Cantumkan pengalaman, pendidikan, portofolio, dan keahlian yang nyata. Jangan mengunggah informasi palsu atau mengaku sebagai pihak lain.',
    },
    {
      title: '4. Dilarang Menyebarkan Data Pribadi Sensitif',
      desc: 'Jangan membagikan nomor KTP, nomor rekening bank, kartu keluarga, atau informasi pribadi sensitif orang lain di postingan publik.',
    },
    {
      title: '5. Lindungi Privasi Kontak Anda',
      desc: 'Hindari mencantumkan nomor telepon / WhatsApp pribadi secara terbuka di postingan. Gunakan fitur pesan / kontak resmi di dalam sistem.',
    },
    {
      title: '6. Nol Toleransi untuk Pelecehan & Penipuan',
      desc: 'Tindakan pelecehan, penipuan lowongan, ataupun spam berulang akan berakibat pada penangguhan (suspend) hingga pemblokiran permanen akun (ban).',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-linear-to-r from-blue-600 to-indigo-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-xl">
              <ShieldCheck className="w-5 h-5 text-blue-100" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">Pedoman Komunitas</h3>
              <p className="text-xs text-blue-100">Etika & Keamanan Rekrutmen DIGAWE YUK</p>
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
        <div className="p-6 overflow-y-auto space-y-4 text-slate-700 text-sm">
          <div className="p-3.5 bg-blue-50/80 border border-blue-100 rounded-xl flex items-start gap-3">
            <HeartHandshake className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <p className="text-xs leading-relaxed text-blue-900">
              DIGAWE YUK diciptakan untuk saling membantu antara pencari kerja dan perusahaan secara aman,
              transparan, dan bebas penipuan.
            </p>
          </div>

          <div className="space-y-3">
            {rules.map((rule, idx) => (
              <div key={idx} className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                <h4 className="font-semibold text-slate-900 text-sm mb-1 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  {rule.title}
                </h4>
                <p className="text-xs text-slate-600 pl-6 leading-relaxed">{rule.desc}</p>
              </div>
            ))}
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-amber-900 text-xs">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              Pelanggaran terhadap pedoman ini akan ditindaklanjuti oleh Tim Moderasi melalui peringatan,
              penghapusan konten, hingga penutupan akun permanen.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-xl transition-all cursor-pointer"
          >
            Saya Memahami & Setuju
          </button>
        </div>
      </div>
    </div>
  );
};
