import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Clock, Crown, X } from 'lucide-react';
import { MODULE_LIST } from '../../core/modules';
import { PlanInfo, PlanRequestRecord } from '../../data/services';
import { useServices } from '../session';
import { formatDate } from '../shared/format';
import { Icon } from '../shared/Icon';
import { BusyLabel, cardClass, ErrorNote, errorMessage, inputClass, LoadingNote, PageHeader, primaryButton, secondaryButton } from '../shared/ui';
import { useWorkspace } from '../workspace';

/** Every plan's limits, as set by the super admin. */
export function usePlans() {
  const { plans } = useServices();
  return useQuery({ queryKey: ['plans'], queryFn: () => plans.list() });
}

export function useCurrentPlan(): PlanInfo | undefined {
  const { workspace } = useWorkspace();
  return usePlans().data?.find((plan) => plan.plan === workspace?.plan);
}

// A number so large it means "no real limit" to anyone reading it.
const limitText = (value: number) => (value >= 9999 ? 'Unlimited' : value.toLocaleString());

/** A meter: how much of a limit is used, with the numbers beside it so it isn't color alone. */
export const UsageBar: React.FC<{ label: string; used: number; max: number; icon?: string }> = ({ label, used, max, icon }) => {
  const share = max > 0 ? Math.min(100, (used / max) * 100) : 100;
  const isFull = used >= max;
  return (
    <div>
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="flex items-center gap-1.5 min-w-0 truncate font-medium">
          {icon && <span className="text-slate-400"><Icon name={icon} className="w-3.5 h-3.5" /></span>}
          {label}
        </span>
        <span className="shrink-0 tabular-nums text-slate-500 dark:text-slate-400">
          {used.toLocaleString()} of {limitText(max)}{isFull ? ' · full' : ''}
        </span>
      </div>
      <div role="meter" aria-label={label} aria-valuenow={used} aria-valuemin={0} aria-valuemax={max} className="mt-1.5 h-1.5 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800">
        <span className={`block h-full rounded-full ${isFull ? 'bg-rose-500' : 'bg-indigo-500'}`} style={{ width: `${Math.max(used > 0 ? 3 : 0, share)}%` }} />
      </div>
    </div>
  );
};

const REQUEST_STATUS: Record<PlanRequestRecord['status'], { label: string; icon: React.ReactNode; className: string }> = {
  pending: { label: 'Waiting', icon: <Clock className="w-3.5 h-3.5" aria-hidden="true" />, className: 'text-amber-700 dark:text-amber-300' },
  approved: { label: 'Approved', icon: <Check className="w-3.5 h-3.5" aria-hidden="true" />, className: 'text-emerald-700 dark:text-emerald-300' },
  declined: { label: 'Declined', icon: <X className="w-3.5 h-3.5" aria-hidden="true" />, className: 'text-slate-500 dark:text-slate-400' },
};

