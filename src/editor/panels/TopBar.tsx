import React, { useState } from 'react';
import { useEditorStore } from '../store/useEditorStore';
import { useTheme } from '../../services/themeContext';
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
  Code,
  Sun,
  Moon
} from 'lucide-react';

export const TopBar: React.FC = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
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
    <header className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 flex items-center justify-between font-sans select-none z-30 transition-colors">
      {/* Left: Back & Title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/projects')}
          className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1 text-xs font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Projects</span>
        </button>

        <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />

        {/* Editable Title */}
        {isTitleEditing ? (
          <input
            type="text"
            autoFocus
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={handleTitleSubmit}
            onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
            className="text-sm font-bold text-slate-800 dark:text-slate-100 px-2 py-0.5 border border-indigo-400 rounded focus:outline-none bg-white dark:bg-slate-800"
          />
        ) : (
          <div
            onClick={() => {
              setTitleDraft(document?.title || '');
              setIsTitleEditing(true);
            }}
            className="text-sm font-bold text-slate-800 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer flex items-center gap-1.5 px-2 py-0.5 rounded hover:bg-slate-50 dark:hover:bg-slate-800"
            title="Click to rename experience"
          >
            <span>{document?.title || 'Untitled Experience'}</span>
            <span className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 px-1.5 py-0.5 rounded">
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
              className="text-amber-600 dark:text-amber-400 cursor-pointer hover:underline flex items-center gap-1 font-semibold"
              title="Click to save immediately"
            >
              ● Unsaved changes
            </span>
          ) : (
            <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <Check className="w-3 h-3" /> Saved
            </span>
          )}
        </div>
      </div>

      {/* Center: Undo/Redo & Responsive Switchers & Zoom */}
      <div className="flex items-center gap-2">
        {/* Undo / Redo */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            disabled={!canUndo}
            onClick={undo}
            title="Undo (Ctrl+Z)"
            className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 rounded hover:bg-white dark:hover:bg-slate-700 transition-all"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            disabled={!canRedo}
            onClick={redo}
            title="Redo (Ctrl+Shift+Z)"
            className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 rounded hover:bg-white dark:hover:bg-slate-700 transition-all"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Device Switcher */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setDeviceMode('desktop')}
            title="Desktop view"
            className={`p-1.5 rounded transition-all ${
              deviceMode === 'desktop' 
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setDeviceMode('tablet')}
            title="Tablet view (768px)"
            className={`p-1.5 rounded transition-all ${
              deviceMode === 'tablet' 
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Tablet className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setDeviceMode('mobile')}
            title="Mobile view (375px)"
            className={`p-1.5 rounded transition-all ${
              deviceMode === 'mobile' 
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="hidden md:flex items-center bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-600 dark:text-slate-300 gap-1.5">
          <button 
            type="button" 
            onClick={() => setZoom(zoom - 10)} 
            className="hover:text-indigo-600 dark:hover:text-indigo-400"
            title="Zoom out"
          >
            <ZoomOut className="w-3 h-3" />
          </button>
          <span>{zoom}%</span>
          <button 
            type="button" 
            onClick={() => setZoom(zoom + 10)} 
            className="hover:text-indigo-600 dark:hover:text-indigo-400"
            title="Zoom in"
          >
            <ZoomIn className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Right: Theme Toggle, Preview, AI, and Publish */}
      <div className="flex items-center gap-2">
        {/* Editor Theme Switcher */}
        <button
          type="button"
          onClick={toggleTheme}
          className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? (
            <Sun className="w-3.5 h-3.5 text-amber-400" />
          ) : (
            <Moon className="w-3.5 h-3.5 text-indigo-600" />
          )}
        </button>

        {/* Preview Button */}
        <button
          type="button"
          onClick={() => setIsPreviewMode(!isPreviewMode)}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
            isPreviewMode
              ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
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
              : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/60'
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
