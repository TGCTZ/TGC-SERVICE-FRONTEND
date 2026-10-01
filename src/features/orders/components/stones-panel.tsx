import { useQuery } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { perm } from '@/lib/permissions'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Can } from '@/components/can'
import { formatWeight } from '@/features/stones/components/columns'
import { StoneStatusBadge } from '@/features/stones/components/status-badge'
import { orderStonesQuery } from '@/features/stones/data/api'
import { isFullyIdentified, type Order } from '../data/schema'

type OrderStonesPanelProps = {
  order: Order
  /** Opens the identification dialog; omitted in read-only contexts. */
  onRegister?: () => void
}

/**
 * The stones identified against one order, read-only.
 *
 * Identification itself is not inline: it goes through `POST /orders/{id}/stones/`
 * so the service allocates the next label and enforces the cap at
 * `stone_count`. This panel only shows what that has produced so far.
 */
export function OrderStonesPanel({ order, onRegister }: OrderStonesPanelProps) {
  const {
    data: stones,
    isPending,
    isError,
  } = useQuery(orderStonesQuery(order.id))
  const isFull = isFullyIdentified(order)

  return (
    <div className='space-y-3'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <div className='min-w-48 flex-1 space-y-1.5'>
          <div className='flex items-center justify-between gap-2'>
            <h3 className='text-sm font-medium'>Stones</h3>
            <p className='text-xs text-muted-foreground tabular-nums'>
              {order.identified_count} of {order.stone_count} identified
              {!isFull &&
                ` · ${order.stone_count - order.identified_count} to go`}
            </p>
          </div>
          <Progress
            value={order.identified_count}
            max={order.stone_count}
            label='Identification progress'
          />
        </div>

        {onRegister && !isFull && (
          <Can permission={perm('stones', 'add')}>
            <Button size='sm' variant='outline' onClick={onRegister}>
              <Plus className='me-1 size-4' />
              Identify stone
            </Button>
          </Can>
        )}
      </div>

      {isPending && <Skeleton className='h-20 w-full' />}

      {isError && (
        <p className='text-sm text-destructive'>Could not load the stones.</p>
      )}

      {!isPending && !isError && stones?.length === 0 && (
        <p className='rounded-md border border-dashed p-4 text-sm text-muted-foreground'>
          No stones identified yet.
        </p>
      )}

      {stones && stones.length > 0 && (
        <ul className='divide-y rounded-md border'>
          {stones.map((stone) => (
            <li
              key={stone.id}
              className='flex flex-wrap items-center justify-between gap-2 p-3'
            >
              <div>
                <div className='font-medium'>{stone.label}</div>
                <div className='text-xs text-muted-foreground'>
                  {stone.stone_type_detail?.name ?? 'Untyped'} ·{' '}
                  {formatWeight(stone)}
                </div>
              </div>
              <StoneStatusBadge status={stone.status} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
