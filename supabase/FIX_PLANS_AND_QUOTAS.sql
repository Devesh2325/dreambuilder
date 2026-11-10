-- ===========================================================================
-- Fix: Create plan_settings and plan_module_quotas tables
-- ===========================================================================

create table if not exists public.plan_settings (
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
  ('enterprise', 'Enterprise', 'Ask us', 'For large organizations.', 99999, 999, 4)
on conflict (plan) do nothing;

create table if not exists public.plan_module_quotas (
  plan text not null references public.plan_settings (plan) on delete cascade,
  module text not null check (module in ('website', 'page', 'tour', 'form', 'demo', 'banner', 'menu', 'faq')),
  max_projects integer not null check (max_projects >= 0),
  primary key (plan, module)
);

revoke all on public.plan_settings, public.plan_module_quotas from anon, authenticated;
grant select on public.plan_settings, public.plan_module_quotas to authenticated;
alter table public.plan_settings enable row level security;
alter table public.plan_module_quotas enable row level security;

drop policy if exists plan_settings_select on public.plan_settings;
create policy plan_settings_select on public.plan_settings for select to authenticated using (true);

drop policy if exists plan_module_quotas_select on public.plan_module_quotas;
create policy plan_module_quotas_select on public.plan_module_quotas for select to authenticated using (true);

-- Reload Supabase PostgREST schema cache
notify pgrst, 'reload schema';

