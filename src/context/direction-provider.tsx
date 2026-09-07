import { createContext, useContext, useEffect, useState } from 'react'
import { DirectionProvider as RdxDirProvider } from '@radix-ui/react-direction'
import { getCookie, setCookie, removeCookie } from '@/lib/cookies'

/** Text direction. `rtl` for Arabic, Hebrew, Urdu and similar scripts. */
export type Direction = 'ltr' | 'rtl'

const DEFAULT_DIRECTION = 'ltr'
const DIRECTION_COOKIE_NAME = 'dir'
const DIRECTION_COOKIE_MAX_AGE = 60 * 60 * 24 * 365 // 1 year

type DirectionContextType = {
  defaultDir: Direction
  dir: Direction
  setDir: (dir: Direction) => void
  resetDir: () => void
}

const DirectionContext = createContext<DirectionContextType | null>(null)

/**
 * Left-to-right / right-to-left support, persisted in the `dir` cookie.
 *
 * Sets `dir` on `<html>` and feeds Radix's own direction provider, so popovers
 * and menus open towards the correct side.
 *
 * **This is why the codebase uses logical Tailwind utilities** — `ms-`/`me-`,
 * `ps-`/`pe-`, `text-start`/`text-end` — rather than `ml-`/`mr-`/`text-left`.
 * Logical utilities flip with the direction; physical ones do not, and a single
 * `ml-4` is enough to break an RTL layout. Keep to them even if you never
 * expect to ship RTL; the cost is nil and the alternative is an audit later.
 *
 * @param props.children - The app
 */
export function DirectionProvider({ children }: { children: React.ReactNode }) {
  const [dir, _setDir] = useState<Direction>(
    () => (getCookie(DIRECTION_COOKIE_NAME) as Direction) || DEFAULT_DIRECTION
  )

  useEffect(() => {
    const htmlElement = document.documentElement
    htmlElement.setAttribute('dir', dir)
  }, [dir])

  const setDir = (dir: Direction) => {
    _setDir(dir)
    setCookie(DIRECTION_COOKIE_NAME, dir, DIRECTION_COOKIE_MAX_AGE)
  }

  const resetDir = () => {
    _setDir(DEFAULT_DIRECTION)
    removeCookie(DIRECTION_COOKIE_NAME)
  }

  return (
    <DirectionContext
      value={{
        defaultDir: DEFAULT_DIRECTION,
        dir,
        setDir,
        resetDir,
      }}
    >
      <RdxDirProvider dir={dir}>{children}</RdxDirProvider>
    </DirectionContext>
  )
}

/**
 * Read and set the text direction.
 *
 * @returns The current `dir`, the default, and `setDir`/`resetDir`
 * @throws If used outside a `DirectionProvider`
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useDirection() {
  const context = useContext(DirectionContext)
  if (!context) {
    throw new Error('useDirection must be used within a DirectionProvider')
  }
  return context
}
