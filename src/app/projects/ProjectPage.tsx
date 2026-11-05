import React, { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, ChevronRight, Copy, Download, ExternalLink, Pencil, RotateCcw, Trash2 } from 'lucide-react';
import { moduleNoun, MODULES } from '../../core/modules';
import { DocumentRecord, ProjectRecord } from '../../data/services';
import { ProjectPreview } from '../../experience/ProjectPreview';
import { publicSitePath, ROUTES } from '../routes';
import { useServices } from '../session';
import { Icon } from '../shared/Icon';
import { BusyIcon, BusyLabel, cardClass, dangerButton, EmptyState, ErrorNote, errorMessage, LoadingNote, primaryButton, ProjectSkeleton, secondaryButton } from '../shared/ui';
import { useWorkspace } from '../workspace';
import { collectsResponses, MODULE_COLUMNS } from './moduleColumns';
import { StatusBadge } from './ProjectsPage';
import { PublishDialog } from './PublishDialog';
import { embedSnippet, inlineSnippet, submissionsToCsv } from './projectHelpers';

const CopyBlock: React.FC<{ label: string; code: string }> = ({ label, code }) => {
  const [copied, setCopied] = useState(false);
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
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
      <pre className="text-xs p-3 rounded-lg overflow-x-auto bg-slate-900 text-slate-100 dark:bg-black/40"><code>{code}</code></pre>
    </div>
  );
};

const panelClass = `${cardClass} p-5`;

