import React, { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowUp, BookmarkPlus, Crosshair, EyeOff, Link2, Loader2, Plus, Trash2 } from 'lucide-react';
import { DEFAULT_TRIGGERS, DEVICES, DocNode, Triggers } from '../core/schema';
import { MODULES } from '../core/modules';
import { getAncestors } from '../core/tree';
import { hasToken, resolveValue, VariableDef, VariableValues } from '../core/variables';
import { ImageInput } from '../app/shared/VariableForm';
import { pagesOf } from '../experience/SiteView';
import { BLOCK_META } from '../renderer/blockMeta';
import { BlockField } from '../renderer/types';
import { projectVariableDefs } from '../templates';
import { sectionFromNode } from '../templates/library';
import { ColorField, fieldClass, labelClass, slugFromTitle } from './fields';
import { SaveToLibrary } from './SaveToLibrary';
import { useStudio } from './store';
import { StylePanel } from './StylePanel';

const NO_SETTINGS = {};

const useTemplateVariables = (): VariableDef[] => {
  const templateId = useStudio((s) => s.project?.templateId);
  const settings = useStudio((s) => s.draft?.settings ?? NO_SETTINGS);
  return projectVariableDefs(templateId, settings);
};

interface MenuItem {
  label: string;
  href: string;
}

const EMPTY_VALUES: VariableValues = {};
const CUSTOM = '__custom';
const NEW_PAGE = '__new';

