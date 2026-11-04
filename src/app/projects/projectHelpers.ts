import { DEFAULT_TRIGGERS, ProjectSettings } from '../../core/schema';
import { expandContent, RenderNode } from '../../core/variables';
import { AppServices, DocumentRecord, ProjectRecord, SubmissionRecord } from '../../data/services';

export const embedSnippet = (origin: string, projectId: string) =>
  `<script src="${origin}/flowpilot.js" data-project-id="${projectId}" defer></script>`;

export const inlineSnippet = (projectId: string) => `<div data-flowpilot="${projectId}"></div>`;

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
