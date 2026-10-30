import React, { useState } from 'react';
import { useEditorStore, LeftPanelTab } from '../store/useEditorStore';
import { COMPONENT_REGISTRY, DynamicIcon } from '../registry/componentRegistry';
import { ComponentNode, ExperienceType } from '../../types/document';
import { storage } from '../../services/storage';
import { MODULE_REGISTRY } from '../modules/moduleRegistry';
import { 
  Box, 
  Layers, 
  LayoutTemplate, 
  FolderOpen, 
  Plus, 
  ChevronRight, 
  ChevronDown, 
  Trash2, 
  Copy, 
  Eye, 
  EyeOff, 
  Search,
  Sparkles,
  Check,
  Star,
  Compass,
  ArrowRight,
  Columns,
  Rows,
  PanelLeftClose,
  GripVertical
} from 'lucide-react';
import { DND_TYPES, createNodeFromType, createMultiColumnNode } from '../utils/dragDropUtils';

export const LeftPanel: React.FC = () => {
  const {
    document,
    activeTabLeft,
    setActiveTabLeft,
    selectedNodeId,
    selectNode,
    insertNode,
    deleteNode,
    duplicateNode,
    setDocumentType,
    isLeftPanelOpen,
    toggleLeftPanel,
    setIsLeftPanelOpen,
  } = useEditorStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [componentFilter, setComponentFilter] = useState<'recommended' | 'layout' | 'content' | 'all'>('recommended');
  const [templateFilter, setTemplateFilter] = useState<'module' | 'all'>('module');

  const currentModule = document?.documentType ? MODULE_REGISTRY[document.documentType] : MODULE_REGISTRY['page'];

  const handleAddComponent = (type: string) => {
    if (!document) return;
    const newNode = createNodeFromType(type);
    if (!newNode) return;
    // If an element is selected, insert adjacent or inside; else insert into root
    const targetParentId = selectedNodeId || document.rootNode.id;
    insertNode(targetParentId, newNode);
  };

  const handleAddMultiColumn = (cols: number) => {
    if (!document) return;
    const parentId = selectedNodeId || document.rootNode.id;
    const flexContainer = createMultiColumnNode(cols);
    insertNode(parentId, flexContainer);
  };

  // Layers Tree item recursive renderer
  const renderLayerNode = (node: ComponentNode, depth: number = 0) => {
    const isSelected = selectedNodeId === node.id;
    const isRoot = node.id === document?.rootNode.id;
    const def = COMPONENT_REGISTRY[node.type];
    const isContainer = def?.isContainer;

    return (
      <div key={node.id} className="select-none">
        <div
          onClick={(e) => {
            e.stopPropagation();
            selectNode(node.id);
          }}
          style={{ paddingLeft: `${depth * 14 + 8}px` }}
          className={`flex items-center justify-between py-1.5 pr-2 rounded-md text-xs cursor-pointer transition-colors group ${
            isSelected
              ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-semibold border-l-2 border-indigo-600'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          <div className="flex items-center gap-1.5 truncate">
            <span className="text-slate-400 text-[11px]">
              {isContainer ? '📁' : '📄'}
            </span>
            <span className="truncate">{node.name || node.type}</span>
          </div>

          {!isRoot && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  duplicateNode(node.id);
                }}
                className="p-1 hover:text-indigo-600 text-slate-400"
                title="Duplicate"
              >
                <Copy className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteNode(node.id);
                }}
                className="p-1 hover:text-red-600 text-slate-400"
                title="Delete"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {node.children && node.children.map((child) => renderLayerNode(child, depth + 1))}
      </div>
    );
  };

  const navTabs: { id: LeftPanelTab; label: string; icon: React.ReactNode }[] = [
    { id: 'components', label: 'Blocks', icon: <Box className="w-4 h-4" /> },
    { id: 'layers', label: 'Layers', icon: <Layers className="w-4 h-4" /> },
    { id: 'templates', label: 'Templates', icon: <LayoutTemplate className="w-4 h-4" /> },
    { id: 'assets', label: 'Assets', icon: <FolderOpen className="w-4 h-4" /> },
  ];

  const allComponents = Object.values(COMPONENT_REGISTRY);

  // Filter components by search and category
  const filteredComponents = allComponents.filter(c => {
    const matchesSearch = c.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    if (componentFilter === 'recommended') {
      const primary = currentModule?.primaryBlockTypes || [];
      const secondary = currentModule?.secondaryBlockTypes || [];
      return primary.includes(c.type) || secondary.includes(c.type);
    }
    if (componentFilter === 'layout') {
      return c.category === 'layout';
    }
    if (componentFilter === 'content') {
      return c.category === 'basic' || c.category === 'interactive' || c.category === 'marketing';
    }
    return true;
  });

  // Group recommended components
  const recommendedPrimary = allComponents.filter(c => (currentModule?.primaryBlockTypes || []).includes(c.type));
  const recommendedSecondary = allComponents.filter(c => (currentModule?.secondaryBlockTypes || []).includes(c.type));

  // Module templates
  const allTemplates = storage.getTemplates();
  const moduleTemplates = allTemplates.filter(t => t.category === document?.documentType);
  const displayedTemplates = templateFilter === 'module' ? moduleTemplates : allTemplates;

  // Render slim collapsed rail when sidebar is toggled closed
  if (!isLeftPanelOpen) {
    return (
      <div className="w-12 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col items-center py-3 gap-3 shrink-0 select-none transition-colors">
        <button
          type="button"
          onClick={toggleLeftPanel}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-indigo-600 rounded-lg transition-colors"
          title="Expand Left Panel"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <div className="h-px w-6 bg-slate-200 dark:bg-slate-800" />
        {navTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setActiveTabLeft(tab.id);
              setIsLeftPanelOpen(true);
            }}
            className={`p-2 rounded-lg transition-colors ${
              activeTabLeft === tab.id
                ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 font-bold'
                : 'text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title={tab.label}
          >
            {tab.icon}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="w-80 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full font-sans select-none transition-colors shrink-0">
      {/* 1. Module Context Header */}
      {currentModule && (
        <div className="p-3 bg-gradient-to-r from-slate-50 to-indigo-50/40 dark:from-slate-900 dark:to-indigo-950/30 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5 truncate">
            <div className={`w-7 h-7 rounded-lg ${currentModule.color} text-white flex items-center justify-center shrink-0 shadow-sm`}>
              <currentModule.icon className="w-4 h-4" />
            </div>
            <div className="truncate">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {currentModule.title}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                {currentModule.subtitle}
              </p>
            </div>
          </div>
          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full shrink-0 border ${currentModule.badgeBg} ${currentModule.badgeText} border-indigo-200 dark:border-indigo-800/60`}>
            {currentModule.shortName}
          </span>
        </div>
      )}

      {/* 2. Panel Tab Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/90 p-1">
        {navTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTabLeft(tab.id)}
            className={`flex-1 flex flex-col items-center justify-center py-2 text-[11px] font-medium rounded-lg transition-all ${
              activeTabLeft === tab.id
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm font-semibold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            {tab.icon}
            <span className="mt-1">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* 3. Tab 1: Blocks Palette */}
      {activeTabLeft === 'components' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Search bar */}
          <div className="p-3 border-b border-slate-100 dark:border-slate-800 space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder={`Search blocks for ${currentModule.shortName}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
              />
            </div>

            {/* Filter pills */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-1">
              <button
                type="button"
                onClick={() => setComponentFilter('recommended')}
                className={`px-2 py-1 rounded text-[10px] font-bold whitespace-nowrap transition-all ${
                  componentFilter === 'recommended'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                ★ For {currentModule.shortName}
              </button>
              <button
                type="button"
                onClick={() => setComponentFilter('layout')}
                className={`px-2 py-1 rounded text-[10px] font-medium whitespace-nowrap transition-all ${
                  componentFilter === 'layout'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                Layout
              </button>
              <button
                type="button"
                onClick={() => setComponentFilter('content')}
                className={`px-2 py-1 rounded text-[10px] font-medium whitespace-nowrap transition-all ${
                  componentFilter === 'content'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                Content
              </button>
              <button
                type="button"
                onClick={() => setComponentFilter('all')}
                className={`px-2 py-1 rounded text-[10px] font-medium whitespace-nowrap transition-all ${
                  componentFilter === 'all'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                All
              </button>
            </div>

            {/* Drag & Drop Prompt Hint */}
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 text-[10px] text-indigo-700 dark:text-indigo-300 font-medium">
              <GripVertical className="w-3.5 h-3.5 shrink-0 opacity-60" />
              <span>Drag any block directly onto the canvas to insert</span>
            </div>
          </div>

          {/* Block Grid */}
          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {componentFilter === 'recommended' && !searchQuery ? (
              <>
                {/* Primary Recommended */}
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-2 flex items-center gap-1">
                    <Star className="w-3 h-3 fill-indigo-600 dark:fill-indigo-400" />
                    Essential {currentModule.title} Blocks
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {recommendedPrimary.map((item) => (
                      <button
                        key={item.type}
                        type="button"
                        draggable={true}
                        onDragStart={(e) => {
                          e.dataTransfer.setData(DND_TYPES.BLOCK_TYPE, item.type);
                          e.dataTransfer.setData('text/plain', item.type);
                          e.dataTransfer.effectAllowed = 'copy';
                        }}
                        onClick={() => handleAddComponent(item.type)}
                        className="flex flex-col items-center justify-center p-2.5 bg-indigo-50/40 dark:bg-indigo-950/30 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 hover:border-indigo-400 border border-indigo-200/80 dark:border-indigo-800/80 rounded-xl text-slate-800 dark:text-slate-200 transition-all text-center group shadow-2xs hover:shadow-sm cursor-grab active:cursor-grabbing relative"
                        title="Click to add or drag directly to canvas"
                      >
                        <div className="w-7 h-7 rounded-lg bg-white dark:bg-slate-800 group-hover:bg-indigo-600 flex items-center justify-center mb-1.5 text-indigo-600 dark:text-indigo-400 group-hover:text-white transition-colors shadow-subtle">
                          <DynamicIcon name={item.icon} className="w-4 h-4" />
                        </div>
                        <span className="text-[11px] font-semibold leading-tight">
                          {item.displayName}
                        </span>
                        <span className="text-[9px] text-slate-400 mt-0.5">+ Drag or Click</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Secondary Structure */}
                {recommendedSecondary.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                      Supplementary Blocks
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {recommendedSecondary.map((item) => (
                        <button
                          key={item.type}
                          type="button"
                          draggable={true}
                          onDragStart={(e) => {
                            e.dataTransfer.setData(DND_TYPES.BLOCK_TYPE, item.type);
                            e.dataTransfer.setData('text/plain', item.type);
                            e.dataTransfer.effectAllowed = 'copy';
                          }}
                          onClick={() => handleAddComponent(item.type)}
                          className="flex flex-col items-center justify-center p-2 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-300 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-300 transition-all text-center group cursor-grab active:cursor-grabbing"
                          title="Click to add or drag directly to canvas"
                        >
                          <div className="w-6 h-6 rounded bg-white dark:bg-slate-700 flex items-center justify-center mb-1 text-slate-500 dark:text-slate-400 shadow-2xs">
                            <DynamicIcon name={item.icon} className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-[10px] font-medium leading-tight truncate w-full px-1">
                            {item.displayName}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-3">
                {componentFilter === 'layout' && (
                  <div className="space-y-1.5 pb-2 border-b border-slate-200 dark:border-slate-800">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      Multi-Column Presets
                    </h4>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        draggable={true}
                        onDragStart={(e) => {
                          e.dataTransfer.setData(DND_TYPES.PRESET, JSON.stringify({ preset: 'columns', count: 2 }));
                          e.dataTransfer.effectAllowed = 'copy';
                        }}
                        onClick={() => handleAddMultiColumn(2)}
                        className="flex flex-col items-center justify-center p-2 bg-indigo-50/50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 rounded-xl text-indigo-700 dark:text-indigo-300 transition-all text-center group cursor-grab active:cursor-grabbing"
                        title="Click to add or drag directly to canvas"
                      >
                        <div className="flex gap-0.5 w-6 h-4 mb-1">
                          <div className="flex-1 bg-indigo-400/80 rounded-xs" />
                          <div className="flex-1 bg-indigo-400/80 rounded-xs" />
                        </div>
                        <span className="text-[10px] font-bold">2 Columns</span>
                      </button>

                      <button
                        type="button"
                        draggable={true}
                        onDragStart={(e) => {
                          e.dataTransfer.setData(DND_TYPES.PRESET, JSON.stringify({ preset: 'columns', count: 3 }));
                          e.dataTransfer.effectAllowed = 'copy';
                        }}
                        onClick={() => handleAddMultiColumn(3)}
                        className="flex flex-col items-center justify-center p-2 bg-indigo-50/50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 rounded-xl text-indigo-700 dark:text-indigo-300 transition-all text-center group cursor-grab active:cursor-grabbing"
                        title="Click to add or drag directly to canvas"
                      >
                        <div className="flex gap-0.5 w-6 h-4 mb-1">
                          <div className="flex-1 bg-indigo-400/80 rounded-xs" />
                          <div className="flex-1 bg-indigo-400/80 rounded-xs" />
                          <div className="flex-1 bg-indigo-400/80 rounded-xs" />
                        </div>
                        <span className="text-[10px] font-bold">3 Columns</span>
                      </button>

                      <button
                        type="button"
                        draggable={true}
                        onDragStart={(e) => {
                          e.dataTransfer.setData(DND_TYPES.PRESET, JSON.stringify({ preset: 'columns', count: 4 }));
                          e.dataTransfer.effectAllowed = 'copy';
                        }}
                        onClick={() => handleAddMultiColumn(4)}
                        className="flex flex-col items-center justify-center p-2 bg-indigo-50/50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 rounded-xl text-indigo-700 dark:text-indigo-300 transition-all text-center group cursor-grab active:cursor-grabbing"
                        title="Click to add or drag directly to canvas"
                      >
                        <div className="flex gap-0.5 w-6 h-4 mb-1">
                          <div className="flex-1 bg-indigo-400/80 rounded-xs" />
                          <div className="flex-1 bg-indigo-400/80 rounded-xs" />
                          <div className="flex-1 bg-indigo-400/80 rounded-xs" />
                          <div className="flex-1 bg-indigo-400/80 rounded-xs" />
                        </div>
                        <span className="text-[10px] font-bold">4 Columns</span>
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  {filteredComponents.map((item) => (
                    <button
                      key={item.type}
                      type="button"
                      draggable={true}
                      onDragStart={(e) => {
                        e.dataTransfer.setData(DND_TYPES.BLOCK_TYPE, item.type);
                        e.dataTransfer.setData('text/plain', item.type);
                        e.dataTransfer.effectAllowed = 'copy';
                      }}
                      onClick={() => handleAddComponent(item.type)}
                      className="flex flex-col items-center justify-center p-2.5 bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:border-indigo-300 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-300 hover:text-indigo-600 transition-all text-center group cursor-grab active:cursor-grabbing"
                      title="Click to add or drag directly to canvas"
                    >
                      <div className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/60 flex items-center justify-center mb-1.5 text-slate-600 dark:text-slate-300 group-hover:text-indigo-600 shadow-subtle">
                        <DynamicIcon name={item.icon} className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] font-semibold leading-tight">
                        {item.displayName}
                      </span>
                      <span className="text-[9px] text-slate-400 mt-0.5 capitalize">{item.category}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. Tab 2: Layers Tree */}
      {activeTabLeft === 'layers' && (
        <div className="flex-1 overflow-y-auto p-3">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Document Tree
            </span>
            <span className="text-[10px] text-slate-400">
              Click node to select
            </span>
          </div>
          {document && renderLayerNode(document.rootNode)}
        </div>
      )}

      {/* 5. Tab 3: Module-Specific Templates */}
      {activeTabLeft === 'templates' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Template filter pills */}
          <div className="p-3 border-b border-slate-100 dark:border-slate-800 space-y-2">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setTemplateFilter('module')}
                className={`flex-1 py-1 px-2 rounded-lg text-xs font-bold transition-all text-center ${
                  templateFilter === 'module'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {currentModule.shortName} Templates ({moduleTemplates.length})
              </button>
              <button
                type="button"
                onClick={() => setTemplateFilter('all')}
                className={`py-1 px-2 rounded-lg text-xs font-medium transition-all ${
                  templateFilter === 'all'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                All ({allTemplates.length})
              </button>
            </div>
            <p className="text-[10px] text-slate-500">
              {templateFilter === 'module'
                ? `Ready-to-use starting points designed specifically for ${currentModule.title}.`
                : 'Browse preconfigured templates across all FlowPilot modules.'}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {displayedTemplates.length === 0 ? (
              <div className="p-6 text-center text-slate-400 space-y-2">
                <LayoutTemplate className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
                <p className="text-xs font-medium">No templates found for this filter.</p>
                <button
                  type="button"
                  onClick={() => setTemplateFilter('all')}
                  className="text-xs text-indigo-600 font-bold hover:underline"
                >
                  View all templates →
                </button>
              </div>
            ) : (
              displayedTemplates.map((tpl) => (
                <div
                  key={tpl.id}
                  className="p-3 bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/30 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 rounded-xl transition-all group"
                >
                  {tpl.thumbnail && (
                    <div className="w-full h-24 rounded-lg overflow-hidden mb-2 bg-slate-200 dark:bg-slate-700">
                      <img src={tpl.thumbnail} alt={tpl.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-bold text-xs text-slate-800 dark:text-slate-100 truncate">{tpl.title}</span>
                    <span className="text-[9px] uppercase font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-1.5 py-0.5 rounded shrink-0">
                      {tpl.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-2.5">
                    {tpl.description}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Load "${tpl.title}" template? (This will replace the current canvas layout)`)) {
                        useEditorStore.getState().setDocument({
                          ...tpl.documentData,
                          id: document?.id || tpl.documentData.id,
                          projectId: document?.projectId || tpl.documentData.projectId,
                          title: document?.title || tpl.title,
                        });
                      }
                    }}
                    className="w-full py-1.5 bg-white dark:bg-slate-700 hover:bg-indigo-600 hover:text-white border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-bold text-indigo-600 dark:text-indigo-300 transition-all flex items-center justify-center gap-1 shadow-2xs"
                  >
                    <span>Apply Template</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 6. Tab 4: Project Assets */}
      {activeTabLeft === 'assets' && (
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">Project Assets</h4>
            <span className="text-[10px] text-slate-400">Click to insert</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {storage.getAssets().map((ast) => (
              <div
                key={ast.id}
                onClick={() => {
                  const imgNode: ComponentNode = {
                    id: `node_img_${Date.now()}`,
                    type: 'Image',
                    name: ast.name,
                    props: { src: ast.url, alt: ast.altText },
                    styles: { width: '100%', height: 'auto', borderRadius: '8px' },
                    children: [],
                  };
                  insertNode(selectedNodeId || document?.rootNode.id || '', imgNode);
                }}
                className="group relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-indigo-500 aspect-video bg-slate-100 dark:bg-slate-800 transition-all"
              >
                <img src={ast.url} alt={ast.altText} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold">
                  + Add Block
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
