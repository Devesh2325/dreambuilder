import { BlockField, BlockMeta } from './types';

const text = (key: string, label: string, help?: string): BlockField => ({ key, label, type: 'text', help });
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
  Section: { type: 'Section', label: 'Section', category: 'layout', icon: 'RectangleHorizontal', isContainer: true, defaultProps: {}, fields: [text('anchor', 'Anchor name', 'Lets links jump here with #name.')] },
  Container: { type: 'Container', label: 'Container', category: 'layout', icon: 'Square', isContainer: true, defaultProps: {}, fields: [] },
  Box: { type: 'Box', label: 'Box', category: 'layout', icon: 'Box', isContainer: true, defaultProps: {}, fields: [] },
  Card: { type: 'Card', label: 'Card', category: 'layout', icon: 'CreditCard', isContainer: true, defaultProps: {}, fields: [] },
  Grid: { type: 'Grid', label: 'Grid', category: 'layout', icon: 'LayoutGrid', isContainer: true, defaultProps: {}, fields: [] },
  Row: { type: 'Row', label: 'Row', category: 'layout', icon: 'Columns3', isContainer: true, defaultProps: {}, fields: [] },

  Heading: {
    type: 'Heading', label: 'Heading', category: 'content', icon: 'Heading',
    defaultProps: { text: 'Your heading', level: 'h2' },
    fields: [
      text('text', 'Text'),
      {
        key: 'level', label: 'Level', type: 'select',
        options: ['h1', 'h2', 'h3', 'h4'].map((value) => ({ label: value.toUpperCase(), value })),
      },
    ],
  },
  Text: {
    type: 'Text', label: 'Text', category: 'content', icon: 'Type',
    defaultProps: { text: 'Write something helpful here.' },
    fields: [longtext('text', 'Text')],
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
    defaultProps: { url: '', title: '' },
    fields: [
      { key: 'url', label: 'Video link', type: 'url', help: 'Paste a YouTube or Vimeo link, or a link to an MP4 file.' },
      text('title', 'Description (for screen readers)'),
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
      text('name', 'Field name', 'Identifies this answer in submissions and webhooks.'),
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
      text('name', 'Field name'),
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
      text('selector', 'Element to point at', 'Choose it with Pick on my site. Only tooltips use this.'),
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
