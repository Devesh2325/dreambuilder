import React from 'react';
import { Loader2 } from 'lucide-react';
import { Icon } from './Icon';

export const inputClass =
  'w-full px-3 py-2 text-sm rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500';

export const primaryButton =
  'inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 rounded-lg transition-colors';

export const secondaryButton =
  'inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-60 transition-colors';

export const dangerButton =
  'inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 disabled:opacity-60 transition-colors';

export const cardClass = 'bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm shadow-slate-900/[.03]';

export const PageHeader: React.FC<{ title: string; subtitle?: string; icon?: string; actions?: React.ReactNode }> = ({ title, subtitle, icon, actions }) => (
  <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
    <div className="flex items-center gap-3 min-w-0">
      {icon && <span className="shrink-0 w-11 h-11 flex items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300"><Icon name={icon} className="w-5 h-5" /></span>}
      <div className="min-w-0">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
      </div>
    </div>
    {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
  </div>
);

export const StatTile: React.FC<{ label: string; value: number | string; icon?: React.ReactNode; iconClass?: string }> = ({ label, value, icon, iconClass = 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300' }) => (
  <div className={`${cardClass} !rounded-xl px-4 py-3 flex items-center gap-3`}>
    {icon && <span aria-hidden="true" className={`shrink-0 w-10 h-10 flex items-center justify-center rounded-xl ${iconClass}`}>{icon}</span>}
    <div className="min-w-0">
      <dt className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">{label}</dt>
      <dd className="mt-0.5 text-2xl font-semibold tabular-nums">{typeof value === 'number' ? value.toLocaleString() : value}</dd>
    </div>
  </div>
);

export const ErrorNote: React.FC<{ message?: string | null }> = ({ message }) =>
  message ? (
    <p role="alert" className="text-sm text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 rounded-lg px-3 py-2">
      {message}
    </p>
  ) : null;

export const EmptyState: React.FC<{ title: string; icon?: string; children?: React.ReactNode }> = ({ title, icon, children }) => (
  <div className={`${cardClass} px-6 py-14 text-center`}>
    {icon && <span className="mx-auto mb-4 w-12 h-12 flex items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300"><Icon name={icon} className="w-6 h-6" /></span>}
    <h2 className="font-semibold text-slate-900 dark:text-white">{title}</h2>
    <div className="mt-2 text-sm text-slate-500 dark:text-slate-400">{children}</div>
  </div>
);

export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div aria-hidden="true" className={`animate-pulse rounded-lg bg-slate-200/80 dark:bg-slate-800 ${className}`} />
);

/** Announces loading once, while the skeleton shapes inside stay silent. */
export const LoadingArea: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div role="status" aria-label="Loading" className={className}>{children}</div>
);

export const LoadingNote: React.FC = () => (
  <LoadingArea className="space-y-2.5">
    <Skeleton className="h-4 w-1/3" />
    <Skeleton className="h-4 w-2/3" />
    <Skeleton className="h-4 w-1/2" />
  </LoadingArea>
);

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 6 }) => (
  <LoadingArea>
    <dl className="grid gap-3 grid-cols-2 lg:grid-cols-4 mb-5">
      {[0, 1, 2, 3].map((n) => <Skeleton key={n} className="h-[74px] !rounded-xl" />)}
    </dl>
    <div className={`${cardClass} p-5 space-y-4`}>
      <Skeleton className="h-8 w-64" />
      {Array.from({ length: rows }, (_, n) => (
        <div key={n} className="flex items-center gap-4">
          <Skeleton className="w-8 h-8 shrink-0" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-24" />
        </div>
      ))}
    </div>
  </LoadingArea>
);

export const CardsSkeleton: React.FC<{ count?: number; className?: string }> = ({ count = 6, className = 'grid gap-5 sm:grid-cols-2 lg:grid-cols-3' }) => (
  <LoadingArea className={className}>
    {Array.from({ length: count }, (_, n) => (
      <div key={n} className={`${cardClass} overflow-hidden`}>
        <Skeleton className="h-40 !rounded-none" />
        <div className="p-4 space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-full" />
        </div>
      </div>
    ))}
  </LoadingArea>
);

