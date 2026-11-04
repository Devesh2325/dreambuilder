import React, { useEffect } from 'react';
import { Link, NavLink, useParams, useSearchParams } from 'react-router-dom';
import Markdown from 'react-markdown';
import { ArrowLeft } from 'lucide-react';
import { ROUTES } from '../app/routes';
import { DOC_SECTIONS, fillPlaceholders, getDoc } from './content';

const proseClass = [
  'max-w-3xl text-slate-700 dark:text-slate-300 leading-relaxed',
  '[&_h1]:text-3xl [&_h1]:font-bold [&_h1]:text-slate-900 dark:[&_h1]:text-white [&_h1]:mb-4',
  '[&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-slate-900 dark:[&_h2]:text-white [&_h2]:mt-8 [&_h2]:mb-3',
  '[&_p]:my-3 [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-1',
  '[&_a]:text-indigo-600 dark:[&_a]:text-indigo-400 [&_a]:font-medium hover:[&_a]:underline',
  '[&_code]:text-sm [&_code]:bg-slate-100 dark:[&_code]:bg-slate-800 [&_code]:px-1 [&_code]:rounded',
  '[&_pre]:my-4 [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:bg-slate-900 [&_pre]:text-slate-100',
  '[&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-slate-100',
  '[&_table]:my-4 [&_table]:w-full [&_table]:text-sm [&_th]:text-left [&_th]:py-1.5 [&_th]:border-b [&_th]:border-slate-300 dark:[&_th]:border-slate-700 [&_td]:py-1.5 [&_td]:pr-3 [&_td]:border-b [&_td]:border-slate-100 dark:[&_td]:border-slate-800',
].join(' ');

/** Public documentation. Works logged out, and filling in a real ID when opened from a project. */
const DocsPage: React.FC = () => {
  const { slug = 'getting-started' } = useParams();
  const [params] = useSearchParams();
  const project = params.get('project');
  const projectQuery = project ? `?project=${encodeURIComponent(project)}` : '';
  const doc = getDoc(slug);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (doc) document.title = `${doc.title} | FlowPilot docs`;
  }, [doc]);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white dark:bg-slate-950 font-sans">
      <aside className="md:w-64 shrink-0 md:h-screen md:sticky md:top-0 overflow-y-auto border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 p-4">
        <Link to={ROUTES.home} className="inline-flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 hover:underline">
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Back to app
        </Link>
        <p className="mt-4 font-extrabold text-indigo-600 dark:text-indigo-400">FlowPilot docs</p>
        <nav aria-label="Documentation" className="mt-3 space-y-4">
          {DOC_SECTIONS.map((section) => (
            <div key={section.title}>
              <p className="px-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{section.title}</p>
              <ul className="mt-1">
                {section.slugs.map((item) => (
                  <li key={item}>
                    <NavLink
                      to={`${ROUTES.doc(item)}${projectQuery}`}
                      className={({ isActive }) => `block px-2 py-1 rounded text-sm ${isActive ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-medium' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                    >
                      {getDoc(item)?.title}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
      <main className="flex-1 min-w-0 p-6 md:p-10">
        {doc ? (
          <article className={proseClass}>
            <Markdown
              components={{
                // Guides link to each other by slug. Keeps the project ID and stays in the app.
                a: ({ href, children }) =>
                  href && /^[a-z-]+$/.test(href)
                    ? <Link to={`${ROUTES.doc(href)}${projectQuery}`}>{children}</Link>
                    : <a href={href} target="_blank" rel="noreferrer">{children}</a>,
              }}
            >
              {fillPlaceholders(doc.body, window.location.origin, project)}
            </Markdown>
          </article>
        ) : (
          <div className={proseClass}>
            <h1>Page not found</h1>
            <p><Link to={ROUTES.docs}>Go to the start of the docs</Link></p>
          </div>
        )}
      </main>
    </div>
  );
};

export default DocsPage;
