import { DEFAULT_TRIGGERS, ProjectSettings } from '../core/schema';
import { VariableDef } from '../core/variables';
import { photo } from './assets';
import { actionButton, button, el, El, experience, heading, image, TemplateDefinition, text } from './dsl';
import { field, listVar, longVar, make, textVar, urlVar } from './experiences';
import { THEME_CORAL, THEME_EMERALD, THEME_INDIGO, THEME_MIDNIGHT, THEME_MONO, THEME_TERRACOTTA } from './themes';

const TOP: ProjectSettings = { triggers: DEFAULT_TRIGGERS, position: 'top' };
const BOTTOM: ProjectSettings = { triggers: DEFAULT_TRIGGERS, position: 'bottom' };
const AFTER_DELAY: ProjectSettings = { triggers: { ...DEFAULT_TRIGGERS, delaySeconds: 3 } };
const ON_EXIT: ProjectSettings = { triggers: { ...DEFAULT_TRIGGERS, exitIntent: true } };

const page = (children: El[]) => experience(children, { background: 'transparent' });
const whiteLink = (label: string, href: string) =>
  el('Button', { props: { text: label, href, variant: 'link', action: 'link' }, styles: { color: '#ffffff', textDecoration: 'underline' } });

const simple = [
  make('banner', 'announcement', 'Announcement bar', 'Share news with a link.', ['news'], THEME_INDIGO, [
    textVar('message', 'Message', 'We just launched something new!', 'Message'),
    textVar('cta.label', 'Link text', 'Learn more', 'Message'),
    urlVar('cta.link', 'Link', 'https://example.com', 'Message'),
  ], [page([el('Banner', {}, [text('{{message}}'), whiteLink('{{cta.label}}', '{{cta.link}}')])])], { settings: TOP, category: 'Simple' }),

  make('banner', 'sale', 'Sale bar', 'Promote an offer with a code.', ['sale', 'promotion'], THEME_CORAL, [
    textVar('message', 'Offer', 'Summer sale: 20% off everything', 'Offer'),
    textVar('code', 'Discount code', 'SUMMER20', 'Offer'),
  ], [page([el('Banner', {}, [text('{{message}} with code {{code}}', { fontWeight: 600 })])])], { settings: TOP, category: 'Simple' }),

  make('banner', 'maintenance', 'Maintenance notice', 'Warn users about planned downtime.', ['notice', 'status'], THEME_MONO, [
    textVar('message', 'Notice', 'Scheduled maintenance on Saturday, 2am to 4am UTC.', 'Notice'),
  ], [page([el('Banner', {}, [text('{{message}}')])])], { settings: BOTTOM, category: 'Simple' }),
];

const gradient = (from: string, to: string) => `linear-gradient(100deg, ${from}, ${to})`;

const modernBar = (background: string, children: El[]): El =>
  el('Banner', { styles: { background, padding: '14px 48px 14px 24px', gap: '16px' } }, children);

