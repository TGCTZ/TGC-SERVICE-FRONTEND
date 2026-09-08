import { type ColumnDef } from '@tanstack/react-table'
import { formatMoney } from '@/lib/format'
import { cn } from '@/lib/utils'
import { DataTableColumnHeader } from '@/components/data-table'
import { LongText } from '@/components/long-text'
import { type Product } from '../data/schema'
import { ProductsRowActions } from './row-actions'

export const productsColumns: ColumnDef<Product>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Product' />
    ),
    cell: ({ row }) => (
      <div className='min-w-40'>
        <LongText className='max-w-56 font-medium'>
          {row.original.name}
        </LongText>
        <div className='text-xs text-muted-foreground'>{row.original.sku}</div>
      </div>
    ),
  },
  {
    accessorKey: 'product_category',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Category' />
    ),
    cell: ({ row }) => (
      <span className='text-nowrap'>
        {row.original.product_category_detail?.name ?? '—'}
      </span>
    ),
    enableSorting: false,
  },
  {
    accessorKey: 'price',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Price' />
    ),
    cell: ({ row }) => (
      <div className='text-nowrap tabular-nums'>
        {formatMoney(row.original.price)}
      </div>
    ),
  },
  {
    accessorKey: 'stock_quantity',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Stock' />
    ),
    cell: ({ row }) => {
      const stock = row.original.stock_quantity
      const reorder = row.original.reorder_level ?? 0
      const low = stock <= reorder

      return (
        <span
          className={cn('tabular-nums', low && 'font-medium text-destructive')}
          title={low ? 'At or below reorder level' : undefined}
        >
          {stock}
        </span>
      )
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => <ProductsRowActions product={row.original} />,
  },
]
