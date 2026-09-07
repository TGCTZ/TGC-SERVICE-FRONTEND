import { cn } from '@/lib/utils'

/** A loading placeholder. Size it to the content it stands in for, so the layout does not jump when data arrives. */
function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='skeleton'
      className={cn('animate-pulse rounded-md bg-accent', className)}
      {...props}
    />
  )
}

export { Skeleton }
