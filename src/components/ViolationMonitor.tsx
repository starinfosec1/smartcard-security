import React, { useEffect, useState, useRef } from 'react';
import { AlertTriangle, Lock, ShieldAlert, X } from 'lucide-react';
import { sounds } from '../utils/sound';

interface ViolationMonitorProps {
  isActiveLab: boolean;
  tabSwitchCount: number;
  maxTabSwitches: number;
  onTabSwitch: () => void;
  onCopyPasteAttempt: (type: string) => void;
  onLockOut: () => void;
  onResetAttempt: () => void;
}

export const ViolationMonitor: React.FC<ViolationMonitorProps> = ({
  isActiveLab,
  tabSwitchCount,
  maxTabSwitches,
  onTabSwitch,
  onCopyPasteAttempt,
  onLockOut,
  onResetAttempt,
}) => {
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const hasTriggeredLockoutRef = useRef<boolean>(false);
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Store latest callbacks in refs to prevent re-triggering effects
  const onTabSwitchRef = useRef(onTabSwitch);
  const onCopyPasteAttemptRef = useRef(onCopyPasteAttempt);
  const onLockOutRef = useRef(onLockOut);
  const onResetAttemptRef = useRef(onResetAttempt);

  useEffect(() => {
    onTabSwitchRef.current = onTabSwitch;
    onCopyPasteAttemptRef.current = onCopyPasteAttempt;
    onLockOutRef.current = onLockOut;
    onResetAttemptRef.current = onResetAttempt;
  });

  const showWarning = (msg: string) => {
    setWarningMessage(msg);
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
    }
    warningTimerRef.current = setTimeout(() => {
      setWarningMessage(null);
    }, 4500);
  };

  // Synchronize lock status safely without render loops
  useEffect(() => {
    if (isActiveLab && tabSwitchCount >= maxTabSwitches) {
      setIsLocked(true);
      if (!hasTriggeredLockoutRef.current) {
        hasTriggeredLockoutRef.current = true;
        onLockOutRef.current();
      }
    } else {
      setIsLocked(false);
      hasTriggeredLockoutRef.current = false;
    }
  }, [tabSwitchCount, maxTabSwitches, isActiveLab]);

  // Tab switch detection via visibilitychange only (safe for iframes)
  useEffect(() => {
    if (!isActiveLab) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        onTabSwitchRef.current();
        sounds.playWarn();
        showWarning('Tab switch detected. Please stay on this laboratory experiment page.');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (warningTimerRef.current) {
        clearTimeout(warningTimerRef.current);
      }
    };
  }, [isActiveLab]);

  // Prevent accidental page reload / close
  useEffect(() => {
    if (!isActiveLab) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'You have an active laboratory experiment in progress.';
      return e.returnValue;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isActiveLab]);

  // Prevent copy, paste, cut, context menu, and inspection shortcuts
  useEffect(() => {
    if (!isActiveLab) return;

    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      onCopyPasteAttemptRef.current('Copy');
      sounds.playWarn();
      showWarning('Copying text is restricted in this lab. Please type answers manually.');
    };

    const handleCut = (e: ClipboardEvent) => {
      e.preventDefault();
      onCopyPasteAttemptRef.current('Cut');
      sounds.playWarn();
      showWarning('Cutting text is restricted in this lab.');
    };

    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      onCopyPasteAttemptRef.current('Paste');
      sounds.playWarn();
      showWarning('Pasting text is restricted in this lab. All inputs must be typed manually.');
    };

    const handleContextMenu = (e: MouseEvent) => {
      // Allow right-click on inputs/textareas for usability if needed, otherwise block
      const target = e.target as HTMLElement;
      if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        showWarning('Context menu is restricted during this experiment.');
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrlOrMeta = e.ctrlKey || e.metaKey;
      const key = e.key.toUpperCase();

      // Block Ctrl+C, Ctrl+V, Ctrl+X
      if (isCtrlOrMeta && (key === 'C' || key === 'V' || key === 'X')) {
        e.preventDefault();
        onCopyPasteAttemptRef.current(`Ctrl+${key}`);
        sounds.playWarn();
        showWarning(`Shortcut Ctrl+${key} is disabled. Please type all inputs manually.`);
        return;
      }

      // Block inspect / dev tools shortcuts (Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U, F12)
      if (
        (isCtrlOrMeta && e.shiftKey && (key === 'I' || key === 'J' || key === 'C')) ||
        (isCtrlOrMeta && key === 'U') ||
        e.key === 'F12'
      ) {
        e.preventDefault();
        sounds.playWarn();
        showWarning('Developer tools shortcuts are disabled during this experiment.');
      }
    };

    document.addEventListener('copy', handleCopy);
    document.addEventListener('cut', handleCut);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('cut', handleCut);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActiveLab]);

  return (
    <>
      {/* Toast Alert */}
      {warningMessage && !isLocked && (
        <div 
          role="alert"
          className="fixed bottom-5 right-5 z-50 max-w-md bg-amber-950/95 text-amber-200 border border-amber-500/60 rounded-xl p-4 shadow-2xl backdrop-blur-md flex items-start gap-3 transition-all"
        >
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs">
            <p className="font-semibold text-amber-300">Integrity Alert</p>
            <p className="text-amber-200/90 mt-0.5">{warningMessage}</p>
            <p className="text-[11px] text-amber-400/90 mt-1">
              Tab switch count: {tabSwitchCount} / {maxTabSwitches} allowed
            </p>
          </div>
          <button
            onClick={() => setWarningMessage(null)}
            className="text-amber-400 hover:text-amber-200 p-1 cursor-pointer"
            title="Dismiss warning"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Lockout Modal when Max Tab Switches Exceeded */}
      {isLocked && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-[#0F1E36] border border-red-500/60 rounded-2xl p-6 sm:p-8 max-w-lg w-full shadow-2xl text-center">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-5">
              <Lock className="w-8 h-8 text-red-400" />
            </div>

            <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
              Attempt Locked
            </h3>

            <p className="text-red-400 font-semibold mb-3 text-sm">
              Maximum tab-switch limit reached ({tabSwitchCount}/{maxTabSwitches}). This attempt has been locked.
            </p>

            <div className="bg-slate-900/60 border border-slate-700/60 rounded-xl p-4 text-left text-xs text-slate-300 mb-6 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Total Tab Switches:</span>
                <span className="font-bold text-red-400">{tabSwitchCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Allowed Limit:</span>
                <span className="font-semibold text-slate-200">{maxTabSwitches}</span>
              </div>
              <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-700/50 leading-relaxed">
                Leaving the active laboratory window repeatedly invalidates the active session. You can restart this experiment attempt with a fresh score.
              </p>
            </div>

            <button
              onClick={() => {
                setIsLocked(false);
                hasTriggeredLockoutRef.current = false;
                onResetAttemptRef.current();
              }}
              className="w-full py-3 px-6 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-red-950/50 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShieldAlert className="w-4 h-4" />
              Restart Experiment Attempt
            </button>
          </div>
        </div>
      )}
    </>
  );
};
