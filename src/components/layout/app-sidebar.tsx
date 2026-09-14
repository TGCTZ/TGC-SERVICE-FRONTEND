import { useMemo } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { useLayout } from '@/context/layout-provider'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar'
import { AppTitle } from './app-title'
import { filterNavGroups } from './data/filter-nav'
import { sidebarData } from './data/sidebar-data'
import { NavGroup } from './nav-group'
import { NavUser } from './nav-user'

/**
 * The application sidebar: title, navigation groups, user menu.
 *
 * Renders `sidebarData` filtered by the signed-in user's permissions, so the
 * menu never offers a page the API would refuse. The filter is a **usability
 * affordance, not a security boundary** — routes and endpoints authorise
 * independently.
 *
 * To change what appears here, edit `./data/sidebar-data.ts`; nothing in this
 * component needs to know about individual screens.
 */
export function AppSidebar() {
  const { collapsible, variant } = useLayout()
  const user = useAuthStore((state) => state.auth.user)

  const navGroups = useMemo(
    () => filterNavGroups(sidebarData.navGroups, user?.permissions ?? []),
    [user]
  )

  return (
    <Sidebar collapsible={collapsible} variant={variant}>
      {/* The seams are borders rather than <SidebarSeparator>: the nav scrolls
          between them, and a separator inside that scroll region would travel
          with the content instead of marking where the region begins. */}
      <SidebarHeader className='border-b border-sidebar-border'>
        <AppTitle />
      </SidebarHeader>
      <SidebarContent>
        {navGroups.map((props) => (
          <NavGroup key={props.title} {...props} />
        ))}
      </SidebarContent>
      <SidebarFooter className='border-t border-sidebar-border'>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