export const PlansPage: React.FC = () => {
  const services = useServices();
  const { workspace, can } = useWorkspace();
  const queryClient = useQueryClient();
  const organizationId = workspace?.organizationId;
  const plansQuery = usePlans();
  const projects = useQuery({ queryKey: ['projects', organizationId], queryFn: () => services.projects.list(organizationId!), enabled: Boolean(organizationId) });
  const members = useQuery({ queryKey: ['members', organizationId], queryFn: () => services.team.listMembers(organizationId!), enabled: Boolean(organizationId) });
  const requests = useQuery({ queryKey: ['plan-requests', organizationId], queryFn: () => services.plans.listRequests(organizationId!), enabled: Boolean(organizationId) });
  const [choosing, setChoosing] = useState<PlanInfo['plan'] | null>(null);
  const [note, setNote] = useState('');

  const send = useMutation({
    mutationFn: () => services.plans.requestChange(organizationId!, choosing!, note.trim()),
    onSuccess: () => {
      setChoosing(null);
      setNote('');
      queryClient.invalidateQueries({ queryKey: ['plan-requests', organizationId] });
    },
  });

  const canRequest = can('manage:billing');
  const current = plansQuery.data?.find((plan) => plan.plan === workspace?.plan);
  const pending = requests.data?.find((request) => request.status === 'pending');
  const allProjects = projects.data ?? [];
  const planName = (plan: PlanInfo['plan']) => plansQuery.data?.find((item) => item.plan === plan)?.label ?? plan;

  return (
    <>
      <PageHeader title="Plans" subtitle="What your workspace can use, and what's available." />
      {plansQuery.isLoading && <LoadingNote />}
      {plansQuery.isError && <ErrorNote message="We couldn't load the plans. Please refresh the page." />}

      {current && (
        <section aria-labelledby="usage-title" className={`${cardClass} p-6 mb-6`}>
          <div className="flex flex-wrap items-center gap-3">
            <span className="w-10 h-10 flex items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300"><Crown className="w-5 h-5" aria-hidden="true" /></span>
            <div>
              <h2 id="usage-title" className="font-semibold">You're on the {current.label} plan</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">{current.description}</p>
            </div>
          </div>
          <div className="mt-5 grid gap-x-8 gap-y-4 md:grid-cols-2 xl:grid-cols-3">
            <UsageBar label="Projects" used={allProjects.length} max={current.maxProjects} />
            <UsageBar label="Team members" used={members.data?.length ?? 0} max={current.maxMembers} />
            {MODULE_LIST.filter((module) => current.moduleQuotas[module.type] !== undefined).map((module) => (
              <UsageBar key={module.type} label={module.plural} icon={module.icon} used={allProjects.filter((project) => project.type === module.type).length} max={current.moduleQuotas[module.type]!} />
            ))}
          </div>
        </section>
      )}

      <p role="note" className="mb-5 text-sm rounded-lg px-4 py-3 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
        Online payment isn't available yet. Ask for a plan below and we'll set it up with you, then switch your workspace by hand.
      </p>
      <ErrorNote message={send.isError ? errorMessage(send.error) : null} />
      {pending && (
        <p role="status" className="mb-5 text-sm rounded-lg px-4 py-3 bg-amber-50 text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
          You asked for the {planName(pending.plan)} plan on {formatDate(pending.createdAt)}. We'll reply to that first.
        </p>
      )}

      {plansQuery.data && (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5 mb-6">
          {plansQuery.data.map((plan) => {
            const isCurrent = plan.plan === workspace?.plan;
            const quotas = MODULE_LIST.filter((module) => plan.moduleQuotas[module.type] !== undefined);
            return (
              <li key={plan.plan} aria-label={`${plan.label} plan`} className={`${cardClass} p-5 flex flex-col ${isCurrent ? '!border-indigo-500 ring-1 ring-indigo-500' : ''}`}>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-bold">{plan.label}</h3>
                  {isCurrent && <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full text-indigo-700 bg-indigo-50 dark:text-indigo-300 dark:bg-indigo-500/10">Your plan</span>}
                </div>
                <p className="mt-2 text-2xl font-extrabold tracking-tight">{plan.priceText}</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 min-h-[40px]">{plan.description}</p>
                <ul className="mt-4 space-y-2 text-sm flex-1">
                  <li className="flex gap-2"><Check className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600" aria-hidden="true" />{limitText(plan.maxProjects)} projects</li>
                  <li className="flex gap-2"><Check className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600" aria-hidden="true" />{limitText(plan.maxMembers)} team {plan.maxMembers === 1 ? 'member' : 'members'}</li>
                  {quotas.map((module) => (
                    <li key={module.type} className="flex gap-2"><Check className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600" aria-hidden="true" />Up to {limitText(plan.moduleQuotas[module.type]!)} {module.plural.toLowerCase()}</li>
                  ))}
                </ul>
                {canRequest && !isCurrent && (
                  choosing === plan.plan ? (
                    <form className="mt-4 space-y-2" onSubmit={(event) => {
                      event.preventDefault();
                      send.mutate();
                    }}>
                      <label className="block text-xs font-medium">Anything we should know? (optional)
                        <textarea rows={3} maxLength={1000} className={`${inputClass} mt-1`} value={note} onChange={(e) => setNote(e.target.value)} />
                      </label>
                      <div className="flex gap-2">
                        <button type="submit" className={`${primaryButton} flex-1 !px-2`} disabled={send.isPending}><BusyLabel busy={send.isPending} busyText="Sending...">Send request</BusyLabel></button>
                        <button type="button" className={`${secondaryButton} !px-2`} onClick={() => setChoosing(null)}>Cancel</button>
                      </div>
                    </form>
                  ) : (
                    <button type="button" disabled={Boolean(pending)} className={`${secondaryButton} mt-4 w-full`} aria-label={`Ask for the ${plan.label} plan`} onClick={() => setChoosing(plan.plan)}>Ask for this plan</button>
                  )
                )}
              </li>
            );
          })}
        </ul>
      )}
      {!canRequest && plansQuery.data && <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">Only the workspace owner can ask to change the plan.</p>}

      {Boolean(requests.data?.length) && (
        <section aria-labelledby="requests-title" className={`${cardClass} p-5 max-w-3xl`}>
          <h2 id="requests-title" className="font-semibold mb-2">Your requests</h2>
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {requests.data?.map((request) => {
              const status = REQUEST_STATUS[request.status];
              return (
                <li key={request.id} className="py-2.5 flex items-center justify-between gap-3 text-sm">
                  <span className="min-w-0">
                    <span className="font-medium">{planName(request.plan)}</span>
                    <span className="block text-xs text-slate-500 dark:text-slate-400 truncate">{formatDate(request.createdAt)}{request.note ? ` · ${request.note}` : ''}</span>
                  </span>
                  <span className={`shrink-0 inline-flex items-center gap-1 text-xs font-semibold ${status.className}`}>{status.icon}{status.label}</span>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </>
  );
};
