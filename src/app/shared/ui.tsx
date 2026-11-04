import React from 'react';
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

export const StatTile: React.FC<{ label: string; value: number | string }> = ({ label, value }) => (
  <div className={`${cardClass} !rounded-xl px-4 py-3`}>
    <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</dt>
    <dd className="mt-1 text-2xl font-semibold tabular-nums">{typeof value === 'number' ? value.toLocaleString() : value}</dd>
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

export const LoadingNote: React.FC = () => (
  <p role="status" className="text-sm text-slate-500 dark:text-slate-400">Loading...</p>
);

export const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'Something went wrong. Please try again.';
