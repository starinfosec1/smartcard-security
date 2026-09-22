import React from 'react';
import { Award, Clock, RotateCcw, AlertTriangle, ShieldAlert } from 'lucide-react';
import { ExperimentProgress } from '../types';

interface ScorePanelProps {
  progress: ExperimentProgress;
  timerSeconds: number;
}

export const ScorePanel: React.FC<ScorePanelProps> = ({ progress, timerSeconds }) => {
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-400';
    if (score >= 60) return 'text-cyan-400';
    if (score >= 40) return 'text-amber-400';
    return 'text-red-400';
  };

  return (
    <div className="bg-[#101F38] border border-slate-700/80 rounded-xl p-4 shadow-lg">
      <div className="flex items-center justify-between mb-3 border-b border-slate-700/60 pb-2">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Performance Metrics
          </h3>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-cyan-300 font-mono bg-cyan-950/60 px-2.5 py-1 rounded-md border border-cyan-800/60">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span>{formatTime(timerSeconds)}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Score */}
        <div className="bg-[#0B1526] p-3 rounded-lg border border-slate-800 flex flex-col items-center justify-center">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Current Score
          </span>
          <span className={`text-2xl font-bold font-mono mt-0.5 ${getScoreColor(progress.score)}`}>
            {progress.score}
            <span className="text-xs text-slate-500 font-normal"> / 100</span>
          </span>
        </div>

        {/* Attempts */}
        <div className="bg-[#0B1526] p-3 rounded-lg border border-slate-800 flex flex-col items-center justify-center">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <RotateCcw className="w-3 h-3 text-slate-400" /> Attempts
          </span>
          <span className="text-xl font-bold font-mono text-slate-200 mt-0.5">
            {progress.attempts}
          </span>
        </div>

        {/* Wrong Ops */}
        <div className="bg-[#0B1526] p-3 rounded-lg border border-slate-800 flex flex-col items-center justify-center">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-amber-400" /> Errors
          </span>
          <span className={`text-xl font-bold font-mono mt-0.5 ${progress.wrongOperations > 0 ? 'text-amber-400' : 'text-slate-300'}`}>
            {progress.wrongOperations}
          </span>
        </div>

        {/* Tab Switches */}
        <div className="bg-[#0B1526] p-3 rounded-lg border border-slate-800 flex flex-col items-center justify-center">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <ShieldAlert className="w-3 h-3 text-red-400" /> Tab Switches
          </span>
          <span className={`text-xl font-bold font-mono mt-0.5 ${progress.tabSwitches > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
            {progress.tabSwitches}
          </span>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
        <div>
          <span>Status: </span>
          <span className={`font-semibold ${
            progress.status === 'COMPLETED' ? 'text-emerald-400' :
            progress.status === 'IN_PROGRESS' ? 'text-cyan-400' : 'text-slate-400'
          }`}>
            {progress.status.replace('_', ' ')}
          </span>
        </div>
        <div className="text-[11px] text-slate-500">
          Hints used: <strong className="text-slate-300">{progress.hintsUsed}</strong>
        </div>
      </div>
    </div>
  );
};
