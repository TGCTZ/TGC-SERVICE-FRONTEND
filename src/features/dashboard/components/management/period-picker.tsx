import { useState } from 'react'
import {
  differenceInCalendarDays,
  format,
  parseISO,
  startOfMonth,
  startOfToday,
  subMonths,
  subYears,
} from 'date-fns'
import {
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-mobile'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  customRangeProblem,
  type DateRange,
  type Period,
  type PeriodChoice,
  RANGE_GROUPS,
  RANGE_LABELS,
} from '../../data/analytics'
import { formatRange } from '../../data/format'

const iso = (day: Date) => format(day, 'yyyy-MM-dd')

/**
 * The one filter on the tab, above everything it scopes.
 *
 * Presets are rows that apply on click - nobody should fight a calendar for
 * "last 30 days". A custom range sits behind the footer and applies only on
 * Apply, so a half-picked range never sends five requests for the wrong
 * dates. Beside the button the dates are spelled out, with the period the
 * KPIs are compared against: "up 12%" means nothing without "on what".
 */
export function PeriodPicker({
  period,
  previous,
  onChange,
}: {
  period: Period
  previous?: DateRange
  onChange: (choice: PeriodChoice) => void
}) {
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<'presets' | 'custom'>('presets')
  const custom = period.preset === 'custom'

  function toggle(next: boolean) {
    setOpen(next)
    if (next) {
      // Reopen where the reader left off.
      setView(custom ? 'custom' : 'presets')
    }
  }

  function choose(choice: PeriodChoice) {
    onChange(choice)
    setOpen(false)
  }

  return (
    <div className='flex flex-wrap items-center gap-x-4 gap-y-2'>
      <Popover open={open} onOpenChange={toggle}>
        <PopoverTrigger asChild>
          <Button
            variant='outline'
            className='min-w-56 justify-between font-normal'
          >
            <span className='flex items-center gap-2'>
              <CalendarDays className='text-muted-foreground' aria-hidden />
              <span className='sr-only'>Period: </span>
              {custom
                ? formatRange(period.from, period.to)
                : RANGE_LABELS[period.preset as keyof typeof RANGE_LABELS]}
            </span>
            <ChevronDown className='opacity-50' aria-hidden />
          </Button>
        </PopoverTrigger>
        <PopoverContent align='start' className='w-auto p-0'>
          {view === 'presets' ? (
            <PresetList
              selected={period.preset}
              onPreset={(preset) => choose({ preset })}
              onCustom={() => setView('custom')}
            />
          ) : (
            <CustomRange
              // Only a range someone picked is worth editing; a preset's dates
              // would open a year-long selection that is mostly off-screen.
              initial={custom ? period : undefined}
              onBack={() => setView('presets')}
              onCancel={() => setOpen(false)}
              onApply={(range) => choose(range)}
            />
          )}
        </PopoverContent>
      </Popover>

      <p className='text-sm text-muted-foreground'>
        {!custom && formatRange(period.from, period.to)}
        {previous && (
          <span className={cn(!custom && 'block sm:inline')}>
            {!custom && <span className='hidden sm:inline'> · </span>}
            compared with {formatRange(previous.from, previous.to)}
          </span>
        )}
      </p>
    </div>
  )
}

function PresetList({
  selected,
  onPreset,
  onCustom,
}: {
  selected: Period['preset']
  onPreset: (preset: (typeof RANGE_GROUPS)[number][number]) => void
  onCustom: () => void
}) {
  return (
    <div className='w-60'>
      {RANGE_GROUPS.map((group, index) => (
        <div key={index} className={cn('p-1', index > 0 && 'border-t')}>
          {group.map((preset) => (
            <Row
              key={preset}
              selected={selected === preset}
              onClick={() => onPreset(preset)}
            >
              {RANGE_LABELS[preset]}
            </Row>
          ))}
        </div>
      ))}
      <div className='border-t p-1'>
        <Row
          selected={selected === 'custom'}
          onClick={onCustom}
          trailing={<ChevronRight />}
        >
          Custom range…
        </Row>
      </div>
    </div>
  )
}

/** A preset row: hover is a ghost wash, selection a bold check - never both loud. */
function Row({
  selected,
  onClick,
  trailing,
  children,
}: {
  selected: boolean
  onClick: () => void
  trailing?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <button
      type='button'
      aria-current={selected || undefined}
      onClick={onClick}
      className='flex w-full items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-left text-sm outline-none hover:bg-accent/60 focus-visible:bg-accent/60 [&_svg]:size-4'
    >
      {children}
      <span className='flex items-center gap-1 text-muted-foreground'>
        {selected && (
          <Check
            className='text-foreground'
            strokeWidth={3}
            aria-label='Selected'
          />
        )}
        {trailing}
      </span>
    </button>
  )
}

type Edge = 'start' | 'end'

/**
 * Two dates, picked in order: the first click sets the start, the next the
 * end, and the boxes above the calendar say which one the next click sets.
 *
 * The clicks are handled here rather than left to the calendar's own range
 * logic, which moves whichever end is nearer - fine once you know it, baffling
 * the first time. Hovering while the end is being picked previews the range.
 */
