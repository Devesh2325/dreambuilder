import React from 'react';
import { ChevronLeft, ChevronRight, FileText, Plus, Trash2 } from 'lucide-react';
import { pagesOf } from '../experience/SiteView';
import { StepItem, StepSet } from './steps';
import { useStudio } from './store';

const pill = 'h-8 px-3 rounded-lg text-[13px] font-medium whitespace-nowrap transition-colors';
const idle = 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800';
const current = 'bg-indigo-600 text-white shadow-sm';
const iconButton = 'w-8 h-8 shrink-0 flex items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent';

/** The position of a repeated step inside its list, from the end of its key. */
const repeatIndex = (step: StepItem) => Number(step.key.slice(step.key.lastIndexOf('__') + 2));

/** Pages and steps above the canvas, so only one is on screen at a time. */
export const StepBar: React.FC<{ set: StepSet | null; active: StepItem | null }> = ({ set, active }) => {
  const documents = useStudio((s) => s.documents);
  const activeDocumentId = useStudio((s) => s.activeDocumentId);
  const readOnly = useStudio((s) => s.readOnly);
  const { setActiveDocument, setActiveStep, select } = useStudio.getState();
  const pages = pagesOf(documents);
  const showPages = pages.length > 1;
  if (!showPages && !set) return null;

  const index = set && active ? set.steps.findIndex((step) => step.key === active.key) : -1;
  const open = (step: StepItem) => {
    setActiveStep(step.key);
    // A selection left on another step would pull the canvas straight back to it.
    select(null);
  };

  const add = () => {
    if (!set || !active) return;
    const state = useStudio.getState();
    if (!active.isRepeated) {
      state.setActiveStep(null);
      state.duplicateBlock(active.sourceId);
      return;
    }
    // Steps from a list are added to that list, starting as a copy of this one.
    const list = state.getNode(active.sourceId)?.repeat?.list;
    if (!list) return;
    const items = state.draft?.variables[list];
    if (!Array.isArray(items)) return;
    state.updateDraft((d) => {
      (d.variables[list] as unknown[]).splice(repeatIndex(active) + 1, 0, structuredClone(items[repeatIndex(active)]));
    });
    state.setActiveStep(`${active.sourceId}__${repeatIndex(active) + 1}`);
    state.select(null);
  };

  const remove = () => {
    if (!set || !active || set.steps.length < 2) return;
    const state = useStudio.getState();
    const neighbour = set.steps[index + 1] ?? set.steps[index - 1];
    if (active.isRepeated) {
      const list = state.getNode(active.sourceId)?.repeat?.list;
      if (!list) return;
      state.updateDraft((d) => {
        (d.variables[list] as unknown[]).splice(repeatIndex(active), 1);
      });
      // Later items in the list shift down, so the same key now shows the next one.
      state.setActiveStep(`${active.sourceId}__${Math.min(repeatIndex(active), set.steps.length - 2)}`);
    } else {
      state.removeBlock(active.sourceId);
      state.setActiveStep(neighbour.key);
    }
    state.select(null);
  };

  return (
    <div data-testid="step-bar" className="shrink-0 flex items-center gap-3 h-12 px-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
      {showPages && (
        <div role="group" aria-label="Pages" className="flex items-center gap-1">
          <FileText className="w-4 h-4 mr-1 shrink-0 text-slate-400" aria-hidden="true" />
          {pages.map((page) => (
            <button key={page.id} type="button" aria-current={page.id === activeDocumentId ? 'page' : undefined} className={`${pill} ${page.id === activeDocumentId ? current : idle}`} onClick={() => setActiveDocument(page.id)}>
              {page.title}
            </button>
          ))}
        </div>
      )}
      {showPages && set && <span className="w-px h-6 shrink-0 bg-slate-200 dark:bg-slate-700" aria-hidden="true" />}
      {set && (
        <div role="group" aria-label={`${set.label}s`} className="flex items-center gap-1">
          <button type="button" aria-label={`Previous ${set.label.toLowerCase()}`} title={`Previous ${set.label.toLowerCase()}`} disabled={index <= 0} className={iconButton} onClick={() => open(set.steps[index - 1])}>
            <ChevronLeft className="w-4 h-4" />
          </button>
          {set.steps.map((step) => (
            <button key={step.key} type="button" aria-current={step.key === active?.key ? 'step' : undefined} className={`${pill} ${step.key === active?.key ? current : idle}`} onClick={() => open(step)}>
              {step.label}
            </button>
          ))}
          <button type="button" aria-label={`Next ${set.label.toLowerCase()}`} title={`Next ${set.label.toLowerCase()}`} disabled={index === set.steps.length - 1} className={iconButton} onClick={() => open(set.steps[index + 1])}>
            <ChevronRight className="w-4 h-4" />
          </button>
          {!readOnly && (
            <>
              <button type="button" className={`${pill} inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50`} onClick={add}>
                <Plus className="w-4 h-4" aria-hidden="true" />
                Add {set.label.toLowerCase()}
              </button>
              <button type="button" aria-label={`Delete this ${set.label.toLowerCase()}`} title={`Delete this ${set.label.toLowerCase()}`} disabled={set.steps.length < 2} className={`${iconButton} hover:!text-rose-600`} onClick={remove}>
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};
