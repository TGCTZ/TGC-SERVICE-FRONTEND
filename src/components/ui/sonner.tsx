import { Toaster as Sonner, ToasterProps } from 'sonner'
import { useDirection } from '@/context/direction-provider'
import { useTheme } from '@/context/theme-provider'

/**
 * App-wide toast host.
 *
 * Toasts appear top-centre rather than sonner's bottom-right default: actions
 * here are triggered from dialogs and table row menus that sit high on the
 * page, and a confirmation in the opposite corner is easy to miss entirely.
 * The top edge is also clear of the sticky pagination bar every table renders.
 *
 * `position` and `dir` are set before the prop spread, so any caller can still
 * override them per instance.
 */
export function Toaster({ ...props }: ToasterProps) {
  const { theme = 'system' } = useTheme()
  const { dir } = useDirection()

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      position='top-center'
      dir={dir}
      className='toaster group [&_div[data-content]]:w-full'
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
