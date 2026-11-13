import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Check, Code, Copy, Download, Edit3, Eye, Layers, LayoutTemplate, Palette, Plus, RotateCcw,
  Search, Settings2, Sparkles, Trash2, Upload, X,
} from 'lucide-react';
import { MODULE_LIST, MODULES } from '../../core/modules';
import { DocContent, DocNode, DocumentKind, ProjectType, Theme } from '../../core/schema';
import { defaultValues, VariableDef } from '../../core/variables';
import { ExperienceView } from '../../renderer/ExperienceView';
import {
  getCustomTemplates, getTemplateOverrides, projectFromTemplate, removeCustomTemplate, removeTemplateOverride,
  resetAllTemplateOverrides, saveCustomTemplate, saveTemplateOverride, subscribeToTemplateChanges,
  TEMPLATES, TemplateDefinition, TemplatePage, ThemePreset,
} from '../../templates';
import { ROUTES } from '../routes';
import { useServices } from '../session';
import { cardClass, EmptyState, inputClass, primaryButton, secondaryButton } from '../shared/ui';
import { useWorkspace } from '../workspace';

// ---- Preview Modal ----------------------------------------------------------

const TemplatePreviewModal: React.FC<{
  template: TemplateDefinition;
  onClose: () => void;
}> = ({ template, onClose }) => {
  const [activeSlug, setActiveSlug] = useState<string>(template.pages[0]?.slug ?? '');
  const activePage = template.pages.find((p) => p.slug === activeSlug) ?? template.pages[0];
  const activeTheme = template.themes[0]?.theme ?? {
    primary: '#4f46e5', secondary: '#0f172a', background: '#ffffff', surface: '#f8fafc',
    text: '#0f172a', muted: '#64748b', radius: '8px', fontHeading: 'Inter', fontBody: 'Inter',
  };
  const variables = useMemo(() => defaultValues(template.variables), [template]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
      <div className="relative w-full max-w-5xl h-[85vh] flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Header Bar */}
        <div className="h-14 shrink-0 px-6 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="font-bold text-slate-900 dark:text-white truncate max-w-md">
              Preview: {template.title}
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-semibold uppercase">
              {template.type}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Page Tabs */}
            {template.pages.length > 1 && (
              <div className="flex items-center gap-1 bg-slate-200/60 dark:bg-slate-800/60 p-1 rounded-lg">
                {template.pages.map((page) => (
                  <button
                    key={page.slug}
                    type="button"
                    onClick={() => setActiveSlug(page.slug)}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                      activeSlug === page.slug
                        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {page.title || (page.slug === '' ? 'Home' : page.slug)}
                  </button>
                ))}
              </div>
            )}
            <button
              type="button"
              aria-label="Close preview"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live Canvas */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-100 dark:bg-slate-950/50">
          <div className="w-full min-h-full rounded-xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            {activePage && (
              <ExperienceView
                documents={[activePage.content]}
                theme={activeTheme}
                variables={variables}
                ctx={{ mode: 'preview' }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ---- Template Editor Modal --------------------------------------------------

interface EditableTemplate {
  id: string;
  type: ProjectType;
  title: string;
  description: string;
  category: string;
  tags: string;
  titleVariable: string;
  theme: Theme;
  variables: VariableDef[];
  pages: TemplatePage[];
}

const TemplateEditModal: React.FC<{
  template: TemplateDefinition;
  isCustom?: boolean;
  onSave: (updated: TemplateDefinition) => void;
  onOpenInEditor?: (template: TemplateDefinition) => void;
  onClose: () => void;
}> = ({ template, isCustom, onSave, onOpenInEditor, onClose }) => {
  const [activeTab, setActiveTab] = useState<'info' | 'theme' | 'variables' | 'pages'>('info');

  const initialTheme = template.themes[0]?.theme ?? {
    primary: '#4f46e5', secondary: '#0f172a', background: '#ffffff', surface: '#f8fafc',
    text: '#0f172a', muted: '#64748b', radius: '8px', fontHeading: 'Inter', fontBody: 'Inter',
  };

  const [form, setForm] = useState<EditableTemplate>({
    id: template.id,
    type: template.type,
    title: template.title,
    description: template.description,
    category: template.category ?? 'General',
    tags: template.tags.join(', '),
    titleVariable: template.titleVariable ?? '',
    theme: { ...initialTheme },
    variables: structuredClone(template.variables),
    pages: structuredClone(template.pages),
  });

  const [newVarKey, setNewVarKey] = useState('');
  const [newVarLabel, setNewVarLabel] = useState('');
  const [newVarType, setNewVarType] = useState('text');
  const [newVarGroup, setNewVarGroup] = useState('Content');
  const [newVarDefault, setNewVarDefault] = useState('');

  const [jsonError, setJsonError] = useState<string | null>(null);

  const handleSave = () => {
    const tagsArray = form.tags.split(',').map((t) => t.trim()).filter(Boolean);
    const updated: TemplateDefinition = {
      ...template,
      title: form.title.trim() || template.title,
      description: form.description.trim() || template.description,
      category: form.category.trim() || template.category,
      tags: tagsArray.length > 0 ? tagsArray : template.tags,
      titleVariable: form.titleVariable.trim() || undefined,
      themes: [{ name: 'Custom Theme', theme: form.theme }],
      variables: form.variables,
      pages: form.pages,
    };
    onSave(updated);
  };

  const handleAddVariable = () => {
    const key = newVarKey.trim();
    if (!key) return;
    if (form.variables.some((v) => v.key === key)) {
      alert(`Variable with key "${key}" already exists.`);
      return;
    }
    const newVar: VariableDef = {
      key,
      label: newVarLabel.trim() || key,
      type: newVarType as VariableDef['type'],
      group: newVarGroup.trim() || 'Content',
      default: newVarDefault,
    };
    setForm((prev) => ({ ...prev, variables: [...prev.variables, newVar] }));
    setNewVarKey('');
    setNewVarLabel('');
    setNewVarDefault('');
  };

  const handleRemoveVariable = (key: string) => {
    setForm((prev) => ({ ...prev, variables: prev.variables.filter((v) => v.key !== key) }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl h-[90vh] flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden font-sans">
        {/* Header */}
        <div className="h-16 shrink-0 px-6 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">
                Edit Template: {template.title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                ID: {template.id} · Type: {template.type}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenInEditor && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenInEditor(template);
                }}
                className={`${secondaryButton} !px-3 !py-2 text-xs flex items-center gap-1.5`}
                title="Launch visual Studio canvas editor for this template"
              >
                <LayoutTemplate className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                Open in Studio Canvas
              </button>
            )}
            <button
              type="button"
              onClick={handleSave}
              className={`${primaryButton} !px-4 !py-2 text-xs`}
            >
              <Check className="w-4 h-4 mr-1.5" />
              Save Changes
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 gap-6 bg-slate-50/50 dark:bg-slate-950/30">
          {[
            { id: 'info', label: 'Basic Info', icon: Settings2 },
            { id: 'theme', label: 'Theme & Colors', icon: Palette },
            { id: 'variables', label: `Variables (${form.variables.length})`, icon: Sparkles },
            { id: 'pages', label: `Pages (${form.pages.length})`, icon: Layers },
          ].map((tab) => {
            const IconComponent = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 py-3 text-sm font-semibold border-b-2 transition-colors ${
                  active
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <IconComponent className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: BASIC INFO */}
          {activeTab === 'info' && (
            <div className="space-y-4 max-w-2xl">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Template Title
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    Industry / Category
                  </label>
                  <input
                    type="text"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className={inputClass}
                    placeholder="e.g. Developer Tools, FinTech, AI"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    Title Variable Key
                  </label>
                  <input
                    type="text"
                    value={form.titleVariable}
                    onChange={(e) => setForm({ ...form, titleVariable: e.target.value })}
                    className={inputClass}
                    placeholder="e.g. brand.name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  className={inputClass}
                  placeholder="e.g. apidog, devtools, api, testing"
                />
              </div>
            </div>
          )}

          {/* TAB 2: THEME & COLORS */}
          {activeTab === 'theme' && (
            <div className="space-y-6 max-w-2xl">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Primary Accent Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={form.theme.primary}
                      onChange={(e) => setForm({ ...form, theme: { ...form.theme, primary: e.target.value } })}
                      className="w-10 h-10 rounded-lg cursor-pointer border border-slate-300 dark:border-slate-700"
                    />
                    <input
                      type="text"
                      value={form.theme.primary}
                      onChange={(e) => setForm({ ...form, theme: { ...form.theme, primary: e.target.value } })}
                      className={`${inputClass} font-mono`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Secondary Accent Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={form.theme.secondary}
                      onChange={(e) => setForm({ ...form, theme: { ...form.theme, secondary: e.target.value } })}
                      className="w-10 h-10 rounded-lg cursor-pointer border border-slate-300 dark:border-slate-700"
                    />
                    <input
                      type="text"
                      value={form.theme.secondary}
                      onChange={(e) => setForm({ ...form, theme: { ...form.theme, secondary: e.target.value } })}
                      className={`${inputClass} font-mono`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Background Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={form.theme.background}
                      onChange={(e) => setForm({ ...form, theme: { ...form.theme, background: e.target.value } })}
                      className="w-10 h-10 rounded-lg cursor-pointer border border-slate-300 dark:border-slate-700"
                    />
                    <input
                      type="text"
                      value={form.theme.background}
                      onChange={(e) => setForm({ ...form, theme: { ...form.theme, background: e.target.value } })}
                      className={`${inputClass} font-mono`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Surface Card Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={form.theme.surface}
                      onChange={(e) => setForm({ ...form, theme: { ...form.theme, surface: e.target.value } })}
                      className="w-10 h-10 rounded-lg cursor-pointer border border-slate-300 dark:border-slate-700"
                    />
                    <input
                      type="text"
                      value={form.theme.surface}
                      onChange={(e) => setForm({ ...form, theme: { ...form.theme, surface: e.target.value } })}
                      className={`${inputClass} font-mono`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Corner Radius
                  </label>
                  <select
                    value={form.theme.radius}
                    onChange={(e) => setForm({ ...form, theme: { ...form.theme, radius: e.target.value } })}
                    className={inputClass}
                  >
                    <option value="0px">Square (0px)</option>
                    <option value="6px">Small (6px)</option>
                    <option value="8px">Medium (8px)</option>
                    <option value="12px">Rounded (12px)</option>
                    <option value="16px">Large (16px)</option>
                    <option value="9999px">Pill (9999px)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Heading Font
                  </label>
                  <select
                    value={form.theme.fontHeading}
                    onChange={(e) => setForm({ ...form, theme: { ...form.theme, fontHeading: e.target.value } })}
                    className={inputClass}
                  >
                    <option value="Space Grotesk">Space Grotesk (Apidog Cyberpunk)</option>
                    <option value="Plus Jakarta Sans">Plus Jakarta Sans</option>
                    <option value="Outfit">Outfit</option>
                    <option value="Inter">Inter</option>
                    <option value="Manrope">Manrope</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: VARIABLES MANAGER */}
          {activeTab === 'variables' && (
            <div className="space-y-6">
              {/* Add Variable Form */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  + Add New Variable
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <input
                    type="text"
                    placeholder="Key (e.g. brand.phone)"
                    value={newVarKey}
                    onChange={(e) => setNewVarKey(e.target.value)}
                    className={inputClass}
                  />
                  <input
                    type="text"
                    placeholder="Label (e.g. Phone Number)"
                    value={newVarLabel}
                    onChange={(e) => setNewVarLabel(e.target.value)}
                    className={inputClass}
                  />
                  <select
                    value={newVarType}
                    onChange={(e) => setNewVarType(e.target.value)}
                    className={inputClass}
                  >
                    <option value="text">Text</option>
                    <option value="longtext">Long Text</option>
                    <option value="number">Number</option>
                    <option value="email">Email</option>
                    <option value="image">Image</option>
                    <option value="video">Video</option>
                    <option value="url">URL</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Group (e.g. Contact)"
                    value={newVarGroup}
                    onChange={(e) => setNewVarGroup(e.target.value)}
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={handleAddVariable}
                    className={`${primaryButton} !px-3 !py-2 text-xs`}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </button>
                </div>
              </div>

              {/* Variables Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-4 py-3">Key</th>
                      <th className="px-4 py-3">Label</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Group</th>
                      <th className="px-4 py-3">Default Value</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                    {form.variables.map((variable) => (
                      <tr key={variable.key} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                        <td className="px-4 py-2.5 font-bold text-indigo-600 dark:text-indigo-400">
                          {variable.key}
                        </td>
                        <td className="px-4 py-2.5 font-sans">
                          {variable.label}
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {variable.type}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 font-sans text-slate-500">
                          {variable.group || '—'}
                        </td>
                        <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400 truncate max-w-xs font-sans">
                          {typeof variable.default === 'string' ? variable.default : JSON.stringify(variable.default ?? '')}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveVariable(variable.key)}
                            className="p-1 rounded text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                            title="Delete variable"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: PAGES & CONTENT */}
          {activeTab === 'pages' && (
            <div className="space-y-6">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Inspect and update pages included in this template. Each page contains structured block nodes.
              </p>
              <div className="grid gap-4">
                {form.pages.map((page, index) => (
                  <div key={index} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                          {page.kind}
                        </span>
                        <span className="font-semibold text-sm text-slate-900 dark:text-white">
                          {page.title}
                        </span>
                        <span className="text-xs font-mono text-slate-400">
                          slug: {page.slug || '/'}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500 font-mono">
                        {Object.keys(page.content.nodes).length} nodes
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 mb-1">Page Title</label>
                        <input
                          type="text"
                          value={page.title}
                          onChange={(e) => {
                            const newPages = [...form.pages];
                            newPages[index] = { ...newPages[index], title: e.target.value };
                            setForm({ ...form, pages: newPages });
                          }}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 mb-1">Slug</label>
                        <input
                          type="text"
                          value={page.slug}
                          onChange={(e) => {
                            const newPages = [...form.pages];
                            newPages[index] = { ...newPages[index], slug: e.target.value };
                            setForm({ ...form, pages: newPages });
                          }}
                          className={inputClass}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ---- Main Templates Management Tab in Super Admin ---------------------------

export const TemplatesManagementTab: React.FC = () => {
  const { projects } = useServices();
  const { workspace } = useWorkspace();
  const navigate = useNavigate();
  const [openingId, setOpeningId] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const [overrides, setOverrides] = useState<Record<string, Partial<TemplateDefinition>>>(getTemplateOverrides);
  const [customList, setCustomList] = useState<TemplateDefinition[]>(getCustomTemplates);

  const [previewTemplate, setPreviewTemplate] = useState<TemplateDefinition | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<TemplateDefinition | null>(null);

  const handleOpenInEditor = async (template: TemplateDefinition) => {
    if (!workspace) {
      alert('No workspace selected.');
      return;
    }
    setOpeningId(template.id);
    try {
      const activeTheme = template.themes[0]?.theme ?? {
        primary: '#4f46e5', secondary: '#0f172a', background: '#ffffff', surface: '#f8fafc',
        text: '#0f172a', muted: '#64748b', radius: '8px', fontHeading: 'Inter', fontBody: 'Inter',
      };
      const initialValues = defaultValues(template.variables);
      const newProj = projectFromTemplate(
        template,
        workspace.organizationId,
        initialValues,
        activeTheme,
        `[Template] ${template.title}`,
      );
      newProj.settings = {
        ...newProj.settings,
        editingTemplateId: template.id,
      };
      const projectId = await projects.create(newProj);
      navigate(ROUTES.studio(projectId), {
        state: {
          editingTemplateId: template.id,
          editingTemplateTitle: template.title,
        },
      });
    } catch (err) {
      console.error('Failed to open template in editor:', err);
      alert('Could not launch editor for this template.');
    } finally {
      setOpeningId(null);
    }
  };

  // Sync with template store changes
  useEffect(() => {
    const update = () => {
      setOverrides(getTemplateOverrides());
      setCustomList(getCustomTemplates());
    };
    return subscribeToTemplateChanges(update);
  }, []);

  // Compute all effective templates
  const allTemplates = useMemo(() => {
    const list: TemplateDefinition[] = [];
    // Built-ins (with overrides applied)
    for (const base of TEMPLATES) {
      if (overrides[base.id]) {
        list.push({ ...base, ...overrides[base.id] });
      } else {
        list.push(base);
      }
    }
    // Custom templates created by super admin
    for (const custom of customList) {
      if (overrides[custom.id]) {
        list.push({ ...custom, ...overrides[custom.id] });
      } else {
        list.push(custom);
      }
    }
    return list;
  }, [overrides, customList]);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    allTemplates.forEach((t) => t.category && set.add(t.category));
    return Array.from(set).sort();
  }, [allTemplates]);

  // Filtered templates
  const filtered = useMemo(() => {
    return allTemplates.filter((t) => {
      if (selectedType !== 'all' && t.type !== selectedType) return false;
      if (selectedCategory !== 'all' && t.category !== selectedCategory) return false;
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchTitle = t.title.toLowerCase().includes(query);
        const matchDesc = t.description.toLowerCase().includes(query);
        const matchId = t.id.toLowerCase().includes(query);
        const matchTag = t.tags.some((tag) => tag.toLowerCase().includes(query));
        if (!matchTitle && !matchDesc && !matchId && !matchTag) return false;
      }
      return true;
    });
  }, [allTemplates, selectedType, selectedCategory, search]);

  const handleSaveEdit = (updated: TemplateDefinition) => {
    saveTemplateOverride(updated.id, updated);
    setOverrides(getTemplateOverrides());
    setEditingTemplate(null);
  };

  const handleResetOverride = (id: string) => {
    if (confirm('Revert this template back to factory defaults? Any custom edits will be undone.')) {
      removeTemplateOverride(id);
      setOverrides(getTemplateOverrides());
    }
  };

  const handleDuplicate = (template: TemplateDefinition) => {
    const newId = `custom-${template.type}-${Date.now().toString(36)}`;
    const cloned: TemplateDefinition = {
      ...structuredClone(template),
      id: newId,
      title: `${template.title} (Clone)`,
    };
    saveCustomTemplate(cloned);
    setCustomList(getCustomTemplates());
  };

  const handleDeleteCustom = (id: string) => {
    if (confirm('Delete this custom template permanently?')) {
      removeCustomTemplate(id);
      removeTemplateOverride(id);
      setCustomList(getCustomTemplates());
      setOverrides(getTemplateOverrides());
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className={`${cardClass} p-4`}>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Templates</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{allTemplates.length}</p>
        </div>
        <div className={`${cardClass} p-4`}>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Website Industries</p>
          <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
            {allTemplates.filter((t) => t.type === 'website').length}
          </p>
        </div>
        <div className={`${cardClass} p-4`}>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Super Admin Edits</p>
          <p className="text-2xl font-bold text-amber-500 mt-1">{Object.keys(overrides).length}</p>
        </div>
        <div className={`${cardClass} p-4`}>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Custom Templates</p>
          <p className="text-2xl font-bold text-emerald-500 mt-1">{customList.length}</p>
        </div>
      </div>

      {/* Control Bar: Search & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search templates by title, tag, or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`${inputClass} !pl-9`}
            />
          </div>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className={`${inputClass} !w-auto`}
          >
            <option value="all">All Types</option>
            {MODULE_LIST.map((m) => (
              <option key={m.type} value={m.type}>
                {m.plural}
              </option>
            ))}
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className={`${inputClass} !w-auto`}
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          {Object.keys(overrides).length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (confirm('Reset all super admin overrides back to built-in factory defaults?')) {
                  resetAllTemplateOverrides();
                  setOverrides({});
                }
              }}
              className={`${secondaryButton} !text-xs !py-1.5`}
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              Reset All Edits
            </button>
          )}
        </div>
      </div>

      {/* Templates Grid */}
      {filtered.length === 0 ? (
        <EmptyState title="No templates match your filters" icon="LayoutTemplate">
          Try adjusting your search query or category filter.
        </EmptyState>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((template) => {
            const isOverridden = Boolean(overrides[template.id]);
            const isCustom = template.id.startsWith('custom-');

            return (
              <div
                key={template.id}
                className={`${cardClass} p-5 flex flex-col justify-between hover:border-indigo-400 dark:hover:border-indigo-600 transition-all shadow-sm`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      {template.type}
                    </span>
                    <div className="flex items-center gap-1">
                      {isOverridden && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          Modified
                        </span>
                      )}
                      {isCustom && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          Custom
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="font-bold text-slate-900 dark:text-white text-base leading-tight mb-1">
                    {template.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">
                    {template.description}
                  </p>

                  <div className="flex items-center gap-2 mb-4 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                      {template.category || 'General'}
                    </span>
                    <span>·</span>
                    <span>{template.pages.length} pages</span>
                    <span>·</span>
                    <span>{template.variables.length} vars</span>
                  </div>

                  {/* Tag Pills */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {template.tags.slice(0, 4).map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                      >
                        #{tag}
                      </span>
                    ))}
                    {template.tags.length > 4 && (
                      <span className="text-[10px] px-1 py-0.5 text-slate-400">
                        +{template.tags.length - 4}
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setPreviewTemplate(template)}
                      className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Preview template"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDuplicate(template)}
                      className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Duplicate as new custom template"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    {isOverridden && (
                      <button
                        type="button"
                        onClick={() => handleResetOverride(template.id)}
                        className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors"
                        title="Revert modifications to original"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    )}
                    {isCustom && (
                      <button
                        type="button"
                        onClick={() => handleDeleteCustom(template.id)}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="Delete custom template"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenInEditor(template)}
                      disabled={openingId === template.id}
                      className={`${primaryButton} !px-2.5 !py-1.5 !text-xs flex items-center gap-1`}
                      title="Open and visually update this template in Studio Canvas"
                    >
                      <LayoutTemplate className="w-3.5 h-3.5" />
                      {openingId === template.id ? 'Opening...' : 'Open Editor'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingTemplate(template)}
                      className={`${secondaryButton} !px-2.5 !py-1.5 !text-xs flex items-center gap-1`}
                      title="Edit template settings, variables, and properties"
                    >
                      <Settings2 className="w-3.5 h-3.5" />
                      Config
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Preview Modal */}
      {previewTemplate && (
        <TemplatePreviewModal
          template={previewTemplate}
          onClose={() => setPreviewTemplate(null)}
        />
      )}

      {/* Editor Modal */}
      {editingTemplate && (
        <TemplateEditModal
          template={editingTemplate}
          isCustom={editingTemplate.id.startsWith('custom-')}
          onSave={handleSaveEdit}
          onOpenInEditor={handleOpenInEditor}
          onClose={() => setEditingTemplate(null)}
        />
      )}
    </div>
  );
};

