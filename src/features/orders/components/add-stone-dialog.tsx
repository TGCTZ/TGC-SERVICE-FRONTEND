import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { hasAnyPermission } from '@/lib/authz'
import { formatMoney } from '@/lib/format'
import { serverMessageOr } from '@/lib/handle-server-error'
import { perm } from '@/lib/permissions'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { lookupOptionsQuery } from '@/features/lookups/data/api'
import { orderStonesQuery, updateStone } from '@/features/stones/data/api'
import { isStoneLocked } from '@/features/stones/data/enums'
import { type Stone } from '@/features/stones/data/schema'
import { addStone, orderQuery } from '../data/api'
import { type Order } from '../data/schema'

type AddStoneDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: Order
}

type StoneTypeOption = {
  id: number
  name: string
}

/**
 * Identify every stone on an order from one list: a row per stone, each with
 * its own type select, saved the moment a type is picked.
 *
 * **Rows exist for stones not yet created.** The order says how many stones
 * came in, so the desk sees the whole order at once rather than one stone at a
 * time - identified rows show their type, the rest are empty.
 *
 * **Empty rows unlock top-down.** The service allocates labels A, B, C… in
 * creation order, so a type picked on row D while C is still empty would be
 * filed as C. Only the next row in line is enabled; the one after it opens as
 * soon as that stone exists.
 *
 * **Identified rows stay editable until billing**, to correct a slip in place.
 * The type is what priced the bill, so a billed stone's row is locked - the
 * API refuses the change regardless.
 *
 * **No weight.** Identification records only the type, because the type is what
 * prices the bill. The stone is weighed at the bench and that weight is
 * recorded with the findings, after payment.
 */
export function AddStoneDialog({
  open,
  onOpenChange,
  order,
}: AddStoneDialogProps) {
  const { data: stoneTypes = [] } = useQuery(lookupOptionsQuery('stone-types'))

  // Live reads rather than the row snapshot the caller handed over: every pick
  // writes, so the rows and the progress have to move with the server.
  const { data: stones = [] } = useQuery({
    ...orderStonesQuery(order.id),
    enabled: open,
  })
  const { data: liveOrder } = useQuery({
    ...orderQuery(order.id),
    enabled: open,
  })
  const current = liveOrder ?? order

  const canAdd = hasAnyPermission(perm('stones', 'add'))
  const canChange = hasAnyPermission(perm('stones', 'change'))

  // Placeholders for the stones still to come. Labelled from the same list the
  // rows render, so a stone and its placeholder can never both claim a label
  // while one query has refetched and the other has not. Mirrors
  // `next_stone_label` in `apps/orders/services/stone.py` (A + count); the
  // label actually written is still the server's.
  const missing = Math.max(0, current.stone_count - stones.length)
  const placeholders = Array.from({ length: missing }, (_, i) =>
    String.fromCharCode(65 + stones.length + i)
  )
  const nextLabel = placeholders[0]

  // One list, not identified rows followed by a separate list of placeholders:
  // React scopes keys to each array, so only a single array lets row "C" keep
  // its state - the pick in flight - as it turns from placeholder into stone.
  const rows = [
    ...stones.map((stone) => ({ label: stone.label, stone })),
    ...placeholders.map((label) => ({ label, stone: null })),
  ]

  const remaining = Math.max(0, current.stone_count - current.identified_count)

  // What the customer is committed to so far: the fee comes from each type's
  // tier. Summed from the lookup, which carries the tier with the type.
  const fees = stones.map((stone) => {
    const option = stoneTypes.find((type) => type.id === stone.stone_type)
    const price = option?.category_detail?.price
    return price === null || price === undefined ? null : Number(price)
  })
  const total = fees.reduce<number>((sum, fee) => sum + (fee ?? 0), 0)
  const unpriced = fees.some((fee) => fee === null)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Capped and scrollable: a many-stone order would otherwise push the
          footer off the bottom of a laptop screen. */}
      <DialogContent className='flex max-h-[90dvh] flex-col overflow-y-auto sm:max-w-md'>
        <DialogHeader className='text-start'>
          <DialogTitle>Identify stones</DialogTitle>
          {/* Saving on pick means there is no Save button to look for, so the
              dialog says so rather than leaving the user hunting for one. */}
          <DialogDescription>
            {current.reference_number} — each stone saves as soon as you pick
            its type. Labels are allocated in order and cannot be changed.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-1.5'>
          <div className='flex items-center justify-between gap-2'>
            <span className='text-sm font-medium'>Identification progress</span>
            <span className='text-xs text-muted-foreground tabular-nums'>
              {current.identified_count} of {current.stone_count} identified
              {remaining > 0 && ` · ${remaining} to go`}
            </span>
          </div>
          <Progress
            value={current.identified_count}
            max={current.stone_count}
            label={`Identification progress for ${current.reference_number}`}
          />
        </div>

        <ul className='divide-y rounded-md border'>
          {rows.map(({ label, stone }) => {
            const locked = stone ? isStoneLocked(stone) : false
            const waiting = !stone && label !== nextLabel
            return (
              <StoneTypeRow
                key={label}
                orderId={order.id}
                label={label}
                stone={stone}
                stoneTypes={stoneTypes}
                disabled={stone ? !canChange || locked : !canAdd || waiting}
                disabledHint={
                  locked
                    ? 'Billed - its type priced the bill'
                    : waiting
                      ? `After stone ${nextLabel}`
                      : undefined
                }
              />
            )
          })}
        </ul>

        {stones.length > 0 && (
          <div className='flex items-center justify-between gap-2 text-sm'>
            <span className='text-muted-foreground'>Identification fees</span>
            <span className='font-medium tabular-nums'>
              {formatMoney(total)}
              {unpriced && (
                <span className='ms-1 text-xs font-normal text-muted-foreground'>
                  + a tier with no fee set
                </span>
              )}
            </span>
          </div>
        )}

        <DialogFooter>
          {/* Every pick has already been saved, so there is nothing to confirm
              or cancel - only to close. */}
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

