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
  /** Display name: the browser title, the sign-in page, the certificate PDF. */
  name: 'Tanzania Gemmological Centre',

  /**
   * Short wordmark for the sidebar, where the full name does not fit.
   *
   * Deliberately separate from `name` rather than replacing it — `name` is
   * injected into `index.html` via the `%APP_NAME%` token and is what the
   * customer sees on a certificate.
   */
  shortName: 'TGC-SERVICE',

  /** Short tagline / description used in metadata. */
  description:
    'Stone certification for the Tanzania Gemmological Centre: reception, billing, identification and certificates.',

  /** Public URL of the deployed app (used for links and metadata). */
  url: 'http://localhost:5173',
} as const

/** Shape of {@link appConfig}. Literal types, so values are readonly. */
export type AppConfig = typeof appConfig
