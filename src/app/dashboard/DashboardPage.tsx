import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Check, X } from 'lucide-react';
import { MODULE_LIST, MODULES } from '../../core/modules';
import { ROUTES } from '../routes';
import { useServices, useSession } from '../session';
import { Icon } from '../shared/Icon';
import { cardClass, DashboardSkeleton, ErrorNote, secondaryButton, StatTile } from '../shared/ui';
import { StatusBadge } from '../projects/ProjectsPage';
import { CreateButton } from '../templates/CreateButton';
import { useWorkspace } from '../workspace';

const guideKey = (organizationId: string) => `fp_guide_dismissed_${organizationId}`;

const readDismissed = (organizationId: string | undefined) => {
  try {
    return organizationId ? localStorage.getItem(guideKey(organizationId)) === '1' : false;
  } catch {
    return false;
  }
};

interface GuideStep {
  title: string;
  description: string;
  done: boolean;
  action: React.ReactNode;
}

const linkAction = 'inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline';

const GettingStarted: React.FC<{ steps: GuideStep[]; onDismiss: () => void }> = ({ steps, onDismiss }) => {
  const doneCount = steps.filter((step) => step.done).length;
  const nextIndex = steps.findIndex((step) => !step.done);

  return (
    <section aria-labelledby="guide-title" className={`${cardClass} overflow-hidden mb-6`}>
      <div className="flex items-start justify-between gap-3 px-6 pt-5">
        <div>
          <h2 id="guide-title" className="text-lg font-semibold">Get started in {steps.length} steps</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">{doneCount} of {steps.length} done. Most people finish in a few minutes.</p>
        </div>
        <button type="button" aria-label="Hide this guide" title="Hide this guide" className="p-1 rounded-md text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" onClick={onDismiss}>
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="mx-6 mt-3 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden" role="progressbar" aria-label="Setup progress" aria-valuenow={doneCount} aria-valuemin={0} aria-valuemax={steps.length}>
        <span className="block h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${(doneCount / steps.length) * 100}%` }} />
      </div>
      <ol className="mt-3 pb-2">
        {steps.map((step, index) => (
          <li key={step.title} className={`flex items-center gap-4 px-6 py-3 ${index === nextIndex ? 'bg-indigo-50/60 dark:bg-indigo-500/5' : ''}`}>
            <span
              aria-hidden="true"
              className={`shrink-0 w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold ${step.done ? 'bg-emerald-500 text-white' : index === nextIndex ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}
            >
              {step.done ? <Check className="w-4 h-4" /> : index + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${step.done ? 'text-slate-500 dark:text-slate-400 line-through' : ''}`}>
                {step.title}
                <span className="sr-only">{step.done ? ' (done)' : ''}</span>
              </p>
              {!step.done && <p className="text-sm text-slate-500 dark:text-slate-400">{step.description}</p>}
            </div>
            {!step.done && <div className="shrink-0">{step.action}</div>}
          </li>
        ))}
      </ol>
    </section>
  );
};

