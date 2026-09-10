import React, { useState } from 'react';
import {
  X,
  MessageSquare,
  Send,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import { Post, User } from '../../types';
import { getOrCreateChatRoom, sendChatMessage } from '../../services/chatService';

interface ContactCandidateModalProps {
  isOpen: boolean;
  onClose: () => void;
  post?: Post;
  candidateUser?: User | null;
  currentUser: User | null;
  onNavigateToChat?: (chatId: string) => void;
}

export const ContactCandidateModal: React.FC<ContactCandidateModalProps> = ({
  isOpen,
  onClose,
  post,
  candidateUser,
  currentUser,
  onNavigateToChat,
}) => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [includeInterview, setIncludeInterview] = useState(false);
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewTime, setInterviewTime] = useState('');
  const [interviewLocation, setInterviewLocation] = useState('Online via Google Meet / Zoom');

  const [loading, setLoading] = useState(false);
  const [sentChatId, setSentChatId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || (!post && !candidateUser)) return null;

  const candidateId = post?.userId || candidateUser?.uid || '';
  const candidateName = post?.userName || candidateUser?.name || 'Kandidat';
  const positionWanted = post?.positionWanted || candidateUser?.headline || 'Pencari Kerja';
  const allowContact = candidateUser?.allowCompanyContact !== false;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setError('Anda harus login terlebih dahulu.');
      return;
    }
    if (!message.trim()) {
      setError('Pesan tidak boleh kosong.');
      return;
    }
    if (!candidateId) {
      setError('ID kandidat tidak valid.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const senderCompanyName =
        currentUser.companyName || currentUser.name || 'Perusahaan DIGAWE YUK';

      // 1. Create or retrieve room
      const chatId = await getOrCreateChatRoom({
        userId: candidateId,
        userName: candidateName,
        userAvatar: post?.userAvatar || candidateUser?.photoURL,
        companyId: currentUser.uid,
        companyName: senderCompanyName,
        jobTitle: positionWanted,
      });

      // 2. Prepare interview payload if selected
      const interviewInvite = includeInterview && interviewDate
        ? {
            jobTitle: subject || positionWanted,
            scheduledAt: `${interviewDate} ${interviewTime || '09:00'}`,
            location: interviewLocation,
            notes: message,
          }
        : undefined;

      const fullMessageText = subject
        ? `[${subject}]\n\n${message}`
        : message;

      // 3. Send message
      await sendChatMessage({
        chatId,
        senderId: currentUser.uid,
        senderName: senderCompanyName,
        senderRole: currentUser.role === 'company' ? 'company' : 'user',
        recipientId: candidateId,
        text: fullMessageText,
        interviewInvite,
      });

      setSentChatId(chatId);
    } catch (err: any) {
      console.error('Error sending message:', err);
      setError(err?.message || 'Gagal mengirim pesan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in font-sans">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-purple-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-purple-600 via-purple-700 to-pink-500 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/20 rounded-xl">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-base leading-tight">Hubungi Kandidat</h3>
              <p className="text-xs text-purple-100">
                {candidateName} • {positionWanted}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {sentChatId ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-14 h-14 bg-purple-50 text-purple-700 rounded-2xl flex items-center justify-center mx-auto border border-purple-200">
              <CheckCircle2 className="w-8 h-8 text-purple-600" />
            </div>
            <div className="space-y-1">
              <h4 className="font-extrabold text-slate-800 text-base">Pesan Berhasil Terkirim!</h4>
              <p className="text-xs text-slate-600 max-w-sm mx-auto">
                Ruang obrolan telah dibuat dan pesan Anda langsung masuk ke inbox {candidateName}.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 cursor-pointer"
              >
                Tutup
              </button>
              {onNavigateToChat && (
                <button
                  onClick={() => {
                    onClose();
                    onNavigateToChat(sentChatId);
                  }}
                  className="px-5 py-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white text-xs font-bold rounded-xl hover:opacity-95 shadow-md shadow-purple-500/20 cursor-pointer"
                >
                  Buka Chat Sekarang
                </button>
              )}
            </div>
          </div>
        ) : !allowContact ? (
          <div className="p-6 text-center space-y-3">
            <div className="w-12 h-12 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-800 text-sm">Privasi Kontak Dibatasi</h4>
            <p className="text-xs text-slate-600 max-w-xs mx-auto">
              Kandidat ini mengatur agar tidak menerima kontak langsung saat ini demi privasi.
            </p>
            <button
              onClick={onClose}
              className="mt-2 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer"
            >
              Tutup
            </button>
          </div>
        ) : (
          <form onSubmit={handleSend} className="p-5 sm:p-6 overflow-y-auto space-y-3.5">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2 font-medium">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-2xl flex items-start gap-2 text-xs text-purple-950">
              <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
              <span>
                DIGAWE YUK melindungi keamanan data kandidat. Kontak dilakukan langsung via sistem Chat terenkripsi tanpa perantara.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Subjek Pesan / Lowongan yang Ditawarkan <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Contoh: Penawaran Pekerjaan untuk Posisi Graphic Designer"
                className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-hidden bg-slate-50/50"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Pesan untuk Kandidat <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tuliskan pesan perkenalan perusahaan, tawaran kerja sama, atau alasan mengapa kandidat cocok..."
                rows={4}
                className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-hidden bg-slate-50/50 resize-none leading-relaxed"
                required
              />
            </div>

            {/* Checkbox sertakan undangan wawancara langsung */}
            <div className="p-3.5 rounded-2xl bg-purple-50/50 border border-purple-100 space-y-2.5">
              <label className="flex items-center gap-2 text-xs font-bold text-purple-900 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeInterview}
                  onChange={(e) => setIncludeInterview(e.target.checked)}
                  className="rounded-md text-purple-600 focus:ring-purple-500 w-4 h-4"
                />
                <Calendar className="w-3.5 h-3.5 text-purple-600" />
                <span>Sertakan Jadwal Undangan Interview Langsung</span>
              </label>

              {includeInterview && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-0.5">
                      Tanggal Interview
                    </label>
                    <input
                      type="date"
                      value={interviewDate}
                      onChange={(e) => setInterviewDate(e.target.value)}
                      className="w-full text-xs p-2 bg-white border border-purple-200 rounded-lg outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-0.5">
                      Waktu (WIB)
                    </label>
                    <input
                      type="time"
                      value={interviewTime}
                      onChange={(e) => setInterviewTime(e.target.value)}
                      className="w-full text-xs p-2 bg-white border border-purple-200 rounded-lg outline-hidden"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-medium text-slate-600 mb-0.5">
                      Lokasi / Tautan Meeting
                    </label>
                    <input
                      type="text"
                      value={interviewLocation}
                      onChange={(e) => setInterviewLocation(e.target.value)}
                      placeholder="Online Google Meet atau Alamat Kantor"
                      className="w-full text-xs p-2 bg-white border border-purple-200 rounded-lg outline-hidden"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-purple-50">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-500 hover:opacity-95 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-purple-500/20 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Mengirim...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Kirim Pesan Langsung</span>
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
