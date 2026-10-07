import React, { useState } from 'react';
import { ComponentNode, StyleProperties } from '../../types/document';
import { COMPONENT_REGISTRY } from '../registry/componentRegistry';
import { useEditorStore } from '../store/useEditorStore';
import { InlineFloatingToolbar } from './InlineFloatingToolbar';

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
    isPreviewMode,
    deviceMode,
    isTargetPicking,
    updateNodeTarget,
    setIsTargetPicking,
  } = useEditorStore();

  const [isInlineEditing, setIsInlineEditing] = useState(false);

  const isSelected = selectedNodeId === node.id && !isPreviewMode;
  const isHovered = hoveredNodeId === node.id && !isSelected && !isPreviewMode;

  const definition = COMPONENT_REGISTRY[node.type];

  // Merge base styles with active responsive overrides
  const responsiveStyles = node.responsive?.[deviceMode] || {};
  const mergedStyles: React.CSSProperties = {
    ...node.styles,
    ...responsiveStyles,
  } as React.CSSProperties;

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
    if (!isPreviewMode) {
      const hasTextProp = 'text' in node.props || 'title' in node.props || 'content' in node.props;
      if (hasTextProp) {
        setIsInlineEditing(true);
      }
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
      style={mergedStyles}
      className={`relative transition-all duration-150 ${
        isSelected
          ? 'ring-2 ring-indigo-600 ring-offset-2 z-20'
          : isHovered
          ? 'ring-1 ring-indigo-400 ring-dashed z-10'
          : ''
      } ${node.hidden ? 'opacity-40' : ''}`}
    >
      {/* Floating Toolbar with Inline Color Picker, Typography & Text Controls */}
      {isSelected && (
        <InlineFloatingToolbar
          node={node}
          definition={definition}
          onUpdateStyles={(styles) => updateNodeStyles(node.id, styles)}
          onUpdateProps={(props) => updateNodeProps(node.id, props)}
          onDuplicate={() => duplicateNode(node.id)}
          onDelete={() => deleteNode(node.id)}
        />
      )}

      {/* Inline Direct Content Editable Input Overlay on Double Click */}
      {isInlineEditing && !isPreviewMode ? (
        <div 
          onClick={(e) => e.stopPropagation()} 
          className="p-1 border-2 border-indigo-500 rounded bg-indigo-50/50"
        >
          <input
            type="text"
            autoFocus
            defaultValue={node.props.text || node.props.title || node.props.content || ''}
            onBlur={(e) => {
              const val = e.target.value;
              if ('text' in node.props) updateNodeProps(node.id, { text: val });
              else if ('title' in node.props) updateNodeProps(node.id, { title: val });
              else if ('content' in node.props) updateNodeProps(node.id, { content: val });
              setIsInlineEditing(false);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const val = (e.target as HTMLInputElement).value;
                if ('text' in node.props) updateNodeProps(node.id, { text: val });
                else if ('title' in node.props) updateNodeProps(node.id, { title: val });
                else if ('content' in node.props) updateNodeProps(node.id, { content: val });
                setIsInlineEditing(false);
              }
              if (e.key === 'Escape') setIsInlineEditing(false);
            }}
            className="w-full bg-white dark:bg-slate-900 px-2 py-1 text-sm font-semibold text-slate-900 dark:text-white rounded border border-indigo-400 focus:outline-none"
          />
          <div className="text-[10px] text-indigo-700 dark:text-indigo-300 mt-0.5">Press Enter to save, Esc to cancel</div>
        </div>
      ) : (
        /* Render Component Content */
        <ComponentRender node={node}>
          {/* If Container, render child nodes recursively */}
          {definition.isContainer && (
            <div className="w-full flex flex-col gap-2">
              {node.children.length === 0 && !isPreviewMode ? (
                <div className="p-4 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg text-center text-xs text-slate-400 font-medium">
                  Empty container. Drop or add components here.
                </div>
              ) : (
                node.children.map((child, idx) => (
                  <CanvasNodeRenderer
                    key={child.id}
                    node={child}
                    parentId={node.id}
                    index={idx}
                  />
                ))
              )}
            </div>
          )}
        </ComponentRender>
      )}
    </div>
  );
};
