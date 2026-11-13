import React, { useState } from 'react';
import { ArrowDown, ArrowUp, Braces, ChevronRight, CircleHelp, Eye, EyeOff, FileText, GripVertical, Layers, LucideIcon, PanelLeft, Palette, Pencil, Plus, Search, SlidersHorizontal, SquarePlus, Trash2, X } from 'lucide-react';
import { DocContent, GLOBAL_FOOTER_SLUG, GLOBAL_HEADER_SLUG, ProjectType } from '../core/schema';
import { Icon } from '../app/shared/Icon';
import { MODULES } from '../core/modules';
import { BusyIcon, errorMessage } from '../app/shared/ui';
import { pagesOf } from '../experience/SiteView';
import { BLOCK_META, canContain } from '../renderer/blockMeta';
import { ALL_THEMES } from '../templates/themes';
import { ColorField, fieldClass, FontField, labelClass, slugFromTitle } from './fields';
import { useEmbeddableProjects } from './ProjectField';
import { SectionsPanel, usesSections } from './SectionsPanel';
import { SettingsPanel } from './SettingsPanel';
import { StudioTool, useStudio } from './store';
import { VariablesPanel } from './VariablesPanel';

// Each module only offers the blocks that make sense in it.
const LAYOUT = ['Section', 'Container', 'Box', 'Card', 'Grid', 'Row', 'Rating'];
const CONTENT = ['Heading', 'Text', 'Button', 'PaymentButton', 'Image', 'Video', 'Divider', 'Spacer'];
const FORM = ['Form', 'FormStep', 'FormField', 'ScaleField'];
const MOVING = ['Marquee', 'Carousel', 'Slide'];
const ARTICLE = ['Avatar', 'Icon', 'List', 'Quote', 'Callout', 'CodeBlock', 'Table', 'Badge'];

const BLOCK_GROUPS: Record<ProjectType, { title: string; types: string[] }[]> = {
  website: [{ title: 'Layout', types: LAYOUT }, { title: 'Content', types: [...CONTENT, 'Rating', 'Navbar', 'Accordion', 'Banner'] }, { title: 'Articles and docs', types: ARTICLE }, { title: 'Moving', types: MOVING }, { title: 'Forms', types: FORM }],
  page: [{ title: 'Layout', types: LAYOUT }, { title: 'Content', types: [...CONTENT, 'Rating', 'Navbar', 'Accordion', 'Banner'] }, { title: 'Articles and docs', types: ARTICLE }, { title: 'Moving', types: MOVING }, { title: 'Forms', types: FORM }],
  tour: [{ title: 'Tour', types: ['TourStep'] }, { title: 'Inside a step', types: ['Heading', 'Text', 'Button', 'Image', 'Video', 'Rating', 'ProjectEmbed', 'Row'] }],
  form: [{ title: 'Form', types: FORM }, { title: 'Content', types: ['Heading', 'Text', 'Image', 'Divider', 'Spacer'] }],
  demo: [{ title: 'Demo', types: ['DemoScreen', 'DemoHotspot'] }],
  banner: [
    { title: 'Banner styles', types: ['Banner', 'Popup', 'Carousel', 'Slide'] },
    { title: 'Content', types: ['Heading', 'Text', 'Button', 'Image', 'Video'] },
    { title: 'Forms', types: FORM },
  ],
  menu: [{ title: 'Menu', types: ['Navbar'] }],
  faq: [{ title: 'FAQ', types: ['Accordion', 'Heading', 'Text', 'Callout', 'List'] }, { title: 'Layout', types: ['Box', 'Card', 'Spacer'] }],
};

const SearchBox: React.FC<{ label: string; placeholder: string; value: string; onChange: (value: string) => void }> = ({ label, placeholder, value, onChange }) => (
  <div className="relative">
    <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" aria-hidden="true" />
    <input type="search" aria-label={label} placeholder={placeholder} className={`${fieldClass} !pl-8`} value={value} onChange={(event) => onChange(event.target.value)} />
  </div>
);

