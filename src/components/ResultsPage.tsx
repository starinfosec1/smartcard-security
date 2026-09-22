import React, { useEffect } from 'react';
import { 
  Award, 
  CheckCircle2, 
  Clock, 
  Printer, 
  ArrowLeft, 
  AlertTriangle, 
  ShieldAlert, 
  RotateCcw,
  Sparkles,
  GraduationCap
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { StudentProfile, LabState, ExperimentId } from '../types';
import { sounds } from '../utils/sound';

interface ResultsPageProps {
  student: StudentProfile;
  labState: LabState;
  onSelectExperiment: (id: ExperimentId) => void;
  onBackToDashboard: () => void;
  onResetAll: () => void;
}

export const ResultsPage: React.FC<ResultsPageProps> = ({
  student,
  labState,
  onSelectExperiment,
  onBackToDashboard,
  onResetAll,
}) => {
  const experimentsMeta = [
    {
      id: 1 as ExperimentId,
      name: 'Experiment 1: Smart Card File System - Create and Delete',
      category: 'Memory Management',
    },
    {
      id: 2 as ExperimentId,
      name: 'Experiment 2: Smart Card File System - Modify Operation',
      category: 'Data Manipulation',
    },
    {
      id: 3 as ExperimentId,
      name: 'Experiment 3: Atomic Operations in a Smart Card',
      category: 'Transactional Integrity',
    },
    {
      id: 4 as ExperimentId,
      name: 'Experiment 4: Smart Card Data Transmission - ATR & PPS',
      category: 'Protocol Communication',
    },
  ];

  const totalScore = Object.values(labState.experiments).reduce(
    (acc, e) => acc + (e.status === 'COMPLETED' ? e.score : 0),
    0
  );
  const maxScore = 400;
  const percentage = Math.round((totalScore / maxScore) * 100);

  const completedCount = Object.values(labState.experiments).filter(
    e => e.status === 'COMPLETED'
  ).length;

  const totalTimeSeconds = Object.values(labState.experiments).reduce(
    (acc, e) => acc + (e.timeSpentSeconds || 0),
    0
  );

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}m ${s}s`;
  };

  useEffect(() => {
    if (completedCount === 4) {
      sounds.playSuccess();
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {
        console.error('Confetti error:', e);
      }
    }
  }, [completedCount]);

  const handlePrint = () => {
    window.print();
  };

  const getGrade = (pct: number) => {
    if (pct >= 90) return { letter: 'A+', label: 'Outstanding (First Class with Distinction)' };
    if (pct >= 80) return { letter: 'A', label: 'Very Good (First Class)' };
    if (pct >= 70) return { letter: 'B+', label: 'Good (Higher Second Class)' };
    if (pct >= 60) return { letter: 'B', label: 'Satisfactory (Second Class)' };
    if (pct >= 50) return { letter: 'C', label: 'Pass' };
    return { letter: 'F', label: 'Needs Improvement / Retake' };
  };

  const grade = getGrade(percentage);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Top actions bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <button
          onClick={onBackToDashboard}
          className="text-xs text-slate-400 hover:text-cyan-400 font-medium flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Lab Dashboard
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-cyan-400" />
            Print / Save Lab Certificate
          </button>
        </div>
      </div>

      {/* Printable Report Card Container */}
      <div className="bg-[#0F1E36] border border-slate-700/80 rounded-2xl p-6 sm:p-10 shadow-2xl space-y-8 print:bg-white print:text-black print:border-none print:shadow-none">
        
        {/* Academic Header */}
        <div className="border-b border-slate-700/80 pb-6 text-center print:border-black">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-cyan-950/90 text-cyan-400 border border-cyan-700/80 mb-3 shadow-lg print:border-black print:text-black print:bg-transparent">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white print:text-black uppercase">
            Smart Card Technology Lab
          </h1>
          <p className="text-xs sm:text-sm text-cyan-400 font-medium mt-1 print:text-gray-700">
            Official Practical Laboratory Evaluation & Score Card
          </p>
          <p className="text-[11px] text-slate-400 mt-1 print:text-gray-500">
            Course: Cyber Security & Hardware Security Systems • ISO/IEC 7816 Virtual Laboratory
          </p>
        </div>

        {/* Student Profile Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-[#0B1526] border border-slate-800 text-xs font-mono print:bg-gray-100 print:text-black print:border-gray-300">
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-bold">Student Name</span>
            <strong className="text-white text-sm print:text-black">{student.name}</strong>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-bold">Roll Number</span>
            <strong className="text-white text-sm print:text-black">{student.rollNumber}</strong>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-bold">Class / Division</span>
            <strong className="text-white text-sm print:text-black">{student.classDivision}</strong>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-bold">Evaluation Date</span>
            <span className="text-slate-300 text-sm print:text-black">{new Date().toLocaleDateString()}</span>
          </div>
        </div>

        {/* Overall Grand Score Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-[#102446] to-[#0A162B] border border-cyan-800/80 rounded-xl p-5 text-center shadow-md print:border-gray-300 print:bg-gray-50">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Score
            </span>
            <p className="text-3xl sm:text-4xl font-extrabold font-mono text-cyan-400 mt-1 print:text-black">
              {totalScore} <span className="text-sm font-normal text-slate-400">/ {maxScore}</span>
            </p>
          </div>

          <div className="bg-gradient-to-br from-[#102446] to-[#0A162B] border border-cyan-800/80 rounded-xl p-5 text-center shadow-md print:border-gray-300 print:bg-gray-50">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Percentage
            </span>
            <p className="text-3xl sm:text-4xl font-extrabold font-mono text-emerald-400 mt-1 print:text-black">
              {percentage}%
            </p>
          </div>

          <div className="bg-gradient-to-br from-[#102446] to-[#0A162B] border border-cyan-800/80 rounded-xl p-5 text-center shadow-md print:border-gray-300 print:bg-gray-50">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Assigned Grade
            </span>
            <p className="text-3xl sm:text-4xl font-extrabold font-mono text-amber-400 mt-1 print:text-black">
              {grade.letter}
            </p>
            <span className="text-[10px] text-slate-400 block mt-0.5 print:text-gray-600">{grade.label}</span>
          </div>
        </div>

        {/* 4 Experiments Breakdown Table */}
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2 print:text-black">
            <Award className="w-4 h-4 text-cyan-400" />
            Experiment-wise Performance Breakdown
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono border border-slate-800 rounded-xl overflow-hidden print:border-gray-300">
              <thead className="bg-[#0B1526] text-slate-400 uppercase text-[10px] border-b border-slate-800 print:bg-gray-200 print:text-black">
                <tr>
                  <th className="py-3 px-4">Experiment</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Score</th>
                  <th className="py-3 px-4 text-center">Attempts</th>
                  <th className="py-3 px-4 text-center">Hints</th>
                  <th className="py-3 px-4 text-center">Tab Switches</th>
                  <th className="py-3 px-4 text-center">Time</th>
                  <th className="py-3 px-4 text-right print:hidden">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 print:divide-gray-300">
                {experimentsMeta.map((meta) => {
                  const exp = labState.experiments[meta.id];
                  const isDone = exp.status === 'COMPLETED';

                  return (
                    <tr key={meta.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3 px-4 font-sans font-medium text-slate-200 print:text-black">
                        <div>{meta.name}</div>
                        <div className="text-[10px] text-slate-500">{meta.category}</div>
                      </td>
                      <td className="py-3 px-4">
                        {isDone ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800 print:text-green-700">
                            <CheckCircle2 className="w-3 h-3" />
                            COMPLETED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                            {exp.status.replace('_', ' ')}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-white print:text-black">
                        {isDone ? `${exp.score} / 100` : '0 / 100'}
                      </td>
                      <td className="py-3 px-4 text-center text-slate-300 print:text-black">
                        {exp.attempts}
                      </td>
                      <td className="py-3 px-4 text-center text-slate-300 print:text-black">
                        {exp.hintsUsed}
                      </td>
                      <td className="py-3 px-4 text-center text-slate-300 print:text-black">
                        <span className={exp.tabSwitches > 0 ? 'text-amber-400 font-bold' : 'text-slate-400'}>
                          {exp.tabSwitches}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-slate-300 print:text-black">
                        {formatTime(exp.timeSpentSeconds || 0)}
                      </td>
                      <td className="py-3 px-4 text-right print:hidden">
                        <button
                          onClick={() => onSelectExperiment(meta.id)}
                          className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer"
                        >
                          {isDone ? 'Review / Retake' : 'Complete Lab'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Integrity & Proctoring Summary */}
        <div className="bg-[#0B1526] border border-slate-800 rounded-xl p-4 text-xs font-mono text-slate-300 space-y-2 print:bg-transparent print:border-gray-300 print:text-black">
          <div className="flex items-center gap-2 font-bold text-slate-200 print:text-black">
            <ShieldAlert className="w-4 h-4 text-cyan-400" />
            Integrity & Deterrent Summary:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
            <div>Total Laboratory Time: <strong className="text-white print:text-black">{formatTime(totalTimeSeconds)}</strong></div>
            <div>Browser Tab Violations: <strong className="text-white print:text-black">{Object.values(labState.experiments).reduce((a, b) => a + b.tabSwitches, 0)}</strong></div>
            <div>Copy/Paste Violations: <strong className="text-white print:text-black">{Object.values(labState.experiments).reduce((a, b) => a + b.copyPasteAttempts, 0)}</strong></div>
          </div>
          <p className="text-[10px] text-slate-500 pt-2 border-t border-slate-800/80 print:text-gray-600">
            Verified by Smart Card Virtual Laboratory Browser Engine. No physical smart cards or private hardware keys were exposed during this simulation.
          </p>
        </div>

        {/* Academic Signatures block for print */}
        <div className="pt-8 border-t border-slate-800 flex justify-between items-end text-xs font-mono text-slate-400 print:border-black print:text-black">
          <div className="text-left">
            <div className="w-40 border-b border-slate-600 print:border-black mb-1"></div>
            <span>Student Signature</span>
          </div>
          <div className="text-center">
            <span className="text-[10px] text-slate-500 print:text-gray-600">LAB SEAL</span>
          </div>
          <div className="text-right">
            <div className="w-40 border-b border-slate-600 print:border-black mb-1"></div>
            <span>Faculty Examiner Signature</span>
          </div>
        </div>

      </div>

      {/* Retake / Reset All Experiments */}
      <div className="text-center pt-4 print:hidden">
        <button
          onClick={onResetAll}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset All Laboratory Data & Retake
        </button>
      </div>

    </div>
  );
};
