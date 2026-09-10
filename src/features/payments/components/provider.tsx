import { createContext, useContext, useState } from 'react'
import { type Payment } from '../data/schema'

/** Payments are written only by the gateway, so viewing is all there is. */
type PaymentsDialogType = 'view' | 'history'

type PaymentsContextType = {
  open: PaymentsDialogType | null
  setOpen: (open: PaymentsDialogType | null) => void
  currentRow: Payment | null
  setCurrentRow: (row: Payment | null) => void
}

const PaymentsContext = createContext<PaymentsContextType | null>(null)

export function PaymentsProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState<PaymentsDialogType | null>(null)
  const [currentRow, setCurrentRow] = useState<Payment | null>(null)

  return (
    <PaymentsContext value={{ open, setOpen, currentRow, setCurrentRow }}>
      {children}
    </PaymentsContext>
  )
}

export function usePayments() {
  const context = useContext(PaymentsContext)

  if (!context) {
    throw new Error('usePayments must be used within a PaymentsProvider')
  }

  return context
}
