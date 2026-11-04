import { AppServices, AuthUser, SignUpInput, SignUpResult, WorkspaceMembership } from '../../data/services';

export const TEST_USER: AuthUser = { id: 'user-1', email: 'alice@example.com', fullName: 'Alice' };

interface FakeOptions {
  user?: AuthUser | null;
  signInError?: string;
  requireEmailConfirmation?: boolean;
  memberships?: WorkspaceMembership[];
}

export function createFakeServices(options: FakeOptions = {}) {
  let currentUser = options.user ?? null;
  const listeners = new Set<(user: AuthUser | null) => void>();
  const setUser = (user: AuthUser | null) => {
    currentUser = user;
    listeners.forEach((listener) => listener(user));
  };

  const calls = {
    signIn: [] as { email: string; password: string }[],
    signUp: [] as SignUpInput[],
    sendPasswordReset: [] as { email: string; redirectTo: string }[],
    updatePassword: [] as string[],
  };

  const services: AppServices = {
    auth: {
      getUser: async () => currentUser,
      onChange(listener) {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
      async signIn(email, password) {
        calls.signIn.push({ email, password });
        if (options.signInError) return { error: options.signInError };
        setUser(TEST_USER);
        return { error: null };
      },
      async signUp(input): Promise<SignUpResult> {
        calls.signUp.push(input);
        if (options.requireEmailConfirmation) return { error: null, needsEmailConfirmation: true };
        setUser({ id: 'new-user', email: input.email, fullName: input.fullName });
        return { error: null, needsEmailConfirmation: false };
      },
      async signOut() {
        setUser(null);
        return { error: null };
      },
      async sendPasswordReset(email, redirectTo) {
        calls.sendPasswordReset.push({ email, redirectTo });
        return { error: null };
      },
      async updatePassword(password) {
        calls.updatePassword.push(password);
        return { error: null };
      },
    },
    workspaces: {
      listMemberships: async () => options.memberships ?? [],
    },
  };

  return { services, calls };
}