export const DashboardPage: React.FC = () => {
  const { projects, forms, analytics } = useServices();
  const { user } = useSession();
  const { workspace } = useWorkspace();
  const organizationId = workspace?.organizationId;
  // Read on every render, because the workspace isn't known yet on the first one.
  const [justDismissed, setJustDismissed] = useState(false);
  const isDismissed = justDismissed || readDismissed(organizationId);

  const list = useQuery({ queryKey: ['projects', organizationId], queryFn: () => projects.list(organizationId!), enabled: Boolean(organizationId) });
  const responses = useQuery({ queryKey: ['project-details-responses', organizationId], queryFn: () => forms.countByProject(organizationId!), enabled: Boolean(organizationId) });
  const activity = useQuery({ queryKey: ['analytics', organizationId, 30], queryFn: () => analytics.summary(organizationId!, 30), enabled: Boolean(organizationId) });

  const all = useMemo(() => list.data ?? [], [list.data]);
  const live = all.filter((project) => project.status === 'published');
  const totalResponses = Object.values(responses.data ?? {}).reduce((sum, count) => sum + count, 0);
  const views = (activity.data ?? []).filter((row) => row.eventType === 'page_viewed' || row.eventType === 'impression').reduce((sum, row) => sum + row.events, 0);
  const hasBrand = Boolean(workspace?.branding.companyName || workspace?.branding.primaryColor);

  const steps: GuideStep[] = [
    {
      title: 'Create your first project',
      description: 'Pick a template and fill in your details.',
      done: all.length > 0,
      action: <CreateButton label="Choose a template" />,
    },
    {
      title: 'Add your brand',
      description: 'New projects will start with your logo, color and font.',
      done: hasBrand,
      action: <Link to={ROUTES.brand} className={linkAction}>Set up brand kit <ArrowRight className="w-4 h-4" aria-hidden="true" /></Link>,
    },
    {
      title: 'Publish it',
      description: 'Open your project and click Publish to get a live link.',
      done: live.length > 0,
      action: all[0]
        ? <Link to={ROUTES.project(all[0].id)} className={linkAction}>Open project <ArrowRight className="w-4 h-4" aria-hidden="true" /></Link>
        : <span className="text-sm text-slate-400">Create one first</span>,
    },
    {
      title: 'Get your first visitor',
      description: 'Share your link, or add the script to your own site.',
      done: views > 0,
      action: <Link to={ROUTES.doc('install')} className={linkAction}>How to install <ArrowRight className="w-4 h-4" aria-hidden="true" /></Link>,
    },
  ];
  const isComplete = steps.every((step) => step.done);

  const dismiss = () => {
    setJustDismissed(true);
    try {
      if (organizationId) localStorage.setItem(guideKey(organizationId), '1');
    } catch {
      // Only a convenience: the guide just comes back next time.
    }
  };

  const firstName = user?.fullName?.split(' ')[0];

  return (
    <>
      <header className="mb-6">
        <h1 className="text-2xl font-bold">{firstName ? `Welcome, ${firstName}` : 'Welcome'}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Here's what's happening in {workspace?.name ?? 'your workspace'}.</p>
      </header>

      {list.isLoading && <DashboardSkeleton />}
      {list.isError && <ErrorNote message="We couldn't load your projects. Please refresh the page." />}

      {list.isSuccess && !isDismissed && !isComplete && <GettingStarted steps={steps} onDismiss={dismiss} />}

      {list.isSuccess && (
        <>
          <dl className="grid gap-3 grid-cols-2 lg:grid-cols-4 mb-6">
            <StatTile label="Projects" value={all.length} />
            <StatTile label="Live" value={live.length} />
            <StatTile label="Views, last 30 days" value={views} />
            <StatTile label="Form responses" value={totalResponses} />
          </dl>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
            <section aria-labelledby="recent-title" className={`${cardClass} overflow-hidden`}>
              <h2 id="recent-title" className="px-5 pt-4 pb-2 font-semibold">Recent projects</h2>
              {all.length === 0 ? (
                <p className="px-5 pb-5 text-sm text-slate-500 dark:text-slate-400">Your projects will appear here.</p>
              ) : (
                <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                  {all.slice(0, 7).map((project) => (
                    <li key={project.id}>
                      <Link to={ROUTES.project(project.id)} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <span className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300"><Icon name={MODULES[project.type].icon} /></span>
                        <span className="flex-1 min-w-0">
                          <span className="block text-sm font-medium truncate">{project.title}</span>
                          <span className="block text-xs text-slate-500 dark:text-slate-400">{MODULES[project.type].label} · Updated {new Date(project.updatedAt).toLocaleDateString()}</span>
                        </span>
                        <StatusBadge status={project.status} />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section aria-labelledby="build-title">
              <h2 id="build-title" className="font-semibold mb-3">What do you want to build?</h2>
              <ul className="grid gap-2">
                {MODULE_LIST.map((module) => {
                  const count = all.filter((project) => project.type === module.type).length;
                  return (
                    <li key={module.type}>
                      <Link to={module.path} aria-label={`${module.plural}: ${count}`} className={`${cardClass} !rounded-xl flex items-center gap-3 px-3 py-2.5 hover:border-indigo-400 transition-colors`}>
                        <span className="shrink-0 text-indigo-600 dark:text-indigo-300"><Icon name={module.icon} /></span>
                        <span className="flex-1 text-sm font-medium">{module.plural}</span>
                        <span className="text-xs tabular-nums text-slate-500 dark:text-slate-400">{count}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
              <Link to={ROUTES.docs} className={`${secondaryButton} w-full mt-3`}>Read the docs</Link>
            </section>
          </div>
        </>
      )}
    </>
  );
};
