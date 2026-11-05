import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, Check, Search, X } from 'lucide-react';
import { MODULE_LIST, MODULES } from '../../core/modules';
import { ProjectType } from '../../core/schema';
import { AdminUser, PlanInfo } from '../../data/services';
import { SubscriptionPlan } from '../../types/auth';
import { usePlans } from '../account/PlansPage';
import { MessageThread, TicketBadge } from '../account/SupportPage';
import { useServices, useSession } from '../session';
import { formatDate, formatDateTime } from '../shared/format';
import { Icon } from '../shared/Icon';
import { BusyLabel, cardClass, EmptyState, ErrorNote, errorMessage, inputClass, LoadingNote, PageHeader, primaryButton, secondaryButton, StatTile, TableSkeleton } from '../shared/ui';

const useRefresh = () => {
  const queryClient = useQueryClient();
  return (...keys: string[]) => keys.forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }));
};

// ---- Overview ---------------------------------------------------------------

const Bars: React.FC<{ title: string; rows: { label: string; value: number; icon?: string }[] }> = ({ title, rows }) => {
  const peak = Math.max(1, ...rows.map((row) => row.value));
  return (
    <section aria-label={title} className={`${cardClass} p-5`}>
      <h2 className="font-semibold mb-3">{title}</h2>
      <ul className="space-y-2.5">
        {rows.map((row) => (
          <li key={row.label} className="grid grid-cols-[130px_minmax(0,1fr)_40px] items-center gap-3 text-sm">
            <span className="flex items-center gap-1.5 truncate">
              {row.icon && <span className="text-slate-400"><Icon name={row.icon} className="w-3.5 h-3.5" /></span>}
              {row.label}
            </span>
            <span className="h-3 rounded-r bg-slate-100 dark:bg-slate-800 overflow-hidden" aria-hidden="true">
              <span className="block h-full rounded-r bg-indigo-500" style={{ width: `${(row.value / peak) * 100}%` }} />
            </span>
            <span className="text-right font-semibold tabular-nums">{row.value.toLocaleString()}</span>
          </li>
        ))}
      </ul>
    </section>
  );
};

const OverviewTab: React.FC = () => {
  const { admin } = useServices();
  const plans = usePlans();
  const query = useQuery({ queryKey: ['admin-overview'], queryFn: () => admin.overview() });
  if (query.isLoading) return <TableSkeleton rows={4} />;
  if (query.isError || !query.data) return <ErrorNote message="We couldn't load the overview." />;
  const data = query.data;
  return (
    <>
      <dl className="grid gap-3 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 mb-5">
        <StatTile label="Users" value={data.users} />
        <StatTile label="Workspaces" value={data.workspaces} />
        <StatTile label="Projects" value={data.projects} />
        <StatTile label="Live projects" value={data.published} />
        <StatTile label="Open support requests" value={data.openTickets} />
        <StatTile label="Plan requests waiting" value={data.pendingRequests} />
      </dl>
      <div className="grid gap-5 lg:grid-cols-2">
        <Bars title="Projects by kind" rows={MODULE_LIST.map((module) => ({ label: module.plural, icon: module.icon, value: data.byModule[module.type] ?? 0 }))} />
        <Bars title="Workspaces by plan" rows={(plans.data ?? []).map((plan) => ({ label: plan.label, value: data.byPlan[plan.plan] ?? 0 }))} />
      </div>
    </>
  );
};

// ---- Users and nudges -------------------------------------------------------

