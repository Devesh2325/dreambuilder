import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Copy, Trash2, Upload } from 'lucide-react';
import { MODULES } from '../../core/modules';
import { AssetRecord } from '../../data/services';
import { FontSelect } from '../../studio/fields';
import { PLAN_LIMITS, UserRole } from '../../types/auth';
import { ROUTES } from '../routes';
import { useServices, useSession } from '../session';
import { BusyIcon, BusyLabel, cardClass, CardsSkeleton, dangerButton, EmptyState, ErrorNote, errorMessage, inputClass, LoadingArea, LoadingNote, PageHeader, primaryButton, secondaryButton, Skeleton } from '../shared/ui';
import { useWorkspace } from '../workspace';

// ---- Assets -----------------------------------------------------------------

export const AssetsPage: React.FC = () => {
  const { assets } = useServices();
  const { workspace, can } = useWorkspace();
  const queryClient = useQueryClient();
  const organizationId = workspace?.organizationId;
  const key = ['assets', organizationId];
  const query = useQuery({ queryKey: key, queryFn: () => assets.list(organizationId!), enabled: Boolean(organizationId) });
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const upload = useMutation({
    mutationFn: async (files: File[]) => {
      for (const file of files) await assets.upload(organizationId!, file);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  });
  const remove = useMutation({
    mutationFn: (asset: AssetRecord) => assets.remove(asset),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
  });

  return (
    <>
      <PageHeader
        title="Assets"
        subtitle="Images for your projects. PNG, JPEG, WebP and GIF, up to 10 MB each."
        actions={can('edit:project') && (
          <label className={`${primaryButton} cursor-pointer`}>
            <BusyIcon busy={upload.isPending}><Upload className="w-4 h-4" aria-hidden="true" /></BusyIcon>
            {upload.isPending ? 'Uploading...' : 'Upload'}
            <input
              type="file"
              multiple
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="sr-only"
              onChange={(event) => {
                const files = Array.from(event.target.files ?? []);
                event.target.value = '';
                if (files.length) upload.mutate(files);
              }}
            />
          </label>
        )}
      />
      <ErrorNote message={upload.isError ? errorMessage(upload.error) : remove.isError ? errorMessage(remove.error) : null} />
      {query.isLoading && <CardsSkeleton count={8} className="mt-4 grid gap-4 grid-cols-2 md:grid-cols-4" />}
      {query.isError && <ErrorNote message="We couldn't load your assets." />}
      {query.isSuccess && query.data.length === 0 && <EmptyState title="No assets yet">Upload your logo and images to reuse them across projects.</EmptyState>}
      <ul className="mt-4 grid gap-4 grid-cols-2 md:grid-cols-4">
        {query.data?.map((asset) => (
          <li key={asset.id} className={`${cardClass} overflow-hidden`}>
            <img src={asset.url} alt={asset.altText || asset.name} className="h-32 w-full object-cover bg-slate-100 dark:bg-slate-800" loading="lazy" />
            <div className="p-2">
              <p className="text-xs font-medium truncate">{asset.name}</p>
              <div className="mt-1 flex items-center justify-between">
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400"
                  onClick={async () => {
                    await navigator.clipboard.writeText(asset.url);
                    setCopiedId(asset.id);
                  }}
                >
                  {copiedId === asset.id ? <Check className="w-3 h-3" aria-hidden="true" /> : <Copy className="w-3 h-3" aria-hidden="true" />}
                  {copiedId === asset.id ? 'Copied' : 'Copy link'}
                </button>
                {can('edit:project') && (
                  <button type="button" aria-label={`Delete ${asset.name}`} disabled={remove.isPending} className="p-1 text-slate-400 hover:text-rose-600" onClick={() => {
                    if (window.confirm(`Delete ${asset.name}? Published pages using it will show a broken image.`)) remove.mutate(asset);
                  }}>
                    <BusyIcon busy={remove.isPending && remove.variables?.id === asset.id} className="w-3.5 h-3.5"><Trash2 className="w-3.5 h-3.5" /></BusyIcon>
                  </button>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
};

// ---- Analytics --------------------------------------------------------------

const EVENT_LABELS: Record<string, string> = {
  impression: 'Shown',
  page_viewed: 'Page views',
  cta_clicked: 'Button clicks',
  form_submitted: 'Form submissions',
  tour_step_viewed: 'Tour steps viewed',
  tour_step_completed: 'Tour steps completed',
  tour_step_skipped: 'Tour steps skipped (missing target)',
  tour_completed: 'Tours completed',
  tour_skipped: 'Tours closed early',
  demo_step_viewed: 'Demo screens viewed',
  demo_completed: 'Demos completed',
  faq_expanded: 'Questions opened',
  checklist_item_completed: 'Checklist items done',
  checklist_completed: 'Checklists finished',
  banner_dismissed: 'Banners closed',
};

export const AnalyticsPage: React.FC = () => {
  const { analytics, projects } = useServices();
  const { workspace } = useWorkspace();
  const organizationId = workspace?.organizationId;
  const [days, setDays] = useState(30);
  const [projectFilter, setProjectFilter] = useState('');

  const summary = useQuery({
    queryKey: ['analytics', organizationId, days],
    queryFn: () => analytics.summary(organizationId!, days),
    enabled: Boolean(organizationId),
  });
  const projectList = useQuery({
    queryKey: ['projects', organizationId],
    queryFn: () => projects.list(organizationId!),
    enabled: Boolean(organizationId),
  });

  const rows = useMemo(
    () => (summary.data ?? []).filter((row) => !projectFilter || row.projectId === projectFilter),
    [summary.data, projectFilter],
  );

  const totals = useMemo(() => {
    const byEvent = new Map<string, number>();
    for (const row of rows) byEvent.set(row.eventType, (byEvent.get(row.eventType) ?? 0) + row.events);
    return [...byEvent.entries()].sort((a, b) => b[1] - a[1]);
  }, [rows]);

  const byDay = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of rows) map.set(row.day, (map.get(row.day) ?? 0) + row.events);
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [rows]);
  const peak = Math.max(1, ...byDay.map(([, count]) => count));
  const total = totals.reduce((sum, [, count]) => sum + count, 0);

  return (
    <>
      <PageHeader title="Analytics" subtitle="Real activity from your published sites and embeds." />
      <div className="flex flex-wrap gap-2 mb-5">
        <select aria-label="Period" className={`${inputClass} !w-auto`} value={days} onChange={(e) => setDays(Number(e.target.value))}>
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
        <select aria-label="Project" className={`${inputClass} !w-auto`} value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)}>
          <option value="">All projects</option>
          {projectList.data?.map((project) => <option key={project.id} value={project.id}>{project.title} ({MODULES[project.type].label})</option>)}
        </select>
      </div>
      {summary.isLoading && <LoadingArea className="grid gap-5 md:grid-cols-2"><Skeleton className="h-64 !rounded-2xl" /><Skeleton className="h-64 !rounded-2xl" /></LoadingArea>}
      {summary.isError && <ErrorNote message="We couldn't load analytics." />}
      {summary.isSuccess && total === 0 && <EmptyState title="No activity yet">Numbers appear once visitors reach a published project.</EmptyState>}
      {total > 0 && (
        <div className="grid gap-5 md:grid-cols-2">
          <section aria-labelledby="activity-title" className={`${cardClass} p-5`}>
            <h2 id="activity-title" className="font-semibold">Activity per day</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">{total.toLocaleString()} events</p>
            <ul className="mt-4 flex items-end gap-1 h-40" aria-label="Events per day">
              {byDay.map(([day, count]) => (
                <li key={day} className="flex-1 min-w-[3px] h-full flex items-end" title={`${day}: ${count} events`}>
                  <span className="w-full rounded-t bg-indigo-500" style={{ height: `${Math.max(3, (count / peak) * 100)}%` }}>
                    <span className="sr-only">{day}: {count} events</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
          <section aria-labelledby="events-title" className={`${cardClass} p-5`}>
            <h2 id="events-title" className="font-semibold mb-2">By event</h2>
            <table className="w-full text-sm">
              <thead className="sr-only"><tr><th scope="col">Event</th><th scope="col">Count</th></tr></thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {totals.map(([type, count]) => (
                  <tr key={type}>
                    <td className="py-1.5">{EVENT_LABELS[type] ?? type}</td>
                    <td className="py-1.5 text-right font-semibold tabular-nums">{count.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      )}
    </>
  );
};

// ---- Team -------------------------------------------------------------------

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'owner', label: 'Owner' },
  { value: 'admin', label: 'Admin' },
  { value: 'editor', label: 'Editor' },
  { value: 'viewer', label: 'Viewer' },
];

export const TeamPage: React.FC = () => {
  const { team } = useServices();
  const { workspace, can } = useWorkspace();
  const { user } = useSession();
  const queryClient = useQueryClient();
  const organizationId = workspace?.organizationId;
  const canManage = can('manage:team');
  const isOwner = workspace?.role === 'owner';
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('editor');
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const roles = ROLE_OPTIONS.filter((option) => isOwner || option.value !== 'owner');

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['members', organizationId] });
    queryClient.invalidateQueries({ queryKey: ['invitations', organizationId] });
  };
  const members = useQuery({ queryKey: ['members', organizationId], queryFn: () => team.listMembers(organizationId!), enabled: Boolean(organizationId) });
  const invitations = useQuery({ queryKey: ['invitations', organizationId], queryFn: () => team.listInvitations(organizationId!), enabled: Boolean(organizationId) && canManage });

  const invite = useMutation({
    mutationFn: () => team.createInvitation(organizationId!, email.trim(), role),
    onSuccess: (token) => {
      setInviteLink(`${window.location.origin}${ROUTES.invite(token)}`);
      setEmail('');
      refresh();
    },
  });
  const updateRole = useMutation({ mutationFn: ({ userId, next }: { userId: string; next: UserRole }) => team.updateRole(organizationId!, userId, next), onSettled: refresh });
  const removeMember = useMutation({ mutationFn: (userId: string) => team.removeMember(organizationId!, userId), onSuccess: refresh });
  const revoke = useMutation({ mutationFn: (id: string) => team.revokeInvitation(id), onSuccess: refresh });
  const failure = [invite, updateRole, removeMember, revoke].find((mutation) => mutation.isError);
  const limit = workspace ? PLAN_LIMITS[workspace.plan].teamMembersLimit : 0;

  return (
    <>
      <PageHeader title="Team" subtitle={`Your ${workspace?.plan ?? ''} plan includes up to ${limit} ${limit === 1 ? 'member' : 'members'}.`} />
      <ErrorNote message={failure ? errorMessage(failure.error) : null} />

      {canManage && (
        <section aria-labelledby="invite-title" className={`${cardClass} p-5 mb-5`}>
          <h2 id="invite-title" className="font-semibold mb-3">Invite someone</h2>
          <form className="flex flex-wrap gap-2" onSubmit={(event) => {
            event.preventDefault();
            setInviteLink(null);
            invite.mutate();
          }}>
            <input type="email" required aria-label="Email" placeholder="name@example.com" className={`${inputClass} !w-64`} value={email} onChange={(e) => setEmail(e.target.value)} />
            <select aria-label="Role" className={`${inputClass} !w-auto`} value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
              {roles.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <button type="submit" className={primaryButton} disabled={invite.isPending}><BusyLabel busy={invite.isPending} busyText="Creating...">Create invite link</BusyLabel></button>
          </form>
          {inviteLink && (
            <div role="status" className="mt-3 text-sm">
              <p>Send this link to them. It works once, for that email, and expires in 7 days. You won't see it again.</p>
              <div className="mt-1 flex gap-2 items-center">
                <code className="block flex-1 min-w-0 truncate p-2 rounded bg-slate-100 dark:bg-slate-800 text-xs">{inviteLink}</code>
                <button type="button" className={secondaryButton} onClick={() => navigator.clipboard.writeText(inviteLink)}>Copy</button>
              </div>
            </div>
          )}
        </section>
      )}

      <section aria-labelledby="members-title" className={`${cardClass} p-5 mb-5`}>
        <h2 id="members-title" className="font-semibold mb-2">Members</h2>
        {members.isLoading && <LoadingNote />}
        {members.isError && <ErrorNote message="We couldn't load the team." />}
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {members.data?.map((member) => {
            const editable = canManage && (isOwner || member.role !== 'owner');
            return (
              <li key={member.userId} className="py-2 flex flex-wrap items-center gap-3 text-sm">
                <span className="flex-1 min-w-0">
                  <span className="block font-medium truncate">{member.fullName ?? member.email}{member.userId === user?.id ? ' (you)' : ''}</span>
                  <span className="block text-xs text-slate-500 dark:text-slate-400 truncate">{member.email}</span>
                </span>
                {editable ? (
                  <select
                    aria-label={`Role for ${member.email}`}
                    disabled={updateRole.isPending}
                    className={`${inputClass} !w-auto !py-1`}
                    value={member.role}
                    onChange={(e) => updateRole.mutate({ userId: member.userId, next: e.target.value as UserRole })}
                  >
                    {roles.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                ) : <span className="capitalize text-slate-500 dark:text-slate-400">{member.role}</span>}
                {editable && (
                  <button type="button" aria-label={`Remove ${member.email}`} disabled={removeMember.isPending} className="p-1 text-slate-400 hover:text-rose-600" onClick={() => {
                    if (window.confirm(`Remove ${member.email} from this workspace?`)) removeMember.mutate(member.userId);
                  }}>
                    <BusyIcon busy={removeMember.isPending && removeMember.variables === member.userId} className="w-3.5 h-3.5"><Trash2 className="w-3.5 h-3.5" /></BusyIcon>
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {canManage && Boolean(invitations.data?.length) && (
        <section aria-labelledby="pending-title" className={`${cardClass} p-5`}>
          <h2 id="pending-title" className="font-semibold mb-2">Pending invitations</h2>
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {invitations.data?.map((invitation) => (
              <li key={invitation.id} className="py-2 flex items-center justify-between gap-3 text-sm">
                <span className="truncate">{invitation.email} <span className="capitalize text-slate-500 dark:text-slate-400">({invitation.role})</span></span>
                <button type="button" className={dangerButton} disabled={revoke.isPending} onClick={() => revoke.mutate(invitation.id)}><BusyLabel busy={revoke.isPending && revoke.variables === invitation.id} busyText="Cancelling...">Cancel invite</BusyLabel></button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
};

export const AcceptInvitePage: React.FC = () => {
  const { token } = useParams();
  const { team } = useServices();
  const { select } = useWorkspace();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const accept = useMutation({
    mutationFn: () => team.acceptInvitation(token!),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['memberships'] });
      navigate(ROUTES.home, { replace: true });
    },
  });
  void select;

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 font-sans">
      <div className={`${cardClass} w-full max-w-md p-8 space-y-4`}>
        <h1 className="text-xl font-bold">Join this workspace?</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">The invitation only works for the email it was sent to.</p>
        <ErrorNote message={accept.isError ? errorMessage(accept.error) : null} />
        <button type="button" className={primaryButton} disabled={accept.isPending} onClick={() => accept.mutate()}>
          <BusyLabel busy={accept.isPending} busyText="Joining...">Accept invitation</BusyLabel>
        </button>
      </div>
    </main>
  );
};

// ---- Brand kit --------------------------------------------------------------

export const BrandPage: React.FC = () => {
  const { workspaces } = useServices();
  const { workspace, can } = useWorkspace();
  const queryClient = useQueryClient();
  const [companyName, setCompanyName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#4f46e5');
  const [fontFamily, setFontFamily] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const canEdit = can('manage:team');
  const branding = workspace?.branding;

  useEffect(() => {
    if (!branding) return;
    setCompanyName(branding.companyName ?? '');
    setLogoUrl(branding.logoUrl ?? '');
    setPrimaryColor(branding.primaryColor ?? '#4f46e5');
    setFontFamily(branding.fontFamily ?? '');
  }, [branding]);

  const save = useMutation({
    mutationFn: () => workspaces.updateWorkspace(workspace!.organizationId, {
      branding: {
        ...branding,
        companyName: companyName.trim(),
        logoUrl: logoUrl.trim() || undefined,
        primaryColor,
        fontFamily: fontFamily || undefined,
      },
    }),
    onSuccess: () => {
      setIsSaved(true);
      queryClient.invalidateQueries({ queryKey: ['memberships'] });
    },
  });

  return (
    <>
      <PageHeader title="Brand kit" subtitle="New projects start with these. Existing projects don't change." />
      <form
        className={`${cardClass} p-6 max-w-lg space-y-4`}
        onChange={() => setIsSaved(false)}
        onSubmit={(event) => {
          event.preventDefault();
          save.mutate();
        }}
      >
        <ErrorNote message={save.isError ? errorMessage(save.error) : null} />
        <fieldset disabled={!canEdit} className="space-y-4">
          <label className="block text-sm font-medium">Company name
            <input className={`${inputClass} mt-1`} value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
          </label>
          <label className="block text-sm font-medium">Logo address
            <input type="url" className={`${inputClass} mt-1`} placeholder="Upload in Assets, then paste the link" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} />
          </label>
          <label className="block text-sm font-medium">Main color
            <span className="mt-1 flex gap-2">
              <input type="color" aria-label="Main color picker" className="h-9 w-12 rounded border border-slate-300 dark:border-slate-700" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} />
              <input pattern="#[0-9a-fA-F]{6}" className={inputClass} value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} />
            </span>
          </label>
          <FontSelect label="Font" value={fontFamily} defaultLabel="Use the template's font" onChange={(font) => {
            setFontFamily(font);
            setIsSaved(false);
          }} />
        </fieldset>
        {canEdit && (
          <div className="flex items-center gap-3">
            <button type="submit" className={primaryButton} disabled={save.isPending}><BusyLabel busy={save.isPending} busyText="Saving...">Save brand kit</BusyLabel></button>
            {isSaved && <span role="status" className="text-sm text-emerald-700 dark:text-emerald-400">Saved</span>}
          </div>
        )}
      </form>
    </>
  );
};

// ---- Settings ---------------------------------------------------------------

export const SettingsPage: React.FC = () => {
  const { workspaces } = useServices();
  const { workspace, can, select } = useWorkspace();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [newWorkspace, setNewWorkspace] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setName(workspace?.name ?? '');
  }, [workspace?.name]);

  const rename = useMutation({
    mutationFn: () => workspaces.updateWorkspace(workspace!.organizationId, { name: name.trim() }),
    onSuccess: () => {
      setIsSaved(true);
      queryClient.invalidateQueries({ queryKey: ['memberships'] });
    },
  });
  const create = useMutation({
    mutationFn: () => workspaces.createWorkspace(newWorkspace.trim()),
    onSuccess: async (id) => {
      setNewWorkspace('');
      await queryClient.invalidateQueries({ queryKey: ['memberships'] });
      select(id);
    },
  });
  const limits = workspace ? PLAN_LIMITS[workspace.plan] : null;

  return (
    <>
      <PageHeader title="Settings" />
      <div className="space-y-5 max-w-lg">
        <form className={`${cardClass} p-6 space-y-3`} onSubmit={(event) => {
          event.preventDefault();
          rename.mutate();
        }}>
          <h2 className="font-semibold">Workspace</h2>
          <ErrorNote message={rename.isError ? errorMessage(rename.error) : null} />
          <fieldset disabled={!can('manage:team')} className="space-y-3">
            <label className="block text-sm font-medium">Name
              <input required maxLength={120} className={`${inputClass} mt-1`} value={name} onChange={(e) => {
                setName(e.target.value);
                setIsSaved(false);
              }} />
            </label>
            <button type="submit" className={primaryButton} disabled={rename.isPending}><BusyLabel busy={rename.isPending} busyText="Saving...">Save</BusyLabel></button>
            {isSaved && <span role="status" className="ml-3 text-sm text-emerald-700 dark:text-emerald-400">Saved</span>}
          </fieldset>
        </form>

        {limits && (
          <section aria-labelledby="plan-title" className={`${cardClass} p-6`}>
            <h2 id="plan-title" className="font-semibold capitalize">{workspace?.plan} plan</h2>
            <dl className="mt-2 text-sm grid grid-cols-2 gap-y-1">
              <dt className="text-slate-500 dark:text-slate-400">Projects</dt><dd>{limits.maxProjects.toLocaleString()}</dd>
              <dt className="text-slate-500 dark:text-slate-400">Team members</dt><dd>{limits.teamMembersLimit.toLocaleString()}</dd>
            </dl>
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Online upgrades aren't available yet. Contact us to change your plan.</p>
          </section>
        )}

        <form className={`${cardClass} p-6 space-y-3`} onSubmit={(event) => {
          event.preventDefault();
          create.mutate();
        }}>
          <h2 className="font-semibold">Create another workspace</h2>
          <ErrorNote message={create.isError ? errorMessage(create.error) : null} />
          <label className="block text-sm font-medium">Workspace name
            <input required maxLength={120} className={`${inputClass} mt-1`} value={newWorkspace} onChange={(e) => setNewWorkspace(e.target.value)} />
          </label>
          <button type="submit" className={secondaryButton} disabled={create.isPending}><BusyLabel busy={create.isPending} busyText="Creating...">Create workspace</BusyLabel></button>
        </form>
      </div>
    </>
  );
};
