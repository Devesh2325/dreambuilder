import { DocNode } from '../core/schema';
import { cloneSubtree } from '../core/tree';
import { photo } from './assets';
import { buildContent, button, el, El, heading, image, section, text } from './dsl';

export type SectionCategory =
  | 'Hero'
  | 'Moving'
  | 'Features'
  | 'Social proof'
  | 'Pricing'
  | 'Call to action'
  | 'Content'
  | 'Contact'
  | 'Footer'
  | 'Layout'
  | 'Stats'
  | 'Gallery'
  | 'Blog'
  | 'How it works'
  | 'Team & Profile';

export interface LibrarySection {
  id: string;
  title: string;
  category: SectionCategory;
  element: El;
}

const muted = { color: 'var(--fp-muted)' };
const center = { alignItems: 'center', textAlign: 'center' };
const narrow = { maxWidth: '720px', marginLeft: 'auto', marginRight: 'auto' };

const titleBlock = (title: string, sub?: string): El =>
  el('Box', { styles: { ...center, ...narrow } }, [heading(title), ...(sub ? [text(sub, muted)] : [])]);

const feature = (title: string, body: string): El =>
  el('Card', { styles: { hoverEffect: 'lift', animation: 'fp-slide-up', transition: 'all 0.25s ease' } }, [heading(title, 'h3'), text(body, muted)]);

const quote = (words: string, name: string): El =>
  el('Card', { styles: { hoverEffect: 'lift', animation: 'fp-slide-up', transition: 'all 0.25s ease', gap: '10px' } }, [
    el('Rating', { props: { value: 5, max: 5, min: 1, color: '#f59e0b', showText: true, text: '5.0 Rating' } }),
    text(`"${words}"`, { fontSize: '1.0625rem' }),
    text(name, { fontWeight: 700 }),
  ]);

const plan = (name: string, price: string, details: string, highlighted = false): El =>
  el('Card', { styles: { hoverEffect: 'lift', animation: 'fp-slide-up', transition: 'all 0.25s ease', gap: '10px', ...(highlighted ? { border: '2px solid var(--fp-primary)' } : {}) } }, [
    el('Rating', { props: { value: 5, max: 5, min: 1, color: '#f59e0b', showText: true, text: '★ 4.9 Plan Score' } }),
    heading(name, 'h3'),
    heading(price, 'h2', { color: 'var(--fp-primary)' }),
    text(details, muted),
    button('Get started', '#', highlighted ? 'primary' : 'secondary'),
  ]);

const payPlan = (name: string, price: string, details: string): El =>
  el('Card', { styles: { hoverEffect: 'lift', animation: 'fp-slide-up', transition: 'all 0.25s ease', gap: '10px' } }, [
    el('Rating', { props: { value: 5, max: 5, min: 1, color: '#f59e0b', showText: true, text: '★ 5.0' } }),
    heading(name, 'h3'),
    text(details, muted),
    el('PaymentButton', { props: { text: 'Buy now', price, provider: 'stripe', url: '' } }),
  ]);

const stat = (value: string, label: string): El =>
  el('Box', { styles: { textAlign: 'center' } }, [heading(value, 'h2', { color: 'var(--fp-primary)' }), text(label, muted)]);

const column = (children: El[] = []): El => el('Box', { styles: { minHeight: '120px' } }, children);

const slide = (title: string, words: string, background: string): El =>
  el('Slide', { styles: { padding: '96px 48px', alignItems: 'center', textAlign: 'center', gap: '16px', background } }, [
    heading(title, 'h1', { color: '#ffffff' }),
    text(words, { color: 'rgba(255,255,255,.88)', fontSize: '1.125rem' }),
    el('Button', { props: { text: 'Learn more', href: '#', variant: 'primary', action: 'link' }, styles: { background: '#ffffff', color: '#0f172a' } }),
  ]);

const strip = (items: string[]): El[] => items.map((value) => text(value, { fontWeight: 700, fontSize: '1.125rem', color: 'var(--fp-muted)', whiteSpace: 'nowrap' }));

