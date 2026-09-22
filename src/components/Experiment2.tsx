import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  Edit3, 
  HelpCircle,
  FileCheck,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Info,
  Lightbulb,
  BookOpen
} from 'lucide-react';
import { SmartCardNode, ExperimentProgress, TerminalOutput } from '../types';
import { SmartCardFileSystemEngine, createExp2FileSystem } from '../utils/fileSystemEngine';
import { FileTree } from './FileTree';
import { ScorePanel } from './ScorePanel';
import { HintPanel } from './HintPanel';
import { TerminalPanel } from './TerminalPanel';
import { sounds } from '../utils/sound';

interface Experiment2Props {
  progress: ExperimentProgress;
  onUpdateProgress: (progress: Partial<ExperimentProgress>) => void;
  onComplete: (score: number) => void;
  onBackToDashboard: () => void;
  onNextExperiment: () => void;
}

export const Experiment2: React.FC<Experiment2Props> = ({
  progress,
  onUpdateProgress,
  onComplete,
  onBackToDashboard,
  onNextExperiment,
}) => {
  const [engine, setEngine] = useState<SmartCardFileSystemEngine>(() => new SmartCardFileSystemEngine(createExp2FileSystem()));
  const [nodes, setNodes] = useState<Record<string, SmartCardNode>>(() => createExp2FileSystem());
  
  // Selection & Input
  const [selectedFileId, setSelectedFileId] = useState<string>('ef_marks');
  const [newDataInput, setNewDataInput] = useState<string>('');
  const [selectedNode, setSelectedNode] = useState<SmartCardNode | null>(() => createExp2FileSystem()['ef_marks'] || null);

  // States
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [isLabStarted, setIsLabStarted] = useState(progress.status !== 'NOT_STARTED');
  const [timerSeconds, setTimerSeconds] = useState(progress.timeSpentSeconds || 0);
  const [modifiedMarks, setModifiedMarks] = useState(false);

  // Terminal
  const [terminalOutputs, setTerminalOutputs] = useState<TerminalOutput[]>([
    {
      id: 'init_2',
      type: 'info',
      text: 'Experiment 2 Smart Card File System Modify Shell active. Use GUI controls or commands.',
    },
  ]);

  // Sync selected node when selectedFileId changes
  useEffect(() => {
    if (selectedFileId && nodes[selectedFileId]) {
      setSelectedNode(nodes[selectedFileId]);
    }
  }, [selectedFileId, nodes]);

  const timerSecondsRef = useRef(timerSeconds);
  useEffect(() => {
    timerSecondsRef.current = timerSeconds;
  }, [timerSeconds]);

  const onUpdateProgressRef = useRef(onUpdateProgress);
  useEffect(() => {
    onUpdateProgressRef.current = onUpdateProgress;
  });

  // Timer interval
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isLabStarted && progress.status !== 'COMPLETED') {
      interval = setInterval(() => {
        setTimerSeconds(s => s + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLabStarted, progress.status]);

  // Sync time spent on unmount
  useEffect(() => {
    return () => {
      onUpdateProgressRef.current({ timeSpentSeconds: timerSecondsRef.current });
    };
  }, []);

  // Hints
  const hints = [
    {
      level: 1 as const,
      title: 'Hint 1: Locate Target File',
      penalty: 5,
      text: 'Do not create a new file. Select the pre-existing file EF_MARKS under DF_STUDENT.',
    },
    {
      level: 2 as const,
      title: 'Hint 2: Modify Operation Rules',
      penalty: 10,
      text: 'Only Elementary Files (EF) can store and modify data. DF folders cannot be modified.',
    },
    {
      level: 3 as const,
      title: 'Final Hint: Exact Value',
      penalty: 15,
      text: 'Type exactly "78" into the New Data field for EF_MARKS and click MODIFY, then click Check Answer.',
    },
  ];

  const handleStartLab = () => {
    sounds.playClick();
    setIsLabStarted(true);
    if (progress.status === 'NOT_STARTED') {
      onUpdateProgress({
        status: 'IN_PROGRESS',
        startedAt: Date.now(),
        attempts: progress.attempts + 1,
      });
    }
  };

  const handleReset = () => {
    sounds.playClick();
    const newEng = new SmartCardFileSystemEngine(createExp2FileSystem());
    setEngine(newEng);
    setNodes(newEng.getNodes());
    setSelectedFileId('ef_marks');
    setSelectedNode(newEng.findFile('ef_marks'));
    setNewDataInput('');
    setModifiedMarks(false);
    setStatusMessage({ type: 'info', text: 'Experiment 2 state reset to default.' });
    onUpdateProgress({
      attempts: progress.attempts + 1,
      status: 'IN_PROGRESS',
    });
    setTerminalOutputs(prev => [
      ...prev,
      { id: `rst_${Date.now()}`, type: 'info', text: 'Reset file system to initial state.' },
    ]);
  };

  const recordError = (msg: string) => {
    sounds.playError();
    const newScore = Math.max(0, progress.score - 5);
    onUpdateProgress({
      score: newScore,
      wrongOperations: progress.wrongOperations + 1,
    });
    setStatusMessage({ type: 'error', text: msg });
  };

  // MODIFY FILE ACTION
  const handleModify = (targetIdOrName: string, dataToSet: string) => {
    if (!isLabStarted) {
      recordError('Please click "Start Lab" before performing operations.');
      return;
    }

    const target = engine.findFile(targetIdOrName);
    if (!target) {
      recordError(`File "${targetIdOrName}" does not exist.`);
      return;
    }

    // Validation: only EF can be modified
    if (target.type !== 'EF') {
      recordError(`Modify failed: Only Elementary Files (EF) can store and modify data. ${target.name} is a ${target.type}.`);
      setTerminalOutputs(prev => [
        ...prev,
        { id: `err_${Date.now()}`, type: 'error', text: `Modify rejected: ${target.name} is a directory (${target.type}).` },
      ]);
      return;
    }

    // Validation: not empty
    if (!dataToSet || dataToSet.trim().length === 0) {
      recordError('Modify failed: New data cannot be empty.');
      return;
    }

    // Validation: size
    const byteLen = new TextEncoder().encode(dataToSet.trim()).length;
    const capacity = target.size || 10;
    if (byteLen > capacity) {
      recordError(`Modify failed: data is larger than the file size (${byteLen} bytes exceeds ${capacity} bytes limit).`);
      setTerminalOutputs(prev => [
        ...prev,
        { id: `err_${Date.now()}`, type: 'error', text: `Modify failed: data is larger than the file size.` },
      ]);
      return;
    }

    const result = engine.modifyFile(target.id, dataToSet.trim());
    if (!result.success) {
      recordError(result.message);
      return;
    }

    // Modify succeeded!
    sounds.playClick();
    setNodes(result.nodes!);
    setSelectedNode(result.targetNode!);
    setNewDataInput('');
    setStatusMessage({ type: 'info', text: result.message });
    setTerminalOutputs(prev => [
      ...prev,
      { id: `mod_${Date.now()}`, type: 'success', text: `MODIFY ${target.name} = "${dataToSet.trim()}"` },
    ]);

    if (target.name === 'EF_MARKS' && dataToSet.trim() === '78') {
      setModifiedMarks(true);
      sounds.playSuccess();
      setStatusMessage({
        type: 'success',
        text: 'Value updated to 78! Now click "Check Answer & Submit" to verify.',
      });
    }
  };

  // CHECK ANSWER
  const handleCheckAnswer = () => {
    if (!isLabStarted) {
      recordError('Lab not started. Click "Start Lab" first.');
      return;
    }

    const marksNode = engine.findFile('EF_MARKS');
    if (!marksNode) {
      recordError('Verification failed: EF_MARKS not found. Do not delete EF_MARKS.');
      return;
    }

    if (marksNode.data === '65') {
      recordError('Verification failed: EF_MARKS still has value "65". It must be modified to "78".');
      return;
    }

    if (marksNode.data !== '78') {
      recordError(`Verification failed: Expected EF_MARKS value to be "78", but found "${marksNode.data}".`);
      return;
    }

    // Success!
    sounds.playSuccess();
    setStatusMessage({
      type: 'success',
      text: 'Correct. File data updated from 65 to 78. Elementary File modification completed successfully.',
    });

    onUpdateProgress({
      status: 'COMPLETED',
      completedAt: Date.now(),
      timeSpentSeconds: timerSecondsRef.current,
    });
    onComplete(progress.score);
  };

  // Terminal command handler
  const handleTerminalCommand = (rawCmd: string) => {
    const parts = rawCmd.trim().split(/\s+/);
    const verb = parts[0]?.toUpperCase();

    setTerminalOutputs(prev => [
      ...prev,
      { id: `in_${Date.now()}`, type: 'input', text: rawCmd },
    ]);

    switch (verb) {
      case 'HELP':
        setTerminalOutputs(prev => [
          ...prev,
          {
            id: `hlp_${Date.now()}`,
            type: 'info',
            text: 'Available Commands:\n- MODIFY <ef_name> <new_data>\n- INFO <name>\n- CHECK\n- RESET\n- CLEAR\n- HELP',
          },
        ]);
        break;

      case 'MODIFY': {
        if (parts.length < 3) {
          recordError('Syntax error: Usage is "MODIFY <file_name> <new_data>"');
          setTerminalOutputs(prev => [
            ...prev,
            { id: `err_${Date.now()}`, type: 'error', text: 'Wrong number of arguments. Syntax: MODIFY <file_name> <new_data>' },
          ]);
          return;
        }
        const fname = parts[1];
        const val = parts.slice(2).join(' ');
        handleModify(fname, val);
        break;
      }

      case 'INFO': {
        if (parts.length < 2) {
          setTerminalOutputs(prev => [
            ...prev,
            { id: `err_${Date.now()}`, type: 'error', text: 'Usage: INFO <file_name>' },
          ]);
          return;
        }
        const file = engine.findFile(parts[1]);
        if (!file) {
          setTerminalOutputs(prev => [
            ...prev,
            { id: `err_${Date.now()}`, type: 'error', text: `File "${parts[1]}" not found.` },
          ]);
        } else {
          setTerminalOutputs(prev => [
            ...prev,
            {
              id: `inf_${Date.now()}`,
              type: 'info',
              text: `FILE: ${file.name}\nTYPE: ${file.type}\nSIZE: ${file.size || 'N/A'} bytes\nDATA: "${file.data ?? 'N/A'}"`,
            },
          ]);
        }
        break;
      }

      case 'CHECK':
        handleCheckAnswer();
        break;

      case 'RESET':
        handleReset();
        break;

      case 'CLEAR':
        setTerminalOutputs([]);
        break;

      default:
        recordError(`Unknown command: "${verb}". Type HELP for syntax.`);
        setTerminalOutputs(prev => [
          ...prev,
          { id: `err_${Date.now()}`, type: 'error', text: `Unknown command "${verb}". Type HELP for assistance.` },
        ]);
        break;
    }
  };

  const handleSelectTreeNode = (node: SmartCardNode) => {
    setSelectedFileId(node.id);
    setSelectedNode(node);
  };

  // All files for the dropdown
  const allFiles = Object.values(nodes);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <button
            onClick={onBackToDashboard}
            className="text-xs text-slate-400 hover:text-cyan-400 font-medium flex items-center gap-1.5 mb-1 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Lab Dashboard
          </button>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Experiment 2: Smart Card File System - Modify Operation
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {!isLabStarted ? (
            <button
              onClick={handleStartLab}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs shadow-lg shadow-cyan-950/50 flex items-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              Start Lab
            </button>
          ) : (
            <button
              onClick={handleReset}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Lab
            </button>
          )}

          {progress.status === 'COMPLETED' && (
            <button
              onClick={onNextExperiment}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <span>Next Experiment</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Before you start / Objective Banner */}
      {!isLabStarted && (
        <div className="bg-[#0F1E36] border border-cyan-500/40 rounded-2xl p-6 shadow-xl space-y-4 animate-fadeIn">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-800 text-cyan-400 flex items-center justify-center shrink-0 mt-0.5">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Before You Start — Simple Guide</h2>
              <p className="text-xs text-cyan-300 font-semibold mt-0.5">
                Objective: Learn how to update data stored inside an existing smart card file safely.
              </p>
            </div>
          </div>

          {/* Simple explanation card */}
          <div className="bg-[#0B1426] p-4 rounded-xl border border-slate-700/80 text-xs text-slate-300 space-y-2">
            <div className="flex items-center gap-2 text-amber-300 font-bold">
              <Lightbulb className="w-4 h-4 text-amber-400 shrink-0" />
              <span>What is this experiment about in simple words?</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              In real life, your smart card keeps your data up to date (for example, your bank card records your latest balance, or your student card updates your semester marks). But in smart cards:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-blue-500/40">
                <span className="font-bold text-blue-300 block">📁 MF &amp; DF Folders = NO DATA</span>
                <span className="text-slate-400">Folders only group files and manage security permissions. You cannot write text or numbers directly into a folder!</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-cyan-500/40">
                <span className="font-bold text-cyan-300 block">📄 EF Files = DATA STORAGE</span>
                <span className="text-slate-400">Only Elementary Files store actual values. Each EF has a pre-allocated byte limit (e.g. 10 bytes) that cannot be exceeded.</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-2">
            <h3 className="font-bold text-slate-200 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-cyan-400" />
              Your Task Step-by-Step:
            </h3>
            <p className="font-mono bg-[#0B1426] p-2.5 rounded-lg border border-slate-700 text-cyan-200 leading-relaxed">
              1. The file <strong className="text-white">EF_MARKS</strong> already exists inside <strong className="text-white">DF_STUDENT</strong>.<br />
              2. Click on <strong className="text-white">EF_MARKS</strong> in the file tree (or select it from the dropdown).<br />
              3. Change its value from <span className="line-through text-red-400 font-bold">65</span> to <strong className="text-emerald-400 font-bold">78</strong>.<br />
              4. Click <strong className="text-white">&quot;Update EF Data&quot;</strong> and then click <strong className="text-white">&quot;Check Answer&quot;</strong>.
            </p>
            <p className="text-amber-300/90 text-[11px] font-semibold flex items-center gap-1.5 pt-1">
              <Info className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              Important: Do not create a new file or delete EF_MARKS! Simply modify the existing file in-place.
            </p>
            <p className="text-slate-400 text-[11px]">
              Click <strong>&quot;Start Lab&quot;</strong> above to begin your attempt.
            </p>
          </div>
        </div>
      )}

      {/* Main 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Theory, File Info & Modify Controls */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Short Theory */}
          <div className="bg-[#0F1E36] border border-slate-700/80 rounded-2xl p-5 shadow-md">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <FileCheck className="w-4 h-4" />
                Elementary File (EF) Data Modification — Simple Explanation
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">ISO/IEC 7816-4</span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              In a smart card, directories (MF and DF) manage security and layout, but <strong>only Elementary Files (EF) store data</strong>.
            </p>

            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 my-2.5 text-xs font-mono space-y-1.5 text-slate-300">
              <div className="flex items-center justify-between">
                <span>Before Modification:</span>
                <span className="text-amber-300">EF_MARKS = &quot;65&quot;</span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                <span>Target Modification:</span>
                <span className="text-emerald-400 font-bold">EF_MARKS = &quot;78&quot;</span>
              </div>
            </div>

            <div className="p-2.5 bg-[#080E1C] rounded-lg border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <p><strong className="text-slate-200">Rules to Remember:</strong></p>
              <ul className="list-disc list-inside space-y-0.5 text-slate-300">
                <li>You can only modify an <span className="text-cyan-300 font-mono">EF</span>, never an MF or DF.</li>
                <li>New data cannot be empty and cannot exceed the file capacity limit (10 bytes).</li>
                <li>Modifying a file updates its internal content while keeping its file ID and parent intact.</li>
              </ul>
            </div>
          </div>

          {/* Selected File Details & Modify Operation Form */}
          <div className="bg-[#0F1E36] border border-slate-700/80 rounded-2xl p-5 shadow-xl space-y-5">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-cyan-400" />
                Modify Operation Panel
              </h3>
            </div>

            {/* Selected File Inspection Card */}
            {selectedNode ? (
              <div className="bg-[#0B1426] border border-slate-700/80 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-cyan-400" />
                    Selected File Information
                  </span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                    selectedNode.type === 'EF' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'bg-blue-950 text-blue-300 border border-blue-800'
                  }`}>
                    {selectedNode.type}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-xs">
                  <div>
                    <span className="text-slate-500 text-[10px] block">Name:</span>
                    <strong className="text-white">{selectedNode.name}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">Type:</span>
                    <span className="text-slate-300">{selectedNode.type}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">Allocated Size:</span>
                    <span className="text-slate-300">{selectedNode.size ? `${selectedNode.size} bytes` : 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">Current Data:</span>
                    <span className="text-emerald-400 font-bold">{selectedNode.data ?? '(Directory)'}</span>
                  </div>
                </div>

                {selectedNode.type !== 'EF' && (
                  <div className="p-2 rounded bg-amber-950/40 border border-amber-600/40 text-[11px] text-amber-300">
                    Warning: {selectedNode.name} is a {selectedNode.type}. You cannot modify data inside a directory file.
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3 text-center text-xs text-slate-500 italic bg-slate-900 rounded-lg">
                Click a file in the tree below to inspect.
              </div>
            )}

            {/* Inputs */}
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1 uppercase">
                  Select Target File:
                </label>
                <select
                  value={selectedFileId}
                  onChange={(e) => {
                    setSelectedFileId(e.target.value);
                    setSelectedNode(nodes[e.target.value] || null);
                  }}
                  className="w-full py-2.5 px-3 bg-[#0B1526] border border-slate-700 rounded-lg text-xs text-white font-mono focus:border-cyan-500 cursor-pointer"
                >
                  {allFiles.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.type}) {f.data !== undefined ? `- Data: "${f.data}"` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1 uppercase">
                  New Data Value (must be manually typed):
                </label>
                <input
                  type="text"
                  value={newDataInput}
                  onChange={(e) => setNewDataInput(e.target.value)}
                  placeholder="e.g. 78"
                  className="w-full py-2.5 px-3 bg-[#0B1526] border border-slate-700 rounded-lg text-xs text-white font-mono focus:border-cyan-500"
                />
              </div>

              <button
                type="button"
                onClick={() => handleModify(selectedFileId, newDataInput)}
                disabled={!isLabStarted}
                className="w-full py-2.5 px-4 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Edit3 className="w-4 h-4" />
                MODIFY DATA
              </button>
            </div>

            {/* Status notification */}
            {statusMessage && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                  statusMessage.type === 'success'
                    ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-200'
                    : statusMessage.type === 'error'
                    ? 'bg-red-950/70 border-red-500/50 text-red-200'
                    : 'bg-cyan-950/70 border-cyan-500/50 text-cyan-200'
                }`}
              >
                {statusMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : statusMessage.type === 'error' ? (
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                ) : (
                  <HelpCircle className="w-4 h-4 text-cyan-400 shrink-0" />
                )}
                <span>{statusMessage.text}</span>
              </div>
            )}

            {/* Check Answer Button */}
            <div className="pt-2 border-t border-slate-800 flex gap-3">
              <button
                type="button"
                onClick={handleCheckAnswer}
                disabled={!isLabStarted}
                className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                Check Answer & Submit
              </button>
            </div>

          </div>

          {/* Terminal Panel */}
          <TerminalPanel
            outputs={terminalOutputs}
            onExecuteCommand={handleTerminalCommand}
            onClear={() => setTerminalOutputs([])}
            commandSyntaxHelp={['MODIFY <name> <data>', 'INFO <name>', 'CHECK', 'RESET']}
          />

        </div>

        {/* Right Column: Visual Tree, Progress, Scores, Hints */}
        <div className="lg:col-span-5 space-y-6">
          
          <ScorePanel progress={progress} timerSeconds={timerSeconds} />

          {/* Visual File Tree with Data Previews */}
          <div className="bg-[#0F1E36] border border-slate-700/80 rounded-2xl p-4 shadow-xl">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2">
              Smart Card Memory Tree (Live Data Preview)
            </h3>
            <FileTree
              nodes={nodes}
              selectedNodeId={selectedFileId}
              onSelectNode={handleSelectTreeNode}
              showDataPreview={true}
            />
          </div>

          {/* Task Progress Checklist */}
          <div className="bg-[#0F1E36] border border-slate-700/80 rounded-2xl p-4 shadow-md space-y-2">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Task Evaluation Status
            </h4>
            <div className="space-y-2 text-xs font-mono">
              <div className={`p-2.5 rounded-lg flex items-center justify-between ${
                nodes['ef_marks']?.data === '78' 
                  ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60' 
                  : 'bg-slate-900/60 text-slate-400'
              }`}>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className={`w-3.5 h-3.5 ${nodes['ef_marks']?.data === '78' ? 'text-emerald-400' : 'text-slate-600'}`} />
                  EF_MARKS Data Value = 78
                </span>
                <span className="font-bold">
                  {nodes['ef_marks']?.data ?? 'missing'}
                </span>
              </div>
            </div>
          </div>

          {/* Hints */}
          <HintPanel
            hints={hints}
            hintsUsed={progress.hintsUsed}
            onUseHint={(level) => {
              const penalty = hints.find(h => h.level === level)?.penalty || 5;
              const newScore = Math.max(0, progress.score - penalty);
              onUpdateProgress({
                hintsUsed: level,
                score: newScore,
              });
            }}
          />

        </div>

      </div>

    </div>
  );
};
