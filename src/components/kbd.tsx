import { cn } from '@/lib/utils'

/**
 * True on Apple platforms.
 *
 * Resolved once at module load rather than per render: the platform cannot
 * change during a session, and this way the value is a constant the compiler
 * can inline. Defaults to false (so hints read "Ctrl") when detection is
 * inconclusive or there is no `navigator` at all — this app's audience is
 * predominantly on PCs, so that is the right guess to be wrong with.
 */
const isMac =
  typeof navigator !== 'undefined' &&
  /mac|iphone|ipad|ipod/i.test(navigator.userAgent)

/** The modifier glyph for this platform: ⌘ on Apple, Ctrl elsewhere. */
const modifierKey = isMac ? '⌘' : 'Ctrl'

type KbdProps = {
  /** Keys to show after the modifier, e.g. 'K'. */
  children: React.ReactNode
  /** Prefix with the platform modifier. */
  modifier?: boolean
  className?: string
}

/**
 * A keyboard shortcut hint.
 *
 * Centralised so no screen can hardcode ⌘ for a Windows user again; the
 * handlers themselves already accept both (`e.metaKey || e.ctrlKey`).
 */
export function Kbd({ children, modifier = false, className }: KbdProps) {
  return (
    <kbd
      className={cn(
        'pointer-events-none inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium select-none',
        className
      )}
    >
      {modifier && (
        <span className={isMac ? 'text-xs' : undefined}>{modifierKey}</span>
      )}
      {children}
    </kbd>
  )
}
