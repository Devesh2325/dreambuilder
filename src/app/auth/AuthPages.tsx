import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm, UseFormRegisterReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ShieldCheck, KeyRound, Sparkles } from 'lucide-react';
import { ROUTES } from '../routes';
import { useServices, useSession } from '../session';
import { BusyLabel } from '../shared/ui';
import { FullPageSpinner } from './RequireAuth';

const emailField = z.string().trim().email('Enter a valid email address');
const newPasswordField = z.string().min(8, 'Use at least 8 characters').max(72, 'Use at most 72 characters');

const AuthCard: React.FC<{ title: string; subtitle?: string; children: React.ReactNode }> = ({ title, subtitle, children }) => (
  <main className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 font-sans">
    <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-card p-8">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
      <div className="mt-6">{children}</div>
    </div>
  </main>
);

const Field: React.FC<{
  label: string;
  type?: string;
  autoComplete: string;
  error?: string;
  registration: UseFormRegisterReturn;
}> = ({ label, type = 'text', autoComplete, error, registration }) => {
  const id = `field-${registration.name}`;
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
        {label}
      </label>
      <input
        id={id}
        type={type}
        autoComplete={autoComplete}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className="w-full px-3 py-2 text-sm rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        {...registration}
      />
      {error && (
        <p id={`${id}-error`} className="mt-1 text-xs text-rose-600 dark:text-rose-400">
          {error}
        </p>
      )}
    </div>
  );
};

const FormError: React.FC<{ message: string | null }> = ({ message }) => {
  if (!message) return null;
  const isRateLimit = message.toLowerCase().includes('rate limit');
  return (
    <div role="alert" className="text-sm text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 rounded-lg px-3 py-2 space-y-1">
      <p className="font-medium">{message}</p>
      {isRateLimit && (
        <p className="text-xs text-rose-600 dark:text-rose-400">
          Supabase free tier limits confirmation emails to 3-4/hour. To fix this instantly: open your <strong>Supabase Dashboard &rarr; Auth &rarr; Providers &rarr; Email</strong> and toggle <strong>Confirm email</strong> OFF.
        </p>
      )}
    </div>
  );
};

const SubmitButton: React.FC<{ busy: boolean; children: React.ReactNode }> = ({ busy, children }) => (
  <button
    type="submit"
    disabled={busy}
    className="w-full py-2.5 inline-flex items-center justify-center gap-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 rounded-lg transition-colors"
  >
    <BusyLabel busy={busy} busyText="Please wait...">{children}</BusyLabel>
  </button>
);

const linkClass = 'font-semibold text-indigo-600 dark:text-indigo-400 hover:underline';

const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, 'Enter your password'),
});

export const LoginPage: React.FC = () => {
  const { auth } = useServices();
  const location = useLocation();
  const [formError, setFormError] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
  });

  // On success the session changes and RedirectIfAuthenticated moves the user on.
  const onSubmit = handleSubmit(async ({ email, password }) => {
    setFormError(null);
    const { error } = await auth.signIn(email, password);
    if (error) setFormError(error);
  });

  return (
    <AuthCard title="Log in" subtitle="Welcome back to FlowPilot.">
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <FormError message={formError} />
        <Field label="Email" type="email" autoComplete="email" error={formState.errors.email?.message} registration={register('email')} />
        <Field label="Password" type="password" autoComplete="current-password" error={formState.errors.password?.message} registration={register('password')} />
        <SubmitButton busy={formState.isSubmitting}>Log in</SubmitButton>
      </form>
      <div className="mt-5 flex justify-between text-sm text-slate-500 dark:text-slate-400">
        <Link to={ROUTES.forgotPassword} className={linkClass}>
          Forgot password?
        </Link>
        {/* Keeps the page the user was heading to if they sign up instead. */}
        <Link to={ROUTES.signUp} state={location.state} className={linkClass}>
          Create account
        </Link>
      </div>
    </AuthCard>
  );
};

export const SuperAdminLoginPage: React.FC = () => {
  const { auth } = useServices();
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'dmchaturvedi@gmail.com',
      password: '',
    },
  });

  const onSubmit = handleSubmit(async ({ email, password }) => {
    setFormError(null);
    const { error } = await auth.signIn(email, password);
    if (error) {
      setFormError(error);
    } else {
      navigate(ROUTES.admin);
    }
  });

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 p-4 font-sans text-slate-100">
      <div className="w-full max-w-md bg-slate-900 rounded-2xl border border-indigo-900/50 shadow-2xl p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center gap-2 mb-2">
          <span className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
            <ShieldCheck className="w-6 h-6" />
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wider uppercase bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
            Super Admin Only
          </span>
        </div>
        <h1 className="text-2xl font-bold text-white mt-2">Super Admin Login</h1>
        <p className="mt-1 text-sm text-slate-400">Exclusive access portal for system administrator.</p>

        <div className="mt-4 p-3 rounded-xl bg-indigo-950/40 border border-indigo-800/40 text-xs space-y-1 text-indigo-200">
          <p className="font-semibold flex items-center gap-1.5 text-indigo-300">
            <KeyRound className="w-3.5 h-3.5" /> Initial Admin Access:
          </p>
          <p>Email: <code className="bg-slate-800 px-1 py-0.5 rounded text-white">dmchaturvedi@gmail.com</code></p>
          <p>Initial Password: <code className="bg-slate-800 px-1 py-0.5 rounded text-white">Admin@FlowPilot2026!</code></p>
          <p className="text-[11px] text-slate-400 pt-1">
            * You can securely change your password anytime after logging in via Profile settings.
          </p>
        </div>

        <form onSubmit={onSubmit} noValidate className="space-y-4 mt-5">
          <FormError message={formError} />
          <Field label="Admin Email" type="email" autoComplete="email" error={formState.errors.email?.message} registration={register('email')} />
          <Field label="Password" type="password" autoComplete="current-password" error={formState.errors.password?.message} registration={register('password')} />
          <SubmitButton busy={formState.isSubmitting}>Log In as Super Admin</SubmitButton>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
          <Link to={ROUTES.login} className="hover:text-white transition-colors">
            ← Back to regular user login
          </Link>
          <Link to={ROUTES.home} className="hover:text-white transition-colors">
            Return to Homepage
          </Link>
        </div>
      </div>
    </main>
  );
};

