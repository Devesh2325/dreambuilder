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
