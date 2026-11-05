// Color and gradient conversions for the picker. No React, so they're easy to test.

export interface Hsva {
  /** 0 to 360. */
  h: number;
  /** 0 to 100. */
  s: number;
  /** 0 to 100. */
  v: number;
  /** 0 to 1. */
  a: number;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const toHex = (value: number) => Math.round(clamp(value, 0, 255)).toString(16).padStart(2, '0');

export const rgbToHsv = (r: number, g: number, b: number, a = 1): Hsva => {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;
  let h = 0;
  if (delta > 0) {
    if (max === red) h = 60 * (((green - blue) / delta + 6) % 6);
    else if (max === green) h = 60 * ((blue - red) / delta + 2);
    else h = 60 * ((red - green) / delta + 4);
  }
  return { h, s: max === 0 ? 0 : (delta / max) * 100, v: max * 100, a };
};

export const hsvToRgb = ({ h, s, v }: Pick<Hsva, 'h' | 's' | 'v'>): [number, number, number] => {
  const sat = s / 100;
  const val = v / 100;
  const chroma = val * sat;
  const part = chroma * (1 - Math.abs(((h / 60) % 2) - 1));
  const low = val - chroma;
  const sector = Math.floor(((h % 360) + 360) % 360 / 60);
  const [r, g, b] = [[chroma, part, 0], [part, chroma, 0], [0, chroma, part], [0, part, chroma], [part, 0, chroma], [chroma, 0, part]][sector];
  return [(r + low) * 255, (g + low) * 255, (b + low) * 255];
};

/** Understands hex and rgb(a). Anything else, such as a theme variable, gives null. */
export const parseColor = (value: string): Hsva | null => {
  const text = value.trim();
  const hex = text.match(/^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i)?.[1];
  if (hex) {
    const full = hex.length <= 4 ? [...hex].map((c) => c + c).join('') : hex;
    const channel = (start: number) => parseInt(full.slice(start, start + 2), 16);
    return rgbToHsv(channel(0), channel(2), channel(4), full.length === 8 ? channel(6) / 255 : 1);
  }
  const rgb = text.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.]+%?))?\s*\)$/i);
  if (rgb) {
    const alpha = rgb[4] === undefined ? 1 : rgb[4].endsWith('%') ? parseFloat(rgb[4]) / 100 : parseFloat(rgb[4]);
    return rgbToHsv(Number(rgb[1]), Number(rgb[2]), Number(rgb[3]), clamp(alpha, 0, 1));
  }
  return null;
};

/** Hex when fully opaque, which is easiest to read and paste, and rgba otherwise. */
export const formatColor = (color: Hsva): string => {
  const [r, g, b] = hsvToRgb(color);
  if (color.a >= 1) return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${Number(color.a.toFixed(2))})`;
};

export interface GradientStop {
  color: string;
  /** 0 to 100. */
  position: number;
}

export interface Gradient {
  kind: 'linear' | 'radial';
  /** Only used by linear gradients. */
  angle: number;
  stops: GradientStop[];
}

/** Splits on commas outside brackets, so rgba(0, 0, 0, 1) stays in one piece. */
const splitArguments = (text: string): string[] => {
  const parts: string[] = [];
  let depth = 0;
  let current = '';
  for (const char of text) {
    if (char === '(') depth += 1;
    if (char === ')') depth -= 1;
    if (char === ',' && depth === 0) {
      parts.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
};

const DIRECTIONS: Record<string, number> = {
  'to top': 0, 'to top right': 45, 'to right': 90, 'to bottom right': 135, 'to bottom': 180, 'to bottom left': 225, 'to left': 270, 'to top left': 315,
};

export const parseGradient = (value: string): Gradient | null => {
  const match = value.trim().match(/^(linear|radial)-gradient\((.*)\)$/is);
  if (!match) return null;
  const kind = match[1].toLowerCase() as Gradient['kind'];
  const parts = splitArguments(match[2]);
  let angle = kind === 'linear' ? 180 : 135;
  const first = parts[0]?.toLowerCase() ?? '';
  if (/^-?[\d.]+deg$/.test(first)) {
    angle = parseFloat(first);
    parts.shift();
  } else if (first in DIRECTIONS) {
    angle = DIRECTIONS[first];
    parts.shift();
  } else if (kind === 'radial' && /^(circle|ellipse|closest|farthest|at )/.test(first)) {
    parts.shift();
  }
  const raw = parts.map((part) => {
    const stop = part.match(/^(.*?)(?:\s+(-?[\d.]+)%)?$/s);
    return { color: (stop?.[1] ?? part).trim(), position: stop?.[2] === undefined ? null : parseFloat(stop[2]) };
  });
  if (raw.length < 2) return null;
  // Stops with no position share out the space evenly, as browsers do at the ends.
  const stops = raw.map((stop, index) => ({ color: stop.color, position: clamp(stop.position ?? (index / (raw.length - 1)) * 100, 0, 100) }));
  return { kind, angle: ((angle % 360) + 360) % 360, stops };
};

export const formatGradient = ({ kind, angle, stops }: Gradient): string => {
  const list = [...stops].sort((a, b) => a.position - b.position).map((stop) => `${stop.color} ${Math.round(stop.position)}%`).join(', ');
  return kind === 'radial' ? `radial-gradient(circle, ${list})` : `linear-gradient(${Math.round(angle)}deg, ${list})`;
};

/** The color partway along a gradient, used when adding a stop so nothing visibly changes. */
export const colorAt = (stops: GradientStop[], position: number): string => {
  const sorted = [...stops].sort((a, b) => a.position - b.position);
  const after = sorted.findIndex((stop) => stop.position >= position);
  if (after <= 0) return sorted[0].color;
  const left = sorted[after - 1];
  const right = sorted[after];
  const from = parseColor(left.color);
  const to = parseColor(right.color);
  if (!from || !to) return left.color;
  const share = (position - left.position) / Math.max(right.position - left.position, 1);
  const [r1, g1, b1] = hsvToRgb(from);
  const [r2, g2, b2] = hsvToRgb(to);
  const mix = (a: number, b: number) => a + (b - a) * share;
  return formatColor({ ...rgbToHsv(mix(r1, r2), mix(g1, g2), mix(b1, b2)), a: mix(from.a, to.a) });
};
