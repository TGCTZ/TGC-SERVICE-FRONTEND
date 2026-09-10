/**
 * Central application configuration.
 *
 * Single source of truth for app-wide branding and metadata. Change the values
 * here rather than hunting through individual components.
 *
 * These values are injected into the static `index.html` <title>/meta at build
 * time via a Vite `transformIndexHtml` hook (see `vite.config.ts`), which
 * replaces the `%APP_NAME%`, `%APP_DESCRIPTION%` and `%APP_URL%` tokens. Remember to also
 * update the favicons in `public/images/` per project.
 */
export const appConfig = {
  /** Display name shown in the sidebar header, etc. */
  name: 'Tanzania Gemmological Centre',

  /** Short tagline / description used in metadata. */
  description:
    'Stone certification for the Tanzania Gemmological Centre: reception, billing, identification and certificates.',

  /** Public URL of the deployed app (used for links and metadata). */
  url: 'http://localhost:5173',
} as const

/** Shape of {@link appConfig}. Literal types, so values are readonly. */
export type AppConfig = typeof appConfig
