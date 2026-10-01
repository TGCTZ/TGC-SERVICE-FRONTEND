import { type ColumnDef } from '@tanstack/react-table'
import { formatDate, formatTime } from '@/lib/format'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { DataTableColumnHeader } from '@/components/data-table'
import { LongText } from '@/components/long-text'
import { type ActivityLog } from '../data/schema'
import { AuditEventBadge } from './event-badge'

/** Two-letter monogram for the avatar fallback. */
function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export const auditLogsColumns: ColumnDef<ActivityLog>[] = [
  {
    accessorKey: 'created_at',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='When' />
    ),
    cell: ({ row }) => (
      <div className='whitespace-nowrap'>
        <div>{formatDate(row.original.created_at)}</div>
        <div className='text-xs text-muted-foreground'>
          {formatTime(row.original.created_at)}
        </div>
      </div>
    ),
  },
  {
    accessorKey: 'causer_label',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Actor' />
    ),
    enableSorting: false,
    cell: ({ row }) => {
      // causer_label is the name snapshotted at event time, so it still reads
      // correctly after the account is deleted.
      const label = row.original.causer_label ?? 'System'

      return (
        <div className='flex items-center gap-2'>
          <Avatar className='size-7'>
            <AvatarImage src={row.original.causer?.avatar_url ?? undefined} />
            <AvatarFallback className='text-xs'>
              {initials(label)}
            </AvatarFallback>
          </Avatar>
          <span className='whitespace-nowrap'>{label}</span>
        </div>
      )
    },
  },
  {
    accessorKey: 'event',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Event' />
    ),
    cell: ({ row }) => <AuditEventBadge event={row.original.event} />,
  },
  {
    accessorKey: 'subject_label',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Subject' />
    ),
    enableSorting: false,
    cell: ({ row }) => {
      const { subject_name, subject_label, subject_id } = row.original

      if (!subject_name) {
        return <span className='text-muted-foreground'>—</span>
      }

      return (
        <div>
          <LongText className='max-w-48'>{subject_label ?? '—'}</LongText>
          <div className='text-xs text-muted-foreground'>
            {subject_name} #{subject_id}
          </div>
        </div>
      )
    },
  },
]
