import React, { useState } from 'react';
import { HelpCircle, Lightbulb, ChevronRight, AlertCircle } from 'lucide-react';
import { sounds } from '../utils/sound';

interface HintPanelProps {
  hints: {
    level: 1 | 2 | 3;
    title: string;
    penalty: number;
    text: string;
  }[];
  hintsUsed: number;
  onUseHint: (level: number) => void;
}

export const HintPanel: React.FC<HintPanelProps> = ({ hints, hintsUsed, onUseHint }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [confirmUnlock, setConfirmUnlock] = useState<number | null>(null);

  const handleRequestUnlock = (level: number) => {
    setConfirmUnlock(level);
  };

  const confirmAndUnlock = (level: number) => {
    sounds.playClick();
    onUseHint(level);
    setConfirmUnlock(null);
  };

  const nextHint = hints.find(h => h.level === hintsUsed + 1);

  return (
    <div className="bg-[#12223D] border border-slate-700/80 rounded-xl p-4 shadow-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-cyan-400" />
          <h4 className="text-sm font-semibold text-white">Lab Hints & Guidance</h4>
          <span className="text-xs text-slate-400">
            ({hintsUsed}/{hints.length} unlocked)
          </span>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1 cursor-pointer"
        >
          {isOpen ? 'Collapse Hints' : 'Need a hint?'}
          <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
        </button>
      </div>

      {isOpen && (
        <div className="mt-3 pt-3 border-t border-slate-700/60 space-y-3">
          {/* List of hints */}
          {hints.map(hint => {
            const isUnlocked = hint.level <= hintsUsed;
            return (
              <div
                key={hint.level}
                className={`p-3 rounded-lg border transition-all ${
                  isUnlocked
                    ? 'bg-slate-900/60 border-cyan-800/60 text-slate-200'
                    : 'bg-slate-900/30 border-slate-800/80 text-slate-500'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-semibold mb-1">
                  <span className="flex items-center gap-1.5">
                    <Lightbulb className={`w-3.5 h-3.5 ${isUnlocked ? 'text-amber-400' : 'text-slate-600'}`} />
                    {hint.title}
                  </span>
                  <span className={`${isUnlocked ? 'text-amber-400' : 'text-slate-500'}`}>
                    -{hint.penalty} Marks
                  </span>
                </div>

                {isUnlocked ? (
                  <p className="text-xs text-cyan-200/90 leading-relaxed pl-5 font-mono">
                    {hint.text}
                  </p>
                ) : (
                  <p className="text-xs text-slate-500 italic pl-5">
                    Hint locked. Click unlock below to view.
                  </p>
                )}
              </div>
            );
          })}

          {/* Confirmation dialog for next hint */}
          {confirmUnlock ? (
            <div className="bg-amber-950/40 border border-amber-500/40 rounded-lg p-3 text-xs text-amber-200 space-y-2">
              <div className="flex items-center gap-1.5 font-semibold text-amber-300">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                Confirm Hint Unlock?
              </div>
              <p>
                Unlocking this hint will deduct {hints.find(h => h.level === confirmUnlock)?.penalty} marks from your score for this experiment.
              </p>
              <div className="flex gap-2 justify-end pt-1">
                <button
                  onClick={() => setConfirmUnlock(null)}
                  className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => confirmAndUnlock(confirmUnlock)}
                  className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white font-medium cursor-pointer"
                >
                  Unlock Hint (-{hints.find(h => h.level === confirmUnlock)?.penalty})
                </button>
              </div>
            </div>
          ) : nextHint ? (
            <button
              onClick={() => handleRequestUnlock(nextHint.level)}
              className="w-full py-2 px-3 bg-[#1A2D4F] hover:bg-[#233C69] border border-cyan-700/50 text-cyan-300 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
              Unlock {nextHint.title} (-{nextHint.penalty} Marks)
            </button>
          ) : (
            <p className="text-xs text-center text-slate-500 italic">
              All available hints have been revealed.
            </p>
          )}
        </div>
      )}
    </div>
  );
};
