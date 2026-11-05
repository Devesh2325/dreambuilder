import React, { useEffect, useState } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';
import { fontPreviewUrl, GOOGLE_FONTS } from '../renderer/css';
import { ColorPanel } from './ColorPicker';

export const labelClass = 'block text-[13px] font-medium text-slate-700 dark:text-slate-200';
export const fieldClass =
  'w-full h-9 px-2.5 text-sm rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-60';

export const slugFromTitle = (title: string) => title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50);

const THEME_SWATCHES = [
  { label: 'Primary', value: 'var(--fp-primary)', swatch: 'primary' },
  { label: 'Text', value: 'var(--fp-text)', swatch: 'text' },
  { label: 'Muted', value: 'var(--fp-muted)', swatch: 'muted' },
  { label: 'Card', value: 'var(--fp-surface)', swatch: 'surface' },
  { label: 'Page', value: 'var(--fp-background)', swatch: 'background' },
] as const;

interface ColorFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  /** Shows the theme's colors as one-click choices, so blocks follow later theme changes. */
  theme?: Record<'primary' | 'text' | 'muted' | 'surface' | 'background', string>;
  /** Whether it can be cleared, to go back to the inherited color. */
  clearable?: boolean;
  /** For a form that shows the label itself. */
  hideLabel?: boolean;
  id?: string;
}

/** A swatch that opens the color picker, and a text box that accepts any CSS color. */
export const ColorField: React.FC<ColorFieldProps> = ({ label, value, onChange, disabled, theme, clearable, hideLabel, id: givenId }) => {
  const id = givenId ?? `color-${label.replace(/\W/g, '-').toLowerCase()}`;
  const [isOpen, setIsOpen] = useState(false);
  const themeColors = theme ? THEME_SWATCHES.map((swatch) => ({ label: swatch.label, value: swatch.value, swatch: theme[swatch.swatch] })) : undefined;
  const shown = value.startsWith('var(') && theme ? theme[THEME_SWATCHES.find((s) => s.value === value)?.swatch ?? 'primary'] : value;
  return (
    <div>
      {!hideLabel && <label htmlFor={id} className={`${labelClass} mb-1`}>{label}</label>}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          aria-label={`${label} picker`}
          aria-expanded={isOpen}
          title={isOpen ? 'Close the color picker' : 'Open the color picker'}
          disabled={disabled}
          className={`shrink-0 w-9 h-9 rounded-lg border overflow-hidden disabled:cursor-default ${isOpen ? 'border-indigo-500 ring-2 ring-indigo-500/30' : 'border-slate-200 dark:border-slate-700 hover:border-indigo-400'}`}
          style={{ background: shown ? shown : 'repeating-conic-gradient(#e2e8f0 0% 25%, #ffffff 0% 50%) 50% / 12px 12px' }}
          onClick={() => setIsOpen(!isOpen)}
        />
        <input id={id} disabled={disabled} className={fieldClass} placeholder="Default" value={value} onChange={(event) => onChange(event.target.value)} />
        {clearable && value && !disabled && (
          <button type="button" aria-label={`Clear ${label}`} className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200" onClick={() => onChange('')}>
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      {isOpen && !disabled && <ColorPanel label={label} value={value} onChange={onChange} themeColors={themeColors} />}
      {!isOpen && themeColors && !disabled && (
        <div className="mt-1.5 flex gap-1" role="group" aria-label={`${label} theme colors`}>
          {themeColors.map((swatch) => (
            <button
              key={swatch.value}
              type="button"
              title={swatch.label}
              aria-label={`Use theme ${swatch.label} color`}
              aria-pressed={value === swatch.value}
              onClick={() => onChange(swatch.value)}
              className={`w-5 h-5 rounded-full border ${value === swatch.value ? 'ring-2 ring-indigo-500 ring-offset-1 dark:ring-offset-slate-900' : ''} border-black/10 dark:border-white/20`}
              style={{ background: swatch.swatch }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const FONT_GROUPS: { title: string; fonts: string[] }[] = [
  { title: 'Clean and modern', fonts: ['Inter', 'Plus Jakarta Sans', 'Poppins', 'Outfit', 'Roboto', 'DM Sans', 'Manrope', 'Sora', 'Montserrat', 'Work Sans', 'Rubik', 'Nunito'] },
  { title: 'Bold and decorative', fonts: ['Space Grotesk', 'Syne', 'Righteous'] },
  { title: 'Classic', fonts: ['Playfair Display', 'Lora', 'Merriweather', 'Cinzel', 'Bodoni Moda'] },
  { title: 'Typewriter', fonts: ['JetBrains Mono', 'Fira Code', 'Space Mono', 'IBM Plex Mono'] },
];

let isPreviewLoaded = false;
const loadFontPreviews = () => {
  if (isPreviewLoaded || typeof document === 'undefined') return;
  isPreviewLoaded = true;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = fontPreviewUrl();
  document.head.appendChild(link);
};

const fontStyle = (font: string): React.CSSProperties => ({ fontFamily: `'${font}', system-ui, sans-serif` });

/** Shows every font in its own style, so people can see what they're choosing. */
export const FontSelect: React.FC<{ label: string; value: string; onChange: (value: string) => void; disabled?: boolean; defaultLabel?: string }> = ({ label, value, onChange, disabled, defaultLabel }) => {
  const [isOpen, setIsOpen] = useState(false);
  useEffect(loadFontPreviews, []);
  const choose = (font: string) => {
    onChange(font);
    setIsOpen(false);
  };
  const option = (font: string, text: string, style?: React.CSSProperties) => (
    <button key={font || 'default'} type="button" role="option" aria-selected={value === font} style={style} onClick={() => choose(font)}
      className={`w-full flex items-center justify-between gap-2 h-9 px-2.5 text-[15px] text-left rounded-md ${value === font ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
      <span className="truncate">{text}</span>
      {value === font && <Check className="w-4 h-4 shrink-0" aria-hidden="true" />}
    </button>
  );
  return (
    <div>
      <p className={`${labelClass} mb-1`} aria-hidden="true">{label}</p>
      <button type="button" aria-label={label} aria-haspopup="listbox" aria-expanded={isOpen} disabled={disabled} className={`${fieldClass} flex items-center justify-between gap-2 text-left`} style={value ? fontStyle(value) : undefined} onClick={() => setIsOpen(!isOpen)} onKeyDown={(event) => {
        if (event.key === 'Escape') setIsOpen(false);
      }}>
        <span className="truncate">{value || defaultLabel || 'Choose a font'}</span>
        <ChevronDown className={`w-4 h-4 shrink-0 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      {isOpen && (
        <div role="listbox" aria-label={label} className="mt-1 max-h-64 overflow-y-auto p-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm">
          {defaultLabel && option('', defaultLabel)}
          {value && !GOOGLE_FONTS.includes(value) && option(value, value)}
          {FONT_GROUPS.map((group) => (
            <div key={group.title} role="group" aria-label={group.title}>
              <p className="px-2.5 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{group.title}</p>
              {group.fonts.map((font) => option(font, font, fontStyle(font)))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const FontField = FontSelect;
