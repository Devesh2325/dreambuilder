import { PostgrestError, User } from '@supabase/supabase-js';
import { DEFAULT_THEME } from '../core/schema';
import { createPublicApi } from './publicApi';
import {
  AppServices, AssetRecord, AssetRepository, AuthGateway, AuthUser, DocumentRecord, MemberRecord, ProjectRecord,
  ProjectRepository, PublishingRepository, TeamRepository, WorkspaceMembership, WorkspaceRepository,
} from './services';
import { getSupabase, supabaseAnonKey, supabaseUrl } from './supabaseClient';

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
    check(error);
    return (data as unknown as MembershipRow[]).map((row) => ({
      organizationId: row.organizations.id,
      name: row.organizations.name,
      slug: row.organizations.slug,
      plan: row.organizations.plan,
      role: row.role,
      branding: row.organizations.branding ?? {},
    }));
  },

  async createWorkspace(name) {
    const { data, error } = await db().rpc('create_organization', { workspace_name: name });
    check(error);
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

export const supabaseServices: AppServices = {
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
