/**
 * Central application configuration.
 *
 * Single source of truth for app-wide branding and metadata. When starting a
 * new project from this template, change the values here instead of hunting
 * through individual components.
 *
 * These values are injected into the static `index.html` <title>/meta at build
 * time via a Vite `transformIndexHtml` hook (see `vite.config.ts`), which
 * replaces the `%APP_NAME%`, `%APP_DESCRIPTION%` and `%APP_URL%` tokens. Remember to also
 * update the favicons in `public/images/` per project.
 */
export const appConfig = {
  /** Display name shown in the sidebar header, etc. */
  name: 'AlphaDashboard',

  /** Short tagline / description used in metadata. */
  description: 'A reusable React admin dashboard template.',

  /** Public URL of the deployed app (used for links and metadata). */
  url: 'http://localhost:5173',
} as const

/** Shape of {@link appConfig}. Literal types, so values are readonly. */
export type AppConfig = typeof appConfig
