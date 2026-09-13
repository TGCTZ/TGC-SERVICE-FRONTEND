import { useState } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import { useQuery } from '@tanstack/react-query'
import { Check, ChevronsUpDown, TriangleAlert, UserPlus } from 'lucide-react'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
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
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  RequiredMark,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { customerSearchQuery } from '@/features/customers/data/api'
import { type Customer } from '@/features/customers/data/schema'

/**
 * Split what reception typed into a first and last name.
 *
 * A best-effort seed for the registration fields, not a parser: everything
 * after the first space becomes the surname, and the receptionist corrects it
 * if that is wrong. The point is that a name already typed once is not typed
 * again.
 */
function splitName(term: string): { first_name: string; last_name: string } {
  const [first = '', ...rest] = term.trim().split(/\s+/)
  return { first_name: first, last_name: rest.join(' ') }
}

type CustomerPickerProps = {
  /** Hides "register a new customer": reassigning an order picks an existing one. */
  allowCreate?: boolean
  readOnly?: boolean
}

/**
 * Find a customer, or register one, without leaving the order form.
 *
 * Replaces a `<Select>` of every customer. That dropdown made a returning
 * customer easy to miss, and missing one meant registering them a second time
 * and asking for details already on file — which is the problem this solves.
 *
 * Writes two form fields: `mode` (`existing` | `new`) and either `customer` or
 * the flat `first_name`…`address` set. The order dialog maps those onto the
 * API's `customer` / `customer_data`.
 */
