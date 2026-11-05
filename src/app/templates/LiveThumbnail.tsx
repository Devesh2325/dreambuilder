import React, { useEffect, useRef, useState } from 'react';
import { ProjectPreview } from '../../experience/ProjectPreview';
import { initialValues, TemplateDefinition } from '../../templates';

type PreviewProps = React.ComponentProps<typeof ProjectPreview>;

/** Iframes are heavy, so a preview only renders once it scrolls into view. */
export const LazyPreview: React.FC<PreviewProps & { boxClassName?: string; scale?: number }> = ({ boxClassName = 'h-48', scale = 0.33, ...preview }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.disconnect();
      }
    }, { rootMargin: '200px' });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} aria-hidden="true" className={`${boxClassName} overflow-hidden bg-slate-100 dark:bg-slate-800 relative`}>
      {isVisible ? (
        <div style={{ width: `${100 / scale}%`, height: `${100 / scale}%`, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
          <ProjectPreview {...preview} interactive={false} />
        </div>
      ) : <div className="absolute inset-0 animate-pulse bg-slate-200/70 dark:bg-slate-700/50" />}
    </div>
  );
};

export const LiveThumbnail: React.FC<{ template: TemplateDefinition; className?: string }> = ({ template, className = 'h-48' }) => (
  <LazyPreview
    boxClassName={className}
    type={template.type}
    documents={template.pages.map((page, position) => ({ ...page, position }))}
    theme={template.themes[0].theme}
    variables={initialValues(template)}
    settings={template.settings ?? {}}
    title={`${template.title} preview`}
  />
);
