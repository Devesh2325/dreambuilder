# Supabase setup

Without Supabase, `npm run dev` runs in demo mode, saving everything in your browser. To go live, connect a Supabase project. Use a separate project for testing.

## 1. Create the project

Create a project at [supabase.com](https://supabase.com). Keep the database password somewhere safe.

## 2. Apply the database migrations

In the Supabase dashboard, open **SQL Editor**. For each file in `supabase/migrations/`, oldest first, paste its contents and click **Run**.

The migrations are written for a new, empty project.

## 3. Turn on form webhooks (optional)

Under **Database > Extensions**, enable `pg_net`. Without it, form responses are still saved, but aren't sent to webhooks.

## 4. Configure authentication

Under **Authentication > URL Configuration**:

- **Site URL:** `http://localhost:5173` while developing.
- **Redirect URLs:** add `http://localhost:5173/reset-password`.

Password reset links won't work without the redirect URL. Add your production address to both settings when you deploy.

**Authentication > Providers > Email** controls "Confirm email". Leave it on in production. Supabase's built-in email service is heavily rate limited, so set up custom SMTP before launch.

## 5. Connect the app

Copy `.env.example` to `.env`, then fill in the values from **Project Settings > API**:

```
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-key"
```

Restart `npm run dev`, then open `http://localhost:5173`.

Never put the service role key in `.env`, because every `VITE_` variable is sent to browsers.

## 6. Check that it works

1. Open `/signup` and create an account.
2. If "Confirm email" is on, open the link in the email.
3. You should land on **All projects**. In **Table Editor**, confirm that `user_profiles`, `organizations` and `organization_members` each have a new row.
4. Create a project from a template and publish it. Open its web address in a private window.
5. Upload an image under **Assets**, and confirm it displays.
6. Publish a form, submit it from the private window, and confirm the response appears on the project page.

If signup fails with "Database error saving new user", the `on_auth_user_created` trigger failed. Check that the migrations ran, and see **Logs > Postgres**.

## Changing a workspace's plan

There's no online checkout. New workspaces are on the free plan, limited to 3 projects and 1 member. To change a plan, run this in the SQL Editor:

```sql
update public.organizations set plan = 'pro' where slug = 'your-workspace-slug';
```

## Testing database security

`npm test` runs the migrations and security tests on PGlite, a real Postgres that runs in-process, so no Supabase project or Docker is needed. `src/test/db/harness.ts` stubs the parts Supabase provides (`auth`, `storage`, default grants), which means a live project should still get the manual check above.

## Deploying

The repo includes `vercel.json`. In Vercel, import the GitHub repo and add the two `VITE_` variables under **Environment Variables**. Other static hosts work too, as long as they:

- run `npm run build` and serve `dist/`
- send all unknown paths to `index.html`, except `flowpilot.js` and `assets/`

The embed script reads these variables at build time, so rebuild after changing them.
