import { PostgrestError, User } from '@supabase/supabase-js';
import { DEFAULT_THEME } from '../core/schema';
import { createPublicApi } from './publicApi';
import {
  AdminOverview, AdminRepository, AppServices, DomainRecord, DomainRepository, AssetRecord, AssetRepository, AuthGateway, AuthUser, DocumentRecord, LibraryItem, LibraryRepository, MemberRecord,
  NudgeRepository, PlanRepository, PlanRequestRecord, ProfileRepository, ProjectRecord, ProjectRepository, PublishingRepository, SupportRepository, TeamRepository,
  TicketMessage, TicketRecord, TicketStatus, WorkspaceMembership, WorkspaceRepository,
} from './services';
import { getSupabase, supabaseAnonKey, supabaseUrl } from './supabaseClient';
import { SubscriptionPlan } from '../types/auth';

const db = () => getSupabase();

function check(error: PostgrestError | null): void {
  if (error) throw new Error(error.message);
}

function toAuthUser(user: User | null | undefined): AuthUser | null {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email ?? '',
    fullName: (user.user_metadata?.full_name as string | undefined) ?? null,
  };
}

const auth: AuthGateway = {
  async getUser() {
    const { data } = await db().auth.getSession();
    return toAuthUser(data.session?.user);
  },

  onChange(listener) {
    // Only passes data along: Supabase warns that awaiting its own client inside
    // this callback can deadlock.
    const { data } = db().auth.onAuthStateChange((_event, session) => {
      listener(toAuthUser(session?.user));
    });
    return () => data.subscription.unsubscribe();
  },

  async signIn(email, password) {
    const { error } = await db().auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  },

  async signUp({ email, password, fullName, workspaceName }) {
    const { data, error } = await db().auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, workspace_name: workspaceName } },
    });
    return {
      error: error?.message ?? null,
      needsEmailConfirmation: !error && !data.session,
    };
  },

  async signOut() {
    const { error } = await db().auth.signOut();
    return { error: error?.message ?? null };
  },

  async sendPasswordReset(email, redirectTo) {
    const { error } = await db().auth.resetPasswordForEmail(email, { redirectTo });
    return { error: error?.message ?? null };
  },

  async updatePassword(password) {
    const { error } = await db().auth.updateUser({ password });
    return { error: error?.message ?? null };
  },
};

interface MembershipRow {
  role: WorkspaceMembership['role'];
  organizations: { id: string; name: string; slug: string; plan: WorkspaceMembership['plan']; branding: WorkspaceMembership['branding'] };
}

const workspaces: WorkspaceRepository = {
  async listMemberships(userId) {
    const { data, error } = await db()
      .from('organization_members')
      .select('role, organizations (id, name, slug, plan, branding)')
      .eq('user_id', userId)
      .order('created_at');
    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('schema cache')) {
        console.warn('Database schema not initialized yet: public.organization_members table missing.');
        return [];
      }
      check(error);
    }
    return ((data as unknown as MembershipRow[]) || [])
      .map((row) => ({
        organizationId: row.organizations?.id,
        name: row.organizations?.name || 'Workspace',
        slug: row.organizations?.slug || '',
        plan: row.organizations?.plan || 'free',
        role: row.role || 'owner',
        branding: row.organizations?.branding ?? {},
      }))
      .filter((m) => Boolean(m.organizationId));
  },

  async createWorkspace(name) {
    const { data, error } = await db().rpc('create_organization', { workspace_name: name });
    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('schema cache') || error.code === '42883') {
        throw new Error('Database schema is not initialized yet. Please run the migrations in Supabase SQL Editor.');
      }
      check(error);
    }
    return data as string;
  },

  async updateWorkspace(id, patch) {
    const { error } = await db().from('organizations').update(patch).eq('id', id);
    check(error);
  },
};

// Excludes columns clients aren't granted, such as nothing on projects today, but
// lists them explicitly so a future private column isn't exposed by "select *".
const PROJECT_COLUMNS =
  'id, organization_id, type, title, description, slug, status, template_id, variables, theme, settings, published_version_id, created_at, updated_at';
const DOCUMENT_COLUMNS = 'id, project_id, kind, title, slug, position, seo, content, revision, updated_at';

