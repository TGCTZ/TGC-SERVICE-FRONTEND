import { useState } from 'react'
import { Check, ChevronsUpDown, X } from 'lucide-react'
import { isRegion, REGION_ZONES, REGIONS, regionLabel } from '@/lib/regions'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

type RegionSelectProps = Omit<
  React.ComponentProps<typeof Button>,
  'value' | 'onChange'
> & {
  /** A region value, `''` for none, or free text kept from before the list. */
  value: string
  onChange: (value: string) => void
}

/**
 * Pick one of Tanzania's 31 regions by typing part of its name.
 *
 * Grouped Mainland / Zanzibar, and English names match too - "coast" finds
 * Pwani, "pemba north" finds Kaskazini Pemba. A value from before regions were
 * a list is shown as it was typed and flagged, never silently blanked; the
 * form's validation then asks for a region from the list.
 *
 * Extra props go to the trigger button, so it sits inside shadcn's
 * `FormControl` and receives the field's id and aria attributes.
 */
export function RegionSelect({
  value,
  onChange,
  className,
  disabled,
  ...triggerProps
}: RegionSelectProps) {
  const [open, setOpen] = useState(false)
  const unlisted = !!value && !isRegion(value)

  function choose(next: string) {
    onChange(next)
    setOpen(false)
  }

  return (
    // `modal`: inside a dialog, a non-modal popover's list will not scroll -
    // the dialog's scroll lock swallows the wheel.
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <Button
          type='button'
          variant='outline'
          role='combobox'
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'w-full justify-between font-normal',
            !value && 'text-muted-foreground',
            unlisted && 'text-warning-text',
            className
          )}
          {...triggerProps}
        >
          <span className='truncate'>
            {!value
              ? 'Select a region'
              : unlisted
                ? `“${value}” — not a region, pick one`
                : regionLabel(value)}
          </span>
          <ChevronsUpDown className='opacity-50' aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align='start'
        className='w-(--radix-popover-trigger-width) min-w-60 p-0'
      >
        <Command>
          <CommandInput placeholder='Search regions…' />
          <CommandList>
            <CommandEmpty>No region by that name.</CommandEmpty>
            {REGION_ZONES.map(({ zone, label }) => (
              <CommandGroup key={zone} heading={label}>
                {REGIONS.filter((region) => region.zone === zone).map(
                  (region) => {
                    const aliases: readonly string[] =
                      'aliases' in region ? region.aliases : []
                    return (
                      <CommandItem
                        key={region.value}
                        value={region.label}
                        keywords={[...aliases, region.value]}
                        onSelect={() => choose(region.value)}
                      >
                        <Check
                          className={cn(
                            'size-4',
                            region.value === value ? 'opacity-100' : 'opacity-0'
                          )}
                          aria-hidden
                        />
                        {region.label}
                        {aliases[0] && (
                          <span className='ms-auto text-xs text-muted-foreground'>
                            {aliases[0]}
                          </span>
                        )}
                      </CommandItem>
                    )
                  }
                )}
              </CommandGroup>
            ))}
          </CommandList>
          {value && (
            <div className='border-t p-1'>
              <Button
                type='button'
                variant='ghost'
                size='sm'
                className='w-full justify-start text-muted-foreground'
                onClick={() => choose('')}
              >
                <X aria-hidden />
                Clear region
              </Button>
            </div>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  )
}
