/**
 * App-wide formatting.
 *
 * Every money, date and number in the UI goes through here. Without it each
 * call site falls back to the *viewer's* browser locale, so the same record
 * reads differently on two machines — `1,999.00` in Dar es Salaam and
 * `1.999,00` on a German laptop. Pinning the locale makes the app's output a
 * property of the app, not of whoever opened it.
 *
 * Swap point: change the three constants below to relocate the app.
 */

const APP_LOCALE = 'en-TZ'
const APP_TIMEZONE = 'Africa/Dar_es_Salaam'
/**
 * The single currency the app deals in.
 *
 * The API still stores a per-record currency code (and validates only that it
 * is three characters), but the UI neither offers nor renders anything else -
 * a picker invites data this app has no way to convert or total correctly.
 * Widening to multi-currency means adding a picker here and, more importantly,
 * deciding what a mixed-currency total means.
 */
export const DEFAULT_CURRENCY = 'TZS'

/**
 * Format a monetary value.
 *
 * Falls back to `CODE 1234.00` for a currency code Intl does not recognise —
 * the API validates only that the code is three characters, so an unknown one
 * can reach the UI and must not throw.
 */
export function formatMoney(
  value: number | null | undefined,
  currency: string = DEFAULT_CURRENCY
): string {
  if (value === null || value === undefined) return '—'

  try {
    return new Intl.NumberFormat(APP_LOCALE, {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(value)
  } catch {
    return `${currency} ${value.toFixed(2)}`
  }
}

/** Date only, e.g. 04/09/2026. */
export function formatDate(value: string | null | undefined): string {
  if (!value) return '—'

  return new Date(value).toLocaleDateString(APP_LOCALE, {
    timeZone: APP_TIMEZONE,
  })
}

/** Date and time, e.g. 04/09/2026, 08:26:22. */
export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—'

  return new Date(value).toLocaleString(APP_LOCALE, {
    timeZone: APP_TIMEZONE,
  })
}

/** Time only — paired with formatDate in tight table cells. */
export function formatTime(value: string | null | undefined): string {
  if (!value) return '—'

  return new Date(value).toLocaleTimeString(APP_LOCALE, {
    timeZone: APP_TIMEZONE,
  })
}
