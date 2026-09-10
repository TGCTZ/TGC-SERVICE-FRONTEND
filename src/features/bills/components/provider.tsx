import { createContext, useContext, useState } from 'react'
import { type Bill } from '../data/schema'

/**
 * A bill is a `ReadOnlyModelViewSet` on the API, so there is nothing to create,
 * edit, delete or restore — the dialog state is narrowed to match.
 */
type BillsDialogType = 'view' | 'history'

type BillsContextType = {
  open: BillsDialogType | null
  setOpen: (open: BillsDialogType | null) => void
  currentRow: Bill | null
  setCurrentRow: (row: Bill | null) => void
}

const BillsContext = createContext<BillsContextType | null>(null)

export function BillsProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState<BillsDialogType | null>(null)
  const [currentRow, setCurrentRow] = useState<Bill | null>(null)

  return (
    <BillsContext value={{ open, setOpen, currentRow, setCurrentRow }}>
      {children}
    </BillsContext>
  )
}

export function useBills() {
  const context = useContext(BillsContext)

  if (!context) {
    throw new Error('useBills must be used within a BillsProvider')
  }

  return context
}
