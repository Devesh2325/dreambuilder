import { DEFAULT_THEME, PROJECT_TYPES } from '../core/schema';
import { PLAN_LIMITS } from '../types/auth';
import { LocalStore, openLocalStore } from './localStore';
import {
  AnalyticsRow, AppServices, AssetRecord, AuthUser, DocumentRecord, InvitationRecord, LibraryItem, MemberRecord, ProjectRecord,
  PublishedSnapshot, SubmissionRecord, VersionRecord, WorkspaceMembership,
} from './services';

/**
 * Backend that keeps everything in this browser, used for demos and end-to-end
 * tests (VITE_BACKEND=local). It isn't secure and every "account" is on one device:
 * real security lives in the Supabase migrations.
 */

interface LocalUser extends AuthUser {
  password: string;
}

interface StoredVersion extends VersionRecord {
  projectId: string;
  snapshot: PublishedSnapshot;
}

interface LocalEvent {
  projectId: string;
  type: string;
  visitorId?: string;
  day: string;
}

interface LocalState {
  users: LocalUser[];
  currentUserId: string | null;
  workspaces: (Omit<WorkspaceMembership, 'role' | 'organizationId'> & { id: string })[];
  members: { organizationId: string; userId: string; role: MemberRecord['role'] }[];
  projects: ProjectRecord[];
  documents: DocumentRecord[];
  versions: StoredVersion[];
  assets: (AssetRecord & { organizationId: string })[];
  submissions: (SubmissionRecord & { projectId: string })[];
  events: LocalEvent[];
  invitations: (InvitationRecord & { organizationId: string; token: string; accepted: boolean })[];
  library: (LibraryItem & { organizationId: string })[];
}


const emptyState = (): LocalState => ({
  users: [],
  currentUserId: null,
  workspaces: [],
  members: [],
  projects: [],
  documents: [],
  versions: [],
  assets: [],
  submissions: [],
  events: [],
  invitations: [],
  library: [],
});

function normalize(stored: Partial<LocalState> | undefined): LocalState {
  const state: LocalState = { ...emptyState(), ...stored };
  // Saved demo data can include modules that no longer exist.
  for (const project of state.projects as { type: string }[]) {
    // Popups became a kind of banner.
    if (project.type === 'popup') project.type = 'banner';
  }
  state.projects = state.projects.filter((project) => PROJECT_TYPES.includes(project.type));
  return state;
}

let storePromise: Promise<LocalStore<LocalState>> | null = null;
const store = () => (storePromise ??= openLocalStore<LocalState>());

async function load(): Promise<LocalState> {
  return normalize(await (await store()).read());
}

async function update<T>(change: (state: LocalState) => T): Promise<T> {
  return (await store()).update((stored) => {
    const state = normalize(stored);
    const result = change(state);
    return { state, result };
  });
}

/** Whoever is signed in can only open projects in their own workspaces. */
const canOpen = (state: LocalState, project: ProjectRecord | undefined) =>
  Boolean(project) && (!state.currentUserId || state.members.some((m) => m.userId === state.currentUserId && m.organizationId === project!.organizationId));

const now = () => new Date().toISOString();
const uuid = () => crypto.randomUUID();
const slugify = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50);

function requireProject(state: LocalState, id: string): ProjectRecord {
  const project = state.projects.find((p) => p.id === id);
  if (!project) throw new Error('Project not found');
  return project;
}

function publishedSnapshot(state: LocalState, project: ProjectRecord | undefined): PublishedSnapshot | null {
  if (!project || project.status !== 'published') return null;
  const version = state.versions.find((v) => v.id === project.publishedVersionId);
  if (!version) return null;
  const snapshot = structuredClone(version.snapshot);
  delete snapshot.project.settings.webhookUrl;
  delete snapshot.project.settings.builderUrl;
  delete snapshot.project.settings.variableDefs;
  return snapshot;
}

