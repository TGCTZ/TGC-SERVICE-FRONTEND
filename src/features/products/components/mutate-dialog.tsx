import { useState } from 'react'
import { z } from 'zod'
import { AxiosError } from 'axios'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { DEFAULT_CURRENCY } from '@/lib/format'
import { perm } from '@/lib/permissions'
import { zodResolver } from '@/lib/zod-resolver'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Can } from '@/components/can'
import { type RowAction } from '@/components/data-table'
import { DialogBody } from '@/components/dialog-body'
import { ViewFooterActions } from '@/components/view-footer-actions'
import {
  brandsQuery,
  createProduct,
  productCategoriesQuery,
  productStatusesQuery,
  tagsQuery,
  unitOfMeasuresQuery,
  updateProduct,
} from '../data/api'
import { type Product } from '../data/schema'
import { ProductGallery } from './gallery'

/**
 * Client-side shape of the product form.
 *
 * Numeric inputs are coerced because DOM inputs always yield strings; the API
 * re-validates everything authoritatively, so this is about giving fast
 * feedback rather than being the source of truth.
 */
const formSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  sku: z.string().min(1, 'SKU is required.'),
  barcode: z.string().optional(),
  short_description: z.string().optional(),
  description: z.string().optional(),

  product_category: z.coerce.number({ error: 'Category is required.' }),
  product_status: z.coerce.number({ error: 'Status is required.' }),
  brand: z.coerce.number().optional(),
  unit_of_measure: z.coerce.number().optional(),

  price: z.coerce.number().min(0, 'Price must be positive.'),
  cost_price: z.coerce.number().min(0).optional(),
  discount_percentage: z.coerce.number().min(0).max(100).optional(),
  tax_rate: z.coerce.number().min(0).max(100).optional(),
  // Fixed, not chosen. The column still exists on the API, so it is kept in
  // the payload; the form simply never offers an alternative.
  currency: z.literal(DEFAULT_CURRENCY).default(DEFAULT_CURRENCY),

  stock_quantity: z.coerce.number().min(0).default(0),
  reorder_level: z.coerce.number().min(0).optional(),
  warranty_months: z.coerce.number().min(0).optional(),

  color: z.string().optional(),
  website_url: z.union([z.url(), z.literal('')]).optional(),
  contact_email: z.union([z.email(), z.literal('')]).optional(),
  released_at: z.string().optional(),

  is_active: z.boolean().default(true),
  is_featured: z.boolean().default(false),
  is_digital: z.boolean().default(false),
  requires_shipping: z.boolean().default(true),

  tags: z.array(z.number()).default([]),
})

type FormValues = z.input<typeof formSchema>

type ProductMutateDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** When present the dialog edits that product; otherwise it creates one. */
  currentRow?: Product | null
  /** Render the same form as a read-only view. */
  readOnly?: boolean
  /** Switches a read-only view into edit mode, when the user may edit. */
  onRequestEdit?: () => void
  /** The record's row actions, shown in the footer of the read-only view. */
  actions?: RowAction[]
}

const NONE = 'none'

