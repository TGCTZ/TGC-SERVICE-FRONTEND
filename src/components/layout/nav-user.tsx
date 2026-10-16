import { Link } from '@tanstack/react-router'
import { LogOut, Settings } from 'lucide-react'
import useDialogState from '@/hooks/use-dialog-state'
import { Badge } from '@/components/ui/badge'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { SignOutDialog } from '@/components/sign-out-dialog'
import {
  UserIdentity,
  useUserIdentity,
} from '@/components/user-menu-content'

/** Sidebar profile with direct settings navigation and sign-out confirmation. */
export function NavUser() {
  const [open, setOpen] = useDialogState()
  const { roleLabel } = useUserIdentity()

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem className='rounded-lg bg-muted/50'>
          <SidebarMenuButton
            asChild
            size='lg'
            tooltip='Settings'
            className='h-auto hover:bg-muted hover:text-foreground dark:hover:bg-sidebar-accent dark:hover:text-sidebar-accent-foreground'
          >
            <Link to='/settings' aria-label='Open account settings'>
              <UserIdentity
                showRole={false}
                className='flex flex-1 items-center gap-2 overflow-hidden'
              />
              <Settings className='ms-auto size-4 shrink-0' aria-hidden='true' />
            </Link>
          </SidebarMenuButton>
          <div className='flex items-center justify-between gap-2 pe-2 pb-2 ps-12 group-data-[collapsible=icon]:hidden'>
            {roleLabel && (
              <Badge
                variant='outline'
                className='min-w-0 shrink border-transparent bg-success px-2 py-0.5 text-xs text-success-foreground'
                title={`Role: ${roleLabel}`}
              >
                <span className='truncate'>{roleLabel}</span>
              </Badge>
            )}
            <button
              type='button'
              onClick={() => setOpen(true)}
              className='ms-auto inline-flex shrink-0 items-center gap-1 rounded-sm text-xs text-destructive hover:underline focus-visible:outline-2 focus-visible:outline-ring'
            >
              <LogOut className='size-3.5' aria-hidden='true' />
              Sign out
            </button>
          </div>
        </SidebarMenuItem>
      </SidebarMenu>

      <SignOutDialog open={!!open} onOpenChange={setOpen} />
    </>
  )
}
