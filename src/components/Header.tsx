import React from 'react';
import { CreditCard, Shield, User, LogOut, Volume2, VolumeX, LayoutDashboard, Award } from 'lucide-react';
import { StudentProfile } from '../types';
import { sounds } from '../utils/sound';

interface HeaderProps {
  student: StudentProfile | null;
  activeView: 'dashboard' | 'exp1' | 'exp2' | 'exp3' | 'exp4' | 'results';
  tabSwitchCount: number;
  maxTabSwitches: number;
  onNavigate: (view: 'dashboard' | 'exp1' | 'exp2' | 'exp3' | 'exp4' | 'results') => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  student,
  activeView,
  tabSwitchCount,
  maxTabSwitches,
  onNavigate,
  onLogout,
}) => {
  const [soundEnabled, setSoundEnabled] = React.useState(true);

  const toggleSound = () => {
    sounds.enabled = !soundEnabled;
    setSoundEnabled(!soundEnabled);
  };

  return (
    <header className="bg-[#0D1933]/90 backdrop-blur-md border-b border-slate-700/60 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-900/30 ring-1 ring-cyan-400/40">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-bold tracking-wider text-white">
                  SMART CARD TECHNOLOGY LAB
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-cyan-950 text-cyan-400 border border-cyan-800/60">
                  ISO/IEC 7816 SIMULATOR
                </span>
              </div>
              <p className="text-xs text-cyan-300/80 font-medium">
                Interactive Practical Laboratory
              </p>
            </div>
          </div>

          {/* Student & Status Info */}
          {student && (
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
              {/* Student badge */}
              <div className="flex items-center gap-2 bg-[#172642] border border-slate-700/80 px-3 py-1.5 rounded-lg text-slate-200">
                <User className="w-3.5 h-3.5 text-cyan-400" />
                <span>
                  Welcome, <strong className="text-white font-semibold">{student.name}</strong>
                </span>
                <span className="text-slate-400 border-l border-slate-700 pl-2">
                  Roll: {student.rollNumber}
                </span>
                <span className="hidden lg:inline text-slate-400 border-l border-slate-700 pl-2">
                  Div: {student.classDivision}
                </span>
              </div>

              {/* Integrity Monitor Badge */}
              <div 
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                  tabSwitchCount === 0
                    ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                    : tabSwitchCount >= maxTabSwitches
                    ? 'bg-red-950/60 border-red-500/50 text-red-300 animate-pulse'
                    : 'bg-amber-950/40 border-amber-500/40 text-amber-300'
                }`}
                title="Integrity Monitor tracks window defocus and tab switching deterrents"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Tab Switches:</span>
                <span className="font-bold">{tabSwitchCount}/{maxTabSwitches}</span>
              </div>

              {/* Sound toggle */}
              <button
                onClick={toggleSound}
                className="p-1.5 rounded-lg bg-[#172642] border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title={soundEnabled ? 'Mute audio' : 'Unmute audio'}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
              </button>

              {/* Navigation buttons */}
              <button
                onClick={() => onNavigate('dashboard')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  activeView === 'dashboard'
                    ? 'bg-cyan-500 text-slate-950 font-semibold shadow-md shadow-cyan-500/20'
                    : 'bg-[#172642] text-slate-200 hover:bg-[#1E3152] border border-slate-700'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </button>

              <button
                onClick={() => onNavigate('results')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  activeView === 'results'
                    ? 'bg-cyan-500 text-slate-950 font-semibold shadow-md shadow-cyan-500/20'
                    : 'bg-[#172642] text-slate-200 hover:bg-[#1E3152] border border-slate-700'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>Results</span>
              </button>

              <button
                onClick={onLogout}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-red-950/60 hover:text-red-300 border border-slate-700 hover:border-red-600/50 text-slate-400 transition-colors cursor-pointer"
                title="Exit / Switch Student Session"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Exit</span>
              </button>
            </div>
          )}

        </div>
      </div>
    </header>
  );
};
