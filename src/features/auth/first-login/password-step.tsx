import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import { fieldErrors } from '@/lib/handle-server-error'
import { zodResolver } from '@/lib/zod-resolver'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { PasswordInput } from '@/components/password-input'
import { setFirstPassword } from '@/features/auth/data/api'

const schema = z
  .object({
    password: z.string().min(1, 'Choose a password.'),
    password_confirm: z.string().min(1, 'Type the password again.'),
  })
  .refine((values) => values.password === values.password_confirm, {
    message: 'The two passwords do not match.',
    path: ['password_confirm'],
  })

type Values = z.infer<typeof schema>

/**
 * Step one: a password of the user's own in place of the emailed one. The
 * server's password rules (length, not too common, not like your email) come
 * back as field errors, so they are not duplicated here.
 */
export function PasswordStep() {
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { password: '', password_confirm: '' },
  })

  const mutation = useMutation({
    mutationFn: setFirstPassword,
    onError: (error) => {
      const fields = fieldErrors(error)
      if (!fields) return
      for (const [field, messages] of Object.entries(fields)) {
        const name = field === 'detail' ? 'password' : field
        form.setError(name as keyof Values, { message: messages[0] })
      }
    },
    // On success the store's user loses its flag and the next step renders.
  })

  return (
    <Form {...form}>
      <form
        className='space-y-4'
        onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
      >
        <FormField
          control={form.control}
          name='password'
          render={({ field }) => (
            <FormItem>
              <FormLabel>New password</FormLabel>
              <FormControl>
                <PasswordInput
                  autoComplete='new-password'
                  autoFocus
                  {...field}
                />
              </FormControl>
              <FormDescription>
                At least 8 characters, not the temporary password from your
                email.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='password_confirm'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm new password</FormLabel>
              <FormControl>
                <PasswordInput autoComplete='new-password' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type='submit' className='w-full' disabled={mutation.isPending}>
          {mutation.isPending ? 'Saving…' : 'Set password and continue'}
        </Button>
      </form>
    </Form>
  )
}
