import { Construction } from 'lucide-react'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'

/**
 * Placeholder screen for a module that is scaffolded but not yet built.
 *
 * Its job is to make a planned section navigable so the shape of the app is
 * visible early — not to pretend the feature exists. Replace the whole route
 * with a real feature; do not grow this page.
 */
export function ComingSoon({
  title,
  description,
}: {
  title: string
  description?: string
}) {
  return (
    <>
      <Header fixed>
        <div className='ms-auto flex items-center gap-4'>
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>{title}</h2>
          {description && (
            <p className='text-muted-foreground'>{description}</p>
          )}
        </div>

        <div className='flex flex-1 items-center justify-center rounded-md border border-dashed'>
          <div className='flex flex-col items-center gap-2 py-16 text-center'>
            <Construction className='size-10 text-muted-foreground' />
            <p className='font-medium'>Not built yet</p>
            <p className='max-w-sm text-sm text-muted-foreground'>
              This section is scaffolded so the navigation reflects the plan.
              Replace its route with a real feature when you build it.
            </p>
          </div>
        </div>
      </Main>
    </>
  )
}
