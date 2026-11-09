import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { Device, ProjectSettings, Triggers } from '../core/schema';
import { MODULES } from '../core/modules';
import { deviceForWidth, shouldShow } from '../core/triggers';
import type { SiteCheckReport } from '../core/siteCheck';
import { createPublicApi } from '../data/publicApi';
import { PublishedSnapshot, TrackedEvent } from '../data/services';
import { ExperiencePlayer, PlayerHost } from '../experience/ExperiencePlayer';
import { selectorFor } from '../experience/tourPosition';
import { getSessionId, getVisitorId } from '../experience/visitor';
import { googleFontsUrl } from '../renderer/css';

const NO_RULES: Triggers = { urlRules: [], delaySeconds: 0, frequency: 'once_per_visitor' };

const backendUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined) || 'https://iusczcmtywvpzjbisgba.supabase.co';
const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) || 'sb_publishable_zW3K8gn2xPYVY46lknn6iA_c8F3Lb3z';
const api = createPublicApi(backendUrl, anonKey);
/** A demo build keeps projects in the builder's browser, where no other site can reach them. */
const isDemoBuild = !backendUrl;

// Anything this script loads that the page's security policy blocks, so it can say exactly what to allow.
const blocked = new Set<string>();
let isWatchingPolicy = false;
function watchSecurityPolicy() {
  if (isWatchingPolicy) return;
  isWatchingPolicy = true;
  document.addEventListener('securitypolicyviolation', (event) => {
    const url = event.blockedURI;
    const ours = [backendUrl, 'fonts.googleapis.com', 'fonts.gstatic.com', 'youtube-nocookie.com', 'player.vimeo.com'].some((part) => part && url.includes(part));
    if (!ours || blocked.has(`${event.effectiveDirective} ${url}`)) return;
    blocked.add(`${event.effectiveDirective} ${url}`);
    console.warn(`[FlowPilot] This page's Content Security Policy blocked ${url} (${event.effectiveDirective}). Add ${new URL(url, window.location.href).origin} to ${event.effectiveDirective} in your site's security settings. See the install guide's "Check that it works" step.`);
  });
}

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
let isLive = false;

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
    goToPath: (path) => goToPath(projectId, path),
  };
}

/** Moves to a step's page, once. If it sends us back here, trying again would loop forever. */
function goToPath(projectId: string, path: string): boolean {
  const key = `fp_nav_${projectId}`;
  if (read('session', key) === path) return false;
  write('session', key, path);
  window.location.assign(path);
  return true;
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

  const hasBehaviorTrigger = triggers.scrollPercent !== undefined || triggers.exitIntent || Boolean(triggers.clickSelector);

  if (triggers.clickSelector) {
    const onClick = (event: MouseEvent) => {
      try {
        if ((event.target as Element).closest?.(triggers.clickSelector!)) fire();
      } catch {
        // A mistyped selector just never fires.
      }
    };
    document.addEventListener('click', onClick, true);
    cleanups.push(() => document.removeEventListener('click', onClick, true));
  }

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
  if (triggers.manualOnly && !experience.isActive) return;
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
  if (isDemoBuild) {
    console.warn('[FlowPilot] This FlowPilot is running in demo mode, so its projects are saved in the builder\'s browser and can\'t load on other sites. Connect Supabase to go live. Until then, use "Check it on my site" in the install guide to preview a project here.');
    const nothing = Promise.resolve();
    loading.set(projectId, nothing);
    return nothing;
  }
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

// --- Building and testing a tour on the customer's own site ---------------------

const LIVE_KEY = 'fp_live';

type LiveMode = 'build' | 'test';

function toolbarButton(label: string, primary = false): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = label;
  button.style.cssText = `font:600 13px system-ui,sans-serif;padding:7px 12px;border-radius:8px;cursor:pointer;border:1px solid rgba(255,255,255,.25);color:#fff;background:${primary ? '#4f46e5' : 'transparent'}`;
  return button;
}

function liveBar(text: string): { host: HTMLElement; bar: HTMLElement; label: HTMLElement } {
  const { host, mount } = createHost(document.body);
  mount.style.cssText = 'position:fixed;bottom:16px;left:50%;transform:translateX(-50%);z-index:2147483647';
  const bar = document.createElement('div');
  bar.style.cssText = 'display:flex;align-items:center;gap:10px;background:#0f172a;color:#fff;padding:8px 10px 8px 14px;border-radius:12px;box-shadow:0 12px 32px rgba(15,23,42,.45);font:500 13px system-ui,sans-serif;white-space:nowrap';
  const label = document.createElement('span');
  label.textContent = text;
  bar.append(label);
  mount.append(bar);
  return { host, bar, label };
}

