import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, CircleAlert, Info, Loader2, ShieldAlert } from 'lucide-react';
import { policyLine, policySources, SiteCheckReport } from '../../core/siteCheck';
import { isLocalBackend } from '../../data';
import { supabaseUrl } from '../../data/supabaseClient';
import { ProjectRecord } from '../../data/services';
import { useServices } from '../session';
import { inputClass, primaryButton, secondaryButton } from '../shared/ui';
import { CopyBlock } from './InstallGuide';

const WAIT_MS = 12_000;

type CheckState =
  | { kind: 'idle' }
  | { kind: 'waiting' }
  | { kind: 'popup-blocked' }
  | { kind: 'no-answer'; url: string }
  | { kind: 'done'; report: SiteCheckReport; url: string };

const Line: React.FC<{ ok: boolean | 'info'; children: React.ReactNode }> = ({ ok, children }) => (
  <li className="flex items-start gap-2">
    {ok === 'info'
      ? <Info className="w-4 h-4 mt-0.5 shrink-0 text-sky-600" aria-label="Note" />
      : ok
        ? <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600" aria-label="Done" />
        : <CircleAlert className="w-4 h-4 mt-0.5 shrink-0 text-rose-600" aria-label="Needs fixing" />}
    <span>{children}</span>
  </li>
);

/**
 * What a site's security settings must allow, written for whoever looks after the site. Many
 * sites, including most built with Next.js, only allow scripts they list.
 */
export const SecurityPolicyHelp: React.FC = () => {
  const sources = policySources(window.location.origin, isLocalBackend ? null : supabaseUrl);
  const line = policyLine(sources);
  const message = `Hi, could you allow FlowPilot in our website's Content Security Policy? Please add these sources to the matching directives, keeping what's already there:

${sources.map((item) => `${item.directive}: ${item.sources.join(' ')}   (${item.why})`).join('\n')}`;
  return (
    <div className="space-y-3">
      <p>
        Your site only allows scripts from addresses it lists, which is a common safety setting called a Content Security Policy. FlowPilot's address isn't on that list yet, so your browser stops it.
        You only need to add it once.
      </p>
      <CopyBlock label="Send this to whoever looks after your site" code={message} />
      <details className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2">
        <summary className="cursor-pointer font-medium text-slate-800 dark:text-slate-100">I'll change it myself</summary>
        <div className="mt-2 space-y-3">
          <p>Search your site's code for <code>Content-Security-Policy</code>. In Next.js it's usually in <code>next.config.js</code> or <code>middleware.ts</code>. Other places are <code>vercel.json</code>, <code>netlify.toml</code>, your server settings, or a <code>&lt;meta&gt;</code> tag. Add these sources to each directive that already exists, and add any directive that's missing:</p>
          <CopyBlock label="Sources to add" code={line} />
          <CopyBlock label="Next.js example (next.config.js)" code={`async headers() {
  return [{
    source: '/:path*',
    headers: [{
      key: 'Content-Security-Policy',
      // Keep your own sources, and add FlowPilot's:
      value: "${line}",
    }],
  }];
},`} />
          <p>Then publish your site again, and run the check once more.</p>
        </div>
      </details>
    </div>
  );
};

