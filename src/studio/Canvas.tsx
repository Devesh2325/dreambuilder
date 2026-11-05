import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUp, ChevronRight, Copy, GripVertical, Trash2 } from 'lucide-react';
import { useEmbedRenderer } from '../experience/EmbeddedProject';
import { findParentId, getAncestors } from '../core/tree';
import { resolveString, tokensIn } from '../core/variables';
import { buildNavLinks } from '../experience/SiteView';
import { BLOCK_META, canContain } from '../renderer/blockMeta';
import { ExperienceView } from '../renderer/ExperienceView';
import { Frame } from '../renderer/Frame';
import { RenderContext } from '../renderer/types';
import { handleStudioShortcut } from './shortcuts';
import { StepBar } from './StepBar';
import { findSteps, stepOfNode } from './steps';
import { useStudio } from './store';
import { nodesUsingVariable } from './variableUsage';

/** The prop that double-clicking edits. */
const INLINE_PROP: Record<string, string> = {
  Heading: 'text', Text: 'text', Button: 'text', Accordion: 'question', FormField: 'label', Navbar: 'brand',
};

const DEVICE_LOGICAL_WIDTH = { tablet: 768, mobile: 390 } as const;
const STAGE_PADDING = 12;
// Desktop always renders at least this wide, staying above the tablet breakpoint, and
// is scaled to fit. Otherwise a small screen would show phone styles in Desktop view.
const DESKTOP_FIT_WIDTH = 1100;
const DESKTOP_MIN_WIDTH = 1000;

// Editor-only styles inside the frame. Empty blocks have no height, so without this
// they couldn't be seen, clicked or dropped on. None of this reaches published pages.
const CANVAS_CSS = `
html{scrollbar-width:thin;scrollbar-color:rgba(100,116,139,.45) transparent}
.fp-root{min-height:100vh}
.fp-page:has(>.fp-step),.fp-page:has(>.fp-popup){min-height:100vh;display:flex;align-items:center;justify-content:center;padding:32px;background:color-mix(in srgb,var(--fp-text) 8%,var(--fp-background))}
.fp-page:has(>.fp-step[data-layout=slideout]){align-items:flex-end;justify-content:flex-end;padding:16px}
.fp-page:has(>.fp-step[data-layout=sidebar]){align-items:stretch;justify-content:flex-end;padding:0}
.fp-video iframe,.fp-video video{pointer-events:none}
.fp-hotspot-tip{cursor:move}
*{user-select:none}
a:not([draggable=true]),img:not([draggable=true]){-webkit-user-drag:none}
[draggable=true]{cursor:grab}
.fp-hotspot{cursor:move;animation:none}
.fp-embed .fp-root{min-height:0}
.fp-embed>div{pointer-events:none}
.fp-section:empty,.fp-container:empty,.fp-box:empty,.fp-grid:empty,.fp-row:empty,.fp-page:empty,.fp-marquee-track:empty,.fp-carousel:empty{min-height:88px;display:flex;align-items:center;justify-content:center;border:1.5px dashed rgba(99,102,241,.4);border-radius:8px;background:rgba(99,102,241,.04)}
.fp-section:empty::after,.fp-container:empty::after,.fp-box:empty::after,.fp-grid:empty::after,.fp-row:empty::after,.fp-page:empty::after,.fp-marquee-track:empty::after,.fp-carousel:empty::after{content:'Empty: drag blocks here';font:500 13px system-ui,sans-serif;color:rgba(79,70,229,.8)}
`;

