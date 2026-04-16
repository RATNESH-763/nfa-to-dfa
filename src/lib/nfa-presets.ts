import { NFADefinition } from './nfa-types';

export interface NFAPreset {
  name: string;
  description: string;
  nfa: NFADefinition;
}

export const NFA_PRESETS: NFAPreset[] = [
  {
    name: "Ends with 'ab'",
    description: "Strings over {a,b} ending with 'ab'",
    nfa: {
      states: ['q0', 'q1', 'q2'],
      alphabet: ['a', 'b'],
      transitions: [
        { from: 'q0', symbol: 'a', to: ['q0', 'q1'] },
        { from: 'q0', symbol: 'b', to: ['q0'] },
        { from: 'q1', symbol: 'b', to: ['q2'] },
      ],
      startState: 'q0',
      finalStates: ['q2'],
    },
  },
  {
    name: "Contains 'aa' or 'bb'",
    description: "Strings over {a,b} containing 'aa' or 'bb'",
    nfa: {
      states: ['q0', 'q1', 'q2', 'q3', 'q4'],
      alphabet: ['a', 'b'],
      transitions: [
        { from: 'q0', symbol: 'a', to: ['q0', 'q1'] },
        { from: 'q0', symbol: 'b', to: ['q0', 'q3'] },
        { from: 'q1', symbol: 'a', to: ['q2'] },
        { from: 'q2', symbol: 'a', to: ['q2'] },
        { from: 'q2', symbol: 'b', to: ['q2'] },
        { from: 'q3', symbol: 'b', to: ['q4'] },
        { from: 'q4', symbol: 'a', to: ['q4'] },
        { from: 'q4', symbol: 'b', to: ['q4'] },
      ],
      startState: 'q0',
      finalStates: ['q2', 'q4'],
    },
  },
  {
    name: "ε-NFA: a*b*",
    description: "Classic ε-transitions: zero or more a's then zero or more b's",
    nfa: {
      states: ['q0', 'q1', 'q2'],
      alphabet: ['a', 'b'],
      transitions: [
        { from: 'q0', symbol: 'a', to: ['q0'] },
        { from: 'q0', symbol: 'ε', to: ['q1'] },
        { from: 'q1', symbol: 'b', to: ['q1'] },
        { from: 'q1', symbol: 'ε', to: ['q2'] },
      ],
      startState: 'q0',
      finalStates: ['q2'],
    },
  },
];
