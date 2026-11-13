import { ICON_DATA } from './iconData';
import { BlockField, BlockMeta } from './types';

const text = (key: string, label: string, help?: string): BlockField => ({ key, label, type: 'text', help });
/** A technical name, typed by hand. Variables make no sense here. */
const name = (key: string, label: string, help: string): BlockField => ({ key, label, type: 'text', help, plain: true });
const longtext = (key: string, label: string): BlockField => ({ key, label, type: 'longtext' });
const url = (key: string, label: string): BlockField => ({ key, label, type: 'url' });

const BUTTON_ACTIONS = [
  { label: 'Open link', value: 'link' },
  { label: 'Next step', value: 'next' },
  { label: 'Previous step', value: 'prev' },
  { label: 'Close', value: 'close' },
];

// Kept apart from the renderers so the editor can list blocks without importing them.
export const BLOCK_META: Record<string, BlockMeta> = {
  Root: { type: 'Root', label: 'Page', category: 'layout', icon: 'LayoutTemplate', isContainer: true, defaultProps: {}, fields: [] },
  Section: { type: 'Section', label: 'Section', category: 'layout', icon: 'RectangleHorizontal', isContainer: true, defaultProps: {}, fields: [{ key: 'anchor', label: 'Jump link name (optional)', type: 'text', plain: true, slug: true, help: 'Most people can leave this empty. Give this section a one-word name, such as pricing. Then a menu item or button linking to #pricing scrolls here. Visitors never see the name.' }] },
  Container: { type: 'Container', label: 'Container', category: 'layout', icon: 'Square', isContainer: true, defaultProps: {}, fields: [] },
  Box: { type: 'Box', label: 'Box', category: 'layout', icon: 'Box', isContainer: true, defaultProps: {}, fields: [] },
  Card: { type: 'Card', label: 'Card', category: 'layout', icon: 'CreditCard', isContainer: true, defaultProps: {}, fields: [] },
  Grid: { type: 'Grid', label: 'Grid', category: 'layout', icon: 'LayoutGrid', isContainer: true, defaultProps: {}, fields: [] },
  Row: { type: 'Row', label: 'Row', category: 'layout', icon: 'Columns3', isContainer: true, defaultProps: {}, fields: [] },
  Rating: {
    type: 'Rating',
    label: 'Rating',
    category: 'layout',
    icon: 'Star',
    defaultProps: {
      value: 5,
      max: 5,
      min: 1,
      color: '#f59e0b',
      emptyColor: '#cbd5e1',
      size: 20,
      icon: 'star',
      showText: true,
      text: '5.0',
    },
    fields: [
      { key: 'value', label: 'Rating score (e.g. 5, 4.8)', type: 'number' },
      { key: 'max', label: 'Maximum rating', type: 'number' },
      { key: 'min', label: 'Minimum rating', type: 'number' },
      { key: 'color', label: 'Star / active color', type: 'text' },
      { key: 'emptyColor', label: 'Empty icon color', type: 'text' },
      { key: 'size', label: 'Icon size (px)', type: 'number' },
      {
        key: 'icon', label: 'Icon shape', type: 'select',
        options: [
          { label: 'Star (★)', value: 'star' },
          { label: 'Heart (♥)', value: 'heart' },
          { label: 'Thumb up (👍)', value: 'thumb' },
          { label: 'Circle (●)', value: 'circle' },
        ],
      },
      { key: 'showText', label: 'Show score text beside stars', type: 'boolean' },
      text('text', 'Score label (optional)', 'e.g. 4.9/5 or 5.0 · 1,200+ reviews'),
    ],
  },

  Heading: {
    type: 'Heading', label: 'Heading', category: 'content', icon: 'Heading',
    defaultProps: { text: 'Your heading', level: 'h2', autoMove: 'none' },
    fields: [
      text('text', 'Text'),
      {
        key: 'level', label: 'Level', type: 'select',
        options: ['h1', 'h2', 'h3', 'h4'].map((value) => ({ label: value.toUpperCase(), value })),
      },
      {
        key: 'autoMove', label: 'Auto-move text animation', type: 'select',
        options: [
          { label: 'None (static)', value: 'none' },
          { label: 'Continuous ticker scroll (auto-moving)', value: 'ticker' },
          { label: 'Rotating words (word cycler)', value: 'cycle' },
          { label: 'Typewriter effect', value: 'typewriter' },
          { label: 'Gradient shimmer loop', value: 'shimmer' },
        ],
      },
      text('cycleWords', 'Words to cycle (for rotating words)', 'Separate with commas, e.g. Fast, Simple, Scalable'),
    ],
  },
  Text: {
    type: 'Text', label: 'Text', category: 'content', icon: 'Type',
    defaultProps: { text: 'Write something helpful here.', autoMove: 'none' },
    fields: [
      longtext('text', 'Text'),
      {
        key: 'autoMove', label: 'Auto-move text animation', type: 'select',
        options: [
          { label: 'None (static)', value: 'none' },
          { label: 'Continuous ticker scroll (auto-moving)', value: 'ticker' },
          { label: 'Rotating words (word cycler)', value: 'cycle' },
          { label: 'Typewriter effect', value: 'typewriter' },
          { label: 'Gradient shimmer loop', value: 'shimmer' },
        ],
      },
      text('cycleWords', 'Words to cycle (for rotating words)', 'Separate with commas, e.g. Fast, Simple, Scalable'),
    ],
  },
  Button: {
    type: 'Button', label: 'Button', category: 'content', icon: 'MousePointerClick',
    defaultProps: { text: 'Click me', variant: 'primary', action: 'link', href: '#' },
    fields: [
      text('text', 'Label'),
      {
        key: 'variant', label: 'Style', type: 'select',
        options: [
          { label: 'Primary', value: 'primary' },
          { label: 'Secondary', value: 'secondary' },
          { label: 'Link', value: 'link' },
        ],
      },
      { key: 'action', label: 'When clicked', type: 'select', options: BUTTON_ACTIONS },
      url('href', 'Link'),
    ],
  },
  Image: {
    type: 'Image', label: 'Image', category: 'content', icon: 'Image',
    defaultProps: { src: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&h=800&q=75&auto=format&fit=crop', alt: '' },
    fields: [{ key: 'src', label: 'Image', type: 'image' }, text('alt', 'Description (for screen readers)')],
  },
  Video: {
    type: 'Video', label: 'Video', category: 'content', icon: 'Video',
    defaultProps: { url: '', title: '', controls: true, autoplay: false, loop: false, muted: false, aspectRatio: '16:9' },
    fields: [
      { key: 'url', label: 'Video source', type: 'video', help: 'Paste a YouTube or Vimeo link, or upload an MP4/WebM video file.' },
      text('title', 'Description (for screen readers)'),
      {
        key: 'aspectRatio', label: 'Aspect ratio', type: 'select',
        options: [
          { label: '16:9 (Widescreen)', value: '16:9' },
          { label: '4:3 (Standard)', value: '4:3' },
          { label: '1:1 (Square)', value: '1:1' },
          { label: '9:16 (Vertical/Mobile)', value: '9:16' },
        ],
      },
      { key: 'controls', label: 'Show video controls', type: 'boolean' },
      { key: 'autoplay', label: 'Autoplay video', type: 'boolean' },
      { key: 'loop', label: 'Loop video playback', type: 'boolean' },
      { key: 'muted', label: 'Mute audio', type: 'boolean' },
    ],
  },
  PaymentButton: {
    type: 'PaymentButton', label: 'Pay button', category: 'content', icon: 'CreditCard',
    defaultProps: { text: 'Buy now', price: '', provider: 'stripe', url: '' },
    fields: [
      text('text', 'Button label'),
      text('price', 'Price shown beside it', 'Optional. For example: $19, or $19 a month.'),
      {
        key: 'provider', label: 'Who takes the payment', type: 'select',
        options: [
          { label: 'Stripe', value: 'stripe' },
          { label: 'Razorpay', value: 'razorpay' },
          { label: 'PayPal', value: 'paypal' },
          { label: 'Another provider', value: 'other' },
        ],
      },
      { key: 'url', label: 'Payment link', type: 'url', help: 'The link your payment provider gives you. It must start with https://.', plain: true },
    ],
  },
  ProjectEmbed: {
    type: 'ProjectEmbed', label: 'Your project', category: 'content', icon: 'Blocks',
    defaultProps: { projectId: '' },
    fields: [{ key: 'projectId', label: 'Which project', type: 'project', help: 'Shows one of your forms, demos, banners, FAQs, menus or tours in this page. Publish it too, or visitors will not see it.' }],
  },
  Avatar: {
    type: 'Avatar', label: 'Avatar', category: 'content', icon: 'CircleUser',
    defaultProps: { src: '', name: 'Alex Morgan', subtitle: 'Author', size: 'medium', showText: true },
    fields: [
      { key: 'src', label: 'Photo', type: 'image', help: 'Optional. Without one, it shows their initials.' },
      text('name', 'Name'),
      text('subtitle', 'Line under the name', 'Such as a job title, or the date of an article.'),
      { key: 'size', label: 'Size', type: 'select', options: [{ label: 'Small', value: 'small' }, { label: 'Medium', value: 'medium' }, { label: 'Large', value: 'large' }] },
      { key: 'showText', label: 'Show the name beside the photo', type: 'boolean' },
    ],
  },
  Icon: {
    type: 'Icon', label: 'Icon', category: 'content', icon: 'Star',
    defaultProps: { icon: 'star', size: 32, label: '' },
    fields: [
      { key: 'icon', label: 'Icon', type: 'icon', options: Object.entries(ICON_DATA).map(([value, item]) => ({ value, label: item.label })) },
      { key: 'size', label: 'Size (px)', type: 'number' },
      text('label', 'Description (for screen readers)', 'Leave empty when the icon is only decoration.'),
    ],
  },
  List: {
    type: 'List', label: 'List', category: 'content', icon: 'List',
    defaultProps: { items: 'First point\nSecond point\nThird point', style: 'bullet' },
    fields: [
      { key: 'items', label: 'Items, one per line', type: 'longtext' },
      { key: 'style', label: 'Style', type: 'select', options: [{ label: 'Bullets', value: 'bullet' }, { label: 'Numbers', value: 'number' }, { label: 'Ticks', value: 'check' }] },
    ],
  },
  Quote: {
    type: 'Quote', label: 'Quote', category: 'content', icon: 'Quote',
    defaultProps: { text: 'A quote that stands out from the rest of the page.', cite: '' },
    fields: [longtext('text', 'Quote'), text('cite', 'Who said it', 'Optional.')],
  },
  CodeBlock: {
    type: 'CodeBlock', label: 'Code', category: 'content', icon: 'Code',
    defaultProps: { code: 'npm install your-package', language: '' },
    fields: [longtext('code', 'Code'), text('language', 'Label', 'Optional, such as JavaScript or Terminal.')],
  },
  Callout: {
    type: 'Callout', label: 'Callout', category: 'content', icon: 'Info',
    defaultProps: { tone: 'info', title: 'Good to know', text: 'Use a callout for a tip, a warning or an important note.' },
    fields: [
      { key: 'tone', label: 'Kind', type: 'select', options: [{ label: 'Note', value: 'info' }, { label: 'Tip', value: 'success' }, { label: 'Warning', value: 'warning' }, { label: 'Danger', value: 'danger' }] },
      text('title', 'Title', 'Optional.'),
      longtext('text', 'Text'),
    ],
  },
  Table: {
    type: 'Table', label: 'Table', category: 'content', icon: 'Table',
    defaultProps: { rows: 'Plan | Price | Support\nStarter | $19 | Email\nPro | $49 | Phone and email', header: true },
    fields: [
      { key: 'rows', label: 'Rows', type: 'longtext', help: 'One row per line. Separate cells with a | sign.' },
      { key: 'header', label: 'First row is the heading', type: 'boolean' },
    ],
  },
  Badge: {
    type: 'Badge', label: 'Badge', category: 'content', icon: 'Tag',
    defaultProps: { text: 'New', tone: 'primary' },
    fields: [
      text('text', 'Text'),
      { key: 'tone', label: 'Color', type: 'select', options: [{ label: 'Main color', value: 'primary' }, { label: 'Gray', value: 'neutral' }, { label: 'Green', value: 'success' }, { label: 'Amber', value: 'warning' }] },
    ],
  },
  Divider: { type: 'Divider', label: 'Divider', category: 'content', icon: 'Minus', defaultProps: {}, fields: [] },
  Spacer: {
    type: 'Spacer', label: 'Spacer', category: 'content', icon: 'MoveVertical',
    defaultProps: { height: 32 },
    fields: [{ key: 'height', label: 'Height (px)', type: 'number' }],
  },
  Navbar: {
    type: 'Navbar', label: 'Navigation', category: 'content', icon: 'Menu',
    defaultProps: { brand: 'Brand', showBrand: true, logo: '', links: [], align: 'right', sticky: false, ctaText: '', ctaHref: '#' },
    fields: [
      { key: 'links', label: 'Menu items', type: 'menu' },
      {
        key: 'align', label: 'Menu position', type: 'select',
        options: [
          { label: 'Right', value: 'right' },
          { label: 'Center', value: 'center' },
          { label: 'Left, next to the logo', value: 'left' },
        ],
      },
      { key: 'sticky', label: 'Stay at the top while scrolling', type: 'boolean' },
      text('brand', 'Brand name'),
      { key: 'showBrand', label: 'Show the brand name', type: 'boolean' },
      { key: 'logo', label: 'Logo', type: 'image' },
      text('ctaText', 'Button label'),
      url('ctaHref', 'Button link'),
    ],
  },
  Accordion: {
    type: 'Accordion', label: 'Question', category: 'interactive', icon: 'ChevronsUpDown',
    defaultProps: { question: 'Your question?', answer: 'The answer.' },
    fields: [text('question', 'Question'), longtext('answer', 'Answer')],
  },

  Form: {
    type: 'Form', label: 'Form', category: 'form', icon: 'ClipboardList', isContainer: true,
    defaultProps: { submitText: 'Submit', successMessage: 'Thanks! We received your response.' },
    fields: [text('submitText', 'Submit label'), longtext('successMessage', 'Message after submitting')],
  },
  FormStep: {
    type: 'FormStep', label: 'Form step', category: 'form', icon: 'ListOrdered', isContainer: true, parentType: 'Form',
    defaultProps: { title: 'Step' },
    fields: [text('title', 'Title')],
  },
  FormField: {
    type: 'FormField', label: 'Form field', category: 'form', icon: 'TextCursorInput',
    defaultProps: { name: 'field', label: 'Label', inputType: 'text', required: false, placeholder: '', optionsText: '' },
    fields: [
      text('label', 'Label'),
      name('name', 'Column name for answers', 'A short name for this answer in your responses and exports. Use one word, such as email.'),
      {
        key: 'inputType', label: 'Type', type: 'select',
        options: ['text', 'email', 'tel', 'number', 'url', 'date', 'textarea', 'select', 'radio', 'checkbox']
          .map((value) => ({ label: value, value })),
      },
      { key: 'required', label: 'Required', type: 'boolean' },
      text('placeholder', 'Placeholder'),
      { key: 'optionsText', label: 'Options (one per line)', type: 'longtext' },
    ],
  },
  ScaleField: {
    type: 'ScaleField', label: 'Rating scale', category: 'form', icon: 'Gauge',
    defaultProps: { name: 'score', label: 'How likely are you to recommend us?', min: 0, max: 10, required: true },
    fields: [
      text('label', 'Question'),
      name('name', 'Column name for answers', 'A short name for this answer in your responses and exports. Use one word, such as score.'),
      { key: 'min', label: 'Lowest', type: 'number' },
      { key: 'max', label: 'Highest', type: 'number' },
      { key: 'required', label: 'Required', type: 'boolean' },
    ],
  },

  TourStep: {
    type: 'TourStep', label: 'Tour step', category: 'tour', icon: 'Footprints', isContainer: true, parentType: 'Root',
    defaultProps: { selector: '', layout: 'tooltip', size: 'medium', placement: 'bottom', align: 'center', fallback: 'center', spotlight: true, advance: 'button' },
    fields: [
      {
        key: 'layout', label: 'Layout', type: 'select',
        options: [
          { label: 'Tooltip next to an element', value: 'tooltip' },
          { label: 'Pop-up in the center', value: 'modal' },
          { label: 'Slide-out in the corner', value: 'slideout' },
          { label: 'Side panel, for longer guides', value: 'sidebar' },
        ],
      },
      name('selector', 'Element to point at', 'Choose it with Pick on my site. Only tooltips use this.'),
      { key: 'placement', label: 'Position and arrow', type: 'placement' },
      {
        key: 'size', label: 'Size', type: 'select',
        options: [
          { label: 'Small', value: 'small' },
          { label: 'Medium', value: 'medium' },
          { label: 'Large', value: 'large' },
          { label: 'Extra large, for video', value: 'xlarge' },
        ],
      },
      {
        key: 'advance', label: 'Moves on when', type: 'select',
        options: [
          { label: 'They click a button in this step', value: 'button' },
          { label: 'They click the element itself', value: 'target' },
        ],
      },
      { key: 'spotlight', label: 'Dim the rest of the page', type: 'boolean' },
      { key: 'allowInteraction', label: 'Let them use the page during this step', type: 'boolean' },
      text('path', 'Page this step is on', 'Optional. A path such as /reports. The tour goes there first.'),
      {
        key: 'fallback', label: 'If the element is missing', type: 'select',
        options: [
          { label: 'Show in the center', value: 'center' },
          { label: 'Skip this step', value: 'skip' },
        ],
      },
    ],
  },

  DemoScreen: {
    type: 'DemoScreen', label: 'Demo screen', category: 'demo', icon: 'Monitor', isContainer: true, parentType: 'Root',
    defaultProps: { image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1280&h=800&q=75&auto=format&fit=crop', alt: 'Product screen' },
    fields: [{ key: 'image', label: 'Screenshot', type: 'image' }, text('alt', 'Description')],
  },
  DemoHotspot: {
    type: 'DemoHotspot', label: 'Tooltip', category: 'demo', icon: 'CircleDot', parentType: 'DemoScreen',
    defaultProps: { x: 50, y: 50, title: '', tip: 'Click here', placement: 'bottom', align: 'center', showBeacon: true, buttonText: '', goTo: '' },
    fields: [
      text('title', 'Title'),
      longtext('tip', 'Text'),
      { key: 'placement', label: 'Position and arrow', type: 'placement' },
      { key: 'showBeacon', label: 'Show the pulsing dot', type: 'boolean' },
      text('buttonText', 'Button label', 'Optional. People can also click the dot.'),
      { key: 'goTo', label: 'Go to screen number', type: 'number', help: 'Leave empty for the next screen.' },
      { key: 'x', label: 'Across (%)', type: 'number', help: 'Or drag it on the screen.' },
      { key: 'y', label: 'Down (%)', type: 'number' },
    ],
  },

  Marquee: {
    type: 'Marquee', label: 'Scrolling strip', category: 'interactive', icon: 'GalleryHorizontal', isContainer: true,
    defaultProps: { speed: 30, reverse: false },
    fields: [
      { key: 'speed', label: 'Seconds for one full loop', type: 'number', help: 'A bigger number scrolls more slowly.' },
      { key: 'reverse', label: 'Scroll the other way', type: 'boolean' },
    ],
  },
  Carousel: {
    type: 'Carousel', label: 'Carousel', category: 'interactive', icon: 'GalleryHorizontal', isContainer: true,
    defaultProps: { interval: 5, showArrows: true },
    fields: [
      { key: 'interval', label: 'Seconds per slide (0 to turn off)', type: 'number' },
      { key: 'showArrows', label: 'Show arrows', type: 'boolean' },
    ],
  },
  Slide: {
    type: 'Slide', label: 'Slide', category: 'interactive', icon: 'RectangleHorizontal', isContainer: true, parentType: 'Carousel',
    defaultProps: {}, fields: [],
  },
  Banner: {
    type: 'Banner', label: 'Banner', category: 'interactive', icon: 'Megaphone', isContainer: true,
    defaultProps: { dismissible: true },
    fields: [{ key: 'dismissible', label: 'Can be closed', type: 'boolean' }],
  },
  Popup: {
    type: 'Popup', label: 'Popup', category: 'interactive', icon: 'AppWindow', isContainer: true,
    defaultProps: { dismissible: true },
    fields: [{ key: 'dismissible', label: 'Can be closed', type: 'boolean' }],
  },
};

export function canContain(parentType: string, childType: string): boolean {
  const parent = BLOCK_META[parentType];
  const child = BLOCK_META[childType];
  if (!parent?.isContainer || !child) return false;
  return !child.parentType || child.parentType === parentType;
}
