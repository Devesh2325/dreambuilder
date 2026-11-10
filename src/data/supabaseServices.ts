import { PostgrestError, User } from '@supabase/supabase-js';
import { DEFAULT_THEME } from '../core/schema';
import { createPublicApi } from './publicApi';
import {
  AdminOverview, AdminRepository, AppServices, DomainRecord, DomainRepository, AssetRecord, AssetRepository, AuthGateway, AuthUser, DocumentRecord, LibraryItem, LibraryRepository, MemberRecord,
  NudgeRepository, PlanInfo, PlanRepository, PlanRequestRecord, ProfileRepository, ProjectRecord, ProjectRepository, PublishedSnapshot, PublishingRepository, SupportRepository, TeamRepository,
  TicketMessage, TicketRecord, TicketStatus, WorkspaceMembership, WorkspaceRepository,
} from './services';
import { getSupabase, supabaseAnonKey, supabaseUrl } from './supabaseClient';
import { SubscriptionPlan, PLAN_LABELS, PLAN_DESCRIPTIONS, PLAN_LIMITS } from '../types/auth';

const db = () => getSupabase();

function check(error: PostgrestError | null): void {
  if (error) throw new Error(error.message);
}

function isMissingSchema(error: unknown): boolean {
  if (!error) return false;
  if (typeof error === 'string') {
    return error.includes('schema cache') || error.includes('does not exist') || error.includes('relation "public.');
  }
  if (typeof error === 'object') {
    const e = error as { code?: string; message?: string; details?: string };
    const code = e.code ?? '';
    const msg = (e.message ?? '') + ' ' + (e.details ?? '');
    return (
      code === 'PGRST202' ||
      code === 'PGRST205' ||
      code === '42P01' ||
      code === '42883' ||
      msg.includes('schema cache') ||
      msg.includes('does not exist') ||
      msg.includes('relation "public.') ||
      msg.includes('Could not find the function') ||
      msg.includes('Could not find the table')
    );
  }
  return false;
}

interface FallbackVersion {
  id: string;
  projectId: string;
  versionNumber: number;
  changeSummary: string | null;
  createdAt: string;
  snapshot: PublishedSnapshot;
}

interface FallbackData {
  projects: ProjectRecord[];
  documents: DocumentRecord[];
  versions: FallbackVersion[];
}

const FALLBACK_KEY = 'flowpilot_db_fallback';

function loadFallback(): FallbackData {
  try {
    const raw = localStorage.getItem(FALLBACK_KEY);
    if (!raw) return { projects: [], documents: [], versions: [] };
    const parsed = JSON.parse(raw) as Partial<FallbackData>;
    return {
      projects: parsed.projects || [],
      documents: parsed.documents || [],
      versions: parsed.versions || [],
    };
  } catch {
    return { projects: [], documents: [], versions: [] };
  }
}

