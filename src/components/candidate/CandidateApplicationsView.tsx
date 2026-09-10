import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Building2,
  Calendar,
  Clock,
  ChevronRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  ExternalLink,
  MessageSquare,
  FileText,
  Video,
  X,
  ShieldCheck,
} from 'lucide-react';
import { JobApplication, User, PipelineStage } from '../../types';
import { subscribeCandidateApplications } from '../../services/companyService';

interface CandidateApplicationsViewProps {
  user: User;
  onNavigateToChat?: (companyId: string) => void;
  onNavigateToInterviewRoom?: (roomCode?: string) => void;
  onClose?: () => void;
}

const STAGE_CONFIG: Record<
  PipelineStage,
  { label: string; badgeClass: string; desc: string; icon: any }
> = {
  PELAMAR: {
    label: 'Lamaran Terkirim',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    desc: 'Lamaran Anda telah diterima oleh sistem dan menunggu review awal dari tim HRD.',
    icon: Clock,
  },
  SCREENING: {
    label: 'Screening Berkas',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    desc: 'Profil dan berkas pengalaman Anda sedang ditinjau kecocokannya dengan posisi ini.',
    icon: FileText,
  },
  SHORTLISTED: {
    label: 'Kandidat Terpilih',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    desc: 'Selamat! Anda masuk dalam daftar kandidat unggulan untuk tahapan seleksi berikutnya.',
    icon: CheckCircle2,
  },
  'ONLINE TEST': {
    label: 'Online Test & Interview',
    badgeClass: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    desc: 'Anda dijadwalkan mengikuti tes daring atau interview online berwaktu.',
    icon: Video,
  },
  INTERVIEW: {
    label: 'Wawancara Awal',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
    desc: 'Tim rekruter mengundang Anda untuk sesi wawancara langsung.',
    icon: Video,
  },
  'INTERVIEW HR': {
    label: 'Interview HR / User',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
    desc: 'Tahap wawancara mendalam bersama HRD atau Head of Department.',
    icon: Video,
  },
  'FINAL REVIEW': {
    label: 'Review Akhir',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    desc: 'Proses evaluasi akhir penawaran kerja (offering).',
    icon: AlertCircle,
  },
  DITERIMA: {
    label: 'Diterima Bekerja 🎉',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    desc: 'Selamat! Anda dinyatakan lolos dan diterima bekerja pada posisi ini.',
    icon: CheckCircle2,
  },
  DITOLAK: {
    label: 'Belum Lolos',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    desc: 'Terima kasih atas partisipasi Anda. Jangan menyerah, tetap pantau lowongan lain di DIGAWE YUK.',
    icon: XCircle,
  },
};

export const CandidateApplicationsView: React.FC<CandidateApplicationsViewProps> = ({
  user,
  onNavigateToChat,
  onNavigateToInterviewRoom,
  onClose,
}) => {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedApp, setSelectedApp] = useState<JobApplication | null>(null);

  useEffect(() => {
    if (!user?.uid) return;
    const unsub = subscribeCandidateApplications(user.uid, (apps) => {
      setApplications(apps);
      setLoading(false);
    });
    return () => unsub();
  }, [user?.uid]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-blue-600" />
            <span>Lamaran Saya</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pantau status seleksi dan jadwal interview Anda secara real-time
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Applications List */}
      {loading ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
          <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-2" />
          <p className="text-xs text-slate-500">Memuat riwayat lamaran...</p>
        </div>
      ) : applications.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
            <Briefcase className="w-7 h-7" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">Belum Ada Lamaran Terkirim</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Jelajahi lowongan pekerjaan terverifikasi di Jawa Barat dan lamar langsung menggunakan profil DIGAWE YUK Anda.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {applications.map((app) => {
            const stageInfo = STAGE_CONFIG[app.stage] || STAGE_CONFIG.PELAMAR;
            const StageIcon = stageInfo.icon;

            return (
              <div
                key={app.id}
                onClick={() => setSelectedApp(app)}
                className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-blue-200 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${stageInfo.badgeClass}`}
                    >
                      <StageIcon className="w-3 h-3" />
                      <span>{stageInfo.label}</span>
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(app.appliedAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 leading-snug">
                    {app.jobTitle}
                  </h4>
                  <p className="text-xs text-slate-600 flex items-center gap-1.5 mt-0.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>{app.companyName}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  {/* Action buttons depending on status */}
                  {(app.stage === 'ONLINE TEST' || app.stage === 'INTERVIEW') && onNavigateToInterviewRoom && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigateToInterviewRoom();
                      }}
                      className="px-3 py-1.5 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 shadow-xs flex items-center gap-1"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Tes Online</span>
                    </button>
                  )}

                  {onNavigateToChat && app.companyId && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigateToChat(app.companyId);
                      }}
                      className="px-3 py-1.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200 flex items-center gap-1"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Chat</span>
                    </button>
                  )}

                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 p-6">
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                    STAGE_CONFIG[selectedApp.stage]?.badgeClass || ''
                  }`}
                >
                  {STAGE_CONFIG[selectedApp.stage]?.label}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-2">
                  {selectedApp.jobTitle}
                </h3>
                <p className="text-xs text-slate-600 flex items-center gap-1 mt-0.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>{selectedApp.companyName}</span>
                </p>
              </div>
              <button
                onClick={() => setSelectedApp(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stage Explanation */}
            <div className="mt-4 p-3.5 bg-blue-50/70 rounded-xl border border-blue-100 text-xs text-blue-900 leading-relaxed">
              <strong>Info Tahapan: </strong>
              {STAGE_CONFIG[selectedApp.stage]?.desc}
            </div>

            {/* Candidate Cover Note */}
            {selectedApp.coverNote && (
              <div className="mt-4">
                <h5 className="text-xs font-bold text-slate-700 mb-1">Catatan Pengantar:</h5>
                <p className="p-3 bg-slate-50 rounded-xl text-xs text-slate-700 italic border border-slate-200">
                  "{selectedApp.coverNote}"
                </p>
              </div>
            )}

            {/* Audit History (Timeline) */}
            <div className="mt-5">
              <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
                Riwayat Perubahan Status (Audit History)
              </h5>
              <div className="space-y-3 relative before:absolute before:inset-0 before:left-3 before:w-0.5 before:bg-slate-200">
                {(selectedApp.auditHistory || []).map((audit, idx) => (
                  <div key={idx} className="relative flex items-start gap-3 pl-1">
                    <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold z-10 shrink-0">
                      ✓
                    </div>
                    <div className="flex-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">{audit.stage}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(audit.changedAt).toLocaleString('id-ID', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Oleh: {audit.changedBy}
                      </p>
                      {audit.note && (
                        <p className="text-xs text-slate-700 mt-1.5 pt-1.5 border-t border-slate-200/60 font-medium">
                          "{audit.note}"
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex gap-2">
              {onNavigateToChat && selectedApp.companyId && (
                <button
                  onClick={() => {
                    const compId = selectedApp.companyId;
                    setSelectedApp(null);
                    onNavigateToChat(compId);
                  }}
                  className="flex-1 py-2.5 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-xs hover:bg-blue-700 flex items-center justify-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Kirim Pesan ke Perusahaan</span>
                </button>
              )}
              <button
                onClick={() => setSelectedApp(null)}
                className="px-4 py-2.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
