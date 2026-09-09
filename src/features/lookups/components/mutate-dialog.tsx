import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { handleServerError } from '@/lib/handle-server-error'
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
import { RequiredMark } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Can } from '@/components/can'
import { type RowAction } from '@/components/data-table'
import { ViewFooterActions } from '@/components/view-footer-actions'
import { createLookupRow, updateLookupRow } from '../data/api'
import { type LookupConfig, type LookupRow } from '../data/config'

type LookupMutateDialogProps = {
  config: LookupConfig
  currentRow: LookupRow | null
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Render the same form as a read-only view. */
  readOnly?: boolean
  /** Switches a read-only view into edit mode, when the user may edit. */
  onRequestEdit?: () => void
  /** The record's row actions, shown in the footer of the read-only view. */
  actions?: RowAction[]
}

/**
 * Create/edit form for any lookup.
 *
 * Fields beyond the shared three come from the config's `extraFields`, so a new
 * lookup needs a config entry rather than a new dialog.
 */
export function LookupMutateDialog({
  config,
  currentRow,
  open,
  onOpenChange,
  readOnly = false,
  onRequestEdit,
  actions = [],
}: LookupMutateDialogProps) {
  const queryClient = useQueryClient()
  const isEdit = currentRow !== null

  // Seeded from the row on mount; the parent remounts via `key` when the row
  // changes, so no effect is needed to keep this in sync.
  const [values, setValues] = useState<Record<string, unknown>>(() => ({
    name: currentRow?.name ?? '',
    description: currentRow?.description ?? '',
    is_active: currentRow?.is_active ?? true,
    ...Object.fromEntries(
      config.extraFields.map((field) => [
        field.key,
        (currentRow as Record<string, unknown> | null)?.[field.key] ?? '',
      ])
    ),
  }))

  const mutation = useMutation({
    mutationFn: () => {
      // Blank optional fields are dropped rather than sent as "", which the
      // API would treat as a real value on a nullable column.
      const payload = Object.fromEntries(
        Object.entries(values).filter(([, value]) => value !== '')
      )

      return isEdit
        ? updateLookupRow(config.resource, currentRow.id, payload)
        : createLookupRow(config.resource, payload)
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Changes saved' : `Created "${values.name}"`)
      queryClient.invalidateQueries({ queryKey: ['lookups', config.resource] })
      // The product forms read these lists too, so refresh their cache.
      queryClient.invalidateQueries({ queryKey: ['lookup'] })
      onOpenChange(false)
    },
    onError: (error) => {
      handleServerError(error)
    },
  })

  function set(key: string, value: unknown) {
    setValues((previous) => ({ ...previous, [key]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader className='text-start'>
          <DialogTitle>
            {readOnly
              ? currentRow?.name
              : `${isEdit ? 'Edit' : 'Add'} ${config.title.toLowerCase()}`}
          </DialogTitle>
          <DialogDescription>
            {readOnly
              ? 'Viewing the record. Choose Edit to make changes.'
              : config.description}
          </DialogDescription>
        </DialogHeader>

        {/* One fieldset disables every control, Radix triggers included. */}
        <fieldset disabled={readOnly} className='space-y-4'>
          <div className='space-y-2'>
            {/* Not a react-hook-form form, so the marker cannot be derived. */}
            <Label htmlFor='lookup-name'>
              Name
              <RequiredMark />
            </Label>
            <Input
              id='lookup-name'
              required
              value={String(values.name ?? '')}
              onChange={(e) => set('name', e.target.value)}
            />
          </div>

          {config.extraFields.map((field) => (
            <div key={field.key} className='space-y-2'>
              <Label htmlFor={`lookup-${field.key}`}>{field.label}</Label>
              <Input
                id={`lookup-${field.key}`}
                type={field.type === 'color' ? 'color' : 'text'}
                placeholder={field.placeholder}
                value={String(values[field.key] ?? '')}
                onChange={(e) => set(field.key, e.target.value)}
                className={field.type === 'color' ? 'h-9 w-20 p-1' : undefined}
              />
            </div>
          ))}

          <div className='space-y-2'>
            <Label htmlFor='lookup-description'>Description</Label>
            <Textarea
              id='lookup-description'
              rows={3}
              value={String(values.description ?? '')}
              onChange={(e) => set('description', e.target.value)}
            />
          </div>

          <div className='flex items-center gap-2'>
            <Switch
              id='lookup-active'
              checked={Boolean(values.is_active)}
              onCheckedChange={(checked) => set('is_active', checked)}
            />
            <Label htmlFor='lookup-active' className='font-normal'>
              Active
            </Label>
          </div>
        </fieldset>

        <DialogFooter>
          {readOnly ? (
            <ViewFooterActions
              actions={actions}
              primary={
                onRequestEdit && (
                  <Can permission={perm(config.resource, 'change')}>
                    <Button onClick={onRequestEdit}>
                      <Pencil className='me-1 size-4' />
                      Edit
                    </Button>
                  </Can>
                )
              }
            />
          ) : (
            <>
              <Button variant='outline' onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => mutation.mutate()}
                disabled={
                  !String(values.name ?? '').trim() || mutation.isPending
                }
              >
                {mutation.isPending ? 'Saving...' : 'Save'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
