import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Copy, GripVertical, Trash2 } from 'lucide-react';
import { findParentId } from '../core/tree';
import { DEVICE_WIDTHS } from '../experience/ProjectPreview';
import { buildNavLinks } from '../experience/SiteView';
import { BLOCK_META, canContain } from '../renderer/blockMeta';
import { ExperienceView } from '../renderer/ExperienceView';
import { Frame } from '../renderer/Frame';
import { RenderContext } from '../renderer/types';
import { useStudio } from './store';

/** The prop that double-clicking edits. */
const INLINE_PROP: Record<string, string> = {
  Heading: 'text', Text: 'text', Button: 'text', Accordion: 'question', ChecklistItem: 'title', FormField: 'label', Navbar: 'brand',
};

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
  const { duplicateBlock, removeBlock, getNode, updateProps, setDragging, addBlock, moveBlock, documentOfNode } = useStudio.getState();

  const [selectedBox, setSelectedBox] = useState<Box | null>(null);
  const [hoverBox, setHoverBox] = useState<Box | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);
  const [editing, setEditing] = useState<{ id: string; prop: string; value: string } | null>(null);
  const dropRef = useRef<DropTarget | null>(null);

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
      frame = requestAnimationFrame(measure);
    };
    measure();
    return () => cancelAnimationFrame(frame);
  }, [doc, selectedId, hoveredId, documents, device]);

  const computeDrop = useCallback((event: DragEvent): DropTarget | null => {
    const state = useStudio.getState();
    const payload = state.dragging;
    if (!payload) return null;
    const movingType = payload.kind === 'block' ? payload.type : state.getNode(payload.id)?.type;
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
      event.preventDefault();
      const element = closestNode(event.target);
      useStudio.getState().select(element?.getAttribute('data-fp-node') ?? null);
    };
    const onMove = (event: MouseEvent) => {
      useStudio.getState().hover(closestNode(event.target)?.getAttribute('data-fp-node') ?? null);
    };
    const onLeave = () => useStudio.getState().hover(null);
    const onDoubleClick = (event: MouseEvent) => {
      if (useStudio.getState().readOnly) return;
      const id = closestNode(event.target)?.getAttribute('data-fp-node');
      const node = id ? useStudio.getState().getNode(id) : null;
      const prop = node ? INLINE_PROP[node.type] : undefined;
      if (id && node && prop) setEditing({ id, prop, value: String(node.props[prop] ?? '') });
    };
    const onDragOver = (event: DragEvent) => {
      if (!useStudio.getState().dragging) return;
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = useStudio.getState().dragging?.kind === 'block' ? 'copy' : 'move';
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
    doc.addEventListener('mouseleave', onLeave);
    doc.addEventListener('dblclick', onDoubleClick);
    doc.addEventListener('dragover', onDragOver);
    doc.addEventListener('drop', onDrop);
    doc.addEventListener('dragleave', onDragLeave);
    return () => {
      doc.removeEventListener('click', onClick, true);
      doc.removeEventListener('submit', onClick, true);
      doc.removeEventListener('mousemove', onMove);
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
  const isRoot = selectedId ? documentOfNode(selectedId)?.content.rootId === selectedId : false;

  const commitEdit = () => {
    if (editing) updateProps(editing.id, { [editing.prop]: editing.value });
    setEditing(null);
  };

  const line: React.CSSProperties | null = dropTarget && dropTarget.mode !== 'inside'
    ? dropTarget.horizontal
      ? { top: dropTarget.box.top, height: dropTarget.box.height, width: 3, left: dropTarget.mode === 'before' ? dropTarget.box.left - 2 : dropTarget.box.left + dropTarget.box.width - 1 }
      : { left: dropTarget.box.left, width: dropTarget.box.width, height: 3, top: dropTarget.mode === 'before' ? dropTarget.box.top - 2 : dropTarget.box.top + dropTarget.box.height - 1 }
    : null;

  const OUTLINE = '#6366f1';
  const toolbarButton: React.CSSProperties = { background: 'none', border: 0, color: '#fff', padding: 3, cursor: 'pointer', display: 'flex' };

  // Inline styles because the iframe deliberately has none of the app's CSS.
  return (
    <div data-fp-overlay="" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 2147483600, fontFamily: 'system-ui, sans-serif' }}>
      {hoverBox && <div style={{ position: 'fixed', ...hoverBox, outline: `1px dashed ${OUTLINE}`, outlineOffset: -1 }} />}
      {selectedBox && !editing && (
        <>
          <div data-testid="selection" style={{ position: 'fixed', ...selectedBox, outline: `2px solid ${OUTLINE}`, outlineOffset: -1 }} />
          {selected && !readOnly && (
            <div style={{ position: 'fixed', top: Math.max(0, selectedBox.top - 26), left: Math.max(0, selectedBox.left), display: 'flex', alignItems: 'center', gap: 2, background: OUTLINE, color: '#fff', borderRadius: 4, padding: '2px 6px', fontSize: 11, pointerEvents: 'auto' }}>
              {!isRoot && (
                <span
                  draggable
                  title="Drag to move"
                  onDragStart={(event) => {
                    event.dataTransfer.effectAllowed = 'move';
                    event.dataTransfer.setData('text/plain', selected.id);
                    setDragging({ kind: 'node', id: selected.id });
                  }}
                  onDragEnd={() => setDragging(null)}
                  style={{ cursor: 'grab', display: 'flex' }}
                >
                  <GripVertical size={13} />
                </span>
              )}
              <span style={{ fontWeight: 600 }}>{selected.name ?? BLOCK_META[selected.type]?.label ?? selected.type}</span>
              {!isRoot && (
                <>
                  <button type="button" aria-label="Duplicate block" title="Duplicate" style={toolbarButton} onClick={() => duplicateBlock(selected.id)}><Copy size={13} /></button>
                  <button type="button" aria-label="Delete block" title="Delete" style={toolbarButton} onClick={() => removeBlock(selected.id)}><Trash2 size={13} /></button>
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

export const Canvas: React.FC = () => {
  const draft = useStudio((s) => s.draft);
  const documents = useStudio((s) => s.documents);
  const activeDocumentId = useStudio((s) => s.activeDocumentId);
  const device = useStudio((s) => s.device);
  const zoom = useStudio((s) => s.zoom);
  const [doc, setDoc] = useState<Document | null>(null);

  const visible = useMemo(() => useStudio.getState().visibleDocuments(), [documents, activeDocumentId]); // eslint-disable-line react-hooks/exhaustive-deps
  const contents = useMemo(() => visible.map((d) => d.content), [visible]);
  const active = documents.find((d) => d.id === activeDocumentId);
  const ctx = useMemo<RenderContext>(
    () => ({ mode: 'edit', navLinks: buildNavLinks(documents, active?.slug ?? '') }),
    [documents, active?.slug],
  );

  if (!draft) return null;
  const scale = zoom / 100;

  return (
    <div
      className="flex-1 min-w-0 overflow-auto bg-slate-200 dark:bg-slate-800 p-6"
      onClick={(event) => {
        if (event.target === event.currentTarget) useStudio.getState().select(null);
      }}
    >
      <div
        style={{
          width: device === 'desktop' ? `${100 / scale}%` : DEVICE_WIDTHS[device],
          height: `${100 / scale}%`,
          transform: `scale(${scale})`,
          transformOrigin: 'top center',
          margin: device === 'desktop' ? undefined : '0 auto',
          minHeight: 400,
        }}
      >
        <Frame title="Design canvas" theme={draft.theme} onDocument={setDoc} style={{ width: '100%', height: '100%', background: '#fff', boxShadow: '0 10px 30px -10px rgba(15,23,42,.4)' }}>
          <ExperienceView documents={contents} theme={draft.theme} variables={draft.variables} ctx={ctx} includeHidden />
          {doc && <Overlay doc={doc} />}
        </Frame>
      </div>
    </div>
  );
};
