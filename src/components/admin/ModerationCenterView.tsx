import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  UserX,
  FileText,
  Sparkles,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Trash2,
  ShieldCheck,
  Send,
  Loader2,
  ExternalLink,
  MessageSquare,
  History,
} from 'lucide-react';
import {
  ModerationReport,
  ModerationAppeal,
  ModerationLog,
  Post,
  User,
} from '../../types';
import {
  getModerationReports,
  resolveModerationReport,
  executeModerationAction,
  getModerationAppeals,
  resolveModerationAppeal,
  getModerationStats,
  getModerationLogs,
  getFeedPosts,
} from '../../services/feedService';

interface ModerationCenterViewProps {
  currentUser: User;
}

export const ModerationCenterView: React.FC<ModerationCenterViewProps> = ({
  currentUser,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'reports' | 'pending_posts' | 'appeals' | 'logs'>('reports');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    totalReports: 0,
    pendingReports: 0,
    postsUnderReview: 0,
    suspendedUsers: 0,
    bannedUsers: 0,
    warningsCount: 0,
    removedCount: 0,
  });

  // Data lists
  const [reports, setReports] = useState<ModerationReport[]>([]);
  const [pendingPosts, setPendingPosts] = useState<Post[]>([]);
  const [appeals, setAppeals] = useState<ModerationAppeal[]>([]);
  const [logs, setLogs] = useState<ModerationLog[]>([]);

  // Action Modal State
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    report?: ModerationReport;
    post?: Post;
    targetUserId?: string;
    actionType: 'WARN' | 'SUSPEND' | 'BAN' | 'REMOVE' | 'APPROVE' | null;
  }>({
    isOpen: false,
    actionType: null,
  });

  const [actionReason, setActionReason] = useState('');
  const [suspendHours, setSuspendHours] = useState(24);
  const [executingAction, setExecutingAction] = useState(false);

  // AI Analysis modal / state
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<{
    isSuspicious: boolean;
    flags: string[];
    confidence: number;
    summary: string;
    suggestedAction: string;
  } | null>(null);

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [s, rep, app, lg] = await Promise.all([
        getModerationStats(),
        getModerationReports(),
        getModerationAppeals(),
        getModerationLogs(),
      ]);

      setStats(s);
      setReports(rep);
      setAppeals(app);
      setLogs(lg);

      // Fetch pending posts
      const postsRes = await getFeedPosts({ limitCount: 50 });
      // We can also query all posts with moderationStatus == 'PENDING'
      setPendingPosts(postsRes.posts.filter((p) => p.moderationStatus === 'PENDING' || p.flaggedAsScam));
    } catch (err) {
      console.error('Error loading moderation center data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Trigger Server AI Analysis
  const handleRunAiAnalysis = async (text: string, context?: string) => {
    setAiAnalyzing(true);
    setAiResult(null);
    try {
      const res = await fetch('/api/moderation/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          type: 'report',
          positionOrContext: context,
        }),
      });
      const data = await res.json();
      setAiResult(data);
    } catch (err) {
      console.error('AI analysis error:', err);
    } finally {
      setAiAnalyzing(false);
    }
  };

  // Execute Action
  const handleExecuteAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionModal.actionType) return;

    setExecutingAction(true);
    try {
      const targetId = actionModal.post?.id || actionModal.report?.targetId || '';
      const targetUserId =
        actionModal.targetUserId ||
        actionModal.post?.userId ||
        actionModal.report?.targetUserId;

      if (actionModal.actionType === 'REMOVE') {
        await executeModerationAction({
          adminId: currentUser.uid,
          adminEmail: currentUser.email,
          action: 'REMOVE_POST',
          targetType: 'POST',
          targetId,
          targetUserId,
          reason: actionReason || 'Melanggar pedoman komunitas.',
        });
        if (actionModal.report) {
          await resolveModerationReport(actionModal.report.id, currentUser.uid, 'RESOLVED', actionReason);
        }
      } else if (actionModal.actionType === 'APPROVE') {
        await executeModerationAction({
          adminId: currentUser.uid,
          adminEmail: currentUser.email,
          action: 'APPROVE_POST',
          targetType: 'POST',
          targetId,
          targetUserId,
          reason: actionReason || 'Konten dinyatakan aman dan sah.',
        });
        if (actionModal.report) {
          await resolveModerationReport(actionModal.report.id, currentUser.uid, 'DISMISSED', 'Konten sah');
        }
      } else if (actionModal.actionType === 'WARN' && targetUserId) {
        await executeModerationAction({
          adminId: currentUser.uid,
          adminEmail: currentUser.email,
          action: 'WARN_USER',
          targetType: 'USER',
          targetId,
          targetUserId,
          reason: actionReason || 'Peringatan pelanggaran pedoman etika.',
        });
        if (actionModal.report) {
          await resolveModerationReport(actionModal.report.id, currentUser.uid, 'RESOLVED', 'Peringatan dikirim');
        }
      } else if (actionModal.actionType === 'SUSPEND' && targetUserId) {
        await executeModerationAction({
          adminId: currentUser.uid,
          adminEmail: currentUser.email,
          action: 'SUSPEND_USER',
          targetType: 'USER',
          targetId,
          targetUserId,
          reason: actionReason || 'Penangguhan akun karena pelanggaran berulang.',
          durationHours: Number(suspendHours),
        });
        if (actionModal.report) {
          await resolveModerationReport(actionModal.report.id, currentUser.uid, 'RESOLVED', `Ditangguhkan ${suspendHours} jam`);
        }
      } else if (actionModal.actionType === 'BAN' && targetUserId) {
        await executeModerationAction({
          adminId: currentUser.uid,
          adminEmail: currentUser.email,
          action: 'BAN_USER',
          targetType: 'USER',
          targetId,
          targetUserId,
          reason: actionReason || 'Pemblokiran permanen karena penipuan/pelecehan berat.',
        });
        if (actionModal.report) {
          await resolveModerationReport(actionModal.report.id, currentUser.uid, 'RESOLVED', 'Akun diblokir');
        }
      }

      // Close modal and refresh
      setActionModal({ isOpen: false, actionType: null });
      setActionReason('');
      setAiResult(null);
      await loadData(false);
    } catch (err) {
      console.error('Error executing moderation action:', err);
    } finally {
      setExecutingAction(false);
    }
  };

  // Resolve Appeal
  const handleResolveAppeal = async (appealId: string, decision: 'APPROVED' | 'REJECTED') => {
    const notes = prompt(`Masukkan catatan resolusi banding (${decision}):`);
    if (notes === null) return;

    try {
      await resolveModerationAppeal(appealId, currentUser.uid, decision, notes);
      await loadData(false);
    } catch (err) {
      console.error('Error resolving appeal:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">Pusat Moderasi & Keamanan Konten</h2>
            <span className="px-2.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold rounded-full">
              Tahap 5
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola laporan pengguna, perlindungan anti-scam, penangguhan akun, dan banding etika komunitas.
          </p>
        </div>

        <button
          onClick={() => loadData(true)}
          disabled={refreshing}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Segarkan Data</span>
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
        <div className="p-3 bg-white border border-slate-200/80 rounded-2xl shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 block uppercase">Total Laporan</span>
          <span className="text-lg font-extrabold text-slate-800">{stats.totalReports}</span>
        </div>
        <div className="p-3 bg-white border border-slate-200/80 rounded-2xl shadow-2xs">
          <span className="text-[11px] font-bold text-amber-500 block uppercase">Menunggu Review</span>
          <span className="text-lg font-extrabold text-amber-600">{stats.pendingReports}</span>
        </div>
        <div className="p-3 bg-white border border-slate-200/80 rounded-2xl shadow-2xs">
          <span className="text-[11px] font-bold text-blue-500 block uppercase">Post Ditandai</span>
          <span className="text-lg font-extrabold text-blue-600">{stats.postsUnderReview}</span>
        </div>
        <div className="p-3 bg-white border border-slate-200/80 rounded-2xl shadow-2xs">
          <span className="text-[11px] font-bold text-orange-500 block uppercase">Peringatan</span>
          <span className="text-lg font-extrabold text-orange-600">{stats.warningsCount}</span>
        </div>
        <div className="p-3 bg-white border border-slate-200/80 rounded-2xl shadow-2xs">
          <span className="text-[11px] font-bold text-purple-500 block uppercase">Ditangguhkan</span>
          <span className="text-lg font-extrabold text-purple-600">{stats.suspendedUsers}</span>
        </div>
        <div className="p-3 bg-white border border-slate-200/80 rounded-2xl shadow-2xs">
          <span className="text-[11px] font-bold text-rose-500 block uppercase">Diblokir (Ban)</span>
          <span className="text-lg font-extrabold text-rose-600">{stats.bannedUsers}</span>
        </div>
        <div className="p-3 bg-white border border-slate-200/80 rounded-2xl shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 block uppercase">Dihapus</span>
          <span className="text-lg font-extrabold text-slate-600">{stats.removedCount}</span>
        </div>
      </div>

      {/* Sub-Tabs */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setActiveSubTab('reports')}
          className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeSubTab === 'reports'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Laporan Pengguna ({reports.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('pending_posts')}
          className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeSubTab === 'pending_posts'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Postingan Berisiko ({pendingPosts.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('appeals')}
          className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeSubTab === 'appeals'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Pengajuan Banding ({appeals.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('logs')}
          className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeSubTab === 'logs'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Audit Log Moderasi</span>
        </button>
      </div>

      {/* Content based on sub-tab */}
      {loading ? (
        <div className="p-8 text-center text-xs text-slate-500">Memuat data moderasi...</div>
      ) : activeSubTab === 'reports' ? (
        /* REPORTS LIST */
        reports.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 border border-slate-200 text-center space-y-2">
            <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto" />
            <h4 className="font-bold text-slate-800 text-sm">Tidak Ada Laporan Masuk</h4>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Seluruh komunitas DIGAWE YUK saat ini bersih dan aman dari laporan pelanggaran.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map((rep) => (
              <div
                key={rep.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs space-y-3"
              >
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold rounded-lg">
                      {rep.category}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      Target: <strong className="text-slate-800">{rep.targetType}</strong>
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        rep.status === 'OPEN'
                          ? 'bg-amber-100 text-amber-800'
                          : rep.status === 'RESOLVED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {rep.status}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {new Date(rep.createdAt).toLocaleString('id-ID')}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-slate-400 block font-semibold mb-0.5">Pelapor:</span>
                    <span className="text-slate-800 font-medium">
                      {rep.reporterName || rep.reporterEmail || 'Pengguna'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold mb-0.5">Pengguna Dilaporkan:</span>
                    <span className="text-slate-800 font-medium">
                      {rep.targetUserName || rep.targetUserId || '-'}
                    </span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-slate-400 block font-semibold mb-0.5">Alasan Pelaporan:</span>
                    <p className="text-slate-700 italic">"{rep.reason}"</p>
                  </div>
                  {rep.targetContentSnippet && (
                    <div className="sm:col-span-2">
                      <span className="text-slate-400 block font-semibold mb-0.5">Cuplikan Konten:</span>
                      <p className="text-slate-600 bg-white p-2 rounded-lg border border-slate-200 line-clamp-2">
                        "{rep.targetContentSnippet}"
                      </p>
                    </div>
                  )}
                </div>

                {/* Moderation Actions bar */}
                <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
                  <button
                    onClick={() => handleRunAiAnalysis(rep.reason + ' ' + (rep.targetContentSnippet || ''))}
                    disabled={aiAnalyzing}
                    className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-xl flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{aiAnalyzing ? 'Menganalisis...' : 'Analisis AI Scam'}</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() =>
                        setActionModal({
                          isOpen: true,
                          report: rep,
                          targetUserId: rep.targetUserId,
                          actionType: 'APPROVE',
                        })
                      }
                      className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                    >
                      Abaikan / Sah
                    </button>
                    <button
                      onClick={() =>
                        setActionModal({
                          isOpen: true,
                          report: rep,
                          targetUserId: rep.targetUserId,
                          actionType: 'REMOVE',
                        })
                      }
                      className="px-2.5 py-1 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg cursor-pointer"
                    >
                      Hapus Konten
                    </button>
                    <button
                      onClick={() =>
                        setActionModal({
                          isOpen: true,
                          report: rep,
                          targetUserId: rep.targetUserId,
                          actionType: 'WARN',
                        })
                      }
                      className="px-2.5 py-1 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg cursor-pointer"
                    >
                      Beri Warning
                    </button>
                    <button
                      onClick={() =>
                        setActionModal({
                          isOpen: true,
                          report: rep,
                          targetUserId: rep.targetUserId,
                          actionType: 'SUSPEND',
                        })
                      }
                      className="px-2.5 py-1 text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg cursor-pointer"
                    >
                      Suspend Akun
                    </button>
                    <button
                      onClick={() =>
                        setActionModal({
                          isOpen: true,
                          report: rep,
                          targetUserId: rep.targetUserId,
                          actionType: 'BAN',
                        })
                      }
                      className="px-2.5 py-1 text-xs font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-lg cursor-pointer"
                    >
                      Ban Akun
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : activeSubTab === 'pending_posts' ? (
        /* PENDING / FLAGGED POSTS */
        pendingPosts.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 border border-slate-200 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <h4 className="font-bold text-slate-800 text-sm">Tidak Ada Postingan Berisiko</h4>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Semua postingan pencari kerja telah lolos verifikasi standar dan kata kunci keamanan.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingPosts.map((post) => (
              <div
                key={post.id}
                className="bg-white rounded-2xl border border-amber-200 p-4 shadow-2xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-amber-100 text-amber-900 text-xs font-bold rounded-lg">
                      Terindikasi Transaksi / Biaya
                    </span>
                    <span className="text-xs font-bold text-slate-800">{post.userName}</span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {new Date(post.createdAt).toLocaleDateString('id-ID')}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-700 space-y-1">
                  <div className="font-semibold text-slate-900">{post.positionWanted}</div>
                  <p className="line-clamp-3">{post.content}</p>
                </div>

                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() =>
                      setActionModal({
                        isOpen: true,
                        post,
                        actionType: 'APPROVE',
                      })
                    }
                    className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl cursor-pointer"
                  >
                    Setujui Postingan
                  </button>
                  <button
                    onClick={() =>
                      setActionModal({
                        isOpen: true,
                        post,
                        actionType: 'REMOVE',
                      })
                    }
                    className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl cursor-pointer"
                  >
                    Hapus Postingan
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : activeSubTab === 'appeals' ? (
        /* APPEALS LIST */
        appeals.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 border border-slate-200 text-center space-y-2">
            <FileText className="w-10 h-10 text-slate-400 mx-auto" />
            <h4 className="font-bold text-slate-800 text-sm">Belum Ada Pengajuan Banding</h4>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Tidak ada pengguna yang mengajukan banding atas tindakan penangguhan atau pemblokiran saat ini.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {appeals.map((app) => (
              <div
                key={app.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 text-sm">{app.userName}</span>
                    <span className="text-xs text-slate-500 ml-2">({app.userEmail})</span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      app.status === 'PENDING'
                        ? 'bg-amber-100 text-amber-800'
                        : app.status === 'APPROVED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {app.status}
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl text-xs space-y-1">
                  <span className="text-slate-400 block font-semibold">Alasan Sanksi Awal:</span>
                  <p className="text-slate-700 italic">"{app.reason}"</p>
                  <span className="text-slate-400 block font-semibold mt-2">Pernyataan Pembelaan:</span>
                  <p className="text-slate-800 font-medium">"{app.statement}"</p>
                </div>

                {app.status === 'PENDING' && (
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      onClick={() => handleResolveAppeal(app.id, 'REJECTED')}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer"
                    >
                      Tolak Banding
                    </button>
                    <button
                      onClick={() => handleResolveAppeal(app.id, 'APPROVED')}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl cursor-pointer"
                    >
                      Pulihkan Akun (Setujui)
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      ) : (
        /* AUDIT LOGS */
        logs.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 border border-slate-200 text-center space-y-2">
            <History className="w-10 h-10 text-slate-400 mx-auto" />
            <h4 className="font-bold text-slate-800 text-sm">Belum Ada Riwayat Tindakan</h4>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs">
            <div className="p-3 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 grid grid-cols-12">
              <span className="col-span-3">Waktu & Admin</span>
              <span className="col-span-3">Tindakan</span>
              <span className="col-span-3">Target</span>
              <span className="col-span-3">Alasan</span>
            </div>
            <div className="divide-y divide-slate-100 text-xs">
              {logs.map((lg) => (
                <div key={lg.id} className="p-3 grid grid-cols-12 items-center text-slate-700">
                  <div className="col-span-3">
                    <span className="font-semibold block text-slate-800">{lg.adminEmail}</span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(lg.createdAt).toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="col-span-3 font-semibold text-blue-600">{lg.action}</div>
                  <div className="col-span-3 text-slate-600 truncate">{lg.targetUserId || lg.targetId}</div>
                  <div className="col-span-3 text-slate-500 italic truncate">{lg.reason}</div>
                </div>
              ))}
            </div>
          </div>
        )
      )}

      {/* AI Result Dialog (if any) */}
      {aiResult && (
        <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl text-xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span className="font-bold text-indigo-900">Hasil Analisis Gemini AI:</span>
            </div>
            <span
              className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                aiResult.isSuspicious ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {aiResult.isSuspicious ? 'MENCURIGAKAN (SCAM SUSPECT)' : 'AMAN (SAFE)'}
            </span>
          </div>
          <p className="text-indigo-800">{aiResult.summary}</p>
          {aiResult.flags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {aiResult.flags.map((fl, i) => (
                <span key={i} className="px-2 py-0.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-md text-[10px] font-semibold">
                  {fl}
                </span>
              ))}
            </div>
          )}
          <button
            onClick={() => setAiResult(null)}
            className="text-[11px] text-indigo-600 hover:underline font-medium cursor-pointer"
          >
            Tutup Analisis
          </button>
        </div>
      )}

      {/* Action Execution Modal */}
      {actionModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-base">Konfirmasi Tindakan Moderasi</h3>
              <button
                onClick={() => setActionModal({ isOpen: false, actionType: null })}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleExecuteAction} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-slate-100 rounded-xl text-slate-800">
                <span className="font-bold block mb-1">Tindakan:</span>
                <span className="text-blue-700 font-semibold">{actionModal.actionType}</span>
              </div>

              {actionModal.actionType === 'SUSPEND' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Durasi Penangguhan:</label>
                  <select
                    value={suspendHours}
                    onChange={(e) => setSuspendHours(Number(e.target.value))}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-white"
                  >
                    <option value={24}>24 Jam (1 Hari)</option>
                    <option value={72}>3 Hari</option>
                    <option value={168}>7 Hari (1 Minggu)</option>
                    <option value={720}>30 Hari (1 Bulan)</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Alasan & Catatan Moderasi: <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder="Tulis alasan keputusan moderasi ini..."
                  rows={3}
                  className="w-full p-2.5 border border-slate-200 rounded-xl resize-none outline-hidden"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActionModal({ isOpen: false, actionType: null })}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={executingAction}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {executingAction ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>Eksekusi Tindakan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
