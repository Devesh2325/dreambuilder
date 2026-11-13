import { Theme } from '../core/schema';
import { RenderNode } from '../core/variables';

export const TABLET_MAX = 991;
export const MOBILE_MAX = 640;

const UNITLESS = new Set(['opacity', 'zIndex', 'fontWeight', 'lineHeight', 'flexGrow', 'flexShrink', 'order', 'flex', 'animationIterationCount']);

/**
 * Style values are user data placed inside a stylesheet. Anything able to end the
 * declaration or load outside code is dropped: without this a value like
 * "red}body{display:none" would restyle the page.
 */
export function safeCssValue(value: string | number): string | null {
  const text = String(value).trim();
  if (text === '') return null;
  // Demo mode stores uploads as data. Base64 raster images can't carry code or close the rule.
  const checked = text.replace(/url\(\s*(['"]?)data:image\/(png|jpe?g|webp|gif);base64,[a-z0-9+/=]+\1\s*\)/gi, 'url(https://data)');
  if (/[;{}<>\\]|\/\*|expression\s*\(|@import/i.test(checked)) return null;
  // Quotes are matched as a pair, so a ")" inside an address can't end the match early.
  const URL_PATTERN = /url\(\s*(?:"([^"]*)"|'([^']*)'|([^'"\s)]*))\s*\)/gi;
  for (const match of checked.matchAll(URL_PATTERN)) {
    if (!/^https?:\/\//i.test(match[1] ?? match[2] ?? match[3] ?? '')) return null;
  }
  // A url( that didn't fit the pattern went unchecked, so it isn't allowed.
  if (/url\(/i.test(checked.replace(URL_PATTERN, ''))) return null;
  return text;
}

function declarations(styles: Record<string, string | number> | undefined): string {
  if (!styles) return '';
  let css = '';
  const hasHover = Boolean(
    styles.hoverEffect || styles.hoverBackground || styles.hoverColor || styles.hoverBorderColor ||
    styles.hoverTransform || styles.hoverShadow || styles.hoverOpacity
  );
  const transition = styles.transition || (hasHover ? 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)' : '');

  for (const [property, raw] of Object.entries(styles)) {
    if (property.startsWith('hover') || property === 'transition') continue;
    if (!/^[a-zA-Z]+$/.test(property)) continue;
    const value = safeCssValue(raw);
    if (value === null) continue;

    if (property === 'backdropFilter') {
      const isPlainNumber = /^-?\d*\.?\d+$/.test(value) && Number(value) !== 0;
      const withUnit = isPlainNumber ? `${value}px` : value;
      css += `-webkit-backdrop-filter:${withUnit};backdrop-filter:${withUnit};`;
      continue;
    }

    const kebab = property.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
    // A plain number typed into a style field means pixels.
    const isPlainNumber = /^-?\d*\.?\d+$/.test(value) && Number(value) !== 0;
    const withUnit = isPlainNumber && !UNITLESS.has(property) ? `${value}px` : value;
    css += `${kebab}:${withUnit};`;
  }

  if (transition) {
    const safeTrans = safeCssValue(transition);
    if (safeTrans) css += `transition:${safeTrans};`;
  }
  if (styles.hoverCursor === 'pointer') {
    css += 'cursor:pointer;';
  }

  return css;
}

function hoverDeclarations(styles: Record<string, string | number> | undefined): string {
  if (!styles) return '';
  let css = '';
  const effect = String(styles.hoverEffect ?? '');

  if (effect === 'lift') {
    css += 'transform:translateY(-4px);box-shadow:0 14px 28px -6px rgba(15,23,42,0.22);';
  } else if (effect === 'lift-high') {
    css += 'transform:translateY(-8px);box-shadow:0 24px 40px -8px rgba(15,23,42,0.3);';
  } else if (effect === 'scale-up') {
    css += 'transform:scale(1.04);';
  } else if (effect === 'scale-down') {
    css += 'transform:scale(0.97);';
  } else if (effect === 'glow') {
    css += 'box-shadow:0 0 24px color-mix(in srgb,var(--fp-primary) 65%,transparent);';
  } else if (effect === 'border-glow') {
    css += 'border-color:var(--fp-primary);box-shadow:0 0 0 2px color-mix(in srgb,var(--fp-primary) 40%,transparent);';
  } else if (effect === 'brighten') {
    css += 'filter:brightness(1.15);';
  } else if (effect === 'dim') {
    css += 'opacity:0.8;';
  } else if (effect === 'tilt') {
    css += 'transform:rotate(2deg) scale(1.02);';
  } else if (effect === 'tilt-left') {
    css += 'transform:rotate(-2deg) scale(1.02);';
  }

  if (styles.hoverBackground) {
    const val = safeCssValue(styles.hoverBackground);
    if (val) css += `background:${val};`;
  }
  if (styles.hoverColor) {
    const val = safeCssValue(styles.hoverColor);
    if (val) css += `color:${val};`;
  }
  if (styles.hoverBorderColor) {
    const val = safeCssValue(styles.hoverBorderColor);
    if (val) css += `border-color:${val};`;
  }
  if (styles.hoverTransform) {
    const val = safeCssValue(styles.hoverTransform);
    if (val) css += `transform:${val};`;
  }
  if (styles.hoverShadow) {
    const val = safeCssValue(styles.hoverShadow);
    if (val) css += `box-shadow:${val};`;
  }
  if (styles.hoverOpacity) {
    const val = safeCssValue(styles.hoverOpacity);
    if (val) css += `opacity:${val};`;
  }

  return css;
}

export function nodeClass(key: string): string {
  return `fp-n-${key}`;
}

export function generateNodeCss(root: RenderNode | null): string {
  if (!root) return '';
  let base = '';
  let tablet = '';
  let mobile = '';
  const hidden = { desktop: '', tablet: '', mobile: '' };
  const visit = (node: RenderNode) => {
    const selector = `.${nodeClass(node.key)}`;
    const main = declarations(node.styles);
    if (main) base += `${selector}{${main}}`;
    const hoverMain = hoverDeclarations(node.styles);
    if (hoverMain) base += `${selector}:hover{${hoverMain}}`;

    const forTablet = declarations(node.responsive?.tablet);
    if (forTablet) tablet += `${selector}{${forTablet}}`;
    const hoverTablet = hoverDeclarations(node.responsive?.tablet);
    if (hoverTablet) tablet += `${selector}:hover{${hoverTablet}}`;

    const forMobile = declarations(node.responsive?.mobile);
    if (forMobile) mobile += `${selector}{${forMobile}}`;
    const hoverMobile = hoverDeclarations(node.responsive?.mobile);
    if (hoverMobile) mobile += `${selector}:hover{${hoverMobile}}`;

    for (const device of node.hideOn ?? []) hidden[device] += `${selector}{display:none!important}`;
    node.children.forEach(visit);
  };
  visit(root);
  if (tablet) base += `@media (max-width:${TABLET_MAX}px){${tablet}}`;
  if (mobile) base += `@media (max-width:${MOBILE_MAX}px){${mobile}}`;
  // Exact ranges, unlike the styles above, where a tablet change also carries to phones.
  if (hidden.desktop) base += `@media (min-width:${TABLET_MAX + 1}px){${hidden.desktop}}`;
  if (hidden.tablet) base += `@media (min-width:${MOBILE_MAX + 1}px) and (max-width:${TABLET_MAX}px){${hidden.tablet}}`;
  if (hidden.mobile) base += `@media (max-width:${MOBILE_MAX}px){${hidden.mobile}}`;
  return base;
}

const fontStack = (font: string) => `'${font.replace(/['"\\;{}<>]/g, '')}',system-ui,sans-serif`;

export function themeCssVariables(theme: Theme): string {
  const vars: [string, string][] = [
    ['primary', theme.primary],
    ['secondary', theme.secondary],
    ['background', theme.background],
    ['surface', theme.surface],
    ['text', theme.text],
    ['muted', theme.muted],
    ['radius', theme.radius],
    ['font-heading', fontStack(theme.fontHeading)],
    ['font-body', fontStack(theme.fontBody)],
  ];
  return vars
    .map(([name, value]) => [name, safeCssValue(value)] as const)
    .filter(([, value]) => value !== null)
    .map(([name, value]) => `--fp-${name}:${value};`)
    .join('');
}

export const GOOGLE_FONTS = [
  'Inter', 'Plus Jakarta Sans', 'Poppins', 'Outfit', 'Roboto', 'DM Sans', 'Manrope', 'Sora', 'Montserrat',
  'Work Sans', 'Rubik', 'Nunito', 'Space Grotesk', 'Syne', 'Righteous', 'Playfair Display', 'Lora',
  'Merriweather', 'Cinzel', 'Bodoni Moda', 'JetBrains Mono', 'Fira Code', 'Space Mono', 'IBM Plex Mono',
];
const KNOWN_GOOGLE_FONTS = new Set(GOOGLE_FONTS);

/** Fonts picked on individual blocks, beyond the theme's two. */
export function nodeFonts(root: RenderNode | null): string[] {
  const found = new Set<string>();
  const visit = (node: RenderNode) => {
    for (const styles of [node.styles, node.responsive?.tablet, node.responsive?.mobile]) {
      const font = styles?.fontFamily;
      if (typeof font === 'string' && KNOWN_GOOGLE_FONTS.has(font)) found.add(font);
    }
    node.children.forEach(visit);
  };
  if (root) visit(root);
  return [...found];
}

export function googleFontsUrl(theme: Theme): string | null {
  return fontsUrl([theme.fontHeading, theme.fontBody]);
}

/** Just enough of every font to show its own name in a list. */
export function fontPreviewUrl(): string {
  const families = GOOGLE_FONTS.map((family) => `family=${family.replace(/ /g, '+')}`).join('&');
  return `https://fonts.googleapis.com/css2?${families}&text=${encodeURIComponent('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz ')}&display=swap`;
}

export function fontsUrl(fonts: string[]): string | null {
  const families = [...new Set(fonts)].filter((font) => KNOWN_GOOGLE_FONTS.has(font));
  if (families.length === 0) return null;
  const query = families.map((family) => `family=${family.replace(/ /g, '+')}:wght@400;500;600;700;800`).join('&');
  return `https://fonts.googleapis.com/css2?${query}&display=swap`;
}

// Selectors use :where so their specificity stays at one class, which lets the
// per-node rules that come later override them.
export const BASE_CSS = `
:where(.fp-root),:where(.fp-root) *{box-sizing:border-box}
:where(.fp-root){font-family:var(--fp-font-body);color:var(--fp-text);background:var(--fp-background);line-height:1.6;font-size:16px;-webkit-font-smoothing:antialiased}
:where(.fp-root) :where(h1,h2,h3,h4,p,ul){margin:0;padding:0}
:where(.fp-root) :where(img,video){max-width:100%;display:block}
:where(.fp-root) a{color:inherit}
:where(.fp-root) .fp-heading{font-family:var(--fp-font-heading);font-weight:700;line-height:1.2;color:inherit}
:where(.fp-root) .fp-h1{font-size:clamp(2.25rem,5vw,3.75rem);font-weight:800;line-height:1.1}
:where(.fp-root) .fp-h2{font-size:clamp(1.75rem,3.5vw,2.5rem)}
:where(.fp-root) .fp-h3{font-size:1.375rem}
:where(.fp-root) .fp-h4{font-size:1.125rem}
:where(.fp-root) .fp-text{white-space:pre-line}
:where(.fp-root) .fp-section{padding:72px 24px;width:100%}
:where(.fp-root) .fp-container{width:100%;max-width:1120px;margin-left:auto;margin-right:auto}
:where(.fp-root) .fp-box{display:flex;flex-direction:column;gap:12px;min-width:0}
:where(.fp-root) .fp-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(260px,100%),1fr));gap:24px}
:where(.fp-root) .fp-row{display:flex;flex-wrap:wrap;gap:16px;align-items:center}
:where(.fp-root) .fp-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:12px 22px;border-radius:var(--fp-radius);border:1px solid transparent;font:inherit;font-weight:600;text-decoration:none;cursor:pointer;transition:opacity .15s}
:where(.fp-root) .fp-btn:hover{opacity:.88}
:where(.fp-root) .fp-btn-primary{background:var(--fp-primary);color:#fff}
:where(.fp-root) .fp-btn-secondary{background:transparent;color:var(--fp-text);border-color:currentColor}
:where(.fp-root) .fp-btn-link{background:transparent;color:var(--fp-primary);padding:0}
:where(.fp-root) .fp-card{background:var(--fp-surface);border-radius:var(--fp-radius);padding:24px}
:where(.fp-root) .fp-image{width:100%;object-fit:cover;border-radius:var(--fp-radius)}
:where(.fp-root) .fp-divider{border:0;border-top:1px solid color-mix(in srgb,var(--fp-text) 15%,transparent);margin:0;width:100%}
:where(.fp-root) .fp-nav{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px 24px;padding:16px 24px;background:var(--fp-background)}
:where(.fp-root) .fp-nav[data-sticky=true]{position:sticky;top:0;z-index:50}
:where(.fp-root) .fp-nav[data-align=center]{display:grid;grid-template-columns:1fr auto 1fr}
:where(.fp-root) .fp-nav[data-align=center] .fp-nav-cta{justify-self:end}
:where(.fp-root) .fp-nav[data-align=left] .fp-nav-links{flex:1;margin-left:24px}
:where(.fp-root) .fp-nav[data-align=right] .fp-nav-links{flex:1;justify-content:flex-end}
:where(.fp-root) .fp-nav-cta:empty{display:none}:where(.fp-root) .fp-nav-brand{display:flex;align-items:center;gap:10px;font-family:var(--fp-font-heading);font-weight:800;font-size:1.125rem;text-decoration:none}
:where(.fp-root) .fp-nav-brand img{height:32px;width:auto}
:where(.fp-root) .fp-nav-links{display:flex;flex-wrap:wrap;align-items:center;gap:20px}
:where(.fp-root) .fp-nav-links a{text-decoration:none;font-weight:500}
:where(.fp-root) .fp-nav-links a[aria-current=page]{color:var(--fp-primary)}
:where(.fp-root) .fp-nav-toggle{display:none;background:none;border:0;font-size:1.5rem;line-height:1;padding:4px 8px;color:inherit;cursor:pointer}
@media (max-width:640px){:where(.fp-root) .fp-nav[data-align]{display:flex}:where(.fp-root) .fp-nav-toggle{display:block}:where(.fp-root) .fp-nav[data-align] .fp-nav-links{display:none;flex:none;margin:0;flex-direction:column;align-items:flex-start;justify-content:flex-start;width:100%}:where(.fp-root) .fp-nav[data-align] .fp-nav-links[data-open=true]{display:flex}:where(.fp-root) .fp-nav-cta{display:none;width:100%}:where(.fp-root) .fp-nav-cta[data-open=true]{display:block}}
:where(.fp-root) .fp-accordion{border-bottom:1px solid color-mix(in srgb,var(--fp-text) 15%,transparent);padding:14px 0}
:where(.fp-root) .fp-accordion summary{cursor:pointer;font-weight:600}
:where(.fp-root) .fp-accordion p{margin-top:8px;color:var(--fp-muted);white-space:pre-line}
:where(.fp-root) .fp-form{display:flex;flex-direction:column;gap:16px;width:100%}
:where(.fp-root) .fp-field{display:flex;flex-direction:column;gap:6px;font-weight:500;font-size:.9375rem}
:where(.fp-root) .fp-field-check{flex-direction:row;align-items:center;gap:8px;font-weight:400}
:where(.fp-root) .fp-input{width:100%;padding:10px 12px;font:inherit;font-weight:400;color:var(--fp-text);background:var(--fp-background);border:1px solid color-mix(in srgb,var(--fp-text) 25%,transparent);border-radius:var(--fp-radius)}
:where(.fp-root) .fp-input:focus{outline:2px solid var(--fp-primary);outline-offset:1px}
:where(.fp-root) .fp-form-actions{display:flex;justify-content:space-between;gap:12px}
:where(.fp-root) .fp-form-status{padding:12px 14px;border-radius:var(--fp-radius);background:var(--fp-surface)}
:where(.fp-root) .fp-form-status[data-kind=error]{color:#b91c1c}
:where(.fp-root) .fp-progress{height:8px;border-radius:99px;background:color-mix(in srgb,var(--fp-text) 12%,transparent);overflow:hidden}
:where(.fp-root) .fp-progress span{display:block;height:100%;background:var(--fp-primary);transition:width .2s}
:where(.fp-root) .fp-scale{display:flex;flex-wrap:wrap;gap:6px}
:where(.fp-root) .fp-scale button{min-width:38px;height:38px;font:inherit;background:var(--fp-surface);color:var(--fp-text);border:1px solid color-mix(in srgb,var(--fp-text) 20%,transparent);border-radius:var(--fp-radius);cursor:pointer}
:where(.fp-root) .fp-scale button[aria-pressed=true]{background:var(--fp-primary);color:#fff}
:where(.fp-root) .fp-video{position:relative;width:100%;aspect-ratio:16/9;border-radius:var(--fp-radius);overflow:hidden;background:#0f172a}
:where(.fp-root) .fp-video iframe,:where(.fp-root) .fp-video video{position:absolute;inset:0;width:100%;height:100%;border:0;display:block}
:where(.fp-root) .fp-video[data-empty]{display:flex;align-items:center;justify-content:center;padding:16px;text-align:center;font-size:.875rem;color:#cbd5e1}
:where(.fp-root) .fp-step{position:relative;background:var(--fp-background);border-radius:var(--fp-radius);padding:20px;width:360px;max-width:100%;display:flex;flex-direction:column;gap:10px;box-shadow:0 20px 40px -12px rgba(15,23,42,.35)}
:where(.fp-root) .fp-step:where([data-size=small]){width:280px}
:where(.fp-root) .fp-step:where([data-size=large]){width:520px}
:where(.fp-root) .fp-step:where([data-size=xlarge]){width:760px}
:where(.fp-root) .fp-step-body{display:flex;flex-direction:column;gap:inherit;min-height:0;overflow-y:auto;max-height:calc(100vh - 72px)}
:where(.fp-root) .fp-step-progress{font-size:.8125rem;font-weight:600;color:var(--fp-muted)}
:where(.fp-root) .fp-step:where([data-layout=sidebar]){height:100vh;border-radius:0}
:where(.fp-root) .fp-step[data-side]::after,:where(.fp-root) .fp-hotspot-tip::after{content:'';position:absolute;width:12px;height:12px;background:inherit;transform:rotate(45deg);--fp-along:var(--fp-caret,calc(50% - 6px))}
:where(.fp-root) [data-caret=start]{--fp-caret:24px}
:where(.fp-root) [data-caret=end]{--fp-caret:calc(100% - 36px)}
:where(.fp-root) .fp-step[data-side=bottom]::after,:where(.fp-root) .fp-hotspot-tip[data-side=bottom]::after{top:-5px;left:var(--fp-along)}
:where(.fp-root) .fp-step[data-side=top]::after,:where(.fp-root) .fp-hotspot-tip[data-side=top]::after{bottom:-5px;left:var(--fp-along)}
:where(.fp-root) .fp-step[data-side=right]::after,:where(.fp-root) .fp-hotspot-tip[data-side=right]::after{left:-5px;top:var(--fp-along)}
:where(.fp-root) .fp-step[data-side=left]::after,:where(.fp-root) .fp-hotspot-tip[data-side=left]::after{right:-5px;top:var(--fp-along)}
:where(.fp-root) .fp-screen{position:relative;width:min(100%,calc((100vh - 76px)*1.6));min-height:160px;margin-left:auto;margin-right:auto;border-radius:var(--fp-radius);background:var(--fp-surface)}
:where(.fp-root) .fp-screen>img{width:100%;height:auto;border-radius:var(--fp-radius)}
:where(.fp-root) .fp-hotspot{position:absolute;width:28px;height:28px;margin:-14px 0 0 -14px;border-radius:50%;border:3px solid #fff;padding:0;background:var(--fp-primary);box-shadow:0 2px 10px rgba(15,23,42,.4);cursor:pointer;animation:fp-pulse 1.8s infinite;display:flex;align-items:center;justify-content:center;z-index:2}
:where(.fp-root) .fp-hotspot::after{content:'';width:8px;height:8px;border-radius:50%;background:#fff}
:where(.fp-root) .fp-hotspot[data-beacon=false]{opacity:0;animation:none}
@keyframes fp-pulse{0%{box-shadow:0 0 0 0 color-mix(in srgb,var(--fp-primary) 65%,transparent),0 2px 10px rgba(15,23,42,.4)}70%{box-shadow:0 0 0 18px transparent,0 2px 10px rgba(15,23,42,.4)}100%{box-shadow:0 0 0 0 transparent,0 2px 10px rgba(15,23,42,.4)}}
@media (prefers-reduced-motion:reduce){:where(.fp-root) .fp-hotspot{animation:none}}
:where(.fp-root) .fp-hotspot-tip{position:absolute;display:flex;flex-direction:column;align-items:flex-start;gap:8px;background:var(--fp-surface);color:var(--fp-text);padding:14px 18px;font-size:.875rem;font-weight:500;line-height:1.45;border-radius:12px;width:max-content;max-width:320px;box-shadow:0 0 0 1px color-mix(in srgb,var(--fp-text) 10%,transparent),0 16px 36px rgba(15,23,42,.22);z-index:10;transform:translate(var(--fp-tx,-50%),var(--fp-ty,24px))}
:where(.fp-root) .fp-hotspot-tip strong{font-size:.9375rem;font-weight:700;color:var(--fp-text)}
:where(.fp-root) .fp-hotspot-tip .fp-btn{padding:7px 16px;font-size:.8125rem;border-radius:8px;align-self:flex-end}
:where(.fp-root) .fp-hotspot-tip[data-caret=start]{--fp-tx:-34px}
:where(.fp-root) .fp-hotspot-tip[data-caret=end]{--fp-tx:calc(-100% + 34px)}
:where(.fp-root) .fp-hotspot-tip[data-side=top]{--fp-ty:calc(-100% - 22px)}
:where(.fp-root) .fp-hotspot-tip[data-side=left],:where(.fp-root) .fp-hotspot-tip[data-side=right]{--fp-tx:22px;--fp-ty:-50%}
:where(.fp-root) .fp-hotspot-tip[data-side=left]{--fp-tx:calc(-100% - 22px)}
:where(.fp-root) .fp-hotspot-tip[data-side=left][data-caret=start],:where(.fp-root) .fp-hotspot-tip[data-side=right][data-caret=start]{--fp-ty:-34px}
:where(.fp-root) .fp-hotspot-tip[data-side=left][data-caret=end],:where(.fp-root) .fp-hotspot-tip[data-side=right][data-caret=end]{--fp-ty:calc(-100% + 34px)}
:where(.fp-root) .fp-demo-player-container{display:flex;flex-direction:column;gap:12px;width:100%}
:where(.fp-root) .fp-demo-bar{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:10px 16px;border-radius:var(--fp-radius);background:var(--fp-surface);box-shadow:0 2px 12px rgba(15,23,42,.08);font-size:.875rem;color:var(--fp-muted);flex-wrap:wrap}
:where(.fp-root) .fp-demo-chapters{display:flex;align-items:center;gap:8px;overflow-x:auto;scrollbar-width:none}
:where(.fp-root) .fp-demo-chapter-btn{display:inline-flex;align-items:center;gap:8px;padding:6px 14px;border-radius:999px;border:1px solid color-mix(in srgb,var(--fp-text) 14%,transparent);background:var(--fp-background);color:var(--fp-text);font:inherit;font-size:.8125rem;font-weight:600;cursor:pointer;transition:all .15s ease;white-space:nowrap}
:where(.fp-root) .fp-demo-chapter-btn:hover{border-color:var(--fp-primary)}
:where(.fp-root) .fp-demo-chapter-btn[data-active=true]{background:var(--fp-primary);color:#fff;border-color:var(--fp-primary);box-shadow:0 2px 8px color-mix(in srgb,var(--fp-primary) 35%,transparent)}
:where(.fp-root) .fp-demo-chapter-btn[data-completed=true]{background:color-mix(in srgb,var(--fp-primary) 12%,var(--fp-background));color:var(--fp-primary);border-color:color-mix(in srgb,var(--fp-primary) 30%,transparent)}
:where(.fp-root) .fp-demo-chapter-num{display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;border-radius:50%;font-size:.6875rem;font-weight:700;background:color-mix(in srgb,var(--fp-text) 12%,transparent)}
:where(.fp-root) .fp-demo-chapter-btn[data-active=true] .fp-demo-chapter-num{background:rgba(255,255,255,.25);color:#fff}
:where(.fp-root) .fp-demo-actions{display:flex;align-items:center;gap:12px;margin-left:auto}
:where(.fp-root) .fp-demo-step-text{font-size:.8125rem;font-weight:600;color:var(--fp-muted);white-space:nowrap}
:where(.fp-root) .fp-demo-progress-track{width:100%;height:4px;background:color-mix(in srgb,var(--fp-text) 12%,transparent);border-radius:99px;overflow:hidden}
:where(.fp-root) .fp-demo-progress-fill{height:100%;background:var(--fp-primary);transition:width .25s ease}
:where(.fp-root) .fp-demo-complete-overlay{position:absolute;inset:0;background:rgba(15,23,42,.75);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;border-radius:var(--fp-radius);z-index:20;padding:24px;animation:fp-fade-in .2s ease}
:where(.fp-root) .fp-demo-complete-card{background:var(--fp-surface);border:1px solid color-mix(in srgb,var(--fp-text) 12%,transparent);border-radius:calc(var(--fp-radius) + 4px);padding:36px 32px;max-width:440px;width:100%;text-align:center;box-shadow:0 24px 48px -12px rgba(15,23,42,.4)}
:where(.fp-root) .fp-demo-complete-icon{font-size:3rem;margin-bottom:12px;line-height:1}
@keyframes fp-fade-in{from{opacity:0}to{opacity:1}}
@keyframes fp-slide-up{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
@keyframes fp-slide-down{from{opacity:0;transform:translateY(-24px)}to{opacity:1;transform:translateY(0)}}
@keyframes fp-slide-left{from{opacity:0;transform:translateX(24px)}to{opacity:1;transform:translateX(0)}}
@keyframes fp-slide-right{from{opacity:0;transform:translateX(-24px)}to{opacity:1;transform:translateX(0)}}
@keyframes fp-zoom-in{from{opacity:0;transform:scale(.92)}to{opacity:1;transform:scale(1)}}
@keyframes fp-bounce{0%,20%,50%,80%,100%{transform:translateY(0)}40%{transform:translateY(-12px)}60%{transform:translateY(-6px)}}
@keyframes fp-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
@keyframes fp-pulse-subtle{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.04);opacity:.92}}
@keyframes fp-glow{0%,100%{box-shadow:0 0 6px color-mix(in srgb,var(--fp-primary) 35%,transparent)}50%{box-shadow:0 0 24px color-mix(in srgb,var(--fp-primary) 85%,transparent)}}
@keyframes fp-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
@keyframes fp-shimmer{0%{filter:brightness(1)}50%{filter:brightness(1.25)}100%{filter:brightness(1)}}
:where(.fp-root) .fp-demo-bar .fp-btn{padding:6px 14px;font-size:.875rem}
:where(.fp-root) .fp-demo-dots{display:flex;gap:6px}
:where(.fp-root) .fp-demo-dots span{width:8px;height:8px;border-radius:50%;background:color-mix(in srgb,var(--fp-text) 18%,transparent)}
:where(.fp-root) .fp-demo-dots span[data-active=true]{background:var(--fp-primary)}
:where(.fp-root) .fp-avatar{display:inline-flex;align-items:center;gap:12px;max-width:100%}
:where(.fp-root) .fp-avatar-photo{flex-shrink:0;width:48px;height:48px;border-radius:50%;object-fit:cover;display:flex;align-items:center;justify-content:center;background:color-mix(in srgb,var(--fp-primary) 15%,var(--fp-background));color:var(--fp-primary);font-weight:700}
:where(.fp-root) .fp-avatar-small .fp-avatar-photo{width:32px;height:32px;font-size:.75rem}
:where(.fp-root) .fp-avatar-large .fp-avatar-photo{width:80px;height:80px;font-size:1.5rem}
:where(.fp-root) .fp-avatar-text{display:flex;flex-direction:column;min-width:0;line-height:1.3}
:where(.fp-root) .fp-avatar-name{font-weight:700}
:where(.fp-root) .fp-avatar-subtitle{font-size:.875rem;color:var(--fp-muted)}
:where(.fp-root) .fp-icon{display:inline-flex;color:var(--fp-primary)}
:where(.fp-root) .fp-list{margin:0;padding-left:1.4em;display:flex;flex-direction:column;gap:8px}
:where(.fp-root) .fp-list-check{list-style:none;padding-left:0}
:where(.fp-root) .fp-list-check li{display:flex;gap:10px;align-items:flex-start}
:where(.fp-root) .fp-list-tick{flex-shrink:0;margin-top:.2em;color:var(--fp-primary)}
:where(.fp-root) .fp-quote{margin:0;padding:4px 0 4px 20px;border-left:4px solid var(--fp-primary)}
:where(.fp-root) .fp-quote blockquote{margin:0;font-size:1.25rem;line-height:1.5;font-style:italic}
:where(.fp-root) .fp-quote figcaption{margin-top:10px;font-size:.9375rem;color:var(--fp-muted)}
:where(.fp-root) .fp-quote figcaption::before{content:'— '}
:where(.fp-root) .fp-code{border-radius:var(--fp-radius);overflow:hidden;background:#0f172a;color:#e2e8f0}
:where(.fp-root) .fp-code-bar{display:flex;justify-content:space-between;align-items:center;padding:6px 12px;font-size:.75rem;color:#94a3b8;background:#1e293b}
:where(.fp-root) .fp-code-copy{border:0;background:transparent;color:#cbd5e1;font:inherit;font-weight:600;cursor:pointer}
:where(.fp-root) .fp-code pre{margin:0;padding:16px;overflow-x:auto;font:14px/1.6 ui-monospace,SFMono-Regular,Menlo,monospace;white-space:pre}
:where(.fp-root) .fp-callout{display:flex;gap:12px;padding:16px;border-radius:var(--fp-radius);border:1px solid}
:where(.fp-root) .fp-callout p{margin:0}
:where(.fp-root) .fp-callout-icon{flex-shrink:0;margin-top:2px}
:where(.fp-root) .fp-callout-title{font-weight:700;margin-bottom:4px!important}
:where(.fp-root) .fp-callout-info{background:#eff6ff;border-color:#bfdbfe;color:#1e3a8a}
:where(.fp-root) .fp-callout-success{background:#ecfdf5;border-color:#a7f3d0;color:#064e3b}
:where(.fp-root) .fp-callout-warning{background:#fffbeb;border-color:#fde68a;color:#78350f}
:where(.fp-root) .fp-callout-danger{background:#fef2f2;border-color:#fecaca;color:#7f1d1d}
:where(.fp-root) .fp-table{overflow-x:auto;width:100%}
:where(.fp-root) .fp-table table{width:100%;border-collapse:collapse;font-size:.9375rem}
:where(.fp-root) .fp-table th,:where(.fp-root) .fp-table td{padding:10px 12px;text-align:left;border-bottom:1px solid color-mix(in srgb,var(--fp-text) 12%,transparent)}
:where(.fp-root) .fp-table th{font-weight:700;background:var(--fp-surface)}
:where(.fp-root) .fp-badge{display:inline-flex;align-items:center;padding:3px 10px;border-radius:999px;font-size:.8125rem;font-weight:600;width:fit-content}
:where(.fp-root) .fp-badge-primary{background:color-mix(in srgb,var(--fp-primary) 14%,var(--fp-background));color:var(--fp-primary)}
:where(.fp-root) .fp-badge-neutral{background:color-mix(in srgb,var(--fp-text) 8%,var(--fp-background));color:var(--fp-text)}
:where(.fp-root) .fp-badge-success{background:#dcfce7;color:#166534}
:where(.fp-root) .fp-badge-warning{background:#fef3c7;color:#92400e}
:where(.fp-root) .fp-pay{display:flex;flex-wrap:wrap;align-items:center;gap:12px}
:where(.fp-root) .fp-pay-price{font-weight:800;font-size:1.25rem}
:where(.fp-root) .fp-pay-hint{font-size:.8125rem;color:var(--fp-muted)}
:where(.fp-root) .fp-embed{width:100%;min-width:0}
:where(.fp-root) .fp-embed-empty{padding:32px 16px;text-align:center;font-size:.875rem;color:var(--fp-muted);border:1.5px dashed color-mix(in srgb,var(--fp-text) 25%,transparent);border-radius:var(--fp-radius)}
:where(.fp-root) .fp-marquee{overflow:hidden;width:100%;display:block}
:where(.fp-root) .fp-marquee-track{display:flex;width:max-content;animation:fp-marquee 30s linear infinite}
:where(.fp-root) .fp-marquee-track[data-reverse]{animation-direction:reverse}
:where(.fp-root) .fp-marquee:hover .fp-marquee-track{animation-play-state:paused}
:where(.fp-root) .fp-marquee-set{display:flex;flex-shrink:0;align-items:center;justify-content:space-around;gap:48px;padding-right:48px;min-width:100vw}
:where(.fp-root) .fp-marquee[data-editing] .fp-marquee-track{width:auto;flex-wrap:wrap;justify-content:center;gap:12px 48px;animation:none}
@keyframes fp-marquee{to{transform:translateX(-50%)}}
@media (prefers-reduced-motion:reduce){:where(.fp-root) .fp-marquee-track{animation:none;width:auto;flex-wrap:wrap}:where(.fp-root) .fp-marquee-set[aria-hidden]{display:none}:where(.fp-root) .fp-marquee-set{min-width:0;flex-wrap:wrap;justify-content:center}}
:where(.fp-root) .fp-carousel{position:relative;width:100%}
:where(.fp-root) .fp-slide{min-width:0}
:where(.fp-root) .fp-carousel-arrow{position:absolute;top:50%;transform:translateY(-50%);width:32px;height:32px;display:flex;align-items:center;justify-content:center;border:0;border-radius:50%;background:rgba(15,23,42,.55);color:#fff;font-size:1.25rem;line-height:1;cursor:pointer}
:where(.fp-root) .fp-carousel-arrow[data-side=prev]{left:10px}
:where(.fp-root) .fp-carousel-arrow[data-side=next]{right:10px}
:where(.fp-root) .fp-carousel-count{position:absolute;top:10px;right:10px;padding:3px 10px;border-radius:999px;background:rgba(15,23,42,.7);color:#fff;font:600 12px/1.4 system-ui,sans-serif;pointer-events:none}
:where(.fp-root) .fp-banner{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:12px;padding:10px 44px 10px 16px;background:var(--fp-primary);color:#fff;position:relative}
:where(.fp-root) .fp-close{position:absolute;top:8px;right:10px;background:none;border:0;color:inherit;font-size:1.125rem;line-height:1;cursor:pointer;padding:4px}
:where(.fp-root) .fp-popup{position:relative;background:var(--fp-background);border-radius:var(--fp-radius);padding:32px;width:460px;max-width:100%;display:flex;flex-direction:column;gap:14px;box-shadow:0 25px 50px -12px rgba(15,23,42,.45)}
`;
