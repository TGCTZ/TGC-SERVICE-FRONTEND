import { createFileRoute, redirect } from '@tanstack/react-router'
import { needsFirstLogin, useAuthStore } from '@/stores/auth-store'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import { meQueryOptions } from '@/features/auth/data/api'

export const Route = createFileRoute('/_authenticated')({
  /**
   * Guard for every authenticated page.
   *
   * The token is persisted in a cookie, but the user object is not — so after
   * a refresh we re-fetch `/auth/me` before rendering. That matters beyond
   * showing a name: permissions come from this call, and rendering the app
   * without them would briefly hide every gated control.
   *
   * Auth-provider swap point: replace the token check and the `me` call with
   * your provider's session lookup (Clerk / Auth0 / Supabase).
   */
  beforeLoad: async ({ location, context }) => {
    const { auth } = useAuthStore.getState()

    if (!auth.accessToken) {
      throw redirect({
        to: '/sign-in',
        search: { redirect: location.href },
      })
    }

    // A new account finishes its first login before anything else; the API
    // refuses the rest until then, so there is nothing else to show it.
    if (auth.user) {
      if (needsFirstLogin(auth.user)) throw redirect({ to: '/first-login' })
      return
    }

    let user
    try {
      user = await context.queryClient.ensureQueryData(meQueryOptions)
      useAuthStore.getState().auth.setUser(user)
    } catch {
      // The stored token is stale or revoked — start a clean session.
      useAuthStore.getState().auth.reset()

      throw redirect({
        to: '/sign-in',
        search: { redirect: location.href },
      })
    }

    // Outside the try: a redirect thrown inside it would be caught as a failure.
    if (needsFirstLogin(user)) throw redirect({ to: '/first-login' })
  },
  component: AuthenticatedLayout,
})
