
-- ========================================
-- Migration: 20261104000000_foundation.sql
-- ========================================

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


-- ========================================
-- Migration: 20261104000100_publishing.sql
-- ========================================

-- Publishing: immutable versions, rollback, and the public read functions.

alter table public.projects
  add constraint projects_published_version_fk
  foreign key (published_version_id) references public.project_versions (id) on delete set null;

create function public.slugify(input text)
returns text
language sql immutable set search_path = ''
as $$
  select btrim(left(btrim(regexp_replace(lower(coalesce(input, '')), '[^a-z0-9]+', '-', 'g'), '-'), 50), '-');
$$;

-- Stores a full copy of the project and marks it live. Later edits to the drafts
-- don't affect the live version until the next publish.
create function public.publish_project(
  p_project uuid,
  p_summary text default null,
  p_slug text default null
)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  project public.projects;
  next_version integer;
  version_id uuid;
  final_slug text;
  page_count integer;
begin
  -- Locks the row, so two simultaneous publishes can't take the same version number.
  select * into project from public.projects where id = p_project for update;
  if not found or not public.has_org_role(project.organization_id, array['owner', 'admin', 'editor']) then
    raise exception 'Project not found or not allowed' using errcode = '42501';
  end if;

  select count(*) into page_count from public.documents where project_id = p_project;
  if page_count = 0 then
    raise exception 'Project has nothing to publish' using errcode = 'P0001';
  end if;

  final_slug := coalesce(
    nullif(p_slug, ''),
    project.slug,
    coalesce(nullif(public.slugify(project.title), ''), 'site') || '-' || left(replace(project.id::text, '-', ''), 6)
  );

  select coalesce(max(version_number), 0) + 1 into next_version
  from public.project_versions where project_id = p_project;

  insert into public.project_versions (
    project_id, organization_id, version_number, snapshot, published_by, change_summary
  )
  values (
    p_project,
    project.organization_id,
    next_version,
    jsonb_build_object(
      'project', jsonb_build_object(
        'id', project.id,
        'type', project.type,
        'title', project.title,
        'slug', final_slug,
        'variables', project.variables,
        'theme', project.theme,
        'settings', project.settings
      ),
      'documents', (
        select jsonb_agg(
          jsonb_build_object(
            'id', d.id, 'kind', d.kind, 'title', d.title, 'slug', d.slug,
            'position', d.position, 'seo', d.seo, 'content', d.content,
            'schemaVersion', d.schema_version
          )
          order by d.position
        )
        from public.documents d where d.project_id = p_project
      )
    ),
    auth.uid(),
    left(p_summary, 500)
  )
  returning id into version_id;

  update public.projects
  set status = 'published', published_version_id = version_id, slug = final_slug
  where id = p_project;

  return version_id;
end;
$$;

create function public.unpublish_project(p_project uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  org uuid;
begin
  select organization_id into org from public.projects where id = p_project;
  if org is null or not public.has_org_role(org, array['owner', 'admin', 'editor']) then
    raise exception 'Project not found or not allowed' using errcode = '42501';
  end if;
  update public.projects set status = 'draft', published_version_id = null where id = p_project;
end;
$$;

-- Replaces the drafts with a saved version. What is live doesn't change until the
-- user publishes again, which lets them check the result first.
create function public.restore_project_version(p_version uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  version public.project_versions;
begin
  select * into version from public.project_versions where id = p_version;
  if not found or not public.has_org_role(version.organization_id, array['owner', 'admin', 'editor']) then
    raise exception 'Version not found or not allowed' using errcode = '42501';
  end if;

  update public.projects
  set
    title = version.snapshot -> 'project' ->> 'title',
    variables = version.snapshot -> 'project' -> 'variables',
    theme = version.snapshot -> 'project' -> 'theme',
    settings = version.snapshot -> 'project' -> 'settings'
  where id = version.project_id;

  delete from public.documents where project_id = version.project_id;

  insert into public.documents (
    id, project_id, organization_id, kind, title, slug, position, seo, content, schema_version
  )
  select
    (d ->> 'id')::uuid,
    version.project_id,
    version.organization_id,
    d ->> 'kind',
    d ->> 'title',
    d ->> 'slug',
    (d ->> 'position')::integer,
    d -> 'seo',
    d -> 'content',
    (d ->> 'schemaVersion')::integer
  from jsonb_array_elements(version.snapshot -> 'documents') as d;
end;
$$;

-- Snapshot as visitors may see it. Webhook addresses are private.
create function public.public_snapshot(version_id uuid)
returns jsonb
language sql stable security definer set search_path = ''
as $$
  select v.snapshot #- '{project,settings,webhookUrl}'
  from public.project_versions v
  where v.id = version_id;
$$;

-- Only ever returns published versions, never drafts.
create function public.get_published_site(p_slug text)
returns jsonb
language sql stable security definer set search_path = ''
as $$
  select public.public_snapshot(p.published_version_id)
  from public.projects p
  where p.slug = p_slug and p.status = 'published';
$$;

create function public.get_published_experience(p_project uuid)
returns jsonb
language sql stable security definer set search_path = ''
as $$
  select public.public_snapshot(p.published_version_id)
  from public.projects p
  where p.id = p_project and p.status = 'published';
$$;

revoke execute on function public.slugify(text) from public, anon, authenticated;
revoke execute on function public.publish_project(uuid, text, text) from public, anon, authenticated;
revoke execute on function public.unpublish_project(uuid) from public, anon, authenticated;
revoke execute on function public.restore_project_version(uuid) from public, anon, authenticated;
revoke execute on function public.public_snapshot(uuid) from public, anon, authenticated;
revoke execute on function public.get_published_site(text) from public, anon, authenticated;
revoke execute on function public.get_published_experience(uuid) from public, anon, authenticated;

grant execute on function public.publish_project(uuid, text, text) to authenticated;
grant execute on function public.unpublish_project(uuid) to authenticated;
grant execute on function public.restore_project_version(uuid) to authenticated;
grant execute on function public.get_published_site(text) to anon, authenticated;
grant execute on function public.get_published_experience(uuid) to anon, authenticated;


-- ========================================
-- Migration: 20261104000200_engagement.sql
-- ========================================

-- Visitor data (form answers, analytics), invitations and plan limits.
--
-- Visitors have no login, so they only write through functions that require the
-- project to be published and limit what can be stored.

create table public.form_submissions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null,
  organization_id uuid not null,
  data jsonb not null,
  visitor_id text,
  -- Salted per project so it can't identify a visitor across projects. Used for rate limiting.
  source_hash text,
  created_at timestamptz not null default now(),
  foreign key (project_id, organization_id)
    references public.projects (id, organization_id) on delete cascade
);
create index form_submissions_project_idx on public.form_submissions (project_id, created_at desc);
create index form_submissions_org_idx on public.form_submissions (organization_id);
create index form_submissions_rate_idx on public.form_submissions (project_id, source_hash, created_at desc);

create table public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null,
  organization_id uuid not null,
  event_type text not null,
  visitor_id text,
  session_id text,
  device text,
  url text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  foreign key (project_id, organization_id)
    references public.projects (id, organization_id) on delete cascade
);
create index analytics_events_org_idx on public.analytics_events (organization_id, created_at desc);
create index analytics_events_project_idx on public.analytics_events (project_id, created_at desc);

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  email text not null,
  role text not null check (role in ('owner', 'admin', 'editor', 'viewer')),
  -- Only a hash is stored: a database leak must not reveal working invite links.
  token_hash text not null unique,
  invited_by uuid references public.user_profiles (id) on delete set null,
  expires_at timestamptz not null default now() + interval '7 days',
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);
create index invitations_org_idx on public.invitations (organization_id);

