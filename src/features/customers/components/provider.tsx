import { createContext, useContext, useState } from 'react'
import { type Customer } from '../data/schema'

type CustomersDialogType =
  | 'view'
  | 'history'
  | 'create'
  | 'update'
  | 'delete'
  | 'restore'

type CustomersContextType = {
  open: CustomersDialogType | null
  setOpen: (open: CustomersDialogType | null) => void
  currentRow: Customer | null
  setCurrentRow: (row: Customer | null) => void
}

const CustomersContext = createContext<CustomersContextType | null>(null)

/**
 * Holds which customer dialog is open and which row it acts on, so the table,
 * the toolbar button and the dialogs need not thread that state through props.
 */
export function CustomersProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState<CustomersDialogType | null>(null)
  const [currentRow, setCurrentRow] = useState<Customer | null>(null)

  return (
    <CustomersContext value={{ open, setOpen, currentRow, setCurrentRow }}>
      {children}
    </CustomersContext>
  )
}

export function useCustomers() {
  const context = useContext(CustomersContext)

  if (!context) {
    throw new Error('useCustomers must be used within a CustomersProvider')
  }

  return context
}
