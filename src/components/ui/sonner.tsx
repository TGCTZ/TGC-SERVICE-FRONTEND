import { Toaster as Sonner, ToasterProps } from 'sonner'
import { useDirection } from '@/context/direction-provider'
import { useTheme } from '@/context/theme-provider'

/**
 * How long a toast stays on screen, in milliseconds.
 *
 * Five seconds gives users time to read a confirmation without leaving it on
 * screen long enough to obstruct the workflow.
 */
const TOAST_DURATION_MS = 5_000

/**
 * App-wide toast host.
 *
 * Toasts sit bottom-right, sonner's default. They stack away from the page
 * header and the dialogs most actions are triggered from. The five-second
 * duration and close button keep confirmations easy to dismiss.
 *
 * Watch the sticky pagination bar every table renders: it shares this corner,
 * and `offset` is the lever if the two start to collide.
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
  const { theme = 'dark' } = useTheme()
  const { dir } = useDirection()

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      position='bottom-right'
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
