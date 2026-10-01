import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { fieldErrors } from '@/lib/handle-server-error'
import { zodResolver } from '@/lib/zod-resolver'
import { Button } from '@/components/ui/button'
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
import { rolesQuery } from '@/features/roles/data/api'
import { createUser, type UserWithTemporaryPassword } from '../data/api'
import { CredentialsPanel } from './credentials-panel'

const schema = z.object({
  email: z.email('Enter a valid email address.'),
  role: z.string().min(1, 'Choose a role.'),
})

type Values = z.infer<typeof schema>

/**
 * Create an account from just an email and a role.
 *
 * Everything else is the system's to set - country, status, a temporary
 * password - or the new user's to fill in at first login. After saving, the
 * dialog turns into the credentials, shown once.
 */
export function UserCreateDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const queryClient = useQueryClient()
  const [created, setCreated] = useState<UserWithTemporaryPassword | null>(null)
  // Only roles the requester may hand out; the API refuses the rest anyway.
  const { data: rolesPage } = useQuery(rolesQuery({ perPage: 100 }))
  const roles = (rolesPage?.items ?? []).filter((role) => role.can_assign)

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', role: '' },
  })

  const mutation = useMutation({
    mutationFn: createUser,
    onSuccess: (user) => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setCreated(user)
    },
    onError: (error) => {
      const fields = fieldErrors(error)
      if (!fields) {
        toast.error('The account was not created. Please try again.')
        return
      }
      for (const [field, messages] of Object.entries(fields)) {
        if (field === 'email' || field === 'role') {
          form.setError(field, { message: messages[0] })
        } else {
          toast.error(messages[0])
        }
      }
    },
  })

  function close(next: boolean) {
    onOpenChange(next)
    if (!next) {
      // The password must not linger in memory once the dialog is gone.
      setCreated(null)
      form.reset()
    }
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader className='text-start'>
          <DialogTitle>{created ? 'Account created' : 'Add user'}</DialogTitle>
          <DialogDescription>
            {created
              ? 'Here are the sign-in details.'
              : 'The user sets their own password and fills in their profile when they first sign in. Country is Tanzania and the account starts Active.'}
          </DialogDescription>
        </DialogHeader>

        {created ? (
          <CredentialsPanel user={created} />
        ) : (
          <Form {...form}>
            <form
              id='user-create-form'
              className='space-y-4'
              onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
            >
              <FormField
                control={form.control}
                name='email'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type='email'
                        autoComplete='off'
                        autoFocus
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      They sign in with it, and the credentials are sent to it.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='role'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className='w-full capitalize'>
                          <SelectValue placeholder='Choose a role' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem
                            key={role.id}
                            value={role.name}
                            className='capitalize'
                          >
                            {role.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        )}

        <DialogFooter>
          {created ? (
            <Button onClick={() => close(false)}>Done</Button>
          ) : (
            <>
              <Button
                variant='outline'
                onClick={() => close(false)}
                disabled={mutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type='submit'
                form='user-create-form'
                disabled={mutation.isPending}
              >
                {mutation.isPending ? 'Creating…' : 'Create and send details'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
