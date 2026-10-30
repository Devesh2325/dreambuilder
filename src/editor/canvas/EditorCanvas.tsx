import React, { useState } from 'react';
import { useEditorStore } from '../store/useEditorStore';
import { CanvasNodeRenderer } from './CanvasNodeRenderer';
import { TourSimulationOverlay } from './TourSimulationOverlay';
import { ExperienceTimelineBar } from './ExperienceTimelineBar';
import { CanvasBreadcrumbsBar } from './CanvasBreadcrumbsBar';
import { 
  Crosshair, 
  Smartphone, 
  Tablet, 
  Monitor, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  RotateCcw,
  Sparkles,
  Play,
  Globe,
  Lock,
  Grid,
  Ruler,
  RefreshCw,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { DND_TYPES, createNodeFromType, createMultiColumnNode } from '../utils/dragDropUtils';

export const EditorCanvas: React.FC = () => {
  const {
    document,
    selectNode,
    insertNode,
    deviceMode,
    setDeviceMode,
    zoom,
    setZoom,
    fitToScreen,
    resetZoom,
    gridMode,
    toggleGridMode,
    showRulers,
    toggleShowRulers,
    isPreviewMode,
    isTargetPicking,
    setIsTargetPicking,
    startTourPlayback,
    updateTriggerConditions,
  } = useEditorStore();

  const [isEditingUrl, setIsEditingUrl] = useState(false);
  const targetUrl = document?.triggerConditions?.urlRules?.[0]?.value || 'https://app.yourproduct.com/dashboard';
  const [urlDraft, setUrlDraft] = useState(targetUrl);

  if (!document) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-950 text-slate-400 font-sans">
        <Sparkles className="w-8 h-8 text-slate-400 mb-2 animate-pulse" />
        <span className="text-sm font-semibold">No experience document loaded</span>
      </div>
    );
  }

  // Device width mapping
  const deviceWidthMap: Record<string, { className: string; label: string; widthPx: number }> = {
    desktop: { className: 'w-full max-w-6xl', label: 'Desktop', widthPx: 1200 },
    tablet: { className: 'w-[768px]', label: 'Tablet', widthPx: 768 },
    mobile: { className: 'w-[375px]', label: 'Mobile', widthPx: 375 },
  };

  const currentDevice = deviceWidthMap[deviceMode] || deviceWidthMap.desktop;

  const handleCanvasDrop = (e: React.DragEvent) => {
    if (isPreviewMode) return;
    e.preventDefault();
    const blockType = e.dataTransfer.getData(DND_TYPES.BLOCK_TYPE);
    const presetData = e.dataTransfer.getData(DND_TYPES.PRESET);
    if (blockType) {
      const newNode = createNodeFromType(blockType);
      if (newNode) insertNode(document.rootNode.id, newNode);
    } else if (presetData) {
      try {
        const parsed = JSON.parse(presetData);
        if (parsed.preset === 'columns' && parsed.count) {
          insertNode(document.rootNode.id, createMultiColumnNode(parsed.count));
        }
      } catch {}
    }
  };

  const handleSaveUrl = () => {
    if (urlDraft.trim()) {
      updateTriggerConditions({
        urlRules: [{ type: 'contains', value: urlDraft.trim() }],
      });
    }
    setIsEditingUrl(false);
  };

  // Background grid class
  const gridClass = gridMode === 'dots' 
    ? 'canvas-grid-dots' 
    : gridMode === 'lines' 
    ? 'canvas-grid-lines' 
    : 'bg-slate-100/90 dark:bg-slate-950';

  return (
    <div 
      className={`flex-1 relative overflow-auto ${gridClass} flex flex-col items-center p-6 select-none transition-colors`}
      onClick={() => selectNode(null)}
      onDragOver={(e) => {
        if (!isPreviewMode) {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'copy';
        }
      }}
      onDrop={handleCanvasDrop}
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
            className="ml-2 bg-indigo-700 hover:bg-indigo-800 px-2.5 py-0.5 rounded text-[11px]"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Scaled Canvas Frame with Browser Mockup Chrome */}
      <div
        style={{
          transform: `scale(${zoom / 100})`,
          transformOrigin: 'top center',
          transition: 'transform 0.15s ease-out, width 0.2s ease',
        }}
        className={`transition-all ${currentDevice.className} min-h-[800px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden relative flex flex-col mb-24`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Browser Mockup Shell Header (PagePilot & Userpilot Benchmark) */}
        {!isPreviewMode && (
          <div className="bg-slate-900 text-slate-300 text-xs py-2 px-4 flex items-center justify-between border-b border-slate-800 shrink-0 gap-3 relative z-30">
            
            {/* Left: Window Dots & Navigation Controls */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1.5 mr-2">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
              </div>

              {/* Device Mode Switcher */}
              <div className="flex items-center bg-slate-800/80 p-0.5 rounded-lg border border-slate-700">
                <button
                  type="button"
                  onClick={() => setDeviceMode('desktop')}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition-all ${
                    deviceMode === 'desktop' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Desktop 1200px"
                >
                  <Monitor className="w-3 h-3" />
                  <span className="hidden sm:inline">Desktop</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDeviceMode('tablet')}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition-all ${
                    deviceMode === 'tablet' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Tablet 768px"
                >
                  <Tablet className="w-3 h-3" />
                  <span className="hidden sm:inline">Tablet</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDeviceMode('mobile')}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition-all ${
                    deviceMode === 'mobile' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Mobile 375px"
                >
                  <Smartphone className="w-3 h-3" />
                  <span className="hidden sm:inline">Mobile</span>
                </button>
              </div>
            </div>

            {/* Center: Interactive Target Route Address Bar */}
            <div className="flex-1 max-w-md">
              {isEditingUrl ? (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    autoFocus
                    value={urlDraft}
                    onChange={(e) => setUrlDraft(e.target.value)}
                    onBlur={handleSaveUrl}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveUrl();
                      if (e.key === 'Escape') setIsEditingUrl(false);
                    }}
                    className="w-full bg-slate-800 text-white px-2.5 py-1 rounded-md text-[11px] font-mono border border-indigo-500 focus:outline-none"
                    placeholder="https://app.yourproduct.com/route"
                  />
                </div>
              ) : (
                <div
                  onClick={() => {
                    setUrlDraft(targetUrl);
                    setIsEditingUrl(true);
                  }}
                  className="bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 px-2.5 py-1 rounded-lg flex items-center gap-1.5 cursor-pointer text-slate-400 hover:text-slate-200 transition-colors group"
                  title="Click to edit experience target URL trigger"
                >
                  <Lock className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span className="text-[11px] font-mono truncate text-slate-300">
                    {targetUrl}
                  </span>
                  <span className="text-[9px] text-indigo-400 opacity-0 group-hover:opacity-100 ml-auto shrink-0 font-bold">
                    Edit
                  </span>
                </div>
              )}
            </div>

            {/* Right: Quick Tools (Simulation & Grid Toggles) */}
            <div className="flex items-center gap-1 shrink-0">
              {/* Grid Toggle */}
              <button
                type="button"
                onClick={toggleGridMode}
                className={`p-1.5 rounded-lg border text-xs transition-colors ${
                  gridMode !== 'clean'
                    ? 'bg-slate-800 border-slate-700 text-indigo-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
                title={`Grid Mode: ${gridMode}`}
              >
                <Grid className="w-3.5 h-3.5" />
              </button>

              {/* Rulers Toggle */}
              <button
                type="button"
                onClick={toggleShowRulers}
                className={`p-1.5 rounded-lg border text-xs transition-colors ${
                  showRulers
                    ? 'bg-slate-800 border-slate-700 text-indigo-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
                title={`Rulers: ${showRulers ? 'Visible' : 'Hidden'}`}
              >
                <Ruler className="w-3.5 h-3.5" />
              </button>

              {/* Play Flow Simulation */}
              <button
                type="button"
                onClick={startTourPlayback}
                className="flex items-center gap-1 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-bold shadow-xs hover:shadow-indigo-500/20 transition-all ml-1"
                title="Launch full-screen simulation"
              >
                <Play className="w-3 h-3 fill-white" />
                <span className="hidden md:inline">Simulate</span>
              </button>
            </div>

          </div>
        )}

        {/* Visual Top Pixel Ruler */}
        {showRulers && !isPreviewMode && (
          <div className="h-4 bg-slate-100 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex items-center px-4 text-[9px] font-mono text-slate-400 select-none overflow-hidden shrink-0">
            <span className="w-20">0px</span>
            <span className="w-20">200px</span>
            <span className="w-20">400px</span>
            <span className="w-20">600px</span>
            <span className="w-20">800px</span>
            <span className="w-20">1000px</span>
            <span className="w-20">1200px</span>
          </div>
        )}

        {/* Root Node Canvas Renderer */}
        <div 
          className="w-full flex-1 pt-6 pb-16 px-6 overflow-y-auto min-h-[600px] relative z-10"
          onDragOver={(e) => {
            if (!isPreviewMode) {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'copy';
            }
          }}
          onDrop={handleCanvasDrop}
        >
          <CanvasNodeRenderer node={document.rootNode} />
        </div>
      </div>

      {/* Userpilot / Appcues Benchmark: Multi-Step Sequence Flow Timeline Bar */}
      <ExperienceTimelineBar />

      {/* Webflow Benchmark: Floating DOM Hierarchy Breadcrumbs Bar */}
      <CanvasBreadcrumbsBar />

      {/* Floating Bottom Canvas Controls (Zoom, Dimensions, Fit) */}
      {!isPreviewMode && (
        <div className="fixed bottom-4 right-6 z-30 flex items-center gap-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-200/90 dark:border-slate-700/80 shadow-xl text-xs text-slate-600 dark:text-slate-300 font-sans select-none">
          {/* Dimension Tag */}
          <span className="font-mono text-[11px] text-slate-400 dark:text-slate-500 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md">
            {currentDevice.widthPx}px · {currentDevice.label}
          </span>

          <div className="h-3 w-px bg-slate-200 dark:bg-slate-700" />

          {/* Zoom Out */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setZoom(zoom - 10);
            }}
            title="Zoom Out (Ctrl -)"
            className="p-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          {/* Zoom % Indicator */}
          <span className="font-mono text-[11px] w-9 text-center font-semibold">
            {zoom}%
          </span>

          {/* Zoom In */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setZoom(zoom + 10);
            }}
            title="Zoom In (Ctrl +)"
            className="p-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <div className="h-3 w-px bg-slate-200 dark:bg-slate-700" />

          {/* Reset 100% */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              resetZoom();
            }}
            title="Reset Zoom to 100%"
            className="px-2 py-0.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-indigo-600 transition-colors flex items-center gap-1"
          >
            <RotateCcw className="w-2.5 h-2.5" />
            <span>100%</span>
          </button>

          {/* Fit to Screen */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              fitToScreen();
            }}
            title="Fit Canvas to Screen"
            className="px-2 py-0.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-indigo-600 transition-colors flex items-center gap-1"
          >
            <Maximize2 className="w-2.5 h-2.5" />
            <span>Fit</span>
          </button>
        </div>
      )}

      {/* Interactive Tour Simulation Overlay */}
      <TourSimulationOverlay />
    </div>
  );
};
