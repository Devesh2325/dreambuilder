// Connects a customer's domain: checks the DNS proof record, then adds the domain to the
// hosting so it serves this app. Runs on Supabase Edge Functions (Deno).
//
// Secrets, set with `supabase secrets set`:
//   VERCEL_TOKEN       a Vercel access token that can manage the project's domains
//   VERCEL_PROJECT_ID  the Vercel project that hosts FlowPilot
//   VERCEL_TEAM_ID     only if the project belongs to a team
// SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY are provided by Supabase.
//
// Not yet run against a live project: see docs/SUPABASE_SETUP.md.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const reply = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

const TWO_PART_ENDINGS = new Set(['co.uk', 'org.uk', 'co.in', 'com.au', 'co.nz', 'com.br', 'co.za', 'com.sg', 'co.jp']);
const rootOf = (domain: string) => {
  const parts = domain.split('.');
  return parts.slice(TWO_PART_ENDINGS.has(parts.slice(-2).join('.')) ? -3 : -2).join('.');
};

const vercel = async (path: string, init?: RequestInit) => {
  const team = Deno.env.get('VERCEL_TEAM_ID');
  const url = `https://api.vercel.com${path}${team ? `${path.includes('?') ? '&' : '?'}teamId=${team}` : ''}`;
  const response = await fetch(url, { ...init, headers: { Authorization: `Bearer ${Deno.env.get('VERCEL_TOKEN')}`, 'Content-Type': 'application/json', ...init?.headers } });
  return { ok: response.ok, status: response.status, body: await response.json().catch(() => ({})) };
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (request.method !== 'POST') return reply(405, { error: 'Use POST' });

  const { domainId } = await request.json().catch(() => ({}));
  if (typeof domainId !== 'string') return reply(400, { error: 'Missing domainId' });

  // Reading the row as the caller applies the database's rules: only their own workspace's.
  const asCaller = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: request.headers.get('Authorization') ?? '' } },
  });
  const { data: row } = await asCaller.from('project_domains').select('id, domain, organization_id, verification_token').eq('id', domainId).maybeSingle();
  if (!row) return reply(404, { error: 'Domain not found' });
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data: caller } = await asCaller.auth.getUser();
  const { data: member } = await admin.from('organization_members').select('role')
    .eq('organization_id', row.organization_id).eq('user_id', caller.user?.id ?? '').maybeSingle();
  if (!member || !['owner', 'admin', 'editor'].includes(member.role)) return reply(403, { error: 'Only owners, admins and editors can connect a domain' });
  const save = (status: 'active' | 'failed', lastError: string | null) =>
    admin.from('project_domains').update({ status, last_error: lastError, last_checked_at: new Date().toISOString() }).eq('id', row.id);

  // 1. Proof that whoever added it controls the domain, so nobody can claim someone else's.
  const root = rootOf(row.domain);
  const proofName = row.domain === root ? `_flowpilot.${root}` : `_flowpilot.${row.domain}`;
  let proofs: string[][] = [];
  try {
    proofs = await Deno.resolveDns(proofName, 'TXT');
  } catch {
    proofs = [];
  }
  if (!proofs.some((parts) => parts.join('') === `flowpilot-verify=${row.verification_token}`)) {
    await save('failed', `We couldn't find the TXT record at ${proofName} yet. DNS changes can take up to a day.`);
    return reply(200, { status: 'failed' });
  }

  // 2. The hosting has to know the domain before it will serve it.
  if (!Deno.env.get('VERCEL_TOKEN') || !Deno.env.get('VERCEL_PROJECT_ID')) {
    await save('failed', 'Custom domains are not set up on this FlowPilot yet. Its administrator needs to add the hosting settings.');
    return reply(200, { status: 'failed' });
  }
  const project = Deno.env.get('VERCEL_PROJECT_ID');
  const added = await vercel(`/v10/projects/${project}/domains`, { method: 'POST', body: JSON.stringify({ name: row.domain }) });
  if (!added.ok && added.body?.error?.code !== 'domain_already_in_use_by_project' && added.status !== 409) {
    await save('failed', `The hosting refused this domain: ${added.body?.error?.message ?? added.status}`);
    return reply(200, { status: 'failed' });
  }

  // 3. And the domain must already point at the hosting.
  const config = await vercel(`/v6/domains/${row.domain}/config`);
  if (config.ok && config.body?.misconfigured) {
    await save('failed', 'Your domain doesn\'t point to FlowPilot yet. Check the A or CNAME record, then try again.');
    return reply(200, { status: 'failed' });
  }

  await save('active', null);
  return reply(200, { status: 'active' });
});
