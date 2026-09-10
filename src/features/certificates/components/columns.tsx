import { type ColumnDef } from '@tanstack/react-table'
import { DataTableColumnHeader } from '@/components/data-table'
import { LongText } from '@/components/long-text'
import { type Certificate } from '../data/schema'
import { CertificatesRowActions } from './row-actions'
import { CertificateStatusBadge } from './status-badge'

export const certificatesColumns: ColumnDef<Certificate>[] = [
  {
    accessorKey: 'certificate_number',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Certificate' />
    ),
    cell: ({ row }) => (
      <div className='min-w-44'>
        <div className='font-medium'>{row.original.certificate_number}</div>
        <div className='text-xs text-muted-foreground'>
          From {row.original.report_number ?? '—'}
        </div>
      </div>
    ),
  },
  {
    id: 'stone',
    header: () => <span>Stone</span>,
    enableSorting: false,
    cell: ({ row }) => (
      <div className='min-w-36'>
        {/* The snapshot, not the live stone type: the certificate says what it
          said on the day it was issued. */}
        <div>{row.original.stone_type_snapshot || '—'}</div>
        <div className='text-xs text-muted-foreground'>
          {row.original.order_reference} · {row.original.stone_label}
        </div>
      </div>
    ),
  },
  {
    id: 'customer',
    header: () => <span>Customer</span>,
    enableSorting: false,
    cell: ({ row }) => (
      <LongText className='max-w-44'>
        {row.original.customer_name ?? '—'}
      </LongText>
    ),
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Status' />
    ),
    cell: ({ row }) => <CertificateStatusBadge status={row.original.status} />,
  },
  {
    id: 'actions',
    cell: ({ row }) => <CertificatesRowActions certificate={row.original} />,
  },
]