export function createLocalServices(): AppServices {
  const listeners = new Set<(user: AuthUser | null) => void>();

  const toPublicUser = (user: LocalUser | undefined): AuthUser | null =>
    user ? { id: user.id, email: user.email, fullName: user.fullName } : null;

  const notify = async () => {
    const state = await load();
    const user = toPublicUser(state.users.find((u) => u.id === state.currentUserId));
    listeners.forEach((listener) => listener(user));
  };

  return {
    auth: {
      getUser: async () => {
        const state = await load();
        return toPublicUser(state.users.find((u) => u.id === state.currentUserId));
      },
      onChange(listener) {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
      async signIn(email, password) {
        const found = await update((state) => {
          const user = state.users.find((u) => u.email === email.toLowerCase() && u.password === password);
          if (user) state.currentUserId = user.id;
          return Boolean(user);
        });
        if (!found) return { error: 'Invalid login credentials' };
        await notify();
        return { error: null };
      },
      async signUp({ email, password, fullName, workspaceName }) {
        const result = await update((state) => {
          const lower = email.toLowerCase();
          if (state.users.some((u) => u.email === lower)) return 'User already registered';
          const user: LocalUser = { id: uuid(), email: lower, fullName, password };
          const id = uuid();
          state.users.push(user);
          state.workspaces.push({ id, name: workspaceName, slug: `${slugify(workspaceName) || 'workspace'}-${id.slice(0, 8)}`, plan: 'free', branding: {} });
          state.members.push({ organizationId: id, userId: user.id, role: 'owner' });
          state.currentUserId = user.id;
          return null;
        });
        if (result) return { error: result, needsEmailConfirmation: false };
        await notify();
        return { error: null, needsEmailConfirmation: false };
      },
      async signOut() {
        await update((state) => {
          state.currentUserId = null;
        });
        await notify();
        return { error: null };
      },
      sendPasswordReset: async () => ({ error: null }),
      async updatePassword(password) {
        await update((state) => {
          const user = state.users.find((u) => u.id === state.currentUserId);
          if (user) user.password = password;
        });
        return { error: null };
      },
    },

    workspaces: {
      async listMemberships(userId) {
        const state = await load();
        return state.members
          .filter((m) => m.userId === userId)
          .flatMap((m) => {
            const workspace = state.workspaces.find((w) => w.id === m.organizationId);
            return workspace
              ? [{ organizationId: workspace.id, name: workspace.name, slug: workspace.slug, plan: workspace.plan, branding: workspace.branding, role: m.role }]
              : [];
          });
      },
      async createWorkspace(name) {
        return update((state) => {
          const id = uuid();
          state.workspaces.push({ id, name, slug: `${slugify(name) || 'workspace'}-${id.slice(0, 8)}`, plan: 'free', branding: {} });
          state.members.push({ organizationId: id, userId: state.currentUserId!, role: 'owner' });
          return id;
        });
      },
      async updateWorkspace(id, patch) {
        await update((state) => {
          const workspace = state.workspaces.find((w) => w.id === id);
          if (workspace) Object.assign(workspace, patch);
        });
      },
    },

    projects: {
      async list(organizationId) {
        return (await load()).projects
          .filter((p) => p.organizationId === organizationId)
          .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      },
      async get(id) {
        const state = await load();
        const project = state.projects.find((p) => p.id === id);
        return canOpen(state, project) ? project! : null;
      },
      async create(input) {
        return update((state) => {
          const workspace = state.workspaces.find((w) => w.id === input.organizationId);
          const count = state.projects.filter((p) => p.organizationId === input.organizationId).length;
          // Local mode is for trying the product, so only warns about limits on real plans.
          if (workspace && workspace.plan !== 'free' && count >= PLAN_LIMITS[workspace.plan].maxProjects) {
            throw new Error("Your plan's project limit has been reached");
          }
          const id = uuid();
          const time = now();
          state.projects.push({
            id,
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
            state.documents.push({
              id: uuid(),
              projectId: id,
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
          return id;
        });
      },
      async update(id, patch) {
        await update((state) => {
          const taken = patch.slug && state.projects.some((p) => p.slug === patch.slug && p.id !== id);
          if (taken) throw new Error('That web address is already taken.');
          Object.assign(requireProject(state, id), patch, { updatedAt: now() });
        });
      },
      async remove(id) {
        await update((state) => {
          state.projects = state.projects.filter((p) => p.id !== id);
          state.documents = state.documents.filter((d) => d.projectId !== id);
          state.versions = state.versions.filter((v) => v.projectId !== id);
          state.submissions = state.submissions.filter((s) => s.projectId !== id);
        });
      },
      async listDocuments(projectId) {
        const state = await load();
        if (!canOpen(state, state.projects.find((p) => p.id === projectId))) return [];
        return state.documents.filter((d) => d.projectId === projectId).sort((a, b) => a.position - b.position);
      },
      async listAllDocuments(organizationId) {
        const state = await load();
        const ids = new Set(state.projects.filter((p) => p.organizationId === organizationId).map((p) => p.id));
        return state.documents.filter((d) => ids.has(d.projectId));
      },
      async createDocument(project, doc, position) {
        return update((state) => {
          if (state.documents.some((d) => d.projectId === project.id && d.slug === doc.slug)) {
            throw new Error('A page with that address already exists.');
          }
          const record: DocumentRecord = {
            id: uuid(),
            projectId: project.id,
            kind: doc.kind,
            title: doc.title,
            slug: doc.slug,
            position,
            seo: doc.seo ?? {},
            content: doc.content,
            revision: 1,
            updatedAt: now(),
          };
          state.documents.push(record);
          return record;
        });
      },
      async saveDocument(id, patch, expectedRevision) {
        return update((state) => {
          const doc = state.documents.find((d) => d.id === id);
          if (!doc || doc.revision !== expectedRevision) return { status: 'conflict' as const };
          if (patch.slug !== undefined && state.documents.some((d) => d.projectId === doc.projectId && d.slug === patch.slug && d.id !== id)) {
            throw new Error('A page with that address already exists.');
          }
          Object.assign(doc, patch, { revision: doc.revision + 1, updatedAt: now() });
          return { status: 'saved' as const, revision: doc.revision, updatedAt: doc.updatedAt };
        });
      },
      async removeDocument(id) {
        await update((state) => {
          state.documents = state.documents.filter((d) => d.id !== id);
        });
      },
    },

    publishing: {
      async publish(projectId, summary, slug) {
        await update((state) => {
          const project = requireProject(state, projectId);
          const documents = state.documents.filter((d) => d.projectId === projectId).sort((a, b) => a.position - b.position);
          if (documents.length === 0) throw new Error('Project has nothing to publish');
          const finalSlug = slug || project.slug || `${slugify(project.title) || 'site'}-${project.id.slice(0, 6)}`;
          if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(finalSlug)) {
            throw new Error('Web addresses can only use lowercase letters, numbers and single hyphens.');
          }
          if (state.projects.some((p) => p.slug === finalSlug && p.id !== projectId)) {
            throw new Error('That web address is already taken. Please choose another.');
          }
          const versionNumber = Math.max(0, ...state.versions.filter((v) => v.projectId === projectId).map((v) => v.versionNumber)) + 1;
          const id = uuid();
          state.versions.push({
            id,
            projectId,
            versionNumber,
            changeSummary: summary ?? null,
            createdAt: now(),
            snapshot: structuredClone({
              project: {
                id: project.id,
                type: project.type,
                title: project.title,
                slug: finalSlug,
                variables: project.variables,
                theme: project.theme,
                settings: project.settings,
              },
              documents: documents.map(({ id: docId, kind, title, slug: docSlug, position, seo, content }) => ({
                id: docId, kind, title, slug: docSlug, position, seo, content,
              })),
            }),
          });
          Object.assign(project, { status: 'published', publishedVersionId: id, slug: finalSlug, updatedAt: now() });
        });
      },
      async unpublish(projectId) {
        await update((state) => {
          Object.assign(requireProject(state, projectId), { status: 'draft', publishedVersionId: null });
        });
      },
      async listVersions(projectId) {
        return (await load()).versions
          .filter((v) => v.projectId === projectId)
          .sort((a, b) => b.versionNumber - a.versionNumber)
          .map(({ id, versionNumber, changeSummary, createdAt }) => ({ id, versionNumber, changeSummary, createdAt }));
      },
      async restoreVersion(versionId) {
        await update((state) => {
          const version = state.versions.find((v) => v.id === versionId);
          if (!version) throw new Error('Version not found');
          const { title, variables, theme, settings } = version.snapshot.project;
          Object.assign(requireProject(state, version.projectId), { title, variables, theme, settings });
          const previous = state.documents.filter((d) => d.projectId === version.projectId);
          state.documents = state.documents.filter((d) => d.projectId !== version.projectId);
          for (const doc of version.snapshot.documents) {
            const revision = (previous.find((d) => d.id === doc.id)?.revision ?? 0) + 1;
            state.documents.push({ ...structuredClone(doc), projectId: version.projectId, revision, updatedAt: now() });
          }
        });
      },
    },

    assets: {
      async list(organizationId) {
        return (await load()).assets.filter((a) => a.organizationId === organizationId);
      },
      async upload(organizationId, file) {
        const url = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error('Could not read the file'));
          reader.readAsDataURL(file);
        });
        return update((state) => {
          const asset = { id: uuid(), organizationId, name: file.name, url, mimeType: file.type, sizeBytes: file.size, altText: '', createdAt: now() };
          state.assets.unshift(asset);
          return asset;
        });
      },
      async remove(asset) {
        await update((state) => {
          state.assets = state.assets.filter((a) => a.id !== asset.id);
        });
      },
    },

    forms: {
      async listSubmissions(projectId) {
        return (await load()).submissions.filter((s) => s.projectId === projectId);
      },
      async countByProject(organizationId) {
        const state = await load();
        const ids = new Set(state.projects.filter((p) => p.organizationId === organizationId).map((p) => p.id));
        const counts: Record<string, number> = {};
        for (const row of state.submissions) {
          if (ids.has(row.projectId)) counts[row.projectId] = (counts[row.projectId] ?? 0) + 1;
        }
        return counts;
      },
      async removeSubmission(id) {
        await update((state) => {
          state.submissions = state.submissions.filter((s) => s.id !== id);
        });
      },
    },

    analytics: {
      async summary(organizationId) {
        const state = await load();
        const ids = new Set(state.projects.filter((p) => p.organizationId === organizationId).map((p) => p.id));
        const rows = new Map<string, AnalyticsRow & { seen: Set<string> }>();
        for (const event of state.events.filter((e) => ids.has(e.projectId))) {
          const key = `${event.projectId}|${event.type}|${event.day}`;
          const row = rows.get(key) ?? { projectId: event.projectId, eventType: event.type, day: event.day, events: 0, visitors: 0, seen: new Set<string>() };
          row.events += 1;
          if (event.visitorId) row.seen.add(event.visitorId);
          row.visitors = row.seen.size;
          rows.set(key, row);
        }
        return [...rows.values()].map(({ seen: _seen, ...row }) => row);
      },
    },

    team: {
      async listMembers(organizationId) {
        const state = await load();
        return state.members
          .filter((m) => m.organizationId === organizationId)
          .map((m) => {
            const user = state.users.find((u) => u.id === m.userId);
            return { userId: m.userId, role: m.role, email: user?.email ?? '', fullName: user?.fullName ?? null };
          });
      },
      async updateRole(organizationId, userId, role) {
        await update((state) => {
          const owners = state.members.filter((m) => m.organizationId === organizationId && m.role === 'owner');
          const member = state.members.find((m) => m.organizationId === organizationId && m.userId === userId);
          if (member?.role === 'owner' && role !== 'owner' && owners.length === 1) throw new Error('A workspace must keep at least one owner');
          if (member) member.role = role;
        });
      },
      async removeMember(organizationId, userId) {
        await update((state) => {
          const owners = state.members.filter((m) => m.organizationId === organizationId && m.role === 'owner');
          if (owners.length === 1 && owners[0].userId === userId) throw new Error('A workspace must keep at least one owner');
          state.members = state.members.filter((m) => !(m.organizationId === organizationId && m.userId === userId));
        });
      },
      async listInvitations(organizationId) {
        return (await load()).invitations
          .filter((i) => i.organizationId === organizationId && !i.accepted)
          .map(({ id, email, role, expiresAt }) => ({ id, email, role, expiresAt }));
      },
      async createInvitation(organizationId, email, role) {
        return update((state) => {
          const token = uuid().replace(/-/g, '');
          state.invitations.push({
            id: uuid(),
            organizationId,
            email: email.toLowerCase(),
            role,
            token,
            accepted: false,
            expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
          });
          return token;
        });
      },
      async revokeInvitation(id) {
        await update((state) => {
          state.invitations = state.invitations.filter((i) => i.id !== id);
        });
      },
      async acceptInvitation(token) {
        await update((state) => {
          const invite = state.invitations.find((i) => i.token === token && !i.accepted);
          const user = state.users.find((u) => u.id === state.currentUserId);
          if (!invite || !user || invite.email !== user.email) throw new Error('This invitation is invalid or has expired');
          invite.accepted = true;
          state.members.push({ organizationId: invite.organizationId, userId: user.id, role: invite.role });
        });
      },
    },

    library: {
      async list(organizationId, kind) {
        return (await load()).library.filter((item) => item.organizationId === organizationId && item.kind === kind);
      },
      async create(organizationId, item) {
        return update((state) => {
          const record = { ...item, id: uuid(), createdAt: now(), organizationId };
          state.library.unshift(record);
          return record;
        });
      },
      async remove(id) {
        await update((state) => {
          state.library = state.library.filter((item) => item.id !== id);
        });
      },
    },

    publicApi: {
      async getPublishedSite(slug) {
        const state = await load();
        return publishedSnapshot(state, state.projects.find((p) => p.slug === slug));
      },
      async getPublishedExperience(projectId) {
        const state = await load();
        return publishedSnapshot(state, state.projects.find((p) => p.id === projectId));
      },
      async submitForm(projectId, data) {
        await update((state) => {
          if (!publishedSnapshot(state, state.projects.find((p) => p.id === projectId))) {
            throw new Error('This form is not available');
          }
          if (data._hp) return;
          const { _hp, ...answers } = data;
          state.submissions.unshift({ id: uuid(), projectId, data: answers, createdAt: now() });
        });
      },
      async trackEvents(projectId, events) {
        await update((state) => {
          const day = now().slice(0, 10);
          state.events.push(...events.map((event) => ({ projectId, type: event.type, visitorId: event.visitorId, day })));
          if (state.events.length > 5000) state.events.splice(0, state.events.length - 5000);
        });
      },
    },
  };
}
