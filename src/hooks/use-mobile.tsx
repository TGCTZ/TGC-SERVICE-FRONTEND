import * as React from 'react'

const MOBILE_BREAKPOINT = 768
const MOBILE_QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`

/**
 * Whether the viewport is narrower than the `md` breakpoint (768px).
 *
 * For behaviour that CSS cannot express — the sidebar becomes a `Sheet`, not
 * merely a restyled sidebar. **Prefer a Tailwind responsive class whenever the
 * difference is only visual**; this re-renders React, a media query does not.
 *
 * Built on `useSyncExternalStore`, so it stays correct through concurrent
 * renders. The server snapshot is `false`, meaning the first paint assumes
 * desktop and corrects on hydration.
 *
 * @returns `true` below 768px
 */
export function useIsMobile() {
  return React.useSyncExternalStore(
    (callback) => {
      const mql = window.matchMedia(MOBILE_QUERY)
      mql.addEventListener('change', callback)
      return () => mql.removeEventListener('change', callback)
    },
    () => window.matchMedia(MOBILE_QUERY).matches,
    () => false
  )
}
