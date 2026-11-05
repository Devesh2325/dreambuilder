import React, { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, BarChart3, Braces, Check, ChevronDown, Code2, Globe, History, LayoutTemplate, MonitorSmartphone, MousePointerClick, Palette, ShieldCheck, Sparkles, Users, Video,
} from 'lucide-react';
import { MODULE_LIST } from '../../core/modules';
import { getTemplate, TEMPLATES } from '../../templates';
import { SECTION_LIBRARY } from '../../templates/sections';
import { ROUTES } from '../routes';
import { Icon } from '../shared/Icon';
import { LiveThumbnail } from '../templates/LiveThumbnail';
import { ProductDemo } from './ProductDemo';

const SHOWCASE = ['website-restaurant', 'page-fintech-app', 'website-saas', 'page-travel-package', 'website-clinic', 'page-gym-offer'];
const INDUSTRIES = ['Restaurants', 'Clinics', 'Real estate', 'Gyms', 'Schools', 'Law firms', 'Hotels', 'Software', 'Salons', 'Charities', 'Finance', 'Shops', 'Weddings', 'Consultants'];

const FEATURES = [
  { icon: LayoutTemplate, title: 'Templates for your industry', text: 'Start from something that already looks finished, then make it yours.' },
  { icon: Braces, title: 'Change it once, everywhere', text: 'Your business name, prices and links live in one place, and update wherever they appear.' },
  { icon: Palette, title: 'A real visual editor', text: 'Drag blocks, type on the page, and control spacing, fonts and colors with no code.' },
  { icon: MonitorSmartphone, title: 'Designed for every screen', text: 'Set a different layout for tablet and mobile, or leave a block off a device entirely.' },
  { icon: MousePointerClick, title: 'Build tours on your live app', text: 'Open your own site, click what you want to explain, and each click becomes a step.' },
  { icon: Video, title: 'Video, carousels and more', text: 'Add YouTube videos, scrolling strips, carousels, forms and tooltips where you need them.' },
  { icon: History, title: 'Publish with confidence', text: 'Every publish is saved as a version, so you can always go back.' },
  { icon: Users, title: 'Made for teams', text: 'Invite your team with roles, and share your own templates and sections.' },
  { icon: BarChart3, title: 'See what is working', text: 'Page views, clicks, finished tours and form responses, in one place.' },
];

const STEPS = [
  { title: 'Choose a template', text: 'Pick what you are building, then a design made for your industry.' },
  { title: 'Add your details', text: 'Fill in a simple form and watch the page update as you type.' },
  { title: 'Publish', text: 'Change anything you like in the editor, then go live with a web address or one line of code.' },
];

const FAQ = [
  { question: 'Do I need to know how to code?', answer: 'No. You choose a template, fill in a form and edit on the page. Developers can use the JavaScript API if they want to, but nothing requires it.' },
  { question: 'Can I add tours and forms to my existing site?', answer: 'Yes. Paste one script into your site, and your tours, banners, forms and demos appear there. It runs apart from your own styles, so the two don\'t interfere.' },
  { question: 'Where do my websites live?', answer: 'Published websites and pages get their own web address on FlowPilot. Connecting your own domain isn\'t available yet.' },
  { question: 'Can my team use it together?', answer: 'Yes. Invite people as admins, editors or viewers, and save templates and sections for everyone to reuse.' },
  { question: 'Can I take payments on my site?', answer: 'Yes. Add a Pay button, and connect it to a payment link from Stripe, Razorpay, PayPal or another provider. Visitors pay on their secure page, and the money goes straight to you.' },
  { question: 'What does it cost?', answer: 'You can start on the free plan. Online upgrades aren\'t available yet, so ask us from the Plans page if you need more.' },
];

