import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Copy, ExternalLink, Pencil, Search, Trash2 } from 'lucide-react';
import { MODULES } from '../../core/modules';
import { ProjectType } from '../../core/schema';
import { ProjectRecord } from '../../data/services';
import { publicSitePath, ROUTES } from '../routes';
import { useServices } from '../session';
import { Icon } from '../shared/Icon';
import { BusyIcon, cardClass, EmptyState, ErrorNote, errorMessage, inputClass, PageHeader, StatTile, TableSkeleton } from '../shared/ui';
import { CreateButton } from '../templates/CreateButton';
import { useWorkspace } from '../workspace';
import { collectsResponses, MODULE_COLUMNS, ProjectRow } from './moduleColumns';
import { duplicateProject } from './projectHelpers';

export const StatusBadge: React.FC<{ status: string }> = ({ status }) => (
  <span
    className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${
      status === 'published'
        ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-300'
        : 'bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-500/10 dark:bg-slate-500/10 dark:text-slate-300'
    }`}
  >
    <span className={`w-1.5 h-1.5 rounded-full ${status === 'published' ? 'bg-emerald-500' : 'bg-slate-400'}`} aria-hidden="true" />
    {status === 'published' ? 'Live' : 'Draft'}
  </span>
);

type SortKey = 'title' | 'updatedAt';
const PAGE_SIZE = 20;

const iconAction = 'p-1.5 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-colors disabled:opacity-40';

const SortHeader: React.FC<{ label: string; sortKey: SortKey; sort: SortKey; descending: boolean; onSort: (key: SortKey) => void }> = ({ label, sortKey, sort, descending, onSort }) => {
  const active = sort === sortKey;
  return (
    <th scope="col" aria-sort={active ? (descending ? 'descending' : 'ascending') : 'none'} className="px-5 py-3 font-medium">
      <button type="button" className="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-100" onClick={() => onSort(sortKey)}>
        {label}
        {active && (descending ? <ArrowDown className="w-3 h-3" aria-hidden="true" /> : <ArrowUp className="w-3 h-3" aria-hidden="true" />)}
      </button>
    </th>
  );
};

/** One module's own page: its projects in a table, with its own create dialog. */
export const ProjectsPage: React.FC<{ type: ProjectType }> = ({ type }) => {
  const services = useServices();
  const { projects, forms } = services;
  const { workspace, isLoading: isLoadingWorkspace, can } = useWorkspace();
  const queryClient = useQueryClient();
  const organizationId = workspace?.organizationId;
  const module = MODULES[type];

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | 'published' | 'draft'>('all');
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

  const moduleProjects = useMemo(() => (query.data ?? []).filter((project) => project.type === type), [query.data, type]);
  const counts = {
    all: moduleProjects.length,
    published: moduleProjects.filter((p) => p.status === 'published').length,
    draft: moduleProjects.filter((p) => p.status !== 'published').length,
  };
  const totalResponses = moduleProjects.reduce((sum, project) => sum + (details.data?.responses[project.id] ?? 0), 0);

  const rows = useMemo<ProjectRow[]>(() => {
    const term = search.trim().toLowerCase();
    const filtered = moduleProjects.filter((project) =>
      (!term || project.title.toLowerCase().includes(term) || (project.slug ?? '').includes(term))
      && (status === 'all' || (status === 'published') === (project.status === 'published')));
    const sorted = [...filtered].sort((a, b) => a[sort].localeCompare(b[sort]) * (descending ? -1 : 1));
    return sorted.map((project) => ({
      project,
      documents: (details.data?.documents ?? []).filter((doc) => doc.projectId === project.id),
      responses: details.data?.responses[project.id] ?? 0,
    }));
  }, [moduleProjects, search, status, sort, descending, details.data]);

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);
  const visibleRows = rows.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);
  const columns = MODULE_COLUMNS[type];
  const failure = duplicate.isError ? duplicate.error : remove.isError ? remove.error : null;

  const onSort = (key: SortKey) => {
    if (sort === key) setDescending(!descending);
    else {
      setSort(key);
      setDescending(key === 'updatedAt');
    }
  };

  return (
    <>
      <PageHeader
        title={module.plural}
        subtitle={module.description}
        icon={module.icon}
        actions={<CreateButton type={type} />}
      />
      <ErrorNote message={failure ? errorMessage(failure) : null} />
      {(query.isLoading || isLoadingWorkspace) && <TableSkeleton />}
      {query.isError && <ErrorNote message="We couldn't load your projects. Please refresh the page." />}

      {query.isSuccess && moduleProjects.length === 0 && (
        <EmptyState title={`No ${module.plural.toLowerCase()} yet`} icon={module.icon}>
          <p className="mb-5">Choose a template, fill in your details, and it's ready to publish.</p>
          <CreateButton type={type} />
        </EmptyState>
      )}

      {moduleProjects.length > 0 && (
        <>
          <dl className="grid gap-3 grid-cols-2 lg:grid-cols-4 mb-5">
            <StatTile label="Total" value={counts.all} />
            <StatTile label="Live" value={counts.published} />
            <StatTile label="Drafts" value={counts.draft} />
            {collectsResponses(type) && <StatTile label="Responses" value={totalResponses} />}
          </dl>

          <div className={`${cardClass} overflow-hidden`}>
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-3 border-b border-slate-200 dark:border-slate-800">
              <div role="group" aria-label="Filter by status" className="flex gap-5">
                {([['all', 'All'], ['published', 'Live'], ['draft', 'Draft']] as const).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={status === value}
                    onClick={() => { setStatus(value); setPage(0); }}
                    className={`pb-3 -mb-px text-sm font-medium border-b-2 transition-colors ${status === value ? 'border-indigo-600 text-indigo-700 dark:text-indigo-300' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
                  >
                    {label} ({counts[value]})
                  </button>
                ))}
              </div>
              <div className="relative w-full sm:w-64 pb-3">
                <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" aria-hidden="true" />
                <input type="search" aria-label="Search" placeholder={`Search ${module.plural.toLowerCase()}...`} className={`${inputClass} !pl-8`} value={search}
                  onChange={(event) => { setSearch(event.target.value); setPage(0); }} />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 dark:text-slate-400">
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    <SortHeader label="Name" sortKey="title" sort={sort} descending={descending} onSort={onSort} />
                    <th scope="col" className="px-5 py-3 font-medium">Status</th>
                    {columns.map((column) => <th key={column.label} scope="col" className={`px-5 py-3 font-medium ${column.numeric ? 'text-right' : ''}`}>{column.label}</th>)}
                    <SortHeader label="Updated" sortKey="updatedAt" sort={sort} descending={descending} onSort={onSort} />
                    <th scope="col" className="px-5 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {visibleRows.map((row) => {
                    const { project } = row;
                    return (
                      <tr key={project.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <th scope="row" className="px-5 py-3 font-medium max-w-[300px]">
                          <Link to={ROUTES.project(project.id)} className="flex items-center gap-3 min-w-0 hover:text-indigo-600 dark:hover:text-indigo-400">
                            <span className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300"><Icon name={module.icon} /></span>
                            <span className="truncate">{project.title}</span>
                          </Link>
                        </th>
                        <td className="px-5 py-3"><StatusBadge status={project.status} /></td>
                        {columns.map((column) => (
                          <td key={column.label} className={`px-5 py-3 text-slate-600 dark:text-slate-300 ${column.numeric ? 'text-right tabular-nums' : ''}`}>{column.value(row)}</td>
                        ))}
                        <td className="px-5 py-3 whitespace-nowrap text-slate-500 dark:text-slate-400">{new Date(project.updatedAt).toLocaleDateString()}</td>
                        <td className="px-5 py-2">
                          <div className="flex justify-end gap-0.5">
                            {can('edit:project') && <Link to={ROUTES.studio(project.id)} aria-label={`Edit ${project.title}`} title="Edit in editor" className={iconAction}><Pencil className="w-4 h-4" /></Link>}
                            {project.status === 'published' && project.slug && (
                              <a href={publicSitePath(project.slug)} target="_blank" rel="noreferrer" aria-label={`Open ${project.title} live`} title="Open live" className={iconAction}><ExternalLink className="w-4 h-4" /></a>
                            )}
                            {can('create:project') && (
                              <button type="button" aria-label={`Duplicate ${project.title}`} title="Duplicate" disabled={duplicate.isPending} className={iconAction} onClick={() => duplicate.mutate(project)}><BusyIcon busy={duplicate.isPending && duplicate.variables?.id === project.id}><Copy className="w-4 h-4" /></BusyIcon></button>
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
                                <BusyIcon busy={remove.isPending && remove.variables === project.id}><Trash2 className="w-4 h-4" /></BusyIcon>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {visibleRows.length === 0 && (
                    <tr><td colSpan={columns.length + 4} className="px-5 py-12 text-center text-slate-500 dark:text-slate-400">No results match your filters.</td></tr>
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
        </>
      )}
    </>
  );
};
