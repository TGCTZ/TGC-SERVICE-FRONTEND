import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { BackButton } from './back-button'
import { Breadcrumbs } from './breadcrumbs'

type HeaderProps = React.HTMLAttributes<HTMLElement> & {
  fixed?: boolean
  ref?: React.Ref<HTMLElement>
}

/**
 * The page header bar: where you are and how you got here on one side, the
 * page's own controls on the other.
 *
 * The left cluster — sidebar toggle, back button, breadcrumb trail — is fixed
 * and identical on every screen. A page cannot opt out of it and cannot
 * configure it: the trail is derived from the URL, so it can never contradict
 * the sidebar the user just clicked. See `./breadcrumbs.tsx`.
 *
 * The sidebar trigger is unconditional. The sidebar carries none of its own any
 * more, so this is the only control that collapses or reopens it — in every
 * collapse mode, which the old conditional did not manage.
 *
 * **`children` are wrapped in a right-aligned cluster.** Pass controls in
 * reading order and nothing else: an `ms-auto` or `me-auto` on a child now
 * fights the wrapper instead of helping it.
 *
 * The bar paints `--header`, which is the navigation surface rather than the
 * content sheet beneath it: the header and the sidebar are one continuous band
 * of chrome wrapping the content, so they carry one colour. That opaque fill is
 * also what stops content reading through a `fixed` header — it replaces the
 * translucent blur wash this used to grow on scroll, which could never fully
 * hide what passed under it. The shadow past 10px stays, as the lift cue.
 *
 * @param props.fixed - Stick to the top of the scroll container
 * @param props.children - The page's controls, laid out at the end of the bar
 */
export function Header({ className, fixed, children, ...props }: HeaderProps) {
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    const onScroll = () => {
      setOffset(document.body.scrollTop || document.documentElement.scrollTop)
    }

    // Add scroll listener to the body
    document.addEventListener('scroll', onScroll, { passive: true })

    // Clean up the event listener on unmount
    return () => document.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      data-slot='page-header'
      className={cn(
        'z-50 h-16 border-b border-header-border bg-header text-header-foreground',
        fixed && 'header-fixed peer/header sticky top-0 w-[inherit]',
        offset > 10 && fixed ? 'shadow' : 'shadow-none',
        className
      )}
      {...props}
    >
      <div className='relative flex h-full items-center gap-3 p-4 sm:gap-4'>
        <SidebarTrigger variant='outline' className='max-md:scale-125' />
        <Separator orientation='vertical' className='h-6' />
        <BackButton />
        <Breadcrumbs className='min-w-0 flex-1' />
        <div className='ms-auto flex shrink-0 items-center gap-3 sm:gap-4'>
          {children}
        </div>
      </div>
    </header>
  )
}
