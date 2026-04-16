import {
  NFADefinition,
  ConversionResult,
  ConversionStep,
  DFAState,
  DFATransition,
  stateSetToId,
} from './nfa-types';

function epsilonClosure(nfa: NFADefinition, states: Set<string>): Set<string> {
  const closure = new Set(states);
  const stack = Array.from(states);
  while (stack.length > 0) {
    const state = stack.pop()!;
    for (const t of nfa.transitions) {
      if (t.from === state && t.symbol === 'ε') {
        for (const s of t.to) {
          if (!closure.has(s)) {
            closure.add(s);
            stack.push(s);
          }
        }
      }
    }
  }
  return closure;
}

function move(nfa: NFADefinition, states: Set<string>, symbol: string): Set<string> {
  const result = new Set<string>();
  for (const state of states) {
    for (const t of nfa.transitions) {
      if (t.from === state && t.symbol === symbol) {
        for (const s of t.to) {
          result.add(s);
        }
      }
    }
  }
  return result;
}

export function subsetConstruction(nfa: NFADefinition): ConversionResult {
  const steps: ConversionStep[] = [];
  const dfaStates: DFAState[] = [];
  const dfaTransitions: DFATransition[] = [];
  const dfaTransitionTable: Record<string, Record<string, string>> = {};

  // Step 1: ε-closure of start state
  const startClosure = epsilonClosure(nfa, new Set([nfa.startState]));
  const startId = stateSetToId(startClosure);

  steps.push({
    type: 'epsilon-closure',
    title: 'Compute ε-closure of start state',
    explanation: `Starting with the NFA start state {${nfa.startState}}, we compute the ε-closure — all states reachable via ε-transitions. Result: ${startId}`,
    nfaStatesInvolved: [nfa.startState],
    resultStates: Array.from(startClosure),
    highlightStates: Array.from(startClosure),
  });

  const isFinal = (s: Set<string>) => nfa.finalStates.some(f => s.has(f));

  dfaStates.push({
    id: startId,
    nfaStates: startClosure,
    isStart: true,
    isFinal: isFinal(startClosure),
  });

  steps.push({
    type: 'new-state',
    title: `Create DFA start state ${startId}`,
    explanation: `The ε-closure ${startId} becomes our first DFA state.${isFinal(startClosure) ? ' It contains a final NFA state, so it is also a DFA final state.' : ''}`,
    resultStates: Array.from(startClosure),
    highlightStates: Array.from(startClosure),
  });

  const unmarked: Set<string>[] = [startClosure];
  const seen = new Set<string>([startId]);

  while (unmarked.length > 0) {
    const current = unmarked.shift()!;
    const currentId = stateSetToId(current);
    dfaTransitionTable[currentId] = {};

    for (const symbol of nfa.alphabet) {
      const moved = move(nfa, current, symbol);

      steps.push({
        type: 'move',
        title: `Move(${currentId}, '${symbol}')`,
        explanation: `From DFA state ${currentId}, follow '${symbol}' transitions in the NFA. Direct reach: ${moved.size > 0 ? `{${Array.from(moved).sort().join(',')}}` : '∅'}`,
        currentDFAState: currentId,
        symbol,
        nfaStatesInvolved: Array.from(current),
        resultStates: Array.from(moved),
      });

      const closure = moved.size > 0 ? epsilonClosure(nfa, moved) : new Set<string>();
      const closureId = stateSetToId(closure);

      if (moved.size > 0) {
        steps.push({
          type: 'epsilon-closure',
          title: `ε-closure of {${Array.from(moved).sort().join(',')}}`,
          explanation: `Apply ε-closure to the move result. Result: ${closureId}`,
          resultStates: Array.from(closure),
          highlightStates: Array.from(closure),
        });
      }

      dfaTransitionTable[currentId][symbol] = closureId;
      dfaTransitions.push({ from: currentId, symbol, to: closureId });

      if (!seen.has(closureId) && closure.size > 0) {
        seen.add(closureId);
        unmarked.push(closure);
        const final = isFinal(closure);
        dfaStates.push({
          id: closureId,
          nfaStates: closure,
          isStart: false,
          isFinal: final,
        });
        steps.push({
          type: 'new-state',
          title: `New DFA state: ${closureId}`,
          explanation: `${closureId} is a new set of NFA states we haven't seen before — add it as a DFA state.${final ? ' It contains a final NFA state, so it is a DFA final state.' : ''}`,
          resultStates: Array.from(closure),
        });
      }

      steps.push({
        type: 'transition',
        title: `δ(${currentId}, '${symbol}') = ${closureId}`,
        explanation: `Add DFA transition: from ${currentId} on input '${symbol}', go to ${closureId}.`,
        currentDFAState: currentId,
        symbol,
        targetDFAState: closureId,
      });
    }
  }

  // Handle dead/empty state
  if (dfaTransitions.some(t => t.to === '∅')) {
    if (!dfaStates.find(s => s.id === '∅')) {
      dfaStates.push({
        id: '∅',
        nfaStates: new Set(),
        isStart: false,
        isFinal: false,
      });
    }
    // Add self-loops for dead state
    for (const symbol of nfa.alphabet) {
      if (!dfaTransitionTable['∅']) dfaTransitionTable['∅'] = {};
      dfaTransitionTable['∅'][symbol] = '∅';
    }
  }

  steps.push({
    type: 'complete',
    title: 'Conversion Complete',
    explanation: `The DFA has ${dfaStates.length} state(s) and ${dfaTransitions.length} transition(s). All reachable subsets have been explored.`,
  });

  return { steps, dfaStates, dfaTransitions, dfaTransitionTable };
}
