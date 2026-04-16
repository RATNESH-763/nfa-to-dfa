import React from 'react';
import { Button } from '@/components/ui/button';
import { ConversionResult, NFADefinition } from '@/lib/nfa-types';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface Props {
  nfa: NFADefinition | null;
  result: ConversionResult | null;
  currentStep: number;
  onStepChange: (step: number) => void;
}

const TOOLTIPS: Record<string, string> = {
  'ε-closure': 'The set of all states reachable from a given state by following only ε (epsilon) transitions, including the state itself.',
  'subset construction': 'An algorithm that converts an NFA to a DFA by treating sets of NFA states as single DFA states.',
  'move': 'The set of states reachable from a set of states on a given input symbol.',
};

function HighlightTerms({ text }: { text: string }) {
  const terms = Object.keys(TOOLTIPS);
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    let earliest = -1;
    let matchedTerm = '';
    for (const term of terms) {
      const idx = remaining.toLowerCase().indexOf(term.toLowerCase());
      if (idx !== -1 && (earliest === -1 || idx < earliest)) {
        earliest = idx;
        matchedTerm = term;
      }
    }
    if (earliest === -1) {
      parts.push(<span key={key++}>{remaining}</span>);
      break;
    }
    if (earliest > 0) parts.push(<span key={key++}>{remaining.slice(0, earliest)}</span>);
    parts.push(
      <Tooltip key={key++}>
        <TooltipTrigger asChild>
          <span className="underline decoration-dotted cursor-help font-medium text-foreground">
            {remaining.slice(earliest, earliest + matchedTerm.length)}
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-[250px] text-xs">{TOOLTIPS[matchedTerm]}</TooltipContent>
      </Tooltip>
    );
    remaining = remaining.slice(earliest + matchedTerm.length);
  }
  return <>{parts}</>;
}

// Build a map: from -> symbol -> sorted list of to-states (NFA table)
function buildNFATable(nfa: NFADefinition) {
  const symbols = [...nfa.alphabet, ...(nfa.transitions.some(t => t.symbol === 'ε') ? ['ε'] : [])];
  const table: Record<string, Record<string, string[]>> = {};
  for (const s of nfa.states) {
    table[s] = {};
    for (const sym of symbols) table[s][sym] = [];
  }
  for (const t of nfa.transitions) {
    if (!table[t.from]) table[t.from] = {};
    if (!table[t.from][t.symbol]) table[t.from][t.symbol] = [];
    for (const to of t.to) {
      if (!table[t.from][t.symbol].includes(to)) table[t.from][t.symbol].push(to);
    }
  }
  return { table, symbols };
}

