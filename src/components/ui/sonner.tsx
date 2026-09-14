import { Toaster as Sonner, ToasterProps } from 'sonner'
import { useDirection } from '@/context/direction-provider'
import { useTheme } from '@/context/theme-provider'

/**
 * How long a toast stays on screen, in milliseconds.
 *
 * Well above sonner's 4s default: these messages confirm what happened to a
 * physical stone or an order and often name the next step, and reception reads
 * them while still handling the customer. A message missed is a question asked.
 * Paired with `closeButton`, so a toast this long never becomes an obstruction.
 */
const TOAST_DURATION_MS = 16_000

/**
 * App-wide toast host.
 *
 * Toasts appear top-centre rather than sonner's bottom-right default: actions
 * here are triggered from dialogs and table row menus that sit high on the
 * page, and a confirmation in the opposite corner is easy to miss entirely.
 * The top edge is also clear of the sticky pagination bar every table renders.
 *
 * `richColors` is what makes success and failure distinguishable at a glance —
 * without it every toast paints from the same `--popover` pair and a red
 * "permission denied" reads exactly like a green "saved". The `--normal-*`
 * variables below still apply to untyped `toast()` calls; sonner takes the
 * semantic colours for `success`/`error`/`warning`/`info` from its own vars.
 *
 * `position`, `dir` and the defaults are set before the prop spread, so any
 * caller can still override them per instance.
 */
export function Toaster({ ...props }: ToasterProps) {
  const { theme = 'system' } = useTheme()
  const { dir } = useDirection()

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      position='top-center'
      dir={dir}
      duration={TOAST_DURATION_MS}
      richColors
      closeButton
      // Four is enough to see a batch action land without walling off the page.
      visibleToasts={4}
      className='toaster group [&_div[data-content]]:w-full'
      toastOptions={{
        classNames: {
          // Wider and heavier than the default: these are read across a
          // counter, not leant into.
          toast: 'w-full gap-3 p-4 shadow-lg sm:min-w-[22rem]',
          title: 'text-sm font-semibold',
          description: 'text-sm opacity-90',
          icon: 'size-5',
        },
      }}
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
        } as React.CSSProperties
      }
      {...props}
    />
  )
}