export const SECTION_LIBRARY: LibrarySection[] = [
  {
    id: 'pricing-pay', title: 'Prices with pay buttons', category: 'Pricing',
    element: section([
      titleBlock('Choose what suits you', 'Pay securely with your card. Add your payment link to each button.'),
      el('Grid', { styles: { gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }, responsive: { tablet: { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }, mobile: { gridTemplateColumns: 'minmax(0, 1fr)' } } }, [
        payPlan('Starter', '$19', 'For getting started.'),
        payPlan('Standard', '$49', 'What most people choose.'),
        payPlan('Premium', '$99', 'Everything we offer.'),
      ]),
    ]),
  },
  {
    id: 'hero-carousel', title: 'Hero carousel', category: 'Hero',
    element: el('Section', { styles: { padding: '0' } }, [
      el('Carousel', { props: { interval: 6, showArrows: true } }, [
        slide('Your first big message', 'A short line that makes people want to know more.', 'linear-gradient(135deg, #0f172a, #4338ca)'),
        slide('Your second big message', 'Another reason to choose you, said simply.', 'linear-gradient(135deg, #065f46, #0ea5e9)'),
        slide('Your third big message', 'End on what you most want people to do.', 'linear-gradient(135deg, #7c2d12, #e11d48)'),
      ]),
    ]),
  },
  {
    id: 'marquee-text', title: 'Scrolling text strip', category: 'Moving',
    element: section([el('Marquee', { props: { speed: 30 } }, strip(['Free delivery', 'Easy returns', 'Loved by customers', 'Friendly support', 'New every week']))], { paddingTop: '20px', paddingBottom: '20px', background: 'var(--fp-surface)' }),
  },
  {
    id: 'marquee-bold', title: 'Bold scrolling banner', category: 'Moving',
    element: section([el('Marquee', { props: { speed: 20 } }, ['Now open', 'Book today', 'Limited places', 'Now open', 'Book today', 'Limited places'].map((value) => text(value, { fontWeight: 800, fontSize: '2.5rem', color: '#ffffff', whiteSpace: 'nowrap' })))], { paddingTop: '20px', paddingBottom: '20px', background: 'var(--fp-primary)' }),
  },
  {
    id: 'marquee-logos', title: 'Trusted-by strip', category: 'Moving',
    element: section([
      text('Trusted by teams at', { ...muted, textAlign: 'center', fontWeight: 600 }),
      el('Marquee', { props: { speed: 35 } }, strip(['Northwind', 'Harbor', 'Evergreen', 'Riverside', 'Keystone', 'Brightpath'])),
    ], { paddingTop: '32px', paddingBottom: '32px' }),
  },
  {
    id: 'quotes-carousel', title: 'Quotes carousel', category: 'Social proof',
    element: section([
      titleBlock('What people say'),
      el('Carousel', { props: { interval: 6, showArrows: true }, styles: { ...narrow, width: '100%' } }, [
        el('Slide', { styles: { ...center, padding: '16px 48px' } }, [text('"This changed how our whole team works."', { fontSize: '1.375rem', fontWeight: 500 }), text('Jordan P.', { fontWeight: 700 })]),
        el('Slide', { styles: { ...center, padding: '16px 48px' } }, [text('"Easy to set up and even easier to love."', { fontSize: '1.375rem', fontWeight: 500 }), text('Aisha K.', { fontWeight: 700 })]),
        el('Slide', { styles: { ...center, padding: '16px 48px' } }, [text('"The best decision we made this year."', { fontSize: '1.375rem', fontWeight: 500 }), text('Tom W.', { fontWeight: 700 })]),
      ]),
    ], { background: 'var(--fp-surface)' }),
  },
  {
    id: 'features-6', title: 'Six features', category: 'Features',
    element: section([
      titleBlock('Everything you need', 'A short line that introduces what you offer.'),
      el('Grid', { styles: { gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }, responsive: { tablet: { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }, mobile: { gridTemplateColumns: 'minmax(0, 1fr)' } } }, [
        feature('Fast', 'Say what makes this quick.'), feature('Simple', 'Say what makes this easy.'), feature('Reliable', 'Say why people can count on it.'),
        feature('Flexible', 'Say how it fits different needs.'), feature('Secure', 'Say how you keep things safe.'), feature('Supported', 'Say how you help people.'),
      ]),
    ]),
  },
  {
    id: 'faq-split', title: 'Questions beside a heading', category: 'Content',
    element: section([
      el('Grid', { styles: { gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 2fr)', gap: '48px' }, responsive: { mobile: { gridTemplateColumns: 'minmax(0, 1fr)' } } }, [
        el('Box', { styles: { gap: '10px' } }, [heading('Questions?'), text('If yours isn\u2019t here, just ask.', muted)]),
        el('Box', { styles: { gap: '0' } }, [
          el('Accordion', { props: { question: 'How do I get started?', answer: 'Create an account and follow the steps.' } }),
          el('Accordion', { props: { question: 'Can I cancel any time?', answer: 'Yes. There are no long-term contracts.' } }),
          el('Accordion', { props: { question: 'How can I contact support?', answer: 'Email us and we will reply within one day.' } }),
        ]),
      ]),
    ]),
  },
  {
    id: 'cta-split', title: 'Call to action with image', category: 'Call to action',
    element: section([
      el('Grid', { styles: { alignItems: 'center', gap: '48px' } }, [
        el('Box', { styles: { gap: '16px', alignItems: 'flex-start' } }, [heading('Ready when you are'), text('One last reason to take the next step.', muted), button('Get started')]),
        image(photo('meeting'), 'People working together', { height: '320px' }),
      ]),
    ], { background: 'var(--fp-surface)' }),
  },
  {
    id: 'footer-columns', title: 'Footer with columns', category: 'Footer',
    element: section([
      el('Grid', { styles: { gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '32px' }, responsive: { tablet: { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }, mobile: { gridTemplateColumns: 'minmax(0, 1fr)' } } }, [
        el('Box', { styles: { gap: '8px' } }, [heading('Your brand', 'h4'), text('A short line about what you do.', muted)]),
        el('Box', { styles: { gap: '8px', alignItems: 'flex-start' } }, [heading('Product', 'h4'), button('Features', '#', 'link'), button('Pricing', '#', 'link')]),
        el('Box', { styles: { gap: '8px', alignItems: 'flex-start' } }, [heading('Company', 'h4'), button('About', '#', 'link'), button('Careers', '#', 'link')]),
        el('Box', { styles: { gap: '8px', alignItems: 'flex-start' } }, [heading('Contact', 'h4'), text('hello@example.com'), text('+1 555 123 4567')]),
      ]),
    ], { paddingTop: '56px', paddingBottom: '56px', background: 'var(--fp-surface)' }),
  },
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

  // ---- Added Hero sections ----
  {
    id: 'hero-saas-modern', title: 'Modern product hero with badge', category: 'Hero',
    element: section([
      el('Box', { styles: { ...center, ...narrow, gap: '20px' } }, [
        el('Badge', { props: { text: 'New Release: Version 2.0 Live', tone: 'primary' } }),
        heading('Build and launch interactive tours faster', 'h1'),
        text('Engage visitors, capture qualified leads, and guide users step-by-step with no code required.', { ...muted, fontSize: '1.25rem' }),
        el('Row', { styles: { justifyContent: 'center', gap: '12px' } }, [
          button('Start building free', '#', 'primary'),
          button('Book live demo', '#', 'secondary'),
        ]),
      ]),
      image(photo('dashboard'), 'Product analytics dashboard', { height: '460px', borderRadius: '16px' }),
    ], { paddingTop: '80px', paddingBottom: '80px' }),
  },
  {
    id: 'hero-minimal-clean', title: 'Clean typography hero', category: 'Hero',
    element: section([
      el('Box', { styles: { ...center, ...narrow, gap: '24px' } }, [
        heading('Turn casual visitors into loyal power users', 'h1'),
        text('The all-in-one onboarding and experience engine designed for high-growth digital products.', { ...muted, fontSize: '1.25rem' }),
        el('Row', { styles: { justifyContent: 'center', gap: '12px' } }, [
          button('Get started free', '#', 'primary'),
          button('View documentation', '#', 'link'),
        ]),
        text('No credit card required · Free 14-day trial · 5-minute setup', { fontSize: '0.875rem', ...muted }),
      ]),
    ], { paddingTop: '100px', paddingBottom: '100px' }),
  },
  {
    id: 'hero-split-interactive', title: 'Split hero with checklist', category: 'Hero',
    element: section([
      el('Grid', { styles: { alignItems: 'center', gap: '48px' } }, [
        el('Box', { styles: { gap: '20px', alignItems: 'flex-start' } }, [
          el('Badge', { props: { text: 'Enterprise Ready', tone: 'success' } }),
          heading('Onboarding that actually converts', 'h1'),
          text('Guide every customer through your product features with interactive tooltips and guided walkthroughs.', muted),
          el('List', { props: { items: 'Interactive step-by-step guided tours\nEmbeddable on any website or web app\nReal-time visitor drop-off analytics', style: 'check' } }),
          el('Row', { styles: { gap: '12px' } }, [
            button('Start free trial', '#', 'primary'),
            button('Explore templates', '#', 'secondary'),
          ]),
        ]),
        image(photo('laptop'), 'Interactive preview', { height: '400px' }),
      ]),
    ], { paddingTop: '80px', paddingBottom: '80px' }),
  },

  // ---- Added CTA sections ----
  {
    id: 'cta-glow-card', title: 'High-converting glow CTA card', category: 'Call to action',
    element: section([
      el('Card', { styles: { ...center, padding: '64px 32px', gap: '20px', background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 60%, #312e81 100%)', color: '#ffffff' } }, [
        el('Badge', { props: { text: 'Limited Time Offer', tone: 'warning' } }),
        heading('Ready to transform your user onboarding?', 'h2', { color: '#ffffff' }),
        text('Join over 10,000 forward-thinking teams creating delightful user walkthroughs and websites.', { color: 'rgba(255,255,255,0.85)', fontSize: '1.125rem' }),
        el('Row', { styles: { justifyContent: 'center', gap: '12px' } }, [
          el('Button', { props: { text: 'Create your first project', href: '#', variant: 'primary', action: 'link' }, styles: { background: '#ffffff', color: '#0f172a' } }),
          button('Schedule walkthrough', '#', 'secondary'),
        ]),
        text('Free plan available · Instant activation · Cancel anytime', { fontSize: '0.8125rem', color: 'rgba(255,255,255,0.7)' }),
      ]),
    ]),
  },
  {
    id: 'cta-split-newsletter', title: 'Split CTA with consultation form', category: 'Call to action',
    element: section([
      el('Grid', { styles: { alignItems: 'center', gap: '48px' } }, [
        el('Box', { styles: { gap: '16px' } }, [
          heading('Get expert growth guidance', 'h2'),
          text('Speak directly with our onboarding specialists to audit your product flow and double conversion rates.', muted),
          el('List', { props: { items: 'Custom product tour architecture review\nUX friction points diagnosis\nTailored growth strategy report', style: 'check' } }),
        ]),
        el('Card', {}, [
          el('Form', { props: { submitText: 'Request consultation', successMessage: 'We have received your request and will contact you within 24 hours.' } }, [
            el('FormField', { props: { name: 'fullName', label: 'Full name', required: true } }),
            el('FormField', { props: { name: 'workEmail', label: 'Work email', inputType: 'email', required: true } }),
            el('FormField', { props: { name: 'companyWebsite', label: 'Company website', inputType: 'url', required: true } }),
          ]),
        ]),
      ]),
    ], { background: 'var(--fp-surface)', paddingTop: '64px', paddingBottom: '64px' }),
  },
  {
    id: 'cta-banner-stats', title: 'CTA banner with trust metrics', category: 'Call to action',
    element: section([
      el('Box', { styles: { ...center, gap: '20px' } }, [
        heading('Speed up activation and reduce support tickets', 'h2', { color: '#ffffff' }),
        text('Deliver real-time guidance right when your users need it most.', { color: 'rgba(255,255,255,0.9)', fontSize: '1.125rem' }),
        el('Grid', { styles: { gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', width: '100%', maxWidth: '680px', gap: '16px' } }, [
          el('Box', { styles: { textAlign: 'center' } }, [heading('45%', 'h2', { color: '#ffffff' }), text('Higher Completion', { color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem' })]),
          el('Box', { styles: { textAlign: 'center' } }, [heading('3x', 'h2', { color: '#ffffff' }), text('Faster Time-to-Value', { color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem' })]),
          el('Box', { styles: { textAlign: 'center' } }, [heading('-60%', 'h2', { color: '#ffffff' }), text('Support Enquiries', { color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem' })]),
        ]),
        el('Button', { props: { text: 'Claim your free account', href: '#', variant: 'primary', action: 'link' }, styles: { background: '#ffffff', color: '#0f172a' } }),
      ]),
    ], { background: 'linear-gradient(135deg, var(--fp-primary), #4338ca)', paddingTop: '56px', paddingBottom: '56px' }),
  },

  // ---- Added Profile & Team sections ----
  {
    id: 'profile-founder', title: 'Founder and executive profile', category: 'Content',
    element: section([
      el('Card', { styles: { padding: '40px 32px' } }, [
        el('Grid', { styles: { alignItems: 'center', gap: '36px' } }, [
          el('Box', { styles: center }, [
            el('Avatar', { props: { src: photo('doctor', 400, 400), name: 'Dr. Elena Vance', subtitle: 'Chief Executive Officer', size: 'large', showText: false } }),
            heading('Dr. Elena Vance', 'h3'),
            text('Founder & Chief Executive Officer', muted),
          ]),
          el('Box', { styles: { gap: '14px' } }, [
            el('Quote', { props: { text: 'Our mission is to democratize product adoption so any team can build unforgettable software experiences.', cite: 'Dr. Vance, Product Leader of the Year' } }),
            text('Over 15 years leading product engineering across enterprise technology and SaaS platforms.', { ...muted, fontSize: '0.9375rem' }),
            el('Row', { styles: { gap: '10px' } }, [
              button('Connect on LinkedIn', '#', 'secondary'),
              button('Read founder letter', '#', 'link'),
            ]),
          ]),
        ]),
      ]),
    ], { background: 'var(--fp-surface)' }),
  },
  {
    id: 'profile-author-card', title: 'Creator and author profile', category: 'Content',
    element: section([
      el('Box', { styles: { ...center, ...narrow, gap: '18px' } }, [
        el('Avatar', { props: { src: photo('writing', 400, 400), name: 'Marcus Sterling', subtitle: 'Author & Designer', size: 'large', showText: false } }),
        heading('Marcus Sterling', 'h2'),
        text('Design Systems Architect & Author', muted),
        text('Writing about interaction design, product onboarding architecture, and scalable design systems for high-traffic web applications.', { fontSize: '1.0625rem' }),
        el('Row', { styles: { justifyContent: 'center', gap: '12px' } }, [
          button('Follow updates', '#', 'primary'),
          button('Browse articles', '#', 'secondary'),
        ]),
      ]),
    ], { paddingTop: '64px', paddingBottom: '64px' }),
  },
  {
    id: 'profile-team-showcase', title: 'Executive leadership team', category: 'Content',
    element: section([
      titleBlock('Leadership team', 'Dedicated individuals guiding our vision and operations'),
      el('Grid', { styles: { gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '24px' }, responsive: { tablet: { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }, mobile: { gridTemplateColumns: 'minmax(0, 1fr)' } } }, [
        el('Card', { styles: center }, [
          el('Avatar', { props: { src: photo('meeting', 400, 400), name: 'Aria Montgomery', subtitle: 'Product VP', size: 'large', showText: false } }),
          heading('Aria Montgomery', 'h4'),
          text('VP of Product', muted),
          text('Former Head of Experience at Apex Systems.', { fontSize: '0.8125rem', ...muted }),
        ]),
        el('Card', { styles: center }, [
          el('Avatar', { props: { src: photo('coding', 400, 400), name: 'Devon Lee', subtitle: 'CTO', size: 'large', showText: false } }),
          heading('Devon Lee', 'h4'),
          text('Chief Technology Officer', muted),
          text('Distinguished engineer and open source maintainer.', { fontSize: '0.8125rem', ...muted }),
        ]),
        el('Card', { styles: center }, [
          el('Avatar', { props: { src: photo('office', 400, 400), name: 'Zoe Nakamura', subtitle: 'Head of Growth', size: 'large', showText: false } }),
          heading('Zoe Nakamura', 'h4'),
          text('Head of Growth', muted),
          text('Leading user acquisition and viral product loops.', { fontSize: '0.8125rem', ...muted }),
        ]),
        el('Card', { styles: center }, [
          el('Avatar', { props: { src: photo('team', 400, 400), name: 'Liam Hughes', subtitle: 'Customer Success', size: 'large', showText: false } }),
          heading('Liam Hughes', 'h4'),
          text('Head of Customer Success', muted),
          text('Empowering customers with round-the-clock guidance.', { fontSize: '0.8125rem', ...muted }),
        ]),
      ]),
    ]),
  },

  // ===========================================================================
  // 1. HERO EXPANSION (Fintech Terminal, Developer Platform, Visual Showcase)
  // ===========================================================================
  {
    id: 'hero-fintech-terminal',
    title: 'Algorithmic Financial Terminal Hero',
    category: 'Hero',
    element: section([
      el('Box', { styles: { ...center, ...narrow, gap: '20px' } }, [
        el('Row', { styles: { justifyContent: 'center', gap: '8px' } }, [
          el('Badge', { props: { text: 'SEBI Registered & AI Powered', tone: 'success' } }),
          el('Rating', { props: { value: 5, max: 5, color: '#f59e0b', showText: true, text: '4.9/5 (2,400+ reviews)' } }),
        ]),
        heading('High-Frequency Quantitative Insights & Research Advisory', 'h1'),
        text('Actionable algorithmic market intelligence, disciplined risk management, and verified research setups for active traders.', { ...muted, fontSize: '1.25rem', lineHeight: 1.6 }),
        el('Row', { styles: { justifyContent: 'center', gap: '12px' } }, [
          button('Access Terminal Now', '#', 'primary'),
          button('Explore Verified Performance', '#', 'secondary'),
        ]),
      ]),
      el('Card', { styles: { background: '#090d16', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '16px', padding: '24px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', animation: 'fp-slide-up' } }, [
        el('Row', { styles: { justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px', marginBottom: '16px' } }, [
          el('Row', { styles: { gap: '6px' } }, [
            el('Box', { styles: { width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' } }),
            el('Box', { styles: { width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' } }),
            el('Box', { styles: { width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' } }),
          ]),
          text('NIFTY 50 REALTIME RADAR · BREAKOUT DETECTED', { color: '#10b981', fontSize: '0.75rem', fontWeight: 700 }),
        ]),
        el('Grid', { styles: { gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '16px', textAlign: 'center' }, responsive: { mobile: { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' } } }, [
          el('Box', { styles: { padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' } }, [text('NIFTY 50', { fontSize: '0.75rem', color: '#94a3b8' }), heading('24,850.30', 'h3', { color: '#10b981', fontSize: '1.25rem' }), text('+1.24% (+305 pts)', { fontSize: '0.75rem', color: '#10b981' })]),
          el('Box', { styles: { padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' } }, [text('BANKNIFTY', { fontSize: '0.75rem', color: '#94a3b8' }), heading('52,140.80', 'h3', { color: '#10b981', fontSize: '1.25rem' }), text('+0.92% (+478 pts)', { fontSize: '0.75rem', color: '#10b981' })]),
          el('Box', { styles: { padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' } }, [text('WIN RATE', { fontSize: '0.75rem', color: '#94a3b8' }), heading('89.4%', 'h3', { color: '#38bdf8', fontSize: '1.25rem' }), text('Verified Trade Log', { fontSize: '0.75rem', color: '#94a3b8' })]),
          el('Box', { styles: { padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' } }, [text('RISK / REWARD', { fontSize: '0.75rem', color: '#94a3b8' }), heading('1 : 3.4', 'h3', { color: '#fbbf24', fontSize: '1.25rem' }), text('Auto Stop-Loss Active', { fontSize: '0.75rem', color: '#94a3b8' })]),
        ]),
      ]),
    ], { paddingTop: '72px', paddingBottom: '72px' }),
  },
  {
    id: 'hero-dev-platform',
    title: 'Developer Platform & API Console Hero',
    category: 'Hero',
    element: section([
      el('Grid', { styles: { alignItems: 'center', gap: '48px' }, responsive: { mobile: { gridTemplateColumns: 'minmax(0, 1fr)' } } }, [
        el('Box', { styles: { gap: '20px', alignItems: 'flex-start' } }, [
          el('Badge', { props: { text: 'Developer Preview v3.4 Live', tone: 'primary' } }),
          heading('Build, test, and ship APIs with zero friction', 'h1'),
          text('Integrated API design workspace, automated mock servers, and CI/CD test orchestration in one unified toolchain.', muted),
          el('Row', { styles: { gap: '12px' } }, [
            button('Start Free in Browser', '#', 'primary'),
            button('Download Desktop App', '#', 'secondary'),
          ]),
          text('✓ Compatible with Postman collections · Native gRPC & OpenAPI 3.1 support', { fontSize: '0.8125rem', color: 'var(--fp-muted)' }),
        ]),
        el('Card', { styles: { background: '#0f172a', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '16px', padding: '20px', color: '#ffffff', animation: 'fp-slide-up' } }, [
          el('Row', { styles: { justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px', marginBottom: '12px' } }, [
            text('GET /v2/analytics/realtime', { color: '#38bdf8', fontWeight: 700, fontSize: '0.8125rem' }),
            el('Badge', { props: { text: '200 OK (14ms)', tone: 'success' } }),
          ]),
          el('CodeBlock', { props: { code: 'curl -X GET "https://api.flowpilot.dev/v2/metrics" \\\n  -H "Authorization: Bearer sec_live_89a2"\n\n{\n  "status": "connected",\n  "active_users": 14280,\n  "p99_latency_ms": 11.4\n}', language: 'bash' } }),
        ]),
      ]),
    ], { paddingTop: '80px', paddingBottom: '80px' }),
  },

  // ===========================================================================
  // 2. FEATURES & BENTO GRIDS
  // ===========================================================================
  {
    id: 'features-bento-grid',
    title: 'Modern 5-Box Bento Grid',
    category: 'Features',
    element: section([
      titleBlock('Engineered for peak performance', 'Everything you need to automate workflows and accelerate digital adoption.'),
      el('Grid', { styles: { gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '20px' }, responsive: { tablet: { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }, mobile: { gridTemplateColumns: 'minmax(0, 1fr)' } } }, [
        el('Card', { styles: { gridColumn: 'span 2', hoverEffect: 'lift', animation: 'fp-slide-up', background: 'linear-gradient(135deg, var(--fp-surface), rgba(79,70,229,0.06))', padding: '32px' }, responsive: { tablet: { gridColumn: 'span 2' }, mobile: { gridColumn: 'span 1' } } }, [
          el('Badge', { props: { text: 'Flagship Architecture', tone: 'primary' } }),
          heading('Real-time synchronization across teams', 'h3'),
          text('Never lose context. Instant multiplayer state updates ensure product managers, engineers, and marketers stay perfectly aligned.', muted),
          image(photo('laptop', 800, 400), 'Realtime canvas', { height: '220px', borderRadius: '12px', marginTop: '16px' }),
        ]),
        el('Card', { styles: { hoverEffect: 'lift', animation: 'fp-slide-up', padding: '32px', gap: '14px' } }, [
          el('Badge', { props: { text: 'Instant Setup', tone: 'success' } }),
          heading('Zero Code Embed', 'h3'),
          text('Drop a single script tag into your web application or CMS. Works flawlessly with React, Vue, Next.js, and static sites.', muted),
          text('✓ Under 38 KB bundle size\n✓ Zero layout shift\n✓ Fully accessible WCAG AA', { fontSize: '0.875rem' }),
        ]),
        el('Card', { styles: { hoverEffect: 'lift', animation: 'fp-slide-up', padding: '32px', gap: '14px' } }, [
          heading('Multi-language Localization', 'h3'),
          text('Translate user tours and onboarding walkthroughs into 20+ languages automatically with integrated machine translation.', muted),
        ]),
        el('Card', { styles: { hoverEffect: 'lift', animation: 'fp-slide-up', padding: '32px', gap: '14px' } }, [
          heading('Role-Based Access Control', 'h3'),
          text('Granular organization permissions with Owner, Admin, Editor, and Viewer privileges to secure mission-critical assets.', muted),
        ]),
        el('Card', { styles: { hoverEffect: 'lift', animation: 'fp-slide-up', padding: '32px', gap: '14px' } }, [
          heading('Privacy First & Compliant', 'h3'),
          text('SOC-2 ready, GDPR compliant, and zero cross-site tracker cookies to ensure total data sovereignty for your enterprise.', muted),
        ]),
      ]),
    ]),
  },
  {
    id: 'features-matrix-4col',
    title: 'Four Pillar Matrix with Hover Lift',
    category: 'Features',
    element: section([
      titleBlock('Core platform capabilities', 'Built from the ground up for speed, reliability, and scale.'),
      el('Grid', { styles: { gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '20px' }, responsive: { tablet: { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }, mobile: { gridTemplateColumns: 'minmax(0, 1fr)' } } }, [
        el('Card', { styles: { hoverEffect: 'lift', animation: 'fp-slide-up', padding: '24px', gap: '12px' } }, [
          el('Badge', { props: { text: 'Speed', tone: 'primary' } }),
          heading('Sub-Millisecond Engine', 'h4'),
          text('Engineered for instant renders and micro-interactions without causing page reloads or lagging UI thread.', muted),
        ]),
        el('Card', { styles: { hoverEffect: 'lift', animation: 'fp-slide-up', padding: '24px', gap: '12px' } }, [
          el('Badge', { props: { text: 'Security', tone: 'success' } }),
          heading('Enterprise Guard', 'h4'),
          text('End-to-end encrypted project revisions, automated backups, and row-level security on Supabase foundation.', muted),
        ]),
        el('Card', { styles: { hoverEffect: 'lift', animation: 'fp-slide-up', padding: '24px', gap: '12px' } }, [
          el('Badge', { props: { text: 'Automation', tone: 'warning' } }),
          heading('AI Synthesis', 'h4'),
          text('Transform user prompts and live links into full multi-page experiences powered by Google Gemini 2.0 Flash.', muted),
        ]),
        el('Card', { styles: { hoverEffect: 'lift', animation: 'fp-slide-up', padding: '24px', gap: '12px' } }, [
          el('Badge', { props: { text: 'Insights', tone: 'info' } }),
          heading('Drop-Off Analytics', 'h4'),
          text('Track every visitor interaction, funnel step completion, and bounce hotspot with privacy-respecting metrics.', muted),
        ]),
      ]),
    ]),
  },

  // ===========================================================================
  // 3. TESTIMONIALS & SOCIAL PROOF
  // ===========================================================================
  {
    id: 'testimonials-wall-of-love',
    title: 'Wall of Love Testimonials (3 Columns)',
    category: 'Social proof',
    element: section([
      titleBlock('Loved by fast-moving builders', 'See why thousands of product teams rely on us daily.'),
      el('Grid', { styles: { gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '20px' }, responsive: { tablet: { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }, mobile: { gridTemplateColumns: 'minmax(0, 1fr)' } } }, [
        el('Card', { styles: { hoverEffect: 'lift', animation: 'fp-slide-up', padding: '24px', gap: '12px' } }, [
          el('Rating', { props: { value: 5, max: 5, color: '#f59e0b', showText: true, text: '5.0 Verified Client' } }),
          text('"We increased our activation rate by 42% within two weeks of launching our guided walkthrough."', { fontSize: '0.9375rem', lineHeight: 1.6 }),
          el('Row', { styles: { gap: '10px', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid var(--fp-border)' } }, [
            el('Avatar', { props: { src: photo('meeting', 100, 100), name: 'Sarah Jenkins', subtitle: 'VP Product @ StackWave', size: 'small', showText: true } }),
          ]),
        ]),
        el('Card', { styles: { hoverEffect: 'lift', animation: 'fp-slide-up', padding: '24px', gap: '12px' } }, [
          el('Rating', { props: { value: 5, max: 5, color: '#f59e0b', showText: true, text: '5.0 Verified Trader' } }),
          text('"The real-time algorithmic signals and SEBI research rigor gave me the exact discipline I needed."', { fontSize: '0.9375rem', lineHeight: 1.6 }),
          el('Row', { styles: { gap: '10px', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid var(--fp-border)' } }, [
            el('Avatar', { props: { src: photo('office', 100, 100), name: 'Rajesh Mehta', subtitle: 'HNW Investor & Founder', size: 'small', showText: true } }),
          ]),
        ]),
        el('Card', { styles: { hoverEffect: 'lift', animation: 'fp-slide-up', padding: '24px', gap: '12px' } }, [
          el('Rating', { props: { value: 5, max: 5, color: '#f59e0b', showText: true, text: '5.0 Verified Engineer' } }),
          text('"Replaced three disparate tools with this single platform. The embed script is tiny and super snappy."', { fontSize: '0.9375rem', lineHeight: 1.6 }),
          el('Row', { styles: { gap: '10px', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid var(--fp-border)' } }, [
            el('Avatar', { props: { src: photo('coding', 100, 100), name: 'David Kim', subtitle: 'Lead Architect @ CloudForge', size: 'small', showText: true } }),
          ]),
        ]),
      ]),
    ], { background: 'var(--fp-surface)' }),
  },
  {
    id: 'testimonials-metrics-spotlight',
    title: 'Enterprise Case Study Spotlight with ROI Pill',
    category: 'Social proof',
    element: section([
      el('Card', { styles: { padding: '48px 36px', background: 'linear-gradient(135deg, var(--fp-surface), rgba(16,185,129,0.06))', border: '1px solid rgba(16,185,129,0.2)' } }, [
        el('Grid', { styles: { alignItems: 'center', gap: '40px' }, responsive: { mobile: { gridTemplateColumns: 'minmax(0, 1fr)' } } }, [
          el('Box', { styles: { gap: '16px' } }, [
            el('Row', { styles: { gap: '8px' } }, [
              el('Badge', { props: { text: '+340% Conversions', tone: 'success' } }),
              el('Badge', { props: { text: 'FinTech Case Study', tone: 'primary' } }),
            ]),
            heading('"FlowPilot transformed our onboarding funnel into an automated conversion machine."', 'h2'),
            text('"Our users now reach their first aha-moment in less than 90 seconds. Support tickets dropped by 60%."', { ...muted, fontSize: '1.0625rem' }),
            el('Row', { styles: { gap: '12px', alignItems: 'center' } }, [
              el('Avatar', { props: { src: photo('team', 120, 120), name: 'Michael O\'Connor', subtitle: 'Chief Operating Officer', size: 'medium', showText: true } }),
            ]),
          ]),
          image(photo('dashboard', 800, 500), 'Conversion KPI dashboard', { height: '320px', borderRadius: '12px' }),
        ]),
      ]),
    ]),
  },

  // ===========================================================================
  // 4. FAQS (Frequently Asked Questions)
  // ===========================================================================
  {
    id: 'faq-modern-accordion-2col',
    title: 'Two-Column Categorized FAQ Accordion',
    category: 'Content',
    element: section([
      titleBlock('Frequently Asked Questions', 'Clear answers to help you get the most out of FlowPilot.'),
      el('Grid', { styles: { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '24px' }, responsive: { mobile: { gridTemplateColumns: 'minmax(0, 1fr)' } } }, [
        el('Box', { styles: { gap: '8px' } }, [
          heading('General & Setup', 'h3', { fontSize: '1.125rem' }),
          el('Accordion', { props: { question: 'How quickly can I publish my first project?', answer: 'You can launch in under 2 minutes. Choose an industry template, customize with our visual editor, and click Publish to get a live URL or embed script.' } }),
          el('Accordion', { props: { question: 'Do I need coding experience?', answer: 'None at all. Everything from text, images, animations, and theme palettes can be customized visually without writing code.' } }),
          el('Accordion', { props: { question: 'Can I connect a custom domain?', answer: 'Yes! Custom apex domains and subdomains (e.g. app.yourcompany.com) are supported with automatic free SSL certificates.' } }),
        ]),
        el('Box', { styles: { gap: '8px' } }, [
          heading('Billing & Compliance', 'h3', { fontSize: '1.125rem' }),
          el('Accordion', { props: { question: 'Can I cancel or switch plans anytime?', answer: 'Yes, subscriptions are completely flexible. You can upgrade, downgrade, or cancel at any moment with no hidden lock-ins.' } }),
          el('Accordion', { props: { question: 'Is FlowPilot enterprise compliant?', answer: 'Yes. We adhere to rigorous data privacy standards, SOC-2 readiness, and row-level security isolation on PostgreSQL.' } }),
          el('Accordion', { props: { question: 'How does the AI generation engine work?', answer: 'Our AI engine uses Google Gemini 2.0 Flash to synthesize conversion copy, feature pillars, and matching design blocks based on your prompt or link.' } }),
        ]),
      ]),
    ]),
  },

  // ===========================================================================
  // 5. HOW IT WORKS / ROADMAP
  // ===========================================================================
  {
    id: 'how-it-works-timeline',
    title: 'Three-Step Process Roadmap',
    category: 'How it works',
    element: section([
      titleBlock('How FlowPilot Works', 'From idea to live production experience in three simple steps.'),
      el('Grid', { styles: { gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '24px' }, responsive: { mobile: { gridTemplateColumns: 'minmax(0, 1fr)' } } }, [
        el('Card', { styles: { hoverEffect: 'lift', animation: 'fp-slide-up', padding: '32px 24px', gap: '14px' } }, [
          el('Badge', { props: { text: 'Step 01', tone: 'primary' } }),
          heading('Choose or Generate', 'h3'),
          text('Pick a tailored industry blueprint or describe your requirements with our Gemini AI generator.', muted),
          text('✓ 100+ proven templates\n✓ Multimodal screenshot vision\n✓ Automatic theme pairing', { fontSize: '0.8125rem' }),
        ]),
        el('Card', { styles: { hoverEffect: 'lift', animation: 'fp-slide-up', padding: '32px 24px', gap: '14px' } }, [
          el('Badge', { props: { text: 'Step 02', tone: 'warning' } }),
          heading('Tailor in Visual Studio', 'h3'),
          text('Edit blocks, rearrange sections, tweak animations, and configure global brand variables with 1 click.', muted),
          text('✓ Real-time drag and drop\n✓ Responsive device previews\n✓ Instant undo and redo', { fontSize: '0.8125rem' }),
        ]),
        el('Card', { styles: { hoverEffect: 'lift', animation: 'fp-slide-up', padding: '32px 24px', gap: '14px' } }, [
          el('Badge', { props: { text: 'Step 03', tone: 'success' } }),
          heading('Publish and Measure', 'h3'),
          text('Deploy to custom domain, embed on your existing web app, and track visitor engagement metrics.', muted),
          text('✓ Global Edge CDN hosting\n✓ Realtime conversion analytics\n✓ Zero maintenance needed', { fontSize: '0.8125rem' }),
        ]),
      ]),
    ], { background: 'var(--fp-surface)' }),
  },

  // ===========================================================================
  // 6. STATS & METRICS
  // ===========================================================================
  {
    id: 'stats-kpi-counter-band',
    title: 'High-Impact KPI Metric Band (4 Pillars)',
    category: 'Stats',
    element: section([
      el('Grid', { styles: { gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '20px', textAlign: 'center' }, responsive: { tablet: { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }, mobile: { gridTemplateColumns: 'minmax(0, 1fr)' } } }, [
        el('Card', { styles: { padding: '28px', background: 'var(--fp-surface)', hoverEffect: 'lift', animation: 'fp-slide-up' } }, [
          heading('99.99%', 'h1', { color: 'var(--fp-primary)', fontSize: '2.5rem', fontWeight: 800 }),
          text('Platform Uptime SLA', { fontWeight: 700, fontSize: '0.9375rem' }),
          text('Monitored around the clock across global edge nodes.', { fontSize: '0.8125rem', ...muted }),
        ]),
        el('Card', { styles: { padding: '28px', background: 'var(--fp-surface)', hoverEffect: 'lift', animation: 'fp-slide-up' } }, [
          heading('12,000+', 'h1', { color: '#10b981', fontSize: '2.5rem', fontWeight: 800 }),
          text('Active Workspaces', { fontWeight: 700, fontSize: '0.9375rem' }),
          text('Trusted by software founders, agencies, and advisors.', { fontSize: '0.8125rem', ...muted }),
        ]),
        el('Card', { styles: { padding: '28px', background: 'var(--fp-surface)', hoverEffect: 'lift', animation: 'fp-slide-up' } }, [
          heading('< 14ms', 'h1', { color: '#38bdf8', fontSize: '2.5rem', fontWeight: 800 }),
          text('Edge Response Time', { fontWeight: 700, fontSize: '0.9375rem' }),
          text('Ultra-fast client bundle delivers zero-lag interactions.', { fontSize: '0.8125rem', ...muted }),
        ]),
        el('Card', { styles: { padding: '28px', background: 'var(--fp-surface)', hoverEffect: 'lift', animation: 'fp-slide-up' } }, [
          heading('4.9 / 5.0', 'h1', { color: '#f59e0b', fontSize: '2.5rem', fontWeight: 800 }),
          text('Customer Satisfaction', { fontWeight: 700, fontSize: '0.9375rem' }),
          text('Based on verified Trustpilot and G2 client reviews.', { fontSize: '0.8125rem', ...muted }),
        ]),
      ]),
    ], { paddingTop: '48px', paddingBottom: '48px' }),
  },

  // ===========================================================================
  // 7. MOVING / LOGOS
  // ===========================================================================
  {
    id: 'logos-marquee-dual-row',
    title: 'Dual-Track Partner Marquee Strip',
    category: 'Moving',
    element: section([
      text('TRUSTED BY INDUSTRY LEADERS & INNOVATIVE TEAMS', { ...muted, textAlign: 'center', fontWeight: 700, fontSize: '0.8125rem', letterSpacing: '0.08em' }),
      el('Marquee', { props: { speed: 30 } }, strip(['Stripe', 'Supabase', 'Vercel', 'Linear', 'Retool', 'GitHub', 'AWS', 'Figma'])),
      el('Marquee', { props: { speed: 25, reverse: true } }, strip(['Brex', 'Ramp', 'Postman', 'Datadog', 'Snowflake', 'Cloudflare', 'Notion', 'Intercom'])),
    ], { paddingTop: '32px', paddingBottom: '32px', background: 'var(--fp-surface)' }),
  },

  // ===========================================================================
  // 8. PRICING & PLANS
  // ===========================================================================
  {
    id: 'pricing-saas-3tier',
    title: 'Modern 3-Tier SaaS Pricing Table',
    category: 'Pricing',
    element: section([
      titleBlock('Transparent, scalable pricing', 'Choose the plan that fits your growth stage. Upgrade or downgrade anytime.'),
      el('Grid', { styles: { gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '24px', alignItems: 'stretch' }, responsive: { tablet: { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }, mobile: { gridTemplateColumns: 'minmax(0, 1fr)' } } }, [
        el('Card', { styles: { padding: '32px', gap: '16px', hoverEffect: 'lift', animation: 'fp-slide-up' } }, [
          heading('Starter', 'h3'),
          heading('$19', 'h1', { color: 'var(--fp-primary)', fontSize: '2.5rem' }),
          text('Ideal for early founders and independent creators.', muted),
          button('Start with Starter', '#', 'secondary'),
          text('✓ Up to 3 active projects\n✓ 10,000 monthly impressions\n✓ Standard support\n✓ FlowPilot watermark', { fontSize: '0.875rem' }),
        ]),
        el('Card', { styles: { padding: '32px', gap: '16px', hoverEffect: 'lift', animation: 'fp-slide-up', border: '2px solid var(--fp-primary)', background: 'linear-gradient(180deg, var(--fp-surface), rgba(79,70,229,0.06))' } }, [
          el('Badge', { props: { text: '★ Most Popular', tone: 'primary' } }),
          heading('Pro Scale', 'h3'),
          heading('$49', 'h1', { color: 'var(--fp-primary)', fontSize: '2.5rem' }),
          text('For fast-growing companies and professional advisors.', muted),
          button('Upgrade to Pro', '#', 'primary'),
          text('✓ Unlimited active projects\n✓ 100,000 monthly impressions\n✓ Custom domains & SSL\n✓ Full AI generation engine\n✓ Priority chat support', { fontSize: '0.875rem' }),
        ]),
        el('Card', { styles: { padding: '32px', gap: '16px', hoverEffect: 'lift', animation: 'fp-slide-up' } }, [
          heading('Enterprise', 'h3'),
          heading('$149', 'h1', { color: 'var(--fp-primary)', fontSize: '2.5rem' }),
          text('Dedicated infrastructure, custom SLAs, and VIP care.', muted),
          button('Talk to Sales', '#', 'secondary'),
          text('✓ Unlimited impressions\n✓ Dedicated account manager\n✓ Custom SSO / SAML integration\n✓ 99.99% Uptime guarantee\n✓ SOC-2 audit reports', { fontSize: '0.875rem' }),
        ]),
      ]),
    ]),
  },

  // ===========================================================================
  // 9. BLOG & CASE STUDIES
  // ===========================================================================
  {
    id: 'blog-insights-3col',
    title: 'Three-Column Editorial Insights Grid',
    category: 'Blog',
    element: section([
      titleBlock('Latest Insights & Product Guides', 'Actionable strategies on digital adoption, conversion rate optimization, and UI design.'),
      el('Grid', { styles: { gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '24px' }, responsive: { tablet: { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }, mobile: { gridTemplateColumns: 'minmax(0, 1fr)' } } }, [
        el('Card', { styles: { hoverEffect: 'lift', animation: 'fp-slide-up', padding: '0', overflow: 'hidden' } }, [
          image(photo('design', 600, 360), 'Design systems', { height: '180px' }),
          el('Box', { styles: { padding: '20px', gap: '10px' } }, [
            el('Row', { styles: { justifyContent: 'space-between' } }, [
              el('Badge', { props: { text: 'UX & Design', tone: 'primary' } }),
              text('5 min read', { fontSize: '0.75rem', ...muted }),
            ]),
            heading('5 Psychological Principles of High-Converting Landing Pages', 'h3', { fontSize: '1.0625rem' }),
            text('How strategic visual hierarchy, friction reduction, and social proof directly double signup rates.', muted),
            button('Read Article →', '#', 'link'),
          ]),
        ]),
        el('Card', { styles: { hoverEffect: 'lift', animation: 'fp-slide-up', padding: '0', overflow: 'hidden' } }, [
          image(photo('coding', 600, 360), 'Architecture', { height: '180px' }),
          el('Box', { styles: { padding: '20px', gap: '10px' } }, [
            el('Row', { styles: { justifyContent: 'space-between' } }, [
              el('Badge', { props: { text: 'Engineering', tone: 'success' } }),
              text('7 min read', { fontSize: '0.75rem', ...muted }),
            ]),
            heading('Zero-Lag Script Embedding: How We Kept FlowPilot Under 40 KB', 'h3', { fontSize: '1.0625rem' }),
            text('Deep dive into tree-shaking, lightweight reactive signals, and direct DOM hydration techniques.', muted),
            button('Read Article →', '#', 'link'),
          ]),
        ]),
        el('Card', { styles: { hoverEffect: 'lift', animation: 'fp-slide-up', padding: '0', overflow: 'hidden' } }, [
          image(photo('meeting', 600, 360), 'Growth strategy', { height: '180px' }),
          el('Box', { styles: { padding: '20px', gap: '10px' } }, [
            el('Row', { styles: { justifyContent: 'space-between' } }, [
              el('Badge', { props: { text: 'Growth', tone: 'warning' } }),
              text('4 min read', { fontSize: '0.75rem', ...muted }),
            ]),
            heading('The Playbook: Reducing User Drop-Off in Guided Walkthroughs', 'h3', { fontSize: '1.0625rem' }),
            text('Proven methods to keep visitors focused and eliminate cognitive overload during initial onboarding.', muted),
            button('Read Article →', '#', 'link'),
          ]),
        ]),
      ]),
    ]),
  },

  // ===========================================================================
  // 10. GALLERY & PORTFOLIO
  // ===========================================================================
  {
    id: 'gallery-showcase-grid',
    title: 'Six-Image Visual Portfolio Gallery',
    category: 'Gallery',
    element: section([
      titleBlock('Selected Client Work & Showcase', 'Explore recent digital experiences designed and published on FlowPilot.'),
      el('Grid', { styles: { gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '20px' }, responsive: { tablet: { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }, mobile: { gridTemplateColumns: 'minmax(0, 1fr)' } } }, [
        el('Card', { styles: { padding: '0', overflow: 'hidden', hoverEffect: 'lift', animation: 'fp-slide-up' } }, [image(photo('office', 600, 400), 'Office layout', { height: '220px' }), el('Box', { styles: { padding: '16px' } }, [heading('Apex Enterprise Suite', 'h4'), text('Interactive product tour and client portal', muted)])]),
        el('Card', { styles: { padding: '0', overflow: 'hidden', hoverEffect: 'lift', animation: 'fp-slide-up' } }, [image(photo('laptop', 600, 400), 'Fintech app', { height: '220px' }), el('Box', { styles: { padding: '16px' } }, [heading('Quantum Wealth Terminal', 'h4'), text('Realtime market analysis and advisory portal', muted)])]),
        el('Card', { styles: { padding: '0', overflow: 'hidden', hoverEffect: 'lift', animation: 'fp-slide-up' } }, [image(photo('design', 600, 400), 'Creative agency', { height: '220px' }), el('Box', { styles: { padding: '16px' } }, [heading('Studio Vanguard', 'h4'), text('Brand portfolio and interactive client intake', muted)])]),
        el('Card', { styles: { padding: '0', overflow: 'hidden', hoverEffect: 'lift', animation: 'fp-slide-up' } }, [image(photo('camera', 600, 400), 'Photography showcase', { height: '220px' }), el('Box', { styles: { padding: '16px' } }, [heading('Lumina Media Agency', 'h4'), text('High-resolution photo and video gallery', muted)])]),
        el('Card', { styles: { padding: '0', overflow: 'hidden', hoverEffect: 'lift', animation: 'fp-slide-up' } }, [image(photo('coding', 600, 400), 'Developer docs', { height: '220px' }), el('Box', { styles: { padding: '16px' } }, [heading('HyperAPI Developer Hub', 'h4'), text('API design documentation and mock console', muted)])]),
        el('Card', { styles: { padding: '0', overflow: 'hidden', hoverEffect: 'lift', animation: 'fp-slide-up' } }, [image(photo('meeting', 600, 400), 'Consultancy', { height: '220px' }), el('Box', { styles: { padding: '16px' } }, [heading('Stratton Advisory Group', 'h4'), text('Management consulting practice website', muted)])]),
      ]),
    ]),
  },

  // ===========================================================================
  // 11. FOOTER & SOCIAL LINKS
  // ===========================================================================
  {
    id: 'footer-mega-multi-col',
    title: 'Multi-Column Mega Footer with Social Links',
    category: 'Footer',
    element: section([
      el('Grid', { styles: { gridTemplateColumns: 'minmax(0, 2fr) repeat(3, minmax(0, 1fr))', gap: '40px' }, responsive: { tablet: { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }, mobile: { gridTemplateColumns: 'minmax(0, 1fr)' } } }, [
        el('Box', { styles: { gap: '12px' } }, [
          heading('FlowPilot', 'h3'),
          text('The modern visual builder for high-converting customer experiences.', muted),
          text('Built for high-growth modern businesses, digital products, and research advisory.', { fontSize: '0.875rem', ...muted }),
          el('Row', { styles: { gap: '8px', paddingTop: '8px' } }, [
            button('𝕏 Twitter', '#', 'link'),
            button('GitHub', '#', 'link'),
            button('LinkedIn', '#', 'link'),
            button('Discord', '#', 'link'),
          ]),
        ]),
        el('Box', { styles: { gap: '8px', alignItems: 'flex-start' } }, [
          heading('Product', 'h4'),
          button('Interactive Tours', '#', 'link'),
          button('Landing Pages', '#', 'link'),
          button('Template Library', '#', 'link'),
          button('AI Assistant Engine', '#', 'link'),
          button('Changelog', '#', 'link'),
        ]),
        el('Box', { styles: { gap: '8px', alignItems: 'flex-start' } }, [
          heading('Resources', 'h4'),
          button('Documentation', '#', 'link'),
          button('API Reference', '#', 'link'),
          button('Case Studies', '#', 'link'),
          button('Security & Compliance', '#', 'link'),
          button('Status Dashboard', '#', 'link'),
        ]),
        el('Box', { styles: { gap: '8px', alignItems: 'flex-start' } }, [
          heading('Contact & Legal', 'h4'),
          text('hello@flowpilot.dev'),
          text('+1 (555) 234-5678'),
          text('100 Montgomery St, Suite 1200, San Francisco, CA', { fontSize: '0.8125rem', ...muted }),
          button('Privacy Policy', '#', 'link'),
          button('Terms of Service', '#', 'link'),
        ]),
      ]),
      el('Row', { styles: { justifyContent: 'space-between', borderTop: '1px solid var(--fp-border)', paddingTop: '24px', marginTop: '16px' } }, [
        text('© FlowPilot. All rights reserved.', { fontSize: '0.8125rem', ...muted }),
        el('Badge', { props: { text: '● All Systems Operational', tone: 'success' } }),
      ]),
    ], { paddingTop: '64px', paddingBottom: '36px', background: 'var(--fp-surface)' }),
  },
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
