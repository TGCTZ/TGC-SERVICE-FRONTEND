import { type ReactNode, useState } from 'react'
import { Link, useLocation } from '@tanstack/react-router'
import { ChevronRight } from 'lucide-react'
import { getCookie, setCookie } from '@/lib/cookies'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { Badge } from '../ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import {
  type NavCollapsible,
  type NavItem,
  type NavLink,
  type NavGroup as NavGroupProps,
} from './types'

/**
 * Which groups the user has folded away, remembered for a week.
 *
 * Stores the *collapsed* titles rather than the open ones, so a group added to
 * the sidebar later is open by default — the alternative would make a new
 * section invisible to everyone who had already used the app.
 */
const COLLAPSED_GROUPS_COOKIE = 'sidebar_collapsed_groups'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 days, matching the sidebar's own

function readCollapsedGroups(): string[] {
  const raw = getCookie(COLLAPSED_GROUPS_COOKIE)
  if (!raw) return []

  return raw.split(',').filter(Boolean).map(decodeURIComponent)
}

function writeCollapsedGroups(titles: string[]): void {
  setCookie(
    COLLAPSED_GROUPS_COOKIE,
    titles.map(encodeURIComponent).join(','),
    COOKIE_MAX_AGE
  )
}

/**
 * One foldable section of the sidebar, with its links or sub-menus.
 *
 * Fold state persists in the `sidebar_collapsed_groups` cookie. It stores the
 * groups that are **closed**, not the open ones — so a group added to
 * `sidebar-data.ts` later defaults to open for existing users rather than
 * being invisible because it was missing from their cookie.
 *
 * In icon mode there is no room to fold anything, so the group renders flat
 * and its items become hover fly-outs.
 *
 * @param props.title - Section heading; also its cookie key, so renaming a
 *   group resets its fold state
 * @param props.items - Links and collapsible sub-menus
 */
export function NavGroup({ title, items }: NavGroupProps) {
  const { state, isMobile } = useSidebar()
  const href = useLocation({ select: (location) => location.href })

  // Groups start open unless the user folded this one away previously: a
  // sidebar that hides everything on first load is worse than one that is
  // slightly long.
  const [open, setOpen] = useState(() => !readCollapsedGroups().includes(title))

  function handleOpenChange(next: boolean) {
    setOpen(next)

    // Re-read before writing. Every group owns its own state but they share
    // one cookie, so writing from a stale snapshot would clobber whatever the
    // sibling groups had recorded.
    const collapsed = readCollapsedGroups().filter((name) => name !== title)

    if (!next) collapsed.push(title)

    writeCollapsedGroups(collapsed)
  }

  const menu = (
    <SidebarMenu>
      {items.map((item) => {
        const key = `${item.title}-${item.url}`

        if (!item.items)
          return <SidebarMenuLink key={key} item={item} href={href} />

        if (state === 'collapsed' && !isMobile)
          return (
            <SidebarMenuCollapsedDropdown key={key} item={item} href={href} />
          )

        return <SidebarMenuCollapsible key={key} item={item} href={href} />
      })}
    </SidebarMenu>
  )

  // In icon mode there is no heading to click, and the items already collapse
  // to icons — wrapping them in a collapsible would hide them with no way back.
  if (state === 'collapsed' && !isMobile) {
    return <SidebarGroup>{menu}</SidebarGroup>
  }

  return (
    <Collapsible
      open={open}
      onOpenChange={handleOpenChange}
      className='group/nav-group'
    >
      <SidebarGroup>
        <SidebarGroupLabel asChild>
          <CollapsibleTrigger className='flex w-full items-center gap-1 hover:text-sidebar-accent-foreground'>
            {title}
            <ChevronRight className='ms-auto size-3.5 transition-transform duration-200 group-data-[state=open]/nav-group:rotate-90' />
          </CollapsibleTrigger>
        </SidebarGroupLabel>
        <CollapsibleContent>{menu}</CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  )
}

function NavBadge({ children }: { children: ReactNode }) {
  return <Badge className='rounded-full px-1 py-0 text-xs'>{children}</Badge>
}

function SidebarMenuLink({ item, href }: { item: NavLink; href: string }) {
  const { setOpenMobile } = useSidebar()
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={checkIsActive(href, item)}
        tooltip={item.title}
      >
        <Link to={item.url} onClick={() => setOpenMobile(false)}>
          {item.icon && <item.icon />}
          <span>{item.title}</span>
          {item.badge && <NavBadge>{item.badge}</NavBadge>}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

function SidebarMenuCollapsible({
  item,
  href,
}: {
  item: NavCollapsible
  href: string
}) {
  const { setOpenMobile } = useSidebar()
  return (
    <Collapsible
      asChild
      defaultOpen={checkIsActive(href, item, true)}
      className='group/collapsible'
    >
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton tooltip={item.title}>
            {item.icon && <item.icon />}
            <span>{item.title}</span>
            {item.badge && <NavBadge>{item.badge}</NavBadge>}
            <ChevronRight className='ms-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 rtl:rotate-180' />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent className='CollapsibleContent'>
          <SidebarMenuSub>
            {item.items.map((subItem) => (
              <SidebarMenuSubItem key={subItem.title}>
                <SidebarMenuSubButton
                  asChild
                  isActive={checkIsActive(href, subItem)}
                >
                  <Link to={subItem.url} onClick={() => setOpenMobile(false)}>
                    {subItem.icon && <subItem.icon />}
                    <span>{subItem.title}</span>
                    {subItem.badge && <NavBadge>{subItem.badge}</NavBadge>}
                  </Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  )
}

function SidebarMenuCollapsedDropdown({
  item,
  href,
}: {
  item: NavCollapsible
  href: string
}) {
  return (
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton
            tooltip={item.title}
            isActive={checkIsActive(href, item)}
          >
            {item.icon && <item.icon />}
            <span>{item.title}</span>
            {item.badge && <NavBadge>{item.badge}</NavBadge>}
            <ChevronRight className='ms-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90' />
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent side='right' align='start' sideOffset={4}>
          <DropdownMenuLabel>
            {item.title} {item.badge ? `(${item.badge})` : ''}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {item.items.map((sub) => (
            <DropdownMenuItem key={`${sub.title}-${sub.url}`} asChild>
              <Link
                to={sub.url}
                className={`${checkIsActive(href, sub) ? 'bg-secondary' : ''}`}
              >
                {sub.icon && <sub.icon />}
                <span className='max-w-52 text-wrap'>{sub.title}</span>
                {sub.badge && (
                  <span className='ms-auto text-xs'>{sub.badge}</span>
                )}
              </Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  )
}

function checkIsActive(href: string, item: NavItem, mainNav = false) {
  return (
    href === item.url || // /endpint?search=param
    href.split('?')[0] === item.url || // endpoint
    !!item?.items?.filter((i) => i.url === href).length || // if child nav is active
    (mainNav &&
      href.split('/')[1] !== '' &&
      href.split('/')[1] === item?.url?.split('/')[1])
  )
}
