import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { Device, ProjectSettings, Triggers } from '../core/schema';
import { MODULES } from '../core/modules';
import { deviceForWidth, shouldShow } from '../core/triggers';
import { createPublicApi } from '../data/publicApi';
import { PublishedSnapshot, TrackedEvent } from '../data/services';
import { ExperiencePlayer, PlayerHost } from '../experience/ExperiencePlayer';
import { selectorFor } from '../experience/tourPosition';
import { getSessionId, getVisitorId } from '../experience/visitor';
import { googleFontsUrl } from '../renderer/css';

const NO_RULES: Triggers = { urlRules: [], delaySeconds: 0, frequency: 'once_per_visitor' };

const api = createPublicApi(import.meta.env.VITE_SUPABASE_URL as string, import.meta.env.VITE_SUPABASE_ANON_KEY as string);

interface Experience {
  snapshot: PublishedSnapshot;
  roots: Root[];
  /** Overlay currently on screen, or scheduled to appear. */
  isActive: boolean;
  cancelSchedule?: () => void;
  host?: HTMLElement;
}

const experiences = new Map<string, Experience>();
const loading = new Map<string, Promise<void>>();
let identifiedVisitor: string | null = null;
let useFonts = true;

const safeStorage = (kind: 'local' | 'session') => {
  try {
    return kind === 'local' ? localStorage : sessionStorage;
  } catch {
    return null;
  }
};
const read = (kind: 'local' | 'session', key: string) => safeStorage(kind)?.getItem(key) ?? null;
const write = (kind: 'local' | 'session', key: string, value: string) => {
  try {
    safeStorage(kind)?.setItem(key, value);
  } catch {
    // Storage may be full or blocked. Frequency rules just won't persist.
  }
};

const visitorId = () => identifiedVisitor ?? getVisitorId();

// --- Analytics, sent in batches ------------------------------------------------

const queues = new Map<string, TrackedEvent[]>();
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function flush() {
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = null;
  for (const [projectId, events] of queues) {
    // Analytics must never cause problems on the customer's site.
    api.trackEvents(projectId, events.splice(0, 50)).catch(() => undefined);
  }
  queues.clear();
}

function track(projectId: string, type: string, metadata?: Record<string, unknown>) {
  const queue = queues.get(projectId) ?? [];
  queue.push({
    type,
    metadata,
    visitorId: visitorId(),
    sessionId: getSessionId(),
    device: deviceForWidth(window.innerWidth),
    url: window.location.pathname,
  });
  queues.set(projectId, queue);
  flushTimer ??= setTimeout(flush, 3000);
}

// --- Mounting ------------------------------------------------------------------

