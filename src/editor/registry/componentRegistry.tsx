import React from 'react';
import { ComponentDefinition } from '../../types/components';
import { ComponentNode } from '../../types/document';
import * as LucideIcons from 'lucide-react';

// Safe Lucide icon resolver
export const DynamicIcon: React.FC<{ name: string; className?: string }> = ({ name, className = 'w-5 h-5' }) => {
  // @ts-ignore
  const IconComponent = (LucideIcons as any)[name] || LucideIcons.Sparkles;
  return <IconComponent className={className} />;
};

// -------------------------------------------------------------
// Component Renderers
// -------------------------------------------------------------

// 1. Heading
const HeadingRenderer: React.FC<{ node: ComponentNode; isEditing?: boolean }> = ({ node }) => {
  const { text = 'Heading Text', level = 'h2' } = node.props;
  if (level === 'h1') return <h1 style={{ margin: 0 }}>{text}</h1>;
  if (level === 'h3') return <h3 style={{ margin: 0 }}>{text}</h3>;
  if (level === 'h4') return <h4 style={{ margin: 0 }}>{text}</h4>;
  return <h2 style={{ margin: 0 }}>{text}</h2>;
};

// 2. Paragraph / Text
const ParagraphRenderer: React.FC<{ node: ComponentNode }> = ({ node }) => {
  const { text = 'Click to customize your paragraph copy.' } = node.props;
  return <p style={{ margin: 0 }}>{text}</p>;
};

// 3. Button
const ButtonRenderer: React.FC<{ node: ComponentNode }> = ({ node }) => {
  const { text = 'Click Me', icon, variant = 'primary' } = node.props;
  return (
    <div className="inline-flex items-center justify-center gap-2 font-medium">
      {icon && <DynamicIcon name={icon} className="w-4 h-4" />}
      <span>{text}</span>
    </div>
  );
};

// 4. Badge
const BadgeRenderer: React.FC<{ node: ComponentNode }> = ({ node }) => {
  const { text = 'New Feature', icon } = node.props;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full">
      {icon && <DynamicIcon name={icon} className="w-3.5 h-3.5" />}
      {text}
    </span>
  );
};

