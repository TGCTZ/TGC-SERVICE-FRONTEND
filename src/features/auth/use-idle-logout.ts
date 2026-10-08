import { useEffect } from 'react'
import { AxiosError } from 'axios'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth-store'
import { api } from '@/lib/api'
import { logout } from './data/api'
import {
  IDLE_TIMEOUT_MS,
  LAST_INTERACTION_KEY,
  lastInteractionAt,
  recordLocalInteraction,
} from './idle-session'

const ACTIVITY_REPORT_INTERVAL_MS = 15 * 1000

/** Keep one human-interaction clock for every authenticated route, including first login. */
export function useIdleLogout() {
  const signedIn = useAuthStore((state) => Boolean(state.auth.accessToken))
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!signedIn) return

    const storedInteraction = lastInteractionAt()
    let last = storedInteraction ?? Date.now()
    if (storedInteraction === null) {
      recordLocalInteraction(last)
    }
    let lastReported = 0
    let closing = false
    let deadlineTimer: ReturnType<typeof setTimeout> | undefined
    let reportTimer: ReturnType<typeof setTimeout> | undefined

    const clearTimers = () => {
      clearTimeout(deadlineTimer)
      clearTimeout(reportTimer)
    }

    const signOut = (idle: boolean) => {
      if (closing) return
      closing = true
      clearTimers()
      queryClient.clear()

      if (idle) {
        // A sleeping tab may wake after the server has already expired the session.
        void logout().catch(() => undefined)
        toast.info('Signed out after 30 minutes of inactivity.')
        void navigate({ to: '/sign-in', replace: true })
      } else {
        // Another tab already revoked the shared refresh token.
        useAuthStore.getState().auth.reset()
        void navigate({ to: '/sign-in', replace: true })
      }
    }

    const latestInteraction = () => Math.max(last, lastInteractionAt() ?? 0)

    const scheduleDeadline = () => {
      clearTimeout(deadlineTimer)
      const remaining = latestInteraction() + IDLE_TIMEOUT_MS - Date.now()
      if (remaining <= 0) {
        signOut(true)
        return
      }
      deadlineTimer = setTimeout(checkDeadline, remaining)
    }

    function checkDeadline() {
      if (closing) return
      if (Date.now() - latestInteraction() >= IDLE_TIMEOUT_MS) {
        signOut(true)
      } else {
        scheduleDeadline()
      }
    }

    const reportInteraction = () => {
      reportTimer = undefined
      lastReported = Date.now()
      void api.post('/auth/activity').catch((error: unknown) => {
        // Network errors can be retried on the next interaction; a rejected
        // session must leave the app even when the refresh cookie is missing.
        if (error instanceof AxiosError && error.response?.status === 401) {
          signOut(false)
        }
      })
    }

    const queueReport = () => {
      if (reportTimer) return
      const delay = Math.max(
        0,
        ACTIVITY_REPORT_INTERVAL_MS - (Date.now() - lastReported)
      )
      if (delay === 0) reportInteraction()
      else reportTimer = setTimeout(reportInteraction, delay)
    }

    const onInteraction = (event: Event) => {
      if (closing) return
      const now = Date.now()
      // Check the old deadline first: a click after sleep must not revive it.
      if (now - latestInteraction() >= IDLE_TIMEOUT_MS) {
        if (event.type !== 'wheel' && event.cancelable) event.preventDefault()
        event.stopImmediatePropagation()
        signOut(true)
        return
      }
      last = now
      recordLocalInteraction(now)
      scheduleDeadline()
      queueReport()
    }

    const onStorage = (event: StorageEvent) => {
      if (event.key !== LAST_INTERACTION_KEY) return
      if (event.newValue === null) {
        signOut(false)
        return
      }
      const otherTabTime = Number(event.newValue)
      if (Number.isFinite(otherTabTime) && otherTabTime > last) {
        last = otherTabTime
        scheduleDeadline()
      }
    }

    const onVisibility = () => {
      if (document.visibilityState === 'visible') checkDeadline()
    }

    document.addEventListener('pointerdown', onInteraction, true)
    document.addEventListener('click', onInteraction, true)
    document.addEventListener('keydown', onInteraction, true)
    document.addEventListener('input', onInteraction, true)
    document.addEventListener('wheel', onInteraction, true)
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('focus', checkDeadline)
    window.addEventListener('storage', onStorage)
    checkDeadline()

    return () => {
      clearTimers()
      document.removeEventListener('pointerdown', onInteraction, true)
      document.removeEventListener('click', onInteraction, true)
      document.removeEventListener('keydown', onInteraction, true)
      document.removeEventListener('input', onInteraction, true)
      document.removeEventListener('wheel', onInteraction, true)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('focus', checkDeadline)
      window.removeEventListener('storage', onStorage)
    }
  }, [signedIn, navigate, queryClient])
}
