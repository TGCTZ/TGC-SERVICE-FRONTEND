import { Badge } from '@/components/ui/badge'

/**
 * Colour by consequence, not by category: destructive events must be scannable
 * in a long list, and a privilege change is the one an auditor is hunting for.
 */
const variants: Record<string, string> = {
  created:
    'border-emerald-600/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  registered:
    'border-emerald-600/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  restored:
    'border-emerald-600/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  updated: 'border-sky-600/40 bg-sky-500/10 text-sky-700 dark:text-sky-400',
  login: 'border-sky-600/40 bg-sky-500/10 text-sky-700 dark:text-sky-400',
  logout: 'border-muted-foreground/30 bg-muted text-muted-foreground',
  deleted: 'border-destructive/40 bg-destructive/10 text-destructive',
  force_deleted: 'border-destructive/40 bg-destructive/10 text-destructive',
  password_changed:
    'border-amber-600/40 bg-amber-500/10 text-amber-700 dark:text-amber-400',
  password_change_failed:
    'border-destructive/40 bg-destructive/10 text-destructive',
  login_failed: 'border-destructive/40 bg-destructive/10 text-destructive',
  permissions_synced:
    'border-amber-600/40 bg-amber-500/10 text-amber-700 dark:text-amber-400',
  roles_synced:
    'border-amber-600/40 bg-amber-500/10 text-amber-700 dark:text-amber-400',
}

export function AuditEventBadge({ event }: { event: string }) {
  return (
    <Badge
      variant='outline'
      className={
        variants[event] ??
        'border-muted-foreground/30 bg-muted text-muted-foreground'
      }
    >
      {event.replace(/_/g, ' ')}
    </Badge>
  )
}
