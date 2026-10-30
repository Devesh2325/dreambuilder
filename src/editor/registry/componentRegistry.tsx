import React from 'react';
import { ComponentDefinition } from '../../types/components';
import { ComponentNode } from '../../types/document';
import * as LucideIcons from 'lucide-react';
import { useEditorStore } from '../store/useEditorStore';

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
const HeadingRenderer: React.FC<{ node: ComponentNode }> = ({ node }) => {
  const { text = 'Heading Text', level = 'h2' } = node.props;
  if (level === 'h1') return <h1 style={{ margin: 0 }} className="font-black text-3xl md:text-4xl text-slate-900 dark:text-white leading-tight">{text}</h1>;
  if (level === 'h3') return <h3 style={{ margin: 0 }} className="font-bold text-xl text-slate-900 dark:text-white leading-snug">{text}</h3>;
  if (level === 'h4') return <h4 style={{ margin: 0 }} className="font-bold text-lg text-slate-900 dark:text-white leading-snug">{text}</h4>;
  return <h2 style={{ margin: 0 }} className="font-extrabold text-2xl md:text-3xl text-slate-900 dark:text-white leading-snug">{text}</h2>;
};

// 2. Paragraph
const ParagraphRenderer: React.FC<{ node: ComponentNode }> = ({ node }) => {
  const { text = 'Click to customize your paragraph copy with valuable information.' } = node.props;
  return <p style={{ margin: 0 }} className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm md:text-base">{text}</p>;
};

// 3. Button
const ButtonRenderer: React.FC<{ node: ComponentNode }> = ({ node }) => {
  const { text = 'Click Me', icon } = node.props;
  return (
    <div className="inline-flex items-center justify-center gap-2 font-semibold select-none">
      {icon && <DynamicIcon name={icon} className="w-4 h-4" />}
      <span>{text}</span>
    </div>
  );
};

// 4. Badge
const BadgeRenderer: React.FC<{ node: ComponentNode }> = ({ node }) => {
  const { text = 'New Feature', icon } = node.props;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-bold rounded-full select-none">
      {icon && <DynamicIcon name={icon} className="w-3.5 h-3.5" />}
      {text}
    </span>
  );
};

// 5. Image
const ImageRenderer: React.FC<{ node: ComponentNode }> = ({ node }) => {
  const { src = 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80', alt = 'Visual asset' } = node.props;
  return (
    <img 
      src={src} 
      alt={alt} 
      className="w-full h-full object-cover rounded-[inherit] pointer-events-none select-none" 
    />
  );
};

// 6. Divider
const DividerRenderer: React.FC<{ node: ComponentNode }> = () => {
  return <hr className="w-full border-t border-slate-200 dark:border-slate-800 my-2" />;
};

// 7. Spacer
const SpacerRenderer: React.FC<{ node: ComponentNode }> = ({ node }) => {
  const { height = 24 } = node.props;
  return <div style={{ height: `${height}px`, width: '100%' }} />;
};

// 8. Container / Section / Flex
const ContainerRenderer: React.FC<{ node: ComponentNode; children?: React.ReactNode }> = ({ children }) => {
  return <div className="w-full min-h-[40px] flex flex-col">{children}</div>;
};

// 8a. TourContainer Renderer
const TourContainerRenderer: React.FC<{ node: ComponentNode; children?: React.ReactNode }> = ({ node, children }) => {
  return (
    <div className="w-full flex flex-col items-center justify-center p-6 gap-6">
      <div className="w-full max-w-xl bg-indigo-50/80 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 rounded-xl p-3 flex items-center justify-between text-xs text-indigo-900 dark:text-indigo-200 font-medium select-none shadow-sm">
        <span className="flex items-center gap-1.5 font-bold">
          <span>🎯</span> Product Tour Steps Flow ({node.children?.length || 0} steps)
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            const stepNum = (node.children?.length || 0) + 1;
            const newStep: ComponentNode = {
              id: `step_${Date.now()}`,
              type: 'TourStep',
              name: `Step ${stepNum}`,
              target: { selector: '#target-element', placement: 'bottom', offset: 12, highlight: true },
              props: {
                stepNumber: stepNum,
                title: `Tour Step ${stepNum}`,
                description: 'Point and explain this part of the user interface to new customers.',
                nextButtonText: 'Next Step →',
                skipButtonText: 'Skip',
              },
              styles: {
                width: '380px',
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                paddingTop: '20px',
                paddingBottom: '20px',
                paddingLeft: '24px',
                paddingRight: '24px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)',
              },
              children: [],
            };
            useEditorStore.getState().insertNode(node.id, newStep);
          }}
          className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-bold shadow-sm transition-all"
        >
          + Add Step
        </button>
      </div>
      <div className="w-full flex flex-col items-center gap-4">{children}</div>
    </div>
  );
};

// 8b. DemoContainer Renderer
const DemoContainerRenderer: React.FC<{ node: ComponentNode; children?: React.ReactNode }> = ({ node, children }) => {
  return (
    <div className="w-full flex flex-col p-4 gap-4">
      <div className="w-full bg-purple-50/80 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800 rounded-xl p-3 flex items-center justify-between text-xs text-purple-900 dark:text-purple-200 font-medium select-none shadow-sm">
        <span className="flex items-center gap-1.5 font-bold">
          <span>🎬</span> Interactive Product Demo Flow ({node.children?.length || 0} screens)
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            const screenNum = (node.children?.length || 0) + 1;
            const newScreen: ComponentNode = {
              id: `screen_${Date.now()}`,
              type: 'DemoScreen',
              name: `Demo Screen ${screenNum}`,
              props: {
                title: `Application Screen ${screenNum}`,
                imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&auto=format&fit=crop&q=80',
                screenNumber: screenNum,
              },
              styles: { width: '100%', minHeight: '540px', position: 'relative' },
              children: [],
            };
            useEditorStore.getState().insertNode(node.id, newScreen);
          }}
          className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-[11px] font-bold shadow-sm transition-all"
        >
          + Add Screen
        </button>
      </div>
      <div className="w-full">{children}</div>
    </div>
  );
};

