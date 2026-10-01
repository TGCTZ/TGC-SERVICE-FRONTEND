import { z } from 'zod'
import { AxiosError } from 'axios'
import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
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
import { changePassword } from '@/features/auth/data/api'

/**
 * Mirrors the API's rules (`Password::min(8)`, `confirmed`, `different`) so the
 * obvious mistakes are caught before a round trip. The API remains the
 * authority — it re-validates everything and owns the current-password check.
 */
const passwordFormSchema = z
  .object({
    current_password: z.string().min(1, 'Enter your current password.'),
    password: z.string().min(8, 'New password must be at least 8 characters.'),
    password_confirmation: z.string().min(1, 'Confirm your new password.'),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: 'Passwords do not match.',
    path: ['password_confirmation'],
  })
  .refine((data) => data.password !== data.current_password, {
    message: 'The new password must differ from the current one.',
    path: ['password'],
  })

type PasswordFormValues = z.infer<typeof passwordFormSchema>

export function PasswordForm() {
  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      current_password: '',
      password: '',
      password_confirmation: '',
    },
  })

  const mutation = useMutation({
    mutationFn: (values: PasswordFormValues) => changePassword(values),
    onSuccess: () => {
      toast.success('Password changed. Other sessions have been signed out.')
      // Never leave a password sitting in component state once it is spent.
      form.reset()
    },
    onError: (error) => {
      const fields = fieldErrors(error)
      if (fields) {
        for (const [field, messages] of Object.entries(fields)) {
          form.setError(field as keyof PasswordFormValues, {
            message: messages[0],
          })
        }

        return
      }

      if (error instanceof AxiosError && error.response?.status === 429) {
        toast.error('Too many attempts. Please wait a minute and try again.')
        return
      }

      toast.error('Could not change your password. Please try again.')
    },
  })

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
        className='space-y-6'
      >
        <FormField
          control={form.control}
          name='current_password'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Current password</FormLabel>
              <FormControl>
                <PasswordInput autoComplete='current-password' {...field} />
              </FormControl>
              <FormDescription>
                Required even though you are signed in — a borrowed session
                should not be enough to lock you out of your own account.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='password'
          render={({ field }) => (
            <FormItem>
              <FormLabel>New password</FormLabel>
              <FormControl>
                <PasswordInput autoComplete='new-password' {...field} />
              </FormControl>
              <FormDescription>At least 8 characters.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='password_confirmation'
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

        <Button type='submit' disabled={mutation.isPending}>
          {mutation.isPending ? 'Changing...' : 'Change password'}
        </Button>
      </form>
    </Form>
  )
}
