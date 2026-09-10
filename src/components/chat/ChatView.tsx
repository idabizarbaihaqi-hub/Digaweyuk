import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Send,
  ArrowLeft,
  ShieldCheck,
  AlertTriangle,
  Calendar,
  Clock,
  MapPin,
  Building2,
  User as UserIcon,
  Search,
  CheckCheck,
  Loader2,
  Sparkles,
  Briefcase,
  Video,
  CheckCircle2,
  XCircle,
  X,
  DollarSign,
  Share2,
} from 'lucide-react';
import { ChatMessage, ChatRoom, User, Job } from '../../types';
import {
  subscribeUserChatRooms,
  subscribeChatMessages,
  sendChatMessage,
  updateChatMessageInvite,
} from '../../services/chatService';
import { getCompanyJobs, applyToJob } from '../../services/companyService';

interface ChatViewProps {
  currentUser: User | null;
  activeChatId?: string | null;
  onOpenAuthModal?: () => void;
  onSelectChatId?: (chatId: string | null) => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  currentUser,
  activeChatId: initialChatId,
  onOpenAuthModal,
  onSelectChatId,
}) => {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(initialChatId || null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Recruitment features in chat
  const isCompany = currentUser?.role === 'company' || currentUser?.role === 'super_admin';
  const [companyJobs, setCompanyJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [showSendJobModal, setShowSendJobModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteJobTitle, setInviteJobTitle] = useState('');
  const [inviteDate, setInviteDate] = useState('');
  const [inviteTime, setInviteTime] = useState('');
  const [inviteLocation, setInviteLocation] = useState('');
  const [inviteNotes, setInviteNotes] = useState('');
  const [appliedJobs, setAppliedJobs] = useState<Set<string>>(new Set());
  const [applyingJobId, setApplyingJobId] = useState<string | null>(null);
  const [systemBanner, setSystemBanner] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialChatId) {
      setSelectedRoomId(initialChatId);
    }
  }, [initialChatId]);

  // Load company jobs if user is company
  useEffect(() => {
    if (isCompany && currentUser) {
      setLoadingJobs(true);
      getCompanyJobs(currentUser.uid)
        .then((jobs) => setCompanyJobs(jobs))
        .catch((err) => console.error('Error fetching company jobs for chat:', err))
        .finally(() => setLoadingJobs(false));
    }
  }, [isCompany, currentUser]);

  // Subscribe to rooms
  useEffect(() => {
    if (!currentUser) {
      setLoadingRooms(false);
      return;
    }

    setLoadingRooms(true);
    const unsubscribe = subscribeUserChatRooms(currentUser.uid, (data) => {
      setRooms(data);
      setLoadingRooms(false);

      // Auto-select first room on desktop if none selected
      if (!selectedRoomId && data.length > 0 && window.innerWidth >= 768) {
        setSelectedRoomId(data[0].id);
      }
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Subscribe to messages in active room
  useEffect(() => {
    if (!selectedRoomId) {
      setMessages([]);
      return;
    }

    setLoadingMessages(true);
    const unsubscribe = subscribeChatMessages(selectedRoomId, (msgs) => {
      setMessages(msgs);
      setLoadingMessages(false);
      scrollToBottom();
    });

    return () => unsubscribe();
  }, [selectedRoomId]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSelectRoom = (roomId: string) => {
    setSelectedRoomId(roomId);
    if (onSelectChatId) onSelectChatId(roomId);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !selectedRoomId || !inputText.trim() || sending) return;

    const currentRoom = rooms.find((r) => r.id === selectedRoomId);
    if (!currentRoom) return;

    // Recipient is the other participant
    const recipientId =
      currentRoom.participants.find((p) => p !== currentUser.uid) || currentRoom.participants[0];

    const text = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      await sendChatMessage({
        chatId: selectedRoomId,
        senderId: currentUser.uid,
        senderName: currentUser.companyName || currentUser.name || 'Pengguna DIGAWE YUK',
        senderRole: currentUser.role === 'company' ? 'company' : 'user',
        recipientId,
        text,
      });
      scrollToBottom();
    } catch (err) {
      console.error('Failed to send message:', err);
      setInputText(text); // restore if failed
    } finally {
      setSending(false);
    }
  };

  // 1. Perusahaan Kirim Lowongan ke Chat
  const handleSendJob = async (job: Job) => {
    if (!currentUser || !selectedRoomId) return;
    const currentRoom = rooms.find((r) => r.id === selectedRoomId);
    if (!currentRoom) return;
    const recipientId =
      currentRoom.participants.find((p) => p !== currentUser.uid) || currentRoom.participants[0];

    try {
      await sendChatMessage({
        chatId: selectedRoomId,
        senderId: currentUser.uid,
        senderName: currentUser.companyName || currentUser.name || 'Perusahaan',
        senderRole: 'company',
        recipientId,
        text: `Halo, kami merekomendasikan lowongan pekerjaan "${job.title}" untuk Anda. Silakan pelajari kualifikasi dan ajukan lamaran langsung di sini.`,
        jobCard: {
          jobId: job.id,
          jobTitle: job.title,
          companyName: job.companyName || job.company || currentUser.companyName || 'Perusahaan',
          location: job.location || job.city || 'Jawa Barat',
          salary: job.salary || null,
          employmentType: (job as any).type || (job as any).employmentType || 'Full Time',
          category: job.category || 'Umum',
        },
      });
      setShowSendJobModal(false);
      scrollToBottom();
    } catch (err) {
      console.error('Error sending job card:', err);
    }
  };

  // 2. Perusahaan Kirim Undangan Interview
  const handleSendInterviewInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !selectedRoomId || !inviteJobTitle.trim()) return;
    const currentRoom = rooms.find((r) => r.id === selectedRoomId);
    if (!currentRoom) return;
    const recipientId =
      currentRoom.participants.find((p) => p !== currentUser.uid) || currentRoom.participants[0];

    try {
      const scheduledText = `${inviteDate || 'Segera'} ${inviteTime ? `pukul ${inviteTime} WIB` : ''}`.trim();
      await sendChatMessage({
        chatId: selectedRoomId,
        senderId: currentUser.uid,
        senderName: currentUser.companyName || currentUser.name || 'Perusahaan',
        senderRole: 'company',
        recipientId,
        text: `Undangan Wawancara Resmi: Kami mengundang Anda untuk sesi seleksi posisi "${inviteJobTitle}". Mohon konfirmasi kesediaan Anda di bawah ini.`,
        interviewInvite: {
          jobTitle: inviteJobTitle,
          scheduledAt: scheduledText,
          interviewDate: inviteDate,
          interviewTime: inviteTime,
          location: inviteLocation || 'Online / Video Call Room DIGAWE YUK',
          locationOrLink: inviteLocation || 'Online / Video Call Room DIGAWE YUK',
          notes: inviteNotes,
          status: 'PENDING',
        },
      });
      setShowInviteModal(false);
      setInviteJobTitle('');
      setInviteDate('');
      setInviteTime('');
      setInviteLocation('');
      setInviteNotes('');
      scrollToBottom();
    } catch (err) {
      console.error('Error sending interview invite:', err);
    }
  };

  // 3. Kandidat Melamar Pekerjaan Langsung dari Kartu di Chat
  const handleApplyFromChat = async (jobCard: NonNullable<ChatMessage['jobCard']>) => {
    if (!currentUser || !selectedRoomId) return;
    setApplyingJobId(jobCard.jobId);
    const currentRoom = rooms.find((r) => r.id === selectedRoomId);
    const recipientId =
      currentRoom?.participants.find((p) => p !== currentUser.uid) || currentRoom?.participants[0] || '';

    try {
      const jobData: any = {
        id: jobCard.jobId,
        title: jobCard.jobTitle,
        company: jobCard.companyName,
        companyName: jobCard.companyName,
        companyId: recipientId,
      };

      await applyToJob(jobData, {
        id: currentUser.uid,
        name: currentUser.name || 'Kandidat DIGAWE YUK',
        email: currentUser.email,
        phone: currentUser.phoneNumber || '',
        resumeUrl: '',
        coverNote: 'Lamaran resmi diajukan langsung melalui interaksi chat rekrutmen.',
      });

      setAppliedJobs((prev) => new Set(prev).add(jobCard.jobId));
      setSystemBanner(`✅ Berhasil melamar posisi "${jobCard.jobTitle}". Lamaran Anda telah masuk ke recruitment pipeline perusahaan.`);
      setTimeout(() => setSystemBanner(null), 6000);

      // Send automated message in chat
      await sendChatMessage({
        chatId: selectedRoomId,
        senderId: currentUser.uid,
        senderName: currentUser.name || 'Kandidat',
        senderRole: 'user',
        recipientId,
        text: `Saya telah resmi mengirimkan lamaran untuk posisi "${jobCard.jobTitle}". Terima kasih atas tawarannya!`,
      });
      scrollToBottom();
    } catch (err) {
      console.error('Error applying to job from chat:', err);
    } finally {
      setApplyingJobId(null);
    }
  };

  // 4. Kandidat Menerima atau Menolak Undangan Interview
  const handleRespondInvite = async (msg: ChatMessage, response: 'ACCEPTED' | 'REJECTED') => {
    if (!selectedRoomId || !currentUser) return;
    const currentRoom = rooms.find((r) => r.id === selectedRoomId);
    const recipientId =
      currentRoom?.participants.find((p) => p !== currentUser.uid) || currentRoom?.participants[0] || '';

    try {
      await updateChatMessageInvite(selectedRoomId, msg.id, response);

      const jobTitle = msg.interviewInvite?.jobTitle || 'pekerjaan';
      const followUpText =
        response === 'ACCEPTED'
          ? `Saya MENERIMA undangan wawancara untuk posisi "${jobTitle}". Saya siap hadir sesuai jadwal.`
          : `Terima kasih banyak atas undangannya. Mohon maaf saat ini saya BELUM DAPAT menghadiri jadwal wawancara untuk posisi "${jobTitle}".`;

      await sendChatMessage({
        chatId: selectedRoomId,
        senderId: currentUser.uid,
        senderName: currentUser.name || 'Kandidat',
        senderRole: 'user',
        recipientId,
        text: followUpText,
      });

      setSystemBanner(
        response === 'ACCEPTED'
          ? `✅ Anda menerima undangan interview untuk "${jobTitle}". Jadwal tercatat di akun Anda.`
          : `Konfirmasi penolakan jadwal interview "${jobTitle}" telah dikirim ke perusahaan.`
      );
      setTimeout(() => setSystemBanner(null), 5000);
      scrollToBottom();
    } catch (err) {
      console.error('Error responding to interview invite:', err);
    }
  };


  if (!currentUser) {
    return (
      <div className="w-full max-w-md mx-auto my-12 p-8 bg-white rounded-3xl border border-purple-100 shadow-md text-center space-y-4 font-sans">
        <div className="w-16 h-16 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto border border-purple-200">
          <MessageSquare className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-extrabold text-slate-800">Masuk untuk Melihat Chat</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          Hubungkan komunikasi langsung antara pencari kerja dan perusahaan secara aman dan terenkripsi.
        </p>
        <button
          onClick={onOpenAuthModal}
          className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-500 hover:opacity-95 text-white font-bold text-xs rounded-xl shadow-md shadow-purple-500/20 cursor-pointer"
        >
          Masuk Sekarang
        </button>
      </div>
    );
  }

  const activeRoom = rooms.find((r) => r.id === selectedRoomId);
  const otherParticipantId = activeRoom?.participants.find((p) => p !== currentUser.uid);
  const otherParticipant = otherParticipantId
    ? activeRoom?.participantDetails?.[otherParticipantId]
    : undefined;

  const filteredRooms = rooms.filter((r) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const otherId = r.participants.find((p) => p !== currentUser.uid);
    const detail = otherId ? r.participantDetails?.[otherId] : null;
    return (
      (detail?.name && detail.name.toLowerCase().includes(query)) ||
      (r.lastMessage && r.lastMessage.toLowerCase().includes(query)) ||
      (r.jobTitle && r.jobTitle.toLowerCase().includes(query))
    );
  });

  return (
    <div className="w-full max-w-5xl mx-auto font-sans">
      <div className="bg-white rounded-3xl border border-purple-100 shadow-sm overflow-hidden flex h-[calc(100vh-140px)] min-h-[500px]">
        {/* LEFT COLUMN: Chat Rooms List */}
        <div
          className={`w-full md:w-80 lg:w-96 border-r border-purple-100 flex flex-col shrink-0 ${
            selectedRoomId ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Header */}
          <div className="p-4 border-b border-purple-50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <h2 className="font-extrabold text-base text-slate-900">Pesan & Diskusi</h2>
              </div>
              <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
                {rooms.length} Obrolan
              </span>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari percakapan..."
                className="w-full text-xs pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Rooms List */}
          <div className="flex-1 overflow-y-auto divide-y divide-purple-50/60">
            {loadingRooms ? (
              <div className="p-6 text-center text-xs text-slate-400 space-y-2">
                <Loader2 className="w-5 h-5 animate-spin mx-auto text-purple-600" />
                <span>Memuat percakapan...</span>
              </div>
            ) : filteredRooms.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <p className="text-xs font-bold text-slate-700">Belum ada obrolan</p>
                <p className="text-[11px] text-slate-400">
                  Percakapan akan muncul saat perusahaan menghubungi Anda atau saat Anda mengirim pesan dari Feed.
                </p>
              </div>
            ) : (
              filteredRooms.map((r) => {
                const partnerId = r.participants.find((p) => p !== currentUser.uid);
                const partner = partnerId ? r.participantDetails?.[partnerId] : null;
                const isSelected = r.id === selectedRoomId;
                const isPartnerCompany = partner?.role === 'company';

                return (
                  <button
                    key={r.id}
                    onClick={() => handleSelectRoom(r.id)}
                    className={`w-full p-3.5 text-left flex items-start gap-3 transition-all cursor-pointer ${
                      isSelected ? 'bg-purple-50/80 border-l-4 border-l-purple-600' : 'hover:bg-purple-50/40'
                    }`}
                  >
                    {/* Avatar */}
                    <div className="w-11 h-11 rounded-2xl bg-purple-100 overflow-hidden shrink-0 border border-purple-200 flex items-center justify-center font-bold text-sm text-purple-800">
                      {partner?.avatar ? (
                        <img
                          src={partner.avatar}
                          alt={partner.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        partner?.name?.charAt(0).toUpperCase() || 'U'
                      )}
                    </div>

                    {/* Meta */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="font-extrabold text-xs text-slate-900 truncate">
                          {partner?.name || 'Pengguna DIGAWE YUK'}
                        </h4>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {r.lastMessageAt ? new Date(r.lastMessageAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-md ${
                            isPartnerCompany
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {isPartnerCompany ? 'Perusahaan' : 'Pencari Kerja'}
                        </span>
                        {r.jobTitle && (
                          <span className="text-[10px] text-slate-500 truncate font-medium">
                            • {r.jobTitle}
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-500 truncate mt-1 leading-snug">
                        {r.lastMessage || 'Tidak ada pesan'}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Chat Conversation */}
        <div
          className={`flex-1 flex flex-col bg-slate-50/30 ${
            !selectedRoomId ? 'hidden md:flex' : 'flex'
          }`}
        >
          {activeRoom ? (
            <>
              {/* Conversation Header */}
              <div className="p-3.5 sm:p-4 bg-white border-b border-purple-100 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  {/* Back button on mobile */}
                  <button
                    onClick={() => setSelectedRoomId(null)}
                    className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-purple-50 rounded-xl md:hidden cursor-pointer"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>

                  {/* Partner Avatar */}
                  <div className="w-10 h-10 rounded-2xl bg-purple-100 overflow-hidden shrink-0 border border-purple-200 flex items-center justify-center font-bold text-purple-800">
                    {otherParticipant?.avatar ? (
                      <img
                        src={otherParticipant.avatar}
                        alt={otherParticipant.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      otherParticipant?.name?.charAt(0).toUpperCase() || 'U'
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-extrabold text-xs sm:text-sm text-slate-900">
                        {otherParticipant?.name || 'Kontak'}
                      </h3>
                      <span
                        className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-md ${
                          otherParticipant?.role === 'company'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {otherParticipant?.role === 'company' ? 'Perusahaan' : 'Pencari Kerja'}
                      </span>
                    </div>
                    {activeRoom.jobTitle && (
                      <p className="text-[11px] text-purple-700 font-medium">
                        Posisi Terkait: {activeRoom.jobTitle}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <div className="hidden sm:flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full font-bold border border-emerald-200">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Chat Aman Terverifikasi</span>
                  </div>
                </div>
              </div>

              {/* Safety notice banner */}
              <div className="px-4 py-2 bg-purple-50/80 border-b border-purple-100 text-[11px] text-purple-900 flex items-center justify-center gap-1.5 font-medium">
                <AlertTriangle className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                <span>
                  Waspada penipuan: Jangan pernah mentransfer uang atau membayar biaya administrasi/seragam apapun.
                </span>
              </div>

              {/* Messages Body */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
                {loadingMessages ? (
                  <div className="p-8 text-center text-xs text-slate-400 space-y-2">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto text-purple-600" />
                    <span>Memuat pesan...</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="p-8 text-center space-y-2 max-w-sm mx-auto">
                    <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-bold text-slate-700">Percakapan Baru Dimulai</p>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Kirimkan salam pembuka atau pertanyaan seputar kualifikasi dan kesempatan kerja.
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.senderId === currentUser.uid;

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[85%] sm:max-w-md p-3.5 rounded-2xl space-y-2 ${
                            isMe
                              ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-br-xs shadow-xs'
                              : 'bg-white border border-purple-100 text-slate-800 rounded-bl-xs shadow-xs'
                          }`}
                        >
                          {/* Sender name for other party */}
                          {!isMe && (
                            <p className="text-[10px] font-black text-purple-700 tracking-wide">
                              {msg.senderName}
                            </p>
                          )}

                          {/* Message Text */}
                          <p className="text-xs leading-relaxed whitespace-pre-line">{msg.text}</p>

                          {/* 1. Job Card in Chat (BAGIAN O Requirement) */}
                          {msg.jobCard && (
                            <div
                              className={`p-3 rounded-2xl border text-xs space-y-2.5 ${
                                isMe
                                  ? 'bg-white/15 border-white/30 text-white'
                                  : 'bg-gradient-to-br from-blue-50/90 to-indigo-50/90 border-blue-200 text-slate-800'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="space-y-0.5">
                                  <span className={`text-[10px] font-bold uppercase tracking-wide ${isMe ? 'text-blue-200' : 'text-blue-700'}`}>
                                    Rekomendasi Lowongan
                                  </span>
                                  <h4 className="font-extrabold text-sm leading-snug">
                                    {msg.jobCard.jobTitle}
                                  </h4>
                                  <p className={`text-[11px] font-medium ${isMe ? 'text-white/80' : 'text-slate-600'}`}>
                                    {msg.jobCard.companyName}
                                  </p>
                                </div>
                                <div className="p-2 rounded-xl bg-white/30 text-blue-600">
                                  <Briefcase className="w-4 h-4" />
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                                <div className="flex items-center gap-1 opacity-90">
                                  <MapPin className="w-3 h-3 text-blue-500 shrink-0" />
                                  <span className="truncate">{msg.jobCard.location}</span>
                                </div>
                                {msg.jobCard.salary && (
                                  <div className="flex items-center gap-1 opacity-90 font-semibold">
                                    <DollarSign className="w-3 h-3 text-emerald-500 shrink-0" />
                                    <span className="truncate">{msg.jobCard.salary}</span>
                                  </div>
                                )}
                              </div>

                              {/* Candidate Apply Action */}
                              {!isMe && currentUser?.role !== 'company' && (
                                <div className="pt-1">
                                  {appliedJobs.has(msg.jobCard.jobId) ? (
                                    <div className="w-full py-2 bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-xl text-center font-bold text-xs flex items-center justify-center gap-1.5">
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                      <span>Lamaran Berhasil Terkirim</span>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => handleApplyFromChat(msg.jobCard!)}
                                      disabled={applyingJobId === msg.jobCard.jobId}
                                      className="w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold text-xs shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all"
                                    >
                                      {applyingJobId === msg.jobCard.jobId ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                      ) : (
                                        <Briefcase className="w-3.5 h-3.5" />
                                      )}
                                      <span>Lamar Pekerjaan Ini</span>
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          {/* 2. Interview Invite Card in Chat (BAGIAN O Requirement) */}
                          {msg.interviewInvite && (
                            <div
                              className={`p-3.5 rounded-2xl border text-xs space-y-2.5 ${
                                isMe
                                  ? 'bg-white/15 border-white/30 text-white'
                                  : 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 text-purple-950 shadow-xs'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2 border-b pb-2 border-purple-200/50">
                                <div className="flex items-center gap-1.5 font-bold">
                                  <Calendar className="w-4 h-4 text-pink-500" />
                                  <span>Undangan Interview: {msg.interviewInvite.jobTitle}</span>
                                </div>
                                {/* Status badge */}
                                {msg.interviewInvite.status === 'ACCEPTED' ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    Diterima
                                  </span>
                                ) : msg.interviewInvite.status === 'REJECTED' ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
                                    <XCircle className="w-3 h-3 text-rose-600" />
                                    Ditolak
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200">
                                    Menunggu Respons
                                  </span>
                                )}
                              </div>

                              <div className="text-[11px] space-y-1 opacity-90">
                                <p className="flex items-center gap-1.5">
                                  <Clock className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                                  <span>Jadwal: {msg.interviewInvite.scheduledAt || `${msg.interviewInvite.interviewDate} ${msg.interviewInvite.interviewTime}`}</span>
                                </p>
                                <p className="flex items-center gap-1.5">
                                  <Video className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                                  <span className="truncate">Lokasi / Tautan: {msg.interviewInvite.locationOrLink || msg.interviewInvite.location}</span>
                                </p>
                                {msg.interviewInvite.notes && (
                                  <p className="text-[10px] italic pt-1 text-slate-600 border-t border-purple-100/60">
                                    Catatan: {msg.interviewInvite.notes}
                                  </p>
                                )}
                              </div>

                              {/* Candidate Interactive Actions: Terima & Tolak Interview */}
                              {!isMe && currentUser?.role !== 'company' && (!msg.interviewInvite.status || msg.interviewInvite.status === 'PENDING') && (
                                <div className="pt-2 flex items-center gap-2 border-t border-purple-200/60">
                                  <button
                                    onClick={() => handleRespondInvite(msg, 'ACCEPTED')}
                                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Terima Interview</span>
                                  </button>
                                  <button
                                    onClick={() => handleRespondInvite(msg, 'REJECTED')}
                                    className="px-3 py-2 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 rounded-xl font-bold text-xs border border-slate-200 hover:border-rose-200 transition-all cursor-pointer"
                                  >
                                    Tolak
                                  </button>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Scam warning banner on message */}
                          {msg.isScamSuspect && (
                            <div className="p-2 rounded-lg bg-amber-100 text-amber-900 text-[10px] flex items-center gap-1 border border-amber-300">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                              <span>{msg.scamWarning || 'Pesan terindikasi mencurigakan.'}</span>
                            </div>
                          )}

                          {/* Timestamp */}
                          <div
                            className={`flex items-center justify-end gap-1 text-[9px] ${
                              isMe ? 'text-purple-100' : 'text-slate-400'
                            }`}
                          >
                            <span>
                              {msg.createdAt
                                ? new Date(msg.createdAt).toLocaleTimeString('id-ID', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : ''}
                            </span>
                            {isMe && <CheckCheck className="w-3 h-3 text-purple-200" />}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* System Notification Banner inside Chat */}
              {systemBanner && (
                <div className="mx-4 mb-2 p-3 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-900 text-xs font-semibold flex items-center justify-between gap-2 shadow-xs animate-in fade-in">
                  <span>{systemBanner}</span>
                  <button onClick={() => setSystemBanner(null)} className="text-emerald-700 hover:text-emerald-900">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Company Recruitment Quick Actions Toolbar */}
              {isCompany && (
                <div className="px-4 py-2 bg-slate-50 border-t border-slate-200/80 flex items-center gap-2 overflow-x-auto">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide shrink-0">
                    Menu Rekrutmen:
                  </span>
                  <button
                    onClick={() => setShowSendJobModal(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 hover:border-blue-300 rounded-xl text-xs font-bold transition-colors shrink-0 shadow-2xs cursor-pointer"
                  >
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>Kirim Lowongan</span>
                  </button>
                  <button
                    onClick={() => setShowInviteModal(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-purple-50 text-purple-700 border border-purple-200 hover:border-purple-300 rounded-xl text-xs font-bold transition-colors shrink-0 shadow-2xs cursor-pointer"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Undang Interview</span>
                  </button>
                </div>
              )}

              {/* Message Input Footer */}
              <div className="p-3 sm:p-4 bg-white border-t border-purple-100">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Tulis pesan profesional Anda..."
                    className="flex-1 text-xs p-3 bg-slate-50 border border-slate-200 rounded-2xl outline-hidden focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
                  />
                  <button
                    type="submit"
                    disabled={!inputText.trim() || sending}
                    className="p-3 bg-gradient-to-r from-purple-600 to-pink-500 hover:opacity-95 text-white rounded-2xl shadow-md shadow-purple-500/20 disabled:opacity-40 cursor-pointer transition-all"
                    title="Kirim Pesan"
                  >
                    {sending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </form>
              </div>
            </>
          ) : (
            /* No conversation selected on desktop */
            <div className="flex-1 flex items-center justify-center p-8 text-center">
              <div className="space-y-3 max-w-sm">
                <div className="w-16 h-16 rounded-3xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto border border-purple-100">
                  <MessageSquare className="w-8 h-8" />
                </div>
                <h3 className="font-extrabold text-base text-slate-800">Pilih Percakapan</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Pilih salah satu obrolan di samping kiri untuk membaca pesan dan berinteraksi secara real-time.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal 1: Perusahaan Kirim Lowongan Pekerjaan */}
      {showSendJobModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">Pilih Lowongan untuk Dikirim</h3>
                  <p className="text-[11px] text-slate-400">Kirimkan kartu lowongan resmi ke kandidat</p>
                </div>
              </div>
              <button
                onClick={() => setShowSendJobModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2">
              {loadingJobs ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto text-blue-600 mb-2" />
                  <span>Memuat daftar lowongan...</span>
                </div>
              ) : companyJobs.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500 space-y-1">
                  <p className="font-bold">Belum ada lowongan aktif</p>
                  <p className="text-[11px] text-slate-400">
                    Pasang lowongan terlebih dahulu di Portal Perusahaan untuk merekomendasikannya di chat.
                  </p>
                </div>
              ) : (
                companyJobs.map((job) => (
                  <div
                    key={job.id}
                    onClick={() => handleSendJob(job)}
                    className="p-3 rounded-2xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900 group-hover:text-blue-700">
                        {job.title}
                      </p>
                      <p className="text-[11px] text-slate-500">{job.location || 'Jawa Barat'} • {(job as any).type || (job as any).employmentType || 'Full Time'}</p>
                    </div>
                    <span className="px-3 py-1 bg-blue-600 text-white rounded-xl text-[11px] font-bold group-hover:bg-blue-700">
                      Kirim
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Perusahaan Kirim Undangan Interview */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">Buat Undangan Interview</h3>
                  <p className="text-[11px] text-slate-400">Jadwalkan sesi interview resmi dengan kandidat</p>
                </div>
              </div>
              <button
                onClick={() => setShowInviteModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendInterviewInvite} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Posisi / Judul Pekerjaan *</label>
                <input
                  type="text"
                  required
                  value={inviteJobTitle}
                  onChange={(e) => setInviteJobTitle(e.target.value)}
                  placeholder="Contoh: Frontend Engineer, Staff Gudang..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tanggal *</label>
                  <input
                    type="date"
                    required
                    value={inviteDate}
                    onChange={(e) => setInviteDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Waktu *</label>
                  <input
                    type="time"
                    required
                    value={inviteTime}
                    onChange={(e) => setInviteTime(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Lokasi / Tautan Video Call</label>
                <input
                  type="text"
                  value={inviteLocation}
                  onChange={(e) => setInviteLocation(e.target.value)}
                  placeholder="Contoh: Online Meet DIGAWE YUK / Google Meet / Kantor Cabang"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Catatan Tambahan untuk Kandidat</label>
                <textarea
                  value={inviteNotes}
                  onChange={(e) => setInviteNotes(e.target.value)}
                  rows={2}
                  placeholder="Harap siapkan portofolio dan resume fisik/digital..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:ring-2 focus:ring-purple-500 resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-500 hover:opacity-95 text-white font-bold rounded-xl shadow-md cursor-pointer"
                >
                  Kirim Undangan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

