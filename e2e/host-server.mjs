// Stands in for a customer's website, on a different origin from the app.
// Builds the real embed script first, pointed at an address tests can intercept.
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { join } from 'node:path';

const port = Number(process.argv[2] ?? 5198);
const outDir = 'test-results-embed';

execSync(`npx vite build -c vite.embed.config.ts --mode e2e --outDir ${outDir}`, {
  stdio: 'inherit',
  env: { ...process.env, VITE_SUPABASE_URL: 'http://supabase.test', VITE_SUPABASE_ANON_KEY: 'test-anon-key' },
});

const page = (body, title = 'Customer site') => `<!doctype html>
<html><head><meta charset="utf-8"><title>${title}</title></head>
<body style="margin:0;font-family:sans-serif">${body}</body></html>`;

createServer((request, response) => {
  const url = new URL(request.url, `http://localhost:${port}`);

  if (url.pathname === '/health') {
    response.end('ok');
    return;
  }
  if (url.pathname === '/flowpilot.js') {
    response.setHeader('Content-Type', 'text/javascript');
    response.end(readFileSync(join(outDir, 'flowpilot.js')));
    return;
  }

  const project = url.searchParams.get('project') ?? 'project-1';
  const inline = url.searchParams.get('inline') ? `<div id="slot" data-flowpilot="${project}"></div>` : '';
  // Like a real site's policy: its own scripts only, so FlowPilot's address is refused.
  const strict = url.searchParams.get('csp');
  const source = strict ? `http://127.0.0.1:${port}/flowpilot.js` : '/flowpilot.js';
  const script = url.searchParams.get('noscript') ? '' : `<script src="${source}" data-project-id="${project}"${url.searchParams.get('builder') ? ' data-builder-origin="http://localhost:5199"' : ''} defer></script>`;

  response.setHeader('Content-Type', 'text/html');
  if (strict) response.setHeader('Content-Security-Policy', "script-src 'self' 'unsafe-inline'");
  response.end(page(`
    <nav id="main-nav" style="padding:16px;background:#eee">
      <a href="#">Home</a>
      <button id="open-reports" data-tour="reports" style="margin-left:400px">Reports</button>
    </nav>
    <main style="height:2000px;padding:16px">
      <h1 id="title">Customer page: ${url.pathname.replace(/[<>&"]/g, '')}</h1>
      <button id="spa-link" onclick="history.pushState({}, '', '/other')">Go to other page</button>
      ${inline}
    </main>
    ${script}
  `));
}).listen(port, () => console.log(`Host site on ${port}`));
