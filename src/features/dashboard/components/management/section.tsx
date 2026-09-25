import { useId } from 'react'

/** A titled band of the Management tab: one area of the statistics. */
export function Section({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  const id = useId()
  return (
    <section className='space-y-3' aria-labelledby={id}>
      <div>
        <h2 id={id} className='text-base font-semibold'>
          {title}
        </h2>
        <p className='text-sm text-muted-foreground'>{description}</p>
      </div>
      {children}
    </section>
  )
}
