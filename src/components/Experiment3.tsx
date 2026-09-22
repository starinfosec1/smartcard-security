import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle,
  FileCheck,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Layers,
  Undo2,
  Check,
  MinusCircle,
  PlusCircle,
  Activity,
  Lightbulb,
  BookOpen,
  Info
} from 'lucide-react';
import { ExperimentProgress, TerminalOutput, TransactionLogEntry, TransactionState } from '../types';
import { SmartCardTransactionEngine } from '../utils/transactionEngine';
import { ScorePanel } from './ScorePanel';
import { HintPanel } from './HintPanel';
import { TerminalPanel } from './TerminalPanel';
import { sounds } from '../utils/sound';

interface Experiment3Props {
  progress: ExperimentProgress;
  onUpdateProgress: (progress: Partial<ExperimentProgress>) => void;
  onComplete: (score: number) => void;
  onBackToDashboard: () => void;
  onNextExperiment: () => void;
}

export const Experiment3: React.FC<Experiment3Props> = ({
  progress,
  onUpdateProgress,
  onComplete,
  onBackToDashboard,
  onNextExperiment,
}) => {
  const [engine, setEngine] = useState<SmartCardTransactionEngine>(() => new SmartCardTransactionEngine());
  const [txState, setTxState] = useState<TransactionState>('IDLE');
  const [balances, setBalances] = useState<{ accountA: number; accountB: number }>({ accountA: 1000, accountB: 500 });
  const [logs, setLogs] = useState<TransactionLogEntry[]>([]);
  
  // GUI transfer inputs
  const [debitAmount, setDebitAmount] = useState<number>(300);
  const [creditAmount, setCreditAmount] = useState<number>(300);

  // States
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [isLabStarted, setIsLabStarted] = useState(progress.status !== 'NOT_STARTED');
  const [timerSeconds, setTimerSeconds] = useState(progress.timeSpentSeconds || 0);

  // Terminal
  const [terminalOutputs, setTerminalOutputs] = useState<TerminalOutput[]>([
    {
      id: 'init_3',
      type: 'info',
      text: 'Experiment 3 Smart Card Transaction Engine ready. Accounts: A=$1000, B=$500.',
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
      title: 'Hint 1: Transaction Lifecycle',
      penalty: 5,
      text: 'An atomic transaction must be explicitly initiated. You must click "BEGIN TRANSACTION" before debiting or crediting.',
    },
    {
      level: 2 as const,
      title: 'Hint 2: All-or-Nothing Conservation',
      penalty: 10,
      text: 'Money debited from Account A (300) must also be credited to Account B (300). If you try to COMMIT halfway, the engine rejects it.',
    },
    {
      level: 3 as const,
      title: 'Final Hint: Complete Sequence',
      penalty: 15,
      text: 'Follow exact sequence: 1. BEGIN ➔ 2. DEBIT Account A by 300 ➔ 3. CREDIT Account B by 300 ➔ 4. COMMIT. Then Check Answer.',
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
    const newEng = new SmartCardTransactionEngine();
    setEngine(newEng);
    setTxState('IDLE');
    setBalances({ accountA: 1000, accountB: 500 });
    setLogs([]);
    setStatusMessage({ type: 'info', text: 'Transaction engine reset to initial state.' });
    onUpdateProgress({
      attempts: progress.attempts + 1,
      status: 'IN_PROGRESS',
    });
    setTerminalOutputs(prev => [
      ...prev,
      { id: `rst_${Date.now()}`, type: 'info', text: 'Engine reset. Account A=$1000, Account B=$500, state=IDLE.' },
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

  // 1. BEGIN TRANSACTION
  const handleBegin = () => {
    if (!isLabStarted) {
      recordError('Lab not started. Click "Start Lab" first.');
      return;
    }
    const res = engine.beginTransaction();
    setTxState(res.state);
    setBalances(res.balances);
    setLogs(engine.getLogs());

    if (!res.success) {
      recordError(res.message);
      setTerminalOutputs(prev => [
        ...prev,
        { id: `err_${Date.now()}`, type: 'error', text: res.message },
      ]);
    } else {
      sounds.playClick();
      setStatusMessage({ type: 'info', text: res.message });
      setTerminalOutputs(prev => [
        ...prev,
        { id: `tx_${Date.now()}`, type: 'success', text: '[BEGIN] Transaction active. Snapshot captured.' },
      ]);
    }
  };

  // 2. DEBIT
  const handleDebit = (account: 'A' | 'B', amount: number) => {
    if (!isLabStarted) {
      recordError('Lab not started. Click "Start Lab" first.');
      return;
    }
    const res = engine.debit(account, amount);
    setTxState(res.state);
    setBalances(res.balances);
    setLogs(engine.getLogs());

    if (!res.success) {
      recordError(res.message);
      setTerminalOutputs(prev => [
        ...prev,
        { id: `err_${Date.now()}`, type: 'error', text: res.message },
      ]);
    } else {
      sounds.playClick();
      setStatusMessage({ type: 'info', text: res.message });
      setTerminalOutputs(prev => [
        ...prev,
        { id: `tx_${Date.now()}`, type: 'info', text: `[DEBIT ${account} - ${amount}] New bal: $${res.balances[account === 'A' ? 'accountA' : 'accountB']}` },
      ]);
    }
  };

  // 3. CREDIT
  const handleCredit = (account: 'A' | 'B', amount: number) => {
    if (!isLabStarted) {
      recordError('Lab not started. Click "Start Lab" first.');
      return;
    }
    const res = engine.credit(account, amount);
    setTxState(res.state);
    setBalances(res.balances);
    setLogs(engine.getLogs());

    if (!res.success) {
      recordError(res.message);
      setTerminalOutputs(prev => [
        ...prev,
        { id: `err_${Date.now()}`, type: 'error', text: res.message },
      ]);
    } else {
      sounds.playClick();
      setStatusMessage({ type: 'info', text: res.message });
      setTerminalOutputs(prev => [
        ...prev,
        { id: `tx_${Date.now()}`, type: 'info', text: `[CREDIT ${account} + ${amount}] New bal: $${res.balances[account === 'A' ? 'accountA' : 'accountB']}` },
      ]);
    }
  };

  // 4. COMMIT
  const handleCommit = () => {
    if (!isLabStarted) {
      recordError('Lab not started. Click "Start Lab" first.');
      return;
    }
    const res = engine.commit();
    setTxState(res.state);
    setBalances(res.balances);
    setLogs(engine.getLogs());

    if (!res.success) {
      recordError(res.message);
      setTerminalOutputs(prev => [
        ...prev,
        { id: `err_${Date.now()}`, type: 'error', text: res.message },
      ]);
    } else {
      sounds.playSuccess();
      setStatusMessage({ type: 'success', text: res.message });
      setTerminalOutputs(prev => [
        ...prev,
        { id: `tx_${Date.now()}`, type: 'success', text: '[COMMIT] All operations sealed. Transaction complete.' },
      ]);
    }
  };

  // 5. ROLLBACK
  const handleRollback = () => {
    if (!isLabStarted) {
      recordError('Lab not started. Click "Start Lab" first.');
      return;
    }
    const res = engine.rollback();
    setTxState(res.state);
    setBalances(res.balances);
    setLogs(engine.getLogs());

    sounds.playWarn();
    setStatusMessage({ type: 'info', text: res.message });
    setTerminalOutputs(prev => [
      ...prev,
      { id: `tx_${Date.now()}`, type: 'info', text: '[ROLLBACK] Restored pre-transaction state snapshot.' },
    ]);
  };

  // CHECK ANSWER
  const handleCheckAnswer = () => {
    if (!isLabStarted) {
      recordError('Lab not started. Click "Start Lab" first.');
      return;
    }

    if (txState !== 'COMMITTED') {
      recordError(`Verification failed: Transaction state must be COMMITTED. Current state is ${txState}.`);
      return;
    }

    if (balances.accountA !== 700 || balances.accountB !== 800) {
      recordError(`Verification failed: Expected Account A = $700 and Account B = $800, but found A = $${balances.accountA}, B = $${balances.accountB}.`);
      return;
    }

    // Success!
    sounds.playSuccess();
    setStatusMessage({
      type: 'success',
      text: 'Transaction completed atomically. Both accounts updated consistently and atomic invariants preserved!',
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
            text: 'Available Commands:\n- BEGIN\n- DEBIT A <amount>\n- CREDIT B <amount>\n- COMMIT\n- ROLLBACK\n- CHECK\n- RESET\n- CLEAR\n- HELP',
          },
        ]);
        break;

      case 'BEGIN':
        handleBegin();
        break;

      case 'DEBIT': {
        if (parts.length < 3) {
          recordError('Syntax error: Usage is "DEBIT <A|B> <amount>"');
          setTerminalOutputs(prev => [
            ...prev,
            { id: `err_${Date.now()}`, type: 'error', text: 'Wrong number of arguments. Syntax: DEBIT <A|B> <amount>' },
          ]);
          return;
        }
        const acc = parts[1].toUpperCase() as 'A' | 'B';
        const amt = parseFloat(parts[2]);
        if (acc !== 'A' && acc !== 'B') {
          recordError('Account must be A or B.');
          return;
        }
        handleDebit(acc, amt);
        break;
      }

      case 'CREDIT': {
        if (parts.length < 3) {
          recordError('Syntax error: Usage is "CREDIT <A|B> <amount>"');
          setTerminalOutputs(prev => [
            ...prev,
            { id: `err_${Date.now()}`, type: 'error', text: 'Wrong number of arguments. Syntax: CREDIT <A|B> <amount>' },
          ]);
          return;
        }
        const acc = parts[1].toUpperCase() as 'A' | 'B';
        const amt = parseFloat(parts[2]);
        if (acc !== 'A' && acc !== 'B') {
          recordError('Account must be A or B.');
          return;
        }
        handleCredit(acc, amt);
        break;
      }

      case 'COMMIT':
        handleCommit();
        break;

      case 'ROLLBACK':
        handleRollback();
        break;

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
          { id: `err_${Date.now()}`, type: 'error', text: `Unknown command "${verb}". Type HELP for guidance.` },
        ]);
        break;
    }
  };

  const getStateBadge = (st: TransactionState) => {
    switch (st) {
      case 'ACTIVE':
        return <span className="px-2.5 py-1 rounded font-mono text-xs font-bold bg-cyan-950 text-cyan-300 border border-cyan-800 animate-pulse">ACTIVE</span>;
      case 'COMMITTED':
        return <span className="px-2.5 py-1 rounded font-mono text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">COMMITTED</span>;
      case 'ROLLED_BACK':
        return <span className="px-2.5 py-1 rounded font-mono text-xs font-bold bg-purple-950 text-purple-300 border border-purple-800">ROLLED_BACK</span>;
      case 'FAILED':
        return <span className="px-2.5 py-1 rounded font-mono text-xs font-bold bg-red-950 text-red-300 border border-red-800">FAILED</span>;
      default:
        return <span className="px-2.5 py-1 rounded font-mono text-xs font-bold bg-slate-800 text-slate-400 border border-slate-700">IDLE</span>;
    }
  };

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
            Experiment 3: Atomic Operations in a Smart Card
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

      {/* Before you start Banner */}
      {!isLabStarted && (
        <div className="bg-[#0F1E36] border border-cyan-500/40 rounded-2xl p-6 shadow-xl space-y-4 animate-fadeIn">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-800 text-cyan-400 flex items-center justify-center shrink-0 mt-0.5">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Before You Start — Simple Guide</h2>
              <p className="text-xs text-cyan-300 font-semibold mt-0.5">
                Objective: Learn how smart cards protect money using the &quot;All-or-Nothing&quot; atomic rule.
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
              Imagine tapping your debit card or metro pass at a turnstile. If you pull your card away halfway through or the power cuts off, what happens?
              If the card deducted your money but couldn&apos;t credit the gate, your money is lost!
            </p>
            <p className="text-xs text-slate-300 leading-relaxed">
              To stop this nightmare, smart cards use <strong>Atomic Transactions</strong>:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-1 font-mono text-[11px]">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-cyan-500/40">
                <span className="font-bold text-cyan-300 block">1. BEGIN</span>
                <span className="text-slate-400">Takes a snapshot of card memory and opens a temporary journal.</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-amber-500/40">
                <span className="font-bold text-amber-300 block">2. DEBIT</span>
                <span className="text-slate-400">Deducts 300 from Account A in the temporary journal.</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-blue-500/40">
                <span className="font-bold text-blue-300 block">3. CREDIT</span>
                <span className="text-slate-400">Adds 300 to Account B in the temporary journal.</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-emerald-500/40">
                <span className="font-bold text-emerald-300 block">4. COMMIT</span>
                <span className="text-slate-400">Permanently writes changes to EEPROM. If anything fails, ROLLBACK restores everything!</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-2">
            <h3 className="font-bold text-slate-200 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-cyan-400" />
              Your Task Step-by-Step:
            </h3>
            <p className="font-mono bg-[#0B1426] p-2.5 rounded-lg border border-slate-700 text-cyan-200 leading-relaxed">
              1. Account A starts with <strong className="text-white">1000</strong>, Account B starts with <strong className="text-white">500</strong>.<br />
              2. Click <strong className="text-cyan-300">BEGIN TRANSACTION</strong> to start the atomic session.<br />
              3. Debit <strong className="text-amber-300">300</strong> from Account A (it drops to 700 in journal).<br />
              4. Credit <strong className="text-blue-300">300</strong> to Account B (it rises to 800 in journal).<br />
              5. Click <strong className="text-emerald-300">COMMIT TRANSACTION</strong> to finalize, then click <strong className="text-white">&quot;Check Answer&quot;</strong>.
            </p>
            <p className="text-amber-300/90 text-[11px] font-semibold flex items-center gap-1.5 pt-1">
              <Info className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              Tricky Rule: You cannot debit or credit without clicking BEGIN first, and you cannot commit if the amounts are unbalanced!
            </p>
            <p className="text-slate-400 text-[11px]">
              Click <strong>&quot;Start Lab&quot;</strong> above to begin your attempt.
            </p>
          </div>
        </div>
      )}

      {/* Main 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Theory & Transaction Controls */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Short Theory */}
          <div className="bg-[#0F1E36] border border-slate-700/80 rounded-2xl p-5 shadow-md">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <FileCheck className="w-4 h-4" />
                Atomic Operations Theory — Simple Explanation
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">ISO/IEC 7816 &amp; EMV</span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              An <strong>atomic operation</strong> follows the strict <em>&quot;All-or-Nothing&quot;</em> rule: Either <strong>every single step succeeds</strong>, or <strong>the entire transaction is cancelled</strong> and memory is restored to its starting state.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 my-2.5 text-xs font-mono">
              <div className="p-2 bg-slate-900 border border-cyan-800 rounded-lg text-center">
                <span className="text-cyan-400 font-bold block text-[11px]">1. BEGIN</span>
                <span className="text-[10px] text-slate-400">Lock &amp; Snapshot</span>
              </div>
              <div className="p-2 bg-slate-900 border border-amber-800 rounded-lg text-center">
                <span className="text-amber-400 font-bold block text-[11px]">2. DEBIT</span>
                <span className="text-[10px] text-slate-400">A: 1000 &rarr; 700</span>
              </div>
              <div className="p-2 bg-slate-900 border border-blue-800 rounded-lg text-center">
                <span className="text-blue-400 font-bold block text-[11px]">3. CREDIT</span>
                <span className="text-[10px] text-slate-400">B: 500 &rarr; 800</span>
              </div>
              <div className="p-2 bg-slate-900 border border-emerald-800 rounded-lg text-center">
                <span className="text-emerald-400 font-bold block text-[11px]">4. COMMIT</span>
                <span className="text-[10px] text-slate-400">Write EEPROM</span>
              </div>
            </div>

            <div className="p-2.5 bg-[#080E1C] rounded-lg border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <p><strong className="text-slate-200">The Golden Rule:</strong></p>
              <p className="text-slate-300">
                If the card loses power or any step fails, the card operating system automatically triggers a <strong className="text-red-400">ROLLBACK</strong>. It wipes the journal and reverts both accounts to their pre-transaction snapshot.
              </p>
            </div>
          </div>

          {/* Accounts & Transaction Controls */}
          <div className="bg-[#0F1E36] border border-slate-700/80 rounded-2xl p-5 shadow-xl space-y-5">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Smart Card Atomic Engine
                </h3>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400">Engine State:</span>
                {getStateBadge(txState)}
              </div>
            </div>

            {/* Visual Account Balances */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Account A */}
              <div className="bg-[#0B1426] border border-slate-700 rounded-xl p-4 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-mono text-cyan-400 font-bold flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5" /> EF_ACCOUNT_A
                  </span>
                  <span className="text-[10px] text-slate-500 uppercase">Sender</span>
                </div>
                <div className="flex items-baseline justify-between mt-2">
                  <span className="text-2xl font-bold font-mono text-white">
                    ${balances.accountA}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    Initial: $1000
                  </span>
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleDebit('A', debitAmount)}
                    disabled={!isLabStarted}
                    className="flex-1 py-1.5 px-2 bg-blue-900/60 hover:bg-blue-800 border border-blue-700/60 text-blue-200 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <MinusCircle className="w-3.5 h-3.5 text-blue-400" />
                    Debit $300
                  </button>
                </div>
              </div>

              {/* Account B */}
              <div className="bg-[#0B1426] border border-slate-700 rounded-xl p-4 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-mono text-emerald-400 font-bold flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5" /> EF_ACCOUNT_B
                  </span>
                  <span className="text-[10px] text-slate-500 uppercase">Recipient</span>
                </div>
                <div className="flex items-baseline justify-between mt-2">
                  <span className="text-2xl font-bold font-mono text-white">
                    ${balances.accountB}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    Initial: $500
                  </span>
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleCredit('B', creditAmount)}
                    disabled={!isLabStarted}
                    className="flex-1 py-1.5 px-2 bg-emerald-900/60 hover:bg-emerald-800 border border-emerald-700/60 text-emerald-200 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
                    Credit $300
                  </button>
                </div>
              </div>
            </div>

            {/* Atomic Action Buttons Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <button
                type="button"
                onClick={handleBegin}
                disabled={!isLabStarted || txState === 'ACTIVE'}
                className="py-2.5 px-3 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Activity className="w-3.5 h-3.5" />
                BEGIN TRANSACTION
              </button>

              <button
                type="button"
                onClick={handleCommit}
                disabled={!isLabStarted}
                className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                COMMIT
              </button>

              <button
                type="button"
                onClick={handleRollback}
                disabled={!isLabStarted}
                className="py-2.5 px-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Undo2 className="w-3.5 h-3.5" />
                ROLLBACK
              </button>
            </div>

            {/* Status Feedback */}
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

          {/* Terminal Command Panel */}
          <TerminalPanel
            outputs={terminalOutputs}
            onExecuteCommand={handleTerminalCommand}
            onClear={() => setTerminalOutputs([])}
            commandSyntaxHelp={['BEGIN', 'DEBIT A 300', 'CREDIT B 300', 'COMMIT', 'ROLLBACK', 'CHECK']}
          />

        </div>

        {/* Right Column: Score, Live Transaction Log & Checklists */}
        <div className="lg:col-span-5 space-y-6">
          
          <ScorePanel progress={progress} timerSeconds={timerSeconds} />

          {/* Live Transaction Log Panel */}
          <div className="bg-[#0F1E36] border border-slate-700/80 rounded-2xl p-4 shadow-xl flex flex-col h-[280px]">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-xs font-bold text-white uppercase tracking-wider">
              <span>Transaction Journal Log</span>
              <span className="text-[10px] font-mono text-cyan-400">Atomic Audit Trail</span>
            </div>
            
            <div className="flex-1 overflow-y-auto font-mono text-[11px] space-y-1.5 p-1">
              {logs.length === 0 ? (
                <div className="text-center text-slate-500 italic py-8">
                  No transaction actions recorded yet.
                </div>
              ) : (
                logs.map((log) => (
                  <div
                    key={log.id}
                    className={`p-2 rounded border text-xs leading-tight ${
                      log.status === 'SUCCESS'
                        ? 'bg-slate-900/90 border-slate-800 text-slate-200'
                        : log.status === 'FAILED'
                        ? 'bg-red-950/40 border-red-800/60 text-red-300'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-500 mb-0.5">
                      <span className="font-bold text-cyan-400">[{log.action}]</span>
                      <span>{log.timestamp}</span>
                    </div>
                    <div>{log.details}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Task Progress Checklist */}
          <div className="bg-[#0F1E36] border border-slate-700/80 rounded-2xl p-4 shadow-md space-y-2">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Atomic Transfer Requirements
            </h4>
            <div className="space-y-2 text-xs font-mono">
              <div className={`p-2 rounded-lg flex items-center justify-between ${
                balances.accountA === 700 ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60' : 'bg-slate-900/60 text-slate-400'
              }`}>
                <span>Account A Balance = $700</span>
                <strong>${balances.accountA}</strong>
              </div>
              <div className={`p-2 rounded-lg flex items-center justify-between ${
                balances.accountB === 800 ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60' : 'bg-slate-900/60 text-slate-400'
              }`}>
                <span>Account B Balance = $800</span>
                <strong>${balances.accountB}</strong>
              </div>
              <div className={`p-2 rounded-lg flex items-center justify-between ${
                txState === 'COMMITTED' ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60' : 'bg-slate-900/60 text-slate-400'
              }`}>
                <span>Transaction State = COMMITTED</span>
                <strong>{txState}</strong>
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
