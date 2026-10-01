import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { serverMessageOr } from '@/lib/handle-server-error'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
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
 * A checklist of every instrument, switched on for the ones used.
 *
 * A sub-resource, not a field: switching on creates an `/instruments-used/`
 * row and switching off deletes it, immediately rather than on the report
 * form's submit. No reading is recorded — only whether it was used.
 *
 * The API applies the finalize lock here too; `readOnly` mirrors that so the
 * switches are disabled rather than failing.
 */
export function InstrumentsPanel({
  reportId,
  readOnly = false,
}: InstrumentsPanelProps) {
  const queryClient = useQueryClient()

  const options = useQuery(lookupOptionsQuery('instruments'))
  const rows = useQuery(reportInstrumentsQuery(reportId))

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['instruments-used', reportId] })
    queryClient.invalidateQueries({ queryKey: ['identification-reports'] })
  }

  const toggle = useMutation({
    // Resolves to nothing on either branch: the created row is not used here,
    // because `onSettled` refetches the list rather than patching it in.
    mutationFn: async ({
      instrument,
      on,
    }: {
      instrument: number
      on: boolean
    }) => {
      if (on) {
        await addInstrumentUsed(reportId, instrument)
        return
      }
      const row = rows.data?.find((r) => r.instrument === instrument)
      if (row) await removeInstrumentUsed(row.id)
    },
    onSettled: invalidate,
    onError: (error) =>
      toast.error(
        serverMessageOr(
          error,
          'Could not update the instrument. Please try again.'
        )
      ),
  })

  const usedIds = new Set(rows.data?.map((r) => r.instrument))
  // A retired instrument drops out of the lookup but must stay visible on a
  // report that used it.
  const instruments = [
    ...(options.data ?? []),
    ...(rows.data ?? [])
      .filter((r) => !options.data?.some((o) => o.id === r.instrument))
      .map((r) => ({
        id: r.instrument,
        name: r.instrument_detail?.name ?? `Instrument ${r.instrument}`,
      })),
  ]

  return (
    <div className='space-y-3'>
      <h3 className='text-sm font-medium'>Instruments used</h3>

      {(options.isPending || rows.isPending) && (
        <Skeleton className='h-16 w-full' />
      )}

      {(options.isError || rows.isError) && (
        <p className='text-sm text-destructive'>
          Could not load the instruments.
        </p>
      )}

      {options.isSuccess && rows.isSuccess && instruments.length === 0 && (
        <p className='rounded-md border border-dashed p-4 text-sm text-muted-foreground'>
          No instruments are set up.
        </p>
      )}

      {options.isSuccess && rows.isSuccess && instruments.length > 0 && (
        <ul className='divide-y rounded-md border'>
          {instruments.map((instrument) => {
            const id = `instrument-${instrument.id}`
            const pending =
              toggle.isPending && toggle.variables?.instrument === instrument.id
            return (
              <li
                key={instrument.id}
                className='flex items-center justify-between gap-2 px-3'
              >
                {/* The label fills the row, so a click anywhere on it flips the
                    switch it points at. */}
                <Label
                  htmlFor={id}
                  className='flex-1 cursor-pointer py-3 font-medium'
                >
                  {instrument.name}
                </Label>
                <Switch
                  id={id}
                  checked={
                    pending ? toggle.variables!.on : usedIds.has(instrument.id)
                  }
                  disabled={readOnly || pending}
                  onCheckedChange={(on) =>
                    toggle.mutate({ instrument: instrument.id, on })
                  }
                />
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
