import React from 'react';

interface AppLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  textClassName?: string;
}

export const AppLogo: React.FC<AppLogoProps> = ({
  className = '',
  size = 'md',
  showText = false,
  textClassName = '',
}) => {
  const sizeMap = {
    xs: 'h-6 w-auto',
    sm: 'h-8 w-auto',
    md: 'h-10 w-auto',
    lg: 'h-14 w-auto',
    xl: 'h-20 w-auto',
  };

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <img
        src="/1788893172742.png"
        onError={(e) => {
          // Fallback to /assets/logo.png if needed
          const target = e.currentTarget;
          if (target.src !== `${window.location.origin}/assets/logo.png`) {
            target.src = '/assets/logo.png';
          }
        }}
        alt="DIGAWE YUK"
        className={`${sizeMap[size]} object-contain drop-shadow-xs transition-transform duration-200`}
        loading="eager"
        referrerPolicy="no-referrer"
      />
      {showText && (
        <div className="flex flex-col leading-none">
          <div className="flex items-center gap-1">
            <span className={`font-black tracking-tight text-slate-900 ${textClassName || 'text-base'}`}>
              DIGAWE <span className="text-orange-600">YUK</span>
            </span>
          </div>
          <span className="text-[10px] text-slate-500 font-medium tracking-tight mt-0.5">
            Jawa Barat
          </span>
        </div>
      )}
    </div>
  );
};
