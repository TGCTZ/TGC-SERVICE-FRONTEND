import { createContext, useContext, useEffect, useState } from 'react'
import { CommandMenu } from '@/components/command-menu'

type SearchContextType = {
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
}

const SearchContext = createContext<SearchContextType | null>(null)

type SearchProviderProps = {
  children: React.ReactNode
}

/**
 * Owns the command palette and its `Ctrl`/`Cmd`+`K` shortcut.
 *
 * Renders `<CommandMenu>` itself, so mounting this provider is all that is
 * needed — do not also render the menu, or the shortcut toggles two of them.
 *
 * The listener is on `document` and calls `preventDefault`, which shadows the
 * browser's own Ctrl+K. That is the accepted trade: the palette is the app's
 * primary navigation for keyboard users.
 *
 * @param props.children - The app
 */
export function SearchProvider({ children }: SearchProviderProps) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  return (
    <SearchContext value={{ open, setOpen }}>
      {children}
      <CommandMenu />
    </SearchContext>
  )
}

/**
 * Open or close the command palette from anywhere.
 *
 * @returns The palette's `open` state and its setter
 * @throws If used outside a `SearchProvider`
 */
// eslint-disable-next-line react-refresh/only-export-components
export const useSearch = () => {
  const searchContext = useContext(SearchContext)

  if (!searchContext) {
    throw new Error('useSearch has to be used within SearchProvider')
  }

  return searchContext
}
