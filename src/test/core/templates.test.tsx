import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { PROJECT_TYPES, parseContent } from '../../core/schema';
import { defaultValues, expandContent, tokensIn, VariableDef } from '../../core/variables';
import { validateValues } from '../../core/validation';
import { BLOCK_META, canContain } from '../../renderer/blockMeta';
import { BLOCK_RENDERERS } from '../../renderer/blocks';
import { ExperienceView } from '../../renderer/ExperienceView';
import { blankProject, projectFromTemplate, TEMPLATES, templatesFor, initialValues, applyBranding } from '../../templates';

describe('template contract', () => {
  it('has unique ids', () => {
    const ids = TEMPLATES.map((template) => template.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(PROJECT_TYPES)('offers at least 3 templates for %s', (type) => {
    expect(templatesFor(type).length).toBeGreaterThanOrEqual(3);
  });

  it('offers 6 website templates', () => {
    expect(templatesFor('website')).toHaveLength(6);
  });

  it('has a renderer for every block type', () => {
    expect(Object.keys(BLOCK_RENDERERS).sort()).toEqual(Object.keys(BLOCK_META).sort());
  });

  describe.each(TEMPLATES.map((template) => [template.id, template] as const))('%s', (_id, template) => {
    it('has valid documents with unique slugs', () => {
      template.pages.forEach((page) => parseContent(page.content));
      const slugs = template.pages.map((page) => page.slug);
      expect(new Set(slugs).size).toBe(slugs.length);
    });

    it('only uses declared variables', () => {
      const declared = new Set(template.variables.map((def) => def.key));
      const check = (value: unknown, aliases: Set<string>, where: string) => {
        for (const token of tokensIn(value)) {
          const alias = token.split('.')[0];
          const isLoopValue = aliases.has(alias);
          expect(declared.has(token) || isLoopValue, `${where} uses undeclared {{${token}}}`).toBe(true);
        }
      };

      for (const page of template.pages) {
        const visit = (id: string, aliases: Set<string>) => {
          const node = page.content.nodes[id];
          const scope = new Set(aliases);
          if (node.repeat) {
            expect(declared.has(node.repeat.list), `${id} repeats undeclared ${node.repeat.list}`).toBe(true);
            scope.add(node.repeat.as);
          }
          check(node.props, scope, `${page.title}/${id}`);
          check(node.styles, scope, `${page.title}/${id}`);
          if (node.showIf) {
            const key = node.showIf.replace(/^!/, '');
            expect(declared.has(key) || scope.has(key.split('.')[0]), `${id} has undeclared condition ${key}`).toBe(true);
          }
          node.children.forEach((child) => visit(child, scope));
        };
        visit(page.content.rootId, new Set());
        check(page.seo, new Set(), page.title);
      }
    });

    it('declares every variable with a default that passes validation', () => {
      const result = validateValues(template.variables, defaultValues(template.variables));
      expect(result.errors).toEqual({});
    });

    it('uses every declared variable', () => {
      const used = new Set<string>();
      for (const page of template.pages) {
        tokensIn(page.seo, used);
        for (const node of Object.values(page.content.nodes)) {
          tokensIn(node.props, used);
          tokensIn(node.styles, used);
          if (node.repeat) used.add(node.repeat.list);
          if (node.showIf) used.add(node.showIf.replace(/^!/, ''));
        }
      }
      for (const def of template.variables as VariableDef[]) {
        expect(used.has(def.key), `${def.key} is never used`).toBe(true);
      }
    });

    it('places blocks only in allowed parents', () => {
      for (const page of template.pages) {
        for (const node of Object.values(page.content.nodes)) {
          for (const child of node.children) {
            const childType = page.content.nodes[child].type;
            expect(canContain(node.type, childType), `${childType} inside ${node.type}`).toBe(true);
          }
        }
      }
    });

    it('renders with no leftover tokens', () => {
      const project = projectFromTemplate(template, 'org', initialValues(template), template.themes[0].theme);
      const html = renderToStaticMarkup(
        <ExperienceView
          documents={project.documents.map((doc) => doc.content)}
          theme={project.theme}
          variables={project.variables}
          ctx={{ mode: 'live' }}
        />,
      );
      expect(html).not.toContain('{{');
      expect(html.length).toBeGreaterThan(100);
    });
  });
});

describe('creating projects from templates', () => {
  it('personalizes the output from the user values', () => {
    const template = TEMPLATES.find((t) => t.id === 'website-restaurant')!;
    const values = {
      ...initialValues(template),
      'brand.name': 'Rosa Trattoria',
      dishes: [{ name: 'Lasagna', description: 'Baked fresh', price: '$15', photo: '' }],
    };
    const project = projectFromTemplate(template, 'org', values, template.themes[0].theme);
    expect(project.title).toBe('Rosa Trattoria');

    const home = project.documents.find((doc) => doc.title === 'Home')!;
    const html = renderToStaticMarkup(
      <ExperienceView documents={[home.content]} theme={project.theme} variables={values} ctx={{ mode: 'live' }} />,
    );
    expect(html).toContain('Lasagna');
    expect(html).not.toContain('Wood-fired Pizza');
  });

  it('omits a section when its optional value is empty', () => {
    const template = TEMPLATES.find((t) => t.id === 'website-business')!;
    const page = template.pages.find((p) => p.slug === 'global-footer')!;
    const withPhone = JSON.stringify(expandContent(page.content, { ...initialValues(template), 'contact.phone': '555' }));
    const withoutPhone = JSON.stringify(expandContent(page.content, { ...initialValues(template), 'contact.phone': '' }));
    expect(withPhone).toContain('555');
    expect(withoutPhone.length).toBeLessThan(withPhone.length);
  });

  it('does not share data between projects made from one template', () => {
    const template = TEMPLATES[0];
    const a = projectFromTemplate(template, 'org', initialValues(template), template.themes[0].theme);
    a.documents[0].title = 'Changed';
    expect(template.pages[0].title).not.toBe('Changed');
    const values = initialValues(template);
    (values.services as unknown[]).push({});
    expect((initialValues(template).services as unknown[]).length).toBe(3);
  });

  it('applies the workspace Brand Kit', () => {
    const template = TEMPLATES.find((t) => t.id === 'website-business')!;
    expect(initialValues(template, { companyName: 'Acme' })['brand.name']).toBe('Acme');
    expect(applyBranding(template.themes[0].theme, { primaryColor: '#123456', borderRadius: 4 })).toMatchObject({ primary: '#123456', radius: '4px' });
  });

  it.each(PROJECT_TYPES)('creates a valid blank %s', (type) => {
    const project = blankProject(type, 'org', 'Untitled');
    project.documents.forEach((doc) => parseContent(doc.content));
    expect(project.documents.length).toBeGreaterThan(0);
  });
});