const Cta: React.FC<{ className?: string; children: React.ReactNode }> = ({ className = '', children }) => (
  <Link to={ROUTES.signUp} className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all ${className}`}>
    {children}
    <ArrowRight className="w-4 h-4" aria-hidden="true" />
  </Link>
);

const Logo: React.FC<{ light?: boolean }> = ({ light }) => (
  <span className="flex items-center gap-2">
    <span aria-hidden="true" className="w-8 h-8 flex items-center justify-center rounded-lg bg-indigo-600 text-white text-sm font-extrabold">F</span>
    <span className={`font-extrabold ${light ? 'text-white' : 'text-slate-900'}`}>FlowPilot</span>
  </span>
);

/** What people see before they have an account. Every claim here is something the product does. */
export const LandingPage: React.FC = () => {
  useEffect(() => {
    const previous = document.title;
    document.title = 'FlowPilot: build websites, pages, tours and forms without code';
    return () => {
      document.title = previous;
    };
  }, []);
  const templates = useMemo(() => SHOWCASE.flatMap((id) => getTemplate(id) ?? []), []);
  const hero = getTemplate('website-agency') ?? TEMPLATES[0];

  return (
    <div className="h-screen overflow-y-auto scroll-smooth bg-white text-slate-900 font-sans">
      <style>{`
@keyframes fp-landing-strip{to{transform:translateX(-50%)}}
.fp-landing-strip{animation:fp-landing-strip 40s linear infinite}
@media (prefers-reduced-motion:reduce){.fp-landing-strip{animation:none}}
`}</style>

      <header className="sticky top-0 z-30 bg-slate-950/85 backdrop-blur border-b border-white/10">
        <div className="max-w-7xl mx-auto h-16 px-6 flex items-center justify-between gap-6">
          <Logo light />
          <nav aria-label="Landing page" className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-300">
            <a href="#demo" className="hover:text-white">Try it</a>
            <a href="#build" className="hover:text-white">What you can build</a>
            <a href="#features" className="hover:text-white">Features</a>
            <a href="#templates" className="hover:text-white">Templates</a>
            <a href="#questions" className="hover:text-white">Questions</a>
            <Link to={ROUTES.docs} className="hover:text-white">Docs</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link to={ROUTES.login} className="px-3 py-2 text-sm font-semibold text-slate-200 hover:text-white">Log in</Link>
            <Cta className="px-4 py-2 text-sm text-white bg-indigo-600 hover:bg-indigo-500">Start free</Cta>
          </div>
        </div>
      </header>

      <main>
        <section aria-labelledby="landing-title" className="relative overflow-hidden bg-slate-950 text-white">
          <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(99,102,241,.45),transparent_70%)]" />
          <div className="relative max-w-7xl mx-auto px-6 pt-20 pb-10 text-center">
            <p className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium text-indigo-200 bg-white/5 border border-white/10">
              <Sparkles className="w-4 h-4" aria-hidden="true" />
              Websites, pages, tours and forms in one builder
            </p>
            <h1 id="landing-title" className="mt-6 text-4xl sm:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-[1.08]">
              Build it in minutes. <span className="bg-gradient-to-r from-indigo-300 to-fuchsia-300 bg-clip-text text-transparent">No code needed.</span>
            </h1>
            <p className="mt-6 text-lg text-slate-300 max-w-2xl mx-auto">
              Choose a template for your industry, fill in your details, and publish. Change anything on the page with a visual editor, whenever you want.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Cta className="px-6 py-3 text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30">Start building free</Cta>
              <a href="#templates" className="px-6 py-3 rounded-xl font-semibold text-white bg-white/10 hover:bg-white/15">See the templates</a>
            </div>
            <dl className="mt-10 flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-sm text-slate-400">
              <div><dt className="sr-only">Templates</dt><dd><strong className="text-white">{TEMPLATES.length}</strong> templates</dd></div>
              <div><dt className="sr-only">Sections</dt><dd><strong className="text-white">{SECTION_LIBRARY.length}</strong> ready-made sections</dd></div>
              <div><dt className="sr-only">Modules</dt><dd><strong className="text-white">{MODULE_LIST.length}</strong> kinds of project</dd></div>
            </dl>

            <div className="mt-12 mx-auto max-w-5xl rounded-t-2xl overflow-hidden border border-white/15 border-b-0 shadow-2xl shadow-indigo-950">
              <div aria-hidden="true" className="h-9 flex items-center gap-1.5 px-4 bg-slate-800">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              </div>
              <LiveThumbnail template={hero} className="h-[300px] sm:h-[420px]" scale={0.62} />
            </div>
          </div>
        </section>

        <section aria-label="Industries" className="py-5 overflow-hidden bg-slate-50 border-b border-slate-200">
          <div className="fp-landing-strip flex w-max" aria-hidden="true">
            {[0, 1].map((set) => (
              <div key={set} className="flex shrink-0 gap-10 pr-10 text-sm font-semibold text-slate-500 whitespace-nowrap">
                {INDUSTRIES.map((industry) => <span key={industry}>{industry}</span>)}
              </div>
            ))}
          </div>
          <p className="sr-only">Templates for {INDUSTRIES.join(', ')}.</p>
        </section>

        <section id="demo" aria-labelledby="demo-title" className="py-24 px-6 bg-slate-950 text-white">
          <div className="max-w-5xl mx-auto">
            <div className="max-w-2xl mx-auto text-center">
              <p className="text-sm font-semibold text-indigo-300">Try it now, no signup</p>
              <h2 id="demo-title" className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight">See how it works</h2>
              <p className="mt-4 text-lg text-slate-300">Click through the four steps. This interactive demo was made with FlowPilot's own demo builder, so you could make one just like it for your product.</p>
            </div>
            <div className="mt-10 rounded-2xl overflow-hidden bg-white text-slate-900 p-3 sm:p-4 shadow-2xl shadow-indigo-950">
              <ProductDemo />
            </div>
          </div>
        </section>

        <section id="build" aria-labelledby="build-title" className="py-24 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="max-w-2xl mx-auto text-center">
              <h2 id="build-title" className="text-3xl sm:text-4xl font-extrabold tracking-tight">One builder for everything you need</h2>
              <p className="mt-4 text-lg text-slate-600">Each kind of project has its own templates, its own blocks and its own page to manage it.</p>
            </div>
            <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {MODULE_LIST.map((module) => (
                <li key={module.type} className="p-6 rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-lg transition-all">
                  <span className="w-11 h-11 flex items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><Icon name={module.icon} className="w-5 h-5" /></span>
                  <h3 className="mt-4 font-bold">{module.plural}</h3>
                  <p className="mt-1 text-sm text-slate-600">{module.description}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section aria-labelledby="how-title" className="py-24 px-6 bg-slate-50">
          <div className="max-w-5xl mx-auto">
            <h2 id="how-title" className="text-3xl sm:text-4xl font-extrabold tracking-tight text-center">From idea to live in three steps</h2>
            <ol className="mt-12 grid gap-6 md:grid-cols-3">
              {STEPS.map((step, index) => (
                <li key={step.title} className="p-6 rounded-2xl bg-white border border-slate-200">
                  <span aria-hidden="true" className="w-9 h-9 flex items-center justify-center rounded-full bg-indigo-600 text-white font-bold">{index + 1}</span>
                  <h3 className="mt-4 text-lg font-bold">{step.title}</h3>
                  <p className="mt-1 text-slate-600">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="features" aria-labelledby="features-title" className="py-24 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="max-w-2xl mx-auto text-center">
              <h2 id="features-title" className="text-3xl sm:text-4xl font-extrabold tracking-tight">Powerful, without being complicated</h2>
              <p className="mt-4 text-lg text-slate-600">Easy enough for anyone on your team, and complete enough to run real projects.</p>
            </div>
            <ul className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map(({ icon: FeatureIcon, title, text }) => (
                <li key={title} className="flex gap-4">
                  <span className="shrink-0 w-11 h-11 flex items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><FeatureIcon className="w-5 h-5" aria-hidden="true" /></span>
                  <div>
                    <h3 className="font-bold">{title}</h3>
                    <p className="mt-1 text-sm text-slate-600">{text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="templates" aria-labelledby="templates-title" className="py-24 px-6 bg-slate-50">
          <div className="max-w-7xl mx-auto">
            <div className="max-w-2xl mx-auto text-center">
              <h2 id="templates-title" className="text-3xl sm:text-4xl font-extrabold tracking-tight">Start from something great</h2>
              <p className="mt-4 text-lg text-slate-600">Every template runs on variables, so a few answers turn it into your own.</p>
            </div>
            <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {templates.map((template) => (
                <li key={template.id} className="rounded-2xl overflow-hidden bg-white border border-slate-200 hover:shadow-xl transition-shadow">
                  <LiveThumbnail template={template} className="h-56" />
                  <div className="p-4 border-t border-slate-100">
                    <p className="text-xs font-semibold text-indigo-600">{template.category}</p>
                    <h3 className="mt-0.5 font-bold">{template.title}</h3>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section aria-labelledby="install-title" className="py-24 px-6 bg-slate-950 text-white">
          <div className="max-w-6xl mx-auto grid gap-12 lg:grid-cols-2 items-center">
            <div>
              <span className="w-11 h-11 flex items-center justify-center rounded-xl bg-white/10 text-indigo-300"><Code2 className="w-5 h-5" aria-hidden="true" /></span>
              <h2 id="install-title" className="mt-4 text-3xl sm:text-4xl font-extrabold tracking-tight">Add it to the site you already have</h2>
              <p className="mt-4 text-lg text-slate-300">One small script brings your tours, banners, forms and demos to any website or web app. Change them here, and publish without touching your code.</p>
              <ul className="mt-6 space-y-2 text-slate-200">
                {['Runs apart from your own styles', 'Works with single-page apps', 'Choose where, when and how often it shows', 'Built not to break your page if something goes wrong'].map((point) => (
                  <li key={point} className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />{point}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl bg-slate-900 border border-white/10 p-6 text-left">
              <p className="flex items-center gap-2 text-sm text-slate-400"><ShieldCheck className="w-4 h-4" aria-hidden="true" />Add before &lt;/body&gt;</p>
              <pre className="mt-3 text-sm text-indigo-200 overflow-x-auto"><code>{'<script\n  src="/flowpilot.js"\n  data-project-id="your-project"\n  defer\n></script>'}</code></pre>
            </div>
          </div>
        </section>

        <section id="questions" aria-labelledby="questions-title" className="py-24 px-6">
          <div className="max-w-3xl mx-auto">
            <h2 id="questions-title" className="text-3xl sm:text-4xl font-extrabold tracking-tight text-center">Common questions</h2>
            <div className="mt-10 divide-y divide-slate-200 border-y border-slate-200">
              {FAQ.map((item) => (
                <details key={item.question} className="group py-5">
                  <summary className="flex items-center justify-between gap-4 font-semibold cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                    {item.question}
                    <ChevronDown className="w-5 h-5 shrink-0 text-slate-400 transition-transform group-open:rotate-180" aria-hidden="true" />
                  </summary>
                  <p className="mt-3 text-slate-600">{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section aria-labelledby="closing-title" className="px-6 pb-24">
          <div className="max-w-5xl mx-auto px-6 py-16 text-center rounded-3xl text-white bg-gradient-to-br from-indigo-600 to-fuchsia-600">
            <h2 id="closing-title" className="text-3xl sm:text-4xl font-extrabold tracking-tight">Your next project can be live today</h2>
            <p className="mt-3 text-lg text-indigo-100">Create an account, and choose your first template.</p>
            <Cta className="mt-8 px-6 py-3 text-indigo-700 bg-white hover:bg-indigo-50">Start building free</Cta>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-10 flex flex-wrap items-center justify-between gap-4">
          <Logo />
          <nav aria-label="Footer" className="flex flex-wrap items-center gap-6 text-sm font-medium text-slate-600">
            <Link to={ROUTES.docs} className="hover:text-slate-900">Docs</Link>
            <Link to={ROUTES.login} className="hover:text-slate-900">Log in</Link>
            <Link to={ROUTES.signUp} className="hover:text-slate-900">Create account</Link>
          </nav>
          <p className="flex items-center gap-1.5 text-sm text-slate-500"><Globe className="w-4 h-4" aria-hidden="true" />Build once. Publish anywhere you need it.</p>
        </div>
      </footer>
    </div>
  );
};