// 5. Image
const ImageRenderer: React.FC<{ node: ComponentNode }> = ({ node }) => {
  const { src = 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80', alt = 'Experience image' } = node.props;
  return (
    <img 
      src={src} 
      alt={alt} 
      className="w-full h-full object-cover rounded-[inherit] pointer-events-none select-none" 
    />
  );
};

// 6. Divider
const DividerRenderer: React.FC<{ node: ComponentNode }> = ({ node }) => {
  return <hr className="w-full border-t border-slate-200 my-2" />;
};

// 7. Spacer
const SpacerRenderer: React.FC<{ node: ComponentNode }> = ({ node }) => {
  const { height = 24 } = node.props;
  return <div style={{ height: `${height}px`, width: '100%' }} />;
};

// 8. Container / Section / Flex
const ContainerRenderer: React.FC<{ node: ComponentNode; children?: React.ReactNode }> = ({ children }) => {
  return <div className="w-full min-h-[40px]">{children}</div>;
};

// 9. TourStep Renderer (for visual tour steps)
const TourStepRenderer: React.FC<{ node: ComponentNode }> = ({ node }) => {
  const { 
    stepNumber = 1, 
    title = 'Welcome Step', 
    description = 'Highlight key product workflows and guide your customer to success.',
    nextButtonText = 'Next Step →',
    prevButtonText = 'Back',
    skipButtonText = 'Skip',
  } = node.props;

  return (
    <div className="relative font-sans text-left">
      <div className="flex items-center justify-between mb-2 pb-1 border-b border-slate-100">
        <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
          Step {stepNumber}
        </span>
        <span className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer">✕</span>
      </div>
      <h3 className="text-base font-bold text-slate-900 mb-1">{title}</h3>
      <p className="text-sm text-slate-600 leading-relaxed mb-4">{description}</p>
      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <button type="button" className="text-xs font-medium text-slate-400 hover:text-slate-600">
          {skipButtonText}
        </button>
        <div className="flex items-center gap-2">
          {prevButtonText && (
            <button type="button" className="px-2.5 py-1 text-xs font-medium text-slate-600 bg-slate-100 rounded hover:bg-slate-200">
              {prevButtonText}
            </button>
          )}
          <button type="button" className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded hover:bg-indigo-700 shadow-sm">
            {nextButtonText}
          </button>
        </div>
      </div>
    </div>
  );
};

// 10. DemoHotspot Renderer (interactive hotspot pulsing marker)
const DemoHotspotRenderer: React.FC<{ node: ComponentNode }> = ({ node }) => {
  const { tooltipTitle = 'Interactive Hotspot', tooltipText = 'Click to advance' } = node.props;
  return (
    <div className="relative group cursor-pointer">
      <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-indigo-600 text-white shadow-lg animate-pulse">
        <span className="w-3 h-3 bg-white rounded-full"></span>
      </div>
      <div className="absolute top-10 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col bg-slate-900 text-white text-xs p-2.5 rounded-lg shadow-xl w-48 z-30 pointer-events-none">
        <strong className="font-semibold text-white mb-0.5">{tooltipTitle}</strong>
        <span className="text-slate-300">{tooltipText}</span>
      </div>
    </div>
  );
};

// 11. BannerWidget Renderer
const BannerWidgetRenderer: React.FC<{ node: ComponentNode }> = ({ node }) => {
  const { 
    badgeText = 'NEW', 
    message = 'Experience our powerful new visual builder updates!',
    ctaText = 'Learn more →',
    isDismissible = true 
  } = node.props;

  return (
    <div className="flex items-center justify-between gap-4 text-sm font-medium w-full">
      <div className="flex items-center gap-3">
        {badgeText && (
          <span className="bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
            {badgeText}
          </span>
        )}
        <span>{message}</span>
      </div>
      <div className="flex items-center gap-3">
        {ctaText && (
          <button type="button" className="underline font-semibold hover:opacity-90">
            {ctaText}
          </button>
        )}
        {isDismissible && <span className="opacity-70 hover:opacity-100 cursor-pointer">✕</span>}
      </div>
    </div>
  );
};

// 12. MenuWidget Renderer
const MenuWidgetRenderer: React.FC<{ node: ComponentNode }> = ({ node }) => {
  const { logoText = 'FlowPilot App', items = [], ctaText = 'Get Started' } = node.props;
  return (
    <nav className="flex items-center justify-between w-full">
      <div className="flex items-center gap-8">
        <span className="font-black text-lg tracking-tight text-slate-900 flex items-center gap-2">
          <span className="w-6 h-6 rounded bg-indigo-600 text-white flex items-center justify-center text-xs">F</span>
          {logoText}
        </span>
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          {(items || []).map((item: any, idx: number) => (
            <span key={idx} className="hover:text-indigo-600 cursor-pointer">
              {typeof item === 'string' ? item : item.label}
            </span>
          ))}
        </div>
      </div>
      {ctaText && (
        <button type="button" className="px-4 py-1.5 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm">
          {ctaText}
        </button>
      )}
    </nav>
  );
};

// 13. FaqWidget Renderer
const FaqWidgetRenderer: React.FC<{ node: ComponentNode }> = ({ node }) => {
  const { title = 'Frequently Asked Questions', subtitle = '', items = [] } = node.props;
  const [openIndex, setOpenIndex] = React.useState<number | null>(0);

  return (
    <div className="w-full text-left">
      <h2 className="text-2xl font-bold text-slate-900 mb-2">{title}</h2>
      {subtitle && <p className="text-sm text-slate-500 mb-6">{subtitle}</p>}
      <div className="divide-y divide-slate-200 border-y border-slate-200">
        {(items || []).map((item: any, idx: number) => {
          const isOpen = openIndex === idx;
          return (
            <div key={idx} className="py-4">
              <button 
                type="button" 
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="w-full flex items-center justify-between text-left font-semibold text-slate-900 hover:text-indigo-600"
              >
                <span>{item.q}</span>
                <span className="text-slate-400 font-mono text-lg">{isOpen ? '−' : '+'}</span>
              </button>
              {isOpen && (
                <p className="mt-2 text-sm text-slate-600 leading-relaxed pr-6">
                  {item.a}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// 14. PopupWidget Renderer
const PopupWidgetRenderer: React.FC<{ node: ComponentNode }> = ({ node }) => {
  const { 
    headline = 'Special Offer Just for You!', 
    bodyText = 'Upgrade now to get instant access to all features.',
    ctaText = 'Claim Deal Now',
    cancelText = 'No thanks',
    icon = 'Sparkles'
  } = node.props;

  return (
    <div className="text-center">
      <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <DynamicIcon name={icon} className="w-6 h-6" />
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-2">{headline}</h3>
      <p className="text-sm text-slate-600 mb-6 leading-relaxed">{bodyText}</p>
      <div className="flex flex-col gap-2">
        <button type="button" className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-sm">
          {ctaText}
        </button>
        {cancelText && (
          <button type="button" className="text-xs text-slate-400 hover:text-slate-600 py-1">
            {cancelText}
          </button>
        )}
      </div>
    </div>
  );
};

// 15. ChecklistWidget Renderer
const ChecklistWidgetRenderer: React.FC<{ node: ComponentNode }> = ({ node }) => {
  const { title = 'Your Onboarding Checklist', tasks = [], rewardMessage } = node.props;
  const [taskList, setTaskList] = React.useState(tasks);

  const toggleTask = (id: string) => {
    setTaskList((prev: any[]) =>
      prev.map((t: any) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const completedCount = (taskList || []).filter((t: any) => t.completed).length;
  const progressPercent = taskList.length ? Math.round((completedCount / taskList.length) * 100) : 0;

  return (
    <div className="text-left font-sans">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-bold text-slate-900 text-sm">{title}</h4>
        <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
          {progressPercent}%
        </span>
      </div>
      {/* Progress Bar */}
      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-4">
        <div 
          className="bg-emerald-500 h-full transition-all duration-300 rounded-full" 
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      <div className="space-y-2">
        {(taskList || []).map((task: any) => (
          <div 
            key={task.id} 
            onClick={() => toggleTask(task.id)}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
          >
            <input 
              type="checkbox" 
              checked={task.completed} 
              readOnly 
              className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer" 
            />
            <span className={`text-xs ${task.completed ? 'line-through text-slate-400 font-normal' : 'text-slate-700 font-medium'}`}>
              {task.title}
            </span>
          </div>
        ))}
      </div>
      {progressPercent === 100 && rewardMessage && (
        <div className="mt-3 p-2 bg-emerald-50 text-emerald-800 text-xs rounded-lg font-medium text-center">
          {rewardMessage}
        </div>
      )}
    </div>
  );
};

// 16. SurveyWidget Renderer
const SurveyWidgetRenderer: React.FC<{ node: ComponentNode }> = ({ node }) => {
  const { question = 'How likely are you to recommend us?', submitButtonText = 'Send Feedback', thankYouTitle } = node.props;
  const [selectedScore, setSelectedScore] = React.useState<number | null>(null);
  const [submitted, setSubmitted] = React.useState(false);

  if (submitted) {
    return (
      <div className="text-center py-4">
        <h4 className="font-bold text-slate-900 text-base mb-1">{thankYouTitle || 'Thank you!'}</h4>
        <p className="text-xs text-slate-500">Your feedback has been recorded.</p>
      </div>
    );
  }

  return (
    <div className="text-left font-sans">
      <h4 className="font-bold text-slate-900 text-sm mb-3">{question}</h4>
      <div className="flex items-center justify-between gap-1 mb-4">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(val => (
          <button
            key={val}
            type="button"
            onClick={() => setSelectedScore(val)}
            className={`w-7 h-8 text-xs font-semibold rounded transition-colors ${
              selectedScore === val 
                ? 'bg-indigo-600 text-white' 
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {val}
          </button>
        ))}
      </div>
      <div className="flex items-center justify-between text-[10px] text-slate-400 mb-4 px-1">
        <span>Not likely at all</span>
        <span>Extremely likely</span>
      </div>
      <button
        type="button"
        disabled={selectedScore === null}
        onClick={() => setSubmitted(true)}
        className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-semibold rounded-lg shadow-sm"
      >
        {submitButtonText}
      </button>
    </div>
  );
};

// 17. HeroSection Renderer
const HeroSectionRenderer: React.FC<{ node: ComponentNode }> = ({ node }) => {
  const { badge, headline, subheadline, primaryCtaText, secondaryCtaText } = node.props;
  return (
    <div className="max-w-4xl mx-auto px-4 text-center">
      {badge && (
        <span className="inline-block px-3 py-1 mb-4 text-xs font-bold tracking-wide text-indigo-700 bg-indigo-100 rounded-full">
          {badge}
        </span>
      )}
      <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4 leading-tight">
        {headline || 'Build Experiences Without Limits'}
      </h1>
      <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-8 leading-relaxed">
        {subheadline || 'Visually design, publish, and track tours, banners, and workflows in minutes.'}
      </p>
      <div className="flex items-center justify-center gap-4">
        {primaryCtaText && (
          <button type="button" className="px-6 py-3 font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-md">
            {primaryCtaText}
          </button>
        )}
        {secondaryCtaText && (
          <button type="button" className="px-6 py-3 font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-sm">
            {secondaryCtaText}
          </button>
        )}
      </div>
    </div>
  );
};

// 18. FeaturesSection Renderer
const FeaturesSectionRenderer: React.FC<{ node: ComponentNode }> = ({ node }) => {
  const { title = 'Powerful Capabilities', subtitle = '' } = node.props;
  const features = [
    { icon: 'Compass', title: 'Zero-Code Product Tours', desc: 'Point and click to highlight critical app controls and drive activation.' },
    { icon: 'Sparkles', title: 'AI Assistant Included', desc: 'Generate complete pages or refine styles with natural language prompts.' },
    { icon: 'BarChart3', title: 'Actionable Analytics', desc: 'Monitor step-by-step drop-off and conversion rates in real-time.' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 text-center">
      <h2 className="text-3xl font-bold text-slate-900 mb-2">{title}</h2>
      {subtitle && <p className="text-slate-600 mb-10">{subtitle}</p>}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-6">
        {features.map((f, i) => (
          <div key={i} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-left">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
              <DynamicIcon name={f.icon} className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 mb-1">{f.title}</h3>
            <p className="text-sm text-slate-600">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// 19. CtaSection Renderer
const CtaSectionRenderer: React.FC<{ node: ComponentNode }> = ({ node }) => {
  const { headline = 'Get Started Today', subheadline = '', buttonText = 'Start Free' } = node.props;
  return (
    <div className="max-w-3xl mx-auto px-4 text-center">
      <h2 className="text-3xl font-bold mb-3">{headline}</h2>
      {subheadline && <p className="opacity-80 mb-6 text-sm md:text-base">{subheadline}</p>}
      <button type="button" className="px-6 py-3 bg-white text-indigo-900 font-bold rounded-xl hover:bg-slate-100 shadow-md">
        {buttonText}
      </button>
    </div>
  );
};

// -------------------------------------------------------------
// Component Registry Export
// -------------------------------------------------------------

export const COMPONENT_REGISTRY: Record<string, ComponentDefinition> = {
  // Basic
  Heading: {
    type: 'Heading',
    displayName: 'Heading',
    category: 'basic',
    icon: 'Heading',
    description: 'Section headline or page title',
    defaultProps: { text: 'Headline Text', level: 'h2' },
    defaultStyles: { fontSize: '24px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' },
    propertyFields: [
      { key: 'text', label: 'Text Content', type: 'text', category: 'content' },
      { key: 'level', label: 'Heading Level', type: 'select', options: [{ label: 'H1', value: 'h1' }, { label: 'H2', value: 'h2' }, { label: 'H3', value: 'h3' }, { label: 'H4', value: 'h4' }], category: 'content' },
    ],
    render: HeadingRenderer,
  },
  Paragraph: {
    type: 'Paragraph',
    displayName: 'Paragraph',
    category: 'basic',
    icon: 'AlignLeft',
    description: 'Body text and descriptive copy',
    defaultProps: { text: 'Add your message, description, or instructions here.' },
    defaultStyles: { fontSize: '15px', color: '#475569', lineHeight: '1.6', marginBottom: '12px' },
    propertyFields: [
      { key: 'text', label: 'Body Text', type: 'textarea', category: 'content' },
    ],
    render: ParagraphRenderer,
  },
  Button: {
    type: 'Button',
    displayName: 'Button',
    category: 'basic',
    icon: 'MousePointerClick',
    description: 'Clickable call-to-action button',
    defaultProps: { text: 'Take Action', icon: 'ArrowRight' },
    defaultStyles: { 
      backgroundColor: '#6366f1', 
      color: '#ffffff', 
      paddingTop: '10px', 
      paddingBottom: '10px', 
      paddingLeft: '20px', 
      paddingRight: '20px', 
      borderRadius: '8px', 
      cursor: 'pointer',
      display: 'inline-flex'
    },
    propertyFields: [
      { key: 'text', label: 'Button Label', type: 'text', category: 'content' },
      { key: 'icon', label: 'Icon Name', type: 'text', category: 'content' },
    ],
    render: ButtonRenderer,
  },
  Badge: {
    type: 'Badge',
    displayName: 'Badge',
    category: 'basic',
    icon: 'Tag',
    description: 'Small status or feature indicator',
    defaultProps: { text: 'Beta', icon: 'Sparkles' },
    defaultStyles: { backgroundColor: '#ede9fe', color: '#6d28d9', display: 'inline-block' },
    propertyFields: [
      { key: 'text', label: 'Badge Text', type: 'text', category: 'content' },
      { key: 'icon', label: 'Icon Name', type: 'text', category: 'content' },
    ],
    render: BadgeRenderer,
  },
  Image: {
    type: 'Image',
    displayName: 'Image',
    category: 'basic',
    icon: 'Image',
    description: 'Responsive picture or graphic',
    defaultProps: { src: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80', alt: 'Feature image' },
    defaultStyles: { width: '100%', height: 'auto', borderRadius: '8px' },
    propertyFields: [
      { key: 'src', label: 'Image URL', type: 'text', category: 'content' },
      { key: 'alt', label: 'Alt Description', type: 'text', category: 'content' },
    ],
    render: ImageRenderer,
  },
  Divider: {
    type: 'Divider',
    displayName: 'Divider',
    category: 'basic',
    icon: 'Minus',
    description: 'Horizontal separator line',
    defaultProps: {},
    defaultStyles: { width: '100%', marginTop: '8px', marginBottom: '8px' },
    propertyFields: [],
    render: DividerRenderer,
  },
  Spacer: {
    type: 'Spacer',
    displayName: 'Spacer',
    category: 'basic',
    icon: 'MoveVertical',
    description: 'Vertical spacing control',
    defaultProps: { height: 24 },
    defaultStyles: { width: '100%' },
    propertyFields: [
      { key: 'height', label: 'Height (px)', type: 'number', category: 'styling' },
    ],
    render: SpacerRenderer,
  },

  // Layout Containers
  Container: {
    type: 'Container',
    displayName: 'Container',
    category: 'layout',
    icon: 'Box',
    description: 'General wrapper layout box',
    isContainer: true,
    defaultProps: {},
    defaultStyles: { width: '100%', paddingLeft: '16px', paddingRight: '16px', paddingTop: '16px', paddingBottom: '16px' },
    propertyFields: [],
    render: ContainerRenderer,
  },
  Grid: {
    type: 'Grid',
    displayName: 'Grid Layout',
    category: 'layout',
    icon: 'Grid',
    description: 'Multi-column grid system',
    isContainer: true,
    defaultProps: {},
    defaultStyles: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '16px', width: '100%' },
    propertyFields: [],
    render: ContainerRenderer,
  },
  Flex: {
    type: 'Flex',
    displayName: 'Flex Layout',
    category: 'layout',
    icon: 'Columns3',
    description: 'Flexible row or column layout',
    isContainer: true,
    defaultProps: {},
    defaultStyles: { display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '12px', width: '100%' },
    propertyFields: [],
    render: ContainerRenderer,
  },

  // Interactive & Modules
  TourStep: {
    type: 'TourStep',
    displayName: 'Tour Step',
    category: 'tour',
    icon: 'Compass',
    description: 'Walkthrough step with target selector',
    defaultProps: {
      stepNumber: 1,
      title: 'Step Title',
      description: 'Step explanation and instructions.',
      nextButtonText: 'Next →',
      skipButtonText: 'Skip',
    },
    defaultStyles: { 
      width: '360px', 
      backgroundColor: '#ffffff', 
      borderRadius: '12px', 
      paddingTop: '20px', 
      paddingBottom: '20px', 
      paddingLeft: '24px', 
      paddingRight: '24px',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)' 
    },
    propertyFields: [
      { key: 'stepNumber', label: 'Step Number', type: 'number', category: 'content' },
      { key: 'title', label: 'Step Title', type: 'text', category: 'content' },
      { key: 'description', label: 'Description', type: 'textarea', category: 'content' },
      { key: 'nextButtonText', label: 'Next Button Text', type: 'text', category: 'content' },
      { key: 'prevButtonText', label: 'Prev Button Text', type: 'text', category: 'content' },
      { key: 'skipButtonText', label: 'Skip Button Text', type: 'text', category: 'content' },
    ],
    render: TourStepRenderer,
  },
  DemoHotspot: {
    type: 'DemoHotspot',
    displayName: 'Demo Hotspot',
    category: 'demo',
    icon: 'Crosshair',
    description: 'Interactive hotspot marker',
    defaultProps: {
      tooltipTitle: 'Explore Here',
      tooltipText: 'Click to navigate to next screen',
      targetScreenId: '',
    },
    defaultStyles: { width: '36px', height: '36px' },
    propertyFields: [
      { key: 'tooltipTitle', label: 'Hotspot Title', type: 'text', category: 'content' },
      { key: 'tooltipText', label: 'Tooltip Hint', type: 'textarea', category: 'content' },
      { key: 'targetScreenId', label: 'Target Screen ID', type: 'text', category: 'behavior' },
    ],
    render: DemoHotspotRenderer,
  },
  BannerWidget: {
    type: 'BannerWidget',
    displayName: 'Announcement Banner',
    category: 'interactive',
    icon: 'Megaphone',
    description: 'Top or inline notification banner',
    defaultProps: {
      badgeText: 'ANNOUNCEMENT',
      message: 'New update is live! Check out what’s changed.',
      ctaText: 'Learn more →',
      isDismissible: true,
    },
    defaultStyles: { 
      width: '100%', 
      backgroundColor: '#4338ca', 
      color: '#ffffff', 
      paddingTop: '10px', 
      paddingBottom: '10px', 
      paddingLeft: '20px', 
      paddingRight: '20px' 
    },
    propertyFields: [
      { key: 'badgeText', label: 'Badge', type: 'text', category: 'content' },
      { key: 'message', label: 'Banner Message', type: 'text', category: 'content' },
      { key: 'ctaText', label: 'CTA Text', type: 'text', category: 'content' },
      { key: 'isDismissible', label: 'Dismissible', type: 'boolean', category: 'behavior' },
    ],
    render: BannerWidgetRenderer,
  },
  MenuWidget: {
    type: 'MenuWidget',
    displayName: 'Navigation Menu',
    category: 'interactive',
    icon: 'Menu',
    description: 'Site header navigation bar',
    defaultProps: {
      logoText: 'Acme',
      ctaText: 'Sign In',
      items: [{ label: 'Features' }, { label: 'Pricing' }, { label: 'Docs' }],
    },
    defaultStyles: { 
      width: '100%', 
      backgroundColor: '#ffffff', 
      paddingTop: '12px', 
      paddingBottom: '12px', 
      paddingLeft: '24px', 
      paddingRight: '24px',
      borderBottomWidth: '1px',
      borderColor: '#e2e8f0' 
    },
    propertyFields: [
      { key: 'logoText', label: 'Brand / Logo Text', type: 'text', category: 'content' },
      { key: 'ctaText', label: 'CTA Button Text', type: 'text', category: 'content' },
    ],
    render: MenuWidgetRenderer,
  },
  FaqWidget: {
    type: 'FaqWidget',
    displayName: 'FAQ Accordion',
    category: 'interactive',
    icon: 'HelpCircle',
    description: 'Collapsible questions & answers',
    defaultProps: {
      title: 'Frequently Asked Questions',
      subtitle: 'Answers to common questions',
      items: [
        { q: 'How do I install the widget?', a: 'Just copy and paste the snippet code before the </body> tag.' },
        { q: 'Can I customize styles?', a: 'Yes! Use the visual inspector to adjust colors, fonts, and paddings.' },
      ],
    },
    defaultStyles: { width: '100%', maxWidth: '720px', margin: '0 auto' },
    propertyFields: [
      { key: 'title', label: 'Title', type: 'text', category: 'content' },
      { key: 'subtitle', label: 'Subtitle', type: 'text', category: 'content' },
    ],
    render: FaqWidgetRenderer,
  },
  PopupWidget: {
    type: 'PopupWidget',
    displayName: 'Popup / Modal',
    category: 'interactive',
    icon: 'AppWindow',
    description: 'Center modal or slide-in window',
    defaultProps: {
      headline: 'Special Offer!',
      bodyText: 'Upgrade today to claim an exclusive bonus.',
      ctaText: 'Claim Now',
      cancelText: 'Not now',
      icon: 'Gift',
    },
    defaultStyles: { 
      width: '440px', 
      backgroundColor: '#ffffff', 
      borderRadius: '16px', 
      paddingTop: '28px', 
      paddingBottom: '28px', 
      paddingLeft: '28px', 
      paddingRight: '28px',
      boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' 
    },
    propertyFields: [
      { key: 'headline', label: 'Headline', type: 'text', category: 'content' },
      { key: 'bodyText', label: 'Body Text', type: 'textarea', category: 'content' },
      { key: 'ctaText', label: 'CTA Text', type: 'text', category: 'content' },
      { key: 'cancelText', label: 'Cancel Label', type: 'text', category: 'content' },
      { key: 'icon', label: 'Icon Name', type: 'text', category: 'content' },
    ],
    render: PopupWidgetRenderer,
  },
  ChecklistWidget: {
    type: 'ChecklistWidget',
    displayName: 'Onboarding Checklist',
    category: 'interactive',
    icon: 'CheckSquare',
    description: 'Interactive task checklist widget',
    defaultProps: {
      title: 'Getting Started',
      rewardMessage: 'All tasks completed! You are ready to go 🚀',
      tasks: [
        { id: '1', title: 'Complete your profile', completed: true },
        { id: '2', title: 'Create first experience', completed: false },
        { id: '3', title: 'Invite teammate', completed: false },
      ],
    },
    defaultStyles: { 
      width: '340px', 
      backgroundColor: '#ffffff', 
      borderRadius: '12px', 
      paddingTop: '16px', 
      paddingBottom: '16px', 
      paddingLeft: '18px', 
      paddingRight: '18px',
      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' 
    },
    propertyFields: [
      { key: 'title', label: 'Checklist Title', type: 'text', category: 'content' },
      { key: 'rewardMessage', label: 'Reward Message', type: 'text', category: 'content' },
    ],
    render: ChecklistWidgetRenderer,
  },
  SurveyWidget: {
    type: 'SurveyWidget',
    displayName: 'NPS & Survey Widget',
    category: 'interactive',
    icon: 'Star',
    description: '0-10 Net Promoter Score survey',
    defaultProps: {
      question: 'How likely are you to recommend us to a friend?',
      submitButtonText: 'Submit Feedback',
      thankYouTitle: 'Thank You for Helping Us Grow!',
    },
    defaultStyles: { 
      width: '400px', 
      backgroundColor: '#ffffff', 
      borderRadius: '14px', 
      paddingTop: '20px', 
      paddingBottom: '20px', 
      paddingLeft: '24px', 
      paddingRight: '24px',
      boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15)' 
    },
    propertyFields: [
      { key: 'question', label: 'Survey Question', type: 'text', category: 'content' },
      { key: 'submitButtonText', label: 'Button Label', type: 'text', category: 'content' },
      { key: 'thankYouTitle', label: 'Thank You Message', type: 'text', category: 'content' },
    ],
    render: SurveyWidgetRenderer,
  },

  // Advanced Sections
  HeroSection: {
    type: 'HeroSection',
    displayName: 'Hero Section',
    category: 'marketing',
    icon: 'Sparkle',
    description: 'Full-width landing hero banner',
    defaultProps: {
      badge: '⚡ High Performance',
      headline: 'Next-Gen Experience Engine',
      subheadline: 'Engage and convert users with frictionless interactive visual adoption.',
      primaryCtaText: 'Get Started Free',
      secondaryCtaText: 'Live Demo',
    },
    defaultStyles: { width: '100%', paddingTop: '64px', paddingBottom: '64px', backgroundColor: '#f8fafc' },
    propertyFields: [
      { key: 'badge', label: 'Badge', type: 'text', category: 'content' },
      { key: 'headline', label: 'Headline', type: 'text', category: 'content' },
      { key: 'subheadline', label: 'Subheadline', type: 'textarea', category: 'content' },
      { key: 'primaryCtaText', label: 'Primary CTA', type: 'text', category: 'content' },
      { key: 'secondaryCtaText', label: 'Secondary CTA', type: 'text', category: 'content' },
    ],
    render: HeroSectionRenderer,
  },
  FeaturesSection: {
    type: 'FeaturesSection',
    displayName: 'Features Grid',
    category: 'marketing',
    icon: 'Layers',
    description: '3-column feature benefit section',
    defaultProps: {
      title: 'Engineered for Scale',
      subtitle: 'Build with ease and measure performance at every step.',
    },
    defaultStyles: { width: '100%', paddingTop: '48px', paddingBottom: '48px', backgroundColor: '#ffffff' },
    propertyFields: [
      { key: 'title', label: 'Section Title', type: 'text', category: 'content' },
      { key: 'subtitle', label: 'Subtitle', type: 'text', category: 'content' },
    ],
    render: FeaturesSectionRenderer,
  },
  CtaSection: {
    type: 'CtaSection',
    displayName: 'Call To Action',
    category: 'marketing',
    icon: 'Flame',
    description: 'High-contrast conversion section',
    defaultProps: {
      headline: 'Start Building Experiences in Seconds',
      subheadline: 'No coding required. Instant publish.',
      buttonText: 'Claim Your Free Account',
    },
    defaultStyles: { width: '100%', paddingTop: '56px', paddingBottom: '56px', backgroundColor: '#1e1b4b', color: '#ffffff' },
    propertyFields: [
      { key: 'headline', label: 'Headline', type: 'text', category: 'content' },
      { key: 'subheadline', label: 'Subheadline', type: 'text', category: 'content' },
      { key: 'buttonText', label: 'Button Label', type: 'text', category: 'content' },
    ],
    render: CtaSectionRenderer,
  },
};
