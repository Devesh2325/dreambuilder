import { DocContent } from '../core/schema';
import { VariableDef } from '../core/variables';
import { buildContent, el, El, heading, section, TemplateDefinition, text } from './dsl';
import { listVar, longVar, textVar, urlVar } from './experiences';

const muted = { color: 'var(--fp-muted)' };
const center = { alignItems: 'center', textAlign: 'center' };
const narrow = { maxWidth: '760px', marginLeft: 'auto', marginRight: 'auto', width: '100%' };

export const sectionHeading = (title: string, sub?: string): El =>
  el('Box', { styles: { ...center, ...narrow, gap: '10px' } }, [heading(title), ...(sub ? [text(sub, muted)] : [])]);

/** The parts most landing pages need, each filled in from variables. */
export interface SectionCopy {
  marquee: string[];
  quotes: { quote: string; name: string }[];
  faq: { question: string; answer: string }[];
  closing: { title: string; label: string; link?: string };
  footer: { brand: string; text: string; email: string };
}

export const marqueeVar = (items: string[]): VariableDef =>
  listVar('more.marquee', 'Scrolling strip', items.map((value) => ({ text: value })), [{ key: 'text', label: 'Text', type: 'text', required: true }], 'Scrolling strip');

export const marqueeSection = (): El =>
  section([
    el('Marquee', { props: { speed: 30 } }, [
      el('Text', { repeat: { list: 'more.marquee', as: 'mark' }, props: { text: '{{mark.text}}' }, styles: { fontWeight: 700, fontSize: '1.125rem', color: 'var(--fp-muted)', whiteSpace: 'nowrap' } }),
    ]),
  ], { paddingTop: '24px', paddingBottom: '24px', background: 'var(--fp-surface)' }, { showIf: 'more.marquee' });

export const quotesVar = (items: SectionCopy['quotes']): VariableDef =>
  listVar('more.quotes', 'Customer quotes', items, [
    { key: 'quote', label: 'Quote', type: 'longtext', required: true },
    { key: 'name', label: 'Name', type: 'text', required: true },
  ], 'Customer quotes');

export const quotesCarousel = (): El =>
  section([
    sectionHeading('What people say'),
    el('Carousel', { props: { interval: 6, showArrows: true }, styles: narrow }, [
      el('Slide', { repeat: { list: 'more.quotes', as: 'person' }, styles: { ...center, gap: '12px', padding: '16px 48px' } }, [
        text('"{{person.quote}}"', { fontSize: '1.375rem', fontWeight: 500 }),
        text('{{person.name}}', { fontWeight: 700, color: 'var(--fp-primary)' }),
      ]),
    ]),
  ], {}, { showIf: 'more.quotes' });

export const faqVar = (items: SectionCopy['faq']): VariableDef =>
  listVar('more.faq', 'Questions', items, [
    { key: 'question', label: 'Question', type: 'text', required: true },
    { key: 'answer', label: 'Answer', type: 'longtext', required: true },
  ], 'FAQ');

export const faqBlock = (): El =>
  section([
    sectionHeading('Common questions'),
    el('Box', { styles: { ...narrow, gap: '0' } }, [
      el('Accordion', { repeat: { list: 'more.faq', as: 'item' }, props: { question: '{{item.question}}', answer: '{{item.answer}}' } }),
    ]),
  ], { background: 'var(--fp-surface)' }, { showIf: 'more.faq' });

export const closingVars = (closing: SectionCopy['closing']): VariableDef[] => [
  textVar('closing.title', 'Closing message', closing.title, 'Closing call to action'),
  textVar('closing.label', 'Button label', closing.label, 'Closing call to action'),
  urlVar('closing.link', 'Button link', closing.link ?? 'https://example.com', 'Closing call to action'),
];

export const closingBand = (): El =>
  section([
    el('Box', { styles: { ...center, gap: '18px' } }, [
      heading('{{closing.title}}', 'h2', { color: '#ffffff' }),
      el('Button', { props: { text: '{{closing.label}}', href: '{{closing.link}}', variant: 'primary', action: 'link' }, styles: { background: '#ffffff', color: '#0f172a' } }),
    ]),
  ], { background: 'linear-gradient(120deg, var(--fp-primary), var(--fp-secondary))', paddingTop: '64px', paddingBottom: '64px' });

export const footerVars = (footer: SectionCopy['footer']): VariableDef[] => [
  textVar('footer.brand', 'Business name', footer.brand, 'Footer'),
  longVar('footer.text', 'About line', footer.text, 'Footer'),
  { key: 'footer.email', label: 'Email', type: 'email', default: footer.email, group: 'Footer' },
];

export const footerBlock = (): El =>
  section([
    el('Grid', { styles: { gap: '32px' } }, [
      el('Box', { styles: { gap: '6px' } }, [heading('{{footer.brand}}', 'h4'), text('{{footer.text}}', muted, 'footer.text')]),
      el('Box', { styles: { gap: '6px', alignItems: 'flex-end' }, responsive: { mobile: { alignItems: 'flex-start' } } }, [text('{{footer.email}}', {}, 'footer.email')]),
    ]),
  ], { paddingTop: '40px', paddingBottom: '40px', borderTop: '1px solid color-mix(in srgb, var(--fp-text) 12%, transparent)' });

