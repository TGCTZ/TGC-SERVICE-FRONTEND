import { useCanGoBack, useRouter } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

/**
 * Steps back through **browser history**, not up the navigation tree.
 *
 * That distinction is the point of pairing it with the breadcrumb: the trail
 * says where the page *sits*, this says where the user *came from*, and on a
 * deep link or an external referral the two disagree. Do not reimplement it as
 * "go to the parent crumb".
 *
 * Disabled rather than hidden at the history root, so the header's geometry
 * does not shift under the pointer on the session's first navigation — and so
 * the control still says there is nowhere back to go.
 *
 * @param props.className - Extra classes, merged after the defaults
 * @example
 * <BackButton />
 */
export function BackButton({
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  const { history } = useRouter()
  const canGoBack = useCanGoBack()

  return (
    <Button
      variant='outline'
      size='icon'
      className={cn('size-7 max-md:scale-125', className)}
      disabled={!canGoBack}
      onClick={() => history.go(-1)}
      {...props}
    >
      <ArrowLeft className='rtl:rotate-180' aria-hidden='true' />
      <span className='sr-only'>Go back</span>
    </Button>
  )
}