const modern = [
  make('banner', 'gradient-launch', 'Gradient launch', 'A bold gradient bar with a clear button.', ['launch', 'gradient'], THEME_INDIGO, [
    textVar('badge', 'Label', 'New', 'Message'),
    textVar('message', 'Message', 'Reports 2.0 is here. See your numbers in real time.', 'Message'),
    textVar('cta.label', 'Button label', 'Try it now', 'Message'),
    urlVar('cta.link', 'Button link', 'https://example.com', 'Message'),
  ], [page([modernBar(gradient('#4f46e5', '#ec4899'), [
    text('{{badge}}', { background: 'rgba(255,255,255,.2)', padding: '2px 10px', borderRadius: '99px', fontSize: '.8125rem', fontWeight: 700 }),
    text('{{message}}', { fontWeight: 500 }),
    el('Button', { props: { text: '{{cta.label}}', href: '{{cta.link}}', variant: 'primary', action: 'link' }, styles: { background: '#ffffff', color: '#4f46e5', padding: '7px 16px' } }),
  ])])], { settings: TOP, category: 'Modern' }),

  make('banner', 'countdown-offer', 'Limited-time offer', 'Create urgency with an end date.', ['sale', 'urgency'], THEME_MIDNIGHT, [
    textVar('message', 'Offer', 'Black Friday: 40% off all plans', 'Offer'),
    textVar('ends', 'Ends', 'Ends Sunday at midnight', 'Offer'),
    textVar('cta.label', 'Button label', 'Claim offer', 'Offer'),
    urlVar('cta.link', 'Button link', 'https://example.com/pricing', 'Offer'),
  ], [page([modernBar('#0f172a', [
    text('{{message}}', { fontWeight: 700 }),
    text('{{ends}}', { color: '#fbbf24', fontSize: '.875rem' }),
    el('Button', { props: { text: '{{cta.label}}', href: '{{cta.link}}', variant: 'primary', action: 'link' }, styles: { background: '#fbbf24', color: '#0f172a', padding: '7px 16px' } }),
  ])])], { settings: TOP, category: 'Modern' }),

  make('banner', 'app-promo', 'App promotion', 'Invite visitors to get your app, with a picture.', ['mobile', 'app'], THEME_EMERALD, [
    { key: 'image', label: 'Image', type: 'image', default: photo('phone', 200, 200), group: 'Message' },
    textVar('message', 'Message', 'Take us with you. Get the mobile app.', 'Message'),
    textVar('cta.label', 'Button label', 'Download', 'Message'),
    urlVar('cta.link', 'Button link', 'https://example.com/app', 'Message'),
  ], [page([modernBar(gradient('#047857', '#0d9488'), [
    image('{{image}}', '', { width: '44px', height: '44px', borderRadius: '10px' }, 'image'),
    text('{{message}}', { fontWeight: 600 }),
    el('Button', { props: { text: '{{cta.label}}', href: '{{cta.link}}', variant: 'primary', action: 'link' }, styles: { background: '#ffffff', color: '#047857', padding: '7px 16px' } }),
  ])])], { settings: BOTTOM, category: 'Modern' }),
];

const popup = [
  make('banner', 'popup-newsletter', 'Newsletter popup', 'Grow your list with a simple offer.', ['email', 'leads'], THEME_INDIGO, [
    textVar('headline', 'Headline', 'Get our best tips', 'Text'),
    longVar('body', 'Text', 'One useful email a week. No spam.', 'Text'),
    textVar('thanks', 'Thank-you message', 'Thanks for subscribing!', 'Text'),
  ], [page([el('Popup', {}, [
    heading('{{headline}}', 'h3'),
    text('{{body}}', { color: 'var(--fp-muted)' }),
    el('Form', { props: { submitText: 'Subscribe', successMessage: '{{thanks}}' } }, [field('email', 'Email', 'email')]),
  ])])], { settings: AFTER_DELAY, category: 'Popup' }),

  make('banner', 'popup-discount', 'Discount popup', 'Show an offer before visitors leave.', ['sale', 'exit-intent'], THEME_CORAL, [
    textVar('headline', 'Headline', 'Wait! Take 10% off', 'Text'),
    textVar('code', 'Code', 'WELCOME10', 'Text'),
    textVar('cta.label', 'Button label', 'Shop now', 'Text'),
    urlVar('cta.link', 'Button link', 'https://example.com/shop', 'Text'),
  ], [page([el('Popup', { styles: { textAlign: 'center', alignItems: 'center' } }, [
    heading('{{headline}}', 'h2'),
    text('Use code {{code}} at checkout.', { color: 'var(--fp-muted)' }),
    button('{{cta.label}}', '{{cta.link}}'),
  ])])], { settings: ON_EXIT, category: 'Popup' }),

  make('banner', 'popup-feature', 'Feature announcement popup', 'Tell users about something new, with an image.', ['news', 'product'], THEME_EMERALD, [
    textVar('headline', 'Headline', 'Say hello to our new look', 'Text'),
    longVar('body', 'Text', "We've redesigned everything to help you work faster.", 'Text'),
    { key: 'image', label: 'Image', type: 'image', default: photo('dashboard', 900, 500), group: 'Text' },
    textVar('cta.label', 'Button label', 'Got it', 'Text'),
  ], [page([el('Popup', {}, [
    image('{{image}}', '', { height: '200px' }, 'image'),
    heading('{{headline}}', 'h3'),
    text('{{body}}', { color: 'var(--fp-muted)' }),
    actionButton('{{cta.label}}', 'close'),
  ])])], { settings: AFTER_DELAY, category: 'Popup' }),
];