const OverviewTab: React.FC<{ project: ProjectRecord; documents: DocumentRecord[]; responses: number; onPublish: () => void; canEdit: boolean }> = ({ project, documents, responses, onPublish, canEdit }) => {
  const module = MODULES[project.type];
  const liveUrl = project.status === 'published' && project.slug ? `${window.location.origin}${publicSitePath(project.slug)}` : null;
  const facts = MODULE_COLUMNS[project.type].filter((column) => column.label !== 'Address');

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className={`${cardClass} h-[calc(100vh-260px)] min-h-[440px] p-2`}>
        <ProjectPreview type={project.type} documents={documents} theme={project.theme} variables={project.variables} settings={project.settings} title={`${project.title} preview`} />
      </div>
      <div className="space-y-5">
        <section aria-label="Next step" className={panelClass}>
          {project.status === 'published' ? (
            <>
              <h2 className="font-semibold">It's live</h2>
              {liveUrl && (
                <a href={liveUrl} target="_blank" rel="noreferrer" className="mt-1 block text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline break-all">
                  {liveUrl.replace(/^https?:\/\//, '')}
                  <ExternalLink className="inline w-3.5 h-3.5 ml-1" aria-hidden="true" />
                </a>
              )}
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Editing doesn't change this until you publish again.</p>
            </>
          ) : (
            <>
              <h2 className="font-semibold">Ready when you are</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">It's only visible to your team until you publish it.</p>
              {canEdit && <button type="button" className={`${primaryButton} w-full mt-3`} onClick={onPublish}>Publish</button>}
            </>
          )}
        </section>
        <section aria-label="Details" className={panelClass}>
          <h2 className="font-semibold mb-2">Details</h2>
          <dl className="text-sm divide-y divide-slate-100 dark:divide-slate-800">
            <div className="flex justify-between gap-3 py-2"><dt className="text-slate-500 dark:text-slate-400">Type</dt><dd className="font-medium text-right">{module.label}</dd></div>
            {facts.map((column) => (
              <div key={column.label} className="flex justify-between gap-3 py-2">
                <dt className="text-slate-500 dark:text-slate-400">{column.label}</dt>
                <dd className="font-medium text-right">{column.value({ project, documents, responses })}</dd>
              </div>
            ))}
            <div className="flex justify-between gap-3 py-2"><dt className="text-slate-500 dark:text-slate-400">Updated</dt><dd className="font-medium text-right">{new Date(project.updatedAt).toLocaleDateString()}</dd></div>
          </dl>
        </section>
      </div>
    </div>
  );
};

const INSTALL_INTRO = {
  site: 'Your pages are hosted for you, so visitors just need the link.',
  overlay: 'Add one script to your site. It floats over your pages, following the rules you set in the editor.',
  inline: 'Share the link, or add it to your own site where it should appear.',
};

const ShareTab: React.FC<{ project: ProjectRecord }> = ({ project }) => {
  const module = MODULES[project.type];
  const liveUrl = project.slug ? `${window.location.origin}${publicSitePath(project.slug)}` : null;
  const isPublished = project.status === 'published';
  const showsInline = module.delivery === 'inline' || project.settings.position === 'inline';

  return (
    <div className={`${panelClass} max-w-3xl space-y-5`}>
      <div>
        <h2 className="font-semibold">Share and install</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{INSTALL_INTRO[module.delivery]}</p>
      </div>
      {!isPublished && <p role="note" className="text-sm rounded-lg px-3 py-2 bg-amber-50 text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">Publish first. This code won't show anything until then.</p>}
      {isPublished && liveUrl && <CopyBlock label="Web address" code={liveUrl} />}
      {module.delivery !== 'site' && <CopyBlock label="Add to your site, before </body>" code={embedSnippet(window.location.origin, project.id)} />}
      {showsInline && <CopyBlock label="Place where it should appear" code={inlineSnippet(project.id)} />}
      <p className="text-sm">
        <Link to={`${ROUTES.doc(project.type)}?project=${project.id}`} className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
          Read the {moduleNoun(project.type)} integration guide
        </Link>
      </p>
    </div>
  );
};

const ResponsesTab: React.FC<{ project: ProjectRecord }> = ({ project }) => {
  const { forms } = useServices();
  const { can } = useWorkspace();
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['submissions', project.id], queryFn: () => forms.listSubmissions(project.id) });
  const remove = useMutation({
    mutationFn: (id: string) => forms.removeSubmission(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submissions', project.id] });
      queryClient.invalidateQueries({ queryKey: ['project-details'] });
    },
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
    <section aria-label="Responses" className={panelClass}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold">Responses{rows.length > 0 ? ` (${rows.length})` : ''}</h2>
        {rows.length > 0 && (
          <button type="button" className={secondaryButton} onClick={download}>
            <Download className="w-4 h-4" aria-hidden="true" />
            Export CSV
          </button>
        )}
      </div>
      {query.isLoading && <LoadingNote />}
      {query.isError && <ErrorNote message="We couldn't load the responses." />}
      {query.isSuccess && rows.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">Answers to forms in this project appear here.</p>}
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
                      <button type="button" aria-label="Delete response" disabled={remove.isPending} className="p-1 text-slate-400 hover:text-rose-600" onClick={() => {
                        if (window.confirm('Delete this response?')) remove.mutate(row.id);
                      }}>
                        <BusyIcon busy={remove.isPending && remove.variables === row.id} className="w-3.5 h-3.5"><Trash2 className="w-3.5 h-3.5" /></BusyIcon>
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

const VersionsTab: React.FC<{ project: ProjectRecord }> = ({ project }) => {
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

  return (
    <section aria-label="Published versions" className={`${panelClass} max-w-3xl`}>
      <h2 className="font-semibold mb-1">Published versions</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">Every publish is saved here, so you can go back.</p>
      <ErrorNote message={restore.isError ? errorMessage(restore.error) : null} />
      {query.isLoading && <LoadingNote />}
      {query.isSuccess && query.data.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">Nothing published yet.</p>}
      <ul className="divide-y divide-slate-100 dark:divide-slate-800">
        {query.data?.map((version) => (
          <li key={version.id} className="py-2.5 flex items-center justify-between gap-3 text-sm">
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
                disabled={restore.isPending}
                className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 disabled:opacity-60"
                onClick={() => {
                  if (window.confirm(`Replace your current draft with version ${version.versionNumber}? What's live won't change until you publish.`)) restore.mutate(version.id);
                }}
              >
                <BusyIcon busy={restore.isPending && restore.variables === version.id} className="w-3 h-3"><RotateCcw className="w-3 h-3" aria-hidden="true" /></BusyIcon>
                Restore
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
};

const SettingsTab: React.FC<{ project: ProjectRecord }> = ({ project }) => {
  const { projects, publishing } = useServices();
  const { can } = useWorkspace();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [name, setName] = useState(project.title);
  const [isSaved, setIsSaved] = useState(false);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['project', project.id] });
    queryClient.invalidateQueries({ queryKey: ['projects'] });
  };
  const rename = useMutation({
    mutationFn: () => projects.update(project.id, { title: name.trim() }),
    onSuccess: () => {
      setIsSaved(true);
      refresh();
    },
  });
  const unpublish = useMutation({ mutationFn: () => publishing.unpublish(project.id), onSuccess: refresh });
  const remove = useMutation({
    mutationFn: () => projects.remove(project.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project-details'] });
      navigate(ROUTES.module(project.type));
    },
  });
  const failure = [rename, unpublish, remove].find((mutation) => mutation.isError);

  return (
    <div className="max-w-3xl space-y-5">
      <ErrorNote message={failure ? errorMessage(failure.error) : null} />
      <form className={`${panelClass} space-y-3`} onSubmit={(event) => {
        event.preventDefault();
        rename.mutate();
      }}>
        <h2 className="font-semibold">Name</h2>
        <fieldset disabled={!can('edit:project')} className="flex flex-wrap items-center gap-2">
          <input aria-label="Project name" required maxLength={200} className="flex-1 min-w-[220px] px-3 py-2 text-sm rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700" value={name} onChange={(event) => {
            setName(event.target.value);
            setIsSaved(false);
          }} />
          <button type="submit" className={secondaryButton} disabled={rename.isPending}><BusyLabel busy={rename.isPending} busyText="Saving...">Save</BusyLabel></button>
          {isSaved && <span role="status" className="text-sm text-emerald-700 dark:text-emerald-400">Saved</span>}
        </fieldset>
      </form>
      {can('edit:project') && (
        <section aria-label="Danger zone" className={`${panelClass} space-y-3`}>
          <h2 className="font-semibold">Remove</h2>
          {project.status === 'published' && (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-slate-500 dark:text-slate-400">Stop showing this to visitors, and keep it as a draft.</p>
              <button type="button" className={secondaryButton} disabled={unpublish.isPending} onClick={() => {
                if (window.confirm('Take this offline? Visitors will no longer be able to see it.')) unpublish.mutate();
              }}>
                <BusyLabel busy={unpublish.isPending} busyText="Taking offline...">Take offline</BusyLabel>
              </button>
            </div>
          )}
          {can('delete:project') && (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-slate-500 dark:text-slate-400">Delete this project, its versions and its responses.</p>
              <button type="button" className={dangerButton} disabled={remove.isPending} onClick={() => {
                if (window.confirm(`Delete "${project.title}" permanently? This also removes its versions and responses.`)) remove.mutate();
              }}>
                <BusyIcon busy={remove.isPending}><Trash2 className="w-4 h-4" aria-hidden="true" /></BusyIcon>
                {remove.isPending ? 'Deleting...' : 'Delete project'}
              </button>
            </div>
          )}
        </section>
      )}
    </div>
  );
};

type TabId = 'overview' | 'share' | 'responses' | 'versions' | 'settings';

/** The same page for every module. What differs comes from the module's own definitions. */
export const ProjectPage: React.FC = () => {
  const { projectId } = useParams();
  const { projects, forms } = useServices();
  const { can, workspace } = useWorkspace();
  const location = useLocation();
  const [tab, setTab] = useState<TabId>('overview');
  const [isPublishing, setIsPublishing] = useState(false);
  const notice = location.state as { justPublished?: boolean } | null;
  const [justPublished, setJustPublished] = useState(Boolean(notice?.justPublished));

  const query = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const [project, documents] = await Promise.all([projects.get(projectId!), projects.listDocuments(projectId!)]);
      return { project, documents };
    },
    enabled: Boolean(projectId),
  });
  const responseCounts = useQuery({
    queryKey: ['project-details-responses', workspace?.organizationId],
    queryFn: () => forms.countByProject(workspace!.organizationId),
    enabled: Boolean(workspace),
  });

  if (query.isLoading) return <ProjectSkeleton />;
  if (query.isError) return <ErrorNote message="We couldn't load this project. Please refresh the page." />;
  const project = query.data?.project;
  if (!project) {
    return (
      <EmptyState title="Project not found">
        <Link to={ROUTES.home} className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">Back to the dashboard</Link>
      </EmptyState>
    );
  }
  const module = MODULES[project.type];
  const responses = responseCounts.data?.[project.id] ?? 0;
  const canEdit = can('edit:project');

  const tabs: { id: TabId; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'share', label: 'Share and install' },
    ...(collectsResponses(project.type) ? [{ id: 'responses' as TabId, label: `Responses${responses ? ` (${responses})` : ''}` }] : []),
    { id: 'versions', label: 'Versions' },
    { id: 'settings', label: 'Settings' },
  ];

  return (
    <div>
      <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 mb-3">
        <Link to={ROUTES.module(project.type)} className="hover:underline">{module.plural}</Link>
        <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
        <span className="truncate text-slate-700 dark:text-slate-200">{project.title}</span>
      </nav>


      {justPublished && project.status === 'published' && (
        <p role="status" className="mb-4 rounded-lg px-4 py-3 text-sm bg-emerald-50 text-emerald-900 dark:bg-emerald-500/10 dark:text-emerald-200">
          Published! Your changes are live.
        </p>
      )}

      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <span className="shrink-0 w-11 h-11 flex items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300"><Icon name={module.icon} className="w-5 h-5" /></span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold truncate">{project.title}</h1>
              <StatusBadge status={project.status} />
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">{module.label}</p>
          </div>
        </div>
        {canEdit && (
          <div className="flex flex-wrap gap-2">
            <Link to={ROUTES.studio(project.id)} className={secondaryButton}>
              <Pencil className="w-4 h-4" aria-hidden="true" />
              Open editor
            </Link>
            <button type="button" className={primaryButton} onClick={() => setIsPublishing(true)}>
              {project.status === 'published' ? 'Publish changes' : 'Publish'}
            </button>
          </div>
        )}
      </header>

      <div role="tablist" aria-label="Project sections" className="flex gap-5 mt-5 mb-5 border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
        {tabs.map((item) => (
          <button
            key={item.id}
            role="tab"
            type="button"
            aria-selected={tab === item.id}
            onClick={() => setTab(item.id)}
            className={`pb-2.5 -mb-px whitespace-nowrap text-sm font-medium border-b-2 transition-colors ${tab === item.id ? 'border-indigo-600 text-indigo-700 dark:text-indigo-300' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div role="tabpanel">
        {tab === 'overview' && <OverviewTab project={project} documents={query.data!.documents} responses={responses} onPublish={() => setIsPublishing(true)} canEdit={canEdit} />}
        {tab === 'share' && <ShareTab project={project} />}
        {tab === 'responses' && <ResponsesTab project={project} />}
        {tab === 'versions' && <VersionsTab project={project} />}
        {tab === 'settings' && <SettingsTab key={project.title} project={project} />}
      </div>

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
