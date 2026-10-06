import React from 'react';
import { ComponentNode, StyleProperties } from '../../types/document';
import { COMPONENT_REGISTRY } from '../registry/componentRegistry';
import { useEditorStore } from '../store/useEditorStore';
import { Copy, Trash2, ArrowUp, ArrowDown, Lock, Unlock, Eye, Sparkles } from 'lucide-react';

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
    isPreviewMode,
    deviceMode,
    isTargetPicking,
    updateNodeTarget,
    setIsTargetPicking,
  } = useEditorStore();

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
      {/* Contextual Action Toolbar when Selected in Editor Mode */}
      {isSelected && (
        <div 
          onClick={(e) => e.stopPropagation()}
          className="absolute -top-8 left-0 flex items-center gap-1 bg-indigo-600 text-white text-xs px-2 py-0.5 rounded shadow-lg z-30 pointer-events-auto select-none font-sans"
        >
          <span className="font-semibold text-[11px] mr-1">{definition.displayName}</span>
          <button
            type="button"
            title="Duplicate Element"
            onClick={() => duplicateNode(node.id)}
            className="p-1 hover:bg-indigo-700 rounded transition-colors"
          >
            <Copy className="w-3 h-3" />
          </button>
          <button
            type="button"
            title="Delete Element"
            onClick={() => deleteNode(node.id)}
            className="p-1 hover:bg-red-600 rounded transition-colors text-red-200 hover:text-white"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Render Component Content */}
      <ComponentRender node={node}>
        {/* If Container, render child nodes recursively */}
        {definition.isContainer && (
          <div className="w-full flex flex-col gap-2">
            {node.children.length === 0 && !isPreviewMode ? (
              <div className="p-4 border border-dashed border-slate-300 rounded-lg text-center text-xs text-slate-400 font-medium">
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
    </div>
  );
};
