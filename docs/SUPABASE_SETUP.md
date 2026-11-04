# Supabase setup

The new app (at `/v2`) needs a Supabase project. Use a separate project for testing.

## 1. Create the project

Create a project at [supabase.com](https://supabase.com). Keep the database password somewhere safe.

## 2. Apply the database migrations

In the Supabase dashboard, open **SQL Editor**. For each file in `supabase/migrations/`, oldest first, paste its contents and click **Run**.

The migrations are written for a new, empty project.

## 3. Configure authentication

Under **Authentication > URL Configuration**:

- **Site URL:** `http://localhost:5173` while developing.
- **Redirect URLs:** add `http://localhost:5173/v2/reset-password`.

Password reset links won't work without the redirect URL. Add your production address to both settings when you deploy.

**Authentication > Providers > Email** controls "Confirm email". Leave it on in production. Supabase's built-in email service is heavily rate limited, so set up custom SMTP before launch.

## 4. Connect the app

Copy `.env.example` to `.env`, then fill in the values from **Project Settings > API**:

```
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-key"
```

Restart `npm run dev`, then open `http://localhost:5173/v2`.

Never put the service role key in `.env`, because every `VITE_` variable is sent to browsers.

## 5. Check that it works

1. Open `/v2/signup` and create an account.
2. If "Confirm email" is on, open the link in the email.
3. You should land on the home page showing your workspace, with the role `owner` on the `free` plan.
4. In **Table Editor**, confirm that `user_profiles`, `organizations` and `organization_members` each have a new row.

If signup fails with "Database error saving new user", the `on_auth_user_created` trigger failed. Check that the migrations ran, and see **Logs > Postgres**.

## Testing database security

`npm test` runs the migrations and security tests on PGlite, a real Postgres that runs in-process, so no Supabase project or Docker is needed. `src/test/db/harness.ts` stubs the parts Supabase provides (`auth`, `storage`, default grants), which means a live project should still get the manual check above.
