import { Theme } from '../core/schema';
import { RenderNode } from '../core/variables';

export const TABLET_MAX = 991;
export const MOBILE_MAX = 640;

const UNITLESS = new Set(['opacity', 'zIndex', 'fontWeight', 'lineHeight', 'flexGrow', 'flexShrink', 'order', 'flex']);

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
  for (const [property, raw] of Object.entries(styles)) {
    if (!/^[a-zA-Z]+$/.test(property)) continue;
    const value = safeCssValue(raw);
    if (value === null) continue;
    const kebab = property.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
    // A plain number typed into a style field means pixels.
    const isPlainNumber = /^-?\d*\.?\d+$/.test(value) && Number(value) !== 0;
    const withUnit = isPlainNumber && !UNITLESS.has(property) ? `${value}px` : value;
    css += `${kebab}:${withUnit};`;
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
    const forTablet = declarations(node.responsive?.tablet);
    if (forTablet) tablet += `${selector}{${forTablet}}`;
    const forMobile = declarations(node.responsive?.mobile);
    if (forMobile) mobile += `${selector}{${forMobile}}`;
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
:where(.fp-root) .fp-hotspot{position:absolute;width:26px;height:26px;margin:-13px 0 0 -13px;border-radius:50%;border:3px solid #fff;padding:0;background:var(--fp-primary);box-shadow:0 2px 8px rgba(15,23,42,.4);cursor:pointer;animation:fp-pulse 1.8s infinite}
:where(.fp-root) .fp-hotspot[data-beacon=false]{opacity:0;animation:none}
@keyframes fp-pulse{0%{box-shadow:0 0 0 0 color-mix(in srgb,var(--fp-primary) 55%,transparent)}70%{box-shadow:0 0 0 16px transparent}100%{box-shadow:0 0 0 0 transparent}}
@media (prefers-reduced-motion:reduce){:where(.fp-root) .fp-hotspot{animation:none}}
:where(.fp-root) .fp-hotspot-tip{position:absolute;display:flex;flex-direction:column;align-items:flex-start;gap:6px;background:#fff;color:#0f172a;padding:10px 14px;font-size:.8125rem;font-weight:500;line-height:1.4;border-radius:8px;width:max-content;max-width:280px;box-shadow:0 0 0 1px rgba(15,23,42,.08),0 12px 28px rgba(15,23,42,.4);z-index:1;transform:translate(var(--fp-tx,-50%),var(--fp-ty,22px))}
:where(.fp-root) .fp-hotspot-tip strong{font-size:.875rem;font-weight:700}
:where(.fp-root) .fp-hotspot-tip .fp-btn{padding:5px 12px;font-size:.8125rem}
:where(.fp-root) .fp-hotspot-tip[data-caret=start]{--fp-tx:-34px}
:where(.fp-root) .fp-hotspot-tip[data-caret=end]{--fp-tx:calc(-100% + 34px)}
:where(.fp-root) .fp-hotspot-tip[data-side=top]{--fp-ty:calc(-100% - 22px)}
:where(.fp-root) .fp-hotspot-tip[data-side=left],:where(.fp-root) .fp-hotspot-tip[data-side=right]{--fp-tx:22px;--fp-ty:-50%}
:where(.fp-root) .fp-hotspot-tip[data-side=left]{--fp-tx:calc(-100% - 22px)}
:where(.fp-root) .fp-hotspot-tip[data-side=left][data-caret=start],:where(.fp-root) .fp-hotspot-tip[data-side=right][data-caret=start]{--fp-ty:-34px}
:where(.fp-root) .fp-hotspot-tip[data-side=left][data-caret=end],:where(.fp-root) .fp-hotspot-tip[data-side=right][data-caret=end]{--fp-ty:calc(-100% + 34px)}
:where(.fp-root) .fp-demo-bar{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:8px 4px 10px;font-size:.875rem;color:var(--fp-muted)}
:where(.fp-root) .fp-demo-bar .fp-btn{padding:6px 14px;font-size:.875rem}
:where(.fp-root) .fp-demo-dots{display:flex;gap:6px}
:where(.fp-root) .fp-demo-dots span{width:8px;height:8px;border-radius:50%;background:color-mix(in srgb,var(--fp-text) 18%,transparent)}
:where(.fp-root) .fp-demo-dots span[data-active=true]{background:var(--fp-primary)}
:where(.fp-root) .fp-carousel{position:relative;width:100%}
:where(.fp-root) .fp-slide{min-width:0}
:where(.fp-root) .fp-carousel-arrow{position:absolute;top:50%;transform:translateY(-50%);width:32px;height:32px;display:flex;align-items:center;justify-content:center;border:0;border-radius:50%;background:rgba(15,23,42,.55);color:#fff;font-size:1.25rem;line-height:1;cursor:pointer}
:where(.fp-root) .fp-carousel-arrow[data-side=prev]{left:10px}
:where(.fp-root) .fp-carousel-arrow[data-side=next]{right:10px}
:where(.fp-root) .fp-banner{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:12px;padding:10px 44px 10px 16px;background:var(--fp-primary);color:#fff;position:relative}
:where(.fp-root) .fp-close{position:absolute;top:8px;right:10px;background:none;border:0;color:inherit;font-size:1.125rem;line-height:1;cursor:pointer;padding:4px}
:where(.fp-root) .fp-popup{position:relative;background:var(--fp-background);border-radius:var(--fp-radius);padding:32px;width:460px;max-width:100%;display:flex;flex-direction:column;gap:14px;box-shadow:0 25px 50px -12px rgba(15,23,42,.45)}
`;
