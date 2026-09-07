import { CatchBoundary, Outlet, useLocation } from '@tanstack/react-router'
import { getCookie } from '@/lib/cookies'
import { cn } from '@/lib/utils'
import { LayoutProvider } from '@/context/layout-provider'
import { SearchProvider } from '@/context/search-provider'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { SkipToMain } from '@/components/skip-to-main'
import { GeneralError } from '@/features/errors/general-error'

type AuthenticatedLayoutProps = {
  children?: React.ReactNode
}

/**
 * The shell every signed-in page renders inside.
 *
 * Composes the providers a page can assume are present — search, layout,
 * sidebar — plus the sidebar, the skip link, and an error boundary.
 *
 * Two details that are easy to lose:
 *
 * - The sidebar's open state is read from the `sidebar_state` cookie **before
 *   first paint**, so a collapsed sidebar does not flash open on reload.
 * - The boundary is keyed on the pathname, so navigating away from a crashed
 *   page clears the error. Without that key the user stays stuck on
 *   "Something went wrong" until a full reload.
 *
 * `@container/content` is declared here, which is what lets `DataTablePagination`
 * and `Main` respond to their own width rather than the viewport's.
 *
 * @param props.children - Page content; defaults to the router `<Outlet>`
 */
export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const defaultOpen = getCookie('sidebar_state') !== 'false'
  // Reset the error boundary on navigation so leaving a broken page clears it.
  const pathname = useLocation({ select: (location) => location.pathname })
  return (
    <SearchProvider>
      <LayoutProvider>
        <SidebarProvider defaultOpen={defaultOpen}>
          <SkipToMain />
          <AppSidebar />
          <SidebarInset
            className={cn(
              // Set content container, so we can use container queries
              '@container/content',

              // If layout is fixed, set the height
              // to 100svh to prevent overflow
              'has-data-[layout=fixed]:h-svh',

              // If layout is fixed and sidebar is inset,
              // set the height to 100svh - spacing (total margins) to prevent overflow
              'peer-data-[variant=inset]:has-data-[layout=fixed]:h-[calc(100svh-(var(--spacing)*4))]'
            )}
          >
            <CatchBoundary
              getResetKey={() => pathname}
              errorComponent={() => <GeneralError minimal />}
            >
              {children ?? <Outlet />}
            </CatchBoundary>
          </SidebarInset>
        </SidebarProvider>
      </LayoutProvider>
    </SearchProvider>
  )
}