type Row = Record<string, unknown>;

function toProject(row: Row): ProjectRecord {
  return {
    id: row.id as string,
    organizationId: row.organization_id as string,
    type: row.type as ProjectRecord['type'],
    title: row.title as string,
    description: row.description as string,
    slug: row.slug as string | null,
    status: row.status as ProjectRecord['status'],
    templateId: row.template_id as string | null,
    variables: row.variables as ProjectRecord['variables'],
    theme: { ...DEFAULT_THEME, ...(row.theme as object) },
    settings: row.settings as ProjectRecord['settings'],
    publishedVersionId: row.published_version_id as string | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function toDocument(row: Row): DocumentRecord {
  return {
    id: row.id as string,
    projectId: row.project_id as string,
    kind: row.kind as DocumentRecord['kind'],
    title: row.title as string,
    slug: row.slug as string,
    position: row.position as number,
    seo: row.seo as DocumentRecord['seo'],
    content: row.content as DocumentRecord['content'],
    revision: row.revision as number,
    updatedAt: row.updated_at as string,
  };
}

const projects: ProjectRepository = {
  async list(organizationId) {
    const { data, error } = await db()
      .from('projects')
      .select(PROJECT_COLUMNS)
      .eq('organization_id', organizationId)
      .order('updated_at', { ascending: false });
    check(error);
    return (data as Row[]).map(toProject);
  },

  async get(id) {
    const { data, error } = await db().from('projects').select(PROJECT_COLUMNS).eq('id', id).maybeSingle();
    check(error);
    return data ? toProject(data as Row) : null;
  },

  async create(input) {
    const { data, error } = await db().rpc('create_project_with_documents', {
      org: input.organizationId,
      project_type: input.type,
      project_title: input.title,
      project_description: input.description ?? '',
      project_variables: input.variables,
      project_theme: input.theme,
      project_settings: input.settings,
      source_template_id: input.templateId ?? null,
      source_template_version: input.templateVersion ?? null,
      project_documents: input.documents,
    });
    check(error);
    return data as string;
  },

  async update(id, patch) {
    const { error } = await db().from('projects').update(patch).eq('id', id);
    if (error?.code === '23505') throw new Error('That web address is already taken.');
    check(error);
  },

  async remove(id) {
    const { error } = await db().from('projects').delete().eq('id', id);
    check(error);
  },

  async listDocuments(projectId) {
    const { data, error } = await db()
      .from('documents')
      .select(DOCUMENT_COLUMNS)
      .eq('project_id', projectId)
      .order('position');
    check(error);
    return (data as Row[]).map(toDocument);
  },

  async listAllDocuments(organizationId) {
    const { data, error } = await db()
      .from('documents')
      .select(`, organization_id`)
      .eq('organization_id', organizationId);
    check(error);
    return (data as unknown as Row[]).map(toDocument);
  },

  async createDocument(project, doc, position) {
    const { data, error } = await db()
      .from('documents')
      .insert({
        project_id: project.id,
        organization_id: project.organizationId,
        kind: doc.kind,
        title: doc.title,
        slug: doc.slug,
        position,
        seo: doc.seo ?? {},
        content: doc.content,
      })
      .select(DOCUMENT_COLUMNS)
      .single();
    if (error?.code === '23505') throw new Error('A page with that address already exists.');
    check(error);
    return toDocument(data as Row);
  },

  async saveDocument(id, patch, expectedRevision) {
    // The revision filter makes a stale save match no rows instead of overwriting newer work.
    const { data, error } = await db()
      .from('documents')
      .update(patch)
      .eq('id', id)
      .eq('revision', expectedRevision)
      .select('revision, updated_at');
    if (error?.code === '23505') throw new Error('A page with that address already exists.');
    check(error);
    const rows = data as { revision: number; updated_at: string }[];
    if (rows.length === 0) return { status: 'conflict' };
    return { status: 'saved', revision: rows[0].revision, updatedAt: rows[0].updated_at };
  },

  async removeDocument(id) {
    const { error } = await db().from('documents').delete().eq('id', id);
    check(error);
  },
};

const publishing: PublishingRepository = {
  async publish(projectId, summary, slug) {
    const { error } = await db().rpc('publish_project', { p_project: projectId, p_summary: summary ?? null, p_slug: slug ?? null });
    if (error?.code === '23505') throw new Error('That web address is already taken. Please choose another.');
    if (error?.code === '23514') throw new Error('Web addresses can only use lowercase letters, numbers and single hyphens.');
    check(error);
  },

  async unpublish(projectId) {
    const { error } = await db().rpc('unpublish_project', { p_project: projectId });
    check(error);
  },

  async listVersions(projectId) {
    const { data, error } = await db()
      .from('project_versions')
      .select('id, version_number, change_summary, created_at')
      .eq('project_id', projectId)
      .order('version_number', { ascending: false });
    check(error);
    return (data as Row[]).map((row) => ({
      id: row.id as string,
      versionNumber: row.version_number as number,
      changeSummary: row.change_summary as string | null,
      createdAt: row.created_at as string,
    }));
  },

  async restoreVersion(versionId) {
    const { error } = await db().rpc('restore_project_version', { p_version: versionId });
    check(error);
  },
};

const assets: AssetRepository = {
  async list(organizationId) {
    const { data, error } = await db()
      .from('assets')
      .select('id, name, file_path, mime_type, size_bytes, alt_text, created_at')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });
    check(error);
    return (data as Row[]).map((row) => toAsset(row));
  },

  async upload(organizationId, file) {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, '-').slice(-100);
    const path = `${organizationId}/${crypto.randomUUID()}-${safeName}`;
    const uploaded = await db().storage.from('assets').upload(path, file, { contentType: file.type });
    if (uploaded.error) throw new Error(uploaded.error.message);

    const { data, error } = await db()
      .from('assets')
      .insert({
        organization_id: organizationId,
        name: file.name.slice(0, 255),
        file_path: path,
        mime_type: file.type,
        size_bytes: file.size,
      })
      .select('id, name, file_path, mime_type, size_bytes, alt_text, created_at')
      .single();
    if (error) {
      await db().storage.from('assets').remove([path]);
      throw new Error(error.message);
    }
    return toAsset(data as Row);
  },

  async remove(asset) {
    const { data, error } = await db().from('assets').delete().eq('id', asset.id).select('file_path');
    check(error);
    const paths = (data as { file_path: string }[]).map((row) => row.file_path);
    if (paths.length > 0) await db().storage.from('assets').remove(paths);
  },
};

