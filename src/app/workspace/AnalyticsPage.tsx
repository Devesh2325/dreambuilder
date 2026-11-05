import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowDownRight, ArrowUpRight, BarChart3, Download, Eye, Minus, MousePointerClick, Send, Users } from 'lucide-react';
import { MODULES } from '../../core/modules';
import { AnalyticsRow } from '../../data/services';
import { csvCell } from '../projects/projectHelpers';
import { ROUTES } from '../routes';
import { useServices } from '../session';
import { FlowPilotBanner } from '../shared/FlowPilotBanner';
import { formatDay } from '../shared/format';
import { Icon } from '../shared/Icon';
import { cardClass, ErrorNote, inputClass, LoadingArea, PageHeader, secondaryButton, Skeleton } from '../shared/ui';
import { useWorkspace } from '../workspace';

const EVENT_LABELS: Record<string, string> = {
  impression: 'Shown',
  page_viewed: 'Page views',
  cta_clicked: 'Button clicks',
  payment_clicked: 'Pay button clicks',
  form_submitted: 'Form submissions',
  tour_step_viewed: 'Tour steps viewed',
  tour_step_completed: 'Tour steps completed',
  tour_step_skipped: 'Tour steps skipped (missing target)',
  tour_completed: 'Tours completed',
  tour_skipped: 'Tours closed early',
  demo_step_viewed: 'Demo screens viewed',
  demo_completed: 'Demos completed',
  faq_expanded: 'Questions opened',
  banner_dismissed: 'Banners closed',
};

const VIEW_EVENTS = new Set(['page_viewed', 'impression']);
const CLICK_EVENTS = new Set(['cta_clicked', 'payment_clicked']);
const RESPONSE_EVENTS = new Set(['form_submitted']);

type Metric = 'views' | 'visitors' | 'clicks' | 'responses' | 'events';

const METRICS: Record<Metric, { label: string; unit: string; value: (row: AnalyticsRow) => number }> = {
  views: { label: 'Views', unit: 'views', value: (row) => (VIEW_EVENTS.has(row.eventType) ? row.events : 0) },
  visitors: { label: 'Visitors', unit: 'visitors', value: (row) => (VIEW_EVENTS.has(row.eventType) ? row.visitors : 0) },
  clicks: { label: 'Button clicks', unit: 'clicks', value: (row) => (CLICK_EVENTS.has(row.eventType) ? row.events : 0) },
  responses: { label: 'Form responses', unit: 'responses', value: (row) => (RESPONSE_EVENTS.has(row.eventType) ? row.events : 0) },
  events: { label: 'All activity', unit: 'events', value: (row) => row.events },
};

const dayKey = (date: Date) => date.toISOString().slice(0, 10);

/** The last `count` calendar days, oldest first, ending `endOffset` days before today. */
const daysBack = (count: number, endOffset = 0) => {
  const today = Date.now();
  return Array.from({ length: count }, (_, index) => dayKey(new Date(today - (endOffset + count - 1 - index) * 86_400_000)));
};

const sum = (rows: AnalyticsRow[], value: (row: AnalyticsRow) => number) => rows.reduce((total, row) => total + value(row), 0);

// Round up to a number that reads well on the axis.
const niceCeiling = (value: number) => {
  if (value <= 4) return 4;
  const size = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 2.5, 5, 10].find((option) => option * size >= value) ?? 10;
  return step * size;
};

