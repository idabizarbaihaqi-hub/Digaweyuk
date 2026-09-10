import React from 'react';
import { Shield, Crown, LogIn, Building2 } from 'lucide-react';
import { User } from '../types';
import { PremiumBadge } from './PremiumBadge';
import { AppLogo } from './AppLogo';

interface HeaderProps {
  user: User | null;
  onToggleStatus?: () => void;
  onOpenAdmin: () => void;
  onOpenProfile: () => void;
  onGoToPremium: () => void;
  onOpenAuth: () => void;
  onOpenCompanyPortal?: () => void;
  onOpenFeed?: () => void;
  onOpenChat?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onToggleStatus,
  onOpenAdmin,
  onOpenProfile,
  onGoToPremium,
  onOpenAuth,
  onOpenCompanyPortal,
  onOpenFeed,
  onOpenChat,
}) => {
  const isPremium = user?.subscriptionStatus === 'PREMIUM';
  const isSuperAdmin =
    user?.email?.toLowerCase().trim() === 'id.agnesyakartika@gmail.com' &&
    user?.role === 'super_admin';
  const isCompany = user?.role === 'company';

  return (
    <header
      id="main-app-header"
      className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs"
    >
      <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <AppLogo size="md" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-extrabold text-slate-900 tracking-tight leading-none">
                DIGAWE <span className="text-orange-600">YUK</span>
              </h1>
              <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded">
                JAWA BARAT
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium tracking-tight mt-0.5">
              Cari Kerja Jadi Lebih Mudah.
            </p>
          </div>
        </div>

        {/* Center Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-1">
          {onOpenFeed && (
            <button
              onClick={onOpenFeed}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 hover:text-purple-700 hover:bg-purple-50 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-pink-500" />
              <span>Feed Komunitas</span>
            </button>
          )}
          {onOpenChat && (
            <button
              onClick={onOpenChat}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 hover:text-purple-700 hover:bg-purple-50 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span>Chat</span>
            </button>
          )}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* If user logged in */}
          {user ? (
            <>
              {/* Premium Badge or Upgrade button */}
              {isPremium ? (
                <PremiumBadge status="PREMIUM" size="sm" onClick={onGoToPremium} />
              ) : (
                <button
                  id="btn-header-upgrade"
                  onClick={onGoToPremium}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-full transition-colors shadow-2xs"
                >
                  <Crown className="w-3.5 h-3.5 text-amber-600" />
                  <span>Upgrade</span>
                </button>
              )}

              {/* Recruiter / Company Portal button */}
              {(isCompany || isSuperAdmin) && onOpenCompanyPortal && (
                <button
                  id="btn-header-company"
                  onClick={onOpenCompanyPortal}
                  title="Portal Rekruter Perusahaan"
                  className="px-2.5 py-1 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="hidden sm:inline">Portal Rekruter</span>
                </button>
              )}

              {/* Admin shortcut - STRICTLY visible ONLY to id.agnesyakartika@gmail.com */}
              {isSuperAdmin && (
                <button
                  id="btn-header-admin"
                  onClick={onOpenAdmin}
                  title="Panel Super Admin"
                  className="p-2 text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors flex items-center gap-1.5"
                  aria-label="Panel Super Admin"
                >
                  <Shield className="w-4 h-4 text-blue-700" />
                  <span className="text-xs font-bold hidden sm:inline">Admin</span>
                </button>
              )}

              {/* User Profile Avatar */}
              <button
                id="btn-header-profile"
                onClick={onOpenProfile}
                className="flex items-center gap-1.5 p-1 pl-1.5 pr-2 rounded-full border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors"
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.name}
                    className="w-6 h-6 rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
                <span className="text-xs font-semibold text-slate-700 max-w-[70px] truncate hidden md:inline">
                  {user.name.split(' ')[0]}
                </span>
              </button>
            </>
          ) : (
            /* Guest user -> Login button (No admin button visible for guests) */
            <div className="flex items-center gap-2">
              <button
                id="btn-header-login"
                onClick={onOpenAuth}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Masuk</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
