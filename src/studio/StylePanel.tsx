import React, { useState } from 'react';
import {
  AlignCenter, AlignJustify, AlignLeft, AlignRight, ArrowDown, ArrowRight, ChevronDown, Italic, Link2, Link2Off, Strikethrough, Underline, X,
  LucideIcon,
} from 'lucide-react';
import { DocNode } from '../core/schema';
import { ImageInput } from '../app/shared/VariableForm';
import { GOOGLE_FONTS } from '../renderer/css';
import { ColorField, fieldClass } from './fields';
import { useStudio } from './store';

const smallLabel = 'block mb-1 text-xs font-medium text-slate-500 dark:text-slate-400';

// Remembered while the editor is open, so moving between blocks keeps your place.
const openGroups = new Set(['Layout', 'Spacing', 'Size', 'Typography', 'Fill', 'Border']);

const Group: React.FC<{ title: string; onReset?: () => void; children: React.ReactNode }> = ({ title, onReset, children }) => {
  const [isOpen, setIsOpen] = useState(openGroups.has(title));
  return (
    <section aria-label={title} className="border-b border-slate-100 dark:border-slate-800 last:border-b-0">
      <div className="flex items-center">
        <button
          type="button"
          aria-expanded={isOpen}
          className="flex-1 flex items-center justify-between h-10 text-sm font-semibold text-slate-800 dark:text-slate-100"
          onClick={() => {
            if (isOpen) openGroups.delete(title);
            else openGroups.add(title);
            setIsOpen(!isOpen);
          }}
        >
          {title}
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
        </button>
        {onReset && (
          <button type="button" aria-label={`Clear ${title.toLowerCase()} styles`} title="Clear" className="ml-1 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200" onClick={onReset}>
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      {isOpen && <div className="pb-4 space-y-3">{children}</div>}
    </section>
  );
};

interface Choice {
  value: string;
  label: string;
  icon?: LucideIcon;
}

const Segmented: React.FC<{ label: string; value: string; choices: Choice[]; disabled?: boolean; onChange: (value: string) => void }> = ({ label, value, choices, disabled, onChange }) => (
  <div>
    <p className={smallLabel}>{label}</p>
    <div role="group" aria-label={label} className="flex p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800">
      {choices.map((choice) => {
        const ChoiceIcon = choice.icon;
        const selected = value === choice.value;
        return (
          <button
            key={choice.value}
            type="button"
            disabled={disabled}
            aria-pressed={selected}
            aria-label={`${label}: ${choice.label}`}
            title={choice.label}
            // Clicking the current choice clears it, returning to the block's default.
            onClick={() => onChange(selected ? '' : choice.value)}
            className={`flex-1 min-w-0 h-8 flex items-center justify-center rounded-md text-xs font-medium transition-colors ${selected ? 'bg-white dark:bg-slate-600 text-indigo-700 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white'}`}
          >
            {ChoiceIcon ? <ChoiceIcon className="w-4 h-4" aria-hidden="true" /> : <span className="truncate px-0.5">{choice.label}</span>}
          </button>
        );
      })}
    </div>
  </div>
);

/** Arrow keys change the number and keep the unit, as design tools do. */
const stepValue = (value: string, direction: number, large: boolean): string | null => {
  const match = value.trim().match(/^(-?\d*\.?\d+)([a-z%]*)$/i);
  if (!match) return value.trim() === '' ? String(direction * (large ? 10 : 1)) : null;
  const step = match[2] === 'rem' || match[2] === 'em' ? 0.1 : large ? 10 : 1;
  return `${Number((Number(match[1]) + direction * step).toFixed(2))}${match[2]}`;
};

const NumberField: React.FC<{ label: string; value: string; placeholder?: string; disabled?: boolean; bare?: boolean; onChange: (value: string) => void }> = ({ label, value, placeholder, disabled, bare, onChange }) => {
  const input = (
    <input
      aria-label={label}
      title={bare ? label : undefined}
      disabled={disabled}
      placeholder={placeholder}
      className={bare
        ? 'w-full h-7 px-0.5 text-[13px] text-center rounded-md bg-white/80 dark:bg-slate-800 border border-black/10 dark:border-white/10 placeholder:text-slate-400 hover:border-indigo-300 focus:bg-white dark:focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500'
        : fieldClass}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      onKeyDown={(event) => {
        if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
        event.preventDefault();
        const next = stepValue(value, event.key === 'ArrowUp' ? 1 : -1, event.shiftKey);
        if (next !== null) onChange(next);
      }}
    />
  );
  if (bare) return input;
  return (
    <div>
      <p className={smallLabel} aria-hidden="true">{label}</p>
      {input}
    </div>
  );
};

const SelectField: React.FC<{ label: string; value: string; options: (string | { value: string; label: string })[]; disabled?: boolean; onChange: (value: string) => void }> = ({ label, value, options, disabled, onChange }) => {
  const list = options.map((option) => (typeof option === 'string' ? { value: option, label: option } : option));
  return (
    <div>
      <p className={smallLabel} aria-hidden="true">{label}</p>
      <select aria-label={label} disabled={disabled} className={fieldClass} value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">Default</option>
        {value && !list.some((option) => option.value === value) && <option value={value}>{value}</option>}
        {list.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </div>
  );
};

const SIDES = ['Top', 'Right', 'Bottom', 'Left'] as const;

/** Splits on spaces outside brackets, so "32px max(24px, 1fr)" stays two values. */
const splitValues = (value: string): string[] => value.match(/(?:[^\s(]+(?:\([^)]*\))?)+/g) ?? [];

/** What a shorthand such as `padding: 8px 16px` means for one side. */
const sideOfShorthand = (shorthand: string, side: typeof SIDES[number]): string => {
  const parts = splitValues(shorthand);
  if (parts.length === 0) return '';
  const top = parts[0];
  const right = parts[1] ?? top;
  const bottom = parts[2] ?? top;
  const left = parts[3] ?? right;
  return { Top: top, Right: right, Bottom: bottom, Left: left }[side];
};

/** Margin outside and padding inside, drawn like the block they apply to. */
const BoxModel: React.FC<{ read: (key: string) => string; disabled?: boolean; set: (key: string, value: string) => void }> = ({ read, disabled, set }) => {
  const sideField = (kind: 'margin' | 'padding', side: typeof SIDES[number]) => {
    const key = `${kind}${side}`;
    return (
      <NumberField
        bare
        label={`${kind === 'margin' ? 'Margin' : 'Padding'} ${side.toLowerCase()}`}
        placeholder={sideOfShorthand(read(kind), side) || '0'}
        disabled={disabled}
        value={read(key)}
        onChange={(value) => set(key, value)}
      />
    );
  };
  return (
    <div className="rounded-xl bg-amber-50 dark:bg-amber-500/10 p-1.5 text-center">
      <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 text-left px-1">Margin</p>
      <div className="w-14 mx-auto">{sideField('margin', 'Top')}</div>
      <div className="grid grid-cols-[48px_minmax(0,1fr)_48px] items-center gap-1.5 my-1">
        {sideField('margin', 'Left')}
        <div className="rounded-lg bg-emerald-50 dark:bg-emerald-500/10 p-1.5">
          <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 text-left px-1">Padding</p>
          <div className="w-12 mx-auto">{sideField('padding', 'Top')}</div>
          <div className="grid grid-cols-[minmax(0,1fr)_20px_minmax(0,1fr)] items-center gap-1 my-1">
            {sideField('padding', 'Left')}
            <span className="h-5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600" aria-hidden="true" />
            {sideField('padding', 'Right')}
          </div>
          <div className="w-12 mx-auto">{sideField('padding', 'Bottom')}</div>
        </div>
        {sideField('margin', 'Right')}
      </div>
      <div className="w-14 mx-auto">{sideField('margin', 'Bottom')}</div>
    </div>
  );
};

const CORNERS = [
  { key: 'borderTopLeftRadius', label: 'Top left radius' },
  { key: 'borderTopRightRadius', label: 'Top right radius' },
  { key: 'borderBottomLeftRadius', label: 'Bottom left radius' },
  { key: 'borderBottomRightRadius', label: 'Bottom right radius' },
];

const SHADOWS: Choice[] = [
  { value: '0 1px 3px rgba(15,23,42,.14)', label: 'S' },
  { value: '0 6px 16px -4px rgba(15,23,42,.2)', label: 'M' },
  { value: '0 16px 32px -10px rgba(15,23,42,.3)', label: 'L' },
  { value: '0 28px 56px -14px rgba(15,23,42,.42)', label: 'XL' },
];

const GRADIENTS = [
  'linear-gradient(135deg, #6366f1, #a855f7)',
  'linear-gradient(135deg, #0ea5e9, #10b981)',
  'linear-gradient(135deg, #f43f5e, #f59e0b)',
  'linear-gradient(135deg, #0f172a, #334155)',
  'linear-gradient(135deg, #fde68a, #fca5a5)',
  'linear-gradient(180deg, var(--fp-background), var(--fp-surface))',
];

const GRID_COLUMNS = [1, 2, 3, 4, 5, 6].map((count) => ({
  value: count === 1 ? 'minmax(0, 1fr)' : `repeat(${count}, minmax(0, 1fr))`,
  label: count === 1 ? '1 column' : `${count} columns`,
}));

const backgroundImageUrl = (value: string) => value.match(/url\(\s*['"]?([^'")]+)['"]?\s*\)/)?.[1] ?? '';

/** Every design property of a block, grouped the way design tools group them. */
export const StylePanel: React.FC<{ node: DocNode }> = ({ node }) => {
  const device = useStudio((s) => s.device);
  const readOnly = useStudio((s) => s.readOnly);
  const theme = useStudio((s) => s.draft?.theme);
  const { updateStyle, updateStyles } = useStudio.getState();
  const [splitCorners, setSplitCorners] = useState(() => CORNERS.some((corner) => node.styles[corner.key] !== undefined));

  const overrides = device === 'desktop' ? undefined : node.responsive?.[device];
  const read = (key: string) => String(overrides?.[key] ?? node.styles[key] ?? '');
  const set = (key: string) => (value: string) => updateStyle(node.id, key, value);
  const setKey = (key: string, value: string) => updateStyle(node.id, key, value);
  const clear = (...keys: string[]) => updateStyles(node.id, Object.fromEntries(keys.map((key) => [key, ''])));
  const hasAny = (...keys: string[]) => keys.some((key) => read(key) !== '');

  const number = (label: string, key: string, placeholder?: string) => (
    <NumberField label={label} placeholder={placeholder} disabled={readOnly} value={read(key)} onChange={set(key)} />
  );
  const select = (label: string, key: string, options: (string | { value: string; label: string })[]) => (
    <SelectField label={label} disabled={readOnly} value={read(key)} options={options} onChange={set(key)} />
  );
  const segmented = (label: string, key: string, choices: Choice[]) => (
    <Segmented label={label} disabled={readOnly} value={read(key)} choices={choices} onChange={set(key)} />
  );

  // A border needs a style to appear, so setting anything else also turns it on.
  const setBorder = (key: string, value: string) => {
    const shorthand = splitValues(read('border'));
    const patch: Record<string, string> = { [key]: value };
    if (shorthand.length > 0) {
      patch.border = '';
      patch.borderWidth = read('borderWidth') || shorthand[0] || '';
      patch.borderStyle = read('borderStyle') || shorthand[1] || '';
      patch.borderColor = read('borderColor') || shorthand[2] || '';
      patch[key] = value;
    }
    if (value && key !== 'borderStyle' && !read('borderStyle') && !patch.borderStyle) patch.borderStyle = 'solid';
    updateStyles(node.id, patch);
  };
  const borderPart = (key: string, index: number) => read(key) || splitValues(read('border'))[index] || '';

  const background = read('background') || read('backgroundColor');
  const imageUrl = backgroundImageUrl(read('backgroundImage'));
  const [fillTab, setFillTab] = useState<'color' | 'gradient' | 'image'>(() => (read('backgroundImage') ? 'image' : background.includes('gradient') ? 'gradient' : 'color'));
  const setBackground = (value: string) => updateStyles(node.id, { background: value, backgroundColor: '', backgroundImage: '', backgroundSize: '', backgroundPosition: '', backgroundRepeat: '' });

  const shadow = read('boxShadow');
  const rotate = read('transform').match(/rotate\((-?[\d.]+)deg\)/)?.[1] ?? '';
  const blur = read('filter').match(/blur\((-?[\d.]+)px\)/)?.[1] ?? '';

  const isGrid = read('display') === 'grid' || (node.type === 'Grid' && !read('display'));

  return (
    <div>
      {device !== 'desktop' && (
        <p className="mb-2 text-[13px] rounded-lg px-2.5 py-2 bg-indigo-50 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200">
          Changes here only apply on {device}. Desktop stays the same.
        </p>
      )}

      <Group title="Layout" onReset={hasAny('display', 'flexDirection', 'flexWrap', 'justifyContent', 'alignItems', 'gap', 'gridTemplateColumns') ? () => clear('display', 'flexDirection', 'flexWrap', 'justifyContent', 'alignItems', 'gap', 'gridTemplateColumns') : undefined}>
        {segmented('Display', 'display', [{ value: 'block', label: 'Block' }, { value: 'flex', label: 'Flex' }, { value: 'grid', label: 'Grid' }, { value: 'none', label: 'Hide' }])}
        {isGrid ? (
          select('Columns', 'gridTemplateColumns', GRID_COLUMNS)
        ) : (
          <>
            {segmented('Direction', 'flexDirection', [{ value: 'row', label: 'Horizontal', icon: ArrowRight }, { value: 'column', label: 'Vertical', icon: ArrowDown }])}
            {segmented('Wrap', 'flexWrap', [{ value: 'nowrap', label: 'No wrap' }, { value: 'wrap', label: 'Wrap' }])}
          </>
        )}
        {select('Distribute', 'justifyContent', [{ value: 'flex-start', label: 'Start' }, { value: 'center', label: 'Center' }, { value: 'flex-end', label: 'End' }, { value: 'space-between', label: 'Space between' }, { value: 'space-around', label: 'Space around' }, { value: 'space-evenly', label: 'Space evenly' }])}
        {select('Align', 'alignItems', [{ value: 'flex-start', label: 'Start' }, { value: 'center', label: 'Center' }, { value: 'flex-end', label: 'End' }, { value: 'stretch', label: 'Stretch' }, { value: 'baseline', label: 'Baseline' }])}
        {number('Gap', 'gap', '0')}
      </Group>

      <Group title="Spacing">
        <BoxModel read={read} disabled={readOnly} set={setKey} />
        <p className="text-xs text-slate-500 dark:text-slate-400">A number means pixels. You can also type 2rem, 5% or auto. Arrow keys change the value.</p>
      </Group>

      <Group title="Size">
        <div className="grid grid-cols-2 gap-2">
          {number('Width', 'width', 'auto')}
          {number('Height', 'height', 'auto')}
          {number('Min width', 'minWidth', '0')}
          {number('Min height', 'minHeight', '0')}
          {number('Max width', 'maxWidth', 'none')}
          {number('Max height', 'maxHeight', 'none')}
        </div>
        {select('Overflow', 'overflow', [{ value: 'visible', label: 'Show' }, { value: 'hidden', label: 'Clip' }, { value: 'auto', label: 'Scroll' }])}
        {node.type === 'Image' && select('Image fit', 'objectFit', [{ value: 'cover', label: 'Fill the box' }, { value: 'contain', label: 'Show all of it' }, { value: 'fill', label: 'Stretch' }, { value: 'none', label: 'Original size' }])}
      </Group>

      <Group title="Typography" onReset={hasAny('fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'lineHeight', 'letterSpacing', 'textAlign', 'textTransform', 'textDecoration', 'color') ? () => clear('fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'lineHeight', 'letterSpacing', 'textAlign', 'textTransform', 'textDecoration', 'color') : undefined}>
        {select('Font', 'fontFamily', GOOGLE_FONTS)}
        <div className="grid grid-cols-2 gap-2">
          {number('Font size', 'fontSize', 'inherit')}
          {select('Weight', 'fontWeight', [{ value: '300', label: '300 Light' }, { value: '400', label: '400 Regular' }, { value: '500', label: '500 Medium' }, { value: '600', label: '600 Semibold' }, { value: '700', label: '700 Bold' }, { value: '800', label: '800 Heavy' }, { value: '900', label: '900 Black' }])}
          {number('Line height', 'lineHeight', '1.5')}
          {number('Letter spacing', 'letterSpacing', '0')}
        </div>
        {segmented('Text align', 'textAlign', [{ value: 'left', label: 'Left', icon: AlignLeft }, { value: 'center', label: 'Center', icon: AlignCenter }, { value: 'right', label: 'Right', icon: AlignRight }, { value: 'justify', label: 'Justify', icon: AlignJustify }])}
        {segmented('Case', 'textTransform', [{ value: 'none', label: 'Aa' }, { value: 'uppercase', label: 'AA' }, { value: 'lowercase', label: 'aa' }, { value: 'capitalize', label: 'Ab' }])}
        <div className="grid grid-cols-2 gap-2">
          {segmented('Style', 'fontStyle', [{ value: 'italic', label: 'Italic', icon: Italic }])}
          {segmented('Line', 'textDecoration', [{ value: 'underline', label: 'Underline', icon: Underline }, { value: 'line-through', label: 'Strikethrough', icon: Strikethrough }])}
        </div>
        <ColorField label="Text color" disabled={readOnly} theme={theme} clearable value={read('color')} onChange={set('color')} />
      </Group>

      <Group title="Fill" onReset={hasAny('background', 'backgroundColor', 'backgroundImage') ? () => setBackground('') : undefined}>
        <div role="tablist" aria-label="Fill type" className="flex p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800">
          {(['color', 'gradient', 'image'] as const).map((tab) => (
            <button key={tab} role="tab" type="button" aria-selected={fillTab === tab} onClick={() => setFillTab(tab)} className={`flex-1 h-8 rounded-md text-xs font-medium capitalize transition-colors ${fillTab === tab ? 'bg-white dark:bg-slate-600 text-indigo-700 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-300'}`}>
              {tab}
            </button>
          ))}
        </div>
        {fillTab === 'color' && <ColorField label="Background" disabled={readOnly} theme={theme} clearable value={background} onChange={setBackground} />}
        {fillTab === 'gradient' && (
          <>
            <div role="group" aria-label="Gradients" className="grid grid-cols-6 gap-1.5">
              {GRADIENTS.map((gradient, index) => (
                <button key={gradient} type="button" disabled={readOnly} aria-label={`Gradient ${index + 1}`} aria-pressed={background === gradient} onClick={() => setBackground(gradient)} className={`h-9 rounded-lg border border-black/10 dark:border-white/20 ${background === gradient ? 'ring-2 ring-indigo-500 ring-offset-1 dark:ring-offset-slate-900' : ''}`} style={{ background: gradient.replace(/var\(--fp-background\)/, theme?.background ?? '#fff').replace(/var\(--fp-surface\)/, theme?.surface ?? '#f1f5f9') }} />
              ))}
            </div>
            <NumberField label="Custom gradient" placeholder="linear-gradient(90deg, #000, #fff)" disabled={readOnly} value={background.includes('gradient') ? background : ''} onChange={setBackground} />
          </>
        )}
        {fillTab === 'image' && (
          <>
            <div>
              <p className={smallLabel}>Background image</p>
              <ImageInput
                id={`style-${node.id}-bg-image`}
                value={imageUrl}
                onChange={(url) => updateStyles(node.id, {
                  background: '',
                  backgroundColor: '',
                  backgroundImage: url ? `url("${url}")` : '',
                  backgroundSize: url ? read('backgroundSize') || 'cover' : '',
                  backgroundPosition: url ? read('backgroundPosition') || 'center' : '',
                })}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {select('Image size', 'backgroundSize', [{ value: 'cover', label: 'Fill' }, { value: 'contain', label: 'Fit' }, { value: 'auto', label: 'Original' }])}
              {select('Image position', 'backgroundPosition', ['center', 'top', 'bottom', 'left', 'right'])}
            </div>
            {select('Repeat', 'backgroundRepeat', [{ value: 'no-repeat', label: 'Once' }, { value: 'repeat', label: 'Tile' }])}
          </>
        )}
      </Group>

      <Group title="Border" onReset={hasAny('border', 'borderWidth', 'borderStyle', 'borderColor', 'borderRadius', ...CORNERS.map((corner) => corner.key)) ? () => clear('border', 'borderWidth', 'borderStyle', 'borderColor', 'borderRadius', ...CORNERS.map((corner) => corner.key)) : undefined}>
        <div className="grid grid-cols-2 gap-2">
          <NumberField label="Border width" placeholder="0" disabled={readOnly} value={borderPart('borderWidth', 0)} onChange={(value) => setBorder('borderWidth', value)} />
          <SelectField label="Border style" disabled={readOnly} value={borderPart('borderStyle', 1)} options={[{ value: 'solid', label: 'Solid' }, { value: 'dashed', label: 'Dashed' }, { value: 'dotted', label: 'Dotted' }, { value: 'none', label: 'None' }]} onChange={(value) => setBorder('borderStyle', value)} />
        </div>
        <ColorField label="Border color" disabled={readOnly} theme={theme} clearable value={borderPart('borderColor', 2)} onChange={(value) => setBorder('borderColor', value)} />
        <div>
          <div className="flex items-end gap-2">
            <div className="flex-1 min-w-0">{number('Corner radius', 'borderRadius', 'theme')}</div>
            <button type="button" aria-label="Set each corner separately" aria-pressed={splitCorners} title="Set each corner separately" className={`shrink-0 w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 ${splitCorners ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300' : 'text-slate-500'}`} onClick={() => setSplitCorners(!splitCorners)}>
              {splitCorners ? <Link2Off className="w-4 h-4" aria-hidden="true" /> : <Link2 className="w-4 h-4" aria-hidden="true" />}
            </button>
          </div>
          {splitCorners && <div className="mt-2 grid grid-cols-2 gap-2">{CORNERS.map((corner) => <React.Fragment key={corner.key}>{number(corner.label, corner.key, '-')}</React.Fragment>)}</div>}
        </div>
      </Group>

      <Group title="Effects" onReset={hasAny('boxShadow', 'opacity', 'transform', 'filter') ? () => clear('boxShadow', 'opacity', 'transform', 'filter') : undefined}>
        <Segmented label="Shadow" disabled={readOnly} value={shadow} choices={SHADOWS} onChange={set('boxShadow')} />
        <div>
          <label htmlFor={`style-${node.id}-opacity`} className={smallLabel}>Opacity {read('opacity') ? `${Math.round(Number(read('opacity')) * 100)}%` : '100%'}</label>
          <input id={`style-${node.id}-opacity`} type="range" min={0} max={1} step={0.05} disabled={readOnly} className="w-full accent-indigo-600" value={read('opacity') || 1} onChange={(event) => setKey('opacity', event.target.value === '1' ? '' : event.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <NumberField label="Rotate (degrees)" placeholder="0" disabled={readOnly} value={rotate} onChange={(value) => setKey('transform', value ? `rotate(${value}deg)` : '')} />
          <NumberField label="Blur (pixels)" placeholder="0" disabled={readOnly} value={blur} onChange={(value) => setKey('filter', value ? `blur(${value}px)` : '')} />
        </div>
      </Group>

      <Group title="Position" onReset={hasAny('position', 'top', 'right', 'bottom', 'left', 'zIndex', 'order', 'alignSelf', 'flexGrow') ? () => clear('position', 'top', 'right', 'bottom', 'left', 'zIndex', 'order', 'alignSelf', 'flexGrow') : undefined}>
        {select('Position', 'position', [{ value: 'static', label: 'Normal' }, { value: 'relative', label: 'Relative' }, { value: 'absolute', label: 'Absolute' }, { value: 'fixed', label: 'Fixed' }, { value: 'sticky', label: 'Sticky' }])}
        <div className="grid grid-cols-2 gap-2">
          {number('Top', 'top', 'auto')}
          {number('Right', 'right', 'auto')}
          {number('Bottom', 'bottom', 'auto')}
          {number('Left', 'left', 'auto')}
          {number('Stack order', 'zIndex', 'auto')}
          {number('Order', 'order', '0')}
          {number('Grow', 'flexGrow', '0')}
          {select('Align self', 'alignSelf', [{ value: 'flex-start', label: 'Start' }, { value: 'center', label: 'Center' }, { value: 'flex-end', label: 'End' }, { value: 'stretch', label: 'Stretch' }])}
        </div>
      </Group>
    </div>
  );
};
