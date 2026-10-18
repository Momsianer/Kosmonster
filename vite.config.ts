import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';

/**
 * GitHub Pages liegt unter /Kosmonster/. Für Tauri (TAURI_ENV_PLATFORM wird von der
 * Tauri CLI gesetzt) und itch.io (KOSMONSTER_RELATIVE) braucht es relative Pfade.
 */
const env = (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env ?? {};
const relative = Boolean(env.TAURI_ENV_PLATFORM || env.KOSMONSTER_RELATIVE);

export default defineConfig({
  base: relative ? './' : '/Kosmonster/',
  plugins: [svelte()],
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
