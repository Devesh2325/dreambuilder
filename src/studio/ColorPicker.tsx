import React, { useEffect, useRef, useState } from 'react';
import { Pipette, Plus, Trash2 } from 'lucide-react';
import { colorAt, formatColor, formatGradient, Gradient, Hsva, parseColor, parseGradient } from './colorMath';

const PALETTE = [
  '#0f172a', '#334155', '#64748b', '#cbd5e1', '#f1f5f9', '#ffffff',
  '#dc2626', '#ea580c', '#d97706', '#ca8a04', '#65a30d', '#16a34a',
  '#059669', '#0d9488', '#0891b2', '#0284c7', '#2563eb', '#4f46e5',
  '#7c3aed', '#9333ea', '#c026d3', '#db2777', '#e11d48', '#fb7185',
];

const RECENT_KEY = 'fp_recent_colors';
const RECENT_LIMIT = 6;

const readRecent = (): string[] => {
  try {
    const stored = JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]');
    return Array.isArray(stored) ? stored.filter((item): item is string => typeof item === 'string').slice(0, RECENT_LIMIT) : [];
  } catch {
    return [];
  }
};

const rememberColor = (color: string) => {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify([color, ...readRecent().filter((item) => item !== color)].slice(0, RECENT_LIMIT)));
  } catch {
    // Only a convenience: the recent list just stays as it was.
  }
};

// Shows through wherever a color is see-through.
const CHECKERS = 'repeating-conic-gradient(#cbd5e1 0% 25%, #ffffff 0% 50%) 50% / 10px 10px';

const swatchClass = 'w-6 h-6 rounded-md border border-black/10 dark:border-white/20 hover:scale-110 transition-transform';

interface EyeDropperApi {
  open(): Promise<{ sRGBHex: string }>;
}
type WindowWithEyeDropper = Window & { EyeDropper?: new () => EyeDropperApi };

interface ColorPanelProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** Theme colors, offered first so blocks can follow a later change of theme. */
  themeColors?: { label: string; value: string; swatch: string }[];
}

/** A square for shade, sliders for hue and see-through, then ready-made and recent colors. */
export const ColorPanel: React.FC<ColorPanelProps> = ({ label, value, onChange, themeColors }) => {
  // Kept here too: at black or gray a hex can't say what the hue was, so dragging would jump.
  const [color, setColor] = useState<Hsva>(() => parseColor(value) ?? { h: 245, s: 75, v: 90, a: 1 });
  const lastSent = useRef(value);
  const squareRef = useRef<HTMLDivElement>(null);
  const [recent, setRecent] = useState(readRecent);

  useEffect(() => {
    if (value === lastSent.current) return;
    lastSent.current = value;
    const parsed = parseColor(value);
    if (parsed) setColor(parsed);
  }, [value]);

  const send = (next: Hsva) => {
    setColor(next);
    const text = formatColor(next);
    lastSent.current = text;
    onChange(text);
  };

  const pick = (text: string) => {
    lastSent.current = text;
    const parsed = parseColor(text);
    if (parsed) setColor(parsed);
    onChange(text);
    if (parsed) {
      rememberColor(text);
      setRecent(readRecent());
    }
  };

  const fromPointer = (clientX: number, clientY: number) => {
    const box = squareRef.current?.getBoundingClientRect();
    if (!box) return;
    const s = Math.min(100, Math.max(0, ((clientX - box.left) / box.width) * 100));
    const v = Math.min(100, Math.max(0, (1 - (clientY - box.top) / box.height) * 100));
    send({ ...color, s, v });
  };

  const finish = () => {
    rememberColor(formatColor(color));
    setRecent(readRecent());
  };

  const dropperWindow = window as WindowWithEyeDropper;
  const hue = `hsl(${color.h}, 100%, 50%)`;
  const solid = formatColor({ ...color, a: 1 });

  return (
    <div className="mt-2 p-2.5 space-y-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm" data-testid="color-panel">
      <div
        ref={squareRef}
        role="slider"
        tabIndex={0}
        aria-label={`${label}: shade`}
        aria-valuetext={`Saturation ${Math.round(color.s)}%, brightness ${Math.round(color.v)}%`}
        aria-valuenow={Math.round(color.s)}
        data-testid="color-square"
        className="relative h-32 rounded-lg cursor-crosshair touch-none outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        style={{ background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, ${hue})` }}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          fromPointer(event.clientX, event.clientY);
        }}
        onPointerMove={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) fromPointer(event.clientX, event.clientY);
        }}
        onPointerUp={finish}
        onKeyDown={(event) => {
          const step = event.shiftKey ? 10 : 2;
          const moves: Record<string, Partial<Hsva>> = {
            ArrowLeft: { s: Math.max(0, color.s - step) },
            ArrowRight: { s: Math.min(100, color.s + step) },
            ArrowUp: { v: Math.min(100, color.v + step) },
            ArrowDown: { v: Math.max(0, color.v - step) },
          };
          if (moves[event.key]) {
            event.preventDefault();
            send({ ...color, ...moves[event.key] });
          }
        }}
      >
        <span aria-hidden="true" className="absolute w-3.5 h-3.5 -ml-[7px] -mt-[7px] rounded-full border-2 border-white shadow ring-1 ring-black/30 pointer-events-none" style={{ left: `${color.s}%`, top: `${100 - color.v}%`, background: solid }} />
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0 space-y-2">
          <input
            type="range"
            aria-label={`${label}: color`}
            min={0}
            max={360}
            value={Math.round(color.h)}
            className="fp-slider w-full"
            style={{ background: 'linear-gradient(to right,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)' }}
            onChange={(event) => send({ ...color, h: Number(event.target.value) })}
            onPointerUp={finish}
          />
          <input
            type="range"
            aria-label={`${label}: see-through`}
            min={0}
            max={100}
            value={Math.round(color.a * 100)}
            className="fp-slider w-full"
            style={{ background: `linear-gradient(to right, transparent, ${solid}), ${CHECKERS}` }}
            onChange={(event) => send({ ...color, a: Number(event.target.value) / 100 })}
            onPointerUp={finish}
          />
        </div>
        {dropperWindow.EyeDropper && (
          <button
            type="button"
            aria-label="Pick a color from the screen"
            title="Pick a color from the screen"
            className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 hover:border-indigo-400"
            onClick={async () => {
              try {
                const result = await new dropperWindow.EyeDropper!().open();
                pick(result.sRGBHex);
              } catch {
                // Pressing Escape cancels the dropper, which is fine.
              }
            }}
          >
            <Pipette className="w-4 h-4" aria-hidden="true" />
          </button>
        )}
      </div>

      {themeColors && (
        <div>
          <p className="mb-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">Your theme</p>
          <div role="group" aria-label={`${label} theme colors`} className="flex flex-wrap gap-1.5">
            {themeColors.map((item) => (
              <button key={item.value} type="button" title={item.label} aria-label={`Use theme ${item.label} color`} aria-pressed={value === item.value} className={`${swatchClass} ${value === item.value ? 'ring-2 ring-indigo-500 ring-offset-1 dark:ring-offset-slate-900' : ''}`} style={{ background: item.swatch }} onClick={() => onChange(item.value)} />
            ))}
          </div>
        </div>
      )}
      {recent.length > 0 && (
        <div>
          <p className="mb-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">Recent</p>
          <div className="flex flex-wrap gap-1.5">
            {recent.map((item) => <button key={item} type="button" title={item} aria-label={`Use ${item}`} className={swatchClass} style={{ background: item }} onClick={() => pick(item)} />)}
          </div>
        </div>
      )}
      <div>
        <p className="mb-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">Colors</p>
        <div className="grid grid-cols-[repeat(12,minmax(0,1fr))] gap-1">
          {PALETTE.map((item) => <button key={item} type="button" title={item} aria-label={`Use ${item}`} className="aspect-square rounded border border-black/10 dark:border-white/20 hover:scale-110 transition-transform" style={{ background: item }} onClick={() => pick(item)} />)}
        </div>
      </div>
    </div>
  );
};

