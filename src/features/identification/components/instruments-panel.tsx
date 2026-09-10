import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { serverMessageOr } from '@/lib/handle-server-error'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { lookupOptionsQuery } from '@/features/lookups/data/api'
import {
  addInstrumentUsed,
  removeInstrumentUsed,
  reportInstrumentsQuery,
} from '../data/api'

type InstrumentsPanelProps = {
  reportId: number
  /** Finalized reports (and read-only views) accept no changes. */
  readOnly?: boolean
}

/**
 * The instruments a report's readings came from.
 *
 * A sub-resource, not a field: `instruments_used` is read-only on the report
 * serializer and each row is written through `/instruments-used/`. So this
 * panel saves immediately rather than joining the report form's submit — a
 * reading is recorded at the bench as it is taken.
 *
 * The API applies the finalize lock here too, refusing writes once the report
 * is locked; `readOnly` mirrors that so the controls disappear rather than
 * failing.
 */
export function InstrumentsPanel({
  reportId,
  readOnly = false,
}: InstrumentsPanelProps) {
  const queryClient = useQueryClient()
  const [instrument, setInstrument] = useState('')
  const [reading, setReading] = useState('')

  const { data: instruments = [] } = useQuery(lookupOptionsQuery('instruments'))
  const {
    data: rows,
    isPending,
    isError,
  } = useQuery(reportInstrumentsQuery(reportId))

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['instruments-used', reportId] })
    queryClient.invalidateQueries({ queryKey: ['identification-reports'] })
  }

  const addMutation = useMutation({
    mutationFn: () => addInstrumentUsed(reportId, Number(instrument), reading),
    onSuccess: () => {
      setInstrument('')
      setReading('')
      invalidate()
    },
    onError: (error) =>
      toast.error(
        serverMessageOr(
          error,
          'Could not add the instrument. Please try again.'
        )
      ),
  })

  const removeMutation = useMutation({
    mutationFn: (id: number) => removeInstrumentUsed(id),
    onSuccess: invalidate,
    onError: (error) =>
      toast.error(
        serverMessageOr(error, 'Could not remove it. Please try again.')
      ),
  })

  return (
    <div className='space-y-3'>
      <h3 className='text-sm font-medium'>Instruments used</h3>

      {isPending && <Skeleton className='h-16 w-full' />}

      {isError && (
        <p className='text-sm text-destructive'>
          Could not load the instruments.
        </p>
      )}

      {!isPending && !isError && rows?.length === 0 && (
        <p className='rounded-md border border-dashed p-4 text-sm text-muted-foreground'>
          No readings recorded.
        </p>
      )}

      {rows && rows.length > 0 && (
        <ul className='divide-y rounded-md border'>
          {rows.map((row) => (
            <li
              key={row.id}
              className='flex items-center justify-between gap-2 p-3'
            >
              <div>
                <div className='font-medium'>
                  {row.instrument_detail?.name ??
                    `Instrument ${row.instrument}`}
                </div>
                <div className='text-xs text-muted-foreground'>
                  {row.reading || 'No reading noted'}
                </div>
              </div>

              {!readOnly && (
                <Button
                  type='button'
                  variant='ghost'
                  size='icon'
                  aria-label={`Remove ${row.instrument_detail?.name ?? 'instrument'}`}
                  disabled={removeMutation.isPending}
                  onClick={() => removeMutation.mutate(row.id)}
                >
                  <Trash2 className='size-4 text-destructive' />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      {!readOnly && (
        <div className='grid grid-cols-[1fr_1fr_auto] items-end gap-2'>
          <div className='space-y-1'>
            <Label htmlFor='instrument-select' className='text-xs'>
              Instrument
            </Label>
            <Select value={instrument} onValueChange={setInstrument}>
              <SelectTrigger id='instrument-select' className='w-full'>
                <SelectValue placeholder='Select' />
              </SelectTrigger>
              <SelectContent>
                {instruments.map((option) => (
                  <SelectItem key={option.id} value={String(option.id)}>
                    {option.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-1'>
            <Label htmlFor='instrument-reading' className='text-xs'>
              Reading
            </Label>
            <Input
              id='instrument-reading'
              value={reading}
              onChange={(e) => setReading(e.target.value)}
            />
          </div>

          <Button
            type='button'
            variant='outline'
            disabled={!instrument || addMutation.isPending}
            onClick={() => addMutation.mutate()}
          >
            <Plus className='me-1 size-4' />
            Add
          </Button>
        </div>
      )}
    </div>
  )
}
