-- ==============================================================================
-- FlowPilot: Reset / Create Platform Super Admin Password
-- ==============================================================================
-- Target Super Admin Account: dmchaturvedi@gmail.com
-- New Password: Admin@FlowPilot2026!
--
-- Instructions:
-- 1. Open your Supabase Dashboard -> SQL Editor -> New Query
-- 2. Paste and run this script
-- 3. You can now log in at /system-console-gate-x92 with:
--    Email:    dmchaturvedi@gmail.com
--    Password: Admin@FlowPilot2026!
-- ==============================================================================

create extension if not exists pgcrypto;

do $$
declare
  admin_uid uuid;
  hashed_pwd text;
begin
  -- Generate bcrypt hash for 'Admin@FlowPilot2026!'
  hashed_pwd := crypt('Admin@FlowPilot2026!', gen_salt('bf', 10));

  -- Look up dmchaturvedi@gmail.com in auth.users
  select id into admin_uid from auth.users where lower(email) = 'dmchaturvedi@gmail.com';

  if admin_uid is null then
    -- Account doesn't exist yet, insert into auth.users
    admin_uid := gen_random_uuid();
    insert into auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) values (
      '00000000-0000-0000-0000-000000000000',
      admin_uid,
      'authenticated',
      'authenticated',
      'dmchaturvedi@gmail.com',
      hashed_pwd,
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Super Admin","workspace_name":"Platform Admin Workspace"}'::jsonb,
      now(),
      now()
    );

    -- Link identity
    insert into auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) values (
      gen_random_uuid(),
      admin_uid,
      json_build_object('sub', admin_uid::text, 'email', 'dmchaturvedi@gmail.com')::jsonb,
      'email',
      'dmchaturvedi@gmail.com',
      now(),
      now(),
      now()
    ) on conflict do nothing;
  else
    -- Update existing user password and ensure confirmed
    update auth.users
    set encrypted_password = hashed_pwd,
        email_confirmed_at = coalesce(email_confirmed_at, now()),
        updated_at = now()
    where id = admin_uid;
  end if;

  -- Ensure user profile exists
  insert into public.user_profiles (id, email, full_name, created_at)
  values (admin_uid, 'dmchaturvedi@gmail.com', 'Super Admin', now())
  on conflict (id) do update
  set full_name = 'Super Admin';

  -- Ensure linked to platform_admins
  insert into public.platform_admins (user_id, created_at)
  values (admin_uid, now())
  on conflict (user_id) do nothing;

end;
$$;