type StoneTypeRowProps = {
  orderId: number
  label: string
  /** The recorded stone, or null for one not yet identified. */
  stone: Stone | null
  stoneTypes: StoneTypeOption[]
  disabled: boolean
  /** Why the row is disabled, when that is not just a missing permission. */
  disabledHint?: string
}

/**
 * One stone's type select. Picking a type saves it: creating the stone on an
 * empty row, retyping it on an identified one.
 */
function StoneTypeRow({
  orderId,
  label,
  stone,
  stoneTypes,
  disabled,
  disabledHint,
}: StoneTypeRowProps) {
  const queryClient = useQueryClient()
  // The type being saved, shown in the select until the server answers - so
  // the choice does not appear to snap back while the request is in flight.
  const [pendingType, setPendingType] = useState<string | null>(null)

  const saved = stone?.stone_type ? String(stone.stone_type) : undefined

  const mutation = useMutation({
    mutationFn: (typeId: string) =>
      stone
        ? updateStone(stone.id, { stone_type: Number(typeId) })
        : addStone(orderId, { stone_type: Number(typeId) }),
    // Returned, so the mutation stays pending until the rows have refetched.
    // Clearing the pending value any earlier would flash the old type (or an
    // empty select) for the moment before the new data lands.
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['worklist'] })
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: ['stones'] }),
        queryClient.invalidateQueries({ queryKey: ['orders'] }),
      ])
    },
    onError: (error) =>
      toast.error(
        stone
          ? `Stone ${label} was not changed`
          : `Stone ${label} was not identified`,
        {
          description: serverMessageOr(
            error,
            'Something went wrong and nothing was saved. Please try again.'
          ),
        }
      ),
    // On failure this is what reverts the select to the saved type.
    onSettled: () => setPendingType(null),
  })

  function pick(typeId: string) {
    if (typeId === saved) return
    setPendingType(typeId)
    mutation.mutate(typeId)
  }

  return (
    <li className='flex items-center gap-3 p-2.5 text-sm'>
      <span className='w-16 shrink-0 font-medium'>Stone {label}</span>
      <Select
        value={pendingType ?? saved}
        onValueChange={pick}
        disabled={disabled || mutation.isPending}
      >
        <SelectTrigger
          className='h-8 min-w-0 flex-1'
          aria-label={`Stone type for stone ${label}`}
          title={disabledHint}
        >
          <SelectValue placeholder={disabledHint ?? 'Select stone type'} />
        </SelectTrigger>
        <SelectContent>
          {stoneTypes.map((type) => (
            <SelectItem key={type.id} value={String(type.id)}>
              {type.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {/* A fixed slot, so rows stay aligned whether or not they have a mark. */}
      <span className='flex size-4 shrink-0 items-center justify-center'>
        {mutation.isPending ? (
          <Loader2
            className='size-4 animate-spin text-muted-foreground'
            aria-label={`Saving stone ${label}`}
          />
        ) : stone ? (
          <Check
            className='size-4 text-success'
            aria-label={`Stone ${label} identified`}
          />
        ) : null}
      </span>
    </li>
  )
}
