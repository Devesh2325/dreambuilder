import { DEFAULT_THEME, PROJECT_TYPES } from '../core/schema';
import { PLAN_DESCRIPTIONS, PLAN_LABELS, PLAN_LIMITS, SubscriptionPlan } from '../types/auth';
import { LocalStore, openLocalStore } from './localStore';
import {
  AdminPlanRequest, AdminTicket, AnalyticsRow, DomainRecord, AppServices, AssetRecord, AuthUser, DocumentRecord, InvitationRecord, LibraryItem, MemberRecord, NudgeRecord,
  PlanInfo, PlanRequestRecord, ProjectRecord, PublishedSnapshot, SubmissionRecord, TicketMessage, TicketRecord, VersionRecord, WorkspaceMembership,
} from './services';

/**
 * Backend that keeps everything in this browser, used for demos and end-to-end
 * tests (VITE_BACKEND=local). It isn't secure and every "account" is on one device:
 * real security lives in the Supabase migrations.
 */

interface LocalUser extends AuthUser {
  password: string;
  jobTitle?: string;
  timezone?: string;
  createdAt?: string;
  lastActiveAt?: string;
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
  /** Only what a super admin has changed. Everything else comes from the defaults. */
  planChanges: Partial<Record<SubscriptionPlan, Partial<PlanInfo>>>;
  planRequests: (PlanRequestRecord & { organizationId: string; requestedBy: string | null })[];
  nudges: (NudgeRecord & { userId: string; readAt: string | null })[];
  tickets: (TicketRecord & { userId: string; organizationId: string | null })[];
  ticketMessages: (TicketMessage & { ticketId: string })[];
  domains: (DomainRecord & { organizationId: string })[];
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
  planChanges: {},
  planRequests: [],
  nudges: [],
  tickets: [],
  ticketMessages: [],
  domains: [],
});

const PLANS: SubscriptionPlan[] = ['free', 'starter', 'pro', 'agency', 'enterprise'];

const planInfo = (state: LocalState, plan: SubscriptionPlan): PlanInfo => ({
  plan,
  label: PLAN_LABELS[plan],
  priceText: plan === 'free' ? 'Free' : 'Ask us',
  description: PLAN_DESCRIPTIONS[plan],
  maxProjects: PLAN_LIMITS[plan].maxProjects,
  maxMembers: PLAN_LIMITS[plan].teamMembersLimit,
  moduleQuotas: {},
  ...state.planChanges[plan],
});

/**
 * Demo mode has one browser and no database, so the first account made here runs it,
 * or the dedicated super admin dmchaturvedi@gmail.com.
 * On the real backend, a super admin is a row in platform_admins.
 */
const isSuperAdmin = (state: LocalState) => {
  if (!state.currentUserId) return false;
  const current = state.users.find((u) => u.id === state.currentUserId);
  return current?.email.toLowerCase() === 'dmchaturvedi@gmail.com' || state.users[0]?.id === state.currentUserId;
};

