import { SearchIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSearch } from '@/context/search-provider'
import { Kbd } from '@/components/kbd'
import { Button } from './ui/button'

/**
 * The header control that opens the command palette.
 *
 * A button, not an input — it never receives text. Typing happens in the
 * palette itself, so an input here would be a decoy that swallows the first
 * keystrokes.
 *
 * Advertises its shortcut both visually (a `Kbd` hint, hidden on small
 * screens) and to assistive tech via `aria-keyshortcuts`.
 *
 * @param props.placeholder - The label shown inside the button
 */
export function Search({
  className = '',
  placeholder = 'Search',
  ...props
}: React.ComponentProps<'button'> & { placeholder?: string }) {
  const { setOpen } = useSearch()
  return (
    <Button
      {...props}
      variant='outline'
      className={cn(
        'group relative h-8 w-full flex-1 justify-start rounded-md bg-muted/25 text-sm font-normal text-muted-foreground shadow-none hover:bg-accent sm:w-40 sm:pe-12 md:flex-none lg:w-52 xl:w-64',
        className
      )}
      aria-keyshortcuts='Meta+K Control+K'
      onClick={() => setOpen(true)}
    >
      <SearchIcon
        aria-hidden='true'
        className='absolute inset-s-1.5 top-1/2 -translate-y-1/2'
        size={16}
      />
      <span className='ms-4'>{placeholder}</span>
      <Kbd
        modifier
        className='absolute inset-e-[0.3rem] top-[0.3rem] hidden group-hover:bg-accent sm:inline-flex'
      >
        K
      </Kbd>
    </Button>
  )
}
