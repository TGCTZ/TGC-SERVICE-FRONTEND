import { Fragment } from 'react'
import { Link, useLocation } from '@tanstack/react-router'
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { resolveBreadcrumbs, type Crumb } from './data/breadcrumbs'

type BreadcrumbsProps = {
  className?: string
}

/**
 * The navigation trail for the current URL, shown in the page header.
 *
 * Takes no trail prop on purpose. It is derived from the pathname against
 * `data/sidebar-data.ts` (see `data/breadcrumbs.ts` for the rules), so a screen
 * cannot state the wrong one, and a new screen gets its trail from the sidebar
 * entry it already needed.
 *
 * Everything between the first and last crumb collapses to an ellipsis below
 * `md`, so a four-crumb trail cannot shove the header controls off a phone
 * screen. The last crumb truncates rather than wrapping, because the header is
 * a fixed 4rem tall.
 *
 * @param props.className - Layout classes from the header; the trail's own
 *   appearance is set here, not by the caller
 * @example
 * <Breadcrumbs className='min-w-0 flex-1' />
 */
export function Breadcrumbs({ className }: BreadcrumbsProps) {
  const pathname = useLocation({ select: (location) => location.pathname })
  const crumbs = resolveBreadcrumbs(pathname)

  const first = crumbs[0]
  const last = crumbs.length > 1 ? crumbs[crumbs.length - 1] : undefined
  const middle = crumbs.slice(1, -1)

  return (
    <Breadcrumb className={className}>
      <BreadcrumbList className='flex-nowrap'>
        <BreadcrumbItem className='shrink-0'>
          {last ? (
            <CrumbContent crumb={first} />
          ) : (
            <BreadcrumbPage>{first.label}</BreadcrumbPage>
          )}
        </BreadcrumbItem>

        {middle.length > 0 && (
          <>
            <BreadcrumbSeparator className='md:hidden' />
            <BreadcrumbItem className='shrink-0 md:hidden'>
              <BreadcrumbEllipsis />
            </BreadcrumbItem>
          </>
        )}

        {middle.map((crumb, index) => (
          <Fragment key={`${crumb.label}-${index}`}>
            <BreadcrumbSeparator className='hidden md:block' />
            <BreadcrumbItem className='hidden shrink-0 md:inline-flex'>
              <CrumbContent crumb={crumb} />
            </BreadcrumbItem>
          </Fragment>
        ))}

        {last && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem className='min-w-0'>
              <BreadcrumbPage className='truncate'>{last.label}</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  )
}

/** An ancestor crumb: a link where the nav gives it a URL, plain text otherwise. */
function CrumbContent({ crumb }: { crumb: Crumb }) {
  if (!crumb.url) return <span className='truncate'>{crumb.label}</span>

  return (
    <BreadcrumbLink asChild>
      <Link to={crumb.url}>{crumb.label}</Link>
    </BreadcrumbLink>
  )
}
