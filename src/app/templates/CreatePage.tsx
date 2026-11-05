import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Eye, Monitor, Plus, Search, Smartphone, Tablet, X } from 'lucide-react';
import { MODULE_LIST, moduleNoun, MODULES } from '../../core/modules';
import { PROJECT_TYPES, ProjectType } from '../../core/schema';
import { DEVICE_WIDTHS, ProjectPreview } from '../../experience/ProjectPreview';
import { blankProject, initialValues, TemplateDefinition, templatesFor } from '../../templates';
import { teamTemplate } from '../../templates/library';
import { ROUTES } from '../routes';
import { useServices } from '../session';
import { Icon } from '../shared/Icon';
import { BusyLabel, ErrorNote, errorMessage, inputClass, primaryButton, secondaryButton } from '../shared/ui';
import { useWorkspace } from '../workspace';
import { CreateSteps } from './CreateSteps';
import { LiveThumbnail } from './LiveThumbnail';

const DEVICE_BUTTONS = [
  { device: 'desktop', label: 'Desktop', icon: Monitor },
  { device: 'tablet', label: 'Tablet', icon: Tablet },
  { device: 'mobile', label: 'Mobile', icon: Smartphone },
] as const;

/** Team templates in the same form as the built-in ones. */
export const useTeamTemplates = () => {
  const { library } = useServices();
  const { workspace } = useWorkspace();
  const organizationId = workspace?.organizationId;
  const query = useQuery({
    queryKey: ['library', organizationId, 'template'],
    queryFn: () => library.list(organizationId!, 'template'),
    enabled: Boolean(organizationId),
  });
  const templates = useMemo(() => (query.data ?? []).flatMap((item) => teamTemplate(item) ?? []), [query.data]);
  return { ...query, templates, items: query.data ?? [] };
};

const PreviewDialog: React.FC<{ template: TemplateDefinition; onUse: () => void; onClose: () => void }> = ({ template, onUse, onClose }) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [device, setDevice] = useState<keyof typeof DEVICE_WIDTHS>('desktop');
  useEffect(() => {
    dialogRef.current?.showModal?.();
  }, []);
  const documents = useMemo(() => template.pages.map((page, position) => ({ ...page, position })), [template]);

  return (
    <dialog ref={dialogRef} onClose={onClose} aria-labelledby="preview-title" className="w-[calc(100vw-48px)] max-w-none h-[calc(100vh-48px)] max-h-none p-0 rounded-2xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 backdrop:bg-slate-900/70 open:flex flex-col overflow-hidden">
      <header className="shrink-0 flex items-center gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-800">
        <div className="min-w-0">
          <h2 id="preview-title" className="font-bold truncate">{template.title}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{template.description}</p>
        </div>
        <div role="group" aria-label="Preview size" className="ml-auto flex items-center gap-0.5 p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800">
          {DEVICE_BUTTONS.map(({ device: value, label, icon: DeviceIcon }) => (
            <button key={value} type="button" aria-label={label} aria-pressed={device === value} onClick={() => setDevice(value)} className={`p-1.5 rounded-md ${device === value ? 'bg-white dark:bg-slate-600 text-indigo-700 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-300'}`}>
              <DeviceIcon className="w-4 h-4" />
            </button>
          ))}
        </div>
        <button type="button" className={primaryButton} onClick={onUse}>Use this template</button>
        <button type="button" aria-label="Close preview" className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" onClick={onClose}><X className="w-4 h-4" /></button>
      </header>
      <div className="flex-1 min-h-0 p-3 bg-slate-100 dark:bg-slate-950">
        <ProjectPreview type={template.type} documents={documents} theme={template.themes[0].theme} variables={initialValues(template)} settings={template.settings ?? {}} device={device} title={`${template.title} preview`} />
      </div>
    </dialog>
  );
};

const BlankDialog: React.FC<{ type: ProjectType; onClose: () => void }> = ({ type, onClose }) => {
  const { projects } = useServices();
  const { workspace } = useWorkspace();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState('');
  const label = moduleNoun(type);
  useEffect(() => {
    dialogRef.current?.showModal?.();
  }, []);

  const create = useMutation({
    mutationFn: () => projects.create(blankProject(type, workspace!.organizationId, name.trim() || `Untitled ${label}`)),
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project-details'] });
      navigate(ROUTES.studio(id));
    },
  });

  return (
    <dialog ref={dialogRef} onClose={onClose} aria-labelledby="blank-title" className="rounded-2xl p-6 w-full max-w-md bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 backdrop:bg-slate-900/60">
      <form className="space-y-4" onSubmit={(event) => {
        event.preventDefault();
        create.mutate();
      }}>
        <h2 id="blank-title" className="text-lg font-bold">Start a blank {label}</h2>
        <ErrorNote message={create.isError ? errorMessage(create.error) : null} />
        <label className="block text-sm font-medium">Name
          <input autoFocus maxLength={200} placeholder={`Untitled ${label}`} className={`${inputClass} mt-1`} value={name} onChange={(event) => setName(event.target.value)} />
        </label>
        <div className="flex justify-end gap-2">
          <button type="button" className={secondaryButton} disabled={create.isPending} onClick={onClose}>Cancel</button>
          <button type="submit" className={primaryButton} disabled={create.isPending}>
            <BusyLabel busy={create.isPending} busyText="Creating...">Create and open editor</BusyLabel>
          </button>
        </div>
      </form>
    </dialog>
  );
};

