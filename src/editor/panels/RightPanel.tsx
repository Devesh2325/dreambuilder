import React, { useState } from 'react';
import { useEditorStore, RightPanelTab } from '../store/useEditorStore';
import { COMPONENT_REGISTRY } from '../registry/componentRegistry';
import { ComponentNode, ExperienceType } from '../../types/document';
import { ColorGradientPicker } from './ColorGradientPicker';
import { FontPicker } from './FontPicker';
import { IconPickerModal } from './IconPickerModal';
import { MODULE_REGISTRY } from '../modules/moduleRegistry';
import { 
  Sliders, 
  Palette, 
  Layout, 
  Zap, 
  Crosshair, 
  Smartphone, 
  Tablet,
  Monitor, 
  RotateCcw,
  Maximize2,
  Minimize2,
  Columns,
  Rows,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Layers,
  Settings,
  Type,
  ChevronDown,
  X,
  Sparkles,
  Wand2
} from 'lucide-react';

export const RightPanel: React.FC = () => {
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
  const {
    document,
    selectedNodeId,
    selectNode,
    activeTabRight,
    setActiveTabRight,
    updateNodeProps,
    updateNodeStyles,
    updateResponsiveStyles,
    updateNodeTarget,
    deviceMode,
    setDeviceMode,
    isTargetPicking,
    setIsTargetPicking,
    updateTriggerConditions,
    updateExperienceSettings,
    updateThemeVariables,
    updateDocumentTitle,
    setDocumentType,
    isRightPanelOpen,
  } = useEditorStore();

  if (!isRightPanelOpen) {
    return null;
  }

  // Helper to locate selected node in document tree
  const findNode = (root: ComponentNode, id: string): ComponentNode | null => {
    if (root.id === id) return root;
    for (const child of root.children) {
      const found = findNode(child, id);
      if (found) return found;
    }
    return null;
  };

  const selectedNode = document && selectedNodeId ? findNode(document.rootNode, selectedNodeId) : null;
  const definition = selectedNode ? COMPONENT_REGISTRY[selectedNode.type] : null;

  // -------------------------------------------------------------
  // 1. PAGE-LEVEL SETTINGS PANEL (When No Element is Selected)
  // -------------------------------------------------------------
  if (!selectedNode || !definition) {
    const themeVars = document?.themeVariables || {
      primaryColor: '#4f46e5',
      backgroundColor: '#ffffff',
      fontFamily: 'Inter, sans-serif',
    };
    const triggers = document?.triggerConditions || {
      urlRules: [{ type: 'contains' as const, value: '*' }],
      delaySeconds: 0,
      frequency: 'always' as const,
      exitIntent: false,
    };

    return (
      <div className="w-80 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col h-full font-sans select-none text-xs transition-colors shrink-0">
        {/* Page Header */}
        <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <div>
              <span className="font-bold text-slate-800 dark:text-slate-200 text-xs block">Experience Settings</span>
              <span className="text-[10px] text-slate-400 font-mono">Page & Global Styles</span>
            </div>
          </div>
          <span className="text-[10px] font-semibold text-slate-500 bg-slate-200/60 dark:bg-slate-700/60 px-2 py-0.5 rounded-full uppercase">
            {document?.documentType || 'Page'}
          </span>
        </div>

        {/* Page Settings Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Experience Identity */}
          <div className="space-y-3">
            <h5 className="font-bold text-slate-700 dark:text-slate-300 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <span>Experience Identity</span>
            </h5>
            
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Experience Title</label>
              <input
                type="text"
                value={document?.title || ''}
                onChange={(e) => updateDocumentTitle(e.target.value)}
                placeholder="My Interactive Experience"
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Experience Module</label>
              <select
                value={document?.documentType || 'page'}
                onChange={(e) => setDocumentType(e.target.value as ExperienceType)}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 capitalize focus:outline-none focus:border-indigo-500"
              >
                {Object.values(MODULE_REGISTRY).map((m) => (
                  <option key={m.id} value={m.id}>{m.title}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="h-px bg-slate-200 dark:bg-slate-800" />

          {/* Canvas & Theme Styles */}
          <div className="space-y-3">
            <h5 className="font-bold text-slate-700 dark:text-slate-300 text-xs uppercase tracking-wider">
              Canvas Styling
            </h5>

            {/* Canvas Background Color / Gradient */}
            <div>
              <ColorGradientPicker
                label="Canvas Background"
                value={document?.rootNode?.styles?.background || document?.rootNode?.styles?.backgroundColor || themeVars.backgroundColor || '#ffffff'}
                onChange={(colorVal) => {
                  updateThemeVariables({ backgroundColor: colorVal });
                  if (document?.rootNode) {
                    if (colorVal.includes('gradient')) {
                      updateNodeStyles(document.rootNode.id, { background: colorVal, backgroundColor: undefined });
                    } else {
                      updateNodeStyles(document.rootNode.id, { backgroundColor: colorVal, background: undefined });
                    }
                  }
                }}
              />
            </div>

            {/* Primary Accent Color */}
            <div>
              <ColorGradientPicker
                label="Primary Brand Accent"
                value={themeVars.primaryColor || '#4f46e5'}
                onChange={(colorVal) => updateThemeVariables({ primaryColor: colorVal })}
                allowGradient={false}
              />
            </div>

            {/* Global Typography with Google Fonts */}
            <FontPicker
              label="Global Typography (Google Fonts)"
              fontFamily={themeVars.fontFamily || 'Inter'}
              onChangeFamily={(f) => {
                updateThemeVariables({ fontFamily: f });
                if (document?.rootNode) {
                  updateNodeStyles(document.rootNode.id, { fontFamily: f });
                }
              }}
            />
          </div>

          <div className="h-px bg-slate-200 dark:bg-slate-800" />

          {/* Triggering & Audience Conditions */}
          <div className="space-y-3">
            <h5 className="font-bold text-slate-700 dark:text-slate-300 text-xs uppercase tracking-wider">
              Trigger & Targeting
            </h5>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Target URL / Path</label>
              <input
                type="text"
                placeholder="* or /pricing, /dashboard/*"
                value={triggers.urlRules?.[0]?.value || '*'}
                onChange={(e) => updateTriggerConditions({
                  urlRules: [{ type: 'contains', value: e.target.value }]
                })}
                className="w-full px-2.5 py-1.5 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Delay Before Display</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={triggers.delaySeconds || 0}
                  onChange={(e) => updateTriggerConditions({ delaySeconds: Number(e.target.value) })}
                  className="w-20 px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
                />
                <span className="text-[11px] text-slate-400">seconds after page load</span>
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={triggers.exitIntent || false}
                onChange={(e) => updateTriggerConditions({ exitIntent: e.target.checked })}
                className="rounded text-indigo-600 border-slate-300 dark:border-slate-600 focus:ring-indigo-500"
              />
              <span className="text-[11px] text-slate-700 dark:text-slate-300 font-medium">Trigger on Exit Intent</span>
            </label>
          </div>

          <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-xl border border-indigo-200/60 dark:border-indigo-800/60 text-[11px] text-indigo-900 dark:text-indigo-200">
            💡 <strong>Pro Tip:</strong> Click any element on the canvas or layers panel to edit its individual block properties, typography, flex layout, and styles.
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 2. SELECTED ELEMENT INSPECTOR
  // -------------------------------------------------------------
  const inspectorTabs: { id: RightPanelTab; label: string; icon: React.ReactNode }[] = [
    { id: 'content', label: 'Content', icon: <Sliders className="w-3.5 h-3.5" /> },
    { id: 'design', label: 'Design', icon: <Palette className="w-3.5 h-3.5" /> },
    { id: 'layout', label: 'Layout', icon: <Layout className="w-3.5 h-3.5" /> },
    { id: 'responsive', label: 'Mobile', icon: <Smartphone className="w-3.5 h-3.5" /> },
    { id: 'conditions', label: 'Triggers', icon: <Zap className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="w-80 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col h-full font-sans select-none text-xs transition-colors shrink-0">
      {/* Selected Element Header */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
        <div className="truncate flex-1 pr-2">
          <span className="font-bold text-slate-800 dark:text-slate-200 text-xs block truncate">{definition.displayName}</span>
          <span className="text-[10px] text-slate-400 font-mono truncate">#{selectedNode.id.substring(0, 12)}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800/60 px-2 py-0.5 rounded-full capitalize">
            {definition.category}
          </span>
          <button
            type="button"
            onClick={() => selectNode(null)}
            title="Deselect element (Esc)"
            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 p-1">
        {inspectorTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTabRight(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded transition-all text-[11px] font-medium ${
              activeTabRight === tab.id
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm font-semibold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content Panels */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
        {/* 1. CONTENT TAB */}
        {activeTabRight === 'content' && (
          <div className="space-y-4">
            <h5 className="font-bold text-slate-700 dark:text-slate-300 text-xs uppercase tracking-wider mb-2">Properties & Data</h5>

            {definition.propertyFields.length === 0 && !selectedNode.target ? (
              <p className="text-slate-400 text-xs py-4 text-center">
                This element has no configurable text or data properties.
              </p>
            ) : (
              definition.propertyFields.map((field) => {
                const val = selectedNode.props[field.key];
                return (
                  <div key={field.key} className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block">
                      {field.label}
                    </label>

                    {field.type === 'text' && (
                      <input
                        type="text"
                        value={val || ''}
                        onChange={(e) => updateNodeProps(selectedNode.id, { [field.key]: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                      />
                    )}

                    {field.type === 'textarea' && (
                      <textarea
                        rows={3}
                        value={val || ''}
                        onChange={(e) => updateNodeProps(selectedNode.id, { [field.key]: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                      />
                    )}

                    {field.type === 'number' && (
                      <input
                        type="number"
                        value={val ?? 0}
                        onChange={(e) => updateNodeProps(selectedNode.id, { [field.key]: Number(e.target.value) })}
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                      />
                    )}

                    {field.type === 'boolean' && (
                      <label className="flex items-center gap-2 cursor-pointer pt-1">
                        <input
                          type="checkbox"
                          checked={!!val}
                          onChange={(e) => updateNodeProps(selectedNode.id, { [field.key]: e.target.checked })}
                          className="rounded text-indigo-600 border-slate-300 dark:border-slate-600 focus:ring-indigo-500"
                        />
                        <span className="text-[11px] text-slate-700 dark:text-slate-300 font-medium">Enabled</span>
                      </label>
                    )}

                    {field.type === 'select' && (
                      <select
                        value={val || ''}
                        onChange={(e) => updateNodeProps(selectedNode.id, { [field.key]: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                      >
                        {field.options?.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    )}
                  </div>
                );
              })
            )}

            {/* Vector Icon Selector if node supports icon */}
            {('icon' in selectedNode.props || selectedNode.type === 'Button' || selectedNode.type === 'FeatureCard' || selectedNode.type === 'Badge') && (
              <div className="space-y-1 pt-2 border-t border-slate-200 dark:border-slate-800">
                <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block">
                  Vector Icon
                </label>
                <div className="flex items-center gap-2">
                  <div className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-mono font-semibold text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700 truncate flex-1">
                    {selectedNode.props.icon || 'None'}
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsIconPickerOpen(true)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors shrink-0 flex items-center gap-1"
                  >
                    <span>Change Icon</span>
                  </button>
                </div>
              </div>
            )}

            {/* Target Element Selector (Tours & Tooltips) */}
            {selectedNode.target && (
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h6 className="font-bold text-slate-700 dark:text-slate-300 text-[11px] uppercase tracking-wider">
                    Target Selector
                  </h6>
                  <button
                    type="button"
                    onClick={() => setIsTargetPicking(!isTargetPicking)}
                    className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-lg border font-semibold transition-all ${
                      isTargetPicking
                        ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm animate-pulse'
                        : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100'
                    }`}
                  >
                    <Crosshair className="w-3 h-3" />
                    <span>{isTargetPicking ? 'Click Canvas...' : 'Pick on Canvas'}</span>
                  </button>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block">
                    CSS Selector
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. #dashboard-nav, .cta-button"
                    value={selectedNode.target.selector || ''}
                    onChange={(e) => updateNodeTarget(selectedNode.id, { selector: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">
                      Placement
                    </label>
                    <select
                      value={selectedNode.target.placement || 'bottom'}
                      onChange={(e) => updateNodeTarget(selectedNode.id, { placement: e.target.value as any })}
                      className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
                    >
                      <option value="top">Top</option>
                      <option value="bottom">Bottom</option>
                      <option value="left">Left</option>
                      <option value="right">Right</option>
                      <option value="auto">Auto</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">
                      Offset (px)
                    </label>
                    <input
                      type="number"
                      value={selectedNode.target.offset || 12}
                      onChange={(e) => updateNodeTarget(selectedNode.id, { offset: Number(e.target.value) })}
                      className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={selectedNode.target.highlight !== false}
                    onChange={(e) => updateNodeTarget(selectedNode.id, { highlight: e.target.checked })}
                    className="rounded text-indigo-600 border-slate-300 dark:border-slate-600"
                  />
                  <span className="text-[11px] text-slate-600 dark:text-slate-400">Spotlight around target element</span>
                </label>
              </div>
            )}
          </div>
        )}

        {/* 2. DESIGN TAB (With Complete Color & Gradient Editor & Typography) */}
        {activeTabRight === 'design' && (
          <div className="space-y-4">
            <h5 className="font-bold text-slate-700 dark:text-slate-300 text-xs uppercase tracking-wider mb-2">Visual Styling</h5>

            {/* Quick Aesthetic Style Presets */}
            <div className="space-y-1.5 pb-2 border-b border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>One-Click Style Presets</span>
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  {
                    name: 'Frosted Glass',
                    styles: {
                      backgroundColor: 'rgba(255, 255, 255, 0.25)',
                      background: undefined,
                      backdropFilter: 'blur(12px)',
                      borderColor: 'rgba(255, 255, 255, 0.4)',
                      borderWidth: '1px',
                      borderStyle: 'solid' as const,
                      borderRadius: '16px',
                      boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.12)',
                    },
                  },
                  {
                    name: 'Obsidian Dark',
                    styles: {
                      backgroundColor: 'rgba(15, 23, 42, 0.85)',
                      background: undefined,
                      backdropFilter: 'blur(16px)',
                      borderColor: 'rgba(51, 65, 85, 0.7)',
                      borderWidth: '1px',
                      borderStyle: 'solid' as const,
                      borderRadius: '16px',
                      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.35)',
                      color: '#ffffff',
                    },
                  },
                  {
                    name: 'Indigo Glow',
                    styles: {
                      borderColor: '#6366f1',
                      borderWidth: '1px',
                      borderStyle: 'solid' as const,
                      borderRadius: '14px',
                      boxShadow: '0 0 25px rgba(99, 102, 241, 0.45)',
                    },
                  },
                  {
                    name: 'Neo-Brutalist',
                    styles: {
                      backgroundColor: '#ffffff',
                      background: undefined,
                      borderColor: '#000000',
                      borderWidth: '2px',
                      borderStyle: 'solid' as const,
                      borderRadius: '6px',
                      boxShadow: '4px 4px 0px #000000',
                      color: '#000000',
                    },
                  },
                ].map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => updateNodeStyles(selectedNode.id, preset.styles)}
                    className="p-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 rounded-lg text-left text-[11px] font-semibold text-slate-700 dark:text-slate-300 transition-all flex items-center justify-between group"
                  >
                    <span>{preset.name}</span>
                    <Wand2 className="w-2.5 h-2.5 text-slate-400 group-hover:text-indigo-500" />
                  </button>
                ))}
              </div>
            </div>

            {/* Background Color / Gradient with ColorGradientPicker */}
            <div>
              <ColorGradientPicker
                label="Background Color & Gradient"
                value={selectedNode.styles.background || selectedNode.styles.backgroundColor || 'transparent'}
                onChange={(val) => {
                  if (val.includes('gradient')) {
                    updateNodeStyles(selectedNode.id, { background: val, backgroundColor: undefined });
                  } else {
                    updateNodeStyles(selectedNode.id, { backgroundColor: val, background: undefined });
                  }
                }}
              />
            </div>

            {/* Text Color with ColorPicker */}
            <div>
              <ColorGradientPicker
                label="Text Color"
                value={selectedNode.styles.color || '#0f172a'}
                onChange={(val) => updateNodeStyles(selectedNode.id, { color: val })}
                allowGradient={false}
              />
            </div>

            {/* Typography & Google Fonts Controls */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
              <FontPicker
                label="Typography (Google Fonts)"
                fontFamily={selectedNode.styles.fontFamily || 'Inter'}
                fontWeight={selectedNode.styles.fontWeight || '400'}
                letterSpacing={selectedNode.styles.letterSpacing}
                lineHeight={selectedNode.styles.lineHeight}
                textTransform={selectedNode.styles.textTransform as any}
                onChangeFamily={(f) => updateNodeStyles(selectedNode.id, { fontFamily: f })}
                onChangeWeight={(w) => updateNodeStyles(selectedNode.id, { fontWeight: w })}
                onChangeLetterSpacing={(ls) => updateNodeStyles(selectedNode.id, { letterSpacing: ls })}
                onChangeLineHeight={(lh) => updateNodeStyles(selectedNode.id, { lineHeight: lh })}
                onChangeTransform={(tt) => updateNodeStyles(selectedNode.id, { textTransform: tt })}
              />
            </div>

            {/* Border Radius Presets */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block">Border Radius</label>
              <div className="flex gap-1">
                {['0px', '4px', '8px', '12px', '16px', '9999px'].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => updateNodeStyles(selectedNode.id, { borderRadius: r })}
                    className={`flex-1 py-1 rounded-md text-[10px] font-mono border transition-all ${
                      selectedNode.styles.borderRadius === r
                        ? 'bg-indigo-50 dark:bg-indigo-950/70 border-indigo-500 text-indigo-600 dark:text-indigo-400 font-bold'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-400'
                    }`}
                  >
                    {r === '9999px' ? 'Pill' : r}
                  </button>
                ))}
              </div>
            </div>

            {/* Border Controls */}
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">Border Width</label>
                  <select
                    value={selectedNode.styles.borderWidth || '0px'}
                    onChange={(e) => updateNodeStyles(selectedNode.id, { 
                      borderWidth: e.target.value,
                      borderStyle: e.target.value !== '0px' ? (selectedNode.styles.borderStyle || 'solid') : 'none'
                    })}
                    className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
                  >
                    <option value="0px">None</option>
                    <option value="1px">1px</option>
                    <option value="2px">2px</option>
                    <option value="4px">4px</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">Border Style</label>
                  <select
                    value={selectedNode.styles.borderStyle || 'solid'}
                    onChange={(e) => updateNodeStyles(selectedNode.id, { borderStyle: e.target.value as any })}
                    className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
                  >
                    <option value="solid">Solid</option>
                    <option value="dashed">Dashed</option>
                    <option value="dotted">Dotted</option>
                  </select>
                </div>
              </div>

              {selectedNode.styles.borderWidth && selectedNode.styles.borderWidth !== '0px' && (
                <ColorGradientPicker
                  label="Border Color"
                  value={selectedNode.styles.borderColor || '#cbd5e1'}
                  onChange={(val) => updateNodeStyles(selectedNode.id, { borderColor: val })}
                  allowGradient={false}
                />
              )}
            </div>

            {/* Box Shadow Presets */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block">Box Shadow</label>
              <select
                value={selectedNode.styles.boxShadow || 'none'}
                onChange={(e) => updateNodeStyles(selectedNode.id, { boxShadow: e.target.value })}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
              >
                <option value="none">None</option>
                <option value="0 1px 2px 0 rgb(0 0 0 / 0.05)">Subtle (sm)</option>
                <option value="0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)">Card (md)</option>
                <option value="0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)">Floating (lg)</option>
                <option value="0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)">Deep (xl)</option>
                <option value="0 0 20px rgba(99, 102, 241, 0.35)">Indigo Glow</option>
              </select>
            </div>

            {/* Opacity */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-slate-600 dark:text-slate-400">
                <span>Opacity</span>
                <span>{Math.round((selectedNode.styles.opacity ?? 1) * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={selectedNode.styles.opacity ?? 1}
                onChange={(e) => updateNodeStyles(selectedNode.id, { opacity: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded appearance-none cursor-pointer accent-indigo-600"
              />
            </div>
          </div>
        )}

        {/* 3. LAYOUT TAB (With Full Flexbox Controls & Gap Ratios) */}
        {activeTabRight === 'layout' && (
          <div className="space-y-4">
            <h5 className="font-bold text-slate-700 dark:text-slate-300 text-xs uppercase tracking-wider mb-2">
              Layout & Positioning
            </h5>

            {/* Display Mode */}
            <div>
              <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">Display Mode</label>
              <select
                value={selectedNode.styles.display || 'block'}
                onChange={(e) => updateNodeStyles(selectedNode.id, { display: e.target.value as any })}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
              >
                <option value="block">Block</option>
                <option value="flex">Flexbox</option>
                <option value="grid">Grid</option>
                <option value="inline-block">Inline Block</option>
              </select>
            </div>

            {/* FLEXBOX CONTROLS (when display === 'flex' or isContainer) */}
            {(selectedNode.styles.display === 'flex' || definition.isContainer) && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-3">
                <span className="font-bold text-slate-700 dark:text-slate-300 text-[11px] uppercase tracking-wider block">
                  Flexbox Controls
                </span>

                {/* Flex Direction */}
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 block">Direction</label>
                  <div className="grid grid-cols-4 gap-1">
                    {[
                      { val: 'row', label: 'Row', icon: <Columns className="w-3 h-3" /> },
                      { val: 'column', label: 'Col', icon: <Rows className="w-3 h-3" /> },
                      { val: 'row-reverse', label: 'Row Rev' },
                      { val: 'column-reverse', label: 'Col Rev' },
                    ].map((d) => (
                      <button
                        key={d.val}
                        type="button"
                        onClick={() => updateNodeStyles(selectedNode.id, { display: 'flex', flexDirection: d.val as any })}
                        className={`py-1 rounded text-[10px] font-semibold border flex items-center justify-center gap-1 transition-all ${
                          selectedNode.styles.flexDirection === d.val
                            ? 'bg-indigo-600 text-white border-indigo-700 shadow-2xs'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-400'
                        }`}
                      >
                        {d.icon}
                        <span>{d.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Flex Wrap */}
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 block">Wrap</label>
                  <div className="grid grid-cols-2 gap-1">
                    {[
                      { val: 'nowrap', label: 'No Wrap' },
                      { val: 'wrap', label: 'Wrap Elements' },
                    ].map((w) => (
                      <button
                        key={w.val}
                        type="button"
                        onClick={() => updateNodeStyles(selectedNode.id, { flexWrap: w.val as any })}
                        className={`py-1 rounded text-[10px] font-semibold border transition-all ${
                          (selectedNode.styles.flexWrap || 'nowrap') === w.val
                            ? 'bg-indigo-600 text-white border-indigo-700 shadow-2xs'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {w.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Justify Content (Main Axis) */}
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 block">Justify Content (Main Axis)</label>
                  <select
                    value={selectedNode.styles.justifyContent || 'flex-start'}
                    onChange={(e) => updateNodeStyles(selectedNode.id, { justifyContent: e.target.value as any })}
                    className="w-full px-2 py-1 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
                  >
                    <option value="flex-start">Start</option>
                    <option value="center">Center</option>
                    <option value="flex-end">End</option>
                    <option value="space-between">Space Between</option>
                    <option value="space-around">Space Around</option>
                    <option value="space-evenly">Space Evenly</option>
                  </select>
                </div>

                {/* Align Items (Cross Axis) */}
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 block">Align Items (Cross Axis)</label>
                  <select
                    value={selectedNode.styles.alignItems || 'stretch'}
                    onChange={(e) => updateNodeStyles(selectedNode.id, { alignItems: e.target.value as any })}
                    className="w-full px-2 py-1 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
                  >
                    <option value="stretch">Stretch</option>
                    <option value="center">Center</option>
                    <option value="flex-start">Start</option>
                    <option value="flex-end">End</option>
                    <option value="baseline">Baseline</option>
                  </select>
                </div>

                {/* Gap */}
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 block">Gap Spacing</label>
                  <div className="flex gap-1.5 items-center">
                    <input
                      type="text"
                      placeholder="e.g. 16px, 1rem"
                      value={selectedNode.styles.gap || ''}
                      onChange={(e) => updateNodeStyles(selectedNode.id, { gap: e.target.value })}
                      className="flex-1 px-2 py-1 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 font-mono"
                    />
                    {['8px', '16px', '24px'].map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => updateNodeStyles(selectedNode.id, { gap: g })}
                        className="px-2 py-1 rounded bg-slate-200/70 dark:bg-slate-700 text-[10px] font-mono hover:bg-slate-300"
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Sizing: Width & Height */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">Width</label>
                <input
                  type="text"
                  placeholder="100%, 380px, auto"
                  value={selectedNode.styles.width || ''}
                  onChange={(e) => updateNodeStyles(selectedNode.id, { width: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">Height / Min-Height</label>
                <input
                  type="text"
                  placeholder="auto, 400px"
                  value={selectedNode.styles.height || selectedNode.styles.minHeight || ''}
                  onChange={(e) => updateNodeStyles(selectedNode.id, { height: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            {/* Spacing: Padding & Margin */}
            <div className="space-y-2">
              <div>
                <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">Padding</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Top / Bottom (e.g. 16px)"
                    value={selectedNode.styles.paddingTop || ''}
                    onChange={(e) => updateNodeStyles(selectedNode.id, { paddingTop: e.target.value, paddingBottom: e.target.value })}
                    className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
                  />
                  <input
                    type="text"
                    placeholder="Left / Right (e.g. 24px)"
                    value={selectedNode.styles.paddingLeft || ''}
                    onChange={(e) => updateNodeStyles(selectedNode.id, { paddingLeft: e.target.value, paddingRight: e.target.value })}
                    className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">Margin</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Top / Bottom"
                    value={selectedNode.styles.marginTop || ''}
                    onChange={(e) => updateNodeStyles(selectedNode.id, { marginTop: e.target.value, marginBottom: e.target.value })}
                    className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
                  />
                  <input
                    type="text"
                    placeholder="Left / Right (or auto)"
                    value={selectedNode.styles.marginLeft || ''}
                    onChange={(e) => updateNodeStyles(selectedNode.id, { marginLeft: e.target.value, marginRight: e.target.value })}
                    className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. RESPONSIVE OVERRIDES TAB */}
        {activeTabRight === 'responsive' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h5 className="font-bold text-slate-700 dark:text-slate-300 text-xs uppercase tracking-wider">Device Overrides</h5>
              <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase">{deviceMode}</span>
            </div>

            {/* Device Switcher */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg gap-1 border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setDeviceMode('desktop')}
                className={`flex-1 py-1.5 px-2 rounded text-[11px] font-semibold flex items-center justify-center gap-1 transition-all ${
                  deviceMode === 'desktop'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Monitor className="w-3 h-3" />
                <span>Desktop</span>
              </button>
              <button
                type="button"
                onClick={() => setDeviceMode('tablet')}
                className={`flex-1 py-1.5 px-2 rounded text-[11px] font-semibold flex items-center justify-center gap-1 transition-all ${
                  deviceMode === 'tablet'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Tablet className="w-3 h-3" />
                <span>Tablet</span>
              </button>
              <button
                type="button"
                onClick={() => setDeviceMode('mobile')}
                className={`flex-1 py-1.5 px-2 rounded text-[11px] font-semibold flex items-center justify-center gap-1 transition-all ${
                  deviceMode === 'mobile'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Smartphone className="w-3 h-3" />
                <span>Mobile</span>
              </button>
            </div>

            {deviceMode === 'desktop' ? (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Desktop is the Default Base View</span>
                All style changes apply globally. Select <strong>Tablet</strong> or <strong>Mobile</strong> above to customize overrides specifically for smaller screens.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-2.5 bg-indigo-50/60 dark:bg-indigo-950/40 rounded-xl border border-indigo-200/80 dark:border-indigo-800/80 text-[11px] text-indigo-900 dark:text-indigo-200 flex items-center justify-between">
                  <span>Editing <strong>{deviceMode}</strong> overrides</span>
                  <button
                    type="button"
                    onClick={() => {
                      updateResponsiveStyles(selectedNode.id, deviceMode, {
                        fontSize: undefined,
                        paddingTop: undefined,
                        paddingBottom: undefined,
                        paddingLeft: undefined,
                        paddingRight: undefined,
                        width: undefined,
                        display: undefined,
                        textAlign: undefined,
                      });
                    }}
                    className="flex items-center gap-1 text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline font-bold"
                  >
                    <RotateCcw className="w-2.5 h-2.5" />
                    Reset
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">
                      {deviceMode} Font Size
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 14px, 1.1rem"
                      value={selectedNode.responsive?.[deviceMode]?.fontSize || ''}
                      onChange={(e) => updateResponsiveStyles(selectedNode.id, deviceMode, { fontSize: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">
                      {deviceMode} Padding
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Top/Bottom"
                        value={selectedNode.responsive?.[deviceMode]?.paddingTop || ''}
                        onChange={(e) => updateResponsiveStyles(selectedNode.id, deviceMode, { paddingTop: e.target.value, paddingBottom: e.target.value })}
                        className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
                      />
                      <input
                        type="text"
                        placeholder="Left/Right"
                        value={selectedNode.responsive?.[deviceMode]?.paddingLeft || ''}
                        onChange={(e) => updateResponsiveStyles(selectedNode.id, deviceMode, { paddingLeft: e.target.value, paddingRight: e.target.value })}
                        className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">
                      {deviceMode} Width
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 100%, 340px"
                      value={selectedNode.responsive?.[deviceMode]?.width || ''}
                      onChange={(e) => updateResponsiveStyles(selectedNode.id, deviceMode, { width: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 5. CONDITIONS & TRIGGERS TAB */}
        {activeTabRight === 'conditions' && (
          <div className="space-y-4">
            <h5 className="font-bold text-slate-700 dark:text-slate-300 text-xs uppercase tracking-wider mb-2">
              Behavior & Triggers
            </h5>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">Display Trigger</label>
                <select
                  value={document?.triggerConditions?.delaySeconds ? 'delay' : 'immediate'}
                  onChange={(e) => {
                    if (e.target.value === 'immediate') {
                      updateTriggerConditions({ delaySeconds: 0 });
                    } else {
                      updateTriggerConditions({ delaySeconds: 3 });
                    }
                  }}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
                >
                  <option value="immediate">Immediately on load</option>
                  <option value="delay">After time delay</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">Entrance Animation</label>
                <select
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
                  defaultValue="fade-in"
                >
                  <option value="fade-in">Fade In</option>
                  <option value="slide-up">Slide Up</option>
                  <option value="scale-in">Scale In</option>
                  <option value="bounce">Subtle Bounce</option>
                  <option value="none">None</option>
                </select>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 dark:text-slate-400">
                These conditions determine when and how this block or experience is shown to the end user.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Searchable 60+ Lucide Vector Icon Picker Modal */}
      <IconPickerModal
        isOpen={isIconPickerOpen}
        onClose={() => setIsIconPickerOpen(false)}
        currentIcon={selectedNode?.props?.icon}
        onSelectIcon={(iconName) => {
          if (selectedNode) {
            updateNodeProps(selectedNode.id, { icon: iconName });
          }
        }}
      />
    </div>
  );
};
