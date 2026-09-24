import React from 'react';
import { Home, Wallet, Users, MoreHorizontal, Plus } from 'lucide-react';

export type NavTab = 'home' | 'wallet' | 'deposit' | 'team' | 'more';

interface BottomNavProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onOpenDeposit: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onTabChange, onOpenDeposit }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none pb-safe">
      <div className="max-w-md mx-auto relative px-3 pb-2 pointer-events-auto">
        {/* Main white nav pill container */}
        <nav
          id="main-bottom-navigation"
          className="relative bg-white/95 backdrop-blur-lg border border-slate-200/80 shadow-[0_-8px_25px_rgba(0,0,0,0.06)] rounded-3xl h-18 px-3 flex items-center justify-between"
        >
          {/* Home */}
          <button
            id="nav-tab-home"
            onClick={() => onTabChange('home')}
            className={`flex-1 flex flex-col items-center justify-center py-1 transition-all ${
              currentTab === 'home' ? 'text-aqua-800 font-bold scale-105' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Home className={`w-5 h-5 mb-1 ${currentTab === 'home' ? 'stroke-[2.5]' : 'stroke-2'}`} />
            <span className="text-[11px] tracking-tight">Home</span>
          </button>

          {/* Wallet */}
          <button
            id="nav-tab-wallet"
            onClick={() => onTabChange('wallet')}
            className={`flex-1 flex flex-col items-center justify-center py-1 transition-all ${
              currentTab === 'wallet' ? 'text-aqua-800 font-bold scale-105' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Wallet className={`w-5 h-5 mb-1 ${currentTab === 'wallet' ? 'stroke-[2.5]' : 'stroke-2'}`} />
            <span className="text-[11px] tracking-tight">Wallet</span>
          </button>

          {/* Spacer for central floating deposit button */}
          <div className="flex-1 flex justify-center items-center pointer-events-none">
            <span className="text-[11px] text-transparent select-none mt-6">Deposit</span>
          </div>

          {/* Team */}
          <button
            id="nav-tab-team"
            onClick={() => onTabChange('team')}
            className={`flex-1 flex flex-col items-center justify-center py-1 transition-all ${
              currentTab === 'team' ? 'text-aqua-800 font-bold scale-105' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className={`w-5 h-5 mb-1 ${currentTab === 'team' ? 'stroke-[2.5]' : 'stroke-2'}`} />
            <span className="text-[11px] tracking-tight">Team</span>
          </button>

          {/* More */}
          <button
            id="nav-tab-more"
            onClick={() => onTabChange('more')}
            className={`flex-1 flex flex-col items-center justify-center py-1 transition-all ${
              currentTab === 'more' ? 'text-aqua-800 font-bold scale-105' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <MoreHorizontal className={`w-5 h-5 mb-1 ${currentTab === 'more' ? 'stroke-[2.5]' : 'stroke-2'}`} />
            <span className="text-[11px] tracking-tight">More</span>
          </button>
        </nav>

        {/* Central Floating Circular Deposit Button overlapping the bar */}
        <div className="absolute -top-5 left-1/2 -translate-x-1/2 pointer-events-auto flex flex-col items-center">
          <button
            id="nav-floating-deposit-btn"
            onClick={onOpenDeposit}
            className="w-14 h-14 rounded-full bg-peach-500 hover:bg-peach-600 active:scale-95 text-white ring-4 ring-white shadow-lg shadow-peach-500/30 transition-all duration-200 group flex items-center justify-center cursor-pointer"
          >
            <Plus className="w-7 h-7 stroke-[3] group-hover:rotate-90 transition-transform duration-300" />
          </button>
          <span className="text-[10px] font-black text-peach-600 mt-1 tracking-tight uppercase">Deposit</span>
        </div>
      </div>
    </div>
  );
};
