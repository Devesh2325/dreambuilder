import React, { useState } from 'react';
import { ChevronRight, Eye, EyeOff, FileText, Plus, Trash2 } from 'lucide-react';
import { DocContent, GLOBAL_FOOTER_SLUG, GLOBAL_HEADER_SLUG } from '../core/schema';
import { Icon } from '../app/shared/Icon';
import { errorMessage, inputClass } from '../app/shared/ui';
import { VariableForm } from '../app/shared/VariableForm';
import { BLOCK_META, canContain } from '../renderer/blockMeta';
import { getTemplate } from '../templates';
import { ALL_THEMES } from '../templates/themes';
import { pagesOf } from '../experience/SiteView';
import { MODULES } from '../core/modules';
import { ColorGradientPicker } from '../editor/panels/ColorGradientPicker';
import { FontPicker } from '../editor/panels/FontPicker';
import { useStudio } from './store';
import { validateValues } from '../core/validation';

const CATEGORIES: { id: string; label: string }[] = [
  { id: 'layout', label: 'Layout' },
  { id: 'content', label: 'Content' },
  { id: 'form', label: 'Forms' },
  { id: 'interactive', label: 'Interactive' },
  { id: 'tour', label: 'Tours' },
  { id: 'demo', label: 'Demos' },
];

