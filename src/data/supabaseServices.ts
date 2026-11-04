import { User } from '@supabase/supabase-js';
import { getSupabase } from './supabaseClient';
import { AppServices, AuthGateway, AuthUser, WorkspaceRepository } from './services';

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
    const { data } = await getSupabase().auth.getSession();
    return toAuthUser(data.session?.user);
  },

  onChange(listener) {
    // Only passes data along: Supabase warns that awaiting its own client inside
    // this callback can deadlock.
    const { data } = getSupabase().auth.onAuthStateChange((_event, session) => {
      listener(toAuthUser(session?.user));
    });
    return () => data.subscription.unsubscribe();
  },

  async signIn(email, password) {
    const { error } = await getSupabase().auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  },

  async signUp({ email, password, fullName, workspaceName }) {
    const { data, error } = await getSupabase().auth.signUp({
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
    const { error } = await getSupabase().auth.signOut();
    return { error: error?.message ?? null };
  },

  async sendPasswordReset(email, redirectTo) {
    const { error } = await getSupabase().auth.resetPasswordForEmail(email, { redirectTo });
    return { error: error?.message ?? null };
  },

  async updatePassword(password) {
    const { error } = await getSupabase().auth.updateUser({ password });
    return { error: error?.message ?? null };
  },
};

interface MembershipRow {
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  organizations: {
    id: string;
    name: string;
    slug: string;
    plan: 'free' | 'starter' | 'pro' | 'agency' | 'enterprise';
  };
}

const workspaces: WorkspaceRepository = {
  async listMemberships(userId) {
    const { data, error } = await getSupabase()
      .from('organization_members')
      .select('role, organizations (id, name, slug, plan)')
      .eq('user_id', userId)
      .order('created_at');
    if (error) throw new Error(error.message);
    return (data as unknown as MembershipRow[]).map((row) => ({
      organizationId: row.organizations.id,
      name: row.organizations.name,
      slug: row.organizations.slug,
      plan: row.organizations.plan,
      role: row.role,
    }));
  },
};

export const supabaseServices: AppServices = { auth, workspaces };
