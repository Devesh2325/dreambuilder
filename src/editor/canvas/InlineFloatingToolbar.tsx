import React, { useState, useRef, useEffect } from 'react';
import { ComponentNode, StyleProperties } from '../../types/document';
import { ComponentDefinition } from '../../types/components';
import { 
  Palette, 
  Type, 
  Bold, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  Copy, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  Maximize2, 
  Sparkles,
  ChevronDown,
  CornerDownRight
} from 'lucide-react';

interface Props {
  node: ComponentNode;
  definition: ComponentDefinition;
  onUpdateStyles: (styles: Partial<StyleProperties>) => void;
  onUpdateProps: (props: Record<string, any>) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

const PRESET_COLORS = [
  '#000000', '#ffffff', '#64748b', '#3b82f6', 
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', 
  '#f59e0b', '#10b981', '#06b6d4', '#1e293b'
];

const FONT_SIZES = [
  { label: '12px', value: '12px' },
  { label: '14px', value: '14px' },
  { label: '16px', value: '16px' },
  { label: '18px', value: '18px' },
  { label: '20px', value: '20px' },
  { label: '24px', value: '24px' },
  { label: '32px', value: '32px' },
  { label: '40px', value: '40px' },
];

const RADIUS_OPTIONS = [
  { label: '0px', value: '0px' },
  { label: '4px', value: '4px' },
  { label: '8px', value: '8px' },
  { label: '12px', value: '12px' },
  { label: 'Full', value: '9999px' },
];

export const InlineFloatingToolbar: React.FC<Props> = ({
  node,
  definition,
  onUpdateStyles,
  onUpdateProps,
  onDuplicate,
  onDelete,
}) => {
  const [activePicker, setActivePicker] = useState<'text-color' | 'bg-color' | 'font-size' | 'radius' | 'text-edit' | null>(null);
  
  // Detect primary text prop for quick inline editing
  const textPropKey = 'text' in node.props 
    ? 'text' 
    : 'title' in node.props 
    ? 'title' 
    : 'content' in node.props 
    ? 'content' 
    : 'label' in node.props
    ? 'label'
    : null;

  const currentText = textPropKey ? node.props[textPropKey] || '' : '';
  const [draftText, setDraftText] = useState(currentText);

  useEffect(() => {
    setDraftText(currentText);
  }, [currentText]);

  const currentColor = node.styles.color || '#1e293b';
  const currentBgColor = node.styles.backgroundColor || 'transparent';
  const currentFontSize = node.styles.fontSize || '16px';
  const isBold = node.styles.fontWeight === 'bold' || node.styles.fontWeight === '700';
  const currentAlign = node.styles.textAlign || 'left';
  const currentRadius = node.styles.borderRadius || '0px';

  const handleTextSave = () => {
    if (textPropKey) {
      onUpdateProps({ [textPropKey]: draftText });
    }
    setActivePicker(null);
  };

  return (
    <div 
      onClick={(e) => e.stopPropagation()}
      className="absolute -top-12 left-0 flex items-center gap-1 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-700/90 text-slate-800 dark:text-slate-100 px-2 py-1.5 rounded-xl shadow-xl z-50 pointer-events-auto select-none font-sans text-xs animate-in fade-in duration-100"
    >
      {/* Component Name Badge */}
      <span className="font-extrabold text-[11px] text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 mr-1 shrink-0">
        {definition.displayName}
      </span>

      <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-0.5 shrink-0" />

      {/* 1. Quick Inline Text Edit Trigger */}
      {textPropKey && (
        <div className="relative">
          <button
            type="button"
            onClick={() => setActivePicker(activePicker === 'text-edit' ? null : 'text-edit')}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-colors text-xs font-semibold ${
              activePicker === 'text-edit'
                ? 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
            }`}
            title="Edit Text Inline"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span className="max-w-[70px] truncate hidden sm:inline">{currentText || 'Text'}</span>
          </button>

          {/* Inline Text Edit Popover */}
          {activePicker === 'text-edit' && (
            <div className="absolute top-10 left-0 w-64 p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl z-50">
              <div className="text-[10px] font-bold text-slate-400 mb-1">Inline Text Editor</div>
              <input
                type="text"
                autoFocus
                value={draftText}
                onChange={(e) => setDraftText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleTextSave();
                  if (e.key === 'Escape') setActivePicker(null);
                }}
                className="w-full px-2.5 py-1.5 border border-indigo-400 dark:border-indigo-600 rounded-lg bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-medium focus:outline-none"
              />
              <div className="flex justify-end gap-1.5 mt-2">
                <button
                  type="button"
                  onClick={() => setActivePicker(null)}
                  className="px-2 py-1 text-[11px] text-slate-500 hover:text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleTextSave}
                  className="px-3 py-1 text-[11px] bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-sm"
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. Text Color Picker */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setActivePicker(activePicker === 'text-color' ? null : 'text-color')}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-colors ${
            activePicker === 'text-color'
              ? 'bg-indigo-100 dark:bg-indigo-900/60'
              : 'hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title="Text Color"
        >
          <Type className="w-3.5 h-3.5" />
          <span 
            className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-slate-600 shadow-sm"
            style={{ backgroundColor: currentColor }} 
          />
        </button>

        {/* Text Color Popover */}
        {activePicker === 'text-color' && (
          <div className="absolute top-10 left-0 w-52 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl z-50">
            <div className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-wider">
              Text Color
            </div>
            
            {/* Color Swatches Grid */}
            <div className="grid grid-cols-6 gap-1.5 mb-3">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => onUpdateStyles({ color: c })}
                  className="w-6 h-6 rounded-md border border-slate-200 dark:border-slate-700 transition-transform hover:scale-110"
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>

            {/* Custom Color Input & Hex */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <input
                type="color"
                value={currentColor.startsWith('#') ? currentColor : '#000000'}
                onChange={(e) => onUpdateStyles({ color: e.target.value })}
                className="w-7 h-7 rounded border-0 cursor-pointer bg-transparent"
              />
              <input
                type="text"
                value={currentColor}
                onChange={(e) => onUpdateStyles({ color: e.target.value })}
                placeholder="#000000"
                className="flex-1 px-2 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded bg-slate-50 dark:bg-slate-800 uppercase font-mono font-semibold"
              />
            </div>
          </div>
        )}
      </div>

      {/* 3. Background Color Picker */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setActivePicker(activePicker === 'bg-color' ? null : 'bg-color')}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-colors ${
            activePicker === 'bg-color'
              ? 'bg-indigo-100 dark:bg-indigo-900/60'
              : 'hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title="Background / Fill Color"
        >
          <Palette className="w-3.5 h-3.5" />
          <span 
            className="w-3.5 h-3.5 rounded border border-slate-300 dark:border-slate-600 shadow-sm"
            style={{ 
              backgroundColor: currentBgColor === 'transparent' ? 'transparent' : currentBgColor,
              backgroundImage: currentBgColor === 'transparent' ? 'repeating-linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc), repeating-linear-gradient(45deg, #ccc 25%, #fff 25%, #fff 75%, #ccc 75%, #ccc)' : 'none',
              backgroundSize: '4px 4px'
            }} 
          />
        </button>

        {/* Background Color Popover */}
        {activePicker === 'bg-color' && (
          <div className="absolute top-10 left-0 w-52 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl z-50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Background Fill
              </span>
              <button
                type="button"
                onClick={() => onUpdateStyles({ backgroundColor: 'transparent' })}
                className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
              >
                Clear
              </button>
            </div>
            
            {/* Swatches */}
            <div className="grid grid-cols-6 gap-1.5 mb-3">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => onUpdateStyles({ backgroundColor: c })}
                  className="w-6 h-6 rounded-md border border-slate-200 dark:border-slate-700 transition-transform hover:scale-110"
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>

            {/* Custom Input */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <input
                type="color"
                value={currentBgColor.startsWith('#') ? currentBgColor : '#ffffff'}
                onChange={(e) => onUpdateStyles({ backgroundColor: e.target.value })}
                className="w-7 h-7 rounded border-0 cursor-pointer bg-transparent"
              />
              <input
                type="text"
                value={currentBgColor}
                onChange={(e) => onUpdateStyles({ backgroundColor: e.target.value })}
                placeholder="#ffffff"
                className="flex-1 px-2 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded bg-slate-50 dark:bg-slate-800 uppercase font-mono font-semibold"
              />
            </div>
          </div>
        )}
      </div>

      <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-0.5 shrink-0" />

      {/* 4. Font Size Dropdown */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setActivePicker(activePicker === 'font-size' ? null : 'font-size')}
          className="flex items-center gap-1 px-1.5 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-bold"
          title="Font Size"
        >
          <span>{currentFontSize}</span>
          <ChevronDown className="w-3 h-3 text-slate-400" />
        </button>

        {activePicker === 'font-size' && (
          <div className="absolute top-10 left-0 w-28 p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl z-50">
            {FONT_SIZES.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => {
                  onUpdateStyles({ fontSize: f.value });
                  setActivePicker(null);
                }}
                className={`w-full text-left px-2 py-1 rounded text-xs font-semibold ${
                  currentFontSize === f.value 
                    ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400' 
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 5. Bold Toggle */}
      <button
        type="button"
        onClick={() => onUpdateStyles({ fontWeight: isBold ? 'normal' : 'bold' })}
        className={`p-1.5 rounded-lg transition-colors ${
          isBold 
            ? 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 font-black' 
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
        }`}
        title="Toggle Bold"
      >
        <Bold className="w-3.5 h-3.5" />
      </button>

      {/* 6. Alignment Toggles */}
      <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg">
        <button
          type="button"
          onClick={() => onUpdateStyles({ textAlign: 'left' })}
          className={`p-1 rounded ${currentAlign === 'left' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-xs' : 'text-slate-400'}`}
          title="Align Left"
        >
          <AlignLeft className="w-3 h-3" />
        </button>
        <button
          type="button"
          onClick={() => onUpdateStyles({ textAlign: 'center' })}
          className={`p-1 rounded ${currentAlign === 'center' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-xs' : 'text-slate-400'}`}
          title="Align Center"
        >
          <AlignCenter className="w-3 h-3" />
        </button>
        <button
          type="button"
          onClick={() => onUpdateStyles({ textAlign: 'right' })}
          className={`p-1 rounded ${currentAlign === 'right' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-xs' : 'text-slate-400'}`}
          title="Align Right"
        >
          <AlignRight className="w-3 h-3" />
        </button>
      </div>

      {/* 7. Border Radius Selector */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setActivePicker(activePicker === 'radius' ? null : 'radius')}
          className="p-1.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-xs"
          title="Border Radius"
        >
          <CornerDownRight className="w-3.5 h-3.5" />
        </button>

        {activePicker === 'radius' && (
          <div className="absolute top-10 right-0 w-28 p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl z-50">
            <div className="text-[10px] font-bold text-slate-400 mb-1 px-1">Radius</div>
            {RADIUS_OPTIONS.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => {
                  onUpdateStyles({ borderRadius: r.value });
                  setActivePicker(null);
                }}
                className={`w-full text-left px-2 py-1 rounded text-xs font-semibold ${
                  currentRadius === r.value 
                    ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400' 
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-0.5 shrink-0" />

      {/* 8. Duplicate Node */}
      <button
        type="button"
        onClick={onDuplicate}
        className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        title="Duplicate Element (Ctrl+D)"
      >
        <Copy className="w-3.5 h-3.5" />
      </button>

      {/* 9. Delete Node */}
      <button
        type="button"
        onClick={onDelete}
        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
        title="Delete Element (Delete)"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
