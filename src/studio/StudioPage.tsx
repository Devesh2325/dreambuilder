import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Check, CloudOff, Eye, Loader2, Monitor, Redo2, Smartphone, Tablet, Undo2, X, ZoomIn, ZoomOut } from 'lucide-react';
import { PublishDialog } from '../app/projects/PublishDialog';
import { ROUTES } from '../app/routes';
import { useServices } from '../app/session';
import { EmptyState, primaryButton, secondaryButton } from '../app/shared/ui';
import { useWorkspace } from '../app/workspace';
import { ProjectPreview } from '../experience/ProjectPreview';
import { Canvas } from './Canvas';
import { LeftPanel } from './LeftPanel';
import { handleStudioShortcut } from './shortcuts';
import { useStudio } from './store';

const DEVICE_BUTTONS = [
  { device: 'desktop', label: 'Desktop', icon: Monitor },
  { device: 'tablet', label: 'Tablet', icon: Tablet },
  { device: 'mobile', label: 'Mobile', icon: Smartphone },
] as const;

const iconButton = 'p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30';

const SaveIndicator: React.FC = () => {
  const status = useStudio((s) => s.status);
  const saveError = useStudio((s) => s.saveError);
  const { saveNow } = useStudio.getState();

  return (
    <div role="status" className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 min-w-[70px]">
      {status === 'saved' && <><Check className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />Saved</>}
      {status === 'dirty' && 'Unsaved'}
      {status === 'saving' && <><Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />Saving</>}
      {status === 'error' && (
        <button type="button" onClick={() => saveNow()} title={saveError ?? undefined} className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-semibold">
          <CloudOff className="w-3.5 h-3.5" aria-hidden="true" />
          Not saved. Retry
        </button>
      )}
    </div>
  );
};

const ConflictBanner: React.FC = () => {
  const status = useStudio((s) => s.status);
  const { reloadFromServer, overwriteServer } = useStudio.getState();
  if (status !== 'conflict') return null;
  return (
    <div role="alert" className="flex flex-wrap items-center justify-center gap-3 px-4 py-2 text-sm bg-amber-100 text-amber-900 dark:bg-amber-900/60 dark:text-amber-100">
      Someone else changed this project while you were editing.
      <button type="button" className="font-semibold underline" onClick={() => reloadFromServer()}>Load their version</button>
      <button
        type="button"
        className="font-semibold underline"
        onClick={() => {
          if (window.confirm('Replace their changes with yours? Their changes will be lost.')) overwriteServer();
        }}
      >
        Keep my version
      </button>
    </div>
  );
};

