import { createFileRoute, redirect } from '@tanstack/react-router'
import { needsFirstLogin, useAuthStore } from '@/stores/auth-store'
import { meQueryOptions } from '@/features/auth/data/api'
import { FirstLogin } from '@/features/auth/first-login'

export const Route = createFileRoute('/(auth)/first-login')({
  /**
   * Only for a signed-in user who still has their first login to finish:
   * anyone else is sent to sign in, or on into the app.
   */
  beforeLoad: async ({ context }) => {
    const { auth } = useAuthStore.getState()
    if (!auth.accessToken) throw redirect({ to: '/sign-in' })

    let user = auth.user
    if (!user) {
      try {
        user = await context.queryClient.ensureQueryData(meQueryOptions)
        useAuthStore.getState().auth.setUser(user)
      } catch {
        useAuthStore.getState().auth.reset()
        throw redirect({ to: '/sign-in' })
      }
    }

    if (!needsFirstLogin(user)) throw redirect({ to: '/' })
  },
  component: FirstLogin,
})