/** Add, reorder and link menu items, including creating a page for a new item. */
const MenuEditor: React.FC<{ node: DocNode; fieldKey: string }> = ({ node, fieldKey }) => {
  const readOnly = useStudio((s) => s.readOnly);
  const documents = useStudio((s) => s.documents);
  const variables = useStudio((s) => s.draft?.variables ?? EMPTY_VALUES);
  const isWebsite = useStudio((s) => s.project?.type === 'website');
  const { updateProps, addPage } = useStudio.getState();
  const [error, setError] = useState<string | null>(null);
  const [isCreatingPage, setIsCreatingPage] = useState(false);
  // Only one item is expanded, so a long menu doesn't push everything else out of reach.
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const pages = pagesOf(documents);
  const value = node.props[fieldKey];

  // From a template: the list lives in Variables until the user takes over here.
  if (hasToken(value)) {
    return (
      <div className="rounded-md border border-slate-200 dark:border-slate-700 p-2.5 text-[13px] space-y-1.5">
        <p className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
          <Link2 className="w-3 h-3 shrink-0" aria-hidden="true" />
          These items come from your variables.
        </p>
        {!readOnly && (
          <button
            type="button"
            className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            onClick={() => updateProps(node.id, { [fieldKey]: resolveValue(value, variables) })}
          >
            Edit them here instead
          </button>
        )}
      </div>
    );
  }

  const items: MenuItem[] = Array.isArray(value) ? (value as MenuItem[]) : [];
  const usesPages = items.length === 0;
  const setItems = (next: MenuItem[]) => updateProps(node.id, { [fieldKey]: next });
  const move = (from: number, to: number) => {
    const next = [...items];
    next.splice(to, 0, next.splice(from, 1)[0]);
    setItems(next);
  };

  const startCustom = () => setItems(pages.map((page) => ({ label: page.title, href: `/${page.slug}` })));
  const addItem = () => {
    const next = [...(usesPages ? pages.map((page) => ({ label: page.title, href: `/${page.slug}` })) : items), { label: 'New item', href: '#' }];
    setItems(next);
    setOpenIndex(next.length - 1);
  };

  const createPageFor = async (index: number) => {
    const item = items[index];
    const slug = slugFromTitle(item.label);
    if (!slug) {
      setError('Give the item a name first.');
      return;
    }
    setError(null);
    setIsCreatingPage(true);
    try {
      await addPage(item.label, slug, { open: false });
      setItems(items.map((other, i) => (i === index ? { ...other, href: `/${slug}` } : other)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create the page.');
    } finally {
      setIsCreatingPage(false);
    }
  };

  return (
    <div>
      <p className={`${labelClass} mb-1.5`}>Menu items</p>
      {usesPages ? (
        <div className="rounded-md bg-slate-50 dark:bg-slate-800/60 p-2.5 text-[13px] text-slate-600 dark:text-slate-300 space-y-2">
          <p>{isWebsite ? 'Listing your website pages automatically.' : 'No menu items yet.'}</p>
          {isWebsite && !readOnly && pages.length > 0 && (
            <button type="button" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline" onClick={startCustom}>
              Choose items myself
            </button>
          )}
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((item, index) => {
            const isPage = pages.some((page) => `/${page.slug}` === item.href);
            return (
              <li key={index} className="rounded-md border border-slate-200 dark:border-slate-700 p-2 space-y-1.5">
                <div className="flex items-center gap-1">
                  <input aria-label={`Menu item ${index + 1} label`} disabled={readOnly} className={fieldClass} value={item.label} onFocus={() => setOpenIndex(index)}
                    onChange={(e) => setItems(items.map((other, i) => (i === index ? { ...other, label: e.target.value } : other)))} />
                  {!readOnly && (
                    <div className="flex shrink-0 text-slate-400">
                      <button type="button" aria-label={`Move ${item.label} up`} disabled={index === 0} className="p-0.5 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30" onClick={() => move(index, index - 1)}><ArrowUp className="w-3.5 h-3.5" /></button>
                      <button type="button" aria-label={`Move ${item.label} down`} disabled={index === items.length - 1} className="p-0.5 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30" onClick={() => move(index, index + 1)}><ArrowDown className="w-3.5 h-3.5" /></button>
                      <button type="button" aria-label={`Remove ${item.label}`} className="p-0.5 hover:text-rose-600" onClick={() => setItems(items.filter((_, i) => i !== index))}><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  )}
                </div>
                {openIndex === index && pages.length > 0 && (
                  <select
                    aria-label={`Menu item ${index + 1} goes to`}
                    disabled={readOnly || isCreatingPage}
                    className={fieldClass}
                    value={isPage ? item.href : CUSTOM}
                    onChange={(e) => {
                      if (e.target.value === NEW_PAGE) void createPageFor(index);
                      else if (e.target.value === CUSTOM) setItems(items.map((other, i) => (i === index ? { ...other, href: 'https://' } : other)));
                      else setItems(items.map((other, i) => (i === index ? { ...other, href: e.target.value } : other)));
                    }}
                  >
                    {pages.map((page) => <option key={page.id} value={`/${page.slug}`}>Page: {page.title}</option>)}
                    <option value={CUSTOM}>Web address...</option>
                    {isWebsite && <option value={NEW_PAGE}>+ Create a new page for this item</option>}
                  </select>
                )}
                {openIndex === index && (!isPage || pages.length === 0) && (
                  <input aria-label={`Menu item ${index + 1} address`} disabled={readOnly} className={fieldClass} placeholder="https://example.com" value={item.href}
                    onChange={(e) => setItems(items.map((other, i) => (i === index ? { ...other, href: e.target.value } : other)))} />
                )}
              </li>
            );
          })}
        </ul>
      )}
      {isCreatingPage && (
        <p role="status" className="mt-1 flex items-center gap-1.5 text-[13px] text-slate-500 dark:text-slate-400">
          <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
          Creating the page...
        </p>
      )}
      {error && <p role="alert" className="mt-1 text-[13px] text-rose-600 dark:text-rose-400">{error}</p>}
      {!readOnly && (
        <button type="button" onClick={addItem} className="mt-2 w-full h-8 inline-flex items-center justify-center gap-1 text-[13px] font-semibold rounded-md border border-dashed border-slate-300 dark:border-slate-600 text-indigo-600 dark:text-indigo-400 hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors">
          <Plus className="w-3.5 h-3.5" aria-hidden="true" />
          Add menu item
        </button>
      )}
      {!usesPages && isWebsite && !readOnly && (
        <button type="button" className="mt-1.5 text-[13px] text-slate-500 dark:text-slate-400 hover:underline" onClick={() => setItems([])}>
          Go back to listing pages automatically
        </button>
      )}
    </div>
  );
};

const PropField: React.FC<{ node: DocNode; field: BlockField; pickSelector?: () => void }> = ({ node, field, pickSelector }) => {
  const readOnly = useStudio((s) => s.readOnly);
  const { updateProps } = useStudio.getState();
  const variables = useTemplateVariables();
  const draftVariables = useStudio((s) => s.draft?.variables ?? EMPTY_VALUES);

  if (field.type === 'menu') return <MenuEditor node={node} fieldKey={field.key} />;

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
  // A field that is exactly one detail shows that detail's name, not its {{code}}.
  const wholeToken = typeof value === 'string' ? value.match(/^\{\{\s*([\w.]+)\s*\}\}$/)?.[1] : undefined;
  const linkedDetail = wholeToken ? variables.find((def) => def.key === wholeToken) : undefined;
  if (linkedDetail) {
    const current = draftVariables[linkedDetail.key];
    return (
      <div>
        <p className={`${labelClass} mb-1`}>{field.label}</p>
        <div className="rounded-md border border-emerald-200 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10 px-2.5 py-2 text-[13px]">
          <p className="flex items-center gap-1.5 font-medium text-emerald-800 dark:text-emerald-300">
            <Link2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            Uses your {linkedDetail.label}
          </p>
          {!readOnly && (
            <div className="mt-1.5 flex gap-3 font-semibold">
              <button type="button" className="text-indigo-600 dark:text-indigo-400 hover:underline" onClick={() => useStudio.getState().setTool('variables')}>Change it</button>
              <button type="button" aria-label={`Type your own ${field.label}`} className="text-slate-500 dark:text-slate-400 hover:underline" onClick={() => set(typeof current === 'string' ? current : '')}>Type your own</button>
            </div>
          )}
        </div>
      </div>
    );
  }
  // Inside a repeating block, a token like {{q.question}} is one field of a list's items.
  const loopParts = wholeToken?.match(/^(\w+)\.(.+)$/);
  const owner = loopParts ? useStudio.getState().documentOfNode(node.id) : null;
  const loopNode = loopParts && owner
    ? [node.id, ...[...getAncestors(owner.content, node.id)].reverse()].map((id) => owner.content.nodes[id]).find((item) => item?.repeat?.as === loopParts[1])
    : undefined;
  const loopList = loopNode ? variables.find((def) => def.key === loopNode.repeat?.list) : undefined;
  if (loopList && loopParts) {
    const itemField = loopList.itemFields?.find((item) => item.key === loopParts[2]);
    return (
      <div>
        <p className={`${labelClass} mb-1`}>{field.label}</p>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10 px-2.5 py-2 text-[13px]">
          <p className="flex items-center gap-1.5 font-medium text-emerald-800 dark:text-emerald-300">
            <Link2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            Uses {itemField?.label ?? field.label} from {loopList.label}
          </p>
          {!readOnly && (
            <button type="button" className="mt-1.5 font-semibold text-indigo-600 dark:text-indigo-400 hover:underline" onClick={() => useStudio.getState().setTool('variables')}>Edit the list</button>
          )}
        </div>
      </div>
    );
  }
  const textual = field.type === 'text' || field.type === 'longtext' || field.type === 'url';
  const usable = variables.filter((def) => def.type !== 'list');

  if (field.type === 'color') {
    return <ColorField label={field.label} disabled={readOnly} value={text} onChange={set} clearable />;
  }

  return (
    <div>
      <label htmlFor={fieldId} className={`${labelClass} mb-1`}>{field.label}</label>
      {field.type === 'longtext' ? (
        <textarea id={fieldId} rows={3} disabled={readOnly} className={`${fieldClass} !h-auto py-1.5`} value={text} onChange={(e) => set(e.target.value)} />
      ) : field.type === 'select' ? (
        <select id={fieldId} disabled={readOnly} className={fieldClass} value={text} onChange={(e) => set(e.target.value)}>
          {(field.options ?? []).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      ) : field.type === 'image' ? (
        <ImageInput id={fieldId} value={text} onChange={set} />
      ) : (
        <input id={fieldId} type={field.type === 'number' ? 'number' : 'text'} disabled={readOnly} className={fieldClass} value={text} onChange={(e) => set(field.type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value)} />
      )}

      {pickSelector && !readOnly && (
        <button type="button" onClick={pickSelector} className="mt-1 inline-flex items-center gap-1 text-[13px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
          <Crosshair className="w-3 h-3" aria-hidden="true" />
          Pick on my site
        </button>
      )}
      {field.help && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{field.help}</p>}
      {linked && (
        <p className="mt-1 flex items-start gap-1 text-xs text-emerald-700 dark:text-emerald-400">
          <Link2 className="w-3 h-3 mt-0.5 shrink-0" aria-hidden="true" />
          Filled in from your variables. Typing here stops it following them.
        </p>
      )}
      {textual && usable.length > 0 && !readOnly && (
        <select
          aria-label={`Insert a variable into ${field.label}`}
          className="mt-1 w-full text-[13px] bg-transparent text-indigo-600 dark:text-indigo-400 focus:outline-none"
          value=""
          onChange={(e) => {
            if (e.target.value) set(`${text}{{${e.target.value}}}`);
          }}
        >
          <option value="">+ Insert a variable</option>
          {usable.map((def) => <option key={def.key} value={def.key}>{def.label}</option>)}
        </select>
      )}
    </div>
  );
};

const AdvancedPanel: React.FC<{ node: DocNode }> = ({ node }) => {
  const readOnly = useStudio((s) => s.readOnly);
  const { updateNode } = useStudio.getState();
  const variables = useTemplateVariables();
  const [isSaving, setIsSaving] = useState(false);
  const owner = useStudio.getState().documentOfNode(node.id);
  const isRoot = owner?.content.rootId === node.id;
  const lists = variables.filter((def) => def.type === 'list');
  const conditions = variables.filter((def) => def.type !== 'list');

  return (
    <div className="space-y-4">
      <label className={labelClass}>Layer name
        <input disabled={readOnly} className={`${fieldClass} mt-1`} value={node.name ?? ''} onChange={(e) => updateNode(node.id, { name: e.target.value })} />
      </label>
      {lists.length > 0 && (
        <label className={labelClass}>Repeat for each item in
          <select
            disabled={readOnly}
            className={`${fieldClass} mt-1`}
            value={node.repeat?.list ?? ''}
            onChange={(e) => updateNode(node.id, { repeat: e.target.value ? { list: e.target.value, as: node.repeat?.as ?? 'item' } : undefined })}
          >
            <option value="">Don't repeat</option>
            {lists.map((def) => <option key={def.key} value={def.key}>{def.label}</option>)}
          </select>
          {node.repeat && <span className="mt-1 block font-normal text-xs text-slate-500 dark:text-slate-400">{`Use {{${node.repeat.as}.fieldName}} in text inside this block.`}</span>}
        </label>
      )}
      {conditions.length > 0 && (
        <label className={labelClass}>Only show when filled in
          <select disabled={readOnly} className={`${fieldClass} mt-1`} value={node.showIf ?? ''} onChange={(e) => updateNode(node.id, { showIf: e.target.value || undefined })}>
            <option value="">Always show</option>
            {conditions.map((def) => <option key={def.key} value={def.key}>{def.label}</option>)}
          </select>
        </label>
      )}
      <label className={`${labelClass} flex items-center gap-2`}>
        <input type="checkbox" disabled={readOnly} checked={Boolean(node.hidden)} onChange={(e) => updateNode(node.id, { hidden: e.target.checked })} />
        Hide this block
      </label>
      <label className={`${labelClass} flex items-center gap-2`}>
        <input type="checkbox" disabled={readOnly} checked={Boolean(node.locked)} onChange={(e) => updateNode(node.id, { locked: e.target.checked })} />
        Lock (can't be moved or deleted)
      </label>
      {!readOnly && !isRoot && (
        <button type="button" className="w-full h-9 inline-flex items-center justify-center gap-1.5 text-[13px] font-semibold rounded-lg border border-slate-200 dark:border-slate-700 hover:border-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors" onClick={() => setIsSaving(true)}>
          <BookmarkPlus className="w-4 h-4" aria-hidden="true" />
          Save to team library
        </button>
      )}
      {isSaving && (
        <SaveToLibrary
          kind="section"
          initialName={node.name ?? BLOCK_META[node.type]?.label ?? 'Section'}
          buildDefinition={async () => {
            const state = useStudio.getState();
            const doc = state.documentOfNode(node.id);
            const section = doc ? sectionFromNode(doc.content, node.id, state.draft?.variables ?? {}) : null;
            if (!section) throw new Error('This block is hidden right now. Show it first, then save it.');
            return section;
          }}
          onClose={() => setIsSaving(false)}
        />
      )}
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
  const readOnly = useStudio((s) => s.readOnly);
  const { updateNode } = useStudio.getState();
  const tab = useStudio((s) => s.inspectorTab);
  const { setInspectorTab } = useStudio.getState();
  const [pickerUrl, setPickerUrl] = useState<string | null>(null);
  const [pickerError, setPickerError] = useState<string | null>(null);
  const meta = BLOCK_META[node.type];
  const projectType = useStudio((s) => s.project?.type) ?? 'page';
  const inputRef = useRef<HTMLInputElement>(null);
  const hasFields = (meta?.fields.length ?? 0) > 0;
  const activeTab = tab === 'content' && !hasFields ? 'style' : tab;

  useEffect(() => {
    if (pickerUrl !== null) inputRef.current?.focus();
  }, [pickerUrl]);

  const tabs = [...(hasFields ? ['content'] : []), 'style', 'advanced'] as const;

  return (
    <>
      <div className="px-3 pt-3 shrink-0">
        <button type="button" className="mb-1 inline-flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400" onClick={() => useStudio.getState().select(null)}>
          <ArrowLeft className="w-3 h-3" aria-hidden="true" />
          {MODULES[projectType].label} settings
        </button>
        <h3 className="font-semibold text-sm truncate">{node.name ?? meta?.label ?? node.type}</h3>
        {node.name && node.name !== meta?.label && <p className="text-xs text-slate-500 dark:text-slate-400">{meta?.label}</p>}
      </div>
      {node.hidden && (
        <div role="status" className="mx-3 mt-2 shrink-0 flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[13px] bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-200">
          <EyeOff className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span className="flex-1">Hidden from the page.</span>
          {!readOnly && <button type="button" className="font-semibold underline" onClick={() => updateNode(node.id, { hidden: false })}>Show</button>}
        </div>
      )}
      <div role="tablist" aria-label="Block settings" className="flex shrink-0 mt-2 px-3 border-b border-slate-200 dark:border-slate-800">
        {tabs.map((id) => (
          <button key={id} role="tab" type="button" aria-selected={activeTab === id} onClick={() => setInspectorTab(id as typeof tab)}
            className={`mr-4 py-2 text-[13px] font-semibold capitalize border-b-2 -mb-px transition-colors ${activeTab === id ? 'border-indigo-600 text-indigo-700 dark:text-indigo-300' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>
            {id}
          </button>
        ))}
      </div>
      <div role="tabpanel" className="relative flex-1 min-h-0 overflow-y-auto p-3 space-y-3">
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
            className="rounded-md border border-slate-200 dark:border-slate-700 p-2 space-y-2"
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
              <input ref={inputRef} type="url" placeholder="https://app.example.com/dashboard" className={`${fieldClass} mt-1`} value={pickerUrl} onChange={(e) => setPickerUrl(e.target.value)} />
            </label>
            <p className="text-xs text-slate-500 dark:text-slate-400">The FlowPilot script must be installed on that page. Click an element there to choose it.</p>
            {pickerError && <p role="alert" className="text-[13px] text-rose-600 dark:text-rose-400">{pickerError}</p>}
            <div className="flex gap-2">
              <button type="submit" className="text-[13px] font-semibold text-indigo-600 dark:text-indigo-400">Open page</button>
              <button type="button" className="text-[13px]" onClick={() => setPickerUrl(null)}>Cancel</button>
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
  const collectsResponses = ['website', 'page', 'form', 'banner'].includes(project.type);

  return (
    <fieldset disabled={readOnly} className="relative flex-1 min-h-0 overflow-y-auto p-3 space-y-4 min-w-0">
      <div>
        <h3 className="font-semibold text-sm">{module.label} settings</h3>
        <p className="text-[13px] text-slate-500 dark:text-slate-400">Select a block on the canvas to edit it.</p>
      </div>

      <label className={labelClass}>Project name
        <input className={`${fieldClass} mt-1`} value={draft.title} onChange={(e) => updateDraft((d) => { d.title = e.target.value; }, 'title')} />
      </label>

      {module.delivery === 'overlay' && (
        <section aria-label="When it appears" className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">When it appears</h4>
          <label className={labelClass}>Page address
            <select className={`${fieldClass} mt-1`} value={rule?.type ?? 'contains'} onChange={(e) => setTriggers({ urlRules: [{ type: e.target.value as 'exact', value: rule?.value ?? '' }] }, 'rule')}>
              <option value="contains">contains</option>
              <option value="starts_with">starts with</option>
              <option value="exact">is exactly</option>
            </select>
          </label>
          <input aria-label="Page address value" placeholder="/dashboard (any page if empty)" className={fieldClass} value={rule?.value ?? ''}
            onChange={(e) => setTriggers({ urlRules: e.target.value ? [{ type: rule?.type ?? 'contains', value: e.target.value }] : [] }, 'rule')} />
          <div className="grid grid-cols-2 gap-2">
            <label className={labelClass}>Delay (seconds)
              <input type="number" min={0} className={`${fieldClass} mt-1`} value={triggers.delaySeconds} onChange={(e) => setTriggers({ delaySeconds: Math.max(0, Number(e.target.value) || 0) }, 'delay')} />
            </label>
            <label className={labelClass}>After scroll (%)
              <input type="number" min={0} max={100} className={`${fieldClass} mt-1`} value={triggers.scrollPercent ?? ''} onChange={(e) => setTriggers({ scrollPercent: e.target.value === '' ? undefined : Math.min(100, Math.max(0, Number(e.target.value))) }, 'scroll')} />
            </label>
          </div>
          <label className={`${labelClass} flex items-center gap-2`}>
            <input type="checkbox" checked={Boolean(triggers.exitIntent)} onChange={(e) => setTriggers({ exitIntent: e.target.checked }, 'exit')} />
            When the visitor is about to leave
          </label>
          <label className={labelClass}>How often
            <select className={`${fieldClass} mt-1`} value={triggers.frequency} onChange={(e) => setTriggers({ frequency: e.target.value as Triggers['frequency'] }, 'frequency')}>
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
                  <label key={device} className="flex items-center gap-1 text-[13px] capitalize">
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
              <select className={`${fieldClass} mt-1`} value={draft.settings.position ?? 'top'} onChange={(e) => updateDraft((d) => { d.settings.position = e.target.value as 'top'; })}>
                <option value="top">Top of the page</option>
                <option value="bottom">Bottom of the page</option>
                <option value="inline">Inside my page</option>
              </select>
            </label>
          )}
        </section>
      )}

      {collectsResponses && (
        <section aria-label="Form responses" className="pt-3 border-t border-slate-100 dark:border-slate-800">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Form responses</h4>
          <label className={labelClass}>Send to webhook (optional)
            <input type="url" placeholder="https://hooks.example.com/..." className={`${fieldClass} mt-1`} value={draft.settings.webhookUrl ?? ''}
              onChange={(e) => updateDraft((d) => {
                if (e.target.value) d.settings.webhookUrl = e.target.value;
                else delete d.settings.webhookUrl;
              }, 'webhook')} />
          </label>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Must start with https://. Responses are also saved in the project.</p>
        </section>
      )}
    </fieldset>
  );
};

/** The Edit tool: the selected block's settings, or the project's when nothing is selected. */
export const SettingsPanel: React.FC = () => {
  const selectedId = useStudio((s) => s.selectedId);
  // Subscribes to documents so edits show in the fields.
  useStudio((s) => s.documents);
  const node = selectedId ? useStudio.getState().getNode(selectedId) : null;

  return (
    <div className="h-full flex flex-col min-h-0">
      {node ? <NodeInspector key={node.id} node={node} /> : <ProjectSettingsPanel />}
    </div>
  );
};
