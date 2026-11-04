import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MODULES } from '../../core/modules';
import { PROJECT_TYPES, ProjectType } from '../../core/schema';
import { ROUTES } from '../routes';
import { useServices } from '../session';
import { Icon } from '../shared/Icon';
import { cardClass, EmptyState, ErrorNote, LoadingNote, PageHeader, primaryButton } from '../shared/ui';
import { useWorkspace } from '../workspace';

export const StatusBadge: React.FC<{ status: string }> = ({ status }) => (
  <span
    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
      status === 'published'
        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
    }`}
  >
    {status === 'published' ? 'Live' : 'Draft'}
  </span>
);

export const ProjectsPage: React.FC = () => {
  const { projects } = useServices();
  const { workspace, isLoading: isLoadingWorkspace, can } = useWorkspace();
  const [params] = useSearchParams();
  const raw = params.get('type');
  const type = PROJECT_TYPES.includes(raw as ProjectType) ? (raw as ProjectType) : null;
  const module = type ? MODULES[type] : null;
  const organizationId = workspace?.organizationId;

  const query = useQuery({
    queryKey: ['projects', organizationId],
    queryFn: () => projects.list(organizationId!),
    enabled: Boolean(organizationId),
  });

  const list = (query.data ?? []).filter((project) => !type || project.type === type);
  const createLink = type ? `${ROUTES.templates}?type=${type}` : ROUTES.templates;

  return (
    <>
      <PageHeader
        title={module ? module.plural : 'All projects'}
        subtitle={module ? module.description : 'Everything your workspace has built.'}
        actions={can('create:project') && <Link to={createLink} className={primaryButton}>Create {module ? module.label.toLowerCase() : 'new'}</Link>}
      />
      {(query.isLoading || isLoadingWorkspace) && <LoadingNote />}
      {query.isError && <ErrorNote message="We couldn't load your projects. Please refresh the page." />}
      {query.isSuccess && list.length === 0 && (
        <EmptyState title={module ? `No ${module.plural.toLowerCase()} yet` : 'Nothing here yet'}>
          <p>Choose a template, fill in your details, and it's ready to publish.</p>
          {can('create:project') && <Link to={createLink} className={`${primaryButton} mt-4`}>Browse templates</Link>}
        </EmptyState>
      )}
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((project) => (
          <li key={project.id}>
            <Link to={ROUTES.project(project.id)} className={`${cardClass} block p-5 hover:border-indigo-400 transition-colors`}>
              <div className="flex items-center justify-between mb-3">
                <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                  <Icon name={MODULES[project.type].icon} className="w-3.5 h-3.5" />
                  {MODULES[project.type].label}
                </span>
                <StatusBadge status={project.status} />
              </div>
              <h2 className="font-semibold truncate">{project.title}</h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Updated {new Date(project.updatedAt).toLocaleDateString()}</p>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
};
