import { createContext, useContext, useState } from 'react'
import { type IdentificationReport } from '../data/schema'

type ReportsDialogType =
  | 'view'
  | 'history'
  | 'create'
  | 'update'
  | 'delete'
  | 'restore'
  | 'finalize'

type ReportsContextType = {
  open: ReportsDialogType | null
  setOpen: (open: ReportsDialogType | null) => void
  currentRow: IdentificationReport | null
  setCurrentRow: (row: IdentificationReport | null) => void
}

const ReportsContext = createContext<ReportsContextType | null>(null)

export function ReportsProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState<ReportsDialogType | null>(null)
  const [currentRow, setCurrentRow] = useState<IdentificationReport | null>(
    null
  )

  return (
    <ReportsContext value={{ open, setOpen, currentRow, setCurrentRow }}>
      {children}
    </ReportsContext>
  )
}

export function useReports() {
  const context = useContext(ReportsContext)

  if (!context) {
    throw new Error('useReports must be used within a ReportsProvider')
  }

  return context
}
