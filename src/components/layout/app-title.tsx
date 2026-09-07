import { Link } from '@tanstack/react-router'
import { appConfig } from '@/config/app-config'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar'

/**
 * The sidebar header: app name linking home, beside the collapse trigger.
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
        <SidebarMenuButton
          size='lg'
          className='gap-0 py-0 hover:bg-transparent active:bg-transparent'
          asChild
        >
          <div>
            <Link
              to='/'
              onClick={() => setOpenMobile(false)}
              className='grid flex-1 text-start text-sm leading-tight'
            >
              <span className='truncate font-bold'>{appConfig.name}</span>
            </Link>
            <SidebarTrigger className='size-8 max-md:scale-125' />
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
