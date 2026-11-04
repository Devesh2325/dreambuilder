import { describe, expect, it } from 'vitest';
import { produceWithPatches, applyPatches, enablePatches } from 'immer';
import { renderToStaticMarkup } from 'react-dom/server';
import { DEFAULT_THEME, DocContent, findTreeProblem, parseContent } from '../../core/schema';
import { duplicateNode, insertSubtree, moveNode, removeNode } from '../../core/tree';
import {
  evaluateShowIf, expandContent, isSafeUrl, RenderNode, resolveString, safeUrl, VariableDef,
} from '../../core/variables';
import { validateValues } from '../../core/validation';
import { matchesUrl, passesFrequency, shouldShow } from '../../core/triggers';
import { generateNodeCss, safeCssValue } from '../../renderer/css';
import { ExperienceView } from '../../renderer/ExperienceView';

enablePatches();

const node = (id: string, type: string, children: string[] = [], props: Record<string, unknown> = {}) => ({
  id, type, props, styles: {}, children,
});

const sample = (): DocContent => ({
  rootId: 'root',
  nodes: {
    root: node('root', 'Root', ['a', 'b']),
    a: node('a', 'Box', ['a1']),
    a1: node('a1', 'Text', [], { text: 'hello' }),
    b: node('b', 'Box'),
  },
});

describe('document validation', () => {
  it('accepts a valid tree', () => {
    expect(parseContent(sample()).rootId).toBe('root');
  });

  it('rejects a missing child, a cycle and an orphan', () => {
    const missing = sample();
    missing.nodes.b.children = ['ghost'];
    expect(findTreeProblem(missing)).toMatch(/missing/);

    const cycle = sample();
    cycle.nodes.a1.children = ['a'];
    expect(findTreeProblem(cycle)).toMatch(/twice/);

    const orphan = sample();
    orphan.nodes.lost = node('lost', 'Text');
    expect(findTreeProblem(orphan)).toMatch(/not connected/);
  });

  it('rejects node ids that could break out of a CSS class', () => {
    const bad = sample();
    bad.nodes['a}b'] = node('a}b', 'Text');
    bad.nodes.root.children.push('a}b');
    expect(() => parseContent(bad)).toThrow();
  });
});

describe('tree operations', () => {
  it('moves a node between parents', () => {
    const content = sample();
    expect(moveNode(content, 'a1', 'b', 0)).toBe(true);
    expect(content.nodes.a.children).toEqual([]);
    expect(content.nodes.b.children).toEqual(['a1']);
  });

  it('moves within one parent using the index before removal', () => {
    const content = sample();
    expect(moveNode(content, 'a', 'root', 2)).toBe(true);
    expect(content.nodes.root.children).toEqual(['b', 'a']);
  });

  it('refuses a move into its own subtree, and leaves the tree unchanged', () => {
    const content = sample();
    expect(moveNode(content, 'a', 'a1', 0)).toBe(false);
    expect(findTreeProblem(content)).toBeNull();
  });

  it('removes a subtree, leaving no orphans, but never the root', () => {
    const content = sample();
    removeNode(content, 'a');
    expect(content.nodes.a1).toBeUndefined();
    expect(findTreeProblem(content)).toBeNull();
    removeNode(content, 'root');
    expect(content.nodes.root).toBeDefined();
  });

  it('duplicates with new ids directly after the original', () => {
    const content = sample();
    const copy = duplicateNode(content, 'a')!;
    expect(content.nodes.root.children).toEqual(['a', copy, 'b']);
    expect(content.nodes[copy].children[0]).not.toBe('a1');
    expect(findTreeProblem(content)).toBeNull();
  });

  it('works on immer drafts, with patches that undo and redo', () => {
    const original = sample();
    const [next, patches, inverse] = produceWithPatches(original, (draft) => {
      duplicateNode(draft, 'a');
      moveNode(draft, 'a1', 'b', 0);
      insertSubtree(draft, 'b', 'c', { c: node('c', 'Text') });
    });
    expect(findTreeProblem(next)).toBeNull();
    expect(applyPatches(next, inverse)).toEqual(original);
    expect(applyPatches(original, patches)).toEqual(next);
  });
});

