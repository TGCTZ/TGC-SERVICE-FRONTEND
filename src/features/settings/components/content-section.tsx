import { Separator } from '@/components/ui/separator'
import { brandPanelClassName } from '@/components/layout/brand-panel'

type ContentSectionProps = {
  title: string
  desc: string
  children: React.JSX.Element
}

export function ContentSection({ title, desc, children }: ContentSectionProps) {
  return (
    <div
      className={`${brandPanelClassName} flex flex-1 flex-col p-4 dark:rounded-none dark:border-transparent dark:bg-transparent dark:p-0 dark:text-foreground dark:shadow-none`}
    >
      <div className='flex-none'>
        <h3 className='text-lg font-medium'>{title}</h3>
        <p className='text-sm text-primary-foreground/80 dark:text-muted-foreground'>
          {desc}
        </p>
      </div>
      <Separator className='my-4 flex-none' />
      <div className='faded-bottom h-full w-full overflow-y-auto scroll-smooth pe-4 pb-12'>
        <div className='-mx-1 px-1.5 lg:max-w-xl'>{children}</div>
      </div>
    </div>
  )
}
