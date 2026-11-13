import { MODULES, moduleNoun } from '../../core/modules';
import { DEFAULT_TRIGGERS, ProjectSettings } from '../../core/schema';
import { expandContent, RenderNode } from '../../core/variables';
import { AppServices, DocumentRecord, ProjectRecord, SubmissionRecord } from '../../data/services';
import { publicSitePath } from '../routes';

export const embedSnippet = (origin: string, projectId: string, options?: { language?: string; device?: string }) => {
  const langAttr = options?.language && options.language !== 'en' ? ` data-language="${options.language}"` : '';
  const devAttr = options?.device && options.device !== 'desktop' ? ` data-device="${options.device}"` : '';
  return `<script src="${origin}/flowpilot.js" data-project-id="${projectId}"${langAttr}${devAttr} defer></script>`;
};

export const inlineSnippet = (projectId: string) => `<div data-flowpilot="${projectId}"></div>`;

/**
 * Builds a ready-to-paste AI Prompt for Cursor, ChatGPT, Claude, GitHub Copilot, or v0.
 * Users can paste this prompt directly into their coding AI assistant to integrate the experience instantly.
 */
export function buildAiPrompt(project: ProjectRecord, liveUrl?: string | null): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://app.flowpilot.com';
  const noun = moduleNoun(project.type);
  const typeLabel = MODULES[project.type]?.label ?? project.type;
  const isSite = MODULES[project.type]?.delivery === 'site';
  const showsInline = MODULES[project.type]?.delivery === 'inline' || project.settings.position === 'inline';
  const publicUrl = liveUrl || (project.slug ? `${origin}${publicSitePath(project.slug)}` : `${origin}/s/${project.id}`);

  return `Integrate this FlowPilot ${noun} into my application.

PROJECT CONTEXT:
- Name: "${project.title}"
- Project ID: "${project.id}"
- Type: ${typeLabel} (${noun})
- Public Share URL (One Link): ${publicUrl}

HOW TO EMBED:

${isSite ? `Option 1: Full-Page Responsive Iframe (Recommended for Websites & Pages)
<iframe
  src="${publicUrl}"
  title="${project.title.replace(/"/g, '&quot;')}"
  width="100%"
  height="750px"
  style="border:0;border-radius:12px;width:100%;max-width:100%;box-shadow:0 12px 36px rgba(0,0,0,0.12);"
  allow="clipboard-write"
  allowfullscreen
></iframe>` : `Option 1: Plain HTML Script Tag
Place before the closing </body> tag:
<script src="${origin}/flowpilot.js" data-project-id="${project.id}" defer></script>
${showsInline ? `And add the container where the ${noun} should appear:\n<div data-flowpilot="${project.id}"></div>` : ''}

Option 2: React / Next.js Component
- For Next.js (App Router or Pages Router):
  import Script from 'next/script';
  // In your layout or page:
  <Script src="${origin}/flowpilot.js" data-project-id="${project.id}" strategy="afterInteractive" />
  ${showsInline ? `// Where you want the ${noun} to render:\n  <div data-flowpilot="${project.id}" />` : ''}

- For Plain React SPA:
  Add <script src="${origin}/flowpilot.js" data-project-id="${project.id}" defer></script> into index.html
  ${showsInline ? `And render <div data-flowpilot="${project.id}" /> in your JSX component.` : ''}

Option 3: Responsive Iframe Embed
<iframe
  src="${publicUrl}"
  title="${project.title.replace(/"/g, '&quot;')}"
  width="100%"
  height="600px"
  style="border:0;border-radius:12px;width:100%;"
  allowfullscreen
></iframe>`}

INSTRUCTIONS FOR AI ASSISTANT:
Please inspect my current file/component and integrate this FlowPilot ${noun} directly using the best option above. Ensure responsive styling, proper cleanup on unmount, and clean layout presentation without hydration errors.`;
}

/**
 * Cells starting with = + - @ would run as formulas when opened in a spreadsheet.
 * The data comes from anonymous visitors, so they get a leading quote.
 */
export function csvCell(value: unknown): string {
  let text = value === undefined || value === null ? '' : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export function submissionsToCsv(rows: SubmissionRecord[]): string {
  const columns = [...new Set(rows.flatMap((row) => Object.keys(row.data)))];
  const header = ['Received', ...columns].map(csvCell).join(',');
  const lines = rows.map((row) => [row.createdAt, ...columns.map((column) => row.data[column])].map(csvCell).join(','));
  return [header, ...lines].join('\r\n');
}

/** How many blocks of a type visitors will see, including repeated ones. */
export function moduleCount(project: ProjectRecord, documents: DocumentRecord[], blockType: string): number {
  const count = (node: RenderNode | null): number =>
    !node ? 0 : (node.type === blockType ? 1 : 0) + node.children.reduce((sum, child) => sum + count(child), 0);
  return documents.reduce((sum, doc) => sum + count(expandContent(doc.content, project.variables)), 0);
}

/** A banner's style follows from the blocks it's made of. */
export function bannerStyle(documents: DocumentRecord[]): string {
  const types = documents.flatMap((doc) => Object.values(doc.content.nodes).map((node) => node.type));
  if (types.includes('Carousel')) return 'Carousel';
  if (types.includes('Popup')) return 'Popup';
  return 'Bar';
}

export const isPopupBanner = (documents: DocumentRecord[]): boolean =>
  documents.some((doc) => Object.values(doc.content.nodes).some((node) => node.type === 'Popup'));

export function describePages(settings: ProjectSettings): string {
  const rule = settings.triggers?.urlRules[0];
  if (!rule?.value) return 'All pages';
  const verb = rule.type === 'exact' ? 'Only' : rule.type === 'starts_with' ? 'Starts with' : 'Contains';
  return `${verb} ${rule.value}`;
}

const FREQUENCY_LABELS = {
  always: 'Every time',
  once_per_session: 'Once per visit',
  once_per_visitor: 'Once per visitor',
  until_completed: 'Until completed',
};

export const describeFrequency = (settings: ProjectSettings): string =>
  FREQUENCY_LABELS[(settings.triggers ?? DEFAULT_TRIGGERS).frequency];

export function describeTrigger(settings: ProjectSettings): string {
  const triggers = settings.triggers ?? DEFAULT_TRIGGERS;
  const parts: string[] = [];
  if (triggers.delaySeconds > 0) parts.push(`After ${triggers.delaySeconds}s`);
  if (triggers.scrollPercent !== undefined) parts.push(`At ${triggers.scrollPercent}% scroll`);
  if (triggers.exitIntent) parts.push('On exit');
  return parts.join(', ') || 'On page load';
}

/** The copy starts as a draft with its own address, and doesn't copy responses. */
export async function duplicateProject(services: AppServices, project: ProjectRecord): Promise<string> {
  const documents = await services.projects.listDocuments(project.id);
  return services.projects.create({
    organizationId: project.organizationId,
    type: project.type,
    title: `${project.title} (copy)`.slice(0, 200),
    description: project.description,
    variables: project.variables,
    theme: project.theme,
    settings: project.settings,
    templateId: project.templateId ?? undefined,
    documents: documents.map(({ kind, title, slug, seo, content }) => ({ kind, title, slug, seo, content })),
  });
}
