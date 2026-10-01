import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth-store'
import { fieldErrors } from '@/lib/handle-server-error'
import { zodResolver } from '@/lib/zod-resolver'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
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
import { completeFirstProfile } from '@/features/auth/data/api'
import { gendersQuery } from '@/features/users/data/api'

const schema = z.object({
  first_name: z.string().trim().min(1, 'First name is required.'),
  middle_name: z.string().trim().optional(),
  last_name: z.string().trim().min(1, 'Last name is required.'),
  phone_number: z.string().trim().min(1, 'Phone number is required.'),
  gender: z.string().min(1, 'Select your gender.'),
})

type Values = z.infer<typeof schema>

/**
 * Step two: what the system needs to know about the user - name, phone and
 * gender. Country is Tanzania for everyone, so it is stated, not asked.
 */
export function ProfileStep({ onDone }: { onDone: () => void }) {
  const user = useAuthStore((state) => state.auth.user)
  const { data: genders = [], isPending: loadingGenders } =
    useQuery(gendersQuery())

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      first_name: user?.first_name ?? '',
      middle_name: '',
      last_name: user?.last_name ?? '',
      phone_number: '',
      gender: '',
    },
  })

  const mutation = useMutation({
    mutationFn: (values: Values) =>
      completeFirstProfile({ ...values, gender: Number(values.gender) }),
    onSuccess: (saved) => {
      toast.success(`Welcome, ${saved.first_name}. Your account is ready.`)
      onDone()
    },
    onError: (error) => {
      const fields = fieldErrors(error)
      if (!fields) return
      for (const [field, messages] of Object.entries(fields)) {
        if (field in schema.shape) {
          form.setError(field as keyof Values, { message: messages[0] })
        } else {
          toast.error(messages[0])
        }
      }
    },
  })

  return (
    <Form {...form}>
      <form
        className='grid gap-4 sm:grid-cols-2'
        onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
      >
        <TextField form={form} name='first_name' label='First name' autoFocus />
        <TextField form={form} name='last_name' label='Last name' />
        <TextField
          form={form}
          name='middle_name'
          label='Middle name (optional)'
        />
        <TextField
          form={form}
          name='phone_number'
          label='Phone number'
          type='tel'
          placeholder='e.g. 0712 345 678'
        />
        <FormField
          control={form.control}
          name='gender'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Gender</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className='w-full' disabled={loadingGenders}>
                    <SelectValue placeholder='Select…' />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {genders.map((gender) => (
                    <SelectItem key={gender.id} value={String(gender.id)}>
                      {gender.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormItem>
          <FormLabel>Country</FormLabel>
          <Input value='Tanzania' disabled readOnly />
        </FormItem>
        <Button
          type='submit'
          className='w-full sm:col-span-2'
          disabled={mutation.isPending}
        >
          {mutation.isPending ? 'Saving…' : 'Save and start'}
        </Button>
      </form>
    </Form>
  )
}

function TextField({
  form,
  name,
  label,
  ...inputProps
}: {
  form: ReturnType<typeof useForm<Values>>
  name: keyof Values
  label: string
} & Omit<React.ComponentProps<typeof Input>, 'form' | 'name'>) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input {...inputProps} {...field} value={field.value ?? ''} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
