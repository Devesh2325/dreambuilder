import React, { useState, useEffect } from 'react';
import { POPULAR_FONTS, loadGoogleFont, FontDefinition } from './fontService';
import { 
  Type, 
  Search, 
  Check, 
  ChevronDown, 
  Sliders, 
  Sparkles,
  CaseSensitive,
  AlignLeft
} from 'lucide-react';

interface FontPickerProps {
  fontFamily?: string;
  fontWeight?: string | number;
  letterSpacing?: string;
  lineHeight?: string;
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  onChangeFamily: (font: string) => void;
  onChangeWeight?: (weight: string) => void;
  onChangeLetterSpacing?: (spacing: string) => void;
  onChangeLineHeight?: (height: string) => void;
  onChangeTransform?: (transform: 'none' | 'uppercase' | 'lowercase' | 'capitalize') => void;
  label?: string;
}

export const FontPicker: React.FC<FontPickerProps> = ({
  fontFamily = 'Inter',
  fontWeight = '400',
  letterSpacing = 'normal',
  lineHeight = 'normal',
  textTransform = 'none',
  onChangeFamily,
  onChangeWeight,
  onChangeLetterSpacing,
  onChangeLineHeight,
  onChangeTransform,
  label = 'Font & Typography',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'sans-serif' | 'display' | 'serif' | 'monospace'>('all');

  // Strip fallback suffixes for display
  const cleanFamilyName = fontFamily.replace(/['"]/g, '').split(',')[0].trim();

  // Load active font on mount / change
  useEffect(() => {
    if (cleanFamilyName) {
      loadGoogleFont(cleanFamilyName);
    }
  }, [cleanFamilyName]);

  const activeFontDef = POPULAR_FONTS.find(
    f => f.family.toLowerCase() === cleanFamilyName.toLowerCase()
  );

  const filteredFonts = POPULAR_FONTS.filter(f => {
    const matchesSearch = f.family.toLowerCase().includes(search.toLowerCase());
    const matchesCat = categoryFilter === 'all' || f.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const handleSelectFont = (font: FontDefinition) => {
    loadGoogleFont(font.family);
    onChangeFamily(`'${font.family}', ${font.category}`);
    setIsOpen(false);
  };

  return (
    <div className="space-y-2 text-xs font-sans">
      {label && (
        <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block">
          {label}
        </label>
      )}

      {/* Font Family Trigger */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-slate-300 dark:hover:border-slate-600 transition-colors shadow-2xs"
        >
          <div className="flex items-center gap-2 truncate">
            <Type className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <span 
              className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate"
              style={{ fontFamily: cleanFamilyName }}
            >
              {cleanFamilyName || 'Select Font'}
            </span>
          </div>
          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Font Selection Dropdown Modal */}
        {isOpen && (
          <div className="absolute z-50 left-0 right-0 mt-2 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl space-y-3 animate-in fade-in zoom-in-95 duration-150">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search 25+ Google Fonts..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex gap-1 overflow-x-auto pb-1 text-[10px]">
              {[
                { id: 'all', label: 'All' },
                { id: 'sans-serif', label: 'Sans' },
                { id: 'display', label: 'Modern' },
                { id: 'serif', label: 'Serif' },
                { id: 'monospace', label: 'Code' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoryFilter(cat.id as any)}
                  className={`px-2 py-0.5 rounded-md font-semibold transition-all shrink-0 ${
                    categoryFilter === cat.id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Font Options List with Live Font Previews */}
            <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
              {filteredFonts.map((f) => {
                const isSelected = cleanFamilyName.toLowerCase() === f.family.toLowerCase();
                return (
                  <button
                    key={f.family}
                    type="button"
                    onMouseEnter={() => loadGoogleFont(f.family)}
                    onClick={() => handleSelectFont(f)}
                    className={`w-full px-3 py-2 rounded-xl text-left flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-bold'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="text-xs" style={{ fontFamily: f.family }}>
                        {f.family}
                      </span>
                      <span className="text-[9px] text-slate-400 capitalize">
                        {f.category} · {f.weights.length} weights
                      </span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Advanced Typography Sub-Controls */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        {/* Font Weight */}
        {onChangeWeight && (
          <div>
            <label className="text-[10px] text-slate-400 block mb-0.5">Weight</label>
            <select
              value={String(fontWeight || '400')}
              onChange={(e) => onChangeWeight(e.target.value)}
              className="w-full px-2 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
            >
              <option value="300">300 (Light)</option>
              <option value="400">400 (Regular)</option>
              <option value="500">500 (Medium)</option>
              <option value="600">600 (SemiBold)</option>
              <option value="700">700 (Bold)</option>
              <option value="800">800 (ExtraBold)</option>
              <option value="900">900 (Black)</option>
            </select>
          </div>
        )}

        {/* Letter Spacing */}
        {onChangeLetterSpacing && (
          <div>
            <label className="text-[10px] text-slate-400 block mb-0.5">Letter Spacing</label>
            <select
              value={letterSpacing || 'normal'}
              onChange={(e) => onChangeLetterSpacing(e.target.value)}
              className="w-full px-2 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
            >
              <option value="normal">Normal</option>
              <option value="-0.05em">Tight (-0.05em)</option>
              <option value="0.05em">Wide (0.05em)</option>
              <option value="0.1em">Wider (0.1em)</option>
              <option value="0.2em">Expanded (0.2em)</option>
            </select>
          </div>
        )}
      </div>

      {/* Line Height & Text Transform */}
      <div className="grid grid-cols-2 gap-2">
        {onChangeLineHeight && (
          <div>
            <label className="text-[10px] text-slate-400 block mb-0.5">Line Height</label>
            <select
              value={lineHeight || 'normal'}
              onChange={(e) => onChangeLineHeight(e.target.value)}
              className="w-full px-2 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
            >
              <option value="normal">Normal</option>
              <option value="1">Tight (1.0)</option>
              <option value="1.25">Compact (1.25)</option>
              <option value="1.5">Relaxed (1.5)</option>
              <option value="1.75">Loose (1.75)</option>
              <option value="2">Double (2.0)</option>
            </select>
          </div>
        )}

        {onChangeTransform && (
          <div>
            <label className="text-[10px] text-slate-400 block mb-0.5">Case</label>
            <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700">
              {[
                { id: 'none', label: 'Aa' },
                { id: 'uppercase', label: 'AA' },
                { id: 'lowercase', label: 'aa' },
                { id: 'capitalize', label: 'Aa' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onChangeTransform(t.id as any)}
                  className={`flex-1 py-0.5 rounded text-[10px] font-semibold transition-all ${
                    textTransform === t.id
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
