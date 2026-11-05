import { create } from 'zustand';
import { useStudio } from './store';

export type LiveMode = 'build' | 'test';
export type LiveStatus = 'idle' | 'waiting' | 'connected' | 'missing' | 'blocked' | 'closed';

const WAIT_FOR_SCRIPT_MS = 8000;

interface LiveSiteState {
  status: LiveStatus;
  mode: LiveMode;
  added: number;
  /** Opens the customer's site in a new tab and stays connected to it. */
  open: (url: URL, mode: LiveMode) => void;
  stop: () => void;
}

let cleanup: () => void = () => undefined;

const draftSnapshot = () => {
  const { project, draft, documents } = useStudio.getState();
  if (!project || !draft) return null;
  return {
    project: { id: project.id, type: project.type, title: draft.title, slug: project.slug ?? '', variables: draft.variables, theme: draft.theme, settings: draft.settings },
    documents: documents.map(({ id, kind, title, slug, position, seo, content }) => ({ id, kind, title, slug, position, seo, content })),
  };
};

/**
 * Lasts as long as the editor, not the panel that started it: adding a step opens that
 * step's settings, and the connection has to keep going for the next click.
 */
export const useLiveSite = create<LiveSiteState>((set, get) => ({
  status: 'idle',
  mode: 'build',
  added: 0,

  open: (url, mode) => {
    get().stop();
    const nonce = crypto.randomUUID();
    const target = new URL(url);
    target.hash = `fp-${mode}=${nonce}&origin=${encodeURIComponent(window.location.origin)}`;
    const popup = window.open(target.toString(), 'flowpilot-live');
    set({ mode, added: 0 });
    if (!popup) {
      set({ status: 'blocked' });
      return;
    }
    set({ status: 'waiting' });

    const timer = window.setTimeout(() => {
      if (get().status === 'waiting') set({ status: 'missing' });
    }, WAIT_FOR_SCRIPT_MS);
    const closedCheck = window.setInterval(() => {
      if (!popup.closed) return;
      if (get().status !== 'missing') set({ status: 'closed' });
      cleanup();
    }, 1000);

    const listener = (event: MessageEvent) => {
      if (event.source !== popup || event.origin !== target.origin || event.data?.nonce !== nonce) return;
      if (event.data.type === 'flowpilot:ready') {
        window.clearTimeout(timer);
        set({ status: 'connected' });
        // Sent on every page load, since the tour on that site starts again each time.
        if (mode === 'test') popup.postMessage({ type: 'flowpilot:draft', nonce, snapshot: draftSnapshot() }, target.origin);
      } else if (event.data.type === 'flowpilot:step' && mode === 'build' && typeof event.data.selector === 'string') {
        useStudio.getState().addTourStep({
          selector: event.data.selector,
          text: typeof event.data.text === 'string' ? event.data.text : '',
          path: typeof event.data.path === 'string' ? event.data.path : '',
        });
        set({ added: get().added + 1 });
      } else if (event.data.type === 'flowpilot:done') {
        set({ status: 'closed' });
        cleanup();
      }
    };
    window.addEventListener('message', listener);
    cleanup = () => {
      window.removeEventListener('message', listener);
      window.clearTimeout(timer);
      window.clearInterval(closedCheck);
      cleanup = () => undefined;
    };
  },

  stop: () => {
    cleanup();
    set({ status: 'idle', added: 0 });
  },
}));
