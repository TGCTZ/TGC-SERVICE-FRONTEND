/// <reference types="vitest/config" />
import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import { playwright } from '@vitest/browser-playwright'
import { appConfig } from './src/config/app-config'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  /**
   * Tests get their own dependency cache.
   *
   * Vite's default cache is `node_modules/.vite`, which a running dev server
   * holds open - on Windows that makes a test run fail outright with EPERM
   * while the app is up. Separating them lets `pnpm test` and `pnpm dev` run
   * side by side, which is how they are actually used.
   */
  cacheDir: mode === 'test' ? 'node_modules/.vite-test' : 'node_modules/.vite',
  plugins: [
    // Inject branding from src/config/app-config.ts into index.html so the
    // static <title>/meta stay a single source of truth with the app.
    {
      name: 'html-app-config',
      transformIndexHtml(html) {
        return html
          .replaceAll('%APP_NAME%', appConfig.name)
          .replaceAll('%APP_DESCRIPTION%', appConfig.description)
          .replaceAll('%APP_URL%', appConfig.url)
      },
    },
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
    }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    silent: 'passed-only',
    unstubEnvs: true,
    browser: {
      enabled: true,
      provider: playwright(),
      instances: [{ browser: 'chromium' }],
    },
    coverage: {
      // include: ['src/**/*.{js,jsx,ts,tsx}'], // Uncomment to expand the report to all src/**/* so untested modules appear as 0% coverage.
      exclude: [
        'src/components/ui/**',
        'src/assets/**',
        'src/tanstack-table.d.ts',
        'src/routeTree.gen.ts',
        'src/test-utils/**',
        'src/routes/**',
      ],
    },
  },
}))