type Part = 'marquee' | 'quotes' | 'faq' | 'closing' | 'footer';

const GENERIC: SectionCopy = {
  marquee: ['Easy to start', 'Friendly support', 'Clear pricing', 'Loved by customers', 'Ready when you are'],
  quotes: [
    { quote: 'It did exactly what we needed, and it was easy from the first day.', name: 'Jordan P.' },
    { quote: 'Clear, simple and well worth it.', name: 'Aisha K.' },
    { quote: 'The best decision we made this year.', name: 'Tom W.' },
  ],
  faq: [
    { question: 'How do I get started?', answer: 'Click the button at the top of this page and follow the steps.' },
    { question: 'Can I change my mind?', answer: 'Yes. Get in touch any time and we will sort it out.' },
    { question: 'How can I reach you?', answer: 'Email us and we will reply within one working day.' },
  ],
  closing: { title: 'Ready to get started?', label: 'Get started' },
  footer: { brand: 'Your business', text: 'One line about what you do.', email: 'hello@example.com' },
};

const moveIntoPage = (content: DocContent, parts: El[], prefix: string, index?: number) => {
  const built = buildContent(prefix, parts);
  const added = built.nodes[built.rootId].children;
  const { [built.rootId]: _root, ...nodes } = built.nodes;
  Object.assign(content.nodes, nodes);
  const children = content.nodes[content.rootId].children;
  children.splice(index ?? children.length, 0, ...added);
};

/** Adds the common sections to a page template that doesn't have them yet. */
export function withSections(template: TemplateDefinition, parts: Part[]): TemplateDefinition {
  const next = structuredClone(template);
  const content = next.pages[0].content;
  const has = (part: Part) => parts.includes(part);
  if (has('marquee')) {
    next.variables.push(marqueeVar(GENERIC.marquee));
    moveIntoPage(content, [marqueeSection()], 'zm', 1);
  }
  if (has('quotes')) next.variables.push(quotesVar(GENERIC.quotes));
  if (has('faq')) next.variables.push(faqVar(GENERIC.faq));
  if (has('closing')) next.variables.push(...closingVars(GENERIC.closing));
  if (has('footer')) next.variables.push(...footerVars(GENERIC.footer));
  moveIntoPage(content, [
    ...(has('quotes') ? [quotesCarousel()] : []),
    ...(has('faq') ? [faqBlock()] : []),
    ...(has('closing') ? [closingBand()] : []),
    ...(has('footer') ? [footerBlock()] : []),
  ], 'ze');
  return next;
}

export const ALL_PARTS: Part[] = ['marquee', 'quotes', 'faq', 'closing', 'footer'];

/** Which sections each existing page template gains. */
export const PAGE_PARTS: Record<string, Part[]> = {
  'page-launch': ALL_PARTS,
  'page-event': ['marquee', 'faq', 'footer'],
  'page-saas-landing': ['marquee', 'quotes', 'faq', 'closing', 'footer'],
  'page-ebook-download': ['marquee', 'quotes', 'faq', 'footer'],
  'page-app-download': ['marquee', 'quotes', 'faq', 'closing', 'footer'],
  'page-consultation': ['marquee', 'quotes', 'faq', 'closing', 'footer'],
  'page-case-study': ['closing', 'footer'],
  'page-blog-article': ['footer'],
  'page-docs-article': ['footer'],
  'page-pricing': ['marquee', 'quotes', 'closing', 'footer'],
  'page-gradient-startup': ['marquee', 'quotes', 'faq', 'footer'],
  'page-photo-story': ['marquee', 'quotes', 'closing', 'footer'],
  'page-project-showcase': ['marquee', 'quotes', 'footer'],
  'page-online-course': ['marquee', 'quotes', 'faq', 'closing', 'footer'],
  'page-fundraiser': ['marquee', 'quotes', 'faq', 'footer'],
  'page-special-offer': ['marquee', 'quotes', 'faq', 'closing', 'footer'],
  'page-about-team': ['marquee', 'quotes', 'closing', 'footer'],
  'page-comparison': ['marquee', 'quotes', 'faq', 'footer'],
  'page-job-opening': ['footer'],
};

/** Page templates sort by industry, the same as websites. */
export const PAGE_INDUSTRY: Record<string, string> = {
  'page-launch': 'Technology',
  'page-event': 'Events',
  'page-coming-soon': 'Technology',
  'page-saas-landing': 'Technology',
  'page-case-study': 'Technology',
  'page-app-download': 'Technology',
  'page-pricing': 'Technology',
  'page-gradient-startup': 'Technology',
  'page-comparison': 'Technology',
  'page-ebook-download': 'Professional services',
  'page-consultation': 'Professional services',
  'page-about-team': 'Professional services',
  'page-job-opening': 'Professional services',
  'page-thank-you': 'Professional services',
  'page-photo-story': 'Retail',
  'page-special-offer': 'Retail',
  'page-project-showcase': 'Creative',
  'page-online-course': 'Education',
  'page-fundraiser': 'Community',
};