const NudgeForm: React.FC<{ target: AdminUser | null; onClose: () => void }> = ({ target, onClose }) => {
  const { admin } = useServices();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [link, setLink] = useState('');
  const [sentTo, setSentTo] = useState<number | null>(null);
  const send = useMutation({
    mutationFn: () => admin.sendNudge(target?.userId ?? null, title.trim(), body.trim(), link.trim()),
    onSuccess: (count) => {
      setSentTo(count);
      setTitle('');
      setBody('');
      setLink('');
    },
  });
  const who = target ? target.fullName || target.email : 'everyone';

  return (
    <form aria-label={`Nudge ${who}`} className={`${cardClass} p-5 mb-5 space-y-3`} onChange={() => setSentTo(null)} onSubmit={(event) => {
      event.preventDefault();
      send.mutate();
    }}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold">Nudge {who}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">It shows at the top of their app the next time they open it, until they close it.</p>
        </div>
        <button type="button" aria-label="Close nudge form" className="p-1 rounded-md text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" onClick={onClose}><X className="w-4 h-4" /></button>
      </div>
      <ErrorNote message={send.isError ? errorMessage(send.error) : null} />
      <div className="grid gap-3 md:grid-cols-2">
        <label className="block text-sm font-medium">Title
          <input required maxLength={120} className={`${inputClass} mt-1`} value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>
        <label className="block text-sm font-medium">Link (optional)
          <input maxLength={500} placeholder="/plans or https://..." pattern="(/[^/].*|https://.+)" title="Start with / for a page in the app, or https://" className={`${inputClass} mt-1`} value={link} onChange={(e) => setLink(e.target.value)} />
        </label>
      </div>
      <label className="block text-sm font-medium">Message
        <textarea required rows={2} maxLength={500} className={`${inputClass} mt-1`} value={body} onChange={(e) => setBody(e.target.value)} />
      </label>
      <div className="flex items-center gap-3">
        <button type="submit" className={primaryButton} disabled={send.isPending}><BusyLabel busy={send.isPending} busyText="Sending...">Send nudge</BusyLabel></button>
        {sentTo !== null && <span role="status" className="text-sm text-emerald-700 dark:text-emerald-400">Sent to {sentTo} {sentTo === 1 ? 'person' : 'people'}</span>}
      </div>
    </form>
  );
};

