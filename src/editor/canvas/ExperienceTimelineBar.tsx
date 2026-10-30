import React from 'react';
import { useEditorStore } from '../store/useEditorStore';
import { ComponentNode } from '../../types/document';
import { 
  Play, 
  Plus, 
  Compass, 
  Layers, 
  Trash2, 
  Copy, 
  Target, 
  ChevronRight,
  Sparkles,
  MousePointer,
  CheckCircle2,
  SlidersHorizontal
} from 'lucide-react';

export const ExperienceTimelineBar: React.FC = () => {
  const {
    document,
    selectedNodeId,
    selectNode,
    deleteNode,
    duplicateNode,
    insertNode,
    startTourPlayback,
    isPreviewMode,
  } = useEditorStore();

  if (!document || isPreviewMode) return null;

  // Extract steps based on document type (TourStep, DemoScreen, ChecklistItem, etc.)
  const extractSteps = (node: ComponentNode): ComponentNode[] => {
    let steps: ComponentNode[] = [];
    if (['TourStep', 'DemoScreen', 'ChecklistItem', 'SurveyQuestion'].includes(node.type)) {
      steps.push(node);
    }
    for (const child of node.children) {
      steps = steps.concat(extractSteps(child));
    }
    return steps;
  };

  const steps = extractSteps(document.rootNode);

  // If there are no multi-step items, don't show the timeline sequencer
  if (steps.length === 0 && !['tour', 'demo', 'checklist', 'survey'].includes(document.documentType)) {
    return null;
  }

  const handleAddStep = () => {
    const stepCount = steps.length + 1;
    const newStepId = `step_${Date.now()}`;

    if (document.documentType === 'tour') {
      const newStepNode: ComponentNode = {
        id: newStepId,
        type: 'TourStep',
        name: `Step ${stepCount}: Guide`,
        target: {
          selector: '#target-element',
          placement: 'bottom',
          offset: 12,
          highlight: true,
          spotlightPadding: 8,
          fallbackBehavior: 'center',
        },
        props: {
          stepNumber: stepCount,
          title: `Step ${stepCount}: New Walkthrough Step`,
          description: 'Customize this step description or change its target anchor selector.',
          prevButtonText: 'Back',
          nextButtonText: stepCount === 1 ? 'Next →' : 'Complete 🎉',
          skipButtonText: 'Skip',
        },
        styles: {
          width: '380px',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          paddingLeft: '24px',
          paddingRight: '24px',
          paddingTop: '20px',
          paddingBottom: '20px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
        },
        children: [],
      };
      insertNode(document.rootNode.id, newStepNode);
    } else if (document.documentType === 'demo') {
      const newScreenNode: ComponentNode = {
        id: `screen_${Date.now()}`,
        type: 'DemoScreen',
        name: `Screen ${stepCount}`,
        props: {
          title: `Screen ${stepCount}`,
          screenNumber: stepCount,
        },
        styles: { width: '100%', minHeight: '520px', position: 'relative' },
        children: [],
      };
      insertNode(document.rootNode.id, newScreenNode);
    } else if (document.documentType === 'checklist') {
      const newItemNode: ComponentNode = {
        id: `chk_item_${Date.now()}`,
        type: 'ChecklistItem',
        name: `Task ${stepCount}`,
        props: {
          title: `Milestone ${stepCount}: Complete action`,
          description: 'Help the user achieve their next activation milestone.',
          isCompleted: false,
        },
        styles: {},
        children: [],
      };
      insertNode(document.rootNode.id, newItemNode);
    }
  };

  return (
    <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-slate-200/90 dark:border-slate-700/80 shadow-2xl text-xs font-sans select-none animate-in fade-in duration-150 max-w-2xl overflow-x-auto no-scrollbar">
      
      {/* Sequencer Label & Play Simulation Button */}
      <div className="flex items-center gap-2 pr-2 border-r border-slate-200 dark:border-slate-800 shrink-0">
        <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800 dark:text-slate-100">
          <Compass className="w-4 h-4 text-indigo-500 animate-pulse" />
          <span className="hidden sm:inline">Flow Steps</span>
          <span className="px-1.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-[10px] font-mono">
            {steps.length}
          </span>
        </div>

        {steps.length > 0 && (
          <button
            type="button"
            onClick={startTourPlayback}
            className="flex items-center gap-1 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-bold shadow-xs hover:shadow-indigo-500/20 transition-all"
            title="Simulate interactive flow"
          >
            <Play className="w-3 h-3 fill-white" />
            <span className="hidden sm:inline">Simulate</span>
          </button>
        )}
      </div>

      {/* Step Cards Carousel */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
        {steps.map((step, idx) => {
          const isSelected = selectedNodeId === step.id;
          const targetSelector = step.target?.selector || step.props?.targetSelector;

          return (
            <div
              key={step.id}
              onClick={() => selectNode(step.id)}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border cursor-pointer transition-all shrink-0 group ${
                isSelected
                  ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/60 ring-2 ring-indigo-600/30 text-indigo-700 dark:text-indigo-300 font-bold shadow-xs'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-850 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0 ${
                isSelected
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}>
                {idx + 1}
              </div>

              <div className="truncate max-w-[100px] text-left">
                <span className="text-[11px] font-bold block truncate leading-tight">
                  {step.name || `Step ${idx + 1}`}
                </span>
                {targetSelector && (
                  <span className="text-[9px] text-slate-400 font-mono block truncate leading-tight">
                    {targetSelector}
                  </span>
                )}
              </div>

              {/* Quick Step Actions on Hover */}
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    duplicateNode(step.id);
                  }}
                  className="p-1 hover:text-indigo-600 text-slate-400 rounded"
                  title="Duplicate Step"
                >
                  <Copy className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNode(step.id);
                  }}
                  className="p-1 hover:text-red-600 text-slate-400 rounded"
                  title="Delete Step"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}

        {/* Add Step Button */}
        <button
          type="button"
          onClick={handleAddStep}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600 dark:hover:text-indigo-400 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 text-[11px] font-bold transition-all shrink-0"
          title="Add next step to this flow"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Add Step</span>
        </button>
      </div>

    </div>
  );
};
