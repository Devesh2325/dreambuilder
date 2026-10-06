import React from 'react';
import { useEditorStore, RightPanelTab } from '../store/useEditorStore';
import { COMPONENT_REGISTRY } from '../registry/componentRegistry';
import { ComponentNode } from '../../types/document';
import { 
  Sliders, 
  Palette, 
  Layout, 
  Zap, 
  Crosshair, 
  Smartphone, 
  Sparkles,
  ChevronRight,
  Info
} from 'lucide-react';

export const RightPanel: React.FC = () => {
  const {
    document,
    selectedNodeId,
    activeTabRight,
    setActiveTabRight,
    updateNodeProps,
    updateNodeStyles,
    updateResponsiveStyles,
    updateNodeTarget,
    deviceMode,
    isTargetPicking,
    setIsTargetPicking,
    updateTriggerConditions,
    updateExperienceSettings,
  } = useEditorStore();

  // Helper to locate selected node
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

  if (!selectedNode || !definition) {
    return (
      <div className="w-80 bg-white border-l border-slate-200 flex flex-col items-center justify-center p-6 text-center text-slate-400 font-sans select-none">
        <Sliders className="w-8 h-8 text-slate-300 mb-3" />
        <h4 className="text-sm font-semibold text-slate-600 mb-1">No Element Selected</h4>
        <p className="text-xs text-slate-400 leading-relaxed">
          Click on any element in the canvas or layers tree to configure its properties, design styles, and triggers.
        </p>
      </div>
    );
  }

  const inspectorTabs: { id: RightPanelTab; label: string; icon: React.ReactNode }[] = [
    { id: 'content', label: 'Content', icon: <Sliders className="w-3.5 h-3.5" /> },
    { id: 'design', label: 'Design', icon: <Palette className="w-3.5 h-3.5" /> },
    { id: 'layout', label: 'Layout', icon: <Layout className="w-3.5 h-3.5" /> },
    { id: 'conditions', label: 'Triggers', icon: <Zap className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="w-80 bg-white border-l border-slate-200 flex flex-col h-full font-sans select-none text-xs">
      {/* Selected Element Header */}
      <div className="p-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
        <div>
          <span className="font-bold text-slate-800 text-xs block">{definition.displayName}</span>
          <span className="text-[10px] text-slate-400 font-mono">#{selectedNode.id.substring(0, 10)}</span>
        </div>
        <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full capitalize">
          {definition.category}
        </span>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200 bg-slate-50/50 p-1">
        {inspectorTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTabRight(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded transition-all text-[11px] font-medium ${
              activeTabRight === tab.id
                ? 'bg-white text-indigo-600 shadow-sm font-semibold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* 1. CONTENT TAB */}
        {activeTabRight === 'content' && (
          <div className="space-y-4">
            <h5 className="font-bold text-slate-700 text-xs uppercase tracking-wider mb-2">Properties</h5>
            {definition.propertyFields.map((field) => {
              const value = selectedNode.props[field.key] ?? field.defaultValue ?? '';

              return (
                <div key={field.key} className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-600 block">
                    {field.label}
                  </label>

                  {field.type === 'text' && (
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => updateNodeProps(selectedNode.id, { [field.key]: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
                    />
                  )}

                  {field.type === 'textarea' && (
                    <textarea
                      rows={3}
                      value={value}
                      onChange={(e) => updateNodeProps(selectedNode.id, { [field.key]: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white leading-relaxed"
                    />
                  )}

                  {field.type === 'number' && (
                    <input
                      type="number"
                      value={value}
                      onChange={(e) => updateNodeProps(selectedNode.id, { [field.key]: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
                    />
                  )}

                  {field.type === 'select' && (
                    <select
                      value={value}
                      onChange={(e) => updateNodeProps(selectedNode.id, { [field.key]: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
                    >
                      {field.options?.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  )}

                  {field.type === 'boolean' && (
                    <label className="flex items-center gap-2 cursor-pointer mt-1">
                      <input
                        type="checkbox"
                        checked={Boolean(value)}
                        onChange={(e) => updateNodeProps(selectedNode.id, { [field.key]: e.target.checked })}
                        className="rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                      />
                      <span className="text-[11px] text-slate-600">Enabled</span>
                    </label>
                  )}
                </div>
              );
            })}

            {/* Target Selector Configuration for TourStep or Tooltips */}
            {(selectedNode.type === 'TourStep' || selectedNode.target) && (
              <div className="pt-4 border-t border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <Crosshair className="w-3.5 h-3.5 text-indigo-600" />
                    Target Selector
                  </h5>
                  <button
                    type="button"
                    onClick={() => setIsTargetPicking(!isTargetPicking)}
                    className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded transition-colors"
                  >
                    {isTargetPicking ? 'Cancel Picking' : 'Pick on Canvas'}
                  </button>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-600 block">
                    CSS Selector
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. #dashboard-nav, .cta-button"
                    value={selectedNode.target?.selector || ''}
                    onChange={(e) => updateNodeTarget(selectedNode.id, { selector: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-md focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-medium text-slate-600 block mb-1">
                      Placement
                    </label>
                    <select
                      value={selectedNode.target?.placement || 'bottom'}
                      onChange={(e) => updateNodeTarget(selectedNode.id, { placement: e.target.value as any })}
                      className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md"
                    >
                      <option value="top">Top</option>
                      <option value="bottom">Bottom</option>
                      <option value="left">Left</option>
                      <option value="right">Right</option>
                      <option value="auto">Auto</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-slate-600 block mb-1">
                      Offset (px)
                    </label>
                    <input
                      type="number"
                      value={selectedNode.target?.offset || 12}
                      onChange={(e) => updateNodeTarget(selectedNode.id, { offset: Number(e.target.value) })}
                      className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={selectedNode.target?.highlight !== false}
                    onChange={(e) => updateNodeTarget(selectedNode.id, { highlight: e.target.checked })}
                    className="rounded text-indigo-600 border-slate-300"
                  />
                  <span className="text-[11px] text-slate-600">Spotlight around target element</span>
                </label>
              </div>
            )}
          </div>
        )}

        {/* 2. DESIGN TAB */}
        {activeTabRight === 'design' && (
          <div className="space-y-4">
            <h5 className="font-bold text-slate-700 text-xs uppercase tracking-wider mb-2">Visual Styling</h5>

            {/* Colors */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-medium text-slate-600 block mb-1">Background</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={selectedNode.styles.backgroundColor || '#ffffff'}
                    onChange={(e) => updateNodeStyles(selectedNode.id, { backgroundColor: e.target.value })}
                    className="w-6 h-6 rounded border border-slate-200 cursor-pointer p-0"
                  />
                  <input
                    type="text"
                    value={selectedNode.styles.backgroundColor || '#ffffff'}
                    onChange={(e) => updateNodeStyles(selectedNode.id, { backgroundColor: e.target.value })}
                    className="flex-1 px-1.5 py-1 text-[11px] font-mono bg-slate-50 border border-slate-200 rounded"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-600 block mb-1">Text Color</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={selectedNode.styles.color || '#0f172a'}
                    onChange={(e) => updateNodeStyles(selectedNode.id, { color: e.target.value })}
                    className="w-6 h-6 rounded border border-slate-200 cursor-pointer p-0"
                  />
                  <input
                    type="text"
                    value={selectedNode.styles.color || '#0f172a'}
                    onChange={(e) => updateNodeStyles(selectedNode.id, { color: e.target.value })}
                    className="flex-1 px-1.5 py-1 text-[11px] font-mono bg-slate-50 border border-slate-200 rounded"
                  />
                </div>
              </div>
            </div>

            {/* Radius & Border */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-medium text-slate-600 block mb-1">Border Radius</label>
                <input
                  type="text"
                  placeholder="e.g. 8px, 12px"
                  value={selectedNode.styles.borderRadius || ''}
                  onChange={(e) => updateNodeStyles(selectedNode.id, { borderRadius: e.target.value })}
                  className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-600 block mb-1">Shadow</label>
                <select
                  value={selectedNode.styles.boxShadow || 'none'}
                  onChange={(e) => updateNodeStyles(selectedNode.id, { boxShadow: e.target.value })}
                  className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md"
                >
                  <option value="none">None</option>
                  <option value="0 1px 3px 0 rgba(0, 0, 0, 0.1)">Subtle</option>
                  <option value="0 10px 15px -3px rgba(0, 0, 0, 0.1)">Medium</option>
                  <option value="0 25px 50px -12px rgba(0, 0, 0, 0.25)">Large Modal</option>
                </select>
              </div>
            </div>

            {/* Padding Controls */}
            <div>
              <label className="text-[11px] font-medium text-slate-600 block mb-1">Paddings (px)</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Top / Bottom (e.g. 16px)"
                  value={selectedNode.styles.paddingTop || ''}
                  onChange={(e) => updateNodeStyles(selectedNode.id, { paddingTop: e.target.value, paddingBottom: e.target.value })}
                  className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md"
                />
                <input
                  type="text"
                  placeholder="Left / Right (e.g. 24px)"
                  value={selectedNode.styles.paddingLeft || ''}
                  onChange={(e) => updateNodeStyles(selectedNode.id, { paddingLeft: e.target.value, paddingRight: e.target.value })}
                  className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md"
                />
              </div>
            </div>
          </div>
        )}

        {/* 3. LAYOUT TAB */}
        {activeTabRight === 'layout' && (
          <div className="space-y-4">
            <h5 className="font-bold text-slate-700 text-xs uppercase tracking-wider mb-2">Display & Sizing</h5>
            <div>
              <label className="text-[11px] font-medium text-slate-600 block mb-1">Display Mode</label>
              <select
                value={selectedNode.styles.display || 'block'}
                onChange={(e) => updateNodeStyles(selectedNode.id, { display: e.target.value as any })}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md"
              >
                <option value="block">Block</option>
                <option value="flex">Flexbox</option>
                <option value="grid">Grid</option>
                <option value="inline-block">Inline Block</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-medium text-slate-600 block mb-1">Width</label>
                <input
                  type="text"
                  placeholder="100%, 380px"
                  value={selectedNode.styles.width || ''}
                  onChange={(e) => updateNodeStyles(selectedNode.id, { width: e.target.value })}
                  className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-600 block mb-1">Height</label>
                <input
                  type="text"
                  placeholder="auto, 400px"
                  value={selectedNode.styles.height || ''}
                  onChange={(e) => updateNodeStyles(selectedNode.id, { height: e.target.value })}
                  className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md"
                />
              </div>
            </div>
          </div>
        )}

        {/* 4. CONDITIONS & TRIGGERS TAB */}
        {activeTabRight === 'conditions' && (
          <div className="space-y-4">
            <h5 className="font-bold text-slate-700 text-xs uppercase tracking-wider mb-2">Experience Triggers</h5>
            <div className="p-2.5 bg-indigo-50/50 border border-indigo-100 rounded-lg text-slate-600 text-[11px] leading-relaxed flex items-start gap-2">
              <Info className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
              <span>Configure when and where this experience displays on customer web applications.</span>
            </div>

            <div>
              <label className="text-[11px] font-medium text-slate-600 block mb-1">Display Frequency</label>
              <select
                value={document?.triggerConditions.frequency || 'always'}
                onChange={(e) => updateTriggerConditions({ frequency: e.target.value as any })}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md"
              >
                <option value="always">Every page visit</option>
                <option value="once_per_session">Once per browser session</option>
                <option value="once_per_visitor">Once per unique visitor</option>
                <option value="until_completed">Until completed or dismissed</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-medium text-slate-600 block mb-1">Delay Before Appearing (seconds)</label>
              <input
                type="number"
                min="0"
                value={document?.triggerConditions.delaySeconds || 0}
                onChange={(e) => updateTriggerConditions({ delaySeconds: Number(e.target.value) })}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
