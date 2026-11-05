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
