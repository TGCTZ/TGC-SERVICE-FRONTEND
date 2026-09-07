import { cn } from '@/lib/utils'

type MainProps = React.HTMLAttributes<HTMLElement> & {
  fixed?: boolean
  fluid?: boolean
  ref?: React.Ref<HTMLElement>
}

/**
 * The page content region, inside the app shell.
 *
 * Carries `id="content"`, the target of `<SkipToMain>` — do not remove it, or
 * the skip link silently stops working with nothing to catch it.
 *
 * Two layout switches:
 *
 * - `fixed` — the region itself scrolls rather than the page. Use it when
 *   something must stay put, such as a table with a sticky header. It sets
 *   `overflow-hidden`, so a child that needs to scroll needs `min-h-0`.
 * - `fluid` — drops the `max-w-7xl` cap and fills the width. The cap exists
 *   because full-width text is hard to read on a wide monitor; tables and
 *   dashboards are the usual reasons to opt out.
 *
 * @param props.fixed - Scroll this region instead of the page
 * @param props.fluid - Fill the available width, uncapped
 */
export function Main({ fixed, className, fluid, ...props }: MainProps) {
  return (
    <main
      id='content'
      data-layout={fixed ? 'fixed' : 'auto'}
      className={cn(
        'px-4 py-6',

        // If layout is fixed, make the main container flex and grow
        fixed && 'flex grow flex-col overflow-hidden',

        // If layout is not fluid, set the max-width
        !fluid &&
          '@7xl/content:mx-auto @7xl/content:w-full @7xl/content:max-w-7xl',
        className
      )}
      {...props}
    />
  )
}
