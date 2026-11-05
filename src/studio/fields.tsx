import React from 'react';
import { X } from 'lucide-react';
import { GOOGLE_FONTS } from '../renderer/css';

export const labelClass = 'block text-[13px] font-medium text-slate-700 dark:text-slate-200';
export const fieldClass =
  'w-full h-9 px-2.5 text-sm rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-60';

export const slugFromTitle = (title: string) => title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50);

const isHex = (value: string) => /^#[0-9a-fA-F]{6}$/.test(value);

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
}

/** A swatch and a text box. The box also accepts gradients and any other CSS color. */
export const ColorField: React.FC<ColorFieldProps> = ({ label, value, onChange, disabled, theme, clearable }) => {
  const id = `color-${label.replace(/\W/g, '-').toLowerCase()}`;
  return (
    <div>
      <label htmlFor={id} className={`${labelClass} mb-1`}>{label}</label>
      <div className="flex items-center gap-1.5">
        <span
          className="relative shrink-0 w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden"
          style={{ background: value.startsWith('var(') && theme ? theme[THEME_SWATCHES.find((s) => s.value === value)?.swatch ?? 'primary'] : value || 'transparent' }}
        >
          <input
            type="color"
            aria-label={`${label} picker`}
            disabled={disabled}
            className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-default"
            value={isHex(value) ? value : '#000000'}
            onChange={(event) => onChange(event.target.value)}
          />
        </span>
        <input id={id} disabled={disabled} className={fieldClass} placeholder="Default" value={value} onChange={(event) => onChange(event.target.value)} />
        {clearable && value && !disabled && (
          <button type="button" aria-label={`Clear ${label}`} className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200" onClick={() => onChange('')}>
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      {theme && !disabled && (
        <div className="mt-1.5 flex gap-1" role="group" aria-label={`${label} theme colors`}>
          {THEME_SWATCHES.map((swatch) => (
            <button
              key={swatch.value}
              type="button"
              title={swatch.label}
              aria-label={`Use theme ${swatch.label} color`}
              aria-pressed={value === swatch.value}
              onClick={() => onChange(swatch.value)}
              className={`w-5 h-5 rounded-full border ${value === swatch.value ? 'ring-2 ring-indigo-500 ring-offset-1 dark:ring-offset-slate-900' : ''} border-black/10 dark:border-white/20`}
              style={{ background: theme[swatch.swatch] }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const FontField: React.FC<{ label: string; value: string; onChange: (value: string) => void; disabled?: boolean }> = ({ label, value, onChange, disabled }) => (
  <label className={labelClass}>
    {label}
    <select disabled={disabled} className={`${fieldClass} mt-1`} value={value} onChange={(event) => onChange(event.target.value)}>
      {!GOOGLE_FONTS.includes(value) && <option value={value}>{value}</option>}
      {GOOGLE_FONTS.map((font) => <option key={font} value={font}>{font}</option>)}
    </select>
  </label>
);