export function CustomerPicker({
  allowCreate = true,
  readOnly = false,
}: CustomerPickerProps) {
  const form = useFormContext()
  const [open, setOpen] = useState(false)
  const [term, setTerm] = useState('')
  const debounced = useDebouncedValue(term, 300)

  const mode = useWatch({ control: form.control, name: 'mode' })
  const customerId = useWatch({ control: form.control, name: 'customer' })
  const [picked, setPicked] = useState<Customer | null>(null)

  const { data: matches = [], isFetching } = useQuery(
    customerSearchQuery(debounced)
  )

  function choose(customer: Customer) {
    setPicked(customer)
    form.setValue('mode', 'existing')
    form.setValue('customer', String(customer.id))
    form.clearErrors(['customer', 'phone'])
    setOpen(false)
  }

  function register() {
    setPicked(null)
    form.setValue('mode', 'new')
    form.setValue('customer', '')
    const { first_name, last_name } = splitName(term)
    form.setValue('first_name', first_name)
    form.setValue('last_name', last_name)
    setOpen(false)
  }

  // An existing customer already chosen: show who, and a way to change it.
  if (mode === 'existing' && customerId) {
    return (
      <FormField
        control={form.control}
        name='customer'
        render={() => (
          <FormItem>
            <FormLabel>Customer</FormLabel>
            <div className='flex items-center justify-between gap-2 rounded-md border px-3 py-2'>
              <span className='truncate text-sm'>
                {picked
                  ? `${picked.full_name} · ${picked.phone}`
                  : 'Customer selected'}
              </span>
              {!readOnly && (
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  onClick={() => {
                    setPicked(null)
                    form.setValue('customer', '')
                  }}
                >
                  Change
                </Button>
              )}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
    )
  }

  return (
    <div className='space-y-4'>
      <FormField
        control={form.control}
        name='customer'
        render={() => (
          <FormItem className='flex flex-col'>
            <FormLabel>Customer</FormLabel>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    type='button'
                    variant='outline'
                    role='combobox'
                    className='w-full justify-between font-normal'
                  >
                    {mode === 'new'
                      ? 'Registering a new customer'
                      : 'Search customer by name or phone...'}
                    <ChevronsUpDown className='ms-2 size-4 shrink-0 opacity-50' />
                  </Button>
                </FormControl>
              </PopoverTrigger>

              {/* shouldFilter={false}: the API does the matching, not cmdk. */}
              <PopoverContent
                className='w-(--radix-popover-trigger-width) p-0'
                align='start'
              >
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder='Name, phone, company...'
                    value={term}
                    onValueChange={setTerm}
                  />
                  <CommandList>
                    {term.trim().length < 2 && (
                      <CommandEmpty>Type at least two characters.</CommandEmpty>
                    )}
                    {term.trim().length >= 2 &&
                      !isFetching &&
                      matches.length === 0 && (
                        <CommandEmpty>No customer on file.</CommandEmpty>
                      )}

                    {matches.length > 0 && (
                      <CommandGroup heading='On file'>
                        {matches.map((customer) => (
                          <CommandItem
                            key={customer.id}
                            value={String(customer.id)}
                            onSelect={() => choose(customer)}
                          >
                            <Check
                              className={
                                String(customer.id) === customerId
                                  ? 'me-2 size-4'
                                  : 'me-2 size-4 opacity-0'
                              }
                            />
                            <span className='truncate'>
                              {customer.full_name} · {customer.phone}
                              {customer.region ? ` · ${customer.region}` : ''}
                            </span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}

                    {allowCreate && term.trim().length >= 2 && (
                      <CommandGroup>
                        <CommandItem value='__register__' onSelect={register}>
                          <UserPlus className='me-2 size-4' />
                          Register &ldquo;{term.trim()}&rdquo; as a new customer
                        </CommandItem>
                      </CommandGroup>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <FormMessage />
          </FormItem>
        )}
      />

      {mode === 'new' && <NewCustomerFields onUseExisting={choose} />}
    </div>
  )
}

/**
 * The registration fields, inline in the order form.
 *
 * Inline rather than a nested dialog on purpose: a Radix `Dialog` inside
 * another does not compose — focus trapping and scroll locking fight each
 * other. These are ordinary fields of the order form.
 */
function NewCustomerFields({
  onUseExisting,
}: {
  onUseExisting: (customer: Customer) => void
}) {
  const form = useFormContext()
  const phone = useWatch({ control: form.control, name: 'phone' })
  const debouncedPhone = useDebouncedValue(String(phone ?? ''), 400)

  const { data: phoneMatches = [] } = useQuery(
    customerSearchQuery(debouncedPhone)
  )

  // Phone catches a returning customer that a misspelt name would not, and it
  // is the column the API enforces as unique — so a hit here is the difference
  // between a helpful offer and a 400 after the form is filled in.
  const duplicate = phoneMatches.find(
    (candidate) => candidate.phone === debouncedPhone.trim()
  )

  return (
    <div className='space-y-4 rounded-md border border-dashed p-3'>
      <p className='text-xs text-muted-foreground'>
        New customer. Their details are saved with the order.
      </p>

      {duplicate && (
        <div className='flex flex-wrap items-center justify-between gap-2 rounded-md border border-amber-500/50 bg-amber-500/10 p-3'>
          <span className='text-sm'>
            <TriangleAlert className='me-1 inline size-4' />
            {duplicate.phone} is already registered to {duplicate.full_name}.
          </span>
          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={() => onUseExisting(duplicate)}
          >
            Use this customer instead
          </Button>
        </div>
      )}

      <div className='grid gap-4 sm:grid-cols-2'>
        <TextField name='first_name' label='First name' required />
        <TextField name='last_name' label='Last name' required />
        <TextField name='middle_name' label='Middle name' />
        <TextField name='phone' label='Phone' required />
        <TextField name='email' label='Email' />
        <TextField name='company_name' label='Company' />
        <TextField name='region' label='Region' />
        <TextField name='id_number' label='ID number' />
        <div className='sm:col-span-2'>
          <TextField name='address' label='Address' />
        </div>
      </div>
    </div>
  )
}

/**
 * One registration field.
 *
 * `required` is passed by hand here rather than derived: the schema cannot mark
 * these fields required, because they are only required when `mode` is `new`
 * and that is enforced in a `superRefine` the marker logic cannot read.
 */
function TextField({
  name,
  label,
  required = false,
}: {
  name: string
  label: string
  required?: boolean
}) {
  const form = useFormContext()

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            {label}
            {required && <RequiredMark />}
          </FormLabel>
          <FormControl>
            <Input {...field} value={field.value ?? ''} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
