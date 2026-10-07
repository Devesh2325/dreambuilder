import React, { useState } from 'react';
import { useAuth } from '../../services/authContext';
import { useTheme } from '../../services/themeContext';
import { 
  Sparkles, 
  Upload, 
  Check, 
  Palette, 
  Type, 
  Layers, 
  Sliders, 
  Eye, 
  RefreshCw, 
  Building2, 
  Compass, 
  Megaphone, 
  ArrowRight,
  Sun,
  Moon
} from 'lucide-react';
import { storage } from '../../services/storage';

const FONT_OPTIONS = [
  { name: 'Inter', category: 'Modern & Clean', font: 'Inter, sans-serif' },
  { name: 'Plus Jakarta Sans', category: 'SaaS & Crisp', font: '"Plus Jakarta Sans", sans-serif' },
  { name: 'Poppins', category: 'Geometric & Friendly', font: 'Poppins, sans-serif' },
  { name: 'Outfit', category: 'Trendy & Rounded', font: 'Outfit, sans-serif' },
  { name: 'DM Sans', category: 'Minimal & Neutral', font: '"DM Sans", sans-serif' },
  { name: 'Roboto', category: 'Standard & Tech', font: 'Roboto, sans-serif' },
  { name: 'Space Grotesk', category: 'Dynamic & Bold', font: '"Space Grotesk", sans-serif' },
  { name: 'Playfair Display', category: 'Editorial & Luxury', font: '"Playfair Display", serif' },
];

const BRAND_TYPES = [
  { id: 'SaaS & Web App', label: 'SaaS & Web App', icon: '💻', desc: 'B2B/B2C software platforms, analytics dashboards' },
  { id: 'E-commerce & Store', label: 'E-commerce & Store', icon: '🛍️', desc: 'Online shopping, product catalogs, retail' },
  { id: 'Mobile App & Tech', label: 'Mobile App & Tech', icon: '📱', desc: 'Mobile-first apps, progressive web apps' },
  { id: 'Agency & Studio', label: 'Agency & Studio', icon: '🎨', desc: 'Creative design, marketing, client portals' },
  { id: 'Community & Media', label: 'Community & Media', icon: '🚀', desc: 'Newsletters, blogs, developer forums' },
  { id: 'Fintech & Enterprise', label: 'Fintech & Enterprise', icon: '🏦', desc: 'Financial services, security, enterprise portals' },
];

const PRESET_PALETTES = [
  { name: 'Flow Indigo', primary: '#6366f1', secondary: '#4f46e5', accent: '#10b981', bg: '#ffffff' },
  { name: 'Electric Violet', primary: '#8b5cf6', secondary: '#7c3aed', accent: '#f59e0b', bg: '#ffffff' },
  { name: 'Ocean Cyan', primary: '#0284c7', secondary: '#0369a1', accent: '#06b6d4', bg: '#ffffff' },
  { name: 'Emerald Growth', primary: '#059669', secondary: '#047857', accent: '#3b82f6', bg: '#ffffff' },
  { name: 'Midnight Onyx', primary: '#0f172a', secondary: '#1e293b', accent: '#6366f1', bg: '#ffffff' },
  { name: 'Rose Sunset', primary: '#e11d48', secondary: '#be123c', accent: '#f43f5e', bg: '#ffffff' },
];

const RADIUS_OPTIONS = [
  { label: 'Sharp (0px)', value: 0 },
  { label: 'Subtle (4px)', value: 4 },
  { label: 'Smooth (8px)', value: 8 },
  { label: 'Modern (12px)', value: 12 },
  { label: 'Pill (20px)', value: 20 },
];

