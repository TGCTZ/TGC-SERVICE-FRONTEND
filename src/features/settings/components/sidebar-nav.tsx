import { type JSX } from 'react'
import { Link, useLocation, useNavigate } from '@tanstack/react-router'
import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type SidebarNavProps = React.HTMLAttributes<HTMLElement> & {
  items: {
    href: string
    title: string
    icon: JSX.Element
  }[]
}

export function SidebarNav({ className, items, ...props }: SidebarNavProps) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const activePath = normalizePath(pathname)
  const activePathValue = items.find(
    (item) => normalizePath(item.href) === activePath
  )?.href

  const handleSelect = (e: string) => {
    navigate({ to: e })
  }

  return (
    <>
      <div className='md:hidden'>
        <Select value={activePathValue} onValueChange={handleSelect}>
          <SelectTrigger className='h-10 w-full' aria-label='Settings section'>
            <SelectValue placeholder='Settings section' />
          </SelectTrigger>
          <SelectContent>
            {items.map((item) => (
              <SelectItem key={item.href} value={item.href}>
                <div className='flex items-center gap-x-3 px-1 py-1'>
                  <span>{item.icon}</span>
                  <span>{item.title}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className='hidden w-full overflow-x-auto md:block'>
        <nav
          className={cn('flex min-w-max border-b', className)}
          aria-label='Settings sections'
          {...props}
        >
          {items.map((item) => {
            const isActive = normalizePath(item.href) === activePath

            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'inline-flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <span aria-hidden='true'>{item.icon}</span>
                {item.title}
              </Link>
            )
          })}
        </nav>
      </div>
    </>
  )
}

function normalizePath(path: string) {
  return path.replace(/\/+$/, '') || '/'
}
