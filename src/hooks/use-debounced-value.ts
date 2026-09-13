import { useEffect, useState } from 'react'

/**
 * A value that only updates once it has stopped changing.
 *
 * For inputs that drive a server request. Without it every keystroke is a
 * request, and the responses race — a slow one for "As" can land after the fast
 * one for "Asha" and overwrite the better results with worse ones.
 *
 * @param value - The value to follow, typically an input's current text.
 * @param delay - Quiet period in milliseconds before the value is passed on.
 * @returns The value as it stood `delay` ms ago, once it settled.
 * @example
 * const debounced = useDebouncedValue(term, 300)
 * const { data } = useQuery(customerSearchQuery(debounced))
 */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [settled, setSettled] = useState(value)

  useEffect(() => {
    const timer = window.setTimeout(() => setSettled(value), delay)
    return () => window.clearTimeout(timer)
  }, [value, delay])

  return settled
}