const UsersTab: React.FC = () => {
  const { admin } = useServices();
  const plans = usePlans();
  const refresh = useRefresh();
  const query = useQuery({ queryKey: ['admin-users'], queryFn: () => admin.listUsers() });
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [nudging, setNudging] = useState<AdminUser | 'everyone' | null>(null);
  const setPlan = useMutation({
    mutationFn: ({ organizationId, plan }: { organizationId: string; plan: SubscriptionPlan }) => admin.setWorkspacePlan(organizationId, plan),
    onSettled: () => refresh('admin-users', 'admin-overview', 'memberships'),
  });

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (query.data ?? []).filter((user) =>
      (!term || [user.email, user.fullName, user.workspaceName].some((value) => value?.toLowerCase().includes(term)))
      && (!planFilter || user.plan === planFilter));
  }, [query.data, search, planFilter]);

  return (
    <>
      {nudging && <NudgeForm key={nudging === 'everyone' ? 'everyone' : nudging.userId} target={nudging === 'everyone' ? null : nudging} onClose={() => setNudging(null)} />}
      <ErrorNote message={setPlan.isError ? errorMessage(setPlan.error) : null} />
      <div className={`${cardClass} overflow-hidden`}>
        <div className="flex flex-wrap items-center gap-2 p-4 border-b border-slate-200 dark:border-slate-800">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" aria-hidden="true" />
            <input type="search" aria-label="Search users" placeholder="Search by name, email or workspace" className={`${inputClass} !pl-8`} value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select aria-label="Filter by plan" className={`${inputClass} !w-auto`} value={planFilter} onChange={(e) => setPlanFilter(e.target.value)}>
            <option value="">All plans</option>
            {plans.data?.map((plan) => <option key={plan.plan} value={plan.plan}>{plan.label}</option>)}
          </select>
          <button type="button" className={`${secondaryButton} sm:ml-auto`} onClick={() => setNudging('everyone')}><Bell className="w-4 h-4" aria-hidden="true" />Nudge everyone</button>
        </div>
        {query.isLoading && <div className="p-5"><LoadingNote /></div>}
        {query.isError && <div className="p-5"><ErrorNote message="We couldn't load the users." /></div>}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 dark:text-slate-400">
              <tr className="border-b border-slate-100 dark:border-slate-800">
                <th scope="col" className="px-4 py-3 font-medium">User</th>
                <th scope="col" className="px-4 py-3 font-medium">Workspace</th>
                <th scope="col" className="px-4 py-3 font-medium">Plan</th>
                <th scope="col" className="px-4 py-3 font-medium text-right">Projects</th>
                <th scope="col" className="px-4 py-3 font-medium">Last active</th>
                <th scope="col" className="px-4 py-3 font-medium">Joined</th>
                <th scope="col" className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rows.map((user) => (
                <tr key={user.userId}>
                  <th scope="row" className="px-4 py-2.5 font-medium max-w-[280px]">
                    <span className="block truncate">{user.fullName || user.email}</span>
                    <span className="block text-xs font-normal text-slate-500 dark:text-slate-400 truncate">{user.email}</span>
                  </th>
                  <td className="px-4 py-2.5 text-slate-600 dark:text-slate-300 max-w-[200px] truncate">{user.workspaceName ?? '—'}</td>
                  <td className="px-4 py-2.5">
                    {user.workspaceId ? (
                      <select
                        aria-label={`Plan for ${user.email}`}
                        className={`${inputClass} !w-auto !py-1`}
                        disabled={setPlan.isPending}
                        value={user.plan ?? 'free'}
                        onChange={(e) => setPlan.mutate({ organizationId: user.workspaceId!, plan: e.target.value as SubscriptionPlan })}
                      >
                        {plans.data?.map((plan) => <option key={plan.plan} value={plan.plan}>{plan.label}</option>)}
                      </select>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{user.projectCount}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap text-slate-500 dark:text-slate-400">{user.lastActiveAt ? formatDate(user.lastActiveAt) : 'Not yet'}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap text-slate-500 dark:text-slate-400">{user.createdAt ? formatDate(user.createdAt) : '—'}</td>
                  <td className="px-4 py-2.5 text-right">
                    <button type="button" aria-label={`Nudge ${user.email}`} className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline" onClick={() => setNudging(user)}><Bell className="w-3.5 h-3.5" aria-hidden="true" />Nudge</button>
                  </td>
                </tr>
              ))}
              {query.isSuccess && rows.length === 0 && <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-500 dark:text-slate-400">Nobody matches your search.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

// ---- Plans and quotas -------------------------------------------------------

/** Saves when the field is left, so changing many limits doesn't need many buttons. */
const LimitInput: React.FC<{ label: string; value: number | undefined; placeholder?: string; disabled: boolean; onSave: (value: number | null) => void }> = ({ label, value, placeholder, disabled, onSave }) => {
  const [draft, setDraft] = useState<string | null>(null);
  const shown = draft ?? (value === undefined ? '' : String(value));
  return (
    <input
      type="number"
      min={0}
      max={100000}
      step={1}
      aria-label={label}
      placeholder={placeholder}
      disabled={disabled}
      className={`${inputClass} !w-[78px] !px-2 !py-1 text-right tabular-nums`}
      value={shown}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        if (draft === null) return;
        const next = draft.trim() === '' ? null : Math.max(0, Math.floor(Number(draft)));
        setDraft(null);
        if (next !== (value ?? null) && !Number.isNaN(next)) onSave(next);
      }}
    />
  );
};

const PlanDetails: React.FC<{ plan: PlanInfo; onChange: () => void }> = ({ plan, onChange }) => {
  const { admin } = useServices();
  const [label, setLabel] = useState(plan.label);
  const [priceText, setPriceText] = useState(plan.priceText);
  const [description, setDescription] = useState(plan.description);
  const [isSaved, setIsSaved] = useState(false);
  const save = useMutation({
    mutationFn: () => admin.updatePlan(plan.plan, { label: label.trim(), priceText: priceText.trim(), description: description.trim(), maxProjects: plan.maxProjects, maxMembers: plan.maxMembers }),
    onSuccess: () => {
      setIsSaved(true);
      onChange();
    },
  });
  return (
    <form aria-label={`${plan.label} plan details`} className={`${cardClass} p-4 space-y-2`} onChange={() => setIsSaved(false)} onSubmit={(event) => {
      event.preventDefault();
      save.mutate();
    }}>
      <ErrorNote message={save.isError ? errorMessage(save.error) : null} />
      <label className="block text-xs font-medium">Name
        <input required maxLength={60} className={`${inputClass} mt-1`} value={label} onChange={(e) => setLabel(e.target.value)} />
      </label>
      <label className="block text-xs font-medium">Price shown
        <input required maxLength={60} className={`${inputClass} mt-1`} value={priceText} onChange={(e) => setPriceText(e.target.value)} />
      </label>
      <label className="block text-xs font-medium">Description
        <textarea rows={2} maxLength={200} className={`${inputClass} mt-1`} value={description} onChange={(e) => setDescription(e.target.value)} />
      </label>
      <div className="flex items-center gap-2">
        <button type="submit" className={`${secondaryButton} !py-1.5`} disabled={save.isPending}><BusyLabel busy={save.isPending} busyText="Saving...">Save</BusyLabel></button>
        {isSaved && <span role="status" className="text-xs text-emerald-700 dark:text-emerald-400">Saved</span>}
      </div>
    </form>
  );
};

const PlansTab: React.FC = () => {
  const { admin } = useServices();
  const plans = usePlans();
  const refresh = useRefresh();
  const changed = () => refresh('plans');
  const saveLimits = useMutation({
    mutationFn: ({ plan, maxProjects, maxMembers }: { plan: PlanInfo; maxProjects: number; maxMembers: number }) =>
      admin.updatePlan(plan.plan, { label: plan.label, priceText: plan.priceText, description: plan.description, maxProjects, maxMembers }),
    onSettled: changed,
  });
  const saveQuota = useMutation({
    mutationFn: ({ plan, module, max }: { plan: SubscriptionPlan; module: ProjectType; max: number | null }) => admin.setModuleQuota(plan, module, max),
    onSettled: changed,
  });
  const failure = saveLimits.isError ? saveLimits.error : saveQuota.isError ? saveQuota.error : null;
  const isSaving = saveLimits.isPending || saveQuota.isPending;

  if (plans.isLoading) return <TableSkeleton rows={5} />;
  if (plans.isError || !plans.data) return <ErrorNote message="We couldn't load the plans." />;

  return (
    <>
      <section aria-labelledby="quota-title" className={`${cardClass} overflow-hidden mb-5`}>
        <div className="p-5 pb-3">
          <h2 id="quota-title" className="font-semibold">Limits for each plan</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Changes save when you leave a box, and apply straight away. Leave a module empty to only count it toward the plan's overall project limit.
            Existing projects stay. People just can't add more once they're at the limit.
          </p>
        </div>
        <ErrorNote message={failure ? errorMessage(failure) : null} />
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 dark:text-slate-400">
              <tr className="border-y border-slate-100 dark:border-slate-800">
                <th scope="col" className="px-4 py-2.5 font-medium sticky left-0 bg-white dark:bg-slate-900">Plan</th>
                <th scope="col" className="px-2 py-2.5 font-medium">All projects</th>
                <th scope="col" className="px-2 py-2.5 font-medium">Members</th>
                {MODULE_LIST.map((module) => <th key={module.type} scope="col" className="px-2 py-2.5 font-medium whitespace-nowrap">{module.plural.replace(/^(Interactive|Product) (.)/, (_, _word, first: string) => first.toUpperCase())}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {plans.data.map((plan) => (
                <tr key={plan.plan}>
                  <th scope="row" className="px-4 py-2 font-semibold sticky left-0 bg-white dark:bg-slate-900">{plan.label}</th>
                  <td className="px-2 py-2"><LimitInput label={`${plan.label}: all projects`} value={plan.maxProjects} disabled={isSaving} onSave={(value) => value !== null && saveLimits.mutate({ plan, maxProjects: value, maxMembers: plan.maxMembers })} /></td>
                  <td className="px-2 py-2"><LimitInput label={`${plan.label}: members`} value={plan.maxMembers} disabled={isSaving} onSave={(value) => value !== null && saveLimits.mutate({ plan, maxProjects: plan.maxProjects, maxMembers: Math.max(1, value) })} /></td>
                  {MODULE_LIST.map((module) => (
                    <td key={module.type} className="px-2 py-2">
                      <LimitInput label={`${plan.label}: ${MODULES[module.type].plural}`} value={plan.moduleQuotas[module.type]} placeholder="—" disabled={isSaving} onSave={(value) => saveQuota.mutate({ plan: plan.plan, module: module.type, max: value })} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <h2 className="font-semibold mb-3">What customers see</h2>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {plans.data.map((plan) => <PlanDetails key={plan.plan} plan={plan} onChange={changed} />)}
      </div>
    </>
  );
};

// ---- Plan requests ----------------------------------------------------------

const RequestsTab: React.FC = () => {
  const { admin } = useServices();
  const plans = usePlans();
  const refresh = useRefresh();
  const query = useQuery({ queryKey: ['admin-requests'], queryFn: () => admin.listPlanRequests() });
  const resolve = useMutation({
    mutationFn: ({ id, approve }: { id: string; approve: boolean }) => admin.resolvePlanRequest(id, approve),
    onSettled: () => refresh('admin-requests', 'admin-overview', 'admin-users', 'memberships', 'plan-requests'),
  });
  const planName = (plan: string) => plans.data?.find((item) => item.plan === plan)?.label ?? plan;

  if (query.isLoading) return <TableSkeleton rows={3} />;
  if (query.isError) return <ErrorNote message="We couldn't load the requests." />;
  if (!query.data?.length) return <EmptyState title="No plan requests yet">When a workspace owner asks for a plan, it appears here.</EmptyState>;

  return (
    <section aria-label="Plan requests" className={`${cardClass} overflow-hidden`}>
      <ErrorNote message={resolve.isError ? errorMessage(resolve.error) : null} />
      <ul className="divide-y divide-slate-100 dark:divide-slate-800">
        {query.data.map((request) => (
          <li key={request.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold">{request.workspaceName}: {planName(request.currentPlan)} to {planName(request.plan)}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 break-words">{request.requestedBy ?? 'Unknown'} · {formatDateTime(request.createdAt)}{request.note ? ` · ${request.note}` : ''}</p>
            </div>
            {request.status === 'pending' ? (
              <div className="flex gap-2">
                <button type="button" aria-label={`Approve ${request.workspaceName}`} className={`${primaryButton} !py-1.5`} disabled={resolve.isPending} onClick={() => resolve.mutate({ id: request.id, approve: true })}><Check className="w-4 h-4" aria-hidden="true" />Approve</button>
                <button type="button" aria-label={`Decline ${request.workspaceName}`} className={`${secondaryButton} !py-1.5`} disabled={resolve.isPending} onClick={() => resolve.mutate({ id: request.id, approve: false })}>Decline</button>
              </div>
            ) : <span className="text-xs font-semibold capitalize text-slate-500 dark:text-slate-400">{request.status}</span>}
          </li>
        ))}
      </ul>
    </section>
  );
};

// ---- Support inbox ----------------------------------------------------------

const InboxThread: React.FC<{ ticketId: string; closed: boolean }> = ({ ticketId, closed }) => {
  const { admin } = useServices();
  const refresh = useRefresh();
  const messages = useQuery({ queryKey: ['admin-ticket-messages', ticketId], queryFn: () => admin.listTicketMessages(ticketId) });
  const [body, setBody] = useState('');
  const reply = useMutation({
    mutationFn: () => admin.replyToTicket(ticketId, body.trim()),
    onSuccess: () => {
      setBody('');
      refresh('admin-ticket-messages', 'admin-tickets', 'admin-overview');
    },
  });
  const setStatus = useMutation({
    mutationFn: (status: 'open' | 'closed') => admin.setTicketStatus(ticketId, status),
    onSuccess: () => refresh('admin-tickets', 'admin-overview'),
  });
  return (
    <div>
      {messages.isLoading && <LoadingNote />}
      {messages.data && <MessageThread messages={messages.data} staffView />}
      <form className="mt-4 space-y-2" onSubmit={(event) => {
        event.preventDefault();
        reply.mutate();
      }}>
        <ErrorNote message={reply.isError ? errorMessage(reply.error) : setStatus.isError ? errorMessage(setStatus.error) : null} />
        <label className="block text-sm font-medium">Reply to the customer
          <textarea required rows={3} maxLength={5000} className={`${inputClass} mt-1`} value={body} onChange={(e) => setBody(e.target.value)} />
        </label>
        <div className="flex gap-2">
          <button type="submit" className={primaryButton} disabled={reply.isPending}><BusyLabel busy={reply.isPending} busyText="Sending...">Send reply</BusyLabel></button>
          <button type="button" className={secondaryButton} disabled={setStatus.isPending} onClick={() => setStatus.mutate(closed ? 'open' : 'closed')}>{closed ? 'Reopen' : 'Close request'}</button>
        </div>
      </form>
    </div>
  );
};

const InboxTab: React.FC = () => {
  const { admin } = useServices();
  const query = useQuery({ queryKey: ['admin-tickets'], queryFn: () => admin.listTickets() });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = query.data?.find((ticket) => ticket.id === selectedId) ?? query.data?.[0];

  if (query.isLoading) return <TableSkeleton rows={3} />;
  if (query.isError) return <ErrorNote message="We couldn't load the requests." />;
  if (!query.data?.length) return <EmptyState title="No support requests yet">When a customer asks for help, it appears here.</EmptyState>;

  return (
    <div className="grid gap-5 lg:grid-cols-[340px_minmax(0,1fr)] items-start">
      <ul aria-label="Support requests" className={`${cardClass} overflow-hidden divide-y divide-slate-100 dark:divide-slate-800`}>
        {query.data.map((ticket) => (
          <li key={ticket.id}>
            <button type="button" aria-current={selected?.id === ticket.id ? 'true' : undefined} className={`w-full text-left px-4 py-3 ${selected?.id === ticket.id ? 'bg-indigo-50 dark:bg-indigo-500/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'}`} onClick={() => setSelectedId(ticket.id)}>
              <span className="block text-sm font-medium truncate">{ticket.subject}</span>
              <span className="block text-xs text-slate-500 dark:text-slate-400 truncate">{ticket.userName || ticket.userEmail}{ticket.workspaceName ? ` · ${ticket.workspaceName}` : ''}</span>
              <span className="mt-1 flex items-center justify-between gap-2">
                <span className="text-xs text-slate-500 dark:text-slate-400">{formatDateTime(ticket.updatedAt)}</span>
                <TicketBadge status={ticket.status} />
              </span>
            </button>
          </li>
        ))}
      </ul>
      {selected && (
        <section aria-label={selected.subject} className={`${cardClass} p-6`}>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
            <h2 className="font-semibold break-words min-w-0">{selected.subject}</h2>
            <TicketBadge status={selected.status} />
          </div>
          <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">From {selected.userName ? `${selected.userName}, ` : ''}{selected.userEmail}</p>
          <InboxThread key={selected.id} ticketId={selected.id} closed={selected.status === 'closed'} />
        </section>
      )}
    </div>
  );
};

// ---- Page -------------------------------------------------------------------

type AdminTab = 'overview' | 'users' | 'plans' | 'requests' | 'inbox';

const TABS: { id: AdminTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'users', label: 'Users' },
  { id: 'plans', label: 'Plans and limits' },
  { id: 'requests', label: 'Plan requests' },
  { id: 'inbox', label: 'Support inbox' },
];

/** Whether someone is a super admin comes from the database, which also checks every call. */
export function useIsSuperAdmin() {
  const { admin } = useServices();
  const { user } = useSession();
  return useQuery({ queryKey: ['is-super-admin', user?.id], queryFn: () => admin.isAdmin(), enabled: Boolean(user) });
}

export const AdminPage: React.FC = () => {
  const check = useIsSuperAdmin();
  const [tab, setTab] = useState<AdminTab>('overview');

  if (check.isLoading) return <TableSkeleton />;
  if (!check.data) {
    return <EmptyState title="This page is only for super admins" icon="ShieldCheck">Ask your FlowPilot administrator if you think you should have access.</EmptyState>;
  }

  return (
    <>
      <PageHeader title="Super admin" icon="ShieldCheck" subtitle="Every workspace on FlowPilot, and the plans they're on." />
      <div role="tablist" aria-label="Super admin sections" className="no-scrollbar flex gap-5 mt-2 mb-5 pb-px border-b border-slate-200 dark:border-slate-800 overflow-x-auto overflow-y-hidden">
        {TABS.map((item) => (
          <button key={item.id} role="tab" type="button" aria-selected={tab === item.id} onClick={() => setTab(item.id)} className={`pb-2.5 whitespace-nowrap text-sm font-medium border-b-2 transition-colors ${tab === item.id ? 'border-indigo-600 text-indigo-700 dark:text-indigo-300' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}>
            {item.label}
          </button>
        ))}
      </div>
      <div role="tabpanel">
        {tab === 'overview' && <OverviewTab />}
        {tab === 'users' && <UsersTab />}
        {tab === 'plans' && <PlansTab />}
        {tab === 'requests' && <RequestsTab />}
        {tab === 'inbox' && <InboxTab />}
      </div>
    </>
  );
};
