import React, { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, BookmarkPlus, Copy, Crosshair, EyeOff, Link2, Loader2, Plus, Trash2 } from 'lucide-react';
import { DEFAULT_TRIGGERS, DEVICES, DocNode, Triggers } from '../core/schema';
import { MODULES } from '../core/modules';
import { getAncestors } from '../core/tree';
import { hasToken, resolveString, resolveValue, VariableDef, VariableValues } from '../core/variables';
import { ImageInput } from '../app/shared/VariableForm';
import { pagesOf } from '../experience/SiteView';
import { BLOCK_META } from '../renderer/blockMeta';
import { BlockField } from '../renderer/types';
import { projectVariableDefs } from '../templates';
import { sectionFromNode } from '../templates/library';
import { ProjectField } from './ProjectField';
import { PaymentGuide } from './PaymentGuide';
import { ColorField, fieldClass, labelClass, slugFromTitle } from './fields';
import { DemoPanel, TourPanel } from './ModulePanels';
import { SaveToLibrary } from './SaveToLibrary';
import { useStudio } from './store';
import { StylePanel } from './StylePanel';

const NO_SETTINGS = {};

const useTemplateVariables = (): VariableDef[] => {
  const templateId = useStudio((s) => s.project?.templateId);
  const settings = useStudio((s) => s.draft?.settings ?? NO_SETTINGS);
  const globals = useStudio((s) => s.globals);
  return [...projectVariableDefs(templateId, settings), ...globals.map((item) => ({ key: item.key, label: item.label, type: item.type }))];
};