function toAsset(row: Row): AssetRecord {
  return {
    id: row.id as string,
    name: row.name as string,
    url: db().storage.from('assets').getPublicUrl(row.file_path as string).data.publicUrl,
    mimeType: row.mime_type as string,
    sizeBytes: Number(row.size_bytes),
    altText: row.alt_text as string,
    createdAt: row.created_at as string,
  };
}

const team: TeamRepository = {
  async listMembers(organizationId) {
    const { data, error } = await db()
      .from('organization_members')
      .select('role, user_id, user_profiles (email, full_name)')
      .eq('organization_id', organizationId)
      .order('created_at');
    check(error);
    return (data as unknown as { role: MemberRecord['role']; user_id: string; user_profiles: { email: string; full_name: string | null } }[]).map((row) => ({
      userId: row.user_id,
      role: row.role,
      email: row.user_profiles.email,
      fullName: row.user_profiles.full_name,
    }));
  },

  async updateRole(organizationId, userId, role) {
    const { error } = await db().from('organization_members').update({ role }).eq('organization_id', organizationId).eq('user_id', userId);
    check(error);
  },

  async removeMember(organizationId, userId) {
    const { error } = await db().from('organization_members').delete().eq('organization_id', organizationId).eq('user_id', userId);
    check(error);
  },

  async listInvitations(organizationId) {
    const { data, error } = await db()
      .from('invitations')
      .select('id, email, role, expires_at')
      .eq('organization_id', organizationId)
      .is('accepted_at', null)
      .gt('expires_at', new Date().toISOString());
    check(error);
    return (data as Row[]).map((row) => ({
      id: row.id as string,
      email: row.email as string,
      role: row.role as MemberRecord['role'],
      expiresAt: row.expires_at as string,
    }));
  },

  async createInvitation(organizationId, email, role) {
    const { data, error } = await db().rpc('create_invitation', { p_org: organizationId, p_email: email, p_role: role });
    check(error);
    return data as string;
  },

  async revokeInvitation(id) {
    const { error } = await db().from('invitations').delete().eq('id', id);
    check(error);
  },

  async acceptInvitation(token) {
    const { error } = await db().rpc('accept_invitation', { p_token: token });
    check(error);
  },
};

