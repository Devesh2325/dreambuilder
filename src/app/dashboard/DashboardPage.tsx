import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Building2, Check, CircleHelp, Eye, FolderKanban, LifeBuoy, Loader2, Rocket, Send, Sparkles, X } from 'lucide-react';
import { MODULE_LIST, MODULES } from '../../core/modules';
import { UsageBar, useCurrentPlan } from '../account/PlansPage';
import { ROUTES } from '../routes';
import { useServices, useSession } from '../session';
import { formatDate } from '../shared/format';
import { Icon } from '../shared/Icon';
import { MODULE_COLORS } from '../shared/moduleColors';
import { cardClass, DashboardSkeleton, ErrorNote, secondaryButton, StatTile } from '../shared/ui';
import { StatusBadge } from '../projects/ProjectsPage';
import { CreateButton } from '../templates/CreateButton';
import { AppTour, useAppTour } from '../tours/AppTour';
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
    <section aria-labelledby="guide-title" className={`${cardClass} overflow-hidden`}>
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
        <span className="block h-full rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 transition-all" style={{ width: `${(doneCount / steps.length) * 100}%` }} />
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

const greeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

const NewUserWorkspaceOnboarding: React.FC<{ userFullName?: string }> = ({ userFullName }) => {
  const services = useServices();
  const queryClient = useQueryClient();
  const defaultName = userFullName ? `${userFullName.split(' ')[0]}'s Workspace` : 'My Workspace';
  const [name, setName] = useState(defaultName);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    setErrorMsg(null);
    try {
      await services.workspaces.createWorkspace(name.trim());
      await queryClient.invalidateQueries({ queryKey: ['memberships'] });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl p-8 bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white border border-indigo-800/60 shadow-2xl relative overflow-hidden">
        <div aria-hidden="true" className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="max-w-2xl space-y-4 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Welcome to FlowPilot</span>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight">Let's set up your workspace</h2>
          <p className="text-slate-300 text-sm leading-relaxed">
            Your workspace brings together your websites, interactive tours, popups, and team. Give it a name to start building:
          </p>

          <form onSubmit={handleCreate} className="pt-2 max-w-md space-y-3">
            <div>
              <label htmlFor="ws-name-input" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Workspace Name
              </label>
              <input
                id="ws-name-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Acme Corp or My Studio"
                required
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>

            {errorMsg && (
              <div role="alert" className="p-3 rounded-xl bg-rose-950/50 border border-rose-800/60 text-rose-200 text-xs space-y-1">
                <p className="font-semibold">Notice</p>
                <p>{errorMsg}</p>
                {errorMsg.toLowerCase().includes('migrations') || errorMsg.toLowerCase().includes('schema') ? (
                  <p className="text-[11px] text-rose-300 pt-1">
                    Tip: Run <code>supabase/RUN_ALL_MIGRATIONS.sql</code> in your Supabase SQL editor to create the database tables.
                  </p>
                ) : null}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !name.trim()}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-sm transition-colors shadow-lg shadow-indigo-600/30"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating workspace...</span>
                </>
              ) : (
                <>
                  <Building2 className="w-4 h-4" />
                  <span>Create Workspace & Continue</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {MODULE_LIST.slice(0, 4).map((mod) => (
          <Link
            key={mod.type}
            to={ROUTES.templates}
            className={`${cardClass} p-5 hover:border-indigo-400 hover:shadow-md transition-all group`}
          >
            <span className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${MODULE_COLORS[mod.type]}`}>
              <Icon name={mod.icon} className="w-5 h-5" />
            </span>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {mod.plural}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{mod.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export const DashboardPage: React.FC = () => {
  const { projects, forms, analytics } = useServices();
  const { user } = useSession();
  const { workspace } = useWorkspace();
  const organizationId = workspace?.organizationId;
  const plan = useCurrentPlan();
  // Read on every render, because the workspace isn't known yet on the first one.
  const [justDismissed, setJustDismissed] = useState(false);
  const isDismissed = justDismissed || readDismissed(organizationId);

  const list = useQuery({ queryKey: ['projects', organizationId], queryFn: () => projects.list(organizationId!), enabled: Boolean(organizationId) });
  const responses = useQuery({ queryKey: ['project-details-responses', organizationId], queryFn: () => forms.countByProject(organizationId!), enabled: Boolean(organizationId) });
  const activity = useQuery({ queryKey: ['analytics', organizationId, 30], queryFn: () => analytics.summary(organizationId!, 30), enabled: Boolean(organizationId) });
  const tour = useAppTour('dashboard', list.isSuccess);

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
    <div className="space-y-6">
      {tour.isOpen && <AppTour id="dashboard" onDone={tour.finish} />}

      <header className="relative overflow-hidden rounded-3xl px-7 py-7 text-white bg-gradient-to-br from-indigo-700 via-indigo-600 to-fuchsia-600 shadow-lg shadow-indigo-600/20">
        <div aria-hidden="true" className="absolute -right-16 -top-24 w-72 h-72 rounded-full bg-white/10" />
        <div aria-hidden="true" className="absolute right-32 -bottom-28 w-56 h-56 rounded-full bg-white/10" />
        <div className="relative flex flex-wrap items-center justify-between gap-5">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-sm font-medium text-indigo-100"><Sparkles className="w-4 h-4" aria-hidden="true" />{greeting()}</p>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight">{firstName ? `Welcome, ${firstName}` : 'Welcome'}</h1>
            <p className="mt-1 text-sm text-indigo-100">Here's what's happening in {workspace?.name ?? 'your workspace'}.</p>
          </div>
          <button type="button" onClick={tour.start} className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl text-indigo-700 bg-white hover:bg-indigo-50 transition-colors">
            <CircleHelp className="w-4 h-4" aria-hidden="true" />
            Take a tour
          </button>
        </div>
      </header>

      {!organizationId && (
        <NewUserWorkspaceOnboarding userFullName={user?.fullName || undefined} />
      )}

      {list.isLoading && <DashboardSkeleton />}
      {list.isError && <ErrorNote message="We couldn't load your projects. Please refresh the page." />}

      {list.isSuccess && all.length === 0 && (
        <section className="relative overflow-hidden rounded-2xl border border-indigo-100 dark:border-indigo-900/40 bg-gradient-to-br from-indigo-50/60 via-white to-fuchsia-50/40 dark:from-indigo-950/20 dark:via-slate-900 dark:to-slate-900 p-7 shadow-sm">
          <div className="max-w-2xl space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
              <Rocket className="w-3.5 h-3.5" />
              <span>Get Started</span>
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Ready to create your first digital experience?
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Start with a high-converting website, an interactive product tour, or an announcement popup. Choose from 100+ production-ready templates.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <CreateButton label="Create your first project" />
              <Link
                to={ROUTES.templates}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-semibold text-slate-700 dark:text-slate-200 transition-colors"
              >
                <FolderKanban className="w-4 h-4 text-indigo-500" />
                <span>Browse Templates</span>
              </Link>
            </div>
          </div>
        </section>
      )}

      {list.isSuccess && (
        <dl data-tour="stats" className="grid gap-3 grid-cols-2 xl:grid-cols-4">
          <StatTile label="Projects" value={all.length} icon={<FolderKanban className="w-5 h-5" />} />
          <StatTile label="Live" value={live.length} icon={<Rocket className="w-5 h-5" />} iconClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300" />
          <StatTile label="Views, last 30 days" value={views} icon={<Eye className="w-5 h-5" />} iconClass="bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-300" />
          <StatTile label="Form responses" value={totalResponses} icon={<Send className="w-5 h-5" />} iconClass="bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300" />
        </dl>
      )}

      {list.isSuccess && !isDismissed && !isComplete && <GettingStarted steps={steps} onDismiss={dismiss} />}

      {list.isSuccess && (
        <>
          <section aria-labelledby="build-title" data-tour="build">
            <h2 id="build-title" className="font-semibold mb-3">What do you want to build?</h2>
            <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {MODULE_LIST.map((module) => {
                const count = all.filter((project) => project.type === module.type).length;
                return (
                  <li key={module.type}>
                    <Link to={module.path} aria-label={`${module.plural}: ${count}`} className={`${cardClass} group h-full flex items-start gap-3 p-4 hover:-translate-y-0.5 hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-all`}>
                      <span className={`shrink-0 w-10 h-10 flex items-center justify-center rounded-xl ${MODULE_COLORS[module.type]}`}><Icon name={module.icon} className="w-5 h-5" /></span>
                      <span className="flex-1 min-w-0">
                        <span className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold truncate">{module.plural}</span>
                          <span className="text-xs tabular-nums text-slate-500 dark:text-slate-400">{count}</span>
                        </span>
                        <span className="mt-0.5 block text-xs leading-relaxed text-slate-500 dark:text-slate-400">{module.description}</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] items-start">
            <section aria-labelledby="recent-title" className={`${cardClass} overflow-hidden`}>
              <h2 id="recent-title" className="px-5 pt-4 pb-2 font-semibold">Recent projects</h2>
              {all.length === 0 ? (
                <p className="px-5 pb-5 text-sm text-slate-500 dark:text-slate-400">Your projects will appear here.</p>
              ) : (
                <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                  {all.slice(0, 6).map((project) => (
                    <li key={project.id}>
                      <Link to={ROUTES.project(project.id)} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <span className={`shrink-0 w-8 h-8 flex items-center justify-center rounded-lg ${MODULE_COLORS[project.type]}`}><Icon name={MODULES[project.type].icon} /></span>
                        <span className="flex-1 min-w-0">
                          <span className="block text-sm font-medium truncate">{project.title}</span>
                          <span className="block text-xs text-slate-500 dark:text-slate-400">{MODULES[project.type].label} · Updated {formatDate(project.updatedAt)}</span>
                        </span>
                        <StatusBadge status={project.status} />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <div className="space-y-4">
              {plan && (
                <section aria-labelledby="plan-title" className={`${cardClass} p-5`}>
                  <div className="flex items-center justify-between gap-2">
                    <h2 id="plan-title" className="font-semibold">{plan.label} plan</h2>
                    <Link to={ROUTES.plans} className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">See plans</Link>
                  </div>
                  <div className="mt-3"><UsageBar label="Projects used" used={all.length} max={plan.maxProjects} /></div>
                </section>
              )}
              <section aria-labelledby="help-title" className={`${cardClass} p-5`}>
                <h2 id="help-title" className="font-semibold">Need a hand?</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">The guides cover every module. If you get stuck, ask us.</p>
                <div className="mt-3 grid gap-2">
                  <Link to={ROUTES.docs} className={secondaryButton}>Read the docs</Link>
                  <Link to={ROUTES.support} className={secondaryButton}><LifeBuoy className="w-4 h-4" aria-hidden="true" />Contact support</Link>
                </div>
              </section>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