interface Box {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface DropTarget {
  parentId: string;
  index: number;
  box: Box;
  mode: 'inside' | 'before' | 'after';
  horizontal: boolean;
}

const boxOf = (element: Element): Box => {
  const rect = element.getBoundingClientRect();
  return { top: rect.top, left: rect.left, width: rect.width, height: rect.height };
};

const sameBox = (a: Box | null, b: Box | null) =>
  a === b || (!!a && !!b && a.top === b.top && a.left === b.left && a.width === b.width && a.height === b.height);

const nodeElement = (doc: Document, id: string) => doc.querySelector(`[data-fp-node="${CSS.escape(id)}"]`);

const closestNode = (target: EventTarget | null): Element | null => {
  // Cross-document: instanceof Element is false for nodes inside the iframe.
  const node = target as Element | null;
  return node && typeof node.closest === 'function' ? node.closest('[data-fp-node]') : null;
};

const Overlay: React.FC<{ doc: Document }> = ({ doc }) => {
  const selectedId = useStudio((s) => s.selectedId);
  const hoveredId = useStudio((s) => s.hoveredId);
  const readOnly = useStudio((s) => s.readOnly);
  const documents = useStudio((s) => s.documents);
  const device = useStudio((s) => s.device);
  const dragging = useStudio((s) => s.dragging);
  const { duplicateBlock, removeBlock, getNode, updateProps, setDragging, documentOfNode, select } = useStudio.getState();

  const highlighted = useStudio((s) => s.highlightedVariable);
  const [usageBoxes, setUsageBoxes] = useState<Box[]>([]);
  const [selectedBox, setSelectedBox] = useState<Box | null>(null);
  const [hoverBox, setHoverBox] = useState<Box | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);
  const [editing, setEditing] = useState<{ id: string; prop: string; value: string; initial: string } | null>(null);
  const dropRef = useRef<DropTarget | null>(null);

  const usageIds = useMemo(() => {
    if (!highlighted) return [];
    return useStudio.getState().visibleDocuments().flatMap((owner) => nodesUsingVariable(owner.content, highlighted));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlighted, documents]);

  // Blocks can move for many reasons (typing, images loading, scrolling), so measuring every frame is simplest and reliable.
  useEffect(() => {
    let frame = 0;
    const measure = () => {
      const selected = selectedId ? nodeElement(doc, selectedId) : null;
      const nextSelected = selected ? boxOf(selected) : null;
      setSelectedBox((previous) => (sameBox(previous, nextSelected) ? previous : nextSelected));
      const hovered = hoveredId && hoveredId !== selectedId ? nodeElement(doc, hoveredId) : null;
      const nextHover = hovered ? boxOf(hovered) : null;
      setHoverBox((previous) => (sameBox(previous, nextHover) ? previous : nextHover));
      // A repeated block is drawn many times, and each copy counts.
      const nextUsage = usageIds.flatMap((id) => [...doc.querySelectorAll(`[data-fp-node="${CSS.escape(id)}"]`)].map(boxOf));
      setUsageBoxes((previous) => (previous.length === nextUsage.length && previous.every((box, index) => sameBox(box, nextUsage[index])) ? previous : nextUsage));
      frame = requestAnimationFrame(measure);
    };
    measure();
    return () => cancelAnimationFrame(frame);
  }, [doc, selectedId, hoveredId, documents, device, usageIds]);

