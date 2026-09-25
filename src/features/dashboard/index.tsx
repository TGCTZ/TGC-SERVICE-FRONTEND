import { useMemo } from 'react'
import { getRouteApi } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/auth-store'
import { PERMISSIONS } from '@/lib/permissions'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ManagementStatistics } from './components/management/management-statistics'
import { OperationsBoard } from './components/operations-board'
import { periodFromSearch } from './data/analytics'

const route = getRouteApi('/_authenticated/')

type DashboardTab = 'operations' | 'management'

const DESCRIPTIONS: Record<DashboardTab, string> = {
  operations: 'What the lab is holding, and what is waiting on someone.',
  management:
    'How the lab is doing over time: volume, money, speed, and the market behind the work.',
}

/**
 * The lab's dashboard.
 *
 * Operations is the status board every role sees. Management adds the
 * statistics for whoever holds `analytics.view_statistics`; without it there
 * are no tabs at all, just the board as before. The tab and the period live
 * in the URL, so a view can be shared and survives a reload.
 */
export function Dashboard() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const canSeeStatistics = useAuthStore(
    (state) =>
      state.auth.user?.permissions.includes(PERMISSIONS.viewStatistics) ?? false
  )
  // A shared ?tab=management link must not show an empty tab to someone
  // without the permission.
  const tab: DashboardTab = canSeeStatistics
    ? (search.tab ?? 'operations')
    : 'operations'
  // Keyed on the URL values, so presets resolve against today once per change
  // rather than minting new dates - and new query keys - on every render.
  const period = useMemo(
    () =>
      periodFromSearch({
        range: search.range,
        from: search.from,
        to: search.to,
      }),
    [search.range, search.from, search.to]
  )

  return (
    <>
      <Header fixed>
        <Search />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>

      <Main className='flex flex-1 flex-col gap-6'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>Dashboard</h1>
          <p className='max-w-prose rounded-md border border-primary/30 bg-header px-3 py-2 text-sm/relaxed text-muted-foreground'>
            {DESCRIPTIONS[tab]}
          </p>
        </div>

        {canSeeStatistics ? (
          <Tabs
            value={tab}
            onValueChange={(next) =>
              navigate({
                search: (prev) => ({ ...prev, tab: next as DashboardTab }),
                replace: true,
              })
            }
            className='gap-6'
          >
            <TabsList>
              <TabsTrigger value='operations'>Operations</TabsTrigger>
              <TabsTrigger value='management'>Management</TabsTrigger>
            </TabsList>
            <TabsContent value='operations'>
              <OperationsBoard />
            </TabsContent>
            <TabsContent value='management'>
              <ManagementStatistics
                period={period}
                onPeriodChange={(choice) =>
                  navigate({
                    // A preset and a custom range are exclusive in the URL.
                    search: (prev) => ({
                      ...prev,
                      ...('preset' in choice
                        ? {
                            range: choice.preset,
                            from: undefined,
                            to: undefined,
                          }
                        : {
                            range: undefined,
                            from: choice.from,
                            to: choice.to,
                          }),
                    }),
                    replace: true,
                  })
                }
              />
            </TabsContent>
          </Tabs>
        ) : (
          <OperationsBoard />
        )}
      </Main>
    </>
  )
}
