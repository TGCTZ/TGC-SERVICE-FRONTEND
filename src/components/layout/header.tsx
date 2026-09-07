import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { useLayout } from '@/context/layout-provider'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar'

type HeaderProps = React.HTMLAttributes<HTMLElement> & {
  fixed?: boolean
  ref?: React.Ref<HTMLElement>
}

/**
 * The page header bar, holding search, theme and profile controls.
 *
 * Renders a sidebar trigger **only when the sidebar is not showing its own** —
 * a closed mobile sheet or a collapsed `offcanvas` sidebar takes its trigger
 * with it, which would otherwise leave no way to reopen it. In every other
 * state a second trigger is redundant.
 *
 * With `fixed`, it sticks to the top and grows a blur backdrop once the page
 * scrolls past 10px, so content does not read through it.
 *
 * @param props.fixed - Stick to the top of the scroll container
 * @param props.children - Header content, laid out in a flex row
 */
export function Header({ className, fixed, children, ...props }: HeaderProps) {
  const [offset, setOffset] = useState(0)
  const { collapsible } = useLayout()
  const { isMobile, openMobile, state } = useSidebar()

  // The sidebar carries its own trigger, so a second one here is redundant
  // whenever the sidebar is on screen. It is not always on screen though: a
  // closed mobile sheet and a collapsed "offcanvas" sidebar both take their
  // trigger with them, which would leave no way to reopen it.
  const sidebarTriggerVisible = isMobile
    ? openMobile
    : collapsible !== 'offcanvas' || state === 'expanded'

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
      className={cn(
        'z-50 h-16',
        fixed && 'header-fixed peer/header sticky top-0 w-[inherit]',
        offset > 10 && fixed ? 'shadow' : 'shadow-none',
        className
      )}
      {...props}
    >
      <div
        className={cn(
          'relative flex h-full items-center gap-3 p-4 sm:gap-4',
          offset > 10 &&
            fixed &&
            'after:absolute after:inset-0 after:-z-10 after:bg-background/20 after:backdrop-blur-lg'
        )}
      >
        {!sidebarTriggerVisible && (
          <>
            <SidebarTrigger variant='outline' className='max-md:scale-125' />
            <Separator orientation='vertical' className='h-6' />
          </>
        )}
        {children}
      </div>
    </header>
  )
}
