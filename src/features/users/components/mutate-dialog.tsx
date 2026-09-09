import { useEffect, useState } from 'react'
import { z } from 'zod'
import { AxiosError } from 'axios'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { fieldErrors } from '@/lib/handle-server-error'
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
import { PasswordInput } from '@/components/password-input'
import { ViewFooterActions } from '@/components/view-footer-actions'
import { rolesQuery } from '@/features/roles/data/api'
import {
  createUser,
  gendersQuery,
  updateUser,
  userStatusesQuery,
} from '../data/api'
import { type User } from '../data/schema'

const NONE = 'none'

/**
 * On create a password is required; on edit an empty password means
 * "leave it unchanged", which mirrors how the API treats the field.
 */
function buildSchema(isEdit: boolean) {
  return z
    .object({
      first_name: z.string().min(1, 'First name is required.'),
      middle_name: z.string().optional(),
      last_name: z.string().min(1, 'Last name is required.'),
      username: z.string().min(1, 'Username is required.'),
      email: z.email('Enter a valid email.'),
      phone_number: z.string().optional(),

      password: isEdit
        ? z.string().optional()
        : z.string().min(8, 'At least 8 characters.'),
      password_confirmation: z.string().optional(),

      user_status: z.coerce.number().optional(),
      gender: z.coerce.number().optional(),

      bio: z.string().optional(),
      city: z.string().optional(),
      country: z.string().optional(),
      date_of_birth: z.string().optional(),

      is_active: z.boolean().default(true),
      roles: z.array(z.string()).default([]),
    })
    .refine(
      (data) => !data.password || data.password === data.password_confirmation,
      { message: 'Passwords do not match.', path: ['password_confirmation'] }
    )
}

type FormValues = z.input<ReturnType<typeof buildSchema>>

type UserMutateDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow?: User | null
  /** Render the same form as a read-only view. */
  readOnly?: boolean
  /** Switches a read-only view into edit mode, when the user may edit. */
  onRequestEdit?: () => void
  /** The record's row actions, shown in the footer of the read-only view. */
  actions?: RowAction[]
}

