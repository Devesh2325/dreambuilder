import React, { useMemo, useRef, useState } from 'react';
import { hasToken, VariableDef } from '../core/variables';
import { projectVariableDefs } from '../templates';
import { templateFromProject } from '../templates/library';
import { fieldClass, labelClass } from './fields';
import { SaveToLibrary } from './SaveToLibrary';
import { useStudio } from './store';
import { NewVariable } from './VariablesPanel';

/** Text and pictures on the page that aren't variables yet, which an admin may want to be. */
interface Candidate {
  id: string;
  documentId: string;
  nodeId: string;
  prop: string;
  type: VariableDef['type'];
  preview: string;
  suggested: string;
}

const CANDIDATE_LIMIT = 40;
const CANDIDATE_PROPS: Record<string, { prop: string; type: VariableDef['type']; name: string }> = {
  Heading: { prop: 'text', type: 'text', name: 'Heading' },
  Text: { prop: 'text', type: 'longtext', name: 'Text' },
  Button: { prop: 'text', type: 'text', name: 'Button label' },
  Image: { prop: 'src', type: 'image', name: 'Image' },
};

interface Choice {
  label: string;
  help: string;
  required: boolean;
  ask: boolean;
}

const toChoice = (def: VariableDef): Choice => ({ label: def.label, help: def.help ?? '', required: Boolean(def.required), ask: def.askOnCreate !== false });

/** Applies an admin's choices. Exported so the rules can be checked directly. */
export const applyChoices = (defs: VariableDef[], choices: Record<string, Choice>): VariableDef[] =>
  defs.map((def) => {
    const choice = choices[def.key];
    if (!choice) return def;
    return {
      ...def,
      label: choice.label.trim() || def.label,
      help: choice.help.trim() || undefined,
      required: choice.required,
      askOnCreate: choice.ask ? undefined : false,
    };
  });

