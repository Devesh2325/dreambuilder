import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Check, CloudOff, Eye, LayoutTemplate, Loader2, Monitor, Redo2, Share2, Smartphone, Tablet, Undo2, X, ZoomIn, ZoomOut } from 'lucide-react';
import { useDraftEmbedLoader } from '../app/projects/embedLoader';
import { PublishDialog } from '../app/projects/PublishDialog';
import { AppTour, useAppTour } from '../app/tours/AppTour';
import { ROUTES } from '../app/routes';
import { useServices } from '../app/session';
import { BusyIcon, BusyLabel, EmptyState, primaryButton, secondaryButton, StudioSkeleton } from '../app/shared/ui';
import { GoogleTranslateSelector } from '../app/shared/GoogleTranslate';
import { useWorkspace } from '../app/workspace';
import { EmbedLoaderContext } from '../experience/EmbeddedProject';
import { moduleNoun } from '../core/modules';
import { Canvas } from './Canvas';
import { LeftPanel } from './LeftPanel';
import { useLiveSite } from './liveSite';
import { PreviewMode } from './PreviewMode';
import { SaveTemplateDialog } from './TemplateVariables';
import { handleStudioShortcut } from './shortcuts';
import { useStudio } from './store';

const DEVICE_BUTTONS = [
  { device: 'desktop', label: 'Desktop', icon: Monitor },
  { device: 'tablet', label: 'Tablet', icon: Tablet },
  { device: 'mobile', label: 'Mobile', icon: Smartphone },
] as const;

const iconButton = 'p-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30';
const toolGroup = 'flex items-center gap-0.5 p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800';