// 8c. DemoScreen Renderer
const DemoScreenRenderer: React.FC<{ node: ComponentNode; children?: React.ReactNode }> = ({ node, children }) => {
  const { title = 'Demo Screen', imageUrl, screenNumber = 1 } = node.props;
  return (
    <div className="w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-md relative bg-slate-900" style={{ minHeight: '540px' }}>
      {imageUrl && (
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-[540px] object-cover opacity-90 select-none pointer-events-none"
        />
      )}
      <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-semibold z-10 flex items-center gap-2">
        <span>Screen {screenNumber}: {title}</span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            const newHotspot: ComponentNode = {
              id: `hotspot_${Date.now()}`,
              type: 'DemoHotspot',
              name: 'Interactive Hotspot',
              props: {
                tooltipTitle: 'Explore Action',
                tooltipText: 'Click hotspot to trigger next screen or modal',
              },
              styles: { position: 'absolute', top: `${100 + Math.random() * 200}px`, left: `${150 + Math.random() * 300}px`, width: '36px', height: '36px' },
              children: [],
            };
            useEditorStore.getState().insertNode(node.id, newHotspot);
          }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-2 py-0.5 rounded text-[10px] font-bold"
        >
          + Add Hotspot
        </button>
      </div>
      {children}
    </div>
  );
};

// 8d. BannerContainer Renderer
const BannerContainerRenderer: React.FC<{ node: ComponentNode; children?: React.ReactNode }> = ({ children }) => {
  return (
    <div className="w-full flex flex-col gap-4">
      <div className="w-full p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center justify-between text-xs text-amber-900 dark:text-amber-200 select-none shadow-sm">
        <span className="flex items-center gap-1.5 font-bold">
          <span>📢</span> In-App Banner Experience Flow
        </span>
        <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
          High-Visibility Announcement Bar
        </span>
      </div>
      <div className="w-full flex flex-col gap-3">{children}</div>
    </div>
  );
};

// 8e. PopupContainer Renderer
const PopupContainerRenderer: React.FC<{ node: ComponentNode; children?: React.ReactNode }> = ({ children }) => {
  return (
    <div className="w-full min-h-[500px] flex flex-col items-center justify-center p-8 bg-slate-900/10 dark:bg-slate-950/40 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-800">
      <div className="w-full max-w-lg flex flex-col gap-3 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800">
        {children}
      </div>
    </div>
  );
};

// 8f. FaqContainer Renderer
const FaqContainerRenderer: React.FC<{ node: ComponentNode; children?: React.ReactNode }> = ({ children }) => {
  return (
    <div className="w-full max-w-4xl mx-auto p-6 flex flex-col gap-4">
      <div className="w-full p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-between text-xs text-emerald-900 dark:text-emerald-200 font-bold select-none">
        <span>❓ FAQ Section & Help Center Flow</span>
        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">Searchable Q&A Accordion</span>
      </div>
      <div className="w-full flex flex-col gap-3">{children}</div>
    </div>
  );
};

// 8g. ChecklistContainer Renderer
const ChecklistContainerRenderer: React.FC<{ node: ComponentNode; children?: React.ReactNode }> = ({ children }) => {
  return (
    <div className="w-full max-w-2xl mx-auto p-6 flex flex-col gap-4">
      <div className="w-full p-2.5 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 rounded-xl flex items-center justify-between text-xs text-teal-900 dark:text-teal-200 font-bold select-none">
        <span>✅ Onboarding Checklist Flow</span>
        <span className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold">User Activation Progress</span>
      </div>
      <div className="w-full flex flex-col gap-3">{children}</div>
    </div>
  );
};

// 8h. SurveyContainer Renderer
const SurveyContainerRenderer: React.FC<{ node: ComponentNode; children?: React.ReactNode }> = ({ children }) => {
  return (
    <div className="w-full max-w-xl mx-auto p-6 flex flex-col gap-4">
      <div className="w-full p-2.5 bg-yellow-50 dark:bg-yellow-950/40 border border-yellow-200 dark:border-yellow-800 rounded-xl flex items-center justify-between text-xs text-yellow-900 dark:text-yellow-200 font-bold select-none">
        <span>⭐ Feedback & NPS Survey Widget</span>
        <span className="text-[10px] text-yellow-600 dark:text-yellow-400 font-semibold">Customer Sentiment</span>
      </div>
      <div className="w-full flex flex-col gap-3">{children}</div>
    </div>
  );
};

// 8i. MenuContainer Renderer
const MenuContainerRenderer: React.FC<{ node: ComponentNode; children?: React.ReactNode }> = ({ children }) => {
  return (
    <div className="w-full flex flex-col gap-4">
      <div className="w-full p-2.5 bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800 rounded-xl flex items-center justify-between text-xs text-cyan-900 dark:text-cyan-200 font-bold select-none">
        <span>🧭 Header Navigation Menu Flow</span>
        <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-semibold">Responsive Navbar</span>
      </div>
      <div className="w-full flex flex-col gap-3">{children}</div>
    </div>
  );
};

