/// <reference types="node" />
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PGlite } from '@electric-sql/pglite';

// Stand-ins for what a real Supabase project provides. Default privileges mimic
// Supabase's broad grants, so tests prove the migrations really revoke them.
const SUPABASE_STUB = `
  create role anon nologin;
  create role authenticated nologin;

  create schema auth;
  create table auth.users (
    id uuid primary key default gen_random_uuid(),
    email text,
    raw_user_meta_data jsonb not null default '{}'::jsonb
  );
  create function auth.uid() returns uuid language sql stable as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
  $$;
  grant usage on schema auth to anon, authenticated;

  grant usage on schema public to anon, authenticated;
  alter default privileges in schema public grant all on tables to anon, authenticated;
  alter default privileges in schema public grant all on functions to anon, authenticated;

  create schema storage;
  create table storage.buckets (
    id text primary key,
    name text not null,
    public boolean not null default false,
    file_size_limit bigint,
    allowed_mime_types text[]
  );
  create table storage.objects (
    id uuid primary key default gen_random_uuid(),
    bucket_id text references storage.buckets (id),
    name text not null
  );
  alter table storage.objects enable row level security;
  grant usage on schema storage to anon, authenticated;
  grant all on storage.objects to authenticated;
`;

export interface TestUser {
  id: string;
  email: string;
  orgId: string;
}

export interface TestDb {
  db: PGlite;
  signUp: (email: string, workspaceName?: string) => Promise<TestUser>;
  /** Runs a query as a logged-in user, under the same role PostgREST would use. */
  asUser: <T = Record<string, unknown>>(userId: string, sql: string, params?: unknown[]) => Promise<T[]>;
  asAnon: <T = Record<string, unknown>>(sql: string, params?: unknown[]) => Promise<T[]>;
  /** Runs as the database owner, bypassing RLS. Only for test fixtures. */
  asAdmin: <T = Record<string, unknown>>(sql: string, params?: unknown[]) => Promise<T[]>;
}

export async function createTestDb(): Promise<TestDb> {
  const db = new PGlite();
  await db.exec(SUPABASE_STUB);

  const dir = join(process.cwd(), 'supabase', 'migrations');
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.sql')).sort()) {
    await db.exec(readFileSync(join(dir, file), 'utf8'));
  }

  const asAdmin: TestDb['asAdmin'] = async <T,>(sql: string, params: unknown[] = []) =>
    (await db.query<T>(sql, params as never[])).rows;

  const runAs = async <T,>(role: string, userId: string, sql: string, params: unknown[]) => {
    await db.query(`select set_config('request.jwt.claim.sub', $1, false)`, [userId]);
    await db.exec(`set role ${role}`);
    try {
      return (await db.query<T>(sql, params as never[])).rows;
    } finally {
      await db.exec('reset role');
      await db.query(`select set_config('request.jwt.claim.sub', '', false)`);
    }
  };

  return {
    db,
    asAdmin,
    asUser: <T,>(userId: string, sql: string, params: unknown[] = []) =>
      runAs<T>('authenticated', userId, sql, params),
    asAnon: <T,>(sql: string, params: unknown[] = []) => runAs<T>('anon', '', sql, params),
    signUp: async (email, workspaceName) => {
      const [user] = await asAdmin<{ id: string }>(
        `insert into auth.users (email, raw_user_meta_data) values ($1, $2) returning id`,
        [email, JSON.stringify(workspaceName ? { workspace_name: workspaceName } : {})],
      );
      const [member] = await asAdmin<{ organization_id: string }>(
        `select organization_id from public.organization_members where user_id = $1`,
        [user.id],
      );
      return { id: user.id, email, orgId: member.organization_id };
    },
  };
}
