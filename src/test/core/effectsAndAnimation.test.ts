import { describe, expect, it } from 'vitest';
import { BASE_CSS, generateNodeCss, nodeClass } from '../../renderer/css';
import { RenderNode } from '../../core/variables';

const makeNode = (styles: Record<string, string | number>, key = 'test1'): RenderNode => ({
  key,
  sourceId: key,
  type: 'Container',
  props: {},
  styles,
  children: [],
});

describe('Effects, Hover Effects & Animations', () => {
  it('includes modern animation keyframes in BASE_CSS', () => {
    expect(BASE_CSS).toContain('@keyframes fp-slide-up');
    expect(BASE_CSS).toContain('@keyframes fp-slide-down');
    expect(BASE_CSS).toContain('@keyframes fp-float');
    expect(BASE_CSS).toContain('@keyframes fp-pulse-subtle');
    expect(BASE_CSS).toContain('@keyframes fp-bounce');
    expect(BASE_CSS).toContain('@keyframes fp-glow');
    expect(BASE_CSS).toContain('@keyframes fp-spin');
    expect(BASE_CSS).toContain('@keyframes fp-shimmer');
    expect(BASE_CSS).toContain('@keyframes fp-ticker-text');
    expect(BASE_CSS).toContain('@keyframes fp-text-shimmer');
    expect(BASE_CSS).toContain('@keyframes fp-cursor-blink');
  });

  it('generates hover declarations and automatic smooth transition when hoverEffect is set', () => {
    const node = makeNode({
      hoverEffect: 'lift',
      hoverCursor: 'pointer',
    });

    const css = generateNodeCss(node);
    const cls = nodeClass('test1');

    // Base rule should have smooth transition and pointer cursor
    expect(css).toContain(`.${cls}{`);
    expect(css).toContain('transition:all 0.25s cubic-bezier(0.16, 1, 0.3, 1);');
    expect(css).toContain('cursor:pointer;');

    // Hover rule should have translateY and shadow
    expect(css).toContain(`.${cls}:hover{transform:translateY(-4px);box-shadow:0 14px 28px -6px rgba(15,23,42,0.22);}`);
  });

  it('supports custom hover background, color and border-color', () => {
    const node = makeNode({
      hoverBackground: '#4f46e5',
      hoverColor: '#ffffff',
      hoverBorderColor: '#2dd4bf',
    });

    const css = generateNodeCss(node);
    const cls = nodeClass('test1');

    expect(css).toContain(`.${cls}:hover{background:#4f46e5;color:#ffffff;border-color:#2dd4bf;}`);
  });

  it('compiles backdropFilter with webkit prefix for glassmorphism', () => {
    const node = makeNode({
      backdropFilter: 'blur(16px)',
    });

    const css = generateNodeCss(node);
    expect(css).toContain('-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px);');
  });

  it('compiles animation declarations on containers', () => {
    const node = makeNode({
      animation: 'fp-float 3s ease-in-out infinite',
    });

    const css = generateNodeCss(node);
    expect(css).toContain('animation:fp-float 3s ease-in-out infinite;');
  });

  it('handles position, zIndex, and flexShrink as unitless numbers', () => {
    const node = makeNode({
      position: 'sticky',
      top: 0,
      zIndex: 40,
      flexShrink: 0,
      flexGrow: 1,
    });

    const css = generateNodeCss(node);
    expect(css).toContain('position:sticky;');
    expect(css).toContain('top:0;');
    expect(css).toContain('z-index:40;');
    expect(css).toContain('flex-shrink:0;');
    expect(css).toContain('flex-grow:1;');
  });

  it('registers Rating block in BLOCK_META and BLOCK_RENDERERS with custom colors and min/max', async () => {
    const { BLOCK_META } = await import('../../renderer/blockMeta');
    const { BLOCK_RENDERERS } = await import('../../renderer/blocks');

    expect(BLOCK_META.Rating).toBeDefined();
    expect(BLOCK_META.Rating.category).toBe('layout');
    expect(BLOCK_META.Rating.defaultProps.value).toBe(5);
    expect(BLOCK_META.Rating.defaultProps.max).toBe(5);
    expect(BLOCK_META.Rating.defaultProps.min).toBe(1);
    expect(BLOCK_META.Rating.defaultProps.color).toBe('#f59e0b');

    // Fields should include value, max, min, color, emptyColor, icon, showText, text
    const fieldKeys = BLOCK_META.Rating.fields.map((f) => f.key);
    expect(fieldKeys).toContain('value');
    expect(fieldKeys).toContain('max');
    expect(fieldKeys).toContain('min');
    expect(fieldKeys).toContain('color');
    expect(fieldKeys).toContain('emptyColor');
    expect(fieldKeys).toContain('icon');
    expect(fieldKeys).toContain('showText');

    expect(BLOCK_RENDERERS.Rating).toBeDefined();
  });

  it('supports auto-move text animation options on Heading and Text', async () => {
    const { BLOCK_META } = await import('../../renderer/blockMeta');

    const headingFields = BLOCK_META.Heading.fields.map((f) => f.key);
    expect(headingFields).toContain('autoMove');
    expect(headingFields).toContain('cycleWords');

    const textFields = BLOCK_META.Text.fields.map((f) => f.key);
    expect(textFields).toContain('autoMove');
    expect(textFields).toContain('cycleWords');
  });
});