// 9. TourStep Renderer
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
      <div className="flex items-center justify-between mb-2 pb-1 border-b border-slate-100 dark:border-slate-800">
        <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded-full">
          Step {stepNumber}
        </span>
        <span className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer">✕</span>
      </div>
      <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">{title}</h3>
      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">{description}</p>
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
        <button type="button" className="text-xs font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
          {skipButtonText}
        </button>
        <div className="flex items-center gap-2">
          {prevButtonText && (
            <button type="button" className="px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded hover:bg-slate-200">
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

// 10. DemoHotspot Renderer
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
    badgeText = 'NEW RELEASE', 
    message = 'Experience our powerful new visual builder updates!',
    ctaText = 'Learn more →',
    isDismissible = true 
  } = node.props;

  return (
    <div className="flex items-center justify-between gap-4 text-sm font-medium w-full">
      <div className="flex items-center gap-3">
        {badgeText && (
          <span className="bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0">
            {badgeText}
          </span>
        )}
        <span className="truncate">{message || 'Banner announcement copy here.'}</span>
      </div>
      <div className="flex items-center gap-3 shrink-0">
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
  const { logoText = 'FlowPilot App', items = ['Features', 'Pricing', 'Docs', 'About'], ctaText = 'Get Started' } = node.props;
  return (
    <nav className="flex items-center justify-between w-full py-2">
      <div className="flex items-center gap-8">
        <span className="font-black text-lg tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <span className="w-6 h-6 rounded bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">F</span>
          {logoText}
        </span>
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
          {(items || []).map((item: any, idx: number) => (
            <span key={idx} className="hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer">
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
  const { 
    title = 'Frequently Asked Questions', 
    subtitle = 'Everything you need to know about our product and plans.', 
    items = [
      { q: 'How does FlowPilot work?', a: 'FlowPilot lets you visually compose product tours, banners, and landing pages with zero coding required.' },
      { q: 'Can I integrate with my existing tech stack?', a: 'Yes! FlowPilot embeds with a single script tag and works with React, Vue, Next.js, and static HTML.' },
      { q: 'Does it support dark and light theme?', a: 'Yes, full dark mode and organization brand styling are supported out of the box.' },
    ] 
  } = node.props;
  const [openIndex, setOpenIndex] = React.useState<number | null>(0);

  return (
    <div className="w-full text-left">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{title}</h2>
      {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{subtitle}</p>}
      <div className="divide-y divide-slate-200 dark:divide-slate-800 border-y border-slate-200 dark:border-slate-800">
        {(items || []).map((item: any, idx: number) => {
          const isOpen = openIndex === idx;
          return (
            <div key={idx} className="py-4">
              <button 
                type="button" 
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="w-full flex items-center justify-between text-left font-semibold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400"
              >
                <span>{item.q}</span>
                <span className="text-slate-400 font-mono text-lg">{isOpen ? '−' : '+'}</span>
              </button>
              {isOpen && (
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed pr-6">
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
    bodyText = 'Upgrade now to get instant access to all features, custom domains, and AI builder capabilities.',
    ctaText = 'Claim 25% Off Deal',
    cancelText = 'No thanks, maybe later',
    icon = 'Sparkles'
  } = node.props;

  return (
    <div className="text-center p-4">
      <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <DynamicIcon name={icon} className="w-6 h-6" />
      </div>
      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{headline}</h3>
      <p className="text-sm text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">{bodyText}</p>
      <div className="flex flex-col gap-2">
        <button type="button" className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-sm">
          {ctaText}
        </button>
        {cancelText && (
          <button type="button" className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 py-1">
            {cancelText}
          </button>
        )}
      </div>
    </div>
  );
};

// 15. ChecklistWidget Renderer
const ChecklistWidgetRenderer: React.FC<{ node: ComponentNode }> = ({ node }) => {
  const { 
    title = 'Getting Started Checklist', 
    tasks = [
      { id: '1', title: 'Complete your user profile', completed: true },
      { id: '2', title: 'Connect custom tracking domain', completed: true },
      { id: '3', title: 'Publish your first experience', completed: false },
      { id: '4', title: 'Invite team members to workspace', completed: false },
    ], 
    rewardMessage = '🎉 Congratulations! You unlocked the Early Adopter Badge.' 
  } = node.props;
  const [taskList, setTaskList] = React.useState(tasks);

  const toggleTask = (id: string) => {
    setTaskList((prev: any[]) =>
      prev.map((t: any) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const completedCount = (taskList || []).filter((t: any) => t.completed).length;
  const progressPercent = taskList.length ? Math.round((completedCount / taskList.length) * 100) : 0;

  return (
    <div className="text-left font-sans p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-bold text-slate-900 dark:text-white text-sm">{title}</h4>
        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
          {progressPercent}% Complete
        </span>
      </div>
      {/* Progress Bar */}
      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mb-4">
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
            className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
          >
            <input 
              type="checkbox" 
              checked={task.completed} 
              readOnly 
              className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer" 
            />
            <span className={`text-xs ${task.completed ? 'line-through text-slate-400 font-normal' : 'text-slate-800 dark:text-slate-200 font-medium'}`}>
              {task.title}
            </span>
          </div>
        ))}
      </div>
      {progressPercent === 100 && (
        <div className="mt-3 p-2.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs rounded-lg font-medium text-center">
          {rewardMessage}
        </div>
      )}
    </div>
  );
};

// 16. SurveyWidget Renderer
const SurveyWidgetRenderer: React.FC<{ node: ComponentNode }> = ({ node }) => {
  const { question = 'How likely are you to recommend us to a colleague?', submitButtonText = 'Submit Feedback', thankYouTitle = 'Thank you for your feedback!' } = node.props;
  const [selectedScore, setSelectedScore] = React.useState<number | null>(null);
  const [submitted, setSubmitted] = React.useState(false);

  if (submitted) {
    return (
      <div className="text-center py-6 p-4">
        <h4 className="font-bold text-slate-900 dark:text-white text-base mb-1">{thankYouTitle}</h4>
        <p className="text-xs text-slate-500 dark:text-slate-400">Your score ({selectedScore}/10) has been recorded to analytics.</p>
      </div>
    );
  }

  return (
    <div className="text-left font-sans p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
      <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-3">{question}</h4>
      <div className="flex items-center justify-between gap-1 mb-4">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(val => (
          <button
            key={val}
            type="button"
            onClick={() => setSelectedScore(val)}
            className={`w-7 h-8 text-xs font-semibold rounded transition-colors ${
              selectedScore === val 
                ? 'bg-indigo-600 text-white' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
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
        className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-bold rounded-lg shadow-sm"
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
    <div className="max-w-4xl mx-auto px-4 py-8 text-center">
      {badge && (
        <span className="inline-block px-3 py-1 mb-4 text-xs font-bold tracking-wide text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-950 rounded-full">
          {badge}
        </span>
      )}
      <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-4 leading-tight">
        {headline || 'Build Experiences Without Limits'}
      </h1>
      <p className="text-base md:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mb-8 leading-relaxed">
        {subheadline || 'Visually design, publish, and track tours, banners, and workflows in minutes.'}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-4">
        {primaryCtaText && (
          <button type="button" className="px-6 py-3 font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-md">
            {primaryCtaText}
          </button>
        )}
        {secondaryCtaText && (
          <button type="button" className="px-6 py-3 font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 shadow-sm">
            {secondaryCtaText}
          </button>
        )}
      </div>
    </div>
  );
};

// 18. FeaturesSection Renderer
const FeaturesSectionRenderer: React.FC<{ node: ComponentNode }> = ({ node }) => {
  const { title = 'Powerful Product Adoption Capabilities', subtitle = 'Everything you need to onboard, activate, and retain users effortlessly.' } = node.props;
  const features = [
    { icon: 'Compass', title: 'Zero-Code Product Tours', desc: 'Point and click to highlight critical app controls and drive activation.' },
    { icon: 'Sparkles', title: 'AI Assistant Included', desc: 'Generate complete pages or refine styles with natural language prompts.' },
    { icon: 'BarChart3', title: 'Actionable Analytics', desc: 'Monitor step-by-step drop-off and conversion rates in real-time.' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 text-center">
      <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{title}</h2>
      {subtitle && <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-xl mx-auto text-sm">{subtitle}</p>}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
        {features.map((f, i) => (
          <div key={i} className="p-6 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700/60 text-left">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
              <DynamicIcon name={f.icon} className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white mb-1.5">{f.title}</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// 19. CtaSection Renderer
const CtaSectionRenderer: React.FC<{ node: ComponentNode }> = ({ node }) => {
  const { headline = 'Ready to 10x your product activation rates?', subheadline = 'Join over 4,500 fast-growing software companies building with FlowPilot.', buttonText = 'Start Free 14-Day Trial' } = node.props;
  return (
    <div className="max-w-4xl mx-auto px-4 py-10 text-center">
      <h2 className="text-3xl font-extrabold mb-3">{headline}</h2>
      {subheadline && <p className="opacity-90 mb-6 text-sm md:text-base max-w-xl mx-auto">{subheadline}</p>}
      <button type="button" className="px-8 py-3.5 bg-white text-indigo-950 font-black text-sm rounded-xl hover:bg-slate-100 shadow-xl transition-all">
        {buttonText}
      </button>
    </div>
  );
};

// 20. TestimonialsSection Renderer
const TestimonialsSectionRenderer: React.FC<{ node: ComponentNode }> = ({ node }) => {
  const { title = 'Loved by Product & Growth Teams', subtitle = 'See what modern product builders say about FlowPilot experiences.' } = node.props;
  const testimonials = [
    { name: 'Sarah Chen', role: 'Head of Growth at Supaflow', quote: 'FlowPilot reduced our time-to-first-activation by 42% in just two weeks without engineering involvement.' },
    { name: 'David Miller', role: 'VP Product at CloudStack', quote: 'The visual editor is blisteringly fast. Our non-technical product managers build tours and banners independently.' },
    { name: 'Elena Rostova', role: 'Founder at MetricPulse', quote: 'Having tours, checklists, banners, and surveys unified in one platform eliminated three different vendor subscriptions.' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 text-center">
      <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">{title}</h2>
      {subtitle && <p className="text-slate-600 dark:text-slate-400 mb-8 text-sm">{subtitle}</p>}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
        {testimonials.map((t, idx) => (
          <div key={idx} className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-subtle flex flex-col justify-between">
            <div>
              <div className="flex gap-1 text-amber-400 text-sm mb-3">★★★★★</div>
              <p className="text-slate-700 dark:text-slate-300 text-sm italic leading-relaxed mb-4">"{t.quote}"</p>
            </div>
            <div className="flex items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-700">
              <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center">
                {t.name.charAt(0)}
              </div>
              <div>
                <span className="font-bold text-xs text-slate-900 dark:text-white block">{t.name}</span>
                <span className="text-[10px] text-slate-400">{t.role}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// 21. PricingSection Renderer
const PricingSectionRenderer: React.FC<{ node: ComponentNode }> = ({ node }) => {
  const { title = 'Simple, Transparent Pricing', subtitle = 'Start free and scale as your product adoption grows.' } = node.props;
  const plans = [
    { name: 'Starter', price: '$29', period: '/month', desc: 'For early-stage startups', features: ['Up to 5 active tours', 'In-app banners & alerts', '5,000 monthly visitors', 'Basic analytics'], cta: 'Start Free Trial', highlight: false },
    { name: 'Pro Growth', price: '$99', period: '/month', desc: 'For scaling SaaS teams', features: ['Unlimited tours & banners', 'Interactive product demos', '50,000 monthly visitors', 'Custom brand tokens', 'AI assistant builder'], cta: 'Upgrade to Pro', highlight: true },
    { name: 'Enterprise', price: '$299', period: '/month', desc: 'For high-volume platforms', features: ['Unlimited everything', 'Dedicated success architect', 'SSO & Audit logging', 'Multi-tenant isolation', '99.99% uptime SLA'], cta: 'Contact Sales', highlight: false },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 text-center">
      <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">{title}</h2>
      {subtitle && <p className="text-slate-600 dark:text-slate-400 mb-8 text-sm">{subtitle}</p>}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((p, idx) => (
          <div 
            key={idx} 
            className={`p-6 rounded-2xl border text-left flex flex-col justify-between transition-all ${
              p.highlight 
                ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 shadow-xl ring-2 ring-indigo-600/30' 
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 shadow-sm'
            }`}
          >
            <div>
              {p.highlight && (
                <span className="inline-block px-2.5 py-0.5 mb-2 text-[10px] font-bold text-white bg-indigo-600 rounded-full uppercase tracking-wider">
                  Most Popular
                </span>
              )}
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">{p.name}</h3>
              <p className="text-xs text-slate-500 mb-4">{p.desc}</p>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-3xl font-black text-slate-900 dark:text-white">{p.price}</span>
                <span className="text-xs text-slate-400">{p.period}</span>
              </div>
              <ul className="space-y-2 mb-6">
                {p.features.map((feat, fIdx) => (
                  <li key={fIdx} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                    <span className="text-emerald-500 font-bold">✓</span>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
            <button 
              type="button" 
              className={`w-full py-2.5 text-xs font-bold rounded-xl shadow-sm transition-all ${
                p.highlight 
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/25' 
                  : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-900 dark:text-white'
              }`}
            >
              {p.cta}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// 22. FormSection Renderer
const FormSectionRenderer: React.FC<{ node: ComponentNode }> = ({ node }) => {
  const { title = 'Get in Touch with our Product Specialists', buttonText = 'Submit Inquiry' } = node.props;
  const [submitted, setSubmitted] = React.useState(false);

  if (submitted) {
    return (
      <div className="max-w-md mx-auto p-6 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-center">
        <h4 className="font-bold text-emerald-900 dark:text-emerald-200 text-base mb-1">Message Received!</h4>
        <p className="text-xs text-emerald-700 dark:text-emerald-300">We will get back to you within 24 hours.</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-card">
      <h3 className="font-bold text-slate-900 dark:text-white text-base mb-4 text-center">{title}</h3>
      <form onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }} className="space-y-3">
        <div>
          <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">Full Name</label>
          <input type="text" required placeholder="Alex Vance" className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white" />
        </div>
        <div>
          <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">Work Email</label>
          <input type="email" required placeholder="alex@company.com" className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white" />
        </div>
        <div>
          <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">Message</label>
          <textarea rows={3} placeholder="How can we help?" className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white" />
        </div>
        <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm">
          {buttonText}
        </button>
      </form>
    </div>
  );
};

// 23. FooterSection Renderer
const FooterSectionRenderer: React.FC<{ node: ComponentNode }> = ({ node }) => {
  const { brandName = 'FlowPilot', copyright = '© 2026 FlowPilot AI. All rights reserved.' } = node.props;
  return (
    <footer className="w-full py-8 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
      <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded bg-indigo-600 text-white font-bold flex items-center justify-center text-[10px]">F</span>
          <span className="font-extrabold text-slate-900 dark:text-white">{brandName}</span>
        </div>
        <div className="flex items-center gap-6">
          <span className="hover:text-indigo-600 cursor-pointer">Privacy Policy</span>
          <span className="hover:text-indigo-600 cursor-pointer">Terms of Service</span>
          <span className="hover:text-indigo-600 cursor-pointer">Status</span>
          <span className="hover:text-indigo-600 cursor-pointer">Security</span>
        </div>
        <span>{copyright}</span>
      </div>
    </footer>
  );
};

// -------------------------------------------------------------
// Component Registry Export
// -------------------------------------------------------------

export const COMPONENT_REGISTRY: Record<string, ComponentDefinition> = {
  // 1. Basic Content
  Heading: {
    type: 'Heading',
    displayName: 'Heading',
    category: 'basic',
    icon: 'Heading',
    description: 'Title or section headline',
    supportedModules: ['all'],
    defaultProps: { text: 'Heading Text', level: 'h2' },
    defaultStyles: { fontSize: '28px', color: '#0f172a', fontWeight: 'bold', marginBottom: '8px' },
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
    supportedModules: ['all'],
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
    supportedModules: ['all'],
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
    supportedModules: ['all'],
    defaultProps: { text: 'Beta Feature', icon: 'Sparkles' },
    defaultStyles: { backgroundColor: '#ede9fe', color: '#6d28d9', display: 'inline-block' },
    propertyFields: [
      { key: 'text', label: 'Badge Label', type: 'text', category: 'content' },
      { key: 'icon', label: 'Icon Name', type: 'text', category: 'content' },
    ],
    render: BadgeRenderer,
  },
  Image: {
    type: 'Image',
    displayName: 'Image',
    category: 'basic',
    icon: 'Image',
    description: 'Responsive media image',
    supportedModules: ['all'],
    defaultProps: { src: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80', alt: 'Visual asset' },
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
    supportedModules: ['all'],
    defaultProps: {},
    defaultStyles: { width: '100%', margin: '16px 0' },
    propertyFields: [],
    render: DividerRenderer,
  },
  Spacer: {
    type: 'Spacer',
    displayName: 'Spacer',
    category: 'basic',
    icon: 'MoveVertical',
    description: 'Vertical whitespace gap',
    supportedModules: ['all'],
    defaultProps: { height: 24 },
    defaultStyles: { width: '100%' },
    propertyFields: [
      { key: 'height', label: 'Height (px)', type: 'number', category: 'content' },
    ],
    render: SpacerRenderer,
  },

  // 2. Layout & Containers
  Container: {
    type: 'Container',
    displayName: 'Container',
    category: 'layout',
    icon: 'Box',
    description: 'Structural wrapper for grouping blocks',
    isContainer: true,
    supportedModules: ['all'],
    defaultProps: {},
    defaultStyles: { width: '100%', padding: '16px', display: 'flex', flexDirection: 'column' },
    propertyFields: [],
    render: ContainerRenderer,
  },
  Grid: {
    type: 'Grid',
    displayName: 'Grid Layout',
    category: 'layout',
    icon: 'LayoutGrid',
    description: 'Multi-column responsive grid',
    isContainer: true,
    supportedModules: ['all'],
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
    supportedModules: ['all'],
    defaultProps: {},
    defaultStyles: { display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '12px', width: '100%' },
    propertyFields: [],
    render: ContainerRenderer,
  },

  // 3. Modules & Containers
  BannerContainer: {
    type: 'BannerContainer',
    displayName: 'Banner Flow Container',
    category: 'interactive',
    icon: 'Megaphone',
    description: 'Container for in-app announcements & notifications',
    isContainer: true,
    supportedModules: ['banner'],
    defaultProps: {},
    defaultStyles: { width: '100%' },
    propertyFields: [],
    render: BannerContainerRenderer,
  },
  TourContainer: {
    type: 'TourContainer',
    displayName: 'Tour Steps Flow',
    category: 'tour',
    icon: 'Compass',
    description: 'Container for product walkthrough steps',
    isContainer: true,
    supportedModules: ['tour'],
    defaultProps: { currentStepIndex: 0 },
    defaultStyles: { width: '100%' },
    propertyFields: [],
    render: TourContainerRenderer,
  },
  DemoContainer: {
    type: 'DemoContainer',
    displayName: 'Demo Flow Container',
    category: 'demo',
    icon: 'PlaySquare',
    description: 'Container for interactive demo screens',
    isContainer: true,
    supportedModules: ['demo'],
    defaultProps: { currentScreenIndex: 0 },
    defaultStyles: { width: '100%', minHeight: '600px' },
    propertyFields: [],
    render: DemoContainerRenderer,
  },
  PopupContainer: {
    type: 'PopupContainer',
    displayName: 'Popup Overlay Container',
    category: 'interactive',
    icon: 'AppWindow',
    description: 'Container for modal lightboxes & popups',
    isContainer: true,
    supportedModules: ['popup'],
    defaultProps: {},
    defaultStyles: { width: '100%' },
    propertyFields: [],
    render: PopupContainerRenderer,
  },
  FaqContainer: {
    type: 'FaqContainer',
    displayName: 'FAQ Section Container',
    category: 'interactive',
    icon: 'HelpCircle',
    description: 'Container for FAQ accordion questions',
    isContainer: true,
    supportedModules: ['faq'],
    defaultProps: {},
    defaultStyles: { width: '100%' },
    propertyFields: [],
    render: FaqContainerRenderer,
  },
  ChecklistContainer: {
    type: 'ChecklistContainer',
    displayName: 'Checklist Flow Container',
    category: 'interactive',
    icon: 'CheckSquare',
    description: 'Container for user onboarding checklists',
    isContainer: true,
    supportedModules: ['checklist'],
    defaultProps: {},
    defaultStyles: { width: '100%' },
    propertyFields: [],
    render: ChecklistContainerRenderer,
  },
  SurveyContainer: {
    type: 'SurveyContainer',
    displayName: 'Survey Flow Container',
    category: 'interactive',
    icon: 'Star',
    description: 'Container for user feedback & NPS surveys',
    isContainer: true,
    supportedModules: ['survey'],
    defaultProps: {},
    defaultStyles: { width: '100%' },
    propertyFields: [],
    render: SurveyContainerRenderer,
  },
  MenuContainer: {
    type: 'MenuContainer',
    displayName: 'Navigation Header Container',
    category: 'interactive',
    icon: 'Menu',
    description: 'Container for application navigation header',
    isContainer: true,
    supportedModules: ['menu'],
    defaultProps: {},
    defaultStyles: { width: '100%' },
    propertyFields: [],
    render: MenuContainerRenderer,
  },

  // 4. Module Leaf Widgets
  DemoScreen: {
    type: 'DemoScreen',
    displayName: 'Simulated Screen',
    category: 'demo',
    icon: 'Monitor',
    description: 'Product screenshot screen with clickable hotspots',
    isContainer: true,
    supportedModules: ['demo'],
    defaultProps: {
      title: 'Demo Screen',
      imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&auto=format&fit=crop&q=80',
      screenNumber: 1,
    },
    defaultStyles: { width: '100%', minHeight: '540px', position: 'relative' },
    propertyFields: [
      { key: 'title', label: 'Screen Title', type: 'text', category: 'content' },
      { key: 'imageUrl', label: 'Background Image URL', type: 'text', category: 'content' },
      { key: 'screenNumber', label: 'Screen Number', type: 'number', category: 'content' },
    ],
    render: DemoScreenRenderer,
  },
  TourStep: {
    type: 'TourStep',
    displayName: 'Tour Step',
    category: 'tour',
    icon: 'Compass',
    description: 'Walkthrough step with target selector',
    supportedModules: ['tour'],
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
    supportedModules: ['demo'],
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
    supportedModules: ['banner', 'page'],
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
      paddingTop: '12px', 
      paddingBottom: '12px', 
      paddingLeft: '20px', 
      paddingRight: '20px',
      borderRadius: '8px'
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
    description: 'Header navigation with links & CTA',
    supportedModules: ['menu', 'page'],
    defaultProps: {
      logoText: 'FlowPilot App',
      items: ['Features', 'Pricing', 'Docs', 'About'],
      ctaText: 'Get Started',
    },
    defaultStyles: { width: '100%', paddingLeft: '16px', paddingRight: '16px' },
    propertyFields: [
      { key: 'logoText', label: 'Brand Name', type: 'text', category: 'content' },
      { key: 'ctaText', label: 'CTA Button Text', type: 'text', category: 'content' },
    ],
    render: MenuWidgetRenderer,
  },
  FaqWidget: {
    type: 'FaqWidget',
    displayName: 'FAQ Accordion',
    category: 'interactive',
    icon: 'HelpCircle',
    description: 'Collapsible questions accordion',
    supportedModules: ['faq', 'page'],
    defaultProps: {
      title: 'Frequently Asked Questions',
      subtitle: 'Everything you need to know about our product and plans.',
      items: [
        { q: 'How does FlowPilot work?', a: 'FlowPilot lets you visually compose product tours, banners, and landing pages with zero coding required.' },
        { q: 'Can I integrate with my existing tech stack?', a: 'Yes! FlowPilot embeds with a single script tag and works with React, Vue, Next.js, and static HTML.' },
        { q: 'Does it support dark and light theme?', a: 'Yes, full dark mode and organization brand styling are supported out of the box.' },
      ],
    },
    defaultStyles: { width: '100%', padding: '16px' },
    propertyFields: [
      { key: 'title', label: 'FAQ Title', type: 'text', category: 'content' },
      { key: 'subtitle', label: 'Subtitle', type: 'text', category: 'content' },
    ],
    render: FaqWidgetRenderer,
  },
  PopupWidget: {
    type: 'PopupWidget',
    displayName: 'Popup / Modal',
    category: 'interactive',
    icon: 'AppWindow',
    description: 'Modal dialog box overlay',
    supportedModules: ['popup', 'page'],
    defaultProps: {
      headline: 'Special Offer Just for You!',
      bodyText: 'Upgrade now to get instant access to all features and AI builder capabilities.',
      ctaText: 'Claim Deal Now',
      cancelText: 'No thanks',
      icon: 'Sparkles',
    },
    defaultStyles: { width: '100%', padding: '24px', backgroundColor: '#ffffff', borderRadius: '16px' },
    propertyFields: [
      { key: 'headline', label: 'Headline', type: 'text', category: 'content' },
      { key: 'bodyText', label: 'Body Text', type: 'textarea', category: 'content' },
      { key: 'ctaText', label: 'Button Text', type: 'text', category: 'content' },
      { key: 'cancelText', label: 'Dismiss Text', type: 'text', category: 'content' },
    ],
    render: PopupWidgetRenderer,
  },
  ChecklistWidget: {
    type: 'ChecklistWidget',
    displayName: 'Onboarding Checklist',
    category: 'interactive',
    icon: 'CheckSquare',
    description: 'Gamified milestone task list',
    supportedModules: ['checklist', 'page'],
    defaultProps: {
      title: 'Your Onboarding Checklist',
      tasks: [
        { id: '1', title: 'Complete your user profile', completed: true },
        { id: '2', title: 'Connect custom tracking domain', completed: true },
        { id: '3', title: 'Publish your first experience', completed: false },
        { id: '4', title: 'Invite team members to workspace', completed: false },
      ],
      rewardMessage: '🎉 Congratulations! You unlocked the Early Adopter Badge.',
    },
    defaultStyles: { width: '100%', padding: '16px' },
    propertyFields: [
      { key: 'title', label: 'Checklist Title', type: 'text', category: 'content' },
      { key: 'rewardMessage', label: 'Completion Reward', type: 'text', category: 'content' },
    ],
    render: ChecklistWidgetRenderer,
  },
  SurveyWidget: {
    type: 'SurveyWidget',
    displayName: 'NPS & Survey Widget',
    category: 'interactive',
    icon: 'Star',
    description: 'Customer rating & feedback score',
    supportedModules: ['survey', 'page'],
    defaultProps: {
      question: 'How likely are you to recommend us to a colleague?',
      submitButtonText: 'Send Feedback',
      thankYouTitle: 'Thank you for your feedback!',
    },
    defaultStyles: { width: '100%', padding: '20px' },
    propertyFields: [
      { key: 'question', label: 'Survey Question', type: 'text', category: 'content' },
      { key: 'submitButtonText', label: 'Submit Button Label', type: 'text', category: 'content' },
    ],
    render: SurveyWidgetRenderer,
  },

  // 5. Marketing Sections
  HeroSection: {
    type: 'HeroSection',
    displayName: 'Hero Section',
    category: 'marketing',
    icon: 'Sparkles',
    description: 'Full-width landing hero banner',
    supportedModules: ['page', 'all'],
    defaultProps: {
      badge: '⚡ Powered by FlowPilot AI',
      headline: 'Build Interactive Experiences That Convert',
      subheadline: 'Visually create tours, in-app banners, checklists, and landing pages without engineers.',
      primaryCtaText: 'Start Free Trial',
      secondaryCtaText: 'Watch Demo',
    },
    defaultStyles: { width: '100%', paddingTop: '48px', paddingBottom: '48px', backgroundColor: '#f8fafc' },
    propertyFields: [
      { key: 'badge', label: 'Top Badge', type: 'text', category: 'content' },
      { key: 'headline', label: 'Main Headline', type: 'text', category: 'content' },
      { key: 'subheadline', label: 'Subheadline', type: 'textarea', category: 'content' },
      { key: 'primaryCtaText', label: 'Primary CTA Text', type: 'text', category: 'content' },
      { key: 'secondaryCtaText', label: 'Secondary CTA Text', type: 'text', category: 'content' },
    ],
    render: HeroSectionRenderer,
  },
  FeaturesSection: {
    type: 'FeaturesSection',
    displayName: 'Features Grid',
    category: 'marketing',
    icon: 'Layers',
    description: '3-column feature benefit cards',
    supportedModules: ['page', 'all'],
    defaultProps: {
      title: 'Built for High-Growth Product Teams',
      subtitle: 'Everything you need to onboard, activate, and retain users effortlessly.',
    },
    defaultStyles: { width: '100%', paddingTop: '40px', paddingBottom: '40px' },
    propertyFields: [
      { key: 'title', label: 'Section Title', type: 'text', category: 'content' },
      { key: 'subtitle', label: 'Section Subtitle', type: 'textarea', category: 'content' },
    ],
    render: FeaturesSectionRenderer,
  },
  PricingSection: {
    type: 'PricingSection',
    displayName: 'Pricing Table',
    category: 'marketing',
    icon: 'DollarSign',
    description: '3-tier pricing comparison cards',
    supportedModules: ['pricing', 'page', 'all'],
    defaultProps: {
      title: 'Simple, Transparent Pricing',
      subtitle: 'Start free and scale as your product adoption grows.',
    },
    defaultStyles: { width: '100%', paddingTop: '40px', paddingBottom: '40px' },
    propertyFields: [
      { key: 'title', label: 'Section Title', type: 'text', category: 'content' },
      { key: 'subtitle', label: 'Section Subtitle', type: 'text', category: 'content' },
    ],
    render: PricingSectionRenderer,
  },
  TestimonialsSection: {
    type: 'TestimonialsSection',
    displayName: 'Testimonials Grid',
    category: 'marketing',
    icon: 'MessageSquareQuote',
    description: 'Customer reviews with avatars & stars',
    supportedModules: ['testimonials', 'page', 'all'],
    defaultProps: {
      title: 'Loved by Product & Growth Teams',
      subtitle: 'See what modern product builders say about FlowPilot experiences.',
    },
    defaultStyles: { width: '100%', paddingTop: '40px', paddingBottom: '40px' },
    propertyFields: [
      { key: 'title', label: 'Section Title', type: 'text', category: 'content' },
      { key: 'subtitle', label: 'Section Subtitle', type: 'text', category: 'content' },
    ],
    render: TestimonialsSectionRenderer,
  },
  FormSection: {
    type: 'FormSection',
    displayName: 'Lead Capture Form',
    category: 'marketing',
    icon: 'Send',
    description: 'Contact form with validated input fields',
    supportedModules: ['form', 'page', 'popup', 'all'],
    defaultProps: {
      title: 'Get in Touch with our Product Specialists',
      buttonText: 'Submit Inquiry',
    },
    defaultStyles: { width: '100%', paddingTop: '32px', paddingBottom: '32px' },
    propertyFields: [
      { key: 'title', label: 'Form Title', type: 'text', category: 'content' },
      { key: 'buttonText', label: 'Button Label', type: 'text', category: 'content' },
    ],
    render: FormSectionRenderer,
  },
  CtaSection: {
    type: 'CtaSection',
    displayName: 'Call To Action',
    category: 'marketing',
    icon: 'Zap',
    description: 'High-conversion banner call-to-action',
    supportedModules: ['page', 'all'],
    defaultProps: {
      headline: 'Ready to 10x your activation rates?',
      subheadline: 'Join over 4,500 fast-growing software companies building with FlowPilot.',
      buttonText: 'Get Started for Free',
    },
    defaultStyles: { 
      width: '100%', 
      paddingTop: '48px', 
      paddingBottom: '48px', 
      backgroundColor: '#1e1b4b', 
      color: '#ffffff', 
      borderRadius: '16px' 
    },
    propertyFields: [
      { key: 'headline', label: 'Headline', type: 'text', category: 'content' },
      { key: 'subheadline', label: 'Subheadline', type: 'textarea', category: 'content' },
      { key: 'buttonText', label: 'Button Text', type: 'text', category: 'content' },
    ],
    render: CtaSectionRenderer,
  },
  FooterSection: {
    type: 'FooterSection',
    displayName: 'Footer Section',
    category: 'marketing',
    icon: 'Layout',
    description: 'Website footer with links and copyright',
    supportedModules: ['page', 'all'],
    defaultProps: {
      brandName: 'FlowPilot AI',
      copyright: '© 2026 FlowPilot. All rights reserved.',
    },
    defaultStyles: { width: '100%', paddingTop: '24px', paddingBottom: '24px' },
    propertyFields: [
      { key: 'brandName', label: 'Brand Name', type: 'text', category: 'content' },
      { key: 'copyright', label: 'Copyright Notice', type: 'text', category: 'content' },
    ],
    render: FooterSectionRenderer,
  },
};
