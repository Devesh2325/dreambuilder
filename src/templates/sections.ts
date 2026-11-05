import { DocNode } from '../core/schema';
import { cloneSubtree } from '../core/tree';
import { photo } from './assets';
import { buildContent, button, el, El, heading, image, section, text } from './dsl';

export interface LibrarySection {
  id: string;
  title: string;
  category: 'Hero' | 'Features' | 'Social proof' | 'Pricing' | 'Call to action' | 'Content' | 'Contact' | 'Footer' | 'Layout';
  element: El;
}

const muted = { color: 'var(--fp-muted)' };
const center = { alignItems: 'center', textAlign: 'center' };
const narrow = { maxWidth: '720px', marginLeft: 'auto', marginRight: 'auto' };

const titleBlock = (title: string, sub?: string): El =>
  el('Box', { styles: { ...center, ...narrow } }, [heading(title), ...(sub ? [text(sub, muted)] : [])]);

const feature = (title: string, body: string): El =>
  el('Card', {}, [heading(title, 'h3'), text(body, muted)]);

const quote = (words: string, name: string): El =>
  el('Card', {}, [text(`"${words}"`, { fontSize: '1.0625rem' }), text(name, { fontWeight: 700 })]);

const plan = (name: string, price: string, details: string, highlighted = false): El =>
  el('Card', { styles: highlighted ? { border: '2px solid var(--fp-primary)' } : {} }, [
    heading(name, 'h3'),
    heading(price, 'h2', { color: 'var(--fp-primary)' }),
    text(details, muted),
    button('Get started', '#', highlighted ? 'primary' : 'secondary'),
  ]);

const stat = (value: string, label: string): El =>
  el('Box', { styles: { textAlign: 'center' } }, [heading(value, 'h2', { color: 'var(--fp-primary)' }), text(label, muted)]);

const column = (children: El[] = []): El => el('Box', { styles: { minHeight: '120px' } }, children);

