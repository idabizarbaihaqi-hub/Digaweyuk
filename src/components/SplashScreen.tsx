import React, { useEffect, useState } from 'react';

interface SplashScreenProps {
  onFinish: () => void;
  isReady?: boolean;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onFinish,
  isReady = true,
}) => {
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    // Ensure splash displays cleanly for at least 1500ms, then smoothly dissolves
    const minTimer = setTimeout(() => {
      if (isReady) {
        setFadingOut(true);
        setTimeout(() => {
          onFinish();
        }, 450); // duration of fade transition
      }
    }, 1500);

    return () => clearTimeout(minTimer);
  }, [isReady, onFinish]);

  return (
    <div
      id="app-splash-screen"
      className={`fixed inset-0 z-50 flex items-center justify-center bg-[#EEF4FD] transition-opacity duration-500 select-none ${
        fadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="relative w-full h-full max-w-md max-h-screen flex items-center justify-center p-4">
        <img
          src="/IMG_20260909_022156.png"
          onError={(e) => {
            const target = e.currentTarget;
            if (target.src !== `${window.location.origin}/assets/splash.png`) {
              target.src = '/assets/splash.png';
            }
          }}
          alt="DIGAWE YUK Splash Screen"
          className="w-full h-full object-contain rounded-2xl shadow-xl border border-slate-200/50"
          loading="eager"
          referrerPolicy="no-referrer"
        />
      </div>
    </div>
  );
};
