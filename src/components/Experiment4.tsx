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
  Cpu,
  Radio,
  Send,
  Zap,
  Check,
  Lightbulb,
  BookOpen,
  Info
} from 'lucide-react';
import { ExperimentProgress, TerminalOutput, ATRProtocolState, TransmissionLog } from '../types';
import { SmartCardTransmissionEngine } from '../utils/transmissionEngine';
import { ScorePanel } from './ScorePanel';
import { HintPanel } from './HintPanel';
import { TerminalPanel } from './TerminalPanel';
import { sounds } from '../utils/sound';

interface Experiment4Props {
  progress: ExperimentProgress;
  onUpdateProgress: (progress: Partial<ExperimentProgress>) => void;
  onComplete: (score: number) => void;
  onBackToDashboard: () => void;
  onViewResults: () => void;
}

export const Experiment4: React.FC<Experiment4Props> = ({
  progress,
  onUpdateProgress,
  onComplete,
  onBackToDashboard,
  onViewResults,
}) => {
  const [engine, setEngine] = useState<SmartCardTransmissionEngine>(() => new SmartCardTransmissionEngine());
  const [protocolState, setProtocolState] = useState<ATRProtocolState>('POWER_OFF');
  const [logs, setLogs] = useState<TransmissionLog[]>([]);

  // States
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [isLabStarted, setIsLabStarted] = useState(progress.status !== 'NOT_STARTED');
  const [timerSeconds, setTimerSeconds] = useState(progress.timeSpentSeconds || 0);

  // Terminal
  const [terminalOutputs, setTerminalOutputs] = useState<TerminalOutput[]>([
    {
      id: 'init_4',
      type: 'info',
      text: 'Experiment 4 ISO 7816-3 Protocol Shell online. Card inserted in reader slot.',
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
      title: 'Hint 1: First Signal',
      penalty: 5,
      text: 'The card requires power and a reset pulse before anything can transmit. Click RESET CARD first.',
    },
    {
      level: 2 as const,
      title: 'Hint 2: Transmission Order',
      penalty: 10,
      text: 'ATR (Answer To Reset) comes before PPS. You cannot select protocol parameters before receiving the card capabilities in ATR.',
    },
    {
      level: 3 as const,
      title: 'Final Hint: Handshake Sequence',
      penalty: 15,
      text: 'Follow the strict sequence: 1. RESET CARD ➔ 2. SEND ATR ➔ 3. SEND PPS ➔ 4. START COMMUNICATION. Then click Check Answer.',
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

  const handleResetAll = () => {
    sounds.playClick();
    const newEng = new SmartCardTransmissionEngine();
    setEngine(newEng);
    setProtocolState('POWER_OFF');
    setLogs([]);
    setStatusMessage({ type: 'info', text: 'Hardware interface reset. Card powered down.' });
    onUpdateProgress({
      attempts: progress.attempts + 1,
      status: 'IN_PROGRESS',
    });
    setTerminalOutputs(prev => [
      ...prev,
      { id: `rst_${Date.now()}`, type: 'info', text: 'Reader lines deactivated. Card in POWER_OFF state.' },
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

  // 1. RESET CARD
  const handleResetCard = () => {
    if (!isLabStarted) {
      recordError('Lab not started. Click "Start Lab" first.');
      return;
    }
    const res = engine.resetCard();
    setProtocolState(res.state);
    setLogs(engine.getLogs());

    sounds.playClick();
    setStatusMessage({ type: 'info', text: res.message });
    setTerminalOutputs(prev => [
      ...prev,
      { id: `tx_${Date.now()}`, type: 'info', text: '[RESET] Reset signal asserted. Card status: RESET.' },
    ]);
  };

  // 2. SEND ATR
  const handleSendATR = () => {
    if (!isLabStarted) {
      recordError('Lab not started. Click "Start Lab" first.');
      return;
    }
    const res = engine.sendATR();
    setProtocolState(res.state);
    setLogs(engine.getLogs());

    if (!res.success) {
      recordError(res.message);
      setTerminalOutputs(prev => [
        ...prev,
        { id: `err_${Date.now()}`, type: 'error', text: res.message },
      ]);
    } else {
      sounds.playSuccess();
      setStatusMessage({ type: 'info', text: res.message });
      setTerminalOutputs(prev => [
        ...prev,
        { id: `tx_${Date.now()}`, type: 'success', text: `[ATR RECEIVED] Hex: ${engine.SIMULATED_ATR}` },
      ]);
    }
  };

  // 3. SEND PPS
  const handleSendPPS = () => {
    if (!isLabStarted) {
      recordError('Lab not started. Click "Start Lab" first.');
      return;
    }
    const res = engine.sendPPS();
    setProtocolState(res.state);
    setLogs(engine.getLogs());

    if (!res.success) {
      recordError(res.message);
      setTerminalOutputs(prev => [
        ...prev,
        { id: `err_${Date.now()}`, type: 'error', text: res.message },
      ]);
    } else {
      sounds.playSuccess();
      setStatusMessage({ type: 'info', text: res.message });
      setTerminalOutputs(prev => [
        ...prev,
        { id: `tx_${Date.now()}`, type: 'success', text: `[PPS] Request: ${engine.SIMULATED_PPS_REQ} ➔ Response: ${engine.SIMULATED_PPS_RESP}` },
      ]);
    }
  };

  // 4. START COMMUNICATION
  const handleStartCommunication = () => {
    if (!isLabStarted) {
      recordError('Lab not started. Click "Start Lab" first.');
      return;
    }
    const res = engine.startCommunication();
    setProtocolState(res.state);
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
        { id: `tx_${Date.now()}`, type: 'success', text: '[COMM] APDU data channel opened successfully.' },
      ]);
    }
  };

  // CHECK ANSWER
  const handleCheckAnswer = () => {
    if (!isLabStarted) {
      recordError('Lab not started. Click "Start Lab" first.');
      return;
    }

    if (protocolState !== 'COMMUNICATION_READY') {
      recordError('Communication setup is incomplete. Follow the required sequence: RESET ➔ ATR ➔ PPS ➔ COMMUNICATION.');
      return;
    }

    // Passed!
    sounds.playSuccess();
    setStatusMessage({
      type: 'success',
      text: 'Communication established successfully. ATR & PPS data transmission handshake verified!',
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
            text: 'Available Commands:\n- RESET\n- ATR\n- PPS\n- START or COMM\n- CHECK\n- CLEAR\n- HELP',
          },
        ]);
        break;

      case 'RESET':
        handleResetCard();
        break;

      case 'ATR':
        handleSendATR();
        break;

      case 'PPS':
        handleSendPPS();
        break;

      case 'START':
      case 'COMM':
      case 'COMMUNICATION':
        handleStartCommunication();
        break;

      case 'CHECK':
        handleCheckAnswer();
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

  const getStepStatus = (step: string) => {
    switch (step) {
      case 'RESET':
        return protocolState !== 'POWER_OFF';
      case 'ATR':
        return protocolState === 'ATR_RECEIVED' || protocolState === 'PPS_SELECTED' || protocolState === 'COMMUNICATION_READY';
      case 'PPS':
        return protocolState === 'PPS_SELECTED' || protocolState === 'COMMUNICATION_READY';
      case 'COMM':
        return protocolState === 'COMMUNICATION_READY';
      default:
        return false;
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
            Experiment 4: Smart Card Data Transmission - ATR & PPS
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
              onClick={handleResetAll}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Lab
            </button>
          )}

          {progress.status === 'COMPLETED' && (
            <button
              onClick={onViewResults}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <span>View Final Lab Results</span>
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
                Objective: Learn how a smart card connects and establishes communication with a card reader.
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
              A smart card (like your bank card or SIM card) has no battery inside. When you plug it into a reader, 5 physical pins connect (Power, Ground, Clock, Reset, and Data I/O). Before any data can be exchanged, a strict 4-step hardware handshake must occur:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-1 font-mono text-[11px]">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-amber-500/40">
                <span className="font-bold text-amber-300 block">1. RESET CARD</span>
                <span className="text-slate-400">Card reader provides electricity and triggers a reset signal on the RST line.</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-cyan-500/40">
                <span className="font-bold text-cyan-300 block">2. RECEIVE ATR</span>
                <span className="text-slate-400">Card wakes up and replies with &quot;Answer To Reset&quot; bytes stating its identity.</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-blue-500/40">
                <span className="font-bold text-blue-300 block">3. SEND PPS</span>
                <span className="text-slate-400">Reader and card negotiate baud speed and communication protocol (T=0 or T=1).</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-emerald-500/40">
                <span className="font-bold text-emerald-300 block">4. START COMM</span>
                <span className="text-slate-400">Session unlocks! Both sides can now exchange secure encrypted data packets.</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-2">
            <h3 className="font-bold text-slate-200 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-cyan-400" />
              Your Task Step-by-Step:
            </h3>
            <p className="font-mono bg-[#0B1426] p-2.5 rounded-lg border border-slate-700 text-cyan-200 leading-relaxed">
              1. Click <strong className="text-amber-300">RESET CARD</strong> to send power and reset signal.<br />
              2. Click <strong className="text-cyan-300">RECEIVE ATR</strong> to capture the Answer-to-Reset byte stream.<br />
              3. Click <strong className="text-blue-300">SEND PPS REQUEST</strong> to negotiate protocol and baud rate.<br />
              4. Click <strong className="text-emerald-300">START COMMUNICATION</strong> to establish active link.<br />
              5. Click <strong className="text-white">&quot;Check Answer&quot;</strong> to submit your experiment.
            </p>
            <p className="text-amber-300/90 text-[11px] font-semibold flex items-center gap-1.5 pt-1">
              <Info className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              Watch out: You cannot skip steps! The card will reject PPS if ATR has not been received.
            </p>
            <p className="text-slate-400 text-[11px]">
              Click <strong>&quot;Start Lab&quot;</strong> above to begin your attempt.
            </p>
          </div>
        </div>
      )}

      {/* Main 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Theory, Hardware Diagram & Handshake Controls */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Short Theory */}
          <div className="bg-[#0F1E36] border border-slate-700/80 rounded-2xl p-5 shadow-md">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <FileCheck className="w-4 h-4" />
                Smart Card Transmission Theory — Simple Explanation
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">ISO/IEC 7816-3</span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              When a smart card is inserted into a terminal (such as a POS machine or ATM), physical copper contacts touch and initialize communication:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-2.5 text-xs font-mono">
              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                <span className="text-cyan-400 font-bold block mb-1">ATR (Answer To Reset):</span>
                <span className="text-slate-300 text-[11px]">
                  The greeting sent by the card microchip right after power-up. It tells the reader the card&apos;s supported voltages, clock speed, and communication protocols.
                </span>
              </div>
              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                <span className="text-blue-400 font-bold block mb-1">PPS (Protocol &amp; Parameter Selection):</span>
                <span className="text-slate-300 text-[11px]">
                  The handshake where terminal and card negotiate transmission speed (baud rate) and protocol (T=0 byte mode or T=1 block mode).
                </span>
              </div>
            </div>

            <div className="p-2.5 bg-[#080E1C] rounded-lg border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <p><strong className="text-slate-200">Hardware Transmission Rules:</strong></p>
              <ul className="list-disc list-inside space-y-0.5 text-slate-300">
                <li>The reader cannot send a PPS request before receiving the card&apos;s ATR.</li>
                <li>The card chip cannot transmit APDU payload data before PPS negotiation is established.</li>
                <li>Following this strict sequence prevents electrical damage and transmission collisions.</li>
              </ul>
            </div>
          </div>

          {/* Interactive Hardware Schematic */}
          <div className="bg-[#0F1E36] border border-slate-700/80 rounded-2xl p-5 shadow-xl space-y-5">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Hardware Transmission Interface
                </h3>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                STATE: {protocolState}
              </span>
            </div>

            {/* Visual Card ⟷ Card Reader Diagram */}
            <div className="bg-[#080E1C] border border-slate-700 rounded-xl p-5 relative overflow-hidden">
              <div className="grid grid-cols-1 sm:grid-cols-11 items-center gap-4 text-center">
                
                {/* SMART CARD */}
                <div className="sm:col-span-4 bg-[#0F1E36] border border-cyan-500/40 rounded-xl p-4 shadow-lg flex flex-col items-center">
                  <div className="w-12 h-12 rounded-xl bg-cyan-950/80 border border-cyan-700/70 flex items-center justify-center text-cyan-400 mb-2">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <h4 className="text-xs font-bold text-white uppercase">Smart Card</h4>
                  <span className="text-[10px] text-cyan-400 font-mono">Microchip (EEPROM)</span>
                  <div className="mt-2 text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">
                    Status: {protocolState === 'POWER_OFF' ? 'Powered Off' : protocolState === 'RESET' ? 'Resetting...' : 'Online'}
                  </div>
                </div>

                {/* SIGNAL PINS BUS (3 cols) */}
                <div className="sm:col-span-3 flex flex-col items-center justify-center space-y-1 py-2 font-mono text-[10px]">
                  <div className="flex items-center gap-2 text-slate-400">
                    <span>VCC / GND</span>
                    <span className={`w-2 h-2 rounded-full ${protocolState !== 'POWER_OFF' ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-slate-600'}`} />
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <span>RST Line</span>
                    <span className={`w-2 h-2 rounded-full ${protocolState === 'RESET' ? 'bg-amber-400 animate-ping' : protocolState !== 'POWER_OFF' ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <span>CLK / IO</span>
                    <span className={`w-2 h-2 rounded-full ${protocolState === 'COMMUNICATION_READY' ? 'bg-cyan-400 animate-pulse shadow-[0_0_8px_#22d3ee]' : protocolState !== 'POWER_OFF' ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                  </div>
                  <div className="text-[9px] text-cyan-400/80 font-bold uppercase tracking-wider pt-1">
                    ↕ ISO 7816 Bus
                  </div>
                </div>

                {/* CARD READER */}
                <div className="sm:col-span-4 bg-[#0F1E36] border border-blue-500/40 rounded-xl p-4 shadow-lg flex flex-col items-center">
                  <div className="w-12 h-12 rounded-xl bg-blue-950/80 border border-blue-700/70 flex items-center justify-center text-blue-400 mb-2">
                    <Cpu className="w-6 h-6" />
                  </div>
                  <h4 className="text-xs font-bold text-white uppercase">Card Reader</h4>
                  <span className="text-[10px] text-blue-400 font-mono">Terminal Controller</span>
                  <div className="mt-2 text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">
                    Slot: Card Attached
                  </div>
                </div>

              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              
              {/* Button 1: RESET */}
              <button
                type="button"
                onClick={handleResetCard}
                disabled={!isLabStarted}
                className="py-2.5 px-3 bg-[#1A2E54] hover:bg-[#243E70] border border-cyan-600/50 text-white text-xs font-semibold rounded-xl shadow transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                RESET CARD
              </button>

              {/* Button 2: ATR */}
              <button
                type="button"
                onClick={handleSendATR}
                disabled={!isLabStarted}
                className="py-2.5 px-3 bg-[#1A2E54] hover:bg-[#243E70] border border-cyan-600/50 text-white text-xs font-semibold rounded-xl shadow transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Radio className="w-3.5 h-3.5 text-cyan-400" />
                SEND ATR
              </button>

              {/* Button 3: PPS */}
              <button
                type="button"
                onClick={handleSendPPS}
                disabled={!isLabStarted}
                className="py-2.5 px-3 bg-[#1A2E54] hover:bg-[#243E70] border border-cyan-600/50 text-white text-xs font-semibold rounded-xl shadow transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5 text-blue-400" />
                SEND PPS
              </button>

              {/* Button 4: START COMM */}
              <button
                type="button"
                onClick={handleStartCommunication}
                disabled={!isLabStarted}
                className="py-2.5 px-3 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-xl shadow-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                START COMM
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

          {/* Terminal Command Panel */}
          <TerminalPanel
            outputs={terminalOutputs}
            onExecuteCommand={handleTerminalCommand}
            onClear={() => setTerminalOutputs([])}
            commandSyntaxHelp={['RESET', 'ATR', 'PPS', 'START', 'CHECK']}
          />

        </div>

        {/* Right Column: Score, Transmission Hex Logs & Checklist */}
        <div className="lg:col-span-5 space-y-6">
          
          <ScorePanel progress={progress} timerSeconds={timerSeconds} />

          {/* Transmission Hex Signal Log */}
          <div className="bg-[#0F1E36] border border-slate-700/80 rounded-2xl p-4 shadow-xl flex flex-col h-[280px]">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-xs font-bold text-white uppercase tracking-wider">
              <span>Bus Transmission Hex Log</span>
              <span className="text-[10px] font-mono text-cyan-400">Signal Monitor</span>
            </div>

            <div className="flex-1 overflow-y-auto font-mono text-[11px] space-y-1.5 p-1">
              {logs.length === 0 ? (
                <div className="text-center text-slate-500 italic py-8">
                  No signals detected on I/O line yet. Click RESET CARD to begin.
                </div>
              ) : (
                logs.map((log) => (
                  <div
                    key={log.id}
                    className="p-2 rounded bg-slate-900/90 border border-slate-800 text-slate-200 text-xs leading-tight"
                  >
                    <div className="flex items-center justify-between text-[10px] mb-0.5">
                      <span className={`font-bold ${log.direction === 'RX' ? 'text-cyan-400' : log.direction === 'TX' ? 'text-amber-400' : 'text-slate-400'}`}>
                        [{log.direction}] {log.title}
                      </span>
                      <span className="text-slate-500">{log.timestamp}</span>
                    </div>
                    <div className="text-emerald-400 font-mono font-semibold py-0.5">
                      {log.hexData}
                    </div>
                    <div className="text-slate-400 text-[10px]">{log.description}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Handshake Protocol Checklist */}
          <div className="bg-[#0F1E36] border border-slate-700/80 rounded-2xl p-4 shadow-md space-y-2">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Protocol Handshake State Sequence
            </h4>
            <div className="space-y-2 text-xs font-mono">
              <div className={`p-2 rounded-lg flex items-center justify-between ${
                getStepStatus('RESET') ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60' : 'bg-slate-900/60 text-slate-400'
              }`}>
                <span>1. Card Reset (RST High)</span>
                <CheckCircle2 className={`w-3.5 h-3.5 ${getStepStatus('RESET') ? 'text-emerald-400' : 'text-slate-600'}`} />
              </div>

              <div className={`p-2 rounded-lg flex items-center justify-between ${
                getStepStatus('ATR') ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60' : 'bg-slate-900/60 text-slate-400'
              }`}>
                <span>2. Receive ATR (Answer To Reset)</span>
                <CheckCircle2 className={`w-3.5 h-3.5 ${getStepStatus('ATR') ? 'text-emerald-400' : 'text-slate-600'}`} />
              </div>

              <div className={`p-2 rounded-lg flex items-center justify-between ${
                getStepStatus('PPS') ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60' : 'bg-slate-900/60 text-slate-400'
              }`}>
                <span>3. PPS Parameter Selection</span>
                <CheckCircle2 className={`w-3.5 h-3.5 ${getStepStatus('PPS') ? 'text-emerald-400' : 'text-slate-600'}`} />
              </div>

              <div className={`p-2 rounded-lg flex items-center justify-between ${
                getStepStatus('COMM') ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60' : 'bg-slate-900/60 text-slate-400'
              }`}>
                <span>4. APDU Communication Established</span>
                <CheckCircle2 className={`w-3.5 h-3.5 ${getStepStatus('COMM') ? 'text-emerald-400' : 'text-slate-600'}`} />
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
