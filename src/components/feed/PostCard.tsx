import React, { useState, useEffect } from 'react';
import {
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  MapPin,
  Briefcase,
  GraduationCap,
  Clock,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Send,
  Trash2,
  CheckCircle,
  Flag,
  User as UserIcon,
  CheckCircle2,
  MoreVertical,
  Eye,
  EyeOff,
  BarChart2,
  Check,
} from 'lucide-react';
import { Post, PostComment, User } from '../../types';
import {
  toggleLikePost,
  checkUserLikedPost,
  getPostComments,
  addPostComment,
  deletePostComment,
  savePost,
  unsavePost,
  checkPostSaved,
  markPostGotJob,
  deletePost,
  incrementShareCount,
  incrementViewCount,
} from '../../services/feedService';

interface PostCardProps {
  post: Post;
  currentUser: User | null;
  onOpenAuthModal?: () => void;
  onViewProfile?: (post: Post) => void;
  onContactCandidate?: (post: Post) => void;
  onReportPost?: (post: Post) => void;
  onPostUpdated?: () => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  currentUser,
  onOpenAuthModal,
  onViewProfile,
  onContactCandidate,
  onReportPost,
  onPostUpdated,
}) => {
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likesCount || post.likeCount || 0);
  const [isLiking, setIsLiking] = useState(false);

  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentsCount, setCommentsCount] = useState(post.commentsCount || post.commentCount || 0);

  const [copiedToast, setCopiedToast] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isHidden, setIsHidden] = useState(false);

  const isOwner = currentUser?.uid === post.userId;
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'super_admin';

  // Increment view once on mount
  useEffect(() => {
    incrementViewCount(post.id);
  }, [post.id]);

  // Check initial like & save state
  useEffect(() => {
    if (currentUser?.uid) {
      checkUserLikedPost(post.id, currentUser.uid).then(setLiked);
      checkPostSaved(currentUser.uid, post.id).then(setSaved);
    }
  }, [post.id, currentUser?.uid]);

  // Load comments when expanded
  useEffect(() => {
    if (showComments) {
      setLoadingComments(true);
      getPostComments(post.id)
        .then(setComments)
        .finally(() => setLoadingComments(false));
    }
  }, [showComments, post.id]);

  // Handle Like
  const handleLike = async () => {
    if (!currentUser) {
      if (onOpenAuthModal) onOpenAuthModal();
      return;
    }
    if (isLiking) return;

    setIsLiking(true);
    try {
      const res = await toggleLikePost(post.id, currentUser.uid, currentUser.name || 'Pengguna');
      setLiked(res.liked);
      setLikesCount(res.newCount);
    } catch (err) {
      console.error('Like error:', err);
    } finally {
      setIsLiking(false);
    }
  };

  // Handle Save
  const handleSave = async () => {
    if (!currentUser) {
      if (onOpenAuthModal) onOpenAuthModal();
      return;
    }
    if (isSaving) return;

    setIsSaving(true);
    try {
      if (saved) {
        await unsavePost(currentUser.uid, post.id);
        setSaved(false);
      } else {
        await savePost(currentUser.uid, post.id, post.positionWanted || post.content.slice(0, 50));
        setSaved(true);
      }
    } catch (err) {
      console.error('Save post error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Share
  const handleShare = async () => {
    setIsMenuOpen(false);
    incrementShareCount(post.id);

    const shareData = {
      title: `${post.userName} - ${post.positionWanted} di DIGAWE YUK`,
      text: `Lihat profil kerja ${post.userName} sebagai "${post.positionWanted}" di platform DIGAWE YUK.`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        await copyToClipboard();
      }
    } else {
      await copyToClipboard();
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2500);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  // Handle Add Comment
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      if (onOpenAuthModal) onOpenAuthModal();
      return;
    }
    if (!newComment.trim()) return;

    setSubmittingComment(true);
    try {
      const c = await addPostComment(
        post.id,
        currentUser.uid,
        currentUser.name || 'Pengguna',
        currentUser.photoURL,
        newComment.trim()
      );
      setComments((prev) => [...prev, c]);
      setCommentsCount((prev) => prev + 1);
      setNewComment('');
    } catch (err) {
      console.error('Add comment error:', err);
    } finally {
      setSubmittingComment(false);
    }
  };

  // Handle Delete Comment
  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('Hapus komentar ini?')) return;
    try {
      await deletePostComment(post.id, commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      setCommentsCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Delete comment error:', err);
    }
  };

  // Mark Got Job (Owner only)
  const handleMarkGotJob = async () => {
    if (
      !window.confirm(
        'Selamat! Apakah Anda yakin sudah mendapatkan pekerjaan? Status Open to Work pada postingan ini akan dinonaktifkan.'
      )
    ) {
      return;
    }
    setActionLoading(true);
    try {
      await markPostGotJob(post.id);
      if (onPostUpdated) onPostUpdated();
    } catch (err) {
      console.error('Mark got job error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Post (Owner or Admin)
  const handleDeletePost = async () => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus postingan ini?')) return;
    setActionLoading(true);
    try {
      await deletePost(post.id);
      if (onPostUpdated) onPostUpdated();
    } catch (err) {
      console.error('Delete post error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      const diffMinutes = Math.floor((Date.now() - d.getTime()) / 60000);
      if (diffMinutes < 1) return 'Baru saja';
      if (diffMinutes < 60) return `${diffMinutes} menit lalu`;
      const diffHours = Math.floor(diffMinutes / 60);
      if (diffHours < 24) return `${diffHours} jam lalu`;
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return 'Baru saja';
    }
  };

  const getPostTypeBadge = () => {
    switch (post.type) {
      case 'OPEN_TO_WORK':
        return { label: '🟣 OPEN TO WORK', bg: 'bg-purple-100 text-purple-800 border-purple-200' };
      case 'PORTFOLIO':
        return { label: '💼 PORTOFOLIO', bg: 'bg-pink-100 text-pink-800 border-pink-200' };
      case 'EXPERIENCE':
        return { label: '🏢 PENGALAMAN KERJA', bg: 'bg-indigo-100 text-indigo-800 border-indigo-200' };
      case 'CERTIFICATE':
        return { label: '🏆 SERTIFIKAT', bg: 'bg-amber-100 text-amber-900 border-amber-200' };
      case 'CAREER_TIPS':
        return { label: '💡 TIPS KARIER', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
      default:
        return { label: '📝 KARIER', bg: 'bg-slate-100 text-slate-800 border-slate-200' };
    }
  };

  if (isHidden) {
    return (
      <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl text-xs text-slate-500 flex items-center justify-between">
        <span>Postingan disembunyikan dari tampilan Anda.</span>
        <button
          onClick={() => setIsHidden(false)}
          className="text-purple-600 font-bold hover:underline cursor-pointer"
        >
          Tampilkan Kembali
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-purple-100/90 shadow-xs hover:shadow-md transition-all overflow-hidden font-sans">
      {/* Scam Warning Banner if flagged */}
      {post.flaggedAsScam && (
        <div className="px-5 py-3 bg-amber-50 border-b border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="font-semibold leading-tight">
              {post.scamWarningText ||
                '⚠️ Waspada Penipuan: DIGAWE YUK tidak menyarankan pembayaran uang kepada pihak yang menjanjikan pekerjaan.'}
            </span>
          </div>
          <button
            onClick={() => onReportPost && onReportPost(post)}
            className="px-2.5 py-1 bg-amber-200 hover:bg-amber-300 text-amber-950 font-bold rounded-lg text-[11px] shrink-0 cursor-pointer"
          >
            Laporkan
          </button>
        </div>
      )}

      {/* Card Header */}
      <div className="p-4 sm:p-5 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div
            onClick={() => onViewProfile && onViewProfile(post)}
            className="w-12 h-12 rounded-2xl bg-purple-50 overflow-hidden border border-purple-100 shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
          >
            {post.userAvatar ? (
              <img
                src={post.userAvatar}
                alt={post.userName}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-tr from-purple-600 to-pink-500 text-white font-extrabold text-lg flex items-center justify-center">
                {post.userName ? post.userName.charAt(0).toUpperCase() : 'U'}
              </div>
            )}
          </div>

          {/* User Info */}
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                onClick={() => onViewProfile && onViewProfile(post)}
                className="font-extrabold text-slate-900 text-sm hover:text-purple-700 transition-colors cursor-pointer"
              >
                {post.userName}
              </span>
              {post.userVerified && (
                <CheckCircle2 className="w-4 h-4 text-purple-600 fill-purple-50 shrink-0" />
              )}
              {post.openToWork && post.status === 'ACTIVE' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 border border-purple-200 text-purple-700 text-[10px] font-bold rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-pulse" />
                  OPEN TO WORK
                </span>
              )}
              {post.status === 'CLOSED' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-full">
                  <CheckCircle className="w-3 h-3 text-emerald-600" />
                  Sudah Bekerja
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5 flex-wrap">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-purple-500" />
                {post.locationWanted || post.city || 'Jawa Barat'}
              </span>
              <span>•</span>
              <span className="text-[11px] text-slate-400">{formatDate(post.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Right Header: Post type badge + "•••" Menu */}
        <div className="flex items-center gap-2 relative">
          <span
            className={`hidden sm:inline-block px-2.5 py-1 rounded-full text-[11px] font-bold border ${
              getPostTypeBadge().bg
            }`}
          >
            {getPostTypeBadge().label}
          </span>

          {/* 3-dots Menu Button */}
          <div className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-purple-50 rounded-full transition-colors cursor-pointer"
              title="Opsi Postingan"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {/* Dropdown Menu */}
            {isMenuOpen && (
              <div className="absolute right-0 top-8 w-44 bg-white rounded-2xl border border-purple-100 shadow-xl py-1.5 z-30 animate-in fade-in zoom-in-95 text-xs">
                <button
                  onClick={handleShare}
                  className="w-full text-left px-3.5 py-2 hover:bg-purple-50 flex items-center gap-2 text-slate-700 font-medium cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5 text-purple-600" />
                  <span>Bagikan</span>
                </button>
                <button
                  onClick={() => {
                    setIsHidden(true);
                    setIsMenuOpen(false);
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-purple-50 flex items-center gap-2 text-slate-700 font-medium cursor-pointer"
                >
                  <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                  <span>Sembunyikan</span>
                </button>
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    if (onReportPost) onReportPost(post);
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-rose-50 flex items-center gap-2 text-rose-600 font-medium cursor-pointer"
                >
                  <Flag className="w-3.5 h-3.5 text-rose-500" />
                  <span>Laporkan</span>
                </button>
                {isOwner && post.status === 'ACTIVE' && (
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      handleMarkGotJob();
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-emerald-50 flex items-center gap-2 text-emerald-700 font-medium border-t border-slate-100 cursor-pointer"
                  >
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Sudah Dapat Kerja</span>
                  </button>
                )}
                {(isOwner || isAdmin) && (
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      handleDeletePost();
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-rose-50 flex items-center gap-2 text-rose-600 font-medium border-t border-slate-100 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                    <span>Hapus Postingan</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Target Role & Key Tags */}
      <div className="px-4 sm:px-5 pb-2">
        <div className="p-3 bg-purple-50/50 border border-purple-100 rounded-2xl space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs text-purple-900 font-medium">Mencari Posisi:</span>
            <span className="text-xs font-bold text-purple-800 bg-white px-2.5 py-0.5 rounded-lg border border-purple-200 shadow-2xs">
              {post.positionWanted}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 pt-1 border-t border-purple-100">
            {post.experience && (
              <span className="flex items-center gap-1 font-medium">
                <Briefcase className="w-3.5 h-3.5 text-purple-500" />
                {post.experience}
              </span>
            )}
            {post.employmentType && (
              <span className="flex items-center gap-1 font-medium">
                <Clock className="w-3.5 h-3.5 text-purple-500" />
                {post.employmentType}
              </span>
            )}
            {post.availability && (
              <span className="flex items-center gap-1 text-purple-800 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Ketersediaan: {post.availability}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Post Content */}
      <div className="px-4 sm:px-5 py-2">
        <p className="text-xs sm:text-sm text-slate-700 whitespace-pre-line leading-relaxed">
          {post.content}
        </p>
      </div>

      {/* Skills Tags */}
      {post.skills && post.skills.length > 0 && (
        <div className="px-4 sm:px-5 py-1.5 flex flex-wrap gap-1.5">
          {post.skills.map((skill, idx) => (
            <span
              key={idx}
              className="px-2.5 py-0.5 bg-purple-50 text-purple-700 border border-purple-100 text-[11px] font-medium rounded-lg"
            >
              #{skill}
            </span>
          ))}
        </div>
      )}

      {/* Portfolio Link */}
      {post.portfolioUrl && (
        <div className="px-4 sm:px-5 py-2">
          <a
            href={
              post.portfolioUrl.startsWith('http')
                ? post.portfolioUrl
                : `https://${post.portfolioUrl}`
            }
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-800 text-xs font-semibold rounded-xl transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5 text-purple-600" />
            <span>Lihat Portofolio: {post.portfolioUrl.replace(/^https?:\/\//, '').slice(0, 35)}...</span>
          </a>
        </div>
      )}

      {/* Toast Alert for Copy Link */}
      {copiedToast && (
        <div className="mx-4 my-1 p-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center justify-center gap-1.5 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Tautan postingan berhasil disalin ke clipboard!</span>
        </div>
      )}

      {/* Owner Real Analytics Strip (Requirement #30) */}
      {isOwner && (
        <div className="mx-4 sm:mx-5 my-1 px-3 py-2 bg-purple-50/70 border border-purple-100 rounded-xl flex items-center justify-between text-[11px] text-purple-900 font-medium">
          <span className="flex items-center gap-1 font-bold text-purple-800">
            <BarChart2 className="w-3.5 h-3.5" />
            Statistik Postingan:
          </span>
          <div className="flex items-center gap-3">
            <span>👁️ {post.viewsCount || 0} Dilihat</span>
            <span>❤️ {likesCount} Suka</span>
            <span>💬 {commentsCount} Komentar</span>
            <span>🔖 {post.saveCount || 0} Disimpan</span>
            <span>↗ {post.shareCount || 0} Dibagikan</span>
          </div>
        </div>
      )}

      {/* Card Action Buttons */}
      <div className="px-4 py-3 mt-1 border-t border-purple-50 flex items-center justify-between text-xs text-slate-600">
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Like button */}
          <button
            onClick={handleLike}
            disabled={isLiking}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-colors cursor-pointer ${
              liked
                ? 'text-pink-600 bg-pink-50 hover:bg-pink-100'
                : 'text-slate-600 hover:bg-purple-50'
            }`}
          >
            <Heart className={`w-4 h-4 ${liked ? 'fill-pink-600 text-pink-600' : ''}`} />
            <span>{likesCount > 0 ? likesCount : 'Suka'}</span>
          </button>

          {/* Comment button */}
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium text-slate-600 hover:bg-purple-50 transition-colors cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" />
            <span>{commentsCount > 0 ? commentsCount : 'Komentar'}</span>
          </button>

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-colors cursor-pointer ${
              saved
                ? 'text-purple-700 bg-purple-50 hover:bg-purple-100'
                : 'text-slate-600 hover:bg-purple-50'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${saved ? 'fill-purple-700 text-purple-700' : ''}`} />
            <span className="hidden sm:inline">{saved ? 'Tersimpan' : 'Simpan'}</span>
          </button>

          {/* Share button */}
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium text-slate-600 hover:bg-purple-50 transition-colors cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">Bagikan</span>
          </button>
        </div>

        {/* Recruiter / Candidate Interactions */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onViewProfile && onViewProfile(post)}
            className="px-3.5 py-1.5 text-xs font-bold text-purple-800 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl transition-colors cursor-pointer"
          >
            Lihat Profil
          </button>
          {!isOwner && (
            <button
              onClick={() => onContactCandidate && onContactCandidate(post)}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-pink-500 hover:opacity-95 rounded-xl transition-all shadow-xs cursor-pointer"
            >
              Hubungi
            </button>
          )}
        </div>
      </div>

      {/* Expandable Comments Section */}
      {showComments && (
        <div className="bg-purple-50/30 p-4 border-t border-purple-50 space-y-3">
          {/* Add comment input */}
          <form onSubmit={handleAddComment} className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Tulis komentar yang membangun dan sopan..."
              className="flex-1 text-xs p-2.5 bg-white border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-hidden"
            />
            <button
              type="submit"
              disabled={submittingComment || !newComment.trim()}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-500 hover:opacity-95 text-white text-xs font-bold rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 cursor-pointer shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Kirim</span>
            </button>
          </form>

          {/* Comments List */}
          {loadingComments ? (
            <div className="text-center py-4 text-xs text-slate-500">Memuat komentar...</div>
          ) : comments.length === 0 ? (
            <div className="text-center py-4 text-xs text-slate-400">
              Belum ada komentar. Jadilah yang pertama berkomentar!
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  className="p-3 bg-white rounded-xl border border-purple-100 flex items-start justify-between gap-2 shadow-2xs"
                >
                  <div className="flex items-start gap-2.5">
                    {comment.userAvatar ? (
                      <img
                        src={comment.userAvatar}
                        alt={comment.userName}
                        className="w-7 h-7 rounded-lg object-cover border border-purple-100 shrink-0"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center shrink-0">
                        {comment.userName ? comment.userName.charAt(0).toUpperCase() : 'U'}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-slate-800">
                          {comment.userName}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {formatDate(comment.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 mt-0.5 whitespace-pre-line leading-relaxed">
                        {comment.content}
                      </p>
                    </div>
                  </div>

                  {(currentUser?.uid === comment.userId || isAdmin) && (
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition-colors cursor-pointer shrink-0"
                      title="Hapus Komentar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
