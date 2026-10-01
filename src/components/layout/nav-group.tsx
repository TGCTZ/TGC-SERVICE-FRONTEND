import { type ReactNode, useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
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
  type NavCount,
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

/**
 * Bring the active nav item into view inside the sidebar.
 *
 * The nav is taller than the rail on a short viewport — `SidebarContent` is
 * `overflow-auto` — so the current page can sit below the fold with nothing on
 * screen saying where you are. Deep-linking or reloading lands you there with
 * the nav scrolled to the top.
 *
 * Scrolls the sidebar's own scroll container rather than calling
 * `scrollIntoView`, which walks every scrollable ancestor and can drag the page
 * itself. Only acts when the item is actually out of view, so it never fights a
 * user who has just scrolled the nav by hand.
 *
 * @param isActive - Whether this item is the current page
 * @returns A ref to attach to the item's element
 */
function useScrollActiveIntoView(isActive: boolean) {
  const ref = useRef<HTMLLIElement>(null)

  useEffect(() => {
    if (!isActive) return

    const item = ref.current
    const container = item?.closest<HTMLElement>(
      '[data-slot="sidebar-content"]'
    )
    if (!item || !container) return

    const itemBox = item.getBoundingClientRect()
    const containerBox = container.getBoundingClientRect()

    if (
      itemBox.top >= containerBox.top &&
      itemBox.bottom <= containerBox.bottom
    ) {
      return
    }

    // Centre it rather than scrolling the minimum distance: an item flush
    // against the top or bottom edge reads as the end of the list.
    const offset =
      itemBox.top -
      containerBox.top -
      (containerBox.height - itemBox.height) / 2

    container.scrollBy({ top: offset, behavior: 'smooth' })
  }, [isActive])

  return ref
}

function NavBadge({ children }: { children: ReactNode }) {
  return <Badge className='rounded-full px-1 py-0 text-xs'>{children}</Badge>
}

/**
 * A live count on an entry — how many items wait in a queue.
 *
 * Distinct from `NavBadge`, which is static text from the sidebar data. Its own
 * component so the query hook only exists on entries that declare a count.
 * An empty queue shows nothing: zero is the good outcome, not news. In icon
 * mode there is no room for a number, so it shrinks to a dot on the icon.
 */
function CountBadge({ query }: { query: NavCount }) {
  const { data: count = 0 } = useQuery({
    ...query,
    // Other desks drain and fill queues without this user doing anything, so
    // the number is polled, not only refreshed on this user's own writes.
    refetchInterval: 30_000,
  })
  if (!count) return null

  return (
    <>
      <Badge className='ms-auto rounded-full px-1.5 py-0 text-xs tabular-nums group-data-[collapsible=icon]:hidden'>
        {count > 99 ? '99+' : count}
        <span className='sr-only'> waiting</span>
      </Badge>
      <span
        aria-hidden
        className='absolute end-1 top-1 hidden size-2 rounded-full bg-primary group-data-[collapsible=icon]:block'
      />
    </>
  )
}

function SidebarMenuLink({ item, href }: { item: NavLink; href: string }) {
  const { setOpenMobile } = useSidebar()
  const isActive = checkIsActive(href, item)
  const ref = useScrollActiveIntoView(isActive)

  return (
    <SidebarMenuItem ref={ref}>
      <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
        <Link to={item.url} onClick={() => setOpenMobile(false)}>
          {item.icon && <item.icon />}
          <span>{item.title}</span>
          {item.badge && <NavBadge>{item.badge}</NavBadge>}
          {item.count && <CountBadge query={item.count} />}
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
              <SidebarMenuSubLink
                key={subItem.title}
                item={subItem}
                href={href}
                onNavigate={() => setOpenMobile(false)}
              />
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  )
}

/**
 * One link inside an expanded collapsible group.
 *
 * Extracted from the `.map()` so it can hold a hook — a nested item is the most
 * likely one to sit below the fold, since its group has to be open for it to
 * exist at all.
 */
function SidebarMenuSubLink({
  item,
  href,
  onNavigate,
}: {
  item: NavLink
  href: string
  onNavigate: () => void
}) {
  const isActive = checkIsActive(href, item)
  const ref = useScrollActiveIntoView(isActive)

  return (
    <SidebarMenuSubItem ref={ref}>
      <SidebarMenuSubButton asChild isActive={isActive}>
        <Link to={item.url} onClick={onNavigate}>
          {item.icon && <item.icon />}
          <span>{item.title}</span>
          {item.badge && <NavBadge>{item.badge}</NavBadge>}
          {item.count && <CountBadge query={item.count} />}
        </Link>
      </SidebarMenuSubButton>
    </SidebarMenuSubItem>
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
