import React, { CSSProperties, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { DocContent, ProjectSettings, ProjectType, Theme, TourSettings } from '../core/schema';
import { MODULES } from '../core/modules';
import { expandContent, RenderNode, safeUrl, VariableValues } from '../core/variables';
import { RenderedNode, StyleTag } from '../renderer/ExperienceView';
import { RenderContext } from '../renderer/types';
import { Align, Placement, positionStep, Rect } from './tourPosition';

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
  /** Moves the tour to another page of the customer's site. */
  goToPath?: (path: string) => boolean;
  /** True when played on a standalone share page (/s/:slug) without an underlying app DOM. */
  standalone?: boolean;
}

export interface ExperiencePlayerProps {
  type: ProjectType;
  content: DocContent;
  theme: Theme;
  variables: VariableValues;
  settings: ProjectSettings;
  host: PlayerHost;
  mode?: 'preview' | 'live';
  /** Set when playing inside another page, so its theme stays its own. */
  scopeId?: string;
}

const EMPTY_TOUR: TourSettings = {};
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

const DEFAULT_WAIT_SECONDS = 2.5;

const TourPlayer: React.FC<{ tree: RenderNode; ctxBase: RenderContext; host: PlayerHost; settings: TourSettings }> = ({ tree, ctxBase, host, settings }) => {
  const steps = tree.children.filter((child) => child.type === 'TourStep');
  const [index, setIndex] = useState(() => Math.min(host.initialStep ?? 0, Math.max(steps.length - 1, 0)));
  const [targetRect, setTargetRect] = useState<Rect | null>(null);
  const [position, setPosition] = useState<{ top: number; left: number; side?: Placement; caret?: number } | null>(null);
  const [isCentered, setIsCentered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const directionRef = useRef(1);
  const step = steps[index];
  const layout = (step?.props.layout as string) || 'tooltip';
  const usesTarget = layout === 'tooltip';
  const view = host.targetDocument.defaultView ?? window;

  const finish = useCallback((reason: 'closed' | 'completed') => {
    host.track?.(reason === 'completed' ? 'tour_completed' : 'tour_skipped', { step: index + 1 });
    host.onFinish?.(reason);
    if (reason === 'completed' && settings.finishUrl && ctxBase.mode === 'live') view.location.assign(safeUrl(settings.finishUrl));
  }, [host, index, settings.finishUrl, ctxBase.mode, view]);

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

  // A step can belong to another page of the customer's site.
  const path = typeof step?.props.path === 'string' ? step.props.path.trim() : '';
  const [refusedPath, setRefusedPath] = useState<string | null>(null);
  const isOnPage = !path || !path.startsWith('/') || path.startsWith('//') || view.location.pathname === path || !host.goToPath || refusedPath === path;
  useEffect(() => {
    // Refused means this page was already tried and it sent us back, so stay here.
    if (path && !isOnPage && host.goToPath?.(path) === false) setRefusedPath(path);
  }, [path, isOnPage, host]);

  // Target elements may appear after the page loads, so this waits briefly before falling back.
  useEffect(() => {
    if (!step || !isOnPage) return undefined;
    const selector = usesTarget ? step.props.selector : '';
    const hasSelector = typeof selector === 'string' && selector.trim() !== '';
    const waitMs = (settings.waitSeconds ?? DEFAULT_WAIT_SECONDS) * 1000;
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
          if (settings.scrollToTarget !== false) target.scrollIntoView?.({ block: 'center', inline: 'nearest' });
        }
        const box = target.getBoundingClientRect();
        setIsCentered(false);
        setTargetRect((previous) =>
          previous && previous.top === box.top && previous.left === box.left && previous.width === box.width && previous.height === box.height
            ? previous
            : { top: box.top, left: box.left, width: box.width, height: box.height },
        );
      } else if (!hasSelector || host.standalone || Date.now() - started > waitMs) {
        if (hasSelector && !host.standalone && step.props.fallback === 'skip') {
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
  }, [step, index, host, goTo, usesTarget, isOnPage, settings.waitSeconds, settings.scrollToTarget]);

  // A step can move on when its element is clicked, which is how people learn by doing.
  const hasTarget = Boolean(targetRect);
  useEffect(() => {
    if (!step || !hasTarget || step.props.advance !== 'target') return undefined;
    const target = findTarget(host.targetDocument, step.props.selector);
    if (!target) return undefined;
    const onClick = () => {
      host.track?.('tour_step_completed', { step: index + 1 });
      goTo(index + 1, 1);
    };
    target.addEventListener('click', onClick);
    return () => target.removeEventListener('click', onClick);
  }, [step, hasTarget, host, index, goTo]);

  useEffect(() => {
    if (settings.keyboard === false) return undefined;
    const onKey = (event: KeyboardEvent) => {
      const typing = (event.target as Element | null)?.closest?.('input,textarea,select,[contenteditable]');
      if (typing) return;
      if (event.key === 'Escape') finish('closed');
      else if (event.key === 'ArrowRight') goTo(index + 1, 1);
      else if (event.key === 'ArrowLeft') goTo(index - 1, -1);
    };
    host.targetDocument.addEventListener('keydown', onKey);
    return () => host.targetDocument.removeEventListener('keydown', onKey);
  }, [settings.keyboard, host, finish, goTo, index]);

  useLayoutEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    const size = { width: card.offsetWidth, height: card.offsetHeight };
    // Previews run in an iframe, whose viewport isn't this script's window.
    const viewport = { width: view.innerWidth, height: view.innerHeight };
    const edge = 16;
    let next: { top: number; left: number; side?: Placement; caret?: number } | null = null;
    if (layout === 'slideout') next = { top: Math.max(8, viewport.height - size.height - edge), left: Math.max(8, viewport.width - size.width - edge) };
    else if (layout === 'sidebar') next = { top: 0, left: Math.max(0, viewport.width - size.width) };
    else if (targetRect) {
      const result = positionStep(targetRect, size, viewport, (step?.props.placement as Placement) || 'bottom', (step?.props.align as Align) || 'center');
      next = { top: result.top, left: result.left, side: result.placement, caret: result.caret };
    } else if (isCentered || layout === 'modal') {
      next = { top: Math.max(8, (viewport.height - size.height) / 2), left: Math.max(8, (viewport.width - size.width) / 2) };
    }
    if (next) {
      const value = next;
      setPosition((previous) => (previous && previous.top === value.top && previous.left === value.left && previous.side === value.side && previous.caret === value.caret ? previous : value));
    }
  }, [targetRect, isCentered, step, index, layout, view]);

  const label = [settings.showProgress ? `Step ${index + 1} of ${steps.length}` : '', settings.estimatedTime?.trim() ?? ''].filter(Boolean).join('  ·  ');
  const ctx: RenderContext = {
    ...ctxBase,
    tourChrome: { label: label || undefined, canClose: settings.showClose },
    onAction: (action) => {
      if (action === 'next') {
        host.track?.('tour_step_completed', { step: index + 1 });
        goTo(index + 1, 1);
      } else if (action === 'prev') goTo(index - 1, -1);
      else if (action === 'close') finish('closed');
    },
  };

  if (!step || !isOnPage) return null;

  const pad = settings.highlightPadding ?? 6;
  const dims = step.props.spotlight !== false && layout !== 'slideout';
  const shade = `rgba(15,23,42,${Math.max(0, Math.min(90, settings.backdrop ?? 55)) / 100})`;
  const usesPage = step.props.advance === 'target' || step.props.allowInteraction === true || !dims;
  // The arrow follows the side the step really ended up on, which can differ near an edge.
  const shown: RenderNode = {
    ...step,
    props: {
      ...step.props,
      selector: targetRect ? step.props.selector : '',
      placement: position?.side ?? step.props.placement,
      align: '',
    },
  };
  const closeFromBackdrop = settings.closeOnBackdrop ? () => finish('closed') : undefined;

  return (
    <div
      style={{ ...FIXED_FULL, pointerEvents: usesPage ? 'none' : undefined }}
      data-fp-tour=""
      onClick={(event) => {
        if (event.target === event.currentTarget) closeFromBackdrop?.();
      }}
    >
      {dims && !targetRect && <div style={{ position: 'fixed', inset: 0, background: shade }} onClick={closeFromBackdrop} />}
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
            boxShadow: dims ? `0 0 0 9999px ${shade}` : '0 0 0 3px var(--fp-primary)',
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
          pointerEvents: 'auto',
          ...(position?.caret !== undefined ? ({ '--fp-caret': `${position.caret}px` } as CSSProperties) : {}),
        }}
      >
        <RenderedNode node={shown} ctx={ctx} />
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

  const goTo = (next: number) => {
    if (next >= screens.length || Number.isNaN(next)) {
      host.track?.('demo_completed');
      setIsDone(true);
      host.onFinish?.('completed');
    } else if (next < 0) {
      setIndex(0);
      setIsDone(false);
    } else {
      setIsDone(false);
      setIndex(next);
    }
  };

  const ctx: RenderContext = {
    ...ctxBase,
    onAction: (action, value) => {
      if (action === 'goto') goTo(Number(value));
      else if (action === 'prev') goTo(index - 1);
      else goTo(index + 1);
    },
  };

  if (!screens[index]) return null;
  const progressPercent = Math.round(((index + 1) / Math.max(screens.length, 1)) * 100);

  return (
    <div className="fp-demo-player-container">
      <div className="fp-demo-bar">
        <div className="fp-demo-chapters">
          {screens.map((screen, i) => {
            const title = (screen.props.title as string) || (screen.props.alt as string) || `Screen ${i + 1}`;
            const isActive = i === index && !isDone;
            const isPast = i < index;
            return (
              <button
                key={screen.key || i}
                type="button"
                className="fp-demo-chapter-btn"
                data-active={isActive}
                data-completed={isPast}
                onClick={() => goTo(i)}
                title={title}
              >
                <span className="fp-demo-chapter-num">{isPast ? '✓' : i + 1}</span>
                <span className="fp-demo-chapter-label">{title}</span>
              </button>
            );
          })}
        </div>
        <div className="fp-demo-actions">
          <span className="fp-demo-step-text">Step {Math.min(index + 1, screens.length)} of {screens.length}</span>
          <div style={{ display: 'flex', gap: 8 }}>
            {index > 0 && !isDone && (
              <button type="button" className="fp-btn fp-btn-secondary" onClick={() => goTo(index - 1)}>
                Back
              </button>
            )}
            {isDone ? (
              <button type="button" className="fp-btn fp-btn-primary" onClick={() => goTo(0)}>
                Restart
              </button>
            ) : (
              <button type="button" className="fp-btn fp-btn-primary" onClick={() => goTo(index + 1)}>
                {index === screens.length - 1 ? 'Finish' : 'Next'}
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="fp-demo-progress-track">
        <div className="fp-demo-progress-fill" style={{ width: `${isDone ? 100 : progressPercent}%` }} />
      </div>
      <div style={{ position: 'relative' }}>
        <RenderedNode node={screens[index]} ctx={ctx} />
        {isDone && (
          <div className="fp-demo-complete-overlay">
            <div className="fp-demo-complete-card">
              <div className="fp-demo-complete-icon">🎉</div>
              <h3 className="fp-heading fp-h3">Demo Completed!</h3>
              <p style={{ color: 'var(--fp-muted)', margin: '12px 0 24px', fontSize: '0.9375rem' }}>
                You've completed the interactive product walkthrough. Ready to see more or build your own?
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button
                  type="button"
                  className="fp-btn fp-btn-secondary"
                  onClick={() => goTo(0)}
                >
                  Start Over
                </button>
                <button
                  type="button"
                  className="fp-btn fp-btn-primary"
                  onClick={() => {
                    if (host.goToPath) host.goToPath('/');
                    else if (host.onFinish) host.onFinish('completed');
                    else goTo(0);
                  }}
                >
                  Get Started Free
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/** Plays any published experience. The embed, hosted links and previews all use this. */
export const ExperiencePlayer: React.FC<ExperiencePlayerProps> = ({ type, content, theme, variables, settings, host, mode = 'live', scopeId }) => {
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
    body = <TourPlayer tree={tree} ctxBase={ctxBase} host={closingHost} settings={settings.tour ?? EMPTY_TOUR} />;
  } else if (type === 'demo') {
    body = <DemoPlayer tree={tree} ctxBase={ctxBase} host={host} />;
  } else if (type === 'banner') {
    // A banner comes in several styles. One with a Popup block shows as a modal.
    if (tree.children.some((child) => child.type === 'Popup')) {
      body = (
        <div
          data-fp-modal=""
          style={{ ...FIXED_FULL, background: 'rgba(15,23,42,.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, overflow: 'auto' }}
          onClick={(event) => {
            if (event.target === event.currentTarget) ctxBase.onAction?.('close');
          }}
        >
          <RenderedNode node={tree} ctx={ctxBase} />
        </div>
      );
    } else if (settings.position === 'inline') {
      body = <RenderedNode node={tree} ctx={ctxBase} />;
    } else {
      const edge = settings.position === 'bottom' ? { bottom: 0 } : { top: 0 };
      body = (
        <div style={{ position: 'fixed', left: 0, right: 0, zIndex: 2147483000, ...edge }}>
          <RenderedNode node={tree} ctx={ctxBase} />
        </div>
      );
    }
  } else {
    body = <RenderedNode node={tree} ctx={ctxBase} />;
  }

  return (
    <div className={scopeId ? `fp-root fp-scope-${scopeId}` : 'fp-root'} style={delivery === 'overlay' ? { background: 'transparent' } : undefined}>
      <StyleTag theme={theme} trees={trees} scopeId={scopeId} />
      {body}
    </div>
  );
};
