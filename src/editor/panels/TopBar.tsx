import React, { useState } from 'react';
import { useEditorStore } from '../store/useEditorStore';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Undo2, 
  Redo2, 
  Monitor, 
  Tablet, 
  Smartphone, 
  ZoomIn, 
  ZoomOut, 
  Eye, 
  EyeOff, 
  Sparkles, 
  Share2, 
  Check, 
  Save, 
  UploadCloud,
  Code
} from 'lucide-react';

export const TopBar: React.FC = () => {
  const navigate = useNavigate();
  const {
    document,
    updateDocumentTitle,
    undo,
    redo,
    historyIndex,
    history,
    deviceMode,
    setDeviceMode,
    zoom,
    setZoom,
    isPreviewMode,
    setIsPreviewMode,
    isAiOpen,
    setIsAiOpen,
    setIsPublishModalOpen,
    isDirty,
    isSaving,
    save,
  } = useEditorStore();

  const [isTitleEditing, setIsTitleEditing] = useState(false);
  const [titleDraft, setTitleDraft] = useState(document?.title || '');

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const handleTitleSubmit = () => {
    if (titleDraft.trim()) {
      updateDocumentTitle(titleDraft.trim());
    }
    setIsTitleEditing(false);
  };

  return (
    <header className="h-14 bg-white border-b border-slate-200 px-4 flex items-center justify-between font-sans select-none z-30">
      {/* Left: Back & Title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/projects')}
          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1 text-xs font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Projects</span>
        </button>

        <div className="h-4 w-px bg-slate-200" />

        {/* Editable Title */}
        {isTitleEditing ? (
          <input
            type="text"
            autoFocus
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={handleTitleSubmit}
            onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
            className="text-sm font-bold text-slate-800 px-2 py-0.5 border border-indigo-400 rounded focus:outline-none"
          />
        ) : (
          <div
            onClick={() => {
              setTitleDraft(document?.title || '');
              setIsTitleEditing(true);
            }}
            className="text-sm font-bold text-slate-800 hover:text-indigo-600 cursor-pointer flex items-center gap-1.5 px-2 py-0.5 rounded hover:bg-slate-50"
            title="Click to rename experience"
          >
            <span>{document?.title || 'Untitled Experience'}</span>
            <span className="text-[10px] uppercase font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
              {document?.documentType}
            </span>
          </div>
        )}

        {/* Save Status Indicator */}
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 ml-2">
          {isSaving ? (
            <span className="text-amber-500 animate-pulse flex items-center gap-1">
              Saving...
            </span>
          ) : isDirty ? (
            <span 
              onClick={save}
              className="text-amber-600 cursor-pointer hover:underline flex items-center gap-1"
              title="Click to save immediately"
            >
              ● Unsaved changes
            </span>
          ) : (
            <span className="text-emerald-600 flex items-center gap-1">
              <Check className="w-3 h-3" /> Saved
            </span>
          )}
        </div>
      </div>

      {/* Center: Undo/Redo & Responsive Switchers & Zoom */}
      <div className="flex items-center gap-2">
        {/* Undo / Redo */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
          <button
            type="button"
            disabled={!canUndo}
            onClick={undo}
            title="Undo (Ctrl+Z)"
            className="p-1.5 text-slate-600 hover:text-slate-900 disabled:opacity-30 rounded hover:bg-white transition-all"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            disabled={!canRedo}
            onClick={redo}
            title="Redo (Ctrl+Shift+Z)"
            className="p-1.5 text-slate-600 hover:text-slate-900 disabled:opacity-30 rounded hover:bg-white transition-all"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Device Switcher */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
          <button
            type="button"
            onClick={() => setDeviceMode('desktop')}
            title="Desktop view"
            className={`p-1.5 rounded transition-all ${
              deviceMode === 'desktop' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setDeviceMode('tablet')}
            title="Tablet view (768px)"
            className={`p-1.5 rounded transition-all ${
              deviceMode === 'tablet' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Tablet className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setDeviceMode('mobile')}
            title="Mobile view (375px)"
            className={`p-1.5 rounded transition-all ${
              deviceMode === 'mobile' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="hidden md:flex items-center bg-slate-100 px-2 py-1 rounded-lg border border-slate-200 text-xs font-mono text-slate-600 gap-1.5">
          <button 
            type="button" 
            onClick={() => setZoom(zoom - 10)} 
            className="hover:text-indigo-600"
            title="Zoom out"
          >
            <ZoomOut className="w-3 h-3" />
          </button>
          <span>{zoom}%</span>
          <button 
            type="button" 
            onClick={() => setZoom(zoom + 10)} 
            className="hover:text-indigo-600"
            title="Zoom in"
          >
            <ZoomIn className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Right: Preview, AI, and Publish */}
      <div className="flex items-center gap-2">
        {/* Preview Button */}
        <button
          type="button"
          onClick={() => setIsPreviewMode(!isPreviewMode)}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
            isPreviewMode
              ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          {isPreviewMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          <span>{isPreviewMode ? 'Exit Preview' : 'Live Preview'}</span>
        </button>

        {/* AI Assistant Toggle Button */}
        <button
          type="button"
          onClick={() => setIsAiOpen(!isAiOpen)}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
            isAiOpen
              ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm'
              : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI Assistant</span>
        </button>

        {/* Publish Button */}
        <button
          type="button"
          onClick={() => setIsPublishModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-all"
        >
          <UploadCloud className="w-3.5 h-3.5" />
          <span>Publish</span>
        </button>
      </div>
    </header>
  );
};
