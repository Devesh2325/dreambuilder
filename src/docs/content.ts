const files = import.meta.glob('./content/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

export interface Doc {
  slug: string;
  title: string;
  body: string;
}

const docs = new Map<string, Doc>(
  Object.entries(files).map(([path, body]) => {
    const slug = path.replace('./content/', '').replace('.md', '');
    const title = body.match(/^# (.+)$/m)?.[1] ?? slug;
    return [slug, { slug, title, body }];
  }),
);

export const getDoc = (slug: string) => docs.get(slug);
export const allDocs = () => [...docs.values()];

export const DOC_SECTIONS: { title: string; slugs: string[] }[] = [
  { title: 'Start here', slugs: ['getting-started', 'install'] },
  { title: 'Main modules', slugs: ['website', 'page', 'tour', 'form'] },
  { title: 'More modules', slugs: ['demo', 'banner', 'menu', 'faq', 'popup', 'checklist', 'survey', 'pricing', 'testimonials'] },
  { title: 'Reference', slugs: ['api', 'webhooks', 'troubleshooting'] },
];

export function fillPlaceholders(body: string, origin: string, projectId: string | null): string {
  // Project IDs come from the address bar, so only the expected format is used.
  const id = projectId && /^[\w-]{1,64}$/.test(projectId) ? projectId : 'YOUR_PROJECT_ID';
  return body.replaceAll('{{ORIGIN}}', origin).replaceAll('{{PROJECT_ID}}', id);
}
