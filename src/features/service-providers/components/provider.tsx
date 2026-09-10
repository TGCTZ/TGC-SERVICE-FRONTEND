import { createContext, useContext, useState } from 'react'
import { type ServiceProvider } from '../data/schema'

type ProvidersDialogType =
  | 'view'
  | 'history'
  | 'create'
  | 'update'
  | 'delete'
  | 'restore'

type ProvidersContextType = {
  open: ProvidersDialogType | null
  setOpen: (open: ProvidersDialogType | null) => void
  currentRow: ServiceProvider | null
  setCurrentRow: (row: ServiceProvider | null) => void
}

const ProvidersContext = createContext<ProvidersContextType | null>(null)

export function ServiceProvidersProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [open, setOpen] = useState<ProvidersDialogType | null>(null)
  const [currentRow, setCurrentRow] = useState<ServiceProvider | null>(null)

  return (
    <ProvidersContext value={{ open, setOpen, currentRow, setCurrentRow }}>
      {children}
    </ProvidersContext>
  )
}

export function useServiceProviders() {
  const context = useContext(ProvidersContext)

  if (!context) {
    throw new Error(
      'useServiceProviders must be used within a ServiceProvidersProvider'
    )
  }

  return context
}
