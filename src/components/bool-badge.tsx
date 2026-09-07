import { Badge } from '@/components/ui/badge'

/** Shared yes/no rendering, so booleans look the same in every table. */
export function BoolBadge({ value }: { value: boolean }) {
  return (
    <Badge variant={value ? 'default' : 'outline'}>
      {value ? 'Yes' : 'No'}
    </Badge>
  )
}
