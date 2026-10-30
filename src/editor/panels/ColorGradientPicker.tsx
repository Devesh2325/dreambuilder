import React, { useState, useEffect } from 'react';
import { 
  Palette, 
  Sparkles, 
  RotateCw, 
  Plus, 
  Trash2, 
  Check, 
  Sliders, 
  ChevronDown,
  Layers,
  ShieldCheck,
  AlertTriangle,
  Flame
} from 'lucide-react';
import { generateHarmonies, getWcagRating } from '../../services/colorHarmonies';

export interface GradientStop {
  color: string;
  position: number; // 0 to 100
}

interface ColorGradientPickerProps {
  value?: string;
  onChange: (value: string) => void;
  label?: string;
  allowGradient?: boolean;
  comparisonColor?: string; // Color to test WCAG contrast against (e.g. text against bg)
}

const PRESET_SOLID_COLORS = [
  'transparent',
  '#000000',
  '#ffffff',
  '#f8fafc',
  '#f1f5f9',
  '#e2e8f0',
  '#64748b',
  '#0f172a',
  '#ef4444',
  '#f97316',
  '#f59e0b',
  '#10b981',
  '#06b6d4',
  '#3b82f6',
  '#6366f1',
  '#8b5cf6',
  '#ec4899',
  '#4f46e5',
  '#1e293b',
  '#334155'
];

