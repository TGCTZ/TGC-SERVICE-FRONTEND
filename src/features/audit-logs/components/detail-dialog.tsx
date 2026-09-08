import { formatDateTime } from '@/lib/format'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { DialogBody } from '@/components/dialog-body'
import { type ActivityLog } from '../data/schema'
import { AuditDiff } from './diff'
import { AuditEventBadge } from './event-badge'

type AuditLogDetailDialogProps = {
  log: ActivityLog | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div className='grid grid-cols-3 gap-2 py-1.5 text-sm'>
      <dt className='text-muted-foreground'>{label}</dt>
      <dd className='col-span-2 break-all'>{value ?? '—'}</dd>
    </div>
  )
}

/** Everything recorded about a single event: the diff plus request context. */
export function AuditLogDetailDialog({
  log,
  open,
  onOpenChange,
}: AuditLogDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='flex max-h-[85dvh] flex-col overflow-hidden sm:max-w-3xl'>
        {log && (
          <>
            <DialogHeader className='text-start'>
              <DialogTitle className='flex items-center gap-2'>
                <AuditEventBadge event={log.event} />
                <span>Entry #{log.id}</span>
              </DialogTitle>
              <DialogDescription>{log.description ?? '—'}</DialogDescription>
            </DialogHeader>

            <DialogBody>
              <div className='space-y-6 px-1 pb-2'>
                <section>
                  <h4 className='mb-2 text-sm font-semibold'>Changes</h4>
                  <AuditDiff
                    oldValues={log.old_values}
                    newValues={log.new_values}
                  />
                </section>

                <Separator />

                <section>
                  <h4 className='mb-2 text-sm font-semibold'>Context</h4>
                  <dl className='divide-y'>
                    <Field
                      label='When'
                      value={formatDateTime(log.created_at)}
                    />
                    <Field label='Actor' value={log.causer_label ?? 'System'} />
                    <Field
                      label='Subject'
                      value={
                        log.subject_name
                          ? `${log.subject_name} #${log.subject_id} — ${log.subject_label ?? ''}`
                          : null
                      }
                    />
                    <Field label='IP address' value={log.ip_address} />
                    <Field
                      label='Request'
                      value={
                        log.method ? `${log.method} ${log.url ?? ''}` : null
                      }
                    />
                    <Field label='User agent' value={log.user_agent} />
                    {/* Ties together every row written by the same request. */}
                    <Field label='Batch' value={log.batch_uuid} />
                  </dl>
                </section>
              </div>
            </DialogBody>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
