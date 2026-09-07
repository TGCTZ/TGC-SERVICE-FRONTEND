import { useEffect, useRef } from 'react'
import { useRouterState } from '@tanstack/react-router'
import LoadingBar, { type LoadingBarRef } from 'react-top-loading-bar'

/**
 * A thin loading bar at the top of the window during route transitions.
 *
 * Driven by the router's own pending state, so it covers route loaders — the
 * gap where a navigation has begun but nothing has changed on screen yet, and
 * a user would otherwise wonder whether their click registered.
 *
 * Render **once**, at the app root. It reports navigation, not data fetching;
 * a slow query inside an already-mounted route will not move it.
 */
export function NavigationProgress() {
  const ref = useRef<LoadingBarRef>(null)
  const state = useRouterState()

  useEffect(() => {
    if (state.status === 'pending') {
      ref.current?.continuousStart()
    } else {
      ref.current?.complete()
    }
  }, [state.status])

  return (
    <LoadingBar
      color='var(--muted-foreground)'
      ref={ref}
      shadow={true}
      height={2}
    />
  )
}
