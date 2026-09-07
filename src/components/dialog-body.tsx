import { cn } from '@/lib/utils'

/**
 * The scrollable middle region of a dialog.
 *
 * Pair it with a `DialogContent` laid out as
 * `flex max-h-[90dvh] flex-col overflow-hidden`: the header and footer size
 * themselves, and this takes exactly the space left over.
 *
 * Two details carry the whole behaviour:
 *
 * - `min-h-0` — a flex child defaults to `min-height: auto`, which refuses to
 *   shrink below its content. Without this the region grows past the dialog
 *   and the content spills out of the rounded bottom edge.
 * - native `overflow-y-auto` rather than Radix `ScrollArea` — that component's
 *   viewport is `size-full`, so it needs its root to have a *resolved* height.
 *   Under a flex parent constrained only by `max-h` it never gets one, and the
 *   region silently fails to scroll.
 * - `dvh`, not `vh` — on mobile browsers `vh` resolves against the viewport
 *   with the URL bar *hidden*, so while the bar is showing a `90vh` dialog is
 *   taller than the visible area and its footer, holding Save and Delete,
 *   sits below the fold. `dvh` tracks the bar as it shows and hides.
 *
 * The negative margin plus matching padding keeps the scrollbar clear of the
 * content without indenting it away from the dialog's edge.
 */
export function DialogBody({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn('-me-4 min-h-0 flex-1 overflow-y-auto pe-4', className)}>
      {children}
    </div>
  )
}