function CustomRange({
  initial,
  onBack,
  onCancel,
  onApply,
}: {
  initial?: DateRange
  onBack: () => void
  onCancel: () => void
  onApply: (range: DateRange) => void
}) {
  const today = startOfToday()
  const isMobile = useIsMobile()
  const [start, setStart] = useState(initial && parseISO(initial.from))
  const [end, setEnd] = useState(initial && parseISO(initial.to))
  const [editing, setEditing] = useState<Edge>('start')
  const [hovered, setHovered] = useState<Date>()
  // Two months with the end's month on the right, so today is in view.
  const [month, setMonth] = useState(() =>
    startOfMonth(isMobile ? (end ?? today) : subMonths(end ?? today, 1))
  )

  function pick(day: Date) {
    if (editing === 'start' || !start || day < start) {
      // A new start after the chosen end would make the range run backwards.
      setStart(day)
      if (end && day > end) setEnd(undefined)
      setEditing('end')
    } else {
      setEnd(day)
      setEditing('start')
    }
  }

  function edit(edge: Edge) {
    setEditing(edge)
    const target = edge === 'start' ? start : end
    if (target) {
      setMonth(
        startOfMonth(
          edge === 'end' && !isMobile ? subMonths(target, 1) : target
        )
      )
    }
  }

  const previewing = editing === 'end' && start && hovered && hovered >= start
  const shownEnd = previewing ? hovered : end
  const problem = start && end ? customRangeProblem(start, end) : null

  let hint: string
  if (problem) hint = problem
  else if (!start) hint = 'Click the first day of the range.'
  else if (editing === 'end')
    hint = 'Now click the last day. Click the same day again for a single day.'
  else if (end) {
    const days = differenceInCalendarDays(end, start) + 1
    hint = `${formatRange(iso(start), iso(end))} · ${days} ${days === 1 ? 'day' : 'days'}`
  } else hint = 'Pick the last day.'

  return (
    <div>
      <div className='flex items-center gap-1 border-b px-2 py-1.5'>
        <Button
          variant='ghost'
          size='icon'
          className='size-7'
          onClick={onBack}
          aria-label='Back to the preset periods'
        >
          <ChevronLeft />
        </Button>
        <span className='text-sm font-medium'>Custom range</span>
      </div>

      <div className='grid grid-cols-2 gap-2 px-3 pt-3'>
        <EdgeBox
          label='Start date'
          value={start}
          active={editing === 'start'}
          onClick={() => edit('start')}
        />
        <EdgeBox
          label='End date'
          value={end}
          active={editing === 'end'}
          onClick={() => edit('end')}
        />
      </div>

      <div onMouseLeave={() => setHovered(undefined)}>
        <Calendar
          mode='range'
          selected={{ from: start, to: shownEnd }}
          // The calendar's own idea of the new range is ignored; only which
          // day was clicked matters (see the docstring).
          onSelect={(_, day) => pick(day)}
          onDayMouseEnter={(day) => setHovered(day)}
          month={month}
          onMonthChange={setMonth}
          numberOfMonths={isMobile ? 1 : 2}
          weekStartsOn={1}
          captionLayout='dropdown'
          startMonth={startOfMonth(subYears(today, 5))}
          endMonth={startOfMonth(today)}
          disabled={{ after: today }}
          // The stock in-between wash is --accent, which all but vanishes on
          // the popover surface in dark mode; a primary wash reads in both.
          className='[&_button[data-range-middle=true]]:bg-transparent [&_button[data-range-middle=true]]:text-foreground'
          classNames={{
            range_start: 'rounded-l-md bg-primary/20',
            range_middle: 'rounded-none bg-primary/20',
            range_end: 'rounded-r-md bg-primary/20',
          }}
        />
      </div>

      <div className='flex flex-wrap items-center justify-between gap-3 border-t px-3 py-2'>
        <p
          className={cn(
            'max-w-72 text-xs',
            problem ? 'text-danger-text' : 'text-muted-foreground'
          )}
          aria-live='polite'
        >
          {hint}
        </p>
        <div className='flex gap-2'>
          <Button variant='ghost' size='sm' onClick={onCancel}>
            Cancel
          </Button>
          <Button
            size='sm'
            disabled={!start || !end || problem !== null}
            onClick={() =>
              start && end && onApply({ from: iso(start), to: iso(end) })
            }
          >
            Apply
          </Button>
        </div>
      </div>
    </div>
  )
}

/** One end of the range: what it is, and whether the next click sets it. */
function EdgeBox({
  label,
  value,
  active,
  onClick,
}: {
  label: string
  value: Date | undefined
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type='button'
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'rounded-md border px-3 py-1.5 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
        active ? 'border-primary ring-2 ring-primary/30' : 'hover:bg-accent/60'
      )}
    >
      <span className='block text-xs text-muted-foreground'>{label}</span>
      <span
        className={cn(
          'block text-sm',
          value ? 'font-medium' : 'text-muted-foreground'
        )}
      >
        {value ? format(value, 'EEE d MMM yyyy') : 'Pick a day'}
      </span>
    </button>
  )
}
