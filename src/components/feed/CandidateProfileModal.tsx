import React from 'react';
import {
  X,
  MapPin,
  Briefcase,
  GraduationCap,
  Sparkles,
  ExternalLink,
  MessageSquare,
  ShieldCheck,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import { Post, User } from '../../types';

interface CandidateProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  post?: Post;
  candidateUser?: User | null;
  onContact?: () => void;
}

export const CandidateProfileModal: React.FC<CandidateProfileModalProps> = ({
  isOpen,
  onClose,
  post,
  candidateUser,
  onContact,
}) => {
  if (!isOpen || (!post && !candidateUser)) return null;

  const name = post?.userName || candidateUser?.name || 'Kandidat';
  const avatar = post?.userAvatar || candidateUser?.photoURL;
  const position = post?.positionWanted || candidateUser?.headline || 'Pencari Kerja';
  const location = post?.locationWanted || candidateUser?.city || 'Jawa Barat';
  const experience = post?.experience || candidateUser?.experience || '1-2 Tahun';
  const education = post?.education || candidateUser?.education || 'Sarjana / S1';
  const skills = post?.skills || candidateUser?.skills || [];
  const isOpenToWork = post?.openToWork ?? candidateUser?.openToWork ?? true;
  const portfolioUrl = post?.portfolioUrl;
  const content = post?.content;
  const availability = post?.availability || 'Segera';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Banner */}
        <div className="h-24 bg-linear-to-r from-blue-600 via-indigo-600 to-emerald-600 relative">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Header Profile */}
        <div className="px-6 pb-4 relative -mt-12 flex items-end justify-between">
          <div className="flex items-end gap-3.5">
            <div className="w-20 h-20 rounded-2xl border-4 border-white shadow-md overflow-hidden bg-slate-100 shrink-0">
              {avatar ? (
                <img
                  src={avatar}
                  alt={name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full bg-linear-to-br from-blue-500 to-indigo-600 text-white font-bold text-2xl flex items-center justify-center">
                  {name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="mb-1">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 leading-tight">{name}</h3>
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
              </div>
              <p className="text-xs font-medium text-slate-600">{position}</p>
            </div>
          </div>

          {isOpenToWork && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-full shrink-0 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              OPEN TO WORK
            </span>
          )}
        </div>

        {/* Scrollable details */}
        <div className="px-6 py-4 overflow-y-auto space-y-4 text-xs text-slate-700">
          {/* Quick info badges */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-2">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Lokasi</span>
                <span className="font-semibold text-slate-800">{location}</span>
              </div>
            </div>
            <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Pengalaman</span>
                <span className="font-semibold text-slate-800">{experience}</span>
              </div>
            </div>
            <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Pendidikan</span>
                <span className="font-semibold text-slate-800">{education}</span>
              </div>
            </div>
            <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Mulai Bekerja</span>
                <span className="font-semibold text-slate-800">{availability}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          {content && (
            <div className="space-y-1.5">
              <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                Deskripsi Diri & Harapan Kerja
              </h4>
              <div className="p-3.5 bg-slate-50 border border-slate-200/70 rounded-xl text-slate-700 leading-relaxed text-xs">
                {content}
              </div>
            </div>
          )}

          {/* Skills */}
          {skills && skills.length > 0 && (
            <div className="space-y-1.5">
              <h4 className="font-bold text-slate-900 text-xs">Keahlian & Skill</h4>
              <div className="flex flex-wrap gap-1.5">
                {skills.map((skill, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 bg-blue-50 border border-blue-100 text-blue-700 font-medium rounded-lg text-xs"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Portfolio link */}
          {portfolioUrl && (
            <div className="space-y-1.5">
              <h4 className="font-bold text-slate-900 text-xs">Tautan Portofolio</h4>
              <a
                href={portfolioUrl.startsWith('http') ? portfolioUrl : `https://${portfolioUrl}`}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-medium hover:underline"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                {portfolioUrl}
              </a>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200/70 rounded-xl transition-colors cursor-pointer"
          >
            Tutup
          </button>
          {onContact && (
            <button
              onClick={() => {
                onClose();
                onContact();
              }}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Hubungi Kandidat</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