const Editor: React.FC = () => {
  const project = useStudio((s) => s.project);
  const draft = useStudio((s) => s.draft);
  const documents = useStudio((s) => s.documents);
  const device = useStudio((s) => s.device);
  const zoom = useStudio((s) => s.zoom);
  const canUndo = useStudio((s) => s.past.length > 0);
  const canRedo = useStudio((s) => s.future.length > 0);
  const readOnly = useStudio((s) => s.readOnly);
  const activeDocumentId = useStudio((s) => s.activeDocumentId);
  const { undo, redo, setDevice, setZoom, saveNow } = useStudio.getState();
  const [isPublishing, setIsPublishing] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    window.addEventListener('keydown', handleStudioShortcut);
    return () => window.removeEventListener('keydown', handleStudioShortcut);
  }, []);

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      const { status } = useStudio.getState();
      if (status !== 'saved') event.preventDefault();
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, []);

  const activeSlug = documents.find((d) => d.id === activeDocumentId)?.slug;
  const previewDocs = useMemo(() => documents, [documents]);

  if (!project || !draft) return null;

  return (
    <div className="app-scroll h-screen flex flex-col overflow-hidden bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
      <header className="h-12 shrink-0 grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 min-w-0">
        <button
          type="button"
          aria-label="Back to project"
          className={iconButton}
          onClick={async () => {
            await saveNow();
            navigate(ROUTES.project(project.id));
          }}
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-sm font-semibold truncate max-w-[220px]">{draft.title}</h1>
        {readOnly ? <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800">View only</span> : <SaveIndicator />}
        </div>

        <div className="flex items-center gap-1">
          <button type="button" aria-label="Undo" title="Undo (Ctrl+Z)" disabled={!canUndo} className={iconButton} onClick={undo}><Undo2 className="w-4 h-4" /></button>
          <button type="button" aria-label="Redo" title="Redo (Ctrl+Shift+Z)" disabled={!canRedo} className={iconButton} onClick={redo}><Redo2 className="w-4 h-4" /></button>
          <span className="w-px h-5 mx-1 bg-slate-200 dark:bg-slate-700" />
          <div role="group" aria-label="Device" className="flex items-center gap-0.5">
            {DEVICE_BUTTONS.map(({ device: value, label, icon: DeviceIcon }) => (
              <button key={value} type="button" aria-label={label} aria-pressed={device === value} onClick={() => setDevice(value)}
                className={`p-1.5 rounded-lg ${device === value ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                <DeviceIcon className="w-4 h-4" />
              </button>
            ))}
          </div>
          <span className="w-px h-5 mx-1 bg-slate-200 dark:bg-slate-700" />
          <button type="button" aria-label="Zoom out" className={iconButton} onClick={() => setZoom(zoom - 10)}><ZoomOut className="w-4 h-4" /></button>
          <button type="button" aria-label="Reset zoom" className="text-xs w-10 tabular-nums" onClick={() => setZoom(100)}>{zoom}%</button>
          <button type="button" aria-label="Zoom in" className={iconButton} onClick={() => setZoom(zoom + 10)}><ZoomIn className="w-4 h-4" /></button>
        </div>

        <div className="flex items-center justify-end gap-2">
          <button type="button" className={`${secondaryButton} !py-1.5`} onClick={() => setIsPreviewing(true)}>
            <Eye className="w-4 h-4" aria-hidden="true" />
            Preview
          </button>
          {!readOnly && <button type="button" className={`${primaryButton} !py-1.5`} onClick={() => setIsPublishing(true)}>Publish</button>}
        </div>
      </header>

      <ConflictBanner />

      {isPreviewing ? (
        <div className="flex-1 min-h-0 flex flex-col p-4 gap-2">
          <button type="button" className={`${secondaryButton} self-end`} onClick={() => setIsPreviewing(false)}>
            <X className="w-4 h-4" aria-hidden="true" />
            Close preview
          </button>
          <ProjectPreview
            type={project.type}
            documents={previewDocs}
            theme={draft.theme}
            variables={draft.variables}
            settings={draft.settings}
            device={device}
            initialSlug={activeSlug}
            className="flex-1 min-h-0"
          />
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex overflow-hidden">
          <LeftPanel />
          <Canvas />
        </div>
      )}

      {isPublishing && (
        <PublishDialog
          project={{ ...project, title: draft.title }}
          beforePublish={async () => {
            await saveNow();
            const { status, saveError } = useStudio.getState();
            if (status !== 'saved') throw new Error(saveError ?? 'Please resolve the save problem before publishing.');
          }}
          onClose={() => setIsPublishing(false)}
          onPublished={() => navigate(ROUTES.project(project.id), { state: { justPublished: true } })}
        />
      )}
    </div>
  );
};

export const StudioPage: React.FC = () => {
  const { projectId } = useParams();
  const services = useServices();
  const { can, isLoading: isLoadingWorkspace } = useWorkspace();
  const queryClient = useQueryClient();
  const loadedId = useStudio((s) => s.project?.id);

  const query = useQuery({
    queryKey: ['studio', projectId],
    queryFn: async () => {
      const [project, documents] = await Promise.all([services.projects.get(projectId!), services.projects.listDocuments(projectId!)]);
      return { project, documents };
    },
    enabled: Boolean(projectId),
    // The editor holds its own copy after loading, so background refetches must not disturb it.
    gcTime: 0,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: Infinity,
  });

  useEffect(() => {
    if (query.data?.project && !isLoadingWorkspace) {
      useStudio.getState().load(services, query.data.project, query.data.documents, !can('edit:project'));
    }
    // Loading only once per fetched result. `can` changes identity on every workspace render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.data, isLoadingWorkspace, services]);

  useEffect(() => () => {
    // Leaving the page: try to save what's left, then clear.
    const state = useStudio.getState();
    void state.saveNow().finally(() => {
      useStudio.getState().reset();
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      if (state.project) queryClient.invalidateQueries({ queryKey: ['project', state.project.id] });
    });
  }, [queryClient]);

  if (query.isError) {
    return <div className="p-8"><EmptyState title="We couldn't open this project">Please refresh the page and try again.</EmptyState></div>;
  }
  if (query.isSuccess && !query.data.project) {
    return (
      <div className="p-8">
        <EmptyState title="Project not found">
          <Link to={ROUTES.home} className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">Back to projects</Link>
        </EmptyState>
      </div>
    );
  }
  if (!loadedId || loadedId !== projectId) {
    return <div role="status" className="h-screen flex items-center justify-center text-sm text-slate-500 bg-slate-50 dark:bg-slate-950">Loading editor...</div>;
  }
  return <Editor />;
};