revoke all on public.form_submissions, public.analytics_events, public.invitations
  from anon, authenticated;

alter table public.form_submissions enable row level security;
alter table public.analytics_events enable row level security;
alter table public.invitations enable row level security;

grant select, delete on public.form_submissions to authenticated;
grant select on public.analytics_events to authenticated;
grant select (id, organization_id, email, role, expires_at, accepted_at, created_at) on public.invitations to authenticated;
grant delete on public.invitations to authenticated;

create policy form_submissions_select on public.form_submissions for select to authenticated
  using (public.is_org_member(organization_id));
create policy form_submissions_delete on public.form_submissions for delete to authenticated
  using (public.has_org_role(organization_id, array['owner', 'admin', 'editor']));
create policy analytics_events_select on public.analytics_events for select to authenticated
  using (public.is_org_member(organization_id));
create policy invitations_select on public.invitations for select to authenticated
  using (public.has_org_role(organization_id, array['owner', 'admin']));
create policy invitations_delete on public.invitations for delete to authenticated
  using (public.has_org_role(organization_id, array['owner', 'admin']));

-- ---------------------------------------------------------------------------
-- Visitor functions
-- ---------------------------------------------------------------------------

create function public.published_project_org(p_project uuid)
returns uuid
language sql stable security definer set search_path = ''
as $$
  select organization_id from public.projects where id = p_project and status = 'published';
$$;

create function public.request_source(p_project uuid, p_visitor text)
returns text
language plpgsql stable security definer set search_path = ''
as $$
declare
  headers json;
  source text;
begin
  begin
    headers := nullif(current_setting('request.headers', true), '')::json;
  exception when others then
    headers := null;
  end;
  -- cf-connecting-ip is set by Supabase's proxy. The first x-forwarded-for entry
  -- can be faked by the client, so it is only a fallback.
  source := coalesce(
    headers ->> 'cf-connecting-ip',
    nullif(split_part(headers ->> 'x-forwarded-for', ',', 1), ''),
    p_visitor,
    'unknown'
  );
  return encode(sha256(convert_to(p_project::text || ':' || source, 'UTF8')), 'hex');
end;
$$;

create function public.submit_form(p_project uuid, p_data jsonb, p_visitor text default null)
returns boolean
language plpgsql security definer set search_path = ''
as $$
declare
  org uuid := public.published_project_org(p_project);
  source text;
begin
  if org is null then
    raise exception 'This form is not available' using errcode = 'P0001';
  end if;
  if jsonb_typeof(p_data) <> 'object' or pg_column_size(p_data) > 65536 then
    raise exception 'Invalid form data' using errcode = 'P0001';
  end if;
  -- Report success to bots that filled the hidden field, so they don't adapt.
  if coalesce(p_data ->> '_hp', '') <> '' then
    return true;
  end if;

  source := public.request_source(p_project, p_visitor);
  if (
    select count(*) from public.form_submissions s
    where s.project_id = p_project
      and s.source_hash = source
      and s.created_at > now() - interval '1 minute'
  ) >= 10 then
    raise exception 'Too many submissions. Please wait a minute and try again.' using errcode = 'P0001';
  end if;

  insert into public.form_submissions (project_id, organization_id, data, visitor_id, source_hash)
  values (p_project, org, p_data - '_hp', left(p_visitor, 64), source);
  return true;
