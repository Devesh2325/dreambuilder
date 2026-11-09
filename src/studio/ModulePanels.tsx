import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CircleDot, ExternalLink, Hammer, Loader2, Play, PlaySquare, Plus, Sparkles } from 'lucide-react';
import { ProjectRecord } from '../data/services';
import { embedSnippet } from '../app/projects/projectHelpers';
import { ImageInput } from '../app/shared/VariableForm';
import { ROUTES } from '../app/routes';
import { fieldClass, labelClass } from './fields';
import { LiveMode, useLiveSite } from './liveSite';
import { useEmbeddableProjects } from './ProjectField';
import { findSteps } from './steps';
import { useStudio } from './store';

const WHOLE_TOKEN = /^\{\{\s*([\w.]+)\s*\}\}$/;

/** What a demo needs next, without having to find the right block first. */
export const DemoPanel: React.FC = () => {
  const draft = useStudio((s) => s.draft);
  const documents = useStudio((s) => s.documents);
  const activeDocumentId = useStudio((s) => s.activeDocumentId);
  const activeStepKey = useStudio((s) => s.activeStepKey);
  const readOnly = useStudio((s) => s.readOnly);
  const { addBlock, select, updateProps, updateDraft } = useStudio.getState();
  const active = documents.find((doc) => doc.id === activeDocumentId);
  if (!draft || !active) return null;
  const set = findSteps(active.content, draft.variables);
  const step = set?.steps.find((item) => item.key === activeStepKey) ?? set?.steps[0];
  const screen = step ? active.content.nodes[step.sourceId] : undefined;
  if (!screen || !set) return null;

  const raw = String(screen.props.image ?? '');
  const token = raw.match(WHOLE_TOKEN)?.[1];
  const image = token ? String(draft.variables[token] ?? '') : raw;
  const tooltips = screen.children.map((id) => active.content.nodes[id]).filter((node) => node?.type === 'DemoHotspot');

  return (
    <section aria-label="This screen" className="space-y-3">
      <ol className="text-[13px] text-slate-600 dark:text-slate-300 space-y-1 list-decimal pl-4">
        <li>Add a screenshot of your app.</li>
        <li>Add a tooltip, and drag it to the right spot on the screen.</li>
        <li>Choose which side its arrow points from.</li>
      </ol>
      <h4 className="pt-1 text-sm font-semibold">{step?.label}</h4>
      <div>
        <p className={`${labelClass} mb-1`}>Screenshot of your app</p>
        {!readOnly && (
          <ImageInput
            id="demo-screenshot"
            value={image.startsWith('data:') ? '' : image}
            onChange={(url) => {
              if (token) updateDraft((d) => { d.variables[token] = url; }, `variables:${token}`);
              else updateProps(screen.id, { image: url });
            }}
          />
        )}
      </div>
      <div>
        <p className={`${labelClass} mb-1`}>Tooltips on this screen</p>
        {tooltips.length === 0 && <p className="text-[13px] text-slate-500 dark:text-slate-400">None yet.</p>}
        <ul className="space-y-1">
          {tooltips.map((tooltip, index) => {
            const words = String(tooltip.props.title || tooltip.props.tip || '');
            return (
              <li key={tooltip.id}>
                <button type="button" onClick={() => select(tooltip.id)} className="w-full flex items-center gap-2 h-9 px-2.5 text-[13px] text-left rounded-lg border border-slate-200 dark:border-slate-700 hover:border-indigo-400">
                  <CircleDot className="w-4 h-4 shrink-0 text-indigo-500" aria-hidden="true" />
                  <span className="truncate">{WHOLE_TOKEN.test(words) ? `Tooltip ${index + 1}` : words || `Tooltip ${index + 1}`}</span>
                </button>
              </li>
            );
          })}
        </ul>
        {!readOnly && (
          <button
            type="button"
            className="mt-2 w-full h-9 inline-flex items-center justify-center gap-1.5 text-[13px] font-semibold rounded-lg border border-dashed border-slate-300 dark:border-slate-600 text-indigo-600 dark:text-indigo-400 hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
            onClick={() => addBlock('DemoHotspot', screen.id)}
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            Add tooltip
          </button>
        )}
      </div>
    </section>
  );
};

