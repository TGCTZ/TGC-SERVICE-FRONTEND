import { Separator } from '@/components/ui/separator'
import { ContentSection } from '../components/content-section'
import { AccountForm } from './account-form'
import { PasswordForm } from './password-form'

export function SettingsAccount() {
  return (
    <ContentSection
      title='Account'
      desc='Update your account settings, and change the password you sign in with.'
    >
      <div className='space-y-10'>
        <AccountForm />

        <div>
          <Separator className='mb-6' />
          <div className='mb-6'>
            <h4 className='text-base font-medium'>Password</h4>
            <p className='text-sm text-muted-foreground'>
              Changing your password signs out every other device.
            </p>
          </div>
          <PasswordForm />
        </div>
      </div>
    </ContentSection>
  )
}