describe('variables', () => {
  it('fills tokens inside text, and treats missing values as empty', () => {
    expect(resolveString('Hi {{ name }}, from {{ org.name }}!{{nope}}', { name: 'Sam', 'org.name': 'Acme' })).toBe('Hi Sam, from Acme!');
  });

  it('keeps the type when a string is only a token', () => {
    const list = [{ a: 1 }];
    expect(resolveString('{{items}}', { items: list })).toBe(list);
    expect(resolveString('{{flag}}', { flag: false })).toBe(false);
  });

  it('does not re-expand a value that itself looks like a token', () => {
    expect(resolveString('{{a}} x', { a: '{{b}}', b: 'secret' })).toBe('{{b}} x');
  });

  it('evaluates conditions', () => {
    const scope = { on: true, off: false, empty: [], full: [1], blank: ' ' };
    expect(evaluateShowIf(undefined, scope)).toBe(true);
    expect(evaluateShowIf('on', scope)).toBe(true);
    expect(evaluateShowIf('off', scope)).toBe(false);
    expect(evaluateShowIf('!off', scope)).toBe(true);
    expect(evaluateShowIf('empty', scope)).toBe(false);
    expect(evaluateShowIf('full', scope)).toBe(true);
    expect(evaluateShowIf('blank', scope)).toBe(false);
    expect(evaluateShowIf('unknown', scope)).toBe(false);
  });

  it('expands repeats with item values and unique keys', () => {
    const content: DocContent = {
      rootId: 'root',
      nodes: {
        root: node('root', 'Root', ['card']),
        card: { ...node('card', 'Card', ['title']), repeat: { list: 'services', as: 'service' } },
        title: node('title', 'Heading', [], { text: '{{service.index}}. {{service.name}} by {{brand}}' }),
      },
    };
    const tree = expandContent(content, { brand: 'Acme', services: [{ name: 'Cut' }, { name: 'Color' }] })!;
    expect(tree.children.map((c: RenderNode) => c.children[0].props.text)).toEqual(['1. Cut by Acme', '2. Color by Acme']);
    const keys = tree.children.map((c: RenderNode) => c.children[0].key);
    expect(new Set(keys).size).toBe(2);
    expect(tree.children[0].sourceId).toBe('card');
  });

  it('hides conditional and hidden nodes, except for the editor', () => {
    const content: DocContent = {
      rootId: 'root',
      nodes: {
        root: node('root', 'Root', ['maybe', 'gone']),
        maybe: { ...node('maybe', 'Text'), showIf: 'flag' },
        gone: { ...node('gone', 'Text'), hidden: true },
      },
    };
    expect(expandContent(content, { flag: false })!.children).toEqual([]);
    expect(expandContent(content, { flag: true })!.children).toHaveLength(1);
    expect(expandContent(content, { flag: false }, { includeHidden: true })!.children).toHaveLength(2);
  });

  describe('validation', () => {
    const defs: VariableDef[] = [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'email', label: 'Email', type: 'email' },
      { key: 'site', label: 'Site', type: 'url' },
      { key: 'color', label: 'Color', type: 'color', required: true },
      { key: 'kind', label: 'Kind', type: 'select', required: true, options: [{ label: 'A', value: 'a' }] },
      {
        key: 'items', label: 'Items', type: 'list', minItems: 1,
        itemFields: [{ key: 'title', label: 'Title', type: 'text', required: true }],
      },
    ];
    const valid = { name: 'x', email: '', site: '', color: '#fff', kind: 'a', items: [{ title: 't' }] };

    it('accepts valid values and empty optional ones', () => {
      expect(validateValues(defs, valid).ok).toBe(true);
    });

    it('reports errors per field, including inside lists', () => {
      const result = validateValues(defs, {
        ...valid, name: '  ', email: 'nope', color: 'red', kind: 'b', items: [{ title: '' }],
      });
      expect(result.ok).toBe(false);
      expect(Object.keys(result.errors).sort()).toEqual(['color', 'email', 'items.0.title', 'kind', 'name']);
    });

    it('enforces list size', () => {
      expect(validateValues(defs, { ...valid, items: [] }).errors.items).toMatch(/at least 1/);
    });

    it('rejects a javascript: link', () => {
      expect(validateValues(defs, { ...valid, site: 'javascript:alert(1)' }).ok).toBe(false);
    });
  });
});

