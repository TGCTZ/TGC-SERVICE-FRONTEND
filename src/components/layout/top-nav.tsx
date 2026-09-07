import { Link } from '@tanstack/react-router'
import { Menu } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

type TopNavProps = React.HTMLAttributes<HTMLElement> & {
  links: {
    title: string
    href: string
    isActive: boolean
    disabled?: boolean
  }[]
}

/**
 * Horizontal in-page navigation, collapsing to a menu below `lg`.
 *
 * For tabs *within* a screen. App-level navigation belongs in the sidebar, and
 * duplicating it here gives users two places to look for the same link.
 *
 * `isActive` is supplied per link rather than derived from the router, so a
 * screen can highlight a tab that does not map to its own route.
 *
 * @param props.links - The links; each needs `title`, `href` and `isActive`,
 *   and may set `disabled`
 */
export function TopNav({ className, links, ...props }: TopNavProps) {
  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            size='icon'
            variant='outline'
            className={cn('md:size-7 lg:hidden', className)}
          >
            <Menu />
            <span className='sr-only'>Toggle navigation menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side='bottom' align='start'>
          {links.map(({ title, href, isActive, disabled }) => (
            <DropdownMenuItem key={`${title}-${href}`} asChild>
              <Link
                to={href}
                className={!isActive ? 'text-muted-foreground' : ''}
                disabled={disabled}
              >
                {title}
              </Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <nav
        className={cn(
          'hidden items-center space-x-4 lg:flex lg:space-x-4 xl:space-x-6',
          className
        )}
        {...props}
      >
        {links.map(({ title, href, isActive, disabled }) => (
          <Link
            key={`${title}-${href}`}
            to={href}
            disabled={disabled}
            className={`text-sm font-medium transition-colors hover:text-primary ${isActive ? '' : 'text-muted-foreground'}`}
          >
            {title}
          </Link>
        ))}
      </nav>
    </>
  )
}
