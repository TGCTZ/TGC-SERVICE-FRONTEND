import { Link } from '@tanstack/react-router'
import { appConfig } from '@/config/app-config'
import { Logo } from '@/assets/logo'
import {
  SidebarMenu,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'

/**
 * The sidebar header: the crest beside the short wordmark, linking home.
 *
 * Laid out as a row rather than stacked. A 96px crest over the wordmark cost
 * roughly 150px of rail — three nav items' worth — before the navigation even
 * began, and the rail's scarce axis is the vertical one. A row spends the
 * horizontal space instead, which the header has going spare.
 *
 * Deliberately **not** wrapped in `SidebarMenuButton`. That component is a
 * fixed `h-12` box with `overflow-hidden`, and its variants force
 * `group-data-[collapsible=icon]:size-8!` — an important-flagged 32px square
 * that would crop the crest rather than scale it. `SidebarHeader` is an
 * unopinionated flex column, so the layout is built directly inside it.
 *
 * Collapsing to icon mode centres the crest and hides the wordmark.
 * `data-collapsible` is only set on the sidebar *while collapsed*, so the
 * expanded sizes need no counterpart selector. None of these rules apply on
 * mobile, where the sidebar is a full-width sheet.
 *
 * The name comes from `config/app-config.ts` — change it there, not here.
 *
 * Closes the mobile sidebar on navigation, since on a phone the sidebar is an
 * overlay that would otherwise stay covering the page you just opened.
 */
export function AppTitle() {
  const { setOpenMobile } = useSidebar()

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <Link
          to='/'
          aria-label={`${appConfig.name} — go to the dashboard`}
          onClick={() => setOpenMobile(false)}
          className='flex items-center gap-2.5 rounded-md p-1.5 transition-opacity group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 hover:opacity-80'
        >
          {/* alt is empty: the wordmark beside it already names the app, and
              the link carries its own label. */}
          <Logo alt='' className='size-9 shrink-0' />
          <span className='truncate text-sm font-bold tracking-wide group-data-[collapsible=icon]:hidden'>
            {appConfig.shortName}
          </span>
        </Link>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
