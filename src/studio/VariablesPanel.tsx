import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { validateValues } from '../core/validation';
import { defaultValues, tokensIn, VariableDef, VariableType } from '../core/variables';
import { VariableField, VariableForm } from '../app/shared/VariableForm';
import { projectVariableDefs } from '../templates';
import { fieldClass, labelClass } from './fields';
import { useStudio } from './store';

const TYPES: { value: VariableType; label: string }[] = [
  { value: 'text', label: 'Short text' },
  { value: 'longtext', label: 'Long text' },
  { value: 'image', label: 'Image' },
  { value: 'url', label: 'Link' },
  { value: 'color', label: 'Color' },
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'Yes or no' },
];

/** Keys end up inside {{tokens}}, so they only use the characters tokens allow. */
export function variableKey(label: string, taken: string[]): string {
  const base = `my.${label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'value'}`;
  let key = base;
  for (let n = 2; taken.includes(key); n += 1) key = `${base}_${n}`;
  return key;
}

const NewVariable: React.FC<{ taken: string[]; onAdd: (def: VariableDef) => void }> = ({ taken, onAdd }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [type, setType] = useState<VariableType>('text');

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
        onAdd({ key: variableKey(label, taken), label: label.trim(), type, group: 'Your variables' });
        setLabel('');
        setIsOpen(false);
      }}
    >
      <label className={labelClass}>Name
        <input required autoFocus maxLength={60} placeholder="Phone number" className={`${fieldClass} mt-1`} value={label} onChange={(event) => setLabel(event.target.value)} />
      </label>
      <label className={labelClass}>Type
        <select className={`${fieldClass} mt-1`} value={type} onChange={(event) => setType(event.target.value as VariableType)}>
          {TYPES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </label>
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
  if (!draft || !project) return null;

  const defs = projectVariableDefs(project.templateId, draft.settings);
  const own = draft.settings.variableDefs ?? [];
  const fromTemplate = defs.filter((def) => !own.some((other) => other.key === def.key));
  const { errors } = validateValues(defs, draft.variables);

  const remove = (def: VariableDef) => {
    const isUsed = documents.some((doc) => tokensIn(Object.values(doc.content.nodes).map((node) => [node.props, node.styles])).has(def.key));
    if (isUsed && !window.confirm(`"${def.label}" is used in this project. Those places will go blank. Remove it?`)) return;
    updateDraft((d) => {
      d.settings.variableDefs = (d.settings.variableDefs ?? []).filter((other) => other.key !== def.key);
      delete d.variables[def.key];
    });
  };

  return (
    <div className="p-3 space-y-6">
      <p className="text-[13px] text-slate-500 dark:text-slate-400">Change a value once and it updates everywhere it's used.</p>
      {fromTemplate.length > 0 && (
        <fieldset disabled={readOnly}>
          <VariableForm
            defs={fromTemplate}
            values={draft.variables}
            errors={errors}
            onChange={(values) => updateDraft((d) => { d.variables = values; }, 'variables')}
          />
        </fieldset>
      )}
      <section aria-label="Your variables" className="space-y-4">
        {fromTemplate.length > 0 && own.length > 0 && <h2 className="text-sm font-bold text-slate-900 dark:text-white">Your variables</h2>}
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
        {!readOnly && (
          <>
            <NewVariable
              taken={defs.map((def) => def.key)}
              onAdd={(def) => updateDraft((d) => {
                d.settings.variableDefs = [...(d.settings.variableDefs ?? []), def];
                d.variables[def.key] = defaultValues([def])[def.key];
              })}
            />
            <p className="text-xs text-slate-500 dark:text-slate-400">Add one to any text or link field with <strong>+ Insert a variable</strong> in the Content tab.</p>
          </>
        )}
      </section>
    </div>
  );
};