const Kpi: React.FC<{ label: string; icon: React.ReactNode; value: number; previous: number; days: number; help?: string }> = ({ label, icon, value, previous, days, help }) => {
  let change: React.ReactNode;
  if (previous === 0) {
    change = <span className="text-slate-500 dark:text-slate-400">{value > 0 ? `New in the last ${days} days` : `None in the last ${days} days`}</span>;
  } else {
    const percent = Math.round(((value - previous) / previous) * 100);
    const Arrow = percent > 0 ? ArrowUpRight : percent < 0 ? ArrowDownRight : Minus;
    change = (
      <>
        <span className={`inline-flex items-center gap-0.5 font-semibold ${percent > 0 ? 'text-emerald-700 dark:text-emerald-400' : percent < 0 ? 'text-rose-700 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'}`}>
          <Arrow className="w-3.5 h-3.5" aria-hidden="true" />
          {percent > 0 ? '+' : ''}{percent}%
        </span>
        <span className="text-slate-500 dark:text-slate-400"> from the {days} days before</span>
      </>
    );
  }
  return (
    <div className={`${cardClass} p-4`} title={help}>
      <dt className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
        <span className="text-slate-400" aria-hidden="true">{icon}</span>
        {label}
      </dt>
      <dd>
        <span className="block mt-1.5 text-3xl font-bold tabular-nums tracking-tight">{value.toLocaleString()}</span>
        <span className="block mt-1 text-xs">{change}</span>
      </dd>
    </div>
  );
};

const DailyBars: React.FC<{ series: { day: string; value: number }[]; unit: string }> = ({ series, unit }) => {
  const ceiling = niceCeiling(Math.max(...series.map((point) => point.value), 1));
  const ticks = [1, 0.5, 0].map((share) => Math.round(ceiling * share));
  const edge = Math.max(2, Math.floor(series.length / 8));
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-2">
      <div aria-hidden="true" className="h-56 flex flex-col justify-between text-right text-[11px] tabular-nums text-slate-500 dark:text-slate-400 -my-1.5">
        {ticks.map((tick) => <span key={tick}>{tick.toLocaleString()}</span>)}
      </div>
      <div className="relative h-56">
        <div aria-hidden="true" className="absolute inset-0 flex flex-col justify-between">
          <span className="block border-t border-slate-100 dark:border-slate-800" />
          <span className="block border-t border-slate-100 dark:border-slate-800" />
          <span className="block border-t border-slate-300 dark:border-slate-700" />
        </div>
        <ul aria-label={`${unit} per day`} className="absolute inset-0 flex items-end">
          {series.map((point, index) => {
            const align = index < edge ? 'left-0' : index >= series.length - edge ? 'right-0' : 'left-1/2 -translate-x-1/2';
            return (
              <li key={point.day} tabIndex={0} className="group relative flex-1 min-w-0 h-full flex items-end justify-center px-px outline-none">
                {/* The whole column reacts, so thin bars are still easy to hover. */}
                <span aria-hidden="true" className="absolute inset-y-0 inset-x-0 group-hover:bg-slate-100/70 group-focus:bg-slate-100/70 dark:group-hover:bg-slate-800/50 dark:group-focus:bg-slate-800/50" />
                <span className={`relative w-full max-w-[32px] rounded-t bg-indigo-500 group-hover:bg-indigo-600 ${point.value ? '' : 'hidden'}`} style={{ height: `${Math.max(1.5, (point.value / ceiling) * 100)}%` }} />
                <span role="tooltip" className={`pointer-events-none absolute z-10 bottom-full mb-1 ${align} hidden group-hover:block group-focus:block whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs shadow-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900`}>
                  <strong className="font-semibold tabular-nums">{point.value.toLocaleString()} {unit}</strong>
                  <span className="block opacity-80">{formatDay(point.day, true)}</span>
                </span>
              </li>
            );
          })}
        </ul>
      </div>
      <span />
      <div aria-hidden="true" className="mt-1.5 flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
        <span>{formatDay(series[0].day)}</span>
        <span>{formatDay(series[Math.floor(series.length / 2)].day)}</span>
        <span>{formatDay(series[series.length - 1].day)}</span>
      </div>
    </div>
  );
};

/** One number out of another, such as tours finished out of tours started. */
const Completion: React.FC<{ label: string; done: number; total: number; unit: string }> = ({ label, done, total, unit }) => {
  const share = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className="font-medium">{label}</span>
        <span className="font-bold tabular-nums">{share}%</span>
      </div>
      <div aria-hidden="true" className="mt-1.5 h-2 rounded-r bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <span className="block h-full rounded-r bg-indigo-500" style={{ width: `${share}%` }} />
      </div>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{done.toLocaleString()} of {total.toLocaleString()} {unit}</p>
    </div>
  );
};

