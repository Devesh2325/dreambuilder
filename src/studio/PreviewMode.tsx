import React, { useEffect, useState } from 'react';
import { Monitor, RotateCcw, Smartphone, Tablet, X } from 'lucide-react';
import { Device } from '../core/schema';
import { MODULES } from '../core/modules';
import { ProjectPreview } from '../experience/ProjectPreview';
import { secondaryButton } from '../app/shared/ui';
import { useStudio } from './store';

const DEVICE_BUTTONS = [
  { device: 'desktop', label: 'Desktop', icon: Monitor },
  { device: 'tablet', label: 'Tablet', icon: Tablet },
  { device: 'mobile', label: 'Mobile', icon: Smartphone },
] as const;

/** A clean screen with only what's being previewed, covering the editor's own controls. */
export const PreviewMode: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const project = useStudio((s) => s.project);
  const draft = useStudio((s) => s.draft);
  const documents = useStudio((s) => s.documents);
  const activeDocumentId = useStudio((s) => s.activeDocumentId);
  const startDevice = useStudio((s) => s.device);
  const [device, setDevice] = useState<Device>(startDevice);
  const [restartKey, setRestartKey] = useState(0);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!project || !draft) return null;
  const activeSlug = documents.find((doc) => doc.id === activeDocumentId)?.slug;
  const plays = MODULES[project.type].delivery !== 'site' && project.type !== 'faq' && project.type !== 'menu';

  return (
    <div role="dialog" aria-modal="true" aria-label="Preview" className="fixed inset-0 z-50 flex flex-col bg-slate-100 dark:bg-slate-950">
      <header className="h-14 shrink-0 grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="min-w-0">
          <p className="text-xs text-slate-500 dark:text-slate-400">Preview. Visitors can't see this yet.</p>
          <p className="text-sm font-semibold truncate">{draft.title}</p>
        </div>
        <div role="group" aria-label="Preview size" className="flex items-center gap-0.5 p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800">
          {DEVICE_BUTTONS.map(({ device: value, label, icon: DeviceIcon }) => (
            <button key={value} type="button" aria-pressed={device === value} onClick={() => setDevice(value)}
              className={`h-8 px-2.5 inline-flex items-center gap-1.5 rounded-md text-[13px] font-medium ${device === value ? 'bg-white dark:bg-slate-600 text-indigo-700 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-300'}`}>
              <DeviceIcon className="w-4 h-4" aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>
        <div className="flex items-center justify-end gap-2">
          {plays && (
            <button type="button" className={`${secondaryButton} !py-1.5`} onClick={() => setRestartKey(restartKey + 1)}>
              <RotateCcw className="w-4 h-4" aria-hidden="true" />
              Restart
            </button>
          )}
          <button type="button" className={`${secondaryButton} !py-1.5`} onClick={onClose}>
            <X className="w-4 h-4" aria-hidden="true" />
            Close preview
          </button>
        </div>
      </header>
      <div className="flex-1 min-h-0 p-3 flex justify-center">
        <ProjectPreview
          type={project.type}
          documents={documents}
          theme={draft.theme}
          variables={draft.variables}
          settings={draft.settings}
          device={device}
          initialSlug={activeSlug}
          restartKey={restartKey}
          hideReplay
          frameStyle={{ borderRadius: 10, boxShadow: '0 1px 3px rgba(15,23,42,.12), 0 16px 40px -16px rgba(15,23,42,.3)' }}
        />
      </div>
    </div>
  );
};
