import { useState } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import { useQuery } from '@tanstack/react-query'
import {
  Check,
  Loader2,
  Search,
  TriangleAlert,
  UserPlus,
  X,
} from 'lucide-react'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  RequiredMark,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  /** Hides the "New customer" tab: reassigning an order picks an existing one. */
  allowCreate?: boolean
}

/**
 * Find a customer, or register one, without leaving the order form.
 *
 * Both paths are on screen at once, as two tabs. The previous version hid
 * registration inside the search popover, behind typing two characters and
 * then spotting a "Register …" row — capable, but only if you already knew it
 * was there. Reception at intake does not yet know which path the customer
 * needs, so neither path may be the one that has to be discovered.
 *
 * Searching is inline rather than in a popover for the same reason: results
 * stay visible while the registration fields are filled in, so a returning
 * customer can still be spotted and switched to halfway through.
 *
 * Writes two form fields: `mode` (`existing` | `new`) and either `customer` or
 * the flat `first_name`…`address` set. The order dialog maps those onto the
 * API's `customer` / `customer_data`.
 */
export function CustomerPicker({ allowCreate = true }: CustomerPickerProps) {
  const form = useFormContext()
  const [term, setTerm] = useState('')
  const debounced = useDebouncedValue(term, 300)

  const mode = useWatch({ control: form.control, name: 'mode' })
  const customerId = useWatch({ control: form.control, name: 'customer' })
  const [picked, setPicked] = useState<Customer | null>(null)

  const canSearch = debounced.trim().length >= 2
  const { data: matches = [], isFetching } = useQuery({
    ...customerSearchQuery(debounced),
    enabled: canSearch,
  })

  function choose(customer: Customer) {
    setPicked(customer)
    form.setValue('mode', 'existing')
    form.setValue('customer', String(customer.id))
    form.clearErrors(['customer', 'phone'])
  }

  function clearChoice() {
    setPicked(null)
    form.setValue('customer', '')
  }

  /** Switching tabs carries the typed name across, so nothing is retyped. */
  function switchMode(next: string) {
    if (next === 'new') {
      clearChoice()
      form.setValue('mode', 'new')
      if (term.trim()) {
        const { first_name, last_name } = splitName(term)
        form.setValue('first_name', first_name)
        form.setValue('last_name', last_name)
      }
      return
    }

    form.setValue('mode', 'existing')
  }

  // A chosen customer replaces the whole picker: the decision is made, and
  // leaving the search open invites changing it by accident.
  if (mode === 'existing' && customerId) {
    return (
      <FormField
        control={form.control}
        name='customer'
        render={() => (
          <FormItem>
            <FormLabel>Customer</FormLabel>
            <div className='flex items-center justify-between gap-2 rounded-md border bg-muted/40 px-3 py-2'>
              <div className='min-w-0'>
                <div className='truncate text-sm font-medium'>
                  {picked?.full_name ?? 'Customer selected'}
                </div>
                {picked && (
                  <div className='truncate text-xs text-muted-foreground'>
                    {picked.phone}
                    {picked.company_name ? ` · ${picked.company_name}` : ''}
                    {picked.region ? ` · ${picked.region}` : ''}
                  </div>
                )}
              </div>
              <Button
                type='button'
                variant='ghost'
                size='sm'
                onClick={clearChoice}
              >
                <X className='me-1 size-4' />
                Change
              </Button>
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
    )
  }

  if (!allowCreate) {
    return (
      <ExistingCustomerSearch
        term={term}
        onTermChange={setTerm}
        canSearch={canSearch}
        isFetching={isFetching}
        matches={matches}
        onChoose={choose}
        onRegisterInstead={null}
      />
    )
  }

  return (
    <FormField
      control={form.control}
      name='customer'
      render={() => (
        <FormItem>
          <FormLabel>Customer</FormLabel>
          <Tabs value={mode ?? 'existing'} onValueChange={switchMode}>
            <TabsList className='grid w-full grid-cols-2'>
              <TabsTrigger value='existing'>
                <Search className='me-1.5 size-4' />
                Existing customer
              </TabsTrigger>
              <TabsTrigger value='new'>
                <UserPlus className='me-1.5 size-4' />
                New customer
              </TabsTrigger>
            </TabsList>

            <TabsContent value='existing' className='mt-3'>
              <ExistingCustomerSearch
                term={term}
                onTermChange={setTerm}
                canSearch={canSearch}
                isFetching={isFetching}
                matches={matches}
                onChoose={choose}
                onRegisterInstead={() => switchMode('new')}
              />
            </TabsContent>

            <TabsContent value='new' className='mt-3'>
              <NewCustomerFields onUseExisting={choose} />
            </TabsContent>
          </Tabs>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

/**
 * The search half: a plain input with results underneath.
 *
 * `enabled` on the query keeps a one-character term from hitting the API, so
 * the "type at least two characters" hint is the honest state rather than a
 * label over a request already in flight.
 */
function ExistingCustomerSearch({
  term,
  onTermChange,
  canSearch,
  isFetching,
  matches,
  onChoose,
  onRegisterInstead,
}: {
  term: string
  onTermChange: (value: string) => void
  canSearch: boolean
  isFetching: boolean
  matches: Customer[]
  onChoose: (customer: Customer) => void
  /** Null when registration is not on offer, as when reassigning an order. */
  onRegisterInstead: (() => void) | null
}) {
  return (
    <div className='space-y-2'>
      <div className='relative'>
        <Search className='absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
        <Input
          value={term}
          onChange={(e) => onTermChange(e.target.value)}
          placeholder='Search by name, phone or company...'
          className='ps-9'
          autoComplete='off'
        />
        {isFetching && (
          <Loader2 className='absolute end-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground' />
        )}
      </div>

      {!canSearch && (
        <p className='text-xs text-muted-foreground'>
          Type at least two characters to search customers on file.
        </p>
      )}

      {canSearch && matches.length > 0 && (
        <ul className='max-h-56 divide-y overflow-y-auto rounded-md border'>
          {matches.map((customer) => (
            <li key={customer.id}>
              <button
                type='button'
                onClick={() => onChoose(customer)}
                className='flex w-full items-center gap-2 p-2.5 text-start outline-none hover:bg-accent focus-visible:bg-accent'
              >
                <Check className='size-4 shrink-0 text-muted-foreground' />
                <span className='min-w-0'>
                  <span className='block truncate text-sm font-medium'>
                    {customer.full_name}
                  </span>
                  <span className='block truncate text-xs text-muted-foreground'>
                    {customer.phone}
                    {customer.region ? ` · ${customer.region}` : ''}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {canSearch && !isFetching && matches.length === 0 && (
        <div className='flex flex-wrap items-center justify-between gap-2 rounded-md border border-dashed p-3'>
          <span className='text-sm text-muted-foreground'>
            No customer on file matches &ldquo;{term.trim()}&rdquo;.
          </span>
          {onRegisterInstead && (
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={onRegisterInstead}
            >
              <UserPlus className='me-1 size-4' />
              Register them
            </Button>
          )}
        </div>
      )}
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

  const { data: phoneMatches = [] } = useQuery({
    ...customerSearchQuery(debouncedPhone),
    enabled: debouncedPhone.trim().length >= 2,
  })

  // Phone catches a returning customer that a misspelt name would not, and it
  // is the column the API enforces as unique — so a hit here is the difference
  // between a helpful offer and a 400 after the form is filled in.
  const duplicate = phoneMatches.find(
    (candidate) => candidate.phone === debouncedPhone.trim()
  )

  return (
    <div className='space-y-4 rounded-md border border-dashed p-3'>
      <p className='flex items-center gap-2 text-xs text-muted-foreground'>
        <Badge variant='secondary'>New</Badge>
        These details are saved as a new customer record with the order.
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