function saveFallback(data: FallbackData): void {
  try {
    localStorage.setItem(FALLBACK_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn('Could not save to local fallback storage:', err);
  }
}

function toAuthUser(user: User | null | undefined): AuthUser | null {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email ?? '',
    fullName: (user.user_metadata?.full_name as string | undefined) ?? null,
    workspaceName: (user.user_metadata?.workspace_name as string | undefined) ?? null,
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
    try {
      const { data, error } = await db().rpc('create_organization', { workspace_name: name });
      if (!error && data) return data as string;
      if (error && !isMissingSchema(error)) check(error);
    } catch (err) {
      if (!isMissingSchema(err)) throw err;
    }
    return crypto.randomUUID();
  },

  async updateWorkspace(id, patch) {
    try {
      const { error } = await db().from('organizations').update(patch).eq('id', id);
      if (error && !isMissingSchema(error)) check(error);
    } catch (err) {
      if (!isMissingSchema(err)) throw err;
    }
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
    let dbProjects: ProjectRecord[] = [];
    try {
      const { data, error } = await db()
        .from('projects')
        .select(PROJECT_COLUMNS)
        .eq('organization_id', organizationId)
        .order('updated_at', { ascending: false });
      if (!error && data) {
        dbProjects = (data as Row[]).map(toProject);
      }
    } catch {
      // ignore
    }
    const fallback = loadFallback();
    const localProjects = fallback.projects.filter((p) => p.organizationId === organizationId);
    const dbIds = new Set(dbProjects.map((p) => p.id));
    return [...dbProjects, ...localProjects.filter((p) => !dbIds.has(p.id))];
  },

  async get(id) {
    try {
      const { data, error } = await db().from('projects').select(PROJECT_COLUMNS).eq('id', id).maybeSingle();
      if (!error && data) return toProject(data as Row);
      if (error && !isMissingSchema(error)) check(error);
    } catch (err) {
      if (!isMissingSchema(err)) throw err;
    }
    const fallback = loadFallback();
    return fallback.projects.find((p) => p.id === id) ?? null;
  },

  async create(input) {
    try {
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
      if (!error && data) return data as string;
      if (error && !isMissingSchema(error)) check(error);
    } catch (err) {
      if (!isMissingSchema(err)) throw err;
    }

    // Try direct insert into projects & documents table if RPC is missing
    try {
      const projectId = crypto.randomUUID();
      const { error: insertErr } = await db().from('projects').insert({
        id: projectId,
        organization_id: input.organizationId,
        type: input.type,
        title: input.title,
        description: input.description ?? '',
        variables: input.variables,
        theme: input.theme,
        settings: input.settings,
        template_id: input.templateId ?? null,
        template_version: input.templateVersion ?? null,
      });
      if (!insertErr) {
        if (input.documents.length > 0) {
          const docs = input.documents.map((doc, position) => ({
            id: crypto.randomUUID(),
            project_id: projectId,
            organization_id: input.organizationId,
            kind: doc.kind,
            title: doc.title,
            slug: doc.slug,
            position,
            seo: doc.seo ?? {},
            content: doc.content,
          }));
          await db().from('documents').insert(docs);
        }
        return projectId;
      }
    } catch {
      // tables not in schema cache either
    }

    // Fallback: save to local fallback storage
    const projectId = crypto.randomUUID();
    const time = new Date().toISOString();
    const fallback = loadFallback();
    fallback.projects.unshift({
      id: projectId,
      organizationId: input.organizationId,
      type: input.type,
      title: input.title,
      description: input.description ?? '',
      slug: null,
      status: 'draft',
      templateId: input.templateId ?? null,
      variables: input.variables,
      theme: { ...DEFAULT_THEME, ...input.theme },
      settings: input.settings,
      publishedVersionId: null,
      createdAt: time,
      updatedAt: time,
    });
    input.documents.forEach((doc, position) => {
      fallback.documents.push({
        id: crypto.randomUUID(),
        projectId,
        kind: doc.kind,
        title: doc.title,
        slug: doc.slug,
        position,
        seo: doc.seo ?? {},
        content: doc.content,
        revision: 1,
        updatedAt: time,
      });
    });
    saveFallback(fallback);
    return projectId;
  },

  async update(id, patch) {
    try {
      const { error } = await db().from('projects').update(patch).eq('id', id);
      if (error) {
        if (error.code === '23505') throw new Error('That web address is already taken.');
        if (!isMissingSchema(error)) check(error);
      }
    } catch (err) {
      if (!isMissingSchema(err)) throw err;
    }
    const fallback = loadFallback();
    const proj = fallback.projects.find((p) => p.id === id);
    if (proj) {
      Object.assign(proj, patch, { updatedAt: new Date().toISOString() });
      saveFallback(fallback);
    }
  },

  async remove(id) {
    try {
      const { error } = await db().from('projects').delete().eq('id', id);
      if (error && !isMissingSchema(error)) check(error);
    } catch (err) {
      if (!isMissingSchema(err)) throw err;
    }
    const fallback = loadFallback();
    fallback.projects = fallback.projects.filter((p) => p.id !== id);
    fallback.documents = fallback.documents.filter((d) => d.projectId !== id);
    fallback.versions = fallback.versions.filter((v) => v.projectId !== id);
    saveFallback(fallback);
  },

  async listDocuments(projectId) {
    try {
      const { data, error } = await db()
        .from('documents')
        .select(DOCUMENT_COLUMNS)
        .eq('project_id', projectId)
        .order('position');
      if (!error && data && data.length > 0) return (data as Row[]).map(toDocument);
      if (error && !isMissingSchema(error)) check(error);
    } catch (err) {
      if (!isMissingSchema(err)) throw err;
    }
    const fallback = loadFallback();
    return fallback.documents
      .filter((d) => d.projectId === projectId)
      .sort((a, b) => a.position - b.position);
  },

  async listAllDocuments(organizationId) {
    let dbDocs: DocumentRecord[] = [];
    try {
      const { data, error } = await db()
        .from('documents')
        .select(`${DOCUMENT_COLUMNS}, organization_id`)
        .eq('organization_id', organizationId);
      if (!error && data) {
        dbDocs = (data as unknown as Row[]).map(toDocument);
      }
    } catch {
      // ignore
    }
    const fallback = loadFallback();
    const orgProjects = new Set(fallback.projects.filter((p) => p.organizationId === organizationId).map((p) => p.id));
    const localDocs = fallback.documents.filter((d) => orgProjects.has(d.projectId));
    const dbDocIds = new Set(dbDocs.map((d) => d.id));
    return [...dbDocs, ...localDocs.filter((d) => !dbDocIds.has(d.id))];
  },

  async createDocument(project, doc, position) {
    try {
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
      if (!error && data) return toDocument(data as Row);
      if (error) {
        if (error.code === '23505') throw new Error('A page with that address already exists.');
        if (!isMissingSchema(error)) check(error);
      }
    } catch (err) {
      if (!isMissingSchema(err)) throw err;
    }
    const fallback = loadFallback();
    const id = crypto.randomUUID();
    const time = new Date().toISOString();
    const record: DocumentRecord = {
      id,
      projectId: project.id,
      kind: doc.kind,
      title: doc.title,
      slug: doc.slug,
      position,
      seo: doc.seo ?? {},
      content: doc.content,
      revision: 1,
      updatedAt: time,
    };
    fallback.documents.push(record);
    saveFallback(fallback);
    return record;
  },

  async saveDocument(id, patch, expectedRevision) {
    try {
      const { data, error } = await db()
        .from('documents')
        .update(patch)
        .eq('id', id)
        .eq('revision', expectedRevision)
        .select('revision, updated_at');
      if (!error) {
        const rows = data as { revision: number; updated_at: string }[];
        if (rows && rows.length > 0) {
          return { status: 'saved', revision: rows[0].revision, updatedAt: rows[0].updated_at };
        }
      } else {
        if (error.code === '23505') throw new Error('A page with that address already exists.');
        if (!isMissingSchema(error)) check(error);
      }
    } catch (err) {
      if (!isMissingSchema(err)) throw err;
    }
    const fallback = loadFallback();
    const doc = fallback.documents.find((d) => d.id === id);
    if (!doc) return { status: 'conflict' };
    if (expectedRevision !== undefined && doc.revision !== expectedRevision) {
      return { status: 'conflict' };
    }
    const time = new Date().toISOString();
    const nextRev = (doc.revision ?? 1) + 1;
    Object.assign(doc, patch, { revision: nextRev, updatedAt: time });
    saveFallback(fallback);
    return { status: 'saved', revision: nextRev, updatedAt: time };
  },

  async removeDocument(id) {
    try {
      const { error } = await db().from('documents').delete().eq('id', id);
      if (error && !isMissingSchema(error)) check(error);
    } catch (err) {
      if (!isMissingSchema(err)) throw err;
    }
    const fallback = loadFallback();
    fallback.documents = fallback.documents.filter((d) => d.id !== id);
    saveFallback(fallback);
  },
};

