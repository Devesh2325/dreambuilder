import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Moon, Sun } from 'lucide-react';
import { ROUTES } from '../routes';
import { useServices, useSession } from '../session';
import { allTimeZones, browserTimeZone, formatDateTime, initials } from '../shared/format';
import { BusyLabel, cardClass, ErrorNote, errorMessage, inputClass, LoadingNote, PageHeader, primaryButton, secondaryButton } from '../shared/ui';
import { useTheme } from '../theme';
import { useWorkspace } from '../workspace';

const Saved: React.FC<{ show: boolean }> = ({ show }) => (show ? <span role="status" className="text-sm text-emerald-700 dark:text-emerald-400">Saved</span> : null);

const PasswordForm: React.FC = () => {
  const { auth } = useServices();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const save = useMutation({
    mutationFn: async () => {
      const { error } = await auth.updatePassword(password);
      if (error) throw new Error(error);
    },
    onSuccess: () => {
      setPassword('');
      setConfirm('');
      setIsSaved(true);
    },
  });

  return (
    <form
      aria-labelledby="password-title"
      className={`${cardClass} p-6 space-y-4`}
      onSubmit={(event) => {
        event.preventDefault();
        setIsSaved(false);
        if (password !== confirm) {
          setMessage('The two passwords are different.');
          return;
        }
        setMessage(null);
        save.mutate();
      }}
    >
      <h2 id="password-title" className="font-semibold">Password</h2>
      <ErrorNote message={message ?? (save.isError ? errorMessage(save.error) : null)} />
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium">New password
          <input type="password" required minLength={8} autoComplete="new-password" className={`${inputClass} mt-1`} value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        <label className="block text-sm font-medium">Type it again
          <input type="password" required minLength={8} autoComplete="new-password" className={`${inputClass} mt-1`} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </label>
      </div>
      <div className="flex items-center gap-3">
        <button type="submit" className={secondaryButton} disabled={save.isPending}><BusyLabel busy={save.isPending} busyText="Changing...">Change password</BusyLabel></button>
        <Saved show={isSaved} />
      </div>
    </form>
  );
};

/** The person's own details. Workspace details are under Settings. */
export const ProfilePage: React.FC = () => {
  const { profile } = useServices();
  const { user } = useSession();
  const { workspace } = useWorkspace();
  const { theme, toggleTheme } = useTheme();
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['profile', user?.id], queryFn: () => profile.get(), enabled: Boolean(user) });

  const [fullName, setFullName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [timezone, setTimezone] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (!query.data) return;
    setFullName(query.data.fullName);
    setJobTitle(query.data.jobTitle);
    setTimezone(query.data.timezone);
  }, [query.data]);

  const zones = useMemo(() => allTimeZones(), []);
  const browserZone = useMemo(() => browserTimeZone(), []);

  const save = useMutation({
    mutationFn: () => profile.update({ fullName: fullName.trim(), jobTitle: jobTitle.trim(), timezone }),
    onSuccess: async () => {
      setIsSaved(true);
      await queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  const email = query.data?.email ?? user?.email ?? '';

  return (
    <>
      <PageHeader title="Your profile" subtitle="Your own details. Workspace details are under Settings." />
      {query.isLoading && <LoadingNote />}
      {query.isError && <ErrorNote message="We couldn't load your profile. Please refresh the page." />}
      {query.isSuccess && (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px] items-start">
          <div className="space-y-5 min-w-0">
            <form
              aria-labelledby="details-title"
              className={`${cardClass} p-6 space-y-5`}
              onChange={() => setIsSaved(false)}
              onSubmit={(event) => {
                event.preventDefault();
                save.mutate();
              }}
            >
              <div className="flex items-center gap-4">
                <span aria-hidden="true" className="shrink-0 w-14 h-14 flex items-center justify-center rounded-full text-lg font-bold text-white bg-gradient-to-br from-indigo-500 to-fuchsia-500">{initials(fullName, email)}</span>
                <div className="min-w-0">
                  <h2 id="details-title" className="font-semibold">Your details</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{email}</p>
                </div>
              </div>
              <ErrorNote message={save.isError ? errorMessage(save.error) : null} />
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium">Your name
                  <input required maxLength={120} className={`${inputClass} mt-1`} value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </label>
                <label className="block text-sm font-medium">Job title
                  <input maxLength={120} placeholder="Optional" className={`${inputClass} mt-1`} value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
                </label>
                <label className="block text-sm font-medium">Email
                  <input readOnly value={email} className={`${inputClass} mt-1 !bg-slate-100 dark:!bg-slate-800/60 text-slate-500`} />
                </label>
                <label className="block text-sm font-medium">Time zone
                  <select className={`${inputClass} mt-1`} value={timezone} onChange={(e) => setTimezone(e.target.value)}>
                    <option value="">Same as this device ({browserZone})</option>
                    {zones.map((zone) => <option key={zone} value={zone}>{zone.replace(/_/g, ' ')}</option>)}
                  </select>
                </label>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Dates across the app use this time zone. Right now that's <strong className="font-semibold text-slate-700 dark:text-slate-200" data-testid="time-preview">{formatDateTime(new Date(), timezone || undefined)}</strong>.
              </p>
              <div className="flex items-center gap-3">
                <button type="submit" className={primaryButton} disabled={save.isPending}><BusyLabel busy={save.isPending} busyText="Saving...">Save changes</BusyLabel></button>
                <Saved show={isSaved} />
              </div>
            </form>
            <PasswordForm />
          </div>

          <div className="space-y-5">
            <section aria-labelledby="look-title" className={`${cardClass} p-6`}>
              <h2 id="look-title" className="font-semibold">Appearance</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Applies to this browser.</p>
              <button type="button" className={`${secondaryButton} mt-3 w-full`} onClick={toggleTheme}>
                {theme === 'dark' ? <Sun className="w-4 h-4" aria-hidden="true" /> : <Moon className="w-4 h-4" aria-hidden="true" />}
                {theme === 'dark' ? 'Use light theme' : 'Use dark theme'}
              </button>
            </section>
            <section aria-labelledby="workspace-title" className={`${cardClass} p-6`}>
              <h2 id="workspace-title" className="font-semibold">Your workspace</h2>
              <dl className="mt-2 text-sm divide-y divide-slate-100 dark:divide-slate-800">
                <div className="flex justify-between gap-3 py-2"><dt className="text-slate-500 dark:text-slate-400">Name</dt><dd className="font-medium text-right truncate">{workspace?.name}</dd></div>
                <div className="flex justify-between gap-3 py-2"><dt className="text-slate-500 dark:text-slate-400">Your role</dt><dd className="font-medium capitalize">{workspace?.role}</dd></div>
                <div className="flex justify-between gap-3 py-2"><dt className="text-slate-500 dark:text-slate-400">Plan</dt><dd><Link to={ROUTES.plans} className="font-semibold capitalize text-indigo-600 dark:text-indigo-400 hover:underline">{workspace?.plan}</Link></dd></div>
              </dl>
            </section>
          </div>
        </div>
      )}
    </>
  );
};
