import React from 'react';
import { Check } from 'lucide-react';

const STEPS = ['Choose a template', 'Add your details', 'Edit and publish'];

/** Where you are in creating a project. Shared by the create page and the details form. */
export const CreateSteps: React.FC<{ current: 1 | 2 }> = ({ current }) => (
  <ol aria-label="Steps" className="hidden md:flex items-center gap-2 text-sm">
    {STEPS.map((step, index) => {
      const number = index + 1;
      const isDone = number < current;
      const isCurrent = number === current;
      return (
        <li key={step} aria-current={isCurrent ? 'step' : undefined} className="flex items-center gap-2">
          {index > 0 && <span className="w-8 h-px bg-slate-300 dark:bg-slate-700" aria-hidden="true" />}
          <span aria-hidden="true" className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${isDone ? 'bg-emerald-500 text-white' : isCurrent ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
            {isDone ? <Check className="w-3.5 h-3.5" /> : number}
          </span>
          <span className={isCurrent ? 'font-semibold' : 'text-slate-500 dark:text-slate-400'}>{step}</span>
        </li>
      );
    })}
  </ol>
);
