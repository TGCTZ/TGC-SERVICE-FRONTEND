import { createContext, useContext, useState } from 'react'
import { type Stone } from '../data/schema'

/**
 * `statuses` is the stone's own status trail — the domain ledger — as opposed
 * to `history`, which is the generic audit log every record has.
 */
type StonesDialogType =
  | 'view'
  | 'history'
  | 'statuses'
  | 'transition'
  | 'update'
  | 'delete'
  | 'restore'

type StonesContextType = {
  open: StonesDialogType | null
  setOpen: (open: StonesDialogType | null) => void
  currentRow: Stone | null
  setCurrentRow: (row: Stone | null) => void
}

const StonesContext = createContext<StonesContextType | null>(null)

/** Holds which stone dialog is open and which row it acts on. */
export function StonesProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState<StonesDialogType | null>(null)
  const [currentRow, setCurrentRow] = useState<Stone | null>(null)

  return (
    <StonesContext value={{ open, setOpen, currentRow, setCurrentRow }}>
      {children}
    </StonesContext>
  )
}

export function useStones() {
  const context = useContext(StonesContext)

  if (!context) {
    throw new Error('useStones must be used within a StonesProvider')
  }

  return context
}