export function UserMutateDialog({
  open,
  onOpenChange,
  currentRow,
  readOnly = false,
  onRequestEdit,
  actions = [],
}: UserMutateDialogProps) {
  const isEdit = Boolean(currentRow)
  const queryClient = useQueryClient()
  const [avatarFile, setAvatarFile] = useState<File | null>(null)

  const { data: statuses = [] } = useQuery(userStatusesQuery())
  const { data: genders = [] } = useQuery(gendersQuery())
  const { data: rolesPage } = useQuery(rolesQuery({ perPage: 100 }))
  const roles = rolesPage?.items ?? []

  const form = useForm<FormValues>({
    resolver: zodResolver(buildSchema(isEdit)),
    defaultValues: { is_active: true, roles: [] },
  })

  useEffect(() => {
    if (!open) return
    setAvatarFile(null)

    if (currentRow) {
      form.reset({
        first_name: currentRow.first_name,
        middle_name: currentRow.middle_name ?? '',
        last_name: currentRow.last_name,
        username: currentRow.username,
        email: currentRow.email,
        phone_number: currentRow.phone_number ?? '',
        password: '',
        password_confirmation: '',
        user_status: currentRow.user_status ?? undefined,
        gender: currentRow.gender ?? undefined,
        bio: currentRow.bio ?? '',
        city: currentRow.city ?? '',
        country: currentRow.country ?? '',
        date_of_birth: currentRow.date_of_birth?.slice(0, 10) ?? '',
        is_active: currentRow.is_active,
        roles: currentRow.roles,
      })
      return
    }

    form.reset({ is_active: true, roles: [] })
  }, [open, currentRow, form])

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const payload = { ...values, avatar: avatarFile }

      // Never send an empty password on edit - the API would reject it.
      if (isEdit && !values.password) {
        delete (payload as Record<string, unknown>).password
        delete (payload as Record<string, unknown>).password_confirmation
      }

      return currentRow
        ? updateUser(currentRow.id, payload)
        : createUser(payload)
    },
    onSuccess: (user) => {
      toast.success(
        isEdit ? `Updated ${user.full_name}` : `Created ${user.full_name}`
      )
      queryClient.invalidateQueries({ queryKey: ['users'] })
      onOpenChange(false)
    },
    onError: (error) => {
      const fields = fieldErrors(error)
      if (fields) {
        for (const [field, messages] of Object.entries(fields)) {
          form.setError(field as keyof FormValues, { message: messages[0] })
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

  const selectedRoles = form.watch('roles') ?? []

  function toggleRole(name: string, checked: boolean) {
    const next = checked
      ? [...selectedRoles, name]
      : selectedRoles.filter((role) => role !== name)

    form.setValue('roles', next, { shouldDirty: true })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='flex max-h-[90dvh] flex-col overflow-hidden sm:max-w-2xl'>
        <DialogHeader className='text-start'>
          <DialogTitle>
            {readOnly
              ? currentRow?.full_name || currentRow?.email
              : isEdit
                ? 'Edit user'
                : 'Add user'}
          </DialogTitle>
          <DialogDescription>
            {readOnly
              ? 'Viewing the account. Choose Edit to make changes.'
              : isEdit
                ? 'Update the account details below.'
                : 'Create a new account and assign its access.'}
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
          <Form {...form}>
            <form
              id='user-form'
              onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
              className='px-1'
            >
              {/*
                A native fieldset disables every descendant control, including
                the Radix Select/Checkbox triggers and the avatar file input
                that sits outside react-hook-form - the parts a per-field
                `disabled` prop would miss. `contents` keeps the grid intact.
              */}
              <fieldset
                disabled={readOnly}
                className='grid gap-4 sm:grid-cols-2'
              >
                <TextField
                  control={form.control}
                  name='first_name'
                  label='First name'
                />
                <TextField
                  control={form.control}
                  name='last_name'
                  label='Last name'
                />
                <TextField
                  control={form.control}
                  name='middle_name'
                  label='Middle name'
                />
                <TextField
                  control={form.control}
                  name='username'
                  label='Username'
                />
                <TextField control={form.control} name='email' label='Email' />
                <TextField
                  control={form.control}
                  name='phone_number'
                  label='Phone'
                />

                <FormField
                  control={form.control}
                  name='password'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <PasswordInput {...field} value={field.value ?? ''} />
                      </FormControl>
                      {isEdit && (
                        <FormDescription>
                          Leave blank to keep the current password.
                        </FormDescription>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='password_confirmation'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm password</FormLabel>
                      <FormControl>
                        <PasswordInput {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <LookupField
                  control={form.control}
                  name='user_status'
                  label='Status'
                  options={statuses}
                />
                <LookupField
                  control={form.control}
                  name='gender'
                  label='Gender'
                  options={genders}
                />

                <TextField
                  control={form.control}
                  name='date_of_birth'
                  label='Date of birth'
                  type='date'
                />
                <TextField control={form.control} name='city' label='City' />
                <TextField
                  control={form.control}
                  name='country'
                  label='Country'
                />

                <FormField
                  control={form.control}
                  name='bio'
                  render={({ field }) => (
                    <FormItem className='sm:col-span-2'>
                      <FormLabel>Bio</FormLabel>
                      <FormControl>
                        <Textarea
                          rows={3}
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormItem className='sm:col-span-2'>
                  <FormLabel>Avatar</FormLabel>
                  <FormControl>
                    <Input
                      type='file'
                      accept='image/jpeg,image/png,image/webp'
                      onChange={(e) =>
                        setAvatarFile(e.target.files?.[0] ?? null)
                      }
                    />
                  </FormControl>
                  <FormDescription>
                    JPEG, PNG or WebP, up to 2 MB.
                  </FormDescription>
                </FormItem>

                <FormField
                  control={form.control}
                  name='is_active'
                  render={({ field }) => (
                    <FormItem className='flex flex-row items-center gap-3 rounded-md border p-3 sm:col-span-2'>
                      <FormControl>
                        <Checkbox
                          checked={Boolean(field.value)}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className='!mt-0'>Account is active</FormLabel>
                    </FormItem>
                  )}
                />

                {/* Assigning roles is itself a privileged action, so the whole
                  block is hidden from users who cannot manage roles. */}
                <Can permission={perm('roles', 'change')}>
                  <FormItem className='sm:col-span-2'>
                    <FormLabel>Roles</FormLabel>
                    <div className='flex flex-wrap gap-2 rounded-md border p-3'>
                      {roles.length === 0 && (
                        <span className='text-sm text-muted-foreground'>
                          No roles available.
                        </span>
                      )}
                      {roles.map((role) => {
                        const checked = selectedRoles.includes(role.name)
                        return (
                          <label
                            key={role.id}
                            className='flex cursor-pointer items-center gap-2'
                          >
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(value) =>
                                toggleRole(role.name, Boolean(value))
                              }
                            />
                            <Badge
                              variant={checked ? 'default' : 'outline'}
                              className='capitalize'
                            >
                              {role.name}
                            </Badge>
                          </label>
                        )
                      })}
                    </div>
                  </FormItem>
                </Can>
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
                  <Can permission={perm('users', 'change')}>
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
                form='user-form'
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

type FieldProps = {
  // Loosely typed on purpose: these helpers are local to this file.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: any
  name: string
  label: string
}

function TextField({
  control,
  name,
  label,
  type = 'text',
}: FieldProps & { type?: string }) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input type={type} {...field} value={field.value ?? ''} />
          </FormControl>
          <FormMessage />
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
}: FieldProps & { options: Array<{ id: number; name: string }> }) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <Select
            value={field.value ? String(field.value) : NONE}
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
              <SelectItem value={NONE}>None</SelectItem>
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