end;
$$;

create function public.track_events(p_project uuid, p_events jsonb)
returns integer
language plpgsql security definer set search_path = ''
as $$
declare
  org uuid := public.published_project_org(p_project);
  inserted integer;
begin
  if org is null then
    return 0;
  end if;
  if jsonb_typeof(p_events) <> 'array' or jsonb_array_length(p_events) > 50 or pg_column_size(p_events) > 65536 then
    raise exception 'Invalid analytics batch' using errcode = 'P0001';
  end if;

  insert into public.analytics_events (
    project_id, organization_id, event_type, visitor_id, session_id, device, url, metadata
  )
  select
    p_project,
    org,
    e ->> 'type',
    left(e ->> 'visitorId', 64),
    left(e ->> 'sessionId', 64),
    left(e ->> 'device', 16),
    left(e ->> 'url', 2000),
    case when jsonb_typeof(e -> 'metadata') = 'object' then e -> 'metadata' else '{}'::jsonb end
  from jsonb_array_elements(p_events) as e
  where e ->> 'type' ~ '^[a-z][a-z0-9_]{0,63}$';

  get diagnostics inserted = row_count;
  return inserted;
end;
$$;

-- Runs as the caller, so RLS limits it to workspaces they belong to.
create function public.analytics_summary(p_org uuid, p_days integer default 30)
returns table (project_id uuid, event_type text, day date, events bigint, visitors bigint)
language sql stable security invoker set search_path = ''
as $$
  select
    e.project_id,
    e.event_type,
    (e.created_at at time zone 'utc')::date,
    count(*),
    count(distinct e.visitor_id)
  from public.analytics_events e
  where e.organization_id = p_org
    and e.created_at > now() - make_interval(days => least(greatest(p_days, 1), 365))
  group by 1, 2, 3;
$$;

-- ---------------------------------------------------------------------------
-- Form webhooks. Sent by the pg_net extension when it is enabled. A delivery
-- problem must never lose the submission, so errors are swallowed.
-- ---------------------------------------------------------------------------

create function public.deliver_form_webhook()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  url text;
begin
  select p.settings ->> 'webhookUrl' into url from public.projects p where p.id = new.project_id;
  if url is null or url !~ '^https://' or to_regprocedure('net.http_post(text,jsonb,jsonb,jsonb,integer)') is null then
    return new;
  end if;
  begin
    execute 'select net.http_post($1, $2, ''{}''::jsonb, $3, 5000)'
    using
      url,
      jsonb_build_object(
        'event', 'form.submitted',
        'projectId', new.project_id,
        'submissionId', new.id,
        'createdAt', new.created_at,
        'data', new.data
      ),
      '{"Content-Type": "application/json"}'::jsonb;
  exception when others then
    raise warning 'Form webhook failed: %', sqlerrm;
  end;
  return new;
end;
$$;

create trigger form_submissions_webhook
  after insert on public.form_submissions
  for each row execute function public.deliver_form_webhook();

-- ---------------------------------------------------------------------------
-- Plan limits. Keep in step with PLAN_LIMITS in src/types/auth.ts.
-- ---------------------------------------------------------------------------

create function public.plan_max_projects(plan text)
returns integer
language sql immutable set search_path = ''
as $$
  select case plan
    when 'free' then 3 when 'starter' then 15 when 'pro' then 100
    when 'agency' then 500 else 99999
  end;
$$;

create function public.plan_max_members(plan text)
returns integer
language sql immutable set search_path = ''
as $$
  select case plan
    when 'free' then 1 when 'starter' then 3 when 'pro' then 10
    when 'agency' then 30 else 999
  end;
$$;

create function public.enforce_project_limit()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  org_plan text;
begin
  -- Locks the workspace, so parallel inserts can't all pass the count below.
  select plan into org_plan from public.organizations where id = new.organization_id for update;
  if (select count(*) from public.projects p where p.organization_id = new.organization_id)
    >= public.plan_max_projects(org_plan) then
    raise exception 'Your plan''s project limit has been reached' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger projects_enforce_limit
  before insert on public.projects
  for each row execute function public.enforce_project_limit();

-- ---------------------------------------------------------------------------
-- Invitations
-- ---------------------------------------------------------------------------

create function public.invitation_token_hash(token text)
returns text
language sql immutable set search_path = ''
as $$
  select encode(sha256(convert_to(token, 'UTF8')), 'hex');
$$;

-- Returns the secret token once. The app builds the invite link from it.
create function public.create_invitation(p_org uuid, p_email text, p_role text)
returns text
language plpgsql security definer set search_path = ''
as $$
declare
  org_plan text;
  taken integer;
  token text := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
  clean_email text := lower(btrim(p_email));
