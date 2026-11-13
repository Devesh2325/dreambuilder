import React, { useState } from 'react';
import {
  AlignCenter, AlignJustify, AlignLeft, AlignRight, ArrowDown, ArrowRight, ChevronDown, Italic, Link2, Link2Off, Minus, Plus, RotateCcw, Strikethrough, Underline, X,
  LucideIcon, MousePointer, Play,
} from 'lucide-react';
import { Device, DEVICES, DocNode } from '../core/schema';
import { ImageInput } from '../app/shared/VariableForm';
import { BLOCK_META } from '../renderer/blockMeta';
import { GradientEditor } from './ColorPicker';
import { ColorField, fieldClass, FontSelect } from './fields';
import { useStudio } from './store';
import { ComputedBox, useComputedBox } from './useComputedBox';

const smallLabel = 'block mb-1 text-xs font-medium text-slate-500 dark:text-slate-400';

const DEVICE_WIDTH: Record<Device, string> = { desktop: 'any large screen', tablet: 'up to 991 px wide', mobile: 'up to 640 px wide' };

// Remembered while the editor is open, so moving between blocks keeps your place.
const groupChoice = new Map<string, boolean>();

const Group: React.FC<{ title: string; defaultOpen: boolean; count?: number; onReset?: () => void; children: React.ReactNode }> = ({ title, defaultOpen, count, onReset, children }) => {
  const [isOpen, setIsOpen] = useState(groupChoice.get(title) ?? defaultOpen);
  return (
    <section aria-label={title} className="border-b border-slate-100 dark:border-slate-800 last:border-b-0">
      <div className="flex items-center">
        <button
          type="button"
          aria-expanded={isOpen}
          aria-label={title}
          className="flex-1 flex items-center justify-between h-10 text-sm font-semibold text-slate-800 dark:text-slate-100"
          onClick={() => {
            groupChoice.set(title, !isOpen);
            setIsOpen(!isOpen);
          }}
        >
          <span className="flex items-center gap-1.5">
            {title}
            {Boolean(count) && <span aria-hidden="true" title="Changed on this device" className="w-1.5 h-1.5 rounded-full bg-indigo-500" />}
          </span>
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

const Segmented: React.FC<{ label: string; value: string; inherited?: string; choices: Choice[]; disabled?: boolean; onChange: (value: string) => void }> = ({ label, value, inherited, choices, disabled, onChange }) => (
  <div>
    <p className={smallLabel}>{label}</p>
    <div role="group" aria-label={label} className="flex p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800">
      {choices.map((choice) => {
        const ChoiceIcon = choice.icon;
        const selected = value === choice.value;
        // Coming from a larger device: shown, but quieter than a choice made here.
        const fromLarger = !value && inherited === choice.value;
        return (
          <button
            key={choice.value}
            type="button"
            disabled={disabled}
            aria-pressed={selected}
            aria-label={`${label}: ${choice.label}`}
            title={fromLarger ? `${choice.label} (from a larger screen)` : choice.label}
            // Clicking the current choice clears it, returning to the block's default.
            onClick={() => onChange(selected ? '' : choice.value)}
            className={`flex-1 min-w-0 h-8 flex items-center justify-center rounded-md text-xs font-medium transition-colors ${selected ? 'bg-white dark:bg-slate-600 text-indigo-700 dark:text-white shadow-sm' : fromLarger ? 'bg-white/50 dark:bg-slate-700/50 text-slate-700 dark:text-slate-200' : 'text-slate-500 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white'}`}
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
        const next = stepValue(value || placeholder || '', event.key === 'ArrowUp' ? 1 : -1, event.shiftKey);
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

/** A count people can raise and lower with buttons, such as columns or items. */
const Stepper: React.FC<{ label: string; noun: string; value: number; min: number; max: number; empty?: string; disabled?: boolean; onChange: (value: number) => void }> = ({ label, noun, value, min, max, empty, disabled, onChange }) => (
  <div>
    <p className={smallLabel}>{label}</p>
    <div className="flex items-center gap-1">
      <button type="button" aria-label={`Fewer ${noun}`} disabled={disabled || value <= min} className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 hover:border-indigo-400 disabled:opacity-40" onClick={() => onChange(value - 1)}>
        <Minus className="w-4 h-4" aria-hidden="true" />
      </button>
      <output aria-label={label} className="flex-1 h-9 flex items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-800 text-sm font-semibold tabular-nums">
        {value === 0 && empty ? empty : value}
      </output>
      <button type="button" aria-label={`More ${noun}`} disabled={disabled || value >= max} className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 hover:border-indigo-400 disabled:opacity-40" onClick={() => onChange(value + 1)}>
        <Plus className="w-4 h-4" aria-hidden="true" />
      </button>
    </div>
  </div>
);

const SelectField: React.FC<{ label: string; value: string; inherited?: string; options: (string | { value: string; label: string })[]; disabled?: boolean; onChange: (value: string) => void }> = ({ label, value, inherited, options, disabled, onChange }) => {
  const list = options.map((option) => (typeof option === 'string' ? { value: option, label: option } : option));
  const inheritedLabel = inherited ? list.find((option) => option.value === inherited)?.label ?? inherited : '';
  return (
    <div>
      <p className={smallLabel} aria-hidden="true">{label}</p>
      <select aria-label={label} disabled={disabled} className={fieldClass} value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">{inheritedLabel ? `Same as larger screen (${inheritedLabel})` : 'Default'}</option>
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

const SPACING_PRESETS = [
  { label: 'None', value: '0' },
  { label: 'S', value: '8' },
  { label: 'M', value: '16' },
  { label: 'L', value: '32' },
  { label: 'XL', value: '64' },
];

const SIDE_KEYS = (kind: 'margin' | 'padding') => SIDES.map((side) => `${kind}${side}`);

/**
 * Margin outside and padding inside, drawn like the block they apply to. Each box shows what
 * the block really uses right now, in gray until it's set here, and one value can set all sides.
 */
const BoxModel: React.FC<{ read: (key: string) => string; inherited: (key: string) => string; computed: ComputedBox | null; disabled?: boolean; set: (key: string, value: string) => void; setAll: (kind: 'margin' | 'padding', value: string) => void }> = ({ read, inherited, computed, disabled, set, setAll }) => {
  const shownSide = (kind: 'margin' | 'padding', side: typeof SIDES[number]) => {
    const key = `${kind}${side}`;
    return read(key) || inherited(key) || sideOfShorthand(read(kind) || inherited(kind), side) || (computed?.[key as keyof ComputedBox] ?? '0');
  };
  const sideField = (kind: 'margin' | 'padding', side: typeof SIDES[number]) => {
    const key = `${kind}${side}`;
    return (
      <NumberField
        bare
        label={`${kind === 'margin' ? 'Margin' : 'Padding'} ${side.toLowerCase()}`}
        placeholder={shownSide(kind, side)}
        disabled={disabled}
        value={read(key)}
        onChange={(value) => set(key, value)}
      />
    );
  };
  const allField = (kind: 'margin' | 'padding', title: string, hint: string) => {
    const sides = SIDES.map((side) => shownSide(kind, side));
    const isSame = sides.every((value) => value === sides[0]);
    const own = read(kind);
    return (
      <div>
        <div className="flex items-baseline justify-between gap-2">
          <p className={smallLabel}>{title}</p>
          <p className="text-[11px] text-slate-400">{hint}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <input
            aria-label={`All ${kind}`}
            disabled={disabled}
            className={`${fieldClass} !w-[72px] shrink-0 !px-2 text-center`}
            placeholder={isSame ? sides[0] : 'Mixed'}
            value={own}
            onChange={(event) => setAll(kind, event.target.value)}
          />
          <div role="group" aria-label={`${title} sizes`} className="flex-1 min-w-0 flex p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800">
            {SPACING_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                disabled={disabled}
                aria-label={`${title}: ${preset.label}`}
                aria-pressed={own === preset.value}
                title={`${preset.value} pixels on every side`}
                className={`flex-1 h-8 rounded-md text-xs font-medium transition-colors ${own === preset.value ? 'bg-white dark:bg-slate-600 text-indigo-700 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white'}`}
                onClick={() => setAll(kind, preset.value)}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };
  return (
    <div className="space-y-3">
      {allField('padding', 'All padding', 'Space inside')}
      {allField('margin', 'All margin', 'Space outside')}
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
  { value: 'inset 0 2px 4px rgba(0,0,0,.15)', label: 'Inner' },
  { value: '0 0 24px color-mix(in srgb,var(--fp-primary) 55%,transparent)', label: 'Glow' },
];

const HOVER_EFFECTS = [
  { value: '', label: 'None' },
  { value: 'lift', label: 'Lift Up (-4px)' },
  { value: 'lift-high', label: 'Lift High (-8px)' },
  { value: 'scale-up', label: 'Scale Up (+4%)' },
  { value: 'scale-down', label: 'Press (-3%)' },
  { value: 'glow', label: 'Glow Halo (Theme color)' },
  { value: 'border-glow', label: 'Border Highlight' },
  { value: 'brighten', label: 'Brighten (+15%)' },
  { value: 'dim', label: 'Dim (80%)' },
  { value: 'tilt', label: 'Tilt Right (+2°)' },
  { value: 'tilt-left', label: 'Tilt Left (-2°)' },
];

const ANIMATION_TYPES = [
  { value: '', label: 'None' },
  { value: 'fp-fade-in', label: 'Fade In' },
  { value: 'fp-slide-up', label: 'Slide Up' },
  { value: 'fp-slide-down', label: 'Slide Down' },
  { value: 'fp-slide-left', label: 'Slide In Left' },
  { value: 'fp-slide-right', label: 'Slide In Right' },
  { value: 'fp-zoom-in', label: 'Zoom / Pop In' },
  { value: 'fp-bounce', label: 'Bounce' },
  { value: 'fp-float', label: 'Float / Levitate (Loop)' },
  { value: 'fp-pulse-subtle', label: 'Pulse (Loop)' },
  { value: 'fp-glow', label: 'Glow Pulse (Loop)' },
  { value: 'fp-spin', label: 'Spin 360° (Loop)' },
  { value: 'fp-shimmer', label: 'Shimmer Wave (Loop)' },
];

const TRANSITION_PRESETS = [
  { value: '', label: 'Default (250ms)' },
  { value: 'all 0.15s ease', label: 'Fast (150ms)' },
  { value: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)', label: 'Normal (250ms)' },
  { value: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)', label: 'Smooth (400ms)' },
  { value: 'all 0.6s ease', label: 'Slow (600ms)' },
];

const backgroundImageUrl = (value: string) => value.match(/url\(\s*['"]?([^'")]+)['"]?\s*\)/)?.[1] ?? '';

/** Columns in a value such as repeat(3, ...) or a plain list of tracks. 0 means automatic. */
const trackCount = (value: string): number => {
  if (!value) return 0;
  const repeat = value.match(/repeat\(\s*(\d+)/);
  return repeat ? Number(repeat[1]) : splitValues(value).length;
};

const TEXT_BLOCKS = ['Heading', 'Text', 'Button', 'FormField', 'ScaleField', 'Accordion', 'Navbar'];
const MEDIA_BLOCKS = ['Image', 'Video', 'Divider', 'Spacer'];

/** What people change most often comes first, and depends on the kind of block. */
const groupOrder = (type: string): string[] => {
  if (TEXT_BLOCKS.includes(type)) return ['Typography', 'Fill', 'Spacing', 'Size', 'Border', 'Effects', 'Hover Effects', 'Animation', 'Position', 'Layout'];
  if (MEDIA_BLOCKS.includes(type)) return ['Size', 'Border', 'Spacing', 'Effects', 'Hover Effects', 'Animation', 'Position'];
  if (type === 'Section' || type === 'Container') return ['Spacing', 'Fill', 'Layout', 'Size', 'Border', 'Typography', 'Effects', 'Hover Effects', 'Animation', 'Position'];
  return ['Layout', 'Spacing', 'Fill', 'Size', 'Border', 'Typography', 'Effects', 'Hover Effects', 'Animation', 'Position'];
};
const OPEN_BY_DEFAULT = 3;

/** Every design property of a block, per device. */
export const StylePanel: React.FC<{ node: DocNode }> = ({ node }) => {
  const device = useStudio((s) => s.device);
  const readOnly = useStudio((s) => s.readOnly);
  const theme = useStudio((s) => s.draft?.theme);
  const { updateStyle, updateStyles, updateNode, setChildCount, setGridColumns, clearDeviceStyles, setTool } = useStudio.getState();
  const [splitCorners, setSplitCorners] = useState(() => CORNERS.some((corner) => node.styles[corner.key] !== undefined));
  const computed = useComputedBox(node.id);

  const own = device === 'desktop' ? node.styles : node.responsive?.[device];
  const read = (key: string) => String(own?.[key] ?? '');
  // A tablet change also carries to phones, as the stylesheet does.
  const inherited = (key: string) => {
    if (device === 'desktop') return '';
    if (device === 'mobile' && node.responsive?.tablet?.[key] !== undefined) return String(node.responsive.tablet[key]);
    return String(node.styles[key] ?? '');
  };
  const effective = (key: string) => read(key) || inherited(key);
  const set = (key: string) => (value: string) => updateStyle(node.id, key, value);
  const setKey = (key: string, value: string) => updateStyle(node.id, key, value);
  const clear = (...keys: string[]) => updateStyles(node.id, Object.fromEntries(keys.map((key) => [key, ''])));
  const hasAny = (...keys: string[]) => keys.some((key) => read(key) !== '');
  const changedHere = (...keys: string[]) => (device === 'desktop' ? 0 : keys.filter((key) => read(key) !== '').length);

  const number = (label: string, key: string, placeholder?: string) => (
    <NumberField label={label} placeholder={inherited(key) || placeholder} disabled={readOnly} value={read(key)} onChange={set(key)} />
  );
  const select = (label: string, key: string, options: (string | { value: string; label: string })[]) => (
    <SelectField label={label} disabled={readOnly} value={read(key)} inherited={inherited(key)} options={options} onChange={set(key)} />
  );
  const segmented = (label: string, key: string, choices: Choice[]) => (
    <Segmented label={label} disabled={readOnly} value={read(key)} inherited={inherited(key)} choices={choices} onChange={set(key)} />
  );

  // A border needs a style to appear, so setting anything else also turns it on.
  const setBorder = (key: string, value: string) => {
    const shorthand = splitValues(effective('border'));
    const patch: Record<string, string> = { [key]: value };
    if (shorthand.length > 0) {
      patch.border = '';
      patch.borderWidth = effective('borderWidth') || shorthand[0] || '';
      patch.borderStyle = effective('borderStyle') || shorthand[1] || '';
      patch.borderColor = effective('borderColor') || shorthand[2] || '';
      patch[key] = value;
    }
    if (value && key !== 'borderStyle' && !effective('borderStyle') && !patch.borderStyle) patch.borderStyle = 'solid';
    updateStyles(node.id, patch);
  };
  const borderPart = (key: string, index: number) => read(key) || splitValues(read('border'))[index] || '';

  const background = read('background') || read('backgroundColor');
  const imageUrl = backgroundImageUrl(read('backgroundImage'));
  const [fillTab, setFillTab] = useState<'color' | 'gradient' | 'image'>(() => (read('backgroundImage') ? 'image' : background.includes('gradient') ? 'gradient' : 'color'));
  const setBackground = (value: string) => updateStyles(node.id, { background: value, backgroundColor: '', backgroundImage: '', backgroundSize: '', backgroundPosition: '', backgroundRepeat: '' });

  const shadow = read('boxShadow');
  const transform = read('transform');
  const rotate = transform.match(/rotate\((-?[\d.]+)deg\)/)?.[1] ?? '';
  const scale = transform.match(/scale\(([\d.]+)\)/)?.[1] ?? '';
  const blur = read('filter').match(/blur\((-?[\d.]+)px\)/)?.[1] ?? '';
  const backdropBlur = read('backdropFilter').match(/blur\((-?[\d.]+)px\)/)?.[1] ?? '';

  const setRotateAndScale = (newRotate: string, newScale: string) => {
    const parts: string[] = [];
    if (newRotate) parts.push(`rotate(${newRotate}deg)`);
    if (newScale && newScale !== '1') parts.push(`scale(${newScale})`);
    setKey('transform', parts.join(' '));
  };

  const anim = read('animation');
  const animName = read('animationName') || anim.match(/(fp-[a-z-]+)/)?.[1] || '';
  const animDuration = read('animationDuration') || anim.match(/(\d+(?:\.\d+)?s)/)?.[1] || '0.6s';
  const animDelay = read('animationDelay') || anim.match(/\s(\d+(?:\.\d+)?s)\s/)?.[1] || '0s';
  const animIteration = read('animationIterationCount') || (anim.includes('infinite') ? 'infinite' : 'once');

  const applyAnimation = (name: string, duration = animDuration, delay = animDelay, iteration = animIteration) => {
    if (!name) {
      updateStyles(node.id, {
        animation: '',
        animationName: '',
        animationDuration: '',
        animationDelay: '',
        animationIterationCount: '',
      });
      return;
    }
    const isLoop = ['fp-float', 'fp-pulse-subtle', 'fp-glow', 'fp-spin', 'fp-shimmer'].includes(name);
    const effectiveIter = iteration || (isLoop ? 'infinite' : 'once');
    const iterVal = effectiveIter === 'infinite' ? 'infinite' : '1 both';
    const timing = isLoop ? 'ease-in-out' : 'cubic-bezier(0.16, 1, 0.3, 1)';
    const fullAnim = `${name} ${duration || '0.6s'} ${timing} ${delay || '0s'} ${iterVal}`;
    updateStyles(node.id, {
      animation: fullAnim,
      animationName: name,
      animationDuration: duration || '0.6s',
      animationDelay: delay || '0s',
      animationIterationCount: effectiveIter,
    });
  };

  const triggerAnimationPreview = () => {
    try {
      const frame = document.querySelector('iframe');
      const el = frame?.contentDocument?.querySelector(`.fp-n-${node.id}`) as HTMLElement | null;
      if (el) {
        const current = el.style.animation;
        el.style.animation = 'none';
        void el.offsetHeight;
        el.style.animation = current || anim;
      }
    } catch {}
  };

  const isContainer = Boolean(BLOCK_META[node.type]?.isContainer);
  const isGrid = effective('display') === 'grid' || (node.type === 'Grid' && !effective('display'));
  const childNodes = node.children;
  const documents = useStudio((s) => s.documents);
  const owner = documents.find((doc) => doc.content.nodes[node.id]);
  const repeatedChild = childNodes.map((id) => owner?.content.nodes[id]).find((child) => child?.repeat);

  const layoutKeys = ['display', 'flexDirection', 'flexWrap', 'justifyContent', 'alignItems', 'gap', 'gridTemplateColumns', 'gridTemplateRows'];
  const spacingKeys = ['margin', 'padding', ...SIDES.flatMap((side) => [`margin${side}`, `padding${side}`])];
  const sizeKeys = ['width', 'height', 'minWidth', 'minHeight', 'maxWidth', 'maxHeight', 'overflow', 'objectFit'];
  const typeKeys = ['fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'lineHeight', 'letterSpacing', 'textAlign', 'textTransform', 'textDecoration', 'color'];
  const fillKeys = ['background', 'backgroundColor', 'backgroundImage', 'backgroundSize', 'backgroundPosition', 'backgroundRepeat'];
  const borderKeys = ['border', 'borderWidth', 'borderStyle', 'borderColor', 'borderRadius', ...CORNERS.map((corner) => corner.key)];
  const effectKeys = ['boxShadow', 'opacity', 'transform', 'filter', 'backdropFilter'];
  const hoverKeys = ['hoverEffect', 'hoverBackground', 'hoverColor', 'hoverBorderColor', 'hoverCursor', 'transition'];
  const animationKeys = ['animation', 'animationName', 'animationDuration', 'animationDelay', 'animationIterationCount'];
  const positionKeys = ['position', 'top', 'right', 'bottom', 'left', 'zIndex', 'order', 'alignSelf', 'flexGrow', 'flexShrink'];

  const groups: Record<string, { keys: string[]; canReset?: boolean; onReset?: () => void; body: React.ReactNode }> = {
    Layout: {
      keys: layoutKeys,
      canReset: true,
      body: (
        <>
          {isContainer && (repeatedChild ? (
            <p className="text-[13px] rounded-lg px-2.5 py-2 bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300">
              The items here come from a list.{' '}
              <button type="button" className="font-semibold underline" onClick={() => setTool('variables')}>Add or remove them in Variables</button>
            </p>
          ) : (
            <Stepper label="Items inside" noun="items" value={childNodes.length} min={0} max={24} disabled={readOnly} onChange={(count) => setChildCount(node.id, count)} />
          ))}
          {segmented('Display', 'display', [{ value: 'block', label: 'Block' }, { value: 'flex', label: 'Flex' }, { value: 'grid', label: 'Grid' }, { value: 'none', label: 'Hide' }])}
          {isGrid ? (
            <div className="grid grid-cols-2 gap-2">
              <Stepper label="Columns" noun="columns" value={trackCount(effective('gridTemplateColumns'))} min={0} max={12} empty="Auto" disabled={readOnly} onChange={(count) => setGridColumns(node.id, count)} />
              <Stepper label="Rows" noun="rows" value={trackCount(effective('gridTemplateRows'))} min={0} max={12} empty="Auto" disabled={readOnly} onChange={(count) => setKey('gridTemplateRows', count === 0 ? '' : `repeat(${count}, auto)`)} />
            </div>
          ) : (
            <>
              {segmented('Direction', 'flexDirection', [{ value: 'row', label: 'Horizontal', icon: ArrowRight }, { value: 'column', label: 'Vertical', icon: ArrowDown }])}
              {segmented('Wrap', 'flexWrap', [{ value: 'nowrap', label: 'No wrap' }, { value: 'wrap', label: 'Wrap' }])}
            </>
          )}
          {select('Distribute', 'justifyContent', [{ value: 'flex-start', label: 'Start' }, { value: 'center', label: 'Center' }, { value: 'flex-end', label: 'End' }, { value: 'space-between', label: 'Space between' }, { value: 'space-around', label: 'Space around' }, { value: 'space-evenly', label: 'Space evenly' }])}
          {select('Align', 'alignItems', [{ value: 'flex-start', label: 'Start' }, { value: 'center', label: 'Center' }, { value: 'flex-end', label: 'End' }, { value: 'stretch', label: 'Stretch' }, { value: 'baseline', label: 'Baseline' }])}
          {number('Gap', 'gap', computed?.gap ?? '0')}
          {computed && !['flex', 'inline-flex', 'grid', 'inline-grid'].includes(computed.display) && childNodes.length > 1 && (
            <p className="text-[13px] rounded-lg px-2.5 py-2 bg-amber-50 text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
              Gap only works when Display is Flex or Grid.
              {!readOnly && <> <button type="button" className="font-semibold underline" onClick={() => setKey('display', 'flex')}>Turn on Flex</button></>}
            </p>
          )}
        </>
      ),
    },
    Spacing: {
      keys: spacingKeys,
      body: (
        <>
          <BoxModel
            read={read}
            inherited={inherited}
            computed={computed}
            disabled={readOnly}
            set={setKey}
            setAll={(kind, value) => updateStyles(node.id, { [kind]: value, ...Object.fromEntries(SIDE_KEYS(kind).map((key) => [key, ''])) })}
          />
          <p className="text-xs text-slate-500 dark:text-slate-400">Gray numbers are what this block uses now, in pixels. Type over one to change that side. You can also type 2rem, 5% or auto.</p>
          {hasAny(...spacingKeys) && !readOnly && (
            <button type="button" className="inline-flex items-center gap-1 text-[13px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline" onClick={() => clear(...spacingKeys)}>
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              Back to the default spacing
            </button>
          )}
        </>
      ),
    },
    Size: {
      keys: sizeKeys,
      body: (
        <>
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
        </>
      ),
    },
    Typography: {
      keys: typeKeys,
      canReset: true,
      body: (
        <>
          <FontSelect label="Font" disabled={readOnly} value={read('fontFamily')} defaultLabel={inherited('fontFamily') ? `Same as larger screen (${inherited('fontFamily')})` : 'Theme font'} onChange={set('fontFamily')} />
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
        </>
      ),
    },
    Fill: {
      keys: fillKeys,
      onReset: () => setBackground(''),
      body: (
        <>
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
              <GradientEditor
                value={background.includes('gradient') ? background : ''}
                disabled={readOnly}
                resolve={(css) => css.replace(/var\(--fp-background\)/g, theme?.background ?? '#fff').replace(/var\(--fp-surface\)/g, theme?.surface ?? '#f1f5f9').replace(/var\(--fp-primary\)/g, theme?.primary ?? '#4f46e5')}
                onChange={setBackground}
              />
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
        </>
      ),
    },
    Border: {
      keys: borderKeys,
      canReset: true,
      body: (
        <>
          <div className="grid grid-cols-2 gap-2">
            <NumberField label="Border width" placeholder={inherited('borderWidth') || '0'} disabled={readOnly} value={borderPart('borderWidth', 0)} onChange={(value) => setBorder('borderWidth', value)} />
            <SelectField label="Border style" disabled={readOnly} value={borderPart('borderStyle', 1)} inherited={inherited('borderStyle')} options={[{ value: 'solid', label: 'Solid' }, { value: 'dashed', label: 'Dashed' }, { value: 'dotted', label: 'Dotted' }, { value: 'none', label: 'None' }]} onChange={(value) => setBorder('borderStyle', value)} />
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
        </>
      ),
    },
    Effects: {
      keys: effectKeys,
      canReset: true,
      body: (
        <>
          <Segmented label="Shadow" disabled={readOnly} value={shadow} inherited={inherited('boxShadow')} choices={SHADOWS} onChange={set('boxShadow')} />
          <div>
            <label htmlFor={`style-${node.id}-opacity`} className={smallLabel}>Opacity {effective('opacity') ? `${Math.round(Number(effective('opacity')) * 100)}%` : '100%'}</label>
            <input id={`style-${node.id}-opacity`} type="range" min={0} max={1} step={0.05} disabled={readOnly} className="w-full accent-indigo-600" value={effective('opacity') || 1} onChange={(event) => setKey('opacity', event.target.value === '1' ? '' : event.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <NumberField label="Rotate (deg)" placeholder="0" disabled={readOnly} value={rotate} onChange={(value) => setRotateAndScale(value, scale)} />
            <NumberField label="Scale (e.g. 1.05)" placeholder="1" disabled={readOnly} value={scale} onChange={(value) => setRotateAndScale(rotate, value)} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <NumberField label="Blur (px)" placeholder="0" disabled={readOnly} value={blur} onChange={(value) => setKey('filter', value ? `blur(${value}px)` : '')} />
            <NumberField label="Backdrop blur (px)" placeholder="0" disabled={readOnly} value={backdropBlur} onChange={(value) => setKey('backdropFilter', value ? `blur(${value}px)` : '')} />
          </div>
          {effective('backdropFilter') && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Backdrop blur gives a frosted glass effect. Best with a semi-transparent background.
            </p>
          )}
        </>
      ),
    },
    'Hover Effects': {
      keys: hoverKeys,
      canReset: true,
      body: (
        <>
          <p className="text-[12px] text-slate-500 dark:text-slate-400">
            Hover over this block on the canvas to see your hover effects live.
          </p>
          {select('Hover motion & effect', 'hoverEffect', HOVER_EFFECTS)}
          {select('Transition timing', 'transition', TRANSITION_PRESETS)}
          {segmented('Cursor on hover', 'hoverCursor', [
            { value: '', label: 'Default' },
            { value: 'pointer', label: 'Pointer (Hand)', icon: MousePointer },
          ])}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">Custom hover colors (optional)</p>
            <ColorField label="Hover background" disabled={readOnly} theme={theme} clearable value={read('hoverBackground')} onChange={set('hoverBackground')} />
            <ColorField label="Hover text color" disabled={readOnly} theme={theme} clearable value={read('hoverColor')} onChange={set('hoverColor')} />
            <ColorField label="Hover border color" disabled={readOnly} theme={theme} clearable value={read('hoverBorderColor')} onChange={set('hoverBorderColor')} />
          </div>
        </>
      ),
    },
    Animation: {
      keys: animationKeys,
      canReset: true,
      body: (
        <>
          <div className="flex items-center justify-between">
            <span className={smallLabel}>Entrance & loop animation</span>
            {animName && (
              <button
                type="button"
                onClick={triggerAnimationPreview}
                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                <Play className="w-3 h-3" /> Replay
              </button>
            )}
          </div>
          <SelectField
            label=""
            disabled={readOnly}
            value={animName}
            options={ANIMATION_TYPES}
            onChange={(name) => applyAnimation(name)}
          />

          {animName && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className={smallLabel}>Duration</p>
                  <SelectField
                    label=""
                    disabled={readOnly}
                    value={animDuration}
                    options={[
                      { value: '0.3s', label: '0.3s (Quick)' },
                      { value: '0.6s', label: '0.6s (Normal)' },
                      { value: '1s', label: '1.0s (Smooth)' },
                      { value: '1.5s', label: '1.5s (Slow)' },
                      { value: '2.5s', label: '2.5s (Gentle)' },
                      { value: '4s', label: '4.0s (Ambient)' },
                    ]}
                    onChange={(dur) => applyAnimation(animName, dur, animDelay, animIteration)}
                  />
                </div>
                <div>
                  <p className={smallLabel}>Delay</p>
                  <SelectField
                    label=""
                    disabled={readOnly}
                    value={animDelay}
                    options={[
                      { value: '0s', label: '0s (Immediate)' },
                      { value: '0.1s', label: '0.1s' },
                      { value: '0.2s', label: '0.2s' },
                      { value: '0.4s', label: '0.4s' },
                      { value: '0.6s', label: '0.6s' },
                      { value: '1s', label: '1.0s' },
                    ]}
                    onChange={(del) => applyAnimation(animName, animDuration, del, animIteration)}
                  />
                </div>
              </div>

              <div>
                <p className={smallLabel}>Repeat mode</p>
                <Segmented
                  label=""
                  disabled={readOnly}
                  value={animIteration}
                  choices={[
                    { value: 'once', label: 'Once (Entrance)' },
                    { value: 'infinite', label: 'Infinite (Loop)' },
                  ]}
                  onChange={(iter) => applyAnimation(animName, animDuration, animDelay, iter)}
                />
              </div>

              <button
                type="button"
                onClick={triggerAnimationPreview}
                className="w-full h-8 flex items-center justify-center gap-1.5 text-xs font-semibold rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors"
              >
                <Play className="w-3.5 h-3.5" /> Test animation in canvas
              </button>
            </>
          )}
        </>
      ),
    },
    Position: {
      keys: positionKeys,
      canReset: true,
      body: (
        <>
          {select('Position', 'position', [
            { value: 'static', label: 'Normal (static)' },
            { value: 'relative', label: 'Relative' },
            { value: 'absolute', label: 'Absolute (Pinned)' },
            { value: 'fixed', label: 'Fixed (Screen)' },
            { value: 'sticky', label: 'Sticky (Scrolls then sticks)' },
          ])}

          {effective('position') === 'sticky' && !effective('top') && (
            <p className="text-[12px] rounded-lg px-2.5 py-1.5 bg-indigo-50 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300">
              Sticky elements require a Top position to stick.{' '}
              {!readOnly && (
                <button type="button" className="font-semibold underline" onClick={() => setKey('top', '0')}>
                  Set Top: 0
                </button>
              )}
            </p>
          )}

          {(!effective('position') || effective('position') === 'static') && hasAny('top', 'right', 'bottom', 'left', 'zIndex') && (
            <p className="text-[12px] rounded-lg px-2.5 py-1.5 bg-amber-50 text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
              Coordinates only apply when Position is not Normal.{' '}
              {!readOnly && (
                <button type="button" className="font-semibold underline" onClick={() => setKey('position', 'relative')}>
                  Set to Relative
                </button>
              )}
            </p>
          )}

          {(effective('position') === 'absolute' || effective('position') === 'fixed') && (
            <div>
              <p className={smallLabel}>Quick pin presets</p>
              <div className="grid grid-cols-4 gap-1 text-[11px]">
                <button
                  type="button"
                  disabled={readOnly}
                  className="h-7 rounded border border-slate-200 dark:border-slate-700 hover:border-indigo-400 font-medium"
                  onClick={() => updateStyles(node.id, { top: '0', right: '0', bottom: '0', left: '0' })}
                >
                  Full cover
                </button>
                <button
                  type="button"
                  disabled={readOnly}
                  className="h-7 rounded border border-slate-200 dark:border-slate-700 hover:border-indigo-400 font-medium"
                  onClick={() => updateStyles(node.id, { top: '0', left: '0', right: '0', bottom: '' })}
                >
                  Pin top
                </button>
                <button
                  type="button"
                  disabled={readOnly}
                  className="h-7 rounded border border-slate-200 dark:border-slate-700 hover:border-indigo-400 font-medium"
                  onClick={() => updateStyles(node.id, { bottom: '0', left: '0', right: '0', top: '' })}
                >
                  Pin bottom
                </button>
                <button
                  type="button"
                  disabled={readOnly}
                  className="h-7 rounded border border-slate-200 dark:border-slate-700 hover:border-indigo-400 font-medium"
                  onClick={() => updateStyles(node.id, { top: '50%', left: '50%', right: '', bottom: '', transform: 'translate(-50%, -50%)' })}
                >
                  Center
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            {number('Top', 'top', 'auto')}
            {number('Right', 'right', 'auto')}
            {number('Bottom', 'bottom', 'auto')}
            {number('Left', 'left', 'auto')}
            {number('Stack order (z-index)', 'zIndex', 'auto')}
            {number('Order (in flex/grid)', 'order', '0')}
            {number('Flex grow', 'flexGrow', '0')}
            {number('Flex shrink', 'flexShrink', '1')}
          </div>
          {select('Align self', 'alignSelf', [
            { value: 'auto', label: 'Auto' },
            { value: 'flex-start', label: 'Start' },
            { value: 'center', label: 'Center' },
            { value: 'flex-end', label: 'End' },
            { value: 'stretch', label: 'Stretch' },
          ])}
        </>
      ),
    },
  };

  const deviceChanges = device === 'desktop' ? 0 : Object.keys(node.responsive?.[device] ?? {}).length;
  const hideOn = node.hideOn ?? [];
  const isHiddenHere = hideOn.includes(device);

  return (
    <div>
      <section aria-label="Devices" className="mb-3 rounded-xl border border-slate-200 dark:border-slate-700 p-2.5 space-y-2.5">
        {device === 'desktop' ? (
          <p className="text-[13px] text-slate-600 dark:text-slate-300">Changes here apply everywhere, until you change them on a smaller screen. Use the device buttons at the top to design for tablet and mobile.</p>
        ) : (
          <div>
            <p className="text-[13px] font-semibold text-indigo-700 dark:text-indigo-300">Designing for {device}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Only affects screens {DEVICE_WIDTH[device]}. Grey values come from a larger screen.</p>
            {deviceChanges > 0 && !readOnly && (
              <button type="button" className="mt-1.5 inline-flex items-center gap-1 text-[13px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline" onClick={() => clearDeviceStyles(node.id, device)}>
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                Reset {deviceChanges} {device} {deviceChanges === 1 ? 'change' : 'changes'}
              </button>
            )}
          </div>
        )}
        <fieldset>
          <legend className={smallLabel}>Show this block on</legend>
          <div className="flex gap-3">
            {DEVICES.map((option) => (
              <label key={option} className="flex items-center gap-1.5 text-[13px] capitalize cursor-pointer">
                <input
                  type="checkbox"
                  disabled={readOnly}
                  checked={!hideOn.includes(option)}
                  onChange={(event) => {
                    const next = event.target.checked ? hideOn.filter((value) => value !== option) : [...hideOn, option];
                    updateNode(node.id, { hideOn: next.length > 0 ? next : undefined });
                  }}
                />
                {option}
              </label>
            ))}
          </div>
        </fieldset>
        {isHiddenHere && <p role="status" className="text-[13px] rounded-lg px-2 py-1.5 bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-200">Hidden on {device}, so it isn't on the canvas. Find it in Layers.</p>}
      </section>

      {groupOrder(node.type).map((title, index) => {
        const group = groups[title];
        const canReset = group.onReset ? hasAny(...group.keys) : group.canReset && hasAny(...group.keys);
        return (
          <Group
            key={title}
            title={title}
            defaultOpen={index < OPEN_BY_DEFAULT}
            count={changedHere(...group.keys)}
            onReset={canReset ? (group.onReset ?? (() => clear(...group.keys))) : undefined}
          >
            {group.body}
          </Group>
        );
      })}
    </div>
  );
};
