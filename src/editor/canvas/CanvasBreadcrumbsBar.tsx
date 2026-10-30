import React from 'react';
import { useEditorStore } from '../store/useEditorStore';
import { ChevronRight, Layers, Box } from 'lucide-react';

export const CanvasBreadcrumbsBar: React.FC = () => {
  const { 
    selectedNodeId, 
    selectNode, 
    hoverNode, 
    getNodeAncestry, 
    isPreviewMode 
  } = useEditorStore();

  if (isPreviewMode || !selectedNodeId) return null;

  const ancestry = getNodeAncestry(selectedNodeId);
  if (!ancestry || ancestry.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-6 z-30 flex items-center gap-1 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-200/90 dark:border-slate-700/80 shadow-xl text-xs text-slate-600 dark:text-slate-300 font-sans select-none animate-in fade-in duration-150 max-w-md overflow-x-auto no-scrollbar">
      <div className="flex items-center gap-1 text-slate-400 dark:text-slate-500 shrink-0 mr-1">
        <Layers className="w-3.5 h-3.5 text-indigo-500" />
      </div>

      {ancestry.map((item, index) => {
        const isLast = index === ancestry.length - 1;
        return (
          <React.Fragment key={item.id}>
            {index > 0 && (
              <ChevronRight className="w-3 h-3 text-slate-300 dark:text-slate-600 shrink-0" />
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                selectNode(item.id);
              }}
              onMouseEnter={() => hoverNode(item.id)}
              onMouseLeave={() => hoverNode(null)}
              className={`px-1.5 py-0.5 rounded-md text-[11px] font-semibold transition-colors truncate max-w-[120px] ${
                isLast
                  ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title={`Select ${item.name}`}
            >
              {item.name}
            </button>
          </React.Fragment>
        );
      })}
    </div>
  );
};