/** Adds a tour step for each element clicked, while the toolbar lets people use their app too. */
function startBuilder(nonce: string, origin: string) {
  const send = (message: Record<string, unknown>) => window.opener?.postMessage({ nonce, ...message }, origin);
  const { host, bar, label } = liveBar('');
  const highlight = document.createElement('div');
  highlight.style.cssText = 'position:fixed;pointer-events:none;z-index:2147483646;outline:2px solid #6366f1;background:rgba(99,102,241,.15);display:none';
  document.body.append(highlight);

  let added = 0;
  let isSelecting = true;
  const toggle = toolbarButton('Use my site');
  const done = toolbarButton('Done', true);
  bar.append(toggle, done);
  const refresh = () => {
    label.textContent = isSelecting ? `Click an element to add a step (${added} added)` : `Using your site. ${added} added`;
    toggle.textContent = isSelecting ? 'Use my site' : 'Add steps';
    highlight.style.display = 'none';
  };
  refresh();

  const inBar = (event: Event) => event.composedPath().includes(host);
  document.addEventListener('mousemove', (event) => {
    if (!isSelecting || inBar(event)) return;
    const box = (event.target as Element).getBoundingClientRect();
    Object.assign(highlight.style, { display: 'block', top: `${box.top}px`, left: `${box.left}px`, width: `${box.width}px`, height: `${box.height}px` });
  }, true);
  document.addEventListener('click', (event) => {
    if (!isSelecting || inBar(event)) return;
    event.preventDefault();
    event.stopPropagation();
    const element = event.target as HTMLElement;
    const text = (element.getAttribute('aria-label') || element.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 60);
    send({ type: 'flowpilot:step', selector: selectorFor(element), text, path: window.location.pathname });
    added += 1;
    refresh();
  }, true);
  toggle.onclick = () => {
    isSelecting = !isSelecting;
    refresh();
  };
  done.onclick = () => {
    send({ type: 'flowpilot:done' });
    safeStorage('session')?.removeItem(LIVE_KEY);
    window.close();
  };
}

/** Plays the editor's unpublished draft here. Nothing is recorded, and only this tab sees it. */
function startTest(nonce: string, origin: string, label = 'Test mode: only you can see this') {
  liveBar(label);
  const onMessage = (event: MessageEvent) => {
    if (event.source !== window.opener || event.origin !== origin || event.data?.type !== 'flowpilot:draft' || event.data.nonce !== nonce) return;
    const snapshot = event.data.snapshot as PublishedSnapshot;
    if (!snapshot?.documents?.[0]?.content || !snapshot.project?.id) return;
    window.removeEventListener('message', onMessage);
    const projectId = snapshot.project.id;
    const experience: Experience = { snapshot, roots: [], isActive: true };
    const { mount } = createHost(document.body);
    ensureFonts(snapshot);
    renderInto(mount, experience, { ...playerHost(projectId), track: undefined, submitForm: async () => ({ ok: true }) });
  };
  window.addEventListener('message', onMessage);
}

/**
 * Reports what this page has: which projects it asks for, whether they load, and what its
 * security policy blocks. Then it can preview a draft here, as test mode does.
 */
async function startCheck(nonce: string, origin: string) {
  const ids = (selector: string, read: (el: HTMLElement) => string | undefined) =>
    [...new Set([...document.querySelectorAll<HTMLElement>(selector)].map(read).filter((id): id is string => Boolean(id)))];
  const scriptProjects = ids('script[data-project-id]', (el) => el.dataset.projectId);
  const slotProjects = ids('[data-flowpilot]', (el) => el.dataset.flowpilot);
  const projects: SiteCheckReport['projects'] = {};
  let backend: SiteCheckReport['backend'] = isDemoBuild ? 'demo' : 'ok';
  if (!isDemoBuild) {
    for (const id of new Set([...scriptProjects, ...slotProjects])) {
      try {
        const snapshot = await api.getPublishedExperience(id);
        projects[id] = snapshot?.documents?.length ? 'published' : 'not-published';
      } catch {
        projects[id] = 'error';
        backend = 'unreachable';
      }
    }
  }
  // A violation is reported a moment after the request it stopped.
  await new Promise((resolve) => setTimeout(resolve, 300));
  const report: SiteCheckReport = { scriptProjects, slotProjects, backend, projects, blocked: [...blocked], path: window.location.pathname };
  window.opener?.postMessage({ type: 'flowpilot:check', nonce, report }, origin);
  startTest(nonce, origin, 'FlowPilot check: only you can see this');
}

/** Returns true when the editor opened this page, for picking, building, testing or checking. */
function checkLiveMode(allowedOrigin: string | null): boolean {
  if (!window.opener || !allowedOrigin) return false;
  const match = window.location.hash.match(/^#fp-(pick|build|test|check)=([\w-]+)&origin=([^&]+)$/);
  let live: { mode: LiveMode | 'pick' | 'check'; nonce: string; origin: string } | null = null;
  if (match) {
    live = { mode: match[1] as LiveMode | 'pick' | 'check', nonce: match[2], origin: decodeURIComponent(match[3]) };
  } else {
    // Build and test continue across the page changes of a site with full page loads.
    try {
      live = JSON.parse(read('session', LIVE_KEY) ?? 'null');
    } catch {
      live = null;
    }
  }
  // Only the builder this script belongs to may drive it, so no other site can open
  // a customer's page and read what's clicked, or show something there.
  if (!live || live.origin !== allowedOrigin) return false;
  if (match) history.replaceState(null, '', window.location.pathname + window.location.search);

  if (live.mode === 'pick') {
    startPicker(live.nonce, live.origin);
    return true;
  }
  if (live.mode === 'check') {
    void startCheck(live.nonce, live.origin);
    return true;
  }
  write('session', LIVE_KEY, JSON.stringify(live));
  if (live.mode === 'build') startBuilder(live.nonce, live.origin);
  else startTest(live.nonce, live.origin);
  window.opener.postMessage({ type: 'flowpilot:ready', nonce: live.nonce }, live.origin);
  return true;
}

function builderOrigin(script: HTMLScriptElement | null): string | null {
  if (script?.dataset.builderOrigin) return script.dataset.builderOrigin;
  try {
    return script?.src ? new URL(script.src).origin : null;
  } catch {
    return null;
  }
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
    watchSecurityPolicy();
    window.FlowPilot = publicApi;
    isLive = checkLiveMode(builderOrigin(element));
    if (isLive) return;
    watchNavigation();
    window.addEventListener('pagehide', flush);
  }

  // A second script tag on the page must not start tours over the builder.
  if (isLive) return;

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
