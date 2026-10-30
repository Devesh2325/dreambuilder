import React, { useState } from 'react';
import { ComponentNode, StyleProperties } from '../../types/document';
import { COMPONENT_REGISTRY } from '../registry/componentRegistry';
import { useEditorStore } from '../store/useEditorStore';
import { InlineFloatingToolbar } from './InlineFloatingToolbar';
import { QuickInsertPopover } from './QuickInsertPopover';
import { DND_TYPES, createNodeFromType, createMultiColumnNode } from '../utils/dragDropUtils';
import { Target, Crosshair } from 'lucide-react';

interface Props {
  node: ComponentNode;
  parentId?: string;
  index?: number;
}

export const CanvasNodeRenderer: React.FC<Props> = ({ node, parentId, index }) => {
  const {
    selectedNodeId,
    hoveredNodeId,
    selectNode,
    hoverNode,
    deleteNode,
    duplicateNode,
    updateNodeStyles,
    updateNodeProps,
    insertNode,
    moveNode,
    isPreviewMode,
    deviceMode,
    isTargetPicking,
    updateNodeTarget,
    setIsTargetPicking,
  } = useEditorStore();

  const [isInlineEditing, setIsInlineEditing] = useState(false);
  const [dropPosition, setDropPosition] = useState<'before' | 'after' | 'inside' | null>(null);

  const isSelected = selectedNodeId === node.id && !isPreviewMode;
  const isHovered = hoveredNodeId === node.id && !isSelected && !isPreviewMode;

  const definition = COMPONENT_REGISTRY[node.type];

  // Merge base styles with active responsive overrides
  const responsiveStyles = node.responsive?.[deviceMode] || {};
  const mergedStyles: React.CSSProperties = {
    ...node.styles,
    ...responsiveStyles,
  } as React.CSSProperties;

  const findEditablePropKey = (props: Record<string, any>): string | null => {
    const candidates = ['text', 'title', 'content', 'label', 'description', 'subtitle', 'buttonText', 'quote', 'message', 'question', 'badgeText'];
    for (const key of candidates) {
      if (key in props && typeof props[key] === 'string') return key;
    }
    return null;
  };

  const editableKey = findEditablePropKey(node.props);
  const isMultiline = editableKey === 'description' || editableKey === 'content' || editableKey === 'quote';

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    // If target-picking mode is active (e.g. for Tour or Tooltip target setup)
    if (isTargetPicking && selectedNodeId) {
      const generatedSelector = `#${node.id}`;
      updateNodeTarget(selectedNodeId, { selector: generatedSelector });
      setIsTargetPicking(false);
      return;
    }

    if (!isPreviewMode) {
      selectNode(node.id);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isPreviewMode && editableKey) {
      setIsInlineEditing(true);
    }
  };

  const handleMouseEnter = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isPreviewMode) hoverNode(node.id);
  };

  const handleMouseLeave = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isPreviewMode && hoveredNodeId === node.id) hoverNode(null);
  };

  // Drag and drop event handlers
  const handleDragOver = (e: React.DragEvent) => {
    if (isPreviewMode) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';

    const rect = e.currentTarget.getBoundingClientRect();
    const relY = e.clientY - rect.top;

    // Containers can accept drops inside their padding zone
    if (definition?.isContainer && rect.height > 80 && relY > 24 && relY < rect.height - 24) {
      setDropPosition('inside');
    } else if (relY < rect.height / 2) {
      setDropPosition('before');
    } else {
      setDropPosition('after');
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (isPreviewMode) return;
    e.stopPropagation();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDropPosition(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    if (isPreviewMode) return;
    e.preventDefault();
    e.stopPropagation();
    const pos = dropPosition;
    setDropPosition(null);

    const blockType = e.dataTransfer.getData(DND_TYPES.BLOCK_TYPE);
    const presetData = e.dataTransfer.getData(DND_TYPES.PRESET);
    const draggedNodeId = e.dataTransfer.getData(DND_TYPES.NODE_ID);

    // Case 1: Dragged block type from left palette
    if (blockType) {
      const newNode = createNodeFromType(blockType);
      if (!newNode) return;

      if (pos === 'inside') {
        insertNode(node.id, newNode);
      } else if (parentId) {
        const targetIdx = pos === 'before' ? (index ?? 0) : ((index ?? 0) + 1);
        insertNode(parentId, newNode, targetIdx);
      } else {
        insertNode(node.id, newNode);
      }
      return;
    }

    // Case 2: Multi-column preset from left palette
    if (presetData) {
      try {
        const parsed = JSON.parse(presetData);
        if (parsed.preset === 'columns' && parsed.count) {
          const flexNode = createMultiColumnNode(parsed.count);
          if (pos === 'inside') {
            insertNode(node.id, flexNode);
          } else if (parentId) {
            const targetIdx = pos === 'before' ? (index ?? 0) : ((index ?? 0) + 1);
            insertNode(parentId, flexNode, targetIdx);
          } else {
            insertNode(node.id, flexNode);
          }
        }
      } catch (err) {
        console.error('Failed to parse dropped column preset', err);
      }
      return;
    }

    // Case 3: Reordering existing canvas node
    if (draggedNodeId && draggedNodeId !== node.id) {
      if (pos === 'inside') {
        moveNode(draggedNodeId, node.id, node.children.length);
      } else if (parentId) {
        const targetIdx = pos === 'before' ? (index ?? 0) : ((index ?? 0) + 1);
        moveNode(draggedNodeId, parentId, targetIdx);
      }
    }
  };

  if (!definition) {
    // Graceful fallback for unknown component types
    return (
      <div className="p-3 border-2 border-dashed border-amber-400 bg-amber-50 text-amber-800 text-xs rounded">
        <strong>Unsupported Element:</strong> {node.type} ({node.name})
      </div>
    );
  }

  const ComponentRender = definition.render;

  return (
    <div
      id={node.id}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={mergedStyles}
      className={`relative transition-all duration-150 ${
        isSelected
          ? !parentId
            ? 'ring-2 ring-indigo-500/80 ring-inset z-10 rounded-xl'
            : 'ring-2 ring-indigo-600 ring-offset-2 z-20'
          : isHovered
          ? !parentId
            ? 'ring-1 ring-indigo-400/50 ring-inset z-10 rounded-xl'
            : 'ring-1 ring-indigo-400 ring-dashed z-10'
          : ''
      } ${node.hidden ? 'opacity-40' : ''}`}
    >
      {/* Visual Drop Indicators (Competitor UX: Framer & Webflow) */}
      {dropPosition === 'before' && (
        <div className="absolute -top-1 left-0 right-0 h-1 bg-indigo-500 rounded-full shadow-lg shadow-indigo-500/50 z-40 pointer-events-none flex items-center justify-center animate-in fade-in duration-100">
          <div className="bg-indigo-600 text-white text-[9px] font-extrabold px-2.5 py-0.5 rounded-full shadow-md flex items-center gap-1 -translate-y-1/2">
            <span>+ Insert Above</span>
          </div>
        </div>
      )}

      {dropPosition === 'after' && (
        <div className="absolute -bottom-1 left-0 right-0 h-1 bg-indigo-500 rounded-full shadow-lg shadow-indigo-500/50 z-40 pointer-events-none flex items-center justify-center animate-in fade-in duration-100">
          <div className="bg-indigo-600 text-white text-[9px] font-extrabold px-2.5 py-0.5 rounded-full shadow-md flex items-center gap-1 translate-y-1/2">
            <span>+ Insert Below</span>
          </div>
        </div>
      )}

      {dropPosition === 'inside' && (
        <div className="absolute inset-0 border-2 border-dashed border-indigo-500 bg-indigo-500/10 rounded-xl pointer-events-none z-30 flex items-center justify-center animate-in fade-in duration-100">
          <span className="bg-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-md">
            + Drop Inside {definition.displayName}
          </span>
        </div>
      )}

      {/* Visual Target Anchor Badge (Userpilot / Appcues Anchor Pointer) */}
      {isSelected && node.target?.selector && (
        <div 
          onClick={(e) => e.stopPropagation()}
          className="absolute -top-7 right-0 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-[10px] font-mono font-bold shadow-lg z-40 animate-in fade-in select-none"
        >
          <Target className="w-3.5 h-3.5 text-indigo-200" />
          <span>Anchored to: <strong className="text-white underline">{node.target.selector}</strong></span>
          <span className="text-indigo-200">({node.target.placement || 'bottom'})</span>
          <button
            type="button"
            onClick={() => setIsTargetPicking(true)}
            className="ml-1 px-1.5 py-0.5 bg-indigo-700 hover:bg-indigo-800 rounded text-[9px] uppercase font-sans tracking-wide transition-colors"
          >
            Repick
          </button>
        </div>
      )}

      {/* Floating Toolbar with Inline Color Picker, Typography & Text Controls */}
      {isSelected && (
        <InlineFloatingToolbar
          node={node}
          definition={definition}
          parentId={parentId}
          index={index}
          onUpdateStyles={(styles) => updateNodeStyles(node.id, styles)}
          onUpdateProps={(props) => updateNodeProps(node.id, props)}
          onDuplicate={() => duplicateNode(node.id)}
          onDelete={() => deleteNode(node.id)}
        />
      )}

      {/* Inline Direct Content Editable Input Overlay on Double Click */}
      {isInlineEditing && !isPreviewMode && editableKey ? (
        <div 
          onClick={(e) => e.stopPropagation()} 
          className="p-1.5 border-2 border-indigo-500 rounded-lg bg-indigo-50/70 dark:bg-slate-900 shadow-lg z-30 relative"
        >
          {isMultiline ? (
            <textarea
              autoFocus
              rows={3}
              defaultValue={node.props[editableKey] || ''}
              onBlur={(e) => {
                updateNodeProps(node.id, { [editableKey]: e.target.value });
                setIsInlineEditing(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  updateNodeProps(node.id, { [editableKey]: (e.target as HTMLTextAreaElement).value });
                  setIsInlineEditing(false);
                }
                if (e.key === 'Escape') setIsInlineEditing(false);
              }}
              className="w-full bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-900 dark:text-white rounded-md border border-indigo-400 focus:outline-none resize-y"
            />
          ) : (
            <input
              type="text"
              autoFocus
              defaultValue={node.props[editableKey] || ''}
              onBlur={(e) => {
                updateNodeProps(node.id, { [editableKey]: e.target.value });
                setIsInlineEditing(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  updateNodeProps(node.id, { [editableKey]: (e.target as HTMLInputElement).value });
                  setIsInlineEditing(false);
                }
                if (e.key === 'Escape') setIsInlineEditing(false);
              }}
              className="w-full bg-white dark:bg-slate-800 px-2.5 py-1.5 text-sm font-semibold text-slate-900 dark:text-white rounded-md border border-indigo-400 focus:outline-none"
            />
          )}
          <div className="flex items-center justify-between text-[10px] text-indigo-700 dark:text-indigo-300 mt-1 px-0.5">
            <span>Editing <strong>{editableKey}</strong></span>
            <span>Enter to save · {isMultiline ? 'Shift+Enter newline · ' : ''}Esc to cancel</span>
          </div>
        </div>
      ) : (
        /* Render Component Content */
        <ComponentRender node={node}>
          {/* If Container or has children, render child nodes recursively */}
          {(definition.isContainer || (node.children && node.children.length > 0)) && (
            <div className="w-full flex flex-col gap-2">
              {node.children.length === 0 && !isPreviewMode ? (
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    selectNode(node.id);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDropPosition('inside');
                  }}
                  onDragLeave={(e) => {
                    e.stopPropagation();
                    setDropPosition(null);
                  }}
                  onDrop={handleDrop}
                  className="p-5 border-2 border-dashed border-indigo-300 dark:border-indigo-800/80 bg-indigo-50/25 dark:bg-indigo-950/20 hover:bg-indigo-50/50 rounded-xl text-center text-xs text-indigo-600 dark:text-indigo-400 font-semibold transition-colors cursor-pointer flex flex-col items-center justify-center gap-1"
                >
                  <span>+ Drag & Drop Blocks Here or Click to Select</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    Drag elements from the left panel or click to insert components
                  </span>
                </div>
              ) : (
                <>
                  {node.children.map((child, idx) => (
                    <React.Fragment key={child.id}>
                      {idx > 0 && <QuickInsertPopover parentId={node.id} targetIndex={idx} />}
                      <CanvasNodeRenderer
                        node={child}
                        parentId={node.id}
                        index={idx}
                      />
                    </React.Fragment>
                  ))}
                  {node.children.length > 0 && (
                    <QuickInsertPopover parentId={node.id} targetIndex={node.children.length} />
                  )}
                </>
              )}
            </div>
          )}
        </ComponentRender>
      )}
    </div>
  );
};
