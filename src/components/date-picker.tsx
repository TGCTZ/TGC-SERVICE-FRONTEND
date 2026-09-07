import { format } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

type DatePickerProps = {
  selected: Date | undefined
  onSelect: (date: Date | undefined) => void
  placeholder?: string
}

/**
 * A single-date picker in a popover.
 *
 * **Future dates and anything before 1900 are disabled**, because every
 * current caller picks a date in the past — a birth date, a filter bound. If
 * you need a future date (a due date, a scheduled publish), this component is
 * the wrong one until that range is made configurable.
 *
 * Displays as `MMM d, yyyy`. Money and dates elsewhere go through
 * `lib/format.ts`; this predates it and formats inline.
 *
 * @param props.selected - The chosen date, or undefined for none
 * @param props.onSelect - Receives the new date, or undefined when cleared
 * @param props.placeholder - Trigger text while nothing is selected
 */
export function DatePicker({
  selected,
  onSelect,
  placeholder = 'Pick a date',
}: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          data-empty={!selected}
          className='w-60 justify-start text-start font-normal data-[empty=true]:text-muted-foreground'
        >
          {selected ? (
            format(selected, 'MMM d, yyyy')
          ) : (
            <span>{placeholder}</span>
          )}
          <CalendarIcon className='ms-auto h-4 w-4 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-auto p-0'>
        <Calendar
          mode='single'
          captionLayout='dropdown'
          selected={selected}
          onSelect={onSelect}
          disabled={(date: Date) =>
            date > new Date() || date < new Date('1900-01-01')
          }
        />
      </PopoverContent>
    </Popover>
  )
}
