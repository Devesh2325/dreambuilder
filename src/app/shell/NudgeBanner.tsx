import React from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Bell, X } from 'lucide-react';
import { safeUrl } from '../../core/variables';
import { useServices, useSession } from '../session';

const linkClass = 'inline-flex items-center gap-1 text-sm font-semibold text-indigo-700 dark:text-indigo-300 hover:underline';

/** Messages from the FlowPilot team, shown until they're closed. */
export const NudgeBanner: React.FC = () => {
  const { nudges } = useServices();
  const { user } = useSession();
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['nudges', user?.id], queryFn: () => nudges.listUnread(), enabled: Boolean(user) });
  const dismiss = useMutation({
    mutationFn: (id: string) => nudges.markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['nudges'] }),
  });

  if (!query.data?.length) return null;
  return (
    <div className="space-y-2 mb-5">
      {query.data.map((nudge) => (
        <aside key={nudge.id} aria-label="Message from FlowPilot" className="flex items-start gap-3 rounded-xl px-4 py-3 border border-indigo-200 bg-indigo-50 dark:border-indigo-500/30 dark:bg-indigo-500/10">
          <Bell className="w-4 h-4 mt-0.5 shrink-0 text-indigo-600 dark:text-indigo-300" aria-hidden="true" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold break-words">{nudge.title}</p>
            <p className="text-sm text-slate-700 dark:text-slate-300 break-words">{nudge.body}</p>
            {nudge.linkUrl && (
              nudge.linkUrl.startsWith('/')
                ? <Link to={nudge.linkUrl} className={`${linkClass} mt-1`}>Open <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" /></Link>
                : <a href={safeUrl(nudge.linkUrl)} target="_blank" rel="noopener noreferrer" className={`${linkClass} mt-1`}>Open <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" /></a>
            )}
          </div>
          <button type="button" aria-label={`Close: ${nudge.title}`} disabled={dismiss.isPending} className="p-1 rounded-md text-slate-500 hover:bg-indigo-100 dark:hover:bg-indigo-500/20" onClick={() => dismiss.mutate(nudge.id)}>
            <X className="w-4 h-4" />
          </button>
        </aside>
      ))}
    </div>
  );
};