describe('content security', () => {
  it.each(['javascript:alert(1)', 'JAVASCRIPT:alert(1)', 'java\nscript:alert(1)', ' javascript:alert(1)', 'data:text/html,x', 'data:image/svg+xml;base64,x', 'vbscript:x'])(
    'blocks the link %j',
    (url) => {
      expect(isSafeUrl(url)).toBe(false);
      expect(safeUrl(url)).toBe('#');
    },
  );

  it.each(['https://a.com', 'http://a.com', 'mailto:a@b.co', 'tel:+15551234', '/about', '#top', 'page.html', 'data:image/png;base64,iVBOR'])('allows the link %j', (url) => {
    expect(isSafeUrl(url)).toBe(true);
  });

  it.each(['red}body{display:none', 'red;background:blue', '</style><script>x</script>', 'url(javascript:x)', 'url(data:x)', '@import "x"', 'expression(x)', 'a/*b'])(
    'drops the style value %j',
    (value) => {
      expect(safeCssValue(value)).toBeNull();
    },
  );

  it('keeps ordinary style values', () => {
    expect(safeCssValue('rgba(0, 0, 0, 0.5)')).not.toBeNull();
    expect(safeCssValue('linear-gradient(90deg, #fff, #000)')).not.toBeNull();
    expect(safeCssValue('url(https://a.com/x.png)')).not.toBeNull();
  });

  it('shows text as text, never as HTML', () => {
    const content: DocContent = {
      rootId: 'root',
      nodes: {
        root: node('root', 'Root', ['t', 'b']),
        t: node('t', 'Text', [], { text: '{{evil}}' }),
        b: node('b', 'Button', [], { text: 'Go', href: '{{link}}' }),
      },
    };
    const html = renderToStaticMarkup(
      <ExperienceView
        documents={[content]}
        theme={DEFAULT_THEME}
        variables={{ evil: '<img src=x onerror=alert(1)>', link: 'javascript:alert(1)' }}
        ctx={{ mode: 'live' }}
      />,
    );
    expect(html).not.toContain('<img src=x');
    expect(html).toContain('&lt;img');
    expect(html).not.toContain('javascript:');
  });

  it('cannot break out of the style tag through a theme value', () => {
    const html = renderToStaticMarkup(
      <ExperienceView
        documents={[sample()]}
        theme={{ ...DEFAULT_THEME, primary: '</style><script>alert(1)</script>' }}
        variables={{}}
        ctx={{ mode: 'live' }}
      />,
    );
    expect(html).not.toContain('<script>');
  });
});

describe('css generation', () => {
  it('writes per-device rules as media queries', () => {
    const css = generateNodeCss({
      key: 'x', sourceId: 'x', type: 'Box', props: {}, children: [],
      styles: { fontSize: 20, opacity: 0.5, marginTop: 0 },
      responsive: { tablet: { fontSize: '18px' }, mobile: { fontSize: '14px' } },
    });
    expect(css).toContain('.fp-n-x{font-size:20px;opacity:0.5;margin-top:0;}');
    expect(css).toMatch(/@media \(max-width:991px\)\{\.fp-n-x\{font-size:18px;\}\}/);
    expect(css).toMatch(/@media \(max-width:640px\)\{\.fp-n-x\{font-size:14px;\}\}/);
  });
});

describe('triggers', () => {
  const seen = { session: false, visitor: false, completed: false };

  it('matches URL rules', () => {
    expect(matchesUrl([], '/x')).toBe(true);
    expect(matchesUrl([{ type: 'exact', value: '/a' }], '/a')).toBe(true);
    expect(matchesUrl([{ type: 'exact', value: '/a' }], '/a/b')).toBe(false);
    expect(matchesUrl([{ type: 'starts_with', value: '/a' }], '/a/b')).toBe(true);
    expect(matchesUrl([{ type: 'contains', value: 'bill' }], '/a/billing')).toBe(true);
  });

  it('applies frequency', () => {
    expect(passesFrequency('always', { session: true, visitor: true, completed: true })).toBe(true);
    expect(passesFrequency('once_per_session', { ...seen, session: true })).toBe(false);
    expect(passesFrequency('once_per_visitor', { ...seen, visitor: true })).toBe(false);
    expect(passesFrequency('until_completed', { ...seen, visitor: true })).toBe(true);
    expect(passesFrequency('until_completed', { ...seen, completed: true })).toBe(false);
  });

  it('applies device limits', () => {
    const triggers = { urlRules: [], delaySeconds: 0, frequency: 'always' as const, devices: ['mobile' as const] };
    expect(shouldShow(triggers, '/', 400, seen)).toBe(true);
    expect(shouldShow(triggers, '/', 1400, seen)).toBe(false);
  });
});

describe('shared renderer', () => {
  it('renders the same markup for preview and live', () => {
    const render = (mode: 'preview' | 'live') =>
      renderToStaticMarkup(<ExperienceView documents={[sample()]} theme={DEFAULT_THEME} variables={{}} ctx={{ mode }} />);
    expect(render('preview')).toBe(render('live'));
    expect(render('live')).toContain('data-fp-node="a1"');
  });
});
