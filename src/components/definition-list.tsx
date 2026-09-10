import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

type Definition = {
  label: string
  value: ReactNode
  /** Span both columns, for a long value such as a raw payload. */
  wide?: boolean
}

/**
 * Label/value pairs for a record nobody can edit.
 *
 * Read-only resources — bills, payments, certificates — have no form to show,
 * and a disabled form is a poor stand-in: it implies the fields would be
 * editable given the right permission, when in fact the API accepts no writes
 * at all. A definition list says "this is a record" rather than "this is a form
 * you cannot use".
 *
 * An entry whose value is null or an empty string renders an em dash, so a
 * missing field still occupies its row and the layout stays stable.
 */
export function DefinitionList({
  items,
  className,
}: {
  items: Definition[]
  className?: string
}) {
  return (
    <dl className={cn('grid gap-x-6 gap-y-3 sm:grid-cols-2', className)}>
      {items.map((item) => (
        <div
          key={item.label}
          className={cn('space-y-1', item.wide && 'sm:col-span-2')}
        >
          <dt className='text-xs text-muted-foreground'>{item.label}</dt>
          <dd className='text-sm break-words'>
            {item.value === null ||
            item.value === undefined ||
            item.value === '' ? (
              <span className='text-muted-foreground'>—</span>
            ) : (
              item.value
            )}
          </dd>
        </div>
      ))}
    </dl>
  )
}