export const GRADIENT_PRESETS = [
  'linear-gradient(135deg, #6366f1, #a855f7)',
  'linear-gradient(135deg, #0ea5e9, #10b981)',
  'linear-gradient(135deg, #f43f5e, #f59e0b)',
  'linear-gradient(135deg, #0f172a, #334155)',
  'linear-gradient(135deg, #fde68a, #fca5a5)',
  'linear-gradient(180deg, var(--fp-background), var(--fp-surface))',
  'linear-gradient(90deg, #7c3aed, #db2777)',
  'linear-gradient(135deg, #1e3a8a, #0891b2)',
  'linear-gradient(135deg, #064e3b, #65a30d)',
  'linear-gradient(135deg, #fb7185, #fdba74)',
  'radial-gradient(circle, #a5b4fc 0%, #312e81 100%)',
  'linear-gradient(180deg, #f8fafc, #e2e8f0)',
];

const ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];
const NEW_GRADIENT: Gradient = { kind: 'linear', angle: 135, stops: [{ color: '#6366f1', position: 0 }, { color: '#a855f7', position: 100 }] };

interface GradientEditorProps {
  value: string;
  disabled?: boolean;
  /** Theme variables have no color of their own, so previews need the real values. */
  resolve: (css: string) => string;
  onChange: (value: string) => void;
}

