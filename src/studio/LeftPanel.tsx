import React, { useState } from 'react';
import { ChevronRight, Eye, EyeOff, FileText, FormInput, Layers, LucideIcon, Palette, Plus, SquarePlus, Trash2 } from 'lucide-react';
import { DocContent, GLOBAL_FOOTER_SLUG, GLOBAL_HEADER_SLUG, ProjectType } from '../core/schema';
import { validateValues } from '../core/validation';
import { Icon } from '../app/shared/Icon';
import { errorMessage } from '../app/shared/ui';
import { VariableForm } from '../app/shared/VariableForm';
import { pagesOf } from '../experience/SiteView';
import { BLOCK_META, canContain } from '../renderer/blockMeta';
import { getTemplate } from '../templates';
import { ALL_THEMES } from '../templates/themes';
import { ColorField, fieldClass, FontField, labelClass } from './fields';
import { useStudio } from './store';

// Each module only offers the blocks that make sense in it.
const LAYOUT = ['Section', 'Container', 'Box', 'Card', 'Grid', 'Row'];
const CONTENT = ['Heading', 'Text', 'Button', 'Image', 'Divider', 'Spacer'];
const FORM = ['Form', 'FormStep', 'FormField', 'ScaleField'];

const BLOCK_GROUPS: Record<ProjectType, { title: string; types: string[] }[]> = {
  website: [{ title: 'Layout', types: LAYOUT }, { title: 'Content', types: [...CONTENT, 'Navbar', 'Accordion'] }, { title: 'Forms', types: FORM }],
  page: [{ title: 'Layout', types: LAYOUT }, { title: 'Content', types: [...CONTENT, 'Navbar', 'Accordion'] }, { title: 'Forms', types: FORM }],
  tour: [{ title: 'Tour', types: ['TourStep'] }, { title: 'Inside a step', types: ['Heading', 'Text', 'Button', 'Image', 'Row'] }],
  form: [{ title: 'Form', types: FORM }, { title: 'Content', types: ['Heading', 'Text', 'Image', 'Divider', 'Spacer'] }],
  demo: [{ title: 'Demo', types: ['DemoScreen', 'DemoHotspot'] }],
  banner: [{ title: 'Banner', types: ['Banner', 'Text', 'Button', 'Image'] }],
  menu: [{ title: 'Menu', types: ['Navbar'] }],
  faq: [{ title: 'FAQ', types: ['Accordion', 'Heading', 'Text'] }, { title: 'Layout', types: ['Box', 'Card', 'Spacer'] }],
  popup: [{ title: 'Popup', types: ['Popup', 'Heading', 'Text', 'Button', 'Image'] }, { title: 'Forms', types: FORM }],
};

