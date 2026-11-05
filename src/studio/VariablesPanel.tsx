import React, { useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Globe2, Lightbulb, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { DocContent } from '../core/schema';
import { validateValues } from '../core/validation';
import { defaultValues, VariableDef, VariableType } from '../core/variables';
import { useServices } from '../app/session';
import { BusyLabel, ErrorNote, errorMessage } from '../app/shared/ui';
import { VariableField, VariableForm } from '../app/shared/VariableForm';
import { useWorkspace } from '../app/workspace';
import { projectVariableDefs } from '../templates';
import { GlobalVariable } from '../types/auth';
import { fieldClass, labelClass } from './fields';
import { useStudio, variableKey } from './store';
import { nodesUsingVariable, variableMatches, variablesOfNode } from './variableUsage';

export { variableKey };

const TYPES: { value: VariableType; label: string; example: string }[] = [
  { value: 'text', label: 'A short piece of text', example: 'A phone number, or a sale name' },
  { value: 'longtext', label: 'A paragraph', example: 'An address, or a short description' },
  { value: 'image', label: 'A picture', example: 'A logo, or a team photo' },
  { value: 'url', label: 'A web address', example: 'Your booking page' },
  { value: 'color', label: 'A color', example: 'A color for your offers' },
  { value: 'number', label: 'A number', example: 'A price, or a discount' },
  { value: 'boolean', label: 'Yes or no', example: 'Whether an offer is on' },
  { value: 'list', label: 'A repeating list', example: 'Team members, prices or questions, where each has the same parts' },
];

const FIELD_TYPES = TYPES.filter((type) => type.value !== 'list' && type.value !== 'boolean');

const slug = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

/** How many blocks use each variable, so people can see what a change will affect. */
export function usageCounts(contents: DocContent[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const content of contents) {
    for (const node of Object.values(content.nodes)) {
      for (const key of variablesOfNode(node)) counts[key] = (counts[key] ?? 0) + 1;
    }
  }
  return counts;
}

const usageHint = (count: number | undefined) =>
  count ? `Used in ${count} ${count === 1 ? 'place' : 'places'}` : 'Not used yet';

interface ItemField {
  label: string;
  type: VariableType;
}

/** Fields become the parts of each list item, so their keys must stay valid tokens. */
export const itemFieldsFrom = (fields: ItemField[]): VariableDef[] => {
  const taken: string[] = [];
  return fields.filter((field) => field.label.trim()).map((field) => {
    const base = slug(field.label).replace(/^[^a-z]+/, '') || 'part';
    let key = base;
    for (let n = 2; taken.includes(key); n += 1) key = `${base}_${n}`;
    taken.push(key);
    return { key, label: field.label.trim(), type: field.type };
  });
};

const ItemFieldsEditor: React.FC<{ fields: ItemField[]; onChange: (fields: ItemField[]) => void }> = ({ fields, onChange }) => (
  <fieldset className="min-w-0 space-y-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 p-2.5">
    <legend className={`${labelClass} float-left mb-1`}>What does each item have?</legend>
    <div className="clear-both space-y-2">
      {fields.map((field, index) => (
        <div key={index} className="flex items-center gap-1">
          <input aria-label={`Part ${index + 1} name`} placeholder={index === 0 ? 'Name' : 'Photo'} className={`${fieldClass} min-w-0`} value={field.label} onChange={(event) => onChange(fields.map((other, i) => (i === index ? { ...other, label: event.target.value } : other)))} />
          <select aria-label={`Part ${index + 1} type`} className={`${fieldClass} !w-24 shrink-0`} value={field.type} onChange={(event) => onChange(fields.map((other, i) => (i === index ? { ...other, type: event.target.value as VariableType } : other)))}>
            {FIELD_TYPES.map((option) => <option key={option.value} value={option.value}>{option.value === 'text' ? 'Text' : option.value === 'longtext' ? 'Paragraph' : option.value === 'image' ? 'Picture' : option.value === 'url' ? 'Link' : option.value === 'color' ? 'Color' : 'Number'}</option>)}
          </select>
          {fields.length > 1 && (
            <button type="button" aria-label={`Remove part ${index + 1}`} className="p-1 shrink-0 text-slate-400 hover:text-rose-600" onClick={() => onChange(fields.filter((_, i) => i !== index))}>
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ))}
    </div>
    <button type="button" className="text-[13px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline" onClick={() => onChange([...fields, { label: '', type: 'text' }])}>+ Add a part</button>
  </fieldset>
);

export interface NewVariableResult {
  def: VariableDef;
  value: unknown;
  isGlobal: boolean;
}

/** Everything needed to make a variable, in plain words. Used here and when saving a template. */
export const NewVariable: React.FC<{ taken: string[]; canBeGlobal?: boolean; onAdd: (result: NewVariableResult) => void | Promise<void> }> = ({ taken, canBeGlobal, onAdd }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [value, setValue] = useState('');
  const [type, setType] = useState<VariableType>('text');
  const [isGlobal, setIsGlobal] = useState(false);
  const [fields, setFields] = useState<ItemField[]>([{ label: '', type: 'text' }]);
  const [error, setError] = useState<string | null>(null);
  const chosen = TYPES.find((option) => option.value === type)!;
  const takesTextValue = type === 'text' || type === 'longtext' || type === 'url' || type === 'number';
  const isList = type === 'list';

  const reset = () => {
    setLabel('');
    setValue('');
    setType('text');
    setIsGlobal(false);
    setFields([{ label: '', type: 'text' }]);
    setError(null);
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <button type="button" onClick={() => setIsOpen(true)} className="w-full h-9 inline-flex items-center justify-center gap-1.5 text-[13px] font-semibold rounded-lg border border-dashed border-slate-300 dark:border-slate-600 text-indigo-600 dark:text-indigo-400 hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors">
        <Plus className="w-4 h-4" aria-hidden="true" />
        New variable
      </button>
    );
  }

  const save = async () => {
    if (!label.trim()) return;
    const itemFields = itemFieldsFrom(fields);
    if (isList && itemFields.length === 0) {
      setError('Name at least one part, so each item has something in it.');
      return;
    }
    const global = isGlobal && !isList;
    const def: VariableDef = isList
      ? { key: variableKey(label, taken), label: label.trim(), type, group: 'Your variables', itemFields, minItems: 0, maxItems: 50 }
      : { key: variableKey(label, taken, global ? 'global' : 'my'), label: label.trim(), type, group: 'Your variables' };
    const initial = isList ? [defaultValues(itemFields)] : takesTextValue && value ? value : defaultValues([def])[def.key];
    try {
      await onAdd({ def, value: initial, isGlobal: global });
      reset();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  // A div, since this also appears inside the form that saves a template.
  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 space-y-3">
      <label className={labelClass}>What is it called?
        <input autoFocus maxLength={60} placeholder={isList ? 'Team members' : 'Phone number'} className={`${fieldClass} mt-1`} value={label} onChange={(event) => setLabel(event.target.value)} />
      </label>
      <label className={labelClass}>What kind of thing is it?
        <select className={`${fieldClass} mt-1`} value={type} onChange={(event) => setType(event.target.value as VariableType)}>
          {TYPES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
        <span className="mt-1 block font-normal text-xs text-slate-500 dark:text-slate-400">For example: {chosen.example}.</span>
      </label>
      {isList && <ItemFieldsEditor fields={fields} onChange={setFields} />}
      {takesTextValue && (
        <label className={labelClass}>What is its value? (optional)
          <input className={`${fieldClass} mt-1`} value={value} onChange={(event) => setValue(event.target.value)} />
        </label>
      )}
      {canBeGlobal && !isList && (
        <label className={`${labelClass} flex items-start gap-2`}>
          <input type="checkbox" className="mt-0.5" checked={isGlobal} onChange={(event) => setIsGlobal(event.target.checked)} />
          <span>Global: share it with every project in this workspace</span>
        </label>
      )}
      {error && <p role="alert" className="text-[13px] text-rose-600 dark:text-rose-400">{error}</p>}
      <div className="flex gap-2">
        <button type="button" disabled={!label.trim()} className="flex-1 h-9 text-[13px] font-semibold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50" onClick={() => void save()}>Save variable</button>
        <button type="button" className="h-9 px-3 text-[13px] font-semibold rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" onClick={reset}>Cancel</button>
      </div>
    </div>
  );
};

/** Renames a variable or changes its parts. Its key stays, so everything using it keeps working. */
const EditVariable: React.FC<{ def: VariableDef; onSave: (patch: Partial<VariableDef>) => void; onClose: () => void }> = ({ def, onSave, onClose }) => {
  const [label, setLabel] = useState(def.label);
  const [help, setHelp] = useState(def.help ?? '');
  const [fields, setFields] = useState<ItemField[]>((def.itemFields ?? []).map((field) => ({ label: field.label, type: field.type })));
  return (
    <div className="mb-2 rounded-lg border border-indigo-200 dark:border-indigo-500/40 p-2.5 space-y-2">
      <label className={labelClass}>Name
        <input aria-label="Variable name" className={`${fieldClass} mt-1`} value={label} onChange={(event) => setLabel(event.target.value)} />
      </label>
      <label className={labelClass}>Hint for whoever fills this in (optional)
        <input className={`${fieldClass} mt-1`} value={help} onChange={(event) => setHelp(event.target.value)} />
      </label>
      {def.type === 'list' && <ItemFieldsEditor fields={fields} onChange={setFields} />}
      <div className="flex gap-2">
        <button
          type="button"
          disabled={!label.trim()}
          className="h-8 px-3 text-[13px] font-semibold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
          onClick={() => {
            const named = itemFieldsFrom(fields);
            onSave({
              label: label.trim(),
              help: help.trim() || undefined,
              // Parts that keep their name keep their key, so filled-in items stay as they are.
              ...(def.type === 'list' ? { itemFields: named.map((field) => def.itemFields?.find((old) => old.label === field.label) ?? field) } : {}),
            });
            onClose();
          }}
        >
          Save changes
        </button>
        <button type="button" className="h-8 px-3 text-[13px] font-semibold rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
};

const GlobalRow: React.FC<{ variable: GlobalVariable; canEdit: boolean; hint: string; onShow?: () => void; onSave: (value: string) => Promise<void>; onRemove: () => void }> = ({ variable, canEdit, hint, onShow, onSave, onRemove }) => {
  const [value, setValue] = useState(String(variable.value ?? ''));
  const save = useMutation({ mutationFn: () => onSave(value) });
  const isChanged = value !== String(variable.value ?? '');
  const id = `global-${variable.key.replace(/\W/g, '-')}`;
  return (
    <div className="relative">
      <VariableField
        def={{ key: variable.key, label: variable.label, type: variable.type }}
        fieldId={id}
        value={value}
        errors={{}}
        errorPrefix={variable.key}
        hint={hint}
        onShow={onShow}
        onChange={(next) => setValue(String(next ?? ''))}
      />
      {canEdit && (
        <button type="button" aria-label={`Remove ${variable.label}`} title="Remove" className="absolute right-0 top-0 p-0.5 text-slate-400 hover:text-rose-600" onClick={onRemove}>
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
      {canEdit && isChanged && (
        <button type="button" disabled={save.isPending} className="mt-1 h-8 px-3 inline-flex items-center gap-1.5 text-[13px] font-semibold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60" onClick={() => save.mutate()}>
          <BusyLabel busy={save.isPending} busyText="Saving...">Save for all projects</BusyLabel>
        </button>
      )}
      {save.isError && <ErrorNote message={errorMessage(save.error)} />}
    </div>
  );
};

/** The Variables tool: every value that fills the template, in one place. */
export const VariablesPanel: React.FC = () => {
  const draft = useStudio((s) => s.draft);
  const project = useStudio((s) => s.project);
  const readOnly = useStudio((s) => s.readOnly);
  const documents = useStudio((s) => s.documents);
  const globals = useStudio((s) => s.globals);
  const { updateDraft } = useStudio.getState();
  const { workspaces } = useServices();
  const { workspace, can } = useWorkspace();
  const queryClient = useQueryClient();
  const [justAdded, setJustAdded] = useState<{ label: string; isList: boolean } | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const focusRequest = useStudio((s) => s.focusRequest);
  const panelRef = useRef<HTMLDivElement>(null);
  const usageCursor = useRef<Record<string, number>>({});

  // Clear the outlines on leaving, or they'd stay on the canvas with nothing explaining them.
  useEffect(() => () => useStudio.getState().setHighlightedVariable(null), []);

  // Arriving from "Change it" on a block: go straight to that variable.
  useEffect(() => {
    if (!focusRequest) return;
    if (search) {
      setSearch('');
      return;
    }
    const field = panelRef.current?.querySelector(`[data-var="${CSS.escape(focusRequest)}"]`);
    field?.scrollIntoView({ block: 'center' });
    field?.querySelector<HTMLElement>('input,textarea,select')?.focus();
    const state = useStudio.getState();
    state.setHighlightedVariable(focusRequest);
    state.clearFocusRequest();
  }, [focusRequest, search]);

  if (!draft || !project) return null;

  const term = search.trim();
  const matches = (def: { key: string; label: string }) => variableMatches(def.label, draft.variables[def.key], term);

  /** Each press goes to the next place it's used, changing page when it has to. */
  const showUsage = (key: string) => {
    const state = useStudio.getState();
    const places = state.documents.flatMap((doc) => nodesUsingVariable(doc.content, key).map((id) => ({ documentId: doc.id, id })));
    if (places.length === 0) return;
    const index = ((usageCursor.current[key] ?? -1) + 1) % places.length;
    usageCursor.current[key] = index;
    const place = places[index];
    if (!state.documentOfNode(place.id)) state.setActiveDocument(place.documentId);
    state.select(place.id);
    state.setHighlightedVariable(key);
  };

  const highlightFrom = (target: EventTarget) => {
    const key = (target as Element).closest?.('[data-var]')?.getAttribute('data-var');
    useStudio.getState().setHighlightedVariable(key ?? null);
  };

  const defs = projectVariableDefs(project.templateId, draft.settings);
  const own = draft.settings.variableDefs ?? [];
  const fromTemplate = defs.filter((def) => !own.some((other) => other.key === def.key));
  const { errors } = validateValues(defs, draft.variables);
  const counts = usageCounts(documents.map((doc) => doc.content));
  const hints = Object.fromEntries(defs.map((def) => [def.key, usageHint(counts[def.key])]));
  const canEditGlobals = can('manage:team');

  const saveGlobals = async (next: GlobalVariable[]) => {
    if (!workspace) return;
    await workspaces.updateWorkspace(workspace.organizationId, { branding: { ...workspace.branding, globalVariables: next } });
    await queryClient.invalidateQueries({ queryKey: ['memberships'] });
  };

  const remove = (def: { key: string; label: string }) => {
    if (counts[def.key] && !window.confirm(`"${def.label}" is used in ${counts[def.key]} ${counts[def.key] === 1 ? 'place' : 'places'}. Those places will go blank. Remove it?`)) return false;
    updateDraft((d) => {
      d.settings.variableDefs = (d.settings.variableDefs ?? []).filter((other) => other.key !== def.key);
      delete d.variables[def.key];
    });
    return true;
  };

  return (
    <div
      ref={panelRef}
      className="p-3 space-y-6"
      onMouseOver={(event) => highlightFrom(event.target)}
      onFocus={(event) => highlightFrom(event.target)}
      onMouseLeave={() => useStudio.getState().setHighlightedVariable(document.activeElement?.closest('[data-var]')?.getAttribute('data-var') ?? null)}
    >
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" aria-hidden="true" />
        <input type="search" aria-label="Search variables" placeholder="Find by name, or by what it says" className={`${fieldClass} !pl-8`} value={search} onChange={(event) => setSearch(event.target.value)} />
        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">Point at one to see it light up on the page.</p>
      </div>
      {!term && <div className="rounded-lg bg-indigo-50 dark:bg-indigo-500/10 p-3 text-[13px] text-indigo-950 dark:text-indigo-100">
        <p className="flex items-center gap-1.5 font-semibold">
          <Lightbulb className="w-4 h-4 shrink-0" aria-hidden="true" />
          One change, updated everywhere
        </p>
        <p className="mt-1">Variables are things you use more than once, like your business name. Change one here, and every place that uses it updates by itself. Your changes save automatically.</p>
      </div>}
      {term && ![...defs, ...globals].some(matches) && <p className="text-[13px] text-slate-500 dark:text-slate-400">Nothing matches "{term}".</p>}
      {fromTemplate.some(matches) && (
        <fieldset disabled={readOnly} className="min-w-0">
          <VariableForm
            defs={fromTemplate.filter(matches)}
            values={draft.variables}
            errors={errors}
            hints={hints}
            onShow={showUsage}
            onChange={(values) => updateDraft((d) => { d.variables = values; }, 'variables')}
          />
        </fieldset>
      )}
      <section aria-label="Your variables" className="space-y-4">
        {own.some(matches) && <h2 className="text-sm font-bold text-slate-900 dark:text-white">Your variables</h2>}
        <fieldset disabled={readOnly} className="min-w-0 space-y-4">
          {own.filter(matches).map((def) => (
            <div key={def.key} data-var={def.key}>
              {editing === def.key && (
                <EditVariable
                  def={def}
                  onClose={() => setEditing(null)}
                  onSave={(patch) => updateDraft((d) => {
                    d.settings.variableDefs = (d.settings.variableDefs ?? []).map((other) => (other.key === def.key ? { ...other, ...patch } : other));
                  })}
                />
              )}
              <div className="relative">
                <VariableField
                  def={def}
                  fieldId={`var-${def.key.replace(/\W/g, '-')}`}
                  value={draft.variables[def.key]}
                  error={errors[def.key]}
                  errors={errors}
                  errorPrefix={def.key}
                  hint={hints[def.key]}
                  onShow={counts[def.key] ? () => showUsage(def.key) : undefined}
                  onChange={(next) => updateDraft((d) => { d.variables[def.key] = next; }, `variables:${def.key}`)}
                />
                {!readOnly && (
                  <div className="absolute right-0 top-0 flex gap-0.5">
                    <button type="button" aria-label={`Edit ${def.label}`} title="Edit" className="p-0.5 text-slate-400 hover:text-indigo-600" onClick={() => setEditing(editing === def.key ? null : def.key)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" aria-label={`Remove ${def.label}`} title="Remove" className="p-0.5 text-slate-400 hover:text-rose-600" onClick={() => remove(def)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </fieldset>
        {justAdded && (
          <p role="status" className="text-[13px] rounded-lg px-2.5 py-2 bg-emerald-50 text-emerald-900 dark:bg-emerald-500/10 dark:text-emerald-200">
            <strong>{justAdded.label}</strong> is saved.{' '}
            {justAdded.isList
              ? <>To use it, click a block on the canvas, open <strong>Behavior</strong> and choose it under <strong>Repeat for each item in</strong>.</>
              : <>To use it, click some text on the canvas, then choose it under <strong>+ Insert a variable</strong>.</>}
          </p>
        )}
        {!readOnly && (
          <NewVariable
            taken={[...defs.map((def) => def.key), ...globals.map((item) => item.key)]}
            canBeGlobal={canEditGlobals}
            onAdd={async ({ def, value, isGlobal }) => {
              if (isGlobal) {
                await saveGlobals([...globals, { key: def.key, label: def.label, type: def.type, value: value as GlobalVariable['value'] }]);
              } else {
                updateDraft((d) => {
                  d.settings.variableDefs = [...(d.settings.variableDefs ?? []), def];
                  d.variables[def.key] = value;
                });
              }
              setJustAdded({ label: def.label, isList: def.type === 'list' });
            }}
          />
        )}
      </section>

      {globals.some(matches) && (
        <section aria-label="Global variables" className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="flex items-center gap-1.5 text-sm font-bold text-slate-900 dark:text-white">
              <Globe2 className="w-4 h-4 text-indigo-500" aria-hidden="true" />
              Global variables
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Shared by every project in this workspace. A project picks up a change when it's next opened, and visitors see it after you publish that project.</p>
          </div>
          <fieldset disabled={!canEditGlobals || readOnly} className="min-w-0 space-y-4">
            {globals.filter(matches).map((item) => (
              <div key={`${item.key}:${String(item.value)}`} data-var={item.key}>
              <GlobalRow
                variable={item}
                canEdit={canEditGlobals && !readOnly}
                hint={usageHint(counts[item.key])}
                onShow={counts[item.key] ? () => showUsage(item.key) : undefined}
                onSave={(value) => saveGlobals(globals.map((other) => (other.key === item.key ? { ...other, value } : other)))}
                onRemove={() => {
                  if (remove(item)) void saveGlobals(globals.filter((other) => other.key !== item.key));
                }}
              />
              </div>
            ))}
          </fieldset>
          {!canEditGlobals && <p className="text-xs text-slate-500 dark:text-slate-400">Only workspace owners and admins can change these.</p>}
        </section>
      )}
    </div>
  );
};