/** Choose a ready-made gradient, or set its colors, direction and stops here. */
export const GradientEditor: React.FC<GradientEditorProps> = ({ value, disabled, resolve, onChange }) => {
  const gradient = parseGradient(value) ?? NEW_GRADIENT;
  const [selected, setSelected] = useState(0);
  const barRef = useRef<HTMLDivElement>(null);
  const stops = gradient.stops;
  const current = Math.min(selected, stops.length - 1);
  const preview = resolve(formatGradient({ ...gradient, kind: 'linear', angle: 90 }));
  const update = (patch: Partial<Gradient>) => onChange(formatGradient({ ...gradient, ...patch }));
  const setStop = (index: number, patch: Partial<Gradient['stops'][number]>) => update({ stops: stops.map((stop, i) => (i === index ? { ...stop, ...patch } : stop)) });

  const positionOf = (clientX: number) => {
    const box = barRef.current?.getBoundingClientRect();
    return box ? Math.min(100, Math.max(0, ((clientX - box.left) / box.width) * 100)) : 0;
  };

  return (
    <div className="space-y-3">
      <div>
        <p className="mb-1 text-xs font-medium text-slate-500 dark:text-slate-400">Ready-made</p>
        <div role="group" aria-label="Gradients" className="grid grid-cols-6 gap-1.5">
          {GRADIENT_PRESETS.map((preset, index) => (
            <button key={preset} type="button" disabled={disabled} aria-label={`Gradient ${index + 1}`} aria-pressed={value === preset} onClick={() => onChange(preset)} className={`h-9 rounded-lg border border-black/10 dark:border-white/20 ${value === preset ? 'ring-2 ring-indigo-500 ring-offset-1 dark:ring-offset-slate-900' : ''}`} style={{ background: resolve(preset) }} />
          ))}
        </div>
      </div>

      <div>
        <p className="mb-1 text-xs font-medium text-slate-500 dark:text-slate-400">Make your own: click the bar to add a color</p>
        <div
          ref={barRef}
          data-testid="gradient-bar"
          className="relative h-8 rounded-lg border border-black/10 dark:border-white/20 cursor-copy"
          style={{ background: preview }}
          onClick={(event) => {
            if (disabled || (event.target as HTMLElement).closest('button')) return;
            const position = positionOf(event.clientX);
            update({ stops: [...stops, { color: colorAt(stops, position), position }] });
            setSelected(stops.length);
          }}
        >
          {stops.map((stop, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Color stop ${index + 1}`}
              aria-pressed={index === current}
              disabled={disabled}
              className={`absolute top-1/2 w-4 h-7 -ml-2 -translate-y-1/2 rounded border-2 border-white shadow cursor-grab touch-none ${index === current ? 'ring-2 ring-indigo-600' : 'ring-1 ring-black/30'}`}
              style={{ left: `${stop.position}%`, background: resolve(stop.color) }}
              onClick={() => setSelected(index)}
              onPointerDown={(event) => {
                setSelected(index);
                event.currentTarget.setPointerCapture(event.pointerId);
              }}
              onPointerMove={(event) => {
                if (event.currentTarget.hasPointerCapture(event.pointerId)) setStop(index, { position: positionOf(event.clientX) });
              }}
              onKeyDown={(event) => {
                if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
                event.preventDefault();
                setStop(index, { position: Math.min(100, Math.max(0, stop.position + (event.key === 'ArrowRight' ? 1 : -1) * (event.shiftKey ? 10 : 1))) });
              }}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div role="group" aria-label="Gradient type" className="flex p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800">
          {(['linear', 'radial'] as const).map((kind) => (
            <button key={kind} type="button" disabled={disabled} aria-pressed={gradient.kind === kind} onClick={() => update({ kind })} className={`h-7 px-2.5 rounded-md text-xs font-medium ${gradient.kind === kind ? 'bg-white dark:bg-slate-600 text-indigo-700 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-300'}`}>
              {kind === 'linear' ? 'In a line' : 'From the center'}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <button type="button" disabled={disabled} aria-label="Add a color" title="Add a color" className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 hover:border-indigo-400" onClick={() => {
            update({ stops: [...stops, { color: colorAt(stops, 50), position: 50 }] });
            setSelected(stops.length);
          }}>
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
          <button type="button" disabled={disabled || stops.length <= 2} aria-label="Remove this color" title="Remove this color" className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 hover:border-rose-400 disabled:opacity-40" onClick={() => {
            update({ stops: stops.filter((_, index) => index !== current) });
            setSelected(0);
          }}>
            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {gradient.kind === 'linear' && (
        <div>
          <label className="block mb-1 text-xs font-medium text-slate-500 dark:text-slate-400" htmlFor="gradient-angle">Direction: {Math.round(gradient.angle)} degrees</label>
          <input id="gradient-angle" type="range" min={0} max={359} disabled={disabled} className="w-full accent-indigo-600" value={Math.round(gradient.angle)} onChange={(event) => update({ angle: Number(event.target.value) })} />
          <div className="mt-1 grid grid-cols-8 gap-1">
            {ANGLES.map((angle) => (
              <button key={angle} type="button" disabled={disabled} aria-label={`${angle} degrees`} aria-pressed={Math.round(gradient.angle) === angle} onClick={() => update({ angle })} className={`h-6 flex items-center justify-center rounded border text-xs ${Math.round(gradient.angle) === angle ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300' : 'border-slate-200 dark:border-slate-700 text-slate-500'}`}>
                <span aria-hidden="true" style={{ transform: `rotate(${angle}deg)`, display: 'inline-block' }}>↑</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {!disabled && (
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Color {current + 1} of {stops.length}</p>
          <ColorPanel key={current} label={`Color ${current + 1}`} value={stops[current]?.color ?? ''} onChange={(color) => setStop(current, { color })} />
        </div>
      )}
    </div>
  );
};
