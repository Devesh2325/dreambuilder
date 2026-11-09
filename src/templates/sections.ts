import { DocNode } from '../core/schema';
import { cloneSubtree } from '../core/tree';
import { photo } from './assets';
import { buildContent, button, el, El, heading, image, section, text } from './dsl';

export interface LibrarySection {
  id: string;
  title: string;
  category: 'Hero' | 'Moving' | 'Features' | 'Social proof' | 'Pricing' | 'Call to action' | 'Content' | 'Contact' | 'Footer' | 'Layout';
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

const payPlan = (name: string, price: string, details: string): El =>
  el('Card', {}, [
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
