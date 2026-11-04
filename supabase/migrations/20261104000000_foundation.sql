-- FlowPilot foundation: tenants, roles, projects, documents, versions, assets.
--
-- Security model:
--   * RLS is on for every table, and access is default-deny.
--   * Supabase grants broad table rights to anon/authenticated by default, so
--     they are revoked here and re-granted per column. Columns that must not be
--     client-writable (plan, status, published_version_id, organization_id...)
--     are simply not granted.
--   * Publishing and other privileged writes go through functions in later
--     migrations.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  plan text not null default 'free'
    check (plan in ('free', 'starter', 'pro', 'agency', 'enterprise')),
  branding jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text check (char_length(full_name) <= 120),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references public.user_profiles (id) on delete cascade,
  role text not null default 'editor' check (role in ('owner', 'admin', 'editor', 'viewer')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  type text not null check (type in (
    'website', 'page', 'tour', 'form', 'demo', 'banner', 'menu', 'faq'
  )),
  title text not null check (char_length(title) between 1 and 200),
  description text not null default '' check (char_length(description) <= 2000),
  slug text unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 63),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  tags text[] not null default '{}',
  template_id text,
  template_version integer,
  variables jsonb not null default '{}'::jsonb check (pg_column_size(variables) < 1000000),
  theme jsonb not null default '{}'::jsonb check (pg_column_size(theme) < 100000),
  settings jsonb not null default '{}'::jsonb check (pg_column_size(settings) < 100000),
  published_version_id uuid,
  created_by uuid default auth.uid() references public.user_profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Target of the composite foreign keys that keep child rows in one tenant.
  unique (id, organization_id)
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null,
  organization_id uuid not null,
  kind text not null default 'page' check (kind in ('page', 'global', 'experience')),
  title text not null check (char_length(title) between 1 and 200),
  -- URL path segment of a page. Empty string is the project's home page.
  slug text not null default '' check (slug = '' or slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  position integer not null default 0,
  seo jsonb not null default '{}'::jsonb,
  content jsonb not null check (pg_column_size(content) < 5000000),
  schema_version integer not null default 1,
  -- Bumped by trigger on every write. Clients send the revision they loaded,
  -- so a stale save updates no rows instead of overwriting newer work.
  revision integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (project_id, organization_id)
    references public.projects (id, organization_id) on delete cascade,
  unique (project_id, slug)
);

create table public.project_versions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null,
  organization_id uuid not null,
  version_number integer not null,
  snapshot jsonb not null,
  published_by uuid references public.user_profiles (id) on delete set null,
  change_summary text,
  created_at timestamptz not null default now(),
  foreign key (project_id, organization_id)
    references public.projects (id, organization_id) on delete cascade,
  unique (project_id, version_number)
);

create table public.assets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 255),
  file_path text not null,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes >= 0),
  alt_text text not null default '',
  uploaded_by uuid default auth.uid() references public.user_profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index organization_members_user_idx on public.organization_members (user_id);
create index projects_org_idx on public.projects (organization_id, updated_at desc);
create index documents_project_idx on public.documents (project_id, position);
create index documents_org_idx on public.documents (organization_id);
create index project_versions_project_idx on public.project_versions (project_id, version_number desc);
create index project_versions_org_idx on public.project_versions (organization_id);
create index assets_org_idx on public.assets (organization_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Role helpers
-- ---------------------------------------------------------------------------

-- SECURITY DEFINER so policies on organization_members don't recurse into themselves.
create function public.has_org_role(org uuid, allowed text[])
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.organization_members m
    where m.organization_id = org
      and m.user_id = auth.uid()
      and m.role = any (allowed)
  );
$$;