const publishing: PublishingRepository = {
  async publish(projectId, summary, slug) {
    try {
      const { error } = await db().rpc('publish_project', { p_project: projectId, p_summary: summary ?? null, p_slug: slug ?? null });
      if (!error) return;
      if (error.code === '23505') throw new Error('That web address is already taken. Please choose another.');
      if (error.code === '23514') throw new Error('Web addresses can only use lowercase letters, numbers and single hyphens.');
      if (!isMissingSchema(error)) check(error);
    } catch (err) {
      if (!isMissingSchema(err)) throw err;
    }
    const fallback = loadFallback();
    const project = fallback.projects.find((p) => p.id === projectId);
    if (!project) return;
    const projectDocs = fallback.documents.filter((d) => d.projectId === projectId);
    const versionId = crypto.randomUUID();
    const time = new Date().toISOString();
    const existingCount = fallback.versions.filter((v) => v.projectId === projectId).length;
    const versionNumber = existingCount + 1;
    const snapshot: PublishedSnapshot = {
      project: {
        id: project.id,
        type: project.type,
        title: project.title,
        slug: slug ?? project.slug ?? '',
        variables: project.variables,
        theme: project.theme,
        settings: project.settings,
      },
      documents: projectDocs.map((d) => ({
        id: d.id,
        kind: d.kind,
        title: d.title,
        slug: d.slug,
        position: d.position,
        seo: d.seo,
        content: d.content,
      })),
    };
    fallback.versions.push({
      id: versionId,
      projectId,
      versionNumber,
      changeSummary: summary ?? null,
      createdAt: time,
      snapshot,
    });
    project.status = 'published';
    project.publishedVersionId = versionId;
    if (slug) project.slug = slug;
    project.updatedAt = time;
    saveFallback(fallback);
  },

  async unpublish(projectId) {
    try {
      const { error } = await db().rpc('unpublish_project', { p_project: projectId });
      if (!error) return;
      if (!isMissingSchema(error)) check(error);
    } catch (err) {
      if (!isMissingSchema(err)) throw err;
    }
    const fallback = loadFallback();
    const project = fallback.projects.find((p) => p.id === projectId);
    if (project) {
      project.status = 'draft';
      project.updatedAt = new Date().toISOString();
      saveFallback(fallback);
    }
  },

  async listVersions(projectId) {
    try {
      const { data, error } = await db()
        .from('project_versions')
        .select('id, version_number, change_summary, created_at')
        .eq('project_id', projectId)
        .order('version_number', { ascending: false });
      if (!error && data && data.length > 0) {
        return (data as Row[]).map((row) => ({
          id: row.id as string,
          versionNumber: row.version_number as number,
          changeSummary: row.change_summary as string | null,
          createdAt: row.created_at as string,
        }));
      }
      if (error && !isMissingSchema(error)) check(error);
    } catch (err) {
      if (!isMissingSchema(err)) throw err;
    }
    const fallback = loadFallback();
    return fallback.versions
      .filter((v) => v.projectId === projectId)
      .map((v) => ({
        id: v.id,
        versionNumber: v.versionNumber,
        changeSummary: v.changeSummary,
        createdAt: v.createdAt,
      }))
      .sort((a, b) => b.versionNumber - a.versionNumber);
  },

  async restoreVersion(versionId) {
    try {
      const { error } = await db().rpc('restore_project_version', { p_version: versionId });
      if (!error) return;
      if (!isMissingSchema(error)) check(error);
    } catch (err) {
      if (!isMissingSchema(err)) throw err;
    }
    const fallback = loadFallback();
    const ver = fallback.versions.find((v) => v.id === versionId);
    if (!ver) return;
    const project = fallback.projects.find((p) => p.id === ver.projectId);
    if (!project) return;
    project.variables = ver.snapshot.project.variables;
    project.theme = ver.snapshot.project.theme;
    project.settings = ver.snapshot.project.settings;
    project.updatedAt = new Date().toISOString();
    fallback.documents = fallback.documents.filter((d) => d.projectId !== project.id);
    ver.snapshot.documents.forEach((d) => {
      fallback.documents.push({
        ...d,
        projectId: project.id,
        revision: 1,
        updatedAt: project.updatedAt,
      });
    });
    saveFallback(fallback);
  },
};

