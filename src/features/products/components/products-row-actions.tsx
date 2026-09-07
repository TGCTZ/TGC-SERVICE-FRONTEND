import { DataTableRowActions } from '@/components/data-table'
import { type Product } from '../data/schema'
import { useProductActions } from './use-product-actions'

export function ProductsRowActions({ product }: { product: Product }) {
  return <DataTableRowActions actions={useProductActions(product)} />
}