function ensureFonts(snapshot: PublishedSnapshot) {
  const url = useFonts ? googleFontsUrl(snapshot.project.theme) : null;
  if (!url || document.querySelector(`link[href="${url}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = url;
  document.head.appendChild(link);
}

/** A Shadow DOM keeps the customer's CSS and ours from affecting each other. */
function createHost(parent: HTMLElement): { host: HTMLElement; mount: HTMLElement } {
  const host = document.createElement('div');
  host.setAttribute('data-flowpilot-host', '');
  parent.appendChild(host);
  const shadow = host.attachShadow({ mode: 'open' });
  const mount = document.createElement('div');
  shadow.appendChild(mount);
  return { host, mount };
}

function playerHost(projectId: string, frequencyFinish?: (reason: 'closed' | 'completed') => void): PlayerHost {
  const stepKey = `fp_step_${projectId}`;
  return {
    targetDocument: document,
    track: (type, metadata) => track(projectId, type, metadata),
    submitForm: async (data) => {
      try {
        await api.submitForm(projectId, data, visitorId());
        return { ok: true };
      } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : 'Could not send. Please try again.' };
      }
    },
    // A tour continues where it was if the visitor moves to another page mid-way.
    initialStep: Number(read('session', stepKey)) || 0,
    onStepChange: (step) => write('session', stepKey, String(step)),
    onFinish: (reason) => {
      safeStorage('session')?.removeItem(stepKey);
      frequencyFinish?.(reason);
    },
  };
}

function renderInto(mount: HTMLElement, experience: Experience, host: PlayerHost): Root {
  const { project, documents } = experience.snapshot;
  const root = createRoot(mount);
  root.render(
    <ExperiencePlayer
      type={project.type}
      content={documents[0].content}
      theme={project.theme}
      variables={project.variables}
      settings={project.settings}
      host={host}
    />,
  );
  experience.roots.push(root);
  return root;
}

function showOverlay(projectId: string, experience: Experience) {
  const { host, mount } = createHost(document.body);
  experience.host = host;
  ensureFonts(experience.snapshot);
  write('session', `fp_seen_${projectId}`, '1');
  write('local', `fp_seen_${projectId}`, '1');
  track(projectId, 'impression');

  renderInto(mount, experience, playerHost(projectId, (reason) => {
    if (reason === 'completed') write('local', `fp_done_${projectId}`, '1');
    experience.isActive = false;
    window.setTimeout(() => host.remove(), 0);
  }));
}

function removeOverlay(experience: Experience) {
  experience.cancelSchedule?.();
  experience.cancelSchedule = undefined;
  experience.roots.splice(0).forEach((root) => root.unmount());
  experience.host?.remove();
  experience.host = undefined;
  experience.isActive = false;
}

/** Waits for whichever trigger comes first, and calls back once. */
function schedule(triggers: Triggers, show: () => void): () => void {
  const cleanups: (() => void)[] = [];
  let done = false;
  const fire = () => {
    if (done) return;
    done = true;
    cleanups.forEach((cleanup) => cleanup());
    show();
  };

  const hasBehaviorTrigger = triggers.scrollPercent !== undefined || triggers.exitIntent;

  if (triggers.scrollPercent !== undefined) {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (max <= 0 || (window.scrollY / max) * 100 >= triggers.scrollPercent!) fire();
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    cleanups.push(() => window.removeEventListener('scroll', onScroll));
    onScroll();
  }
  if (triggers.exitIntent) {
    const onLeave = (event: MouseEvent) => {
      if (event.clientY <= 0) fire();
    };
    document.addEventListener('mouseout', onLeave);
    cleanups.push(() => document.removeEventListener('mouseout', onLeave));
  }
  if (!hasBehaviorTrigger || triggers.delaySeconds > 0) {
    const timer = window.setTimeout(fire, triggers.delaySeconds * 1000);
    cleanups.push(() => window.clearTimeout(timer));
  }

  return () => {
    done = true;
    cleanups.forEach((cleanup) => cleanup());
  };
}

function seenState(projectId: string) {
  return {
    session: Boolean(read('session', `fp_seen_${projectId}`)),
    visitor: Boolean(read('local', `fp_seen_${projectId}`)),
    completed: Boolean(read('local', `fp_done_${projectId}`)),
  };
}

function triggersOf(settings: ProjectSettings): Triggers {
  return settings.triggers ?? NO_RULES;
}

function evaluate(projectId: string, experience: Experience) {
  const { project } = experience.snapshot;
  const delivery = MODULES[project.type].delivery;

  if (delivery !== 'overlay' || project.settings.position === 'inline') {
    document.querySelectorAll<HTMLElement>(`[data-flowpilot="${CSS.escape(projectId)}"]`).forEach((element) => {
      if (element.hasAttribute('data-flowpilot-mounted')) return;
      element.setAttribute('data-flowpilot-mounted', '');
      const { mount } = createHost(element);
      ensureFonts(experience.snapshot);
      track(projectId, 'impression');
      renderInto(mount, experience, playerHost(projectId));
    });
    return;
  }

  const triggers = triggersOf(project.settings);
  const allowed = shouldShow(triggers, window.location.pathname, window.innerWidth, seenState(projectId));

  // An overlay already showing stays while a page change still matches its URL rules.
  if (experience.isActive) {
    const stillMatches = shouldShow({ ...triggers, frequency: 'always' }, window.location.pathname, window.innerWidth, seenState(projectId));
    if (!stillMatches) removeOverlay(experience);
    return;
  }
  if (!allowed) return;

  experience.isActive = true;
  experience.cancelSchedule = schedule(triggers, () => {
    experience.cancelSchedule = undefined;
    showOverlay(projectId, experience);
  });
}

function register(projectId: string): Promise<void> {
  const existing = loading.get(projectId);
  if (existing) return existing;
  const promise = api.getPublishedExperience(projectId).then((snapshot) => {
    if (!snapshot?.documents?.length) {
      console.warn(`[FlowPilot] Project ${projectId} isn't published, or the ID is wrong.`);
      return;
    }
    const experience: Experience = { snapshot, roots: [], isActive: false };
    experiences.set(projectId, experience);
    evaluate(projectId, experience);
  }).catch((error) => {
    console.warn('[FlowPilot] Could not load the experience.', error);
  });
  loading.set(projectId, promise);
  return promise;
}

function evaluateAll() {
  experiences.forEach((experience, projectId) => evaluate(projectId, experience));
}

// Single-page apps change the address without a page load, so history calls are observed.
function watchNavigation() {
  let lastPath = window.location.pathname;
  const check = () => {
    if (window.location.pathname !== lastPath) {
      lastPath = window.location.pathname;
      flush();
      evaluateAll();
    }
  };
  for (const method of ['pushState', 'replaceState'] as const) {
    const original = history[method];
    history[method] = function patched(...args: Parameters<History['pushState']>) {
      const result = original.apply(this, args);
      check();
      return result;
    };
  }
  window.addEventListener('popstate', check);
}

