import { LabState, StudentProfile, ExperimentProgress, ExperimentId } from '../types';

const STUDENT_KEY = 'smart_card_lab_student_v1';
const STORAGE_KEY = 'smart_card_lab_data_v1';

export const DEFAULT_EXPERIMENT_PROGRESS: ExperimentProgress = {
  status: 'NOT_STARTED',
  score: 100,
  attempts: 0,
  hintsUsed: 0,
  tabSwitches: 0,
  copyPasteAttempts: 0,
  wrongOperations: 0,
  startedAt: null,
  completedAt: null,
  timeSpentSeconds: 0,
  currentStep: 0,
};

export const DEFAULT_LAB_STATE: LabState = {
  student: null,
  experiments: {
    1: { ...DEFAULT_EXPERIMENT_PROGRESS },
    2: { ...DEFAULT_EXPERIMENT_PROGRESS },
    3: { ...DEFAULT_EXPERIMENT_PROGRESS },
    4: { ...DEFAULT_EXPERIMENT_PROGRESS },
  },
  maxTabSwitches: 3,
  globalViolations: {
    tabSwitches: 0,
    copyPasteAttempts: 0,
  },
};

export function getSavedStudent(): StudentProfile | null {
  try {
    const raw = localStorage.getItem(STUDENT_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to get student profile:', e);
    return null;
  }
}

export function saveStudent(student: StudentProfile): void {
  try {
    localStorage.setItem(STUDENT_KEY, JSON.stringify(student));
  } catch (e) {
    console.error('Failed to save student profile:', e);
  }
}

export function clearStudent(): void {
  try {
    localStorage.removeItem(STUDENT_KEY);
  } catch (e) {
    console.error('Failed to clear student profile:', e);
  }
}

export function getSavedLabState(): LabState {
  return loadLabState();
}

export function resetLabState(): LabState {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('Failed to reset lab state:', e);
  }
  return {
    ...DEFAULT_LAB_STATE,
    experiments: {
      1: { ...DEFAULT_EXPERIMENT_PROGRESS },
      2: { ...DEFAULT_EXPERIMENT_PROGRESS },
      3: { ...DEFAULT_EXPERIMENT_PROGRESS },
      4: { ...DEFAULT_EXPERIMENT_PROGRESS },
    },
  };
}

export function loadLabState(): LabState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_LAB_STATE;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_LAB_STATE,
      ...parsed,
      experiments: {
        1: { ...DEFAULT_EXPERIMENT_PROGRESS, ...(parsed.experiments?.[1] || {}) },
        2: { ...DEFAULT_EXPERIMENT_PROGRESS, ...(parsed.experiments?.[2] || {}) },
        3: { ...DEFAULT_EXPERIMENT_PROGRESS, ...(parsed.experiments?.[3] || {}) },
        4: { ...DEFAULT_EXPERIMENT_PROGRESS, ...(parsed.experiments?.[4] || {}) },
      },
    };
  } catch (e) {
    console.error('Failed to load lab state from localStorage:', e);
    return DEFAULT_LAB_STATE;
  }
}

export function saveLabState(state: LabState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save lab state to localStorage:', e);
  }
}

export function clearLabSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('Failed to clear lab session:', e);
  }
}