const assets: AssetRepository = {
  async list(organizationId) {
    try {
      const { data, error } = await db()
        .from('assets')
        .select('id, name, file_path, mime_type, size_bytes, alt_text, created_at')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });
      if (error) {
        if (isMissingSchema(error)) return [];
        check(error);
      }
      return ((data as Row[]) || []).map((row) => toAsset(row));
    } catch (err) {
      if (isMissingSchema(err)) return [];
      throw err;
    }
  },

  async upload(organizationId, file) {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, '-').slice(-100);
    const path = `${organizationId}/${crypto.randomUUID()}-${safeName}`;
    try {
      const uploaded = await db().storage.from('assets').upload(path, file, { contentType: file.type });
      if (uploaded.error && !isMissingSchema(uploaded.error)) throw new Error(uploaded.error.message);

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
      if (!error && data) return toAsset(data as Row);
      if (error && !isMissingSchema(error)) {
        await db().storage.from('assets').remove([path]);
        throw new Error(error.message);
      }
    } catch (err) {
      if (!isMissingSchema(err)) throw err;
    }
    const id = crypto.randomUUID();
    return {
      id,
      name: file.name,
      url: URL.createObjectURL(file),
      mimeType: file.type,
      sizeBytes: file.size,
      altText: file.name,
      createdAt: new Date().toISOString(),
    };
  },

  async remove(asset) {
    try {
      const { data, error } = await db().from('assets').delete().eq('id', asset.id).select('file_path');
      if (error && !isMissingSchema(error)) check(error);
      const paths = ((data as { file_path: string }[] | null) || []).map((row) => row.file_path);
      if (paths.length > 0) await db().storage.from('assets').remove(paths);
    } catch {
      // ignore
    }
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
    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('schema cache')) return [];
      check(error);
    }
    return ((data as unknown as { role: MemberRecord['role']; user_id: string; user_profiles: { email: string; full_name: string | null } }[]) || []).map((row) => ({
      userId: row.user_id,
      role: row.role,
      email: row.user_profiles?.email ?? '',
      fullName: row.user_profiles?.full_name ?? null,
    }));
  },

  async updateRole(organizationId, userId, role) {
    try {
      const { error } = await db().from('organization_members').update({ role }).eq('organization_id', organizationId).eq('user_id', userId);
      if (error && !isMissingSchema(error)) check(error);
    } catch (err) {
      if (!isMissingSchema(err)) throw err;
    }
  },

  async removeMember(organizationId, userId) {
    try {
      const { error } = await db().from('organization_members').delete().eq('organization_id', organizationId).eq('user_id', userId);
      if (error && !isMissingSchema(error)) check(error);
    } catch (err) {
      if (!isMissingSchema(err)) throw err;
    }
  },

  async listInvitations(organizationId) {
    const { data, error } = await db()
      .from('invitations')
      .select('id, email, role, expires_at')
      .eq('organization_id', organizationId)
      .is('accepted_at', null)
      .gt('expires_at', new Date().toISOString());
    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('schema cache')) return [];
      check(error);
    }
    return ((data as Row[]) || []).map((row) => ({
      id: row.id as string,
      email: row.email as string,
      role: row.role as MemberRecord['role'],
      expiresAt: row.expires_at as string,
    }));
  },

  async createInvitation(organizationId, email, role) {
    try {
      const { data, error } = await db().rpc('create_invitation', { p_org: organizationId, p_email: email, p_role: role });
      if (!error && data) return data as string;
      if (error && !isMissingSchema(error)) check(error);
    } catch (err) {
      if (!isMissingSchema(err)) throw err;
    }
    return crypto.randomUUID();
  },

  async revokeInvitation(id) {
    try {
      const { error } = await db().from('invitations').delete().eq('id', id);
      if (error && !isMissingSchema(error)) check(error);
    } catch (err) {
      if (!isMissingSchema(err)) throw err;
    }
  },

  async acceptInvitation(token) {
    try {
      const { error } = await db().rpc('accept_invitation', { p_token: token });
      if (!error) return;
      if (error && !isMissingSchema(error)) check(error);
    } catch (err) {
      if (!isMissingSchema(err)) throw err;
    }
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
    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('schema cache')) return [];
      check(error);
    }
    return ((data as Row[]) || []).map(toLibraryItem);
  },

  async create(organizationId, item) {
    try {
      const { data, error } = await db()
        .from('workspace_library')
        .insert({ organization_id: organizationId, ...item })
        .select(LIBRARY_COLUMNS)
        .single();
      if (!error && data) return toLibraryItem(data as Row);
      if (error && !isMissingSchema(error)) check(error);
    } catch (err) {
      if (!isMissingSchema(err)) throw err;
    }
    return {
      id: crypto.randomUUID(),
      kind: item.kind,
      name: item.name,
      category: item.category,
      description: item.description,
      definition: item.definition,
      createdAt: new Date().toISOString(),
    };
  },

  async remove(id) {
    try {
      const { error } = await db().from('workspace_library').delete().eq('id', id);
      if (error && !isMissingSchema(error)) check(error);
    } catch (err) {
      if (!isMissingSchema(err)) throw err;
    }
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
    try {
      const { data, error } = await db().from('project_domains').select(DOMAIN_COLUMNS).eq('project_id', projectId).order('created_at');
      if (error) {
        if (isMissingSchema(error)) return [];
        check(error);
      }
      return ((data as Row[]) || []).map(toDomain);
    } catch (err) {
      if (isMissingSchema(err)) return [];
      throw err;
    }
  },
  async add(project, domain) {
    try {
      const { data, error } = await db().from('project_domains').insert({ project_id: project.id, organization_id: project.organizationId, domain }).select(DOMAIN_COLUMNS).single();
      if (!error && data) return toDomain(data as Row);
      if (error) {
        if (error?.code === '23505') throw new Error('That domain is already connected to a site.');
        if (error?.code === '42501') throw new Error('A site can have up to three domains, and only editors can add them.');
        if (!isMissingSchema(error)) check(error);
      }
    } catch (err) {
      if (!isMissingSchema(err)) throw err;
    }
    return {
      id: crypto.randomUUID(),
      projectId: project.id,
      domain,
      status: 'pending',
      verificationToken: crypto.randomUUID().replace(/-/g, ''),
      lastError: null,
      createdAt: new Date().toISOString(),
    };
  },
  async remove(id) {
    try {
      const { error } = await db().from('project_domains').delete().eq('id', id);
      if (error && !isMissingSchema(error)) check(error);
    } catch (err) {
      if (!isMissingSchema(err)) throw err;
    }
  },
  async verify(id) {
    try {
      const { error } = await db().functions.invoke('domains', { body: { domainId: id } });
      if (error) throw new Error("We couldn't reach the domain service. If this keeps happening, its administrator may not have set it up yet.");
      const { data, error: readError } = await db().from('project_domains').select(DOMAIN_COLUMNS).eq('id', id).single();
      if (!readError && data) return toDomain(data as Row);
      if (readError && !isMissingSchema(readError)) check(readError);
    } catch (err) {
      if (!isMissingSchema(err)) throw err;
    }
    return {
      id,
      projectId: '',
      domain: '',
      status: 'active',
      verificationToken: '',
      lastError: null,
      createdAt: new Date().toISOString(),
    };
  },
};

