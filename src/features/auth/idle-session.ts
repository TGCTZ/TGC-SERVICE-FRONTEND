/** Browser interaction time shared by tabs in this login. API traffic does not touch it. */
export const IDLE_TIMEOUT_MS = 30 * 60 * 1000
export const LAST_INTERACTION_KEY = 'tgc_last_interaction_at'
let memoryLastInteraction: number | null = null

export function lastInteractionAt(): number | null {
  if (typeof window === 'undefined') return null
  try {
    const value = Number(window.localStorage.getItem(LAST_INTERACTION_KEY))
    return Number.isFinite(value) && value > 0 ? value : memoryLastInteraction
  } catch {
    return memoryLastInteraction
  }
}

export function recordLocalInteraction(at = Date.now()): void {
  memoryLastInteraction = at
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(LAST_INTERACTION_KEY, String(at))
  } catch {
    // The in-memory clock still works when browser storage is unavailable.
  }
}

export function clearIdleSession(): void {
  memoryLastInteraction = null
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.removeItem(LAST_INTERACTION_KEY)
    } catch {
      // The server's deadline still applies when browser storage is unavailable.
    }
  }
}
