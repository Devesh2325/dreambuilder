import { DEFAULT_THEME, DEFAULT_TRIGGERS, GLOBAL_FOOTER_SLUG, GLOBAL_HEADER_SLUG, ProjectSettings, ProjectType, Theme } from '../core/schema';
import { MODULES } from '../core/modules';
import { defaultValues, VariableDef, VariableValues } from '../core/variables';
import { NewProject } from '../data/services';
import { OrganizationBranding } from '../types/auth';
import { buildContent, el, TemplateDefinition, TemplatePage } from './dsl';
import { BANNER_TEMPLATES } from './banners';
import { EXPERIENCE_TEMPLATES } from './experiences';
import { INDUSTRY_TEMPLATES } from './industries';
import { INDUSTRY_PAGE_TEMPLATES } from './industryPages';
import { LAYOUT_TEMPLATES } from './layouts';
import { PAGE_INDUSTRY, PAGE_PARTS, withSections } from './pageSections';
import { PAGE_TEMPLATES } from './pages';
import { WEBSITE_TEMPLATES } from './websites';

export * from './dsl';

export const TEAM_TEMPLATE_PREFIX = 'team:';

const withPageExtras = (template: TemplateDefinition): TemplateDefinition => {
  if (template.type !== 'page') return template;
  const parts = PAGE_PARTS[template.id];
  return { ...(parts ? withSections(template, parts) : template), category: PAGE_INDUSTRY[template.id] ?? template.category };
};

export const TEMPLATES: TemplateDefinition[] = [
  ...WEBSITE_TEMPLATES, ...INDUSTRY_TEMPLATES, ...EXPERIENCE_TEMPLATES, ...PAGE_TEMPLATES, ...LAYOUT_TEMPLATES, ...INDUSTRY_PAGE_TEMPLATES, ...BANNER_TEMPLATES,
].map(withPageExtras);

export function getTemplate(id: string): TemplateDefinition | undefined {
  return TEMPLATES.find((template) => template.id === id);
}

/** A project's variables: those of its template, plus any added in the editor. */
export function projectVariableDefs(templateId: string | null | undefined, settings: ProjectSettings): VariableDef[] {
  const fromTemplate = templateId ? (getTemplate(templateId)?.variables ?? []) : [];
  const own = settings.variableDefs ?? [];
  return [...fromTemplate, ...own.filter((def) => !fromTemplate.some((other) => other.key === def.key))];
}

export function templatesFor(type: ProjectType): TemplateDefinition[] {
  return TEMPLATES.filter((template) => template.type === type);
}

/** Uses the workspace's Brand Kit as the starting point for a new project. */
export function applyBranding(theme: Theme, branding: Partial<OrganizationBranding>): Theme {
  return {
    ...theme,
    primary: branding.primaryColor ?? theme.primary,
    secondary: branding.secondaryColor ?? theme.secondary,
    fontHeading: branding.fontFamily ?? theme.fontHeading,
    fontBody: branding.fontFamily ?? theme.fontBody,
    radius: branding.borderRadius !== undefined ? `${branding.borderRadius}px` : theme.radius,
  };
}

export function initialValues(template: TemplateDefinition, branding: Partial<OrganizationBranding> = {}): VariableValues {
  const values = defaultValues(template.variables);
  // Only fills fields the template actually has.
  if (branding.companyName && 'brand.name' in values) values['brand.name'] = branding.companyName;
  if (branding.logoUrl && 'brand.logo' in values) values['brand.logo'] = branding.logoUrl;
  return values;
}

export function projectFromTemplate(
  template: TemplateDefinition,
  organizationId: string,
  values: VariableValues,
  theme: Theme,
  name?: string,
): NewProject {
  const titleValue = name?.trim() || (template.titleVariable ? values[template.titleVariable] : undefined);
  return {
    organizationId,
    type: template.type,
    title: (typeof titleValue === 'string' && titleValue.trim()) || template.title,
    description: template.description,
    variables: values,
    theme,
    // Team templates aren't in the built-in list, so their variables travel with the project.
    settings: { ...structuredClone(template.settings ?? {}), ...(template.id.startsWith(TEAM_TEMPLATE_PREFIX) ? { variableDefs: template.variables } : {}) },
    templateId: template.id,
    templateVersion: template.version,
    documents: structuredClone(template.pages),
  };
}

const STARTING_BLOCK: Partial<Record<ProjectType, ReturnType<typeof el>[]>> = {
  tour: [el('TourStep', {}, [el('Heading', { props: { text: 'First step', level: 'h4' } }), el('Text', { props: { text: 'Describe this step.' } })])],
  form: [el('Form', {}, [el('FormField', { props: { name: 'email', label: 'Email', inputType: 'email', required: true } })])],
  demo: [el('DemoScreen', {}, [el('DemoHotspot')])],
  banner: [el('Banner', {}, [el('Text', { props: { text: 'Your announcement' } })])],
  menu: [el('Navbar')],
  faq: [el('Accordion')],
};

/** An empty project for people who skip templates. */
export function blankProject(type: ProjectType, organizationId: string, title: string, theme: Theme = DEFAULT_THEME): NewProject {
  const delivery = MODULES[type].delivery;
  const pages: TemplatePage[] =
    type === 'website'
      ? [
          { kind: 'page', title: 'Home', slug: '', content: buildContent('p', [el('Section', {}, [el('Container')])]) },
          { kind: 'global', title: 'Header', slug: GLOBAL_HEADER_SLUG, content: buildContent('h', [el('Navbar', { props: { brand: title } })]) },
          { kind: 'global', title: 'Footer', slug: GLOBAL_FOOTER_SLUG, content: buildContent('f', [el('Section', {}, [el('Text', { props: { text: title } })])]) },
        ]
      : [{
          kind: delivery === 'site' ? 'page' : 'experience',
          title: 'Main',
          slug: '',
          content: buildContent('n', STARTING_BLOCK[type] ?? [el('Section', {}, [el('Container')])]),
        }];

  return {
    organizationId,
    type,
    title,
    variables: {},
    theme,
    settings: delivery === 'overlay' ? { triggers: DEFAULT_TRIGGERS } : {},
    documents: pages,
  };
}
