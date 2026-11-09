import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import pg from 'pg';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const { Client } = pg;

// We connect using direct or pooler connection
const rawUrl = 'postgres://postgres.okyondzibjofbsafrzbm:qvwqIlf644aDKWkW@aws-0-us-east-1.pooler.supabase.com:5432/postgres';

const client = new Client({
  connectionString: rawUrl,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function run() {
  console.log('Connecting to Supabase PostgreSQL...');
  await client.connect();
  console.log('Connected successfully!');

  const res = await client.query('SELECT current_database(), current_user, version()');
  console.log(`Connected to: ${res.rows[0].current_database} as user: ${res.rows[0].current_user}`);

  const migrationsDir = join(process.cwd(), 'supabase', 'migrations');
  const files = readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();

  console.log(`Found ${files.length} migration files in supabase/migrations/`);

  for (const file of files) {
    console.log(`\n========================================`);
    console.log(`Running migration: ${file}...`);
    const sql = readFileSync(join(migrationsDir, file), 'utf8');

    try {
      await client.query(sql);
      console.log(`✓ Migration ${file} applied successfully.`);
    } catch (err) {
      console.error(`✗ Error applying ${file}:`, err.message);
      if (err.message.includes('already exists')) {
        console.log(`Notice: Objects in ${file} already exist. Continuing...`);
      } else {
        throw err;
      }
    }
  }

  // Ensure super admin user (dmchaturvedi@gmail.com) is in platform_admins if auth user exists
  console.log('\nChecking platform_admins for dmchaturvedi@gmail.com...');
  try {
    const adminCheck = await client.query(`
      SELECT id FROM auth.users WHERE email = 'dmchaturvedi@gmail.com';
    `);
    if (adminCheck.rows.length > 0) {
      const userId = adminCheck.rows[0].id;
      await client.query(`
        INSERT INTO public.platform_admins (user_id)
        VALUES ($1)
        ON CONFLICT (user_id) DO NOTHING;
      `, [userId]);
      console.log(`✓ Super admin dmchaturvedi@gmail.com assigned platform_admin role!`);
    } else {
      console.log(`ℹ Note: auth.user 'dmchaturvedi@gmail.com' not created yet. After signing up, it will be mapped or can be added.`);
    }
  } catch (err) {
    console.log('Admin check notice:', err.message);
  }

  console.log('\nAll Supabase database migrations executed successfully!');
  await client.end();
}

run().catch(async (err) => {
  console.error('\nFatal migration error:', err);
  try { await client.end(); } catch {}
  process.exit(1);
});
