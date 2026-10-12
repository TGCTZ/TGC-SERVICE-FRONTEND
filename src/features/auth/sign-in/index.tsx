import { useSearch } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { brandPanelClassName } from '@/components/layout/brand-panel'
import { AuthLayout } from '../layout'
import { UserAuthForm } from './components/form'

export function SignIn() {
  const { redirect } = useSearch({ from: '/(auth)/sign-in' })

  return (
    <AuthLayout>
      <Card className={`${brandPanelClassName} max-w-sm gap-4`}>
        <CardHeader>
          <CardTitle className='text-lg tracking-tight'>Sign in</CardTitle>
        </CardHeader>
        <CardContent>
          <UserAuthForm redirectTo={redirect} />
        </CardContent>
      </Card>
    </AuthLayout>
  )
}