const SaveIndicator: React.FC = () => {
  const status = useStudio((s) => s.status);
  const saveError = useStudio((s) => s.saveError);
  const { saveNow } = useStudio.getState();

  return (
    <div role="status" className="flex items-center gap-1 text-[13px] text-slate-500 dark:text-slate-400 min-w-[70px]">
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

/** Saving is automatic, and this is for anyone who wants to be sure. */
const SaveButton: React.FC = () => {
  const status = useStudio((s) => s.status);
  const { saveNow } = useStudio.getState();
  return (
    <button type="button" title="Save now (Ctrl+S)" disabled={status === 'saved' || status === 'saving' || status === 'conflict'} className="h-8 px-3 text-[13px] font-semibold rounded-lg border border-slate-200 dark:border-slate-700 hover:border-indigo-400 disabled:opacity-40 disabled:hover:border-slate-200 transition-colors" onClick={() => void saveNow()}>
      Save
    </button>
  );
};

const ConflictBanner: React.FC = () => {
  const status = useStudio((s) => s.status);
  const { reloadFromServer, overwriteServer } = useStudio.getState();
  const [busy, setBusy] = useState<'reload' | 'overwrite' | null>(null);
  if (status !== 'conflict') return null;
  const run = async (which: 'reload' | 'overwrite', action: () => Promise<void>) => {
    setBusy(which);
    try {
      await action();
    } finally {
      setBusy(null);
    }
  };
  return (
    <div role="alert" className="flex flex-wrap items-center justify-center gap-3 px-4 py-2 text-sm bg-amber-100 text-amber-900 dark:bg-amber-900/60 dark:text-amber-100">
      Someone else changed this project while you were editing.
      <button type="button" disabled={busy !== null} className="inline-flex items-center gap-1 font-semibold underline disabled:opacity-60" onClick={() => run('reload', reloadFromServer)}>
        <BusyLabel busy={busy === 'reload'}>Load their version</BusyLabel>
      </button>
      <button
        type="button"
        disabled={busy !== null}
        className="inline-flex items-center gap-1 font-semibold underline disabled:opacity-60"
        onClick={() => {
          if (window.confirm('Replace their changes with yours? Their changes will be lost.')) void run('overwrite', overwriteServer);
        }}
      >
        <BusyLabel busy={busy === 'overwrite'}>Keep my version</BusyLabel>
      </button>
    </div>
  );
};

/**
 * Kept above the canvas rather than in the settings panel: adding a step opens that step's
 * settings, and this still has to be on screen when someone comes back from their site.
 */
const LiveSiteBar: React.FC = () => {
  const status = useLiveSite((s) => s.status);
  const mode = useLiveSite((s) => s.mode);
  const added = useLiveSite((s) => s.added);
  if (status !== 'connected' && status !== 'closed') return null;
  const count = `${added} ${added === 1 ? 'step' : 'steps'} added`;
  return (
    <div role="status" className="shrink-0 flex items-center justify-center gap-3 px-4 py-2 text-sm bg-indigo-50 text-indigo-950 dark:bg-indigo-500/10 dark:text-indigo-100">
      {status === 'connected'
        ? (mode === 'build' ? `Connected to your site. ${count}. Click things in that tab to add more.` : 'Connected to your site. The tour is playing in that tab.')
        : `Your site's tab is closed.${mode === 'build' ? ` ${count}.` : ''}`}
      {status === 'closed' && (
        <button type="button" aria-label="Dismiss" className="p-0.5 rounded hover:bg-black/5 dark:hover:bg-white/10" onClick={() => useLiveSite.getState().stop()}>
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

const Editor: React.FC = () => {
  const project = useStudio((s) => s.project);
  const draft = useStudio((s) => s.draft);
  const device = useStudio((s) => s.device);
  const zoom = useStudio((s) => s.zoom);
  const canUndo = useStudio((s) => s.past.length > 0);
  const canRedo = useStudio((s) => s.future.length > 0);
  const readOnly = useStudio((s) => s.readOnly);
  const { undo, redo, setDevice, setZoom, saveNow } = useStudio.getState();
  const [isPublishing, setIsPublishing] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [copiedLiveLink, setCopiedLiveLink] = useState(false);
  const tour = useAppTour('editor', !readOnly);
  const navigate = useNavigate();
  const location = useLocation();
  const { workspace } = useWorkspace();
  const globals = workspace?.branding.globalVariables;
  useEffect(() => {
    useStudio.getState().syncGlobals(globals ?? []);
  }, [globals]);
  const arrival = location.state as {
    justCreated?: boolean;
    buildingTemplate?: boolean;
    initialDevice?: 'desktop' | 'tablet' | 'mobile';
    initialLanguage?: string;
  } | null;
  const [welcome, setWelcome] = useState(() => (arrival?.justCreated ? 'created' : arrival?.buildingTemplate ? 'template' : null));

  useEffect(() => {
    const target = arrival?.initialDevice ?? draft?.settings.targetDevice;
    if (target && ['desktop', 'tablet', 'mobile'].includes(target)) {
      useStudio.getState().setDevice(target);
    }
  }, [arrival?.initialDevice, draft?.settings.targetDevice]);

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

  if (!project || !draft) return null;

  return (
    <div className="app-scroll h-screen flex flex-col overflow-hidden bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
      <header className="h-14 shrink-0 grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 min-w-0">
        <button
          type="button"
          aria-label="Back to project"
          disabled={isLeaving}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-60"
          onClick={async () => {
            setIsLeaving(true);
            await saveNow();
            navigate(ROUTES.project(project.id));
          }}
        >
          <BusyIcon busy={isLeaving}><ArrowLeft className="w-4 h-4" /></BusyIcon>
        </button>
        <h1 className="text-[15px] font-semibold truncate max-w-[240px]">{draft.title}</h1>
        {readOnly ? <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800">View only</span> : <SaveIndicator />}
        {!readOnly && <SaveButton />}
        </div>

        <div className="flex items-center gap-2">
          <div className={toolGroup}>
            <button type="button" aria-label="Undo" title="Undo (Ctrl+Z)" disabled={!canUndo} className={iconButton} onClick={undo}><Undo2 className="w-4 h-4" /></button>
            <button type="button" aria-label="Redo" title="Redo (Ctrl+Shift+Z)" disabled={!canRedo} className={iconButton} onClick={redo}><Redo2 className="w-4 h-4" /></button>
          </div>
          <div role="group" aria-label="Device" data-tour="devices" className={toolGroup}>
            {DEVICE_BUTTONS.map(({ device: value, label, icon: DeviceIcon }) => (
              <button key={value} type="button" aria-label={label} aria-pressed={device === value} onClick={() => setDevice(value)}
                className={`p-1.5 rounded-md ${device === value ? 'bg-white dark:bg-slate-600 text-indigo-700 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-700'}`}>
                <DeviceIcon className="w-4 h-4" />
              </button>
            ))}
          </div>
          <div className={toolGroup}>
            <button type="button" aria-label="Zoom out" className={iconButton} onClick={() => setZoom(zoom - 10)}><ZoomOut className="w-4 h-4" /></button>
            <button type="button" aria-label="Reset zoom" className="text-[13px] w-11 tabular-nums" onClick={() => setZoom(100)}>{zoom}%</button>
            <button type="button" aria-label="Zoom in" className={iconButton} onClick={() => setZoom(zoom + 10)}><ZoomIn className="w-4 h-4" /></button>
          </div>
        </div>

        <div data-tour="publish" className="flex items-center justify-end gap-2">
          <GoogleTranslateSelector variant="compact" />
          {project.status === 'published' && project.slug && (
            <button
              type="button"
              aria-label="Copy share link"
              title="Copy public link (One Link)"
              className={`${secondaryButton} !px-2.5 !py-1.5 text-xs flex items-center gap-1.5`}
              onClick={async () => {
                const url = `${window.location.origin}/s/${project.slug}`;
                await navigator.clipboard.writeText(url);
                setCopiedLiveLink(true);
                setTimeout(() => setCopiedLiveLink(false), 2000);
              }}
            >
              {copiedLiveLink ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />}
              <span className="hidden xl:inline">{copiedLiveLink ? 'Copied Link!' : 'Copy Link'}</span>
            </button>
          )}
          {!readOnly && (
            <button type="button" aria-label="Save as template" title="Save as template" className={`${secondaryButton} !px-2.5 !py-1.5`} onClick={() => setIsSavingTemplate(true)}>
              <LayoutTemplate className="w-4 h-4" aria-hidden="true" />
              <span className="hidden 2xl:inline">Save as template</span>
            </button>
          )}
          <button type="button" className={`${secondaryButton} !py-1.5`} onClick={() => setIsPreviewing(true)}>
            <Eye className="w-4 h-4" aria-hidden="true" />
            Preview
          </button>
          {!readOnly && <button type="button" className={`${primaryButton} !py-1.5`} onClick={() => setIsPublishing(true)}>Publish</button>}
        </div>
      </header>

      <ConflictBanner />
      <LiveSiteBar />

      {welcome && (
        <div role="status" className="shrink-0 flex items-center justify-center gap-3 px-4 py-2 text-sm bg-emerald-50 text-emerald-900 dark:bg-emerald-500/10 dark:text-emerald-200">
          {welcome === 'created'
            ? `Your ${moduleNoun(project.type)} is ready. Change anything you like, then publish.`
            : 'Build your template from sections and blocks, then choose Save as template at the top.'}
          <button type="button" aria-label="Dismiss" className="p-0.5 rounded hover:bg-black/5 dark:hover:bg-white/10" onClick={() => setWelcome(null)}><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      <div className="flex-1 min-h-0 flex overflow-hidden">
        <LeftPanel onStartTour={tour.start} />
        <Canvas />
      </div>

      {tour.isOpen && <AppTour id="editor" onDone={tour.finish} />}

      {isPreviewing && <PreviewMode onClose={() => setIsPreviewing(false)} />}

      {isSavingTemplate && <SaveTemplateDialog onClose={() => setIsSavingTemplate(false)} />}

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
  const embedLoader = useDraftEmbedLoader();

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
    useLiveSite.getState().stop();
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
    return <StudioSkeleton />;
  }
  return (
    <EmbedLoaderContext.Provider value={embedLoader}>
      <Editor />
    </EmbedLoaderContext.Provider>
  );
};
