import { Theme } from '../core/schema';
import { ThemePreset } from './dsl';

const preset = (name: string, theme: Partial<Theme> & Pick<Theme, 'primary'>): ThemePreset => ({
  name,
  theme: {
    secondary: '#0f172a',
    background: '#ffffff',
    surface: '#f8fafc',
    text: '#0f172a',
    muted: '#64748b',
    radius: '10px',
    fontHeading: 'Inter',
    fontBody: 'Inter',
    ...theme,
  },
});

export const THEME_INDIGO = preset('Modern indigo', { primary: '#4f46e5', fontHeading: 'Plus Jakarta Sans', fontBody: 'Inter' });
export const THEME_MIDNIGHT = preset('Midnight', {
  primary: '#a78bfa', secondary: '#e2e8f0', background: '#0f172a', surface: '#1e293b', text: '#f1f5f9', muted: '#94a3b8',
  fontHeading: 'Space Grotesk', fontBody: 'Inter',
});
export const THEME_EMERALD = preset('Fresh green', { primary: '#059669', surface: '#ecfdf5', fontHeading: 'Outfit', fontBody: 'DM Sans', radius: '14px' });
export const THEME_TERRACOTTA = preset('Warm terracotta', {
  primary: '#b45309', secondary: '#451a03', background: '#fffbf5', surface: '#fef3e2', text: '#292524', muted: '#78716c',
  fontHeading: 'Playfair Display', fontBody: 'Lora', radius: '4px',
});
export const THEME_MONO = preset('Clean mono', {
  primary: '#111827', surface: '#f3f4f6', text: '#111827', muted: '#6b7280', fontHeading: 'Manrope', fontBody: 'Manrope', radius: '0px',
});
export const THEME_CORAL = preset('Friendly coral', { primary: '#e11d48', surface: '#fff1f2', fontHeading: 'Poppins', fontBody: 'Nunito', radius: '16px' });

export const THEME_OCEAN = preset('Calm ocean', { primary: '#0369a1', secondary: '#0c4a6e', surface: '#f0f9ff', fontHeading: 'Sora', fontBody: 'DM Sans', radius: '12px' });
export const THEME_DARK_TEAL = preset('Deep teal', {
  primary: '#2dd4bf', secondary: '#99f6e4', background: '#091a24', surface: '#0f2733', text: '#f1f5f9', muted: '#94a3b8',
  fontHeading: 'Space Grotesk', fontBody: 'Inter', radius: '10px',
});

export const ALL_THEMES = [THEME_INDIGO, THEME_MIDNIGHT, THEME_DARK_TEAL, THEME_EMERALD, THEME_TERRACOTTA, THEME_MONO, THEME_CORAL, THEME_OCEAN];
