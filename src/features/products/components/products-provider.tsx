import { createContext, useContext, useState } from 'react'
import { type Product } from '../data/schema'

type ProductsDialogType =
  | 'view'
  | 'history'
  | 'create'
  | 'update'
  | 'delete'
  | 'restore'

type ProductsContextType = {
  open: ProductsDialogType | null
  setOpen: (open: ProductsDialogType | null) => void
  currentRow: Product | null
  setCurrentRow: (row: Product | null) => void
}

const ProductsContext = createContext<ProductsContextType | null>(null)

/**
 * Holds which product dialog is open and which row it acts on, so the table,
 * the toolbar button and the dialogs do not have to thread that state through
 * props.
 */
export function ProductsProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState<ProductsDialogType | null>(null)
  const [currentRow, setCurrentRow] = useState<Product | null>(null)

  return (
    <ProductsContext value={{ open, setOpen, currentRow, setCurrentRow }}>
      {children}
    </ProductsContext>
  )
}

export function useProducts() {
  const context = useContext(ProductsContext)

  if (!context) {
    throw new Error('useProducts must be used within a ProductsProvider')
  }

  return context
}