  // Bring a block chosen from the layers panel into view.
  useEffect(() => {
    if (selectedId) nodeElement(doc, selectedId)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [doc, selectedId]);

  const computeDrop = useCallback((event: DragEvent): DropTarget | null => {
    const state = useStudio.getState();
    const payload = state.dragging;
    if (!payload) return null;
    const movingType = payload.kind === 'block' ? payload.type : payload.kind === 'nodes' ? payload.nodes[payload.rootId]?.type : state.getNode(payload.id)?.type;
    if (!movingType) return null;

    let element = closestNode(event.target);
    if (!element) {
      // Dropped on empty canvas: use the page's root.
      const activeDoc = state.documents.find((d) => d.id === state.activeDocumentId);
      element = activeDoc ? nodeElement(doc, activeDoc.content.rootId) : null;
    }

    // Walks outward until something accepts the block.
    while (element) {
      const id = element.getAttribute('data-fp-node')!;
      const docRecord = state.documentOfNode(id);
      const node = docRecord?.content.nodes[id];
      if (!docRecord || !node) return null;
      const isSelf = payload.kind === 'node' && payload.id === id;
      const box = boxOf(element);
      const meta = BLOCK_META[node.type];

      if (!isSelf && meta?.isContainer && canContain(node.type, movingType)) {
        const edge = Math.min(14, box.height / 4);
        const isInsideZone = node.children.length === 0 || (event.clientY > box.top + edge && event.clientY < box.top + box.height - edge);
        const parentId = findParentId(docRecord.content, id);
        if (isInsideZone || !parentId || !canContain(docRecord.content.nodes[parentId].type, movingType)) {
          return { parentId: id, index: node.children.length, box, mode: 'inside', horizontal: false };
        }
      }

      const parentId = findParentId(docRecord.content, id);
      if (parentId && !isSelf && canContain(docRecord.content.nodes[parentId].type, movingType)) {
        const parentEl = element.parentElement?.closest('[data-fp-node]');
        const display = parentEl ? doc.defaultView?.getComputedStyle(parentEl) : null;
        const horizontal = !!display && ((display.display.includes('flex') && display.flexDirection.startsWith('row')) || display.display.includes('grid'));
        const after = horizontal ? event.clientX > box.left + box.width / 2 : event.clientY > box.top + box.height / 2;
        const index = docRecord.content.nodes[parentId].children.indexOf(id) + (after ? 1 : 0);
        return { parentId, index, box, mode: after ? 'after' : 'before', horizontal };
      }
      element = element.parentElement?.closest('[data-fp-node]') ?? null;
    }
    return null;
  }, [doc]);

  useEffect(() => {
    const onClick = (event: Event) => {
      // Toolbar buttons live in the overlay and handle their own clicks.
      if ((event.target as Element).closest?.('[data-fp-overlay]')) return;
      event.preventDefault();
      const element = closestNode(event.target);
      const state = useStudio.getState();
      const id = element?.getAttribute('data-fp-node') ?? null;
      // A click on empty space lands on the page itself, which opens the project's
      // settings. The page block can still be selected from Layers.
      const isPageRoot = id !== null && state.documentOfNode(id)?.content.rootId === id;
      state.select(isPageRoot ? null : id);
      state.setTool('edit');
    };
    // Any block can be grabbed directly. Only the block under the mouse is draggable, so
    // the browser starts the drag on the innermost one instead of on a parent.
    let grabbable: Element | null = null;
    const onMove = (event: MouseEvent) => {
      // While the button is held a drag may be starting, and it needs the block it
      // started on to stay draggable until the browser has begun the drag.
      if (event.buttons !== 0) return;
      const state = useStudio.getState();
      const element = closestNode(event.target);
      const id = element?.getAttribute('data-fp-node') ?? null;
      state.hover(id);
      if (element === grabbable) return;
      grabbable?.removeAttribute('draggable');
      grabbable = null;
      const node = id ? state.getNode(id) : null;
      const owner = id ? state.documentOfNode(id) : null;
      if (element && node && !state.readOnly && !node.locked && owner?.content.rootId !== id && node.type !== 'DemoHotspot') {
        element.setAttribute('draggable', 'true');
        grabbable = element;
      }
    };
    const onDragStart = (event: DragEvent) => {
      // The toolbar's grip handles its own drag.
      if ((event.target as Element).closest?.('[data-fp-overlay]')) return;
      const state = useStudio.getState();
      if (state.dragging) return;
      const id = closestNode(event.target)?.getAttribute('data-fp-node');
      if (!id || state.readOnly) {
        event.preventDefault();
        return;
      }
      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', id);
      }
      state.beginDrag({ kind: 'node', id }, id);
    };
    const onDragEnd = () => useStudio.getState().setDragging(null);
    // Hotspots are moved by dragging them across their screenshot.
    const onMouseDown = (event: MouseEvent) => {
      const state = useStudio.getState();
      const element = closestNode(event.target);
      const id = element?.getAttribute('data-fp-node');
      if (!element || !id || state.readOnly || state.getNode(id)?.type !== 'DemoHotspot') return;
      const screen = element.parentElement?.closest('[data-fp-node]');
      if (!screen) return;
      event.preventDefault();
      state.select(id);
      const move = (moveEvent: MouseEvent) => {
        const box = screen.getBoundingClientRect();
        const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));
        state.updateProps(id, {
          x: clamp(((moveEvent.clientX - box.left) / box.width) * 100),
          y: clamp(((moveEvent.clientY - box.top) / box.height) * 100),
        });
      };
      const up = () => {
        doc.removeEventListener('mousemove', move);
        doc.removeEventListener('mouseup', up);
      };
      doc.addEventListener('mousemove', move);
      doc.addEventListener('mouseup', up);
    };
    const onLeave = () => useStudio.getState().hover(null);
    const onDoubleClick = (event: MouseEvent) => {
      const state = useStudio.getState();
      if (state.readOnly) return;
      const id = closestNode(event.target)?.getAttribute('data-fp-node');
      const node = id ? state.getNode(id) : null;
      const prop = node ? INLINE_PROP[node.type] : undefined;
      if (!id || !node || !prop) return;
      const raw = String(node.props[prop] ?? '');
      const values = state.draft?.variables ?? {};
      // Values from inside a repeating block aren't known here, so those keep their code.
      const canResolve = [...tokensIn(raw)].every((key) => key in values);
      const initial = canResolve ? String(resolveString(raw, values)) : raw;
      setEditing({ id, prop, value: initial, initial });
    };
    const onDragOver = (event: DragEvent) => {
      if (!useStudio.getState().dragging) return;
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = useStudio.getState().dragging?.kind === 'node' ? 'move' : 'copy';
      const target = computeDrop(event);
      dropRef.current = target;
      setDropTarget(target);
    };
    const onDrop = (event: DragEvent) => {
      event.preventDefault();
      const state = useStudio.getState();
      const payload = state.dragging;
      const target = dropRef.current;
      if (payload && target) {
        if (payload.kind === 'block') state.addBlock(payload.type, target.parentId, target.index);
        else if (payload.kind === 'nodes') state.addNodes(payload.rootId, payload.nodes, target.parentId, target.index);
        else state.moveBlock(payload.id, target.parentId, target.index);
      }
      dropRef.current = null;
      setDropTarget(null);
      state.setDragging(null);
    };
    const onDragLeave = (event: DragEvent) => {
      if (!event.relatedTarget) {
        dropRef.current = null;
        setDropTarget(null);
      }
    };
    // Bound to the frame's document: capture stops links and forms acting inside the editor.
    doc.addEventListener('click', onClick, true);
    doc.addEventListener('submit', onClick, true);
    doc.addEventListener('mousemove', onMove);
    doc.addEventListener('mousedown', onMouseDown);
    doc.addEventListener('dragstart', onDragStart);
    doc.addEventListener('dragend', onDragEnd);
    doc.addEventListener('mouseleave', onLeave);
    doc.addEventListener('dblclick', onDoubleClick);
    doc.addEventListener('dragover', onDragOver);
    doc.addEventListener('drop', onDrop);
    doc.addEventListener('dragleave', onDragLeave);
    doc.addEventListener('keydown', handleStudioShortcut);
    return () => {
      doc.removeEventListener('keydown', handleStudioShortcut);
      doc.removeEventListener('click', onClick, true);
      doc.removeEventListener('submit', onClick, true);
      doc.removeEventListener('mousemove', onMove);
      doc.removeEventListener('mousedown', onMouseDown);
      doc.removeEventListener('dragstart', onDragStart);
      doc.removeEventListener('dragend', onDragEnd);
      doc.removeEventListener('mouseleave', onLeave);
      doc.removeEventListener('dblclick', onDoubleClick);
      doc.removeEventListener('dragover', onDragOver);
      doc.removeEventListener('drop', onDrop);
      doc.removeEventListener('dragleave', onDragLeave);
    };
  }, [doc, computeDrop]);

  useEffect(() => {
    if (!dragging) {
      dropRef.current = null;
      setDropTarget(null);
    }
  }, [dragging]);

  const selected = selectedId ? getNode(selectedId) : null;
  const owner = selectedId ? documentOfNode(selectedId) : null;
  const isRoot = owner?.content.rootId === selectedId;
  const parentId = owner && selectedId ? findParentId(owner.content, selectedId) : null;

  const commitEdit = () => {
    if (editing && editing.value !== editing.initial) updateProps(editing.id, { [editing.prop]: editing.value });
    setEditing(null);
  };

  const line: React.CSSProperties | null = dropTarget && dropTarget.mode !== 'inside'
    ? dropTarget.horizontal
      ? { top: dropTarget.box.top, height: dropTarget.box.height, width: 3, left: dropTarget.mode === 'before' ? dropTarget.box.left - 2 : dropTarget.box.left + dropTarget.box.width - 1 }
      : { left: dropTarget.box.left, width: dropTarget.box.width, height: 3, top: dropTarget.mode === 'before' ? dropTarget.box.top - 2 : dropTarget.box.top + dropTarget.box.height - 1 }
    : null;

  const OUTLINE = '#6366f1';
  const TOOLBAR_HEIGHT = 26;
  const toolbarButton: React.CSSProperties = { background: 'none', border: 0, color: '#fff', padding: 3, cursor: 'pointer', display: 'flex', borderRadius: 3 };
  // Sits above the block, or below it when there's no room above, so it never covers
  // the block's own content or leaves the canvas.
  const tooltipAbove = selected?.type === 'DemoHotspot' && selected.props.placement === 'top';
  const toolbarTop = selectedBox ? (selectedBox.top >= TOOLBAR_HEIGHT + 2 && !tooltipAbove ? selectedBox.top - TOOLBAR_HEIGHT - 2 : selectedBox.top + selectedBox.height + 2) : 0;

  // Inline styles because the iframe deliberately has none of the app's CSS.
  return (
    <div data-fp-overlay="" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 2147483600, fontFamily: 'system-ui, sans-serif' }}>
      {usageBoxes.map((box, index) => (
        <div key={index} data-testid="variable-usage" style={{ position: 'fixed', ...box, outline: '2px solid #f59e0b', outlineOffset: 1, background: 'rgba(245,158,11,.14)', borderRadius: 3 }} />
      ))}
      {hoverBox && !dragging && <div style={{ position: 'fixed', ...hoverBox, outline: `1px solid ${OUTLINE}`, outlineOffset: -1 }} />}
      {selectedBox && !editing && (
        <>
          <div data-testid="selection" style={{ position: 'fixed', ...selectedBox, outline: `2px solid ${OUTLINE}`, outlineOffset: -1 }} />
          {selected && (
            <div
              data-testid="block-toolbar"
              style={{ position: 'fixed', top: toolbarTop, left: Math.max(2, selectedBox.left), height: TOOLBAR_HEIGHT, display: 'flex', alignItems: 'center', gap: 2, background: OUTLINE, color: '#fff', borderRadius: 6, padding: '0 6px', fontSize: 12, boxShadow: '0 2px 8px rgba(15,23,42,.25)', pointerEvents: 'auto', whiteSpace: 'nowrap' }}
            >
              {!isRoot && !readOnly && (
                <span
                  draggable
                  title="Drag to move"
                  onDragStart={(event) => {
                    event.dataTransfer.effectAllowed = 'move';
                    event.dataTransfer.setData('text/plain', selected.id);
                    useStudio.getState().beginDrag({ kind: 'node', id: selected.id });
                  }}
                  onDragEnd={() => setDragging(null)}
                  style={{ cursor: 'grab', display: 'flex' }}
                >
                  <GripVertical size={14} />
                </span>
              )}
              <span style={{ fontWeight: 600, padding: '0 3px' }}>{selected.name ?? BLOCK_META[selected.type]?.label ?? selected.type}</span>
              {parentId && <button type="button" aria-label="Select parent block" title="Select parent" style={toolbarButton} onClick={() => select(parentId)}><ArrowUp size={14} /></button>}
              {!isRoot && !readOnly && (
                <>
                  <button type="button" aria-label="Duplicate block" title="Duplicate" style={toolbarButton} onClick={() => duplicateBlock(selected.id)}><Copy size={14} /></button>
                  <button type="button" aria-label="Delete block" title="Delete" style={toolbarButton} onClick={() => removeBlock(selected.id)}><Trash2 size={14} /></button>
                </>
              )}
            </div>
          )}
        </>
      )}

      {line && <div data-testid="drop-line" style={{ position: 'fixed', background: OUTLINE, borderRadius: 2, ...line }} />}
      {dropTarget?.mode === 'inside' && <div data-testid="drop-inside" style={{ position: 'fixed', ...dropTarget.box, background: 'rgba(99,102,241,.14)', outline: `2px dashed ${OUTLINE}`, outlineOffset: -2 }} />}

      {editing && selectedBox && (
        <textarea
          aria-label="Edit text"
          autoFocus
          value={editing.value}
          onChange={(event) => setEditing({ ...editing, value: event.target.value })}
          onBlur={commitEdit}
          onKeyDown={(event) => {
            event.stopPropagation();
            if (event.key === 'Escape') setEditing(null);
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              commitEdit();
            }
          }}
          style={{
            position: 'fixed', top: selectedBox.top, left: selectedBox.left, width: Math.max(selectedBox.width, 220), height: Math.max(selectedBox.height, 44),
            pointerEvents: 'auto', font: 'inherit', fontSize: 14, padding: 6, border: `2px solid ${OUTLINE}`, borderRadius: 4, background: '#fff', color: '#0f172a',
          }}
        />
      )}
    </div>
  );
};