const AddPanel: React.FC = () => {
  const readOnly = useStudio((s) => s.readOnly);
  const { addBlock, setDragging } = useStudio.getState();
  const type = useStudio((s) => s.project?.type);
  const [message, setMessage] = useState<string | null>(null);

  // Only offers what can be used in this kind of project.
  const relevant = (category: string) => {
    if (category === 'tour') return type === 'tour';
    if (category === 'demo') return type === 'demo';
    return true;
  };

  return (
    <div className="p-3 space-y-5">
      <p className="text-xs text-slate-500 dark:text-slate-400">Click to add to the selected block, or drag onto the canvas.</p>
      {message && <p role="alert" className="text-xs text-rose-600 dark:text-rose-400">{message}</p>}
      {CATEGORIES.filter((c) => relevant(c.id)).map((category) => (
        <section key={category.id} aria-label={category.label}>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1.5">{category.label}</h3>
          <div className="grid grid-cols-2 gap-1.5">
            {Object.values(BLOCK_META).filter((meta) => meta.category === category.id && meta.type !== 'Root').map((meta) => (
              <button
                key={meta.type}
                type="button"
                draggable={!readOnly}
                disabled={readOnly}
                onDragStart={(event) => {
                  event.dataTransfer.effectAllowed = 'copy';
                  event.dataTransfer.setData('text/plain', meta.type);
                  setDragging({ kind: 'block', type: meta.type });
                }}
                onDragEnd={() => setDragging(null)}
                onClick={() => {
                  const added = addBlock(meta.type);
                  setMessage(added ? null : `${meta.label} can't go there. Select a different block first.`);
                }}
                className="flex flex-col items-center gap-1 p-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 cursor-grab disabled:opacity-50"
              >
                <Icon name={meta.icon} />
                {meta.label}
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};

const LayerRow: React.FC<{ content: DocContent; id: string; depth: number }> = ({ content, id, depth }) => {
  const selectedId = useStudio((s) => s.selectedId);
  const readOnly = useStudio((s) => s.readOnly);
  const dragging = useStudio((s) => s.dragging);
  const { select, hover, updateNode, setDragging, moveBlock, getNode } = useStudio.getState();
  const [isOpen, setIsOpen] = useState(true);
  const node = content.nodes[id];
  const meta = BLOCK_META[node.type];
  const [dropMode, setDropMode] = useState<'inside' | null>(null);

  if (!node) return null;
  const label = node.name ?? meta?.label ?? node.type;

  return (
    <li>
      <div
        className={`group flex items-center gap-1 pr-1 rounded text-xs ${selectedId === id ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-200' : 'hover:bg-slate-100 dark:hover:bg-slate-800'} ${dropMode ? 'ring-1 ring-indigo-500' : ''}`}
        style={{ paddingLeft: depth * 12 + 4 }}
        draggable={!readOnly && id !== content.rootId}
        onDragStart={(event) => {
          event.stopPropagation();
          event.dataTransfer.effectAllowed = 'move';
          event.dataTransfer.setData('text/plain', id);
          setDragging({ kind: 'node', id });
        }}
        onDragEnd={() => setDragging(null)}
        onDragOver={(event) => {
          if (dragging?.kind === 'node' && dragging.id !== id) {
            const moving = getNode(dragging.id);
            if (moving && canContain(node.type, moving.type)) {
              event.preventDefault();
              setDropMode('inside');
            }
          }
        }}
        onDragLeave={() => setDropMode(null)}
        onDrop={(event) => {
          event.preventDefault();
          setDropMode(null);
          if (dragging?.kind === 'node') moveBlock(dragging.id, id, node.children.length);
          setDragging(null);
        }}
        onMouseEnter={() => hover(id)}
        onMouseLeave={() => hover(null)}
      >
        {node.children.length > 0 ? (
          <button type="button" aria-label={isOpen ? `Collapse ${label}` : `Expand ${label}`} aria-expanded={isOpen} className="p-0.5" onClick={() => setIsOpen(!isOpen)}>
            <ChevronRight className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-90' : ''}`} aria-hidden="true" />
          </button>
        ) : <span className="w-4" />}
        <button type="button" className="flex-1 flex items-center gap-1.5 py-1 min-w-0 text-left" aria-current={selectedId === id || undefined} onClick={() => select(id)}>
          <Icon name={meta?.icon ?? 'Square'} className="w-3 h-3 shrink-0" />
          <span className={`truncate ${node.hidden ? 'opacity-50' : ''}`}>{label}</span>
          {node.repeat && <span className="shrink-0 text-[10px] px-1 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">repeats</span>}
        </button>
        {id !== content.rootId && !readOnly && (
          <button
            type="button"
            aria-label={node.hidden ? `Show ${label}` : `Hide ${label}`}
            className={`p-0.5 ${node.hidden ? '' : 'opacity-0 group-hover:opacity-100 focus:opacity-100'}`}
            onClick={() => updateNode(id, { hidden: !node.hidden })}
          >
            {node.hidden ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
          </button>
        )}
      </div>
      {isOpen && node.children.length > 0 && (
        <ul>{node.children.map((child) => <LayerRow key={child} content={content} id={child} depth={depth + 1} />)}</ul>
      )}
    </li>
  );
};

const LayersPanel: React.FC = () => {
  const documents = useStudio((s) => s.documents);
  const activeId = useStudio((s) => s.activeDocumentId);
  const visible = useStudio.getState().visibleDocuments();
  void documents;
  void activeId;

  return (
    <div className="p-2 space-y-3">
      {visible.map((doc) => (
        <section key={doc.id} aria-label={doc.title}>
          {visible.length > 1 && <h3 className="px-1 text-xs font-semibold text-slate-400 mb-1">{doc.title}</h3>}
          <ul><LayerRow content={doc.content} id={doc.content.rootId} depth={0} /></ul>
        </section>
      ))}
    </div>
  );
};

const slugFromTitle = (title: string) => title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50);

const PagesPanel: React.FC = () => {
  const documents = useStudio((s) => s.documents);
  const activeId = useStudio((s) => s.activeDocumentId);
  const readOnly = useStudio((s) => s.readOnly);
  const { setActiveDocument, addPage, deletePage, updatePage } = useStudio.getState();
  const [newTitle, setNewTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const pages = pagesOf(documents);
  const active = documents.find((d) => d.id === activeId);

  const run = async (action: () => Promise<void>) => {
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const hasGlobals = documents.some((d) => d.slug === GLOBAL_HEADER_SLUG || d.slug === GLOBAL_FOOTER_SLUG);

  return (
    <div className="p-3 space-y-4">
      <ul className="space-y-1">
        {pages.map((page) => (
          <li key={page.id} className={`flex items-center gap-1 rounded-lg ${page.id === activeId ? 'bg-indigo-100 dark:bg-indigo-950' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
            <button type="button" aria-current={page.id === activeId || undefined} className="flex-1 flex items-center gap-2 px-2 py-1.5 text-sm text-left min-w-0" onClick={() => setActiveDocument(page.id)}>
              <FileText className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">{page.title}</span>
              <span className="ml-auto text-xs text-slate-400 truncate">/{page.slug}</span>
            </button>
            {!readOnly && pages.length > 1 && page.slug !== '' && (
              <button type="button" aria-label={`Delete page ${page.title}`} className="p-1.5 text-slate-400 hover:text-rose-600"
                onClick={() => {
                  if (window.confirm(`Delete the page "${page.title}"? This can't be undone.`)) run(() => deletePage(page.id));
                }}>
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </li>
        ))}
      </ul>
      {error && <p role="alert" className="text-xs text-rose-600 dark:text-rose-400">{error}</p>}

      {!readOnly && (
        <form
          className="flex gap-1.5"
          onSubmit={(event) => {
            event.preventDefault();
            const slug = slugFromTitle(newTitle);
            if (!newTitle.trim() || !slug) {
              setError('Enter a page name using letters or numbers.');
              return;
            }
            run(async () => {
              await addPage(newTitle.trim(), slug);
              setNewTitle('');
            });
          }}
        >
          <input aria-label="New page name" placeholder="New page name" className={inputClass} value={newTitle} onChange={(event) => setNewTitle(event.target.value)} />
          <button type="submit" aria-label="Add page" className="px-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white"><Plus className="w-4 h-4" /></button>
        </form>
      )}

      {active && active.kind === 'page' && !readOnly && (
        <section aria-label="Page settings" className="space-y-2 pt-3 border-t border-slate-200 dark:border-slate-700">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">This page</h3>
          <label className="block text-xs font-medium">Name
            <input className={`${inputClass} mt-1`} value={active.title} onChange={(e) => updatePage(active.id, { title: e.target.value })} />
          </label>
          {active.slug !== '' && (
            <label className="block text-xs font-medium">Address
              <input
                className={`${inputClass} mt-1`}
                value={active.slug}
                onChange={(e) => updatePage(active.id, { slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                onBlur={(e) => updatePage(active.id, { slug: slugFromTitle(e.target.value) || active.slug })}
              />
            </label>
          )}
          <label className="block text-xs font-medium">Search engine title
            <input className={`${inputClass} mt-1`} value={active.seo.title ?? ''} onChange={(e) => updatePage(active.id, { seo: { ...active.seo, title: e.target.value } })} />
          </label>
          <label className="block text-xs font-medium">Search engine description
            <textarea rows={3} className={`${inputClass} mt-1`} value={active.seo.description ?? ''} onChange={(e) => updatePage(active.id, { seo: { ...active.seo, description: e.target.value } })} />
          </label>
        </section>
      )}
      {hasGlobals && <p className="text-xs text-slate-500 dark:text-slate-400">Header and footer are shared: changing them updates every page.</p>}
    </div>
  );
};

const DetailsPanel: React.FC = () => {
  const draft = useStudio((s) => s.draft);
  const project = useStudio((s) => s.project);
  const readOnly = useStudio((s) => s.readOnly);
  const { updateDraft } = useStudio.getState();
  const template = project?.templateId ? getTemplate(project.templateId) : undefined;
  if (!draft) return null;

  if (!template) {
    return <p className="p-3 text-sm text-slate-500 dark:text-slate-400">This project started blank, so it has no details form. Edit content directly on the canvas.</p>;
  }

  const { errors } = validateValues(template.variables, draft.variables);
  return (
    <div className="p-3">
      <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">Change a detail once and it updates everywhere it's used.</p>
      <fieldset disabled={readOnly}>
        <VariableForm
          defs={template.variables}
          values={draft.variables}
          errors={errors}
          onChange={(values) => updateDraft((d) => { d.variables = values; }, 'variables')}
        />
      </fieldset>
    </div>
  );
};

const ThemePanel: React.FC = () => {
  const draft = useStudio((s) => s.draft);
  const { updateDraft } = useStudio.getState();
  if (!draft) return null;
  const { theme } = draft;
  const setColor = (key: keyof typeof theme) => (value: string) => updateDraft((d) => { d.theme[key] = value; }, `theme:${key}`);

  return (
    <div className="p-3 space-y-4">
      <section aria-label="Presets">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1.5">Presets</h3>
        <div className="grid grid-cols-2 gap-1.5">
          {ALL_THEMES.map((preset) => (
            <button key={preset.name} type="button" className="flex items-center gap-1.5 p-1.5 text-xs text-left rounded-lg border border-slate-200 dark:border-slate-700 hover:border-indigo-400"
              onClick={() => updateDraft((d) => { d.theme = preset.theme; })}>
              <span className="w-3.5 h-3.5 shrink-0 rounded-full border border-black/10" style={{ background: preset.theme.primary }} aria-hidden="true" />
              {preset.name}
            </button>
          ))}
        </div>
      </section>
      <ColorGradientPicker label="Primary color" value={theme.primary} onChange={setColor('primary')} comparisonColor={theme.background} />
      <ColorGradientPicker label="Page background" value={theme.background} onChange={setColor('background')} allowGradient={false} />
      <ColorGradientPicker label="Card background" value={theme.surface} onChange={setColor('surface')} allowGradient={false} />
      <ColorGradientPicker label="Text" value={theme.text} onChange={setColor('text')} allowGradient={false} comparisonColor={theme.background} />
      <ColorGradientPicker label="Muted text" value={theme.muted} onChange={setColor('muted')} allowGradient={false} comparisonColor={theme.background} />
      <FontPicker label="Heading font" fontFamily={theme.fontHeading} onChangeFamily={(font) => updateDraft((d) => { d.theme.fontHeading = font; }, 'theme:fontHeading')} />
      <FontPicker label="Body font" fontFamily={theme.fontBody} onChangeFamily={(font) => updateDraft((d) => { d.theme.fontBody = font; }, 'theme:fontBody')} />
      <label className="block text-xs font-medium">Corner roundness
        <select className={`${inputClass} mt-1`} value={theme.radius} onChange={(e) => updateDraft((d) => { d.theme.radius = e.target.value; })}>
          {['0px', '4px', '8px', '10px', '14px', '20px'].map((value) => <option key={value} value={value}>{value}</option>)}
        </select>
      </label>
    </div>
  );
};

type Tab = 'add' | 'layers' | 'pages' | 'details' | 'theme';

export const LeftPanel: React.FC = () => {
  const project = useStudio((s) => s.project);
  const [tab, setTab] = useState<Tab>('details');
  const isWebsite = project?.type === 'website' || (project ? MODULES[project.type].delivery === 'site' : false);

  const tabs: { id: Tab; label: string }[] = [
    { id: 'details', label: 'Details' },
    { id: 'add', label: 'Add' },
    { id: 'layers', label: 'Layers' },
    ...(isWebsite ? [{ id: 'pages' as Tab, label: 'Pages' }] : []),
    { id: 'theme', label: 'Theme' },
  ];

  return (
    <aside aria-label="Tools" className="w-72 shrink-0 flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
      <div role="tablist" aria-label="Tools" className="flex border-b border-slate-200 dark:border-slate-800">
        {tabs.map((item) => (
          <button
            key={item.id}
            role="tab"
            type="button"
            aria-selected={tab === item.id}
            onClick={() => setTab(item.id)}
            className={`flex-1 py-2.5 text-xs font-semibold border-b-2 ${tab === item.id ? 'border-indigo-600 text-indigo-700 dark:text-indigo-300' : 'border-transparent text-slate-500 dark:text-slate-400'}`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" className="flex-1 overflow-y-auto">
        {tab === 'add' && <AddPanel />}
        {tab === 'layers' && <LayersPanel />}
        {tab === 'pages' && <PagesPanel />}
        {tab === 'details' && <DetailsPanel />}
        {tab === 'theme' && <ThemePanel />}
      </div>
    </aside>
  );
};
