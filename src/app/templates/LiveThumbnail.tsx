import React, { useEffect, useRef, useState } from 'react';
import { ProjectPreview } from '../../experience/ProjectPreview';
import { initialValues, TemplateDefinition } from '../../templates';

/** Iframes are heavy, so a thumbnail only renders once it scrolls into view. */
export const LiveThumbnail: React.FC<{ template: TemplateDefinition; className?: string }> = ({ template, className = 'h-48' }) => {
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

  const scale = 0.33;
  return (
    <div ref={ref} aria-hidden="true" className={`${className} overflow-hidden bg-slate-100 dark:bg-slate-800 relative`}>
      {isVisible && (
        <div style={{ width: `${100 / scale}%`, height: `${100 / scale}%`, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
          <ProjectPreview
            type={template.type}
            documents={template.pages.map((page, position) => ({ ...page, position }))}
            theme={template.themes[0].theme}
            variables={initialValues(template)}
            settings={template.settings ?? {}}
            interactive={false}
            title={`${template.title} preview`}
          />
        </div>
      )}
    </div>
  );
};