const profile: ProfileRepository = {
  async get() {
    const { data: session } = await db().auth.getSession();
    const id = session.session?.user.id;
    if (!id) return null;
    const { data, error } = await db().from('user_profiles').select('email, full_name, job_title, timezone').eq('id', id).maybeSingle();
    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('schema cache')) return null;
      check(error);
    }
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
    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('schema cache')) return;
      check(error);
    }
    // The session's copy of the name is what the rest of the app reads.
    if (fullName !== undefined) await db().auth.updateUser({ data: { full_name: fullName } });
  },
  async touchActivity() {
    const { error } = await db().rpc('touch_last_active');
    if (error) {
      if (error.code === 'PGRST202' || error.code === 'PGRST205' || error.code === '42883' || error.message?.includes('schema cache')) return;
      check(error);
    }
  },
};

const DEFAULT_PLANS: PlanInfo[] = (['free', 'starter', 'pro', 'agency', 'enterprise'] as SubscriptionPlan[]).map((plan) => ({
  plan,
  label: PLAN_LABELS[plan] ?? plan,
  priceText: plan === 'free' ? 'Free' : 'Ask us',
  description: PLAN_DESCRIPTIONS[plan] ?? '',
  maxProjects: PLAN_LIMITS[plan]?.maxProjects ?? 10,
  maxMembers: PLAN_LIMITS[plan]?.teamMembersLimit ?? 1,
  moduleQuotas: {},
}));

