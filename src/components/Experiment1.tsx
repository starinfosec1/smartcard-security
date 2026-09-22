import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  PlusCircle, 
  Trash2, 
  HelpCircle,
  FileCheck,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Lightbulb,
  BookOpen,
  Info,
  Sparkles,
  FolderPlus,
  FilePlus
} from 'lucide-react';
import { SmartCardNode, FileType, ExperimentProgress, TerminalOutput } from '../types';
import { SmartCardFileSystemEngine, createInitialFileSystem } from '../utils/fileSystemEngine';
import { FileTree } from './FileTree';
import { ScorePanel } from './ScorePanel';
import { HintPanel } from './HintPanel';
import { TerminalPanel } from './TerminalPanel';
import { sounds } from '../utils/sound';

interface Experiment1Props {
  progress: ExperimentProgress;
  onUpdateProgress: (progress: Partial<ExperimentProgress>) => void;
  onComplete: (score: number) => void;
  onBackToDashboard: () => void;
  onNextExperiment: () => void;
}

export const Experiment1: React.FC<Experiment1Props> = ({
  progress,
  onUpdateProgress,
  onComplete,
  onBackToDashboard,
  onNextExperiment,
}) => {
  // Engine and file system state
  const [engine, setEngine] = useState<SmartCardFileSystemEngine>(() => new SmartCardFileSystemEngine());
  const [nodes, setNodes] = useState<Record<string, SmartCardNode>>(() => createInitialFileSystem());
  
  // GUI form state
  const [activeTab, setActiveTab] = useState<'create' | 'delete'>('create');
  const [newFileType, setNewFileType] = useState<FileType>('DF');
  const [newFileName, setNewFileName] = useState('');
  const [selectedParentId, setSelectedParentId] = useState<string>('mf');
  const [selectedDeleteNodeId, setSelectedDeleteNodeId] = useState<string>('');
  
  // Feedback and Task progression
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [isLabStarted, setIsLabStarted] = useState(progress.status !== 'NOT_STARTED');
  const [timerSeconds, setTimerSeconds] = useState(progress.timeSpentSeconds || 0);
  
  // Tracking step milestones for the tricky sequence
  // Step 1: DF_LAB created under MF
  // Step 2: EF_MARKS created inside DF_LAB
  // Step 3: EF_MARKS deleted
  const [step1Done, setStep1Done] = useState(false);
  const [step2Done, setStep2Done] = useState(false);
  const [step3Done, setStep3Done] = useState(false);

  // Terminal state
  const [terminalOutputs, setTerminalOutputs] = useState<TerminalOutput[]>([
    {
      id: 'init_1',
      type: 'info',
      text: 'Experiment 1 Smart Card File System Shell ready. Use GUI forms or terminal commands.',
    },
  ]);

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

  // Save time spent on unmount
  useEffect(() => {
    return () => {
      onUpdateProgressRef.current({ timeSpentSeconds: timerSecondsRef.current });
    };
  }, []);

  // Hints data
  const hints = [
    {
      level: 1 as const,
      title: 'Hint 1: First Step',
      penalty: 5,
      text: 'Start by creating a Dedicated File (DF). Its name must be DF_LAB, and its parent must be MF.',
    },
    {
      level: 2 as const,
      title: 'Hint 2: Elementary File',
      penalty: 10,
      text: 'Next, select DF_LAB as the parent and create an Elementary File (EF) named EF_MARKS inside it.',
    },
    {
      level: 3 as const,
      title: 'Final Hint: Complete Sequence',
      penalty: 15,
      text: '1. Create DF DF_LAB under MF. 2. Create EF EF_MARKS inside DF_LAB. 3. Delete EF_MARKS. Then click Check Answer.',
    },
  ];

  // Start Lab handler
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

  // Reset experiment
  const handleReset = () => {
    sounds.playClick();
    const newEng = new SmartCardFileSystemEngine();
    setEngine(newEng);
    setNodes(newEng.getNodes());
    setStep1Done(false);
    setStep2Done(false);
    setStep3Done(false);
    setNewFileName('');
    setSelectedDeleteNodeId('');
    setStatusMessage({ type: 'info', text: 'File system reset to initial university laboratory state.' });
    onUpdateProgress({
      attempts: progress.attempts + 1,
      status: 'IN_PROGRESS',
    });
    setTerminalOutputs(prev => [
      ...prev,
      { id: `rst_${Date.now()}`, type: 'info', text: 'File system reset to default initial state.' },
    ]);
  };

  // Deduct score for wrong operation
  const recordError = (msg: string) => {
    sounds.playError();
    const newScore = Math.max(0, progress.score - 5);
    onUpdateProgress({
      score: newScore,
      wrongOperations: progress.wrongOperations + 1,
    });
    setStatusMessage({ type: 'error', text: msg });
  };

  // CREATE FILE
  const handleCreateFile = (type: FileType, name: string, parentId: string) => {
    if (!isLabStarted) {
      recordError('Please click "Start Lab" before performing operations.');
      return;
    }

    const cleanName = name.trim().toUpperCase();
    if (!cleanName) {
      recordError('File name cannot be empty. Please enter a valid name.');
      return;
    }

    const result = engine.createFile(type, cleanName, parentId);
    if (!result.success) {
      recordError(result.message);
      setTerminalOutputs(prev => [
        ...prev,
        { id: `cmd_${Date.now()}`, type: 'error', text: result.message },
      ]);
      return;
    }

    // Success in engine
    sounds.playClick();
    setNodes(result.nodes!);
    setNewFileName('');
    setStatusMessage({ type: 'info', text: result.message });
    setTerminalOutputs(prev => [
      ...prev,
      { id: `cmd_${Date.now()}`, type: 'success', text: result.message },
    ]);

    // Check step progress
    const parentNode = engine.findFile(parentId);
    if (type === 'DF' && cleanName === 'DF_LAB' && parentNode?.type === 'MF') {
      setStep1Done(true);
      sounds.playSuccess();
      setStatusMessage({ type: 'info', text: 'Step 1 complete: Created DF_LAB under MF! Now create EF_MARKS inside DF_LAB.' });
    } else if (type === 'EF' && cleanName === 'EF_MARKS' && parentNode?.name === 'DF_LAB') {
      if (!step1Done) {
        // Did step out of order or created without DF_LAB
        recordError('Sequence warning: EF_MARKS must be placed inside DF_LAB.');
      } else {
        setStep2Done(true);
        sounds.playSuccess();
        setStatusMessage({ type: 'info', text: 'Step 2 complete: Created EF_MARKS inside DF_LAB! Finally, delete EF_MARKS.' });
      }
    }
  };

  // DELETE FILE
  const handleDeleteFile = (targetIdOrName: string) => {
    if (!isLabStarted) {
      recordError('Please click "Start Lab" before performing operations.');
      return;
    }

    const target = engine.findFile(targetIdOrName);
    if (!target) {
      recordError(`File "${targetIdOrName}" does not exist.`);
      return;
    }

    const result = engine.deleteFile(target.id);
    if (!result.success) {
      recordError(result.message);
      setTerminalOutputs(prev => [
        ...prev,
        { id: `del_${Date.now()}`, type: 'error', text: result.message },
      ]);
      return;
    }

    // Success in engine
    sounds.playClick();
    setNodes(result.nodes!);
    setSelectedDeleteNodeId('');
    setStatusMessage({ type: 'info', text: result.message });
    setTerminalOutputs(prev => [
      ...prev,
      { id: `del_${Date.now()}`, type: 'success', text: result.message },
    ]);

    // Check step 3 completion
    if (target.name === 'EF_MARKS' && step1Done && step2Done) {
      setStep3Done(true);
      sounds.playSuccess();
      setStatusMessage({ 
        type: 'success', 
        text: 'Step 3 complete: Deleted EF_MARKS! Click "Check Answer" to evaluate your score.' 
      });
    }
  };

  // CHECK ANSWER
  const handleCheckAnswer = () => {
    if (!isLabStarted) {
      recordError('Lab not started. Click "Start Lab" first.');
      return;
    }

    // Verify requirements:
    // 1. DF_LAB exists under MF
    const dfLab = engine.findFile('DF_LAB');
    const mf = engine.findFile('MF');
    const efMarks = engine.findFile('EF_MARKS');

    if (!dfLab) {
      recordError('Verification failed: DF_LAB does not exist. You must create Dedicated File DF_LAB under MF.');
      return;
    }

    if (dfLab.parentId !== mf?.id) {
      recordError('Verification failed: DF_LAB is not under MF.');
      return;
    }

    if (!step2Done) {
      recordError('Verification failed: You must create EF_MARKS inside DF_LAB before deleting it.');
      return;
    }

    if (efMarks) {
      recordError('Verification failed: EF_MARKS has not been deleted yet. Follow the instruction: "Finally delete EF_MARKS".');
      return;
    }

    if (!step3Done) {
      recordError('Verification failed: The sequence of operations was incomplete or done out of order.');
      return;
    }

    // All checks pass!
    sounds.playSuccess();
    setStatusMessage({
      type: 'success',
      text: 'Correct. File operation completed. All smart card hierarchy rules and operation orders respected!',
    });

    onUpdateProgress({
      status: 'COMPLETED',
      completedAt: Date.now(),
      timeSpentSeconds: timerSecondsRef.current,
    });
    onComplete(progress.score);
  };

  // Terminal command execution parser
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
            text: 'Available Commands:\n- CREATE DF <name> <parent>\n- CREATE EF <name> <parent>\n- DELETE <name>\n- CHECK\n- RESET\n- CLEAR\n- HELP',
          },
        ]);
        break;

      case 'CREATE': {
        if (parts.length < 4) {
          recordError('Syntax error: Usage is "CREATE DF <name> <parent>" or "CREATE EF <name> <parent>"');
          setTerminalOutputs(prev => [
            ...prev,
            { id: `err_${Date.now()}`, type: 'error', text: 'Wrong number of arguments. Syntax: CREATE <DF|EF> <name> <parent>' },
          ]);
          return;
        }
        const fType = parts[1].toUpperCase() as FileType;
        if (fType !== 'DF' && fType !== 'EF') {
          recordError('Invalid file type: Must be DF or EF.');
          setTerminalOutputs(prev => [
            ...prev,
            { id: `err_${Date.now()}`, type: 'error', text: 'Invalid file type. Smart cards only support DF or EF creation.' },
          ]);
          return;
        }
        const name = parts[2];
        const parent = parts[3];
        handleCreateFile(fType, name, parent);
        break;
      }

      case 'DELETE': {
        if (parts.length < 2) {
          recordError('Syntax error: Usage is "DELETE <name>"');
          setTerminalOutputs(prev => [
            ...prev,
            { id: `err_${Date.now()}`, type: 'error', text: 'Wrong number of arguments. Syntax: DELETE <name>' },
          ]);
          return;
        }
        handleDeleteFile(parts[1]);
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
          { id: `err_${Date.now()}`, type: 'error', text: `Unknown command "${verb}". Type HELP for list of commands.` },
        ]);
        break;
    }
  };

  // Node selection from tree
  const handleSelectTreeNode = (node: SmartCardNode) => {
    if (node.type === 'MF' || node.type === 'DF') {
      setSelectedParentId(node.id);
    }
    if (node.type !== 'MF') {
      setSelectedDeleteNodeId(node.id);
    }
  };

  // Valid parents dropdown (only MF and DF)
  const validParents = Object.values(nodes).filter(n => n.type === 'MF' || n.type === 'DF');

  // Deletable files (cannot delete MF)
  const deletableFiles = Object.values(nodes).filter(n => n.type !== 'MF');

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
            Experiment 1: Smart Card File System - Create and Delete
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
                Objective: Understand how a smart card creates and deletes files inside its secure memory.
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
              Think of a smart card chip (like on your SIM card or college ID) like a secure file cabinet. Because space is tiny and security is critical, it strictly follows the <strong>ISO/IEC 7816-4</strong> standard:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 font-mono text-[11px]">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-amber-500/40">
                <span className="font-bold text-amber-300 block">1. MF (Master File)</span>
                <span className="text-slate-400">The root folder (like C:\). Every card has exactly one. You can <strong>never delete it</strong>.</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-blue-500/40">
                <span className="font-bold text-blue-300 block">2. DF (Dedicated File)</span>
                <span className="text-slate-400">A category folder (like a drawer). Holds other DFs or data files, but <strong>no raw text</strong>.</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-cyan-500/40">
                <span className="font-bold text-cyan-300 block">3. EF (Elementary File)</span>
                <span className="text-slate-400">The leaf file where real bytes/data are stored. Because it is a file, it <strong>cannot have children</strong>.</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-2">
            <h3 className="font-bold text-slate-200 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-cyan-400" />
              Your Task Step-by-Step:
            </h3>
            <p className="font-mono bg-[#0B1426] p-2.5 rounded-lg border border-slate-700 text-cyan-200 leading-relaxed">
              1. Under root <strong className="text-white">MF</strong>, create a category folder (DF) named <strong className="text-white">DF_LAB</strong>.<br />
              2. Inside <strong className="text-white">DF_LAB</strong>, create an elementary file (EF) named <strong className="text-white">EF_MARKS</strong>.<br />
              3. Select and delete <strong className="text-white">EF_MARKS</strong>, then click <strong>&quot;Check Answer&quot;</strong>.
            </p>
            <p className="text-amber-300/90 text-[11px] font-semibold flex items-center gap-1.5 pt-1">
              <Info className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              Watch out: You cannot create a child inside an EF, and you can never delete the MF!
            </p>
            <p className="text-slate-400 text-[11px]">
              Click the <strong>&quot;Start Lab&quot;</strong> button above to begin the experiment timer and activate controls.
            </p>
          </div>
        </div>
      )}

      {/* Main 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Theory & Simulator Controls */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Short Theory */}
          <div className="bg-[#0F1E36] border border-slate-700/80 rounded-2xl p-5 shadow-md">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <FileCheck className="w-4 h-4" />
                Smart Card File Hierarchy — Simple Explanation
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">ISO/IEC 7816-4</span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              In a computer or phone, you can nest folders freely. But inside a tamper-resistant smart card microchip, memory is strictly structured to guarantee security:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 my-2.5 text-xs font-mono">
              <div className="p-2.5 bg-slate-900/80 rounded-xl border border-amber-500/30">
                <span className="font-bold text-amber-400 block">MF (Master File)</span>
                <span className="text-[10px] text-slate-300">The root of the card. Created at manufacture. Cannot be deleted.</span>
              </div>
              <div className="p-2.5 bg-slate-900/80 rounded-xl border border-blue-500/30">
                <span className="font-bold text-blue-400 block">DF (Dedicated File)</span>
                <span className="text-[10px] text-slate-300">A directory folder for an application (e.g. GSM or Banking). Contains files, not raw data.</span>
              </div>
              <div className="p-2.5 bg-slate-900/80 rounded-xl border border-cyan-500/30">
                <span className="font-bold text-cyan-400 block">EF (Elementary File)</span>
                <span className="text-[10px] text-slate-300">The leaf node where actual data bytes live. Cannot have sub-files or children.</span>
              </div>
            </div>

            <div className="p-2.5 bg-[#080E1C] rounded-lg border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <p><strong className="text-slate-200">Key Safety Rules:</strong></p>
              <ul className="list-disc list-inside space-y-0.5 text-slate-300">
                <li>Files can only be created under <span className="text-amber-300 font-mono">MF</span> or <span className="text-blue-300 font-mono">DF</span>.</li>
                <li>An <span className="text-cyan-300 font-mono">EF</span> cannot hold child files (it is a data leaf).</li>
                <li>Deleting the root <span className="text-amber-300 font-mono">MF</span> is strictly forbidden.</li>
                <li>Duplicate names under the same folder are rejected.</li>
              </ul>
            </div>
          </div>

          {/* Interactive Simulator Controls */}
          <div className="bg-[#0F1E36] border border-slate-700/80 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                File Operations Panel
              </h3>
              
              {/* Tab Selector */}
              <div className="flex p-1 bg-slate-900 rounded-lg border border-slate-800">
                <button
                  onClick={() => setActiveTab('create')}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === 'create'
                      ? 'bg-cyan-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Create File
                </button>
                <button
                  onClick={() => setActiveTab('delete')}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === 'delete'
                      ? 'bg-red-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Delete File
                </button>
              </div>
            </div>

            {/* CREATE FORM */}
            {activeTab === 'create' ? (
              <div className="space-y-4">
                {/* Step Helper & Quick Setup Banner */}
                <div className="bg-[#080E1C] p-3 rounded-xl border border-slate-700/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      Quick Step Setup (Click to Auto-Fill):
                    </span>
                    <span className="text-[10px] text-slate-400">Simplifies inputs</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const mfNode = Object.values(nodes).find(n => n.type === 'MF');
                        if (mfNode) setSelectedParentId(mfNode.id);
                        setNewFileType('DF');
                        setNewFileName('DF_LAB');
                      }}
                      className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between ${
                        !step1Done
                          ? 'bg-blue-950/60 border-blue-500/80 text-blue-200 hover:bg-blue-900/60 ring-1 ring-blue-500/30'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-300'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold font-mono flex items-center gap-1.5">
                          <FolderPlus className="w-3.5 h-3.5 text-blue-400" />
                          1. DF_LAB (Folder)
                        </div>
                        <div className="text-[10px] text-slate-400">Parent: MF (Root Card)</div>
                      </div>
                      {step1Done ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-blue-900 text-blue-300 font-semibold">Step 1</span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const dfLabNode = Object.values(nodes).find(n => n.name === 'DF_LAB');
                        if (dfLabNode) {
                          setSelectedParentId(dfLabNode.id);
                        }
                        setNewFileType('EF');
                        setNewFileName('EF_MARKS');
                      }}
                      className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between ${
                        step1Done && !step2Done
                          ? 'bg-cyan-950/60 border-cyan-500/80 text-cyan-200 hover:bg-cyan-900/60 ring-1 ring-cyan-500/30'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-300'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold font-mono flex items-center gap-1.5">
                          <FilePlus className="w-3.5 h-3.5 text-cyan-400" />
                          2. EF_MARKS (Data File)
                        </div>
                        <div className="text-[10px] text-slate-400">Parent: DF_LAB</div>
                      </div>
                      {step2Done ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-900 text-cyan-300 font-semibold">Step 2</span>
                      )}
                    </button>
                  </div>
                </div>

                {/* Form Inputs with Clear Indicators */}
                <div className="space-y-3 bg-[#0B1426] p-3.5 rounded-xl border border-slate-800">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Step 1: Parent Directory */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1 flex items-center justify-between">
                        <span className="uppercase">1. Parent Folder (Location):</span>
                        <span className="text-[10px] text-cyan-400 font-normal">Where to place file</span>
                      </label>
                      <select
                        value={selectedParentId}
                        onChange={(e) => setSelectedParentId(e.target.value)}
                        className="w-full py-2.5 px-3 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono focus:border-cyan-500 cursor-pointer"
                      >
                        {validParents.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.type === 'MF' ? 'Root Directory' : 'Application Folder'})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Step 2: File Type */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1 flex items-center justify-between">
                        <span className="uppercase">2. File Type:</span>
                        <span className="text-[10px] text-slate-400 font-normal">DF = Folder, EF = Data</span>
                      </label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setNewFileType('DF')}
                          className={`flex-1 py-2 px-2 rounded-lg text-xs font-mono font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                            newFileType === 'DF'
                              ? 'bg-blue-950 border-blue-500 text-blue-300 shadow'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <FolderPlus className="w-3.5 h-3.5 shrink-0" />
                          <span>DF (Folder)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewFileType('EF')}
                          className={`flex-1 py-2 px-2 rounded-lg text-xs font-mono font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                            newFileType === 'EF'
                              ? 'bg-cyan-950 border-cyan-500 text-cyan-300 shadow'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <FilePlus className="w-3.5 h-3.5 shrink-0" />
                          <span>EF (Data)</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Step 3: File Name */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1 flex items-center justify-between">
                      <span className="uppercase">3. File Name:</span>
                      <span className="text-[10px] text-slate-400">Must be uppercase (ISO 7816)</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newFileName}
                        onChange={(e) => setNewFileName(e.target.value.toUpperCase())}
                        placeholder="e.g. DF_LAB or EF_MARKS"
                        className="flex-1 py-2.5 px-3 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono uppercase focus:border-cyan-500"
                      />
                      {/* Quick preset chips */}
                      <button
                        type="button"
                        onClick={() => setNewFileName('DF_LAB')}
                        className="px-2.5 py-1 text-[11px] font-mono font-semibold rounded-lg bg-blue-950/70 border border-blue-800 text-blue-300 hover:bg-blue-900 cursor-pointer"
                      >
                        DF_LAB
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewFileName('EF_MARKS')}
                        className="px-2.5 py-1 text-[11px] font-mono font-semibold rounded-lg bg-cyan-950/70 border border-cyan-800 text-cyan-300 hover:bg-cyan-900 cursor-pointer"
                      >
                        EF_MARKS
                      </button>
                    </div>
                  </div>

                  {/* Live Creation Path Preview */}
                  <div className="px-3 py-2 bg-slate-950/70 rounded-lg border border-slate-800/80 text-[11px] font-mono flex items-center justify-between text-slate-300">
                    <span className="text-slate-400">Action Preview:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-amber-300">
                        {nodes[selectedParentId]?.name || 'Parent'}
                      </span>
                      <span className="text-slate-500">/</span>
                      <span className={newFileType === 'DF' ? 'text-blue-300 font-bold' : 'text-cyan-300 font-bold'}>
                        {newFileName.trim() || '<Enter Name>'}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 ml-1">
                        [{newFileType === 'DF' ? 'Folder' : 'Data File'}]
                      </span>
                    </div>
                  </div>
                </div>

                {/* Primary Create Button */}
                <button
                  type="button"
                  onClick={() => handleCreateFile(newFileType, newFileName, selectedParentId)}
                  disabled={!isLabStarted || !newFileName.trim()}
                  className="w-full py-3 px-4 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>CREATE FILE NOW</span>
                </button>
              </div>
            ) : (
              /* DELETE FORM */
              <div className="space-y-4">
                <div className="bg-[#080E1C] p-3 rounded-xl border border-slate-700/80 space-y-2">
                  <span className="text-[11px] font-bold text-red-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    Quick Delete Target (Step 3):
                  </span>
                  {nodes && Object.values(nodes).some(n => n.name === 'EF_MARKS') ? (
                    <button
                      type="button"
                      onClick={() => {
                        const efNode = Object.values(nodes).find(n => n.name === 'EF_MARKS');
                        if (efNode) setSelectedDeleteNodeId(efNode.id);
                      }}
                      className="w-full p-2.5 rounded-lg border border-red-800/80 bg-red-950/50 text-red-200 hover:bg-red-900/50 flex items-center justify-between cursor-pointer transition-all"
                    >
                      <span className="font-mono text-xs font-bold flex items-center gap-1.5">
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        Select &quot;EF_MARKS&quot; for deletion
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-red-900 text-red-200 font-semibold">Ready</span>
                    </button>
                  ) : (
                    <p className="text-[11px] text-slate-400">
                      {step3Done ? '✓ EF_MARKS has been deleted!' : 'Create EF_MARKS first in Step 2 before deleting.'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1 uppercase">
                    Or Choose File from Dropdown:
                  </label>
                  <select
                    value={selectedDeleteNodeId}
                    onChange={(e) => setSelectedDeleteNodeId(e.target.value)}
                    className="w-full py-2.5 px-3 bg-[#0B1526] border border-slate-700 rounded-lg text-xs text-white font-mono focus:border-red-500 cursor-pointer"
                  >
                    <option value="">-- Choose file from smart card --</option>
                    {deletableFiles.map(f => (
                      <option key={f.id} value={f.id}>
                        {f.name} ({f.type === 'DF' ? 'Folder' : 'Data File'})
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Tip: You can also click directly on any file in the tree to select it for deletion.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteFile(selectedDeleteNodeId)}
                  disabled={!isLabStarted || !selectedDeleteNodeId}
                  className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  DELETE FILE NOW
                </button>
              </div>
            )}

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

          {/* Terminal / Command Mode */}
          <TerminalPanel
            outputs={terminalOutputs}
            onExecuteCommand={handleTerminalCommand}
            onClear={() => setTerminalOutputs([])}
            commandSyntaxHelp={['CREATE DF <name> <parent>', 'CREATE EF <name> <parent>', 'DELETE <name>', 'CHECK', 'RESET']}
          />

        </div>

        {/* Right Column: Visual Tree, Progress, Scores, Hints */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Performance & Score */}
          <ScorePanel progress={progress} timerSeconds={timerSeconds} />

          {/* Visual File Tree */}
          <div className="bg-[#0F1E36] border border-slate-700/80 rounded-2xl p-4 shadow-xl">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2">
              Live Card Storage Tree
            </h3>
            <FileTree
              nodes={nodes}
              selectedNodeId={selectedDeleteNodeId || selectedParentId}
              onSelectNode={handleSelectTreeNode}
              showDataPreview={false}
            />
          </div>

          {/* Task Checklist Tracker */}
          <div className="bg-[#0F1E36] border border-slate-700/80 rounded-2xl p-4 shadow-md space-y-2">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Task Checklist (Sequence Enforced)
            </h4>
            <div className="space-y-2 text-xs font-mono">
              <div className={`p-2 rounded-lg flex items-center gap-2 ${step1Done ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60' : 'bg-slate-900/60 text-slate-400'}`}>
                <CheckCircle2 className={`w-3.5 h-3.5 ${step1Done ? 'text-emerald-400' : 'text-slate-600'}`} />
                <span>1. Create DF_LAB under MF</span>
              </div>
              <div className={`p-2 rounded-lg flex items-center gap-2 ${step2Done ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60' : 'bg-slate-900/60 text-slate-400'}`}>
                <CheckCircle2 className={`w-3.5 h-3.5 ${step2Done ? 'text-emerald-400' : 'text-slate-600'}`} />
                <span>2. Create EF_MARKS inside DF_LAB</span>
              </div>
              <div className={`p-2 rounded-lg flex items-center gap-2 ${step3Done ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60' : 'bg-slate-900/60 text-slate-400'}`}>
                <CheckCircle2 className={`w-3.5 h-3.5 ${step3Done ? 'text-emerald-400' : 'text-slate-600'}`} />
                <span>3. Delete EF_MARKS</span>
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
