import React, { useEffect, useState } from 'react';
import { useEditorStore } from '../store/useEditorStore';
import { ComponentNode } from '../../types/document';
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  RotateCcw, 
  CheckCircle, 
  Sparkles,
  Compass
} from 'lucide-react';

export const TourSimulationOverlay: React.FC = () => {
  const {
    document,
    isTourPlaying,
    activeTourStepIndex,
    nextTourStep,
    prevTourStep,
    goToTourStep,
    stopTourPlayback,
  } = useEditorStore();

  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  if (!isTourPlaying || !document) return null;

  // Extract all TourStep nodes recursively
  const findTourSteps = (node: ComponentNode): ComponentNode[] => {
    let steps: ComponentNode[] = [];
    if (node.type === 'TourStep') {
      steps.push(node);
    }
    for (const child of node.children) {
      steps = steps.concat(findTourSteps(child));
    }
    return steps;
  };

  const tourSteps = findTourSteps(document.rootNode);
  const totalSteps = tourSteps.length;
  const currentStep = tourSteps[activeTourStepIndex] || tourSteps[0];

  // Try locating target element in DOM for spotlight
  useEffect(() => {
    if (!currentStep) return;

    let targetEl: HTMLElement | null = null;
    const selector = currentStep.target?.selector;

    if (selector) {
      try {
        targetEl = window.document.querySelector(selector);
      } catch {
        targetEl = null;
      }
    }

    // Fallback: look for DOM node with id matching target or current step
    if (!targetEl && selector && selector.startsWith('#')) {
      const id = selector.substring(1);
      targetEl = window.document.getElementById(id);
    }

    if (targetEl) {
      setTargetRect(targetEl.getBoundingClientRect());
    } else {
      setTargetRect(null);
    }
  }, [currentStep, activeTourStepIndex]);

  // Keyboard navigation for simulation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        stopTourPlayback();
      } else if (e.key === 'ArrowRight') {
        nextTourStep();
      } else if (e.key === 'ArrowLeft') {
        prevTourStep();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextTourStep, prevTourStep, stopTourPlayback]);

  if (totalSteps === 0) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 select-none">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl">
          <Compass className="w-10 h-10 text-indigo-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-1">No Tour Steps Found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
            Please add at least one "Tour Step" block to your experience before starting the interactive walkthrough simulation.
          </p>
          <button
            type="button"
            onClick={stopTourPlayback}
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl transition-all shadow-md"
          >
            Close Simulation
          </button>
        </div>
      </div>
    );
  }

  const isFirstStep = activeTourStepIndex === 0;
  const isLastStep = activeTourStepIndex === totalSteps - 1;
  const progressPercent = Math.round(((activeTourStepIndex + 1) / totalSteps) * 100);

  const stepProps = currentStep.props || {};
  const title = stepProps.title || `Step ${activeTourStepIndex + 1}`;
  const description = stepProps.description || 'Welcome to this interactive walkthrough. Learn how to get the most out of your experience.';
  const nextBtnText = isLastStep ? 'Finish Tour 🎉' : (stepProps.nextButtonText || 'Next Step →');
  const prevBtnText = stepProps.prevButtonText || 'Back';
  const skipBtnText = stepProps.skipButtonText || 'Skip Tour';

  return (
    <div className="fixed inset-0 z-50 pointer-events-auto select-none font-sans flex flex-col justify-between">
      {/* Dimmed Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/75 backdrop-blur-[2px] transition-opacity duration-300"
        onClick={stopTourPlayback}
      />

      {/* Target Element Spotlight Hole (if element found) */}
      {targetRect && (
        <div 
          style={{
            position: 'absolute',
            top: targetRect.top - 8,
            left: targetRect.left - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
            borderRadius: '12px',
            boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.78), 0 0 25px rgba(99, 102, 241, 0.6)',
            border: '2px solid rgba(99, 102, 241, 0.9)',
            pointerEvents: 'none',
            zIndex: 51,
            transition: 'all 0.25s ease-out'
          }}
        />
      )}

      {/* Top Simulation Status Bar */}
      <div className="relative z-52 mx-auto mt-4 px-4 py-2 bg-slate-900/90 text-white rounded-full border border-slate-700/80 shadow-2xl flex items-center gap-3 text-xs backdrop-blur-md">
        <span className="flex items-center gap-1.5 text-indigo-400 font-bold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Interactive Tour Simulation</span>
        </span>
        <div className="h-3 w-px bg-slate-700" />
        <span className="text-slate-300 font-mono text-[11px]">
          Step {activeTourStepIndex + 1} of {totalSteps}
        </span>
        <div className="h-3 w-px bg-slate-700" />
        <button
          type="button"
          onClick={() => goToTourStep(0)}
          className="text-slate-400 hover:text-white flex items-center gap-1 transition-colors text-[11px]"
          title="Restart Tour from Step 1"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Restart</span>
        </button>
        <button
          type="button"
          onClick={stopTourPlayback}
          className="text-slate-400 hover:text-red-400 p-0.5 transition-colors"
          title="Exit Simulation (Esc)"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Active Step Modal Tooltip */}
      <div className="relative z-52 m-auto max-w-md w-full px-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6 text-slate-800 dark:text-slate-100">
          
          {/* Header & Step Badge */}
          <div className="flex items-center justify-between mb-3">
            <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
              STEP {activeTourStepIndex + 1} OF {totalSteps}
            </span>
            <button
              type="button"
              onClick={stopTourPlayback}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mb-4">
            <div 
              className="bg-indigo-600 h-full transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Step Content */}
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 leading-snug">
            {title}
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
            {description}
          </p>

          {/* Target Element Indicator */}
          {currentStep.target?.selector && (
            <div className="mb-5 px-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-lg text-[11px] text-slate-500 dark:text-slate-400 font-mono flex items-center justify-between">
              <span>Target: {currentStep.target.selector}</span>
              <span className="text-[10px] text-indigo-500 uppercase font-semibold">
                {currentStep.target.placement || 'bottom'}
              </span>
            </div>
          )}

          {/* Footer Controls */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <button
              type="button"
              onClick={stopTourPlayback}
              className="text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              {skipBtnText}
            </button>

            <div className="flex items-center gap-2">
              {!isFirstStep && (
                <button
                  type="button"
                  onClick={prevTourStep}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition-all flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>{prevBtnText}</span>
                </button>
              )}

              <button
                type="button"
                onClick={nextTourStep}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5"
              >
                <span>{nextBtnText}</span>
                {!isLastStep && <ChevronRight className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom keyboard helper hint */}
      <div className="relative z-52 mx-auto mb-4 text-[11px] text-slate-400/80 bg-black/40 px-3 py-1 rounded-full backdrop-blur-xs">
        Use <kbd className="px-1.5 py-0.5 bg-slate-800 text-slate-200 rounded font-mono">←</kbd> and <kbd className="px-1.5 py-0.5 bg-slate-800 text-slate-200 rounded font-mono">→</kbd> keys to navigate, <kbd className="px-1.5 py-0.5 bg-slate-800 text-slate-200 rounded font-mono">Esc</kbd> to exit
      </div>
    </div>
  );
};
