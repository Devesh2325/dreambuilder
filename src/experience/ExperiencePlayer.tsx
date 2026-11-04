import React, { CSSProperties, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { DocContent, ProjectSettings, ProjectType, Theme } from '../core/schema';
import { MODULES } from '../core/modules';
import { expandContent, RenderNode, VariableValues } from '../core/variables';
import { RenderedNode, StyleTag } from '../renderer/ExperienceView';
import { RenderContext } from '../renderer/types';
import { Placement, positionStep, Rect } from './tourPosition';

export interface PlayerHost {
  /** Whole document the tour targets live in. */
  targetDocument: Document;
  submitForm?: RenderContext['submitForm'];
  track?: RenderContext['track'];
  /** Called when the experience finishes: closed by the user or completed. */
  onFinish?: (reason: 'closed' | 'completed') => void;
  /** Step to continue from, for tours and demos resumed later. */
  initialStep?: number;
  onStepChange?: (step: number) => void;
  navigate?: RenderContext['navigate'];
}

export interface ExperiencePlayerProps {
  type: ProjectType;
  content: DocContent;
  theme: Theme;
  variables: VariableValues;
  settings: ProjectSettings;
  host: PlayerHost;
  mode?: 'preview' | 'live';
}

const FIXED_FULL: CSSProperties = { position: 'fixed', inset: 0, zIndex: 2147483000 };

const findTarget = (doc: Document, selector: unknown): Element | null => {
  if (typeof selector !== 'string' || !selector.trim()) return null;
  try {
    return doc.querySelector(selector);
  } catch {
    // A mistyped selector counts as a missing target, not a crash on the customer's site.
    return null;
  }
};

const TARGET_WAIT_MS = 2500;

const TourPlayer: React.FC<{ tree: RenderNode; ctxBase: RenderContext; host: PlayerHost }> = ({ tree, ctxBase, host }) => {
  const steps = tree.children.filter((child) => child.type === 'TourStep');
  const [index, setIndex] = useState(() => Math.min(host.initialStep ?? 0, Math.max(steps.length - 1, 0)));
  const [targetRect, setTargetRect] = useState<Rect | null>(null);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const [isCentered, setIsCentered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const directionRef = useRef(1);
  const step = steps[index];

  const finish = useCallback((reason: 'closed' | 'completed') => {
    host.track?.(reason === 'completed' ? 'tour_completed' : 'tour_skipped', { step: index + 1 });
    host.onFinish?.(reason);
  }, [host, index]);

  const goTo = useCallback((next: number, direction: number) => {
    directionRef.current = direction;
    if (next >= steps.length) {
      finish('completed');
      return;
    }
    if (next < 0) return;
    setPosition(null);
    setTargetRect(null);
    setIndex(next);
    host.onStepChange?.(next);
  }, [finish, host, steps.length]);

  useEffect(() => {
    if (step) host.track?.('tour_step_viewed', { step: index + 1 });
    // Only when the step changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  // Target elements may appear after the page loads, so this waits briefly before falling back.
  useEffect(() => {
    if (!step) return undefined;
    const selector = step.props.selector;
    const hasSelector = typeof selector === 'string' && selector.trim() !== '';
    let frame = 0;
    let cancelled = false;
    let scrolled = false;
    const started = Date.now();

    const update = () => {
      if (cancelled) return;
      const target = findTarget(host.targetDocument, selector);
      if (target) {
        if (!scrolled) {
          scrolled = true;
          target.scrollIntoView?.({ block: 'center', inline: 'nearest' });
        }
        const box = target.getBoundingClientRect();
        setIsCentered(false);
        setTargetRect((previous) =>
          previous && previous.top === box.top && previous.left === box.left && previous.width === box.width && previous.height === box.height
            ? previous
            : { top: box.top, left: box.left, width: box.width, height: box.height },
        );
      } else if (!hasSelector || Date.now() - started > TARGET_WAIT_MS) {
        if (hasSelector && step.props.fallback === 'skip') {
          host.track?.('tour_step_skipped', { step: index + 1, reason: 'missing_target' });
          // Going back from the second step onto a missing first step has nowhere to
          // go, so it turns around instead of leaving nothing on screen.
          const previous = index + directionRef.current;
          if (previous < 0) goTo(index + 1, 1);
          else goTo(previous, directionRef.current);
          return;
        }
        setIsCentered(true);
        setTargetRect(null);
      }
      frame = window.requestAnimationFrame(update);
    };
    update();
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
    };
  }, [step, index, host, goTo]);

  useLayoutEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    const size = { width: card.offsetWidth, height: card.offsetHeight };
    // Previews run in an iframe, whose viewport isn't this script's window.
    const view = host.targetDocument.defaultView ?? window;
    const viewport = { width: view.innerWidth, height: view.innerHeight };
    if (targetRect) {
      const result = positionStep(targetRect, size, viewport, (step?.props.placement as Placement) ?? 'bottom');
      setPosition((previous) => (previous && previous.top === result.top && previous.left === result.left ? previous : { top: result.top, left: result.left }));
    } else if (isCentered) {
      setPosition({ top: Math.max(8, (viewport.height - size.height) / 2), left: Math.max(8, (viewport.width - size.width) / 2) });
    }
  }, [targetRect, isCentered, step, index, host]);

  const ctx: RenderContext = {
    ...ctxBase,
    onAction: (action) => {
      if (action === 'next') {
        host.track?.('tour_step_completed', { step: index + 1 });
        goTo(index + 1, 1);
      } else if (action === 'prev') goTo(index - 1, -1);
      else if (action === 'close') finish('closed');
    },
  };

  if (!step) return null;

  const pad = 6;
  const dims = step.props.spotlight !== false;

  return (
    <div style={FIXED_FULL} data-fp-tour="">
      {dims && !targetRect && <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.55)' }} />}
      {targetRect && (
        <div
          data-fp-spotlight=""
          style={{
            position: 'fixed',
            top: targetRect.top - pad,
            left: targetRect.left - pad,
            width: targetRect.width + pad * 2,
            height: targetRect.height + pad * 2,
            borderRadius: 8,
            pointerEvents: 'none',
            boxShadow: dims ? '0 0 0 9999px rgba(15,23,42,.55)' : '0 0 0 3px var(--fp-primary)',
          }}
        />
      )}
      <div
        ref={cardRef}
        style={{
          position: 'fixed',
          top: position?.top ?? 0,
          left: position?.left ?? 0,
          // Kept invisible until measured, so it doesn't flash in the corner.
          visibility: position ? 'visible' : 'hidden',
          maxWidth: 'calc(100vw - 16px)',
        }}
      >
        <RenderedNode node={step} ctx={ctx} />
      </div>
    </div>
  );
};

const DemoPlayer: React.FC<{ tree: RenderNode; ctxBase: RenderContext; host: PlayerHost }> = ({ tree, ctxBase, host }) => {
  const screens = tree.children.filter((child) => child.type === 'DemoScreen');
  const [index, setIndex] = useState(0);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    host.track?.('demo_step_viewed', { step: index + 1 });
    // Only when the screen changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  const ctx: RenderContext = {
    ...ctxBase,
    onAction: (action, value) => {
      const next = action === 'goto' ? Number(value) : index + 1;
      if (next >= screens.length || next < 0 || Number.isNaN(next)) {
        host.track?.('demo_completed');
        setIsDone(true);
        host.onFinish?.('completed');
      } else {
        setIndex(next);
      }
    },
  };

  if (!screens[index]) return null;
  return (
    <div style={{ position: 'relative' }}>
      <RenderedNode node={screens[index]} ctx={ctx} />
      {isDone && (
        <div style={{ textAlign: 'center', padding: 12 }}>
          <button type="button" className="fp-btn fp-btn-secondary" onClick={() => { setIsDone(false); setIndex(0); }}>
            Restart
          </button>
        </div>
      )}
    </div>
  );
};

