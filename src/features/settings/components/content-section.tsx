import { Separator } from '@/components/ui/separator'
import { brandPanelClassName } from '@/components/layout/brand-panel'

type ContentSectionProps = {
  title: string
  desc: string
  children: React.JSX.Element
}

export function ContentSection({ title, desc, children }: ContentSectionProps) {
  return (
    <section className={`${brandPanelClassName} w-full p-4 sm:p-6`}>
      <div className='space-y-1'>
        <h3 className='text-lg font-medium'>{title}</h3>
        <p className='text-sm text-primary-foreground/80 dark:text-muted-foreground'>
          {desc}
        </p>
      </div>
      <Separator className='my-4' />
      <div className='w-full max-w-xl'>{children}</div>
    </section>
  )
}