export const AnalyticsPage: React.FC = () => {
  const { analytics, projects } = useServices();
  const { workspace } = useWorkspace();
  const organizationId = workspace?.organizationId;
  const [days, setDays] = useState(30);
  const [projectFilter, setProjectFilter] = useState('');
  const [metric, setMetric] = useState<Metric>('views');
  const [view, setView] = useState<'chart' | 'table'>('chart');

  // Twice the period, so the one before it can be compared.
  const summary = useQuery({
    queryKey: ['analytics', organizationId, days * 2],
    queryFn: () => analytics.summary(organizationId!, days * 2),
    enabled: Boolean(organizationId),
  });
  const projectList = useQuery({
    queryKey: ['projects', organizationId],
    queryFn: () => projects.list(organizationId!),
    enabled: Boolean(organizationId),
  });

  const { rows, previous, totalEver } = useMemo(() => {
    const all = (summary.data ?? []).filter((row) => !projectFilter || row.projectId === projectFilter);
    const current = new Set(daysBack(days));
    const before = new Set(daysBack(days, days));
    return { rows: all.filter((row) => current.has(row.day)), previous: all.filter((row) => before.has(row.day)), totalEver: all.length };
  }, [summary.data, projectFilter, days]);

  const series = useMemo(() => {
    const byDay = new Map<string, number>();
    for (const row of rows) byDay.set(row.day, (byDay.get(row.day) ?? 0) + METRICS[metric].value(row));
    return daysBack(days).map((day) => ({ day, value: byDay.get(day) ?? 0 }));
  }, [rows, metric, days]);

  const events = useMemo(() => {
    const byEvent = new Map<string, number>();
    for (const row of rows) byEvent.set(row.eventType, (byEvent.get(row.eventType) ?? 0) + row.events);
    return [...byEvent.entries()].sort((a, b) => b[1] - a[1]);
  }, [rows]);
  const peakEvent = Math.max(1, ...events.map(([, count]) => count));

  const byProject = useMemo(() => (projectList.data ?? []).map((project) => {
    const own = rows.filter((row) => row.projectId === project.id);
    return {
      project,
      views: sum(own, METRICS.views.value),
      visitors: sum(own, METRICS.visitors.value),
      clicks: sum(own, METRICS.clicks.value),
      responses: sum(own, METRICS.responses.value),
      total: sum(own, METRICS.events.value),
    };
  }).filter((row) => row.total > 0).sort((a, b) => b.total - a.total), [projectList.data, rows]);

  const count = (type: string) => sum(rows.filter((row) => row.eventType === type), (row) => row.events);
  const toursStarted = count('tour_completed') + count('tour_skipped');
  const formViews = useMemo(() => {
    const formIds = new Set((projectList.data ?? []).filter((project) => project.type === 'form').map((project) => project.id));
    return sum(rows.filter((row) => formIds.has(row.projectId)), METRICS.views.value);
  }, [projectList.data, rows]);

  const download = () => {
    const titles = new Map((projectList.data ?? []).map((project) => [project.id, project.title]));
    const lines = [['Day', 'Project', 'Activity', 'Count', 'Visitors'].join(',')];
    for (const row of [...rows].sort((a, b) => a.day.localeCompare(b.day))) {
      lines.push([row.day, titles.get(row.projectId) ?? row.projectId, EVENT_LABELS[row.eventType] ?? row.eventType, String(row.events), String(row.visitors)].map(csvCell).join(','));
    }
    const url = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/csv' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `flowpilot-analytics-${days}-days.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const unit = METRICS[metric].unit;
  const hasData = rows.length > 0;

  return (
    <>
      <PageHeader title="Analytics" subtitle="Real activity from your published sites and embeds." actions={hasData && (
        <button type="button" className={secondaryButton} onClick={download}><Download className="w-4 h-4" aria-hidden="true" />Export CSV</button>
      )} />
      <div className="flex flex-wrap gap-2 mb-5">
        <select aria-label="Period" className={`${inputClass} !w-auto`} value={days} onChange={(e) => setDays(Number(e.target.value))}>
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
        <select aria-label="Project" className={`${inputClass} !w-auto max-w-xs`} value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)}>
          <option value="">All projects</option>
          {projectList.data?.map((project) => <option key={project.id} value={project.id}>{project.title} ({MODULES[project.type].label})</option>)}
        </select>
      </div>

      {summary.isLoading && (
        <LoadingArea className="space-y-5">
          <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">{[0, 1, 2, 3].map((n) => <Skeleton key={n} className="h-28 !rounded-2xl" />)}</div>
          <Skeleton className="h-80 !rounded-2xl" />
        </LoadingArea>
      )}
      {summary.isError && <ErrorNote message="We couldn't load analytics." />}

      {summary.isSuccess && !hasData && (
        <FlowPilotBanner
          title="No activity yet"
          text={totalEver > 0 ? 'Nothing happened in this period. Try a longer one.' : 'Numbers appear here once visitors reach something you have published.'}
          steps={['Publish a project', 'Share its link, or add it to your site', 'Come back to see what people do']}
          actions={[{ label: 'See your websites', href: ROUTES.module('website'), primary: true }, { label: 'How to add it to your site', href: ROUTES.doc('install') }]}
        />
      )}

      {hasData && (
        <div className="space-y-5">
          <dl className="grid gap-3 grid-cols-2 xl:grid-cols-4">
            <Kpi label="Views" icon={<Eye className="w-4 h-4" />} value={sum(rows, METRICS.views.value)} previous={sum(previous, METRICS.views.value)} days={days} />
            <Kpi label="Visitors" icon={<Users className="w-4 h-4" />} value={sum(rows, METRICS.visitors.value)} previous={sum(previous, METRICS.visitors.value)} days={days} help="Someone who comes back on another day counts again." />
            <Kpi label="Button clicks" icon={<MousePointerClick className="w-4 h-4" />} value={sum(rows, METRICS.clicks.value)} previous={sum(previous, METRICS.clicks.value)} days={days} />
            <Kpi label="Form responses" icon={<Send className="w-4 h-4" />} value={sum(rows, METRICS.responses.value)} previous={sum(previous, METRICS.responses.value)} days={days} />
          </dl>

          <section aria-labelledby="trend-title" className={`${cardClass} p-5`}>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              <div>
                <h2 id="trend-title" className="font-semibold">{METRICS[metric].label} per day</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">{sum(rows, METRICS[metric].value).toLocaleString()} {unit} in the last {days} days. Counted per day in UTC.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select aria-label="What to show" className={`${inputClass} !w-auto`} value={metric} onChange={(e) => setMetric(e.target.value as Metric)}>
                  {(Object.keys(METRICS) as Metric[]).map((key) => <option key={key} value={key}>{METRICS[key].label}</option>)}
                </select>
                <div role="group" aria-label="Show as" className="inline-flex p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800">
                  {(['chart', 'table'] as const).map((option) => (
                    <button key={option} type="button" aria-pressed={view === option} onClick={() => setView(option)} className={`px-3 py-1.5 text-xs font-semibold rounded-md capitalize transition-colors ${view === option ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}>{option}</button>
                  ))}
                </div>
              </div>
            </div>
            {view === 'chart' ? <DailyBars series={series} unit={unit} /> : (
              <div className="max-h-72 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-white dark:bg-slate-900 text-xs text-left text-slate-500 dark:text-slate-400">
                    <tr><th scope="col" className="py-2 font-medium">Day</th><th scope="col" className="py-2 font-medium text-right">{METRICS[metric].label}</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {[...series].reverse().map((point) => <tr key={point.day}><td className="py-1.5">{formatDay(point.day, true)}</td><td className="py-1.5 text-right tabular-nums font-semibold">{point.value.toLocaleString()}</td></tr>)}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            <section aria-labelledby="events-title" className={`${cardClass} p-5`}>
              <h2 id="events-title" className="font-semibold mb-3">What people did</h2>
              <table className="w-full text-sm">
                <thead className="sr-only"><tr><th scope="col">Activity</th><th scope="col">Share</th><th scope="col">Count</th></tr></thead>
                <tbody>
                  {events.map(([type, total]) => (
                    <tr key={type}>
                      <td className="py-1.5 pr-3 whitespace-nowrap">{EVENT_LABELS[type] ?? type}</td>
                      <td className="py-1.5 w-full" aria-hidden="true">
                        <span className="block h-3 rounded-r bg-indigo-500" style={{ width: `${Math.max(1, (total / peakEvent) * 100)}%` }} />
                      </td>
                      <td className="py-1.5 pl-3 text-right font-semibold tabular-nums">{total.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
            <section aria-labelledby="finish-title" className={`${cardClass} p-5`}>
              <h2 id="finish-title" className="font-semibold mb-3">How well it's working</h2>
              <div className="space-y-4">
                {toursStarted > 0 && <Completion label="Tours finished" done={count('tour_completed')} total={toursStarted} unit="tours people finished or closed" />}
                {formViews > 0 && <Completion label="Form views that became responses" done={sum(rows.filter((row) => (projectList.data ?? []).some((project) => project.id === row.projectId && project.type === 'form')), METRICS.responses.value)} total={formViews} unit="views of your forms" />}
                {sum(rows, METRICS.views.value) > 0 && <Completion label="Views with a button click" done={sum(rows, METRICS.clicks.value)} total={sum(rows, METRICS.views.value)} unit="views" />}
                {toursStarted === 0 && formViews === 0 && sum(rows, METRICS.views.value) === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">This fills in once people view your pages, forms and tours.</p>}
              </div>
            </section>
          </div>

          <section aria-labelledby="projects-title" className={`${cardClass} overflow-hidden`}>
            <h2 id="projects-title" className="flex items-center gap-2 px-5 pt-4 pb-2 font-semibold"><BarChart3 className="w-4 h-4 text-slate-400" aria-hidden="true" />By project</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 dark:text-slate-400">
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    <th scope="col" className="px-5 py-2.5 font-medium">Project</th>
                    <th scope="col" className="px-5 py-2.5 font-medium text-right">Views</th>
                    <th scope="col" className="px-5 py-2.5 font-medium text-right">Visitors</th>
                    <th scope="col" className="px-5 py-2.5 font-medium text-right">Clicks</th>
                    <th scope="col" className="px-5 py-2.5 font-medium text-right">Responses</th>
                    <th scope="col" className="px-5 py-2.5 font-medium text-right">All activity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {byProject.map((row) => (
                    <tr key={row.project.id}>
                      <th scope="row" className="px-5 py-2.5 font-medium">
                        <Link to={ROUTES.project(row.project.id)} className="flex items-center gap-2 hover:text-indigo-600 dark:hover:text-indigo-400">
                          <span className="text-slate-400"><Icon name={MODULES[row.project.type].icon} /></span>
                          <span className="truncate">{row.project.title}</span>
                        </Link>
                      </th>
                      <td className="px-5 py-2.5 text-right tabular-nums">{row.views.toLocaleString()}</td>
                      <td className="px-5 py-2.5 text-right tabular-nums">{row.visitors.toLocaleString()}</td>
                      <td className="px-5 py-2.5 text-right tabular-nums">{row.clicks.toLocaleString()}</td>
                      <td className="px-5 py-2.5 text-right tabular-nums">{row.responses.toLocaleString()}</td>
                      <td className="px-5 py-2.5 text-right tabular-nums font-semibold">{row.total.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </>
  );
};
