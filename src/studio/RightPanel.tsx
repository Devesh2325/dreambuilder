import React, { useEffect, useRef, useState } from 'react';
import { Crosshair, Link2 } from 'lucide-react';
import { DEFAULT_TRIGGERS, DEVICES, DocNode, Triggers } from '../core/schema';
import { MODULES } from '../core/modules';
import { hasToken, VariableDef } from '../core/variables';
import { inputClass } from '../app/shared/ui';
import { ImageInput } from '../app/shared/VariableForm';
import { ColorGradientPicker } from '../editor/panels/ColorGradientPicker';
import { BLOCK_META } from '../renderer/blockMeta';
import { BlockField } from '../renderer/types';
import { getTemplate } from '../templates';
import { useStudio } from './store';

const labelClass = 'block text-xs font-medium text-slate-700 dark:text-slate-300';

const useTemplateVariables = (): VariableDef[] => {
  const project = useStudio((s) => s.project);
  return project?.templateId ? (getTemplate(project.templateId)?.variables ?? []) : [];
};

const PropField: React.FC<{ node: DocNode; field: BlockField; pickSelector?: () => void }> = ({ node, field, pickSelector }) => {
  const readOnly = useStudio((s) => s.readOnly);
  const { updateProps } = useStudio.getState();
  const variables = useTemplateVariables();
  const value = node.props[field.key];
  const text = value === undefined || value === null ? '' : String(value);
  const set = (next: unknown) => updateProps(node.id, { [field.key]: next });
  const fieldId = `prop-${node.id}-${field.key}`;

  if (field.type === 'boolean') {
    return (
      <label className={`${labelClass} flex items-center gap-2`}>
        <input type="checkbox" disabled={readOnly} checked={Boolean(value)} onChange={(e) => set(e.target.checked)} />
        {field.label}
      </label>
    );
  }

  const linked = hasToken(value);
  const textual = field.type === 'text' || field.type === 'longtext' || field.type === 'url';
  const usable = variables.filter((def) => def.type !== 'list');

  return (
    <div>
      <label htmlFor={fieldId} className={`${labelClass} mb-1`}>{field.label}</label>
      {field.type === 'longtext' ? (
        <textarea id={fieldId} rows={3} disabled={readOnly} className={inputClass} value={text} onChange={(e) => set(e.target.value)} />
      ) : field.type === 'select' ? (
        <select id={fieldId} disabled={readOnly} className={inputClass} value={text} onChange={(e) => set(e.target.value)}>
          {(field.options ?? []).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      ) : field.type === 'image' ? (
        <ImageInput id={fieldId} value={text} onChange={set} />
      ) : field.type === 'color' ? (
        <ColorGradientPicker value={text} onChange={set} />
      ) : (
        <input id={fieldId} type={field.type === 'number' ? 'number' : 'text'} disabled={readOnly} className={inputClass} value={text} onChange={(e) => set(field.type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value)} />
      )}

      {pickSelector && !readOnly && (
        <button type="button" onClick={pickSelector} className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
          <Crosshair className="w-3 h-3" aria-hidden="true" />
          Pick on my site
        </button>
      )}
      {field.help && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{field.help}</p>}
      {linked && (
        <p className="mt-1 flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-400">
          <Link2 className="w-3 h-3" aria-hidden="true" />
          Filled in from your details. Typing here stops it following them.
        </p>
      )}
      {textual && usable.length > 0 && !readOnly && (
        <select
          aria-label={`Insert a detail into ${field.label}`}
          className="mt-1 w-full text-xs bg-transparent text-slate-500 dark:text-slate-400"
          value=""
          onChange={(e) => {
            if (e.target.value) set(`${text}{{${e.target.value}}}`);
          }}
        >
          <option value="">Insert a detail...</option>
          {usable.map((def) => <option key={def.key} value={def.key}>{def.label}</option>)}
        </select>
      )}
    </div>
  );
};

const STYLE_GROUPS: { title: string; fields: { key: string; label: string; placeholder?: string; options?: string[] }[] }[] = [
  {
    title: 'Text',
    fields: [
      { key: 'fontSize', label: 'Size', placeholder: '16px' },
      { key: 'fontWeight', label: 'Weight', options: ['', '400', '500', '600', '700', '800'] },
      { key: 'textAlign', label: 'Align', options: ['', 'left', 'center', 'right'] },
      { key: 'lineHeight', label: 'Line height', placeholder: '1.5' },
    ],
  },
  {
    title: 'Size',
    fields: [
      { key: 'width', label: 'Width', placeholder: 'auto' },
      { key: 'maxWidth', label: 'Max width', placeholder: 'none' },
      { key: 'height', label: 'Height', placeholder: 'auto' },
      { key: 'minHeight', label: 'Min height', placeholder: '0' },
    ],
  },
  {
    title: 'Spacing',
    fields: [
      { key: 'paddingTop', label: 'Padding top' },
      { key: 'paddingBottom', label: 'Padding bottom' },
      { key: 'paddingLeft', label: 'Padding left' },
      { key: 'paddingRight', label: 'Padding right' },
      { key: 'marginTop', label: 'Margin top' },
      { key: 'marginBottom', label: 'Margin bottom' },
      { key: 'gap', label: 'Gap between items' },
    ],
  },
  {
    title: 'Layout',
    fields: [
      { key: 'display', label: 'Display', options: ['', 'block', 'flex', 'grid', 'none'] },
      { key: 'flexDirection', label: 'Direction', options: ['', 'row', 'column'] },
      { key: 'justifyContent', label: 'Main axis', options: ['', 'flex-start', 'center', 'flex-end', 'space-between'] },
      { key: 'alignItems', label: 'Cross axis', options: ['', 'flex-start', 'center', 'flex-end', 'stretch'] },
      { key: 'gridTemplateColumns', label: 'Grid columns', placeholder: 'repeat(3, 1fr)' },
    ],
  },
  {
    title: 'Border and effects',
    fields: [
      { key: 'borderRadius', label: 'Corner radius', placeholder: '8px' },
      { key: 'border', label: 'Border', placeholder: '1px solid #ccc' },
      { key: 'boxShadow', label: 'Shadow', placeholder: '0 4px 12px rgba(0,0,0,.1)' },
      { key: 'opacity', label: 'Opacity', placeholder: '1' },
    ],
  },
];

const StylePanel: React.FC<{ node: DocNode }> = ({ node }) => {
  const device = useStudio((s) => s.device);
  const readOnly = useStudio((s) => s.readOnly);
  const { updateStyle } = useStudio.getState();

  const overrides = device === 'desktop' ? undefined : node.responsive?.[device];
  const valueOf = (key: string) => String(overrides?.[key] ?? node.styles[key] ?? '');
  const isOverridden = (key: string) => overrides?.[key] !== undefined;

  return (
    <div className="space-y-5">
      {device !== 'desktop' && (
        <p className="text-xs rounded-lg px-2 py-1.5 bg-indigo-50 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200">
          Changes here only apply on {device}. Desktop stays the same.
        </p>
      )}
      <ColorGradientPicker label="Text color" allowGradient={false} value={valueOf('color')} onChange={(value) => updateStyle(node.id, 'color', value)} />
      <ColorGradientPicker label="Background" value={valueOf('background') || valueOf('backgroundColor')} onChange={(value) => updateStyle(node.id, 'background', value)} />

      {STYLE_GROUPS.map((group) => (
        <section key={group.title} aria-label={group.title}>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1.5">{group.title}</h4>
          <div className="grid grid-cols-2 gap-2">
            {group.fields.map((field) => {
              const id = `style-${node.id}-${field.key}`;
              return (
                <div key={field.key}>
                  <label htmlFor={id} className="block text-[11px] text-slate-500 dark:text-slate-400 mb-0.5">
                    {field.label}{isOverridden(field.key) && <span title={`Set for ${device}`} className="text-indigo-500"> •</span>}
                  </label>
                  {field.options ? (
                    <select id={id} disabled={readOnly} className={`${inputClass} !px-1.5 !py-1 !text-xs`} value={valueOf(field.key)} onChange={(e) => updateStyle(node.id, field.key, e.target.value)}>
                      {field.options.map((option) => <option key={option} value={option}>{option || 'Default'}</option>)}
                    </select>
                  ) : (
                    <input id={id} disabled={readOnly} className={`${inputClass} !px-1.5 !py-1 !text-xs`} placeholder={field.placeholder} value={valueOf(field.key)} onChange={(e) => updateStyle(node.id, field.key, e.target.value)} />
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
};

const AdvancedPanel: React.FC<{ node: DocNode }> = ({ node }) => {
  const readOnly = useStudio((s) => s.readOnly);
  const { updateNode } = useStudio.getState();
  const variables = useTemplateVariables();
  const lists = variables.filter((def) => def.type === 'list');
  const conditions = variables.filter((def) => def.type !== 'list');

  return (
    <div className="space-y-4">
      <label className={labelClass}>Layer name
        <input disabled={readOnly} className={`${inputClass} mt-1`} value={node.name ?? ''} onChange={(e) => updateNode(node.id, { name: e.target.value })} />
      </label>
      {lists.length > 0 && (
        <label className={labelClass}>Repeat for each item in
          <select
            disabled={readOnly}
            className={`${inputClass} mt-1`}
            value={node.repeat?.list ?? ''}
            onChange={(e) => updateNode(node.id, { repeat: e.target.value ? { list: e.target.value, as: node.repeat?.as ?? 'item' } : undefined })}
          >
            <option value="">Don't repeat</option>
            {lists.map((def) => <option key={def.key} value={def.key}>{def.label}</option>)}
          </select>
          {node.repeat && <span className="mt-1 block font-normal text-slate-500 dark:text-slate-400">{`Use {{${node.repeat.as}.fieldName}} in text inside this block.`}</span>}
        </label>
      )}
      {conditions.length > 0 && (
        <label className={labelClass}>Only show when filled in
          <select disabled={readOnly} className={`${inputClass} mt-1`} value={node.showIf ?? ''} onChange={(e) => updateNode(node.id, { showIf: e.target.value || undefined })}>
            <option value="">Always show</option>
            {conditions.map((def) => <option key={def.key} value={def.key}>{def.label}</option>)}
          </select>
        </label>
      )}
      <label className={`${labelClass} flex items-center gap-2`}>
        <input type="checkbox" disabled={readOnly} checked={Boolean(node.locked)} onChange={(e) => updateNode(node.id, { locked: e.target.checked })} />
        Lock (can't be moved or deleted)
      </label>
    </div>
  );
};

const openElementPicker = (url: string, nodeId: string) => {
  const nonce = crypto.randomUUID();
  const target = new URL(url);
  target.hash = `fp-pick=${nonce}&origin=${encodeURIComponent(window.location.origin)}`;
  const popup = window.open(target.toString(), 'flowpilot-picker');
  const listener = (event: MessageEvent) => {
    if (event.source !== popup || event.data?.type !== 'flowpilot:selector' || event.data.nonce !== nonce) return;
    if (typeof event.data.selector === 'string') useStudio.getState().updateProps(nodeId, { selector: event.data.selector });
    window.removeEventListener('message', listener);
    popup?.close();
  };
  window.addEventListener('message', listener);
};

const NodeInspector: React.FC<{ node: DocNode }> = ({ node }) => {
  const [tab, setTab] = useState<'content' | 'style' | 'advanced'>('content');
  const [pickerUrl, setPickerUrl] = useState<string | null>(null);
  const [pickerError, setPickerError] = useState<string | null>(null);
  const meta = BLOCK_META[node.type];
  const inputRef = useRef<HTMLInputElement>(null);
  const hasFields = (meta?.fields.length ?? 0) > 0;
  const activeTab = tab === 'content' && !hasFields ? 'style' : tab;

  useEffect(() => {
    if (pickerUrl !== null) inputRef.current?.focus();
  }, [pickerUrl]);

  const tabs = [...(hasFields ? ['content'] : []), 'style', 'advanced'] as const;

  return (
    <>
      <div className="px-3 pt-3">
        <p className="text-xs text-slate-500 dark:text-slate-400">{meta?.label ?? node.type}</p>
        <h3 className="font-semibold text-sm truncate">{node.name ?? meta?.label}</h3>
      </div>
      <div role="tablist" aria-label="Block settings" className="flex mt-2 border-b border-slate-200 dark:border-slate-800">
        {tabs.map((id) => (
          <button key={id} role="tab" type="button" aria-selected={activeTab === id} onClick={() => setTab(id as typeof tab)}
            className={`flex-1 py-2 text-xs font-semibold capitalize border-b-2 ${activeTab === id ? 'border-indigo-600 text-indigo-700 dark:text-indigo-300' : 'border-transparent text-slate-500 dark:text-slate-400'}`}>
            {id}
          </button>
        ))}
      </div>
      <div role="tabpanel" className="flex-1 overflow-y-auto p-3 space-y-4">
        {activeTab === 'content' && meta?.fields.map((field) => (
          <PropField
            key={field.key}
            node={node}
            field={field}
            pickSelector={node.type === 'TourStep' && field.key === 'selector' ? () => setPickerUrl('') : undefined}
          />
        ))}
        {activeTab === 'content' && pickerUrl !== null && (
          <form
            className="rounded-lg border border-slate-200 dark:border-slate-700 p-2 space-y-2"
            onSubmit={(event) => {
              event.preventDefault();
              try {
                const parsed = new URL(pickerUrl);
                if (!/^https?:$/.test(parsed.protocol)) throw new Error('bad protocol');
                setPickerError(null);
                openElementPicker(pickerUrl, node.id);
                setPickerUrl(null);
              } catch {
                setPickerError('Enter a full address, starting with https://');
              }
            }}
          >
            <label className={labelClass}>Page on your site
              <input ref={inputRef} type="url" placeholder="https://app.example.com/dashboard" className={`${inputClass} mt-1`} value={pickerUrl} onChange={(e) => setPickerUrl(e.target.value)} />
            </label>
            <p className="text-xs text-slate-500 dark:text-slate-400">The FlowPilot script must be installed on that page. Click an element there to choose it.</p>
            {pickerError && <p role="alert" className="text-xs text-rose-600 dark:text-rose-400">{pickerError}</p>}
            <div className="flex gap-2">
              <button type="submit" className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">Open page</button>
              <button type="button" className="text-xs" onClick={() => setPickerUrl(null)}>Cancel</button>
            </div>
          </form>
        )}
        {activeTab === 'style' && <StylePanel node={node} />}
        {activeTab === 'advanced' && <AdvancedPanel node={node} />}
      </div>
    </>
  );
};

const ProjectSettingsPanel: React.FC = () => {
  const project = useStudio((s) => s.project);
  const draft = useStudio((s) => s.draft);
  const readOnly = useStudio((s) => s.readOnly);
  const { updateDraft } = useStudio.getState();
  if (!project || !draft) return null;

  const module = MODULES[project.type];
  const triggers: Triggers = draft.settings.triggers ?? DEFAULT_TRIGGERS;
  const setTriggers = (patch: Partial<Triggers>, key: string) =>
    updateDraft((d) => { d.settings.triggers = { ...triggers, ...patch }; }, `triggers:${key}`);
  const rule = triggers.urlRules[0];

  return (
    <fieldset disabled={readOnly} className="flex-1 overflow-y-auto p-3 space-y-4 min-w-0">
      <h3 className="font-semibold text-sm">{module.label} settings</h3>
      <p className="text-xs text-slate-500 dark:text-slate-400">Select a block on the canvas to change it.</p>

      <label className={labelClass}>Project name
        <input className={`${inputClass} mt-1`} value={draft.title} onChange={(e) => updateDraft((d) => { d.title = e.target.value; }, 'title')} />
      </label>

      {module.delivery === 'overlay' && (
        <section aria-label="When it appears" className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400">When it appears</h4>
          <div className="grid grid-cols-[auto,1fr] gap-1.5 items-end">
            <label className={labelClass}>Page address
              <select className={`${inputClass} mt-1 !px-1.5`} value={rule?.type ?? 'contains'} onChange={(e) => setTriggers({ urlRules: [{ type: e.target.value as 'exact', value: rule?.value ?? '' }] }, 'rule')}>
                <option value="contains">contains</option>
                <option value="starts_with">starts with</option>
                <option value="exact">is exactly</option>
              </select>
            </label>
            <input aria-label="Page address value" placeholder="/dashboard (any page if empty)" className={inputClass} value={rule?.value ?? ''}
              onChange={(e) => setTriggers({ urlRules: e.target.value ? [{ type: rule?.type ?? 'contains', value: e.target.value }] : [] }, 'rule')} />
          </div>
          <label className={labelClass}>Delay (seconds)
            <input type="number" min={0} className={`${inputClass} mt-1`} value={triggers.delaySeconds} onChange={(e) => setTriggers({ delaySeconds: Math.max(0, Number(e.target.value) || 0) }, 'delay')} />
          </label>
          <label className={labelClass}>After scrolling (% of page)
            <input type="number" min={0} max={100} className={`${inputClass} mt-1`} value={triggers.scrollPercent ?? ''} onChange={(e) => setTriggers({ scrollPercent: e.target.value === '' ? undefined : Math.min(100, Math.max(0, Number(e.target.value))) }, 'scroll')} />
          </label>
          <label className={`${labelClass} flex items-center gap-2`}>
            <input type="checkbox" checked={Boolean(triggers.exitIntent)} onChange={(e) => setTriggers({ exitIntent: e.target.checked }, 'exit')} />
            When the visitor is about to leave (desktop)
          </label>
          <label className={labelClass}>How often
            <select className={`${inputClass} mt-1`} value={triggers.frequency} onChange={(e) => setTriggers({ frequency: e.target.value as Triggers['frequency'] }, 'frequency')}>
              <option value="once_per_visitor">Once per visitor</option>
              <option value="once_per_session">Once per visit</option>
              <option value="until_completed">Until completed</option>
              <option value="always">Every time</option>
            </select>
          </label>
          <fieldset>
            <legend className={labelClass}>Devices</legend>
            <div className="mt-1 flex gap-3">
              {DEVICES.map((device) => {
                const selected = triggers.devices ?? DEVICES;
                return (
                  <label key={device} className="flex items-center gap-1 text-xs capitalize">
                    <input type="checkbox" checked={selected.includes(device)} onChange={(e) => {
                      const next = e.target.checked ? [...selected, device] : selected.filter((d) => d !== device);
                      setTriggers({ devices: [...new Set(next)] }, 'devices');
                    }} />
                    {device}
                  </label>
                );
              })}
            </div>
          </fieldset>
          {project.type === 'banner' && (
            <label className={labelClass}>Position
              <select className={`${inputClass} mt-1`} value={draft.settings.position ?? 'top'} onChange={(e) => updateDraft((d) => { d.settings.position = e.target.value as 'top'; })}>
                <option value="top">Top of the page</option>
                <option value="bottom">Bottom of the page</option>
              </select>
            </label>
          )}
        </section>
      )}

      <section aria-label="Form responses">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1.5">Form responses</h4>
        <label className={labelClass}>Send to webhook (optional)
          <input type="url" placeholder="https://hooks.example.com/..." className={`${inputClass} mt-1`} value={draft.settings.webhookUrl ?? ''}
            onChange={(e) => updateDraft((d) => {
              if (e.target.value) d.settings.webhookUrl = e.target.value;
              else delete d.settings.webhookUrl;
            }, 'webhook')} />
        </label>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Must start with https://. Responses are also saved in the project.</p>
      </section>
    </fieldset>
  );
};

export const RightPanel: React.FC = () => {
  const selectedId = useStudio((s) => s.selectedId);
  // Subscribes to documents so edits show in the fields.
  useStudio((s) => s.documents);
  const node = selectedId ? useStudio.getState().getNode(selectedId) : null;

  return (
    <aside aria-label="Settings" className="w-72 shrink-0 flex flex-col bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800">
      {node ? <NodeInspector key={node.id} node={node} /> : <ProjectSettingsPanel />}
    </aside>
  );
};
