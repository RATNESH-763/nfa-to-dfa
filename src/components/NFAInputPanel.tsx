import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { NFADefinition, Transition } from '@/lib/nfa-types';
import { validateNFA, ValidationError } from '@/lib/validate-nfa';
import { Plus, Trash2, Play, RotateCcw } from 'lucide-react';
import MultiSelect from './MultiSelect';
import { NFA_PRESETS } from '@/lib/nfa-presets';

interface Props {
  onStartConversion: (nfa: NFADefinition) => void;
  onReset: () => void;
  onPreviewChange: (nfa: NFADefinition) => void;
  isConverting: boolean;
}

const DEFAULT_NFA: NFADefinition = NFA_PRESETS[0].nfa;

export default function NFAInputPanel({ onStartConversion, onReset, onPreviewChange, isConverting }: Props) {
  const [statesInput, setStatesInput] = useState(DEFAULT_NFA.states.join(', '));
  const [alphabetInput, setAlphabetInput] = useState(DEFAULT_NFA.alphabet.join(', '));
  const [startState, setStartState] = useState(DEFAULT_NFA.startState);
  const [finalStates, setFinalStates] = useState<string[]>(DEFAULT_NFA.finalStates);
  const [transitions, setTransitions] = useState<Transition[]>(DEFAULT_NFA.transitions);
  const [errors, setErrors] = useState<ValidationError[]>([]);

  const parseList = (s: string) => s.split(',').map(x => x.trim()).filter(Boolean);
  const states = parseList(statesInput);
  const alphabet = parseList(alphabetInput);
  const symbols = [...alphabet, 'ε'];

  // Live preview — emit current NFA whenever it changes (not while converting)
  useEffect(() => {
    if (isConverting) return;
    const nfa: NFADefinition = { states, alphabet, transitions, startState, finalStates };
    onPreviewChange(nfa);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statesInput, alphabetInput, startState, finalStates, transitions, isConverting]);

  const loadPreset = (idx: number) => {
    const p = NFA_PRESETS[idx].nfa;
    setStatesInput(p.states.join(', '));
    setAlphabetInput(p.alphabet.join(', '));
    setStartState(p.startState);
    setFinalStates(p.finalStates);
    setTransitions(p.transitions);
    setErrors([]);
  };

  const addTransition = () => {
    setTransitions(prev => [...prev, { from: states[0] || '', symbol: alphabet[0] || 'ε', to: [] }]);
  };

  const removeTransition = (i: number) => {
    setTransitions(prev => prev.filter((_, idx) => idx !== i));
  };

  const updateTransition = (i: number, field: keyof Transition, value: any) => {
    setTransitions(prev => prev.map((t, idx) => idx === i ? { ...t, [field]: value } : t));
  };

  const handleStart = () => {
    const nfa: NFADefinition = { states, alphabet, transitions, startState, finalStates };
    const errs = validateNFA(nfa);
    setErrors(errs);
    if (errs.length === 0) onStartConversion(nfa);
  };

  const handleReset = () => {
    setStatesInput(DEFAULT_NFA.states.join(', '));
    setAlphabetInput(DEFAULT_NFA.alphabet.join(', '));
    setStartState(DEFAULT_NFA.startState);
    setFinalStates(DEFAULT_NFA.finalStates);
    setTransitions(DEFAULT_NFA.transitions);
    setErrors([]);
    onReset();
  };

  const fieldError = (field: string) => errors.filter(e => e.field === field);

  return (
    <div className="flex flex-col gap-3 h-full overflow-y-auto p-4">
      <h2 className="text-base font-semibold text-foreground">NFA Definition</h2>

      <div>
        <Label className="text-xs">States (comma-separated)</Label>
        <Input value={statesInput} onChange={e => setStatesInput(e.target.value)} placeholder="q0, q1, q2" className="h-8 text-xs" disabled={isConverting} />
        {fieldError('states').map((e, i) => <p key={i} className="text-xs text-destructive mt-0.5">{e.message}</p>)}
      </div>

      <div>
        <Label className="text-xs">Alphabet (comma-separated)</Label>
        <Input value={alphabetInput} onChange={e => setAlphabetInput(e.target.value)} placeholder="a, b" className="h-8 text-xs" disabled={isConverting} />
        {fieldError('alphabet').map((e, i) => <p key={i} className="text-xs text-destructive mt-0.5">{e.message}</p>)}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs">Start State</Label>
          <Select value={startState} onValueChange={setStartState} disabled={isConverting}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {states.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          {fieldError('startState').map((e, i) => <p key={i} className="text-xs text-destructive mt-0.5">{e.message}</p>)}
        </div>
        <div>
          <Label className="text-xs">Final States</Label>
          <MultiSelect
            options={states}
            selected={finalStates}
            onChange={setFinalStates}
            placeholder="Select…"
            disabled={isConverting}
            className="h-8"
          />
          {fieldError('finalStates').map((e, i) => <p key={i} className="text-xs text-destructive mt-0.5">{e.message}</p>)}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <Label className="text-xs font-semibold">Transitions</Label>
          <Button variant="ghost" size="sm" onClick={addTransition} disabled={isConverting} className="h-6 px-2 text-xs">
            <Plus className="w-3 h-3 mr-1" /> Add
          </Button>
        </div>
        {fieldError('transitions').map((e, i) => <p key={i} className="text-xs text-destructive mb-1">{e.message}</p>)}

        <div className="space-y-1.5 max-h-[240px] overflow-y-auto">
          {transitions.map((t, i) => (
            <div key={i} className="flex items-center gap-1 bg-muted/50 rounded px-2 py-1">
              <Select value={t.from} onValueChange={v => updateTransition(i, 'from', v)} disabled={isConverting}>
                <SelectTrigger className="h-7 text-xs w-14"><SelectValue /></SelectTrigger>
                <SelectContent>{states.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
              <span className="text-xs text-muted-foreground">→</span>
              <Select value={t.symbol} onValueChange={v => updateTransition(i, 'symbol', v)} disabled={isConverting}>
                <SelectTrigger className="h-7 text-xs w-12"><SelectValue /></SelectTrigger>
                <SelectContent>{symbols.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
              <span className="text-xs text-muted-foreground">→</span>
              <MultiSelect
                options={states}
                selected={t.to}
                onChange={v => updateTransition(i, 'to', v)}
                placeholder="states"
                disabled={isConverting}
                className="flex-1 h-7"
              />
              <Button variant="ghost" size="sm" onClick={() => removeTransition(i)} disabled={isConverting} className="h-6 w-6 p-0">
                <Trash2 className="w-3 h-3 text-muted-foreground" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Preset examples */}
      <div>
        <Label className="text-xs font-semibold mb-1 block">Examples</Label>
        <div className="flex flex-col gap-1">
          {NFA_PRESETS.map((p, i) => (
            <Button
              key={i}
              variant="outline"
              size="sm"
              onClick={() => loadPreset(i)}
              disabled={isConverting}
              className="h-7 text-xs justify-start font-normal"
              title={p.description}
            >
              {p.name}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 mt-auto pt-2">
        <Button onClick={handleStart} disabled={isConverting} className="flex-1 h-8 text-xs">
          <Play className="w-3 h-3 mr-1" /> Start Conversion
        </Button>
        <Button variant="outline" onClick={handleReset} className="h-8 text-xs">
          <RotateCcw className="w-3 h-3 mr-1" /> Reset
        </Button>
      </div>
    </div>
  );
}