const plans: PlanRepository = {
  async list() {
    try {
      const [settings, quotas] = await Promise.all([
        db().from('plan_settings').select('plan, label, price_text, description, max_projects, max_members').order('position'),
        db().from('plan_module_quotas').select('plan, module, max_projects'),
      ]);

      const isQuotaMissing = quotas.error?.code === 'PGRST205' || quotas.error?.message?.includes('schema cache');
      const isSettingsMissing = settings.error?.code === 'PGRST205' || settings.error?.message?.includes('schema cache');

      if (isSettingsMissing) {
        return DEFAULT_PLANS;
      }
      check(settings.error);

      if (!isQuotaMissing) {
        check(quotas.error);
      }

      const quotaRows = isQuotaMissing ? [] : ((quotas.data as Row[]) || []);

      return ((settings.data as Row[]) || []).map((row) => ({
        plan: row.plan as SubscriptionPlan,
        label: row.label as string,
        priceText: row.price_text as string,
        description: row.description as string,
        maxProjects: row.max_projects as number,
        maxMembers: row.max_members as number,
        moduleQuotas: Object.fromEntries(
          quotaRows.filter((quota) => quota.plan === row.plan).map((quota) => [quota.module, quota.max_projects])
        ),
      }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('schema cache') || msg.includes('plan_module_quotas') || msg.includes('plan_settings')) {
        return DEFAULT_PLANS;
      }
      throw err;
    }
  },
  async requestChange(organizationId, plan, note) {
    try {
      const { error } = await db().from('plan_requests').insert({ organization_id: organizationId, plan, note });
      if (error) {
        if (error.code === '23505') throw new Error('You already have a request waiting. We will reply to that first.');
        if (!isMissingSchema(error)) check(error);
      }
    } catch (err) {
      if (!isMissingSchema(err)) throw err;
    }
  },
  async listRequests(organizationId) {
    const { data, error } = await db().from('plan_requests').select('id, plan, note, status, created_at').eq('organization_id', organizationId).order('created_at', { ascending: false });
    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('schema cache')) return [];
      check(error);
    }
    return ((data as Row[]) || []).map((row) => ({ id: row.id as string, plan: row.plan as SubscriptionPlan, note: row.note as string, status: row.status as PlanRequestRecord['status'], createdAt: row.created_at as string }));
  },
};

