import { Link } from '@tanstack/react-router'
import { LogOut, Settings } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { getDisplayNameInitials } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

/**
 * The signed-in user, shaped for display.
 *
 * The auth store holds the API's snake_case user; every place that renders an
 * avatar needs the same three derived values, so the mapping lives here rather
 * than being repeated (and diverging) at each call site.
 */
export function useUserIdentity() {
  const user = useAuthStore((state) => state.auth.user)

  const name = user?.full_name || user?.username || 'Signed out'
  const roles = user?.roles ?? []
  const roleLabel = roles
    .map((role) =>
      role
        .split(/[_\s-]+/)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ')
    )
    .join(' · ')

  return {
    name,
    email: user?.email ?? '',
    avatar: user?.avatar ?? '',
    initials: getDisplayNameInitials(name),
    roleLabel,
  }
}

/** The identity block: avatar, name, email and assigned roles. */
export function UserIdentity({
  className,
  showRole = true,
}: {
  className?: string
  showRole?: boolean
}) {
  const { name, email, avatar, initials, roleLabel } = useUserIdentity()

  return (
    <div className={className}>
      <Avatar className='size-8 rounded-lg'>
        <AvatarImage src={avatar} alt={name} />
        <AvatarFallback className='rounded-lg'>{initials}</AvatarFallback>
      </Avatar>
      <div className='grid min-w-0 flex-1 text-start text-sm leading-tight'>
        <span className='truncate font-semibold'>{name}</span>
        <span className='truncate text-xs'>{email}</span>
        {showRole && roleLabel && (
          <Badge
            variant='outline'
            className='mt-1 max-w-full border-transparent bg-success px-2 py-0.5 text-xs text-success-foreground'
            title={`Role: ${roleLabel}`}
          >
            <span className='truncate'>{roleLabel}</span>
          </Badge>
        )}
      </div>
    </div>
  )
}

/** Header avatar menu; the sidebar exposes settings and sign out directly. */
export function UserMenuContent({ onSignOut }: { onSignOut: () => void }) {
  return (
    <>
      <DropdownMenuLabel className='p-0 font-normal'>
        <UserIdentity className='flex items-center gap-2 px-1 py-1.5 text-start text-sm' />
      </DropdownMenuLabel>
      <DropdownMenuSeparator />

      {/*
        One entry, not five. The settings page carries its own nav over
        Profile / Account / Appearance / Notifications / Display, so listing
        them here duplicates that nav and makes the menu a second place to
        keep in step every time a settings tab is added.
      */}
      <DropdownMenuGroup>
        <DropdownMenuItem asChild>
          <Link to='/settings'>
            <Settings />
            Settings
          </Link>
        </DropdownMenuItem>
      </DropdownMenuGroup>

      <DropdownMenuSeparator />
      <DropdownMenuItem variant='destructive' onClick={onSignOut}>
        <LogOut />
        Sign out
      </DropdownMenuItem>
    </>
  )
}
