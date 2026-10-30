// Mathematical Color Harmonies & WCAG 2.1 Contrast Engine

export interface HSL {
  h: number; // 0 - 360
  s: number; // 0 - 100
  l: number; // 0 - 100
}

export interface RGB {
  r: number; // 0 - 255
  g: number; // 0 - 255
  b: number; // 0 - 255
}

export function hexToRgb(hex: string): RGB {
  let cleanHex = hex.replace('#', '').trim();
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(c => c + c).join('');
  }
  const num = parseInt(cleanHex, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export function rgbToHex(rgb: RGB): string {
  const toHex = (c: number) => {
    const hex = Math.round(Math.max(0, Math.min(255, c))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

export function rgbToHsl(rgb: RGB): HSL {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

export function hslToRgb(hsl: HSL): RGB {
  const h = hsl.h / 360;
  const s = hsl.s / 100;
  const l = hsl.l / 100;

  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

export function hslToHex(hsl: HSL): string {
  return rgbToHex(hslToRgb(hsl));
}

/**
 * Calculates WCAG 2.1 Relative Luminance
 */
export function getLuminance(rgb: RGB): number {
  const a = [rgb.r, rgb.g, rgb.b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

/**
 * Calculates WCAG Contrast Ratio between two colors (e.g. 4.5:1)
 */
export function getContrastRatio(color1Hex: string, color2Hex: string): number {
  try {
    const rgb1 = hexToRgb(color1Hex);
    const rgb2 = hexToRgb(color2Hex);
    const lum1 = getLuminance(rgb1);
    const lum2 = getLuminance(rgb2);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    const ratio = (brightest + 0.05) / (darkest + 0.05);
    return Math.round(ratio * 10) / 10;
  } catch {
    return 1;
  }
}

export interface WcagRating {
  ratio: number;
  aaNormal: boolean;
  aaLarge: boolean;
  aaaNormal: boolean;
  label: 'AAA' | 'AA' | 'AA Large' | 'Fail';
}

export function getWcagRating(fgHex: string, bgHex: string): WcagRating {
  const ratio = getContrastRatio(fgHex, bgHex);
  const aaNormal = ratio >= 4.5;
  const aaLarge = ratio >= 3.0;
  const aaaNormal = ratio >= 7.0;

  let label: WcagRating['label'] = 'Fail';
  if (aaaNormal) label = 'AAA';
  else if (aaNormal) label = 'AA';
  else if (aaLarge) label = 'AA Large';

  return { ratio, aaNormal, aaLarge, aaaNormal, label };
}

/**
 * Generates harmonic palettes based on a base HEX color
 */
export function generateHarmonies(baseHex: string) {
  try {
    const rgb = hexToRgb(baseHex);
    const hsl = rgbToHsl(rgb);

    const shift = (deltaH: number, deltaS = 0, deltaL = 0): string => {
      const newH = (hsl.h + deltaH + 360) % 360;
      const newS = Math.max(10, Math.min(100, hsl.s + deltaS));
      const newL = Math.max(10, Math.min(95, hsl.l + deltaL));
      return hslToHex({ h: newH, s: newS, l: newL });
    };

    return {
      complementary: [baseHex, shift(180)],
      analogous: [shift(-30), baseHex, shift(30)],
      triadic: [baseHex, shift(120), shift(240)],
      splitComplementary: [baseHex, shift(150), shift(210)],
      monochromatic: [
        shift(0, 0, -30),
        shift(0, 0, -15),
        baseHex,
        shift(0, 0, 15),
        shift(0, 0, 30),
      ],
    };
  } catch {
    return null;
  }
}