/** A project from elsewhere in the workspace, placed in this page as one block. */
const ProjectsList: React.FC = () => {
  const list = useEmbeddableProjects();
  const readOnly = useStudio((s) => s.readOnly);
  const [message, setMessage] = useState<string | null>(null);
  return (
    <div className="space-y-3">
      <p className="text-[13px] text-slate-500 dark:text-slate-400">Show one of your forms, demos, banners, FAQs, menus or tours in this page. Change it there, and it updates here when you publish it.</p>
      {message && <p role="alert" className="text-[13px] text-rose-600 dark:text-rose-400">{message}</p>}
      {list.isSuccess && list.data?.length === 0 && (
        <p className="text-[13px] rounded-lg px-2.5 py-2 bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-300">Nothing to add yet. Create a form, demo or banner first, and it appears here.</p>
      )}
      <ul className="space-y-1">
        {list.data?.map((project) => (
          <li key={project.id}>
            <button
              type="button"
              disabled={readOnly}
              className="w-full flex items-center gap-2.5 p-2 text-left rounded-lg border border-transparent bg-slate-50 dark:bg-slate-800/60 hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors"
              onClick={() => {
                const state = useStudio.getState();
                const id = state.addBlock('ProjectEmbed');
                if (!id) {
                  setMessage("That can't go there. Select a different block first.");
                  return;
                }
                setMessage(null);
                state.updateProps(id, { projectId: project.id });
                state.updateNode(id, { name: project.title });
              }}
            >
              <span className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-300"><Icon name={MODULES[project.type].icon} /></span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-medium truncate">{project.title}</span>
                <span className="block text-xs text-slate-500 dark:text-slate-400">{MODULES[project.type].label}{project.status === 'published' ? '' : ' · Not published yet'}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

const AddPanel: React.FC = () => {
  const type = useStudio((s) => s.project?.type);
  const [tab, setTab] = useState<'blocks' | 'sections' | 'projects'>('blocks');
  if (!type) return null;
  if (!usesSections(type)) return <div className="p-3"><BlocksList /></div>;

  return (
    <div className="p-3 space-y-3">
      <div role="tablist" aria-label="What to add" className="flex p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800">
        {(['blocks', 'sections', 'projects'] as const).map((id) => (
          <button key={id} role="tab" type="button" aria-selected={tab === id} onClick={() => setTab(id)}
            className={`flex-1 h-8 rounded-md text-[13px] font-semibold capitalize transition-colors ${tab === id ? 'bg-white dark:bg-slate-600 text-indigo-700 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-300'}`}>
            {id}
          </button>
        ))}
      </div>
      {tab === 'blocks' && <BlocksList />}
      {tab === 'sections' && <SectionsPanel />}
      {tab === 'projects' && <ProjectsList />}
    </div>
  );
};

const BlocksList: React.FC = () => {
  const readOnly = useStudio((s) => s.readOnly);
  const type = useStudio((s) => s.project?.type);
  const { addBlock, setDragging } = useStudio.getState();
  const [message, setMessage] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  if (!type) return null;
  const term = search.trim().toLowerCase();
  const groups = BLOCK_GROUPS[type]
    .map((group) => ({ ...group, types: group.types.filter((blockType) => BLOCK_META[blockType].label.toLowerCase().includes(term)) }))
    .filter((group) => group.types.length > 0);

  return (
    <div className="space-y-5">
      <SearchBox label="Search blocks" placeholder="Search blocks" value={search} onChange={setSearch} />
      <p className="text-[13px] text-slate-500 dark:text-slate-400">Drag onto the canvas, or click to add after the selected block.</p>
      {message && <p role="alert" className="text-[13px] text-rose-600 dark:text-rose-400">{message}</p>}
      {groups.length === 0 && <p className="text-[13px] text-slate-500 dark:text-slate-400">No block is called that.</p>}
      {groups.map((group) => (
        <section key={group.title} aria-label={group.title}>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">{group.title}</h3>
          <div className="grid grid-cols-3 gap-1.5">
            {group.types.map((blockType) => {
              const meta = BLOCK_META[blockType];
              const add = () => {
                if (readOnly) return;
                const added = addBlock(blockType);
                setMessage(added ? null : `${meta.label} can't go there. Select a different block first.`);
              };
              return (
                <div
                  key={blockType}
                  role="button"
                  tabIndex={readOnly ? -1 : 0}
                  aria-disabled={readOnly}
                  // A div, because Firefox can't start a drag from a button.
                  draggable={!readOnly}
                  title={meta.label}
                  onDragStart={(event) => {
                    event.dataTransfer.effectAllowed = 'copy';
                    event.dataTransfer.setData('text/plain', blockType);
                    useStudio.getState().beginDrag({ kind: 'block', type: blockType });
                  }}
                  onDragEnd={() => setDragging(null)}
                  onClick={add}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      add();
                    }
                  }}
                  className="flex flex-col items-center justify-center gap-1.5 h-[72px] px-1 text-[13px] leading-tight text-center rounded-xl text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 border border-transparent hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-700 dark:hover:bg-indigo-950/50 dark:hover:text-indigo-300 cursor-grab active:cursor-grabbing transition-colors disabled:opacity-50"
                >
                  <Icon name={meta.icon} className="w-5 h-5" />
                  {meta.label}
                </div>
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
  const { select, hover, updateNode, setDragging, moveBlock, getNode, setTool } = useStudio.getState();
  const siblingCount = parentId ? content.nodes[parentId].children.length : 0;
  const canMove = !readOnly && parentId !== null && !content.nodes[id]?.locked;
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
        className={`group relative flex items-center gap-0.5 pr-1 h-8 rounded-lg text-[13px] transition-colors ${
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
          useStudio.getState().beginDrag({ kind: 'node', id });
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
        {canMove
          ? <span title="Drag to move" className="shrink-0 cursor-grab active:cursor-grabbing text-slate-400 opacity-0 group-hover:opacity-100" aria-hidden="true"><GripVertical className="w-3.5 h-3.5" /></span>
          : <span className="w-3.5 shrink-0" />}
        {node.children.length > 0 ? (
          <button type="button" aria-label={isOpen ? `Collapse ${label}` : `Expand ${label}`} aria-expanded={isOpen} className="p-0.5 shrink-0" onClick={() => setIsOpen(!isOpen)}>
            <ChevronRight className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-90' : ''}`} aria-hidden="true" />
          </button>
        ) : <span className="w-4 shrink-0" />}
        <button type="button" className="flex-1 flex items-center gap-1.5 h-full min-w-0 text-left" aria-current={selectedId === id || undefined} onClick={() => select(id)}>
          <Icon name={meta?.icon ?? 'Square'} className="w-3.5 h-3.5 shrink-0 opacity-70" />
          <span className={`truncate ${node.hidden ? 'opacity-50 line-through' : ''}`}>{label}</span>
          {Boolean(node.hideOn?.length) && <span title={`Hidden on ${node.hideOn!.join(', ')}`} className="shrink-0 text-[11px] px-1 rounded capitalize bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">not on {node.hideOn![0]}{node.hideOn!.length > 1 ? '+' : ''}</span>}
          {node.repeat && <span className="shrink-0 text-[11px] px-1 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">repeats</span>}
        </button>
        {canMove && (
          <>
            <button type="button" aria-label={`Move ${label} up`} title="Move up" disabled={index === 0} className="p-1 shrink-0 rounded hover:bg-black/5 dark:hover:bg-white/10 opacity-0 group-hover:opacity-100 group-hover:disabled:opacity-25 focus:opacity-100" onClick={() => moveBlock(id, parentId!, index - 1)}>
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
            <button type="button" aria-label={`Move ${label} down`} title="Move down" disabled={index === siblingCount - 1} className="p-1 shrink-0 rounded hover:bg-black/5 dark:hover:bg-white/10 opacity-0 group-hover:opacity-100 group-hover:disabled:opacity-25 focus:opacity-100" onClick={() => moveBlock(id, parentId!, index + 2)}>
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
          </>
        )}
        <button type="button" aria-label={`Edit ${label}`} title="Edit" className="p-1 shrink-0 rounded hover:bg-black/5 dark:hover:bg-white/10 opacity-0 group-hover:opacity-100 focus:opacity-100"
          onClick={() => {
            select(id);
            setTool('edit');
          }}>
          <Pencil className="w-3.5 h-3.5" />
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

const textOfNode = (props: Record<string, unknown>) => ['text', 'question', 'label', 'title', 'brand', 'alt'].map((key) => props[key]).filter((value) => typeof value === 'string').join(' ');

const LayersPanel: React.FC = () => {
  useStudio((s) => s.documents);
  useStudio((s) => s.activeDocumentId);
  const selectedId = useStudio((s) => s.selectedId);
  const { select, hover } = useStudio.getState();
  const [search, setSearch] = useState('');
  const visible = useStudio.getState().visibleDocuments();
  const term = search.trim().toLowerCase();

  return (
    <div className="p-2 space-y-3">
      <div className="px-1"><SearchBox label="Search layers" placeholder="Find a block by name or text" value={search} onChange={setSearch} /></div>
      {term ? (() => {
        const found = visible.flatMap((doc) => Object.values(doc.content.nodes).filter((node) => {
          const name = node.name ?? BLOCK_META[node.type]?.label ?? node.type;
          return `${name} ${textOfNode(node.props)}`.toLowerCase().includes(term);
        }));
        return found.length === 0 ? <p className="px-1 text-[13px] text-slate-500 dark:text-slate-400">Nothing matches.</p> : (
          <ul aria-label="Matching blocks">
            {found.map((node) => (
              <li key={node.id}>
                <button type="button" aria-current={selectedId === node.id || undefined} className={`w-full flex items-center gap-2 px-2 py-1.5 text-[13px] text-left rounded-lg ${selectedId === node.id ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-200' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`} onMouseEnter={() => hover(node.id)} onMouseLeave={() => hover(null)} onClick={() => select(node.id)}>
                  <Icon name={BLOCK_META[node.type]?.icon ?? 'Square'} className="w-3.5 h-3.5 shrink-0 opacity-70" />
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{node.name ?? BLOCK_META[node.type]?.label ?? node.type}</span>
                    {textOfNode(node.props) && <span className="block truncate text-xs text-slate-500 dark:text-slate-400">{textOfNode(node.props)}</span>}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        );
      })() : visible.map((doc) => (
        <section key={doc.id} aria-label={doc.title}>
          {visible.length > 1 && <h3 className="px-1 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">{doc.title}</h3>}
          <ul><LayerRow content={doc.content} id={doc.content.rootId} depth={0} parentId={null} index={0} /></ul>
        </section>
      ))}
    </div>
  );
};

const PagesPanel: React.FC = () => {
  const documents = useStudio((s) => s.documents);
  const activeId = useStudio((s) => s.activeDocumentId);
  const readOnly = useStudio((s) => s.readOnly);
  const canAddPages = useStudio((s) => s.project?.type === 'website');
  const { setActiveDocument, addPage, deletePage, updatePage } = useStudio.getState();
  const [newTitle, setNewTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const pages = pagesOf(documents);
  const active = documents.find((d) => d.id === activeId);

  const run = async (id: string, action: () => Promise<void>) => {
    setError(null);
    setBusy(id);
    try {
      await action();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const hasGlobals = documents.some((d) => d.slug === GLOBAL_HEADER_SLUG || d.slug === GLOBAL_FOOTER_SLUG);

  return (
    <div className="p-3 space-y-4">
      <ul className="space-y-0.5">
        {pages.map((page) => (
          <li key={page.id} className={`flex items-center gap-1 rounded-md ${page.id === activeId ? 'bg-indigo-100 dark:bg-indigo-950' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
            <button type="button" aria-current={page.id === activeId || undefined} className="flex-1 flex items-center gap-2 px-2 h-8 text-[13px] text-left min-w-0" onClick={() => setActiveDocument(page.id)}>
              <FileText className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate font-medium">{page.title}</span>
              <span className="ml-auto text-xs text-slate-400 truncate">/{page.slug}</span>
            </button>
            {!readOnly && pages.length > 1 && page.slug !== '' && (
              <button type="button" aria-label={`Delete page ${page.title}`} disabled={busy !== null} className="p-1.5 text-slate-400 hover:text-rose-600"
                onClick={() => {
                  if (window.confirm(`Delete the page "${page.title}"? This can't be undone.`)) run(page.id, () => deletePage(page.id));
                }}>
                <BusyIcon busy={busy === page.id} className="w-3.5 h-3.5"><Trash2 className="w-3.5 h-3.5" /></BusyIcon>
              </button>
            )}
          </li>
        ))}
      </ul>
      {error && <p role="alert" className="text-[13px] text-rose-600 dark:text-rose-400">{error}</p>}

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
            run('new', async () => {
              await addPage(newTitle.trim(), slug);
              setNewTitle('');
            });
          }}
        >
          <input aria-label="New page name" placeholder="New page name" className={fieldClass} value={newTitle} onChange={(event) => setNewTitle(event.target.value)} />
          <button type="submit" aria-label="Add page" disabled={busy !== null} className="shrink-0 w-9 h-9 flex items-center justify-center rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white"><BusyIcon busy={busy === 'new'}><Plus className="w-4 h-4" /></BusyIcon></button>
        </form>
      )}

      {active && active.kind === 'page' && !readOnly && (
        <section aria-label="Page settings" className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">This page</h3>
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
      {hasGlobals && <p className="text-[13px] text-slate-500 dark:text-slate-400">The header and footer are shared, so changing them updates every page.</p>}
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
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Presets</h3>
        <div className="grid grid-cols-2 gap-1.5">
          {ALL_THEMES.map((preset) => (
            <button key={preset.name} type="button" title={preset.name} disabled={readOnly} className="flex items-center gap-2 h-9 px-2 text-xs text-left rounded-md border border-slate-200 dark:border-slate-700 hover:border-indigo-400 transition-colors"
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
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Colors</h3>
        <ColorField label="Primary color" disabled={readOnly} value={theme.primary} onChange={setValue('primary')} />
        <ColorField label="Page background" disabled={readOnly} value={theme.background} onChange={setValue('background')} />
        <ColorField label="Card background" disabled={readOnly} value={theme.surface} onChange={setValue('surface')} />
        <ColorField label="Text" disabled={readOnly} value={theme.text} onChange={setValue('text')} />
        <ColorField label="Muted text" disabled={readOnly} value={theme.muted} onChange={setValue('muted')} />
      </section>
      <section aria-label="Typography" className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Typography</h3>
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

const TOOL_HINTS: Partial<Record<StudioTool, string>> = {
  add: 'Drag blocks and sections onto your page.',
  variables: 'Your details, all in one place.',
  layers: 'Everything on this page, in order.',
  pages: 'Your pages, their addresses and search settings.',
  theme: 'Colors and fonts for the whole project.',
};

const railDivider = <span role="presentation" className="w-8 my-1 border-t border-slate-200 dark:border-slate-700" />;

/** The studio's single side panel. Everything lives here, so the canvas gets the rest. */
export const LeftPanel: React.FC<{ onStartTour?: () => void }> = ({ onStartTour }) => {
  const project = useStudio((s) => s.project);
  const tool = useStudio((s) => s.tool);
  const { setTool } = useStudio.getState();
  const [lastTool, setLastTool] = useState<StudioTool>('edit');
  const usesPages = project?.type === 'website' || project?.type === 'page';

  // Grouped by what they're for: building, your content, and the overall look.
  const toolGroups: { id: StudioTool; label: string; icon: LucideIcon }[][] = [
    [
      { id: 'edit', label: 'Edit', icon: SlidersHorizontal },
      { id: 'add', label: 'Add', icon: SquarePlus },
    ],
    [
      { id: 'variables', label: 'Variables', icon: Braces },
      { id: 'layers', label: 'Layers', icon: Layers },
      ...(usesPages ? [{ id: 'pages' as StudioTool, label: 'Pages', icon: FileText }] : []),
    ],
    [{ id: 'theme', label: 'Theme', icon: Palette }],
  ];
  const active = toolGroups.flat().find((item) => item.id === tool);

  return (
    <aside aria-label="Tools" className="relative z-10 shrink-0 flex bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
      <div role="tablist" aria-label="Tools" aria-orientation="vertical" data-tour="studio-tools" className="no-scrollbar w-[68px] shrink-0 flex flex-col items-center gap-1 py-2 overflow-y-auto border-r border-slate-100 dark:border-slate-800">
        {toolGroups.map((group, groupIndex) => (
          <React.Fragment key={group[0].id}>
            {groupIndex > 0 && railDivider}
            {group.map(({ id, label, icon: ToolIcon }) => (
              <button
                key={id}
                role="tab"
                type="button"
                aria-selected={tool === id}
                data-tour={`tool-${id}`}
                title={tool === id ? `Close ${label}` : TOOL_HINTS[id] ?? label}
                // Clicking the open tool closes the panel, giving the canvas more room.
                onClick={() => {
                  setLastTool(id);
                  setTool(tool === id ? null : id);
                }}
                className={`relative w-[60px] h-[50px] flex flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-medium transition-colors ${
                  tool === id
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-200'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {tool === id && <span aria-hidden="true" className="absolute -left-1 top-2.5 bottom-2.5 w-[3px] rounded-r-full bg-indigo-600 dark:bg-indigo-400" />}
                <ToolIcon className="w-5 h-5" aria-hidden="true" />
                {label}
              </button>
            ))}
          </React.Fragment>
        ))}
        <div className="mt-auto flex flex-col items-center gap-1">
          {onStartTour && (
            <button type="button" aria-label="Take a tour of the editor" title="Take a tour of the editor" onClick={onStartTour} className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors">
              <CircleHelp className="w-[18px] h-[18px]" aria-hidden="true" />
            </button>
          )}
          <button
            type="button"
            aria-label={tool ? 'Hide panel' : 'Show panel'}
            title={tool ? 'Hide panel' : 'Show panel'}
            onClick={() => setTool(tool ? null : lastTool)}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
          >
            <PanelLeft className="w-[18px] h-[18px]" aria-hidden="true" />
          </button>
        </div>
      </div>
      {tool && active && (
        <div role="tabpanel" aria-label={active.label} className="w-[320px] flex flex-col min-h-0">
          {tool !== 'edit' && (
            <div className="shrink-0 flex items-start justify-between gap-2 px-3 pt-3 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="min-w-0">
                <h2 className="text-base font-semibold leading-tight">{active.label}</h2>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{TOOL_HINTS[tool]}</p>
              </div>
              <button type="button" aria-label="Close panel" title="Close panel" className="shrink-0 p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-800" onClick={() => setTool(null)}>
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          <div className="relative flex-1 overflow-y-auto overflow-x-hidden min-h-0">
            {tool === 'edit' && <SettingsPanel />}
            {tool === 'add' && <AddPanel />}
            {tool === 'layers' && <LayersPanel />}
            {tool === 'pages' && <PagesPanel />}
            {tool === 'variables' && <VariablesPanel />}
            {tool === 'theme' && <ThemePanel />}
          </div>
        </div>
      )}
    </aside>
  );
};
