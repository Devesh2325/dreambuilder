import React, { useState } from 'react';
import { Lightbulb, Plus, Trash2 } from 'lucide-react';
import { DocContent } from '../core/schema';
import { validateValues } from '../core/validation';
import { defaultValues, tokensIn, VariableDef, VariableType } from '../core/variables';
import { VariableField, VariableForm } from '../app/shared/VariableForm';
import { projectVariableDefs } from '../templates';
import { fieldClass, labelClass } from './fields';
import { useStudio } from './store';

const TYPES: { value: VariableType; label: string; example: string }[] = [
  { value: 'text', label: 'A short piece of text', example: 'A phone number, or a sale name' },
  { value: 'longtext', label: 'A paragraph', example: 'An address, or a short description' },
  { value: 'image', label: 'A picture', example: 'A logo, or a team photo' },
  { value: 'url', label: 'A web address', example: 'Your booking page' },
  { value: 'color', label: 'A color', example: 'A color for your offers' },
  { value: 'number', label: 'A number', example: 'A price, or a discount' },
  { value: 'boolean', label: 'Yes or no', example: 'Whether an offer is on' },
];

/** Keys end up inside {{tokens}}, so they only use the characters tokens allow. */
export function variableKey(label: string, taken: string[]): string {
  const base = `my.${label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'value'}`;
  let key = base;
  for (let n = 2; taken.includes(key); n += 1) key = `${base}_${n}`;
  return key;
}

/** How many blocks use each variable, so people can see what a change will affect. */
export function usageCounts(contents: DocContent[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const content of contents) {
    for (const node of Object.values(content.nodes)) {
      const used = tokensIn([node.props, node.styles, node.responsive]);
      if (node.showIf) used.add(node.showIf.replace(/^!/, ''));
      if (node.repeat) used.add(node.repeat.list);
      for (const key of used) counts[key] = (counts[key] ?? 0) + 1;
    }
  }
  return counts;
}

const usageHint = (count: number | undefined) =>
  count ? `Used in ${count} ${count === 1 ? 'place' : 'places'}` : 'Not used yet';

const NewVariable: React.FC<{ taken: string[]; onAdd: (def: VariableDef, value: string) => void }> = ({ taken, onAdd }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [value, setValue] = useState('');
  const [type, setType] = useState<VariableType>('text');
  const chosen = TYPES.find((option) => option.value === type)!;
  const takesTextValue = type === 'text' || type === 'longtext' || type === 'url' || type === 'number';

  if (!isOpen) {
    return (
      <button type="button" onClick={() => setIsOpen(true)} className="w-full h-9 inline-flex items-center justify-center gap-1.5 text-[13px] font-semibold rounded-lg border border-dashed border-slate-300 dark:border-slate-600 text-indigo-600 dark:text-indigo-400 hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors">
        <Plus className="w-4 h-4" aria-hidden="true" />
        New variable
      </button>
    );
  }
  return (
    <form
      className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (!label.trim()) return;
        onAdd({ key: variableKey(label, taken), label: label.trim(), type, group: 'Your variables' }, takesTextValue ? value : '');
        setLabel('');
        setValue('');
        setIsOpen(false);
      }}
    >
      <label className={labelClass}>What is it called?
        <input required autoFocus maxLength={60} placeholder="Phone number" className={`${fieldClass} mt-1`} value={label} onChange={(event) => setLabel(event.target.value)} />
      </label>
      <label className={labelClass}>What kind of thing is it?
        <select className={`${fieldClass} mt-1`} value={type} onChange={(event) => setType(event.target.value as VariableType)}>
          {TYPES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
        <span className="mt-1 block font-normal text-xs text-slate-500 dark:text-slate-400">For example: {chosen.example}.</span>
      </label>
      {takesTextValue && (
        <label className={labelClass}>What is its value? (optional)
          <input className={`${fieldClass} mt-1`} value={value} onChange={(event) => setValue(event.target.value)} />
        </label>
      )}
      <div className="flex gap-2">
        <button type="submit" className="flex-1 h-9 text-[13px] font-semibold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700">Add variable</button>
        <button type="button" className="h-9 px-3 text-[13px] font-semibold rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => setIsOpen(false)}>Cancel</button>
      </div>
    </form>
  );
};

