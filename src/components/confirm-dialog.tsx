import { cn } from '@/lib/utils'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'

type ConfirmDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: React.ReactNode
  disabled?: boolean
  desc: React.JSX.Element | string
  cancelBtnText?: string
  confirmText?: React.ReactNode
  destructive?: boolean
  isLoading?: boolean
  className?: string
  children?: React.ReactNode
} & (
  | { form: string; handleConfirm?: undefined }
  | { form?: undefined; handleConfirm: () => void }
)

/**
 * A confirmation prompt for an action worth pausing over.
 *
 * Built on `AlertDialog`, not `Dialog` — an alert dialog traps focus and
 * refuses to close on an outside click, which is the point when the next click
 * deletes something.
 *
 * Confirm **either** by handler or by submitting a form, never both: the props
 * are a discriminated union, so pass `handleConfirm` for a plain action, or
 * `form` with a form's id when the dialog wraps inputs that must validate
 * first. Supplying both is a type error.
 *
 * Set `destructive` for deletes; it colours the confirm button.
 *
 * @param props.open - Whether the dialog is shown
 * @param props.onOpenChange - Called when the user dismisses it
 * @param props.title - Heading
 * @param props.desc - Body; say what will happen and whether it can be undone
 * @param props.handleConfirm - Runs on confirm. Mutually exclusive with `form`
 * @param props.form - Id of a form to submit instead. Mutually exclusive with `handleConfirm`
 * @param props.destructive - Renders the confirm button in the destructive variant
 * @param props.isLoading - Disables both buttons while the action is in flight
 * @param props.children - Extra content between the description and the footer
 */
export function ConfirmDialog(props: ConfirmDialogProps) {
  const {
    title,
    desc,
    children,
    className,
    confirmText,
    cancelBtnText,
    destructive,
    isLoading,
    disabled = false,
    form,
    handleConfirm,
    ...actions
  } = props
  return (
    <AlertDialog {...actions}>
      <AlertDialogContent className={cn(className && className)}>
        <AlertDialogHeader className='text-start'>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div>{desc}</div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        {children}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>
            {cancelBtnText ?? 'Cancel'}
          </AlertDialogCancel>
          <Button
            type={form ? 'submit' : 'button'}
            form={form}
            onClick={handleConfirm}
            variant={destructive ? 'destructive' : 'default'}
            disabled={disabled || isLoading}
          >
            {confirmText ?? 'Continue'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
