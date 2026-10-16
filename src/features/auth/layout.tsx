import { Logo } from '@/assets/logo'

type AuthLayoutProps = {
  children: React.ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className='brand-gradient-clean container grid h-svh max-w-none items-center justify-center text-white'>
      <div className='mx-auto flex w-full flex-col justify-center space-y-2 py-8 sm:p-8'>
        <div className='mb-4 flex flex-col items-center gap-3 text-center'>
          <Logo className='mx-auto size-32 sm:size-40' />
          <div className='brand-gradient-lines mx-auto w-fit max-w-full rounded-xl border border-white/15 px-8 py-5 shadow-lg'>
            <div className='space-y-1'>
              <p className='text-xl font-semibold tracking-tight text-white sm:text-2xl'>
                Gem Identification System
              </p>
              <p className='text-3xl font-black tracking-[0.18em] text-white sm:text-4xl'>
                TGPMIS
              </p>
              <span
                aria-hidden='true'
                className='mx-auto mt-2 block h-1 w-14 rounded-full bg-white/80'
              />
            </div>
          </div>
        </div>
        {children}
      </div>
    </div>
  )
}