const LIBRARY_COLUMNS = 'id, kind, name, category, description, definition, created_at';

function toLibraryItem(row: Row): LibraryItem {
  return {
    id: row.id as string,
    kind: row.kind as LibraryItem['kind'],
    name: row.name as string,
    category: row.category as string,
    description: row.description as string,
    definition: row.definition,
    createdAt: row.created_at as string,
  };
}

const library: LibraryRepository = {
  async list(organizationId, kind) {
    const { data, error } = await db()
      .from('workspace_library')
      .select(LIBRARY_COLUMNS)
      .eq('organization_id', organizationId)
      .eq('kind', kind)
      .order('created_at', { ascending: false });
    check(error);
    return (data as Row[]).map(toLibraryItem);
  },

  async create(organizationId, item) {
    const { data, error } = await db()
      .from('workspace_library')
      .insert({ organization_id: organizationId, ...item })
      .select(LIBRARY_COLUMNS)
      .single();
    check(error);
    return toLibraryItem(data as Row);
  },

  async remove(id) {
    const { error } = await db().from('workspace_library').delete().eq('id', id);
    check(error);
  },
};

const DOMAIN_COLUMNS = 'id, project_id, domain, status, verification_token, last_error, created_at';
const toDomain = (row: Row): DomainRecord => ({
  id: row.id as string,
  projectId: row.project_id as string,
  domain: row.domain as string,
  status: row.status as DomainRecord['status'],
  verificationToken: row.verification_token as string,
  lastError: row.last_error as string | null,
  createdAt: row.created_at as string,
});

const domains: DomainRepository = {
  async list(projectId) {
    const { data, error } = await db().from('project_domains').select(DOMAIN_COLUMNS).eq('project_id', projectId).order('created_at');
    check(error);
    return (data as Row[]).map(toDomain);
  },
  async add(project, domain) {
    const { data, error } = await db().from('project_domains').insert({ project_id: project.id, organization_id: project.organizationId, domain }).select(DOMAIN_COLUMNS).single();
    if (error?.code === '23505') throw new Error('That domain is already connected to a site.');
    if (error?.code === '42501') throw new Error('A site can have up to three domains, and only editors can add them.');
    check(error);
    return toDomain(data as Row);
  },
  async remove(id) {
    const { error } = await db().from('project_domains').delete().eq('id', id);
    check(error);
  },
  async verify(id) {
    const { error } = await db().functions.invoke('domains', { body: { domainId: id } });
    if (error) throw new Error("We couldn't reach the domain service. If this keeps happening, its administrator may not have set it up yet.");
    const { data, error: readError } = await db().from('project_domains').select(DOMAIN_COLUMNS).eq('id', id).single();
    check(readError);
    return toDomain(data as Row);
  },
};

const profile: ProfileRepository = {
  async get() {
    const { data: session } = await db().auth.getSession();
    const id = session.session?.user.id;
    if (!id) return null;
    const { data, error } = await db().from('user_profiles').select('email, full_name, job_title, timezone').eq('id', id).maybeSingle();
    check(error);
    if (!data) return null;
    const row = data as Row;
    return { fullName: (row.full_name as string) ?? '', email: row.email as string, jobTitle: (row.job_title as string) ?? '', timezone: (row.timezone as string) ?? '' };
  },
  async update({ fullName, jobTitle, timezone }) {
    const { data: session } = await db().auth.getSession();
    const id = session.session?.user.id;
    if (!id) throw new Error('Please log in again.');
    const patch: Row = {};
    if (fullName !== undefined) patch.full_name = fullName;
    if (jobTitle !== undefined) patch.job_title = jobTitle;
    if (timezone !== undefined) patch.timezone = timezone;
    const { error } = await db().from('user_profiles').update(patch).eq('id', id);
    check(error);
    // The session's copy of the name is what the rest of the app reads.
    if (fullName !== undefined) await db().auth.updateUser({ data: { full_name: fullName } });
  },
  async touchActivity() {
    const { error } = await db().rpc('touch_last_active');
    check(error);
  },
};