// --- Element picker, for choosing tour targets from the editor -----------------

function startPicker(nonce: string, origin: string) {
  const highlight = document.createElement('div');
  highlight.style.cssText = 'position:fixed;pointer-events:none;z-index:2147483646;outline:2px solid #6366f1;background:rgba(99,102,241,.15);display:none';
  const hint = document.createElement('div');
  hint.textContent = 'FlowPilot: click the element this step should point to. Press Esc to cancel.';
  hint.style.cssText = 'position:fixed;top:12px;left:50%;transform:translateX(-50%);z-index:2147483647;background:#1e1b4b;color:#fff;padding:8px 14px;border-radius:8px;font:13px system-ui,sans-serif;pointer-events:none';
  document.body.append(highlight, hint);

  const onMove = (event: MouseEvent) => {
    const target = event.target as Element;
    const box = target.getBoundingClientRect();
    Object.assign(highlight.style, { display: 'block', top: `${box.top}px`, left: `${box.left}px`, width: `${box.width}px`, height: `${box.height}px` });
  };
  const stop = () => {
    document.removeEventListener('mousemove', onMove, true);
    document.removeEventListener('click', onClick, true);
    document.removeEventListener('keydown', onKey, true);
    highlight.remove();
    hint.remove();
  };
  const onClick = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    window.opener?.postMessage({ type: 'flowpilot:selector', nonce, selector: selectorFor(event.target as Element) }, origin);
    stop();
  };
  const onKey = (event: KeyboardEvent) => {
    if (event.key === 'Escape') stop();
  };
  document.addEventListener('mousemove', onMove, true);
  document.addEventListener('click', onClick, true);
  document.addEventListener('keydown', onKey, true);
}

/** Returns true when the page was opened from the editor to pick an element. */
function checkPickerMode(): boolean {
  if (!window.opener) return false;
  const match = window.location.hash.match(/^#fp-pick=([\w-]+)&origin=([^&]+)$/);
  if (!match) return false;
  const origin = decodeURIComponent(match[2]);
  if (!/^https?:\/\/[^/]+$/.test(origin)) return false;
  history.replaceState(null, '', window.location.pathname + window.location.search);
  startPicker(match[1], origin);
  return true;
}

// --- Public API ----------------------------------------------------------------

export interface FlowPilotApi {
  /** Links activity to your own user id, so analytics can follow a person across devices. */
  identify: (userId: string) => void;
  /** Shows an experience now, ignoring its trigger rules. */
  start: (projectId: string) => Promise<void>;
  /** Records a custom event against a project. */
  track: (projectId: string, eventName: string, metadata?: Record<string, unknown>) => void;
}

const publicApi: FlowPilotApi = {
  identify: (userId) => {
    identifiedVisitor = `user:${String(userId).slice(0, 58)}`;
  },
  start: async (projectId) => {
    await register(projectId);
    const experience = experiences.get(projectId);
    if (!experience) return;
    if (MODULES[experience.snapshot.project.type].delivery !== 'overlay') {
      evaluate(projectId, experience);
      return;
    }
    removeOverlay(experience);
    experience.isActive = true;
    safeStorage('session')?.removeItem(`fp_step_${projectId}`);
    showOverlay(projectId, experience);
  },
  track: (projectId, eventName, metadata) => {
    const type = String(eventName).toLowerCase().replace(/[^a-z0-9_]/g, '_').slice(0, 64);
    track(projectId, /^[a-z]/.test(type) ? type : `custom_${type}`, metadata);
  },
};

// --- Start ---------------------------------------------------------------------

declare global {
  interface Window {
    FlowPilot?: FlowPilotApi;
  }
}

function boot(script: HTMLOrSVGScriptElement | null) {
  // A page can include the script once per project. Only the first sets things up.
  const isFirst = !window.FlowPilot;
  const element = script as HTMLScriptElement | null;
  if (element?.dataset.fonts === 'off') useFonts = false;

  if (isFirst) {
    window.FlowPilot = publicApi;
    if (checkPickerMode()) return;
    watchNavigation();
    window.addEventListener('pagehide', flush);
  }

  const start = () => {
    const ids = new Set<string>();
    if (element?.dataset.projectId) ids.add(element.dataset.projectId);
    document.querySelectorAll<HTMLElement>('[data-flowpilot]').forEach((el) => {
      if (el.dataset.flowpilot) ids.add(el.dataset.flowpilot);
    });
    ids.forEach((id) => void register(id));
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
}

boot(document.currentScript);

export type { Device };
