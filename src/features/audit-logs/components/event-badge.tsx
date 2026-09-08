import { Badge } from '@/components/ui/badge'

/**
 * Colour by consequence, not by category: destructive events must be scannable
 * in a long list, and a privilege change is the one an auditor is hunting for.
 */
const variants: Record<string, string> = {
  created: 'border-success-border bg-success-subtle text-success-text',
  updated: 'border-info-border bg-info-subtle text-info-text',
  accessed: 'border-muted-foreground/30 bg-muted text-muted-foreground',
  deleted: 'border-danger-border bg-danger-subtle text-danger-text',
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
