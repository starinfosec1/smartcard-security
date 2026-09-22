import { ATRProtocolState, TransmissionLog } from '../types';

export interface TransmissionResult {
  success: boolean;
  message: string;
  state: ATRProtocolState;
  log?: TransmissionLog;
  atrHex?: string;
  ppsHex?: string;
}

export class SmartCardTransmissionEngine {
  private state: ATRProtocolState = 'POWER_OFF';
  private logs: TransmissionLog[] = [];
  
  // Simulated ISO 7816-3 ATR bytes: TS (3B), T0 (13), TA1 (00), TB1 (81), TC1 (31), TD1 (FE), TCK (45)
  public readonly SIMULATED_ATR = '3B 13 00 81 31 FE 45';
  public readonly SIMULATED_PPS_REQ = 'FF 10 11 FE';
  public readonly SIMULATED_PPS_RESP = 'FF 10 11 FE';

  public getState(): ATRProtocolState {
    return this.state;
  }

  public getLogs(): TransmissionLog[] {
    return [...this.logs];
  }

  private addLog(direction: TransmissionLog['direction'], title: string, hexData: string, description: string): TransmissionLog {
    const entry: TransmissionLog = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      timestamp: new Date().toLocaleTimeString(),
      direction,
      title,
      hexData,
      description,
    };
    this.logs.push(entry);
    return entry;
  }

  public resetCard(): TransmissionResult {
    this.state = 'RESET';
    const log = this.addLog(
      'TX',
      'COLD RESET ASSERTED',
      'RST: LOW ➔ HIGH (3.3V)',
      'Card Reader asserted reset signal (RST line active). Smart card microchip rebooting.'
    );

    return {
      success: true,
      message: 'Card status: RESET. The smart card microchip has rebooted and is ready to send ATR.',
      state: this.state,
      log,
    };
  }

  public sendATR(): TransmissionResult {
    if (this.state === 'POWER_OFF') {
      const log = this.addLog('SYS', 'ERR_POWER_OFF', '00', 'Card is powered down. Cannot emit ATR.');
      return {
        success: false,
        message: 'Cannot receive ATR. Card is powered off. You must click RESET CARD first.',
        state: this.state,
        log,
      };
    }

    if (this.state === 'COMMUNICATION_READY') {
      return {
        success: false,
        message: 'Communication is already active. Reset the card if you want to start a new handshake.',
        state: this.state,
      };
    }

    // Must be in RESET state (or ATR already received re-reading)
    if (this.state !== 'RESET' && this.state !== 'ATR_RECEIVED') {
      return {
        success: false,
        message: 'Card must be in RESET state before transmitting ATR.',
        state: this.state,
      };
    }

    this.state = 'ATR_RECEIVED';
    const log = this.addLog(
      'RX',
      'ATR RECEIVED (Answer To Reset)',
      this.SIMULATED_ATR,
      'Card transmitted Answer To Reset string. Supported protocol: T=0 / T=1, baud rate base divider identified.'
    );

    return {
      success: true,
      message: `ATR Received: [${this.SIMULATED_ATR}]. Smart card parameters broadcasted. Next, perform PPS.`,
      state: this.state,
      log,
      atrHex: this.SIMULATED_ATR,
    };
  }

  public sendPPS(): TransmissionResult {
    if (this.state === 'POWER_OFF' || this.state === 'RESET') {
      const log = this.addLog('SYS', 'INVALID_PPS_TRANSITION', '--', 'PPS attempted before ATR.');
      return {
        success: false,
        message: 'PPS cannot be started yet. Receive ATR first.',
        state: this.state,
        log,
      };
    }

    if (this.state === 'COMMUNICATION_READY') {
      return {
        success: false,
        message: 'Protocol parameters already negotiated and communication channel is established.',
        state: this.state,
      };
    }

    this.state = 'PPS_SELECTED';
    // Reader sends PPS Request, Card returns matching PPS Response
    this.addLog(
      'TX',
      'PPS REQUEST SENT (Protocol & Parameter Selection)',
      this.SIMULATED_PPS_REQ,
      'Reader proposed transmission parameter: F=372, D=1 (Protocol T=0 selected).'
    );
    const log = this.addLog(
      'RX',
      'PPS CONFIRMATION RECEIVED',
      this.SIMULATED_PPS_RESP,
      'Smart Card accepted parameter negotiation. Baud rate and transmission timing configured.'
    );

    return {
      success: true,
      message: 'Protocol and Parameters Selection (PPS) completed. Ready to start secure data communication.',
      state: this.state,
      log,
      ppsHex: this.SIMULATED_PPS_RESP,
    };
  }

  public startCommunication(): TransmissionResult {
    if (this.state === 'POWER_OFF' || this.state === 'RESET' || this.state === 'ATR_RECEIVED') {
      const log = this.addLog('SYS', 'COMM_REJECTED', 'ERR_SEQ', 'Premature communication attempt.');
      return {
        success: false,
        message: 'Communication setup is incomplete. The required sequence is RESET ➔ ATR ➔ PPS ➔ COMMUNICATION.',
        state: this.state,
        log,
      };
    }

    if (this.state === 'PPS_SELECTED') {
      this.state = 'COMMUNICATION_READY';
      const log = this.addLog(
        'TX',
        'APDU CHANNEL OPEN',
        '00 A4 04 00 07 A0 00 00 00 04 10 10',
        'SELECT APPLICATION command sent. Secure channel link established.'
      );

      return {
        success: true,
        message: 'Communication established successfully.',
        state: this.state,
        log,
      };
    }

    return {
      success: true,
      message: 'Communication is already active.',
      state: this.state,
    };
  }

  public resetAll(): void {
    this.state = 'POWER_OFF';
    this.logs = [];
    this.addLog('SYS', 'POWER DOWN', '0V', 'Card inserted in unpowered slot. Awaiting Reset.');
  }
}
