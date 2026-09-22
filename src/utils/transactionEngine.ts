import { TransactionState, AccountState, TransactionLogEntry } from '../types';

export interface TransactionEngineResult {
  success: boolean;
  message: string;
  state: TransactionState;
  balances: AccountState;
  log: TransactionLogEntry;
}

export class SmartCardTransactionEngine {
  private state: TransactionState = 'IDLE';
  private balances: AccountState = { accountA: 1000, accountB: 500 };
  private snapshot: AccountState | null = null;
  private pendingDebited: number = 0;
  private pendingCredited: number = 0;
  private history: TransactionLogEntry[] = [];

  constructor(initialBalances?: AccountState) {
    if (initialBalances) {
      this.balances = { ...initialBalances };
    }
  }

  public getState(): TransactionState {
    return this.state;
  }

  public getBalances(): AccountState {
    return { ...this.balances };
  }

  public getLogs(): TransactionLogEntry[] {
    return [...this.history];
  }

  private addLog(action: TransactionLogEntry['action'], details: string, status: TransactionLogEntry['status']): TransactionLogEntry {
    const entry: TransactionLogEntry = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toLocaleTimeString(),
      action,
      details,
      status,
    };
    this.history.push(entry);
    return entry;
  }

  public beginTransaction(): TransactionEngineResult {
    if (this.state === 'ACTIVE') {
      const log = this.addLog('ERROR', 'A transaction is already active. Complete or rollback first.', 'FAILED');
      return {
        success: false,
        message: 'A transaction is already active. Please COMMIT or ROLLBACK before starting a new one.',
        state: this.state,
        balances: this.getBalances(),
        log,
      };
    }

    // Capture snapshot for atomicity guarantee
    this.snapshot = { ...this.balances };
    this.state = 'ACTIVE';
    this.pendingDebited = 0;
    this.pendingCredited = 0;

    const log = this.addLog('BEGIN', 'Transaction started. State snapshot captured.', 'SUCCESS');
    return {
      success: true,
      message: 'Transaction started (BEGIN). State snapshot stored.',
      state: this.state,
      balances: this.getBalances(),
      log,
    };
  }

  public debit(account: 'A' | 'B', amount: number): TransactionEngineResult {
    if (this.state !== 'ACTIVE') {
      const log = this.addLog('ERROR', `Debit rejected: Transaction is not active (${this.state}). Must BEGIN first.`, 'FAILED');
      return {
        success: false,
        message: 'Cannot perform DEBIT. Transaction was not started. You must BEGIN first.',
        state: this.state,
        balances: this.getBalances(),
        log,
      };
    }

    if (amount <= 0 || isNaN(amount)) {
      const log = this.addLog('ERROR', `Debit rejected: Invalid debit amount (${amount}).`, 'FAILED');
      return {
        success: false,
        message: 'Invalid debit amount. Amount must be greater than zero.',
        state: this.state,
        balances: this.getBalances(),
        log,
      };
    }

    const currentBal = account === 'A' ? this.balances.accountA : this.balances.accountB;
    if (currentBal < amount) {
      // Overdraw failure triggers atomic safety violation
      this.state = 'FAILED';
      const log = this.addLog(
        'DEBIT', 
        `Debit failed on Account ${account}: Insufficient balance ($${currentBal} < $${amount}).`, 
        'FAILED'
      );
      return {
        success: false,
        message: `Debit failed: Account ${account} has insufficient balance ($${currentBal} available). Transaction marked FAILED. Must ROLLBACK.`,
        state: this.state,
        balances: this.getBalances(),
        log,
      };
    }

    if (account === 'A') {
      this.balances.accountA -= amount;
    } else {
      this.balances.accountB -= amount;
    }
    this.pendingDebited += amount;

    const log = this.addLog('DEBIT', `[DEBIT ${account} - ${amount}] New Account ${account} balance: $${account === 'A' ? this.balances.accountA : this.balances.accountB}`, 'SUCCESS');
    return {
      success: true,
      message: `Debited $${amount} from Account ${account}.`,
      state: this.state,
      balances: this.getBalances(),
      log,
    };
  }

  public credit(account: 'A' | 'B', amount: number): TransactionEngineResult {
    if (this.state !== 'ACTIVE') {
      const log = this.addLog('ERROR', `Credit rejected: Transaction is not active (${this.state}). Must BEGIN first.`, 'FAILED');
      return {
        success: false,
        message: 'Cannot perform CREDIT. Transaction was not started. You must BEGIN first.',
        state: this.state,
        balances: this.getBalances(),
        log,
      };
    }

    if (amount <= 0 || isNaN(amount)) {
      const log = this.addLog('ERROR', `Credit rejected: Invalid credit amount (${amount}).`, 'FAILED');
      return {
        success: false,
        message: 'Invalid credit amount. Amount must be greater than zero.',
        state: this.state,
        balances: this.getBalances(),
        log,
      };
    }

    if (account === 'A') {
      this.balances.accountA += amount;
    } else {
      this.balances.accountB += amount;
    }
    this.pendingCredited += amount;

    const log = this.addLog('CREDIT', `[CREDIT ${account} + ${amount}] New Account ${account} balance: $${account === 'A' ? this.balances.accountA : this.balances.accountB}`, 'SUCCESS');
    return {
      success: true,
      message: `Credited $${amount} to Account ${account}.`,
      state: this.state,
      balances: this.getBalances(),
      log,
    };
  }

  public commit(): TransactionEngineResult {
    if (this.state === 'IDLE') {
      const log = this.addLog('ERROR', 'Commit rejected: Transaction was never started.', 'FAILED');
      return {
        success: false,
        message: 'Cannot COMMIT. Transaction was never started. You must click BEGIN TRANSACTION first.',
        state: this.state,
        balances: this.getBalances(),
        log,
      };
    }

    if (this.state === 'FAILED') {
      const log = this.addLog('ERROR', 'Commit rejected: Transaction is in FAILED state. Must ROLLBACK.', 'FAILED');
      return {
        success: false,
        message: 'Cannot COMMIT a failed transaction. You must ROLLBACK to restore initial state.',
        state: this.state,
        balances: this.getBalances(),
        log,
      };
    }

    // Check Atomicity: If money was debited but not credited equally
    if (this.pendingDebited !== this.pendingCredited || this.pendingDebited === 0) {
      // Transaction is unbalanced! Incomplete atomic sequence
      const log = this.addLog('ERROR', `Commit rejected: Unbalanced transfer. Debited: $${this.pendingDebited}, Credited: $${this.pendingCredited}`, 'FAILED');
      return {
        success: false,
        message: 'Transaction incomplete. All required operations must succeed before COMMIT (Money debited must equal money credited).',
        state: this.state,
        balances: this.getBalances(),
        log,
      };
    }

    this.state = 'COMMITTED';
    this.snapshot = null; // Changes sealed
    const log = this.addLog('COMMIT', '[COMMIT] All atomic operations sealed. Account changes permanent.', 'SUCCESS');
    return {
      success: true,
      message: 'Transaction completed atomically. Changes committed to smart card storage.',
      state: this.state,
      balances: this.getBalances(),
      log,
    };
  }

  public rollback(): TransactionEngineResult {
    if (!this.snapshot) {
      const log = this.addLog('ROLLBACK', 'Rollback invoked with no prior active snapshot.', 'INFO');
      this.state = 'IDLE';
      return {
        success: true,
        message: 'No active transaction to rollback.',
        state: this.state,
        balances: this.getBalances(),
        log,
      };
    }

    // Restore exact snapshot
    this.balances = { ...this.snapshot };
    this.snapshot = null;
    this.state = 'ROLLED_BACK';
    this.pendingDebited = 0;
    this.pendingCredited = 0;

    const log = this.addLog('ROLLBACK', '[ROLLBACK] Restored pre-transaction state snapshot. Balances reset.', 'SUCCESS');
    return {
      success: true,
      message: 'Transaction rolled back. Original account balances restored safely.',
      state: this.state,
      balances: this.getBalances(),
      log,
    };
  }

  public resetToDefault(): void {
    this.state = 'IDLE';
    this.balances = { accountA: 1000, accountB: 500 };
    this.snapshot = null;
    this.pendingDebited = 0;
    this.pendingCredited = 0;
    this.history = [];
    this.addLog('BEGIN', 'System initialized. Account A: $1000, Account B: $500.', 'INFO');
  }
}
