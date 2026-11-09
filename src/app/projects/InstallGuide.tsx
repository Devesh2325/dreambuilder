import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Copy, ExternalLink } from 'lucide-react';
import { MODULES, moduleNoun } from '../../core/modules';
import { ProjectRecord } from '../../data/services';
import { publicSitePath, ROUTES } from '../routes';
import { cardClass, inputClass, primaryButton } from '../shared/ui';
import { GLOBAL_LANGUAGES } from '../shared/GoogleTranslate';
import { DomainSetup } from './DomainSetup';
import { MobileSteps } from './MobileSteps';
import { embedSnippet, inlineSnippet } from './projectHelpers';
import { SiteCheck } from './SiteCheck';

export const CopyBlock: React.FC<{ label: string; code: string }> = ({ label, code }) => {
  const [copied, setCopied] = useState(false);
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-sm font-medium">{label}</p>
        <button
          type="button"
          aria-label={`Copy ${label}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400"
          onClick={async () => {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
        >
          {copied ? <Check className="w-3.5 h-3.5" aria-hidden="true" /> : <Copy className="w-3.5 h-3.5" aria-hidden="true" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="text-xs p-3 rounded-lg overflow-x-auto bg-slate-900 text-slate-100 dark:bg-black/40"><code>{code}</code></pre>
    </div>
  );
};

const Step: React.FC<{ number: number; title: string; done?: boolean; children: React.ReactNode }> = ({ number, title, done, children }) => (
  <li className="relative flex gap-4 pb-7 last:pb-0">
    <span aria-hidden="true" className="absolute left-[15px] top-9 bottom-1 w-px bg-slate-200 dark:bg-slate-800 [li:last-child>&]:hidden" />
    <span aria-hidden="true" className={`shrink-0 w-[30px] h-[30px] flex items-center justify-center rounded-full text-sm font-bold ${done ? 'bg-emerald-500 text-white' : 'bg-indigo-600 text-white'}`}>
      {done ? <Check className="w-4 h-4" /> : number}
    </span>
    <div className="flex-1 min-w-0 pt-0.5">
      <h3 className="font-semibold">{title}{done && <span className="sr-only"> (done)</span>}</h3>
      <div className="mt-2 space-y-3 text-sm text-slate-600 dark:text-slate-300">{children}</div>
    </div>
  </li>
);

interface Platform {
  id: string;
  label: string;
  steps: string[];
  /** A different snippet from the plain one, for frameworks that load scripts their own way. */
  code?: (src: string, projectId: string) => string;
}

const PLATFORMS: Platform[] = [
  {
    id: 'html',
    label: 'Any website',
    steps: [
      'Open the HTML of your site, or its shared layout or template.',
      'Paste the code just before the closing </body> tag.',
      'Save and publish your site.',
    ],
  },
  {
    id: 'wordpress',
    label: 'WordPress',
    steps: [
      'Install a plugin for adding code to your site, such as WPCode.',
      'Add a new snippet and choose the footer as its location.',
      'Paste the code, then save and turn the snippet on.',
    ],
  },
  {
    id: 'shopify',
    label: 'Shopify',
    steps: [
      'In your Shopify admin, open Online Store, then Themes.',
      'Open the menu beside your theme and choose Edit code.',
      'Open theme.liquid, and paste the code just before </body>.',
      'Save.',
    ],
  },
  {
    id: 'webflow',
    label: 'Webflow',
    steps: [
      'Open Site settings, then Custom code.',
      'Paste the code into Footer code, and save.',
      'Publish your site.',
    ],
  },
  {
    id: 'wix',
    label: 'Wix',
    steps: [
      'Open Settings, then Custom code. You may need a paid Wix plan.',
      'Add custom code and paste it in.',
      'Choose All pages, place it in Body - end, and apply.',
    ],
  },
  {
    id: 'squarespace',
    label: 'Squarespace',
    steps: [
      'Open Settings, then Developer tools, then Code injection.',
      'Paste the code into Footer, and save. You may need a paid Squarespace plan.',
    ],
  },
  {
    id: 'react',
    label: 'React or Next.js',
    steps: [
      'Plain React: paste the first code into the public index.html, just before </body>.',
      'Next.js: add the code below to your root layout, and it loads on every page.',
    ],
    code: (src, projectId) => `import Script from 'next/script';

<Script src="${src}" data-project-id="${projectId}" strategy="afterInteractive" />`,
  },
  {
    id: 'vue',
    label: 'Vue or Angular',
    steps: [
      'Paste the code into index.html, just before </body>. It loads once and follows page changes in your app by itself.',
      'For something that appears inside a page, put the placeholder from the next step into that component\'s template.',
    ],
  },
  {
    id: 'gtm',
    label: 'Google Tag Manager',
    steps: [
      'Create a new tag and choose Custom HTML.',
      'Paste the code into it.',
      'Set the trigger to All Pages, save, then Submit to publish the container.',
    ],
  },
];

const ScriptSteps: React.FC<{ project: ProjectRecord }> = ({ project }) => {
  const [platformId, setPlatformId] = useState('html');
  const [lang, setLang] = useState(project.settings.targetLanguage ?? 'en');
  const [device, setDevice] = useState(project.settings.targetDevice ?? 'desktop');
  const platform = PLATFORMS.find((item) => item.id === platformId)!;
  const snippet = embedSnippet(window.location.origin, project.id, { language: lang, device });

  return (
    <>
      <p>Where is your site built? Choose it, and follow the steps.</p>

      {/* Language & Device Integration Check */}
      <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Target Language
          </label>
          <select
            className={inputClass}
            value={lang}
            onChange={(e) => setLang(e.target.value)}
          >
            {GLOBAL_LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.native} ({l.label})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Target Device
          </label>
          <select
            className={inputClass}
            value={device}
            onChange={(e) => setDevice(e.target.value as 'desktop' | 'tablet' | 'mobile')}
          >
            <option value="desktop">Desktop</option>
            <option value="tablet">Tablet</option>
            <option value="mobile">Mobile (Smartphone)</option>
          </select>
        </div>
      </div>

      <div role="tablist" aria-label="Where your site is built" className="no-scrollbar flex flex-wrap gap-1.5">
        {PLATFORMS.map((item) => (
          <button
            key={item.id}
            role="tab"
            type="button"
            aria-selected={item.id === platformId}
            onClick={() => setPlatformId(item.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${item.id === platformId ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-200 dark:border-slate-700 hover:border-indigo-400'}`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <ol className="list-decimal pl-5 space-y-1">
        {platform.steps.map((step) => <li key={step}>{step}</li>)}
      </ol>
      <CopyBlock label="Add to your site, before </body>" code={snippet} />
      {platform.code && <CopyBlock label="For Next.js" code={platform.code(`${window.location.origin}/flowpilot.js`, project.id)} />}
    </>
  );
};

