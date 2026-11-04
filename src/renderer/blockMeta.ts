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
    defaultProps: { src: 'https://picsum.photos/seed/flowpilot/1200/800', alt: '' },
    fields: [{ key: 'src', label: 'Image', type: 'image' }, text('alt', 'Description (for screen readers)')],
  },
  Divider: { type: 'Divider', label: 'Divider', category: 'content', icon: 'Minus', defaultProps: {}, fields: [] },
  Spacer: {
    type: 'Spacer', label: 'Spacer', category: 'content', icon: 'MoveVertical',
    defaultProps: { height: 32 },
    fields: [{ key: 'height', label: 'Height (px)', type: 'number' }],
  },
  Navbar: {
    type: 'Navbar', label: 'Navigation', category: 'content', icon: 'Menu',
    defaultProps: { brand: 'Brand', showBrand: true, logo: '', links: [], ctaText: '', ctaHref: '#' },
    fields: [
      { key: 'links', label: 'Menu items', type: 'menu' },
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
    defaultProps: { selector: '', placement: 'bottom', fallback: 'center', spotlight: true },
    fields: [
      text('selector', 'Target element', 'CSS selector on your site. Use the picker to choose it visually.'),
      {
        key: 'placement', label: 'Position', type: 'select',
        options: ['top', 'bottom', 'left', 'right'].map((value) => ({ label: value, value })),
      },
      {
        key: 'fallback', label: 'If the target is missing', type: 'select',
        options: [
          { label: 'Show in the center', value: 'center' },
          { label: 'Skip this step', value: 'skip' },
        ],
      },
      { key: 'spotlight', label: 'Dim the rest of the page', type: 'boolean' },
    ],
  },

  DemoScreen: {
    type: 'DemoScreen', label: 'Demo screen', category: 'demo', icon: 'Monitor', isContainer: true, parentType: 'Root',
    defaultProps: { image: 'https://picsum.photos/seed/demo/1280/800', alt: 'Product screen' },
    fields: [{ key: 'image', label: 'Screenshot', type: 'image' }, text('alt', 'Description')],
  },
  DemoHotspot: {
    type: 'DemoHotspot', label: 'Hotspot', category: 'demo', icon: 'CircleDot', parentType: 'DemoScreen',
    defaultProps: { x: 50, y: 50, tip: 'Click here', goTo: '' },
    fields: [
      { key: 'x', label: 'Position across (%)', type: 'number' },
      { key: 'y', label: 'Position down (%)', type: 'number' },
      text('tip', 'Tip'),
      { key: 'goTo', label: 'Go to screen number', type: 'number', help: 'Leave empty for the next screen.' },
    ],
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
