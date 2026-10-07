import React, { useState } from 'react';
import { useEditorStore, LeftPanelTab } from '../store/useEditorStore';
import { COMPONENT_REGISTRY, DynamicIcon } from '../registry/componentRegistry';
import { ComponentNode } from '../../types/document';
import { storage } from '../../services/storage';
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
  Sparkles
} from 'lucide-react';

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
  } = useEditorStore();

  const [searchQuery, setSearchQuery] = useState('');

  const handleAddComponent = (type: string) => {
    if (!document) return;
    const def = COMPONENT_REGISTRY[type];
    if (!def) return;

    const newNode: ComponentNode = {
      id: `node_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type: def.type,
      name: def.displayName,
      props: JSON.parse(JSON.stringify(def.defaultProps)),
      styles: JSON.parse(JSON.stringify(def.defaultStyles)),
      children: [],
    };

    // If an element is selected and is container, insert inside; else insert into root
    const targetParentId = selectedNodeId || document.rootNode.id;
    insertNode(targetParentId, newNode);
  };

  // Layers Tree item recursive renderer
  const renderLayerNode = (node: ComponentNode, depth: number = 0) => {
    const isSelected = selectedNodeId === node.id;
    const isRoot = node.id === document?.rootNode.id;

    return (
      <div key={node.id} className="select-none">
        <div
          onClick={(e) => {
            e.stopPropagation();
            selectNode(node.id);
          }}
          style={{ paddingLeft: `${depth * 14 + 8}px` }}
          className={`flex items-center justify-between py-1.5 pr-2 rounded text-xs cursor-pointer transition-colors ${
            isSelected
              ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-semibold border-l-2 border-indigo-600'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          <div className="flex items-center gap-1.5 truncate">
            <span className="text-slate-400">
              {node.children.length > 0 ? '📁' : '📄'}
            </span>
            <span className="truncate">{node.name || node.type}</span>
          </div>

          {!isRoot && (
            <div className="flex items-center gap-1 opacity-0 hover:opacity-100 group-hover:opacity-100">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  duplicateNode(node.id);
                }}
                className="p-1 hover:text-indigo-600"
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
                className="p-1 hover:text-red-600"
                title="Delete"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {node.children.map((child) => renderLayerNode(child, depth + 1))}
      </div>
    );
  };

  const navTabs: { id: LeftPanelTab; label: string; icon: React.ReactNode }[] = [
    { id: 'components', label: 'Components', icon: <Box className="w-4 h-4" /> },
    { id: 'layers', label: 'Layers', icon: <Layers className="w-4 h-4" /> },
    { id: 'templates', label: 'Templates', icon: <LayoutTemplate className="w-4 h-4" /> },
    { id: 'assets', label: 'Assets', icon: <FolderOpen className="w-4 h-4" /> },
  ];

  const allComponents = Object.values(COMPONENT_REGISTRY);
  const filteredComponents = allComponents.filter(c => 
    c.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories = ['basic', 'layout', 'tour', 'interactive', 'marketing'] as const;

  return (
    <div className="w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full font-sans select-none transition-colors">
      {/* Panel Tab Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/90 p-1">
        {navTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTabLeft(tab.id)}
            className={`flex-1 flex flex-col items-center justify-center py-2 text-[11px] font-medium rounded transition-all ${
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

      {/* Tab 1: Components Palette */}
      {activeTabLeft === 'components' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Search bar */}
          <div className="p-3 border-b border-slate-100 dark:border-slate-800">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search components..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {categories.map((cat) => {
              const items = filteredComponents.filter(c => c.category === cat);
              if (items.length === 0) return null;

              return (
                <div key={cat}>
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                    {cat} Elements
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {items.map((item) => (
                      <button
                        key={item.type}
                        type="button"
                        onClick={() => handleAddComponent(item.type)}
                        className="flex flex-col items-center justify-center p-2.5 bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:border-indigo-200 dark:hover:border-indigo-800 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all text-center group"
                      >
                        <div className="w-7 h-7 rounded bg-white dark:bg-slate-700 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/60 flex items-center justify-center mb-1 text-slate-600 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 shadow-subtle">
                          <DynamicIcon name={item.icon} className="w-4 h-4" />
                        </div>
                        <span className="text-[11px] font-medium leading-tight">
                          {item.displayName}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Layers Tree */}
      {activeTabLeft === 'layers' && (
        <div className="flex-1 overflow-y-auto p-3">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Document Tree
            </span>
            <span className="text-[11px] text-slate-400">
              Click to select
            </span>
          </div>
          {document && renderLayerNode(document.rootNode)}
        </div>
      )}

      {/* Tab 3: Templates */}
      {activeTabLeft === 'templates' && (
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Premade Templates</h4>
          <p className="text-[11px] text-slate-500 mb-3">Insert pre-configured experiences or layouts.</p>
          {storage.getTemplates().map((tpl) => (
            <div
              key={tpl.id}
              className="p-2.5 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer transition-colors"
              onClick={() => {
                if (window.confirm(`Load "${tpl.title}" template? (This will update the canvas)`)) {
                  useEditorStore.getState().setDocument({
                    ...tpl.documentData,
                    id: document?.id || tpl.documentData.id,
                    projectId: document?.projectId || tpl.documentData.projectId,
                    title: document?.title || tpl.title,
                  });
                }
              }}
            >
              <div className="font-semibold text-xs text-slate-800 dark:text-slate-100 mb-1">{tpl.title}</div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">{tpl.description}</p>
              <div className="mt-2 flex items-center justify-between text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">
                <span className="capitalize bg-indigo-50 dark:bg-indigo-950 px-1.5 py-0.5 rounded">{tpl.category}</span>
                <span>Apply Template →</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 4: Assets */}
      {activeTabLeft === 'assets' && (
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Project Media</h4>
          <p className="text-[11px] text-slate-500 mb-3">Click to add image to the canvas.</p>
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
                className="group relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-indigo-500 aspect-video bg-slate-100 dark:bg-slate-800"
              >
                <img src={ast.url} alt={ast.altText} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-semibold">
                  + Add to Canvas
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