/** Choosing what to make: a page of its own, with room to compare templates. */
export const CreatePage: React.FC = () => {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { can } = useWorkspace();
  const team = useTeamTemplates();
  const raw = params.get('type');
  const type: ProjectType = PROJECT_TYPES.includes(raw as ProjectType) ? (raw as ProjectType) : 'website';
  const module = MODULES[type];
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState<TemplateDefinition | null>(null);
  const [isBlankOpen, setIsBlankOpen] = useState(false);

  const all = useMemo(() => [...team.templates.filter((t) => t.type === type), ...templatesFor(type)], [team.templates, type]);
  const categories = [...new Set(all.flatMap((t) => (t.category ? [t.category] : [])))];
  const term = search.trim().toLowerCase();
  const templates = all.filter((t) =>
    (!category || t.category === category)
    && (!term || [t.title, t.description, t.category ?? '', ...t.tags].join(' ').toLowerCase().includes(term)));

  const chooseType = (next: ProjectType) => {
    setParams({ type: next });
    setCategory(null);
    setSearch('');
  };
  const use = (template: TemplateDefinition) => navigate(ROUTES.newFromTemplate(template.id));

  return (
    <div className="app-scroll h-screen flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
      <header className="h-14 shrink-0 grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 min-w-0">
          <Link to={ROUTES.home} aria-label="Back to the dashboard" className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><ArrowLeft className="w-4 h-4" /></Link>
          <h1 className="font-bold truncate">Create new</h1>
        </div>
        <CreateSteps current={1} />
        <span />
      </header>

      <div className="flex-1 min-h-0 flex">
        <nav aria-label="What to create" className="relative w-60 shrink-0 overflow-y-auto p-3 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
          <ul className="space-y-0.5">
            {MODULE_LIST.map((item) => (
              <li key={item.type}>
                <button type="button" aria-current={item.type === type ? 'true' : undefined} onClick={() => chooseType(item.type)}
                  className={`w-full flex items-center gap-2.5 px-2.5 h-10 rounded-lg text-sm font-medium transition-colors ${item.type === type ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                  <Icon name={item.icon} className="w-[18px] h-[18px] shrink-0" />
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <main className="relative flex-1 min-w-0 overflow-y-auto p-6">
          <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
            <div>
              <h2 className="text-xl font-bold">{module.plural}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">{module.description}</p>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" aria-hidden="true" />
              <input type="search" aria-label="Search templates" placeholder="Search templates..." className={`${inputClass} !pl-8`} value={search} onChange={(event) => setSearch(event.target.value)} />
            </div>
          </div>

          {categories.length > 1 && (
            <div role="group" aria-label="Filter templates" className="flex flex-wrap gap-1.5 mb-5">
              {[null, ...categories].map((item) => (
                <button key={item ?? 'all'} type="button" aria-pressed={category === item} onClick={() => setCategory(item)}
                  className={`px-3 h-8 text-[13px] font-medium rounded-full transition-colors ${category === item ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-400 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'}`}>
                  {item ?? 'All'}
                </button>
              ))}
            </div>
          )}

          {templates.length === 0 && term && <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">No templates match your search.</p>}

          <ul aria-label="Templates" className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {can('create:project') && !term && !category && (
              <li>
                <button type="button" onClick={() => setIsBlankOpen(true)} className="w-full h-full min-h-[280px] flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors">
                  <Plus className="w-7 h-7" aria-hidden="true" />
                  <span className="font-semibold">Start blank</span>
                  <span className="text-sm text-slate-500 dark:text-slate-400">Build it yourself in the editor</span>
                </button>
              </li>
            )}
            {templates.map((template) => (
              <li key={template.id} className="group relative rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 hover:shadow-lg transition-all">
                <div className="relative">
                  <LiveThumbnail template={template} className="h-52" />
                  <div className="absolute inset-0 flex items-center justify-center gap-2 bg-slate-900/50 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
                    <button type="button" className={primaryButton} onClick={() => use(template)} aria-label={`Use ${template.title}`}>Use template</button>
                    <button type="button" className={`${secondaryButton} !bg-white !text-slate-800 !border-white`} onClick={() => setPreviewing(template)} aria-label={`Preview ${template.title}`}>
                      <Eye className="w-4 h-4" aria-hidden="true" />
                      Preview
                    </button>
                  </div>
                </div>
                <div className="p-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold truncate">{template.title}</h3>
                    {template.category && <span className="shrink-0 text-xs text-indigo-600 dark:text-indigo-400">{template.category}</span>}
                  </div>
                  <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400 line-clamp-2">{template.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </main>
      </div>

      {previewing && <PreviewDialog template={previewing} onClose={() => setPreviewing(null)} onUse={() => use(previewing)} />}
      {isBlankOpen && <BlankDialog type={type} onClose={() => setIsBlankOpen(false)} />}
    </div>
  );
};
