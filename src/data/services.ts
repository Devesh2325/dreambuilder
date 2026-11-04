import { DocContent, DocumentKind, ProjectSettings, ProjectType, SeoSettings, Theme } from '../core/schema';
import { VariableValues } from '../core/variables';
import { OrganizationBranding, SubscriptionPlan, UserRole } from '../types/auth';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string | null;
}

export interface AuthResult {
  error: string | null;
}

export interface SignUpResult extends AuthResult {
  /** True when the project requires confirming the email before logging in. */
  needsEmailConfirmation: boolean;
}

export interface SignUpInput {
  email: string;
  password: string;
  fullName: string;
  workspaceName: string;
}

export interface AuthGateway {
  getUser(): Promise<AuthUser | null>;
  /** Calls back on every session change. Returns the unsubscribe function. */
  onChange(listener: (user: AuthUser | null) => void): () => void;
  signIn(email: string, password: string): Promise<AuthResult>;
  signUp(input: SignUpInput): Promise<SignUpResult>;
  signOut(): Promise<AuthResult>;
  /** Sends the reset email. Succeeds for unknown emails too, to hide who has an account. */
  sendPasswordReset(email: string, redirectTo: string): Promise<AuthResult>;
  updatePassword(password: string): Promise<AuthResult>;
}

export interface WorkspaceMembership {
  organizationId: string;
  name: string;
  slug: string;
  plan: SubscriptionPlan;
  role: UserRole;
  branding: Partial<OrganizationBranding>;
}

export interface WorkspaceRepository {
  listMemberships(userId: string): Promise<WorkspaceMembership[]>;
  createWorkspace(name: string): Promise<string>;
  updateWorkspace(id: string, patch: { name?: string; branding?: Partial<OrganizationBranding> }): Promise<void>;
}

export interface ProjectRecord {
  id: string;
  organizationId: string;
  type: ProjectType;
  title: string;
  description: string;
  slug: string | null;
  status: 'draft' | 'published' | 'archived';
  templateId: string | null;
  variables: VariableValues;
  theme: Theme;
  settings: ProjectSettings;
  publishedVersionId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentRecord {
  id: string;
  projectId: string;
  kind: DocumentKind;
  title: string;
  slug: string;
  position: number;
  seo: SeoSettings;
  content: DocContent;
  revision: number;
  updatedAt: string;
}

export interface NewDocument {
  kind: DocumentKind;
  title: string;
  slug: string;
  seo?: SeoSettings;
  content: DocContent;
}

export interface NewProject {
  organizationId: string;
  type: ProjectType;
  title: string;
  description?: string;
  variables: VariableValues;
  theme: Theme;
  settings: ProjectSettings;
  templateId?: string;
  templateVersion?: number;
  documents: NewDocument[];
}

export type ProjectPatch = Partial<Pick<ProjectRecord, 'title' | 'description' | 'slug' | 'variables' | 'theme' | 'settings'>>;
export type DocumentPatch = Partial<Pick<DocumentRecord, 'title' | 'slug' | 'position' | 'seo' | 'content'>>;

export type SaveResult =
  | { status: 'saved'; revision: number; updatedAt: string }
  /** Someone else saved a newer revision, and nothing was overwritten. */
  | { status: 'conflict' };

export interface ProjectRepository {
  list(organizationId: string): Promise<ProjectRecord[]>;
  get(id: string): Promise<ProjectRecord | null>;
  create(input: NewProject): Promise<string>;
  update(id: string, patch: ProjectPatch): Promise<void>;
  remove(id: string): Promise<void>;
  listDocuments(projectId: string): Promise<DocumentRecord[]>;
  /** Every document in a workspace, for the details shown in project tables. */
  listAllDocuments(organizationId: string): Promise<DocumentRecord[]>;
  createDocument(project: ProjectRecord, doc: NewDocument, position: number): Promise<DocumentRecord>;
  saveDocument(id: string, patch: DocumentPatch, expectedRevision: number): Promise<SaveResult>;
  removeDocument(id: string): Promise<void>;
}

export interface VersionRecord {
  id: string;
  versionNumber: number;
  changeSummary: string | null;
  createdAt: string;
}

export interface PublishingRepository {
  /** Throws an Error with a user-readable message, including when the slug is taken. */
  publish(projectId: string, summary?: string, slug?: string): Promise<void>;
  unpublish(projectId: string): Promise<void>;
  listVersions(projectId: string): Promise<VersionRecord[]>;
  restoreVersion(versionId: string): Promise<void>;
}

export interface AssetRecord {
  id: string;
  name: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
  altText: string;
  createdAt: string;
}

export interface AssetRepository {
  list(organizationId: string): Promise<AssetRecord[]>;
  upload(organizationId: string, file: File): Promise<AssetRecord>;
  remove(asset: AssetRecord): Promise<void>;
}

export interface SubmissionRecord {
  id: string;
  data: Record<string, unknown>;
  createdAt: string;
}

export interface FormRepository {
  listSubmissions(projectId: string): Promise<SubmissionRecord[]>;
  /** Number of responses per project id. */
  countByProject(organizationId: string): Promise<Record<string, number>>;
  removeSubmission(id: string): Promise<void>;
}

export interface AnalyticsRow {
  projectId: string;
  eventType: string;
  day: string;
  events: number;
  visitors: number;
}

export interface AnalyticsRepository {
  summary(organizationId: string, days: number): Promise<AnalyticsRow[]>;
}

export interface MemberRecord {
  userId: string;
  email: string;
  fullName: string | null;
  role: UserRole;
}

export interface InvitationRecord {
  id: string;
  email: string;
  role: UserRole;
  expiresAt: string;
}

export interface TeamRepository {
  listMembers(organizationId: string): Promise<MemberRecord[]>;
  updateRole(organizationId: string, userId: string, role: UserRole): Promise<void>;
  removeMember(organizationId: string, userId: string): Promise<void>;
  listInvitations(organizationId: string): Promise<InvitationRecord[]>;
  /** Returns the secret token, only available now, for the invite link. */
  createInvitation(organizationId: string, email: string, role: UserRole): Promise<string>;
  revokeInvitation(id: string): Promise<void>;
  acceptInvitation(token: string): Promise<void>;
}

/** What a visitor can see of a published project. */
export interface PublishedSnapshot {
  project: {
    id: string;
    type: ProjectType;
    title: string;
    slug: string;
    variables: VariableValues;
    theme: Theme;
    settings: ProjectSettings;
  };
  documents: {
    id: string;
    kind: DocumentKind;
    title: string;
    slug: string;
    position: number;
    seo: SeoSettings;
    content: DocContent;
  }[];
}

export interface TrackedEvent {
  type: string;
  visitorId?: string;
  sessionId?: string;
  device?: string;
  url?: string;
  metadata?: Record<string, unknown>;
}

/** Calls that work without logging in. The embed script uses these too. */
export interface PublicApi {
  getPublishedSite(slug: string): Promise<PublishedSnapshot | null>;
  getPublishedExperience(projectId: string): Promise<PublishedSnapshot | null>;
  submitForm(projectId: string, data: Record<string, unknown>, visitorId?: string): Promise<void>;
  trackEvents(projectId: string, events: TrackedEvent[]): Promise<void>;
}

export interface AppServices {
  auth: AuthGateway;
  workspaces: WorkspaceRepository;
  projects: ProjectRepository;
  publishing: PublishingRepository;
  assets: AssetRepository;
  forms: FormRepository;
  analytics: AnalyticsRepository;
  team: TeamRepository;
  publicApi: PublicApi;
}