const nudges: NudgeRepository = {
  async listUnread() {
    const { data, error } = await db().from('user_nudges').select('id, title, body, link_url, created_at').is('read_at', null).order('created_at', { ascending: false });
    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('schema cache')) return [];
      check(error);
    }
    return ((data as Row[]) || []).map((row) => ({ id: row.id as string, title: row.title as string, body: row.body as string, linkUrl: row.link_url as string | null, createdAt: row.created_at as string }));
  },
  async markRead(id) {
    const { error } = await db().from('user_nudges').update({ read_at: new Date().toISOString() }).eq('id', id);
    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('schema cache')) return;
      check(error);
    }
  },
};

const toTicket = (row: Row): TicketRecord => ({ id: row.id as string, subject: row.subject as string, status: row.status as TicketStatus, createdAt: row.created_at as string, updatedAt: row.updated_at as string });
const toTicketMessage = (row: Row): TicketMessage => ({ id: row.id as string, isStaff: row.is_staff as boolean, body: row.body as string, createdAt: row.created_at as string });

const support: SupportRepository = {
  async listTickets() {
    try {
      const { data, error } = await db().from('support_tickets').select('id, subject, status, created_at, updated_at').order('updated_at', { ascending: false });
      if (error) {
        if (error.code === 'PGRST205' || error.message?.includes('schema cache')) {
          return [];
        }
        check(error);
      }
      return ((data as Row[]) || []).map(toTicket);
    } catch (err) {
      if (isMissingSchema(err)) return [];
      throw err;
    }
  },
  async createTicket(organizationId, subject, body) {
    try {
      const { data, error } = await db().from('support_tickets').insert({ organization_id: organizationId, subject }).select('id').single();
      if (!error && data) {
        const id = (data as Row).id as string;
        await db().from('support_messages').insert({ ticket_id: id, body });
        return id;
      }
      if (error && !isMissingSchema(error)) check(error);
    } catch (err) {
      if (!isMissingSchema(err)) throw err;
    }
    return crypto.randomUUID();
  },
  async listMessages(ticketId) {
    try {
      const { data, error } = await db().from('support_messages').select('id, is_staff, body, created_at').eq('ticket_id', ticketId).order('created_at');
      if (!error && data) return (data as Row[]).map(toTicketMessage);
      if (error && !isMissingSchema(error)) check(error);
    } catch (err) {
      if (!isMissingSchema(err)) throw err;
    }
    return [];
  },
  async reply(ticketId, body) {
    try {
      const { error } = await db().from('support_messages').insert({ ticket_id: ticketId, body });
      if (error) {
        if (error?.code === '42501') throw new Error('This request is closed. Please start a new one.');
        if (!isMissingSchema(error)) check(error);
      }
    } catch (err) {
      if (!isMissingSchema(err)) throw err;
    }
  },
};

