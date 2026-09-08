import { useQuery } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { type Meta } from '@/lib/api-query'
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
import { Switch } from '@/components/ui/switch'
import { DataTable, type TableQueryState } from '@/components/data-table'
import { productCategoriesQuery, productStatusesQuery } from '../data/api'
import { type Product } from '../data/schema'
import { productsColumns as columns } from './columns'

export type ProductsQueryState = TableQueryState & {
  categoryId?: number
  statusId?: number
  showDeleted?: boolean
}

type ProductsTableProps = {
  data: Product[]
  meta?: Meta
  isFetching: boolean
  state: ProductsQueryState
  onStateChange: (next: Partial<ProductsQueryState>) => void
  onRowClick: (product: Product) => void
}

export function ProductsTable({
  data,
  meta,
  isFetching,
  state,
  onStateChange,
  onRowClick,
}: ProductsTableProps) {
  const { data: categories = [] } = useQuery(productCategoriesQuery())
  const { data: statuses = [] } = useQuery(productStatusesQuery())

  const hasFilters =
    Boolean(state.search) ||
    Boolean(state.categoryId) ||
    Boolean(state.statusId) ||
    Boolean(state.showDeleted)

  const toolbar = (
    <>
      <Input
        placeholder='Search name, SKU or barcode...'
        value={state.search}
        onChange={(e) => onStateChange({ search: e.target.value, page: 1 })}
        className='h-8 w-full max-w-56'
      />

      <Select
        value={state.categoryId ? String(state.categoryId) : 'all'}
        onValueChange={(value) =>
          onStateChange({
            categoryId: value === 'all' ? undefined : Number(value),
            page: 1,
          })
        }
      >
        <SelectTrigger className='h-8 w-40'>
          <SelectValue placeholder='Category' />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='all'>All categories</SelectItem>
          {categories.map((category) => (
            <SelectItem key={category.id} value={String(category.id)}>
              {category.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={state.statusId ? String(state.statusId) : 'all'}
        onValueChange={(value) =>
          onStateChange({
            statusId: value === 'all' ? undefined : Number(value),
            page: 1,
          })
        }
      >
        <SelectTrigger className='h-8 w-36'>
          <SelectValue placeholder='Status' />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='all'>All statuses</SelectItem>
          {statuses.map((status) => (
            <SelectItem key={status.id} value={String(status.id)}>
              {status.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Deletes are soft, so this is the only route back to a deleted record. */}
      <div className='flex items-center gap-2'>
        <Switch
          id='products-show-deleted'
          checked={Boolean(state.showDeleted)}
          onCheckedChange={(checked) =>
            onStateChange({ showDeleted: checked || undefined, page: 1 })
          }
        />
        <Label
          htmlFor='products-show-deleted'
          className='text-sm font-normal whitespace-nowrap'
        >
          Show deleted
        </Label>
      </div>

      {hasFilters && (
        <Button
          variant='ghost'
          className='h-8 px-2 lg:px-3'
          onClick={() =>
            onStateChange({
              search: '',
              categoryId: undefined,
              statusId: undefined,
              showDeleted: undefined,
              page: 1,
            })
          }
        >
          Reset
          <X className='ms-2 size-4' />
        </Button>
      )}
    </>
  )

  return (
    <DataTable
      columns={columns}
      data={data}
      meta={meta}
      isFetching={isFetching}
      state={state}
      onStateChange={onStateChange}
      onRowClick={onRowClick}
      isRowDeleted={(product) => Boolean(product.deleted_at)}
      toolbar={toolbar}
      emptyMessage='No products found.'
    />
  )
}