/** Plays any published experience. The embed, hosted links and previews all use this. */
export const ExperiencePlayer: React.FC<ExperiencePlayerProps> = ({ type, content, theme, variables, settings, host, mode = 'live' }) => {
  const [isClosed, setIsClosed] = useState(false);
  const tree = useMemo(() => expandContent(content, variables), [content, variables]);
  const trees = useMemo(() => [tree], [tree]);
  const delivery = MODULES[type].delivery;

  const close = useCallback((reason: 'closed' | 'completed') => {
    setIsClosed(true);
    host.onFinish?.(reason);
  }, [host]);

  const closingHost = useMemo<PlayerHost>(() => ({ ...host, onFinish: close }), [host, close]);

  const ctxBase: RenderContext = {
    mode,
    submitForm: host.submitForm,
    track: host.track,
    navigate: host.navigate,
    onAction: (action) => {
      if (action === 'close' || action === 'next') {
        host.track?.(`${type}_dismissed`);
        close(action === 'next' ? 'completed' : 'closed');
      }
    },
  };

  if (!tree || isClosed) return null;

  let body: React.ReactNode;
  if (type === 'tour') {
    body = <TourPlayer tree={tree} ctxBase={ctxBase} host={closingHost} />;
  } else if (type === 'demo') {
    body = <DemoPlayer tree={tree} ctxBase={ctxBase} host={host} />;
  } else if (type === 'banner') {
    const edge = settings.position === 'bottom' ? { bottom: 0 } : { top: 0 };
    body = (
      <div style={{ position: 'fixed', left: 0, right: 0, zIndex: 2147483000, ...edge }}>
        <RenderedNode node={tree} ctx={ctxBase} />
      </div>
    );
  } else if (type === 'popup') {
    body = (
      <div
        style={{ ...FIXED_FULL, background: 'rgba(15,23,42,.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, overflow: 'auto' }}
        onClick={(event) => {
          if (event.target === event.currentTarget) ctxBase.onAction?.('close');
        }}
      >
        <RenderedNode node={tree} ctx={ctxBase} />
      </div>
    );
  } else {
    body = <RenderedNode node={tree} ctx={ctxBase} />;
  }

  return (
    <div className="fp-root" style={delivery === 'overlay' ? { background: 'transparent' } : undefined}>
      <StyleTag theme={theme} trees={trees} />
      {body}
    </div>
  );
};
