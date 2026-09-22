import React, { useState } from 'react';
import { CreditCard, ShieldCheck, ArrowRight, BookOpen, AlertCircle } from 'lucide-react';
import { StudentProfile, ExperimentId } from '../types';
import { sounds } from '../utils/sound';

interface StudentLoginProps {
  onLogin: (profile: StudentProfile) => void;
  savedProfile?: StudentProfile | null;
}

export const StudentLogin: React.FC<StudentLoginProps> = ({ onLogin, savedProfile }) => {
  const [name, setName] = useState(savedProfile?.name || '');
  const [rollNumber, setRollNumber] = useState(savedProfile?.rollNumber || '');
  const [classDivision, setClassDivision] = useState(savedProfile?.classDivision || 'BE-CyberSec A');
  const [selectedExp, setSelectedExp] = useState<ExperimentId>(savedProfile?.selectedExp || 1);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your full Student Name.');
      sounds.playError();
      return;
    }
    if (!rollNumber.trim()) {
      setError('Please enter your Roll Number.');
      sounds.playError();
      return;
    }
    if (!classDivision.trim()) {
      setError('Please specify your Class / Division.');
      sounds.playError();
      return;
    }

    sounds.playSuccess();
    onLogin({
      name: name.trim(),
      rollNumber: rollNumber.trim(),
      classDivision: classDivision.trim(),
      selectedExp,
      loginTime: Date.now(),
    });
  };

  const handleDemoFill = () => {
    setName('Rahul Sharma');
    setRollNumber('CYBER-2024-42');
    setClassDivision('BE Computer Eng / Div-B');
    setSelectedExp(1);
    setError(null);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-xl bg-[#0F1E36] border border-slate-700/80 rounded-2xl shadow-2xl p-6 sm:p-8 relative overflow-hidden">
        
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* College Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white shadow-xl shadow-cyan-950/60 mb-4 border border-cyan-400/30">
            <CreditCard className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            SMART CARD TECHNOLOGY LAB
          </h1>
          <p className="text-sm text-cyan-400 font-medium mt-1">
            Department of Computer Engineering & Information Security
          </p>
          <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-700 text-xs text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Virtual Practical Simulator (ISO/IEC 7816)</span>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-red-950/50 border border-red-500/50 text-red-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Student Full Name <span className="text-cyan-400">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rahul Sharma"
              className="w-full px-3.5 py-2.5 bg-[#0B1526] border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Roll Number <span className="text-cyan-400">*</span>
              </label>
              <input
                type="text"
                required
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value)}
                placeholder="e.g. 21 or CS-42"
                className="w-full px-3.5 py-2.5 bg-[#0B1526] border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Class / Division <span className="text-cyan-400">*</span>
              </label>
              <input
                type="text"
                required
                value={classDivision}
                onChange={(e) => setClassDivision(e.target.value)}
                placeholder="e.g. BE CS / Div A"
                className="w-full px-3.5 py-2.5 bg-[#0B1526] border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Target Experiment to Begin
            </label>
            <select
              value={selectedExp}
              onChange={(e) => setSelectedExp(Number(e.target.value) as ExperimentId)}
              className="w-full px-3.5 py-2.5 bg-[#0B1526] border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors cursor-pointer"
            >
              <option value={1}>Experiment 1: Smart Card File System - Create and Delete</option>
              <option value={2}>Experiment 2: Smart Card File System - Modify Operation</option>
              <option value={3}>Experiment 3: Atomic Operations in a Smart Card</option>
              <option value={4}>Experiment 4: Smart Card Data Transmission - ATR & PPS</option>
            </select>
          </div>

          {/* Academic disclaimer */}
          <div className="p-3 bg-[#0B1526]/80 rounded-xl border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
            <p className="flex items-center gap-1.5 text-slate-300 font-semibold mb-1">
              <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
              Academic Laboratory Instructions:
            </p>
            This interactive simulator runs locally in your browser. All cards, files, transactions, and signals are simulated for educational analysis. Anti-copy and window focus monitors will be active during tasks.
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={handleDemoFill}
              className="px-4 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800/80 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              Quick Demo Fill
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 px-5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-cyan-950/50 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>Enter Laboratory</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
