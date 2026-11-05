import React, { useState } from 'react';
import { ArrowDown, ArrowUp, Plus, Trash2, Upload } from 'lucide-react';
import { defaultValues, VariableDef, VariableValues } from '../../core/variables';
import { useServices } from '../session';
import { useWorkspace } from '../workspace';
import { BusyIcon, errorMessage, inputClass } from './ui';

export const ImageInput: React.FC<{
  id: string;
  value: string;
  onChange: (value: string) => void;
  describedBy?: string;
}> = ({ id, value, onChange, describedBy }) => {
  const { assets } = useServices();
  const { workspace } = useWorkspace();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file || !workspace) return;
    setIsUploading(true);
    setError(null);
    try {
      const asset = await assets.upload(workspace.organizationId, file);
      onChange(asset.url);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div>
      <div className="flex gap-2">
        <input
          id={id}
          type="url"
          className={inputClass}
          value={value}
          placeholder="https://..."
          aria-describedby={describedBy}
          onChange={(event) => onChange(event.target.value)}
        />
        <label className="relative shrink-0 inline-flex items-center gap-1 px-3 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800">
          <BusyIcon busy={isUploading} className="w-3.5 h-3.5"><Upload className="w-3.5 h-3.5" aria-hidden="true" /></BusyIcon>
          {isUploading ? 'Uploading...' : 'Upload'}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="sr-only"
            onChange={(event) => handleFile(event.target.files?.[0])}
          />
        </label>
      </div>
      {error && <p role="alert" className="mt-1 text-xs text-rose-600 dark:text-rose-400">{error}</p>}
    </div>
  );
};

interface FieldProps {
  def: VariableDef;
  fieldId: string;
  value: unknown;
  error?: string;
  errors: Record<string, string>;
  errorPrefix: string;
  onChange: (value: unknown) => void;
}

export const VariableField: React.FC<FieldProps> = ({ def, fieldId, value, error, errors, errorPrefix, onChange }) => {
  const describedBy = error ? `${fieldId}-error` : def.help ? `${fieldId}-help` : undefined;
  const text = value === undefined || value === null ? '' : String(value);
  const common = { id: fieldId, 'aria-invalid': Boolean(error), 'aria-describedby': describedBy };
  const labelEl = (
    <label htmlFor={fieldId} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
      {def.label}
      {def.required && <span aria-hidden="true" className="text-rose-500"> *</span>}
    </label>
  );
  const notes = (
    <>
      {def.help && !error && <p id={`${fieldId}-help`} className="mt-1 text-xs text-slate-500 dark:text-slate-400">{def.help}</p>}
      {error && <p id={`${fieldId}-error`} className="mt-1 text-xs text-rose-600 dark:text-rose-400">{error}</p>}
    </>
  );

  if (def.type === 'list') {
    const items = Array.isArray(value) ? (value as Record<string, unknown>[]) : [];
    const setItems = (next: Record<string, unknown>[]) => onChange(next);
    const atMax = def.maxItems !== undefined && items.length >= def.maxItems;

    return (
      <fieldset>
        <legend className={def.group === def.label ? 'sr-only' : 'block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2'}>{def.label}</legend>
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={index} className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Item {index + 1}</span>
                <div className="flex gap-1 text-slate-500 dark:text-slate-400">
                  <button type="button" aria-label={`Move item ${index + 1} up`} disabled={index === 0} className="p-1 disabled:opacity-30"
                    onClick={() => {
                      const next = [...items];
                      [next[index - 1], next[index]] = [next[index], next[index - 1]];
                      setItems(next);
                    }}>
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button type="button" aria-label={`Move item ${index + 1} down`} disabled={index === items.length - 1} className="p-1 disabled:opacity-30"
                    onClick={() => {
                      const next = [...items];
                      [next[index + 1], next[index]] = [next[index], next[index + 1]];
                      setItems(next);
                    }}>
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button type="button" aria-label={`Remove item ${index + 1}`} className="p-1 hover:text-rose-600"
                    onClick={() => setItems(items.filter((_, i) => i !== index))}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {(def.itemFields ?? []).map((field) => (
                <VariableField
                  key={field.key}
                  def={field}
                  fieldId={`${fieldId}-${index}-${field.key}`}
                  value={item[field.key]}
                  error={errors[`${errorPrefix}.${index}.${field.key}`]}
                  errors={errors}
                  errorPrefix={`${errorPrefix}.${index}.${field.key}`}
                  onChange={(next) => setItems(items.map((other, i) => (i === index ? { ...other, [field.key]: next } : other)))}
                />
              ))}
            </div>
          ))}
        </div>
        <button
          type="button"
          disabled={atMax}
          onClick={() => setItems([...items, defaultValues(def.itemFields ?? [])])}
          className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline disabled:opacity-50"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          Add item
        </button>
        {notes}
      </fieldset>
    );
  }

  if (def.type === 'boolean') {
    return (
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
          <input {...common} type="checkbox" checked={Boolean(value)} onChange={(event) => onChange(event.target.checked)} />
          {def.label}
        </label>
        {notes}
      </div>
    );
  }

  let control: React.ReactNode;
  if (def.type === 'longtext') {
    control = <textarea {...common} rows={3} className={inputClass} value={text} placeholder={def.placeholder} onChange={(e) => onChange(e.target.value)} />;
  } else if (def.type === 'image') {
    control = <ImageInput id={fieldId} value={text} onChange={onChange} describedBy={describedBy} />;
  } else if (def.type === 'select') {
    control = (
      <select {...common} className={inputClass} value={text} onChange={(e) => onChange(e.target.value)}>
        {!def.required && <option value="">None</option>}
        {(def.options ?? []).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    );
  } else if (def.type === 'color') {
    control = (
      <div className="flex gap-2">
        <input type="color" aria-label={`${def.label} picker`} className="h-9 w-12 rounded border border-slate-300 dark:border-slate-700" value={/^#[0-9a-fA-F]{6}$/.test(text) ? text : '#000000'} onChange={(e) => onChange(e.target.value)} />
        <input {...common} className={inputClass} value={text} onChange={(e) => onChange(e.target.value)} />
      </div>
    );
  } else {
    const inputType = def.type === 'email' ? 'email' : def.type === 'url' ? 'url' : def.type === 'number' ? 'number' : 'text';
    control = <input {...common} type={inputType} className={inputClass} value={text} placeholder={def.placeholder} onChange={(e) => onChange(e.target.value)} />;
  }

  return (
    <div>
      {labelEl}
      {control}
      {notes}
    </div>
  );
};

interface VariableFormProps {
  defs: VariableDef[];
  values: VariableValues;
  errors?: Record<string, string>;
  onChange: (values: VariableValues) => void;
}

/** Generated from a template's variables. Used by the wizard and the editor. */
export const VariableForm: React.FC<VariableFormProps> = ({ defs, values, errors = {}, onChange }) => {
  const groups = new Map<string, VariableDef[]>();
  for (const def of defs) {
    const group = def.group ?? 'Details';
    groups.set(group, [...(groups.get(group) ?? []), def]);
  }

  return (
    <div className="space-y-8">
      {[...groups.entries()].map(([group, groupDefs]) => (
        <section key={group} aria-label={group}>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-3">{group}</h2>
          <div className="space-y-4">
            {groupDefs.map((def) => (
              <VariableField
                key={def.key}
                def={def}
                fieldId={`var-${def.key.replace(/\W/g, '-')}`}
                value={values[def.key]}
                error={errors[def.key]}
                errors={errors}
                errorPrefix={def.key}
                onChange={(next) => onChange({ ...values, [def.key]: next })}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};
