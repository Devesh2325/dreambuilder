// Google Fonts Dynamic Loader & Typography Registry

export interface FontDefinition {
  family: string;
  category: 'sans-serif' | 'serif' | 'display' | 'monospace';
  weights: number[];
  popular?: boolean;
}

export const POPULAR_FONTS: FontDefinition[] = [
  // Sans-Serif
  { family: 'Inter', category: 'sans-serif', weights: [300, 400, 500, 600, 700, 800, 900], popular: true },
  { family: 'Plus Jakarta Sans', category: 'sans-serif', weights: [400, 500, 600, 700, 800], popular: true },
  { family: 'Poppins', category: 'sans-serif', weights: [300, 400, 500, 600, 700, 800], popular: true },
  { family: 'Outfit', category: 'sans-serif', weights: [300, 400, 500, 600, 700, 800], popular: true },
  { family: 'Roboto', category: 'sans-serif', weights: [300, 400, 500, 700, 900], popular: true },
  { family: 'DM Sans', category: 'sans-serif', weights: [400, 500, 700], popular: true },
  { family: 'Manrope', category: 'sans-serif', weights: [400, 500, 600, 700, 800], popular: true },
  { family: 'Sora', category: 'sans-serif', weights: [300, 400, 600, 700, 800], popular: true },
  { family: 'Montserrat', category: 'sans-serif', weights: [300, 400, 500, 600, 700, 800], popular: true },
  { family: 'Work Sans', category: 'sans-serif', weights: [300, 400, 500, 600, 700] },
  { family: 'Rubik', category: 'sans-serif', weights: [300, 400, 500, 600, 700] },
  { family: 'Nunito', category: 'sans-serif', weights: [300, 400, 600, 700, 800] },

  // Display & Modern Tech
  { family: 'Space Grotesk', category: 'display', weights: [400, 500, 600, 700], popular: true },
  { family: 'Syne', category: 'display', weights: [500, 600, 700, 800], popular: true },
  { family: 'Clash Display', category: 'display', weights: [500, 600, 700] },
  { family: 'Cabinet Grotesk', category: 'display', weights: [500, 700, 800] },
  { family: 'Righteous', category: 'display', weights: [400] },

  // Serif (Editorial & Premium)
  { family: 'Playfair Display', category: 'serif', weights: [400, 500, 600, 700, 800], popular: true },
  { family: 'Lora', category: 'serif', weights: [400, 500, 600, 700], popular: true },
  { family: 'Merriweather', category: 'serif', weights: [300, 400, 700, 900] },
  { family: 'Cinzel', category: 'serif', weights: [400, 600, 700] },
  { family: 'Bodoni Moda', category: 'serif', weights: [400, 600, 700, 800] },

  // Monospace (Code & Developer SaaS)
  { family: 'JetBrains Mono', category: 'monospace', weights: [400, 500, 600, 700], popular: true },
  { family: 'Fira Code', category: 'monospace', weights: [400, 500, 600, 700], popular: true },
  { family: 'Space Mono', category: 'monospace', weights: [400, 700] },
  { family: 'IBM Plex Mono', category: 'monospace', weights: [400, 500, 600] },
];

const loadedFonts = new Set<string>();

/**
 * Dynamically injects a Google Font into document <head>
 */
export function loadGoogleFont(fontFamily: string): void {
  // Strip quotes or fallbacks (e.g., "'Inter', sans-serif" -> "Inter")
  const cleanName = fontFamily.replace(/['"]/g, '').split(',')[0].trim();
  if (!cleanName || cleanName.toLowerCase() === 'system-ui' || loadedFonts.has(cleanName)) {
    return;
  }

  const fontDef = POPULAR_FONTS.find(f => f.family.toLowerCase() === cleanName.toLowerCase());
  const weights = fontDef?.weights || [400, 600, 700];
  const weightStr = weights.join(';');

  const formattedName = cleanName.replace(/ /g, '+');
  const fontUrl = `https://fonts.googleapis.com/css2?family=${formattedName}:wght@${weightStr}&display=swap`;

  const linkId = `google-font-${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
  if (document.getElementById(linkId)) {
    loadedFonts.add(cleanName);
    return;
  }

  const link = document.createElement('link');
  link.id = linkId;
  link.rel = 'stylesheet';
  link.href = fontUrl;
  document.head.appendChild(link);

  loadedFonts.add(cleanName);
}

/**
 * Preloads the top popular fonts so previews render instantly
 */
export function preloadPopularFonts(): void {
  POPULAR_FONTS.filter(f => f.popular).forEach(f => {
    loadGoogleFont(f.family);
  });
}
