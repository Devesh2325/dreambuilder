// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { DocContent } from '../../core/schema';
import { buildContent, el } from '../../templates/dsl';
import { SECTION_LIBRARY, sectionNodes } from '../../templates/sections';
import { restyleSection, sectionOf } from '../../studio/restyleSection';

const page = (children: ReturnType<typeof el>[]): DocContent => buildContent('o', children);
const sectionId = (content: DocContent) => content.nodes[content.rootId].children[0];
const textsOf = (nodes: Record<string, { type: string; props: Record<string, unknown> }>, type: string) =>
  Object.values(nodes).filter((node) => node.type === type).map((node) => node.props.text);

const design = (children: ReturnType<typeof el>[]) => {
  const content = buildContent('d', [el('Section', {}, children)]);
  return { rootId: sectionId(content), nodes: content.nodes };
};

describe('changing a section design', () => {
  it('moves each heading, text and button to the same kind of place, keeping variables', () => {
    const old = page([el('Section', { props: { anchor: 'top' } }, [
      el('Heading', { props: { text: '{{home.headline}}', level: 'h1' } }),
      el('Text', { props: { text: '{{home.intro}}' }, showIf: 'home.intro' }),
      el('Button', { props: { text: 'Call us', href: 'tel:123', action: 'link' } }),
    ])]);
    const next = design([
      el('Box', {}, [el('Heading', { props: { text: 'Sample title', level: 'h1' }, styles: { fontSize: '64px' } }), el('Text', { props: { text: 'Sample words' } })]),
      el('Row', {}, [el('Button', { props: { text: 'Sample', href: '#' }, styles: { background: 'red' } })]),
    ]);
    const result = restyleSection(old, sectionId(old), next);
    expect(textsOf(result.nodes, 'Heading')).toEqual(['{{home.headline}}']);
    expect(textsOf(result.nodes, 'Text')).toEqual(['{{home.intro}}']);
    const button = Object.values(result.nodes).find((node) => node.type === 'Button')!;
    expect(button.props).toMatchObject({ text: 'Call us', href: 'tel:123' });
    // The look is the new design's.
    expect(button.styles.background).toBe('red');
    expect(Object.values(result.nodes).find((node) => node.type === 'Heading')!.styles.fontSize).toBe('64px');
    expect(Object.values(result.nodes).find((node) => node.type === 'Text')!.showIf).toBe('home.intro');
    expect(result.nodes[result.rootId].props.anchor).toBe('top');
    expect(result.leftOut).toEqual([]);
  });

  it("removes the design's sample words, keeps its pictures, and drops boxes left empty", () => {
    const old = page([el('Section', {}, [el('Heading', { props: { text: 'Only a title' } })])]);
    const next = design([
      el('Heading', { props: { text: 'Sample title' } }),
      el('Card', {}, [el('Text', { props: { text: 'Sample card' } }), el('Button', { props: { text: 'Sample' } })]),
      el('Image', { props: { src: 'https://example.com/a.jpg' } }),
    ]);
    const result = restyleSection(old, sectionId(old), next);
    expect(textsOf(result.nodes, 'Heading')).toEqual(['Only a title']);
    expect(textsOf(result.nodes, 'Text')).toEqual([]);
    expect(Object.values(result.nodes).some((node) => node.type === 'Card')).toBe(false);
    expect(result.samplePictures).toBe(1);
    // Every child points at a node that exists.
    for (const node of Object.values(result.nodes)) for (const child of node.children) expect(result.nodes[child]).toBeDefined();
  });

  it('says what did not fit, rather than losing it silently', () => {
    const old = page([el('Section', {}, [
      el('Heading', { props: { text: 'Title' } }),
      el('Text', { props: { text: 'First' } }),
      el('Text', { props: { text: 'Second {{brand.name}}' } }),
    ])]);
    const result = restyleSection(old, sectionId(old), design([el('Heading', { props: { text: 'x' } }), el('Text', { props: { text: 'y' } })]));
    expect(result.leftOut).toEqual(['Text: Second [brand.name]']);
  });

  it("puts a picture into a design's background photo", () => {
    const old = page([el('Section', {}, [el('Heading', { props: { text: 'Title' } }), el('Image', { props: { src: '{{home.image}}', alt: '' } })])]);
    const next = design([el('Heading', { props: { text: 'x' } })]);
    const root = next.nodes[next.rootId];
    root.styles.backgroundImage = 'linear-gradient(rgba(0,0,0,.5), rgba(0,0,0,.5)), url("https://example.com/sample.jpg")';
    const result = restyleSection(old, sectionId(old), next);
    expect(result.nodes[result.rootId].styles.backgroundImage).toBe('linear-gradient(rgba(0,0,0,.5), rgba(0,0,0,.5)), url("{{home.image}}")');
    expect(result.leftOut).toEqual([]);
  });

  it('also finds a photo set with the background shorthand', () => {
    const old = page([el('Section', {}, [el('Image', { props: { src: 'https://example.com/mine.jpg' } })])]);
    const next = sectionNodes(SECTION_LIBRARY.find((section) => section.id === 'hero-photo')!);
    const result = restyleSection(old, sectionId(old), next);
    expect(String(result.nodes[result.rootId].styles.background)).toContain('url("https://example.com/mine.jpg") center / cover');
    expect(result.leftOut).toEqual([]);
  });

  it('keeps a repeating list repeating, in the new row of cards', () => {
    const old = page([el('Section', {}, [
      el('Heading', { props: { text: 'Our team' } }),
      el('Card', { repeat: { list: 'team', as: 'person' } }, [el('Heading', { props: { text: '{{person.name}}' } }), el('Text', { props: { text: '{{person.role}}' } })]),
    ])]);
    const next = design([
      el('Heading', { props: { text: 'Sample' } }),
      el('Grid', {}, [1, 2, 3].map((n) => el('Box', {}, [el('Heading', { props: { text: `Name ${n}` } }), el('Text', { props: { text: `Role ${n}` } })]))),
    ]);
    const result = restyleSection(old, sectionId(old), next);
    const grid = Object.values(result.nodes).find((node) => node.type === 'Grid')!;
    expect(grid.children).toHaveLength(1);
    expect(result.nodes[grid.children[0]].repeat).toEqual({ list: 'team', as: 'person' });
    expect(textsOf(result.nodes, 'Heading').sort()).toEqual(['Our team', '{{person.name}}']);
    expect(textsOf(result.nodes, 'Text')).toEqual(['{{person.role}}']);
    expect(result.leftOut).toEqual([]);
  });

  it("names a list that the new design can't repeat", () => {
    const old = page([el('Section', {}, [el('Card', { repeat: { list: 'team', as: 'person' } }, [el('Text', { props: { text: '{{person.name}}' } })])])]);
    const result = restyleSection(old, sectionId(old), design([el('Text', { props: { text: 'x' } })]));
    expect(result.leftOut[0]).toMatch(/repeating list/);
    // A token from inside the list would mean nothing outside it.
    expect(textsOf(result.nodes, 'Text')).not.toContain('{{person.name}}');
  });

  it('gives fresh nodes, leaving the design and the old section untouched', () => {
    const old = page([el('Section', {}, [el('Heading', { props: { text: 'Mine' } })])]);
    const next = sectionNodes(SECTION_LIBRARY.find((section) => section.id === 'hero-center')!);
    const before = JSON.stringify(next);
    const oldBefore = JSON.stringify(old);
    restyleSection(old, sectionId(old), next);
    expect(JSON.stringify(next)).toBe(before);
    expect(JSON.stringify(old)).toBe(oldBefore);
  });

  it.each(SECTION_LIBRARY.map((section) => [section.id, section] as const))('works with the library section %s', (_id, section) => {
    const old = page([el('Section', {}, [el('Heading', { props: { text: 'Mine' } }), el('Text', { props: { text: 'Words' } })])]);
    const result = restyleSection(old, sectionId(old), sectionNodes(section));
    expect(result.nodes[result.rootId]).toBeDefined();
    for (const node of Object.values(result.nodes)) for (const child of node.children) expect(result.nodes[child], `${section.id}: ${child}`).toBeDefined();
  });

  it('finds the section that contains a block', () => {
    const content = page([el('Section', {}, [el('Box', {}, [el('Text', { props: { text: 'deep' } })])])]);
    const text = Object.values(content.nodes).find((node) => node.type === 'Text')!;
    expect(sectionOf(content, text.id)).toBe(sectionId(content));
    expect(sectionOf(content, content.rootId)).toBeNull();
  });
});
