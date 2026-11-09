import { defineConfig, loadEnv } from 'vite';
import { fileURLToPath } from 'url';
import path from 'path';

const root = path.dirname(fileURLToPath(import.meta.url));

// Builds the script customers add to their sites: one file, using Preact in place of
// React to stay small. Goes to public/ in dev mode and dist/ for production.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, root, 'VITE_');
  return {
    publicDir: false,
    define: {
      'process.env.NODE_ENV': JSON.stringify('production'),
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL || 'https://okyondzibjofbsafrzbm.supabase.co'),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9reW9uZHppYmpvZmJzYWZyemJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQyMDYzMjEsImV4cCI6MjEwOTc4MjMyMX0.1xYue63GdKabwvcWzQunbbM9FVSMsSDOLUX2ho4F6hs'),
    },
    resolve: {
      alias: [
        { find: 'react/jsx-runtime', replacement: 'preact/jsx-runtime' },
        { find: 'react/jsx-dev-runtime', replacement: 'preact/jsx-runtime' },
        { find: 'react-dom/client', replacement: 'preact/compat/client' },
        { find: 'react-dom', replacement: 'preact/compat' },
        { find: 'react', replacement: 'preact/compat' },
      ],
    },
    build: {
      outDir: mode === 'public' ? 'public' : 'dist', // E2E tests override this with --outDir.
      emptyOutDir: false,
      sourcemap: false,
      lib: {
        entry: path.join(root, 'src/embed/flowpilot.tsx'),
        name: 'FlowPilotEmbed',
        formats: ['iife'],
        fileName: () => 'flowpilot.js',
      },
    },
  };
});