/** Exactly what to do with a project once it's made, in the order to do it. */
export const InstallGuide: React.FC<{ project: ProjectRecord; onPublish: () => void; canEdit: boolean }> = ({ project, onPublish, canEdit }) => {
  const module = MODULES[project.type];
  const noun = moduleNoun(project.type);
  const isPublished = project.status === 'published';
  const liveUrl = project.slug ? `${window.location.origin}${publicSitePath(project.slug)}` : null;
  const showsInline = module.delivery === 'inline' || project.settings.position === 'inline';
  const isSite = module.delivery === 'site';
  const iframeCode = liveUrl ? `<iframe src="${liveUrl}" title="${project.title.replace(/"/g, '&quot;')}" style="width:100%;height:800px;border:0"></iframe>` : '';

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px] items-start">
      <section aria-labelledby="install-title" className={`${cardClass} p-6`}>
        <h2 id="install-title" className="text-lg font-semibold">Put it on your live site</h2>
        <p className="mt-1 mb-5 text-sm text-slate-500 dark:text-slate-400">
          {isSite ? `Your ${noun} is hosted for you, so you only need to send people to it.` : `A few steps, and your ${noun} is live on your own site. You only do this once. After that, changes go live when you publish.`}
        </p>

        {!isPublished && <p role="note" className="mb-5 text-sm rounded-lg px-3 py-2 bg-amber-50 text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">Publish first. This code won't show anything until then.</p>}

        <ol>
          <Step number={1} title="Publish it" done={isPublished}>
            {isPublished ? <p>It's published. Publish again whenever you change something.</p> : (
              <>
                <p>Publishing makes the current version public.</p>
                {canEdit && <button type="button" className={primaryButton} onClick={onPublish}>Publish now</button>}
              </>
            )}
          </Step>

          {isSite ? (
            <>
              <Step number={2} title="Copy your web address">
                {isPublished && liveUrl ? <CopyBlock label="Web address" code={liveUrl} /> : <p>You choose your address when you publish.</p>}
                {isPublished && liveUrl && <a href={liveUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">Open it <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" /></a>}
              </Step>
              <Step number={3} title="Send people to it">
                <p className="font-medium text-slate-800 dark:text-slate-100">Pick whichever suits you:</p>
                <ul className="space-y-2.5">
                  <li><strong className="font-semibold">Share the link.</strong> Put it in your email signature, social profiles, ads or QR codes.</li>
                  <li><strong className="font-semibold">Link from the site you already have.</strong> Add a menu item or button there, and paste the address as its link.</li>
                  <li><strong className="font-semibold">Show it inside an existing page.</strong> Paste this where it should appear. If it stays blank, your host has blocked it, so use a link instead.</li>
                </ul>
                {isPublished && iframeCode && <CopyBlock label="Show it inside a page" code={iframeCode} />}
              </Step>
              <Step number={4} title="Use your own domain">
                <DomainSetup project={project} />
              </Step>
              <Step number={5} title="In a mobile app">
                <MobileSteps project={project} />
              </Step>
            </>
          ) : (
            <>
              <Step number={2} title="Add one script to your site">
                <ScriptSteps project={project} />
              </Step>
              {showsInline && (
                <Step number={3} title="Choose where it appears">
                  <p>Paste this into your page, at the spot where it should show.</p>
                  <CopyBlock label="Place where it should appear" code={inlineSnippet(project.id)} />
                </Step>
              )}
              <Step number={showsInline ? 4 : 3} title="Check that it works">
                <SiteCheck project={project} showsInline={showsInline} />
                <ul className="list-disc pl-5 space-y-1">
                  {module.delivery === 'overlay' && <li>Visitors see it on pages that match the rules you set in the editor, under When it appears.</li>}
                  <li>Still stuck? See <Link to={ROUTES.doc('troubleshooting')} className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">Troubleshooting</Link>.</li>
                </ul>
              </Step>
              <Step number={showsInline ? 5 : 4} title="In a mobile app">
                <MobileSteps project={project} />
              </Step>
            </>
          )}
        </ol>
      </section>

      <aside aria-label="More help" className="space-y-4">
        <div className={`${cardClass} p-5 text-sm`}>
          <h3 className="font-semibold">Need more detail?</h3>
          <p className="mt-1 text-slate-500 dark:text-slate-400">The guide covers every setting, with your project filled in.</p>
          <Link to={`${ROUTES.doc(project.type)}?project=${project.id}`} className="mt-2 inline-block font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
            Read the {noun} integration guide
          </Link>
          {isSite && <Link to={ROUTES.doc('payments')} className="mt-2 block font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">Take payments on your site</Link>}
        </div>
        <div className={`${cardClass} p-5 text-sm`}>
          <h3 className="font-semibold">Stuck?</h3>
          <p className="mt-1 text-slate-500 dark:text-slate-400">Tell us where you got to, and we'll help you finish.</p>
          <Link to={ROUTES.support} className="mt-2 inline-block font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">Ask for help</Link>
        </div>
      </aside>
    </div>
  );
};
