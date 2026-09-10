import { createContext, useContext, useState } from 'react'
import { type Order } from '../data/schema'

type OrdersDialogType =
  | 'view'
  | 'history'
  | 'create'
  | 'update'
  | 'delete'
  | 'restore'
  | 'add-stone'
  | 'generate-bill'

type OrdersContextType = {
  open: OrdersDialogType | null
  setOpen: (open: OrdersDialogType | null) => void
  currentRow: Order | null
  setCurrentRow: (row: Order | null) => void
}

const OrdersContext = createContext<OrdersContextType | null>(null)

/** Holds which order dialog is open and which row it acts on. */
export function OrdersProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState<OrdersDialogType | null>(null)
  const [currentRow, setCurrentRow] = useState<Order | null>(null)

  return (
    <OrdersContext value={{ open, setOpen, currentRow, setCurrentRow }}>
      {children}
    </OrdersContext>
  )
}

export function useOrders() {
  const context = useContext(OrdersContext)

  if (!context) {
    throw new Error('useOrders must be used within an OrdersProvider')
  }

  return context
}
