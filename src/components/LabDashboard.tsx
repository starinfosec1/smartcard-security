import React from 'react';
import { 
  FolderPlus, 
  FileEdit, 
  RefreshCcw, 
  Radio, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ArrowRight, 
  Award, 
  ShieldCheck,
  RotateCcw,
  Lightbulb,
  BookOpen
} from 'lucide-react';
import { StudentProfile, LabState, ExperimentId } from '../types';

interface LabDashboardProps {
  student: StudentProfile;
  labState: LabState;
  onSelectExperiment: (id: ExperimentId) => void;
  onViewResults: () => void;
  onResetAll: () => void;
}

export const LabDashboard: React.FC<LabDashboardProps> = ({
  student,
  labState,
  onSelectExperiment,
  onViewResults,
  onResetAll,
}) => {
  const experimentsConfig = [
    {
      id: 1 as ExperimentId,
      title: 'Experiment 1: Smart Card File System - Create and Delete',
      simpleConcept: 'How a smart card organizes memory like a secure mini-computer.',
      simpleDescription: 'A smart card (like your phone SIM or metro card) does not have free-floating files. It uses a strict 3-tier tree: MF (the one root folder), DF (category folders), and EF (actual data files).',
      whatYouWillDo: 'Create a dedicated category folder (DF_LAB) under root (MF), put an elementary data file (EF_MARKS) inside it, and delete it.',
      realWorldExample: 'A 5G SIM card organizing network keys inside a Telecom directory while keeping personal SMS contacts separate.',
      objective: 'Master ISO/IEC 7816-4 file hierarchy rules, parent-child relationships, and deletion constraints.',
      icon: FolderPlus,
      tags: ['MF / DF / EF', 'Tree Hierarchy', 'ISO 7816-4'],
      difficulty: 'Moderate',
    },
    {
      id: 2 as ExperimentId,
      title: 'Experiment 2: Smart Card File System - Modify Operation',
      simpleConcept: 'How data inside an existing smart card file gets updated safely.',
      simpleDescription: 'In smart cards, directory folders (MF and DF) cannot store data directly—only Elementary Files (EF) hold raw values. Files also have strict pre-allocated byte limits to protect EEPROM memory.',
      whatYouWillDo: 'Locate the existing file EF_MARKS (current value "65") and update its marks to "78" without creating a new file or exceeding byte capacity.',
      realWorldExample: 'A university smart ID card updating your exam score from 65 to 78, or an e-passport updating biometric status.',
      objective: 'Understand why only EF files hold data and learn to update records without corrupting file tables.',
      icon: FileEdit,
      tags: ['EF Data Update', 'Byte Size Limit', 'Container Protection'],
      difficulty: 'Slightly Tricky',
    },
    {
      id: 3 as ExperimentId,
      title: 'Experiment 3: Atomic Operations in a Smart Card',
      simpleConcept: 'The "All-or-Nothing" rule that prevents money loss during card removal.',
      simpleDescription: 'If an ATM or card machine loses power or you pull out your debit card midway through a payment, money must never vanish into thin air. A transaction must either finish completely or rollback completely.',
      whatYouWillDo: 'Safely transfer 300 credits from Account A to Account B following the strict 4-step sequence: BEGIN ➔ DEBIT ➔ CREDIT ➔ COMMIT.',
      realWorldExample: 'Tapping a contactless Visa card at a payment counter or metro transit gate where interrupted swipes must never cause double-charges.',
      objective: 'Learn atomic transaction journals, balance verification, snapshotting, and automatic rollback recovery.',
      icon: RefreshCcw,
      tags: ['BEGIN / COMMIT / ROLLBACK', 'All-or-Nothing', 'State Snapshots'],
      difficulty: 'Challenging',
    },
    {
      id: 4 as ExperimentId,
      title: 'Experiment 4: Smart Card Data Transmission - ATR & PPS',
      simpleConcept: 'The initial handshake when a card meets a card reader.',
      simpleDescription: 'A smart card has no battery—it wakes up only when plugged into a reader. The reader powers the pins, the card replies with an Answer-to-Reset (ATR) string, and they agree on communication speed via PPS.',
      whatYouWillDo: 'Execute the mandatory ISO 7816-3 hardware sequence: Reset Card ➔ Receive ATR ➔ Negotiate PPS Protocol ➔ Start Secure Communication.',
      realWorldExample: 'Inserting a chip-and-PIN card into a store card machine and observing the instant hardware synchronization before entering your PIN.',
      objective: 'Understand physical pin signals (VCC, GND, RST, CLK, I/O), ATR byte decoding, and PPS baud negotiation.',
      icon: Radio,
      tags: ['Answer To Reset', 'Protocol Selection', 'ISO 7816-3'],
      difficulty: 'Technical Sequence',
    },
  ];

  const completedCount = Object.values(labState.experiments).filter(
    exp => exp.status === 'COMPLETED'
  ).length;

  const totalScore = Object.values(labState.experiments).reduce(
    (acc, exp) => acc + (exp.status === 'COMPLETED' ? exp.score : 0),
    0
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 border border-emerald-500/50 text-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5" />
            COMPLETED
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 animate-pulse">
            <Clock className="w-3.5 h-3.5" />
            IN PROGRESS
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 border border-slate-700 text-slate-400">
            <AlertCircle className="w-3.5 h-3.5" />
            NOT STARTED
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#0F1E36] via-[#142647] to-[#0F1E36] border border-slate-700/80 rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-800 text-xs font-semibold text-cyan-400 mb-3">
              <ShieldCheck className="w-3.5 h-3.5" />
              Academic Virtual Simulator Session
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Welcome, {student.name}
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Complete all 4 required practical experiments in sequence. Each module evaluates your conceptual understanding of smart card storage, transactional atomicity, and transmission handshakes.
            </p>
            <div className="flex flex-wrap items-center gap-4 mt-4 text-xs text-slate-400 font-mono">
              <span>Roll: <strong className="text-white">{student.rollNumber}</strong></span>
              <span>•</span>
              <span>Class: <strong className="text-white">{student.classDivision}</strong></span>
              <span>•</span>
              <span>Integrity Monitor: <strong className="text-emerald-400">Active (Limit: {labState.maxTabSwitches})</strong></span>
            </div>
          </div>

          {/* Quick Stats Widget */}
          <div className="flex items-center gap-3 bg-[#0B1426]/90 p-4 rounded-xl border border-slate-700/80 shrink-0">
            <div className="text-center px-3 border-r border-slate-800">
              <span className="text-[11px] text-slate-400 uppercase font-semibold">Labs Done</span>
              <p className="text-2xl font-bold font-mono text-cyan-400 mt-0.5">{completedCount} / 4</p>
            </div>
            <div className="text-center px-3">
              <span className="text-[11px] text-slate-400 uppercase font-semibold">Total Score</span>
              <p className="text-2xl font-bold font-mono text-emerald-400 mt-0.5">{totalScore} / 400</p>
            </div>
          </div>
        </div>
      </div>

      {/* Experiment Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
            <span>PRACTICAL EXPERIMENTS</span>
          </h2>
          <div className="flex items-center gap-3">
            <button
              onClick={onViewResults}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Award className="w-3.5 h-3.5" />
              View Lab Grade Sheet
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {experimentsConfig.map((exp) => {
            const progress = labState.experiments[exp.id];
            const Icon = exp.icon;

            return (
              <div
                key={exp.id}
                className="bg-[#0F1E36] border border-slate-700/80 hover:border-cyan-600/60 rounded-2xl p-6 shadow-xl transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="w-11 h-11 rounded-xl bg-cyan-950/80 border border-cyan-800/80 text-cyan-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>{getStatusBadge(progress.status)}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold text-cyan-400 uppercase tracking-wider">
                      Difficulty: {exp.difficulty}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors mt-2">
                    {exp.title}
                  </h3>

                  {/* Simple Concept Callout */}
                  <div className="mt-3 p-3 bg-[#0B1426]/90 border border-cyan-900/40 rounded-xl space-y-2">
                    <div className="flex items-start gap-2 text-xs">
                      <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-amber-300 block text-[11px] uppercase tracking-wide">
                          Simple Explanation
                        </span>
                        <p className="text-xs text-slate-200 mt-0.5 leading-relaxed">
                          {exp.simpleDescription}
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex items-start gap-2 text-xs">
                      <BookOpen className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-cyan-300 text-[11px] block">
                          What You Will Do:
                        </span>
                        <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                          {exp.whatYouWillDo}
                        </p>
                      </div>
                    </div>

                    <div className="pt-1.5 text-[11px] text-slate-400 flex items-center gap-1.5">
                      <span className="text-emerald-400 font-semibold shrink-0">Real World:</span>
                      <span className="italic text-slate-300 truncate">{exp.realWorldExample}</span>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {exp.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900/90 text-slate-400 border border-slate-800"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Card Footer */}
                <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
                  <div className="text-xs">
                    {progress.status === 'COMPLETED' ? (
                      <span className="font-mono text-emerald-400 font-bold">
                        Score: {progress.score}/100
                      </span>
                    ) : (
                      <span className="text-slate-400">
                        Attempts: <strong className="text-slate-200">{progress.attempts}</strong>
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => onSelectExperiment(exp.id)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md shadow-cyan-950/40 transition-all cursor-pointer"
                  >
                    <span>{progress.status === 'COMPLETED' ? 'Review Lab' : progress.status === 'IN_PROGRESS' ? 'Resume Lab' : 'Start Lab'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Completion Banner if all completed */}
      {completedCount === 4 && (
        <div className="bg-emerald-950/50 border border-emerald-500/50 rounded-2xl p-6 text-center shadow-2xl">
          <Award className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
          <h3 className="text-xl font-bold text-white">All 4 Experiments Completed!</h3>
          <p className="text-xs text-emerald-200 mt-1 max-w-md mx-auto">
            You have successfully completed the laboratory curriculum with a total score of {totalScore}/400 ({Math.round((totalScore/400)*100)}%).
          </p>
          <button
            onClick={onViewResults}
            className="mt-4 inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl shadow-lg cursor-pointer"
          >
            View Official Lab Completion Report
          </button>
        </div>
      )}

      {/* Reset laboratory session footer */}
      <div className="text-center pt-4">
        <button
          onClick={onResetAll}
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" />
          Reset All Experiments & Progress
        </button>
      </div>

    </div>
  );
};