/** Turns what a field says now into a variable, which is the easiest way to make one. */
const MakeVariable: React.FC<{ node: DocNode; field: BlockField }> = ({ node, field }) => {
  const [name, setName] = useState<string | null>(null);
  const doc = useStudio.getState().documentOfNode(node.id);
  if (!doc) return null;
  if (name === null) {
    return (
      <button type="button" className="mt-1 block text-[13px] font-medium text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400" onClick={() => setName(field.label)}>
        Make this a variable
      </button>
    );
  }
  return (
    <div className="mt-1 flex items-center gap-1">
      <input aria-label="Name for this variable" autoFocus className={fieldClass} value={name} onChange={(event) => setName(event.target.value)} />
      <button
        type="button"
        disabled={!name.trim()}
        className="h-9 px-3 shrink-0 text-[13px] font-semibold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
        onClick={() => {
          useStudio.getState().promoteToVariable(doc.id, node.id, field.key, name.trim(), field.type === 'longtext' ? 'longtext' : field.type === 'image' ? 'image' : field.type === 'url' ? 'url' : 'text');
          setName(null);
        }}
      >
        Save
      </button>
      <button type="button" className="h-9 px-2 shrink-0 text-[13px] rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => setName(null)}>Cancel</button>
    </div>
  );
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

/** Which side a tooltip sits on, and where along that side its arrow is. */
const PlacementField: React.FC<{ node: DocNode; label: string }> = ({ node, label }) => {
  const readOnly = useStudio((s) => s.readOnly);
  const { updateProps } = useStudio.getState();
  const placement = String(node.props.placement || 'bottom');
  const align = String(node.props.align || 'center');
  const side = (value: string, name: string, Arrow: typeof ArrowUp, area: string) => (
    <button type="button" aria-label={`Tooltip ${name}`} aria-pressed={placement === value} disabled={readOnly} title={`Tooltip ${name}`} style={{ gridArea: area }}
      className={`h-8 flex items-center justify-center rounded-md border transition-colors ${placement === value ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-200 dark:border-slate-700 hover:border-indigo-400'}`}
      onClick={() => updateProps(node.id, { placement: value })}>
      <Arrow className="w-4 h-4" aria-hidden="true" />
    </button>
  );
  return (
    <div>
      <p className={`${labelClass} mb-1`}>{label}</p>
      <div className="flex items-center gap-3">
        <div role="group" aria-label="Tooltip side" className="grid gap-1 w-[120px]" style={{ gridTemplateAreas: '". up ." "left mid right" ". down ."', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
          {side('top', 'above', ArrowUp, 'up')}
          {side('left', 'on the left', ArrowLeft, 'left')}
          <span aria-hidden="true" title="The element" style={{ gridArea: 'mid' }} className="h-8 rounded-md bg-slate-100 dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-600" />
          {side('right', 'on the right', ArrowRight, 'right')}
          {side('bottom', 'below', ArrowDown, 'down')}
        </div>
        <div role="group" aria-label="Arrow position" className="flex-1 space-y-1">
          {[['start', 'Arrow at start'], ['center', 'Arrow in middle'], ['end', 'Arrow at end']].map(([value, name]) => (
            <button key={value} type="button" aria-pressed={align === value} disabled={readOnly} onClick={() => updateProps(node.id, { align: value })}
              className={`w-full h-8 text-xs font-medium rounded-md border transition-colors ${align === value ? 'bg-indigo-50 border-indigo-400 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300' : 'border-slate-200 dark:border-slate-700 hover:border-indigo-400'}`}>
              {name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const TOKEN_PATTERN = /\{\{\s*([a-zA-Z][\w.]*)\s*\}\}/g;

interface TokenName {
  key: string;
  label: string;
}

/** Shows {{brand.name}} as [Brand name], so nobody has to read or type code. */
export const toFriendly = (text: string, names: TokenName[]) =>
  text.replace(TOKEN_PATTERN, (match, key: string) => {
    const name = names.find((item) => item.key === key);
    return name ? `[${name.label}]` : match;
  });

export const fromFriendly = (text: string, names: TokenName[]) =>
  text.replace(/\[([^[\]]+)\]/g, (match, label: string) => {
    const name = names.find((item) => item.label === label);
    return name ? `{{${name.key}}}` : match;
  });

const PropField: React.FC<{ node: DocNode; field: BlockField; pickSelector?: () => void }> = ({ node, field, pickSelector }) => {
  const readOnly = useStudio((s) => s.readOnly);
  const { updateProps } = useStudio.getState();
  const variables = useTemplateVariables();
  const draftVariables = useStudio((s) => s.draft?.variables ?? EMPTY_VALUES);

  if (field.type === 'menu') return <MenuEditor node={node} fieldKey={field.key} />;
  if (field.type === 'placement') return <PlacementField node={node} label={field.label} />;
  if (field.type === 'project') return <ProjectField node={node} field={field} />;

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
              <button type="button" className="text-indigo-600 dark:text-indigo-400 hover:underline" onClick={() => useStudio.getState().focusVariable(linkedDetail.key)}>Change it</button>
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
            <button type="button" className="mt-1.5 font-semibold text-indigo-600 dark:text-indigo-400 hover:underline" onClick={() => useStudio.getState().focusVariable(loopList.key)}>Edit the list</button>
          )}
        </div>
      </div>
    );
  }
  const textual = field.type === 'text' || field.type === 'longtext' || field.type === 'url';
  const usable = variables.filter((def) => def.type !== 'list');
  // Inside a repeating block, the fields of each item can be used too.
  const loopOwner = useStudio.getState().documentOfNode(node.id);
  const loopNames: TokenName[] = loopOwner
    ? [node.id, ...getAncestors(loopOwner.content, node.id)].flatMap((id) => {
        const repeat = loopOwner.content.nodes[id]?.repeat;
        const list = repeat ? variables.find((def) => def.key === repeat.list) : undefined;
        return repeat && list ? (list.itemFields ?? []).map((item) => ({ key: `${repeat.as}.${item.key}`, label: item.label })) : [];
      })
    : [];
  const names: TokenName[] = [...loopNames, ...usable.map((def) => ({ key: def.key, label: def.label }))];
  const friendly = textual ? toFriendly(text, names) : text;
  const setFriendly = (next: string) => {
    if (field.slug) set(next.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^[^a-z]+/, ''));
    else set(textual ? fromFriendly(next, names) : next);
  };

  if (field.type === 'color') {
    return <ColorField label={field.label} disabled={readOnly} value={text} onChange={set} clearable />;
  }

  return (
    <div>
      <label htmlFor={fieldId} className={`${labelClass} mb-1`}>{field.label}</label>
      {field.type === 'longtext' ? (
        <textarea id={fieldId} rows={3} disabled={readOnly} className={`${fieldClass} !h-auto py-1.5`} value={friendly} onChange={(e) => setFriendly(e.target.value)} />
      ) : field.type === 'select' ? (
        <select id={fieldId} disabled={readOnly} className={fieldClass} value={text} onChange={(e) => set(e.target.value)}>
          {(field.options ?? []).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      ) : field.type === 'image' ? (
        <ImageInput id={fieldId} value={text} onChange={set} />
      ) : (
        <input id={fieldId} type={field.type === 'number' ? 'number' : 'text'} disabled={readOnly} className={fieldClass} value={friendly} onChange={(e) => (field.type === 'number' ? set(e.target.value === '' ? '' : Number(e.target.value)) : setFriendly(e.target.value))} />
      )}

      {pickSelector && !readOnly && (
        <button type="button" onClick={pickSelector} className="mt-1 inline-flex items-center gap-1 text-[13px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
          <Crosshair className="w-3 h-3" aria-hidden="true" />
          Pick on my site
        </button>
      )}
      {field.help && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{field.help}</p>}
      {field.slug && text && (
        <p className="mt-1 flex items-start gap-1 text-xs text-emerald-700 dark:text-emerald-400">
          <Link2 className="w-3 h-3 mt-0.5 shrink-0" aria-hidden="true" />
          <span>Link to this section with #{text}</span>
        </p>
      )}
      {linked && (
        <p className="mt-1 flex items-start gap-1 text-xs text-emerald-700 dark:text-emerald-400">
          <Link2 className="w-3 h-3 mt-0.5 shrink-0" aria-hidden="true" />
          <span>Shows: {toFriendly(String(resolveString(text.replace(TOKEN_PATTERN, (match, key: string) => (key in draftVariables ? match : `[${names.find((item) => item.key === key)?.label ?? key}]`)), draftVariables)), names)}</span>
        </p>
      )}
      {(textual || field.type === 'image') && !readOnly && !linked && text.trim() !== '' && !field.plain && <MakeVariable node={node} field={field} />}
      {textual && names.length > 0 && !readOnly && !field.plain && (
        <select
          aria-label={`Insert a variable into ${field.label}`}
          className="mt-1 w-full text-[13px] bg-transparent text-indigo-600 dark:text-indigo-400 focus:outline-none"
          value=""
          onChange={(e) => {
            if (e.target.value) set(`${text}{{${e.target.value}}}`);
          }}
        >
          <option value="">+ Insert a variable</option>
          {names.map((name) => <option key={name.key} value={name.key}>{name.label}</option>)}
        </select>
      )}
    </div>
  );
};

const BehaviorSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section aria-label={title} className="space-y-2 pb-4 border-b border-slate-100 dark:border-slate-800 last:border-b-0 last:pb-0">
    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</h4>
    {children}
  </section>
);

const noteClass = 'text-xs font-normal text-slate-500 dark:text-slate-400';
const actionClass = 'w-full h-9 inline-flex items-center justify-center gap-1.5 text-[13px] font-semibold rounded-lg border border-slate-200 dark:border-slate-700 hover:border-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors disabled:opacity-50';

/** How a block acts, rather than how it looks: when it shows, whether it repeats, and so on. */
const BehaviorPanel: React.FC<{ node: DocNode }> = ({ node }) => {
  const readOnly = useStudio((s) => s.readOnly);
  const { updateNode, duplicateBlock, removeBlock, setInspectorTab } = useStudio.getState();
  const variables = useTemplateVariables();
  const [isSaving, setIsSaving] = useState(false);
  const owner = useStudio.getState().documentOfNode(node.id);
  const isRoot = owner?.content.rootId === node.id;
  const lists = variables.filter((def) => def.type === 'list');
  const conditions = variables.filter((def) => def.type !== 'list');

  return (
    <div className="space-y-4">
      <BehaviorSection title="Name">
        <label className={labelClass}>Layer name
          <input disabled={readOnly} className={`${fieldClass} mt-1`} value={node.name ?? ''} onChange={(e) => updateNode(node.id, { name: e.target.value })} />
          <span className={`${noteClass} mt-1 block`}>Only you see this. It helps you find the block in Layers.</span>
        </label>
      </BehaviorSection>

      <BehaviorSection title="Show or hide">
        <label className={`${labelClass} flex items-start gap-2`}>
          <input type="checkbox" className="mt-0.5" disabled={readOnly} checked={Boolean(node.hidden)} onChange={(e) => updateNode(node.id, { hidden: e.target.checked })} />
          <span>Hide this block
            <span className={`${noteClass} block`}>Keeps it here, but visitors won't see it.</span>
          </span>
        </label>
        {conditions.length > 0 && (
          <label className={labelClass}>Only show when filled in
            <select disabled={readOnly} className={`${fieldClass} mt-1`} value={node.showIf ?? ''} onChange={(e) => updateNode(node.id, { showIf: e.target.value || undefined })}>
              <option value="">Always show</option>
              {conditions.map((def) => <option key={def.key} value={def.key}>{def.label}</option>)}
            </select>
            <span className={`${noteClass} mt-1 block`}>For example, hide a phone row when there's no phone number.</span>
          </label>
        )}
        <p className={noteClass}>
          To choose phone, tablet or desktop, open <button type="button" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline" onClick={() => setInspectorTab('style')}>Style</button>.
        </p>
      </BehaviorSection>

      {lists.length > 0 && (
        <BehaviorSection title="Repeat">
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
            <span className={`${noteClass} mt-1 block`}>
              {node.repeat
                ? <>This block appears once for each item. Use <strong>+ Insert a variable</strong> on text inside it to show that item's words.</>
                : 'Makes one copy of this block for every item in a list, such as one card per team member.'}
            </span>
          </label>
        </BehaviorSection>
      )}

      <BehaviorSection title="Protect">
        <label className={`${labelClass} flex items-start gap-2`}>
          <input type="checkbox" className="mt-0.5" disabled={readOnly} checked={Boolean(node.locked)} onChange={(e) => updateNode(node.id, { locked: e.target.checked })} />
          <span>Lock this block
            <span className={`${noteClass} block`}>It can't be moved or deleted by accident. You can still edit it.</span>
          </span>
        </label>
      </BehaviorSection>

      {!readOnly && !isRoot && (
        <BehaviorSection title="Actions">
          <div className="grid grid-cols-2 gap-2">
            <button type="button" className={actionClass} onClick={() => duplicateBlock(node.id)}><Copy className="w-4 h-4" aria-hidden="true" />Duplicate</button>
            <button type="button" disabled={Boolean(node.locked)} title={node.locked ? 'Unlock it first' : undefined} className={`${actionClass} hover:!border-rose-400 hover:!text-rose-600`} onClick={() => removeBlock(node.id)}><Trash2 className="w-4 h-4" aria-hidden="true" />Delete</button>
          </div>
          <button type="button" className={actionClass} onClick={() => setIsSaving(true)}>
            <BookmarkPlus className="w-4 h-4" aria-hidden="true" />
            Save to team library
          </button>
        </BehaviorSection>
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
  useStudio.getState().updateDraft((d) => { d.settings.builderUrl = url; }, 'builderUrl');
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
  const builderUrl = useStudio((s) => s.draft?.settings.builderUrl);
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
            {id === 'advanced' ? 'Behavior' : id}
          </button>
        ))}
      </div>
      <div role="tabpanel" className="relative flex-1 min-h-0 overflow-y-auto p-3 space-y-3">
        {activeTab === 'content' && meta?.fields.filter((field) => {
          // These only mean something for a tooltip attached to an element.
          if (node.type !== 'TourStep' || !['selector', 'placement', 'advance', 'fallback'].includes(field.key)) return true;
          return (node.props.layout || 'tooltip') === 'tooltip';
        }).map((field) => (
          <PropField
            key={field.key}
            node={node}
            field={field}
            pickSelector={node.type === 'TourStep' && field.key === 'selector' ? () => {
              if (builderUrl) openElementPicker(builderUrl, node.id);
              else setPickerUrl('');
            } : undefined}
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
        {activeTab === 'content' && node.type === 'PaymentButton' && <PaymentGuide provider={String(node.props.provider ?? 'stripe')} url={String(node.props.url ?? '')} />}
        {activeTab === 'style' && <StylePanel node={node} />}
        {activeTab === 'advanced' && <BehaviorPanel node={node} />}
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

      {project.type === 'demo' && <DemoPanel />}

      <label className={labelClass}>Project name
        <input className={`${fieldClass} mt-1`} value={draft.title} onChange={(e) => updateDraft((d) => { d.title = e.target.value; }, 'title')} />
      </label>

      {project.type === 'tour' && <TourPanel project={project} />}

      {module.delivery === 'overlay' && (
        <section aria-label="When it appears" className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">When it appears</h4>
          <label className={labelClass}>Starts
            <select className={`${fieldClass} mt-1`} value={triggers.manualOnly ? 'manual' : triggers.clickSelector !== undefined ? 'click' : 'auto'} onChange={(e) => setTriggers({
              manualOnly: e.target.value === 'manual' || undefined,
              clickSelector: e.target.value === 'click' ? (triggers.clickSelector ?? '') : undefined,
            }, 'start')}>
              <option value="auto">By itself, on the pages below</option>
              <option value="click">When someone clicks an element</option>
              <option value="manual">Only from my own code</option>
            </select>
          </label>
          {triggers.clickSelector !== undefined && !triggers.manualOnly && (
            <label className={labelClass}>Element they click
              <input placeholder="#help-button" className={`${fieldClass} mt-1`} value={triggers.clickSelector} onChange={(e) => setTriggers({ clickSelector: e.target.value }, 'clickSelector')} />
            </label>
          )}
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