const slideFields: VariableDef[] = [
  { key: 'title', label: 'Title', type: 'text', required: true },
  { key: 'text', label: 'Text', type: 'text' },
  { key: 'link', label: 'Link', type: 'url' },
];

const carousel = [
  make('banner', 'carousel-messages', 'Rotating messages', 'Several short messages take turns in one bar.', ['carousel', 'announcements'], THEME_INDIGO, [
    listVar('slides', 'Messages', [
      { title: 'Free shipping over $50', text: 'On every order', link: '' },
      { title: 'New arrivals are here', text: 'See what just landed', link: 'https://example.com/new' },
      { title: 'Join our rewards club', text: 'Earn points on each purchase', link: 'https://example.com/rewards' },
    ], slideFields, 'Messages'),
  ], [page([el('Carousel', { props: { interval: 4, showArrows: true }, styles: { background: 'var(--fp-primary)', color: '#ffffff' } }, [
    el('Slide', { repeat: { list: 'slides', as: 'slide' }, styles: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '10px 52px', flexWrap: 'wrap' } }, [
      text('{{slide.title}}', { fontWeight: 700 }),
      text('{{slide.text}}', {}, 'slide.text'),
      el('Button', { showIf: 'slide.link', props: { text: 'View', href: '{{slide.link}}', variant: 'link', action: 'link' }, styles: { color: '#ffffff', textDecoration: 'underline' } }),
    ]),
  ])])], { settings: TOP, category: 'Carousel' }),

  make('banner', 'carousel-promo', 'Promo carousel', 'Large slides with images, in the corner of the page.', ['carousel', 'promotion'], THEME_TERRACOTTA, [
    listVar('slides', 'Slides', [
      { title: 'Autumn collection', text: 'Warm tones for cooler days', image: photo('sofa', 800, 500), link: 'https://example.com/autumn' },
      { title: 'Handmade ceramics', text: 'Small batches, made to last', image: photo('ceramics', 800, 500), link: 'https://example.com/ceramics' },
      { title: 'Gifts under $50', text: 'Something for everyone', image: photo('mug', 800, 500), link: 'https://example.com/gifts' },
    ], [...slideFields.slice(0, 2), { key: 'image', label: 'Image', type: 'image' }, slideFields[2]], 'Slides'),
  ], [page([el('Popup', { props: { dismissible: true }, styles: { padding: '0', overflow: 'hidden', gap: '0' } }, [
    el('Carousel', { props: { interval: 5, showArrows: true } }, [
      el('Slide', { repeat: { list: 'slides', as: 'slide' }, styles: { gap: '10px', paddingBottom: '20px' } }, [
        image('{{slide.image}}', '{{slide.title}}', { height: '240px', borderRadius: '0' }, 'slide.image'),
        heading('{{slide.title}}', 'h3', { padding: '0 24px' }),
        text('{{slide.text}}', { padding: '0 24px', color: 'var(--fp-muted)' }, 'slide.text'),
        el('Button', { showIf: 'slide.link', props: { text: 'Shop now', href: '{{slide.link}}', variant: 'primary', action: 'link' }, styles: { margin: '0 24px', alignSelf: 'flex-start' } }),
      ]),
    ]),
  ])])], { settings: AFTER_DELAY, category: 'Carousel' }),
];

export const BANNER_TEMPLATES: TemplateDefinition[] = [...simple, ...modern, ...popup, ...carousel];
