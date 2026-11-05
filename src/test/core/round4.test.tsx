import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { DEFAULT_THEME } from '../../core/schema';
import { tokensIn } from '../../core/variables';
import { createLocalServices } from '../../data/localServices';
import { AppServices } from '../../data/services';
import { ExperienceView } from '../../renderer/ExperienceView';
import { useStudio } from '../../studio/store';
import { applyChoices } from '../../studio/TemplateVariables';
import { itemFieldsFrom } from '../../studio/VariablesPanel';
import { blankProject, buildContent, el, getTemplate, initialValues, TEMPLATES, templatesFor, text } from '../../templates';
import { teamTemplate, templateFromProject } from '../../templates/library';
import { SECTION_LIBRARY } from '../../templates/sections';

describe('templates by industry', () => {
  it('has many more templates for websites and pages', () => {
    expect(templatesFor('website').length).toBeGreaterThanOrEqual(25);
    expect(templatesFor('page').length).toBeGreaterThanOrEqual(30);
  });

  it('gives every website and page template a category', () => {
    for (const template of [...templatesFor('website'), ...templatesFor('page')]) {
      expect(template.category, template.id).toBeTruthy();
    }
  });

  it('offers several industries for both', () => {
    for (const type of ['website', 'page'] as const) {
      const categories = new Set(templatesFor(type).map((template) => template.category));
      expect(categories.size, type).toBeGreaterThanOrEqual(6);
      expect(categories.has('Finance and insurance'), type).toBe(true);
    }
  });

  it.each(['page-fintech-app', 'page-gym-offer', 'page-wedding-event', 'page-launch', 'page-saas-landing'])('%s has every section', (id) => {
    const { container } = render(
      <ExperienceView
        documents={[getTemplate(id)!.pages[0].content]}
        theme={DEFAULT_THEME}
        variables={initialValues(getTemplate(id)!)}
        ctx={{ mode: 'preview' }}
      />,
    );
    expect(container.querySelector('.fp-marquee')).toBeTruthy();
    expect(container.querySelector('.fp-carousel')).toBeTruthy();
    expect(container.querySelector('.fp-accordion')).toBeTruthy();
    expect(container.querySelectorAll('.fp-section').length).toBeGreaterThanOrEqual(5);
    cleanup();
  });

  it('adds sections to a copy, leaving every id unique', () => {
    for (const template of TEMPLATES) {
      for (const page of template.pages) {
        const ids = Object.keys(page.content.nodes);
        expect(new Set(ids).size, template.id).toBe(ids.length);
        for (const node of Object.values(page.content.nodes)) {
          for (const child of node.children) expect(page.content.nodes[child], `${template.id}: ${child}`).toBeDefined();
        }
      }
    }
  });

  it('offers the sections people ask for', () => {
    const titles = SECTION_LIBRARY.map((section) => section.title);
    for (const title of ['Hero carousel', 'Scrolling text strip', 'Quotes carousel', 'Six features', 'Questions and answers', 'Call to action band', 'Footer with columns']) {
      expect(titles).toContain(title);
    }
    expect(new Set(SECTION_LIBRARY.map((section) => section.category))).toContain('Moving');
  });
});

describe('marquee', () => {
  const content = buildContent('p', [el('Marquee', { props: { speed: 12, reverse: true } }, [text('One'), text('Two')])]);

  it('repeats its items for visitors, with the copy hidden from assistive technology', () => {
    const { container } = render(<ExperienceView documents={[content]} theme={DEFAULT_THEME} variables={{}} ctx={{ mode: 'live' }} />);
    const sets = container.querySelectorAll('.fp-marquee-set');
    expect(sets).toHaveLength(2);
    expect(sets[1].getAttribute('aria-hidden')).toBe('true');
    const track = container.querySelector<HTMLElement>('.fp-marquee-track')!;
    expect(track.style.animationDuration).toBe('12s');
    expect(track.hasAttribute('data-reverse')).toBe(true);
    cleanup();
  });

  it('shows each item once in the editor, so they can be clicked', () => {
    const { container } = render(<ExperienceView documents={[content]} theme={DEFAULT_THEME} variables={{}} ctx={{ mode: 'edit' }} />);
    expect(container.querySelectorAll('.fp-marquee-set')).toHaveLength(0);
    expect(container.querySelectorAll('.fp-text')).toHaveLength(2);
    cleanup();
  });

  it('never runs too fast to read', () => {
    const fast = buildContent('p', [el('Marquee', { props: { speed: 1 } }, [text('One')])]);
    const { container } = render(<ExperienceView documents={[fast]} theme={DEFAULT_THEME} variables={{}} ctx={{ mode: 'live' }} />);
    expect(container.querySelector<HTMLElement>('.fp-marquee-track')!.style.animationDuration).toBe('5s');
    cleanup();
  });
});