const plans: PlanRepository = {
  async list() {
    const [settings, quotas] = await Promise.all([
      db().from('plan_settings').select('plan, label, price_text, description, max_projects, max_members').order('position'),
      db().from('plan_module_quotas').select('plan, module, max_projects'),
    ]);
    check(settings.error);
    check(quotas.error);
    return (settings.data as Row[]).map((row) => ({
      plan: row.plan as SubscriptionPlan,
      label: row.label as string,
      priceText: row.price_text as string,
      description: row.description as string,
      maxProjects: row.max_projects as number,
      maxMembers: row.max_members as number,
      moduleQuotas: Object.fromEntries((quotas.data as Row[]).filter((quota) => quota.plan === row.plan).map((quota) => [quota.module, quota.max_projects])),
    }));
  },
  async requestChange(organizationId, plan, note) {
    const { error } = await db().from('plan_requests').insert({ organization_id: organizationId, plan, note });
    if (error?.code === '23505') throw new Error('You already have a request waiting. We will reply to that first.');
    check(error);
  },
  async listRequests(organizationId) {
    const { data, error } = await db().from('plan_requests').select('id, plan, note, status, created_at').eq('organization_id', organizationId).order('created_at', { ascending: false });
    check(error);
    return (data as Row[]).map((row) => ({ id: row.id as string, plan: row.plan as SubscriptionPlan, note: row.note as string, status: row.status as PlanRequestRecord['status'], createdAt: row.created_at as string }));
  },
};

const nudges: NudgeRepository = {
  async listUnread() {
    const { data, error } = await db().from('user_nudges').select('id, title, body, link_url, created_at').is('read_at', null).order('created_at', { ascending: false });
    check(error);
    return (data as Row[]).map((row) => ({ id: row.id as string, title: row.title as string, body: row.body as string, linkUrl: row.link_url as string | null, createdAt: row.created_at as string }));
  },
  async markRead(id) {
    const { error } = await db().from('user_nudges').update({ read_at: new Date().toISOString() }).eq('id', id);
    check(error);
  },
};

const toTicket = (row: Row): TicketRecord => ({ id: row.id as string, subject: row.subject as string, status: row.status as TicketStatus, createdAt: row.created_at as string, updatedAt: row.updated_at as string });
const toTicketMessage = (row: Row): TicketMessage => ({ id: row.id as string, isStaff: row.is_staff as boolean, body: row.body as string, createdAt: row.created_at as string });

const support: SupportRepository = {
  async listTickets() {
    const { data, error } = await db().from('support_tickets').select('id, subject, status, created_at, updated_at').order('updated_at', { ascending: false });
    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('schema cache')) {
        console.warn('Database schema not initialized yet: public.support_tickets table missing.');
        return [];
      }
      check(error);
    }
    return ((data as Row[]) || []).map(toTicket);
  },
  async createTicket(organizationId, subject, body) {
    const { data, error } = await db().from('support_tickets').insert({ organization_id: organizationId, subject }).select('id').single();
    check(error);
    const id = (data as Row).id as string;
    const message = await db().from('support_messages').insert({ ticket_id: id, body });
    check(message.error);
    return id;
  },
  async listMessages(ticketId) {
    const { data, error } = await db().from('support_messages').select('id, is_staff, body, created_at').eq('ticket_id', ticketId).order('created_at');
    check(error);
    return (data as Row[]).map(toTicketMessage);
  },
  async reply(ticketId, body) {
    const { error } = await db().from('support_messages').insert({ ticket_id: ticketId, body });
    if (error?.code === '42501') throw new Error('This request is closed. Please start a new one.');
    check(error);
  },
};

const callAdmin = async <T,>(name: string, args?: Record<string, unknown>): Promise<T> => {
  const { data, error } = await db().rpc(name, args);
  check(error);
  return data as T;
};