export default function StepPanel({ nfa, result, currentStep, onStepChange }: Props) {
  // Compute progressive DFA table from steps[0..currentStep]
  const partialDFATable: Record<string, Record<string, string>> = {};
  const knownDFAStates = new Set<string>();
  if (result) {
    for (let i = 0; i <= currentStep; i++) {
      const s = result.steps[i];
      if (s.type === 'new-state' && s.resultStates) {
        // resultStates is array of NFA states; recover id from result.dfaStates by matching
        // Easier: rely on transition steps to also populate.
      }
      if (s.type === 'transition' && s.currentDFAState && s.symbol && s.targetDFAState) {
        if (!partialDFATable[s.currentDFAState]) partialDFATable[s.currentDFAState] = {};
        partialDFATable[s.currentDFAState][s.symbol] = s.targetDFAState;
        knownDFAStates.add(s.currentDFAState);
        knownDFAStates.add(s.targetDFAState);
      }
    }
    // Always include start state once it's been created
    for (let i = 0; i <= currentStep; i++) {
      const s = result.steps[i];
      if (s.type === 'new-state') {
        // Find matching dfaState by resultStates
        if (s.resultStates) {
          const sorted = [...s.resultStates].sort().join(',');
          const match = result.dfaStates.find(d => Array.from(d.nfaStates).sort().join(',') === sorted);
          if (match) knownDFAStates.add(match.id);
        }
      }
    }
  }

  const typeColors: Record<string, string> = {
    'epsilon-closure': 'bg-blue-50 border-blue-200 text-blue-800',
    'move': 'bg-amber-50 border-amber-200 text-amber-800',
    'new-state': 'bg-green-50 border-green-200 text-green-800',
    'transition': 'bg-purple-50 border-purple-200 text-purple-800',
    'complete': 'bg-emerald-50 border-emerald-200 text-emerald-800',
  };

  const renderNFATable = () => {
    if (!nfa || nfa.states.length === 0) return null;
    const { table, symbols } = buildNFATable(nfa);
    return (
      <div className="mb-3">
        <h3 className="text-xs font-semibold text-foreground mb-1">NFA Transition Table</h3>
        <div className="border rounded overflow-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left p-1.5 font-semibold">State</th>
                {symbols.map(s => <th key={s} className="text-left p-1.5 font-semibold">'{s}'</th>)}
              </tr>
            </thead>
            <tbody>
              {nfa.states.map(state => (
                <tr key={state} className="border-b last:border-0">
                  <td className="p-1.5 font-mono">
                    {state === nfa.startState && <span className="text-green-600 mr-0.5">→</span>}
                    {nfa.finalStates.includes(state) && <span className="text-red-600 mr-0.5">*</span>}
                    {state}
                  </td>
                  {symbols.map(sym => {
                    const dest = table[state]?.[sym] ?? [];
                    return (
                      <td key={sym} className="p-1.5 font-mono">
                        {dest.length === 0 ? <span className="text-muted-foreground">∅</span> : `{${dest.join(',')}}`}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  if (!result) {
    return (
      <div className="flex flex-col h-full p-4 overflow-auto">
        <h2 className="text-base font-semibold text-foreground mb-2">Step-by-Step Conversion</h2>
        {renderNFATable()}
        <div className="flex items-center justify-center flex-1 text-muted-foreground text-xs p-4 text-center">
          <p>Configure the NFA on the left and click "Start Conversion" to begin.</p>
        </div>
      </div>
    );
  }

  const step = result.steps[currentStep];
  const total = result.steps.length;
  const dfaSymbols = nfa?.alphabet ?? [];

  return (
    <div className="flex flex-col h-full p-4 overflow-hidden">
      <h2 className="text-base font-semibold text-foreground mb-2">Step-by-Step Conversion</h2>

      {/* Step navigation */}
      <div className="flex items-center justify-between mb-3">
        <Button variant="outline" size="sm" onClick={() => onStepChange(currentStep - 1)} disabled={currentStep <= 0} className="h-7 text-xs">
          <ChevronLeft className="w-3 h-3 mr-1" /> Prev
        </Button>
        <span className="text-xs text-muted-foreground font-medium">
          Step {currentStep + 1} / {total}
        </span>
        <Button variant="outline" size="sm" onClick={() => onStepChange(currentStep + 1)} disabled={currentStep >= total - 1} className="h-7 text-xs">
          Next <ChevronRight className="w-3 h-3 ml-1" />
        </Button>
      </div>

      {/* Current step */}
      <div className={`rounded-md border p-3 mb-3 ${typeColors[step.type] || ''}`}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] uppercase tracking-wider font-bold opacity-60">{step.type.replace('-', ' ')}</span>
        </div>
        <h3 className="text-sm font-semibold mb-1">{step.title}</h3>
        <p className="text-xs leading-relaxed"><HighlightTerms text={step.explanation} /></p>
      </div>

      {/* Tables */}
      <div className="flex-1 overflow-auto">
        {renderNFATable()}

        <h3 className="text-xs font-semibold text-foreground mb-1">DFA Transition Table</h3>
        {Array.from(knownDFAStates).length === 0 ? (
          <p className="text-xs text-muted-foreground">Table will fill in as you step through.</p>
        ) : (
          <div className="border rounded overflow-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left p-1.5 font-semibold">State</th>
                  {dfaSymbols.map(s => (
                    <th key={s} className="text-left p-1.5 font-semibold">'{s}'</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from(knownDFAStates).map(stateId => {
                  const dfaState = result.dfaStates.find(s => s.id === stateId);
                  return (
                    <tr key={stateId} className="border-b last:border-0">
                      <td className="p-1.5 font-mono">
                        {dfaState?.isStart && <span className="text-green-600 mr-0.5">→</span>}
                        {dfaState?.isFinal && <span className="text-red-600 mr-0.5">*</span>}
                        {stateId}
                      </td>
                      {dfaSymbols.map(sym => (
                        <td key={sym} className="p-1.5 font-mono">
                          {partialDFATable[stateId]?.[sym] ?? <span className="text-muted-foreground">—</span>}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