/** Opens the customer's page with the script told to report back, and explains what it finds. */
export const SiteCheck: React.FC<{ project: ProjectRecord; showsInline: boolean }> = ({ project, showsInline }) => {
  const { projects } = useServices();
  const [url, setUrl] = useState(project.settings.builderUrl ?? '');
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<CheckState>({ kind: 'idle' });
  const cleanup = useRef<() => void>(() => undefined);

  useEffect(() => () => cleanup.current(), []);

  const run = () => {
    cleanup.current();
    let target: URL;
    try {
      target = new URL(url.trim());
      if (!/^https?:$/.test(target.protocol)) throw new Error('protocol');
    } catch {
      setError('Enter the full address of the page, starting with https://');
      return;
    }
    setError(null);
    const nonce = crypto.randomUUID();
    target.hash = `fp-check=${nonce}&origin=${encodeURIComponent(window.location.origin)}`;
    const popup = window.open(target.toString(), 'flowpilot-check');
    if (!popup) {
      setState({ kind: 'popup-blocked' });
      return;
    }
    setState({ kind: 'waiting' });
    const checkedUrl = url.trim();
    const timer = window.setTimeout(() => setState({ kind: 'no-answer', url: checkedUrl }), WAIT_MS);
    const listener = async (event: MessageEvent) => {
      if (event.source !== popup || event.origin !== target.origin || event.data?.nonce !== nonce || event.data?.type !== 'flowpilot:check') return;
      window.clearTimeout(timer);
      setState({ kind: 'done', report: event.data.report as SiteCheckReport, url: checkedUrl });
      // Shows the latest draft there, so it can be seen in place even before publishing.
      const documents = await projects.listDocuments(project.id);
      popup.postMessage({ type: 'flowpilot:draft', nonce, snapshot: { project: { ...project, slug: project.slug ?? '' }, documents } }, target.origin);
    };
    window.addEventListener('message', listener);
    cleanup.current = () => {
      window.clearTimeout(timer);
      window.removeEventListener('message', listener);
    };
  };

  const report = state.kind === 'done' ? state.report : null;
  const isOnPage = report ? report.scriptProjects.length > 0 || report.slotProjects.length > 0 : false;
  const hasThisProject = report ? [...report.scriptProjects, ...report.slotProjects].includes(project.id) : false;
  const hasSlot = report ? report.slotProjects.includes(project.id) : false;
  const loadState = report?.projects[project.id];

  return (
    <div className="space-y-3">
      <p>Open a page of your site that has the code, and FlowPilot checks it for you.</p>
      <form className="flex flex-wrap gap-2" onSubmit={(event) => {
        event.preventDefault();
        run();
      }}>
        <input type="url" aria-label="Address of a page with the code" placeholder="https://www.yoursite.com" className={`${inputClass} !w-auto flex-1 min-w-[240px]`} value={url} onChange={(event) => setUrl(event.target.value)} />
        <button type="submit" className={primaryButton} disabled={state.kind === 'waiting'}>
          {state.kind === 'waiting' ? <><Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />Checking...</> : 'Check it on my site'}
        </button>
      </form>
      {error && <p role="alert" className="text-rose-600 dark:text-rose-400">{error}</p>}

      <div aria-live="polite" className="space-y-3">
        {state.kind === 'waiting' && <p role="status">Your page is opening in a new tab. Keep this tab open: the answer appears here in a few seconds.</p>}
        {state.kind === 'popup-blocked' && <p role="alert">Your browser blocked the new tab. Allow pop-ups for this page, then try again.</p>}

        {state.kind === 'no-answer' && (
          <section aria-label="Check result" className="rounded-xl border border-rose-200 bg-rose-50/60 dark:border-rose-500/30 dark:bg-rose-500/10 p-4 space-y-3">
            <h4 className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white"><ShieldAlert className="w-4 h-4 text-rose-600" aria-hidden="true" />FlowPilot didn't answer from that page</h4>
            <p>The most likely reasons, in order:</p>
            <ol className="list-decimal pl-5 space-y-3">
              <li>
                <strong className="font-semibold">Your site's security settings block it.</strong> To see if this is it, open that page, press F12, and look in Console for "Content Security Policy" with this address.
                <div className="mt-2"><SecurityPolicyHelp /></div>
              </li>
              <li><strong className="font-semibold">The code isn't on that page yet,</strong> or the site hasn't been published since you added it. Check the page you entered, and its live version.</li>
              <li><strong className="font-semibold">The code came from a different FlowPilot address</strong> than the one you're using now, such as localhost instead of 127.0.0.1. Copy it from this page again.</li>
              <li><strong className="font-semibold">An ad blocker or privacy extension</strong> stopped it. Try a private window with extensions off.</li>
            </ol>
            <button type="button" className={secondaryButton} onClick={run}>Check again</button>
          </section>
        )}

        {report && (
          <section aria-label="Check result" className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-3">
            <h4 className="font-semibold text-slate-900 dark:text-white">What we found on {report.path}</h4>
            <ul className="space-y-2">
              <Line ok={isOnPage}>The FlowPilot script is on this page.</Line>
              <Line ok={hasThisProject}>{hasThisProject ? 'It asks for this project.' : `The code there is for a different project. Copy this project's code again from above.`}</Line>
              {showsInline && <Line ok={hasSlot}>{hasSlot ? 'It has the spot where this appears.' : 'The spot where it should appear is missing. Add the placeholder code from the step above.'}</Line>}
              {report.blocked.length > 0 && <Line ok={false}>Your site's security settings blocked part of it: {report.blocked.join(', ')}.</Line>}
              {report.backend === 'demo' && <Line ok="info">This FlowPilot is in demo mode, so visitors can't see your project on other sites yet. That works once it's connected to its live database. Your latest draft is showing in that tab now, so you can see how it looks there.</Line>}
              {report.backend === 'unreachable' && <Line ok={false}>Your page couldn't reach FlowPilot to load the project. If your site has security settings, allow the addresses below.</Line>}
              {loadState === 'published' && <Line ok>It's published, and loads on your site. Your latest draft is showing there now too.</Line>}
              {loadState === 'not-published' && <Line ok={false}>It isn't published yet, so visitors won't see it. Publish it, then check again. Your draft is showing in that tab for now.</Line>}
            </ul>
            {(report.blocked.length > 0 || report.backend === 'unreachable') && <SecurityPolicyHelp />}
            <button type="button" className={secondaryButton} onClick={run}>Check again</button>
          </section>
        )}
      </div>
    </div>
  );
};