export const SECTION_LIBRARY: LibrarySection[] = [
  {
    id: 'hero-center', title: 'Centered hero', category: 'Hero',
    element: section([
      el('Box', { styles: { ...center, ...narrow, gap: '20px' } }, [
        heading('A clear headline about what you do', 'h1'),
        text('One sentence explaining who it helps and why it matters.', { ...muted, fontSize: '1.1875rem' }),
        el('Row', { styles: { justifyContent: 'center' } }, [button('Get started'), button('Learn more', '#', 'secondary')]),
      ]),
    ], { paddingTop: '96px', paddingBottom: '96px' }),
  },
  {
    id: 'hero-split', title: 'Hero with image', category: 'Hero',
    element: section([
      el('Grid', { styles: { alignItems: 'center', gap: '48px' } }, [
        el('Box', { styles: { gap: '20px', alignItems: 'flex-start' } }, [
          heading('Show your product at its best', 'h1'),
          text('Explain the main benefit in one or two short lines.', { ...muted, fontSize: '1.125rem' }),
          button('Start now'),
        ]),
        image(photo('laptop'), 'Product', { height: '420px' }),
      ]),
    ]),
  },
  {
    id: 'hero-gradient', title: 'Bold gradient hero', category: 'Hero',
    element: section([
      el('Box', { styles: { ...center, ...narrow, gap: '20px' } }, [
        heading('Make a bold first impression', 'h1', { color: '#ffffff' }),
        text('A short, confident line that makes people want to know more.', { color: 'rgba(255,255,255,.85)', fontSize: '1.1875rem' }),
        el('Button', { props: { text: 'Try it free', href: '#', variant: 'primary', action: 'link' }, styles: { background: '#ffffff', color: '#312e81' } }),
      ]),
    ], { background: 'linear-gradient(135deg, #0f172a, #4338ca 60%, #7c3aed)', paddingTop: '112px', paddingBottom: '112px' }),
  },
  {
    id: 'hero-photo', title: 'Hero over a photo', category: 'Hero',
    element: section([
      el('Box', { styles: { gap: '20px', alignItems: 'flex-start', maxWidth: '620px' } }, [
        heading('Tell your story with a great picture', 'h1', { color: '#ffffff' }),
        text('Strong images work well for places, food and people.', { color: 'rgba(255,255,255,.9)', fontSize: '1.125rem' }),
        button('See more'),
      ]),
    ], { background: `linear-gradient(100deg, rgba(15,23,42,.85), rgba(15,23,42,.3)), url(${photo('office', 1600, 1000)}) center / cover`, paddingTop: '128px', paddingBottom: '128px' }),
  },
  {
    id: 'features-3', title: 'Three features', category: 'Features',
    element: section([
      titleBlock('Why people choose us', 'A short line that introduces your main benefits.'),
      el('Grid', {}, [feature('Fast setup', 'Get going in minutes, with no training.'), feature('Everything in one place', 'Replace the tools you juggle today.'), feature('Friendly support', 'Real people, ready to help.')]),
    ]),
  },
  {
    id: 'features-image', title: 'Feature with image', category: 'Features',
    element: section([
      el('Grid', { styles: { alignItems: 'center', gap: '48px' } }, [
        image(photo('team'), 'Team at work', { height: '380px' }),
        el('Box', { styles: { gap: '14px' } }, [
          heading('Built for how your team works'),
          text('Describe one important feature in detail, and what it makes possible.', muted),
          text('✓ A clear benefit'),
          text('✓ Another good reason'),
          text('✓ One more thing people love'),
        ]),
      ]),
    ]),
  },
  {
    id: 'features-steps', title: 'How it works', category: 'Features',
    element: section([
      titleBlock('How it works'),
      el('Grid', {}, [feature('1. Sign up', 'Create your account in under a minute.'), feature('2. Set up', 'Follow the simple guided steps.'), feature('3. Grow', 'Watch the results come in.')]),
    ], { background: 'var(--fp-surface)' }),
  },
  {
    id: 'stats', title: 'Key numbers', category: 'Social proof',
    element: section([el('Grid', {}, [stat('10k+', 'Customers'), stat('99.9%', 'Uptime'), stat('4.9/5', 'Average rating'), stat('24/7', 'Support')])], { paddingTop: '48px', paddingBottom: '48px' }),
  },
  {
    id: 'testimonials', title: 'Customer quotes', category: 'Social proof',
    element: section([
      titleBlock('Loved by our customers'),
      el('Grid', {}, [quote('This changed how our whole team works.', 'Jordan P.'), quote('Easy to set up and even easier to love.', 'Aisha K.'), quote('The best decision we made this year.', 'Tom W.')]),
    ], { background: 'var(--fp-surface)' }),
  },
  {
    id: 'testimonial-large', title: 'Large quote', category: 'Social proof',
    element: section([
      el('Box', { styles: { ...center, ...narrow, gap: '16px' } }, [
        text('"The one quote that captures why customers stay with you."', { fontSize: '1.625rem', fontWeight: 600 }),
        text('Name, role at company', muted),
      ]),
    ]),
  },
  {
    id: 'pricing-3', title: 'Three plans', category: 'Pricing',
    element: section([
      titleBlock('Simple, honest pricing', 'Start free. Upgrade when you need to.'),
      el('Grid', {}, [plan('Starter', '$0', 'For trying things out.'), plan('Pro', '$19 / month', 'For growing businesses.', true), plan('Team', '$49 / month', 'For teams working together.')]),
    ]),
  },
  {
    id: 'cta-band', title: 'Call to action band', category: 'Call to action',
    element: section([
      el('Box', { styles: { ...center, gap: '18px' } }, [
        heading('Ready to get started?', 'h2', { color: '#ffffff' }),
        el('Button', { props: { text: 'Start now', href: '#', variant: 'primary', action: 'link' }, styles: { background: '#ffffff', color: '#0f172a' } }),
      ]),
    ], { background: 'linear-gradient(120deg, var(--fp-primary), var(--fp-secondary))' }),
  },
  {
    id: 'cta-card', title: 'Call to action card', category: 'Call to action',
    element: section([
      el('Card', { styles: { ...center, padding: '48px 24px', gap: '16px' } }, [
        heading('Have a question? Talk to us.', 'h2'),
        text('We usually reply within one working day.', muted),
        button('Contact us'),
      ]),
    ]),
  },
  {
    id: 'faq', title: 'Questions and answers', category: 'Content',
    element: section([
      titleBlock('Common questions'),
      el('Box', { styles: { ...narrow, width: '100%', gap: '0' } }, [
        el('Accordion', { props: { question: 'How do I get started?', answer: 'Create an account and follow the steps.' } }),
        el('Accordion', { props: { question: 'Can I cancel any time?', answer: 'Yes. There are no long-term contracts.' } }),
        el('Accordion', { props: { question: 'How can I contact support?', answer: 'Email us and we will reply within one day.' } }),
      ]),
    ]),
  },
  {
    id: 'article', title: 'Article text', category: 'Content',
    element: section([
      el('Box', { styles: { ...narrow, gap: '14px' } }, [
        heading('A heading for this part'),
        text('Write your text here. Short paragraphs and clear examples are easiest to read.', { fontSize: '1.0625rem' }),
        text('Add another paragraph to develop the idea.', { fontSize: '1.0625rem' }),
      ]),
    ]),
  },
  {
    id: 'gallery', title: 'Image gallery', category: 'Content',
    element: section([
      titleBlock('Our work'),
      el('Grid', {}, [image(photo('design', 800, 600), 'Design', { height: '240px' }), image(photo('camera', 800, 600), 'Camera', { height: '240px' }), image(photo('office', 800, 600), 'Office', { height: '240px' })]),
    ]),
  },
  {
    id: 'team', title: 'Team', category: 'Content',
    element: section([
      titleBlock('Meet the team'),
      el('Grid', {}, [
        el('Box', { styles: center }, [image(photo('team', 400, 400), 'Team member', { height: '180px', width: '180px', borderRadius: '50%' }), heading('Sam Rivera', 'h4'), text('Founder', muted)]),
        el('Box', { styles: center }, [image(photo('meeting', 400, 400), 'Team member', { height: '180px', width: '180px', borderRadius: '50%' }), heading('Maya Chen', 'h4'), text('Design', muted)]),
        el('Box', { styles: center }, [image(photo('office', 400, 400), 'Team member', { height: '180px', width: '180px', borderRadius: '50%' }), heading('Luis Ortega', 'h4'), text('Support', muted)]),
      ]),
    ]),
  },
  {
    id: 'contact', title: 'Contact form', category: 'Contact',
    element: section([
      el('Grid', { styles: { gap: '48px' } }, [
        el('Box', { styles: { gap: '12px' } }, [heading('Get in touch'), text('Tell us what you need and we will get back to you.', muted), text('hello@example.com'), text('+1 555 123 4567')]),
        el('Card', {}, [el('Form', { props: { submitText: 'Send message', successMessage: "Thanks! We'll be in touch." } }, [
          el('FormField', { props: { name: 'name', label: 'Name', required: true } }),
          el('FormField', { props: { name: 'email', label: 'Email', inputType: 'email', required: true } }),
          el('FormField', { props: { name: 'message', label: 'Message', inputType: 'textarea', required: true } }),
        ])]),
      ]),
    ]),
  },
  {
    id: 'newsletter', title: 'Newsletter sign-up', category: 'Contact',
    element: section([
      el('Box', { styles: { ...center, ...narrow, gap: '14px' } }, [
        heading('Stay in the loop'),
        text('One useful email a month. No spam.', muted),
        el('Form', { props: { submitText: 'Subscribe', successMessage: 'Thanks for subscribing!' }, styles: { maxWidth: '420px' } }, [
          el('FormField', { props: { name: 'email', label: 'Email', inputType: 'email', required: true } }),
        ]),
      ]),
    ], { background: 'var(--fp-surface)' }),
  },
  {
    id: 'footer', title: 'Footer', category: 'Footer',
    element: section([
      el('Grid', {}, [
        el('Box', {}, [heading('Your brand', 'h4'), text('A short line about what you do.', muted)]),
        el('Box', {}, [heading('Company', 'h4'), button('About', '#', 'link'), button('Contact', '#', 'link')]),
        el('Box', {}, [heading('Contact', 'h4'), text('hello@example.com'), text('+1 555 123 4567')]),
      ]),
    ], { background: 'var(--fp-surface)', paddingTop: '48px', paddingBottom: '48px' }),
  },
  { id: 'layout-2', title: 'Two columns', category: 'Layout', element: section([el('Grid', { styles: { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }, responsive: { mobile: { gridTemplateColumns: 'minmax(0, 1fr)' } } }, [column(), column()])]) },
  { id: 'layout-3', title: 'Three columns', category: 'Layout', element: section([el('Grid', { styles: { gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }, responsive: { mobile: { gridTemplateColumns: 'minmax(0, 1fr)' } } }, [column(), column(), column()])]) },
  { id: 'layout-4', title: 'Four columns', category: 'Layout', element: section([el('Grid', { styles: { gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }, responsive: { mobile: { gridTemplateColumns: 'minmax(0, 1fr)' } } }, [column(), column(), column(), column()])]) },
  { id: 'layout-sidebar', title: 'Sidebar and content', category: 'Layout', element: section([el('Grid', { styles: { gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 3fr)' }, responsive: { mobile: { gridTemplateColumns: 'minmax(0, 1fr)' } } }, [column(), column()])]) },
];

export interface SectionNodes {
  rootId: string;
  nodes: Record<string, DocNode>;
}

/** A section as document nodes. Every call gets fresh ids, so a section can be added many times. */
export function sectionNodes(section_: LibrarySection): SectionNodes {
  const content = buildContent('s', [section_.element]);
  return cloneSubtree(content.nodes, content.nodes[content.rootId].children[0]);
}
