import { DataTableRowActions } from '@/components/data-table'
import { type Product } from '../data/schema'
import { useProductActions } from '../hooks/use-actions'

export function ProductsRowActions({ product }: { product: Product }) {
  return <DataTableRowActions actions={useProductActions(product)} />
}
