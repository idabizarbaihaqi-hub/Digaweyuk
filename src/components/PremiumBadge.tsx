import React from 'react';
import { Crown, Sparkles } from 'lucide-react';
import { SubscriptionStatus } from '../types';

interface PremiumBadgeProps {
  status: SubscriptionStatus;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

export const PremiumBadge: React.FC<PremiumBadgeProps> = ({
  status,
  size = 'md',
  onClick,
}) => {
  if (status === 'PREMIUM') {
    return (
      <span
        id="badge-premium-active"
        onClick={onClick}
        className={`inline-flex items-center gap-1.5 font-bold tracking-wide rounded-full text-amber-950 bg-gradient-to-r from-amber-300 via-amber-200 to-yellow-400 border border-amber-300/80 shadow-xs transition-all ${
          size === 'sm'
            ? 'px-2 py-0.5 text-xs'
            : size === 'lg'
            ? 'px-3.5 py-1.5 text-sm'
            : 'px-2.5 py-1 text-xs'
        } ${onClick ? 'cursor-pointer hover:opacity-90' : ''}`}
      >
        <Sparkles className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
        <span>PREMIUM AKTIF</span>
      </span>
    );
  }

  return (
    <span
      id="badge-free-status"
      onClick={onClick}
      className={`inline-flex items-center gap-1 font-semibold rounded-full text-slate-600 bg-slate-100 border border-slate-200/80 ${
        size === 'sm'
          ? 'px-2 py-0.5 text-xs'
          : size === 'lg'
          ? 'px-3 py-1 text-sm'
          : 'px-2.5 py-0.5 text-xs'
      } ${onClick ? 'cursor-pointer hover:bg-slate-200' : ''}`}
    >
      <Crown className="w-3 h-3 text-slate-400" />
      <span>FREE</span>
    </span>
  );
};