create function public.is_org_member(org uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select public.has_org_role(org, array['owner', 'admin', 'editor', 'viewer']);
$$;

create function public.shares_org_with(other_user uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_members mine
    join public.organization_members theirs using (organization_id)
    where mine.user_id = auth.uid() and theirs.user_id = other_user
  );
$$;

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

create function public.touch_updated_at()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger organizations_touch before update on public.organizations
  for each row execute function public.touch_updated_at();
create trigger user_profiles_touch before update on public.user_profiles
  for each row execute function public.touch_updated_at();
create trigger organization_members_touch before update on public.organization_members
  for each row execute function public.touch_updated_at();
create trigger projects_touch before update on public.projects
  for each row execute function public.touch_updated_at();

create function public.bump_document_revision()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  new.revision := old.revision + 1;
  new.updated_at := now();
  return new;
end;
$$;

create trigger documents_bump_revision before update on public.documents
  for each row execute function public.bump_document_revision();

-- A workspace must always keep at least one owner.
create function public.protect_last_owner()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  loses_owner boolean := old.role = 'owner';
begin
  if tg_op = 'UPDATE' then
    loses_owner := old.role = 'owner' and new.role <> 'owner';
  end if;

  -- During ON DELETE CASCADE from the organization, the parent is already gone.
  if loses_owner
    and exists (select 1 from public.organizations o where o.id = old.organization_id)
    and not exists (
      select 1 from public.organization_members m
      where m.organization_id = old.organization_id
        and m.role = 'owner'
        and m.id <> old.id
    )
  then
    raise exception 'A workspace must keep at least one owner' using errcode = 'P0001';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger organization_members_protect_owner
  before update or delete on public.organization_members
  for each row execute function public.protect_last_owner();

-- Creates a workspace and makes the given user its owner.
create function public.create_workspace_for_user(owner_id uuid, workspace_name text)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  org_id uuid := gen_random_uuid();
  clean_name text := left(coalesce(nullif(btrim(workspace_name), ''), 'My Workspace'), 120);
  base_slug text := left(
    btrim(regexp_replace(lower(clean_name), '[^a-z0-9]+', '-', 'g'), '-'), 40
  );
begin
  if base_slug = '' then
    base_slug := 'workspace';
  end if;
  insert into public.organizations (id, name, slug)
  values (
    org_id,
    clean_name,
    -- The trim handles a name cut off right after a hyphen by left() above.
    btrim(base_slug, '-') || '-' || left(replace(org_id::text, '-', ''), 8)
  );
  insert into public.organization_members (organization_id, user_id, role)
  values (org_id, owner_id, 'owner');
  return org_id;
end;
$$;

-- Runs on signup. Metadata is user-supplied, so it is only used as display text.
create function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  display_name text := left(nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''), 120);
begin
  insert into public.user_profiles (id, email, full_name)
  values (new.id, coalesce(new.email, ''), display_name);

  perform public.create_workspace_for_user(
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'workspace_name',
      split_part(coalesce(new.email, ''), '@', 1)
    )
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Client-callable functions
-- ---------------------------------------------------------------------------

create function public.create_organization(workspace_name text)
returns uuid
language plpgsql security definer set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;
  return public.create_workspace_for_user(auth.uid(), workspace_name);
end;
$$;

-- Creates a project and all its documents in one transaction, so the database
-- generates one project id and the rows cannot disagree about it. Runs with the
-- caller's rights: RLS decides whether they may write to this workspace.
create function public.create_project_with_documents(
  org uuid,
  project_type text,
  project_title text,
  project_description text default '',
  project_variables jsonb default '{}'::jsonb,
  project_theme jsonb default '{}'::jsonb,
  project_settings jsonb default '{}'::jsonb,
  source_template_id text default null,
  source_template_version integer default null,
  project_documents jsonb default '[]'::jsonb
)
returns uuid
language plpgsql security invoker set search_path = ''
as $$
declare
  new_project_id uuid;
begin
  insert into public.projects (
    organization_id, type, title, description, variables, theme, settings,
    template_id, template_version
  )
  values (
    org, project_type, project_title, project_description, project_variables,
    project_theme, project_settings, source_template_id, source_template_version
  )
  returning id into new_project_id;

  insert into public.documents (
    project_id, organization_id, kind, title, slug, position, seo, content, schema_version
  )
  select
    new_project_id,
    org,
    coalesce(d ->> 'kind', 'page'),
    d ->> 'title',
    coalesce(d ->> 'slug', ''),
    ordinality::integer - 1,
    coalesce(d -> 'seo', '{}'::jsonb),
    d -> 'content',
    coalesce((d ->> 'schemaVersion')::integer, 1)
  from jsonb_array_elements(project_documents) with ordinality as t (d, ordinality);

  return new_project_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Privileges
-- ---------------------------------------------------------------------------

revoke all on all tables in schema public from anon, authenticated;
revoke execute on all functions in schema public from public, anon, authenticated;

grant select on
  public.organizations, public.user_profiles, public.organization_members,
  public.projects, public.documents, public.project_versions, public.assets
  to authenticated;

-- plan is deliberately absent, so users cannot upgrade themselves.
grant update (name, slug, branding) on public.organizations to authenticated;
grant delete on public.organizations to authenticated;

grant update (full_name, avatar_url) on public.user_profiles to authenticated;

-- No direct insert: members join through the invitation flow.
grant update (role) on public.organization_members to authenticated;
grant delete on public.organization_members to authenticated;

-- created_by and uploaded_by default to auth.uid() and cannot be set by clients.
grant insert (
  organization_id, type, title, description, slug, tags, template_id,
  template_version, variables, theme, settings
) on public.projects to authenticated;
grant update (title, description, slug, tags, variables, theme, settings)
  on public.projects to authenticated;
grant delete on public.projects to authenticated;

grant insert (
  project_id, organization_id, kind, title, slug, position, seo, content, schema_version
) on public.documents to authenticated;
grant update (kind, title, slug, position, seo, content, schema_version)
  on public.documents to authenticated;
grant delete on public.documents to authenticated;

-- project_versions stays read-only for clients.

grant insert (
  organization_id, name, file_path, mime_type, size_bytes, alt_text
) on public.assets to authenticated;
grant update (name, alt_text) on public.assets to authenticated;
grant delete on public.assets to authenticated;