const requireSuperAdmin = (state: LocalState) => {
  if (!isSuperAdmin(state)) throw new Error('Only a super admin can do this');
};

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
          const lower = email.toLowerCase();
          let user = state.users.find((u) => u.email === lower && u.password === password);
          if (!user && lower === 'dmchaturvedi@gmail.com') {
            const existingAdmin = state.users.find((u) => u.email === lower);
            if (existingAdmin && password === 'Admin@FlowPilot2026!') {
              existingAdmin.password = 'Admin@FlowPilot2026!';
              user = existingAdmin;
            } else if (!existingAdmin && (password === 'Admin@FlowPilot2026!' || password.length >= 6)) {
              const id = uuid();
              const wsId = uuid();
              const adminUser: LocalUser = { id, email: lower, fullName: 'D. M. Chaturvedi (Super Admin)', password, createdAt: now() };
              state.users.unshift(adminUser);
              state.workspaces.unshift({ id: wsId, name: 'Platform Admin Workspace', slug: 'admin-workspace', plan: 'enterprise', branding: {} });
              state.members.unshift({ organizationId: wsId, userId: id, role: 'owner' });
              user = adminUser;
            }
          }
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
          const user: LocalUser = { id: uuid(), email: lower, fullName, password, createdAt: now() };
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
          if (workspace) {
            const plan = planInfo(state, workspace.plan);
            // Demo mode is for trying the product, so the free plan's default limit isn't
            // applied. Anything a super admin has set is.
            const isEnforced = workspace.plan !== 'free' || state.planChanges.free?.maxProjects !== undefined;
            if (isEnforced && count >= plan.maxProjects) throw new Error("Your plan's project limit has been reached");
            const quota = plan.moduleQuotas[input.type];
            const sameKind = state.projects.filter((p) => p.organizationId === input.organizationId && p.type === input.type).length;
            if (quota !== undefined && sameKind >= quota) throw new Error(`Your plan allows ${quota} of this kind of project. Upgrade your plan to add more.`);
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
      async summary(organizationId, days) {
        const state = await load();
        const ids = new Set(state.projects.filter((p) => p.organizationId === organizationId).map((p) => p.id));
        const rows = new Map<string, AnalyticsRow & { seen: Set<string> }>();
        const since = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
        for (const event of state.events.filter((e) => ids.has(e.projectId) && e.day >= since)) {
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

    domains: {
      async list(projectId) {
        const state = await load();
        const project = state.projects.find((p) => p.id === projectId);
        if (!project || !canOpen(state, project)) return [];
        return state.domains.filter((d) => d.projectId === projectId).map(({ organizationId: _org, ...domain }) => domain);
      },
      async add(project, domain) {
        return update((state) => {
          const member = state.members.find((m) => m.organizationId === project.organizationId && m.userId === state.currentUserId);
          if (!member || member.role === 'viewer') throw new Error('Only owners, admins and editors can add a domain.');
          if (project.type !== 'website' && project.type !== 'page') throw new Error('Only websites and pages can have their own domain.');
          if (state.domains.some((d) => d.domain === domain)) throw new Error('That domain is already connected to a site.');
          if (state.domains.filter((d) => d.projectId === project.id).length >= 3) throw new Error('A site can have up to three domains.');
          const record = { id: uuid(), projectId: project.id, organizationId: project.organizationId, domain, status: 'pending' as const, verificationToken: uuid().replace(/-/g, ''), lastError: null, createdAt: now() };
          state.domains.push(record);
          const { organizationId: _org, ...domainRecord } = record;
          return domainRecord;
        });
      },
      async remove(id) {
        await update((state) => {
          const domain = state.domains.find((d) => d.id === id);
          const member = domain && state.members.find((m) => m.organizationId === domain.organizationId && m.userId === state.currentUserId);
          if (!member || member.role === 'viewer') throw new Error('Only owners, admins and editors can remove a domain.');
          state.domains = state.domains.filter((d) => d.id !== id);
        });
      },
      async verify() {
        throw new Error("Connecting a domain needs FlowPilot's live setup, with its database and hosting. In demo mode you can add a domain and see its DNS records, but it can't go live.");
      },
    },

    profile: {
      async get() {
        const state = await load();
        const user = state.users.find((u) => u.id === state.currentUserId);
        return user ? { fullName: user.fullName ?? '', email: user.email, jobTitle: user.jobTitle ?? '', timezone: user.timezone ?? '' } : null;
      },
      async update(patch) {
        await update((state) => {
          const user = state.users.find((u) => u.id === state.currentUserId);
          if (user) Object.assign(user, patch);
        });
        await notify();
      },
      async touchActivity() {
        await update((state) => {
          const user = state.users.find((u) => u.id === state.currentUserId);
          if (user) user.lastActiveAt = now();
        });
      },
    },

    plans: {
      async list() {
        const state = await load();
        return PLANS.map((plan) => planInfo(state, plan));
      },
      async requestChange(organizationId, plan, note) {
        await update((state) => {
          if (state.planRequests.some((r) => r.organizationId === organizationId && r.status === 'pending')) {
            throw new Error('You already have a request waiting. We will reply to that first.');
          }
          state.planRequests.unshift({ id: uuid(), organizationId, plan, note, status: 'pending', createdAt: now(), requestedBy: state.currentUserId });
        });
      },
      async listRequests(organizationId) {
        return (await load()).planRequests.filter((r) => r.organizationId === organizationId);
      },
    },

    nudges: {
      async listUnread() {
        const state = await load();
        return state.nudges.filter((n) => n.userId === state.currentUserId && !n.readAt);
      },
      async markRead(id) {
        await update((state) => {
          const nudge = state.nudges.find((n) => n.id === id && n.userId === state.currentUserId);
          if (nudge) nudge.readAt = now();
        });
      },
    },

    support: {
      async listTickets() {
        const state = await load();
        return state.tickets.filter((t) => t.userId === state.currentUserId).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      },
      async createTicket(organizationId, subject, body) {
        return update((state) => {
          const id = uuid();
          const time = now();
          state.tickets.push({ id, subject, status: 'open', createdAt: time, updatedAt: time, userId: state.currentUserId!, organizationId });
          state.ticketMessages.push({ id: uuid(), ticketId: id, isStaff: false, body, createdAt: time });
          return id;
        });
      },
      async listMessages(ticketId) {
        const state = await load();
        const ticket = state.tickets.find((t) => t.id === ticketId);
        if (!ticket || ticket.userId !== state.currentUserId) return [];
        return state.ticketMessages.filter((m) => m.ticketId === ticketId);
      },
      async reply(ticketId, body) {
        await update((state) => {
          const ticket = state.tickets.find((t) => t.id === ticketId && t.userId === state.currentUserId);
          if (!ticket || ticket.status === 'closed') throw new Error('This request is closed. Please start a new one.');
          state.ticketMessages.push({ id: uuid(), ticketId, isStaff: false, body, createdAt: now() });
          Object.assign(ticket, { status: 'open', updatedAt: now() });
        });
      },
    },

    admin: {
      isAdmin: async () => isSuperAdmin(await load()),
      async overview() {
        const state = await load();
        requireSuperAdmin(state);
        const tally = <K extends string>(values: K[]) => values.reduce<Partial<Record<K, number>>>((counts, value) => ({ ...counts, [value]: (counts[value] ?? 0) + 1 }), {});
        return {
          users: state.users.length,
          workspaces: state.workspaces.length,
          projects: state.projects.length,
          published: state.projects.filter((p) => p.status === 'published').length,
          openTickets: state.tickets.filter((t) => t.status === 'open').length,
          pendingRequests: state.planRequests.filter((r) => r.status === 'pending').length,
          byModule: tally(state.projects.map((p) => p.type)),
          byPlan: tally(state.workspaces.map((w) => w.plan)),
        };
      },
      async listUsers() {
        const state = await load();
        requireSuperAdmin(state);
        return state.users.map((user) => {
          const membership = state.members.find((m) => m.userId === user.id && m.role === 'owner') ?? state.members.find((m) => m.userId === user.id);
          const workspace = state.workspaces.find((w) => w.id === membership?.organizationId);
          return {
            userId: user.id,
            email: user.email,
            fullName: user.fullName,
            createdAt: user.createdAt ?? null,
            lastActiveAt: user.lastActiveAt ?? null,
            workspaceId: workspace?.id ?? null,
            workspaceName: workspace?.name ?? null,
            plan: workspace?.plan ?? null,
            projectCount: state.projects.filter((p) => p.organizationId === workspace?.id).length,
          };
        });
      },
      async setWorkspacePlan(organizationId, plan) {
        await update((state) => {
          requireSuperAdmin(state);
          const workspace = state.workspaces.find((w) => w.id === organizationId);
          if (workspace) workspace.plan = plan;
        });
      },
      async updatePlan(plan, patch) {
        await update((state) => {
          requireSuperAdmin(state);
          state.planChanges[plan] = { ...state.planChanges[plan], ...patch };
        });
      },
      async setModuleQuota(plan, module, max) {
        await update((state) => {
          requireSuperAdmin(state);
          const quotas = { ...planInfo(state, plan).moduleQuotas };
          if (max === null) delete quotas[module];
          else quotas[module] = max;
          state.planChanges[plan] = { ...state.planChanges[plan], moduleQuotas: quotas };
        });
      },
      async sendNudge(userId, title, body, linkUrl) {
        return update((state) => {
          requireSuperAdmin(state);
          if (linkUrl && !/^(\/[^/]|https:\/\/)/.test(linkUrl)) throw new Error('A link must start with / or https://');
          const targets = state.users.filter((u) => userId === null || u.id === userId);
          for (const user of targets) state.nudges.unshift({ id: uuid(), userId: user.id, title, body, linkUrl: linkUrl || null, createdAt: now(), readAt: null });
          return targets.length;
        });
      },
      async listPlanRequests() {
        const state = await load();
        requireSuperAdmin(state);
        return state.planRequests.map((request): AdminPlanRequest => {
          const workspace = state.workspaces.find((w) => w.id === request.organizationId);
          return {
            ...request,
            workspaceName: workspace?.name ?? '',
            currentPlan: workspace?.plan ?? 'free',
            requestedBy: state.users.find((u) => u.id === request.requestedBy)?.email ?? null,
          };
        });
      },
      async resolvePlanRequest(id, approve) {
        await update((state) => {
          requireSuperAdmin(state);
          const request = state.planRequests.find((r) => r.id === id && r.status === 'pending');
          if (!request) throw new Error('This request has already been handled');
          request.status = approve ? 'approved' : 'declined';
          const workspace = state.workspaces.find((w) => w.id === request.organizationId);
          if (approve && workspace) workspace.plan = request.plan;
        });
      },
      async listTickets() {
        const state = await load();
        requireSuperAdmin(state);
        return state.tickets.map((ticket): AdminTicket => {
          const user = state.users.find((u) => u.id === ticket.userId);
          return {
            id: ticket.id,
            subject: ticket.subject,
            status: ticket.status,
            createdAt: ticket.createdAt,
            updatedAt: ticket.updatedAt,
            userEmail: user?.email ?? '',
            userName: user?.fullName ?? null,
            workspaceName: state.workspaces.find((w) => w.id === ticket.organizationId)?.name ?? null,
          };
        }).sort((a, b) => Number(b.status === 'open') - Number(a.status === 'open') || b.updatedAt.localeCompare(a.updatedAt));
      },
      async listTicketMessages(ticketId) {
        const state = await load();
        requireSuperAdmin(state);
        return state.ticketMessages.filter((m) => m.ticketId === ticketId);
      },
      async replyToTicket(ticketId, body) {
        await update((state) => {
          requireSuperAdmin(state);
          state.ticketMessages.push({ id: uuid(), ticketId, isStaff: true, body, createdAt: now() });
          const ticket = state.tickets.find((t) => t.id === ticketId);
          if (ticket) Object.assign(ticket, { status: 'answered', updatedAt: now() });
        });
      },
      async setTicketStatus(ticketId, status) {
        await update((state) => {
          requireSuperAdmin(state);
          const ticket = state.tickets.find((t) => t.id === ticketId);
          if (ticket) Object.assign(ticket, { status, updatedAt: now() });
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
      async getPublishedSiteByDomain(domain) {
        const state = await load();
        const record = state.domains.find((d) => d.domain === domain.toLowerCase() && d.status === 'active');
        return publishedSnapshot(state, state.projects.find((p) => p.id === record?.projectId));
      },
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