const signUpSchema = z.object({
  fullName: z.string().trim().min(1, 'Enter your name').max(120, 'Use at most 120 characters'),
  workspaceName: z.string().trim().min(1, 'Enter a workspace name').max(120, 'Use at most 120 characters'),
  email: emailField,
  password: newPasswordField,
});

export const SignUpPage: React.FC = () => {
  const { auth } = useServices();
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmationEmail, setConfirmationEmail] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const { error, needsEmailConfirmation } = await auth.signUp(values);
    if (error) setFormError(error);
    else if (needsEmailConfirmation) setConfirmationEmail(values.email);
  });

  if (confirmationEmail) {
    return (
      <AuthCard title="Check your email">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          We sent a confirmation link to <strong>{confirmationEmail}</strong>. Open it to finish creating your account.
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Create your account" subtitle="Start building in minutes.">
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <FormError message={formError} />
        <Field label="Your name" autoComplete="name" error={formState.errors.fullName?.message} registration={register('fullName')} />
        <Field label="Workspace name" autoComplete="organization" error={formState.errors.workspaceName?.message} registration={register('workspaceName')} />
        <Field label="Email" type="email" autoComplete="email" error={formState.errors.email?.message} registration={register('email')} />
        <Field label="Password" type="password" autoComplete="new-password" error={formState.errors.password?.message} registration={register('password')} />
        <SubmitButton busy={formState.isSubmitting}>Create account</SubmitButton>
      </form>
      <p className="mt-5 text-sm text-slate-500 dark:text-slate-400">
        Already have an account?{' '}
        <Link to={ROUTES.login} className={linkClass}>
          Log in
        </Link>
      </p>
    </AuthCard>
  );
};

const forgotSchema = z.object({ email: emailField });

export const ForgotPasswordPage: React.FC = () => {
  const { auth } = useServices();
  const [formError, setFormError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState } = useForm<z.infer<typeof forgotSchema>>({
    resolver: zodResolver(forgotSchema),
  });

  const onSubmit = handleSubmit(async ({ email }) => {
    setFormError(null);
    const { error } = await auth.sendPasswordReset(email, `${window.location.origin}${ROUTES.resetPassword}`);
    if (error) setFormError(error);
    else setSent(true);
  });

  if (sent) {
    return (
      <AuthCard title="Check your email">
        <p className="text-sm text-slate-600 dark:text-slate-300">If an account exists for that email, a password reset link is on its way.</p>
        <p className="mt-5 text-sm">
          <Link to={ROUTES.login} className={linkClass}>
            Back to log in
          </Link>
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Reset your password" subtitle="We'll email you a reset link.">
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <FormError message={formError} />
        <Field label="Email" type="email" autoComplete="email" error={formState.errors.email?.message} registration={register('email')} />
        <SubmitButton busy={formState.isSubmitting}>Send reset link</SubmitButton>
      </form>
      <p className="mt-5 text-sm">
        <Link to={ROUTES.login} className={linkClass}>
          Back to log in
        </Link>
      </p>
    </AuthCard>
  );
};

const resetSchema = z.object({ password: newPasswordField });

/** Opened from the reset email. The link logs the user in, so a session must exist here. */
export const ResetPasswordPage: React.FC = () => {
  const { auth } = useServices();
  const { user, isLoading } = useSession();
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<z.infer<typeof resetSchema>>({
    resolver: zodResolver(resetSchema),
  });

  const onSubmit = handleSubmit(async ({ password }) => {
    setFormError(null);
    const { error } = await auth.updatePassword(password);
    if (error) setFormError(error);
    else navigate(ROUTES.home, { replace: true });
  });

  if (isLoading) return <FullPageSpinner />;

  if (!user) {
    return (
      <AuthCard title="This link isn't valid">
        <p className="text-sm text-slate-600 dark:text-slate-300">The reset link has expired or was already used.</p>
        <p className="mt-5 text-sm">
          <Link to={ROUTES.forgotPassword} className={linkClass}>
            Request a new link
          </Link>
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Choose a new password">
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <FormError message={formError} />
        <Field label="New password" type="password" autoComplete="new-password" error={formState.errors.password?.message} registration={register('password')} />
        <SubmitButton busy={formState.isSubmitting}>Save password</SubmitButton>
      </form>
    </AuthCard>
  );
};
