import { NFADefinition } from './nfa-types';

export interface ValidationError {
  field: string;
  message: string;
}

export function validateNFA(nfa: NFADefinition): ValidationError[] {
  const errors: ValidationError[] = [];

  if (nfa.states.length === 0) {
    errors.push({ field: 'states', message: 'At least one state is required.' });
  }
  if (nfa.alphabet.length === 0) {
    errors.push({ field: 'alphabet', message: 'At least one alphabet symbol is required.' });
  }
  if (!nfa.startState) {
    errors.push({ field: 'startState', message: 'Start state is required.' });
  } else if (!nfa.states.includes(nfa.startState)) {
    errors.push({ field: 'startState', message: `Start state "${nfa.startState}" is not in the states list.` });
  }
  if (nfa.finalStates.length === 0) {
    errors.push({ field: 'finalStates', message: 'At least one final state is required.' });
  }
  for (const f of nfa.finalStates) {
    if (!nfa.states.includes(f)) {
      errors.push({ field: 'finalStates', message: `Final state "${f}" is not in the states list.` });
    }
  }

  const validSymbols = new Set([...nfa.alphabet, 'ε']);
  for (const t of nfa.transitions) {
    if (!nfa.states.includes(t.from)) {
      errors.push({ field: 'transitions', message: `Transition from unknown state "${t.from}".` });
    }
    if (!validSymbols.has(t.symbol)) {
      errors.push({ field: 'transitions', message: `Transition uses unknown symbol "${t.symbol}".` });
    }
    for (const s of t.to) {
      if (!nfa.states.includes(s)) {
        errors.push({ field: 'transitions', message: `Transition to unknown state "${s}".` });
      }
    }
  }

  return errors;
}
