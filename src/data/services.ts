import { SubscriptionPlan, UserRole } from '../types/auth';

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
}

export interface WorkspaceRepository {
  listMemberships(userId: string): Promise<WorkspaceMembership[]>;
}

export interface AppServices {
  auth: AuthGateway;
  workspaces: WorkspaceRepository;
}