/** Saving a template is when an admin decides what its users get to fill in. */
export const SaveTemplateDialog: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const project = useStudio((s) => s.project);
  const draft = useStudio((s) => s.draft);
  const documents = useStudio((s) => s.documents);
  const [choices, setChoices] = useState<Record<string, Choice>>({});
  const [promoted, setPromoted] = useState<Record<string, string>>({});
  // Read when saving, which happens inside a request that outlives this render.
  const latest = useRef({ choices, promoted });
  latest.current = { choices, promoted };

  const defs = project && draft ? projectVariableDefs(project.templateId, draft.settings) : [];
  const candidates = useMemo<Candidate[]>(() => {
    const found: Candidate[] = [];
    for (const doc of documents) {
      for (const node of Object.values(doc.content.nodes)) {
        const rule = CANDIDATE_PROPS[node.type];
        const value = rule ? node.props[rule.prop] : undefined;
        if (!rule || typeof value !== 'string' || !value.trim() || hasToken(value)) continue;
        found.push({
          id: `${doc.id}:${node.id}`,
          documentId: doc.id,
          nodeId: node.id,
          prop: rule.prop,
          type: rule.type,
          preview: rule.type === 'image' ? 'A picture on the page' : value,
          suggested: rule.type === 'image' ? rule.name : value.length <= 30 ? value : rule.name,
        });
      }
    }
    return found.slice(0, CANDIDATE_LIMIT);
    // Only worked out once: promoting text below changes the documents, and rows shouldn't jump.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!project || !draft) return null;
  const choiceFor = (def: VariableDef) => choices[def.key] ?? toChoice(def);
  const setChoice = (def: VariableDef, patch: Partial<Choice>) => setChoices((current) => ({ ...current, [def.key]: { ...choiceFor(def), ...patch } }));

  const extra = (
    <div className="space-y-5">
      <section aria-label="Template variables" className="space-y-2">
        <div>
          <h3 className="text-sm font-bold">What can people change?</h3>
          <p className="text-[13px] text-slate-500 dark:text-slate-400">These become the form people fill in when they use this template.</p>
        </div>
        {defs.length === 0 && <p className="text-[13px] text-slate-500 dark:text-slate-400">No variables yet. Add one below, or tick some text further down.</p>}
        <ul className="space-y-2">
          {defs.map((def) => {
            const choice = choiceFor(def);
            return (
              <li key={def.key} className="rounded-lg border border-slate-200 dark:border-slate-700 p-2.5 space-y-2">
                <div className="flex items-center gap-2">
                  <input aria-label={`Label for ${def.label}`} className={fieldClass} value={choice.label} onChange={(event) => setChoice(def, { label: event.target.value })} />
                  {def.type === 'list' && <span className="shrink-0 text-xs px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">repeats</span>}
                </div>
                <input aria-label={`Hint for ${def.label}`} placeholder="A hint for whoever fills this in (optional)" className={fieldClass} value={choice.help} onChange={(event) => setChoice(def, { help: event.target.value })} />
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[13px]">
                  <label className="flex items-center gap-1.5"><input type="checkbox" aria-label={`Ask for ${def.label} when creating`} checked={choice.ask} onChange={(event) => setChoice(def, { ask: event.target.checked })} />Ask when creating</label>
                  {def.type !== 'list' && <label className="flex items-center gap-1.5"><input type="checkbox" aria-label={`${def.label} is required`} checked={choice.required} onChange={(event) => setChoice(def, { required: event.target.checked })} />Required</label>}
                </div>
              </li>
            );
          })}
        </ul>
        <NewVariable
          taken={defs.map((def) => def.key)}
          onAdd={({ def, value }) => useStudio.getState().updateDraft((d) => {
            d.settings.variableDefs = [...(d.settings.variableDefs ?? []), def];
            d.variables[def.key] = value;
          })}
        />
      </section>

      {candidates.length > 0 && (
        <section aria-label="Text on the page" className="space-y-2">
          <div>
            <h3 className="text-sm font-bold">Turn what's on the page into variables</h3>
            <p className="text-[13px] text-slate-500 dark:text-slate-400">Tick anything people should be able to replace.</p>
          </div>
          <ul className="max-h-56 overflow-y-auto space-y-1 rounded-lg border border-slate-200 dark:border-slate-700 p-2">
            {candidates.map((candidate) => {
              const isOn = promoted[candidate.id] !== undefined;
              return (
                <li key={candidate.id} className="text-[13px]">
                  <label className="flex items-start gap-2 py-1">
                    <input
                      type="checkbox"
                      className="mt-0.5"
                      checked={isOn}
                      aria-label={`Make "${candidate.preview}" a variable`}
                      onChange={(event) => setPromoted((current) => {
                        const next = { ...current };
                        if (event.target.checked) next[candidate.id] = candidate.suggested;
                        else delete next[candidate.id];
                        return next;
                      })}
                    />
                    <span className="min-w-0 truncate">{candidate.preview}</span>
                  </label>
                  {isOn && (
                    <label className={`${labelClass} ml-6 mb-1`}>Call it
                      <input className={`${fieldClass} mt-1`} value={promoted[candidate.id]} onChange={(event) => setPromoted((current) => ({ ...current, [candidate.id]: event.target.value }))} />
                    </label>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );

  return (
    <SaveToLibrary
      kind="template"
      initialName={draft.title}
      extra={extra}
      buildDefinition={async () => {
        const store = useStudio.getState();
        for (const candidate of candidates) {
          const label = latest.current.promoted[candidate.id];
          if (label !== undefined) store.promoteToVariable(candidate.documentId, candidate.nodeId, candidate.prop, label.trim() || candidate.suggested, candidate.type);
        }
        await store.saveNow();
        const state = useStudio.getState();
        const current = state.draft!;
        return templateFromProject({
          type: project.type,
          theme: current.theme,
          variables: current.variables,
          settings: current.settings,
          defs: applyChoices(projectVariableDefs(project.templateId, current.settings), latest.current.choices),
          documents: state.documents,
        });
      }}
      onClose={onClose}
    />
  );
};
