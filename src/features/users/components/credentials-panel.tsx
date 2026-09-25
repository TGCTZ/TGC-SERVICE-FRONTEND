import { useState } from 'react'
import { Check, Copy, Mail, TriangleAlert } from 'lucide-react'
import { toast } from 'sonner'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { type UserWithTemporaryPassword } from '../data/api'

/**
 * The sign-in details for an account that was just created or reset.
 *
 * Shown once: the API never returns the temporary password again, so this is
 * the moment to pass it on if the email does not arrive.
 */
export function CredentialsPanel({
  user,
}: {
  user: UserWithTemporaryPassword
}) {
  const rows = [
    { label: 'Email', value: user.email },
    { label: 'Username', value: user.username },
    {
      label: 'Temporary password',
      value: user.temporary_password,
      secret: true,
    },
  ]

  return (
    <div className='space-y-4'>
      <Alert>
        <Mail aria-hidden />
        <AlertDescription>
          An email with these details is on its way to{' '}
          <span className='font-medium text-foreground'>{user.email}</span>. If
          it does not arrive, share them with the user yourself.
        </AlertDescription>
      </Alert>

      <dl className='divide-y rounded-md border'>
        {rows.map((row) => (
          <div key={row.label} className='flex items-center gap-3 px-3 py-2'>
            <dt className='w-36 shrink-0 text-sm text-muted-foreground'>
              {row.label}
            </dt>
            <dd
              className={
                row.secret
                  ? 'flex-1 font-mono text-base tracking-wider'
                  : 'flex-1 truncate text-sm font-medium'
              }
            >
              {row.value}
            </dd>
            <CopyButton label={row.label} value={row.value} />
          </div>
        ))}
      </dl>

      <p className='flex items-start gap-2 text-xs text-muted-foreground'>
        <TriangleAlert className='mt-0.5 size-3.5 shrink-0' aria-hidden />
        This password is shown only now. The user must replace it and complete
        their profile when they first sign in.
      </p>
    </div>
  )
}

function CopyButton({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error('Could not copy - select the text and copy it instead.')
    }
  }

  return (
    <Button
      type='button'
      variant='ghost'
      size='icon'
      className='size-7 shrink-0'
      onClick={copy}
      aria-label={`Copy ${label.toLowerCase()}`}
    >
      {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
    </Button>
  )
}
