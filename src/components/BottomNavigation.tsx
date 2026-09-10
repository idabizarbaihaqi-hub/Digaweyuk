import React from 'react';
import { Home, Compass, Plus, MessageCircle, User as UserIcon } from 'lucide-react';
import { NavigationTab } from '../types';

interface BottomNavigationProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  onOpenCreate?: () => void;
  unreadChatCount?: number;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  currentTab,
  onSelectTab,
  onOpenCreate,
  unreadChatCount = 0,
}) => {
  const handleTabClick = (tab: NavigationTab) => {
    if (tab === 'buat') {
      if (onOpenCreate) {
        onOpenCreate();
      } else {
        onSelectTab('buat');
      }
      return;
    }
    onSelectTab(tab);
  };

  return (
    <nav
      id="bottom-navigation-bar"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-purple-100/90 shadow-[0_-4px_16px_rgba(147,51,234,0.06)] sm:max-w-md sm:mx-auto sm:rounded-t-2xl sm:bottom-0 sm:border-x sm:border-purple-100 font-sans"
    >
      <div className="flex items-center justify-around py-2 px-2">
        {/* 1. Beranda */}
        <button
          id="nav-tab-beranda"
          onClick={() => handleTabClick('beranda')}
          className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer ${
            currentTab === 'beranda'
              ? 'text-purple-700 font-bold'
              : 'text-slate-500 hover:text-purple-900'
          }`}
        >
          <div className="relative">
            <Home
              className={`w-5 h-5 transition-transform ${
                currentTab === 'beranda' ? 'scale-110 stroke-[2.4]' : ''
              }`}
            />
          </div>
          <span className="text-[11px] mt-1">Beranda</span>
        </button>

        {/* 2. Feed */}
        <button
          id="nav-tab-feed"
          onClick={() => handleTabClick('feed')}
          className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer ${
            currentTab === 'feed'
              ? 'text-purple-700 font-bold'
              : 'text-slate-500 hover:text-purple-900'
          }`}
        >
          <div className="relative">
            <Compass
              className={`w-5 h-5 transition-transform ${
                currentTab === 'feed' ? 'scale-110 stroke-[2.4]' : ''
              }`}
            />
            <span className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-pink-500 ring-2 ring-white" />
          </div>
          <span className="text-[11px] mt-1">Feed</span>
        </button>

        {/* 3. Buat (Action Center) */}
        <button
          id="nav-tab-buat"
          onClick={() => handleTabClick('buat')}
          className="flex-1 flex flex-col items-center justify-center py-0.5 px-1 group cursor-pointer"
          title="Buat Konten Baru"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-purple-700 to-pink-500 text-white flex items-center justify-center shadow-md shadow-purple-500/25 group-hover:scale-105 group-active:scale-95 transition-all">
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </div>
          <span className="text-[10px] mt-0.5 font-bold text-purple-800">Buat</span>
        </button>

        {/* 4. Chat */}
        <button
          id="nav-tab-chat"
          onClick={() => handleTabClick('chat')}
          className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer relative ${
            currentTab === 'chat'
              ? 'text-purple-700 font-bold'
              : 'text-slate-500 hover:text-purple-900'
          }`}
        >
          <div className="relative">
            <MessageCircle
              className={`w-5 h-5 transition-transform ${
                currentTab === 'chat' ? 'scale-110 stroke-[2.4]' : ''
              }`}
            />
            {unreadChatCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-pink-500 text-white text-[10px] font-extrabold px-1 min-w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                {unreadChatCount}
              </span>
            )}
          </div>
          <span className="text-[11px] mt-1">Chat</span>
        </button>

        {/* 5. Profil */}
        <button
          id="nav-tab-profil"
          onClick={() => handleTabClick('profil')}
          className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer ${
            currentTab === 'profil'
              ? 'text-purple-700 font-bold'
              : 'text-slate-500 hover:text-purple-900'
          }`}
        >
          <div className="relative">
            <UserIcon
              className={`w-5 h-5 transition-transform ${
                currentTab === 'profil' ? 'scale-110 stroke-[2.4]' : ''
              }`}
            />
          </div>
          <span className="text-[11px] mt-1">Profil</span>
        </button>
      </div>
    </nav>
  );
};
