import { createContext, useContext, useState } from 'react'
import { type Certificate } from '../data/schema'

/**
 * A certificate is write-once: there is no edit, and no delete or restore in
 * the UI — withdrawing one is `revoke`, which keeps the record and its link.
 */
type CertificatesDialogType = 'view' | 'history' | 'issue' | 'revoke'

type CertificatesContextType = {
  open: CertificatesDialogType | null
  setOpen: (open: CertificatesDialogType | null) => void
  currentRow: Certificate | null
  setCurrentRow: (row: Certificate | null) => void
}

const CertificatesContext = createContext<CertificatesContextType | null>(null)

export function CertificatesProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [open, setOpen] = useState<CertificatesDialogType | null>(null)
  const [currentRow, setCurrentRow] = useState<Certificate | null>(null)

  return (
    <CertificatesContext value={{ open, setOpen, currentRow, setCurrentRow }}>
      {children}
    </CertificatesContext>
  )
}

export function useCertificates() {
  const context = useContext(CertificatesContext)

  if (!context) {
    throw new Error(
      'useCertificates must be used within a CertificatesProvider'
    )
  }

  return context
}
