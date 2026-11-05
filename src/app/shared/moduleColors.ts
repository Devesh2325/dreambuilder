import { ProjectType } from '../../core/schema';

/** Each module's own color on tiles and icons. Written out in full so Tailwind keeps them. */
export const MODULE_COLORS: Record<ProjectType, string> = {
  website: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300',
  page: 'bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-300',
  tour: 'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300',
  form: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300',
  demo: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300',
  banner: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300',
  menu: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-300',
  faq: 'bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-300',
};