export const DashboardSkeleton: React.FC = () => (
  <LoadingArea>
    <dl className="grid gap-3 grid-cols-2 lg:grid-cols-4 mb-6">
      {[0, 1, 2, 3].map((n) => <Skeleton key={n} className="h-[74px] !rounded-xl" />)}
    </dl>
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className={`${cardClass} p-5 space-y-4`}>
        {[0, 1, 2, 3, 4].map((n) => (
          <div key={n} className="flex items-center gap-3">
            <Skeleton className="w-8 h-8 shrink-0" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-5 w-14 !rounded-full" />
          </div>
        ))}
      </div>
      <div className="space-y-2">{[0, 1, 2, 3, 4, 5].map((n) => <Skeleton key={n} className="h-11 !rounded-xl" />)}</div>
    </div>
  </LoadingArea>
);

export const ProjectSkeleton: React.FC = () => (
  <LoadingArea>
    <Skeleton className="h-4 w-48 mb-4" />
    <div className="flex items-center gap-3 mb-6">
      <Skeleton className="w-11 h-11 !rounded-xl" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-56" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-9 w-28" />
      <Skeleton className="h-9 w-24" />
    </div>
    <Skeleton className="h-8 w-96 mb-5" />
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
      <Skeleton className="h-[calc(100vh-280px)] min-h-[420px] !rounded-2xl" />
      <div className="space-y-5">
        <Skeleton className="h-36 !rounded-2xl" />
        <Skeleton className="h-52 !rounded-2xl" />
      </div>
    </div>
  </LoadingArea>
);

/** The editor's own layout, so opening a project doesn't jump when it arrives. */
export const StudioSkeleton: React.FC = () => (
  <LoadingArea className="h-screen flex flex-col bg-slate-100 dark:bg-slate-950">
    <div className="h-14 shrink-0 flex items-center gap-3 px-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
      <Skeleton className="w-8 h-8" />
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-8 w-56 mx-auto" />
      <Skeleton className="h-9 w-24" />
      <Skeleton className="h-9 w-24" />
    </div>
    <div className="flex-1 min-h-0 flex">
      <div className="w-[68px] shrink-0 p-2 space-y-2 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
        {[0, 1, 2, 3, 4].map((n) => <Skeleton key={n} className="h-12" />)}
      </div>
      <div className="w-[320px] shrink-0 p-4 space-y-4 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
        {[0, 1, 2, 3, 4, 5].map((n) => (
          <div key={n} className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-9" />
          </div>
        ))}
      </div>
      <div className="flex-1 p-3"><Skeleton className="h-full bg-white dark:bg-slate-900" /></div>
    </div>
  </LoadingArea>
);

/** The app's layout, shown while the session and workspace load. */
export const ShellSkeleton: React.FC = () => (
  <LoadingArea className="h-screen flex bg-slate-50 dark:bg-slate-950">
    <div className="w-60 shrink-0 p-3 space-y-3 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
      <Skeleton className="h-7 w-28" />
      <Skeleton className="h-9" />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((n) => <Skeleton key={n} className="h-8" />)}
    </div>
    <div className="flex-1 p-6 space-y-5">
      <Skeleton className="h-8 w-64" />
      <div className="grid gap-3 grid-cols-4">{[0, 1, 2, 3].map((n) => <Skeleton key={n} className="h-[74px] !rounded-xl" />)}</div>
      <Skeleton className="h-96 !rounded-2xl" />
    </div>
  </LoadingArea>
);

/** The label of a button that starts work: a spinner and a present-tense word while it runs. */
export const BusyLabel: React.FC<{ busy: boolean; busyText?: string; children: React.ReactNode }> = ({ busy, busyText, children }) => (
  busy ? (
    <>
      <Loader2 className="w-4 h-4 shrink-0 animate-spin" aria-hidden="true" />
      {busyText ?? children}
    </>
  ) : <>{children}</>
);

/** For icon-only buttons: swaps the icon for a spinner while it runs. */
export const BusyIcon: React.FC<{ busy: boolean; children: React.ReactNode; className?: string }> = ({ busy, children, className = 'w-4 h-4' }) => (
  busy ? <Loader2 className={`${className} animate-spin`} aria-hidden="true" /> : <>{children}</>
);

export const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'Something went wrong. Please try again.';
