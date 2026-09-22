/**
 * Smart Card Technology Lab - TypeScript Interfaces & Types
 */

export type FileType = 'MF' | 'DF' | 'EF';

export interface SmartCardNode {
  id: string;
  name: string;
  type: FileType;
  parentId: string | null;
  children?: string[]; // list of child node IDs for MF and DF
  data?: string;       // raw data stored in EF
  size?: number;       // byte capacity for EF
}

export type ExperimentId = 1 | 2 | 3 | 4;

export type ExperimentStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';

export interface StudentProfile {
  name: string;
  rollNumber: string;
  classDivision: string;
  selectedExp: ExperimentId;
  loginTime: number;
}

export interface ExperimentProgress {
  status: ExperimentStatus;
  score: number;
  attempts: number;
  hintsUsed: number;
  tabSwitches: number;
  copyPasteAttempts: number;
  wrongOperations: number;
  startedAt: number | null;
  completedAt: number | null;
  timeSpentSeconds: number;
  currentStep?: number;
}

export interface LabState {
  student: StudentProfile | null;
  experiments: Record<ExperimentId, ExperimentProgress>;
  maxTabSwitches: number;
  globalViolations: {
    tabSwitches: number;
    copyPasteAttempts: number;
  };
}

// Transaction Types for Experiment 3
export type TransactionState = 'IDLE' | 'ACTIVE' | 'COMMITTED' | 'ROLLED_BACK' | 'FAILED';

export interface AccountState {
  accountA: number;
  accountB: number;
}

export interface TransactionLogEntry {
  id: string;
  timestamp: string;
  action: 'BEGIN' | 'DEBIT' | 'CREDIT' | 'COMMIT' | 'ROLLBACK' | 'ERROR';
  details: string;
  status: 'SUCCESS' | 'FAILED' | 'INFO';
}

// Protocol Transmission Types for Experiment 4
export type ATRProtocolState = 
  | 'POWER_OFF' 
  | 'RESET' 
  | 'ATR_RECEIVED' 
  | 'PPS_SELECTED' 
  | 'COMMUNICATION_READY';

export interface TransmissionLog {
  id: string;
  timestamp: string;
  direction: 'TX' | 'RX' | 'SYS';
  title: string;
  hexData: string;
  description: string;
}

// Command parsed in Terminal
export interface TerminalOutput {
  id: string;
  type: 'input' | 'output' | 'error' | 'success' | 'info';
  text: string;
}
