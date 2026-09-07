import { createContext, useContext, useState } from 'react'
import { type User } from '../data/schema'

type UsersDialogType =
  | 'view'
  | 'history'
  | 'create'
  | 'update'
  | 'delete'
  | 'restore'

type UsersContextType = {
  open: UsersDialogType | null
  setOpen: (open: UsersDialogType | null) => void
  currentRow: User | null
  setCurrentRow: (row: User | null) => void
}

const UsersContext = createContext<UsersContextType | null>(null)

/**
 * Holds which user dialog is open and which row it acts on, so the table,
 * the toolbar button and the dialogs do not have to thread that state through
 * props.
 */
export function UsersProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState<UsersDialogType | null>(null)
  const [currentRow, setCurrentRow] = useState<User | null>(null)

  return (
    <UsersContext value={{ open, setOpen, currentRow, setCurrentRow }}>
      {children}
    </UsersContext>
  )
}

export function useUsers() {
  const context = useContext(UsersContext)

  if (!context) {
    throw new Error('useUsers must be used within a UsersProvider')
  }

  return context
}