/** Page > Section > Heading: the quickest way to reach a parent block. */
const Breadcrumbs: React.FC = () => {
  const selectedId = useStudio((s) => s.selectedId);
  useStudio((s) => s.documents);
  const { documentOfNode, select } = useStudio.getState();
  const owner = selectedId ? documentOfNode(selectedId) : null;
  if (!owner || !selectedId || !owner.content.nodes[selectedId]) {
    return <p className="text-[13px] text-slate-500 dark:text-slate-400">Click a block to edit it. Double-click text to type.</p>;
  }
  const path = [...getAncestors(owner.content, selectedId), selectedId];
  return (
    <nav aria-label="Selected block path" className="flex items-center min-w-0 overflow-hidden">
      {path.map((id, index) => {
        const node = owner.content.nodes[id];
        const isLast = index === path.length - 1;
        return (
          <React.Fragment key={id}>
            {index > 0 && <ChevronRight className="w-3 h-3 shrink-0 text-slate-400" aria-hidden="true" />}
            <button
              type="button"
              aria-current={isLast || undefined}
              onClick={() => {
                select(id);
                useStudio.getState().setTool('edit');
              }}
              className={`shrink-0 px-1.5 py-0.5 rounded text-[13px] ${isLast ? 'font-semibold text-indigo-700 dark:text-indigo-300' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            >
              {node.name ?? BLOCK_META[node.type]?.label ?? node.type}
            </button>
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export const Canvas: React.FC = () => {
  const draft = useStudio((s) => s.draft);
  const documents = useStudio((s) => s.documents);
  const activeDocumentId = useStudio((s) => s.activeDocumentId);
  const device = useStudio((s) => s.device);
  const zoom = useStudio((s) => s.zoom);
  const selectedId = useStudio((s) => s.selectedId);
  const activeStepKey = useStudio((s) => s.activeStepKey);
  const [doc, setDoc] = useState<Document | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [stage, setStage] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const element = stageRef.current;
    if (!element) return undefined;
    const update = () => setStage({ width: element.clientWidth, height: element.clientHeight });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const visible = useMemo(() => useStudio.getState().visibleDocuments(), [documents, activeDocumentId]); // eslint-disable-line react-hooks/exhaustive-deps
  const contents = useMemo(() => visible.map((d) => d.content), [visible]);
  const active = documents.find((d) => d.id === activeDocumentId);
  const variables = draft?.variables;
  const stepSet = useMemo(() => (active && variables ? findSteps(active.content, variables) : null), [active, variables]);
  const activeStep = stepSet ? (stepSet.steps.find((step) => step.key === activeStepKey) ?? stepSet.steps[0] ?? null) : null;
  const visibleStepKey = activeStep?.key;
  const tourSettings = draft?.settings.tour;
  const tourLabel = [
    tourSettings?.showProgress && stepSet && activeStep ? `Step ${stepSet.steps.indexOf(activeStep) + 1} of ${stepSet.steps.length}` : '',
    tourSettings?.estimatedTime?.trim() ?? '',
  ].filter(Boolean).join('  ·  ') || undefined;
  const renderEmbed = useEmbedRenderer('edit');
  const ctx = useMemo<RenderContext>(
    () => ({
      mode: 'edit',
      renderEmbed,
      navLinks: buildNavLinks(documents, active?.slug ?? ''),
      visibleStep: stepSet && visibleStepKey ? { parentKey: stepSet.parentKey, stepType: stepSet.stepType, key: visibleStepKey } : undefined,
      tourChrome: tourLabel || tourSettings?.showClose ? { label: tourLabel, canClose: tourSettings?.showClose } : undefined,
    }),
    [documents, active?.slug, stepSet, visibleStepKey, tourLabel, tourSettings?.showClose, renderEmbed],
  );

  // A slide can be far down a long page, so choosing one brings it into view.
  useEffect(() => {
    if (activeStepKey) doc?.querySelector(`[data-fp-key="${CSS.escape(activeStepKey)}"]`)?.scrollIntoView({ block: 'center' });
  }, [activeStepKey, doc]);

  // Choosing a block in another step, from Layers for example, shows that step.
  useEffect(() => {
    if (!selectedId || !stepSet || !active || !active.content.nodes[selectedId]) return;
    const owner = stepOfNode(active.content, stepSet, selectedId);
    // Repeated steps share one stored block, so the one on screen already counts.
    if (owner && owner.sourceId !== activeStep?.sourceId) useStudio.getState().setActiveStep(owner.key);
  }, [selectedId, stepSet, active, activeStep?.sourceId]);

  if (!draft) return null;

  // The frame is sized to fit the stage at every zoom level, so the page only ever
  // scrolls inside the frame and the stage itself never shows scrollbars.
  const availableWidth = Math.max(stage.width - STAGE_PADDING * 2, 0);
  const availableHeight = Math.max(stage.height - STAGE_PADDING * 2, 0);
  const logicalDeviceWidth = device === 'desktop' ? null : DEVICE_LOGICAL_WIDTH[device];
  // 100% means fit to the available space.
  const scale = logicalDeviceWidth
    ? Math.min(zoom / 100, availableWidth / logicalDeviceWidth || 1)
    : Math.min(Math.min(1, availableWidth / DESKTOP_FIT_WIDTH || 1) * (zoom / 100), availableWidth / DESKTOP_MIN_WIDTH || 1);
  const frameWidth = logicalDeviceWidth ?? availableWidth / scale;
  const frameHeight = availableHeight / scale;

  return (
    <div className="flex-1 min-w-0 flex flex-col">
      <StepBar set={stepSet} active={activeStep} />
      <div
        ref={stageRef}
        data-testid="canvas-stage"
        data-tour="canvas"
        className="flex-1 min-h-0 overflow-hidden relative bg-slate-100 dark:bg-slate-950 [background-image:radial-gradient(rgb(148_163_184_/_.35)_1px,transparent_1px)] [background-size:18px_18px]"
        onClick={(event) => {
          if (event.target === event.currentTarget) useStudio.getState().select(null);
        }}
      >
        {stage.width > 0 && (
          <div
            style={{
              position: 'absolute',
              top: STAGE_PADDING,
              left: (stage.width - frameWidth * scale) / 2,
              width: frameWidth * scale,
              height: availableHeight,
            }}
          >
            <div style={{ width: frameWidth, height: frameHeight, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
              <Frame title="Design canvas" theme={draft.theme} onDocument={setDoc} style={{ display: 'block', width: '100%', height: '100%', background: '#fff', borderRadius: 8, boxShadow: '0 1px 3px rgba(15,23,42,.1), 0 12px 32px -12px rgba(15,23,42,.25)' }}>
                <style dangerouslySetInnerHTML={{ __html: CANVAS_CSS }} />
                <ExperienceView documents={contents} theme={draft.theme} variables={draft.variables} ctx={ctx} />
                {doc && <Overlay doc={doc} />}
              </Frame>
            </div>
          </div>
        )}
      </div>
      <div className="h-9 shrink-0 flex items-center justify-between gap-3 px-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        <Breadcrumbs />
        {logicalDeviceWidth && <p className="shrink-0 text-[13px] font-medium text-indigo-700 dark:text-indigo-300">{device === 'mobile' ? 'Mobile' : 'Tablet'}: {logicalDeviceWidth} px wide</p>}
      </div>
    </div>
  );
};