/** The Variables tool: every value that fills the template, in one place. */
export const VariablesPanel: React.FC = () => {
  const draft = useStudio((s) => s.draft);
  const project = useStudio((s) => s.project);
  const readOnly = useStudio((s) => s.readOnly);
  const documents = useStudio((s) => s.documents);
  const { updateDraft } = useStudio.getState();
  const [justAdded, setJustAdded] = useState<string | null>(null);
  if (!draft || !project) return null;

  const defs = projectVariableDefs(project.templateId, draft.settings);
  const own = draft.settings.variableDefs ?? [];
  const fromTemplate = defs.filter((def) => !own.some((other) => other.key === def.key));
  const { errors } = validateValues(defs, draft.variables);
  const counts = usageCounts(documents.map((doc) => doc.content));
  const hints = Object.fromEntries(defs.map((def) => [def.key, usageHint(counts[def.key])]));

  const remove = (def: VariableDef) => {
    if (counts[def.key] && !window.confirm(`"${def.label}" is used in ${counts[def.key]} ${counts[def.key] === 1 ? 'place' : 'places'}. Those places will go blank. Remove it?`)) return;
    updateDraft((d) => {
      d.settings.variableDefs = (d.settings.variableDefs ?? []).filter((other) => other.key !== def.key);
      delete d.variables[def.key];
    });
  };

  return (
    <div className="p-3 space-y-6">
      <div className="rounded-lg bg-indigo-50 dark:bg-indigo-500/10 p-3 text-[13px] text-indigo-950 dark:text-indigo-100">
        <p className="flex items-center gap-1.5 font-semibold">
          <Lightbulb className="w-4 h-4 shrink-0" aria-hidden="true" />
          One change, updated everywhere
        </p>
        <p className="mt-1">Variables are things you use more than once, like your business name. Change one here, and every place that uses it updates by itself.</p>
      </div>
      {fromTemplate.length > 0 && (
        <fieldset disabled={readOnly}>
          <VariableForm
            defs={fromTemplate}
            values={draft.variables}
            errors={errors}
            hints={hints}
            onChange={(values) => updateDraft((d) => { d.variables = values; }, 'variables')}
          />
        </fieldset>
      )}
      <section aria-label="Your variables" className="space-y-4">
        {own.length > 0 && <h2 className="text-sm font-bold text-slate-900 dark:text-white">Your variables</h2>}
        <fieldset disabled={readOnly} className="space-y-4">
          {own.map((def) => (
            <div key={def.key} className="relative">
              <VariableField
                def={def}
                fieldId={`var-${def.key.replace(/\W/g, '-')}`}
                value={draft.variables[def.key]}
                error={errors[def.key]}
                errors={errors}
                errorPrefix={def.key}
                hint={hints[def.key]}
                onChange={(next) => updateDraft((d) => { d.variables[def.key] = next; }, `variables:${def.key}`)}
              />
              {!readOnly && (
                <button type="button" aria-label={`Remove ${def.label}`} title="Remove" className="absolute right-0 top-0 p-0.5 text-slate-400 hover:text-rose-600" onClick={() => remove(def)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </fieldset>
        {justAdded && (
          <p role="status" className="text-[13px] rounded-lg px-2.5 py-2 bg-emerald-50 text-emerald-900 dark:bg-emerald-500/10 dark:text-emerald-200">
            <strong>{justAdded}</strong> is ready. To use it, click some text on the canvas, then choose it under <strong>+ Insert a variable</strong>.
          </p>
        )}
        {!readOnly && (
          <NewVariable
            taken={defs.map((def) => def.key)}
            onAdd={(def, value) => {
              updateDraft((d) => {
                d.settings.variableDefs = [...(d.settings.variableDefs ?? []), def];
                d.variables[def.key] = value || defaultValues([def])[def.key];
              });
              setJustAdded(def.label);
            }}
          />
        )}
      </section>
    </div>
  );
};