export function ProductMutateDialog({
  open,
  onOpenChange,
  currentRow,
  readOnly = false,
  onRequestEdit,
  actions = [],
}: ProductMutateDialogProps) {
  const isEdit = Boolean(currentRow)
  const queryClient = useQueryClient()
  const [imageFile, setImageFile] = useState<File | null>(null)

  const { data: categories = [] } = useQuery(productCategoriesQuery())
  const { data: brands = [] } = useQuery(brandsQuery())
  const { data: statuses = [] } = useQuery(productStatusesQuery())
  const { data: units = [] } = useQuery(unitOfMeasuresQuery())
  const { data: tags = [] } = useQuery(tagsQuery())

  // The parent remounts this dialog per row (via `key`), so initial values are
  // computed once here rather than synced in an effect.
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: currentRow
      ? {
          name: currentRow.name,
          sku: currentRow.sku,
          barcode: currentRow.barcode ?? '',
          short_description: currentRow.short_description ?? '',
          description: currentRow.description ?? '',
          product_category: currentRow.product_category ?? undefined,
          product_status: currentRow.product_status ?? undefined,
          brand: currentRow.brand ?? undefined,
          unit_of_measure: currentRow.unit_of_measure ?? undefined,
          price: currentRow.price,
          cost_price: currentRow.cost_price ?? undefined,
          discount_percentage: currentRow.discount_percentage ?? undefined,
          tax_rate: currentRow.tax_rate ?? undefined,
          currency: DEFAULT_CURRENCY,
          stock_quantity: currentRow.stock_quantity,
          reorder_level: currentRow.reorder_level ?? undefined,
          warranty_months: currentRow.warranty_months ?? undefined,
          color: currentRow.color ?? '',
          website_url: currentRow.website_url ?? '',
          contact_email: currentRow.contact_email ?? '',
          released_at: currentRow.released_at?.slice(0, 10) ?? '',
          is_active: currentRow.is_active,
          is_featured: currentRow.is_featured,
          is_digital: currentRow.is_digital,
          requires_shipping: currentRow.requires_shipping,
          tags: currentRow.tags ?? [],
        }
      : {
          currency: DEFAULT_CURRENCY,
          stock_quantity: 0,
          is_active: true,
          is_featured: false,
          is_digital: false,
          requires_shipping: true,
          tags: [],
        },
  })

  const selectedTags = form.watch('tags') ?? []

  function toggleTag(id: number, checked: boolean) {
    const next = checked
      ? [...selectedTags, id]
      : selectedTags.filter((tagId) => tagId !== id)

    form.setValue('tags', next, { shouldDirty: true })
  }

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const payload = { ...values, image: imageFile }

      return currentRow
        ? updateProduct(currentRow.id, payload)
        : createProduct(payload)
    },
    onSuccess: (product) => {
      toast.success(
        isEdit ? `Updated "${product.name}"` : `Created "${product.name}"`
      )
      queryClient.invalidateQueries({ queryKey: ['products'] })
      onOpenChange(false)
    },
    onError: (error) => {
      // Mirror the API's field errors back onto the form so the user sees
      // exactly which input the server rejected.
      if (error instanceof AxiosError && error.response?.status === 422) {
        const errors = error.response.data?.errors ?? {}

        for (const [field, messages] of Object.entries(errors)) {
          form.setError(field as keyof FormValues, {
            message: Array.isArray(messages) ? messages[0] : String(messages),
          })
        }

        toast.error('Please fix the highlighted fields.')
        return
      }

      if (error instanceof AxiosError && error.response?.status === 403) {
        toast.error('You do not have permission to do that.')
        return
      }

      toast.error('Something went wrong. Please try again.')
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='flex max-h-[90dvh] flex-col overflow-hidden sm:max-w-3xl'>
        <DialogHeader className='text-start'>
          <DialogTitle>
            {readOnly
              ? currentRow?.name
              : isEdit
                ? 'Edit product'
                : 'Add product'}
          </DialogTitle>
          <DialogDescription>
            {readOnly
              ? 'Viewing the product. Choose Edit to make changes.'
              : isEdit
                ? 'Update the product details below.'
                : 'Fill in the details to create a new product.'}
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
          <Form {...form}>
            <form
              id='product-form'
              onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
              className='px-1'
            >
              {/*
                A native fieldset disables every descendant control - including
                the Radix Select and Checkbox triggers, which are buttons, and
                the bare file inputs that sit outside react-hook-form. Threading
                a `disabled` prop through each field would have missed exactly
                those. `contents` keeps the grid layout intact.
              */}
              <fieldset
                disabled={readOnly}
                className='grid gap-4 sm:grid-cols-2'
              >
                <FormField
                  control={form.control}
                  name='name'
                  render={({ field }) => (
                    <FormItem className='sm:col-span-2'>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder='Wireless keyboard' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='sku'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SKU</FormLabel>
                      <FormControl>
                        <Input placeholder='SKU-1234-ABC' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='barcode'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Barcode</FormLabel>
                      <FormControl>
                        <Input placeholder='Optional' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='short_description'
                  render={({ field }) => (
                    <FormItem className='sm:col-span-2'>
                      <FormLabel>Short description</FormLabel>
                      <FormControl>
                        <Input placeholder='One-line summary' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='description'
                  render={({ field }) => (
                    <FormItem className='sm:col-span-2'>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea rows={4} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <LookupField
                  control={form.control}
                  name='product_category'
                  label='Category'
                  options={categories}
                />
                <LookupField
                  control={form.control}
                  name='product_status'
                  label='Status'
                  options={statuses}
                />
                <LookupField
                  control={form.control}
                  name='brand'
                  label='Brand'
                  options={brands}
                  optional
                />
                <LookupField
                  control={form.control}
                  name='unit_of_measure'
                  label='Unit of measure'
                  options={units}
                  optional
                />

                <NumberField
                  control={form.control}
                  name='price'
                  label={`Price (${DEFAULT_CURRENCY})`}
                />
                <NumberField
                  control={form.control}
                  name='cost_price'
                  label={`Cost price (${DEFAULT_CURRENCY})`}
                />
                <NumberField
                  control={form.control}
                  name='discount_percentage'
                  label='Discount %'
                />
                <NumberField
                  control={form.control}
                  name='tax_rate'
                  label='Tax rate %'
                />
                <NumberField
                  control={form.control}
                  name='stock_quantity'
                  label='Stock quantity'
                />
                <NumberField
                  control={form.control}
                  name='reorder_level'
                  label='Reorder level'
                />
                <NumberField
                  control={form.control}
                  name='warranty_months'
                  label='Warranty (months)'
                />

                <FormField
                  control={form.control}
                  name='released_at'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Release date</FormLabel>
                      <FormControl>
                        <Input type='date' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='color'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Colour</FormLabel>
                      <FormControl>
                        <div className='flex items-center gap-2'>
                          <Input
                            type='color'
                            className='h-9 w-14 p-1'
                            value={field.value || '#000000'}
                            onChange={field.onChange}
                          />
                          <Input
                            placeholder='#000000'
                            value={field.value ?? ''}
                            onChange={field.onChange}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='website_url'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <Input placeholder='https://example.com' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='contact_email'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact email</FormLabel>
                      <FormControl>
                        <Input placeholder='sales@example.com' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormItem className='sm:col-span-2'>
                  <FormLabel>Main image</FormLabel>
                  <FormControl>
                    <Input
                      type='file'
                      accept='image/jpeg,image/png,image/webp'
                      onChange={(e) =>
                        setImageFile(e.target.files?.[0] ?? null)
                      }
                    />
                  </FormControl>
                  <FormDescription>
                    JPEG, PNG or WebP, up to 2 MB.
                    {isEdit && currentRow?.image
                      ? ' Leave empty to keep the current image.'
                      : ''}
                  </FormDescription>
                </FormItem>

                <FormItem className='sm:col-span-2'>
                  <FormLabel>Tags</FormLabel>
                  <div className='flex flex-wrap gap-2 rounded-md border p-3'>
                    {tags.length === 0 && (
                      <span className='text-sm text-muted-foreground'>
                        No tags available.
                      </span>
                    )}
                    {tags.map((tag) => {
                      const checked = selectedTags.includes(tag.id)
                      return (
                        <label
                          key={tag.id}
                          className='flex cursor-pointer items-center gap-2'
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(value) =>
                              toggleTag(tag.id, Boolean(value))
                            }
                          />
                          <Badge variant={checked ? 'default' : 'outline'}>
                            {tag.name}
                          </Badge>
                        </label>
                      )
                    })}
                  </div>
                </FormItem>

                {/* Gallery images attach to an existing product id, so this is
                  only available once the product has been created. */}
                {currentRow && (
                  <div className='sm:col-span-2'>
                    <ProductGallery productId={currentRow.id} />
                  </div>
                )}

                <div className='grid gap-3 sm:col-span-2 sm:grid-cols-2'>
                  <ToggleField
                    control={form.control}
                    name='is_active'
                    label='Active'
                  />
                  <ToggleField
                    control={form.control}
                    name='is_featured'
                    label='Featured'
                  />
                  <ToggleField
                    control={form.control}
                    name='is_digital'
                    label='Digital product'
                  />
                  <ToggleField
                    control={form.control}
                    name='requires_shipping'
                    label='Requires shipping'
                  />
                </div>
              </fieldset>
            </form>
          </Form>
        </DialogBody>

        <DialogFooter>
          {readOnly ? (
            <ViewFooterActions
              actions={actions}
              primary={
                onRequestEdit && (
                  <Can permission={perm('products', 'change')}>
                    <Button onClick={onRequestEdit}>
                      <Pencil className='me-1 size-4' />
                      Edit
                    </Button>
                  </Can>
                )
              }
            />
          ) : (
            <>
              <Button
                variant='outline'
                onClick={() => onOpenChange(false)}
                disabled={mutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type='submit'
                form='product-form'
                disabled={mutation.isPending}
              >
                {mutation.isPending ? 'Saving...' : 'Save'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ---------------------------------------------------------------- */
/* Small field helpers, to keep the form above readable              */
/* ---------------------------------------------------------------- */

type FieldProps = {
  // `control` is intentionally loosely typed: these helpers are local and
  // threading the full generic form type through adds noise without value.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: any
  name: keyof FormValues
  label: string
}

function NumberField({ control, name, label }: FieldProps) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              type='number'
              step='any'
              {...field}
              value={field.value ?? ''}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

function ToggleField({ control, name, label }: FieldProps) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className='flex flex-row items-center gap-3 rounded-md border p-3'>
          <FormControl>
            <Checkbox
              checked={Boolean(field.value)}
              onCheckedChange={field.onChange}
            />
          </FormControl>
          <FormLabel className='!mt-0'>{label}</FormLabel>
        </FormItem>
      )}
    />
  )
}

function LookupField({
  control,
  name,
  label,
  options,
  optional = false,
}: FieldProps & {
  options: Array<{ id: number; name: string }>
  optional?: boolean
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <Select
            value={field.value ? String(field.value) : optional ? NONE : ''}
            onValueChange={(value) =>
              field.onChange(value === NONE ? undefined : Number(value))
            }
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {optional && <SelectItem value={NONE}>None</SelectItem>}
              {options.map((option) => (
                <SelectItem key={option.id} value={String(option.id)}>
                  {option.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
