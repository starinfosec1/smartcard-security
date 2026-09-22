/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StudentProfile, LabState, ExperimentId } from './types';
import { 
  getSavedStudent, 
  saveStudent, 
  clearStudent, 
  getSavedLabState, 
  saveLabState, 
  resetLabState 
} from './utils/storage';
import { Header } from './components/Header';
import { ViolationMonitor } from './components/ViolationMonitor';
import { StudentLogin } from './components/StudentLogin';
import { LabDashboard } from './components/LabDashboard';
import { Experiment1 } from './components/Experiment1';
import { Experiment2 } from './components/Experiment2';
import { Experiment3 } from './components/Experiment3';
import { Experiment4 } from './components/Experiment4';
import { ResultsPage } from './components/ResultsPage';

type ViewMode = 'dashboard' | 'exp1' | 'exp2' | 'exp3' | 'exp4' | 'results' | 'login';

export default function App() {
  const [student, setStudent] = useState<StudentProfile | null>(() => getSavedStudent());
  const [labState, setLabState] = useState<LabState>(() => getSavedLabState());
  const [currentView, setCurrentView] = useState<ViewMode>(() => {
    const saved = getSavedStudent();
    return saved ? 'dashboard' : 'login';
  });

  // Current active experiment ID (if on an experiment page)
  const activeExpId: ExperimentId | null = 
    currentView === 'exp1' ? 1 :
    currentView === 'exp2' ? 2 :
    currentView === 'exp3' ? 3 :
    currentView === 'exp4' ? 4 : null;

  const activeExpIdRef = useRef<ExperimentId | null>(activeExpId);
  useEffect(() => {
    activeExpIdRef.current = activeExpId;
  }, [activeExpId]);

  const currentTabSwitches = activeExpId 
    ? labState.experiments[activeExpId].tabSwitches 
    : 0;

  // Persist labState whenever it changes
  useEffect(() => {
    saveLabState(labState);
  }, [labState]);

  // Login handler
  const handleLogin = useCallback((profile: StudentProfile) => {
    saveStudent(profile);
    setStudent(profile);
    setCurrentView('dashboard');
  }, []);

  // Logout handler
  const handleLogout = useCallback(() => {
    clearStudent();
    setStudent(null);
    setCurrentView('login');
  }, []);

  // Select Experiment navigation
  const handleSelectExperiment = useCallback((id: ExperimentId) => {
    setCurrentView(`exp${id}` as ViewMode);
  }, []);

  // Update progress for an experiment
  const handleUpdateProgress = useCallback((expId: ExperimentId, updates: Partial<LabState['experiments'][1]>) => {
    setLabState(prev => {
      const current = prev.experiments[expId];
      if (!current) return prev;
      return {
        ...prev,
        experiments: {
          ...prev.experiments,
          [expId]: {
            ...current,
            ...updates,
          },
        },
      };
    });
  }, []);

  // Complete an experiment
  const handleCompleteExperiment = useCallback((expId: ExperimentId, score: number) => {
    setLabState(prev => {
      const current = prev.experiments[expId];
      if (!current) return prev;
      return {
        ...prev,
        experiments: {
          ...prev.experiments,
          [expId]: {
            ...current,
            status: 'COMPLETED',
            score,
            completedAt: Date.now(),
          },
        },
      };
    });
  }, []);

  // Reset entire lab
  const handleResetAll = useCallback(() => {
    const fresh = resetLabState();
    setLabState(fresh);
    setCurrentView('dashboard');
  }, []);

  // Violations tracking from ViolationMonitor
  const handleTabSwitch = useCallback(() => {
    const targetId = activeExpIdRef.current;
    if (!targetId) return;
    setLabState(prev => {
      const current = prev.experiments[targetId];
      if (!current) return prev;
      return {
        ...prev,
        experiments: {
          ...prev.experiments,
          [targetId]: {
            ...current,
            tabSwitches: current.tabSwitches + 1,
          },
        },
      };
    });
  }, []);

  const handleCopyPaste = useCallback((_type: string) => {
    const targetId = activeExpIdRef.current;
    if (!targetId) return;
    setLabState(prev => {
      const current = prev.experiments[targetId];
      if (!current) return prev;
      return {
        ...prev,
        experiments: {
          ...prev.experiments,
          [targetId]: {
            ...current,
            copyPasteAttempts: current.copyPasteAttempts + 1,
          },
        },
      };
    });
  }, []);

  const handleLockOut = useCallback(() => {
    const targetId = activeExpIdRef.current;
    if (!targetId) return;
    setLabState(prev => {
      const current = prev.experiments[targetId];
      if (!current || current.status === 'FAILED') return prev;
      return {
        ...prev,
        experiments: {
          ...prev.experiments,
          [targetId]: {
            ...current,
            status: 'FAILED',
          },
        },
      };
    });
  }, []);

  const handleResetAttempt = useCallback(() => {
    const targetId = activeExpIdRef.current;
    if (!targetId) return;
    setLabState(prev => {
      const current = prev.experiments[targetId];
      if (!current) return prev;
      return {
        ...prev,
        experiments: {
          ...prev.experiments,
          [targetId]: {
            ...current,
            status: 'NOT_STARTED',
            tabSwitches: 0,
            wrongOperations: 0,
            score: 100,
            attempts: current.attempts + 1,
          },
        },
      };
    });
  }, []);

  const updateExp1 = useCallback((updates: Partial<LabState['experiments'][1]>) => handleUpdateProgress(1, updates), [handleUpdateProgress]);
  const updateExp2 = useCallback((updates: Partial<LabState['experiments'][2]>) => handleUpdateProgress(2, updates), [handleUpdateProgress]);
  const updateExp3 = useCallback((updates: Partial<LabState['experiments'][3]>) => handleUpdateProgress(3, updates), [handleUpdateProgress]);
  const updateExp4 = useCallback((updates: Partial<LabState['experiments'][4]>) => handleUpdateProgress(4, updates), [handleUpdateProgress]);

  const completeExp1 = useCallback((score: number) => handleCompleteExperiment(1, score), [handleCompleteExperiment]);
  const completeExp2 = useCallback((score: number) => handleCompleteExperiment(2, score), [handleCompleteExperiment]);
  const completeExp3 = useCallback((score: number) => handleCompleteExperiment(3, score), [handleCompleteExperiment]);
  const completeExp4 = useCallback((score: number) => handleCompleteExperiment(4, score), [handleCompleteExperiment]);

  const navDashboard = useCallback(() => setCurrentView('dashboard'), []);
  const navResults = useCallback(() => setCurrentView('results'), []);
  const navExp2 = useCallback(() => setCurrentView('exp2'), []);
  const navExp3 = useCallback(() => setCurrentView('exp3'), []);
  const navExp4 = useCallback(() => setCurrentView('exp4'), []);

  return (
    <div className="min-h-screen bg-[#070D18] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* Integrity Violation Listener */}
      {student && (
        <ViolationMonitor
          isActiveLab={activeExpId !== null}
          tabSwitchCount={currentTabSwitches}
          maxTabSwitches={labState.maxTabSwitches}
          onTabSwitch={handleTabSwitch}
          onCopyPasteAttempt={handleCopyPaste}
          onLockOut={handleLockOut}
          onResetAttempt={handleResetAttempt}
        />
      )}

      {/* Persistent Navigation Header */}
      {student && currentView !== 'login' && (
        <Header
          student={student}
          activeView={currentView as 'dashboard' | 'exp1' | 'exp2' | 'exp3' | 'exp4' | 'results'}
          tabSwitchCount={currentTabSwitches}
          maxTabSwitches={labState.maxTabSwitches}
          onNavigate={(view) => setCurrentView(view)}
          onLogout={handleLogout}
        />
      )}

      {/* Main View Switcher */}
      <main className="flex-1">
        {currentView === 'login' || !student ? (
          <StudentLogin onLogin={handleLogin} />
        ) : currentView === 'dashboard' ? (
          <LabDashboard
            student={student}
            labState={labState}
            onSelectExperiment={handleSelectExperiment}
            onViewResults={navResults}
            onResetAll={handleResetAll}
          />
        ) : currentView === 'exp1' ? (
          <Experiment1
            progress={labState.experiments[1]}
            onUpdateProgress={updateExp1}
            onComplete={completeExp1}
            onBackToDashboard={navDashboard}
            onNextExperiment={navExp2}
          />
        ) : currentView === 'exp2' ? (
          <Experiment2
            progress={labState.experiments[2]}
            onUpdateProgress={updateExp2}
            onComplete={completeExp2}
            onBackToDashboard={navDashboard}
            onNextExperiment={navExp3}
          />
        ) : currentView === 'exp3' ? (
          <Experiment3
            progress={labState.experiments[3]}
            onUpdateProgress={updateExp3}
            onComplete={completeExp3}
            onBackToDashboard={navDashboard}
            onNextExperiment={navExp4}
          />
        ) : currentView === 'exp4' ? (
          <Experiment4
            progress={labState.experiments[4]}
            onUpdateProgress={updateExp4}
            onComplete={completeExp4}
            onBackToDashboard={navDashboard}
            onViewResults={navResults}
          />
        ) : currentView === 'results' ? (
          <ResultsPage
            student={student}
            labState={labState}
            onSelectExperiment={handleSelectExperiment}
            onBackToDashboard={navDashboard}
            onResetAll={handleResetAll}
          />
        ) : null}
      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-slate-900/80 py-4 px-6 text-center text-xs text-slate-500 print:hidden">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Smart Card Technology Virtual Laboratory • Educational Simulator Only</span>
          <span>Compliant with ISO/IEC 7816-4 File Systems & ATR/PPS Specifications</span>
        </div>
      </footer>

    </div>
  );
}