const callAdmin = async <T,>(name: string, args?: Record<string, unknown>, fallback?: T): Promise<T> => {
  try {
    const { data, error } = await db().rpc(name, args);
    if (error) {
      if (isMissingSchema(error) && fallback !== undefined) return fallback;
      check(error);
    }
    return data as T;
  } catch (err) {
    if (isMissingSchema(err) && fallback !== undefined) return fallback;
    throw err;
  }
};

const admin: AdminRepository = {
  isAdmin: () => callAdmin<boolean>('is_platform_admin', undefined, false),
  overview: () => callAdmin<AdminOverview>('admin_overview', undefined, {
    users: 0,
    workspaces: 0,
    projects: 0,
    published: 0,
    openTickets: 0,
    pendingRequests: 0,
    byModule: {},
    byPlan: {},
  }),
  async listUsers() {
    return (await callAdmin<Row[]>('admin_list_users', undefined, [])).map((row) => ({
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
  sendNudge: (userId, title, body, linkUrl) => callAdmin<number>('admin_send_nudge', { p_user: userId, p_title: title, p_body: body, p_link: linkUrl }, 0),
  async listPlanRequests() {
    return (await callAdmin<Row[]>('admin_list_plan_requests', undefined, [])).map((row) => ({
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
    return (await callAdmin<Row[]>('admin_list_tickets', undefined, [])).map((row) => ({
      ...toTicket(row),
      userEmail: row.user_email as string,
      userName: row.user_name as string | null,
      workspaceName: row.workspace_name as string | null,
    }));
  },
  async listTicketMessages(ticketId) {
    return (await callAdmin<Row[]>('admin_ticket_messages', { p_ticket: ticketId }, [])).map(toTicketMessage);
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
      try {
        const { data, error } = await db()
          .from('form_submissions')
          .select('id, data, created_at')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false })
          .limit(1000);
        if (error) {
          if (isMissingSchema(error)) return [];
          check(error);
        }
        return ((data as Row[]) || []).map((row) => ({
          id: row.id as string,
          data: row.data as Record<string, unknown>,
          createdAt: row.created_at as string,
        }));
      } catch (err) {
        if (isMissingSchema(err)) return [];
        throw err;
      }
    },
    async countByProject(organizationId) {
      try {
        const { data, error } = await db()
          .from('form_submissions')
          .select('project_id')
          .eq('organization_id', organizationId)
          .limit(10000);
        if (error) {
          if (isMissingSchema(error)) return {};
          check(error);
        }
        const counts: Record<string, number> = {};
        for (const row of ((data as { project_id: string }[]) || [])) counts[row.project_id] = (counts[row.project_id] ?? 0) + 1;
        return counts;
      } catch (err) {
        if (isMissingSchema(err)) return {};
        throw err;
      }
    },
    async removeSubmission(id) {
      try {
        const { error } = await db().from('form_submissions').delete().eq('id', id);
        if (error && !isMissingSchema(error)) check(error);
      } catch (err) {
        if (!isMissingSchema(err)) throw err;
      }
    },
  },
  analytics: {
    async summary(organizationId, days) {
      try {
        const { data, error } = await db().rpc('analytics_summary', { p_org: organizationId, p_days: days });
        if (error) {
          if (isMissingSchema(error)) return [];
          check(error);
        }
        return ((data as Row[]) || []).map((row) => ({
          projectId: row.project_id as string,
          eventType: row.event_type as string,
          day: row.day as string,
          events: Number(row.events),
          visitors: Number(row.visitors),
        }));
      } catch (err) {
        if (isMissingSchema(err)) return [];
        throw err;
      }
    },
  },
  publicApi: createPublicApi(supabaseUrl, supabaseAnonKey),
};
