import React, { useState, useRef, useEffect } from 'react';
import { Terminal, CornerDownLeft, Trash2 } from 'lucide-react';
import { TerminalOutput } from '../types';
import { sounds } from '../utils/sound';

interface TerminalPanelProps {
  outputs: TerminalOutput[];
  onExecuteCommand: (command: string) => void;
  onClear: () => void;
  placeholder?: string;
  commandSyntaxHelp: string[];
}

export const TerminalPanel: React.FC<TerminalPanelProps> = ({
  outputs,
  onExecuteCommand,
  onClear,
  placeholder = 'Type command... (e.g., HELP)',
  commandSyntaxHelp,
}) => {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [outputs]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = input.trim();
    if (!cmd) return;

    sounds.playClick();
    setHistory(prev => [...prev, cmd]);
    setHistoryIndex(-1);
    setInput('');
    onExecuteCommand(cmd);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length === 0) return;
      const nextIndex = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIndex);
      setInput(history[nextIndex]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex === -1) return;
      const nextIndex = historyIndex + 1;
      if (nextIndex >= history.length) {
        setHistoryIndex(-1);
        setInput('');
      } else {
        setHistoryIndex(nextIndex);
        setInput(history[nextIndex]);
      }
    }
  };

  return (
    <div className="bg-[#080E1C] border border-slate-700/80 rounded-xl overflow-hidden shadow-xl flex flex-col h-[340px]">
      {/* Header */}
      <div className="bg-[#0D182E] px-4 py-2 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-mono font-bold tracking-wider text-cyan-300">
            LAB TERMINAL / COMMAND SHELL
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onClear}
            className="text-slate-400 hover:text-slate-200 text-xs flex items-center gap-1 px-2 py-0.5 rounded hover:bg-slate-800 transition-colors cursor-pointer"
            title="Clear terminal output"
          >
            <Trash2 className="w-3 h-3" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Terminal log output */}
      <div 
        ref={scrollRef}
        className="flex-1 p-3 overflow-y-auto font-mono text-xs space-y-1.5 leading-relaxed text-slate-300"
      >
        <div className="text-slate-500 pb-2 border-b border-slate-800/80">
          Smart Card Command Simulator. Type manual commands or use the GUI controls above.
          <br />
          Supported commands: <span className="text-cyan-400">{commandSyntaxHelp.join('  |  ')}</span>
        </div>

        {outputs.map((out) => {
          let styleClass = 'text-slate-300';
          let prefix = '';
          if (out.type === 'input') {
            styleClass = 'text-cyan-300 font-semibold';
            prefix = '> ';
          } else if (out.type === 'error') {
            styleClass = 'text-red-400';
            prefix = '✗ ';
          } else if (out.type === 'success') {
            styleClass = 'text-emerald-400 font-semibold';
            prefix = '✓ ';
          } else if (out.type === 'info') {
            styleClass = 'text-blue-300';
            prefix = 'ℹ ';
          }

          return (
            <div key={out.id} className={`${styleClass} break-words whitespace-pre-wrap`}>
              <span>{prefix}</span>
              <span>{out.text}</span>
            </div>
          );
        })}
      </div>

      {/* Input area */}
      <form onSubmit={handleSubmit} className="border-t border-slate-800 bg-[#0B1426] p-2 flex items-center gap-2">
        <span className="text-cyan-400 font-mono font-bold text-sm pl-2 select-none">&gt;</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 bg-transparent border-none outline-none font-mono text-xs text-white placeholder-slate-500"
          autoComplete="off"
          spellCheck={false}
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="px-2.5 py-1 rounded bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
        >
          <span>Run</span>
          <CornerDownLeft className="w-3 h-3" />
        </button>
      </form>
    </div>
  );
};
