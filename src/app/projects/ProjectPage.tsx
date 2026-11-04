import React, { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Check, Copy, Download, ExternalLink, Pencil, RotateCcw, Trash2 } from 'lucide-react';
import { MODULES } from '../../core/modules';
import { ProjectPreview } from '../../experience/ProjectPreview';
import { ProjectRecord } from '../../data/services';
import { ROUTES, publicSitePath } from '../routes';
import { useServices } from '../session';
import { Icon } from '../shared/Icon';
import { cardClass, dangerButton, EmptyState, ErrorNote, errorMessage, LoadingNote, primaryButton, secondaryButton } from '../shared/ui';
import { useWorkspace } from '../workspace';
import { StatusBadge } from './ProjectsPage';
import { PublishDialog } from './PublishDialog';
import { embedSnippet, inlineSnippet, submissionsToCsv } from './projectHelpers';

const CopyBlock: React.FC<{ label: string; code: string }> = ({ label, code }) => {
  const [copied, setCopied] = useState(false);
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm font-medium">{label}</p>
        <button
          type="button"
          aria-label={`Copy ${label}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400"
          onClick={async () => {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
        >
          {copied ? <Check className="w-3.5 h-3.5" aria-hidden="true" /> : <Copy className="w-3.5 h-3.5" aria-hidden="true" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="text-xs p-3 rounded-lg overflow-x-auto bg-slate-900 text-slate-100"><code>{code}</code></pre>
    </div>
  );
};

const InstallSection: React.FC<{ project: ProjectRecord }> = ({ project }) => {
  const module = MODULES[project.type];
  const liveUrl = project.slug ? `${window.location.origin}${publicSitePath(project.slug)}` : null;

  return (
    <section aria-labelledby="install-title" className={`${cardClass} p-5 space-y-4`}>
      <h2 id="install-title" className="font-semibold">Put it live</h2>
      {project.status !== 'published' ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">Publish first to get your web address{module.delivery === 'site' ? '' : ' and install code'}.</p>
      ) : (
        <>
          {liveUrl && (
            <p className="text-sm">
              Live at{' '}
              <a href={liveUrl} target="_blank" rel="noreferrer" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline break-all">
                {liveUrl}
                <ExternalLink className="inline w-3.5 h-3.5 ml-1" aria-hidden="true" />
              </a>
            </p>
          )}
          {module.delivery !== 'site' && <CopyBlock label="Add to your site, before </body>" code={embedSnippet(window.location.origin, project.id)} />}
          {module.delivery === 'inline' && <CopyBlock label="Place where it should appear" code={inlineSnippet(project.id)} />}
        </>
      )}
      <p className="text-sm">
        <Link to={`${ROUTES.doc(project.type)}?project=${project.id}`} className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
          Read the {module.label.toLowerCase()} integration guide
        </Link>
      </p>
    </section>
  );
};

const ResponsesSection: React.FC<{ project: ProjectRecord }> = ({ project }) => {
  const { forms } = useServices();
  const { can } = useWorkspace();
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['submissions', project.id], queryFn: () => forms.listSubmissions(project.id) });
  const remove = useMutation({
    mutationFn: (id: string) => forms.removeSubmission(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['submissions', project.id] }),
  });

  const rows = useMemo(() => query.data ?? [], [query.data]);
  const columns = useMemo(() => [...new Set(rows.flatMap((row) => Object.keys(row.data)))], [rows]);

  const download = () => {
    const url = URL.createObjectURL(new Blob([submissionsToCsv(rows)], { type: 'text/csv' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${project.slug ?? 'responses'}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section aria-labelledby="responses-title" className={`${cardClass} p-5`}>
      <div className="flex items-center justify-between mb-3">
        <h2 id="responses-title" className="font-semibold">Responses{rows.length > 0 ? ` (${rows.length})` : ''}</h2>
        {rows.length > 0 && (
          <button type="button" className={secondaryButton} onClick={download}>
            <Download className="w-4 h-4" aria-hidden="true" />
            Export CSV
          </button>
        )}
      </div>
      {query.isLoading && <LoadingNote />}
      {query.isError && <ErrorNote message="We couldn't load the responses." />}
      {query.isSuccess && rows.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">Responses to forms in this project appear here.</p>}
      {rows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 dark:text-slate-400">
              <tr>
                <th scope="col" className="py-2 pr-4 font-medium">Received</th>
                {columns.map((column) => <th scope="col" key={column} className="py-2 pr-4 font-medium">{column}</th>)}
                <th scope="col"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="py-2 pr-4 whitespace-nowrap text-slate-500 dark:text-slate-400">{new Date(row.createdAt).toLocaleString()}</td>
                  {columns.map((column) => <td key={column} className="py-2 pr-4">{String(row.data[column] ?? '')}</td>)}
                  <td className="py-2 text-right">
                    {can('edit:project') && (
                      <button type="button" aria-label="Delete response" className="p-1 text-slate-400 hover:text-rose-600" onClick={() => {
                        if (window.confirm('Delete this response?')) remove.mutate(row.id);
                      }}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

const VersionsSection: React.FC<{ project: ProjectRecord }> = ({ project }) => {
  const { publishing } = useServices();
  const { can } = useWorkspace();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const query = useQuery({ queryKey: ['versions', project.id], queryFn: () => publishing.listVersions(project.id) });
  const restore = useMutation({
    mutationFn: (id: string) => publishing.restoreVersion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', project.id] });
      navigate(ROUTES.studio(project.id));
    },
  });

  if (!query.data?.length) return null;

  return (
    <section aria-labelledby="versions-title" className={`${cardClass} p-5`}>
      <h2 id="versions-title" className="font-semibold mb-3">Published versions</h2>
      <ErrorNote message={restore.isError ? errorMessage(restore.error) : null} />
      <ul className="divide-y divide-slate-100 dark:divide-slate-800">
        {query.data.map((version) => (
          <li key={version.id} className="py-2 flex items-center justify-between gap-3 text-sm">
            <span className="min-w-0">
              <strong>Version {version.versionNumber}</strong>
              {version.id === project.publishedVersionId && <span className="ml-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">Live</span>}
              <span className="block text-xs text-slate-500 dark:text-slate-400 truncate">
                {new Date(version.createdAt).toLocaleString()}{version.changeSummary ? ` | ${version.changeSummary}` : ''}
              </span>
            </span>
            {can('edit:project') && (
              <button
                type="button"
                className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400"
                onClick={() => {
                  if (window.confirm(`Replace your current draft with version ${version.versionNumber}? What's live won't change until you publish.`)) restore.mutate(version.id);
                }}
              >
                <RotateCcw className="w-3 h-3" aria-hidden="true" />
                Restore
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
};

export const ProjectPage: React.FC = () => {
  const { projectId } = useParams();
  const { projects, publishing } = useServices();
  const { can } = useWorkspace();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isPublishing, setIsPublishing] = useState(false);
  const notice = location.state as { justCreated?: boolean; justPublished?: boolean } | null;
  const [justPublished, setJustPublished] = useState(Boolean(notice?.justPublished));

  const query = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const [project, documents] = await Promise.all([projects.get(projectId!), projects.listDocuments(projectId!)]);
      return { project, documents };
    },
    enabled: Boolean(projectId),
  });

  const remove = useMutation({
    mutationFn: () => projects.remove(projectId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project-details'] });
      navigate(query.data?.project ? ROUTES.module(query.data.project.type) : ROUTES.home);
    },
  });

  const unpublish = useMutation({
    mutationFn: () => publishing.unpublish(projectId!),
    onSuccess: () => {
      setJustPublished(false);
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  if (query.isLoading) return <LoadingNote />;
  if (query.isError) return <ErrorNote message="We couldn't load this project. Please refresh the page." />;
  const project = query.data?.project;
  if (!project) {
    return (
      <EmptyState title="Project not found">
        <Link to={ROUTES.home} className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">Back to projects</Link>
      </EmptyState>
    );
  }
  const module = MODULES[project.type];

  return (
    <div className="space-y-5">
      <Link to={ROUTES.module(project.type)} className="inline-flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 hover:underline">
        <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        {module.plural}
      </Link>

      {notice?.justCreated && (
        <p role="status" className="rounded-lg px-4 py-3 text-sm bg-emerald-50 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
          Your {module.label.toLowerCase()} is ready. Publish it now, or open the editor to adjust the design first.
        </p>
      )}
      {justPublished && project.status === 'published' && (
        <p role="status" className="rounded-lg px-4 py-3 text-sm bg-emerald-50 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
          Published! Your changes are live.
        </p>
      )}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
            <Icon name={module.icon} className="w-3.5 h-3.5" />
            {module.label}
          </p>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{project.title}</h1>
            <StatusBadge status={project.status} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {can('edit:project') && (
            <>
              <Link to={ROUTES.studio(project.id)} className={secondaryButton}>
                <Pencil className="w-4 h-4" aria-hidden="true" />
                Open editor
              </Link>
              <button type="button" className={primaryButton} onClick={() => setIsPublishing(true)}>
                {project.status === 'published' ? 'Publish changes' : 'Publish'}
              </button>
            </>
          )}
        </div>
      </div>

      <div className={`${cardClass} h-[460px] p-2`}>
        <ProjectPreview
          type={project.type}
          documents={query.data!.documents}
          theme={project.theme}
          variables={project.variables}
          settings={project.settings}
          title={`${project.title} preview`}
        />
      </div>

      <InstallSection project={project} />
      <ResponsesSection project={project} />
      <VersionsSection project={project} />

      {can('edit:project') && (
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <ErrorNote message={remove.isError ? errorMessage(remove.error) : unpublish.isError ? errorMessage(unpublish.error) : null} />
          {project.status === 'published' && (
            <button type="button" className={secondaryButton} disabled={unpublish.isPending} onClick={() => {
              if (window.confirm('Take this offline? Visitors will no longer be able to see it.')) unpublish.mutate();
            }}>
              Take offline
            </button>
          )}
          {can('delete:project') && (
            <button type="button" className={dangerButton} disabled={remove.isPending} onClick={() => {
              if (window.confirm(`Delete "${project.title}" permanently? This also removes its versions and responses.`)) remove.mutate();
            }}>
              <Trash2 className="w-4 h-4" aria-hidden="true" />
              Delete project
            </button>
          )}
        </div>
      )}

      {isPublishing && (
        <PublishDialog
          project={project}
          onClose={() => setIsPublishing(false)}
          onPublished={() => {
            setIsPublishing(false);
            setJustPublished(true);
          }}
        />
      )}
    </div>
  );
};
