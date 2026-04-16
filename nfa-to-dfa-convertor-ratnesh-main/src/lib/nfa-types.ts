export interface NFADefinition {
  states: string[];
  alphabet: string[];
  transitions: Transition[];
  startState: string;
  finalStates: string[];
}

export interface Transition {
  from: string;
  symbol: string; // 'ε' for epsilon
  to: string[];
}

export interface DFAState {
  id: string; // e.g. "{q0,q1}"
  nfaStates: Set<string>;
  isStart: boolean;
  isFinal: boolean;
}

export interface DFATransition {
  from: string;
  symbol: string;
  to: string;
}

export interface ConversionStep {
  type: 'epsilon-closure' | 'move' | 'new-state' | 'transition' | 'complete';
  title: string;
  explanation: string;
  currentDFAState?: string;
  symbol?: string;
  targetDFAState?: string;
  nfaStatesInvolved?: string[];
  resultStates?: string[];
  highlightStates?: string[];
}

export interface ConversionResult {
  steps: ConversionStep[];
  dfaStates: DFAState[];
  dfaTransitions: DFATransition[];
  dfaTransitionTable: Record<string, Record<string, string>>;
}

export function stateSetToId(states: Set<string>): string {
  const sorted = Array.from(states).sort();
  if (sorted.length === 0) return '∅';
  return `{${sorted.join(',')}}`;
}