describe('variables for template authors', () => {
  it('makes list parts into valid, unique keys', () => {
    const fields = itemFieldsFrom([
      { label: 'Plan name', type: 'text' },
      { label: 'Plan name', type: 'text' },
      { label: '  ', type: 'text' },
      { label: '2024 price!', type: 'number' },
      { label: '!!!', type: 'text' },
    ]);
    expect(fields.map((field) => field.key)).toEqual(['plan_name', 'plan_name_2', 'price', 'part']);
    for (const field of fields) expect(`{{row.${field.key}}}`).toMatch(/^\{\{[a-zA-Z][\w.]*\}\}$/);
  });

  it('applies what the admin chose, without touching the rest', () => {
    const defs = [{ key: 'a', label: 'A', type: 'text' as const, default: 'x' }, { key: 'b', label: 'B', type: 'text' as const }];
    const result = applyChoices(defs, { a: { label: ' Offer ', help: ' Say what it is ', required: true, ask: false } });
    expect(result[0]).toMatchObject({ key: 'a', label: 'Offer', help: 'Say what it is', required: true, askOnCreate: false, default: 'x' });
    expect(result[1]).toEqual(defs[1]);
    expect(applyChoices(defs, { a: { label: '  ', help: '', required: false, ask: true } })[0]).toMatchObject({ label: 'A', askOnCreate: undefined, help: undefined });
  });

  it('carries the choices through a saved template', () => {
    const definition = templateFromProject({
      type: 'page',
      theme: DEFAULT_THEME,
      variables: { 'my.code': 'X1', 'my.plans': [{ name: 'Pro' }] },
      settings: {},
      defs: [
        { key: 'my.code', label: 'Code', type: 'text', askOnCreate: false },
        { key: 'my.plans', label: 'Plans', type: 'list', itemFields: [{ key: 'name', label: 'Name', type: 'text' }] },
      ],
      documents: [{ kind: 'page', title: 'Home', slug: '', content: buildContent('p', [text('{{my.code}}')]) }],
    });
    const template = teamTemplate({ id: 't', kind: 'template', name: 'T', category: '', description: '', createdAt: '', definition: JSON.parse(JSON.stringify(definition)) })!;
    expect(template.variables[0].askOnCreate).toBe(false);
    expect(template.variables[1].itemFields?.[0].key).toBe('name');
    expect(initialValues(template)['my.plans']).toEqual([{ name: 'Pro' }]);
  });
});

describe('editor: variables', () => {
  const state = () => useStudio.getState();
  let services: AppServices;
  const content = buildContent('p', [el('Section', {}, [text('Open every day')])]);
  const textId = Object.values(content.nodes).find((node) => node.type === 'Text')!.id;

  const open = async () => {
    const id = await services.projects.create({ ...blankProject('page', 'org', 'Mine'), documents: [{ kind: 'page', title: 'Home', slug: '', content }] });
    state().load(services, (await services.projects.get(id))!, await services.projects.listDocuments(id), false);
    return id;
  };
  const doc = () => state().documents[0];

  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    services = createLocalServices();
  });
  afterEach(() => {
    state().reset();
    vi.useRealTimers();
  });

  it('turns text into a variable, keeping what it says', async () => {
    await open();
    state().promoteToVariable(doc().id, textId, 'text', 'Opening hours', 'text');
    expect(doc().content.nodes[textId].props.text).toBe('{{my.opening_hours}}');
    expect(state().draft?.variables['my.opening_hours']).toBe('Open every day');
    expect(state().draft?.settings.variableDefs?.[0]).toMatchObject({ key: 'my.opening_hours', label: 'Opening hours' });
  });

  it('never reuses a key, so two variables with one name stay apart', async () => {
    await open();
    state().promoteToVariable(doc().id, textId, 'text', 'Hours', 'text');
    state().updateProps(textId, { text: 'Second' });
    state().promoteToVariable(doc().id, textId, 'text', 'Hours', 'text');
    expect(state().draft?.settings.variableDefs?.map((def) => def.key)).toEqual(['my.hours', 'my.hours_2']);
    expect(tokensIn(doc().content.nodes[textId].props).has('my.hours_2')).toBe(true);
  });

  it('copies global values into the project, so publishing includes them', async () => {
    const id = await open();
    state().syncGlobals([{ key: 'global.city', label: 'City', type: 'text', value: 'London' }]);
    expect(state().draft?.variables['global.city']).toBe('London');
    expect(state().isProjectDirty).toBe(true);
    await state().saveNow();
    expect((await services.projects.get(id))?.variables['global.city']).toBe('London');
  });

  it('leaves the project alone when globals have not changed', async () => {
    await open();
    state().syncGlobals([]);
    expect(state().isProjectDirty).toBe(false);
    state().syncGlobals([{ key: 'global.city', label: 'City', type: 'text', value: 'London' }]);
    await state().saveNow();
    state().syncGlobals([{ key: 'global.city', label: 'City', type: 'text', value: 'London' }]);
    expect(state().isProjectDirty).toBe(false);
    expect(state().past.filter((entry) => entry.target.kind === 'project')).toHaveLength(0);
  });

  it('does not let a viewer\'s visit save anything', async () => {
    const id = await services.projects.create({ ...blankProject('page', 'org', 'Mine'), documents: [{ kind: 'page', title: 'Home', slug: '', content }] });
    state().load(services, (await services.projects.get(id))!, await services.projects.listDocuments(id), true);
    state().syncGlobals([{ key: 'global.city', label: 'City', type: 'text', value: 'London' }]);
    expect(state().draft?.variables['global.city']).toBe('London');
    expect(state().isProjectDirty).toBe(false);
  });
});