export const BrandPage: React.FC = () => {
  const { organization, updateBranding } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [companyName, setCompanyName] = useState(organization.branding?.companyName || organization.name);
  const [logoUrl, setLogoUrl] = useState(organization.branding?.logoUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80');
  const [brandType, setBrandType] = useState(organization.branding?.brandType || 'SaaS & Web App');
  const [fontFamily, setFontFamily] = useState(organization.branding?.fontFamily || 'Inter');
  const [baseFontSize, setBaseFontSize] = useState(organization.branding?.baseFontSize || 16);
  const [primaryColor, setPrimaryColor] = useState(organization.branding?.primaryColor || '#6366f1');
  const [secondaryColor, setSecondaryColor] = useState(organization.branding?.secondaryColor || '#4f46e5');
  const [accentColor, setAccentColor] = useState(organization.branding?.accentColor || '#10b981');
  const [backgroundColor, setBackgroundColor] = useState(organization.branding?.backgroundColor || '#ffffff');
  const [borderRadius, setBorderRadius] = useState(organization.branding?.borderRadius || 8);
  
  const [isSaved, setIsSaved] = useState(false);
  const [previewTab, setPreviewTab] = useState<'tour' | 'banner' | 'modal'>('tour');
  const [previewTheme, setPreviewTheme] = useState<'light' | 'dark'>(theme);

  const handleSave = () => {
    updateBranding({
      companyName,
      logoUrl,
      brandType,
      fontFamily,
      baseFontSize,
      primaryColor,
      secondaryColor,
      accentColor,
      backgroundColor,
      borderRadius,
    });

    // Also update all documents in storage with new brand variables
    const documents = storage.getAllDocuments();
    documents.forEach((doc: any) => {
      storage.saveDocument({
        ...doc,
        themeVariables: {
          ...doc.themeVariables,
          primaryColor,
          secondaryColor,
          fontFamily,
          borderRadius: `${borderRadius}px`,
        },
      });
    });

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleApplyPreset = (p: typeof PRESET_PALETTES[0]) => {
    setPrimaryColor(p.primary);
    setSecondaryColor(p.secondary);
    setAccentColor(p.accent);
    setBackgroundColor(p.bg);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 font-sans">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">
              Organization Theme & Identity
            </span>
            <span className="text-xs text-slate-400">Workspace: {organization.name}</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Brand Kit & Design System
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Configure your brand logo, type, typography, font sizes, and color palette. All product tours, in-app banners, navigation menus, and popups automatically adopt these tokens.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all ${
              isSaved
                ? 'bg-emerald-600 text-white'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow-indigo-500/25'
            }`}
          >
            {isSaved ? <Check className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
            <span>{isSaved ? 'Brand Kit Saved & Synced!' : 'Save Brand Settings'}</span>
          </button>
        </div>
      </div>

      {/* Grid Layout: Config on Left, Live Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Configuration Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Card 1: Logo & Company Identity */}
          <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-subtle space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Logo & Company Identity
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Brand / Company Name
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. FlowPilot AI"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Logo Image URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://..."
                    className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <div className="w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 flex items-center justify-center p-1">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                    ) : (
                      <span className="text-xs font-bold text-slate-400">{companyName.charAt(0)}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Brand Type Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Brand Type / Industry Segment
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {BRAND_TYPES.map((bt) => {
                  const isSelected = brandType === bt.id;
                  return (
                    <button
                      key={bt.id}
                      type="button"
                      onClick={() => setBrandType(bt.id)}
                      className={`p-3 text-left rounded-xl border transition-all text-xs ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500/20'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="text-base mb-1">{bt.icon}</div>
                      <div className="font-bold truncate">{bt.label}</div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">{bt.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Card 2: Typography & Font Sizing */}
          <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-subtle space-y-5">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Type className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Brand Typography & Base Size
            </h2>

            {/* Font Family Selection Grid */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Primary Font Family
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {FONT_OPTIONS.map((font) => {
                  const isSelected = fontFamily === font.name;
                  return (
                    <button
                      key={font.name}
                      type="button"
                      onClick={() => setFontFamily(font.name)}
                      className={`p-3 text-left rounded-xl border transition-all ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500/20'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                      }`}
                      style={{ fontFamily: font.font }}
                    >
                      <div className="text-base font-bold">Aa</div>
                      <div className="text-xs font-semibold truncate mt-1">{font.name}</div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{font.category}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Font Size & Stepper */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Base Body Font Size
                  </label>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded">
                    {baseFontSize}px
                  </span>
                </div>
                <input
                  type="range"
                  min="12"
                  max="22"
                  step="1"
                  value={baseFontSize}
                  onChange={(e) => setBaseFontSize(Number(e.target.value))}
                  className="w-full accent-indigo-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>12px Compact</span>
                  <span>16px Standard</span>
                  <span>22px Large</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Border Radius Style
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                  {RADIUS_OPTIONS.map((r) => {
                    const isSelected = borderRadius === r.value;
                    return (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => setBorderRadius(r.value)}
                        className={`py-2 px-1 text-center rounded-lg border text-xs font-medium transition-all ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-600 text-white font-bold'
                            : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        {r.value}px
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Color Palette System */}
          <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-subtle space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Palette className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Brand Color Palette
              </h2>
            </div>

            {/* Presets */}
            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-2">
                Curated Palette Presets:
              </span>
              <div className="flex flex-wrap gap-2">
                {PRESET_PALETTES.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-500 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 transition-all"
                  >
                    <div className="flex -space-x-1">
                      <span className="w-3 h-3 rounded-full border border-white dark:border-slate-900" style={{ backgroundColor: preset.primary }} />
                      <span className="w-3 h-3 rounded-full border border-white dark:border-slate-900" style={{ backgroundColor: preset.accent }} />
                    </div>
                    <span>{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Individual Color Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              {/* Primary Color */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Primary Brand Color
                </label>
                <div className="flex items-center gap-2 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent p-0"
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-full bg-transparent text-xs font-mono font-semibold text-slate-800 dark:text-slate-200 focus:outline-none uppercase"
                  />
                </div>
              </div>

              {/* Secondary Color */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Secondary Color
                </label>
                <div className="flex items-center gap-2 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                  <input
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent p-0"
                  />
                  <input
                    type="text"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="w-full bg-transparent text-xs font-mono font-semibold text-slate-800 dark:text-slate-200 focus:outline-none uppercase"
                  />
                </div>
              </div>

              {/* Accent Color */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Accent / Callout Color
                </label>
                <div className="flex items-center gap-2 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent p-0"
                  />
                  <input
                    type="text"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="w-full bg-transparent text-xs font-mono font-semibold text-slate-800 dark:text-slate-200 focus:outline-none uppercase"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Interactive Brand Preview Card (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="sticky top-6 p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-card space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span className="font-bold text-sm text-slate-900 dark:text-white">Live Brand Preview</span>
              </div>

              {/* Preview Light/Dark Switch */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setPreviewTheme('light')}
                  className={`p-1 rounded text-xs transition-colors ${previewTheme === 'light' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
                  title="Preview Light Mode"
                >
                  <Sun className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTheme('dark')}
                  className={`p-1 rounded text-xs transition-colors ${previewTheme === 'dark' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400'}`}
                  title="Preview Dark Mode"
                >
                  <Moon className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Experience Type Preview Switcher */}
            <div className="flex gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setPreviewTab('tour')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  previewTab === 'tour'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Tour Tooltip
              </button>
              <button
                type="button"
                onClick={() => setPreviewTab('banner')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  previewTab === 'banner'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Banner
              </button>
              <button
                type="button"
                onClick={() => setPreviewTab('modal')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  previewTab === 'modal'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Modal Popup
              </button>
            </div>

            {/* Interactive Preview Canvas Window */}
            <div 
              className={`p-6 rounded-xl border transition-all ${
                previewTheme === 'dark' 
                  ? 'bg-slate-950 border-slate-800 text-slate-100' 
                  : 'bg-slate-50 border-slate-200 text-slate-900'
              }`}
              style={{ fontFamily }}
            >
              {/* Tour Tooltip Component Preview */}
              {previewTab === 'tour' && (
                <div 
                  className="shadow-xl border p-5 max-w-sm mx-auto transition-all"
                  style={{
                    backgroundColor: previewTheme === 'dark' ? '#1e293b' : '#ffffff',
                    borderColor: previewTheme === 'dark' ? '#334155' : '#e2e8f0',
                    borderRadius: `${borderRadius}px`,
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: accentColor }} />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Step 1 of 4 • {brandType}
                      </span>
                    </div>
                    <span 
                      className="text-xs px-2 py-0.5 font-bold text-white rounded-full" 
                      style={{ backgroundColor: primaryColor }}
                    >
                      New
                    </span>
                  </div>

                  <h3 
                    className="font-extrabold mb-1.5 leading-snug"
                    style={{ fontSize: `${baseFontSize + 3}px` }}
                  >
                    Welcome to {companyName}!
                  </h3>
                  <p 
                    className="text-slate-500 dark:text-slate-400 mb-4 leading-relaxed"
                    style={{ fontSize: `${baseFontSize - 2}px` }}
                  >
                    This is a live preview of how your users will experience product walkthroughs, guided hints, and tooltips with your selected brand typography.
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button 
                      type="button" 
                      className="text-xs font-semibold text-slate-400 hover:text-slate-600"
                    >
                      Skip Tour
                    </button>
                    <button
                      type="button"
                      className="flex items-center gap-1.5 px-4 py-2 text-white font-bold text-xs shadow-sm transition-transform active:scale-95"
                      style={{
                        backgroundColor: primaryColor,
                        borderRadius: `${Math.max(4, borderRadius - 2)}px`,
                      }}
                    >
                      <span>Next Step</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* In-App Announcement Banner Component Preview */}
              {previewTab === 'banner' && (
                <div 
                  className="shadow-lg p-4 flex items-center justify-between gap-4 transition-all"
                  style={{
                    backgroundColor: primaryColor,
                    color: '#ffffff',
                    borderRadius: `${borderRadius}px`,
                  }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {logoUrl && (
                      <img 
                        src={logoUrl} 
                        alt="Logo" 
                        className="w-7 h-7 rounded object-contain bg-white/20 p-0.5 shrink-0" 
                      />
                    )}
                    <div className="truncate">
                      <span className="font-extrabold block text-xs truncate">
                        Announcing {companyName} v2.0
                      </span>
                      <span className="text-[11px] opacity-90 truncate block">
                        Brand-matched announcement bar for product updates.
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="px-3.5 py-1.5 bg-white text-slate-900 font-extrabold text-xs shadow shrink-0 hover:bg-slate-100"
                    style={{ borderRadius: `${Math.max(4, borderRadius - 2)}px` }}
                  >
                    Explore
                  </button>
                </div>
              )}

              {/* Modal Popup Component Preview */}
              {previewTab === 'modal' && (
                <div 
                  className="shadow-2xl border p-6 max-w-sm mx-auto text-center transition-all"
                  style={{
                    backgroundColor: previewTheme === 'dark' ? '#1e293b' : '#ffffff',
                    borderColor: previewTheme === 'dark' ? '#334155' : '#e2e8f0',
                    borderRadius: `${borderRadius}px`,
                  }}
                >
                  <div 
                    className="w-12 h-12 mx-auto mb-3 rounded-2xl flex items-center justify-center text-white shadow-md"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h3 
                    className="font-extrabold mb-1"
                    style={{ fontSize: `${baseFontSize + 4}px` }}
                  >
                    Special Offer for You
                  </h3>
                  <p 
                    className="text-slate-500 dark:text-slate-400 mb-5 leading-relaxed"
                    style={{ fontSize: `${baseFontSize - 2}px` }}
                  >
                    Interactive modals and lead-generation popups styled consistently with your organization identity.
                  </p>
                  <div className="space-y-2">
                    <button
                      type="button"
                      className="w-full py-2.5 text-white font-bold text-xs shadow-md"
                      style={{
                        backgroundColor: primaryColor,
                        borderRadius: `${borderRadius}px`,
                      }}
                    >
                      Get Started Free
                    </button>
                    <button
                      type="button"
                      className="w-full py-2 text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      Maybe Later
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Token Summary Card */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs space-y-2">
              <div className="font-bold text-slate-700 dark:text-slate-300">Active Design Tokens:</div>
              <div className="grid grid-cols-2 gap-2 text-slate-500 dark:text-slate-400 text-[11px]">
                <div>Font: <strong className="text-slate-800 dark:text-slate-200">{fontFamily}</strong></div>
                <div>Size: <strong className="text-slate-800 dark:text-slate-200">{baseFontSize}px</strong></div>
                <div>Radius: <strong className="text-slate-800 dark:text-slate-200">{borderRadius}px</strong></div>
                <div>Type: <strong className="text-slate-800 dark:text-slate-200">{brandType}</strong></div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