const admin: AdminRepository = {
  isAdmin: () => callAdmin<boolean>('is_platform_admin'),
  overview: () => callAdmin<AdminOverview>('admin_overview'),
  async listUsers() {
    return (await callAdmin<Row[]>('admin_list_users')).map((row) => ({
      userId: row.user_id as string,
      email: row.email as string,
      fullName: row.full_name as string | null,
      createdAt: row.created_at as string | null,
      lastActiveAt: row.last_active_at as string | null,
      workspaceId: row.workspace_id as string | null,
      workspaceName: row.workspace_name as string | null,
      plan: row.plan as SubscriptionPlan | null,
      projectCount: Number(row.project_count),
    }));
  },
  setWorkspacePlan: (organizationId, plan) => callAdmin('admin_set_workspace_plan', { p_org: organizationId, p_plan: plan }),
  updatePlan: (plan, patch) => callAdmin('admin_update_plan', {
    p_plan: plan, p_label: patch.label, p_price: patch.priceText, p_description: patch.description, p_max_projects: patch.maxProjects, p_max_members: patch.maxMembers,
  }),
  setModuleQuota: (plan, module, max) => callAdmin('admin_set_module_quota', { p_plan: plan, p_module: module, p_max: max }),
  sendNudge: (userId, title, body, linkUrl) => callAdmin<number>('admin_send_nudge', { p_user: userId, p_title: title, p_body: body, p_link: linkUrl }),
  async listPlanRequests() {
    return (await callAdmin<Row[]>('admin_list_plan_requests')).map((row) => ({
      id: row.id as string,
      organizationId: row.organization_id as string,
      workspaceName: row.workspace_name as string,
      plan: row.plan as SubscriptionPlan,
      currentPlan: row.current_plan as SubscriptionPlan,
      note: row.note as string,
      status: row.status as PlanRequestRecord['status'],
      createdAt: row.created_at as string,
      requestedBy: row.requested_by_email as string | null,
    }));
  },
  resolvePlanRequest: (id, approve) => callAdmin('admin_resolve_plan_request', { p_request: id, p_approve: approve }),
  async listTickets() {
    return (await callAdmin<Row[]>('admin_list_tickets')).map((row) => ({
      ...toTicket(row),
      userEmail: row.user_email as string,
      userName: row.user_name as string | null,
      workspaceName: row.workspace_name as string | null,
    }));
  },
  async listTicketMessages(ticketId) {
    return (await callAdmin<Row[]>('admin_ticket_messages', { p_ticket: ticketId })).map(toTicketMessage);
  },
  replyToTicket: (ticketId, body) => callAdmin('admin_reply_ticket', { p_ticket: ticketId, p_body: body }),
  setTicketStatus: (ticketId, status) => callAdmin('admin_set_ticket_status', { p_ticket: ticketId, p_status: status }),
};

export const supabaseServices: AppServices = {
  domains,
  profile,
  plans,
  nudges,
  support,
  admin,
  library,
  auth,
  workspaces,
  projects,
  publishing,
  assets,
  team,
  forms: {
    async listSubmissions(projectId) {
      const { data, error } = await db()
        .from('form_submissions')
        .select('id, data, created_at')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(1000);
      check(error);
      return (data as Row[]).map((row) => ({
        id: row.id as string,
        data: row.data as Record<string, unknown>,
        createdAt: row.created_at as string,
      }));
    },
    async countByProject(organizationId) {
      const { data, error } = await db()
        .from('form_submissions')
        .select('project_id')
        .eq('organization_id', organizationId)
        .limit(10000);
      check(error);
      const counts: Record<string, number> = {};
      for (const row of data as { project_id: string }[]) counts[row.project_id] = (counts[row.project_id] ?? 0) + 1;
      return counts;
    },
    async removeSubmission(id) {
      const { error } = await db().from('form_submissions').delete().eq('id', id);
      check(error);
    },
  },
  analytics: {
    async summary(organizationId, days) {
      const { data, error } = await db().rpc('analytics_summary', { p_org: organizationId, p_days: days });
      check(error);
      return (data as Row[]).map((row) => ({
        projectId: row.project_id as string,
        eventType: row.event_type as string,
        day: row.day as string,
        events: Number(row.events),
        visitors: Number(row.visitors),
      }));
    },
  },
  publicApi: createPublicApi(supabaseUrl, supabaseAnonKey),
};
