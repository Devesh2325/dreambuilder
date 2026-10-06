import React from 'react';
import { useEditorStore } from '../store/useEditorStore';
import { CanvasNodeRenderer } from './CanvasNodeRenderer';
import { Crosshair, Smartphone, Tablet, Monitor } from 'lucide-react';

export const EditorCanvas: React.FC = () => {
  const {
    document,
    selectNode,
    deviceMode,
    zoom,
    isPreviewMode,
    isTargetPicking,
    setIsTargetPicking,
  } = useEditorStore();

  if (!document) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-100 text-slate-400">
        No document loaded
      </div>
    );
  }

  // Device width mapping
  const deviceWidthStyle: Record<string, string> = {
    desktop: 'w-full max-w-6xl',
    tablet: 'w-[768px]',
    mobile: 'w-[375px]',
  };

  return (
    <div 
      className="flex-1 relative overflow-auto bg-slate-100 canvas-grid-dots flex flex-col items-center p-8 select-none"
      onClick={() => selectNode(null)}
    >
      {/* Target Selector Picker Notification */}
      {isTargetPicking && (
        <div className="sticky top-0 z-40 mb-4 bg-indigo-600 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-bounce">
          <Crosshair className="w-4 h-4" />
          <span>Click on any component on the canvas to set it as the tour target selector!</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsTargetPicking(false);
            }}
            className="ml-2 bg-indigo-700 hover:bg-indigo-800 px-2 py-0.5 rounded text-[11px]"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Scaled Canvas Frame */}
      <div
        style={{
          transform: `scale(${zoom / 100})`,
          transformOrigin: 'top center',
          transition: 'transform 0.15s ease-out, width 0.2s ease',
        }}
        className={`transition-all ${deviceWidthStyle[deviceMode]} min-h-[750px] bg-white rounded-xl shadow-card border border-slate-200/80 overflow-hidden relative`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Device frame header for tablet/mobile */}
        {deviceMode !== 'desktop' && !isPreviewMode && (
          <div className="bg-slate-900 text-slate-400 text-[11px] font-mono py-1.5 px-4 flex items-center justify-between border-b border-slate-800">
            <span className="flex items-center gap-1.5 capitalize">
              {deviceMode === 'mobile' ? <Smartphone className="w-3.5 h-3.5" /> : <Tablet className="w-3.5 h-3.5" />}
              {deviceMode} Preview ({deviceMode === 'mobile' ? '375px' : '768px'})
            </span>
            <span className="text-slate-500">100% Responsive</span>
          </div>
        )}

        {/* Root Node Canvas Renderer */}
        <div className="w-full h-full p-4">
          <CanvasNodeRenderer node={document.rootNode} />
        </div>
      </div>
    </div>
  );
};
