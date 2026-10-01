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
    // The customer sits here rather than in a column of their own, matching the
    // Orders page: what was certified, which visit it came in on, and whose.
    cell: ({ row }) => {
      const certificate = row.original

      return (
        <div className='min-w-44'>
          {/* The snapshot, not the live stone type: the certificate says what
            it said on the day it was issued. */}
          <div>{certificate.stone_type_snapshot || '—'}</div>
          <div className='text-sm'>
            {certificate.order_reference} · {certificate.stone_label}
          </div>
          {certificate.customer_name && (
            <>
              <LongText className='max-w-48 text-xs'>
                {certificate.customer_name}
              </LongText>
              <div className='text-xs text-muted-foreground'>
                {certificate.customer_phone}
              </div>
            </>
          )}
        </div>
      )
    },
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