begin
  if not public.has_org_role(p_org, array['owner', 'admin']) then
    raise exception 'Not allowed to invite to this workspace' using errcode = '42501';
  end if;
  if p_role = 'owner' and not public.has_org_role(p_org, array['owner']) then
    raise exception 'Only owners can invite an owner' using errcode = '42501';
  end if;
  if clean_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'Enter a valid email address' using errcode = 'P0001';
  end if;

  select plan into org_plan from public.organizations where id = p_org for update;
  select
    (select count(*) from public.organization_members m where m.organization_id = p_org)
    + (select count(*) from public.invitations i
       where i.organization_id = p_org and i.accepted_at is null and i.expires_at > now())
  into taken;
  if taken >= public.plan_max_members(org_plan) then
    raise exception 'Your plan''s team member limit has been reached' using errcode = 'P0001';
  end if;

  insert into public.invitations (organization_id, email, role, token_hash, invited_by)
  values (p_org, clean_email, p_role, public.invitation_token_hash(token), auth.uid());
  return token;
end;
$$;

-- Requires the logged-in email to match, so a forwarded link is useless to others.
create function public.accept_invitation(p_token text)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  invite public.invitations;
  my_email text;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;

  select * into invite from public.invitations
  where token_hash = public.invitation_token_hash(p_token)
  for update;

  select lower(email) into my_email from public.user_profiles where id = auth.uid();
  if not found or invite.id is null or invite.accepted_at is not null or invite.expires_at <= now()
    or invite.email <> my_email then
    raise exception 'This invitation is invalid or has expired' using errcode = 'P0001';
  end if;

  insert into public.organization_members (organization_id, user_id, role)
  values (invite.organization_id, auth.uid(), invite.role)
  on conflict (organization_id, user_id) do nothing;

  update public.invitations set accepted_at = now() where id = invite.id;
  return invite.organization_id;
end;
$$;

revoke execute on all functions in schema public from public, anon, authenticated;

grant execute on function public.has_org_role(uuid, text[]) to authenticated;
grant execute on function public.is_org_member(uuid) to authenticated;
grant execute on function public.shares_org_with(uuid) to authenticated;
grant execute on function public.storage_path_org(text) to authenticated;
grant execute on function public.create_organization(text) to authenticated;
grant execute on function public.create_project_with_documents(
  uuid, text, text, text, jsonb, jsonb, jsonb, text, integer, jsonb
) to authenticated;
grant execute on function public.publish_project(uuid, text, text) to authenticated;
grant execute on function public.unpublish_project(uuid) to authenticated;
grant execute on function public.restore_project_version(uuid) to authenticated;
grant execute on function public.analytics_summary(uuid, integer) to authenticated;
grant execute on function public.create_invitation(uuid, text, text) to authenticated;
grant execute on function public.accept_invitation(text) to authenticated;

grant execute on function public.get_published_site(text) to anon, authenticated;
grant execute on function public.get_published_experience(uuid) to anon, authenticated;
grant execute on function public.submit_form(uuid, jsonb, text) to anon, authenticated;
grant execute on function public.track_events(uuid, jsonb) to anon, authenticated;


-- ========================================
-- Migration: 20261105000000_library.sql
-- ========================================

-- The team library: templates and sections a workspace saves for reuse.

