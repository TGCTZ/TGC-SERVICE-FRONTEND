import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { Check } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { logout } from '@/features/auth/data/api'
import { gendersQuery } from '@/features/users/data/api'
import { AuthLayout } from '../layout'
import { PasswordStep } from './password-step'
import { ProfileStep } from './profile-step'

const STEPS = ['Set your password', 'Complete your profile'] as const

/**
 * A new account's first sign-in: its own password, then its profile, then the
 * system. The step shown follows the user's flags, so reloading the page or
 * signing in again picks up exactly where they left off.
 */
export function FirstLogin() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.auth.user)
  // Fetched now so the profile step's list is ready when the reader gets there.
  useQuery(gendersQuery())

  const step = user?.must_change_password ? 0 : 1

  return (
    <AuthLayout>
      <Card className='w-full max-w-md gap-5'>
        <CardHeader>
          <CardTitle className='text-lg tracking-tight'>
            Welcome — let’s set up your account
          </CardTitle>
          <CardDescription>
            Two quick steps before you start. You are signed in as{' '}
            <span className='font-medium text-foreground'>{user?.email}</span>.
          </CardDescription>
          <ol className='flex gap-4 pt-2 text-xs' aria-label='Setup steps'>
            {STEPS.map((label, index) => (
              <li
                key={label}
                aria-current={index === step ? 'step' : undefined}
                className={cn(
                  'flex items-center gap-1.5',
                  index === step
                    ? 'font-medium text-foreground'
                    : 'text-muted-foreground'
                )}
              >
                <span
                  className={cn(
                    'flex size-5 items-center justify-center rounded-full border text-[11px]',
                    index < step &&
                      'border-primary bg-primary text-primary-foreground',
                    index === step && 'border-primary text-primary'
                  )}
                >
                  {index < step ? (
                    <Check className='size-3' aria-hidden />
                  ) : (
                    index + 1
                  )}
                </span>
                {label}
              </li>
            ))}
          </ol>
        </CardHeader>
        <CardContent className='space-y-4'>
          {step === 0 ? (
            <PasswordStep />
          ) : (
            <ProfileStep onDone={() => navigate({ to: '/', replace: true })} />
          )}
          <Button
            type='button'
            variant='link'
            className='h-auto p-0 text-xs text-muted-foreground'
            onClick={async () => {
              await logout()
              navigate({ to: '/sign-in', replace: true })
            }}
          >
            Not you? Sign out
          </Button>
        </CardContent>
      </Card>
    </AuthLayout>
  )
}
