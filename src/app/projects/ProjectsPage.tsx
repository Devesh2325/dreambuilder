import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Copy, ExternalLink, Pencil, Search, Trash2 } from 'lucide-react';
import { MODULE_LIST, MODULES } from '../../core/modules';
import { ProjectType } from '../../core/schema';
import { DocumentRecord, ProjectRecord } from '../../data/services';
import { publicSitePath, ROUTES } from '../routes';
import { useServices } from '../session';
import { Icon } from '../shared/Icon';
import { cardClass, EmptyState, ErrorNote, errorMessage, inputClass, LoadingNote, PageHeader } from '../shared/ui';
import { CreateButton } from '../templates/CreateDialog';
import { useWorkspace } from '../workspace';
import { describeFrequency, describePages, describeTrigger, duplicateProject, moduleCount } from './projectHelpers';

export const StatusBadge: React.FC<{ status: string }> = ({ status }) => (
  <span
    className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
      status === 'published'
        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
    }`}
  >
    <span className={`w-1.5 h-1.5 rounded-full ${status === 'published' ? 'bg-emerald-500' : 'bg-slate-400'}`} aria-hidden="true" />
    {status === 'published' ? 'Live' : 'Draft'}
  </span>
);

interface Row {
  project: ProjectRecord;
  documents: DocumentRecord[];
  responses: number;
}

interface Column {
  label: string;
  value: (row: Row) => React.ReactNode;
  numeric?: boolean;
}

const addressColumn: Column = {
  label: 'Address',
  value: ({ project }) => (project.slug && project.status === 'published'
    ? <span className="font-mono text-xs">/s/{project.slug}</span>
    : <span className="text-slate-400">Not published</span>),
};
const responsesColumn: Column = { label: 'Responses', numeric: true, value: ({ responses }) => responses };
const countColumn = (label: string, blockType: string): Column => ({
  label,
  numeric: true,
  value: ({ project, documents }) => moduleCount(project, documents, blockType),
});
const appearsColumn: Column = { label: 'Appears on', value: ({ project }) => describePages(project.settings) };

// Each module's table shows what matters for that module.
const MODULE_COLUMNS: Record<ProjectType, Column[]> = {
  website: [{ label: 'Pages', numeric: true, value: ({ documents }) => documents.filter((doc) => doc.kind === 'page').length }, addressColumn, responsesColumn],
  page: [addressColumn, responsesColumn],
  tour: [countColumn('Steps', 'TourStep'), appearsColumn, { label: 'How often', value: ({ project }) => describeFrequency(project.settings) }],
  form: [countColumn('Fields', 'FormField'), responsesColumn, addressColumn],
  demo: [countColumn('Screens', 'DemoScreen'), addressColumn],
  banner: [{ label: 'Position', value: ({ project }) => (project.settings.position === 'bottom' ? 'Bottom' : 'Top') }, appearsColumn, { label: 'How often', value: ({ project }) => describeFrequency(project.settings) }],
  menu: [{
    label: 'Items',
    numeric: true,
    value: ({ project }) => {
      const links = project.variables.links;
      return Array.isArray(links) ? links.length : '-';
    },
  }, addressColumn],
  faq: [countColumn('Questions', 'Accordion'), addressColumn],
  popup: [{ label: 'Trigger', value: ({ project }) => describeTrigger(project.settings) }, appearsColumn, responsesColumn],
};

const ALL_COLUMNS: Column[] = [
  {
    label: 'Type',
    value: ({ project }) => (
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
        <Icon name={MODULES[project.type].icon} className="w-3.5 h-3.5 text-slate-400" />
        {MODULES[project.type].label}
      </span>
    ),
  },
  addressColumn,
];

type SortKey = 'title' | 'updatedAt';
const PAGE_SIZE = 20;

const iconAction = 'p-1.5 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-colors disabled:opacity-40';

const SortHeader: React.FC<{ label: string; sortKey: SortKey; sort: SortKey; descending: boolean; onSort: (key: SortKey) => void }> = ({ label, sortKey, sort, descending, onSort }) => {
  const active = sort === sortKey;
  return (
    <th scope="col" aria-sort={active ? (descending ? 'descending' : 'ascending') : 'none'} className="px-4 py-2.5 font-medium">
      <button type="button" className="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-100" onClick={() => onSort(sortKey)}>
        {label}
        {active && (descending ? <ArrowDown className="w-3 h-3" aria-hidden="true" /> : <ArrowUp className="w-3 h-3" aria-hidden="true" />)}
      </button>
    </th>
  );
};

/** One module's own page: its projects in a table, with its own create dialog. All projects when no type. */
export const ProjectsPage: React.FC<{ type?: ProjectType }> = ({ type }) => {
  const services = useServices();
  const { projects, forms } = services;
  const { workspace, isLoading: isLoadingWorkspace, can } = useWorkspace();
  const queryClient = useQueryClient();
  const organizationId = workspace?.organizationId;
  const module = type ? MODULES[type] : null;

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | 'published' | 'draft'>('all');
  const [typeFilter, setTypeFilter] = useState<ProjectType | 'all'>('all');
  const [sort, setSort] = useState<SortKey>('updatedAt');
  const [descending, setDescending] = useState(true);
  const [page, setPage] = useState(0);

  const query = useQuery({
    queryKey: ['projects', organizationId],
    queryFn: () => projects.list(organizationId!),
    enabled: Boolean(organizationId),
  });
  const details = useQuery({
    queryKey: ['project-details', organizationId],
    queryFn: async () => {
      const [documents, responses] = await Promise.all([projects.listAllDocuments(organizationId!), forms.countByProject(organizationId!)]);
      return { documents, responses };
    },
    enabled: Boolean(organizationId),
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['projects'] });
    queryClient.invalidateQueries({ queryKey: ['project-details'] });
  };
  const duplicate = useMutation({ mutationFn: (project: ProjectRecord) => duplicateProject(services, project), onSuccess: refresh });
  const remove = useMutation({ mutationFn: (id: string) => projects.remove(id), onSuccess: refresh });

  const moduleProjects = useMemo(() => (query.data ?? []).filter((project) => !type || project.type === type), [query.data, type]);
  const counts = {
    all: moduleProjects.length,
    published: moduleProjects.filter((p) => p.status === 'published').length,
    draft: moduleProjects.filter((p) => p.status !== 'published').length,
  };

  const rows = useMemo<Row[]>(() => {
    const term = search.trim().toLowerCase();
    const filtered = moduleProjects.filter((project) =>
      (!term || project.title.toLowerCase().includes(term) || (project.slug ?? '').includes(term))
      && (status === 'all' || (status === 'published') === (project.status === 'published'))
      && (typeFilter === 'all' || project.type === typeFilter));
    const sorted = [...filtered].sort((a, b) => a[sort].localeCompare(b[sort]) * (descending ? -1 : 1));
    return sorted.map((project) => ({
      project,
      documents: (details.data?.documents ?? []).filter((doc) => doc.projectId === project.id),
      responses: details.data?.responses[project.id] ?? 0,
    }));
  }, [moduleProjects, search, status, typeFilter, sort, descending, details.data]);

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);
  const visibleRows = rows.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);
  const columns = type ? MODULE_COLUMNS[type] : ALL_COLUMNS;
  const failure = duplicate.isError ? duplicate.error : remove.isError ? remove.error : null;

  const onSort = (key: SortKey) => {
    if (sort === key) setDescending(!descending);
    else {
      setSort(key);
      setDescending(key === 'updatedAt');
    }
  };
  const resetPage = () => setPage(0);

  return (
    <>
      <PageHeader
        title={module ? module.plural : 'All projects'}
        subtitle={module ? module.description : 'Everything your workspace has built.'}
        actions={<CreateButton type={type} />}
      />
      <ErrorNote message={failure ? errorMessage(failure) : null} />
      {(query.isLoading || isLoadingWorkspace) && <LoadingNote />}
      {query.isError && <ErrorNote message="We couldn't load your projects. Please refresh the page." />}

      {query.isSuccess && moduleProjects.length === 0 && (
        <EmptyState title={module ? `No ${module.plural.toLowerCase()} yet` : 'Nothing here yet'}>
          <p className="mb-4">Choose a template, fill in your details, and it's ready to publish.</p>
          <CreateButton type={type} />
        </EmptyState>
      )}

      {moduleProjects.length > 0 && (
        <div className={`${cardClass} overflow-hidden`}>
          <div className="flex flex-wrap items-center gap-2 p-3 border-b border-slate-200 dark:border-slate-800">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" aria-hidden="true" />
              <input type="search" aria-label="Search" placeholder={`Search ${module ? module.plural.toLowerCase() : 'projects'}...`} className={`${inputClass} !pl-8`} value={search}
                onChange={(event) => { setSearch(event.target.value); resetPage(); }} />
            </div>
            <div role="group" aria-label="Filter by status" className="flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
              {([['all', 'All'], ['published', 'Live'], ['draft', 'Draft']] as const).map(([value, label]) => (
                <button key={value} type="button" aria-pressed={status === value}
                  onClick={() => { setStatus(value); resetPage(); }}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${status === value ? 'bg-indigo-600 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                  {label} ({counts[value]})
                </button>
              ))}
            </div>
            {!type && (
              <select aria-label="Filter by type" className={`${inputClass} !w-auto`} value={typeFilter} onChange={(event) => { setTypeFilter(event.target.value as ProjectType | 'all'); resetPage(); }}>
                <option value="all">All types</option>
                {MODULE_LIST.map((m) => <option key={m.type} value={m.type}>{m.label}</option>)}
              </select>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/40">
                <tr>
                  <SortHeader label="Name" sortKey="title" sort={sort} descending={descending} onSort={onSort} />
                  <th scope="col" className="px-4 py-2.5 font-medium">Status</th>
                  {columns.map((column) => <th key={column.label} scope="col" className={`px-4 py-2.5 font-medium ${column.numeric ? 'text-right' : ''}`}>{column.label}</th>)}
                  <SortHeader label="Updated" sortKey="updatedAt" sort={sort} descending={descending} onSort={onSort} />
                  <th scope="col" className="px-4 py-2.5 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {visibleRows.map((row) => {
                  const { project } = row;
                  return (
                    <tr key={project.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <th scope="row" className="px-4 py-3 font-medium max-w-[280px]">
                        <Link to={ROUTES.project(project.id)} className="block truncate hover:text-indigo-600 dark:hover:text-indigo-400">{project.title}</Link>
                      </th>
                      <td className="px-4 py-3"><StatusBadge status={project.status} /></td>
                      {columns.map((column) => (
                        <td key={column.label} className={`px-4 py-3 text-slate-600 dark:text-slate-300 ${column.numeric ? 'text-right tabular-nums' : ''}`}>{column.value(row)}</td>
                      ))}
                      <td className="px-4 py-3 whitespace-nowrap text-slate-500 dark:text-slate-400">{new Date(project.updatedAt).toLocaleDateString()}</td>
                      <td className="px-4 py-2">
                        <div className="flex justify-end gap-0.5">
                          {can('edit:project') && (
                            <Link to={ROUTES.studio(project.id)} aria-label={`Edit ${project.title}`} title="Edit in editor" className={iconAction}><Pencil className="w-4 h-4" /></Link>
                          )}
                          {project.status === 'published' && project.slug && (
                            <a href={publicSitePath(project.slug)} target="_blank" rel="noreferrer" aria-label={`Open ${project.title} live`} title="Open live" className={iconAction}><ExternalLink className="w-4 h-4" /></a>
                          )}
                          {can('create:project') && (
                            <button type="button" aria-label={`Duplicate ${project.title}`} title="Duplicate" disabled={duplicate.isPending} className={iconAction} onClick={() => duplicate.mutate(project)}><Copy className="w-4 h-4" /></button>
                          )}
                          {can('delete:project') && (
                            <button
                              type="button"
                              aria-label={`Delete ${project.title}`}
                              title="Delete"
                              disabled={remove.isPending}
                              className={`${iconAction} hover:!text-rose-600`}
                              onClick={() => {
                                if (window.confirm(`Delete "${project.title}" permanently? This also removes its versions and responses.`)) remove.mutate(project.id);
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {visibleRows.length === 0 && (
                  <tr><td colSpan={columns.length + 4} className="px-4 py-10 text-center text-slate-500 dark:text-slate-400">No results match your filters.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {pageCount > 1 && (
            <div className="flex items-center justify-end gap-2 p-2 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
              Page {currentPage + 1} of {pageCount}
              <button type="button" aria-label="Previous page" className={iconAction} disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}><ChevronLeft className="w-4 h-4" /></button>
              <button type="button" aria-label="Next page" className={iconAction} disabled={currentPage >= pageCount - 1} onClick={() => setPage(currentPage + 1)}><ChevronRight className="w-4 h-4" /></button>
            </div>
          )}
        </div>
      )}
    </>
  );
};
