import { beforeEach, describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { contentSchema, DEFAULT_THEME, findTreeProblem } from '../../core/schema';
import { tokensIn, VariableDef } from '../../core/variables';
import { createLocalServices } from '../../data/localServices';
import { LibraryItem } from '../../data/services';
import { canContain } from '../../renderer/blockMeta';
import { fontsUrl, generateNodeCss, nodeFonts, safeCssValue } from '../../renderer/css';
import { ExperienceView } from '../../renderer/ExperienceView';
import { findSteps, stepOfNode } from '../../studio/steps';
import { variableKey } from '../../studio/VariablesPanel';
import { blankProject, buildContent, el, getTemplate, heading, initialValues, projectFromTemplate, projectVariableDefs, TEAM_TEMPLATE_PREFIX, text } from '../../templates';
import { sectionFromNode, teamSection, teamTemplate, templateFromProject } from '../../templates/library';
import { SECTION_LIBRARY, sectionNodes } from '../../templates/sections';

const item = (definition: unknown, kind: LibraryItem['kind'] = 'template'): LibraryItem => ({
  id: 'abc', kind, name: 'Saved', category: '', description: '', definition, createdAt: '2026-11-05',
});

describe('section library', () => {
  it('has a good range of sections, with unique ids', () => {
    expect(SECTION_LIBRARY.length).toBeGreaterThanOrEqual(20);
    expect(new Set(SECTION_LIBRARY.map((section) => section.id)).size).toBe(SECTION_LIBRARY.length);
    expect(new Set(SECTION_LIBRARY.map((section) => section.category)).size).toBeGreaterThanOrEqual(6);
  });

  describe.each(SECTION_LIBRARY.map((section) => [section.id, section] as const))('%s', (_id, section) => {
    const built = sectionNodes(section);
    const content = { rootId: built.rootId, nodes: built.nodes };

    it('is a valid tree that a page can hold', () => {
      expect(contentSchema.safeParse(content).success).toBe(true);
      expect(findTreeProblem(content)).toBeNull();
      expect(canContain('Root', built.nodes[built.rootId].type)).toBe(true);
    });

    it('only nests blocks where they are allowed', () => {
      for (const node of Object.values(built.nodes)) {
        for (const child of node.children) expect(canContain(node.type, built.nodes[child].type), `${node.type} > ${built.nodes[child].type}`).toBe(true);
      }
    });

    it('needs no variables, and renders with no leftover tokens', () => {
      for (const node of Object.values(built.nodes)) expect([...tokensIn([node.props, node.styles])]).toEqual([]);
      const { container } = render(<ExperienceView documents={[content]} theme={DEFAULT_THEME} variables={{}} ctx={{ mode: 'preview' }} />);
      expect(container.textContent).not.toContain('{{');
      expect(container.textContent?.length).toBeGreaterThan(0);
    });
  });

  it('gets new ids each time, so a section can be added twice', () => {
    const first = Object.keys(sectionNodes(SECTION_LIBRARY[0]).nodes);
    const second = Object.keys(sectionNodes(SECTION_LIBRARY[0]).nodes);
    expect(first.filter((id) => second.includes(id))).toEqual([]);
  });
});

describe('saving a block as a section', () => {
  const content = buildContent('p', [
    el('Section', {}, [
      heading('{{title}}'),
      el('Card', { repeat: { list: 'items', as: 'row' } }, [text('{{row.name}}')]),
      el('Text', { showIf: 'missing', props: { text: 'Not drawn' } }),
    ]),
  ]);
  const sectionId = content.nodes[content.rootId].children[0];
  const values = { title: 'Hello', items: [{ name: 'One' }, { name: 'Two' }] };

  it('fills in values, repeats lists out, and leaves out what is not shown', () => {
    const saved = sectionFromNode(content, sectionId, values)!;
    expect(contentSchema.safeParse(saved).success).toBe(true);
    const nodes = Object.values(saved.nodes);
    expect(nodes.filter((node) => node.type === 'Card')).toHaveLength(2);
    expect(nodes.some((node) => node.repeat)).toBe(false);
    expect(nodes.map((node) => node.props.text).filter(Boolean).sort()).toEqual(['Hello', 'One', 'Two'].sort());
    expect(JSON.stringify(saved)).not.toContain('{{');
    expect(JSON.stringify(saved)).not.toContain('Not drawn');
  });

  it('returns nothing for a block that is hidden', () => {
    const missing = Object.values(content.nodes).find((node) => node.showIf)!;
    expect(sectionFromNode(content, missing.id, values)).toBeNull();
  });

  it('reads back, and rejects stored rows of the wrong shape', () => {
    const saved = sectionFromNode(content, sectionId, values)!;
    expect(teamSection(item(saved, 'section'))?.rootId).toBe(saved.rootId);
    expect(teamSection(item({ rootId: 'x' }, 'section'))).toBeNull();
    expect(teamSection(item('nonsense', 'section'))).toBeNull();
  });
});

describe('team templates', () => {
  const defs: VariableDef[] = [{ key: 'my.offer', label: 'Offer', type: 'text' }];
  const snapshot = () => templateFromProject({
    type: 'page',
    theme: DEFAULT_THEME,
    variables: { 'my.offer': 'Half price' },
    settings: { webhookUrl: 'https://hooks.example.com/secret', position: 'top', variableDefs: defs },
    defs,
    documents: [{ kind: 'page', title: 'Home', slug: '', content: buildContent('p', [el('Section', {}, [heading('{{my.offer}}')])]) }],
  });

  it('never carries the webhook address', () => {
    expect(JSON.stringify(snapshot())).not.toContain('hooks.example.com');
  });

  it('keeps tokens, and uses current values as the starting values', () => {
    const definition = snapshot();
    expect(definition.variables[0].default).toBe('Half price');
    expect(JSON.stringify(definition.pages)).toContain('{{my.offer}}');
  });

  it('becomes a template whose projects carry their own variables', () => {
    const template = teamTemplate(item(JSON.parse(JSON.stringify(snapshot()))))!;
    expect(template.id).toBe(`${TEAM_TEMPLATE_PREFIX}abc`);
    const values = initialValues(template);
    expect(values['my.offer']).toBe('Half price');
    const project = projectFromTemplate(template, 'org', values, DEFAULT_THEME, 'Mine');
    expect(project.settings.variableDefs?.[0].key).toBe('my.offer');
    expect(project.settings.webhookUrl).toBeUndefined();
    expect(projectVariableDefs(project.templateId, project.settings).map((def) => def.key)).toEqual(['my.offer']);
  });

  it.each([
    ['wrong shape', 'nonsense'],
    ['unknown type', { ...JSON.parse(JSON.stringify(snapshot())), type: 'checklist' }],
    ['no pages', { ...JSON.parse(JSON.stringify(snapshot())), pages: [] }],
    ['a variable key that could not be a token', { ...JSON.parse(JSON.stringify(snapshot())), variables: [{ key: '}}<x>', label: 'x', type: 'text' }] }],
  ])('rejects a stored row with %s', (_name, definition) => {
    expect(teamTemplate(item(definition))).toBeNull();
  });
});

describe('project variables', () => {
  it('combines the template with your own, without duplicates', () => {
    const template = getTemplate('page-launch')!;
    const first = template.variables[0];
    const defs = projectVariableDefs('page-launch', { variableDefs: [{ key: 'my.x', label: 'X', type: 'text' }, first] });
    expect(defs.filter((def) => def.key === first.key)).toHaveLength(1);
    expect(defs.at(-1)?.key).toBe('my.x');
  });

  it('works for blank projects', () => {
    expect(projectVariableDefs(undefined, {})).toEqual([]);
    expect(projectVariableDefs(null, { variableDefs: [{ key: 'my.x', label: 'X', type: 'text' }] })).toHaveLength(1);
  });

  it('makes keys that tokens accept, and never repeats one', () => {
    expect(variableKey('Phone number', [])).toBe('my.phone_number');
    expect(variableKey('Phone number', ['my.phone_number'])).toBe('my.phone_number_2');
    expect(variableKey('!!!', [])).toBe('my.value');
    expect(variableKey('{{x}}; <b>', [])).toMatch(/^[a-zA-Z][\w.]*$/);
  });

  it('are saved with the project in demo mode', async () => {
    localStorage.clear();
    const services = createLocalServices();
    const id = await services.projects.create(blankProject('page', 'org', 'Mine'));
    await services.projects.update(id, { settings: { variableDefs: [{ key: 'my.x', label: 'X', type: 'text' }] } });
    expect((await services.projects.get(id))?.settings.variableDefs?.[0].key).toBe('my.x');
  });
});

describe('finding steps', () => {
  const tour = buildContent('t', [
    el('TourStep', { name: 'One' }, [heading('First')]),
    el('TourStep', { name: 'Two' }, [heading('Second')]),
  ]);

  it('finds steps wherever they are, in order', () => {
    const set = findSteps(tour, {})!;
    expect(set.stepType).toBe('TourStep');
    expect(set.parentKey).toBe(tour.rootId);
    expect(set.steps.map((step) => step.label)).toEqual(['Step 1', 'Step 2']);
    expect(set.steps.every((step) => !step.isRepeated)).toBe(true);
  });

  it('skips hidden steps', () => {
    const hidden = structuredClone(tour);
    hidden.nodes[hidden.nodes[hidden.rootId].children[0]].hidden = true;
    expect(findSteps(hidden, {})!.steps).toHaveLength(1);
  });

  it('handles slides from a list, each with its own key', () => {
    const slides = buildContent('b', [el('Carousel', {}, [el('Slide', { repeat: { list: 'items', as: 'row' } }, [text('{{row.name}}')])])]);
    const set = findSteps(slides, { items: [{ name: 'A' }, { name: 'B' }, { name: 'C' }] })!;
    expect(set.label).toBe('Slide');
    expect(set.steps).toHaveLength(3);
    expect(new Set(set.steps.map((step) => step.key)).size).toBe(3);
    expect(set.steps.every((step) => step.isRepeated)).toBe(true);
    expect(set.steps[2].key.endsWith('__2')).toBe(true);
  });

  it('finds no steps on an ordinary page', () => {
    expect(findSteps(buildContent('p', [el('Section', {}, [heading('Hi')])]), {})).toBeNull();
  });

  it('knows which step a block is in', () => {
    const set = findSteps(tour, {})!;
    const secondStep = tour.nodes[tour.rootId].children[1];
    const inside = tour.nodes[secondStep].children[0];
    expect(stepOfNode(tour, set, inside)?.label).toBe('Step 2');
    expect(stepOfNode(tour, set, secondStep)?.label).toBe('Step 2');
    expect(stepOfNode(tour, set, tour.rootId)).toBeUndefined();
  });

  it('draws only the chosen step in the editor, and every step otherwise', () => {
    const set = findSteps(tour, {})!;
    const visibleStep = { parentKey: set.parentKey, stepType: set.stepType, key: set.steps[1].key };
    const edit = render(<ExperienceView documents={[tour]} theme={DEFAULT_THEME} variables={{}} ctx={{ mode: 'edit', visibleStep }} />);
    expect(edit.container.textContent).toContain('Second');
    expect(edit.container.textContent).not.toContain('First');
    edit.unmount();
    const all = render(<ExperienceView documents={[tour]} theme={DEFAULT_THEME} variables={{}} ctx={{ mode: 'edit' }} />);
    expect(all.container.textContent).toContain('First');
    expect(all.container.textContent).toContain('Second');
  });
});

describe('style values', () => {
  const css = (styles: Record<string, string | number>) => generateNodeCss({ key: 'k', sourceId: 'k', type: 'Box', props: {}, styles, children: [] });

  it('reads a plain number as pixels', () => {
    expect(css({ paddingTop: '16' })).toContain('padding-top:16px');
    expect(css({ marginLeft: '-4' })).toContain('margin-left:-4px');
    expect(css({ width: 300 })).toContain('width:300px');
    expect(css({ fontSize: '1.5' })).toContain('font-size:1.5px');
  });

  it('leaves zero, units and keywords alone', () => {
    expect(css({ margin: '0' })).toContain('margin:0;');
    expect(css({ width: '50%' })).toContain('width:50%');
    expect(css({ height: 'auto' })).toContain('height:auto');
    expect(css({ fontSize: '2rem' })).toContain('font-size:2rem');
  });

  it('does not add pixels where a plain number is the meaning', () => {
    for (const [property, kebab] of [['opacity', 'opacity'], ['zIndex', 'z-index'], ['fontWeight', 'font-weight'], ['lineHeight', 'line-height'], ['flexGrow', 'flex-grow'], ['order', 'order']]) {
      expect(css({ [property]: '2' })).toContain(`${kebab}:2;`);
    }
  });

  it('allows uploaded raster images as backgrounds, and nothing else as data', () => {
    expect(safeCssValue('url("data:image/png;base64,iVBORw0KGgo=")')).toBeTruthy();
    expect(safeCssValue('url(data:image/webp;base64,AAAA)')).toBeTruthy();
    expect(safeCssValue('url("data:image/svg+xml;base64,AAAA")')).toBeNull();
    expect(safeCssValue('url("data:text/html;base64,AAAA")')).toBeNull();
    expect(safeCssValue('url("data:image/png;base64,AAAA");color:red')).toBeNull();
    expect(safeCssValue('url("javascript:alert(1)")')).toBeNull();
    expect(safeCssValue('url(javascript:alert(1))')).toBeNull();
    expect(safeCssValue("url('https://example.com/a(1).png')")).toBeTruthy();
    expect(safeCssValue('url("https://example.com/a.png) url(javascript:x)')).toBeNull();
    expect(safeCssValue('url("https://example.com/a.png")')).toBeTruthy();
  });

  it('loads fonts chosen on single blocks, and only known ones', () => {
    const tree = { key: 'a', sourceId: 'a', type: 'Box', props: {}, styles: { fontFamily: 'Lora' }, responsive: { mobile: { fontFamily: 'Poppins' } }, children: [
      { key: 'b', sourceId: 'b', type: 'Text', props: {}, styles: { fontFamily: 'Evil"><script>' }, children: [] },
    ] };
    expect(nodeFonts(tree).sort()).toEqual(['Lora', 'Poppins']);
    expect(fontsUrl(['Lora'])).toContain('family=Lora');
    expect(fontsUrl(['Evil"><script>'])).toBeNull();
  });
});

describe('library in the demo backend', () => {
  beforeEach(() => localStorage.clear());

  it('keeps each workspace and kind separate, and removes items', async () => {
    const { library } = createLocalServices();
    const base = { name: 'A', category: '', description: '', definition: {} };
    const saved = await library.create('org-1', { ...base, kind: 'section' });
    await library.create('org-1', { ...base, kind: 'template' });
    await library.create('org-2', { ...base, kind: 'section' });
    expect(await library.list('org-1', 'section')).toHaveLength(1);
    expect(await library.list('org-2', 'section')).toHaveLength(1);
    expect(await library.list('org-1', 'template')).toHaveLength(1);
    await library.remove(saved.id);
    expect(await library.list('org-1', 'section')).toHaveLength(0);
  });
});