-- Policies call these as the querying user.
grant execute on function public.has_org_role(uuid, text[]) to authenticated;
grant execute on function public.is_org_member(uuid) to authenticated;
grant execute on function public.shares_org_with(uuid) to authenticated;
grant execute on function public.create_organization(text) to authenticated;
grant execute on function public.create_project_with_documents(
  uuid, text, text, text, jsonb, jsonb, jsonb, text, integer, jsonb
) to authenticated;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.organizations enable row level security;
alter table public.user_profiles enable row level security;
alter table public.organization_members enable row level security;
alter table public.projects enable row level security;
alter table public.documents enable row level security;
alter table public.project_versions enable row level security;
alter table public.assets enable row level security;

create policy organizations_select on public.organizations for select to authenticated
  using (public.is_org_member(id));
create policy organizations_update on public.organizations for update to authenticated
  using (public.has_org_role(id, array['owner', 'admin']))
  with check (public.has_org_role(id, array['owner', 'admin']));
create policy organizations_delete on public.organizations for delete to authenticated
  using (public.has_org_role(id, array['owner']));

create policy user_profiles_select on public.user_profiles for select to authenticated
  using (id = auth.uid() or public.shares_org_with(id));
create policy user_profiles_update on public.user_profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy members_select on public.organization_members for select to authenticated
  using (public.is_org_member(organization_id));
-- Admins manage non-owners. Only owners can grant or change the owner role.
create policy members_update on public.organization_members for update to authenticated
  using (
    public.has_org_role(organization_id, array['owner'])
    or (public.has_org_role(organization_id, array['admin']) and role <> 'owner')
  )
  with check (
    public.has_org_role(organization_id, array['owner'])
    or (public.has_org_role(organization_id, array['admin']) and role <> 'owner')
  );
-- Members may also leave on their own. The trigger protects the last owner.
create policy members_delete on public.organization_members for delete to authenticated
  using (
    user_id = auth.uid()
    or public.has_org_role(organization_id, array['owner'])
    or (public.has_org_role(organization_id, array['admin']) and role <> 'owner')
  );

create policy projects_select on public.projects for select to authenticated
  using (public.is_org_member(organization_id));
create policy projects_insert on public.projects for insert to authenticated
  with check (public.has_org_role(organization_id, array['owner', 'admin', 'editor']));
create policy projects_update on public.projects for update to authenticated
  using (public.has_org_role(organization_id, array['owner', 'admin', 'editor']))
  with check (public.has_org_role(organization_id, array['owner', 'admin', 'editor']));
create policy projects_delete on public.projects for delete to authenticated
  using (public.has_org_role(organization_id, array['owner', 'admin']));

create policy documents_select on public.documents for select to authenticated
  using (public.is_org_member(organization_id));
create policy documents_insert on public.documents for insert to authenticated
  with check (public.has_org_role(organization_id, array['owner', 'admin', 'editor']));
create policy documents_update on public.documents for update to authenticated
  using (public.has_org_role(organization_id, array['owner', 'admin', 'editor']))
  with check (public.has_org_role(organization_id, array['owner', 'admin', 'editor']));
create policy documents_delete on public.documents for delete to authenticated
  using (public.has_org_role(organization_id, array['owner', 'admin', 'editor']));

create policy project_versions_select on public.project_versions for select to authenticated
  using (public.is_org_member(organization_id));

create policy assets_select on public.assets for select to authenticated
  using (public.is_org_member(organization_id));
create policy assets_insert on public.assets for insert to authenticated
  with check (public.has_org_role(organization_id, array['owner', 'admin', 'editor']));
create policy assets_update on public.assets for update to authenticated
  using (public.has_org_role(organization_id, array['owner', 'admin', 'editor']))
  with check (public.has_org_role(organization_id, array['owner', 'admin', 'editor']));
create policy assets_delete on public.assets for delete to authenticated
  using (public.has_org_role(organization_id, array['owner', 'admin', 'editor']));

-- ---------------------------------------------------------------------------
-- Asset storage. Files live under <organization_id>/... in a public-read bucket,
-- because published sites must load images without a login. SVG is excluded
-- since it can carry scripts.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'assets', 'assets', true, 10485760,
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'video/mp4']
)
on conflict (id) do nothing;

-- Returns null instead of raising on a path whose first folder isn't a uuid.
create function public.storage_path_org(object_name text)
returns uuid
language plpgsql immutable set search_path = ''
as $$
begin
  return split_part(object_name, '/', 1)::uuid;
exception when invalid_text_representation then
  return null;
end;
$$;

grant execute on function public.storage_path_org(text) to authenticated;

create policy assets_files_insert on storage.objects for insert to authenticated
  with check (
    bucket_id = 'assets'
    and public.has_org_role(public.storage_path_org(name), array['owner', 'admin', 'editor'])
  );
create policy assets_files_update on storage.objects for update to authenticated
  using (
    bucket_id = 'assets'
    and public.has_org_role(public.storage_path_org(name), array['owner', 'admin', 'editor'])
  )
  with check (
    bucket_id = 'assets'
    and public.has_org_role(public.storage_path_org(name), array['owner', 'admin', 'editor'])
  );
create policy assets_files_delete on storage.objects for delete to authenticated
  using (
    bucket_id = 'assets'
    and public.has_org_role(public.storage_path_org(name), array['owner', 'admin', 'editor'])
  );
