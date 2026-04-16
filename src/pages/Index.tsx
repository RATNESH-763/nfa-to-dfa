import React, { useState, useCallback } from 'react';
import NFAInputPanel from '@/components/NFAInputPanel';
import StepPanel from '@/components/StepPanel';
import GraphPanel from '@/components/GraphPanel';
import { NFADefinition, ConversionResult } from '@/lib/nfa-types';
import { subsetConstruction } from '@/lib/subset-construction';

const Index = () => {
  const [nfa, setNfa] = useState<NFADefinition | null>(null);
  const [previewNfa, setPreviewNfa] = useState<NFADefinition | null>(null);
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isConverting, setIsConverting] = useState(false);

  const handleStartConversion = useCallback((nfaDef: NFADefinition) => {
    setNfa(nfaDef);
    const res = subsetConstruction(nfaDef);
    setResult(res);
    setCurrentStep(0);
    setIsConverting(true);
  }, []);

  const handleReset = useCallback(() => {
    setNfa(null);
    setResult(null);
    setCurrentStep(0);
    setIsConverting(false);
  }, []);

  const handleStepChange = useCallback((step: number) => {
    if (result && step >= 0 && step < result.steps.length) {
      setCurrentStep(step);
    }
  }, [result]);

  // Show converted NFA when running, otherwise show live preview
  const displayNfa = isConverting ? nfa : previewNfa;

  return (
    <div className="h-screen w-screen flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <header className="h-12 border-b flex items-center px-4 shrink-0">
        <h1 className="text-sm font-bold text-foreground tracking-tight">NFA → DFA Conversion Visualizer</h1>
        <span className="ml-3 text-[10px] text-muted-foreground">Subset Construction Method</span>
      </header>

      {/* Main three-column layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Input */}
        <div className="w-[280px] shrink-0 border-r overflow-hidden">
          <NFAInputPanel
            onStartConversion={handleStartConversion}
            onReset={handleReset}
            onPreviewChange={setPreviewNfa}
            isConverting={isConverting}
          />
        </div>

        {/* Center: Steps */}
        <div className="flex-[35] border-r overflow-hidden min-w-0">
          <StepPanel
            nfa={displayNfa}
            result={result}
            currentStep={currentStep}
            onStepChange={handleStepChange}
          />
        </div>

        {/* Right: Graphs */}
        <div className="flex-[40] overflow-hidden min-w-0">
          <GraphPanel nfa={displayNfa} result={result} />
        </div>
      </div>
    </div>
  );
};

export default Index;