/** Opens the customer's own site, so tours are built and tried on the real thing. */
const LiveSite: React.FC<{ project: ProjectRecord }> = ({ project }) => {
  const draft = useStudio((s) => s.draft);
  const readOnly = useStudio((s) => s.readOnly);
  const { updateDraft } = useStudio.getState();
  const status = useLiveSite((s) => s.status);
  const [urlError, setUrlError] = useState<string | null>(null);
  const url = draft?.settings.builderUrl ?? '';

  const open = (next: LiveMode) => {
    try {
      let raw = url.trim();
      if (!raw) {
        setUrlError('Enter the web address of a page in your app.');
        return;
      }
      if (!/^https?:\/\//i.test(raw)) {
        if (/^(localhost|127\.0\.0\.1)(:\d+)?/i.test(raw)) {
          raw = `http://${raw}`;
        } else {
          raw = `https://${raw}`;
        }
      }
      const target = new URL(raw);
      if (!/^https?:$/.test(target.protocol)) throw new Error('bad protocol');
      setUrlError(null);
      if (raw !== url) {
        updateDraft((d) => { d.settings.builderUrl = raw; }, 'builderUrl');
      }
      useLiveSite.getState().open(target, next);
    } catch {
      setUrlError('Enter a valid address (e.g. https://app.example.com or http://localhost:3000)');
    }
  };

  return (
    <section aria-label="Your site" className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Build it on your real site</h4>
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
          <Sparkles className="w-3 h-3" /> Live Sync
        </span>
      </div>
      <label className={labelClass}>Address of your app
        <input
          type="url"
          disabled={readOnly}
          placeholder="https://app.example.com or http://localhost:3000"
          className={`${fieldClass} mt-1`}
          value={url}
          onChange={(event) => updateDraft((d) => {
            if (event.target.value) d.settings.builderUrl = event.target.value;
            else delete d.settings.builderUrl;
          }, 'builderUrl')}
        />
      </label>
      {urlError && <p role="alert" className="text-[13px] text-rose-600 dark:text-rose-400">{urlError}</p>}
      <div className="grid grid-cols-2 gap-2">
        <button type="button" disabled={readOnly} className="h-9 inline-flex items-center justify-center gap-1.5 text-[13px] font-semibold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 transition-all shadow-sm shadow-indigo-600/20" onClick={() => open('build')}>
          <Hammer className="w-4 h-4" aria-hidden="true" />
          Build on my site
        </button>
        <button type="button" className="h-9 inline-flex items-center justify-center gap-1.5 text-[13px] font-semibold rounded-lg border border-slate-200 dark:border-slate-700 hover:border-indigo-400 transition-colors" onClick={() => open('test')}>
          <Play className="w-4 h-4" aria-hidden="true" />
          Test on my site
        </button>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400">Your site opens in a new tab. In <strong>Build</strong> mode, click any element on your page to add it as a tour step. In <strong>Test</strong> mode, your tour runs live.</p>
      {status === 'waiting' && (
        <p role="status" className="flex items-center gap-1.5 text-[13px] text-indigo-600 dark:text-indigo-400 font-medium">
          <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
          Connecting to your site...
        </p>
      )}
      {status === 'blocked' && <p role="alert" className="text-[13px] text-rose-600 dark:text-rose-400">Your browser blocked the new tab. Allow pop-ups for this page, then try again.</p>}
      {status === 'missing' && (
        <div role="alert" className="rounded-xl p-3 text-[13px] space-y-2 bg-amber-50 text-amber-950 dark:bg-amber-950/70 dark:text-amber-100 border border-amber-200 dark:border-amber-800">
          <p className="font-semibold">We couldn't detect FlowPilot on that page.</p>
          <p className="text-xs">Add this embed snippet before <code>&lt;/body&gt;</code> on your site, then try again:</p>
          <pre className="text-xs p-2 rounded bg-slate-900 text-slate-100 overflow-x-auto"><code>{embedSnippet(window.location.origin, project.id)}</code></pre>
          <div className="flex items-center justify-between pt-1 text-xs">
            <a href={url.startsWith('http') ? url : `https://${url}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold underline text-indigo-700 dark:text-indigo-300">
              Open your site directly <ExternalLink className="w-3 h-3" />
            </a>
            <button
              type="button"
              className="font-semibold text-slate-600 dark:text-slate-300 hover:underline"
              onClick={() => open('test')}
            >
              Retry connection
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

const CheckRow: React.FC<{ label: string; checked: boolean; onChange: (checked: boolean) => void }> = ({ label, checked, onChange }) => (
  <label className={`${labelClass} flex items-center gap-2`}>
    <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
    {label}
  </label>
);

const DemoIntegration: React.FC = () => {
  const list = useEmbeddableProjects();
  const readOnly = useStudio((s) => s.readOnly);
  const activeDocumentId = useStudio((s) => s.activeDocumentId);
  const documents = useStudio((s) => s.documents);
  const active = documents.find((doc) => doc.id === activeDocumentId);
  const draft = useStudio((s) => s.draft);
  const activeStepKey = useStudio((s) => s.activeStepKey);
  const { addBlock, updateProps, updateDraft } = useStudio.getState();

  const demos = list.data?.filter((p) => p.type === 'demo') ?? [];
  const integratedDemoId = draft?.settings.tour?.integratedDemoId ?? '';

  const setIntegratedDemo = (demoId: string) => {
    updateDraft((d) => {
      d.settings.tour = { ...d.settings.tour, integratedDemoId: demoId || undefined };
    }, 'tour:demo');
  };

  const insertDemoIntoStep = (demoId: string) => {
    if (!active) return;
    const steps = findSteps(active.content, draft?.variables ?? {});
    const step = steps?.steps.find((s) => s.key === activeStepKey) ?? steps?.steps[0];
    if (!step) return;
    const addedId = addBlock('ProjectEmbed', step.sourceId);
    if (addedId) {
      updateProps(addedId, { projectId: demoId });
    }
  };

  return (
    <section aria-label="Demo integration" className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Integrate Interactive Demo</h4>
        <PlaySquare className="w-4 h-4 text-indigo-500" />
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Connect an interactive clickable demo to this tour or insert it directly into your step.
      </p>

      <div>
        <label className={`${labelClass} mb-1`}>Workspace Demo</label>
        <select
          disabled={readOnly}
          className={fieldClass}
          value={integratedDemoId}
          onChange={(e) => setIntegratedDemo(e.target.value)}
        >
          <option value="">Choose a demo...</option>
          {demos.map((d) => (
            <option key={d.id} value={d.id}>
              {d.title} {d.status === 'published' ? '' : '(Draft)'}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center justify-between gap-2 pt-1">
        {integratedDemoId ? (
          <button
            type="button"
            disabled={readOnly}
            className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:text-indigo-300 transition-colors"
            onClick={() => insertDemoIntoStep(integratedDemoId)}
          >
            + Embed demo in current step
          </button>
        ) : <span className="text-xs text-slate-400">Select a demo to embed</span>}

        <Link
          to={ROUTES.create('demo')}
          target="_blank"
          className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" /> Create demo
        </Link>
      </div>
    </section>
  );
};

/** How a whole tour looks and behaves. Each step has its own settings as well. */
export const TourPanel: React.FC<{ project: ProjectRecord }> = ({ project }) => {
  const tour = useStudio((s) => s.draft?.settings.tour);
  const { updateDraft } = useStudio.getState();
  const settings = useMemo(() => tour ?? {}, [tour]);
  const set = (patch: NonNullable<typeof tour>, key?: string) => updateDraft((d) => {
    d.settings.tour = { ...d.settings.tour, ...patch };
  }, key ? `tour:${key}` : undefined);

  return (
    <>
      <LiveSite project={project} />
      <DemoIntegration />
      <section aria-label="Tour options" className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Tour options</h4>
        <CheckRow label="Show progress (Step 1 of 5)" checked={Boolean(settings.showProgress)} onChange={(showProgress) => set({ showProgress })} />
        <label className={labelClass}>How long it takes (optional)
          <input placeholder="About 2 minutes" maxLength={40} className={`${fieldClass} mt-1`} value={settings.estimatedTime ?? ''} onChange={(event) => set({ estimatedTime: event.target.value }, 'time')} />
        </label>
        <CheckRow label="Show a close button" checked={Boolean(settings.showClose)} onChange={(showClose) => set({ showClose })} />
        <CheckRow label="Clicking outside closes it" checked={Boolean(settings.closeOnBackdrop)} onChange={(closeOnBackdrop) => set({ closeOnBackdrop })} />
        <CheckRow label="Arrow keys and Esc work" checked={settings.keyboard !== false} onChange={(keyboard) => set({ keyboard })} />
        <CheckRow label="Scroll to the element" checked={settings.scrollToTarget !== false} onChange={(scrollToTarget) => set({ scrollToTarget })} />
        <label className={labelClass}>Page dimming: {settings.backdrop ?? 55}%
          <input type="range" min={0} max={90} step={5} className="mt-1 w-full accent-indigo-600" value={settings.backdrop ?? 55} onChange={(event) => set({ backdrop: Number(event.target.value) }, 'backdrop')} />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className={labelClass}>Highlight space (px)
            <input type="number" min={0} max={40} className={`${fieldClass} mt-1`} value={settings.highlightPadding ?? 6} onChange={(event) => set({ highlightPadding: Math.max(0, Math.min(40, Number(event.target.value) || 0)) }, 'padding')} />
          </label>
          <label className={labelClass}>Wait for element (sec)
            <input type="number" min={0} max={30} step={0.5} className={`${fieldClass} mt-1`} value={settings.waitSeconds ?? 2.5} onChange={(event) => set({ waitSeconds: Math.max(0, Math.min(30, Number(event.target.value) || 0)) }, 'wait')} />
          </label>
        </div>
        <label className={labelClass}>After the last step, go to (optional)
          <input type="url" placeholder="/dashboard" className={`${fieldClass} mt-1`} value={settings.finishUrl ?? ''} onChange={(event) => set({ finishUrl: event.target.value }, 'finish')} />
        </label>
      </section>
    </>
  );
};