create table public.workspace_library (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  kind text not null check (kind in ('template', 'section')),
  name text not null check (char_length(name) between 1 and 120),
  category text not null default '' check (char_length(category) <= 60),
  description text not null default '' check (char_length(description) <= 500),
  definition jsonb not null check (pg_column_size(definition) < 5000000),
  created_by uuid default auth.uid() references public.user_profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index workspace_library_org_idx on public.workspace_library (organization_id, kind, created_at desc);

create trigger workspace_library_touch before update on public.workspace_library
  for each row execute function public.touch_updated_at();

revoke all on public.workspace_library from anon, authenticated;
revoke execute on function public.touch_updated_at() from public, anon, authenticated;

alter table public.workspace_library enable row level security;

grant select, delete on public.workspace_library to authenticated;
-- created_by defaults to auth.uid() and can't be set by clients.
grant insert (organization_id, kind, name, category, description, definition) on public.workspace_library to authenticated;
grant update (name, category, description, definition) on public.workspace_library to authenticated;

create policy workspace_library_select on public.workspace_library for select to authenticated
  using (public.is_org_member(organization_id));
create policy workspace_library_insert on public.workspace_library for insert to authenticated
  with check (public.has_org_role(organization_id, array['owner', 'admin', 'editor']));
create policy workspace_library_update on public.workspace_library for update to authenticated
  using (public.has_org_role(organization_id, array['owner', 'admin', 'editor']))
  with check (public.has_org_role(organization_id, array['owner', 'admin', 'editor']));
create policy workspace_library_delete on public.workspace_library for delete to authenticated
  using (public.has_org_role(organization_id, array['owner', 'admin', 'editor']));


-- ========================================
-- Migration: 20261105000100_private_settings.sql
-- ========================================

-- The address someone builds their tour on, and the editor's list of variables, are for
-- the team only. Anyone can read a published snapshot, so they stay out of it.

create or replace function public.public_snapshot(version_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select v.snapshot
    #- '{project,settings,webhookUrl}'
    #- '{project,settings,builderUrl}'
    #- '{project,settings,variableDefs}'
  from public.project_versions v
  where v.id = version_id;
$$;

revoke execute on function public.public_snapshot(uuid) from public, anon, authenticated;


-- ========================================
-- Migration: 20261106000000_platform.sql
-- ========================================

-- Everything that runs the platform itself: profiles, plans and quotas, super admins,
-- nudges and customer support.

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------

alter table public.user_profiles
  add column timezone text check (timezone is null or char_length(timezone) <= 64),
  add column job_title text check (job_title is null or char_length(job_title) <= 120),
  add column last_active_at timestamptz;

grant update (timezone, job_title) on public.user_profiles to authenticated;

-- Written here rather than by clients, so nobody can claim to have been active.
create function public.touch_last_active()
returns void
language sql security definer set search_path = ''
as $$
  update public.user_profiles set last_active_at = now()
  where id = auth.uid() and (last_active_at is null or last_active_at < now() - interval '5 minutes');
$$;

-- ---------------------------------------------------------------------------
-- Super admins. There's no way to become one from the app: add a row with SQL.
-- ---------------------------------------------------------------------------

create table public.platform_admins (
  user_id uuid primary key references public.user_profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);
revoke all on public.platform_admins from anon, authenticated;
alter table public.platform_admins enable row level security;

create function public.is_platform_admin()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.platform_admins a where a.user_id = auth.uid());
$$;

create function public.require_platform_admin()
returns void
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not exists (select 1 from public.platform_admins a where a.user_id = auth.uid()) then
    raise exception 'Only a super admin can do this' using errcode = '42501';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Plans and quotas. Defaults match PLAN_LIMITS in src/types/auth.ts.
-- ---------------------------------------------------------------------------

create table public.plan_settings (
  plan text primary key check (plan in ('free', 'starter', 'pro', 'agency', 'enterprise')),
  label text not null check (char_length(label) between 1 and 60),
  price_text text not null default '' check (char_length(price_text) <= 60),
  description text not null default '' check (char_length(description) <= 300),
  max_projects integer not null check (max_projects >= 0),
  max_members integer not null check (max_members >= 1),
  position integer not null default 0,
  updated_at timestamptz not null default now()
);

insert into public.plan_settings (plan, label, price_text, description, max_projects, max_members, position) values
  ('free', 'Free', 'Free', 'For trying things out.', 3, 1, 0),
  ('starter', 'Starter', 'Ask us', 'For one business, getting started.', 15, 3, 1),
  ('pro', 'Pro', 'Ask us', 'For growing teams.', 100, 10, 2),
  ('agency', 'Agency', 'Ask us', 'For agencies with many clients.', 500, 30, 3),
  ('enterprise', 'Enterprise', 'Ask us', 'For large organizations.', 99999, 999, 4);

-- No row means this module only counts toward the plan's overall limit.
create table public.plan_module_quotas (
  plan text not null references public.plan_settings (plan) on delete cascade,
  module text not null check (module in ('website', 'page', 'tour', 'form', 'demo', 'banner', 'menu', 'faq')),
  max_projects integer not null check (max_projects >= 0),
  primary key (plan, module)
);

revoke all on public.plan_settings, public.plan_module_quotas from anon, authenticated;
grant select on public.plan_settings, public.plan_module_quotas to authenticated;
alter table public.plan_settings enable row level security;
alter table public.plan_module_quotas enable row level security;
create policy plan_settings_select on public.plan_settings for select to authenticated using (true);
create policy plan_module_quotas_select on public.plan_module_quotas for select to authenticated using (true);

create or replace function public.plan_max_projects(plan text)
returns integer
language sql stable security definer set search_path = ''
as $$
  select coalesce((select s.max_projects from public.plan_settings s where s.plan = plan_max_projects.plan), 99999);
$$;

create or replace function public.plan_max_members(plan text)
returns integer
language sql stable security definer set search_path = ''
as $$
  select coalesce((select s.max_members from public.plan_settings s where s.plan = plan_max_members.plan), 999);
$$;

create or replace function public.enforce_project_limit()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  org_plan text;
  quota integer;
begin
  -- Locks the workspace, so parallel inserts can't all pass the counts below.
  select plan into org_plan from public.organizations where id = new.organization_id for update;
  if (select count(*) from public.projects p where p.organization_id = new.organization_id)
    >= public.plan_max_projects(org_plan) then
    raise exception 'Your plan''s project limit has been reached' using errcode = 'P0001';
  end if;
  select q.max_projects into quota from public.plan_module_quotas q where q.plan = org_plan and q.module = new.type;
  if quota is not null
    and (select count(*) from public.projects p where p.organization_id = new.organization_id and p.type = new.type) >= quota then
    raise exception 'Your plan allows % of this kind of project. Upgrade your plan to add more.', quota using errcode = 'P0001';
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Asking for a different plan. There's no online payment, so a super admin decides.
-- ---------------------------------------------------------------------------

create table public.plan_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  plan text not null references public.plan_settings (plan),
  note text not null default '' check (char_length(note) <= 1000),
  status text not null default 'pending' check (status in ('pending', 'approved', 'declined')),
  requested_by uuid default auth.uid() references public.user_profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create unique index plan_requests_one_pending on public.plan_requests (organization_id) where status = 'pending';

revoke all on public.plan_requests from anon, authenticated;
grant select on public.plan_requests to authenticated;
grant insert (organization_id, plan, note) on public.plan_requests to authenticated;
alter table public.plan_requests enable row level security;
create policy plan_requests_select on public.plan_requests for select to authenticated
  using (public.is_org_member(organization_id));
create policy plan_requests_insert on public.plan_requests for insert to authenticated
  with check (public.has_org_role(organization_id, array['owner']));

-- ---------------------------------------------------------------------------
-- Nudges: messages from a super admin to a user.
-- ---------------------------------------------------------------------------

create table public.user_nudges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  body text not null default '' check (char_length(body) <= 1000),
  -- Shown as a link, so only addresses in this app or on https.
  link_url text check (link_url is null or link_url ~ '^(/[^/]|https://)'),
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index user_nudges_user_idx on public.user_nudges (user_id, created_at desc);

revoke all on public.user_nudges from anon, authenticated;
grant select on public.user_nudges to authenticated;
grant update (read_at) on public.user_nudges to authenticated;
alter table public.user_nudges enable row level security;
create policy user_nudges_select on public.user_nudges for select to authenticated using (user_id = auth.uid());
create policy user_nudges_update on public.user_nudges for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Customer support
-- ---------------------------------------------------------------------------

create table public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.user_profiles (id) on delete cascade,
  organization_id uuid references public.organizations (id) on delete set null,
  subject text not null check (char_length(subject) between 1 and 200),
  status text not null default 'open' check (status in ('open', 'answered', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index support_tickets_user_idx on public.support_tickets (user_id, updated_at desc);

create table public.support_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets (id) on delete cascade,
  author_id uuid default auth.uid() references public.user_profiles (id) on delete set null,
  -- Set only by admin_reply_ticket, so nobody can pose as staff.
  is_staff boolean not null default false,
  body text not null check (char_length(body) between 1 and 5000),
  created_at timestamptz not null default now()
);
create index support_messages_ticket_idx on public.support_messages (ticket_id, created_at);

revoke all on public.support_tickets, public.support_messages from anon, authenticated;
grant select on public.support_tickets, public.support_messages to authenticated;
grant insert (organization_id, subject) on public.support_tickets to authenticated;
grant insert (ticket_id, body) on public.support_messages to authenticated;
alter table public.support_tickets enable row level security;
alter table public.support_messages enable row level security;

create policy support_tickets_select on public.support_tickets for select to authenticated using (user_id = auth.uid());
create policy support_tickets_insert on public.support_tickets for insert to authenticated
  with check (user_id = auth.uid() and (organization_id is null or public.is_org_member(organization_id)));

create policy support_messages_select on public.support_messages for select to authenticated
  using (exists (select 1 from public.support_tickets t where t.id = ticket_id and t.user_id = auth.uid()));
create policy support_messages_insert on public.support_messages for insert to authenticated
  with check (exists (select 1 from public.support_tickets t where t.id = ticket_id and t.user_id = auth.uid() and t.status <> 'closed'));

create function public.support_message_touch_ticket()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  update public.support_tickets
    set updated_at = now(), status = case when new.is_staff then 'answered' else 'open' end
    where id = new.ticket_id;
  return new;
end;
$$;

create trigger support_messages_touch_ticket
  after insert on public.support_messages
  for each row execute function public.support_message_touch_ticket();

-- ---------------------------------------------------------------------------
-- What a super admin can do. Every function checks for itself.
-- ---------------------------------------------------------------------------

create function public.admin_overview()
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
begin
  perform public.require_platform_admin();
  return jsonb_build_object(
    'users', (select count(*) from public.user_profiles),
    'workspaces', (select count(*) from public.organizations),
    'projects', (select count(*) from public.projects),
    'published', (select count(*) from public.projects where status = 'published'),
    'openTickets', (select count(*) from public.support_tickets where status = 'open'),
    'pendingRequests', (select count(*) from public.plan_requests where status = 'pending'),
    'byModule', coalesce((select jsonb_object_agg(type, total) from (select type, count(*) as total from public.projects group by type) m), '{}'::jsonb),
    'byPlan', coalesce((select jsonb_object_agg(plan, total) from (select plan, count(*) as total from public.organizations group by plan) m), '{}'::jsonb)
  );
end;
$$;

create function public.admin_list_users()
returns table (
  user_id uuid, email text, full_name text, created_at timestamptz, last_active_at timestamptz,
  workspace_id uuid, workspace_name text, plan text, project_count bigint
)
language plpgsql stable security definer set search_path = ''
as $$
begin
  perform public.require_platform_admin();
  return query
    select u.id, u.email::text, u.full_name::text, u.created_at, u.last_active_at, o.id, o.name::text, o.plan::text,
      (select count(*) from public.projects p where p.organization_id = o.id)
    from public.user_profiles u
    left join lateral (
      select org.id, org.name, org.plan from public.organization_members m
      join public.organizations org on org.id = m.organization_id
      where m.user_id = u.id
      order by (m.role = 'owner') desc, m.created_at
      limit 1
    ) o on true
    order by u.created_at desc;
end;
$$;

create function public.admin_set_workspace_plan(p_org uuid, p_plan text)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  perform public.require_platform_admin();
  if not exists (select 1 from public.plan_settings s where s.plan = p_plan) then
    raise exception 'Unknown plan';
  end if;
  update public.organizations set plan = p_plan where id = p_org;
end;
$$;

create function public.admin_update_plan(p_plan text, p_label text, p_price text, p_description text, p_max_projects integer, p_max_members integer)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  perform public.require_platform_admin();
  update public.plan_settings
    set label = p_label, price_text = p_price, description = p_description, max_projects = p_max_projects, max_members = p_max_members, updated_at = now()
    where plan = p_plan;
end;
$$;

-- A null quota removes the limit for that module.
create function public.admin_set_module_quota(p_plan text, p_module text, p_max integer)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  perform public.require_platform_admin();
  if p_max is null then
    delete from public.plan_module_quotas where plan = p_plan and module = p_module;
  else
    insert into public.plan_module_quotas (plan, module, max_projects) values (p_plan, p_module, p_max)
      on conflict (plan, module) do update set max_projects = excluded.max_projects;
  end if;
end;
$$;

-- A null user means everyone. Returns how many people it reached.
create function public.admin_send_nudge(p_user uuid, p_title text, p_body text, p_link text)
returns integer
language plpgsql security definer set search_path = ''
as $$
declare
  sent integer;
begin
  perform public.require_platform_admin();
  insert into public.user_nudges (user_id, title, body, link_url)
    select u.id, p_title, coalesce(p_body, ''), nullif(p_link, '')
    from public.user_profiles u
    where p_user is null or u.id = p_user;
  get diagnostics sent = row_count;
  return sent;
end;
$$;

create function public.admin_list_plan_requests()
returns table (id uuid, organization_id uuid, workspace_name text, plan text, current_plan text, note text, status text, created_at timestamptz, requested_by_email text)
language plpgsql stable security definer set search_path = ''
as $$
begin
  perform public.require_platform_admin();
  return query
    select r.id, r.organization_id, o.name::text, r.plan, o.plan::text, r.note, r.status, r.created_at, u.email::text
    from public.plan_requests r
    join public.organizations o on o.id = r.organization_id
    left join public.user_profiles u on u.id = r.requested_by
    order by (r.status = 'pending') desc, r.created_at desc;
end;
$$;

create function public.admin_resolve_plan_request(p_request uuid, p_approve boolean)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  request public.plan_requests;
begin
  perform public.require_platform_admin();
  select * into request from public.plan_requests r where r.id = p_request and r.status = 'pending' for update;
  if not found then
    raise exception 'This request has already been handled';
  end if;
  update public.plan_requests set status = case when p_approve then 'approved' else 'declined' end where id = p_request;
  if p_approve then
    update public.organizations set plan = request.plan where id = request.organization_id;
  end if;
end;
$$;

create function public.admin_list_tickets()
returns table (id uuid, subject text, status text, created_at timestamptz, updated_at timestamptz, user_email text, user_name text, workspace_name text)
language plpgsql stable security definer set search_path = ''
as $$
begin
  perform public.require_platform_admin();
  return query
    select t.id, t.subject, t.status, t.created_at, t.updated_at, u.email::text, u.full_name::text, o.name::text
    from public.support_tickets t
    join public.user_profiles u on u.id = t.user_id
    left join public.organizations o on o.id = t.organization_id
    order by (t.status = 'open') desc, t.updated_at desc;
end;
$$;

create function public.admin_ticket_messages(p_ticket uuid)
returns table (id uuid, is_staff boolean, body text, created_at timestamptz)
language plpgsql stable security definer set search_path = ''
as $$
begin
  perform public.require_platform_admin();
  return query
    select m.id, m.is_staff, m.body, m.created_at from public.support_messages m where m.ticket_id = p_ticket order by m.created_at;
end;
$$;

create function public.admin_reply_ticket(p_ticket uuid, p_body text)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  perform public.require_platform_admin();
  insert into public.support_messages (ticket_id, author_id, is_staff, body) values (p_ticket, auth.uid(), true, p_body);
end;
$$;

create function public.admin_set_ticket_status(p_ticket uuid, p_status text)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  perform public.require_platform_admin();
  update public.support_tickets set status = p_status, updated_at = now() where id = p_ticket;
end;
$$;

revoke execute on function public.touch_last_active() from public, anon, authenticated;
revoke execute on function public.is_platform_admin() from public, anon, authenticated;
revoke execute on function public.require_platform_admin() from public, anon, authenticated;
revoke execute on function public.plan_max_projects(text) from public, anon, authenticated;
revoke execute on function public.plan_max_members(text) from public, anon, authenticated;
revoke execute on function public.enforce_project_limit() from public, anon, authenticated;
revoke execute on function public.support_message_touch_ticket() from public, anon, authenticated;
revoke execute on function public.admin_overview() from public, anon, authenticated;
revoke execute on function public.admin_list_users() from public, anon, authenticated;
revoke execute on function public.admin_set_workspace_plan(uuid, text) from public, anon, authenticated;
revoke execute on function public.admin_update_plan(text, text, text, text, integer, integer) from public, anon, authenticated;
revoke execute on function public.admin_set_module_quota(text, text, integer) from public, anon, authenticated;
revoke execute on function public.admin_send_nudge(uuid, text, text, text) from public, anon, authenticated;
revoke execute on function public.admin_list_plan_requests() from public, anon, authenticated;
revoke execute on function public.admin_resolve_plan_request(uuid, boolean) from public, anon, authenticated;
revoke execute on function public.admin_list_tickets() from public, anon, authenticated;
revoke execute on function public.admin_ticket_messages(uuid) from public, anon, authenticated;
revoke execute on function public.admin_reply_ticket(uuid, text) from public, anon, authenticated;
revoke execute on function public.admin_set_ticket_status(uuid, text) from public, anon, authenticated;

grant execute on function public.touch_last_active() to authenticated;
grant execute on function public.is_platform_admin() to authenticated;
grant execute on function public.admin_overview() to authenticated;
grant execute on function public.admin_list_users() to authenticated;
grant execute on function public.admin_set_workspace_plan(uuid, text) to authenticated;
grant execute on function public.admin_update_plan(text, text, text, text, integer, integer) to authenticated;
grant execute on function public.admin_set_module_quota(text, text, integer) to authenticated;
grant execute on function public.admin_send_nudge(uuid, text, text, text) to authenticated;
grant execute on function public.admin_list_plan_requests() to authenticated;
grant execute on function public.admin_resolve_plan_request(uuid, boolean) to authenticated;
grant execute on function public.admin_list_tickets() to authenticated;
grant execute on function public.admin_ticket_messages(uuid) to authenticated;
grant execute on function public.admin_reply_ticket(uuid, text) to authenticated;
grant execute on function public.admin_set_ticket_status(uuid, text) to authenticated;


-- ========================================
-- Migration: 20261107000000_domains.sql
-- ========================================

-- Customer domains for published websites and pages.
--
-- Anyone in a workspace can see its domains, and editors add and remove them. Whether a
-- domain is connected is decided only by the server: the `domains` Edge Function checks the
-- DNS proof record and adds the domain to the hosting, using the service role.

create table public.project_domains (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  domain text not null unique check (
    char_length(domain) <= 253
    and domain = lower(domain)
    and domain ~ '^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$'
  ),
  -- Shown to the customer to put in a TXT record, which proves they control the domain.
  verification_token text not null default replace(gen_random_uuid()::text, '-', ''),
  status text not null default 'pending' check (status in ('pending', 'active', 'failed')),
  last_error text check (last_error is null or char_length(last_error) <= 500),
  last_checked_at timestamptz,
  created_at timestamptz not null default now()
);
create index project_domains_project_idx on public.project_domains (project_id);

revoke all on public.project_domains from anon, authenticated;
grant select on public.project_domains to authenticated;
grant insert (project_id, organization_id, domain) on public.project_domains to authenticated;
grant delete on public.project_domains to authenticated;
alter table public.project_domains enable row level security;

create policy project_domains_select on public.project_domains for select to authenticated
  using (public.is_org_member(organization_id));

-- Only sites have their own pages to show, and a project gets at most three domains.
create policy project_domains_insert on public.project_domains for insert to authenticated
  with check (
    public.has_org_role(organization_id, array['owner', 'admin', 'editor'])
    and exists (
      select 1 from public.projects p
      where p.id = project_id and p.organization_id = project_domains.organization_id and p.type in ('website', 'page')
    )
    and (select count(*) from public.project_domains d where d.project_id = project_domains.project_id) < 3
  );

create policy project_domains_delete on public.project_domains for delete to authenticated
  using (public.has_org_role(organization_id, array['owner', 'admin', 'editor']));

-- What a visitor sees at a connected domain: the same snapshot as /s/slug.
create function public.get_published_site_by_domain(p_domain text)
returns jsonb
language sql stable security definer set search_path = ''
as $$
  select public.public_snapshot(p.published_version_id)
  from public.project_domains d
  join public.projects p on p.id = d.project_id
  where d.domain = lower(p_domain) and d.status = 'active' and p.status = 'published';
$$;

revoke execute on function public.get_published_site_by_domain(text) from public, anon, authenticated;
grant execute on function public.get_published_site_by_domain(text) to anon, authenticated;


-- ========================================
-- Super Admin: Link dmchaturvedi@gmail.com
-- ========================================
do $$
declare
  admin_uid uuid;
begin
  select id into admin_uid from auth.users where email = 'dmchaturvedi@gmail.com';
  if admin_uid is not null then
    insert into public.platform_admins (user_id)
    values (admin_uid)
    on conflict (user_id) do nothing;
  end if;
end;
$$;


-- ========================================
-- Storage Bucket: assets
-- ========================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'assets',
  'assets',
  true,
  52428800,
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml', 'video/mp4', 'video/webm']
)
on conflict (id) do update set public = true;

alter table storage.objects enable row level security;

drop policy if exists "Assets are publicly viewable" on storage.objects;
create policy "Assets are publicly viewable" on storage.objects for select using (bucket_id = 'assets');

drop policy if exists "Authenticated users can upload assets" on storage.objects;
create policy "Authenticated users can upload assets" on storage.objects for insert to authenticated with check (bucket_id = 'assets');

drop policy if exists "Authenticated users can delete assets" on storage.objects;
create policy "Authenticated users can delete assets" on storage.objects for delete to authenticated using (bucket_id = 'assets');

-- Ensure PostgREST cache has latest public functions
grant execute on function public.public_snapshot(uuid) to anon, authenticated;
grant execute on function public.get_published_site(text) to anon, authenticated;
grant execute on function public.get_published_experience(uuid) to anon, authenticated;
grant execute on function public.get_published_site_by_domain(text) to anon, authenticated;
notify pgrst, 'reload schema';