const AddPanel: React.FC = () => {
  const readOnly = useStudio((s) => s.readOnly);
  const type = useStudio((s) => s.project?.type);
  const { addBlock, setDragging } = useStudio.getState();
  const [message, setMessage] = useState<string | null>(null);
  if (!type) return null;

  return (
    <div className="p-3 space-y-5">
      <p className="text-xs text-slate-500 dark:text-slate-400">Drag onto the canvas, or click to add after the selected block.</p>
      {message && <p role="alert" className="text-xs text-rose-600 dark:text-rose-400">{message}</p>}
      {BLOCK_GROUPS[type].map((group) => (
        <section key={group.title} aria-label={group.title}>
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">{group.title}</h3>
          <div className="grid grid-cols-3 gap-1.5">
            {group.types.map((blockType) => {
              const meta = BLOCK_META[blockType];
              return (
                <button
                  key={blockType}
                  type="button"
                  draggable={!readOnly}
                  disabled={readOnly}
                  title={meta.label}
                  onDragStart={(event) => {
                    event.dataTransfer.effectAllowed = 'copy';
                    event.dataTransfer.setData('text/plain', blockType);
                    setDragging({ kind: 'block', type: blockType });
                  }}
                  onDragEnd={() => setDragging(null)}
                  onClick={() => {
                    const added = addBlock(blockType);
                    setMessage(added ? null : `${meta.label} can't go there. Select a different block first.`);
                  }}
                  className="flex flex-col items-center justify-center gap-1.5 h-[62px] px-1 text-[11px] leading-tight text-center rounded-lg text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 border border-transparent hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-700 dark:hover:bg-indigo-950/50 dark:hover:text-indigo-300 cursor-grab active:cursor-grabbing transition-colors disabled:opacity-50"
                >
                  <Icon name={meta.icon} className="w-4 h-4" />
                  {meta.label}
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
};

type DropMode = 'before' | 'inside' | 'after';

const LayerRow: React.FC<{ content: DocContent; id: string; depth: number; parentId: string | null; index: number }> = ({ content, id, depth, parentId, index }) => {
  const selectedId = useStudio((s) => s.selectedId);
  const readOnly = useStudio((s) => s.readOnly);
  const dragging = useStudio((s) => s.dragging);
  const { select, hover, updateNode, setDragging, moveBlock, getNode } = useStudio.getState();
  const [isOpen, setIsOpen] = useState(true);
  const [dropMode, setDropMode] = useState<DropMode | null>(null);
  const node = content.nodes[id];
  if (!node) return null;
  const meta = BLOCK_META[node.type];
  const label = node.name ?? meta?.label ?? node.type;

  const dropModeFor = (event: React.DragEvent<HTMLDivElement>): DropMode | null => {
    if (dragging?.kind !== 'node' || dragging.id === id) return null;
    const moving = getNode(dragging.id);
    if (!moving) return null;
    const box = event.currentTarget.getBoundingClientRect();
    const fraction = (event.clientY - box.top) / box.height;
    const fitsSibling = Boolean(parentId) && canContain(content.nodes[parentId!].type, moving.type);
    const fitsInside = canContain(node.type, moving.type);
    if (fitsSibling && fraction < 0.3) return 'before';
    if (fitsSibling && fraction > 0.7) return 'after';
    if (fitsInside) return 'inside';
    return fitsSibling ? (fraction < 0.5 ? 'before' : 'after') : null;
  };

  return (
    <li>
      <div
        className={`group relative flex items-center gap-0.5 pr-1 h-7 rounded-md text-xs transition-colors ${
          selectedId === id
            ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-200'
            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
        } ${dropMode === 'inside' ? 'ring-1 ring-inset ring-indigo-500' : ''}`}
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
          const mode = dropModeFor(event);
          if (mode) event.preventDefault();
          setDropMode(mode);
        }}
        onDragLeave={() => setDropMode(null)}
        onDrop={(event) => {
          event.preventDefault();
          const mode = dropModeFor(event);
          setDropMode(null);
          if (dragging?.kind === 'node' && mode) {
            if (mode === 'inside') moveBlock(dragging.id, id, node.children.length);
            else moveBlock(dragging.id, parentId!, mode === 'before' ? index : index + 1);
          }
          setDragging(null);
        }}
        onMouseEnter={() => hover(id)}
        onMouseLeave={() => hover(null)}
      >
        {dropMode === 'before' && <span className="absolute inset-x-0 top-0 h-0.5 bg-indigo-500" />}
        {dropMode === 'after' && <span className="absolute inset-x-0 bottom-0 h-0.5 bg-indigo-500" />}
        {node.children.length > 0 ? (
          <button type="button" aria-label={isOpen ? `Collapse ${label}` : `Expand ${label}`} aria-expanded={isOpen} className="p-0.5 shrink-0" onClick={() => setIsOpen(!isOpen)}>
            <ChevronRight className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-90' : ''}`} aria-hidden="true" />
          </button>
        ) : <span className="w-4 shrink-0" />}
        <button type="button" className="flex-1 flex items-center gap-1.5 h-full min-w-0 text-left" aria-current={selectedId === id || undefined} onClick={() => select(id)}>
          <Icon name={meta?.icon ?? 'Square'} className="w-3.5 h-3.5 shrink-0 opacity-70" />
          <span className={`truncate ${node.hidden ? 'opacity-50 line-through' : ''}`}>{label}</span>
          {node.repeat && <span className="shrink-0 text-[10px] px-1 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">repeats</span>}
        </button>
        {id !== content.rootId && !readOnly && (
          <button
            type="button"
            aria-label={node.hidden ? `Show ${label}` : `Hide ${label}`}
            title={node.hidden ? 'Show' : 'Hide'}
            className={`p-1 shrink-0 rounded hover:bg-black/5 dark:hover:bg-white/10 ${node.hidden ? '' : 'opacity-0 group-hover:opacity-100 focus:opacity-100'}`}
            onClick={() => updateNode(id, { hidden: !node.hidden })}
          >
            {node.hidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>
      {isOpen && node.children.length > 0 && (
        <ul>{node.children.map((child, childIndex) => <LayerRow key={child} content={content} id={child} depth={depth + 1} parentId={id} index={childIndex} />)}</ul>
      )}
    </li>
  );
};

const LayersPanel: React.FC = () => {
  useStudio((s) => s.documents);
  useStudio((s) => s.activeDocumentId);
  const visible = useStudio.getState().visibleDocuments();

  return (
    <div className="p-2 space-y-3">
      {visible.map((doc) => (
        <section key={doc.id} aria-label={doc.title}>
          {visible.length > 1 && <h3 className="px-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">{doc.title}</h3>}
          <ul><LayerRow content={doc.content} id={doc.content.rootId} depth={0} parentId={null} index={0} /></ul>
        </section>
      ))}
    </div>
  );
};

export const slugFromTitle = (title: string) => title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50);

const PagesPanel: React.FC = () => {
  const documents = useStudio((s) => s.documents);
  const activeId = useStudio((s) => s.activeDocumentId);
  const readOnly = useStudio((s) => s.readOnly);
  const canAddPages = useStudio((s) => s.project?.type === 'website');
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
      <ul className="space-y-0.5">
        {pages.map((page) => (
          <li key={page.id} className={`flex items-center gap-1 rounded-md ${page.id === activeId ? 'bg-indigo-100 dark:bg-indigo-950' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
            <button type="button" aria-current={page.id === activeId || undefined} className="flex-1 flex items-center gap-2 px-2 h-8 text-xs text-left min-w-0" onClick={() => setActiveDocument(page.id)}>
              <FileText className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate font-medium">{page.title}</span>
              <span className="ml-auto text-[11px] text-slate-400 truncate">/{page.slug}</span>
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

      {!readOnly && canAddPages && (
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
          <input aria-label="New page name" placeholder="New page name" className={fieldClass} value={newTitle} onChange={(event) => setNewTitle(event.target.value)} />
          <button type="submit" aria-label="Add page" className="shrink-0 w-8 h-8 flex items-center justify-center rounded-md bg-indigo-600 hover:bg-indigo-700 text-white"><Plus className="w-4 h-4" /></button>
        </form>
      )}

      {active && active.kind === 'page' && !readOnly && (
        <section aria-label="Page settings" className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">This page</h3>
          <label className={labelClass}>Name
            <input className={`${fieldClass} mt-1`} value={active.title} onChange={(e) => updatePage(active.id, { title: e.target.value })} />
          </label>
          {active.slug !== '' && (
            <label className={labelClass}>Address
              <input
                className={`${fieldClass} mt-1`}
                value={active.slug}
                onChange={(e) => updatePage(active.id, { slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                onBlur={(e) => updatePage(active.id, { slug: slugFromTitle(e.target.value) || active.slug })}
              />
            </label>
          )}
          <label className={labelClass}>Search engine title
            <input className={`${fieldClass} mt-1`} value={active.seo.title ?? ''} onChange={(e) => updatePage(active.id, { seo: { ...active.seo, title: e.target.value } })} />
          </label>
          <label className={labelClass}>Search engine description
            <textarea rows={3} className={`${fieldClass} !h-auto py-1.5 mt-1`} value={active.seo.description ?? ''} onChange={(e) => updatePage(active.id, { seo: { ...active.seo, description: e.target.value } })} />
          </label>
        </section>
      )}
      {hasGlobals && <p className="text-xs text-slate-500 dark:text-slate-400">The header and footer are shared, so changing them updates every page.</p>}
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
    return <p className="p-3 text-sm text-slate-500 dark:text-slate-400">This project started blank, so it has no details form. Add blocks from the Add tab and edit them on the canvas.</p>;
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
  const readOnly = useStudio((s) => s.readOnly);
  const { updateDraft } = useStudio.getState();
  if (!draft) return null;
  const { theme } = draft;
  const setValue = (key: keyof typeof theme) => (value: string) => updateDraft((d) => { d.theme[key] = value; }, `theme:${key}`);

  return (
    <div className="p-3 space-y-5">
      <section aria-label="Presets">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Presets</h3>
        <div className="grid grid-cols-2 gap-1.5">
          {ALL_THEMES.map((preset) => (
            <button key={preset.name} type="button" title={preset.name} disabled={readOnly} className="flex items-center gap-2 h-9 px-2 text-[11px] text-left rounded-md border border-slate-200 dark:border-slate-700 hover:border-indigo-400 transition-colors"
              onClick={() => updateDraft((d) => { d.theme = preset.theme; })}>
              <span className="flex shrink-0" aria-hidden="true">
                <span className="w-3.5 h-3.5 rounded-full border border-black/10" style={{ background: preset.theme.primary }} />
                <span className="w-3.5 h-3.5 -ml-1 rounded-full border border-black/10" style={{ background: preset.theme.background }} />
              </span>
              <span className="truncate">{preset.name}</span>
            </button>
          ))}
        </div>
      </section>
      <section aria-label="Colors" className="space-y-3">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Colors</h3>
        <ColorField label="Primary color" disabled={readOnly} value={theme.primary} onChange={setValue('primary')} />
        <ColorField label="Page background" disabled={readOnly} value={theme.background} onChange={setValue('background')} />
        <ColorField label="Card background" disabled={readOnly} value={theme.surface} onChange={setValue('surface')} />
        <ColorField label="Text" disabled={readOnly} value={theme.text} onChange={setValue('text')} />
        <ColorField label="Muted text" disabled={readOnly} value={theme.muted} onChange={setValue('muted')} />
      </section>
      <section aria-label="Typography" className="space-y-3">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Typography</h3>
        <FontField label="Heading font" disabled={readOnly} value={theme.fontHeading} onChange={setValue('fontHeading')} />
        <FontField label="Body font" disabled={readOnly} value={theme.fontBody} onChange={setValue('fontBody')} />
      </section>
      <label className={labelClass}>Corner roundness
        <select disabled={readOnly} className={`${fieldClass} mt-1`} value={theme.radius} onChange={(e) => updateDraft((d) => { d.theme.radius = e.target.value; })}>
          {['0px', '4px', '8px', '10px', '14px', '20px'].map((value) => <option key={value} value={value}>{value}</option>)}
        </select>
      </label>
    </div>
  );
};

type Tab = 'details' | 'add' | 'layers' | 'pages' | 'theme';

export const LeftPanel: React.FC = () => {
  const project = useStudio((s) => s.project);
  const usesPages = project?.type === 'website' || project?.type === 'page';
  // Templates start on their details form, and blank projects on blocks to add. Small
  // screens start closed, because three columns would leave little room for the canvas.
  const [tab, setTab] = useState<Tab | null>(() => {
    if (window.innerWidth < 1200) return null;
    return project?.templateId ? 'details' : 'add';
  });

  const tabs: { id: Tab; label: string; icon: LucideIcon }[] = [
    { id: 'details', label: 'Details', icon: FormInput },
    { id: 'add', label: 'Add', icon: SquarePlus },
    { id: 'layers', label: 'Layers', icon: Layers },
    ...(usesPages ? [{ id: 'pages' as Tab, label: 'Pages', icon: FileText }] : []),
    { id: 'theme', label: 'Theme', icon: Palette },
  ];
  const activeLabel = tabs.find((item) => item.id === tab)?.label;

  return (
    <aside aria-label="Tools" className="shrink-0 flex bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
      <div role="tablist" aria-label="Tools" aria-orientation="vertical" className="w-[60px] shrink-0 flex flex-col items-center gap-1 py-2 border-r border-slate-100 dark:border-slate-800">
        {tabs.map(({ id, label, icon: TabIcon }) => (
          <button
            key={id}
            role="tab"
            type="button"
            aria-selected={tab === id}
            title={tab === id ? `Hide ${label}` : label}
            // Clicking the open tab closes the panel, giving the canvas more room.
            onClick={() => setTab(tab === id ? null : id)}
            className={`w-12 h-12 flex flex-col items-center justify-center gap-1 rounded-lg text-[10px] font-medium transition-colors ${
              tab === id
                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <TabIcon className="w-[18px] h-[18px]" aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>
      {tab && (
        <div role="tabpanel" aria-label={activeLabel} className="w-[264px] flex flex-col min-h-0">
          <h2 className="shrink-0 px-3 pt-3 pb-1 text-sm font-semibold">{activeLabel}</h2>
          <div className="relative flex-1 overflow-y-auto min-h-0">
            {tab === 'add' && <AddPanel />}
            {tab === 'layers' && <LayersPanel />}
            {tab === 'pages' && <PagesPanel />}
            {tab === 'details' && <DetailsPanel />}
            {tab === 'theme' && <ThemePanel />}
          </div>
        </div>
      )}
    </aside>
  );
};