const PRESET_GRADIENTS = [
  { name: 'Indigo Dream', css: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)' },
  { name: 'Sunset Glow', css: 'linear-gradient(135deg, #ff6b6b 0%, #ffa502 100%)' },
  { name: 'Ocean Breeze', css: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)' },
  { name: 'Emerald Isle', css: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' },
  { name: 'Dark Nebula', css: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)' },
  { name: 'Rose Petal', css: 'linear-gradient(135deg, #f43f5e 0%, #fb7185 100%)' },
  { name: 'Soft Pearl', css: 'linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)' },
  { name: 'Cyber Neon', css: 'linear-gradient(90deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%)' },
  { name: 'Radial Flare', css: 'radial-gradient(circle at center, #6366f1 0%, #0f172a 100%)' },
  { name: 'Frosted Glass', css: 'rgba(255, 255, 255, 0.25)' },
  { name: 'Obsidian Glass', css: 'rgba(15, 23, 42, 0.75)' },
];

export const ColorGradientPicker: React.FC<ColorGradientPickerProps> = ({
  value = '#ffffff',
  onChange,
  label,
  allowGradient = true,
  comparisonColor = '#ffffff',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const isGradientValue = value?.includes('gradient') ?? false;
  const [mode, setMode] = useState<'solid' | 'gradient' | 'harmonies'>(isGradientValue ? 'gradient' : 'solid');

  // Solid State
  const [solidColor, setSolidColor] = useState(isGradientValue ? '#6366f1' : (value || '#ffffff'));
  const [solidAlpha, setSolidAlpha] = useState(100);

  // Gradient State
  const [gradientType, setGradientType] = useState<'linear' | 'radial'>('linear');
  const [linearAngle, setLinearAngle] = useState(135);
  const [stops, setStops] = useState<GradientStop[]>([
    { color: '#6366f1', position: 0 },
    { color: '#a855f7', position: 100 }
  ]);

  // Sync internal state when prop value changes
  useEffect(() => {
    if (!value) return;
    if (value.startsWith('linear-gradient') || value.startsWith('radial-gradient')) {
      setMode('gradient');
      if (value.startsWith('radial-gradient')) {
        setGradientType('radial');
      } else {
        setGradientType('linear');
        const angleMatch = value.match(/(\d+)deg/);
        if (angleMatch) setLinearAngle(parseInt(angleMatch[1], 10));
      }
    } else {
      if (value !== 'transparent') {
        setSolidColor(value);
      }
    }
  }, [value]);

  const handleSolidChange = (hex: string, alpha = solidAlpha) => {
    setSolidColor(hex);
    setSolidAlpha(alpha);
    if (hex === 'transparent') {
      onChange('transparent');
      return;
    }
    if (alpha < 100) {
      // convert hex to rgba
      const r = parseInt(hex.slice(1, 3), 16) || 0;
      const g = parseInt(hex.slice(3, 5), 16) || 0;
      const b = parseInt(hex.slice(5, 7), 16) || 0;
      const a = (alpha / 100).toFixed(2);
      onChange(`rgba(${r}, ${g}, ${b}, ${a})`);
    } else {
      onChange(hex);
    }
  };

  const buildGradientString = (
    type: 'linear' | 'radial',
    angle: number,
    currentStops: GradientStop[]
  ) => {
    const sortedStops = [...currentStops].sort((a, b) => a.position - b.position);
    const stopString = sortedStops.map(s => `${s.color} ${s.position}%`).join(', ');
    if (type === 'linear') {
      return `linear-gradient(${angle}deg, ${stopString})`;
    } else {
      return `radial-gradient(circle at center, ${stopString})`;
    }
  };

  const handleGradientUpdate = (
    type = gradientType,
    angle = linearAngle,
    currentStops = stops
  ) => {
    const css = buildGradientString(type, angle, currentStops);
    onChange(css);
  };

  const addStop = () => {
    if (stops.length >= 5) return;
    const newPos = Math.round((stops[0].position + stops[stops.length - 1].position) / 2);
    const newStops = [...stops, { color: '#ec4899', position: newPos }].sort((a, b) => a.position - b.position);
    setStops(newStops);
    handleGradientUpdate(gradientType, linearAngle, newStops);
  };

  const removeStop = (index: number) => {
    if (stops.length <= 2) return;
    const newStops = stops.filter((_, i) => i !== index);
    setStops(newStops);
    handleGradientUpdate(gradientType, linearAngle, newStops);
  };

  const updateStopColor = (index: number, color: string) => {
    const newStops = stops.map((s, i) => i === index ? { ...s, color } : s);
    setStops(newStops);
    handleGradientUpdate(gradientType, linearAngle, newStops);
  };

  const updateStopPosition = (index: number, position: number) => {
    const newStops = stops.map((s, i) => i === index ? { ...s, position } : s);
    setStops(newStops);
    handleGradientUpdate(gradientType, linearAngle, newStops);
  };

  // Contrast & Harmonies calculation
  const cleanHex = solidColor.startsWith('#') ? solidColor : '#4f46e5';
  const wcagRating = getWcagRating(cleanHex, comparisonColor.startsWith('#') ? comparisonColor : '#ffffff');
  const harmonies = generateHarmonies(cleanHex);

  return (
    <div className="space-y-1.5 text-xs font-sans">
      <div className="flex items-center justify-between">
        {label && <label className="text-slate-400 font-medium block">{label}</label>}
        {/* Real-time WCAG rating badge */}
        {mode === 'solid' && (
          <span 
            className={`text-[9px] font-bold px-1.5 py-0.2 rounded border flex items-center gap-1 ${
              wcagRating.label === 'AAA' 
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' 
                : wcagRating.label === 'AA' 
                ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40' 
                : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
            }`}
            title={`WCAG 2.1 Contrast Ratio: ${wcagRating.ratio}:1 against background`}
          >
            <ShieldCheck className="w-2.5 h-2.5" />
            <span>WCAG {wcagRating.label} ({wcagRating.ratio}:1)</span>
          </span>
        )}
      </div>

      {/* Trigger & Preview Bar */}
      <div className="relative">
        <div 
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-900 border border-slate-700/80 rounded-lg hover:border-slate-600 cursor-pointer transition-colors shadow-sm"
        >
          {/* Swatch chip */}
          <div 
            className="w-5 h-5 rounded border border-slate-600 shadow-inner flex-shrink-0"
            style={{ 
              background: value || 'transparent',
              backgroundImage: !value || value === 'transparent' ? 'repeating-conic-gradient(#334155 0% 25%, #1e293b 0% 50%) 50% / 8px 8px' : undefined
            }}
          />
          <span className="font-mono text-slate-300 truncate flex-1 select-none text-[11px]">
            {value || 'None'}
          </span>
          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>

        {/* Picker Dropdown Popover */}
        {isOpen && (
          <div className="absolute z-50 left-0 right-0 mt-2 p-3 bg-slate-900/98 backdrop-blur-md border border-slate-700/90 rounded-2xl shadow-2xl space-y-3.5 animate-in fade-in zoom-in-95 duration-150">
            {/* Mode Tabs (Solid / Gradient / Harmonies) */}
            <div className={`grid ${allowGradient ? 'grid-cols-3' : 'grid-cols-2'} p-0.5 bg-slate-800/90 rounded-xl border border-slate-700/60`}>
              <button
                type="button"
                onClick={() => {
                  setMode('solid');
                  handleSolidChange(solidColor);
                }}
                className={`py-1 rounded-lg text-center font-semibold text-[11px] transition-all ${
                  mode === 'solid' 
                    ? 'bg-indigo-600 text-white shadow-sm' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Solid
              </button>
              {allowGradient && (
                <button
                  type="button"
                  onClick={() => {
                    setMode('gradient');
                    handleGradientUpdate(gradientType, linearAngle, stops);
                  }}
                  className={`py-1 rounded-lg text-center font-semibold text-[11px] transition-all ${
                    mode === 'gradient' 
                      ? 'bg-indigo-600 text-white shadow-sm' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Gradient
                </button>
              )}
              <button
                type="button"
                onClick={() => setMode('harmonies')}
                className={`py-1 rounded-lg text-center font-semibold text-[11px] transition-all ${
                  mode === 'harmonies' 
                    ? 'bg-indigo-600 text-white shadow-sm' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Harmonies
              </button>
            </div>

            {/* 1. SOLID MODE */}
            {mode === 'solid' && (
              <div className="space-y-3">
                {/* Custom HEX / Color Picker input */}
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={solidColor.startsWith('#') && solidColor.length === 7 ? solidColor : '#4f46e5'}
                    onChange={(e) => handleSolidChange(e.target.value)}
                    className="w-8 h-8 rounded-lg border border-slate-700 bg-transparent cursor-pointer p-0"
                  />
                  <input
                    type="text"
                    value={solidColor}
                    onChange={(e) => handleSolidChange(e.target.value)}
                    placeholder="#ffffff or rgba(...)"
                    className="flex-1 px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 font-mono text-[11px] focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Opacity Slider */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Opacity</span>
                    <span>{solidAlpha}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={solidAlpha}
                    onChange={(e) => handleSolidChange(solidColor, parseInt(e.target.value, 10))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>

                {/* Preset Solid Swatches */}
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Swatches</span>
                  <div className="grid grid-cols-10 gap-1.5 pt-1">
                    {PRESET_SOLID_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => handleSolidChange(c)}
                        title={c}
                        className={`w-5 h-5 rounded-md border transition-transform hover:scale-110 ${
                          solidColor.toLowerCase() === c.toLowerCase() 
                            ? 'border-indigo-500 ring-2 ring-indigo-500/30' 
                            : 'border-slate-700 hover:border-slate-500'
                        }`}
                        style={{
                          background: c,
                          backgroundImage: c === 'transparent' ? 'repeating-conic-gradient(#475569 0% 25%, #1e293b 0% 50%) 50% / 6px 6px' : undefined
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 2. GRADIENT MODE */}
            {mode === 'gradient' && (
              <div className="space-y-3.5">
                {/* Gradient Type & Angle */}
                <div className="flex items-center gap-2">
                  <div className="flex bg-slate-800 border border-slate-700 rounded-lg p-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setGradientType('linear');
                        handleGradientUpdate('linear', linearAngle, stops);
                      }}
                      className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                        gradientType === 'linear' ? 'bg-slate-700 text-white' : 'text-slate-400'
                      }`}
                    >
                      Linear
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setGradientType('radial');
                        handleGradientUpdate('radial', linearAngle, stops);
                      }}
                      className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                        gradientType === 'radial' ? 'bg-slate-700 text-white' : 'text-slate-400'
                      }`}
                    >
                      Radial
                    </button>
                  </div>

                  {gradientType === 'linear' && (
                    <div className="flex-1 flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded-lg px-2 py-0.5">
                      <RotateCw className="w-3 h-3 text-slate-400" />
                      <input
                        type="number"
                        min="0"
                        max="360"
                        value={linearAngle}
                        onChange={(e) => {
                          const ang = parseInt(e.target.value, 10) || 0;
                          setLinearAngle(ang);
                          handleGradientUpdate('linear', ang, stops);
                        }}
                        className="w-12 bg-transparent text-slate-200 text-center font-mono text-[11px] focus:outline-none"
                      />
                      <span className="text-slate-400 text-[10px]">deg</span>
                    </div>
                  )}
                </div>

                {/* Linear Angle Quick Presets */}
                {gradientType === 'linear' && (
                  <div className="flex gap-1 justify-between">
                    {[0, 45, 90, 135, 180, 270].map((deg) => (
                      <button
                        key={deg}
                        type="button"
                        onClick={() => {
                          setLinearAngle(deg);
                          handleGradientUpdate('linear', deg, stops);
                        }}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-all ${
                          linearAngle === deg 
                            ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/50' 
                            : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-600'
                        }`}
                      >
                        {deg}°
                      </button>
                    ))}
                  </div>
                )}

                {/* Color Stops List */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[11px] text-slate-400">
                    <span>Color Stops</span>
                    {stops.length < 5 && (
                      <button
                        type="button"
                        onClick={addStop}
                        className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 text-[11px]"
                      >
                        <Plus className="w-3 h-3" /> Add Stop
                      </button>
                    )}
                  </div>

                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {stops.map((stop, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-1.5 bg-slate-800/80 border border-slate-700/60 rounded-lg">
                        <input
                          type="color"
                          value={stop.color}
                          onChange={(e) => updateStopColor(idx, e.target.value)}
                          className="w-6 h-6 rounded border border-slate-600 bg-transparent cursor-pointer p-0"
                        />
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={stop.position}
                          onChange={(e) => updateStopPosition(idx, parseInt(e.target.value, 10))}
                          className="flex-1 h-1 bg-slate-700 rounded appearance-none cursor-pointer accent-indigo-500"
                        />
                        <span className="w-8 text-right font-mono text-[10px] text-slate-300">
                          {stop.position}%
                        </span>
                        {stops.length > 2 && (
                          <button
                            type="button"
                            onClick={() => removeStop(idx)}
                            className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Popular Gradient & Glass Presets */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Themes & Glass</span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {PRESET_GRADIENTS.map((g) => (
                      <button
                        key={g.name}
                        type="button"
                        onClick={() => onChange(g.css)}
                        title={g.name}
                        className="h-7 rounded-md border border-slate-700/80 hover:border-indigo-400 relative overflow-hidden group transition-all"
                        style={{ background: g.css }}
                      >
                        <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[9px] text-white font-medium transition-opacity">
                          {g.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 3. COLOR HARMONIES TAB */}
            {mode === 'harmonies' && harmonies && (
              <div className="space-y-3">
                <div className="p-2 bg-slate-800/80 rounded-xl border border-slate-700 text-[11px] text-slate-300 flex items-center justify-between">
                  <span>Base: <strong className="font-mono text-indigo-400">{cleanHex}</strong></span>
                  <span className="text-[10px] text-slate-400">Click swatch to apply</span>
                </div>

                {/* Complementary */}
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Complementary (180°)</span>
                  <div className="flex gap-2">
                    {harmonies.complementary.map((c, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSolidChange(c)}
                        className="flex-1 h-7 rounded-lg border border-slate-700 hover:scale-105 transition-transform"
                        style={{ backgroundColor: c }}
                        title={c}
                      />
                    ))}
                  </div>
                </div>

                {/* Analogous */}
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Analogous (±30°)</span>
                  <div className="flex gap-2">
                    {harmonies.analogous.map((c, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSolidChange(c)}
                        className="flex-1 h-7 rounded-lg border border-slate-700 hover:scale-105 transition-transform"
                        style={{ backgroundColor: c }}
                        title={c}
                      />
                    ))}
                  </div>
                </div>

                {/* Triadic */}
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Triadic (120°)</span>
                  <div className="flex gap-2">
                    {harmonies.triadic.map((c, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSolidChange(c)}
                        className="flex-1 h-7 rounded-lg border border-slate-700 hover:scale-105 transition-transform"
                        style={{ backgroundColor: c }}
                        title={c}
                      />
                    ))}
                  </div>
                </div>

                {/* Monochromatic */}
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Monochromatic Shades</span>
                  <div className="flex gap-1.5">
                    {harmonies.monochromatic.map((c, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSolidChange(c)}
                        className="flex-1 h-6 rounded-md border border-slate-700 hover:scale-105 transition-transform"
                        style={{ backgroundColor: c }}
                        title={c}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Apply & Close */}
            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow transition-colors flex items-center gap-1.5"
              >
                <Check className="w-3 h-3" /> Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
